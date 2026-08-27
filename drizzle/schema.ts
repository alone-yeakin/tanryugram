import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

// --- Platform Management & Policy ---

export const mediaUploadPolicy = mysqlTable("mediaUploadPolicy", {
  id: int("id").autoincrement().primaryKey(),
  photosEnabled: boolean("photosEnabled").default(true).notNull(),
  profilePhotosEnabled: boolean("profilePhotosEnabled").default(true).notNull(),
  videosEnabled: boolean("videosEnabled").default(false).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userMediaPermissions = mysqlTable("userMediaPermissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  postsEnabled: boolean("postsEnabled").default(true).notNull(),
  photosEnabled: boolean("photosEnabled").default(true).notNull(),
  videosEnabled: boolean("videosEnabled").default(false).notNull(),
  reelsEnabled: boolean("reelsEnabled").default(false).notNull(),
  storiesEnabled: boolean("storiesEnabled").default(true).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailDeliverySettings = mysqlTable("emailDeliverySettings", {
  id: int("id").autoincrement().primaryKey(),
  emailDeliveryEnabled: boolean("emailDeliveryEnabled").default(true).notNull(),
  signupVerificationEnabled: boolean("signupVerificationEnabled").default(false).notNull(),
  appScriptLoginEnabled: boolean("appScriptLoginEnabled").default(false).notNull(),
  appScriptResetEnabled: boolean("appScriptResetEnabled").default(false).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const recoverySupportSettings = mysqlTable("recoverySupportSettings", {
  id: int("id").autoincrement().primaryKey(),
  guestRecoveryEnabled: boolean("guestRecoveryEnabled").default(false).notNull(),
  whatsappSupportEnabled: boolean("whatsappSupportEnabled").default(false).notNull(),
  whatsappSupportNumber: varchar("whatsappSupportNumber", { length: 32 }).default("+8801404841981").notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const platformPaymentSettings = mysqlTable("platformPaymentSettings", {
  id: int("id").autoincrement().primaryKey(),
  paypalEmail: varchar("paypalEmail", { length: 320 }),
  bkashNumber: varchar("bkashNumber", { length: 32 }),
  nagadNumber: varchar("nagadNumber", { length: 32 }),
  instructions: text("instructions"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const platformSettings = mysqlTable("platformSettings", {
  id: int("id").autoincrement().primaryKey(),
  eventTheme: varchar("eventTheme", { length: 32 }),
  maintenanceMode: boolean("maintenanceMode").default(false).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const badgeMarketplaceSettings = mysqlTable("badgeMarketplaceSettings", {
  id: int("id").autoincrement().primaryKey(),
  badgeType: mysqlEnum("badgeType", ["blue", "black", "gold", "vip", "founder", "legend"]).notNull().unique(),
  isPaid: boolean("isPaid").default(false).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// --- Users & Customization ---

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  username: varchar("username", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  isVerified: boolean("isVerified").default(false).notNull(),
  badgeType: mysqlEnum("badgeType", ["none", "blue", "black", "gold", "vip", "founder", "legend"]).default("none").notNull(),
  secondaryBadgeType: mysqlEnum("secondaryBadgeType", ["none", "black", "gold", "vip", "founder", "legend"]).default("none").notNull(),
  isCreator: boolean("isCreator").default(false).notNull(),
  badgeLabel: varchar("badgeLabel", { length: 32 }).default("User").notNull(),
  showBadge: boolean("showBadge").default(true).notNull(),
  displayedFollowersCount: int("displayedFollowersCount"),
  
  themeColor: varchar("themeColor", { length: 7 }).default("#7c3aed").notNull(),
  profileBannerUrl: text("profileBannerUrl"),
  customTextColor: varchar("customTextColor", { length: 7 }),
  profileEffect: varchar("profileEffect", { length: 32 }),
  
  subscriptionPrice: decimal("subscriptionPrice", { precision: 10, scale: 2 }).default("4.99").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  contentHidden: boolean("contentHidden").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  showFollowersList: boolean("showFollowersList").default(true).notNull(),
  showFollowingList: boolean("showFollowingList").default(true).notNull(),
  gender: mysqlEnum("gender", ["woman", "man", "non_binary", "prefer_not_to_say"]),
  eventTheme: varchar("eventTheme", { length: 32 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// --- Content & Social ---

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caption: text("caption"),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).default("image").notNull(),
  isPremium: boolean("isPremium").default(false).notNull(),
  location: text("location"),
  feeling: varchar("feeling", { length: 64 }),
  taggedUsers: text("taggedUsers"),
  likesCount: int("likesCount").default(0).notNull(),
  commentsCount: int("commentsCount").default(0).notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postMedia = mysqlTable("postMedia", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postReactions = mysqlTable("postReactions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  reactionType: mysqlEnum("reactionType", ["like", "love", "haha", "wow", "sad", "angry"]).default("like").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const saves = mysqlTable("saves", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const followRequests = mysqlTable("followRequests", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const privateOwnerFollowers = mysqlTable("privateOwnerFollowers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  followerCount: int("followerCount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// --- Reels & Analytics ---

export const reelSubmissions = mysqlTable("reelSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  processedMediaUrl: text("processedMediaUrl"),
  thumbnailUrl: text("thumbnailUrl"),
  processingStatus: mysqlEnum("processingStatus", ["pending", "ready", "failed"]).default("pending").notNull(),
  processingError: text("processingError"),
  caption: text("caption"),
  width: int("width").notNull(),
  height: int("height").notNull(),
  durationSeconds: int("durationSeconds"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewNote: text("reviewNote"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reelLikes = mysqlTable("reelLikes", {
  id: int("id").autoincrement().primaryKey(),
  reelId: int("reelId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reelViews = mysqlTable("reelViews", {
  id: int("id").autoincrement().primaryKey(),
  reelId: int("reelId").notNull(),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reelBookmarks = mysqlTable("reelBookmarks", {
  id: int("id").autoincrement().primaryKey(),
  reelId: int("reelId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reelComments = mysqlTable("reelComments", {
  id: int("id").autoincrement().primaryKey(),
  reelId: int("reelId").notNull(),
  userId: int("userId").notNull(),
  parentId: int("parentId"),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reelCommentLikes = mysqlTable("reelCommentLikes", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const dailyReelAnalytics = mysqlTable("dailyReelAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  reelId: int("reelId").notNull(),
  date: timestamp("date").notNull(),
  views: int("views").default(0).notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const reelPromotions = mysqlTable("reelPromotions", {
  id: int("id").autoincrement().primaryKey(),
  reelId: int("reelId").notNull(),
  ownerId: int("ownerId").notNull(),
  priority: int("priority").default(1).notNull(),
  status: mysqlEnum("status", ["active", "paused", "ended"]).default("active").notNull(),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- Moderation & Appeals ---

export const contentReports = mysqlTable("contentReports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  targetType: mysqlEnum("targetType", ["account", "post", "video", "reel"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: mysqlEnum("reason", ["pornography", "child_abuse", "dangerous", "harassment", "spam", "other"]).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["auto_hidden", "pending", "reviewed", "dismissed"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contentAppeals = mysqlTable("contentAppeals", {
  id: int("id").autoincrement().primaryKey(),
  appellantId: int("appellantId").notNull(),
  targetType: mysqlEnum("targetType", ["account", "post", "video", "reel"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  response: text("response"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contentReportRateLimits = mysqlTable("contentReportRateLimits", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull().unique(),
  windowStartedAt: timestamp("windowStartedAt").notNull(),
  reportCount: int("reportCount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const moderationAuditLog = mysqlTable("moderationAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId"),
  action: varchar("action", { length: 64 }).notNull(),
  targetType: varchar("targetType", { length: 32 }).notNull(),
  targetId: int("targetId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- Messaging & Groups ---

export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  creatorId: int("creatorId").notNull(),
  avatarUrl: text("avatarUrl"),
  description: text("description"),
  visibility: mysqlEnum("visibility", ["public", "private"]).default("private").notNull(),
  joinMode: mysqlEnum("joinMode", ["open", "approval", "invite"]).default("invite").notNull(),
  postingMode: mysqlEnum("postingMode", ["all", "admins"]).default("all").notNull(),
  pinnedMessageId: int("pinnedMessageId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const groupMembers = mysqlTable("groupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 32 }).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupMessages = mysqlTable("groupMessages", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["message", "system", "poll", "event"]).default("message").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentType: mysqlEnum("attachmentType", ["image", "video", "file", "audio", "link"]),
  attachmentName: varchar("attachmentName", { length: 255 }),
  attachmentMimeType: varchar("attachmentMimeType", { length: 128 }),
  attachmentSizeBytes: int("attachmentSizeBytes"),
  attachmentDurationSeconds: int("attachmentDurationSeconds"),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupJoinRequests = mysqlTable("groupJoinRequests", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupInviteRequests = mysqlTable("groupInviteRequests", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  inviterId: int("inviterId").notNull(),
  inviteeId: int("inviteeId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupPolls = mysqlTable("groupPolls", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  creatorId: int("creatorId").notNull(),
  question: text("question").notNull(),
  isMultipleChoice: boolean("isMultipleChoice").default(false).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupPollOptions = mysqlTable("groupPollOptions", {
  id: int("id").autoincrement().primaryKey(),
  pollId: int("pollId").notNull(),
  optionText: text("optionText").notNull(),
});

export const groupPollVotes = mysqlTable("groupPollVotes", {
  id: int("id").autoincrement().primaryKey(),
  pollId: int("pollId").notNull(),
  optionId: int("optionId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupEvents = mysqlTable("groupEvents", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupEventRsvps = mysqlTable("groupEventRsvps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["going", "maybe", "declined"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupAuditEvents = mysqlTable("groupAuditEvents", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  actorId: int("actorId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["sent", "delivered", "read"]).default("sent").notNull(),
  attachmentUrl: text("attachmentUrl"),
  attachmentType: mysqlEnum("attachmentType", ["image", "video", "file", "audio", "link"]),
  replyToId: int("replyToId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messageReactions = mysqlTable("messageReactions", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  reaction: varchar("reaction", { length: 16 }).notNull(),
});

export const messageHidden = mysqlTable("messageHidden", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  hiddenAt: timestamp("hiddenAt").defaultNow().notNull(),
});

export const conversationSettings = mysqlTable("conversationSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  peerId: int("peerId").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  isMuted: boolean("isMuted").default(false).notNull(),
  themeColor: varchar("themeColor", { length: 32 }).default("#8b5cf6").notNull(),
  nickname: varchar("nickname", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const typingStatus = mysqlTable("typingStatus", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  peerId: int("peerId").notNull(),
  groupId: int("groupId"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// --- Recovery ---

export const recoverySupportRequests = mysqlTable("recoverySupportRequests", {
  id: int("id").autoincrement().primaryKey(),
  guestTokenHash: varchar("guestTokenHash", { length: 128 }).notNull().unique(),
  accountEmail: varchar("accountEmail", { length: 320 }),
  guestLabel: varchar("guestLabel", { length: 80 }),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
});

export const recoverySupportMessages = mysqlTable("recoverySupportMessages", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  senderType: mysqlEnum("senderType", ["guest", "owner"]).default("guest").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- Stories & Media ---

export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).default("image").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const storyViews = mysqlTable("storyViews", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const storyReplies = mysqlTable("storyReplies", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- Calls & Push ---

export const calls = mysqlTable("calls", {
  id: int("id").autoincrement().primaryKey(),
  callerId: int("callerId").notNull(),
  receiverId: int("receiverId").notNull(),
  callType: mysqlEnum("callType", ["audio", "video"]).default("audio").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "missed", "ended"]).default("pending").notNull(),
  roomId: varchar("roomId", { length: 128 }),
  signalData: text("signalData"),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- Badges & Verification ---

export const badgeApplications = mysqlTable("badgeApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  requestedBadge: mysqlEnum("requestedBadge", ["blue", "black", "gold", "vip", "founder", "legend"]).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const badgeApplicationAudit = mysqlTable("badgeApplicationAudit", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  actorId: int("actorId").notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userBadges = mysqlTable("userBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeType: mysqlEnum("badgeType", ["blue", "black", "gold", "vip", "founder", "legend"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- Commerce ---

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  subscriberId: int("subscriberId").notNull(),
  creatorId: int("creatorId").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tips = mysqlTable("tips", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  creatorId: int("creatorId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  actorId: int("actorId").notNull(),
  type: mysqlEnum("type", ["like", "comment", "follow", "message", "tip", "subscribe", "reel_approved", "reel_rejected", "appeal_approved", "appeal_rejected"]).notNull(),
  targetId: int("targetId"),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailVerificationCodes = mysqlTable("emailVerificationCodes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- Types ---

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Save = typeof saves.$inferSelect;
export type UserMediaPermission = typeof userMediaPermissions.$inferSelect;
export type ContentReport = typeof contentReports.$inferSelect;
export type ReelSubmission = typeof reelSubmissions.$inferSelect;
export type ReelLike = typeof reelLikes.$inferSelect;
export type ReelView = typeof reelViews.$inferSelect;
export type ReelBookmark = typeof reelBookmarks.$inferSelect;
export type ReelComment = typeof reelComments.$inferSelect;
export type ReelCommentLike = typeof reelCommentLikes.$inferSelect;
export type DailyReelAnalytics = typeof dailyReelAnalytics.$inferSelect;
export type ReelPromotion = typeof reelPromotions.$inferSelect;
export type ContentAppeal = typeof contentAppeals.$inferSelect;
export type ModerationAuditEvent = typeof moderationAuditLog.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Tip = typeof tips.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ConversationSetting = typeof conversationSettings.$inferSelect;
export type TypingStatus = typeof typingStatus.$inferSelect;
export type RecoverySupportRequest = typeof recoverySupportRequests.$inferSelect;
export type RecoverySupportMessage = typeof recoverySupportMessages.$inferSelect;
