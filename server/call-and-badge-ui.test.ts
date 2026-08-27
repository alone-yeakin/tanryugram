import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const overlaySource = readFileSync(resolve(root, "client/src/components/TanryugramAdvancedFeatures.tsx"), "utf8");
const messengerSource = readFileSync(resolve(root, "client/src/components/TanryugramMessengerAdvanced.tsx"), "utf8");
const homeSource = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const panelsSource = readFileSync(resolve(root, "client/src/components/TanryugramPanels.tsx"), "utf8");
const ringtoneSource = readFileSync(resolve(root, "client/src/lib/ringtone.ts"), "utf8");
const manifestSource = readFileSync(resolve(root, "android/app/src/main/AndroidManifest.xml"), "utf8");

describe("call controls and alert contracts", () => {
  it("exposes microphone and video state controls on the active call screen", () => {
    expect(overlaySource).toContain("aria-label={muted ? \"Unmute microphone\" : \"Mute microphone\"}");
    expect(overlaySource).toContain("aria-label={videoEnabled ? \"Disable video\" : \"Enable video\"}");
    expect(overlaySource).toContain("streamRef.current?.getAudioTracks()");
    expect(overlaySource).toContain("toggleVideo");
  });

  it("renders a readable in-chat call history and incoming alert", () => {
    expect(messengerSource).toContain("function CallHistoryLog");
    expect(messengerSource).toContain("Missed call");
    expect(messengerSource).toContain("Completed call");
    expect(messengerSource).toContain("startRingtoneLoop(ringtone)");
    expect(messengerSource).toContain('role="dialog"');
  });

  it("keeps the home incoming-call banner visibly ringing and uses the shared loop", () => {
    expect(homeSource).toContain("startRingtoneLoop(ringtone)");
    expect(homeSource).toContain('aria-live="assertive"');
    expect(homeSource).toContain("· ringing");
    expect(ringtoneSource).toContain("export function startRingtoneLoop");
    expect(ringtoneSource).toContain("context.resume()");
  });

  it("keeps manual badge assignment owner-only and exposes primary/secondary selectors", () => {
    expect(panelsSource).toContain("const assignBadge");
    expect(panelsSource).toContain("Primary<select");
    expect(panelsSource).toContain("Secondary<select");
    expect(panelsSource).toContain('assignBadge(u.id, event.target.value, true)');
  });

  it("keeps the Android wrapper prepared for notification-led incoming calls", () => {
    expect(manifestSource).toContain("android.permission.POST_NOTIFICATIONS");
    expect(manifestSource).toContain("android.permission.USE_FULL_SCREEN_INTENT");
    expect(manifestSource).toContain('android:launchMode="singleTask"');
    expect(manifestSource).toContain('android:showWhenLocked="true"');
  });
});
