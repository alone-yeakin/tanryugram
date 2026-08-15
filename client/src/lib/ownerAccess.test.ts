import { describe, expect, it } from "vitest";
import { canAccessCreatorStudio, canManageCreatorStudio } from "./ownerAccess";

describe("Creator Studio access", () => {
  it("shows Creator Studio for the current owner response", () => {
    expect(canAccessCreatorStudio({ isOwner: true, role: "admin", isCreator: true })).toBe(true);
    expect(canManageCreatorStudio({ isOwner: true })).toBe(true);
  });

  it("supports the migrated admin creator profile when isOwner is absent in a stale client response", () => {
    expect(canAccessCreatorStudio({ role: "admin", isCreator: true })).toBe(true);
  });

  it("does not expose Creator Studio to ordinary creators or users", () => {
    expect(canAccessCreatorStudio({ role: "user", isCreator: true })).toBe(false);
    expect(canAccessCreatorStudio({ role: "admin", isCreator: false })).toBe(false);
    expect(canManageCreatorStudio({ role: "admin" })).toBe(false);
  });
});
