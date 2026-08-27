import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";

describe("Maintenance Mode Gating", () => {
  it("should be defined in the app router", () => {
    expect(appRouter.admin.setMaintenance).toBeDefined();
    expect(appRouter.platform.getSettings).toBeDefined();
  });
});
