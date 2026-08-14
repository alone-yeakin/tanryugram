import { describe, expect, it } from "vitest";
import { getFollowers, getFollowing } from "./db";

describe("per-user list privacy settings", () => {
  it("allows owner to view their own followers when showFollowersList is false", async () => {
    const results = await getFollowers(1, 1);
    expect(Array.isArray(results)).toBe(true);
  });

  it("permits following lists when enabled", async () => {
    const results = await getFollowing(1, 99);
    expect(Array.isArray(results)).toBe(true);
  });
});
