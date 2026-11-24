import { describe, it, expect } from "vitest";
import { JwtService } from "../../src/core/security/jwt.service.js";
import { UnauthorizedError } from "../../src/core/errors/AppError.js";
import jwt from "jsonwebtoken";
import { config } from "../../src/core/config/index.js";

describe("JwtService Unit Tests", () => {
  const samplePayload = {
    userId: "123e4567-e89b-12d3-a456-426614174000",
    role: "CANDIDATE",
    tier: "FREE",
  };

  it("1. signs a valid JWT access token with expected standard claims", () => {
    const token = JwtService.signAccessToken(samplePayload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const decoded = jwt.decode(token, { complete: true }) as any;
    expect(decoded).toBeDefined();
    expect(decoded.header.alg).toBe("HS256");
    expect(decoded.header.typ).toBe("JWT");

    expect(decoded.payload.sub).toBe(samplePayload.userId);
    expect(decoded.payload.role).toBe(samplePayload.role);
    expect(decoded.payload.tier).toBe(samplePayload.tier);
    expect(decoded.payload.iss).toBe(config.JWT_ISSUER);
    expect(decoded.payload.aud).toBe(config.JWT_AUDIENCE);
    expect(decoded.payload.jti).toBeDefined();
    expect(decoded.payload.exp).toBeDefined();
    expect(decoded.payload.iat).toBeDefined();
  });

  it("2. successfully verifies and decodes a signed token", () => {
    const token = JwtService.signAccessToken(samplePayload);
    const claims = JwtService.verifyAccessToken(token);

    expect(claims.sub).toBe(samplePayload.userId);
    expect(claims.role).toBe(samplePayload.role);
    expect(claims.tier).toBe(samplePayload.tier);
    expect(claims.iss).toBe(config.JWT_ISSUER);
    expect(claims.aud).toBe(config.JWT_AUDIENCE);
    expect(claims.jti).toBeDefined();
  });

  it("3. rejects token signed with wrong secret", () => {
    const token = jwt.sign(
      { role: "CANDIDATE", tier: "FREE" },
      "wrong_secret_that_is_at_least_32_characters_long_12345",
      {
        algorithm: "HS256",
        subject: samplePayload.userId,
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      }
    );

    expect(() => JwtService.verifyAccessToken(token)).toThrow(UnauthorizedError);
  });

  it("4. rejects expired token", () => {
    const expiredToken = jwt.sign(
      { role: "CANDIDATE", tier: "FREE" },
      config.JWT_ACCESS_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "-1s",
        subject: samplePayload.userId,
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      }
    );

    expect(() => JwtService.verifyAccessToken(expiredToken)).toThrow(UnauthorizedError);
  });

  it("5. rejects token with invalid algorithm (e.g. none or HS512)", () => {
    // Attempting 'none' algorithm
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: samplePayload.userId,
        iss: config.JWT_ISSUER,
        aud: config.JWT_AUDIENCE,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64url");
    const forgedToken = `${header}.${payload}.`;

    expect(() => JwtService.verifyAccessToken(forgedToken)).toThrow(UnauthorizedError);
  });

  it("6. rejects token with wrong issuer or audience", () => {
    const badIssuerToken = jwt.sign(
      { role: "CANDIDATE", tier: "FREE" },
      config.JWT_ACCESS_SECRET,
      {
        algorithm: "HS256",
        subject: samplePayload.userId,
        issuer: "malicious-issuer",
        audience: config.JWT_AUDIENCE,
      }
    );

    expect(() => JwtService.verifyAccessToken(badIssuerToken)).toThrow(UnauthorizedError);

    const badAudToken = jwt.sign(
      { role: "CANDIDATE", tier: "FREE" },
      config.JWT_ACCESS_SECRET,
      {
        algorithm: "HS256",
        subject: samplePayload.userId,
        issuer: config.JWT_ISSUER,
        audience: "malicious-audience",
      }
    );

    expect(() => JwtService.verifyAccessToken(badAudToken)).toThrow(UnauthorizedError);
  });

  it("7. rejects malformed or random string token", () => {
    expect(() => JwtService.verifyAccessToken("not-a-token")).toThrow(UnauthorizedError);
    expect(() => JwtService.verifyAccessToken("")).toThrow(UnauthorizedError);
  });

  it("8. rejects manipulated payload signature mismatch", () => {
    const validToken = JwtService.signAccessToken(samplePayload);
    const [header, payload, sig] = validToken.split(".");

    // Tamper with payload (elevating role to ADMIN)
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString());
    decodedPayload.role = "ADMIN";
    const tamperedPayload = Buffer.from(JSON.stringify(decodedPayload)).toString("base64url");
    const tamperedToken = `${header}.${tamperedPayload}.${sig}`;

    expect(() => JwtService.verifyAccessToken(tamperedToken)).toThrow(UnauthorizedError);
  });

  it("9. rejects token with missing required claims (e.g. role, tier, or jti)", () => {
    const incompleteToken = jwt.sign(
      { sub: samplePayload.userId }, // missing role, tier, jti
      config.JWT_ACCESS_SECRET,
      {
        algorithm: "HS256",
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      }
    );

    expect(() => JwtService.verifyAccessToken(incompleteToken)).toThrow(UnauthorizedError);
  });

  it("10. rejects token signed with alternate HMAC algorithm (e.g. HS512)", () => {
    const hs512Token = jwt.sign(
      { role: "CANDIDATE", tier: "FREE" },
      config.JWT_ACCESS_SECRET,
      {
        algorithm: "HS512",
        subject: samplePayload.userId,
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      }
    );

    expect(() => JwtService.verifyAccessToken(hs512Token)).toThrow(UnauthorizedError);
  });
});
