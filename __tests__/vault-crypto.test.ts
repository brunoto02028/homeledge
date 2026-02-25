import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from '@/lib/vault-crypto';

describe('Vault Crypto (AES-256-GCM)', () => {
  // ============================================================
  // encrypt()
  // ============================================================

  describe('encrypt', () => {
    it('returns empty string for empty input', () => {
      expect(encrypt('')).toBe('');
    });

    it('returns a string with 3 colon-separated parts (iv:tag:ciphertext)', () => {
      const result = encrypt('hello world');
      const parts = result.split(':');
      expect(parts.length).toBe(3);
    });

    it('IV is 32 hex chars (16 bytes)', () => {
      const result = encrypt('test');
      const iv = result.split(':')[0];
      expect(iv.length).toBe(32);
      expect(/^[0-9a-f]+$/.test(iv)).toBe(true);
    });

    it('auth tag is 32 hex chars (16 bytes)', () => {
      const result = encrypt('test');
      const tag = result.split(':')[1];
      expect(tag.length).toBe(32);
      expect(/^[0-9a-f]+$/.test(tag)).toBe(true);
    });

    it('ciphertext is non-empty hex', () => {
      const result = encrypt('test');
      const ciphertext = result.split(':')[2];
      expect(ciphertext.length).toBeGreaterThan(0);
      expect(/^[0-9a-f]+$/.test(ciphertext)).toBe(true);
    });

    it('encrypting the same text twice produces different ciphertexts (random IV)', () => {
      const a = encrypt('same text');
      const b = encrypt('same text');
      expect(a).not.toBe(b);
    });

    it('encrypting different texts produces different ciphertexts', () => {
      const a = encrypt('text one');
      const b = encrypt('text two');
      expect(a).not.toBe(b);
    });
  });

  // ============================================================
  // decrypt()
  // ============================================================

  describe('decrypt', () => {
    it('returns original text for empty or non-encrypted input', () => {
      expect(decrypt('')).toBe('');
      expect(decrypt('plain text without colons')).toBe('plain text without colons');
    });

    it('returns input as-is if it has wrong number of parts', () => {
      expect(decrypt('a:b')).toBe('a:b');
      expect(decrypt('a:b:c:d')).toBe('a:b:c:d');
    });

    it('returns [decryption failed] for invalid ciphertext', () => {
      expect(decrypt('aaaa:bbbb:cccc')).toBe('[decryption failed]');
    });
  });

  // ============================================================
  // Round-trip encrypt → decrypt
  // ============================================================

  describe('round-trip', () => {
    const testCases = [
      'hello world',
      'password123!@#',
      'UK National Insurance: AB123456C',
      '{"key": "value", "amount": 1234.56}',
      'Línea con acentos y ñ — símbolos especiales',
      'a'.repeat(10000), // large text
      '🔒🏦💷', // emoji
      '<script>alert("xss")</script>', // XSS payload
      'line1\nline2\ttab',
    ];

    testCases.forEach((text, i) => {
      it(`round-trip #${i + 1}: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`, () => {
        const encrypted = encrypt(text);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(text);
      });
    });

    it('handles special characters in passwords correctly', () => {
      const password = 'P@$$w0rd!#%^&*()_+-=[]{}|;:\'",.<>?/`~';
      const encrypted = encrypt(password);
      expect(decrypt(encrypted)).toBe(password);
    });

    it('handles very long strings', () => {
      const longText = 'x'.repeat(100000);
      const encrypted = encrypt(longText);
      expect(decrypt(encrypted)).toBe(longText);
    });
  });
});
