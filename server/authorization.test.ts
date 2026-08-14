import { describe, expect, it } from "vitest";
import { isTanryugramOwner, TANRYUGRAM_OWNER_OPEN_ID } from "./authorization";
import { ENV } from "./_core/env";

describe("Tanryugram owner authorization", () => {
  it("recognizes the configured session owner open ID", () => {
    expect(TANRYUGRAM_OWNER_OPEN_ID).toBe(ENV.ownerOpenId);
    expect(isTanryugramOwner(ENV.ownerOpenId)).toBe(Boolean(ENV.ownerOpenId));
  });

  it("rejects ordinary users, missing IDs, and lookalike IDs", () => {
    expect(isTanryugramOwner("member-open-id")).toBe(false);
    expect(isTanryugramOwner(`${ENV.ownerOpenId}-lookalike`)).toBe(false);
    expect(isTanryugramOwner(null)).toBe(false);
    expect(isTanryugramOwner(undefined)).toBe(false);
  });
});
