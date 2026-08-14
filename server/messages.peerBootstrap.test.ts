import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const now = new Date();
  const user: AuthenticatedUser = {
    id: 1,
    openId: "profile-message-test",
    email: "sender@example.com",
    name: "Sender",
    loginMethod: "email",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

afterEach(() => vi.restoreAllMocks());

describe("messages profile handoff", () => {
  it("forwards an explicit profile peer to inbox hydration", async () => {
    const peers = [{ peer: { id: 42, name: "Rabbi", username: "evo_rabby" }, lastMessage: null, unreadCount: 0, settings: null }];
    const getPeers = vi.spyOn(db, "getMessagePeers").mockResolvedValue(peers as any);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.messages.peers({ peerId: 42 });

    expect(getPeers).toHaveBeenCalledWith(1, 42);
    expect(result).toEqual(peers);
  });

  it("routes the first direct message using the selected peer id", async () => {
    const sendMessage = vi.spyOn(db, "sendMessage").mockResolvedValue(99);
    const createNotification = vi.spyOn(db, "createNotification").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());

    const result = await caller.messages.send({ receiverId: 42, content: "Hello from the profile" });

    expect(sendMessage).toHaveBeenCalledWith(1, 42, "Hello from the profile", undefined, undefined);
    expect(createNotification).toHaveBeenCalledWith({ userId: 42, actorId: 1, type: "message", content: "sent you a message" });
    expect(result).toBe(99);
  });
});
