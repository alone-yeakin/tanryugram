import { afterEach, describe, expect, it } from "vitest";
import { checkEmailCodeRateLimit, resetEmailCodeRateLimitForTests } from "./emailRateLimit";

describe("email code rate limit", () => {
  afterEach(() => resetEmailCodeRateLimitForTests());

  it("normalizes email addresses and enforces a cooldown", () => {
    const first = checkEmailCodeRateLimit(" AAYAN@example.com ", "signup", 1_000);
    const second = checkEmailCodeRateLimit("aayan@example.com", "signup", 30_000);
    expect(first.allowed).toBe(true);
    expect(second).toMatchObject({ allowed: false, reason: "cooldown" });
  });

  it("limits repeated requests per address and purpose", () => {
    for (let index = 0; index < 5; index += 1) {
      expect(checkEmailCodeRateLimit("aayan@example.com", "password-reset", 1_000 + index * 61_000).allowed).toBe(true);
    }
    expect(checkEmailCodeRateLimit("aayan@example.com", "password-reset", 1_000 + 5 * 61_000)).toMatchObject({ allowed: false, reason: "email-limit" });
  });

  it("keeps signup and reset quotas separate", () => {
    expect(checkEmailCodeRateLimit("aayan@example.com", "signup", 1_000).allowed).toBe(true);
    expect(checkEmailCodeRateLimit("aayan@example.com", "password-reset", 1_000).allowed).toBe(true);
  });
});
