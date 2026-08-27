import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { isTanryugramOwner } from "./authorization";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { sendVerificationEmail } from "./gmailMailer";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { storagePresignPut, storagePut } from "./storage";
import * as db from "./db";
import { eq, and, count, desc, sql, or, ne, inArray, lt, like, asc, isNull, isNotNull, gt, aliasedTable } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { sendIncomingCallPush } from "./firebaseAdmin";
import { checkEmailCodeRateLimit } from "./emailRateLimit";
import { buildUserMigrationArchive, importUserMigrationArchive, inspectUserMigrationArchive, USER_MIGRATION_MAX_BYTES } from "./userMigration";
import { applySafeGeminiActions, generateGeminiChatReply, generateGeminiFeatureProposal } from "./geminiAssistant";
import { users, messages, emailVerificationCodes, userSettings, badgeMarketplaceSettings, badgeApplications, platformPaymentSettings, recoverySupportRequests, recoverySupportMessages, contentAppeals, follows, followRequests, reelSubmissions, reelBookmarks, contentReports, reelComments, reelLikes, reelViews, messageReactions, calls, notifications, comments, pushTokens, likes, saves, dailyReelAnalytics, postMedia, reelPromotions, userMediaPermissions, moderationAuditLog, groupMessages, groupEvents, groupPolls, groupPollOptions, groupJoinRequests, groupMembers, groups, groupInviteRequests, typingStatus, groupEventRsvps, groupPollVotes, conversationSettings, posts, stories, storyViews, storyReplies } from "../drizzle/schema";

const stripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe is not configured." });
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
};

const adminOnly = protectedProcedure.use(({ ctx, next }) => {
  if (!isTanryugramOwner(ctx.user)) throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const maintenanceGated = publicProcedure.use(async ({ ctx, next }) => {
  const settings = await db.getPlatformSettings();
  if (settings.maintenanceMode && !isTanryugramOwner(ctx.user)) {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "TanRyuGram is currently under maintenance. Please check back later." });
  }
  return next({ ctx });
});

const PHOTO_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
const IMAGE_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_CONTENT_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

