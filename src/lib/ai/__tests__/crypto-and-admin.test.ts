import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptSecret, decryptSecret } from '../crypto';

describe('SEC-07: AI Crypto Guards', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.AI_KEY_ENCRYPTION_SECRET = 'unit-test-encryption-secret-32b!';
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  describe('encryptSecret & decryptSecret', () => {
    it('round-trips plaintext secrets accurately', () => {
      const secret = 'AIzaSyTestKey_1234567890-abcdef';
      const encrypted = encryptSecret(secret);
      expect(encrypted).not.toContain(secret);
      expect(decryptSecret(encrypted)).toBe(secret);
    });

    it('throws when encrypting an empty string', () => {
      expect(() => encryptSecret('')).toThrow(/empty secret/i);
    });

    it('throws a clear error when payload decodes to <= 28 bytes (IV + tag without ciphertext)', () => {
      expect(() => decryptSecret('')).toThrow(/Invalid encrypted payload/i);
      expect(() => decryptSecret('   ')).toThrow(/Invalid encrypted payload/i);

      const sixteenBytes = Buffer.alloc(16, 1).toString('base64');
      expect(() => decryptSecret(sixteenBytes)).toThrow(/must exceed 28 bytes/i);

      const exactTwentyEightBytes = Buffer.alloc(28, 2).toString('base64');
      expect(() => decryptSecret(exactTwentyEightBytes)).toThrow(/must exceed 28 bytes/i);
    });

    it('throws when auth tag is tampered with', () => {
      const encrypted = encryptSecret('sk-valid-secret-key-value');
      const buf = Buffer.from(encrypted, 'base64');
      buf[15] ^= 0xff; // Flip byte inside 16-byte GCM auth tag
      expect(() => decryptSecret(buf.toString('base64'))).toThrow();
    });

    it('throws when no encryption secret env var is configured', () => {
      delete process.env.AI_KEY_ENCRYPTION_SECRET;
      expect(() => encryptSecret('sk-test-1234567890')).toThrow(
        /AI_KEY_ENCRYPTION_SECRET not configured/i
      );
    });
  });
});
