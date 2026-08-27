import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and, or, ne, desc, asc, sql, inArray, count, like } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import * as relationSchema from "../drizzle/relations";
import { users, posts, postMedia, postReactions, comments, follows, followRequests, groups, groupMembers, groupMessages, groupJoinRequests, groupPolls, groupPollOptions, groupPollVotes, groupEvents, groupEventRsvps, groupAuditEvents, userSettings, conversationSettings, typingStatus, likes, mediaUploadPolicy, emailDeliverySettings, recoverySupportSettings, recoverySupportRequests, groupInviteRequests, recoverySupportMessages, messageHidden, messageReactions, messages, notifications, privateOwnerFollowers, badgeApplications, pushTokens, saves, stories, storyViews, subscriptions, tips, userMediaPermissions, contentReports, reelSubmissions, reelLikes, reelViews, reelBookmarks, reelComments, reelCommentLikes, dailyReelAnalytics, reelPromotions, contentAppeals, contentReportRateLimits, moderationAuditLog, platformPaymentSettings, badgeMarketplaceSettings, userBadges, platformSettings, type InsertPost, type InsertUser } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

const drizzleSchema = { ...schema, ...relationSchema };

let connection: mysql.Connection | null = null;
let dbInstance: MySql2Database<typeof drizzleSchema> | null = null;

export async function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!connection) {
    connection = await mysql.createConnection(url);
    dbInstance = drizzle(connection, { schema: drizzleSchema, mode: "default" });
  }
  return dbInstance;
}

// --- User & Profile Helpers ---

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const user = (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
  return user || null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const user = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
  return user || null;
}

export async function getUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function upsertUser(data: InsertUser) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, existing.id));
    return getUserById(existing.id);
  }
  const [inserted] = await db.insert(users).values(data);
  const userId = Number(inserted.insertId);
  await db.insert(userSettings).values({ userId });
  return getUserById(userId);
}

export async function updateUser(id: number, data: Partial<InsertUser & { themeColor?: string; customTextColor?: string; profileBannerUrl?: string | null; profileEffect?: string | null }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
  return getUserById(id);
}

export async function setUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function verifyUser(userId: number, value: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isVerified: value, badgeType: (value ? "blue" : "none") as any }).where(eq(users.id, userId));
}

export async function setUserBadge(userId: number, badgeType: "none" | "blue" | "black" | "gold" | "vip" | "founder" | "legend", isSecondary = false) {
  const db = await getDb();
  if (!db) return;
  if (isSecondary) {
    await db.update(users).set({ secondaryBadgeType: badgeType as any }).where(eq(users.id, userId));
  } else {
    await db.update(users).set({ badgeType: badgeType as any, isVerified: badgeType === "blue" }).where(eq(users.id, userId));
  }
}

export async function setUserCreator(userId: number, value: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isCreator: value }).where(eq(users.id, userId));
}

export async function setDisplayedFollowersCount(userId: number, count: number | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ displayedFollowersCount: count }).where(eq(users.id, userId));
}

export async function getBadgeApplications(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({ application: badgeApplications, user: users }).from(badgeApplications).innerJoin(users, eq(badgeApplications.userId, users.id));
  if (userId) return query.where(eq(badgeApplications.userId, userId)).orderBy(desc(badgeApplications.createdAt));
  return query.orderBy(desc(badgeApplications.createdAt)).limit(100);
}

export async function applyForBadge(userId: number, requestedBadge: "blue" | "black" | "gold" | "vip" | "founder" | "legend", reason?: string) {
  const db = await getDb();
  if (!db) return undefined;
  const pending = (await db.select().from(badgeApplications).where(and(eq(badgeApplications.userId, userId), eq(badgeApplications.status, "pending"), eq(badgeApplications.requestedBadge, requestedBadge))).limit(1))[0];
  if (pending) return pending.id;
  return (await db.insert(badgeApplications).values({ userId, requestedBadge, reason: reason || null }))[0]?.insertId;
}

