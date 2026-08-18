import { describe, expect, it } from "vitest";
import { inspectUserMigrationArchive, USER_MIGRATION_VERSION } from "./userMigration";

const recordNames = ["users", "groups", "userSettings", "posts", "postMedia", "postReactions", "comments", "groupMembers", "groupJoinRequests", "groupInviteRequests", "groupMessages", "groupPolls", "groupPollOptions", "groupPollVotes", "groupEvents", "groupEventRsvps", "groupAuditEvents", "likes", "saves", "follows", "badgeApplications", "privateOwnerFollowers", "stories", "storyViews", "messages", "messageReactions", "messageHidden", "calls", "subscriptions", "tips", "notifications", "conversationSettings"] as const;

function archive(overrides: Record<string, unknown> = {}) {
  return {
    format: "tanryugram-user-migration",
    version: USER_MIGRATION_VERSION,
    exportedAt: new Date().toISOString(),
    security: { passwordsIncluded: false, sessionsIncluded: false, verificationCodesIncluded: false, pushTokensIncluded: false, paymentIdentifiersIncluded: false },
    records: Object.fromEntries(recordNames.map((name) => [name, []])),
    ...overrides,
  };
}

describe("user migration archive", () => {
  it("summarizes a complete portable archive", async () => {
    const result = await inspectUserMigrationArchive(archive({ records: { ...Object.fromEntries(recordNames.map((name) => [name, []])), users: [{ id: 1 }], posts: [{ id: 1 }], messages: [{ id: 1 }], groupMessages: [{ id: 1, mediaUrl: "/manus-storage/file" }], groups: [{ id: 1 }], follows: [{ id: 1 }], likes: [{ id: 1 }], postReactions: [{ id: 1 }], messageReactions: [{ id: 1 }], stories: [{ id: 1 }] } }));
    expect(result.users).toBe(1);
    expect(result.posts).toBe(1);
    expect(result.messages).toBe(1);
    expect(result.groups).toBe(1);
    expect(result.relationships).toBe(4);
    expect(result.mediaReferences).toBe(3);
  });

  it("rejects archives that claim to contain security credentials", async () => {
    await expect(inspectUserMigrationArchive(archive({ security: { passwordsIncluded: true, sessionsIncluded: false, verificationCodesIncluded: false, pushTokensIncluded: false, paymentIdentifiersIncluded: false } }))).rejects.toThrow(/prohibited security data/i);
  });

  it("rejects incomplete or incompatible archives", async () => {
    await expect(inspectUserMigrationArchive({ format: "wrong", version: 99, records: {} })).rejects.toThrow(/unsupported or invalid/i);
  });
});
