import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create a one-on-one conversation between two users
 */
export const getOrCreateConversation = mutation({
  args: {
    user1: v.id("users"),
    user2: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Fetch all conversations
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    // Find conversation containing both users
    const existing = conversations.find((conv) => {
      return (
        conv.members.length === 2 &&
        conv.members.includes(args.user1) &&
        conv.members.includes(args.user2)
      );
    });

    if (existing) {
      return existing._id;
    }

    // Create new conversation
    const newConversationId = await ctx.db.insert("conversations", {
      members: [args.user1, args.user2],
      createdAt: Date.now(),
    });

    return newConversationId;
  },
});

/**
 * Create a group conversation
 */
export const createGroupConversation = mutation({
  args: {
    name: v.string(),
    memberIds: v.array(v.id("users")),
    creatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Include creator in members if not already present
    const members = Array.from(new Set([...args.memberIds, args.creatorId]));

    const conversationId = await ctx.db.insert("conversations", {
      members,
      name: args.name,
      createdAt: Date.now(),
    });

    return conversationId;
  },
});

/**
 * Get conversations for a specific user
 */
export const getUserConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const userConversations = conversations.filter((conv) =>
      conv.members.includes(args.userId)
    );

    return await Promise.all(
      userConversations.map(async (conversation) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conversation._id)
          )
          .collect();

        const lastOpened = conversation.lastOpened?.[args.userId] || 0;

        const unreadCount = messages.reduce((count, message) => {
          if (
            message.senderId !== args.userId &&
            message.createdAt > lastOpened
          ) {
            return count + 1;
          }
          return count;
        }, 0);

        const lastMessageAt = messages.reduce(
          (latest, message) => Math.max(latest, message.createdAt),
          0
        );

        return {
          ...conversation,
          unreadCount,
          lastMessageAt,
        };
      })
    );
  },
});
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) return;

    const existingLastOpened = conversation.lastOpened || {};

    await ctx.db.patch(args.conversationId, {
      lastOpened: {
        ...existingLastOpened,
        [args.userId]: Date.now(),
      },
    });
  },
});

/**
 * Get a conversation by ID
 */
export const getConversationById = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

/**
 * Add members to a conversation
 */
export const addMembers = mutation({
  args: {
    conversationId: v.id("conversations"),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const updatedMembers = [
      ...new Set([...conversation.members, ...args.memberIds]),
    ];

    await ctx.db.patch(args.conversationId, {
      members: updatedMembers,
    });
  },
});

/**
 * Remove members from a conversation
 */
export const removeMembers = mutation({
  args: {
    conversationId: v.id("conversations"),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    const updatedMembers = conversation.members.filter(
      (id) => !args.memberIds.includes(id)
    );

    await ctx.db.patch(args.conversationId, {
      members: updatedMembers,
    });
  },
});

/**
 * Rename a group conversation
 */
export const renameGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    await ctx.db.patch(args.conversationId, {
      name: args.name,
    });
  },
});

/**
 * Delete a group conversation
 */
export const deleteGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.conversationId);
  },
});
