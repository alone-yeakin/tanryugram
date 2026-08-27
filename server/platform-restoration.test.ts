import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const routerSource = readFileSync(resolve(projectRoot, "server/routers.ts"), "utf8");
const databaseSource = readFileSync(resolve(projectRoot, "server/db.ts"), "utf8");
const homeSource = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
const studioSource = readFileSync(resolve(projectRoot, "client/src/components/TanryugramPanels.tsx"), "utf8");

describe("platform restoration contracts", () => {
  it("exposes persisted follow and request state with protected profile-list reads", () => {
    expect(routerSource).toContain("state: protectedProcedure.input(z.object({ userId: z.number() }))");
    expect(routerSource).toContain("requestState: protectedProcedure.input(z.object({ userId: z.number() }))");
    expect(routerSource).toContain("followers: protectedProcedure.input(z.object({ userId: z.number() }))");
    expect(routerSource).toContain("following: protectedProcedure.input(z.object({ userId: z.number() }))");
    expect(routerSource).toContain("followRequests");
  });

  it("keeps follow controls responsive and profile-list navigation inside the supported app view", () => {
    expect(homeSource).toContain("const [followOverride, setFollowOverride]");
    expect(homeSource).toContain("utils.profile.byId.invalidate({ userId: targetUserId })");
    expect(homeSource).toContain("const people = (Array.isArray(rows) ? rows : [])");
    expect(homeSource).toContain("setNavigatedProfile(person)");
    expect(homeSource).not.toContain("window.history.pushState({}, \"\", `/profile/${person.id}`)");
  });

  it("restores owner-managed per-user publishing controls in both the studio and server enforcement", () => {
    expect(databaseSource).toContain("mediaPermissions: permissionsByUserId.get(user.id)");
    expect(routerSource).toContain("setUserMediaPermissions: adminOnly");
    expect(routerSource).toContain("setContentHidden: adminOnly");
    expect(routerSource).toContain("assertUserCanCreateContent(ctx.user.id, \"post\")");
    expect(routerSource).toContain("assertUserCanCreateContent(ctx.user.id, \"reel\", \"video/mp4\")");
    expect(routerSource).toContain("assertUserCanCreateContent(ctx.user.id, \"story\"");
    expect(studioSource).toContain("Publishing access");
    expect(studioSource).toContain("updateUserPublishingAccess");
    expect(studioSource).toContain("Account publishing paused");
  });

  it("provides a non-destructive reload action for the platform shell", () => {
    expect(homeSource).toContain("const reloadPlatformData = async () =>");
    expect(homeSource).toContain("TanRyuGram refreshed");
    expect(homeSource).toContain("view: \"reload\" as View");
  });
});
