import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const companionSource = readFileSync(resolve(process.cwd(), "mobile-companion/App.tsx"), "utf8");
const integrationDocs = readFileSync(resolve(process.cwd(), "mobile-companion/CALL_NOTIFICATIONS.md"), "utf8");

describe("mobile companion integration contract", () => {
  it("keeps the native call bridge events and decline payload wired", () => {
    expect(companionSource).toContain("tanryugram-native-call-open");
    expect(companionSource).toContain("tanryugram-native-call-response");
    expect(companionSource).toContain('status: \"declined\"');
    expect(companionSource).toContain("tanryugram-native-push-token");
    expect(companionSource).toContain("getLastNotificationResponseAsync");
    expect(companionSource).toContain("requestCallMediaPermissions");
    expect(companionSource).toContain("PermissionsAndroid.PERMISSIONS.RECORD_AUDIO");
    expect(companionSource).toContain("Session expired · sign in again");
  });

  it("documents the shared WebRTC and push boundaries", () => {
    expect(integrationDocs).toContain("WebRTC");
    expect(integrationDocs).toContain("messages.signal");
    expect(integrationDocs).toContain("notifications.registerPushToken");
    expect(integrationDocs).toContain("shared server database");
    expect(integrationDocs).toContain("tanryugram-native-call-response");
  });
});
