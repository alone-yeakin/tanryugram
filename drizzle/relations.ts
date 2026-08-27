import { relations } from "drizzle-orm/relations";
import { recoverySupportRequests, recoverySupportMessages, users, posts, postMedia, comments, likes, reelSubmissions } from "./schema";

export const recoverySupportRequestsRelations = relations(recoverySupportRequests, ({ many }) => ({
  messages: many(recoverySupportMessages),
}));

export const recoverySupportMessagesRelations = relations(recoverySupportMessages, ({ one }) => ({
  request: one(recoverySupportRequests, {
    fields: [recoverySupportMessages.requestId],
    references: [recoverySupportRequests.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  reels: many(reelSubmissions),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  media: many(postMedia),
  comments: many(comments),
  likes: many(likes),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(posts, {
    fields: [postMedia.postId],
    references: [posts.id],
  }),
}));
