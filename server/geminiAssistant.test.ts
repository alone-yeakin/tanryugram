import { describe, expect, it } from "vitest";
import { applySafeGeminiActions } from "./geminiAssistant";

const current = { emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false, photosEnabled: true, videosEnabled: false };

describe("Gemini safe actions", () => {
  it("applies only the explicitly supported Creator Studio settings", () => {
    const next = applySafeGeminiActions(["enable_signup_verification", "enable_appscript_reset", "disable_video_uploads"], current);
    expect(next.signupVerificationEnabled).toBe(true);
    expect(next.appScriptResetEnabled).toBe(true);
    expect(next.videosEnabled).toBe(false);
    expect(next.photosEnabled).toBe(true);
  });

  it("rejects verification when email delivery is disabled", () => {
    expect(() => applySafeGeminiActions(["disable_email_delivery", "enable_signup_verification"], current)).toThrow(/email delivery/i);
  });

  it("does not alter the original settings object", () => {
    const original = { ...current };
    applySafeGeminiActions(["enable_appscript_login"], current);
    expect(current).toEqual(original);
  });
});
