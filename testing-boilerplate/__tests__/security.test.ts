/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  SECURITY TEST TEMPLATE                                      ║
 * ║  Test encryption, input sanitisation, auth tokens, and       ║
 * ║  common vulnerability patterns.                              ║
 * ║  Replace examples with YOUR project's security functions.    ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Security tests should:
 *  ✅ Verify encryption round-trips (encrypt → decrypt = original)
 *  ✅ Test input sanitisation (XSS, SQL injection, path traversal)
 *  ✅ Test auth token validation and expiry
 *  ✅ Verify sensitive data is never exposed in plain text
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// ════════════════════════════════════════════════════════════════
// PATTERN 1: Encryption round-trip (AES-256-GCM)
// ════════════════════════════════════════════════════════════════

describe('AES-256-GCM Encryption', () => {
  const ALGORITHM = 'aes-256-gcm';
  const KEY = crypto.randomBytes(32); // 256-bit key

  function encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  function decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // --- Round-trip tests ---
  const testCases = [
    'Hello World',
    '',
    'Special chars: £€¥ © ® ™ — ""',
    '{"key": "value", "amount": 1234.56}',
    '<script>alert("xss")</script>',
    '🔐🏪🐀',
    'a'.repeat(10000), // Long string
  ];

  for (const original of testCases) {
    it(`round-trip: "${original.slice(0, 40)}${original.length > 40 ? '...' : ''}"`, () => {
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });
  }

  it('different plaintexts produce different ciphertexts', () => {
    const a = encrypt('secret-a');
    const b = encrypt('secret-b');
    expect(a).not.toBe(b);
  });

  it('same plaintext produces different ciphertexts (random IV)', () => {
    const a = encrypt('same-text');
    const b = encrypt('same-text');
    expect(a).not.toBe(b); // Different IVs
  });

  it('tampered ciphertext fails to decrypt', () => {
    const encrypted = encrypt('sensitive data');
    const tampered = encrypted.slice(0, -2) + 'ff'; // Modify last byte
    expect(() => decrypt(tampered)).toThrow();
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 2: Input sanitisation
// ════════════════════════════════════════════════════════════════

describe('Input Sanitisation', () => {
  // Replace with YOUR sanitisation function
  function sanitiseHTML(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  it('escapes HTML tags (XSS prevention)', () => {
    expect(sanitiseHTML('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes event handlers', () => {
    expect(sanitiseHTML('<img onerror="alert(1)">')).not.toContain('onerror=');
  });

  it('preserves normal text', () => {
    expect(sanitiseHTML('Hello World')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(sanitiseHTML('')).toBe('');
  });
});

describe('Path Traversal Prevention', () => {
  function safePath(userInput: string, baseDir: string): string | null {
    // Resolve and check it stays within baseDir
    const resolved = require('path').resolve(baseDir, userInput);
    if (!resolved.startsWith(baseDir)) return null; // Traversal attempt!
    return resolved;
  }

  it('allows normal filenames', () => {
    expect(safePath('report.pdf', '/uploads')).toBe('/uploads/report.pdf');
  });

  it('blocks ../ traversal', () => {
    expect(safePath('../../etc/passwd', '/uploads')).toBeNull();
  });

  it('blocks absolute paths outside base', () => {
    expect(safePath('/etc/passwd', '/uploads')).toBeNull();
  });
});

describe('SQL Injection Prevention', () => {
  // If you use raw queries, test parameterisation
  function buildQuery(userId: string): { text: string; params: string[] } {
    // SAFE: Parameterised query
    return {
      text: 'SELECT * FROM users WHERE id = $1',
      params: [userId],
    };
  }

  it('user input goes into params, not query text', () => {
    const malicious = "'; DROP TABLE users; --";
    const query = buildQuery(malicious);

    expect(query.text).not.toContain(malicious);
    expect(query.text).not.toContain('DROP');
    expect(query.params[0]).toBe(malicious); // Safe in params
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 3: Token / JWT validation
// ════════════════════════════════════════════════════════════════

describe('Token Validation', () => {
  // Simple HMAC token for demonstration
  const SECRET = 'test-secret-key-32chars-minimum!';

  function createToken(userId: string, expiresInMs: number): string {
    const payload = JSON.stringify({ userId, exp: Date.now() + expiresInMs });
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
    return `${payloadB64}.${signature}`;
  }

  function verifyToken(token: string): { userId: string } | null {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
    if (signature !== expectedSig) return null; // Tampered

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Date.now()) return null; // Expired

    return { userId: payload.userId };
  }

  it('valid token returns userId', () => {
    const token = createToken('user-123', 60000); // 1 min
    const result = verifyToken(token);
    expect(result?.userId).toBe('user-123');
  });

  it('expired token returns null', () => {
    const token = createToken('user-123', -1000); // Already expired
    expect(verifyToken(token)).toBeNull();
  });

  it('tampered token returns null', () => {
    const token = createToken('user-123', 60000);
    const tampered = token.slice(0, -3) + 'xxx';
    expect(verifyToken(tampered)).toBeNull();
  });

  it('empty/malformed token returns null', () => {
    expect(verifyToken('')).toBeNull();
    expect(verifyToken('not.a.valid.token')).toBeNull();
    expect(verifyToken('single-part')).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 4: Password / secret handling
// ════════════════════════════════════════════════════════════════

describe('Password Hashing', () => {
  function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  }

  it('correct password verifies', () => {
    const hashed = hashPassword('MySecureP@ss123');
    expect(verifyPassword('MySecureP@ss123', hashed)).toBe(true);
  });

  it('wrong password fails', () => {
    const hashed = hashPassword('MySecureP@ss123');
    expect(verifyPassword('WrongPassword', hashed)).toBe(false);
  });

  it('same password produces different hashes (random salt)', () => {
    const a = hashPassword('same-password');
    const b = hashPassword('same-password');
    expect(a).not.toBe(b);
  });

  it('password is never stored in plain text', () => {
    const hashed = hashPassword('MySecureP@ss123');
    expect(hashed).not.toContain('MySecureP@ss123');
  });
});

// ════════════════════════════════════════════════════════════════
// PATTERN 5: Rate limiting / abuse prevention
// ════════════════════════════════════════════════════════════════

describe('Rate Limiter', () => {
  class RateLimiter {
    private requests = new Map<string, number[]>();

    constructor(private maxRequests: number, private windowMs: number) {}

    isAllowed(clientId: string): boolean {
      const now = Date.now();
      const timestamps = this.requests.get(clientId) || [];
      const recent = timestamps.filter(t => now - t < this.windowMs);

      if (recent.length >= this.maxRequests) return false;

      recent.push(now);
      this.requests.set(clientId, recent);
      return true;
    }
  }

  it('allows requests within limit', () => {
    const limiter = new RateLimiter(3, 60000);
    expect(limiter.isAllowed('client-1')).toBe(true);
    expect(limiter.isAllowed('client-1')).toBe(true);
    expect(limiter.isAllowed('client-1')).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    const limiter = new RateLimiter(2, 60000);
    limiter.isAllowed('client-1');
    limiter.isAllowed('client-1');
    expect(limiter.isAllowed('client-1')).toBe(false); // 3rd request blocked
  });

  it('different clients have separate limits', () => {
    const limiter = new RateLimiter(1, 60000);
    expect(limiter.isAllowed('client-1')).toBe(true);
    expect(limiter.isAllowed('client-2')).toBe(true); // Different client
    expect(limiter.isAllowed('client-1')).toBe(false); // Same client blocked
  });
});
