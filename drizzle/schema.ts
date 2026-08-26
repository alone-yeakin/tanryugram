import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

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

export const emailVerificationCodes = mysqlTable("emailVerificationCodes", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  username: varchar("username", { length: 64 }).unique(),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  isVerified: boolean("isVerified").default(false).notNull(), // Legacy blue verification flag
  badgeType: mysqlEnum("badgeType", ["none", "blue", "black"]).default("none").notNull(),
  isCreator: boolean("isCreator").default(false).notNull(), // Owner-controlled creator label
  badgeLabel: varchar("badgeLabel", { length: 32 }).default("User").notNull(), // Customisable badge label (e.g. Creator, User, VIP)
  showBadge: boolean("showBadge").default(true).notNull(), // Whether the user badge is visible on profile and posts
  displayedFollowersCount: int("displayedFollowersCount"), // Owner-controlled public display override; real follows remain unchanged
  showFollowersList: boolean("showFollowersList").default(true).notNull(),
  showFollowingList: boolean("showFollowingList").default(true).notNull(),

  subscriptionPrice: decimal("subscriptionPrice", { precision: 10, scale: 2 }).default("4.99").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  contentHidden: boolean("contentHidden").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caption: text("caption"),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).default("image").notNull(),
  isPremium: boolean("isPremium").default(false).notNull(), // Legacy field; beta UI does not gate content
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
  mediaUrl: text("mediaUrl"),
  attachmentType: mysqlEnum("attachmentType", ["image", "video", "audio", "file", "link"]).default("image"),
  attachmentName: varchar("attachmentName", { length: 255 }),
  attachmentMimeType: varchar("attachmentMimeType", { length: 160 }),
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
  reviewedAt: timestamp("reviewedAt"),
});

export const groupInviteRequests = mysqlTable("groupInviteRequests", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  inviterId: int("inviterId").notNull(),
  inviteeId: int("inviteeId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),
});

export const groupPolls = mysqlTable("groupPolls", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  creatorId: int("creatorId").notNull(),
  question: text("question").notNull(),
  allowsMultiple: boolean("allowsMultiple").default(false).notNull(),
  closesAt: timestamp("closesAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupPollOptions = mysqlTable("groupPollOptions", {
  id: int("id").autoincrement().primaryKey(),
  pollId: int("pollId").notNull(),
  label: varchar("label", { length: 280 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
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
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 280 }),
  imageUrl: text("imageUrl"),
  startsAt: timestamp("startsAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const groupEventRsvps = mysqlTable("groupEventRsvps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["going", "maybe", "cant_go"]).default("going").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const groupAuditEvents = mysqlTable("groupAuditEvents", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  actorId: int("actorId").notNull(),
  targetUserId: int("targetUserId"),
  type: varchar("type", { length: 64 }).notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  isLocked: boolean("isLocked").default(false).notNull(),
  lockPin: varchar("lockPin", { length: 16 }),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  gender: varchar("gender", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
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
  requesterId: int("requesterId").notNull(),
  targetUserId: int("targetUserId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const badgeApplications = mysqlTable("badgeApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  requestedBadge: mysqlEnum("requestedBadge", ["blue", "black"]).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const privateOwnerFollowers = mysqlTable("privateOwnerFollowers", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId").notNull(),
  followerName: text("followerName").notNull(),
  followerHandle: varchar("followerHandle", { length: 64 }).notNull(),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).default("image").notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // 24-hour auto expiry
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const storyViews = mysqlTable("storyViews", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId").notNull(),
  viewerId: int("viewerId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  content: text("content").notNull(),
  audioUrl: text("audioUrl"),
  replyToId: int("replyToId"),
  deletedForEveryone: boolean("deletedForEveryone").default(false).notNull(),
  isRead: boolean("isRead").default(false).notNull(), // Blue ticks for read receipts
  deliveryStatus: mysqlEnum("deliveryStatus", ["sent", "delivered", "read"]).default("sent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messageReactions = mysqlTable("messageReactions", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  emoji: varchar("emoji", { length: 8 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messageHidden = mysqlTable("messageHidden", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId").notNull(),
  userId: int("userId").notNull(),
  hiddenAt: timestamp("hiddenAt").defaultNow().notNull(),
});

export const calls = mysqlTable("calls", {
  id: int("id").autoincrement().primaryKey(),
  callerId: int("callerId").notNull(),
  receiverId: int("receiverId").notNull(),
  callType: mysqlEnum("callType", ["audio", "video"]).default("audio").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "missed", "ended"]).default("pending").notNull(),
  roomId: varchar("roomId", { length: 128 }).notNull(),
  signalData: text("signalData"),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

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
  userId: int("userId").notNull(), // recipient
  actorId: int("actorId").notNull(), // user who triggered
  type: mysqlEnum("type", ["like", "comment", "follow", "message", "tip", "subscribe", "reel_approved", "reel_rejected", "appeal_approved", "appeal_rejected"]).notNull(),
  targetId: int("targetId"), // postId or messageId if applicable
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

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
export type ContentAppeal = typeof contentAppeals.$inferSelect;
export type ModerationAuditEvent = typeof moderationAuditLog.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Tip = typeof tips.$inferSelect;
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
  peerId: int("peerId").notNull(), // or groupId if group
  groupId: int("groupId"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type ConversationSetting = typeof conversationSettings.$inferSelect;
export type TypingStatus = typeof typingStatus.$inferSelect;

export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
