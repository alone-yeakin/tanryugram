import { and, eq, inArray } from "drizzle-orm";
import {
  badgeApplications,
  calls,
  comments,
  conversationSettings,
  follows,
  groupAuditEvents,
  groupEventRsvps,
  groupEvents,
  groupInviteRequests,
  groupJoinRequests,
  groupMembers,
  groupMessages,
  groupPollOptions,
  groupPollVotes,
  groupPolls,
  groups,
  groupMessages as groupMessagesTable,
  likes,
  messageHidden,
  messageReactions,
  messages,
  notifications,
  postMedia,
  postReactions,
  posts,
  privateOwnerFollowers,
  saves,
  stories,
  storyViews,
  subscriptions,
  tips,
  userSettings,
  users,
  type User,
} from "../drizzle/schema";
import { getDb } from "./db";

export const USER_MIGRATION_VERSION = 1;
export const USER_MIGRATION_MAX_BYTES = 45 * 1024 * 1024;

export type UserMigrationArchive = {
  format: "tanryugram-user-migration";
  version: number;
  exportedAt: string;
  security: {
    passwordsIncluded: false;
    sessionsIncluded: false;
    verificationCodesIncluded: false;
    pushTokensIncluded: false;
    paymentIdentifiersIncluded: false;
  };
  records: Record<string, unknown[]>;
};

const sanitizeUser = (user: User) => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { ...safeUser, passwordHash: null };
};

const sanitizeCalls = (rows: any[]) => rows.map(({ signalData: _signalData, ...row }) => ({ ...row, signalData: null }));
const sanitizeSubscriptions = (rows: any[]) => rows.map(({ stripeSubscriptionId: _stripeSubscriptionId, ...row }) => ({ ...row, stripeSubscriptionId: null }));
const sanitizeTips = (rows: any[]) => rows.map(({ stripePaymentIntentId: _stripePaymentIntentId, ...row }) => ({ ...row, stripePaymentIntentId: null }));

async function selectAll(database: any, table: any) {
  return database.select().from(table);
}

export async function buildUserMigrationArchive(): Promise<UserMigrationArchive> {
  const database = await getDb();
  if (!database) throw new Error("Database is unavailable");
  const [userRows, postRows, postMediaRows, postReactionRows, commentRows, groupRows, groupMemberRows, groupMessageRows, joinRows, inviteRows, pollRows, pollOptionRows, pollVoteRows, eventRows, eventRsvpRows, auditRows, settingRows, likeRows, saveRows, followRows, badgeRows, ownerFollowerRows, storyRows, storyViewRows, messageRows, messageReactionRows, hiddenRows, callRows, subscriptionRows, tipRows, notificationRows, conversationRows] = await Promise.all([
    selectAll(database, users), selectAll(database, posts), selectAll(database, postMedia), selectAll(database, postReactions), selectAll(database, comments), selectAll(database, groups), selectAll(database, groupMembers), selectAll(database, groupMessagesTable), selectAll(database, groupJoinRequests), selectAll(database, groupInviteRequests), selectAll(database, groupPolls), selectAll(database, groupPollOptions), selectAll(database, groupPollVotes), selectAll(database, groupEvents), selectAll(database, groupEventRsvps), selectAll(database, groupAuditEvents), selectAll(database, userSettings), selectAll(database, likes), selectAll(database, saves), selectAll(database, follows), selectAll(database, badgeApplications), selectAll(database, privateOwnerFollowers), selectAll(database, stories), selectAll(database, storyViews), selectAll(database, messages), selectAll(database, messageReactions), selectAll(database, messageHidden), selectAll(database, calls), selectAll(database, subscriptions), selectAll(database, tips), selectAll(database, notifications), selectAll(database, conversationSettings),
  ]);
  return {
    format: "tanryugram-user-migration",
    version: USER_MIGRATION_VERSION,
    exportedAt: new Date().toISOString(),
    security: { passwordsIncluded: false, sessionsIncluded: false, verificationCodesIncluded: false, pushTokensIncluded: false, paymentIdentifiersIncluded: false },
    records: {
      users: userRows.map(sanitizeUser), posts: postRows, postMedia: postMediaRows, postReactions: postReactionRows, comments: commentRows,
      groups: groupRows, groupMembers: groupMemberRows, groupMessages: groupMessageRows, groupJoinRequests: joinRows, groupInviteRequests: inviteRows,
      groupPolls: pollRows, groupPollOptions: pollOptionRows, groupPollVotes: pollVoteRows, groupEvents: eventRows, groupEventRsvps: eventRsvpRows, groupAuditEvents: auditRows,
      userSettings: settingRows, likes: likeRows, saves: saveRows, follows: followRows, badgeApplications: badgeRows, privateOwnerFollowers: ownerFollowerRows,
      stories: storyRows, storyViews: storyViewRows, messages: messageRows, messageReactions: messageReactionRows, messageHidden: hiddenRows,
      calls: sanitizeCalls(callRows), subscriptions: sanitizeSubscriptions(subscriptionRows), tips: sanitizeTips(tipRows), notifications: notificationRows, conversationSettings: conversationRows,
    },
  };
}

