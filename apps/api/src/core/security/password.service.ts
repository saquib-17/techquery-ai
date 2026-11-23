import * as argon2 from 'argon2';
import { logger } from '../logger/index.js';

/**
 * Argon2id options adhering to OWASP recommendations:
 * - memoryCost: 64MB (65536 KiB)
 * - timeCost: 3 iterations
 * - parallelism: 1 thread (CPU-friendly for single-core / free container constraints)
 * - type: argon2id (resistant against both GPU side-channel and tradeoff attacks)
 */
export const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,       // 3 iterations
  parallelism: 1,    // 1 lane / thread
};

export class PasswordService {
  /**
   * Hashes a plaintext password using Argon2id with cryptographically secure random salt.
   * Throws Error if password input is empty, non-string, or exceeds max safe length (128 bytes).
   * Never logs the password or hash.
   */
  public static async hashPassword(password: string): Promise<string> {
    if (typeof password !== 'string' || password.length === 0) {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length > 128) {
      throw new Error('Password exceeds maximum length limit of 128 characters');
    }

    try {
      const result = await argon2.hash(password, ARGON2_OPTIONS);
      return result as string;
    } catch (error) {
      // Do not log the raw error if it could leak fragments; log sanitized system message
      logger.error('Failed to hash password due to cryptographic provider error');
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verifies a plaintext password against an Argon2id hash.
   * Returns false safely on mismatch or invalid hash format without throwing unhandled exceptions.
   * Never logs the password or hash.
   */
  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (typeof password !== 'string' || password.length === 0) {
      return false;
    }

    if (typeof hash !== 'string' || hash.length === 0) {
      return false;
    }

    // Basic structural check for Argon2 hash prefix ($argon2id$, $argon2i$, $argon2d$)
    if (!hash.startsWith('$argon2')) {
      return false;
    }

    try {
      return await argon2.verify(hash, password);
    } catch {
      // Return false safely if hash format is corrupted or parsing fails
      return false;
    }
  }

  /**
   * Checks whether an existing hash needs re-hashing due to upgraded security parameters.
   */
  public static needsRehash(hash: string): boolean {
    if (typeof hash !== 'string' || !hash.startsWith('$argon2id$')) {
      return true;
    }
    return argon2.needsRehash(hash, {
      memoryCost: ARGON2_OPTIONS.memoryCost,
      timeCost: ARGON2_OPTIONS.timeCost,
      parallelism: ARGON2_OPTIONS.parallelism,
    });
  }
}

