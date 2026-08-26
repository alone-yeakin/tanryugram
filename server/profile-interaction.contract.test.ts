import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const panels = readFileSync(resolve(process.cwd(), "client/src/components/TanryugramPanels.tsx"), "utf8");

describe("Profile interaction and analytics trends contracts", () => {
  it("implements Saved Reels tab and bookmarks", () => {
    expect(router).toContain("saved");
    expect(db).toContain("getMySavedReels");
    expect(schema).toContain("reelBookmarks");
    expect(home).toContain('activeTab === "saved"');
    expect(home).toContain("savedReelsQuery.data");
  });

  it("supports comment likes and direct user replies", () => {
    expect(router).toContain("toggleCommentLike");
    expect(router).toContain("parentId: z.number().int().positive().optional()");
    expect(db).toContain("toggleReelCommentLike");
    expect(db).toContain("parentId: parentId ?? null");
    expect(schema).toContain("reelCommentLikes");
    expect(home).toContain("ReelCommentsPanel");
    expect(home).toContain("comment.content");
  });

  it("provides visual seven-day engagement trend charts", () => {
    expect(router).toContain("reelTrends");
    expect(db).toContain("getReelSevenDayTrends");
    expect(db).toContain("dailyReelAnalytics");
    expect(schema).toContain("dailyReelAnalytics");
    expect(panels).toContain("7-Day Engagement Trend");
    expect(panels).toContain("trends.data.map");
    expect(panels).toContain("day.views + day.likes + day.comments");
  });
});
