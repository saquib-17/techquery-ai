import { describe, it, expect } from "vitest";
import { PasswordService, ARGON2_OPTIONS } from "../../src/core/security/password.service.js";

describe("PasswordService Unit Tests", () => {
  const samplePassword = "SecurePassword123!@#";

  it("1. password hashing produces a non-plaintext hash starting with argon2id prefix", async () => {
    const hash = await PasswordService.hashPassword(samplePassword);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe(samplePassword);
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("2. identical passwords produce different hashes due to unique cryptographic salting", async () => {
    const hash1 = await PasswordService.hashPassword(samplePassword);
    const hash2 = await PasswordService.hashPassword(samplePassword);

    expect(hash1).not.toBe(hash2);
    expect(hash1.startsWith("$argon2id$")).toBe(true);
    expect(hash2.startsWith("$argon2id$")).toBe(true);
  });

  it("3. correct passwords verify successfully against generated hash", async () => {
    const hash = await PasswordService.hashPassword(samplePassword);
    const isValid = await PasswordService.verifyPassword(samplePassword, hash);

    expect(isValid).toBe(true);
  });

  it("4. incorrect passwords fail verification safely", async () => {
    const hash = await PasswordService.hashPassword(samplePassword);
    const isValid = await PasswordService.verifyPassword("WrongPassword456!@#", hash);

    expect(isValid).toBe(false);
  });

  it("5. empty, non-string, or oversized passwords (>128 chars) are rejected safely", async () => {
    await expect(PasswordService.hashPassword("")).rejects.toThrow("Password must be a non-empty string");
    // @ts-expect-error Testing invalid runtime input type
    await expect(PasswordService.hashPassword(null)).rejects.toThrow("Password must be a non-empty string");
    // @ts-expect-error Testing invalid runtime input type
    await expect(PasswordService.hashPassword(undefined)).rejects.toThrow("Password must be a non-empty string");

    const oversizedPassword = "A".repeat(129);
    await expect(PasswordService.hashPassword(oversizedPassword)).rejects.toThrow("Password exceeds maximum length limit of 128 characters");

    // Verify verification also returns false on empty inputs
    expect(await PasswordService.verifyPassword("", "$argon2id$dummy")).toBe(false);
  });

  it("6. invalid hash inputs are handled safely without unhandled crashes", async () => {
    // Malformed strings
    expect(await PasswordService.verifyPassword(samplePassword, "invalid_hash_string")).toBe(false);
    expect(await PasswordService.verifyPassword(samplePassword, "")).toBe(false);
    expect(await PasswordService.verifyPassword(samplePassword, "$argon2id$corrupted$parameters$hash")).toBe(false);
    // @ts-expect-error Testing invalid runtime input type
    expect(await PasswordService.verifyPassword(samplePassword, null)).toBe(false);
  });

  it("7. conforms to approved OWASP security parameters (64MB memory, 3 iterations, 1 parallelism)", () => {
    expect(ARGON2_OPTIONS.memoryCost).toBe(65536);
    expect(ARGON2_OPTIONS.timeCost).toBe(3);
    expect(ARGON2_OPTIONS.parallelism).toBe(1);
    expect(ARGON2_OPTIONS.type).toBe(2); // argon2id = 2
  });

  it("8. needsRehash detects non-argon2id or deprecated parameters", async () => {
    const hash = await PasswordService.hashPassword(samplePassword);
    expect(PasswordService.needsRehash(hash)).toBe(false);
    expect(PasswordService.needsRehash("$2b$10$legacyBcryptHashStringSample123456789012345678901234567890")).toBe(true);
    expect(PasswordService.needsRehash("malformed")).toBe(true);
  });
});
