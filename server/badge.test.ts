import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

vi.mock("./db", async () => {
  const actual = await vi.importActual("./db") as any;
  return {
    ...actual,
    applyForBadge: vi.fn(),
    reviewBadgeApplication: vi.fn(),
    getBadgeApplications: vi.fn(),
    getBadgeMarketplaceSettings: vi.fn(),
    getPlatformPaymentSettings: vi.fn(),
    getPlatformSettings: vi.fn(),
  };
});

function createContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: role === "admin" ? "admin-id" : "user-id",
      email: role === "admin" ? "realaayan.apple@gmail.com" : "user@example.com",
      name: role === "admin" ? "Admin" : "User",
      loginMethod: "email",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };
}

describe("Badge Marketplace", () => {
  it("allows users to apply for a badge", async () => {
    const ctx = createContext("user");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.applyForBadge).mockResolvedValue(123 as any);

    const result = await caller.profile.applyForBadge({ requestedBadge: "gold", reason: "Test" });
    expect(result).toBe(123);
    expect(db.applyForBadge).toHaveBeenCalledWith(2, "gold", "Test");
  });

  it("allows admins to review badge applications", async () => {
    const ctx = createContext("admin");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.reviewBadgeApplication).mockResolvedValue(undefined);

    const result = await caller.admin.reviewBadgeApplication({ applicationId: 123, status: "approved" });
    expect(result).toBeUndefined();
    expect(db.reviewBadgeApplication).toHaveBeenCalledWith(123, 1, "approved");
  });

  it("denies non-admins from reviewing badge applications", async () => {
    const ctx = createContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.reviewBadgeApplication({ applicationId: 123, status: "approved" }))
      .rejects.toThrow();
  });
});