export async function reviewBadgeApplication(applicationId: number, reviewerId: number, status: "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  const application = (await db.select().from(badgeApplications).where(eq(badgeApplications.id, applicationId)).limit(1))[0];
  if (!application) return;
  await db.update(badgeApplications).set({ status, reviewedBy: reviewerId, reviewedAt: new Date() }).where(eq(badgeApplications.id, applicationId));
  if (status === "approved") {
    const user = await getUserById(application.userId);
    if (!user) return;
    if (application.requestedBadge === "blue") {
      await db.update(users).set({ badgeType: "blue", isVerified: true }).where(eq(users.id, user.id));
    } else if (user.badgeType === "blue") {
      await db.update(users).set({ secondaryBadgeType: application.requestedBadge as any }).where(eq(users.id, user.id));
    } else {
      await db.update(users).set({ badgeType: application.requestedBadge as any }).where(eq(users.id, user.id));
    }
    await db.insert(userBadges).values({ userId: user.id, badgeType: application.requestedBadge });
  }
}

// --- Settings & Policy Helpers ---

export async function getMediaUploadPolicy() {
  const db = await getDb();
  if (!db) return { photosEnabled: true, profilePhotosEnabled: true, videosEnabled: false };
  const policy = (await db.select().from(mediaUploadPolicy).limit(1))[0];
  return policy || { photosEnabled: true, profilePhotosEnabled: true, videosEnabled: false };
}

export async function setMediaUploadPolicy(policy: { photosEnabled: boolean; profilePhotosEnabled: boolean; videosEnabled: boolean }, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(mediaUploadPolicy).limit(1))[0];
  if (existing) {
    await db.update(mediaUploadPolicy).set({ ...policy, updatedBy: userId }).where(eq(mediaUploadPolicy.id, existing.id));
  } else {
    await db.insert(mediaUploadPolicy).values({ ...policy, updatedBy: userId });
  }
  return await getMediaUploadPolicy();
}

export async function getEmailDeliverySettings() {
  const db = await getDb();
  if (!db) return { emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false };
  const settings = (await db.select().from(emailDeliverySettings).limit(1))[0];
  return settings || { emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false };
}

export async function setEmailDeliverySettings(settings: { emailDeliveryEnabled: boolean; signupVerificationEnabled: boolean; appScriptLoginEnabled: boolean; appScriptResetEnabled: boolean }, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(emailDeliverySettings).limit(1))[0];
  if (existing) {
    await db.update(emailDeliverySettings).set({ ...settings, updatedBy: userId }).where(eq(emailDeliverySettings.id, existing.id));
  } else {
    await db.insert(emailDeliverySettings).values({ ...settings, updatedBy: userId });
  }
  return await getEmailDeliverySettings();
}

export async function getPlatformPaymentSettings() {
  const db = await getDb();
  if (!db) return { paypalEmail: null, bkashNumber: null, nagadNumber: null, instructions: null };
  const settings = (await db.select().from(platformPaymentSettings).limit(1))[0];
  return settings || { paypalEmail: null, bkashNumber: null, nagadNumber: null, instructions: null };
}

export async function setPlatformPaymentSettings(settings: { paypalEmail?: string | null; bkashNumber?: string | null; nagadNumber?: string | null; instructions?: string | null }, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(platformPaymentSettings).limit(1))[0];
  if (existing) {
    await db.update(platformPaymentSettings).set({ ...settings, updatedBy: userId }).where(eq(platformPaymentSettings.id, existing.id));
  } else {
    await db.insert(platformPaymentSettings).values({ ...settings, updatedBy: userId });
  }
  return await getPlatformPaymentSettings();
}

export async function getPlatformSettings() {
  const db = await getDb();
  if (!db) return { eventTheme: null };
  const settings = (await db.select().from(platformSettings).limit(1))[0];
  return settings || { eventTheme: null };
}

export async function setPlatformSetting(settings: { eventTheme: string | null }, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(platformSettings).limit(1))[0];
  if (existing) {
    await db.update(platformSettings).set({ ...settings, updatedBy: userId }).where(eq(platformSettings.id, existing.id));
  } else {
    await db.insert(platformSettings).values({ ...settings, updatedBy: userId });
  }
  return await getPlatformSettings();
}

export async function getBadgeMarketplaceSettings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(badgeMarketplaceSettings);
}

export async function setBadgeMarketplaceSetting(badgeType: "blue" | "black" | "gold" | "vip" | "founder" | "legend", isPaid: boolean, price: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(badgeMarketplaceSettings).where(eq(badgeMarketplaceSettings.badgeType, badgeType)).limit(1))[0];
  if (existing) {
    await db.update(badgeMarketplaceSettings).set({ isPaid, price, updatedBy: userId }).where(eq(badgeMarketplaceSettings.badgeType, badgeType));
  } else {
    await db.insert(badgeMarketplaceSettings).values({ badgeType, isPaid, price, updatedBy: userId });
  }
}

