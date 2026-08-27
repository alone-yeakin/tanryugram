import { describe, expect, it } from "vitest";
import { attachPostRelations } from "./db";

const post = (id: number, userId: number) => ({ id, userId, caption: `post-${id}` }) as any;
const user = (id: number, username: string) => ({ id, username, name: username }) as any;
const media = (id: number, postId: number, sortOrder: number) => ({ id, postId, mediaUrl: `/media/${id}.jpg`, sortOrder }) as any;

describe("public feed query assembly", () => {
  it("attaches users and keeps all media grouped by post", () => {
    const rows = attachPostRelations(
      [post(10, 2), post(11, 3)],
      [user(2, "creator-two"), user(3, "creator-three")],
      [media(102, 10, 2), media(101, 10, 1), media(103, 11, 1)],
    );

    expect(rows[0].user?.username).toBe("creator-two");
    expect(rows[0].media.map((item) => item.id)).toEqual([102, 101]);
    expect(rows[1].user?.username).toBe("creator-three");
    expect(rows[1].media).toHaveLength(1);
  });

  it("keeps a post visible when its creator or media row is unavailable", () => {
    const rows = attachPostRelations([post(20, 404)], [], []);

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(20);
    expect(rows[0].user).toBeNull();
    expect(rows[0].media).toEqual([]);
  });
});
