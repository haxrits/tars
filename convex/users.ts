import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create user if not exists
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      lastSeen: Date.now(),
      connections: [], // Initialize empty connections array
    });

    return userId;
  },
});

/**
 * Get all users
 */
export const getUsers = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * Get single user by Clerk ID
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId)
      )
      .unique();
  },
});

/**
 * Safe update lastSeen
 */
export const updateLastSeen = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    // 🔒 Prevent crash if user doesn't exist
    if (!user) {
      console.log(
        "updateLastSeen skipped: user not found",
        args.userId
      );
      return;
    }

    await ctx.db.patch(args.userId, {
      lastSeen: Date.now(),
    });
  },
});

/**
 * Add or confirm a connection between two users
 * Both users get each other added to their connections array
 */
export const addConnection = mutation({
  args: {
    userId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.userId === args.targetUserId) {
      throw new Error("Cannot connect with yourself");
    }

    const user = await ctx.db.get(args.userId);
    const targetUser = await ctx.db.get(args.targetUserId);

    if (!user || !targetUser) {
      throw new Error("User not found");
    }

    const userConnections = user.connections || [];
    const targetConnections = targetUser.connections || [];

    // Add target to user's connections if not already there
    if (!userConnections.includes(args.targetUserId)) {
      await ctx.db.patch(args.userId, {
        connections: [...userConnections, args.targetUserId],
      });
    }

    // Add user to target's connections if not already there
    if (!targetConnections.includes(args.userId)) {
      await ctx.db.patch(args.targetUserId, {
        connections: [...targetConnections, args.userId],
      });
    }

    return true;
  },
});

/**
 * Remove a connection between two users
 */
export const removeConnection = mutation({
  args: {
    userId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const targetUser = await ctx.db.get(args.targetUserId);

    if (!user || !targetUser) {
      throw new Error("User not found");
    }

    // Remove target from user's connections
    await ctx.db.patch(args.userId, {
      connections: (user.connections || []).filter(
        (id) => id !== args.targetUserId
      ),
    });

    // Remove user from target's connections
    await ctx.db.patch(args.targetUserId, {
      connections: (targetUser.connections || []).filter(
        (id) => id !== args.userId
      ),
    });

    return true;
  },
});