// --- Content & Reels Helpers ---

export function attachPostRelations(
  postRows: (typeof posts.$inferSelect)[],
  userRows: (typeof users.$inferSelect)[],
  mediaRows: (typeof postMedia.$inferSelect)[],
) {
  const usersById = new Map(userRows.map((user) => [user.id, user]));
  const mediaByPostId = new Map<number, (typeof mediaRows)>();
  for (const media of mediaRows) {
    const existing = mediaByPostId.get(media.postId) ?? [];
    existing.push(media);
    mediaByPostId.set(media.postId, existing);
  }

  return postRows.map((post) => ({
    ...post,
    user: usersById.get(post.userId) ?? null,
    media: mediaByPostId.get(post.id) ?? [],
  }));
}

export async function getPosts() {
  const db = await getDb();
  if (!db) return [];

  // Avoid Drizzle's relational JSON/LATERAL query here. Some deployed MySQL-compatible
  // runtimes reject that generated SQL even though the underlying tables are healthy.
  // Explicit batched selects keep the public feed portable and retain the same contract.
  const postRows = await db.select().from(posts).orderBy(desc(posts.createdAt));
  if (!postRows.length) return [];

  const postIds = postRows.map((post) => post.id);
  const userIds = Array.from(new Set(postRows.map((post) => post.userId).filter((id): id is number => Number.isFinite(id))));
  const [mediaRows, userRows] = await Promise.all([
    postIds.length ? db.select().from(postMedia).where(inArray(postMedia.postId, postIds)).orderBy(asc(postMedia.sortOrder)) : Promise.resolve([]),
    userIds.length ? db.select().from(users).where(inArray(users.id, userIds)) : Promise.resolve([]),
  ]);

  return attachPostRelations(postRows, userRows, mediaRows);
}

export async function deletePostAsUser(postId: number, userId: number, isAdmin: boolean) {
  const db = await getDb();
  if (!db) return;
  const post = (await db.select().from(posts).where(eq(posts.id, postId)).limit(1))[0];
  if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
  if (!isAdmin && post.userId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own posts" });
  await db.delete(postMedia).where(eq(postMedia.postId, postId));
  await db.delete(postReactions).where(eq(postReactions.postId, postId));
  await db.delete(comments).where(eq(comments.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));
}

export async function createNotification(data: { userId: number; actorId: number; type: any; targetId?: number; content: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ report: contentReports, reporter: users }).from(contentReports).innerJoin(users, eq(contentReports.reporterId, users.id)).orderBy(desc(contentReports.createdAt)).limit(100);
}

export async function getAppeals() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ appeal: contentAppeals, appellant: users }).from(contentAppeals).innerJoin(users, eq(contentAppeals.appellantId, users.id)).orderBy(desc(contentAppeals.createdAt)).limit(100);
}

export async function getReels() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ reel: reelSubmissions, user: users }).from(reelSubmissions).innerJoin(users, eq(reelSubmissions.userId, users.id)).orderBy(desc(reelSubmissions.createdAt)).limit(100);
}

export async function getAuditLog() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ log: moderationAuditLog, actor: users }).from(moderationAuditLog).leftJoin(users, eq(moderationAuditLog.actorId, users.id)).orderBy(desc(moderationAuditLog.createdAt)).limit(200);
}

export async function reviewReport(reportId: number, actorId: number, status: "reviewed" | "dismissed") {
  const db = await getDb();
  if (!db) return;
  await db.update(contentReports).set({ status }).where(eq(contentReports.id, reportId));
  await db.insert(moderationAuditLog).values({ actorId, action: `report_${status}`, targetType: "report", targetId: reportId });
}

export async function reviewReel(reelId: number, actorId: number, status: "approved" | "rejected", note?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(reelSubmissions).set({ status, reviewNote: note || null, reviewedAt: new Date() }).where(eq(reelSubmissions.id, reelId));
  await db.insert(moderationAuditLog).values({ actorId, action: `reel_${status}`, targetType: "reel", targetId: reelId, details: note });
}

