import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const panelSource = readFileSync(resolve(root, "client/src/components/TanryugramPanels.tsx"), "utf8");

describe("Creator Studio familiar layout and recovery controls", () => {
  it("keeps the core owner controls visible in a simple top control bar", () => {
    expect(panelSource).toContain("Your familiar control center");
    expect(panelSource).toContain('label: "Dashboard"');
    expect(panelSource).toContain('label: "Users & Passwords"');
    expect(panelSource).toContain('label: "Platform Settings"');
    expect(panelSource).not.toContain("lg:min-h-screen lg:w-64");
  });

  it("keeps newer tools available separately instead of replacing core controls", () => {
    expect(panelSource).toContain("Advanced tools");
    expect(panelSource).toContain('label: "Content & Safety"');
    expect(panelSource).toContain('label: "Promotion & Analytics"');
    expect(panelSource).toContain('label: "Audit Log"');
  });

  it("adds an owner-only password reset that never reveals existing credentials", () => {
    expect(routerSource).toContain("resetUserPassword: adminOnly");
    expect(routerSource).toContain("newPassword: z.string().min(8).max(128)");
    expect(routerSource).toContain('action: "owner_password_reset"');
    expect(routerSource).toContain("password value is never stored in this log");
    expect(routerSource).toContain("list: adminOnly.query(async () => (await db.getUsers()).map(sanitizeAuthUser))");
    expect(panelSource).toContain("Reset a user password");
    expect(panelSource).toContain("The previous password is never displayed or saved");
  });
});
