/**
 * Shared frontend & service-layer security utilities:
 * - HTML entity escaping for dynamic print / DOM document.write templates (FE-01)
 * - Strict HTTP(S) URL allowlist guard against javascript:/data:/vbscript: URIs (FE-02)
 * - Active-content & size validation for browser/service file uploads (SEC-08)
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes `&`, `<`, `>`, `"`, and `'` in arbitrary values before HTML interpolation.
 */
export function escapeHtml(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

/**
 * Parses a URL string and allows ONLY `http:` or `https:` protocols.
 * Returns normalized URL string when safe, or `null` for `javascript:`, `data:`,
 * `vbscript:`, `file:`, relative/malformed strings, or empty values.
 */
export function toSafeHttpUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export const BLOCKED_UPLOAD_EXTENSIONS = new Set([
  '.svg',
  '.html',
  '.htm',
  '.xhtml',
  '.js',
  '.mjs',
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.sh',
  '.php',
]);

const BLOCKED_UPLOAD_MIME_TYPES = new Set([
  'image/svg+xml',
  'text/html',
  'application/xhtml+xml',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-sh',
  'application/x-httpd-php',
  'text/x-php',
]);

/**
 * Validates a `File` before uploading to storage:
 * - Rejects empty (`0` byte) files and files exceeding `maxBytes` (default 10 MB)
 * - Blocks dangerous active extensions (`.svg`, `.html`, `.htm`, `.xhtml`, `.js`,
 *   `.mjs`, `.exe`, `.bat`, `.cmd`, `.ps1`, `.sh`, `.php`) and active MIME types.
 */
export function validateSafeUploadFile(
  file: File,
  maxBytes = 10 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!file || typeof file.name !== 'string') {
    return { valid: false, error: 'Invalid file' };
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    return { valid: false, error: 'File cannot be empty (0 bytes)' };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return {
      valid: false,
      error: `File exceeds maximum allowed size (${maxMb} MB)`,
    };
  }

  const normalizedName = file.name.trim().replace(/[. ]+$/, '').toLowerCase();
  const lastDotIdx = normalizedName.lastIndexOf('.');
  if (lastDotIdx !== -1) {
    const ext = normalizedName.slice(lastDotIdx);
    if (BLOCKED_UPLOAD_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        error: `File extension "${ext}" is blocked for security reasons`,
      };
    }
  }

  const normalizedMime = (file.type || '').split(';')[0].trim().toLowerCase();
  if (normalizedMime && BLOCKED_UPLOAD_MIME_TYPES.has(normalizedMime)) {
    return {
      valid: false,
      error: `File MIME type "${normalizedMime}" is blocked for security reasons`,
    };
  }

  return { valid: true };
}
