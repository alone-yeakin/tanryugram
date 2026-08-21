import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, or, like, desc, sql, inArray } from "drizzle-orm";
import { canDeletePost, isTanryugramOwner } from "./authorization";
import { resolveDisplayedFollowerCount } from "./followerStats";
import { calls, comments, follows, followRequests, groups, groupMembers, groupMessages, groupJoinRequests, groupPolls, groupPollOptions, groupPollVotes, groupEvents, groupEventRsvps, groupAuditEvents, userSettings, conversationSettings, typingStatus, likes, mediaUploadPolicy, emailDeliverySettings, recoverySupportSettings, recoverySupportRequests, groupInviteRequests, recoverySupportMessages, messageHidden, messageReactions, messages, notifications, postMedia, postReactions, posts, privateOwnerFollowers, badgeApplications, pushTokens, saves, stories, storyViews, subscriptions, tips, users, type InsertPost, type InsertUser } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) _db = drizzle(process.env.DATABASE_URL);
  return _db;
}

export async function upsertUser(user: InsertUser) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod", "username", "avatarUrl", "bio"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] as never; updateSet[field] = user[field] ?? null; }
  }
  if (isTanryugramOwner(user)) { values.role = "admin"; updateSet.role = "admin"; } else if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0]; }
export async function getUserById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]; }
export async function searchUsers(query: string) {
  const db = await getDb();
  if (!db) return [];
  const p = `%${query}%`;
  return db.select()
    .from(users)
    .where(or(like(users.name, p), like(users.username, p), like(users.email, p)))
    .orderBy(desc(users.isVerified), desc(users.createdAt))
    .limit(20);
}
const publicCreatorFields = { id: users.id, name: users.name, username: users.username, avatarUrl: users.avatarUrl, isVerified: users.isVerified, badgeType: users.badgeType, isCreator: users.isCreator, badgeLabel: users.badgeLabel, showBadge: users.showBadge };
export async function getFeedPosts(limit = 20, offset = 0) { const db = await getDb(); if (!db) return []; return db.select({ post: posts, creator: publicCreatorFields }).from(posts).leftJoin(users, eq(posts.userId, users.id)).orderBy(desc(posts.createdAt)).limit(limit).offset(offset); }
export async function getExplorePosts(limit = 24) { const db = await getDb(); if (!db) return []; return db.select({ post: posts, creator: publicCreatorFields }).from(posts).leftJoin(users, eq(posts.userId, users.id)).orderBy(desc(posts.likesCount), desc(posts.createdAt)).limit(limit); }
export async function getStories() { const db = await getDb(); if (!db) return []; return db.select({ story: stories, creator: publicCreatorFields }).from(stories).leftJoin(users, eq(stories.userId, users.id)).where(sql`${stories.expiresAt} > NOW()`).orderBy(desc(stories.createdAt)); }
export async function getProfilePosts(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt)).limit(48); }
export async function getUserStats(userId: number) { const db = await getDb(); if (!db) return { followers: 0, following: 0, posts: 0 }; const [a,b,c,user] = await Promise.all([db.select({ count: sql<number>`COUNT(DISTINCT ${follows.followerId})` }).from(follows).where(eq(follows.followingId, userId)), db.select({ count: sql<number>`COUNT(DISTINCT ${follows.followingId})` }).from(follows).where(eq(follows.followerId, userId)), db.select({ count: sql<number>`COUNT(*)` }).from(posts).where(eq(posts.userId, userId)), getUserById(userId)]); const realFollowers = Number(a[0]?.count ?? 0); return { followers: resolveDisplayedFollowerCount(user?.displayedFollowersCount, realFollowers), following: Number(b[0]?.count ?? 0), posts: Number(c[0]?.count ?? 0) }; }
export async function getNotifications(userId: number) { const db = await getDb(); if (!db) return []; return db.select({ notification: notifications, actor: publicCreatorFields }).from(notifications).leftJoin(users, eq(notifications.actorId, users.id)).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50); }
export async function getUnreadNotificationCount(userId: number) { const db = await getDb(); if (!db) return 0; const r = await db.select({ count: sql<number>`COUNT(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))); return Number(r[0]?.count ?? 0); }
export async function getMediaUploadPolicy() {
  const db = await getDb();
  if (!db) return { photosEnabled: true, profilePhotosEnabled: true, videosEnabled: false };
  const existing = (await db.select().from(mediaUploadPolicy).limit(1))[0];
  if (existing) return existing;
  await db.insert(mediaUploadPolicy).values({ photosEnabled: true, profilePhotosEnabled: true, videosEnabled: false });
  return (await db.select().from(mediaUploadPolicy).limit(1))[0] ?? { photosEnabled: true, profilePhotosEnabled: true, videosEnabled: false };
}
export async function updateMediaUploadPolicy(userId: number, input: { photosEnabled?: boolean; profilePhotosEnabled?: boolean; videosEnabled?: boolean }) {
  const db = await getDb();
  if (!db) return { photosEnabled: input.photosEnabled ?? true, profilePhotosEnabled: input.profilePhotosEnabled ?? true, videosEnabled: input.videosEnabled ?? false };
  const existing = (await db.select().from(mediaUploadPolicy).limit(1))[0];
  if (existing) {
    await db.update(mediaUploadPolicy).set({
      ...(input.photosEnabled !== undefined ? { photosEnabled: input.photosEnabled } : {}),
      ...(input.profilePhotosEnabled !== undefined ? { profilePhotosEnabled: input.profilePhotosEnabled } : {}),
      ...(input.videosEnabled !== undefined ? { videosEnabled: input.videosEnabled } : {}),
      updatedBy: userId,
    }).where(eq(mediaUploadPolicy.id, existing.id));
  } else {
    await db.insert(mediaUploadPolicy).values({ photosEnabled: input.photosEnabled ?? true, profilePhotosEnabled: input.profilePhotosEnabled ?? true, videosEnabled: input.videosEnabled ?? false, updatedBy: userId });
  }
  return getMediaUploadPolicy();
}
export async function getEmailDeliverySettings() {
  const db = await getDb();
  if (!db) return { emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false };
  const existing = (await db.select().from(emailDeliverySettings).limit(1))[0];
  if (existing) return existing;
  await db.insert(emailDeliverySettings).values({ emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false });
  return (await db.select().from(emailDeliverySettings).limit(1))[0] ?? { emailDeliveryEnabled: true, signupVerificationEnabled: false, appScriptLoginEnabled: false, appScriptResetEnabled: false };
}
export async function updateEmailDeliverySettings(userId: number, input: { emailDeliveryEnabled?: boolean; signupVerificationEnabled?: boolean; appScriptLoginEnabled?: boolean; appScriptResetEnabled?: boolean }) {
  const db = await getDb();
  if (!db) return { emailDeliveryEnabled: input.emailDeliveryEnabled ?? true, signupVerificationEnabled: input.signupVerificationEnabled ?? false, appScriptLoginEnabled: input.appScriptLoginEnabled ?? false, appScriptResetEnabled: input.appScriptResetEnabled ?? false };
  const existing = (await db.select().from(emailDeliverySettings).limit(1))[0];
  if (existing) {
    await db.update(emailDeliverySettings).set({
      ...(input.emailDeliveryEnabled !== undefined ? { emailDeliveryEnabled: input.emailDeliveryEnabled } : {}),
      ...(input.signupVerificationEnabled !== undefined ? { signupVerificationEnabled: input.signupVerificationEnabled } : {}),
      ...(input.appScriptLoginEnabled !== undefined ? { appScriptLoginEnabled: input.appScriptLoginEnabled } : {}),
      ...(input.appScriptResetEnabled !== undefined ? { appScriptResetEnabled: input.appScriptResetEnabled } : {}),
      updatedBy: userId,
    }).where(eq(emailDeliverySettings.id, existing.id));
  } else {
    await db.insert(emailDeliverySettings).values({ emailDeliveryEnabled: input.emailDeliveryEnabled ?? true, signupVerificationEnabled: input.signupVerificationEnabled ?? false, appScriptLoginEnabled: input.appScriptLoginEnabled ?? false, appScriptResetEnabled: input.appScriptResetEnabled ?? false, updatedBy: userId });
  }
  return getEmailDeliverySettings();
}
export async function getRecoverySupportSettings() {
  const db = await getDb();
  if (!db) return { guestRecoveryEnabled: false, whatsappSupportEnabled: false, whatsappSupportNumber: "+8801404841981" };
  const existing = (await db.select().from(recoverySupportSettings).limit(1))[0];
  if (existing) return existing;
  await db.insert(recoverySupportSettings).values({ guestRecoveryEnabled: false, whatsappSupportEnabled: false, whatsappSupportNumber: "+8801404841981" });
  return (await db.select().from(recoverySupportSettings).limit(1))[0] ?? { guestRecoveryEnabled: false, whatsappSupportEnabled: false, whatsappSupportNumber: "+8801404841981" };
}
export async function updateRecoverySupportSettings(userId: number, input: { guestRecoveryEnabled: boolean; whatsappSupportEnabled: boolean; whatsappSupportNumber: string }) {
  const db = await getDb();
  if (!db) return input;
  const existing = (await db.select().from(recoverySupportSettings).limit(1))[0];
  if (existing) {
    await db.update(recoverySupportSettings).set({ ...input, updatedBy: userId }).where(eq(recoverySupportSettings.id, existing.id));
  } else {
    await db.insert(recoverySupportSettings).values({ ...input, updatedBy: userId });
  }
  return getRecoverySupportSettings();
}
export async function createRecoverySupportRequest(input: { guestTokenHash: string; accountEmail?: string; guestLabel?: string }) {
  const db = await getDb();
  if (!db) return undefined;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [result] = await db.insert(recoverySupportRequests).values({ ...input, expiresAt });
  const id = Number(result.insertId || 0);
  return (await db.select({ id: recoverySupportRequests.id, accountEmail: recoverySupportRequests.accountEmail, guestLabel: recoverySupportRequests.guestLabel, status: recoverySupportRequests.status, createdAt: recoverySupportRequests.createdAt, expiresAt: recoverySupportRequests.expiresAt }).from(recoverySupportRequests).where(eq(recoverySupportRequests.id, id)).limit(1))[0];
}
export async function getRecoverySupportRequestByHash(guestTokenHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(recoverySupportRequests).where(and(eq(recoverySupportRequests.guestTokenHash, guestTokenHash), eq(recoverySupportRequests.status, "open"), sql`${recoverySupportRequests.expiresAt} > NOW()`)).limit(1))[0];
}
export async function addRecoverySupportMessage(requestId: number, senderType: "guest" | "owner", body: string) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(recoverySupportMessages).values({ requestId, senderType, body });
  await db.update(recoverySupportRequests).set({ lastMessageAt: new Date() }).where(eq(recoverySupportRequests.id, requestId));
  return (await db.select().from(recoverySupportMessages).where(and(eq(recoverySupportMessages.requestId, requestId), eq(recoverySupportMessages.senderType, senderType))).orderBy(desc(recoverySupportMessages.createdAt)).limit(1))[0];
}
export async function getRecoverySupportInbox() {
  const db = await getDb();
  if (!db) return [];
  const requests = await db.select({ id: recoverySupportRequests.id, accountEmail: recoverySupportRequests.accountEmail, guestLabel: recoverySupportRequests.guestLabel, status: recoverySupportRequests.status, createdAt: recoverySupportRequests.createdAt, expiresAt: recoverySupportRequests.expiresAt, lastMessageAt: recoverySupportRequests.lastMessageAt }).from(recoverySupportRequests).orderBy(desc(recoverySupportRequests.lastMessageAt), desc(recoverySupportRequests.createdAt)).limit(100);
  const messages = await db.select({ id: recoverySupportMessages.id, requestId: recoverySupportMessages.requestId, senderType: recoverySupportMessages.senderType, body: recoverySupportMessages.body, createdAt: recoverySupportMessages.createdAt }).from(recoverySupportMessages).orderBy(recoverySupportMessages.createdAt);
  return requests.map((request) => ({ ...request, messages: messages.filter((message) => message.requestId === request.id) }));
}
export async function closeRecoverySupportRequest(requestId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(recoverySupportRequests).set({ status: "closed" }).where(eq(recoverySupportRequests.id, requestId));
}
export async function markNotificationRead(userId: number, notificationId?: number) { const db = await getDb(); if (!db) return; await db.update(notifications).set({ isRead: true }).where(notificationId ? and(eq(notifications.id, notificationId), eq(notifications.userId, userId)) : eq(notifications.userId, userId)); }
export async function getMessages(userId: number, otherUserId: number) {
  const db = await getDb();
  if (!db) return [];
  await db.update(messages).set({ deliveryStatus: "delivered" }).where(and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId), eq(messages.deliveryStatus, "sent")));
  const [rows, hidden] = await Promise.all([db.select().from(messages).where(or(and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)), and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId)))).orderBy(messages.createdAt), db.select({ messageId: messageHidden.messageId }).from(messageHidden).where(eq(messageHidden.userId, userId))]);
  const hiddenIds = new Set(hidden.map((row) => row.messageId));
  return rows.filter((row) => !hiddenIds.has(row.id));
}
export async function getMessagePeers(userId: number, explicitPeerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const allMessages = await db.select().from(messages).where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));
  const peerIds = new Set<number>();
  for (const m of allMessages) {
    if (m.senderId === userId) peerIds.add(m.receiverId);
    if (m.receiverId === userId) peerIds.add(m.senderId);
  }
  if (explicitPeerId) peerIds.add(explicitPeerId);
  if (peerIds.size === 0) return [];
  const peerRows = await db.select().from(users).where(inArray(users.id, Array.from(peerIds)));
  return Promise.all(peerRows.map(async (peer) => {
    const latest = (await db.select().from(messages).where(or(and(eq(messages.senderId, userId), eq(messages.receiverId, peer.id)), and(eq(messages.senderId, peer.id), eq(messages.receiverId, userId)))).orderBy(desc(messages.createdAt)).limit(1))[0];
    const unread = (await db.select({ count: sql<number>`COUNT(*)` }).from(messages).where(and(eq(messages.senderId, peer.id), eq(messages.receiverId, userId), eq(messages.isRead, false))))[0];
    const settings = (await db.select().from(conversationSettings).where(and(eq(conversationSettings.userId, userId), eq(conversationSettings.peerId, peer.id))).limit(1))[0];
    return { peer, lastMessage: latest || null, unreadCount: Number(unread?.count ?? 0), settings: settings || null };
  }));
}
export async function getMessageRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const peers = await db.select().from(users).where(sql`${users.id} <> ${userId}`).orderBy(desc(users.createdAt)).limit(50);
  const requests: Array<{ peer: any; lastMessage: any; unreadCount: number }> = [];
  for (const peer of peers) {
    const latest = (await db.select().from(messages).where(or(and(eq(messages.senderId, userId), eq(messages.receiverId, peer.id)), and(eq(messages.senderId, peer.id), eq(messages.receiverId, userId)))).orderBy(desc(messages.createdAt)).limit(1))[0];
    const followsPeer = (await db.select().from(follows).where(and(eq(follows.followerId, userId), eq(follows.followingId, peer.id))).limit(1))[0];
    if (!latest || latest.senderId !== peer.id || followsPeer) continue;
    const unread = (await db.select({ count: sql<number>`COUNT(*)` }).from(messages).where(and(eq(messages.senderId, peer.id), eq(messages.receiverId, userId), eq(messages.isRead, false))))[0];
    requests.push({ peer, lastMessage: latest, unreadCount: Number(unread?.count ?? 0) });
  }
  return requests;
}
export async function markConversationRead(userId: number, otherUserId: number) { const db = await getDb(); if (!db) return; await db.update(messages).set({ isRead: true, deliveryStatus: "read" }).where(and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))); }
export async function getPostById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(posts).where(eq(posts.id, id)).limit(1))[0]; }
export async function createPost(input: InsertPost, extra?: { mediaUrls?: string[]; location?: string; feeling?: string; taggedUsers?: string }) { const db = await getDb(); if (!db) return undefined; const result = await db.insert(posts).values({ ...input, location: extra?.location, feeling: extra?.feeling, taggedUsers: extra?.taggedUsers }); const postId = result[0]?.insertId; if (postId && extra?.mediaUrls?.length) await db.insert(postMedia).values(extra.mediaUrls.slice(0, 10).map((mediaUrl, sortOrder) => ({ postId, mediaUrl, sortOrder }))); return postId; }
export async function getPostMedia(postId: number) { const db = await getDb(); if (!db) return []; return db.select().from(postMedia).where(eq(postMedia.postId, postId)).orderBy(postMedia.sortOrder); }
export async function toggleReaction(postId: number, userId: number, reactionType: "like" | "love" | "haha" | "wow" | "sad" | "angry") { const db = await getDb(); if (!db) return { reactionType: null }; const existing = (await db.select().from(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId))).limit(1))[0]; if (existing?.reactionType === reactionType) { await db.delete(postReactions).where(eq(postReactions.id, existing.id)); return { reactionType: null }; } if (existing) await db.update(postReactions).set({ reactionType }).where(eq(postReactions.id, existing.id)); else await db.insert(postReactions).values({ postId, userId, reactionType }); return { reactionType }; }
export async function getPostReactions(postId: number) { const db = await getDb(); if (!db) return []; return db.select({ reaction: postReactions, user: users }).from(postReactions).innerJoin(users, eq(postReactions.userId, users.id)).where(eq(postReactions.postId, postId)).orderBy(desc(postReactions.createdAt)); }
export async function togglePostLike(postId: number, userId: number) { const db = await getDb(); if (!db) return { liked: false }; const row = (await db.select().from(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId))).limit(1))[0]; if (row) { await db.delete(likes).where(eq(likes.id, row.id)); await db.update(posts).set({ likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)` }).where(eq(posts.id, postId)); return { liked: false }; } await db.insert(likes).values({ postId, userId }); await db.update(posts).set({ likesCount: sql`${posts.likesCount} + 1` }).where(eq(posts.id, postId)); return { liked: true }; }
export async function togglePostSave(postId: number, userId: number) { const db = await getDb(); if (!db) return { saved: false }; const row = (await db.select().from(saves).where(and(eq(saves.postId, postId), eq(saves.userId, userId))).limit(1))[0]; if (row) { await db.delete(saves).where(eq(saves.id, row.id)); return { saved: false }; } await db.insert(saves).values({ postId, userId }); return { saved: true }; }
export async function createComment(postId: number, userId: number, content: string) { const db = await getDb(); if (!db) return undefined; const id = (await db.insert(comments).values({ postId, userId, content }))[0]?.insertId; await db.update(posts).set({ commentsCount: sql`${posts.commentsCount} + 1` }).where(eq(posts.id, postId)); return id; }
export async function toggleFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return { following: false, isFollowBack: false, requestPending: false };
  if (followerId === followingId) throw new Error("You cannot follow yourself");
  const target = (await db.select({ user: users, settings: userSettings }).from(users).leftJoin(userSettings, eq(userSettings.userId, users.id)).where(eq(users.id, followingId)).limit(1))[0];
  if (!target?.user) throw new Error("Profile not found");
  const row = (await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))).limit(1))[0];
  if (row) {
    await db.delete(follows).where(eq(follows.id, row.id));
    return { following: false, isFollowBack: false, requestPending: false };
  }
  const pending = (await db.select().from(followRequests).where(and(eq(followRequests.requesterId, followerId), eq(followRequests.targetUserId, followingId), eq(followRequests.status, "pending"))).limit(1))[0];
  if (pending) {
    await db.update(followRequests).set({ status: "cancelled" }).where(eq(followRequests.id, pending.id));
    return { following: false, isFollowBack: false, requestPending: false };
  }
  if (target.settings?.isPrivate) {
    await db.insert(followRequests).values({ requesterId: followerId, targetUserId: followingId, status: "pending" });
    return { following: false, isFollowBack: false, requestPending: true };
  }
  const reverse = (await db.select().from(follows).where(and(eq(follows.followerId, followingId), eq(follows.followingId, followerId))).limit(1))[0];
  await db.insert(follows).values({ followerId, followingId });
  return { following: true, isFollowBack: Boolean(reverse), requestPending: false };
}
export async function getFollowRequestState(requesterId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) return false;
  return Boolean((await db.select().from(followRequests).where(and(eq(followRequests.requesterId, requesterId), eq(followRequests.targetUserId, targetUserId), eq(followRequests.status, "pending"))).limit(1))[0]);
}
export async function getIncomingFollowRequests(targetUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ request: followRequests, user: users }).from(followRequests).innerJoin(users, eq(followRequests.requesterId, users.id)).where(and(eq(followRequests.targetUserId, targetUserId), eq(followRequests.status, "pending"))).orderBy(desc(followRequests.createdAt));
}
export async function reviewFollowRequest(targetUserId: number, requestId: number, status: "approved" | "rejected") {
  const db = await getDb();
  if (!db) return { status };
  const request = (await db.select().from(followRequests).where(and(eq(followRequests.id, requestId), eq(followRequests.targetUserId, targetUserId), eq(followRequests.status, "pending"))).limit(1))[0];
  if (!request) throw new Error("Follow request not found");
  if (status === "approved") {
    const existing = (await db.select().from(follows).where(and(eq(follows.followerId, request.requesterId), eq(follows.followingId, targetUserId))).limit(1))[0];
    if (!existing) await db.insert(follows).values({ followerId: request.requesterId, followingId: targetUserId });
  }
  await db.update(followRequests).set({ status }).where(eq(followRequests.id, requestId));
  return { status, requesterId: request.requesterId };
}
export async function sendMessage(senderId: number, receiverId: number, content: string, replyToId?: number, audioUrl?: string) { const db = await getDb(); if (!db) return undefined; return (await db.insert(messages).values({ senderId, receiverId, content, replyToId, audioUrl }))[0]?.insertId; }
export async function toggleMessageReaction(messageId: number, userId: number, emoji: string) { const db = await getDb(); if (!db) return; const existing = (await db.select().from(messageReactions).where(and(eq(messageReactions.messageId, messageId), eq(messageReactions.userId, userId), eq(messageReactions.emoji, emoji))).limit(1))[0]; if (existing) await db.delete(messageReactions).where(eq(messageReactions.id, existing.id)); else await db.insert(messageReactions).values({ messageId, userId, emoji }); }
export async function deleteMessage(messageId: number, userId: number, everyone: boolean) { const db = await getDb(); if (!db) return; const message = (await db.select().from(messages).where(eq(messages.id, messageId)).limit(1))[0]; if (!message || (everyone && message.senderId !== userId)) return; if (everyone) await db.update(messages).set({ deletedForEveryone: true, content: "Message deleted", audioUrl: null }).where(eq(messages.id, messageId)); else { const hidden = (await db.select().from(messageHidden).where(and(eq(messageHidden.messageId, messageId), eq(messageHidden.userId, userId))).limit(1))[0]; if (!hidden) await db.insert(messageHidden).values({ messageId, userId }); } }
export async function createCall(callerId: number, receiverId: number, callType: "audio" | "video") {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(calls).set({ status: "missed", endedAt: new Date() }).where(and(eq(calls.status, "pending"), sql`${calls.startedAt} < DATE_SUB(NOW(), INTERVAL 60 SECOND)`));
  // Clean up any stale pending or accepted calls older than 45 seconds to prevent deadlock
  await db.update(calls).set({ status: "missed", endedAt: new Date() }).where(and(or(eq(calls.status, "pending"), eq(calls.status, "accepted")), sql`${calls.startedAt} < DATE_SUB(NOW(), INTERVAL 45 SECOND)`));

  const active = await db.select().from(calls).where(and(or(eq(calls.callerId, callerId), eq(calls.receiverId, callerId), eq(calls.callerId, receiverId), eq(calls.receiverId, receiverId)), or(eq(calls.status, "pending"), eq(calls.status, "accepted")))).limit(1);
  if (active.length) {
    // If the active call belongs to the same caller/receiver pair and is pending, allow reconnect/overwrite
    const existing = active[0];
    if (existing && existing.callerId === callerId && existing.receiverId === receiverId && existing.status === "pending") {
      await db.update(calls).set({ status: "ended", endedAt: new Date() }).where(eq(calls.id, existing.id));
    } else {
      throw new Error("User is on another call");
    }
  }
  const roomId = `call-${callerId}-${receiverId}-${Date.now()}`;
  return (await db.insert(calls).values({ callerId, receiverId, callType, roomId }))[0]?.insertId;
}
export async function updateCall(callId: number, status: "accepted" | "declined" | "missed" | "ended", durationSeconds = 0) { const db = await getDb(); if (!db) return; await db.update(calls).set({ status, durationSeconds, endedAt: status === "ended" || status === "declined" || status === "missed" ? new Date() : undefined }).where(eq(calls.id, callId)); }
export async function updateCallSignal(callId: number, signalData: string, status?: "pending" | "accepted") { const db = await getDb(); if (!db) return; await db.update(calls).set({ signalData, status }).where(eq(calls.id, callId)); }
export async function getCall(callId: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(calls).where(eq(calls.id, callId)).limit(1))[0]; }
export async function getCallHistory(userId: number, otherUserId: number) { const db = await getDb(); if (!db) return []; return db.select().from(calls).where(or(and(eq(calls.callerId, userId), eq(calls.receiverId, otherUserId)), and(eq(calls.callerId, otherUserId), eq(calls.receiverId, userId)))).orderBy(desc(calls.startedAt)).limit(50); }
export async function getRecentCallHistory(userId: number) { const db = await getDb(); if (!db) return []; return db.select({ call: calls, peer: users }).from(calls).innerJoin(users, or(and(eq(calls.callerId, userId), eq(calls.receiverId, users.id)), and(eq(calls.receiverId, userId), eq(calls.callerId, users.id)))).where(or(eq(calls.callerId, userId), eq(calls.receiverId, userId))).orderBy(desc(calls.startedAt)).limit(12); }
export async function getPendingIncomingCalls(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ call: calls, caller: users }).from(calls).innerJoin(users, eq(calls.callerId, users.id)).where(and(eq(calls.receiverId, userId), eq(calls.status, "pending"))).orderBy(desc(calls.startedAt)).limit(5);
}
export async function createNotification(input: { userId: number; actorId: number; type: "like" | "comment" | "follow" | "message" | "tip" | "subscribe"; targetId?: number; content: string }) { const db = await getDb(); if (!db) return; await db.insert(notifications).values(input); }
export async function verifyUser(userId: number, value: boolean) { const db = await getDb(); if (!db) return; await db.update(users).set({ isVerified: value, badgeType: value ? "blue" : "none" }).where(eq(users.id, userId)); }
export async function setUserBadge(userId: number, badgeType: "none" | "blue" | "black") { const db = await getDb(); if (!db) return; await db.update(users).set({ badgeType, isVerified: badgeType === "blue" }).where(eq(users.id, userId)); }
export async function setUserCreator(userId: number, value: boolean) { const db = await getDb(); if (!db) return; await db.update(users).set({ isCreator: value }).where(eq(users.id, userId)); }
export async function setDisplayedFollowersCount(userId: number, displayedFollowersCount: number | null) { const db = await getDb(); if (!db) return; await db.update(users).set({ displayedFollowersCount }).where(eq(users.id, userId)); }
export async function applyForBadge(userId: number, requestedBadge: "blue" | "black", reason?: string) { const db = await getDb(); if (!db) return undefined; const pending = (await db.select().from(badgeApplications).where(and(eq(badgeApplications.userId, userId), eq(badgeApplications.status, "pending"))).limit(1))[0]; if (pending) return pending.id; return (await db.insert(badgeApplications).values({ userId, requestedBadge, reason: reason || null }))[0]?.insertId; }
export async function getUserBadgeApplications(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(badgeApplications).where(eq(badgeApplications.userId, userId)).orderBy(desc(badgeApplications.createdAt)).limit(20); }
export async function getAllBadgeApplications() { const db = await getDb(); if (!db) return []; return db.select({ application: badgeApplications, user: users }).from(badgeApplications).innerJoin(users, eq(badgeApplications.userId, users.id)).orderBy(desc(badgeApplications.createdAt)).limit(100); }
export async function reviewBadgeApplication(applicationId: number, reviewerId: number, status: "approved" | "rejected") { const db = await getDb(); if (!db) return; const application = (await db.select().from(badgeApplications).where(eq(badgeApplications.id, applicationId)).limit(1))[0]; if (!application) return; await db.update(badgeApplications).set({ status, reviewedBy: reviewerId, reviewedAt: new Date() }).where(eq(badgeApplications.id, applicationId)); if (status === "approved") await setUserBadge(application.userId, application.requestedBadge); }
export async function banUser(userId: number, value: boolean) { const db = await getDb(); if (!db) return; await db.update(users).set({ isBanned: value }).where(eq(users.id, userId)); }
export async function setUserRole(userId: number, role: "user" | "admin") { const db = await getDb(); if (!db) return; await db.update(users).set({ role }).where(eq(users.id, userId)); }
export async function getAllUsers() { const db = await getDb(); if (!db) return []; return db.select().from(users).orderBy(desc(users.createdAt)).limit(100); }
export async function getAllPosts() { const db = await getDb(); if (!db) return []; return db.select({ post: posts, creator: users }).from(posts).innerJoin(users, eq(posts.userId, users.id)).orderBy(desc(posts.createdAt)).limit(100); }
export async function deletePost(postId: number) { const db = await getDb(); if (!db) return; await db.delete(posts).where(eq(posts.id, postId)); }
export async function deletePostAsUser(postId: number, userId: number, isAdmin: boolean) { const db = await getDb(); if (!db) return { deleted: false, reason: "database_unavailable" as const }; const post = (await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, postId)).limit(1))[0]; if (!post) return { deleted: false, reason: "not_found" as const }; if (!canDeletePost(userId, post.userId, isAdmin ? "admin" : "user")) return { deleted: false, reason: "forbidden" as const }; await db.delete(posts).where(eq(posts.id, postId)); return { deleted: true, reason: "deleted" as const }; }
export async function addStory(userId: number, mediaUrl: string, mediaType: "image" | "video") { const db = await getDb(); if (!db) return undefined; return (await db.insert(stories).values({ userId, mediaUrl, mediaType, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }))[0]?.insertId; }
export async function getActiveStories() { const db = await getDb(); if (!db) return []; return db.select({ story: stories, owner: publicCreatorFields }).from(stories).leftJoin(users, eq(stories.userId, users.id)).where(sql`${stories.expiresAt} > NOW()`).orderBy(desc(stories.createdAt)).limit(100); }
export async function recordStoryView(storyId: number, viewerId: number) { const db = await getDb(); if (!db) return; const exists = await db.select().from(storyViews).where(and(eq(storyViews.storyId, storyId), eq(storyViews.viewerId, viewerId))).limit(1); if (exists.length === 0) await db.insert(storyViews).values({ storyId, viewerId }); }
export async function getStoryViewers(storyId: number) { const db = await getDb(); if (!db) return []; return db.select({ viewer: users, view: storyViews }).from(storyViews).innerJoin(users, eq(storyViews.viewerId, users.id)).where(eq(storyViews.storyId, storyId)).orderBy(desc(storyViews.viewedAt)); }
export async function getStoryViewCount(storyId: number) { const db = await getDb(); if (!db) return 0; const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(storyViews).where(eq(storyViews.storyId, storyId)); return Number(rows[0]?.count ?? 0); }
export async function deleteExpiredStories() { const db = await getDb(); if (!db) return; await db.delete(stories).where(sql`${stories.expiresAt} <= NOW()`); }
export async function registerPushToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(pushTokens).where(eq(pushTokens.token, token)).limit(1))[0];
  if (existing) {
    if (existing.userId !== userId) {
      await db.update(pushTokens).set({ userId }).where(eq(pushTokens.id, existing.id));
    }
  } else {
    await db.insert(pushTokens).values({ userId, token });
  }
}

