import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const overlaySource = readFileSync(resolve(root, "client/src/components/TanryugramAdvancedFeatures.tsx"), "utf8");
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const homeSource = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");

describe("call reliability contracts", () => {
  it("plays the remote media stream explicitly when the track arrives", () => {
    expect(overlaySource).toContain("remoteAudio.current.play()");
    expect(overlaySource).toContain("setAudioReady(true)");
    expect(overlaySource).toContain('video ref={remoteVideo} autoPlay muted playsInline');
  });

  it("shortens the blocking ICE gathering wait and reports connection state", () => {
    expect(overlaySource).toContain("waitForIceGathering(pc)");
    expect(overlaySource).toContain("timeoutMs = 1800");
    expect(overlaySource).toContain('setConnectionState("connected")');
  });

  it("closes the local overlay when the server reports a terminal remote state", () => {
    expect(overlaySource).toContain('if (!status || status === "pending" || status === "accepted" || ending) return;');
    expect(overlaySource).toContain("cleanupMedia();");
    expect(overlaySource).toContain("onClose();");
    expect(overlaySource).toContain('setShowEnded(true);');
  });

  it("limits call reads, signaling, and status updates to call participants", () => {
    expect(routerSource).toContain("or(eq(calls.callerId, ctx.user.id), eq(calls.receiverId, ctx.user.id))");
    expect(routerSource).toContain('message: "Call not found or access denied."');
  });

  it("uses responsive incoming-call polling from the shared call constants", () => {
    expect(homeSource).toContain('refetchInterval: CALL_POLL_INTERVALS.incoming');
  });
});

