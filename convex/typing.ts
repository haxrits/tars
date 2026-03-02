import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Update typing timestamp
 */
export const updateTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const record = existing.find(
      (t) => t.userId === args.userId
    );

    if (record) {
      await ctx.db.patch(record._id, {
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typing", {
        conversationId: args.conversationId,
        userId: args.userId,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Get typing users for a conversation
 */
export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();
  },
});