export async function getUserPushTokens(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ token: pushTokens.token }).from(pushTokens).where(eq(pushTokens.userId, userId));
  return rows.map(r => r.token);
}

export async function getConversationSettings(userId: number, peerId: number) {
  const db = await getDb();
  if (!db) return { userId, peerId, isPinned: false, isArchived: false, isMuted: false, themeColor: null, nickname: null };
  return (await db.select().from(conversationSettings).where(and(eq(conversationSettings.userId, userId), eq(conversationSettings.peerId, peerId))).limit(1))[0] ?? { userId, peerId, isPinned: false, isArchived: false, isMuted: false, themeColor: null, nickname: null };
}

export async function updateConversationSettings(userId: number, peerId: number, settings: { isPinned?: boolean; isArchived?: boolean; isMuted?: boolean; themeColor?: string; nickname?: string | null }) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(conversationSettings).where(and(eq(conversationSettings.userId, userId), eq(conversationSettings.peerId, peerId))).limit(1))[0];
  if (existing) {
    await db.update(conversationSettings).set({ ...settings, nickname: settings.nickname === undefined ? undefined : (settings.nickname?.trim() || null) }).where(eq(conversationSettings.id, existing.id));
  } else {
    await db.insert(conversationSettings).values({ userId, peerId, ...settings, nickname: settings.nickname?.trim() || null });
  }
}