export async function reviewAppeal(appealId: number, actorId: number, status: "approved" | "rejected", response?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(contentAppeals).set({ status, response: response || null, reviewedAt: new Date() }).where(eq(contentAppeals.id, appealId));
  await db.insert(moderationAuditLog).values({ actorId, action: `appeal_${status}`, targetType: "appeal", targetId: appealId, details: response });
}

export async function getUserMediaPermissions(userId: number) {
  const db = await getDb();
  if (!db) return { postsEnabled: true, photosEnabled: true, videosEnabled: true, reelsEnabled: true, storiesEnabled: true };
  const perms = (await db.select().from(userMediaPermissions).where(eq(userMediaPermissions.userId, userId)).limit(1))[0];
  return perms || { postsEnabled: true, photosEnabled: true, videosEnabled: true, reelsEnabled: true, storiesEnabled: true };
}

// --- Conversation Helpers ---

export async function getConversationSettings(userId: number, peerId: number) {
  const db = await getDb();
  if (!db) return { userId, peerId, isPinned: false, isArchived: false, isMuted: false, themeColor: "#8b5cf6", nickname: null };
  return (await db.select().from(conversationSettings).where(and(eq(conversationSettings.userId, userId), eq(conversationSettings.peerId, peerId))).limit(1))[0] ?? { userId, peerId, isPinned: false, isArchived: false, isMuted: false, themeColor: "#8b5cf6", nickname: null };
}

export async function updateConversationSettings(userId: number, peerId: number, settings: Partial<{ isPinned: boolean; isArchived: boolean; isMuted: boolean; themeColor: string; nickname: string | null }>) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(conversationSettings).where(and(eq(conversationSettings.userId, userId), eq(conversationSettings.peerId, peerId))).limit(1))[0];
  if (existing) {
    await db.update(conversationSettings).set({ ...settings, nickname: settings.nickname === undefined ? undefined : (settings.nickname?.trim() || null) }).where(eq(conversationSettings.id, existing.id));
  } else {
    await db.insert(conversationSettings).values({ userId, peerId, ...settings as any, nickname: settings.nickname?.trim() || null });
  }
}

export async function getRecoverySupportSettings() {
  const db = await getDb();
  if (!db) return { guestRecoveryEnabled: false, whatsappSupportEnabled: false, whatsappSupportNumber: "+8801404841981" };
  const settings = (await db.select().from(recoverySupportSettings).limit(1))[0];
  return settings || { guestRecoveryEnabled: false, whatsappSupportEnabled: false, whatsappSupportNumber: "+8801404841981" };
}

export async function setRecoverySupportSettings(settings: { guestRecoveryEnabled: boolean; whatsappSupportEnabled: boolean; whatsappSupportNumber: string }, userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(recoverySupportSettings).limit(1))[0];
  if (existing) {
    await db.update(recoverySupportSettings).set({ ...settings, updatedBy: userId }).where(eq(recoverySupportSettings.id, existing.id));
  } else {
    await db.insert(recoverySupportSettings).values({ ...settings, updatedBy: userId });
  }
  return await getRecoverySupportSettings();
}

export async function getRecoveryInbox() {
  const db = await getDb();
  if (!db) return [];
  const requests = await db.select().from(recoverySupportRequests).orderBy(desc(recoverySupportRequests.lastMessageAt), desc(recoverySupportRequests.createdAt)).limit(50);
  if (!requests.length) return [];
  
  const requestIds = requests.map(r => r.id);
  const msgs = await db.select().from(recoverySupportMessages).where(inArray(recoverySupportMessages.requestId, requestIds)).orderBy(asc(recoverySupportMessages.createdAt));
  
  const messagesByRequestId = new Map<number, (typeof recoverySupportMessages.$inferSelect)[]>();
  for (const m of msgs) {
    const existing = messagesByRequestId.get(m.requestId) ?? [];
    existing.push(m);
    messagesByRequestId.set(m.requestId, existing);
  }
  
  return requests.map(r => ({ ...r, messages: messagesByRequestId.get(r.id) ?? [] }));
}

export async function replyRecovery(requestId: number, body: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(recoverySupportMessages).values({ requestId, senderType: "owner", body });
  await db.update(recoverySupportRequests).set({ lastMessageAt: new Date() }).where(eq(recoverySupportRequests.id, requestId));
}

export async function closeRecovery(requestId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(recoverySupportRequests).set({ status: "closed" }).where(eq(recoverySupportRequests.id, requestId));
}
