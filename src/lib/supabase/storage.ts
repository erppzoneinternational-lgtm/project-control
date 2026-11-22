import { SUPABASE_URL } from './config';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type StorageBucket =
  | 'progress-photos'
  | 'progress-documents'
  | 'project-schedules'
  | 'deliverables';

interface SignedUrlCacheEntry {
  url: string;
  expiresAt: number;
}

const signedUrlCache = new Map<string, SignedUrlCacheEntry>();

function getCacheTtlMs(expiresInSeconds: number): number {
  return Math.max(60, expiresInSeconds - 300) * 1000;
}

function getCachedSignedUrl(bucket: StorageBucket, path: string): string | null {
  const entry = signedUrlCache.get(`${bucket}:${path}`);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    signedUrlCache.delete(`${bucket}:${path}`);
    return null;
  }
  return entry.url;
}

function setCachedSignedUrl(
  bucket: StorageBucket,
  path: string,
  url: string,
  expiresInSeconds: number
): void {
  if (!url) return;
  signedUrlCache.set(`${bucket}:${path}`, {
    url,
    expiresAt: Date.now() + getCacheTtlMs(expiresInSeconds),
  });
}

export function isSignedStorageUrl(url: string): boolean {
  return url.includes('/storage/v1/object/sign/');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts a clean bucket-relative storage path from a canonical/signed Supabase
 * Storage URL or a raw relative path. Returns null for blob:, data:, or external URLs.
 */
export function extractStoragePath(
  urlOrPath: string | null | undefined,
  bucket: StorageBucket
): string | null {
  if (!urlOrPath) return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const escapedBucket = escapeRegex(bucket);
    const typedMatch = trimmed.match(
      new RegExp(`/storage/v1/object/(?:public|sign|authenticated)/${escapedBucket}/([^?#]+)`)
    );
    const bareMatch =
      typedMatch ||
      trimmed.match(new RegExp(`/storage/v1/object/${escapedBucket}/([^?#]+)`));

    if (!bareMatch?.[1]) {
      return null;
    }

    try {
      return decodeURIComponent(bareMatch[1]).replace(/^\/+/, '') || null;
    } catch {
      return bareMatch[1].replace(/^\/+/, '') || null;
    }
  }

  let cleaned = trimmed.replace(/^\/+/, '');
  const bucketPrefix = `${bucket}/`;
  if (cleaned.startsWith(bucketPrefix)) {
    cleaned = cleaned.slice(bucketPrefix.length);
  }
  cleaned = cleaned.replace(/^\/+/, '');
  return cleaned || null;
}

/**
 * Constructs the canonical Supabase object path URL stored in DB columns that
 * hold full URLs (without calling public URL helpers and without appending signed tokens).
 */
export function buildCanonicalStorageUrl(
  bucket: StorageBucket,
  storagePath: string
): string {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const cleanPath = storagePath.replace(/^\/+/, '');
  return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

/**
 * Converts a display URL back to a canonical non-expiring URL/path before persisting to DB.
 */
export function toCanonicalStorageValue(
  bucket: StorageBucket,
  urlOrPath: string | null | undefined
): string | null {
  if (!urlOrPath) return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  if (isSignedStorageUrl(trimmed)) {
    const path = extractStoragePath(trimmed, bucket);
    if (path) {
      return buildCanonicalStorageUrl(bucket, path);
    }
  }
  return trimmed;
}

export async function getSignedStorageUrl(
  bucket: StorageBucket,
  urlOrPath: string | null | undefined,
  expiresIn = 3600
): Promise<string> {
  if (!urlOrPath) return '';
  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    isSignedStorageUrl(trimmed)
  ) {
    return trimmed;
  }

  const path = extractStoragePath(trimmed, bucket);
  if (!path) {
    // Non-Supabase external URL — leave untouched
    return trimmed;
  }

  const cached = getCachedSignedUrl(bucket, path);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      logger.warn('[storage] createSignedUrl failed', {
        bucket,
        path,
        error: error?.message,
      });
      return '';
    }

    setCachedSignedUrl(bucket, path, data.signedUrl, expiresIn);
    return data.signedUrl;
  } catch (err) {
    logger.warn('[storage] createSignedUrl exception', {
      bucket,
      path,
      detail: err,
    });
    return '';
  }
}

export async function getSignedStorageUrls(
  bucket: StorageBucket,
  inputs: Array<string | null | undefined>,
  expiresIn = 3600
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uniqueInputs = Array.from(
    new Set(
      inputs
        .map((val) => (typeof val === 'string' ? val.trim() : ''))
        .filter((val) => Boolean(val))
    )
  );

  if (uniqueInputs.length === 0) return result;

  const pathToInputs = new Map<string, string[]>();

  for (const input of uniqueInputs) {
    if (
      input.startsWith('blob:') ||
      input.startsWith('data:') ||
      isSignedStorageUrl(input)
    ) {
      result.set(input, input);
      continue;
    }

    const path = extractStoragePath(input, bucket);
    if (!path) {
      result.set(input, input);
      continue;
    }

    const cached = getCachedSignedUrl(bucket, path);
    if (cached) {
      result.set(input, cached);
      continue;
    }

    const existingList = pathToInputs.get(path);
    if (existingList) {
      existingList.push(input);
    } else {
      pathToInputs.set(path, [input]);
    }
  }

  const uncachedPaths = Array.from(pathToInputs.keys());
  if (uncachedPaths.length === 0) return result;

  const missingPaths = new Set<string>(uncachedPaths);

  try {
    const storageBucket = supabase.storage.from(bucket);
    if (typeof storageBucket.createSignedUrls === 'function') {
      const { data, error } = await storageBucket.createSignedUrls(uncachedPaths, expiresIn);
      if (!error && Array.isArray(data)) {
        for (const item of data) {
          if (item?.path && item?.signedUrl && !item.error) {
            setCachedSignedUrl(bucket, item.path, item.signedUrl, expiresIn);
            for (const originalInput of pathToInputs.get(item.path) || []) {
              result.set(originalInput, item.signedUrl);
            }
            missingPaths.delete(item.path);
          }
        }
      }
    }
  } catch (err) {
    logger.warn('[storage] createSignedUrls failed, falling back per item', {
      bucket,
      detail: err,
    });
  }

  if (missingPaths.size > 0) {
    await Promise.all(
      Array.from(missingPaths).map(async (path) => {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);
          if (!error && data?.signedUrl) {
            setCachedSignedUrl(bucket, path, data.signedUrl, expiresIn);
            for (const originalInput of pathToInputs.get(path) || []) {
              result.set(originalInput, data.signedUrl);
            }
          }
        } catch (err) {
          logger.warn('[storage] fallback createSignedUrl exception', {
            bucket,
            path,
            detail: err,
          });
        }
      })
    );
  }

  return result;
}