async function assertUserCanCreateContent(userId: number, purpose: "profile" | "post" | "story" | "reel", contentType?: string) {
  const database = await db.getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const [author] = await database.select({ isBanned: users.isBanned, contentHidden: users.contentHidden }).from(users).where(eq(users.id, userId)).limit(1);
  if (!author || author.isBanned) throw new TRPCError({ code: "FORBIDDEN", message: "This account cannot publish content." });
  if (purpose !== "profile" && author.contentHidden) throw new TRPCError({ code: "FORBIDDEN", message: "Publishing is currently paused for this account by the Creator Studio." });

  const [policy, permissions] = await Promise.all([db.getMediaUploadPolicy(), db.getUserMediaPermissions(userId)]);
  if (purpose === "post" && !permissions.postsEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Post publishing is currently disabled for this account." });
  if (purpose === "story" && !permissions.storiesEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Story publishing is currently disabled for this account." });
  if (purpose === "reel" && !permissions.reelsEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Reel publishing is currently disabled for this account." });
  if (purpose === "profile" && !policy.profilePhotosEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Profile photo uploads are disabled." });

  if (contentType?.startsWith("image/") && (purpose === "post" || purpose === "story") && (!policy.photosEnabled || !permissions.photosEnabled)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Photo uploads are currently disabled for this account." });
  }
  if (contentType?.startsWith("video/") && (purpose === "post" || purpose === "story") && (!policy.videosEnabled || !permissions.videosEnabled)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Video uploads are currently disabled for this account." });
  }
}

async function validateMediaUpload(contentType: string, sizeBytes?: number, purpose: "post" | "profile" | "reel" | "banner" = "post", userId?: number) {
  const policy = await db.getMediaUploadPolicy();
  if (userId && (purpose === "post" || purpose === "reel")) {
    const permissions = await db.getUserMediaPermissions(userId);
    if (purpose === "reel" && !permissions.reelsEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Reel posting is disabled" });
    if (purpose === "post" && !permissions.postsEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Posting is disabled" });
  }
  const isImage = IMAGE_CONTENT_TYPES.has(contentType);
  const isVideo = VIDEO_CONTENT_TYPES.has(contentType);
  if (!isImage && !isVideo) throw new TRPCError({ code: "UNSUPPORTED_MEDIA_TYPE" });
  if (isImage && (purpose === "profile" || purpose === "banner") && !policy.profilePhotosEnabled) throw new TRPCError({ code: "FORBIDDEN" });
  if (isImage && purpose === "post" && !policy.photosEnabled) throw new TRPCError({ code: "FORBIDDEN" });
  if (isVideo && !policy.videosEnabled) throw new TRPCError({ code: "FORBIDDEN" });
  const maxBytes = isVideo ? VIDEO_UPLOAD_MAX_BYTES : PHOTO_UPLOAD_MAX_BYTES;
  if (sizeBytes !== undefined && sizeBytes > maxBytes) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE" });
  return isVideo ? "video" as const : "image" as const;
}

export const sanitizeAuthUser = (user: any) => {
  if (!user) return user;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { ...safeUser, isOwner: isTanryugramOwner(user) };
};

/**
 * The database query returns a post record with `user` and `media` relations,
 * while social-feed clients use an explicit `{ post, creator }` contract.
 * Normalize here, reject malformed rows, and ensure password hashes never
 * leave the server through a public feed response.
 */
export const toPublicPostFeedRows = (rows: unknown) => {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row: any) => {
    const post = row?.post ?? row;
    if (!post || !Number.isFinite(Number(post.id))) return [];
    const { user: rawUser, creator: rawCreator, ...postFields } = post;
    const creator = rawCreator ?? row?.creator ?? rawUser ?? row?.user ?? null;
    return [{ post: postFields, creator: sanitizeAuthUser(creator) }];
  });
};

export const hasNativePassword = (user: { passwordHash?: string | null }) => Boolean(user.passwordHash?.trim());

export const requiresEmailVerification = (existingAccountCount: number, verificationCode?: string | null) => existingAccountCount > 0 && !verificationCode?.trim();

export const isVerificationCodeValid = (record: { expiresAt: Date | string } | undefined, now = new Date()) => Boolean(record && now <= new Date(record.expiresAt));

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const user = await db.getUserById(ctx.user.id);
      return sanitizeAuthUser(user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
    signup: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1), username: z.string().min(3), gender: z.enum(["woman", "man", "non_binary", "prefer_not_to_say"]).optional(), verificationCode: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (await database.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (existing) throw new TRPCError({ code: "CONFLICT" });
      
      const emailSettings = await db.getEmailDeliverySettings();
      if (emailSettings.signupVerificationEnabled) {
        if (!input.verificationCode?.trim()) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
          await database.insert(emailVerificationCodes).values({ email: input.email, code, expiresAt });
          await sendVerificationEmail({ to: input.email, code, purpose: "signup" }, { transport: emailSettings.appScriptLoginEnabled ? "apps-script" : "automatic" });
          return { success: false, requiresVerification: true };
        }
        const record = (await database.select().from(emailVerificationCodes).where(and(eq(emailVerificationCodes.email, input.email), eq(emailVerificationCodes.code, input.verificationCode.trim()))).limit(1))[0];
        if (!isVerificationCodeValid(record)) throw new TRPCError({ code: "BAD_REQUEST" });
        await database.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, input.email));
      }

      const openId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const passwordHash = Buffer.from(input.password).toString("base64");
      const [inserted] = await database.insert(users).values({ openId, email: input.email, name: input.name, username: input.username, passwordHash, role: "user" });
      await database.insert(userSettings).values({ userId: Number(inserted.insertId), gender: input.gender ?? null });
      const newUser = await db.getUserById(Number(inserted.insertId));
      if (isTanryugramOwner(newUser)) await database.update(users).set({ role: "admin", isVerified: true }).where(eq(users.id, newUser!.id));
      const token = await sdk.createSessionToken(newUser!.openId, { expiresInMs: 30 * 24 * 60 * 60 * 1000, name: newUser!.name || "User" });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { success: true, sessionToken: token, user: sanitizeAuthUser(newUser) };
    }),
    login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const found = (await database.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (!found || found.passwordHash !== Buffer.from(input.password).toString("base64")) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (isTanryugramOwner(found)) await database.update(users).set({ role: "admin", isVerified: true }).where(eq(users.id, found.id));
      const token = await sdk.createSessionToken(found.openId, { expiresInMs: 30 * 24 * 60 * 60 * 1000, name: found.name || "User" });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { success: true, sessionToken: token, user: sanitizeAuthUser(found) };
    }),
    requestPasswordReset: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const user = (await database.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (!user) return { success: true };
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await database.insert(emailVerificationCodes).values({ email: input.email, code, expiresAt });
      const emailSettings = await db.getEmailDeliverySettings();
      await sendVerificationEmail({ to: input.email, code, purpose: "password-reset" }, { transport: emailSettings.appScriptResetEnabled ? "apps-script" : "automatic" });
      return { success: true };
    }),
    confirmPasswordReset: publicProcedure.input(z.object({ email: z.string().email(), code: z.string(), newPassword: z.string().min(6) })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const record = (await database.select().from(emailVerificationCodes).where(and(eq(emailVerificationCodes.email, input.email), eq(emailVerificationCodes.code, input.code.trim()))).limit(1))[0];
      if (!isVerificationCodeValid(record)) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired code" });
      const passwordHash = Buffer.from(input.newPassword).toString("base64");
      await database.update(users).set({ passwordHash }).where(eq(users.email, input.email));
      await database.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, input.email));
      return { success: true };
    }),
  }),
  profile: router({
    byId: publicProcedure.input(z.object({ username: z.string().optional(), userId: z.number().optional() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return null;
      const user = input.userId ? await db.getUserById(input.userId) : (await database.select().from(users).where(eq(users.username, input.username!)).limit(1))[0];
      if (!user) return null;

      const [followersCount, followingCount, postsCount, settings] = await Promise.all([
        database.select({ count: count() }).from(follows).where(eq(follows.followingId, user.id)),
        database.select({ count: count() }).from(follows).where(eq(follows.followerId, user.id)),
        database.select({ count: count() }).from(posts).where(eq(posts.userId, user.id)),
        database.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1),
      ]);

      const realFollowersCount = followersCount[0]?.count || 0;
      const displayFollowers = (user.displayedFollowersCount !== null && user.displayedFollowersCount !== undefined) 
        ? user.displayedFollowersCount 
        : realFollowersCount;

      return {
        user: sanitizeAuthUser(user),
        posts: [], // Posts are fetched separately or can be added here
        stats: {
          followers: displayFollowers,
          following: followingCount[0]?.count || 0,
          posts: postsCount[0]?.count || 0,
        },
        privacy: {
          isPrivate: settings[0]?.isPrivate ?? false,
          showFollowersList: settings[0]?.showFollowersList ?? true,
          showFollowingList: settings[0]?.showFollowingList ?? true,
        }
      };
    }),
    update: protectedProcedure.input(z.object({ 
      themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      customTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      profileBannerUrl: z.string().nullable().optional(),
      profileEffect: z.string().nullable().optional(),
      bio: z.string().max(500).optional(),
      name: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().nullable().optional(),
      username: z.string().min(3).max(64).optional(),
      subscriptionPrice: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return await db.updateUser(ctx.user.id, input);
    }),
    applyForBadge: protectedProcedure.input(z.object({ requestedBadge: z.enum(["blue", "black", "gold", "vip", "founder", "legend"]), reason: z.string().optional() })).mutation(async ({ ctx, input }) => {
      return await db.applyForBadge(ctx.user.id, input.requestedBadge, input.reason);
    }),
    myBadgeApplications: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBadgeApplications(ctx.user.id);
    }),
    presignBannerUpload: protectedProcedure.input(z.object({ fileName: z.string(), contentType: z.string(), sizeBytes: z.number().optional() })).mutation(async ({ ctx, input }) => {
      await validateMediaUpload(input.contentType, input.sizeBytes, "banner", ctx.user.id);
      const key = `banners/${ctx.user.id}/${Date.now()}-${randomBytes(4).toString("hex")}-${input.fileName}`;
      return await storagePresignPut(key, input.contentType);
    }),
  }),
  marketplace: router({
    getSettings: publicProcedure.query(async () => {
      return {
        marketplace: await db.getBadgeMarketplaceSettings(),
        payments: await db.getPlatformPaymentSettings(),
        platform: await db.getPlatformSettings(),
      };
    }),
  }),

  recovery: router({
    settings: publicProcedure.query(async () => {
      const s = await db.getRecoverySupportSettings();
      return { ...s, whatsappLink: s.whatsappSupportEnabled ? `https://wa.me/${s.whatsappSupportNumber.replace("+", "")}` : null };
    }),
    createGuest: publicProcedure.input(z.object({ guestLabel: z.string().optional(), accountEmail: z.string().email().optional(), reason: z.string().min(10).optional() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const token = randomBytes(16).toString("hex");
      const guestToken = `${token}`;
      await database.insert(recoverySupportRequests).values({ guestLabel: input.guestLabel || "Guest", accountEmail: input.accountEmail || null, guestTokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
      return { guestToken };
    }),
	    thread: publicProcedure.input(z.object({ guestToken: z.string() })).query(async ({ input }) => {
	      const database = await db.getDb();
	      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
	      const tokenHash = createHash("sha256").update(input.guestToken).digest("hex");
	      const req = (await database.select().from(recoverySupportRequests).where(eq(recoverySupportRequests.guestTokenHash, tokenHash)).limit(1))[0];
	      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
	      const msgs = await database.select().from(recoverySupportMessages).where(eq(recoverySupportMessages.requestId, req.id)).orderBy(asc(recoverySupportMessages.createdAt));
	      return { ...req, messages: msgs };
	    }),
	    sendMessage: publicProcedure.input(z.object({ guestToken: z.string(), body: z.string().min(1) })).mutation(async ({ input }) => {
	      const database = await db.getDb();
	      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
	      const tokenHash = createHash("sha256").update(input.guestToken).digest("hex");
	      const req = (await database.select().from(recoverySupportRequests).where(eq(recoverySupportRequests.guestTokenHash, tokenHash)).limit(1))[0];
	      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
	      await database.insert(recoverySupportMessages).values({ requestId: req.id, senderType: "guest", body: input.body });
	      await database.update(recoverySupportRequests).set({ lastMessageAt: new Date() }).where(eq(recoverySupportRequests.id, req.id));
	    }),
  }),
  admin: router({
    setMaintenance: adminOnly.input(z.object({ enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      return await db.setPlatformSetting({ maintenanceMode: input.enabled }, ctx.user.id);
    }),
    getBadgeApplications: adminOnly.query(async () => await db.getBadgeApplications()),
    reviewBadgeApplication: adminOnly.input(z.object({ applicationId: z.number(), status: z.enum(["approved", "rejected"]) })).mutation(async ({ ctx, input }) => {
      await db.reviewBadgeApplication(input.applicationId, ctx.user.id, input.status);
    }),
    setMarketplaceSetting: adminOnly.input(z.object({ badgeType: z.enum(["blue", "black", "gold", "vip", "founder", "legend"]), isPaid: z.boolean(), price: z.string() })).mutation(async ({ ctx, input }) => {
      await db.setBadgeMarketplaceSetting(input.badgeType, input.isPaid, input.price, ctx.user.id);
    }),
    setPaymentSettings: adminOnly.input(z.object({ paypalEmail: z.string().nullable(), bkashNumber: z.string().nullable(), nagadNumber: z.string().nullable(), instructions: z.string().nullable() })).mutation(async ({ ctx, input }) => {
      await db.setPlatformPaymentSettings(input, ctx.user.id);
    }),
    setPlatformSetting: adminOnly.input(z.object({ eventTheme: z.string().nullable() })).mutation(async ({ ctx, input }) => {
      await db.setPlatformSetting(input, ctx.user.id);
    }),
    setBadge: adminOnly.input(z.object({ userId: z.number(), badgeType: z.enum(["none", "blue", "black", "gold", "vip", "founder", "legend"]), isSecondary: z.boolean().optional() })).mutation(async ({ input }) => {
      await db.setUserBadge(input.userId, input.badgeType, input.isSecondary);
    }),
    setCreator: adminOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(async ({ input }) => {
      await db.setUserCreator(input.userId, input.value);
    }),
    setBadgeLabel: adminOnly.input(z.object({ userId: z.number(), label: z.string() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(users).set({ badgeLabel: input.label }).where(eq(users.id, input.userId));
    }),
    setShowBadge: adminOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(users).set({ showBadge: input.value }).where(eq(users.id, input.userId));
    }),
    setDisplayedFollowers: adminOnly.input(z.object({ userId: z.number(), count: z.number().nullable() })).mutation(async ({ input }) => {
      await db.setDisplayedFollowersCount(input.userId, input.count);
    }),
    banUser: adminOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(users).set({ isBanned: input.value }).where(eq(users.id, input.userId));
    }),
    setRole: adminOnly.input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) })).mutation(async ({ input }) => {
      await db.setUserRole(input.userId, input.role);
    }),
    resetUserPassword: adminOnly.input(z.object({ userId: z.number(), newPassword: z.string().min(8).max(128) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [target] = await database.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User account not found." });
      const passwordHash = Buffer.from(input.newPassword).toString("base64");
      await database.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, input.userId));
      await database.insert(moderationAuditLog).values({
        actorId: ctx.user.id,
        action: "owner_password_reset",
        targetType: "account",
        targetId: input.userId,
        details: "Owner reset the account password. The password value is never stored in this log.",
      });
      return { success: true };
    }),
    setUserMediaPermissions: adminOnly.input(z.object({ userId: z.number(), postsEnabled: z.boolean(), photosEnabled: z.boolean(), videosEnabled: z.boolean(), reelsEnabled: z.boolean(), storiesEnabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const values = { ...input, updatedBy: ctx.user.id };
      await database.insert(userMediaPermissions).values(values).onDuplicateKeyUpdate({ set: values });
      return await db.getUserMediaPermissions(input.userId);
    }),
    setContentHidden: adminOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(users).set({ contentHidden: input.value }).where(eq(users.id, input.userId));
    }),
    verifyUser: adminOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(async ({ input }) => {
      await db.verifyUser(input.userId, input.value);
    }),
    reelsPromotions: adminOnly.query(async () => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select({ promotion: reelPromotions, reel: reelSubmissions, user: users }).from(reelPromotions).innerJoin(reelSubmissions, eq(reelPromotions.reelId, reelSubmissions.id)).innerJoin(users, eq(reelSubmissions.userId, users.id));
    }),
    setReelPromotion: adminOnly.input(z.object({ reelId: z.number(), isPromoted: z.boolean(), priority: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.isPromoted) {
        await database.insert(reelPromotions).values({ reelId: input.reelId, priority: input.priority ?? 1, ownerId: ctx.user.id }).onDuplicateKeyUpdate({ set: { priority: input.priority ?? 1, ownerId: ctx.user.id } });
      } else {
        await database.delete(reelPromotions).where(eq(reelPromotions.reelId, input.reelId));
      }
    }),
    geminiProposal: adminOnly.input(z.object({ request: z.string() })).mutation(async ({ input }) => {
      const emailSettings = await db.getEmailDeliverySettings();
      const mediaPolicy = await db.getMediaUploadPolicy();
      const currentSettings = { ...emailSettings, ...mediaPolicy };
      return await generateGeminiFeatureProposal(input.request, currentSettings);
    }),
    badgeApplications: router({
      invalidate: adminOnly.query(async () => null),
    }),
    users: router({
      list: adminOnly.query(async () => (await db.getUsers()).map(sanitizeAuthUser)),
      invalidate: adminOnly.query(async () => null),
    }),
    reports: router({
      list: adminOnly.query(async () => await db.getReports()),
      invalidate: adminOnly.query(async () => null),
    }),
    reviewReport: adminOnly.input(z.object({ reportId: z.number(), status: z.enum(["reviewed", "dismissed"]) })).mutation(async ({ ctx, input }) => {
      await db.reviewReport(input.reportId, ctx.user.id, input.status);
    }),
    reviewReel: adminOnly.input(z.object({ reelId: z.number(), status: z.enum(["approved", "rejected"]), reviewNote: z.string().optional() })).mutation(async ({ ctx, input }) => {
      await db.reviewReel(input.reelId, ctx.user.id, input.status, input.reviewNote);
    }),
    reviewAppeal: adminOnly.input(z.object({ appealId: z.number(), status: z.enum(["approved", "rejected"]), response: z.string().optional() })).mutation(async ({ ctx, input }) => {
      await db.reviewAppeal(input.appealId, ctx.user.id, input.status, input.response);
    }),
    getReports: adminOnly.query(async () => await db.getReports()),
    getAppeals: adminOnly.query(async () => await db.getAppeals()),
    getAuditLog: adminOnly.query(async () => await db.getAuditLog()),
    getReels: adminOnly.query(async () => await db.getReels()),
    getMediaPolicy: adminOnly.query(async () => await db.getMediaUploadPolicy()),
    setMediaPolicy: adminOnly.input(z.object({ photosEnabled: z.boolean(), profilePhotosEnabled: z.boolean(), videosEnabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      await db.setMediaUploadPolicy(input, ctx.user.id);
    }),
    getEmailSettings: adminOnly.query(async () => await db.getEmailDeliverySettings()),
    setEmailSettings: adminOnly.input(z.object({ emailDeliveryEnabled: z.boolean(), signupVerificationEnabled: z.boolean(), appScriptLoginEnabled: z.boolean(), appScriptResetEnabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      await db.setEmailDeliverySettings(input, ctx.user.id);
    }),
    getRecoverySettings: adminOnly.query(async () => await db.getRecoverySupportSettings()),
    setRecoverySettings: adminOnly.input(z.object({ guestRecoveryEnabled: z.boolean(), whatsappSupportEnabled: z.boolean(), whatsappSupportNumber: z.string() })).mutation(async ({ ctx, input }) => {
      await db.setRecoverySupportSettings(input, ctx.user.id);
    }),
    getRecoveryInbox: adminOnly.query(async () => await db.getRecoveryInbox()),
    recoveryInbox: router({
      invalidate: adminOnly.query(async () => null),
    }),
    replyRecovery: adminOnly.input(z.object({ requestId: z.number(), body: z.string() })).mutation(async ({ ctx, input }) => {
      await db.replyRecovery(input.requestId, input.body);
    }),
    closeRecovery: adminOnly.input(z.object({ requestId: z.number() })).mutation(async ({ input }) => {
      await db.closeRecovery(input.requestId);
    }),
    posts: router({
      list: adminOnly.query(async () => await db.getPosts()),
      invalidate: adminOnly.query(async () => null),
    }),
    deletePost: adminOnly.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deletePostAsUser(input.postId, ctx.user.id, true);
    }),
    reelsAnalytics: adminOnly.input(z.object({ reelIds: z.array(z.number()).optional() }).optional()).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const query = database.select({ reel: reelSubmissions, user: users, views: count(reelViews.id), likes: count(reelLikes.id), comments: count(reelComments.id) }).from(reelSubmissions).innerJoin(users, eq(reelSubmissions.userId, users.id)).leftJoin(reelViews, eq(reelSubmissions.id, reelViews.reelId)).leftJoin(reelLikes, eq(reelSubmissions.id, reelLikes.reelId)).leftJoin(reelComments, eq(reelSubmissions.id, reelComments.reelId));
      if (input?.reelIds?.length) {
        query.where(inArray(reelSubmissions.id, input.reelIds));
      }
      return await query.groupBy(reelSubmissions.id);
    }),
    reelTrends: adminOnly.input(z.object({ reelId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select().from(dailyReelAnalytics).where(eq(dailyReelAnalytics.reelId, input.reelId)).orderBy(asc(dailyReelAnalytics.date));
    }),
    geminiChat: adminOnly.input(z.object({ messages: z.array(z.object({ role: z.enum(["user", "model"]), content: z.string() })) })).mutation(async ({ input }) => {
      const emailSettings = await db.getEmailDeliverySettings();
      const mediaPolicy = await db.getMediaUploadPolicy();
      const platformSettings = await db.getPlatformSettings();
      const currentSettings = { ...emailSettings, ...mediaPolicy, ...platformSettings };
      const content = await generateGeminiChatReply(input.messages.map(m => ({ role: m.role === "model" ? "assistant" as const : "user" as const, content: m.content })), currentSettings);
      return { content };
    }),
    geminiApplySafeActions: adminOnly.input(z.any()).mutation(async ({ ctx, input }) => {
      const emailSettings = await db.getEmailDeliverySettings();
      const mediaPolicy = await db.getMediaUploadPolicy();
      const platformSettings = await db.getPlatformSettings();
      const currentSettings = { ...emailSettings, ...mediaPolicy, ...platformSettings };
      const next = await applySafeGeminiActions(input, currentSettings);
      await db.setEmailDeliverySettings({
        emailDeliveryEnabled: next.emailDeliveryEnabled,
        signupVerificationEnabled: next.signupVerificationEnabled,
        appScriptLoginEnabled: next.appScriptLoginEnabled,
        appScriptResetEnabled: next.appScriptResetEnabled
      }, ctx.user.id);
      await db.setMediaUploadPolicy({
        photosEnabled: next.photosEnabled,
        profilePhotosEnabled: next.profilePhotosEnabled,
        videosEnabled: next.videosEnabled
      }, ctx.user.id);
      if ((next as any).eventTheme !== undefined) {
        await db.setPlatformSetting({ eventTheme: (next as any).eventTheme }, ctx.user.id);
      }
      return { success: true };
    }),
  }),
  posts: router({
    list: publicProcedure.input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional()).query(async () => await db.getPosts()),
    delete: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deletePostAsUser(input.postId, ctx.user.id, isTanryugramOwner(ctx.user));
    }),
    comment: protectedProcedure.input(z.object({ postId: z.number(), content: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(comments).values({ userId: ctx.user.id, ...input });
    }),
    like: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (await database.select().from(likes).where(and(eq(likes.postId, input.postId), eq(likes.userId, ctx.user.id))).limit(1))[0];
      if (existing) {
        await database.delete(likes).where(eq(likes.id, existing.id));
        return { liked: false };
      }
      await database.insert(likes).values({ postId: input.postId, userId: ctx.user.id });
      return { liked: true };
    }),
    reaction: protectedProcedure.input(z.object({ postId: z.number(), reactionType: z.string() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(messageReactions).values({ messageId: input.postId, userId: ctx.user.id, reaction: input.reactionType }).onDuplicateKeyUpdate({ set: { reaction: input.reactionType } });
    }),
    reactions: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const res = await database.select({ reaction: messageReactions, user: users }).from(messageReactions).innerJoin(users, eq(messageReactions.userId, users.id)).where(eq(messageReactions.messageId, input.postId));
      return res.map(r => ({ ...r, user: sanitizeAuthUser(r.user), reaction: { ...r.reaction, reactionType: r.reaction.reaction } }));
    }),
    create: protectedProcedure.input(z.object({ content: z.string(), location: z.string().optional(), mediaUrls: z.array(z.string()).optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertUserCanCreateContent(ctx.user.id, "post");
      const [post] = await database.insert(posts).values({ userId: ctx.user.id, caption: input.content, mediaUrl: input.mediaUrls?.[0] || "", location: input.location }).$returningId();
      if (input.mediaUrls && input.mediaUrls.length > 1) {
        for (let i = 1; i < input.mediaUrls.length; i++) {
          await database.insert(postMedia).values({ postId: post.id, mediaUrl: input.mediaUrls[i], sortOrder: i });
        }
      }
      return post.id;
    }),
    save: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (await database.select().from(saves).where(and(eq(saves.postId, input.postId), eq(saves.userId, ctx.user.id))).limit(1))[0];
      if (existing) {
        await database.delete(saves).where(eq(saves.id, existing.id));
        return { saved: false };
      }
      await database.insert(saves).values({ postId: input.postId, userId: ctx.user.id });
      return { saved: true };
    }),
    comments: publicProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const res = await database.select({ comment: comments, author: users }).from(comments).innerJoin(users, eq(comments.userId, users.id)).where(eq(comments.postId, input.postId)).orderBy(desc(comments.createdAt));
      return res.map(r => ({ ...r, author: sanitizeAuthUser(r.author) }));
    }),
    media: publicProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select().from(postMedia).where(eq(postMedia.postId, input.postId)).orderBy(asc(postMedia.sortOrder));
    }),
  }),
  reels: router({
    list: publicProcedure.query(async () => await db.getReels()),
    mine: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select().from(reelSubmissions).where(eq(reelSubmissions.userId, ctx.user.id)).orderBy(desc(reelSubmissions.createdAt));
    }),
    submit: protectedProcedure.input(z.object({ mediaUrl: z.string(), thumbnailUrl: z.string().optional(), caption: z.string().optional(), width: z.number(), height: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertUserCanCreateContent(ctx.user.id, "reel", "video/mp4");
      await database.insert(reelSubmissions).values({ userId: ctx.user.id, ...input });
    }),
    approved: publicProcedure.input(z.object({ cursor: z.number().nullish(), limit: z.number().min(1).max(50).default(10) })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return { items: [], nextCursor: null };
      const items = await database.select({ reel: reelSubmissions, user: users }).from(reelSubmissions).innerJoin(users, eq(reelSubmissions.userId, users.id)).where(and(eq(reelSubmissions.status, "approved"), input.cursor ? lt(reelSubmissions.id, input.cursor) : undefined)).orderBy(desc(reelSubmissions.id)).limit(input.limit + 1);
      let nextCursor: typeof input.cursor = null;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.reel.id;
      }
      return { items, nextCursor };
    }),
    comment: protectedProcedure.input(z.object({ reelId: z.number(), content: z.string().min(1), parentId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(reelComments).values({ userId: ctx.user.id, ...input });
    }),
    comments: publicProcedure.input(z.object({ reelId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select({ comment: reelComments, user: users }).from(reelComments).innerJoin(users, eq(reelComments.userId, users.id)).where(eq(reelComments.reelId, input.reelId)).orderBy(desc(reelComments.createdAt));
    }),
    toggleLike: protectedProcedure.input(z.object({ reelId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (await database.select().from(reelLikes).where(and(eq(reelLikes.reelId, input.reelId), eq(reelLikes.userId, ctx.user.id))).limit(1))[0];
      if (existing) {
        await database.delete(reelLikes).where(eq(reelLikes.id, existing.id));
        return { liked: false };
      }
      await database.insert(reelLikes).values({ reelId: input.reelId, userId: ctx.user.id });
      return { liked: true };
    }),
    toggleBookmark: protectedProcedure.input(z.object({ reelId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (await database.select().from(reelBookmarks).where(and(eq(reelBookmarks.reelId, input.reelId), eq(reelBookmarks.userId, ctx.user.id))).limit(1))[0];
      if (existing) {
        await database.delete(reelBookmarks).where(eq(reelBookmarks.id, existing.id));
        return { bookmarked: false };
      }
      await database.insert(reelBookmarks).values({ reelId: input.reelId, userId: ctx.user.id });
      return { bookmarked: true };
    }),
    recordView: publicProcedure.input(z.object({ reelId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(reelViews).values({ reelId: input.reelId, userId: ctx.user?.id });
    }),
    saved: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      const bookmarks = await database.select({ reelId: reelBookmarks.reelId }).from(reelBookmarks).where(eq(reelBookmarks.userId, ctx.user.id));
      if (!bookmarks.length) return [];
      return await database.select({ reel: reelSubmissions, user: users }).from(reelSubmissions).innerJoin(users, eq(reelSubmissions.userId, users.id)).where(inArray(reelSubmissions.id, bookmarks.map(b => b.reelId)));
    }),
  }),
  discovery: router({
    feed: publicProcedure.input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional()).query(async () => toPublicPostFeedRows(await db.getPosts())),
    explore: publicProcedure.query(async () => toPublicPostFeedRows(await db.getPosts())),
    search: publicProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return { users: [], posts: [] };
      const matchedUsers = await database.select().from(users).where(or(like(users.username, `%${input.query}%`), like(users.name, `%${input.query}%`))).limit(10);
      return { users: matchedUsers.map(sanitizeAuthUser), posts: [] };
    }),
  }),
  appeals: router({
    create: protectedProcedure.input(z.object({ targetType: z.enum(["account", "post", "video", "reel"]), targetId: z.number(), reason: z.string().min(10) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(contentAppeals).values({ appellantId: ctx.user.id, ...input });
      return { message: "Appeal submitted successfully" };
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select().from(contentAppeals).where(eq(contentAppeals.appellantId, ctx.user.id)).orderBy(desc(contentAppeals.createdAt));
    }),
  }),
  media: router({
    policy: publicProcedure.query(async () => await db.getMediaUploadPolicy()),
    prepareUpload: protectedProcedure.input(z.object({ fileName: z.string(), contentType: z.string(), purpose: z.enum(["profile", "post", "story", "reel"]) })).mutation(async ({ ctx, input }) => {
      await assertUserCanCreateContent(ctx.user.id, input.purpose, input.contentType);
      const key = `uploads/${ctx.user.id}/${Date.now()}_${input.fileName}`;
      const { url, uploadUrl } = await storagePresignPut(key, input.contentType);
      return { url, uploadUrl, key, fields: {} };
    }),
    uploadBase64: protectedProcedure.input(z.object({ base64Data: z.string(), purpose: z.enum(["profile", "post", "story", "reel"]), contentType: z.string().optional(), fileName: z.string().optional() })).mutation(async ({ ctx, input }) => {
      await assertUserCanCreateContent(ctx.user.id, input.purpose, input.contentType);
      const buffer = Buffer.from(input.base64Data.split(",")[1], "base64");
      const key = `uploads/${ctx.user.id}/${Date.now()}_${input.fileName || "file"}.${input.contentType?.split("/")[1] || "jpg"}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url };
    }),
  }),
  follows: router({
    toggle: protectedProcedure.input(z.object({ followingId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.followingId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot follow your own profile." });
      const target = await db.getUserById(input.followingId);
      if (!target || target.isBanned) throw new TRPCError({ code: "NOT_FOUND", message: "This profile is unavailable." });
      const existing = (await database.select().from(follows).where(and(eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.followingId))).limit(1))[0];
      if (existing) {
        await database.delete(follows).where(eq(follows.id, existing.id));
        return { following: false, requestPending: false };
      }
      const [existingRequest] = await database.select().from(followRequests).where(and(eq(followRequests.followerId, ctx.user.id), eq(followRequests.followingId, input.followingId), eq(followRequests.status, "pending"))).limit(1);
      if (existingRequest) {
        await database.delete(followRequests).where(eq(followRequests.id, existingRequest.id));
        return { following: false, requestPending: false };
      }
      const [targetSettings] = await database.select().from(userSettings).where(eq(userSettings.userId, input.followingId)).limit(1);
      if (targetSettings?.isPrivate) {
        await database.insert(followRequests).values({ followerId: ctx.user.id, followingId: input.followingId, status: "pending" });
        return { following: false, requestPending: true };
      }
      await database.insert(follows).values({ followerId: ctx.user.id, followingId: input.followingId });
      return { following: true, requestPending: false };
    }),
    state: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database || input.userId === ctx.user.id) return false;
      const [row] = await database.select({ id: follows.id }).from(follows).where(and(eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.userId))).limit(1);
      return Boolean(row?.id);
    }),
    requestState: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database || input.userId === ctx.user.id) return false;
      const [row] = await database.select({ id: followRequests.id }).from(followRequests).where(and(eq(followRequests.followerId, ctx.user.id), eq(followRequests.followingId, input.userId), eq(followRequests.status, "pending"))).limit(1);
      return Boolean(row?.id);
    }),
    followers: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const [settings, viewerFollow] = await Promise.all([
        database.select().from(userSettings).where(eq(userSettings.userId, input.userId)).limit(1),
        database.select({ id: follows.id }).from(follows).where(and(eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.userId))).limit(1),
      ]);
      if (settings[0]?.showFollowersList === false && ctx.user.id !== input.userId) return [];
      if (settings[0]?.isPrivate && ctx.user.id !== input.userId && !viewerFollow[0]) return [];
      const res = await database.select({ user: users }).from(follows).innerJoin(users, eq(follows.followerId, users.id)).where(eq(follows.followingId, input.userId));
      return res.map(r => sanitizeAuthUser(r.user));
    }),
    following: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const [settings, viewerFollow] = await Promise.all([
        database.select().from(userSettings).where(eq(userSettings.userId, input.userId)).limit(1),
        database.select({ id: follows.id }).from(follows).where(and(eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.userId))).limit(1),
      ]);
      if (settings[0]?.showFollowingList === false && ctx.user.id !== input.userId) return [];
      if (settings[0]?.isPrivate && ctx.user.id !== input.userId && !viewerFollow[0]) return [];
      const res = await database.select({ user: users }).from(follows).innerJoin(users, eq(follows.followingId, users.id)).where(eq(follows.followerId, input.userId));
      return res.map(r => sanitizeAuthUser(r.user));
    }),
    privacy: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return { isPrivate: false, showFollowersList: true, showFollowingList: true };
      const settings = (await database.select().from(userSettings).where(eq(userSettings.userId, ctx.user.id)).limit(1))[0];
      return settings || { isPrivate: false, showFollowersList: true, showFollowingList: true };
    }),
    updatePrivacy: protectedProcedure.input(z.object({ isPrivate: z.boolean().optional(), showFollowersList: z.boolean().optional(), showFollowingList: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(userSettings).values({ userId: ctx.user.id, ...input }).onDuplicateKeyUpdate({ set: input });
    }),
  }),
  reports: router({
    create: protectedProcedure.input(z.object({ targetType: z.enum(["account", "post", "video", "reel"]), targetId: z.number(), reason: z.enum(["pornography", "child_abuse", "dangerous", "harassment", "spam", "other"]), details: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(contentReports).values({ reporterId: ctx.user.id, ...input });
      return { message: "Report submitted successfully" };
    }),
  }),
  messages: router({
    list: protectedProcedure.input(z.object({ otherUserId: z.number() }).optional()).query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const cond = input?.otherUserId ? or(and(eq(messages.senderId, ctx.user.id), eq(messages.receiverId, input.otherUserId)), and(eq(messages.senderId, input.otherUserId), eq(messages.receiverId, ctx.user.id))) : or(eq(messages.senderId, ctx.user.id), eq(messages.receiverId, ctx.user.id));
      return await database.select().from(messages).where(cond).orderBy(asc(messages.createdAt));
    }),
    calls: protectedProcedure.input(z.object({ otherUserId: z.number() }).optional()).query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const cond = input?.otherUserId ? or(and(eq(calls.callerId, ctx.user.id), eq(calls.receiverId, input.otherUserId)), and(eq(calls.callerId, input.otherUserId), eq(calls.receiverId, ctx.user.id))) : or(eq(calls.callerId, ctx.user.id), eq(calls.receiverId, ctx.user.id));
      return await database.select().from(calls).where(cond).orderBy(desc(calls.startedAt));
    }),
    peers: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      
      // Get all unique peers the user has messaged with
      const sentTo = await database.select({ id: messages.receiverId }).from(messages).where(eq(messages.senderId, ctx.user.id)).groupBy(messages.receiverId);
      const receivedFrom = await database.select({ id: messages.senderId }).from(messages).where(eq(messages.receiverId, ctx.user.id)).groupBy(messages.senderId);
      
      const peerIds = Array.from(new Set([
        ...sentTo.map(r => r.id),
        ...receivedFrom.map(r => r.id)
      ])).filter(id => id !== ctx.user.id);
      if (!peerIds.length) return [];

      const results = [];
      for (const pid of peerIds) {
        const peer = await db.getUserById(pid);
        if (!peer) continue;
        
        const [lastMsg] = await database.select().from(messages).where(or(and(eq(messages.senderId, ctx.user.id), eq(messages.receiverId, pid)), and(eq(messages.senderId, pid), eq(messages.receiverId, ctx.user.id)))).orderBy(desc(messages.createdAt)).limit(1);
        
        const [unread] = await database.select({ count: count() }).from(messages).where(and(eq(messages.senderId, pid), eq(messages.receiverId, ctx.user.id), eq(messages.isRead, false)));
        
        const [settings] = await database.select().from(conversationSettings).where(and(eq(conversationSettings.userId, ctx.user.id), eq(conversationSettings.peerId, pid))).limit(1);
        
        results.push({
          peer: sanitizeAuthUser(peer),
          lastMessage: lastMsg || null,
          unreadCount: unread.count,
          settings: settings || null
        });
      }
      
      return results.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }),
    createGroup: protectedProcedure.input(z.object({ name: z.string().min(1), description: z.string().optional(), avatarUrl: z.string().optional(), visibility: z.enum(["public", "private"]).optional(), joinMode: z.enum(["open", "approval", "invite"]).optional(), postingMode: z.enum(["all", "admins"]).optional(), memberIds: z.array(z.number()).optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [group] = await database.insert(groups).values({ name: input.name, creatorId: ctx.user.id, avatarUrl: input.avatarUrl, description: input.description, visibility: input.visibility || "private", joinMode: input.joinMode || "invite", postingMode: input.postingMode || "all" }).$returningId();
      await database.insert(groupMembers).values({ groupId: group.id, userId: ctx.user.id, role: "admin" });
      if (input.memberIds) {
        for (const mid of input.memberIds) {
          await database.insert(groupMembers).values({ groupId: group.id, userId: mid, role: "member" });
        }
      }
      return group.id;
    }),
    joinGroup: protectedProcedure.input(z.object({ groupId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [group] = await database.select().from(groups).where(eq(groups.id, input.groupId));
      if (!group) throw new TRPCError({ code: "NOT_FOUND" });
      if (group.joinMode === "open") {
        await database.insert(groupMembers).values({ groupId: input.groupId, userId: ctx.user.id, role: "member" });
        return { status: "member" };
      } else if (group.joinMode === "approval") {
        await database.insert(groupJoinRequests).values({ groupId: input.groupId, userId: ctx.user.id, status: "pending" });
        return { status: "pending" };
      }
      throw new TRPCError({ code: "FORBIDDEN", message: "Group is invite-only" });
    }),
    groups: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      const res = await database.select({ group: groups }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(eq(groupMembers.userId, ctx.user.id));
      return res.map(r => r.group);
    }),
    requests: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select({ request: groupJoinRequests, group: groups, user: users }).from(groupJoinRequests).innerJoin(groups, eq(groupJoinRequests.groupId, groups.id)).innerJoin(users, eq(groupJoinRequests.userId, users.id)).where(eq(groups.creatorId, ctx.user.id));
    }),
    discoverGroups: protectedProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select().from(groups).where(eq(groups.visibility, "public")).limit(20);
    }),
    groupInviteRequests: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select({ request: groupInviteRequests, group: groups, user: users }).from(groupInviteRequests).innerJoin(groups, eq(groupInviteRequests.groupId, groups.id)).innerJoin(users, eq(groupInviteRequests.inviteeId, users.id)).where(eq(groups.creatorId, ctx.user.id));
    }),
    inviteToGroup: protectedProcedure.input(z.object({ groupId: z.number(), userId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [membership] = await database.select().from(groupMembers).where(and(eq(groupMembers.groupId, input.groupId), eq(groupMembers.userId, ctx.user.id)));
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      if (["admin", "moderator"].includes(membership.role)) {
        await database.insert(groupMembers).values({ groupId: input.groupId, userId: input.userId, role: "member" });
      } else {
        await database.insert(groupInviteRequests).values({ groupId: input.groupId, inviteeId: input.userId, inviterId: ctx.user.id, status: "pending" });
      }
    }),
    handleInviteRequest: protectedProcedure.input(z.object({ requestId: z.number(), status: z.enum(["approved", "rejected"]) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [request] = await database.select().from(groupInviteRequests).where(eq(groupInviteRequests.id, input.requestId));
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      const [membership] = await database.select().from(groupMembers).where(and(eq(groupMembers.groupId, request.groupId), eq(groupMembers.userId, ctx.user.id)));
      if (!membership || !["admin", "moderator"].includes(membership.role)) throw new TRPCError({ code: "FORBIDDEN" });
      if (input.status === "approved") {
        await database.insert(groupMembers).values({ groupId: request.groupId, userId: request.inviteeId, role: "member" });
      }
      await database.delete(groupInviteRequests).where(eq(groupInviteRequests.id, input.requestId));
    }),
    approveJoinRequest: protectedProcedure.input(z.object({ requestId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [request] = await database.select().from(groupJoinRequests).where(eq(groupJoinRequests.id, input.requestId));
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      const [membership] = await database.select().from(groupMembers).where(and(eq(groupMembers.groupId, request.groupId), eq(groupMembers.userId, ctx.user.id)));
      if (!membership || !["admin", "moderator"].includes(membership.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await database.insert(groupMembers).values({ groupId: request.groupId, userId: request.userId, role: "member" });
      await database.delete(groupJoinRequests).where(eq(groupJoinRequests.id, input.requestId));
    }),
    rejectJoinRequest: protectedProcedure.input(z.object({ requestId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [request] = await database.select().from(groupJoinRequests).where(eq(groupJoinRequests.id, input.requestId));
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      const [membership] = await database.select().from(groupMembers).where(and(eq(groupMembers.groupId, request.groupId), eq(groupMembers.userId, ctx.user.id)));
      if (!membership || !["admin", "moderator"].includes(membership.role)) throw new TRPCError({ code: "FORBIDDEN" });
      await database.delete(groupJoinRequests).where(eq(groupJoinRequests.id, input.requestId));
    }),
    send: protectedProcedure.input(z.object({ receiverId: z.number(), content: z.string().min(1), audioUrl: z.string().optional(), replyToId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [res] = await database.insert(messages).values({ 
        senderId: ctx.user.id, 
        ...input,
        deliveryStatus: "sent"
      });
      return { id: res.insertId };
    }),
    react: protectedProcedure.input(z.object({ messageId: z.number(), emoji: z.string() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(messageReactions).values({ messageId: input.messageId, userId: ctx.user.id, reaction: input.emoji }).onDuplicateKeyUpdate({ set: { reaction: input.emoji } });
    }),
    delete: protectedProcedure.input(z.object({ messageId: z.number().optional(), messageIds: z.array(z.number()).optional(), everyone: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.messageIds) {
        await database.delete(messages).where(and(inArray(messages.id, input.messageIds), eq(messages.senderId, ctx.user.id)));
      } else if (input.messageId) {
        await database.delete(messages).where(and(eq(messages.id, input.messageId), eq(messages.senderId, ctx.user.id)));
      }
    }),
    read: protectedProcedure.input(z.object({ otherUserId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(messages).set({ isRead: true, deliveryStatus: "read" }).where(and(eq(messages.senderId, input.otherUserId), eq(messages.receiverId, ctx.user.id)));
    }),
    forward: protectedProcedure.input(z.object({ messageId: z.number().optional(), messageIds: z.array(z.number()).optional(), receiverId: z.number().optional(), receiverIds: z.array(z.number()).optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const targetIds = input.receiverIds || (input.receiverId ? [input.receiverId] : []);
      const sourceIds = input.messageIds || (input.messageId ? [input.messageId] : []);
      for (const rid of targetIds) {
        for (const mid of sourceIds) {
          const [msg] = await database.select().from(messages).where(eq(messages.id, mid));
          if (msg) await database.insert(messages).values({ senderId: ctx.user.id, receiverId: rid, content: msg.content, attachmentUrl: msg.attachmentUrl, attachmentType: msg.attachmentType });
        }
      }
    }),
    typingGet: protectedProcedure.input(z.object({ peerId: z.number(), groupId: z.number().optional() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      const [status] = await database.select().from(typingStatus).where(and(eq(typingStatus.userId, input.peerId), input.groupId ? eq(typingStatus.groupId, input.groupId) : isNull(typingStatus.groupId))).orderBy(desc(typingStatus.updatedAt)).limit(1);
      if (!status) return [];
      const isTyping = Date.now() - status.updatedAt.getTime() < 5000;
      return isTyping ? [{ userId: status.userId }] : [];
    }),
    settingsGet: protectedProcedure.input(z.object({ peerId: z.number() })).query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return null;
      const [settings] = await database.select().from(conversationSettings).where(and(eq(conversationSettings.userId, ctx.user.id), eq(conversationSettings.peerId, input.peerId)));
      return settings || null;
    }),
    startCall: protectedProcedure.input(z.object({ receiverId: z.number(), callType: z.enum(["audio", "video"]) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [call] = await database.insert(calls).values({ callerId: ctx.user.id, receiverId: input.receiverId, callType: input.callType, status: "pending", roomId: `call_${Date.now()}_${ctx.user.id}` }).$returningId();
      return call.id;
    }),
    sendGroupMessage: protectedProcedure.input(z.object({ groupId: z.number(), content: z.string().min(1), mediaUrl: z.string().optional(), attachmentType: z.enum(["image", "video", "file", "link"]).optional(), attachmentName: z.string().optional(), attachmentMimeType: z.string().optional(), attachmentSizeBytes: z.number().optional(), attachmentDurationSeconds: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(groupMessages).values({ groupId: input.groupId, senderId: ctx.user.id, content: input.content, attachmentUrl: input.mediaUrl, attachmentType: input.attachmentType as any });
    }),
    uploadGroupAttachment: protectedProcedure.input(z.object({ groupId: z.number(), fileName: z.string(), contentType: z.string(), base64Data: z.string() })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64Data.split(",")[1], "base64");
      const key = `groups/${input.groupId}/${Date.now()}_${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      const attachmentType = input.contentType.startsWith("image/") ? "image" : input.contentType.startsWith("video/") ? "video" : "file";
      return { url, attachmentUrl: url, attachmentName: input.fileName, attachmentMimeType: input.contentType, attachmentSizeBytes: buffer.length, attachmentType };
    }),
    groupMedia: publicProcedure.input(z.object({ groupId: z.number(), query: z.string().optional() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      let cond = and(eq(groupMessages.groupId, input.groupId), isNotNull(groupMessages.attachmentUrl));
      if (input.query) {
        cond = and(cond, or(like(groupMessages.content, `%${input.query}%`), like(groupMessages.attachmentName, `%${input.query}%`)));
      }
      return await database.select({ message: groupMessages, sender: users }).from(groupMessages).innerJoin(users, eq(groupMessages.senderId, users.id)).where(cond).orderBy(desc(groupMessages.createdAt));
    }),
    events: publicProcedure.input(z.object({ groupId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select().from(groupEvents).where(eq(groupEvents.groupId, input.groupId)).orderBy(asc(groupEvents.startsAt));
    }),
    groupMessages: protectedProcedure.input(z.object({ groupId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select({ message: groupMessages, sender: users }).from(groupMessages).innerJoin(users, eq(groupMessages.senderId, users.id)).where(eq(groupMessages.groupId, input.groupId)).orderBy(asc(groupMessages.createdAt));
    }),
    groupMembers: protectedProcedure.input(z.object({ groupId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select({ member: groupMembers, user: users }).from(groupMembers).innerJoin(users, eq(groupMembers.userId, users.id)).where(eq(groupMembers.groupId, input.groupId));
    }),
    rsvpEvent: protectedProcedure.input(z.object({ eventId: z.number(), status: z.enum(["going", "maybe", "declined"]) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(groupEventRsvps).values({ eventId: input.eventId, userId: ctx.user.id, status: input.status }).onDuplicateKeyUpdate({ set: { status: input.status } });
    }),
    votePoll: protectedProcedure.input(z.object({ pollId: z.number(), optionId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(groupPollVotes).values({ pollId: input.pollId, optionId: input.optionId, userId: ctx.user.id });
    }),
    poll: publicProcedure.input(z.object({ pollId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return null;
      const [row] = await database.select().from(groupPolls).where(eq(groupPolls.id, input.pollId));
      if (!row) return null;
      const options = await database.select().from(groupPollOptions).where(eq(groupPollOptions.pollId, input.pollId));
      const votes = await database.select().from(groupPollVotes).where(eq(groupPollVotes.pollId, input.pollId));
      return { poll: { ...row, allowsMultiple: row.isMultipleChoice, closesAt: row.expiresAt }, options, votes, totalVotes: votes.length };
    }),
    createEvent: protectedProcedure.input(z.object({ groupId: z.number(), name: z.string(), description: z.string().optional(), location: z.string().optional(), startsAt: z.date() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(groupEvents).values({ groupId: input.groupId, creatorId: ctx.user.id, title: input.name, description: input.description, location: input.location, startsAt: input.startsAt });
    }),
    createPoll: protectedProcedure.input(z.object({ groupId: z.number(), question: z.string(), options: z.array(z.string()), allowsMultiple: z.boolean().optional(), closesAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [poll] = await database.insert(groupPolls).values({ groupId: input.groupId, creatorId: ctx.user.id, question: input.question, isMultipleChoice: input.allowsMultiple ?? false, expiresAt: input.closesAt }).$returningId();
      for (const opt of input.options) {
        await database.insert(groupPollOptions).values({ pollId: poll.id, optionText: opt });
      }
    }),
    reviewJoinRequest: protectedProcedure.input(z.object({ requestId: z.number(), status: z.enum(["approved", "rejected"]) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(groupJoinRequests).set({ status: input.status }).where(eq(groupJoinRequests.id, input.requestId));
      if (input.status === "approved") {
        const [req] = await database.select().from(groupJoinRequests).where(eq(groupJoinRequests.id, input.requestId));
        if (req) await database.insert(groupMembers).values({ groupId: req.groupId, userId: req.userId, role: "member" });
      }
    }),
    pinGroupMessage: protectedProcedure.input(z.object({ groupId: z.number(), messageId: z.number().nullable() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(groups).set({ pinnedMessageId: input.messageId }).where(eq(groups.id, input.groupId));
    }),
    deleteGroupMessage: protectedProcedure.input(z.object({ groupId: z.number(), messageId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.delete(groupMessages).where(and(eq(groupMessages.id, input.messageId), eq(groupMessages.groupId, input.groupId)));
    }),
    updateGroupProfile: protectedProcedure.input(z.object({ groupId: z.number(), name: z.string(), description: z.string().optional(), avatarUrl: z.string().optional(), visibility: z.enum(["public", "private"]).optional(), joinMode: z.enum(["open", "approval", "invite"]).optional(), postingMode: z.enum(["all", "admins"]).optional() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(groups).set(input).where(eq(groups.id, input.groupId));
    }),
    leaveGroup: protectedProcedure.input(z.object({ groupId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.delete(groupMembers).where(and(eq(groupMembers.groupId, input.groupId), eq(groupMembers.userId, ctx.user.id)));
    }),
    setGroupMemberRole: protectedProcedure.input(z.object({ groupId: z.number(), userId: z.number(), role: z.enum(["admin", "moderator", "member"]) })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(groupMembers).set({ role: input.role }).where(and(eq(groupMembers.groupId, input.groupId), eq(groupMembers.userId, input.userId)));
    }),
    removeGroupMember: protectedProcedure.input(z.object({ groupId: z.number(), userId: z.number() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.delete(groupMembers).where(and(eq(groupMembers.groupId, input.groupId), eq(groupMembers.userId, input.userId)));
    }),
    reviewInviteRequest: protectedProcedure.input(z.object({ requestId: z.number(), status: z.enum(["approved", "rejected"]) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(groupInviteRequests).set({ status: input.status }).where(eq(groupInviteRequests.id, input.requestId));
      if (input.status === "approved") {
        const [req] = await database.select().from(groupInviteRequests).where(eq(groupInviteRequests.id, input.requestId));
        if (req) await database.insert(groupMembers).values({ groupId: req.groupId, userId: req.inviteeId, role: "member" });
      }
    }),
    addGroupMember: protectedProcedure.input(z.object({ groupId: z.number(), userId: z.number() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(groupMembers).values({ groupId: input.groupId, userId: input.userId, role: "member" });
    }),
    requestGroupInvite: protectedProcedure.input(z.object({ groupId: z.number(), userId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(groupInviteRequests).values({ groupId: input.groupId, inviterId: ctx.user.id, inviteeId: input.userId, status: "pending" });
      return { status: "pending" };
    }),
    inviteRequests: protectedProcedure.input(z.object({ groupId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select({ request: groupInviteRequests, inviter: users, invitee: users }).from(groupInviteRequests).innerJoin(users, eq(groupInviteRequests.inviterId, users.id)).innerJoin(users, eq(groupInviteRequests.inviteeId, users.id)).where(eq(groupInviteRequests.groupId, input.groupId));
    }),
    typingSet: protectedProcedure.input(z.object({ peerId: z.number(), groupId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(typingStatus).values({ userId: ctx.user.id, peerId: input.peerId, groupId: input.groupId, updatedAt: new Date() }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
    }),
    joinRequests: protectedProcedure.input(z.object({ groupId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return [];
      return await database.select({ request: groupJoinRequests, user: users }).from(groupJoinRequests).innerJoin(users, eq(groupJoinRequests.userId, users.id)).where(eq(groupJoinRequests.groupId, input.groupId));
    }),
    incomingCalls: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      const res = await database.select({ call: calls, caller: users }).from(calls).innerJoin(users, eq(calls.callerId, users.id)).where(and(eq(calls.receiverId, ctx.user.id), eq(calls.status, "pending"))).orderBy(desc(calls.startedAt));
      return res.map(r => ({ ...r, caller: sanitizeAuthUser(r.caller) }));
    }),
    recentCalls: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      const callerTable = aliasedTable(users, "caller");
      const receiverTable = aliasedTable(users, "receiver");
      const res = await database.select({ call: calls, caller: callerTable, receiver: receiverTable }).from(calls).innerJoin(callerTable, eq(calls.callerId, callerTable.id)).innerJoin(receiverTable, eq(calls.receiverId, receiverTable.id)).where(or(eq(calls.callerId, ctx.user.id), eq(calls.receiverId, ctx.user.id))).orderBy(desc(calls.startedAt)).limit(20);
      return res.map(r => ({
        ...r.call,
        caller: sanitizeAuthUser(r.caller),
        receiver: sanitizeAuthUser(r.receiver),
        peer: r.call.callerId === ctx.user.id ? sanitizeAuthUser(r.receiver) : sanitizeAuthUser(r.caller)
      }));
    }),
    updateCall: protectedProcedure.input(z.object({ callId: z.number(), status: z.enum(["accepted", "declined", "missed", "ended"]), durationSeconds: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [call] = await database.select({ id: calls.id }).from(calls).where(and(eq(calls.id, input.callId), or(eq(calls.callerId, ctx.user.id), eq(calls.receiverId, ctx.user.id))));
      if (!call) throw new TRPCError({ code: "NOT_FOUND", message: "Call not found or access denied." });
      await database.update(calls).set({ status: input.status, endedAt: input.status === "ended" ? new Date() : undefined, durationSeconds: input.durationSeconds }).where(eq(calls.id, input.callId));
      return { success: true };
    }),
    settingsUpdate: protectedProcedure.input(z.object({ peerId: z.number(), isPinned: z.boolean().optional(), isArchived: z.boolean().optional(), isMuted: z.boolean().optional(), themeColor: z.string().optional(), nickname: z.string().nullable().optional() })).mutation(async ({ ctx, input }) => {
      const { peerId, ...settings } = input;
      await db.updateConversationSettings(ctx.user.id, peerId, settings);
    }),
    getCall: protectedProcedure.input(z.object({ callId: z.number() })).query(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [call] = await database.select().from(calls).where(and(eq(calls.id, input.callId), or(eq(calls.callerId, ctx.user.id), eq(calls.receiverId, ctx.user.id))));
      return call || null;
    }),
    signal: protectedProcedure.input(z.object({ callId: z.number(), signalData: z.string() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(calls).set({ signalData: input.signalData }).where(and(eq(calls.id, input.callId), or(eq(calls.callerId, ctx.user.id), eq(calls.receiverId, ctx.user.id))));
    }),
  }),
  stories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      
    // Get stories from users the current user follows, plus their own stories
    const followingRes = await database.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, ctx.user.id));
    const userIds = [ctx.user.id, ...followingRes.map(r => r.followingId)];
    
    if (!userIds.length) return [];
    
    const res = await database.select({ story: stories, owner: users }).from(stories).innerJoin(users, eq(stories.userId, users.id)).where(and(inArray(stories.userId, userIds), gt(stories.expiresAt, new Date()))).orderBy(desc(stories.createdAt));
    
    return res.map(r => ({ ...r, owner: sanitizeAuthUser(r.owner) }));
    }),
    viewers: protectedProcedure.input(z.object({ storyId: z.number() })).query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return { count: 0, viewers: [] };
      const res = await database.select({ viewer: users }).from(storyViews).innerJoin(users, eq(storyViews.userId, users.id)).where(eq(storyViews.storyId, input.storyId));
      return { count: res.length, viewers: res.map(r => sanitizeAuthUser(r.viewer)) };
    }),
    view: protectedProcedure.input(z.object({ storyId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(storyViews).values({ storyId: input.storyId, userId: ctx.user.id }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
      return { success: true };
    }),
    create: protectedProcedure.input(z.object({ mediaUrl: z.string(), mediaType: z.enum(["image", "video"]).optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await assertUserCanCreateContent(ctx.user.id, "story", input.mediaType === "video" ? "video/mp4" : "image/jpeg");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const [inserted] = await database.insert(stories).values({ userId: ctx.user.id, mediaUrl: input.mediaUrl, mediaType: input.mediaType || "image", expiresAt });
      return inserted.insertId;
    }),
    delete: protectedProcedure.input(z.object({ storyId: z.number() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.delete(stories).where(and(eq(stories.id, input.storyId), eq(stories.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      const res = await database.select({ notification: notifications, actor: users }).from(notifications).innerJoin(users, eq(notifications.actorId, users.id)).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(50);
      return res.map(r => ({ ...r, actor: sanitizeAuthUser(r.actor) }));
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return 0;
      const [res] = await database.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
      return res.count;
    }),
    markAsRead: protectedProcedure.input(z.object({ notificationId: z.number() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.update(notifications).set({ isRead: true }).where(eq(notifications.id, input.notificationId));
    }),
    markRead: protectedProcedure.input(z.object({ notificationId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (input.notificationId) {
        await database.update(notifications).set({ isRead: true }).where(eq(notifications.id, input.notificationId));
      } else {
        await database.update(notifications).set({ isRead: true }).where(eq(notifications.userId, ctx.user.id));
      }
    }),
    registerPushToken: protectedProcedure.input(z.object({ token: z.string() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.insert(pushTokens).values({ userId: ctx.user.id, token: input.token }).onDuplicateKeyUpdate({ set: { token: input.token } });
    }),
  }),
});

export type AppRouter = typeof appRouter;
