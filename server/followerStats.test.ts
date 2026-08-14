import { describe, expect, it } from "vitest";
import { resolveDisplayedFollowerCount } from "./followerStats";

describe("resolveDisplayedFollowerCount", () => {
  it("adds the owner baseline to distinct real followers", () => {
    expect(resolveDisplayedFollowerCount(1200, 3)).toBe(1203);
  });

  it("treats missing baseline as zero", () => {
    expect(resolveDisplayedFollowerCount(null, 4)).toBe(4);
  });

  it("clamps invalid negative and fractional values", () => {
    expect(resolveDisplayedFollowerCount(-10.9, -2.4)).toBe(0);
  });
});
