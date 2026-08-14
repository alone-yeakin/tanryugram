import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(email = "member@example.com"): TrpcContext {
  const now = new Date();
  const user: AuthenticatedUser = {
    id: 7,
    openId: "media-policy-test",
    email,
    name: "Member",
    loginMethod: "email",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

afterEach(() => vi.restoreAllMocks());

describe("Tanryugram beta media policy", () => {
  it("keeps photos enabled and blocks videos by default", async () => {
    vi.spyOn(db, "getMediaUploadPolicy").mockResolvedValue({ photosEnabled: true, videosEnabled: false } as any);
    const caller = appRouter.createCaller(createContext());
    const image = Buffer.from("small-photo").toString("base64");
    await expect(caller.media.uploadBase64({ fileName: "photo.jpg", base64Data: image, contentType: "image/jpeg" })).resolves.toBeDefined();
    await expect(caller.media.uploadBase64({ fileName: "clip.mp4", base64Data: image, contentType: "video/mp4" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("does not expose upload-policy mutation to ordinary accounts", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.admin.setUploadPolicy({ photosEnabled: false, videosEnabled: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("uses follow-back wording and notifies reactions", async () => {
    vi.spyOn(db, "toggleFollow").mockResolvedValue({ following: true, isFollowBack: true });
    const notification = vi.spyOn(db, "createNotification").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());
    await caller.follows.toggle({ userId: 42 });
    expect(notification).toHaveBeenCalledWith({ userId: 42, actorId: 7, type: "follow", content: "followed you back" });

    vi.spyOn(db, "getPostById").mockResolvedValue({ id: 99, userId: 42 } as any);
    vi.spyOn(db, "toggleReaction").mockResolvedValue({ reactionType: "love" });
    await caller.posts.reaction({ postId: 99, reactionType: "love" });
    expect(notification).toHaveBeenCalledWith({ userId: 42, actorId: 7, type: "like", targetId: 99, content: "reacted love to your post" });

    vi.spyOn(db, "togglePostLike").mockResolvedValue({ liked: true });
    await caller.posts.like({ postId: 99 });
    expect(notification).toHaveBeenCalledWith({ userId: 42, actorId: 7, type: "like", targetId: 99, content: "liked your post" });

    vi.spyOn(db, "createComment").mockResolvedValue(123);
    await caller.posts.comment({ postId: 99, content: "Great post" });
    expect(notification).toHaveBeenCalledWith({ userId: 42, actorId: 7, type: "comment", targetId: 99, content: "commented on your post" });
  });
});
