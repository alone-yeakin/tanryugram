import { describe, expect, it } from "vitest";
import { emailVerificationCodes } from "../drizzle/schema";
import { hasNativePassword, isVerificationCodeValid, requiresEmailVerification, sanitizeAuthUser } from "./routers";

describe("native auth session responses", () => {
  it("requires a stored native password for email login", () => {
    expect(hasNativePassword({ passwordHash: "encoded" })).toBe(true);
    expect(hasNativePassword({ passwordHash: null })).toBe(false);
    expect(hasNativePassword({})).toBe(false);
  });
  it("keeps the verification-code table contract available for signup and reset", () => {
    expect(emailVerificationCodes.email).toBeDefined();
    expect(emailVerificationCodes.code).toBeDefined();
    expect(emailVerificationCodes.expiresAt).toBeDefined();
    expect(emailVerificationCodes.createdAt).toBeDefined();
  });
  it("requires verification for additional accounts and rejects expired codes", () => {
    expect(requiresEmailVerification(0)).toBe(false);
    expect(requiresEmailVerification(1)).toBe(true);
    expect(requiresEmailVerification(2, "  ")).toBe(true);
    expect(requiresEmailVerification(2, "949506")).toBe(false);
    expect(isVerificationCodeValid({ expiresAt: new Date(Date.now() + 60_000) })).toBe(true);
    expect(isVerificationCodeValid({ expiresAt: new Date(Date.now() - 60_000) })).toBe(false);
  });
  it("removes passwordHash while preserving the public account fields", () => {
    expect(sanitizeAuthUser({ id: 7, email: "person@example.com", passwordHash: "secret-hash", username: "person" })).toEqual({
      id: 7,
      email: "person@example.com",
      username: "person",
      isOwner: false,
    });
  });
});
