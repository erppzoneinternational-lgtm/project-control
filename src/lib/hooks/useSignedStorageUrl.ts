'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  StorageBucket,
  extractStoragePath,
  getSignedStorageUrl,
  getSignedStorageUrls,
  isSignedStorageUrl,
} from '@/lib/supabase/storage';

function resolveDirectUrl(bucket: StorageBucket, value: string | null | undefined): string | null {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:') || isSignedStorageUrl(trimmed)) {
    return trimmed;
  }
  if (
    (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
    extractStoragePath(trimmed, bucket) === null
  ) {
    return trimmed;
  }
  return null;
}

export function useSignedStorageUrl(
  bucket: StorageBucket,
  urlOrPath: string | null | undefined,
  expiresIn = 3600
): string {
  const directUrl = resolveDirectUrl(bucket, urlOrPath);
  const requestKey = urlOrPath ? `${bucket}:${expiresIn}:${urlOrPath.trim()}` : '';
  const [resolved, setResolved] = useState<{ key: string; url: string } | null>(null);

  useEffect(() => {
    if (!urlOrPath || directUrl !== null) return;
    let cancelled = false;

    getSignedStorageUrl(bucket, urlOrPath, expiresIn).then((signedUrl) => {
      if (!cancelled && signedUrl) {
        setResolved({ key: requestKey, url: signedUrl });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [bucket, urlOrPath, expiresIn, directUrl, requestKey]);

  if (directUrl !== null) return directUrl;
  return resolved?.key === requestKey ? resolved.url : '';
}

export function useSignedStorageUrlMap(
  bucket: StorageBucket,
  inputs: Array<string | null | undefined>,
  expiresIn = 3600
): Record<string, string> {
  const depKey = inputs
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .join('\n');

  const uniqueInputs = useMemo(
    () => (depKey ? Array.from(new Set(depKey.split('\n'))) : []),
    [depKey]
  );

  const directEntries = useMemo(() => {
    const out: Record<string, string> = {};
    for (const input of uniqueInputs) {
      const direct = resolveDirectUrl(bucket, input);
      if (direct) {
        out[input] = direct;
      }
    }
    return out;
  }, [bucket, uniqueInputs]);

  const fullKey = `${bucket}:${expiresIn}:${depKey}`;
  const [resolved, setResolved] = useState<{
    key: string;
    map: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const needsSigning = uniqueInputs.filter((input) => resolveDirectUrl(bucket, input) === null);
    if (needsSigning.length === 0) return;

    let cancelled = false;
    getSignedStorageUrls(bucket, needsSigning, expiresIn).then((signedMap) => {
      if (cancelled) return;
      const obj: Record<string, string> = {};
      signedMap.forEach((value, key) => {
        obj[key] = value;
      });
      setResolved({ key: fullKey, map: obj });
    });

    return () => {
      cancelled = true;
    };
  }, [bucket, expiresIn, fullKey, uniqueInputs]);

  return useMemo(() => {
    if (resolved?.key !== fullKey) return directEntries;
    return { ...directEntries, ...resolved.map };
  }, [directEntries, resolved, fullKey]);
}
