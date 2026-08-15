import { describe, expect, it } from "vitest";
import { canSeeOwnerStudio } from "./ownerAccess";

describe("canSeeOwnerStudio", () => {
  it("allows the server-derived owner flag", () => {
    expect(canSeeOwnerStudio({ isOwner: true })).toBe(true);
  });

  it("recognizes the migrated current owner for client navigation", () => {
    expect(canSeeOwnerStudio({ email: "realaayan.apple@gmail.com" })).toBe(true);
  });

  it("does not expose owner navigation to ordinary users", () => {
    expect(canSeeOwnerStudio({ email: "member@example.com", role: "user" })).toBe(false);
  });
});
