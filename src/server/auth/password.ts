import "server-only";
import { hash, verify } from "@node-rs/argon2";

// 2 corresponds to Argon2id in @node-rs/argon2
const ARGON2ID_ALGORITHM = 2;

// OWASP-recommended Argon2id parameters
const HASH_OPTIONS = {
  algorithm: ARGON2ID_ALGORITHM,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,       // 2 iterations
  parallelism: 1,
};

/**
 * Hash a plaintext password using Argon2id.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return hash(plainText, HASH_OPTIONS);
}

/**
 * Verify a candidate password against an Argon2id hash.
 * Constant-time comparison is handled by the underlying implementation.
 */
export async function verifyPassword(
  plainText: string,
  storedHash: string
): Promise<boolean> {
  try {
    return await verify(storedHash, plainText, HASH_OPTIONS);
  } catch {
    return false;
  }
}
