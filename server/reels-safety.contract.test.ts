import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
const uploader = readFileSync(resolve(process.cwd(), "client/src/components/TanryugramPanels.tsx"), "utf8");
const safety = readFileSync(resolve(process.cwd(), "client/src/pages/SafetyPolicy.tsx"), "utf8");

describe("Reels and safety workflow contracts", () => {
  it("validates portrait Reels and tracks approval status", () => {
    expect(router).toContain('purpose: z.enum(["post", "profile", "reel"])');
    expect(router).toContain("9:16 portrait aspect ratio");
    expect(router).toContain("reviewReel");
    expect(schema).toContain('mysqlEnum("status", ["pending", "approved", "rejected"])');
    expect(uploader).toContain("Submit a 9:16 short video");
    expect(uploader).toContain('purpose: "reel"');
    expect(uploader).toContain("Your submission status");
  });

  it("limits reports and records moderation and appeal decisions", () => {
    expect(db).toContain("consumeReportRateLimit");
    expect(db).toContain("existing.reportCount >= 5");
    expect(db).toContain("addModerationAudit");
    expect(router).toContain("TOO_MANY_REQUESTS");
    expect(router).toContain("auditLog");
    expect(safety).toContain("Appeal hidden content");
    expect(safety).toContain("Submit appeal");
  });
});
