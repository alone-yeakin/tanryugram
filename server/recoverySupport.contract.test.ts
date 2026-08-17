import { describe, expect, it } from "vitest";
import { recoverySupportMessages, recoverySupportRequests, recoverySupportSettings } from "../drizzle/schema";

describe("recovery support contract", () => {
  it("stores only time-limited guest support metadata and messages", () => {
    expect(recoverySupportSettings.guestRecoveryEnabled).toBeDefined();
    expect(recoverySupportSettings.whatsappSupportEnabled).toBeDefined();
    expect(recoverySupportSettings.whatsappSupportNumber).toBeDefined();
    expect(recoverySupportRequests.guestTokenHash).toBeDefined();
    expect(recoverySupportRequests.expiresAt).toBeDefined();
    expect(recoverySupportMessages.body).toBeDefined();
    expect((recoverySupportRequests as Record<string, unknown>).password).toBeUndefined();
  });
});
