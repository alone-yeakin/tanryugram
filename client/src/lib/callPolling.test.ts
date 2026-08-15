import { describe, expect, it } from "vitest";
import { CALL_POLL_INTERVALS, canTransitionCallStatus, shouldShowIncomingCall } from "./callPolling";

describe("Tanryugram call signaling", () => {
  it("keeps active and incoming polling responsive while relaxing history polling", () => {
    expect(CALL_POLL_INTERVALS.active).toBe(500);
    expect(CALL_POLL_INTERVALS.incoming).toBe(700);
    expect(CALL_POLL_INTERVALS.history).toBe(2500);
  });

  it("allows pending calls to accept, decline, miss, or end", () => {
    expect(canTransitionCallStatus("pending", "accepted")).toBe(true);
    expect(canTransitionCallStatus("pending", "declined")).toBe(true);
    expect(canTransitionCallStatus("pending", "missed")).toBe(true);
    expect(canTransitionCallStatus("pending", "ended")).toBe(true);
  });

  it("prevents terminal calls from being revived", () => {
    expect(canTransitionCallStatus("accepted", "ended")).toBe(true);
    expect(canTransitionCallStatus("ended", "accepted")).toBe(false);
    expect(canTransitionCallStatus("declined", "accepted")).toBe(false);
    expect(canTransitionCallStatus("missed", "ended")).toBe(false);
  });

  it("only shows a pending call that has not been dismissed", () => {
    expect(shouldShowIncomingCall({ id: 12, status: "pending" }, null)).toBe(true);
    expect(shouldShowIncomingCall({ id: 12, status: "pending" }, 12)).toBe(false);
    expect(shouldShowIncomingCall({ id: 12, status: "accepted" }, null)).toBe(false);
  });
});