const tableOrder: Array<[string, any]> = [
  ["users", users], ["groups", groups], ["userSettings", userSettings], ["posts", posts], ["postMedia", postMedia], ["postReactions", postReactions], ["comments", comments],
  ["groupMembers", groupMembers], ["groupJoinRequests", groupJoinRequests], ["groupInviteRequests", groupInviteRequests], ["groupMessages", groupMessages], ["groupPolls", groupPolls], ["groupPollOptions", groupPollOptions], ["groupPollVotes", groupPollVotes], ["groupEvents", groupEvents], ["groupEventRsvps", groupEventRsvps], ["groupAuditEvents", groupAuditEvents],
  ["likes", likes], ["saves", saves], ["follows", follows], ["badgeApplications", badgeApplications], ["privateOwnerFollowers", privateOwnerFollowers], ["stories", stories], ["storyViews", storyViews], ["messages", messages], ["messageReactions", messageReactions], ["messageHidden", messageHidden], ["calls", calls], ["subscriptions", subscriptions], ["tips", tips], ["notifications", notifications], ["conversationSettings", conversationSettings],
];

function validateArchive(input: unknown): asserts input is UserMigrationArchive {
  if (!input || typeof input !== "object") throw new Error("Migration file must contain a JSON object");
  const archive = input as Partial<UserMigrationArchive>;
  if (archive.format !== "tanryugram-user-migration" || archive.version !== USER_MIGRATION_VERSION || !archive.records || typeof archive.records !== "object") throw new Error("Unsupported or invalid TanRyuGram migration archive");
  const size = Buffer.byteLength(JSON.stringify(input), "utf8");
  if (size > USER_MIGRATION_MAX_BYTES) throw new Error("Migration archive is larger than the 45 MB safety limit");
  if (!archive.security || archive.security.passwordsIncluded || archive.security.sessionsIncluded || archive.security.verificationCodesIncluded) throw new Error("This archive contains prohibited security data");
  for (const [name] of tableOrder) if (!Array.isArray(archive.records[name])) throw new Error(`Archive is missing the ${name} record list`);
}

export async function inspectUserMigrationArchive(input: unknown) {
  validateArchive(input);
  const records = input.records;
  return { version: input.version, exportedAt: input.exportedAt, users: records.users.length, posts: records.posts.length, messages: records.messages.length, groups: records.groups.length, groupMessages: records.groupMessages.length, mediaReferences: records.posts.length + records.postMedia.length + records.groupMessages.filter((row: any) => Boolean(row.mediaUrl)).length + records.stories.length, relationships: records.follows.length + records.likes.length + records.postReactions.length + records.messageReactions.length, bytes: Buffer.byteLength(JSON.stringify(input), "utf8") };
}

export async function importUserMigrationArchive(input: unknown) {
  validateArchive(input);
  const database = await getDb();
  if (!database) throw new Error("Database is unavailable");
  const archiveUsers = input.records.users as any[];
  const existingUsers = await database.select({ id: users.id, openId: users.openId, email: users.email }).from(users);
  const existingOpenIds = new Set(existingUsers.map((row: any) => row.openId));
  const conflicts = archiveUsers.filter((row) => existingOpenIds.has(row.openId));
  if (conflicts.length) throw new Error(`${conflicts.length} user identities already exist. Import this archive into a fresh destination or remove the conflicting identities first.`);
  let inserted = 0;
  for (const [name, table] of tableOrder) {
    const rows = input.records[name] as any[];
    if (!rows.length) continue;
    await database.insert(table).values(rows as any);
    inserted += rows.length;
  }
  return { inserted, users: archiveUsers.length, reactivationRequired: archiveUsers.length, message: "Imported history successfully. Every imported account must complete a password reset before signing in." };
}
