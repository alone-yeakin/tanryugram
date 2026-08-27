import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const features = readFileSync(resolve(process.cwd(), "client/src/components/TanryugramAdvancedFeatures.tsx"), "utf8");

describe("startup data safety contracts", () => {
  it("only selects incoming calls that contain a usable call id", () => {
    expect(home).toContain("find((row: any) => Number(row?.call?.id || 0) > 0)");
    expect(home).toContain("if (!call?.id) return []");
  });

  it("filters malformed stories and reactions before rendering mapped rows", () => {
    expect(features).toContain("rows.flatMap((row: any)");
    expect(features).toContain("if (!story?.id) return []");
    expect(features).toContain("entry?.reaction?.id && entry?.user?.id");
    expect(features).toContain("entry?.viewer?.id");
  });
});

