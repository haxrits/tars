import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      createdAt: Date.now(),
      isDeleted: false,
    });
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
  },
});
export const getAllMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect();
  },
});
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) return;

    // Only allow deleting own messages
    if (message.senderId !== args.userId) return;

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
    });
  },
});
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    // Get current reactions
    const reactions = message.reactions || {};
    
    // Check if user already has this emoji reaction
    const usersForEmoji = reactions[args.emoji] || [];
    const hasReacted = usersForEmoji.includes(args.userId);

    // Create a copy of reactions to update
    const updatedReactions = { ...reactions };

    if (hasReacted) {
      // Remove user's reaction for this emoji
      updatedReactions[args.emoji] = usersForEmoji.filter(id => id !== args.userId);
      
      // Clean up empty emoji entries
      if (updatedReactions[args.emoji].length === 0) {
        delete updatedReactions[args.emoji];
      }
    } else {
      // Remove user from ALL other emoji reactions first (one reaction per user)
      Object.keys(updatedReactions).forEach(emoji => {
        updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== args.userId);
        if (updatedReactions[emoji].length === 0) {
          delete updatedReactions[emoji];
        }
      });
      
      // Then add user to the new emoji
      updatedReactions[args.emoji] = [args.userId, ...usersForEmoji.filter(id => id !== args.userId)];
    }

    // Update the message with new reactions
    await ctx.db.patch(args.messageId, {
      reactions: updatedReactions as any,
    });
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) return;

    // Only allow editing own messages
    if (message.senderId !== args.userId) return;

    // Don't allow editing deleted messages
    if (message.isDeleted) return;

    await ctx.db.patch(args.messageId, {
      content: args.newContent,
      editedAt: Date.now(),
    });
  },
});
