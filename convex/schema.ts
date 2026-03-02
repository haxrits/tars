import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    lastSeen: v.number(),
    connections: v.optional(v.array(v.id("users"))), // Users this person has accepted connection with
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    members: v.array(v.id("users")),
    createdAt: v.number(),
    lastMessageId: v.optional(v.id("messages")),
    lastOpened: v.optional(
      v.record(v.id("users"), v.number())
    ),
    name: v.optional(v.string()),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    isDeleted: v.boolean(),
    reactions: v.optional(
      v.record(
        v.string(),
        v.array(v.id("users"))
      )
    ),
  }).index("by_conversation", ["conversationId"]),

  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    updatedAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