export async function setTypingStatus(userId: number, peerId: number, groupId?: number) {
  const db = await getDb();
  if (!db) return;
  const existing = (await db.select().from(typingStatus).where(and(eq(typingStatus.userId, userId), eq(typingStatus.peerId, peerId), groupId ? eq(typingStatus.groupId, groupId) : sql`${typingStatus.groupId} IS NULL`)).limit(1))[0];
  if (existing) {
    await db.update(typingStatus).set({ updatedAt: new Date() }).where(eq(typingStatus.id, existing.id));
  } else {
    await db.insert(typingStatus).values({ userId, peerId, groupId });
  }
}

export async function getTypingStatus(peerId: number, groupId?: number) {
  const db = await getDb();
  if (!db) return [];
  const threshold = new Date(Date.now() - 3000); // active within last 3 seconds
  return db.select({ user: users, typing: typingStatus }).from(typingStatus).innerJoin(users, eq(typingStatus.userId, users.id)).where(and(eq(typingStatus.peerId, peerId), groupId ? eq(typingStatus.groupId, groupId) : sql`${typingStatus.groupId} IS NULL`, sql`${typingStatus.updatedAt} > ${threshold}`));
}

export async function updateUserProfile(userId: number, input: { name?: string; username?: string; bio?: string; avatarUrl?: string; subscriptionPrice?: string; badgeLabel?: string; showBadge?: boolean }) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Record<string, any> = {};
  if (input.name !== undefined) updateSet.name = input.name;
  if (input.username !== undefined) updateSet.username = input.username;
  if (input.bio !== undefined) updateSet.bio = input.bio;
  if (input.avatarUrl !== undefined) updateSet.avatarUrl = input.avatarUrl;
  if (input.subscriptionPrice !== undefined) updateSet.subscriptionPrice = input.subscriptionPrice;
  if (input.badgeLabel !== undefined) updateSet.badgeLabel = input.badgeLabel;
  if (input.showBadge !== undefined) updateSet.showBadge = input.showBadge;
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet).where(eq(users.id, userId));
  }
}

