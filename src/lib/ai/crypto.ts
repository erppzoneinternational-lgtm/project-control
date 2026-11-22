import crypto from 'node:crypto';

/**
 * AES-256-GCM encryption for user-supplied AI API keys.
 * Secret: AI_KEY_ENCRYPTION_SECRET (any length; SHA-256 derived).
 * Format: base64(iv[12] | tag[16] | ciphertext)
 */
function key(): Buffer {
  const secret = process.env.AI_KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error('AI_KEY_ENCRYPTION_SECRET not configured');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSecret(plain: string): string {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('Cannot encrypt empty secret');
  }
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
}

export function decryptSecret(payload: string): string {
  if (typeof payload !== 'string' || payload.trim().length === 0) {
    throw new Error('Invalid encrypted payload: expected non-empty base64 string');
  }
  const buf = Buffer.from(payload, 'base64');
  if (buf.length <= 28) {
    throw new Error(
      `Invalid encrypted payload: decoded buffer length (${buf.length}) must exceed 28 bytes (12-byte IV + 16-byte auth tag + ciphertext)`
    );
  }
  const d = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
}
