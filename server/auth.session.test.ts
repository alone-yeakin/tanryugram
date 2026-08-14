import { describe, expect, it } from "vitest";
import { sanitizeAuthUser } from "./routers";

describe("native auth session responses", () => {
  it("removes passwordHash while preserving the public account fields", () => {
    expect(sanitizeAuthUser({ id: 7, email: "person@example.com", passwordHash: "secret-hash", username: "person" })).toEqual({
      id: 7,
      email: "person@example.com",
      username: "person",
    });
  });
});