export async function setBadgeLabel(userId: number, badgeLabel: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ badgeLabel }).where(eq(users.id, userId));
}

export async function setShowBadge(userId: number, showBadge: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ showBadge }).where(eq(users.id, userId));
}
export async function getAdminMetrics() { const db = await getDb(); if (!db) return { users: 0, posts: 0, creators: 0, verified: 0 }; const [u,p,c,v] = await Promise.all([db.select({ count: sql<number>`COUNT(*)` }).from(users), db.select({ count: sql<number>`COUNT(*)` }).from(posts), db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.isCreator, true)), db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.isVerified, true))]); return { users: Number(u[0]?.count ?? 0), posts: Number(p[0]?.count ?? 0), creators: Number(c[0]?.count ?? 0), verified: Number(v[0]?.count ?? 0) }; }
export async function getSubscriptionStatus(subscriberId: number, creatorId: number) { const db = await getDb(); if (!db) return false; return (await db.select().from(subscriptions).where(and(eq(subscriptions.subscriberId, subscriberId), eq(subscriptions.creatorId, creatorId), eq(subscriptions.status, "active"))).limit(1)).length > 0; }
export async function getPrivateOwnerFollowers(ownerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(privateOwnerFollowers).where(eq(privateOwnerFollowers.ownerUserId, ownerUserId)).orderBy(desc(privateOwnerFollowers.createdAt));
}
export async function addPrivateOwnerFollower(ownerUserId: number, followerName: string, followerHandle: string, avatarUrl?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(privateOwnerFollowers).values({ ownerUserId, followerName, followerHandle, avatarUrl: avatarUrl || null });
}
export async function removePrivateOwnerFollower(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(privateOwnerFollowers).where(eq(privateOwnerFollowers.id, id));
}
export async function createSubscriptionRecord(input: { subscriberId: number; creatorId: number; stripeSubscriptionId?: string; expiresAt: Date }) { const db = await getDb(); if (!db) return; await db.insert(subscriptions).values(input); }
export async function createTipRecord(input: { senderId: number; creatorId: number; amount: string; message?: string; stripePaymentIntentId?: string }) { const db = await getDb(); if (!db) return; await db.insert(tips).values(input); }
export async function getTipRecords(userId: number) { const db = await getDb(); if (!db) return []; return db.select().from(tips).where(eq(tips.creatorId, userId)).orderBy(desc(tips.createdAt)).limit(50); }
export async function getSavedPosts(userId: number) { const db = await getDb(); if (!db) return []; return db.select({ post: posts, creator: users }).from(saves).innerJoin(posts, eq(saves.postId, posts.id)).innerJoin(users, eq(posts.userId, users.id)).where(eq(saves.userId, userId)).orderBy(desc(saves.createdAt)); }
export async function createGroup(creatorId: number, name: string, avatarUrl?: string, memberIds: number[] = [], options?: { description?: string; visibility?: "public" | "private"; joinMode?: "open" | "approval" | "invite"; postingMode?: "all" | "admins" }) {
  const db = await getDb();
  if (!db) return undefined;
  const groupId = (await db.insert(groups).values({ name, creatorId, avatarUrl: avatarUrl || null, description: options?.description || null, visibility: options?.visibility || "private", joinMode: options?.joinMode || "invite", postingMode: options?.postingMode || "all" }))[0]?.insertId;
  if (groupId) {
    const members = Array.from(new Set(memberIds.filter((userId) => Number.isInteger(userId) && userId > 0 && userId !== creatorId)));
    await db.insert(groupMembers).values([
      { groupId, userId: creatorId, role: "admin" },
      ...members.map((userId) => ({ groupId, userId, role: "member" as const })),
    ]);
  }
  return groupId;
}
export async function addGroupMember(groupId: number, actorId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const actor = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, actorId))).limit(1))[0];
  if (!actor || !["admin", "moderator"].includes(actor.role)) throw new Error("Only group admins and moderators can add members directly");
  const target = await getUserById(userId);
  if (!target) throw new Error("User not found");
  const existing = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1))[0];
  if (!existing) {
    await db.insert(groupMembers).values({ groupId, userId, role: "member" });
    await addGroupSystemMessage(groupId, actorId, `${target.name || target.username || "A member"} was added to the group`);
    await auditGroup(groupId, actorId, "member_added", String(userId));
  }
}
export async function requestGroupInvite(groupId: number, inviterId: number, inviteeId: number) {
  const db = await getDb();
  if (!db) return { status: "unavailable" } as const;
  await assertGroupMember(groupId, inviterId);
  const target = await getUserById(inviteeId);
  if (!target) throw new Error("User not found");
  const existingMember = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, inviteeId))).limit(1))[0];
  if (existingMember) return { status: "member" } as const;
  const existing = (await db.select().from(groupInviteRequests).where(and(eq(groupInviteRequests.groupId, groupId), eq(groupInviteRequests.inviterId, inviterId), eq(groupInviteRequests.inviteeId, inviteeId), eq(groupInviteRequests.status, "pending"))).limit(1))[0];
  if (existing) return { status: "pending" } as const;
  await db.insert(groupInviteRequests).values({ groupId, inviterId, inviteeId });
  await auditGroup(groupId, inviterId, "member_invite_requested", String(inviteeId));
  return { status: "requested" } as const;
}
export async function getGroupInviteRequests(groupId: number, actorId: number) {
  const db = await getDb();
  if (!db) return [];
  await requireGroupRole(groupId, actorId, ["admin", "moderator"]);
  const rows = await db.select({ request: groupInviteRequests, inviter: users }).from(groupInviteRequests).innerJoin(users, eq(groupInviteRequests.inviterId, users.id)).where(and(eq(groupInviteRequests.groupId, groupId), eq(groupInviteRequests.status, "pending"))).orderBy(groupInviteRequests.createdAt);
  return Promise.all(rows.map(async (row) => ({ ...row, invitee: await getUserById(row.request.inviteeId) })));
}
export async function reviewGroupInviteRequest(requestId: number, actorId: number, approved: boolean) {
  const db = await getDb();
  if (!db) return;
  const request = (await db.select().from(groupInviteRequests).where(eq(groupInviteRequests.id, requestId)).limit(1))[0];
  if (!request) throw new Error("Invite request not found");
  await requireGroupRole(request.groupId, actorId, ["admin", "moderator"]);
  await db.update(groupInviteRequests).set({ status: approved ? "approved" : "rejected", reviewedAt: new Date(), reviewedBy: actorId }).where(eq(groupInviteRequests.id, requestId));
  if (approved) {
    const existing = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, request.groupId), eq(groupMembers.userId, request.inviteeId))).limit(1))[0];
    if (!existing) await db.insert(groupMembers).values({ groupId: request.groupId, userId: request.inviteeId, role: "member" });
    await addGroupSystemMessage(request.groupId, actorId, `${(await getUserById(request.inviteeId))?.name || "A member"} joined the group`);
  }
  await auditGroup(request.groupId, actorId, approved ? "member_invite_approved" : "member_invite_rejected", String(request.inviteeId));
}
export async function removeGroupMember(groupId: number, actorId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  const actor = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, actorId))).limit(1))[0];
  if (actor?.role !== "admin") throw new Error("Only group admins can remove members");
  if (actorId === userId) throw new Error("Use leave group to remove yourself");
  await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}
