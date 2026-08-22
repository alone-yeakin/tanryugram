import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const homeSource = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const panelsSource = readFileSync(resolve(process.cwd(), "client/src/components/TanryugramPanels.tsx"), "utf8");

describe("content moderation and native reels contracts", () => {
  it("keeps per-account media permissions owner-only and server enforced", () => {
    expect(routerSource).toContain("setUserMediaPermissions: ownerOnly");
    expect(routerSource).toContain("getUserMediaPermissions(userId)");
    expect(routerSource).toContain("Posting is currently disabled for this account");
    expect(routerSource).toContain("Photo posting is currently disabled for this account");
    expect(routerSource).toContain("Video posting is currently disabled for this account");
    expect(panelsSource).toContain("Posting permissions");
    expect(panelsSource).toContain("Manual access");
  });

  it("supports sensitive reports with immediate hiding and owner review", () => {
    expect(routerSource).toContain("reports: router");
    expect(routerSource).toContain("child_abuse");
    expect(routerSource).toContain("auto_hidden");
    expect(dbSource).toContain("submitContentReport");
    expect(dbSource).toContain("contentHidden: sensitive");
    expect(dbSource).toContain("isHidden: sensitive");
    expect(panelsSource).toContain("Reports & automatic hides");
    expect(homeSource).toContain("Report this");
  });

  it("removes external YouTube/Instagram feed dependencies from the Explore surface", () => {
    expect(homeSource).toContain("TanRyuGram Reels");
    expect(homeSource).toContain("aspect-[9/16]");
    expect(homeSource).not.toContain("youtube-nocookie.com");
    expect(homeSource).not.toContain("i.ytimg.com");
    expect(panelsSource).not.toContain("Connect Instagram");
  });
});
