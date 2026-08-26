import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const panels = readFileSync(resolve(process.cwd(), "client/src/components/TanryugramPanels.tsx"), "utf8");

describe("Reel engagement and promotion contracts", () => {
  it("implements double-tap likes and real counts", () => {
    expect(router).toContain("toggleLike");
    expect(db).toContain("toggleReelLike");
    expect(db).toContain("getReelLikeCounts");
    expect(schema).toContain("reelLikes");
    expect(home).toContain("handleDoubleTap");
    expect(home).toContain("setShowHeart(true)");
  });

  it("supports native sharing with Explore links", () => {
    expect(home).toContain("handleShare");
    expect(home).toContain("navigator.share");
    expect(home).toContain("view=explore&reel=");
  });

  it("provides deep-linked notification navigation", () => {
    expect(home).toContain('if (type.startsWith("reel_")) { setView("explore"); }');
    expect(home).toContain('else if (type.startsWith("appeal_")) { window.location.href = "/safety"; }');
  });

  it("implements a transparent owner Promotion Studio", () => {
    expect(router).toContain("reelsPromotions");
    expect(router).toContain("setReelPromotion");
    expect(db).toContain("getReelPromotions");
    expect(db).toContain("setReelPromotion");
    expect(db).toContain("isPromoted: true");
    expect(schema).toContain("reelPromotions");
    expect(panels).toContain("Promotion Studio");
    expect(panels).toContain("Campaign Management");
    expect(panels).toContain("Priority (1-10)");
    expect(home).toContain("isPromoted &&");
  });
});