export async function leaveGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}
async function requireGroupRole(groupId: number, userId: number, roles: string[] = ["admin", "moderator"]) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1))[0];
  if (!membership || !roles.includes(membership.role)) throw new Error("You do not have permission for this group action");
  return membership;
}
export async function assertGroupCanPost(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1))[0];
  if (!membership) throw new Error("You are not a member of this group");
  const group = (await db.select().from(groups).where(eq(groups.id, groupId)).limit(1))[0];
  if (!group) throw new Error("Group not found");
  if (group.postingMode === "admins" && !["admin", "moderator"].includes(membership.role)) throw new Error("Only admins can post in this announcements group");
  return { group, membership };
}
export async function assertGroupMember(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1))[0];
  if (!membership) throw new Error("You are not a member of this group");
  return membership;
}
export async function getPublicGroups(query = "") {
  const db = await getDb();
  if (!db) return [];
  const where = query.trim() ? and(eq(groups.visibility, "public"), like(groups.name, `%${query.trim()}%`)) : eq(groups.visibility, "public");
  const rows = await db.select().from(groups).where(where).orderBy(desc(groups.updatedAt)).limit(48);
  return Promise.all(rows.map(async (group) => {
    const members = await db.select({ count: sql<number>`COUNT(*)` }).from(groupMembers).where(eq(groupMembers.groupId, group.id));
    return { group, memberCount: Number(members[0]?.count ?? 0) };
  }));
}
export async function updateGroupProfile(groupId: number, actorId: number, input: { name?: string; description?: string; avatarUrl?: string; visibility?: "public" | "private"; joinMode?: "open" | "approval" | "invite"; postingMode?: "all" | "admins" }) {
  const db = await getDb();
  if (!db) return;
  await requireGroupRole(groupId, actorId, ["admin"]);
  const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
  if (!Object.keys(changes).length) return;
  await db.update(groups).set(changes).where(eq(groups.id, groupId));
  await addGroupSystemMessage(groupId, actorId, input.name ? `Group name changed to ${input.name}` : "Group settings updated");
  await auditGroup(groupId, actorId, "group_profile_updated", JSON.stringify(changes));
}
export async function requestToJoinGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return { status: "unavailable" } as const;
  const group = (await db.select().from(groups).where(eq(groups.id, groupId)).limit(1))[0];
  if (!group) throw new Error("Group not found");
  const member = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1))[0];
  if (member) return { status: "member" } as const;
  if (group.visibility === "public" && group.joinMode === "open") {
    await db.insert(groupMembers).values({ groupId, userId, role: "member" });
    await addGroupSystemMessage(groupId, userId, `${(await getUserById(userId))?.name || "A member"} joined the group`);
    await auditGroup(groupId, userId, "member_joined");
    return { status: "joined" } as const;
  }
  const existing = (await db.select().from(groupJoinRequests).where(and(eq(groupJoinRequests.groupId, groupId), eq(groupJoinRequests.userId, userId), eq(groupJoinRequests.status, "pending"))).limit(1))[0];
  if (!existing) await db.insert(groupJoinRequests).values({ groupId, userId });
  return { status: "requested" } as const;
}
export async function getGroupJoinRequests(groupId: number, actorId: number) {
  const db = await getDb();
  if (!db) return [];
  await requireGroupRole(groupId, actorId, ["admin", "moderator"]);
  return db.select({ request: groupJoinRequests, user: users }).from(groupJoinRequests).innerJoin(users, eq(groupJoinRequests.userId, users.id)).where(and(eq(groupJoinRequests.groupId, groupId), eq(groupJoinRequests.status, "pending"))).orderBy(groupJoinRequests.createdAt);
}
export async function reviewGroupJoinRequest(requestId: number, actorId: number, approved: boolean) {
  const db = await getDb();
  if (!db) return;
  const request = (await db.select().from(groupJoinRequests).where(eq(groupJoinRequests.id, requestId)).limit(1))[0];
  if (!request) throw new Error("Join request not found");
  await requireGroupRole(request.groupId, actorId, ["admin", "moderator"]);
  await db.update(groupJoinRequests).set({ status: approved ? "approved" : "rejected", reviewedAt: new Date() }).where(eq(groupJoinRequests.id, requestId));
  if (approved) {
    const existing = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, request.groupId), eq(groupMembers.userId, request.userId))).limit(1))[0];
    if (!existing) await db.insert(groupMembers).values({ groupId: request.groupId, userId: request.userId, role: "member" });
    await addGroupSystemMessage(request.groupId, actorId, `${(await getUserById(request.userId))?.name || "A member"} joined the group`);
  }
  await auditGroup(request.groupId, actorId, approved ? "join_request_approved" : "join_request_rejected", String(request.userId));
}
export async function setGroupMemberRole(groupId: number, actorId: number, userId: number, role: "admin" | "moderator" | "member") {
  const db = await getDb();
  if (!db) return;
  await requireGroupRole(groupId, actorId, ["admin"]);
  await db.update(groupMembers).set({ role }).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  await auditGroup(groupId, actorId, "member_role_updated", JSON.stringify({ userId, role }));
}
export async function addGroupSystemMessage(groupId: number, actorId: number, content: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(groupMessages).values({ groupId, senderId: actorId, content, messageType: "system" });
}
export async function auditGroup(groupId: number, actorId: number, type: string, detail?: string, targetUserId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(groupAuditEvents).values({ groupId, actorId, type, detail, targetUserId });
}
export async function pinGroupMessage(groupId: number, actorId: number, messageId: number | null) {
  const db = await getDb();
  if (!db) return;
  await requireGroupRole(groupId, actorId, ["admin", "moderator"]);
  await db.update(groupMessages).set({ isPinned: false }).where(eq(groupMessages.groupId, groupId));
  if (messageId) await db.update(groupMessages).set({ isPinned: true }).where(and(eq(groupMessages.id, messageId), eq(groupMessages.groupId, groupId)));
  await db.update(groups).set({ pinnedMessageId: messageId }).where(eq(groups.id, groupId));
  await auditGroup(groupId, actorId, messageId ? "message_pinned" : "message_unpinned", String(messageId || ""));
}
export async function deleteGroupMessage(groupId: number, actorId: number, messageId: number) {
  const db = await getDb();
  if (!db) return;
  const message = (await db.select().from(groupMessages).where(and(eq(groupMessages.id, messageId), eq(groupMessages.groupId, groupId))).limit(1))[0];
  if (!message) return;
  if (message.senderId !== actorId) await requireGroupRole(groupId, actorId, ["admin", "moderator"]);
  await db.update(groupMessages).set({ content: "Message deleted", mediaUrl: null, attachmentName: null }).where(eq(groupMessages.id, messageId));
}
export async function createGroupPoll(groupId: number, actorId: number, question: string, options: string[], allowsMultiple: boolean, closesAt?: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const member = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, actorId))).limit(1))[0];
  if (!member) throw new Error("You are not a group member");
  const group = (await db.select().from(groups).where(eq(groups.id, groupId)).limit(1))[0];
  if (group?.postingMode === "admins" && !["admin", "moderator"].includes(member.role)) throw new Error("Only admins can post announcements");
  const pollId = (await db.insert(groupPolls).values({ groupId, creatorId: actorId, question, allowsMultiple, closesAt }))[0]?.insertId;
  if (pollId) {
    await db.insert(groupPollOptions).values(options.map((label, sortOrder) => ({ pollId, label, sortOrder })));
    await db.insert(groupMessages).values({ groupId, senderId: actorId, content: `POLL:${pollId}`, messageType: "poll" });
  }
  return pollId;
}
export async function getGroupPoll(pollId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const poll = (await db.select().from(groupPolls).where(eq(groupPolls.id, pollId)).limit(1))[0];
  if (!poll) return undefined;
  const options = await db.select().from(groupPollOptions).where(eq(groupPollOptions.pollId, pollId)).orderBy(groupPollOptions.sortOrder);
  const votes = await db.select().from(groupPollVotes).where(eq(groupPollVotes.pollId, pollId));
  return { poll, options: options.map((option) => ({ ...option, votes: votes.filter((vote) => vote.optionId === option.id).length, voted: Boolean(viewerId && votes.some((vote) => vote.optionId === option.id && vote.userId === viewerId)) })), totalVotes: new Set(votes.map((vote) => vote.userId)).size };
}
export async function voteGroupPoll(pollId: number, userId: number, optionId: number) {
  const db = await getDb();
  if (!db) return;
  const poll = (await db.select().from(groupPolls).where(eq(groupPolls.id, pollId)).limit(1))[0];
  if (!poll || (poll.closesAt && poll.closesAt.getTime() <= Date.now())) throw new Error("This poll is closed");
  const membership = (await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, poll.groupId), eq(groupMembers.userId, userId))).limit(1))[0];
  if (!membership) throw new Error("You are not a group member");
  const option = (await db.select().from(groupPollOptions).where(and(eq(groupPollOptions.id, optionId), eq(groupPollOptions.pollId, pollId))).limit(1))[0];
  if (!option) throw new Error("Poll option not found");
  if (!poll.allowsMultiple) await db.delete(groupPollVotes).where(and(eq(groupPollVotes.pollId, pollId), eq(groupPollVotes.userId, userId)));
  const previous = (await db.select().from(groupPollVotes).where(and(eq(groupPollVotes.pollId, pollId), eq(groupPollVotes.optionId, optionId), eq(groupPollVotes.userId, userId))).limit(1))[0];
  if (previous) await db.delete(groupPollVotes).where(eq(groupPollVotes.id, previous.id)); else await db.insert(groupPollVotes).values({ pollId, optionId, userId });
}
export async function createGroupEvent(groupId: number, actorId: number, input: { name: string; description?: string; location?: string; imageUrl?: string; startsAt: Date }) {
  const db = await getDb();
  if (!db) return undefined;
  await requireGroupRole(groupId, actorId, ["admin", "moderator"]);
  const id = (await db.insert(groupEvents).values({ groupId, creatorId: actorId, ...input }))[0]?.insertId;
  if (id) await db.insert(groupMessages).values({ groupId, senderId: actorId, content: `EVENT:${id}`, messageType: "event" });
  return id;
}
export async function listGroupEvents(groupId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (viewerId !== undefined) await assertGroupMember(groupId, viewerId);
  const events = await db.select().from(groupEvents).where(eq(groupEvents.groupId, groupId)).orderBy(groupEvents.startsAt);
  return Promise.all(events.map(async (event) => {
    const attendees = await db.select({ rsvp: groupEventRsvps, user: users }).from(groupEventRsvps).innerJoin(users, eq(groupEventRsvps.userId, users.id)).where(eq(groupEventRsvps.eventId, event.id)).orderBy(desc(groupEventRsvps.updatedAt));
    const attendeeCounts = attendees.reduce((counts, attendee) => {
      counts[attendee.rsvp.status] += 1;
      return counts;
    }, { going: 0, maybe: 0, cant_go: 0 });
    return { ...event, attendees, attendeeCounts };
  }));
}
export async function respondToGroupEvent(eventId: number, userId: number, status: "going" | "maybe" | "cant_go") {
  const db = await getDb();
  if (!db) return;
  const event = (await db.select().from(groupEvents).where(eq(groupEvents.id, eventId)).limit(1))[0];
  if (!event) throw new Error("Group event not found");
  await assertGroupMember(event.groupId, userId);
  const existing = (await db.select().from(groupEventRsvps).where(and(eq(groupEventRsvps.eventId, eventId), eq(groupEventRsvps.userId, userId))).limit(1))[0];
  if (existing) await db.update(groupEventRsvps).set({ status }).where(eq(groupEventRsvps.id, existing.id)); else await db.insert(groupEventRsvps).values({ eventId, userId, status });
}
export async function getGroupMedia(groupId: number, query = "", viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (viewerId !== undefined) await assertGroupMember(groupId, viewerId);
  const rows = await db.select({ message: groupMessages, sender: users }).from(groupMessages).innerJoin(users, eq(groupMessages.senderId, users.id)).where(eq(groupMessages.groupId, groupId)).orderBy(desc(groupMessages.createdAt));
  return rows.filter((row) => (row.message.mediaUrl || /https?:\/\//.test(row.message.content)) && (!query || `${row.message.content} ${row.message.attachmentName || ""}`.toLowerCase().includes(query.toLowerCase())));
}
export async function getGroupsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
  const groupIds = memberships.map(m => m.groupId);
  if (groupIds.length === 0) return [];
  const list = [];
  for (const gid of groupIds) {
    const g = (await db.select().from(groups).where(eq(groups.id, gid)).limit(1))[0];
    if (g) list.push(g);
  }
  return list;
}
export async function getGroupMessages(groupId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (viewerId !== undefined) await assertGroupMember(groupId, viewerId);
  return db.select({ message: groupMessages, sender: users, membership: groupMembers }).from(groupMessages).innerJoin(users, eq(groupMessages.senderId, users.id)).innerJoin(groupMembers, and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, groupMessages.senderId))).where(eq(groupMessages.groupId, groupId)).orderBy(groupMessages.createdAt);
}
export async function getGroupMembers(groupId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (viewerId !== undefined) await assertGroupMember(groupId, viewerId);
  return db.select({ member: groupMembers, user: users }).from(groupMembers).innerJoin(users, eq(groupMembers.userId, users.id)).where(eq(groupMembers.groupId, groupId)).orderBy(desc(groupMembers.createdAt));
}
export async function sendGroupMessage(groupId: number, senderId: number, content: string, attachment?: { mediaUrl?: string; attachmentType?: "image" | "video" | "audio" | "file" | "link"; attachmentName?: string; attachmentMimeType?: string; attachmentSizeBytes?: number; attachmentDurationSeconds?: number }) {
  const db = await getDb();
  if (!db) return undefined;
  await assertGroupCanPost(groupId, senderId);
  if (attachment?.attachmentType === "link" && attachment.mediaUrl && !/^https?:\/\//i.test(attachment.mediaUrl)) throw new Error("Links must use an http or https URL");
  if (attachment?.attachmentType && attachment.attachmentType !== "link" && attachment.mediaUrl && !attachment.mediaUrl.startsWith(`/manus-storage/groups/${groupId}/${senderId}/`) && !attachment.mediaUrl.startsWith(`/manus-storage/users/${senderId}/`)) throw new Error("Attachment must be uploaded by the group member");
  const memberRows = await getGroupMembers(groupId);
  const id = (await db.insert(groupMessages).values({ groupId, senderId, content, mediaUrl: attachment?.mediaUrl, attachmentType: attachment?.attachmentType, attachmentName: attachment?.attachmentName, attachmentMimeType: attachment?.attachmentMimeType, attachmentSizeBytes: attachment?.attachmentSizeBytes, attachmentDurationSeconds: attachment?.attachmentDurationSeconds }))[0]?.insertId;
  const mentioned = new Set(Array.from(content.matchAll(/@([a-zA-Z0-9_.-]+)/g)).map((match) => match[1].toLowerCase()));
  for (const row of memberRows) {
    const username = (row.user.username || "").toLowerCase();
    const nameToken = (row.user.name || "").toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (row.user.id !== senderId && (mentioned.has("everyone") || mentioned.has(username) || (nameToken && mentioned.has(nameToken)))) await createNotification({ userId: row.user.id, actorId: senderId, type: "message", targetId: Number(id), content: mentioned.has("everyone") ? "mentioned everyone in a group" : "mentioned you in a group" });
  }
  return id;
}
export async function getProfileById(userId: number) {
  const db = await getDb();
  const user = await getUserById(userId);
  if (!user) return { user: undefined, stats: { followers: 0, following: 0, posts: 0 }, posts: [], privacy: { isPrivate: false } };
  const settings = db ? (await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1))[0] : undefined;
  const stats = await getUserStats(userId);
  const profilePosts = await getProfilePosts(userId);
  return { user, stats, posts: profilePosts, privacy: { isPrivate: Boolean(settings?.isPrivate) } };
}
export async function getComments(postId: number) { const db = await getDb(); if (!db) return []; return db.select({ comment: comments, author: users }).from(comments).innerJoin(users, eq(comments.userId, users.id)).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt)).limit(50); }
export async function getFollowState(followerId: number, followingId: number) { const db = await getDb(); if (!db) return false; return (await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))).limit(1)).length > 0; }
export async function getFollowers(userId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const targetUser = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!targetUser) return [];
  const isOwner = viewerId === userId;
  const settings = (await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1))[0];
  const isApprovedViewer = viewerId !== undefined && (await db.select().from(follows).where(and(eq(follows.followerId, viewerId), eq(follows.followingId, userId))).limit(1)).length > 0;
  if ((!targetUser.showFollowersList && !isOwner) || (settings?.isPrivate && !isOwner && !isApprovedViewer)) return [];
  const rows = await db.select({ user: users }).from(follows).innerJoin(users, eq(follows.followerId, users.id)).where(eq(follows.followingId, userId));
  return rows.map((r) => r.user);
}
export async function getFollowing(userId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const targetUser = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!targetUser) return [];
  const isOwner = viewerId === userId;
  const settings = (await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1))[0];
  const isApprovedViewer = viewerId !== undefined && (await db.select().from(follows).where(and(eq(follows.followerId, viewerId), eq(follows.followingId, userId))).limit(1)).length > 0;
  if ((!targetUser.showFollowingList && !isOwner) || (settings?.isPrivate && !isOwner && !isApprovedViewer)) return [];
  const rows = await db.select({ user: users }).from(follows).innerJoin(users, eq(follows.followingId, users.id)).where(eq(follows.followerId, userId));
  return rows.map((r) => r.user);
}
export async function getLikeSaveState(postId: number, userId: number) { const db = await getDb(); if (!db) return { liked: false, saved: false }; const [l,s] = await Promise.all([db.select().from(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId))).limit(1), db.select().from(saves).where(and(eq(saves.postId, postId), eq(saves.userId, userId))).limit(1)]); return { liked: l.length > 0, saved: s.length > 0 }; }
export async function getCreatorDirectory() { const db = await getDb(); if (!db) return []; return db.select().from(users).where(eq(users.isCreator, true)).orderBy(desc(users.isVerified), desc(users.createdAt)).limit(24); }
export async function getSearchResults(query: string) { const p = await searchUsers(query); const postsResult = await getExplorePosts(50); return { users: p, posts: postsResult.filter((x) => (x.post.caption || "").toLowerCase().includes(query.toLowerCase())) }; }
export async function getUnreadMessages(userId: number) { const db = await getDb(); if (!db) return 0; const r = await db.select({ count: sql<number>`COUNT(*)` }).from(messages).where(and(eq(messages.receiverId, userId), eq(messages.isRead, false))); return Number(r[0]?.count ?? 0); }
export async function getCreatorById(id: number) { const user = await getUserById(id); return user?.isCreator ? user : undefined; }
export async function getUserSnapshot(userId: number) { return { user: await getUserById(userId), stats: await getUserStats(userId), unreadNotifications: await getUnreadNotificationCount(userId), unreadMessages: await getUnreadMessages(userId) }; }
export async function getPublicData() { return { feed: await getFeedPosts(30), explore: await getExplorePosts(30), stories: await getStories(), creators: await getCreatorDirectory() }; }
