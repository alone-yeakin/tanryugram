import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { getFollowers } from "./db";

describe("profile follower privacy", () => {
  it("does not return follower rows when the viewer is not the profile owner", async () => {
    await expect(getFollowers(42, 99)).resolves.toEqual([]);
  });

  it("requires authentication before reading a follower list", async () => {
    const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null } as any) as any;
    await expect(caller.follows.followers({ userId: 42 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication for private-profile settings and request inbox", async () => {
    const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null } as any) as any;
    await expect(caller.follows.privacy()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.follows.incomingRequests()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.follows.reviewRequest({ requestId: 1, status: "approved" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns a stable request state when the database is unavailable", async () => {
    await expect((await import("./db")).getFollowRequestState(42, 99)).resolves.toBe(false);
  });
});
