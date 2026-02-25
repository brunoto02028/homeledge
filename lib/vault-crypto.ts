import crypto from 'crypto';

/** Encryption algorithm used for all vault operations. */
const ALGORITHM = 'aes-256-gcm' as const;
/** Initialization vector length in bytes. */
const IV_LENGTH = 16;

/**
 * Derives a 256-bit encryption key from environment variables.
 * Uses SHA-256 hash of `VAULT_ENCRYPTION_KEY` or `NEXTAUTH_SECRET`.
 * @returns 32-byte key as Uint8Array
 */
function getKey(): Uint8Array {
  const secret = process.env.VAULT_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'homeledger-vault-default-key-change-me';
  const buf = crypto.createHash('sha256').update(secret).digest();
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param text - The plaintext string to encrypt
 * @returns Encrypted string in format `iv:authTag:ciphertext` (all hex-encoded), or empty string if input is empty
 *
 * @example
 * ```ts
 * const encrypted = encrypt('my-secret-password');
 * // Returns: "a1b2c3...:d4e5f6...:789abc..."
 * ```
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const key = getKey();
  const ivBuf = crypto.randomBytes(IV_LENGTH);
  const iv = new Uint8Array(ivBuf.buffer, ivBuf.byteOffset, ivBuf.byteLength);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tagBuf = cipher.getAuthTag();
  return ivBuf.toString('hex') + ':' + tagBuf.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 *
 * @param encryptedText - The encrypted string in `iv:authTag:ciphertext` format
 * @returns The original plaintext string, or `'[decryption failed]'` on error, or the input unchanged if not in encrypted format
 *
 * @example
 * ```ts
 * const plain = decrypt('a1b2c3...:d4e5f6...:789abc...');
 * // Returns: "my-secret-password"
 * ```
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  try {
    const key = getKey();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;
    const ivBuf = Buffer.from(parts[0], 'hex');
    const iv = new Uint8Array(ivBuf.buffer, ivBuf.byteOffset, ivBuf.byteLength);
    const tagBuf = Buffer.from(parts[1], 'hex');
    const tag = new Uint8Array(tagBuf.buffer, tagBuf.byteOffset, tagBuf.byteLength);
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '[decryption failed]';
  }
}
