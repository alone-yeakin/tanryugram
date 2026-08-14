import { describe, expect, it } from "vitest";
import { resolveProfileUser } from "./profileViewData";

describe("resolveProfileUser", () => {
  it("prefers the fresh profile response so cross-account avatars are current", () => {
    const selected = { id: 1, avatarUrl: "stale-preview" };
    const loaded = { id: 1, avatarUrl: "/manus-storage/users/1/avatar.webp" };
    expect(resolveProfileUser(selected, loaded)).toEqual(loaded);
  });

  it("keeps the selected profile while the public profile request is loading", () => {
    const selected = { id: 1, username: "creator" };
    expect(resolveProfileUser(selected, undefined)).toEqual(selected);
  });
});
