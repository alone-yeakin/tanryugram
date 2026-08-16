import { describe, expect, it } from "vitest";
import { canDeletePost } from "./authorization";

describe("post deletion authorization", () => {
  it("allows a post author to delete their own post", () => {
    expect(canDeletePost(7, 7, "user")).toBe(true);
  });

  it("allows admins to delete any post for moderation", () => {
    expect(canDeletePost(7, 42, "admin")).toBe(true);
  });

  it("denies an unrelated ordinary user", () => {
    expect(canDeletePost(7, 42, "user")).toBe(false);
  });
});
