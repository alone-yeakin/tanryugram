import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const now = new Date();
  const user: AuthenticatedUser = {
    id: 17,
    openId: "profile-avatar-test",
    email: "profile@example.com",
    name: "Profile Test",
    loginMethod: "email",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

afterEach(() => vi.restoreAllMocks());

describe("profile avatar controls", () => {
  it("allows an authenticated user to clear their avatar", async () => {
    const update = vi.spyOn(db, "updateUserProfile").mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.profile.update({ avatarUrl: null })).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith(17, { avatarUrl: null });
  });
});
