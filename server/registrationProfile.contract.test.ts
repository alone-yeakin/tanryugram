import { describe, expect, it } from "vitest";
import { userSettings, users } from "../drizzle/schema";

describe("registration profile contract", () => {
  it("keeps gender private and does not require a gendered avatar URL", () => {
    expect(userSettings.gender).toBeDefined();
    expect(users.avatarUrl).toBeDefined();
    expect((users as Record<string, unknown>).gender).toBeUndefined();
  });
});
