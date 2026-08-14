import { describe, expect, it } from "vitest";
import { badgeApplications, users } from "../drizzle/schema";
import { appRouter } from "./routers";

const anonymousCaller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null } as any) as any;
const nonOwnerCaller = appRouter.createCaller({ req: {} as any, res: {} as any, user: { id: 42, email: "member@example.com" } } as any) as any;

describe("Tanryugram badge and follower-display controls", () => {
  it("defines blue, black, and no-badge states plus the owner follower override", () => {
    expect(users.badgeType.enumValues).toEqual(["none", "blue", "black"]);
    expect(users.displayedFollowersCount).toBeDefined();
    expect(badgeApplications.requestedBadge.enumValues).toEqual(["blue", "black"]);
    expect(badgeApplications.status.enumValues).toEqual(["pending", "approved", "rejected"]);
  });

  it("exposes user application and owner review procedures", () => {
    expect(typeof anonymousCaller.profile.applyForBadge).toBe("function");
    expect(typeof anonymousCaller.profile.myBadgeApplications).toBe("function");
    expect(typeof anonymousCaller.admin.badgeApplications).toBe("function");
    expect(typeof anonymousCaller.admin.setBadge).toBe("function");
    expect(typeof anonymousCaller.admin.setCreator).toBe("function");
    expect(typeof anonymousCaller.admin.setDisplayedFollowers).toBe("function");
    expect(typeof anonymousCaller.admin.reviewBadge).toBe("function");
  });

  it("keeps owner controls unavailable to ordinary authenticated users", async () => {
    await expect(nonOwnerCaller.admin.setBadge({ userId: 1, badgeType: "blue" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonOwnerCaller.admin.setCreator({ userId: 1, value: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonOwnerCaller.admin.setDisplayedFollowers({ userId: 1, count: 100 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(nonOwnerCaller.admin.reviewBadge({ applicationId: 1, status: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
