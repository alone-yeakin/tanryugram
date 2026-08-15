import { z } from "zod";
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
import { eq, and, count, desc, sql } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { sendIncomingCallPush } from "./firebaseAdmin";
import { users, messages, emailVerificationCodes } from "../drizzle/schema";

const stripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe is not configured. Add keys in Settings → Payment." });
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
};
const ownerOnly = protectedProcedure.use(({ ctx, next }) => {
  if (!isTanryugramOwner(ctx.user)) throw new TRPCError({ code: "FORBIDDEN", message: "Owner access required" });
  return next({ ctx });
});
const GROUP_ATTACHMENT_MAX_BYTES = 12 * 1024 * 1024;
const PHOTO_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;
const IMAGE_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_CONTENT_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
function cleanUploadFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160) || "upload";
}
async function validateMediaUpload(contentType: string, sizeBytes?: number) {
  const policy = await db.getMediaUploadPolicy();
  const isImage = IMAGE_CONTENT_TYPES.has(contentType);
  const isVideo = VIDEO_CONTENT_TYPES.has(contentType);
  if (!isImage && !isVideo) throw new TRPCError({ code: "UNSUPPORTED_MEDIA_TYPE", message: "Only JPG, PNG, WEBP, GIF, MP4, WEBM, and MOV files are supported" });
  if (isImage && !policy.photosEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Photo uploads are temporarily paused by the owner" });
  if (isVideo && !policy.videosEnabled) throw new TRPCError({ code: "FORBIDDEN", message: "Video uploads are currently paused to protect beta storage" });
  const maxBytes = isVideo ? VIDEO_UPLOAD_MAX_BYTES : PHOTO_UPLOAD_MAX_BYTES;
  if (sizeBytes !== undefined && sizeBytes > maxBytes) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: `${isVideo ? "Video" : "Photo"} uploads must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller` });
  return isVideo ? "video" as const : "image" as const;
}
function classifyGroupAttachment(contentType: string) {
  if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType)) return "image" as const;
  if (["video/mp4", "video/webm", "video/quicktime"].includes(contentType)) return "video" as const;
  if (["audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/wav"].includes(contentType)) return "audio" as const;
  if (["application/pdf", "text/plain", "text/csv", "application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(contentType)) return "file" as const;
  throw new TRPCError({ code: "UNSUPPORTED_MEDIA_TYPE", message: "This group attachment type is not supported" });
}

export const sanitizeAuthUser = (user: any) => {
  if (!user) return user;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { ...safeUser, isOwner: isTanryugramOwner(user) };
};

export const hasNativePassword = (user: any) => Boolean(user?.passwordHash);
export const requiresEmailVerification = (totalUsers: number, verificationCode?: string | null) => totalUsers >= 1 && !verificationCode?.trim();
export const isVerificationCodeValid = (record: { expiresAt: Date | string } | undefined, now = new Date()) => Boolean(record && now <= new Date(record.expiresAt));

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => sanitizeAuthUser(ctx.user)),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
    signup: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1), username: z.string().min(3), verificationCode: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const existing = (await database.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      const existingUser = (await database.select().from(users).where(eq(users.username, input.username)).limit(1))[0];
      if (existingUser) throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
      
      // Check total user count to implement conditional email verification (1st account free, 2nd+ account requires verification code)
      const userCountRes = await database.select({ count: count() }).from(users);
      const totalUsers = Number(userCountRes[0]?.count || 0);
      
      if (totalUsers >= 1) {
        if (requiresEmailVerification(totalUsers, input.verificationCode)) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
          await database.insert(emailVerificationCodes).values({
            email: input.email,
            code,
            expiresAt,
          });
          try {
            await sendVerificationEmail({ to: input.email, code, purpose: "signup" });
          } catch (error) {
            await database.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, input.email));
            console.error("[EmailVerification] Delivery failed without exposing the code", error instanceof Error ? error.message : "unknown error");
            throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "We could not send the verification email. Please try again later." });
          }
          return { success: false, requiresVerification: true, message: "A verification code was sent to your email. It expires in 15 minutes." };
        } else {
          const record = (await database.select().from(emailVerificationCodes).where(and(eq(emailVerificationCodes.email, input.email), eq(emailVerificationCodes.code, input.verificationCode!))).limit(1))[0];
          if (!isVerificationCodeValid(record)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification code." });
          }
          await database.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, input.email));
        }
      }

      const openId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const passwordHash = Buffer.from(input.password).toString("base64");
      const [insertedId] = await database.insert(users).values({
        openId,
        email: input.email,
        name: input.name,
        username: input.username,
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${input.username}`,
        isVerified: false,
        role: "user"
      });
      const insertedPk = Number(insertedId.insertId || 0);
      const newUser = (await database.select().from(users).where(eq(users.id, insertedPk)).limit(1))[0] || (await database.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
      
      if (isTanryugramOwner(newUser) && (newUser.role !== "admin" || !newUser.isVerified)) {
        await database.update(users).set({ role: "admin", isVerified: true }).where(eq(users.id, newUser.id));
      }
      const token = await sdk.createSessionToken(newUser.openId, { expiresInMs: 30 * 24 * 60 * 60 * 1000, name: newUser.name || newUser.email || "Tanryugram user" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { success: true, requiresVerification: false, user: sanitizeAuthUser(newUser), sessionToken: token };
    }),
    login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const found = (await database.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (!found) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found with this email" });
      
      if (!hasNativePassword(found)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "This account has no native password. Continue with the current Manus account, or use Forgot password? to set one with a verification code." });
      }
      const expectedHash = Buffer.from(input.password).toString("base64");
      if (found.passwordHash !== expectedHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password" });
      }
      
      if (isTanryugramOwner(found) && (found.role !== "admin" || !found.isVerified)) {
        await database.update(users).set({ role: "admin", isVerified: true }).where(eq(users.id, found.id));
      }
      const token = await sdk.createSessionToken(found.openId, { expiresInMs: 30 * 24 * 60 * 60 * 1000, name: found.name || found.email || "Tanryugram user" });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { success: true, user: sanitizeAuthUser(found), sessionToken: token };
    }),
    requestPasswordReset: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const found = (await database.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (!found) throw new TRPCError({ code: "NOT_FOUND", message: "No account found with this email address" });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await database.insert(emailVerificationCodes).values({ email: input.email, code, expiresAt });
      
      try {
        await sendVerificationEmail({ to: input.email, code, purpose: "password-reset" });
      } catch (error) {
        await database.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, input.email));
        console.error("[PasswordReset] Delivery failed without exposing the code", error instanceof Error ? error.message : "unknown error");
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "We could not send the password-reset email. Please try again later." });
      }

      return { success: true, message: "If an account exists, a password-reset code was sent to its email address." };
    }),
    confirmPasswordReset: publicProcedure.input(z.object({ email: z.string().email(), code: z.string().min(6), newPassword: z.string().min(6) })).mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const validCode = (await database.select().from(emailVerificationCodes).where(and(eq(emailVerificationCodes.email, input.email), eq(emailVerificationCodes.code, input.code), sql`${emailVerificationCodes.expiresAt} > NOW()`)).orderBy(desc(emailVerificationCodes.createdAt)).limit(1))[0];
      if (!isVerificationCodeValid(validCode)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification code" });
      }
      const found = (await database.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (!found) throw new TRPCError({ code: "NOT_FOUND", message: "No account found with this email address" });
      const passwordHash = Buffer.from(input.newPassword).toString("base64");
      await database.update(users).set({ passwordHash }).where(eq(users.id, found.id));
      return { success: true, message: "Password updated successfully with verification code. You can now sign in." };
    }),
  }),
  discovery: router({
    feed: publicProcedure.input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional()).query(({ input }) => db.getFeedPosts(input?.limit ?? 20, input?.offset ?? 0)),
    explore: publicProcedure.query(() => db.getExplorePosts(30)),
    stories: publicProcedure.query(() => db.getStories()),
    creators: publicProcedure.query(() => db.getCreatorDirectory()),
    search: publicProcedure.input(z.object({ query: z.string().min(1) })).query(({ input }) => db.getSearchResults(input.query)),
    ownerFollowers: protectedProcedure.query(({ ctx }) => db.getPrivateOwnerFollowers(ctx.user.id)),
    addOwnerFollower: protectedProcedure.input(z.object({ followerName: z.string().min(1), followerHandle: z.string().min(1), avatarUrl: z.string().optional() })).mutation(({ ctx, input }) => db.addPrivateOwnerFollower(ctx.user.id, input.followerName, input.followerHandle, input.avatarUrl)),
    removeOwnerFollower: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.removePrivateOwnerFollower(input.id)),
  }),
  profile: router({
    byId: publicProcedure.input(z.object({ userId: z.number() })).query(({ input }) => db.getProfileById(input.userId)),
    update: protectedProcedure.input(z.object({ name: z.string().optional(), username: z.string().optional(), bio: z.string().optional(), avatarUrl: z.string().optional(), subscriptionPrice: z.string().optional() })).mutation(({ ctx, input }) => db.updateUserProfile(ctx.user.id, input)),
    applyForBadge: protectedProcedure.input(z.object({ requestedBadge: z.enum(["blue", "black"]), reason: z.string().max(1000).optional() })).mutation(({ ctx, input }) => db.applyForBadge(ctx.user.id, input.requestedBadge, input.reason)),
    myBadgeApplications: protectedProcedure.query(({ ctx }) => db.getUserBadgeApplications(ctx.user.id)),
  }),
  posts: router({
    create: protectedProcedure.input(z.object({ caption: z.string().optional(), mediaUrl: z.string().min(1), mediaType: z.enum(["image", "video"]), mediaUrls: z.array(z.string().min(1)).max(10).optional(), location: z.string().optional(), feeling: z.string().optional(), taggedUsers: z.string().optional(), isPremium: z.boolean().default(false) })).mutation(async ({ ctx, input }) => { await validateMediaUpload(input.mediaType === "image" ? "image/jpeg" : "video/mp4"); return db.createPost({ caption: input.caption, mediaUrl: input.mediaUrl, mediaType: input.mediaType, isPremium: input.isPremium, userId: ctx.user.id }, { mediaUrls: input.mediaUrls, location: input.location, feeling: input.feeling, taggedUsers: input.taggedUsers }); }),
    like: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => { const post = await db.getPostById(input.postId); const result = await db.togglePostLike(input.postId, ctx.user.id); if (result.liked && post && post.userId !== ctx.user.id) await db.createNotification({ userId: post.userId, actorId: ctx.user.id, type: "like", targetId: input.postId, content: "liked your post" }); return result; }),
    reaction: protectedProcedure.input(z.object({ postId: z.number(), reactionType: z.enum(["like", "love", "haha", "wow", "sad", "angry"]) })).mutation(async ({ ctx, input }) => { const post = await db.getPostById(input.postId); const result = await db.toggleReaction(input.postId, ctx.user.id, input.reactionType); if (result.reactionType && post && post.userId !== ctx.user.id) await db.createNotification({ userId: post.userId, actorId: ctx.user.id, type: "like", targetId: input.postId, content: `reacted ${input.reactionType} to your post` }); return result; }),
    reactions: publicProcedure.input(z.object({ postId: z.number() })).query(({ input }) => db.getPostReactions(input.postId)),
    media: publicProcedure.input(z.object({ postId: z.number() })).query(({ input }) => db.getPostMedia(input.postId)),
    save: protectedProcedure.input(z.object({ postId: z.number() })).mutation(({ ctx, input }) => db.togglePostSave(input.postId, ctx.user.id)),
    comment: protectedProcedure.input(z.object({ postId: z.number(), content: z.string().min(1).max(500) })).mutation(async ({ ctx, input }) => { const post = await db.getPostById(input.postId); const id = await db.createComment(input.postId, ctx.user.id, input.content); if (post && post.userId !== ctx.user.id) await db.createNotification({ userId: post.userId, actorId: ctx.user.id, type: "comment", targetId: input.postId, content: "commented on your post" }); return id; }),
    comments: publicProcedure.input(z.object({ postId: z.number() })).query(({ input }) => db.getComments(input.postId)),
    likeState: protectedProcedure.input(z.object({ postId: z.number() })).query(({ ctx, input }) => db.getLikeSaveState(input.postId, ctx.user.id)),
  }),
  follows: router({
    toggle: protectedProcedure.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => { const result = await db.toggleFollow(ctx.user.id, input.userId); if (result.following && input.userId !== ctx.user.id) await db.createNotification({ userId: input.userId, actorId: ctx.user.id, type: "follow", content: result.isFollowBack ? "followed you back" : "started following you" }); return result; }),
    state: protectedProcedure.input(z.object({ userId: z.number() })).query(({ ctx, input }) => db.getFollowState(ctx.user.id, input.userId)),
    followers: protectedProcedure.input(z.object({ userId: z.number() })).query(({ ctx, input }) => db.getFollowers(input.userId, ctx.user.id)),
    following: publicProcedure.input(z.object({ userId: z.number() })).query(({ ctx, input }) => db.getFollowing(input.userId, ctx.user?.id)),
    updatePrivacy: protectedProcedure.input(z.object({ showFollowersList: z.boolean().optional(), showFollowingList: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) return;
      await database.update(users).set({
        ...(input.showFollowersList !== undefined ? { showFollowersList: input.showFollowersList } : {}),
        ...(input.showFollowingList !== undefined ? { showFollowingList: input.showFollowingList } : {}),
      }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
  }),
  stories: router({
    list: publicProcedure.query(() => db.getActiveStories()),
    create: protectedProcedure.input(z.object({ mediaUrl: z.string().min(1), mediaType: z.enum(["image", "video"]) })).mutation(async ({ ctx, input }) => { await validateMediaUpload(input.mediaType === "image" ? "image/jpeg" : "video/mp4"); return db.addStory(ctx.user.id, input.mediaUrl, input.mediaType); }),
    view: protectedProcedure.input(z.object({ storyId: z.number() })).mutation(({ ctx, input }) => db.recordStoryView(input.storyId, ctx.user.id)),
    viewers: protectedProcedure.input(z.object({ storyId: z.number() })).query(async ({ input }) => ({ count: await db.getStoryViewCount(input.storyId), viewers: await db.getStoryViewers(input.storyId) })),
    removeExpired: ownerOnly.mutation(() => db.deleteExpiredStories()),
  }),
  messages: router({
    peers: protectedProcedure.input(z.object({ peerId: z.number().optional() }).optional()).query(({ ctx, input }) => db.getMessagePeers(ctx.user.id, input?.peerId)),
    requests: protectedProcedure.query(({ ctx }) => db.getMessageRequests(ctx.user.id)),
    list: protectedProcedure.input(z.object({ otherUserId: z.number() })).query(({ ctx, input }) => db.getMessages(ctx.user.id, input.otherUserId)),
    send: protectedProcedure.input(z.object({ receiverId: z.number(), content: z.string().min(1).max(2000), replyToId: z.number().optional(), audioUrl: z.string().min(1).optional() })).mutation(async ({ ctx, input }) => { const id = await db.sendMessage(ctx.user.id, input.receiverId, input.content, input.replyToId, input.audioUrl); await db.createNotification({ userId: input.receiverId, actorId: ctx.user.id, type: "message", content: "sent you a message" }); return id; }),
    read: protectedProcedure.input(z.object({ otherUserId: z.number() })).mutation(({ ctx, input }) => db.markConversationRead(ctx.user.id, input.otherUserId)),
    react: protectedProcedure.input(z.object({ messageId: z.number(), emoji: z.string().min(1).max(8) })).mutation(({ ctx, input }) => db.toggleMessageReaction(input.messageId, ctx.user.id, input.emoji)),
    delete: protectedProcedure.input(z.object({ messageId: z.number(), everyone: z.boolean() })).mutation(({ ctx, input }) => db.deleteMessage(input.messageId, ctx.user.id, input.everyone)),
    calls: protectedProcedure.input(z.object({ otherUserId: z.number() })).query(({ ctx, input }) => db.getCallHistory(ctx.user.id, input.otherUserId)),
    recentCalls: protectedProcedure.query(({ ctx }) => db.getRecentCallHistory(ctx.user.id)),
    incomingCalls: protectedProcedure.query(({ ctx }) => db.getPendingIncomingCalls(ctx.user.id)),
    settingsGet: protectedProcedure.input(z.object({ peerId: z.number() })).query(({ ctx, input }) => db.getConversationSettings(ctx.user.id, input.peerId)),
    settingsUpdate: protectedProcedure.input(z.object({ peerId: z.number(), isPinned: z.boolean().optional(), isArchived: z.boolean().optional(), isMuted: z.boolean().optional(), themeColor: z.string().optional() })).mutation(({ ctx, input }) => db.updateConversationSettings(ctx.user.id, input.peerId, input)),
    typingSet: protectedProcedure.input(z.object({ peerId: z.number(), groupId: z.number().optional() })).mutation(({ ctx, input }) => db.setTypingStatus(ctx.user.id, input.peerId, input.groupId)),
    typingGet: protectedProcedure.input(z.object({ peerId: z.number(), groupId: z.number().optional() })).query(({ input }) => db.getTypingStatus(input.peerId, input.groupId)),
    forward: protectedProcedure.input(z.object({ messageIds: z.array(z.number()), receiverIds: z.array(z.number()) })).mutation(async ({ ctx, input }) => {
      for (const receiverId of input.receiverIds) {
        for (const msgId of input.messageIds) {
          // fetch message
          const database = await db.getDb();
          if (!database) continue;
          const msg = (await database.select().from(messages).where(eq(messages.id, msgId)).limit(1))[0];
          if (msg) {
            await db.sendMessage(ctx.user.id, receiverId, `Forwarded: ${msg.content}`, undefined, msg.audioUrl || undefined);
          }
        }
      }
      return { success: true };
    }),
    getCall: protectedProcedure.input(z.object({ callId: z.number() })).query(({ input }) => db.getCall(input.callId)),
    startCall: protectedProcedure.input(z.object({ receiverId: z.number(), callType: z.enum(["audio", "video"]) })).mutation(async ({ ctx, input }) => { try { const id = await db.createCall(ctx.user.id, input.receiverId, input.callType); await db.createNotification({ userId: input.receiverId, actorId: ctx.user.id, type: "message", content: `incoming ${input.callType} call` }); const caller = await db.getUserById(ctx.user.id); const tokens = await db.getUserPushTokens(input.receiverId); if (id) void sendIncomingCallPush(tokens, { callId: Number(id), callerName: caller?.name || "A TanRyuGram member", callType: input.callType }).catch(() => undefined); return id; } catch (error: any) { throw new TRPCError({ code: "CONFLICT", message: error?.message || "User is on another call" }); } }),
    signal: protectedProcedure.input(z.object({ callId: z.number(), signalData: z.string().min(1), status: z.enum(["pending", "accepted"]).optional() })).mutation(({ input }) => db.updateCallSignal(input.callId, input.signalData, input.status)),
    updateCall: protectedProcedure.input(z.object({ callId: z.number(), status: z.enum(["accepted", "declined", "missed", "ended"]), durationSeconds: z.number().optional() })).mutation(({ input }) => db.updateCall(input.callId, input.status, input.durationSeconds ?? 0)),
    groups: protectedProcedure.query(({ ctx }) => db.getGroupsForUser(ctx.user.id)),
    createGroup: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(80), avatarUrl: z.string().optional(), description: z.string().max(2000).optional(), visibility: z.enum(["public", "private"]).default("private"), joinMode: z.enum(["open", "approval", "invite"]).default("invite"), postingMode: z.enum(["all", "admins"]).default("all"), memberIds: z.array(z.number().int().positive()).max(99).default([]) })).mutation(({ ctx, input }) => db.createGroup(ctx.user.id, input.name, input.avatarUrl, input.memberIds, { description: input.description, visibility: input.visibility, joinMode: input.joinMode, postingMode: input.postingMode })),
    addGroupMember: protectedProcedure.input(z.object({ groupId: z.number().positive(), userId: z.number().positive() })).mutation(async ({ ctx, input }) => { try { return await db.addGroupMember(input.groupId, ctx.user.id, input.userId); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not add member" }); } }),
    removeGroupMember: protectedProcedure.input(z.object({ groupId: z.number().positive(), userId: z.number().positive() })).mutation(async ({ ctx, input }) => { try { return await db.removeGroupMember(input.groupId, ctx.user.id, input.userId); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not remove member" }); } }),
    leaveGroup: protectedProcedure.input(z.object({ groupId: z.number().positive() })).mutation(({ ctx, input }) => db.leaveGroup(input.groupId, ctx.user.id)),
    discoverGroups: protectedProcedure.input(z.object({ query: z.string().optional() }).optional()).query(({ input }) => db.getPublicGroups(input?.query ?? "")),
    updateGroupProfile: protectedProcedure.input(z.object({ groupId: z.number().positive(), name: z.string().trim().min(1).max(128).optional(), description: z.string().max(2000).optional(), avatarUrl: z.string().optional(), visibility: z.enum(["public", "private"]).optional(), joinMode: z.enum(["open", "approval", "invite"]).optional(), postingMode: z.enum(["all", "admins"]).optional() })).mutation(async ({ ctx, input }) => { const { groupId, ...changes } = input; try { return await db.updateGroupProfile(groupId, ctx.user.id, changes); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not update group" }); } }),
    joinGroup: protectedProcedure.input(z.object({ groupId: z.number().positive() })).mutation(({ ctx, input }) => db.requestToJoinGroup(input.groupId, ctx.user.id)),
    joinRequests: protectedProcedure.input(z.object({ groupId: z.number().positive() })).query(async ({ ctx, input }) => { try { return await db.getGroupJoinRequests(input.groupId, ctx.user.id); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not view join requests" }); } }),
    reviewJoinRequest: protectedProcedure.input(z.object({ requestId: z.number().positive(), approved: z.boolean() })).mutation(async ({ ctx, input }) => { try { return await db.reviewGroupJoinRequest(input.requestId, ctx.user.id, input.approved); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not review join request" }); } }),
    setGroupMemberRole: protectedProcedure.input(z.object({ groupId: z.number().positive(), userId: z.number().positive(), role: z.enum(["admin", "moderator", "member"]) })).mutation(async ({ ctx, input }) => { try { return await db.setGroupMemberRole(input.groupId, ctx.user.id, input.userId, input.role); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not update member role" }); } }),
    pinGroupMessage: protectedProcedure.input(z.object({ groupId: z.number().positive(), messageId: z.number().positive().nullable() })).mutation(async ({ ctx, input }) => { try { return await db.pinGroupMessage(input.groupId, ctx.user.id, input.messageId); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not pin message" }); } }),
    deleteGroupMessage: protectedProcedure.input(z.object({ groupId: z.number().positive(), messageId: z.number().positive() })).mutation(async ({ ctx, input }) => { try { return await db.deleteGroupMessage(input.groupId, ctx.user.id, input.messageId); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not delete group message" }); } }),
    createPoll: protectedProcedure.input(z.object({ groupId: z.number().positive(), question: z.string().trim().min(1).max(500), options: z.array(z.string().trim().min(1).max(280)).min(2).max(10), allowsMultiple: z.boolean().default(false), closesAt: z.date().optional() })).mutation(async ({ ctx, input }) => { try { return await db.createGroupPoll(input.groupId, ctx.user.id, input.question, input.options, input.allowsMultiple, input.closesAt); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not create poll" }); } }),
    poll: protectedProcedure.input(z.object({ pollId: z.number().positive() })).query(({ ctx, input }) => db.getGroupPoll(input.pollId, ctx.user.id)),
    votePoll: protectedProcedure.input(z.object({ pollId: z.number().positive(), optionId: z.number().positive() })).mutation(async ({ ctx, input }) => { try { return await db.voteGroupPoll(input.pollId, ctx.user.id, input.optionId); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not vote" }); } }),
    createEvent: protectedProcedure.input(z.object({ groupId: z.number().positive(), name: z.string().trim().min(1).max(180), description: z.string().max(2000).optional(), location: z.string().max(280).optional(), imageUrl: z.string().optional(), startsAt: z.date() })).mutation(async ({ ctx, input }) => { const { groupId, ...event } = input; try { return await db.createGroupEvent(groupId, ctx.user.id, event); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not create event" }); } }),
    events: protectedProcedure.input(z.object({ groupId: z.number().positive() })).query(async ({ ctx, input }) => { try { return await db.listGroupEvents(input.groupId, ctx.user.id); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not view group events" }); } }),
    rsvpEvent: protectedProcedure.input(z.object({ eventId: z.number().positive(), status: z.enum(["going", "maybe", "cant_go"]) })).mutation(async ({ ctx, input }) => { try { return await db.respondToGroupEvent(input.eventId, ctx.user.id, input.status); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not update RSVP" }); } }),
    groupMedia: protectedProcedure.input(z.object({ groupId: z.number().positive(), query: z.string().optional() })).query(async ({ ctx, input }) => { try { return await db.getGroupMedia(input.groupId, input.query ?? "", ctx.user.id); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not view group media" }); } }),
    groupMembers: protectedProcedure.input(z.object({ groupId: z.number().positive() })).query(async ({ ctx, input }) => { try { return await db.getGroupMembers(input.groupId, ctx.user.id); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not view group members" }); } }),
    groupMessages: protectedProcedure.input(z.object({ groupId: z.number().positive() })).query(async ({ ctx, input }) => { try { return await db.getGroupMessages(input.groupId, ctx.user.id); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not view group messages" }); } }),
    sendGroupMessage: protectedProcedure.input(z.object({ groupId: z.number(), content: z.string().min(1).max(4000), mediaUrl: z.string().optional(), attachmentType: z.enum(["image", "video", "audio", "file", "link"]).optional(), attachmentName: z.string().max(255).optional(), attachmentMimeType: z.string().max(160).optional(), attachmentSizeBytes: z.number().int().nonnegative().max(GROUP_ATTACHMENT_MAX_BYTES).optional(), attachmentDurationSeconds: z.number().int().nonnegative().max(7200).optional() })).mutation(async ({ ctx, input }) => { try { return await db.sendGroupMessage(input.groupId, ctx.user.id, input.content, { mediaUrl: input.mediaUrl, attachmentType: input.attachmentType, attachmentName: input.attachmentName, attachmentMimeType: input.attachmentMimeType, attachmentSizeBytes: input.attachmentSizeBytes, attachmentDurationSeconds: input.attachmentDurationSeconds }); } catch (error: any) { throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "You are not a group member" }); } }),
    uploadGroupAttachment: protectedProcedure.input(z.object({ groupId: z.number().positive(), fileName: z.string().min(1).max(255), base64Data: z.string().min(1).max(17 * 1024 * 1024), contentType: z.string().min(1).max(160) })).mutation(async ({ ctx, input }) => {
      try {
        await db.assertGroupCanPost(input.groupId, ctx.user.id);
        const attachmentType = classifyGroupAttachment(input.contentType);
        const base64 = input.base64Data.replace(/^data:.*;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        if (!buffer.length || buffer.length > GROUP_ATTACHMENT_MAX_BYTES) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Group attachments must be 12 MB or smaller" });
        if (attachmentType === "image" || attachmentType === "video") await validateMediaUpload(input.contentType, buffer.length);
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160) || "attachment";
        const stored = await storagePut(`groups/${input.groupId}/${ctx.user.id}/${Date.now()}-${safeName}`, buffer, input.contentType);
        return { ...stored, attachmentType, attachmentName: input.fileName, attachmentMimeType: input.contentType, attachmentSizeBytes: buffer.length };
      } catch (error: any) { if (error instanceof TRPCError) throw error; throw new TRPCError({ code: "FORBIDDEN", message: error?.message || "Could not upload group attachment" }); }
    }),
  }),
  notifications: router({ list: protectedProcedure.query(({ ctx }) => db.getNotifications(ctx.user.id)), unreadCount: protectedProcedure.query(({ ctx }) => db.getUnreadNotificationCount(ctx.user.id)), markRead: protectedProcedure.input(z.object({ notificationId: z.number().optional() })).mutation(({ ctx, input }) => db.markNotificationRead(ctx.user.id, input.notificationId)), registerPushToken: protectedProcedure.input(z.object({ token: z.string().min(1).max(255) })).mutation(({ ctx, input }) => db.registerPushToken(ctx.user.id, input.token)) }),
  media: router({
    policy: publicProcedure.query(() => db.getMediaUploadPolicy()),
    prepareUpload: protectedProcedure.input(z.object({ fileName: z.string().min(1).max(255), contentType: z.string().min(1), fileSizeBytes: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => { await validateMediaUpload(input.contentType, input.fileSizeBytes); return storagePresignPut(`users/${ctx.user.id}/${cleanUploadFileName(input.fileName)}`, input.contentType); }),
    uploadBase64: protectedProcedure.input(z.object({ fileName: z.string().min(1).max(255), base64Data: z.string().min(1), contentType: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const base64 = input.base64Data.replace(/^data:.*;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      await validateMediaUpload(input.contentType, buffer.length);
      if (!buffer.length) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected file is empty or could not be decoded" });
      return storagePut(`users/${ctx.user.id}/${cleanUploadFileName(input.fileName)}`, buffer, input.contentType);
    }),
  }),
  payments: router({
    // Payments completely removed for 200-user beta
    tips: protectedProcedure.query(() => []),
  }),
  admin: router({ overview: ownerOnly.query(() => db.getAdminMetrics()), users: ownerOnly.query(() => db.getAllUsers()), posts: ownerOnly.query(() => db.getAllPosts()), badgeApplications: ownerOnly.query(() => db.getAllBadgeApplications()), uploadPolicy: ownerOnly.query(() => db.getMediaUploadPolicy()), setUploadPolicy: ownerOnly.input(z.object({ photosEnabled: z.boolean(), videosEnabled: z.boolean() })).mutation(({ ctx, input }) => db.updateMediaUploadPolicy(ctx.user.id, input)), verifyUser: ownerOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(({ input }: { input: { userId: number; value: boolean } }) => db.verifyUser(input.userId, input.value)), setBadge: ownerOnly.input(z.object({ userId: z.number(), badgeType: z.enum(["none", "blue", "black"]) })).mutation(({ input }: { input: { userId: number; badgeType: "none" | "blue" | "black" } }) => db.setUserBadge(input.userId, input.badgeType)),     setCreator: ownerOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(({ input }: { input: { userId: number; value: boolean } }) => db.setUserCreator(input.userId, input.value)),
    setBadgeLabel: ownerOnly.input(z.object({ userId: z.number(), label: z.string().min(1).max(32) })).mutation(({ input }) => db.setBadgeLabel(input.userId, input.label)),
    setShowBadge: ownerOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(({ input }) => db.setShowBadge(input.userId, input.value)), setDisplayedFollowers: ownerOnly.input(z.object({ userId: z.number(), count: z.number().int().min(0).nullable() })).mutation(({ input }: { input: { userId: number; count: number | null } }) => db.setDisplayedFollowersCount(input.userId, input.count)), reviewBadge: ownerOnly.input(z.object({ applicationId: z.number(), status: z.enum(["approved", "rejected"]) })).mutation(({ ctx, input }) => db.reviewBadgeApplication(input.applicationId, ctx.user.id, input.status)), banUser: ownerOnly.input(z.object({ userId: z.number(), value: z.boolean() })).mutation(({ input }: { input: { userId: number; value: boolean } }) => db.banUser(input.userId, input.value)), setRole: ownerOnly.input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) })).mutation(({ input }: { input: { userId: number; role: "user" | "admin" } }) => db.setUserRole(input.userId, input.role)), deletePost: ownerOnly.input(z.object({ postId: z.number() })).mutation(({ input }: { input: { postId: number } }) => db.deletePost(input.postId)) }),
});

export type AppRouter = typeof appRouter;
