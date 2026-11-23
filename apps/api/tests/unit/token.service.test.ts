import { describe, it, expect } from "vitest";
import { EmailVerificationTokenService } from "../../src/core/security/token.service.js";

describe("EmailVerificationTokenService Unit Tests", () => {
  it("1. generates a 64-character hexadecimal plaintext token and SHA-256 hash", () => {
    const { token, tokenHash, expiresAt } = EmailVerificationTokenService.generateVerificationToken();

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token).toHaveLength(64); // 32 bytes hex encoded = 64 characters

    expect(tokenHash).toBeDefined();
    expect(typeof tokenHash).toBe("string");
    expect(tokenHash).toHaveLength(64); // SHA-256 hex encoded = 64 characters

    expect(token).not.toBe(tokenHash);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("2. hashes token consistently with SHA-256", () => {
    const testToken = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const hash1 = EmailVerificationTokenService.hashToken(testToken);
    const hash2 = EmailVerificationTokenService.hashToken(testToken);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("3. rejects invalid or empty token inputs on hashToken", () => {
    expect(() => EmailVerificationTokenService.hashToken("")).toThrow("Token must be a non-empty string");
    // @ts-expect-error test invalid type
    expect(() => EmailVerificationTokenService.hashToken(null)).toThrow("Token must be a non-empty string");
  });

  it("4. performs timing-safe comparison correctly", () => {
    const token = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const same = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const diff = "9999567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    expect(EmailVerificationTokenService.compareTokens(token, same)).toBe(true);
    expect(EmailVerificationTokenService.compareTokens(token, diff)).toBe(false);
    expect(EmailVerificationTokenService.compareTokens(token, "")).toBe(false);
    expect(EmailVerificationTokenService.compareTokens("", token)).toBe(false);
  });
});
