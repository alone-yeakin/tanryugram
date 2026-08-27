import { describe, expect, it } from "vitest";
import { toPublicPostFeedRows } from "./routers";

describe("public post feed contract", () => {
  it("normalizes the legacy database row shape and removes private credentials", () => {
    const result = toPublicPostFeedRows([{
      id: 41,
      userId: 7,
      caption: "A new post",
      mediaUrl: "https://example.test/post.webp",
      user: {
        id: 7,
        name: "Creator",
        username: "creator",
        passwordHash: "must-not-leave-the-server",
      },
    }]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      post: { id: 41, userId: 7, caption: "A new post" },
      creator: { id: 7, username: "creator" },
    });
    expect((result[0] as any).creator.passwordHash).toBeUndefined();
  });

  it("drops incomplete rows instead of allowing clients to read an undefined id", () => {
    expect(toPublicPostFeedRows([
      undefined,
      {},
      { post: undefined, creator: { id: 2 } },
      { post: { id: 9, userId: 2, caption: "valid" }, creator: { id: 2, username: "safe" } },
    ])).toEqual([
      { post: { id: 9, userId: 2, caption: "valid" }, creator: { id: 2, username: "safe", isOwner: false } },
    ]);
  });

  it("returns an empty list for an unavailable response", () => {
    expect(toPublicPostFeedRows(null)).toEqual([]);
  });
});
