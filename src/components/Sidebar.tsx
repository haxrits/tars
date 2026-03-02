"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";

export default function Sidebar({
  onSelectConversation,
}: {
  onSelectConversation: (conversationId: any) => void;
}) {
  const { user } = useUser();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const toggleSelectMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const users = useQuery(api.users.getUsers);

  const conversations = useQuery(
    api.conversations.getUserConversations,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateConversation
  );

  const createGroupConversation = useMutation(
    api.conversations.createGroupConversation
  );
  const markConversationAsRead = useMutation(
    api.conversations.markConversationAsRead
  );

  const updateLastSeen = useMutation(api.users.updateLastSeen);

  // Presence heartbeat
  useEffect(() => {
    if (!currentUser) return;

    updateLastSeen({ userId: currentUser._id });

    const interval = setInterval(() => {
      updateLastSeen({ userId: currentUser._id });
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser, updateLastSeen]);

  if (!currentUser || !users) {
    return (
      <div className="w-64 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center border-r border-slate-700/50">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  const otherUsers = users.filter((u) => u._id !== currentUser._id);

  // Filter connected and suggested users
  const connectedUserIds = new Set(currentUser.connections || []);
  const connectedUsers = otherUsers
    .filter((u) => connectedUserIds.has(u._id))
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Sort connected users: online first, then by name
      const aOnline = Date.now() - a.lastSeen < 30000 ? -1 : 1;
      const bOnline = Date.now() - b.lastSeen < 30000 ? -1 : 1;
      return aOnline === bOnline ? a.name.localeCompare(b.name) : aOnline - bOnline;
    });

  const suggestedUsers = otherUsers
    .filter((u) => !connectedUserIds.has(u._id))
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // Sort suggested users: online first, then by name
      const aOnline = Date.now() - a.lastSeen < 30000 ? -1 : 1;
      const bOnline = Date.now() - b.lastSeen < 30000 ? -1 : 1;
      return aOnline === bOnline ? a.name.localeCompare(b.name) : aOnline - bOnline;
    });

  // For group creation - all users except current user
  const filteredUsers = otherUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const getDirectConversationsWithUser = (otherUserId: string) => {
    if (!conversations) return [];

    return conversations.filter(
      (c) =>
        c.members.length === 2 &&
        c.members.includes(currentUser._id) &&
        c.members.includes(otherUserId as any)
    );
  };

  const getMostRecentDirectConversationId = (otherUserId: string) => {
    const directConversations = getDirectConversationsWithUser(otherUserId);
    if (directConversations.length === 0) return null;

    return directConversations
      .slice()
      .sort(
        (a, b) =>
          (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
      )[0]._id;
  };

  const handleClick = async (otherUserId: any) => {
    try {
      setLoadingId(otherUserId);

      let conversationId = getMostRecentDirectConversationId(otherUserId);

      if (!conversationId) {
        conversationId = await getOrCreateConversation({
          user1: currentUser._id,
          user2: otherUserId,
        });
      }

      const directConversations = getDirectConversationsWithUser(otherUserId);
      const conversationIds = new Set<any>([
        ...directConversations.map((c) => c._id),
        conversationId,
      ]);

      await Promise.allSettled(
        Array.from(conversationIds).map((id) =>
          markConversationAsRead({
            conversationId: id,
            userId: currentUser._id,
          })
        )
      );

      onSelectConversation(conversationId);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const getUnreadCount = (conversationId: any) => {
    if (!conversations) return 0;

    const conversation = conversations.find(
      (c) => c._id === conversationId
    );

    return conversation?.unreadCount || 0;
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-emerald-500/30 flex flex-col overflow-hidden shadow-xl shadow-slate-900/50">

      
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            Friends & Chats
          </h2>
          <button
            onClick={() => setGroupModalOpen(true)}
            className="text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-3 py-2 rounded-lg transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
          >
            + Group
          </button>
        </div>

        <div className="relative mb-5 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="relative w-full bg-slate-700/60 border border-emerald-500/40 text-white placeholder-slate-400 px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-400/60 focus:bg-slate-700/80 focus:ring-2 focus:ring-emerald-500/30 transition duration-200 text-sm font-medium"
          />
        </div>

        <div className="space-y-2.5 mb-8">
          {/* Connected Friends Section */}
          {connectedUsers.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                <span className="text-emerald-400">●</span> Friends
              </h3>
              {connectedUsers.map((u) => {
                const directConversations = getDirectConversationsWithUser(u._id);
                const unreadCount = directConversations.reduce(
                  (count, conversation) => count + getUnreadCount(conversation._id),
                  0
                );

                const isOnline = Date.now() - u.lastSeen < 30000;

                return (
                  <button
                    key={u._id}
                    onClick={() => handleClick(u._id)}
                    disabled={loadingId === u._id}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-700/40 to-slate-800/40 hover:from-emerald-700/30 hover:to-cyan-700/30 border border-emerald-500/30 hover:border-emerald-400/50 cursor-pointer transition-all duration-300 active:scale-95 disabled:opacity-50 shadow-md hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={u.imageUrl}
                        alt={u.name}
                        className="w-11 h-11 rounded-xl object-cover border border-emerald-400/40 shadow-lg shadow-emerald-500/20"
                      />

                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-700 rounded-full animate-pulse shadow-lg shadow-emerald-500/60" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-emerald-300/70 font-medium">
                        {isOnline ? "🟢 Online" : "🔴 Offline"}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-lg shadow-red-500/60 min-w-fit">
                        {unreadCount}
                      </span>
                    )}

                    {loadingId === u._id && (
                      <div className="flex-shrink-0 w-4 h-4 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin" />
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Suggested Users Section */}
          {suggestedUsers.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                <span className="text-cyan-400">●</span> Other Users
              </h3>
              {suggestedUsers.map((u) => {
                const directConversations = getDirectConversationsWithUser(u._id);
                const unreadCount = directConversations.reduce(
                  (count, conversation) => count + getUnreadCount(conversation._id),
                  0
                );
                const isOnline = Date.now() - u.lastSeen < 30000;

                return (
                  <button
                    key={u._id}
                    onClick={() => handleClick(u._id)}
                    disabled={loadingId === u._id}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-700/20 to-slate-800/20 hover:from-slate-700/50 hover:to-slate-800/50 border border-slate-600/30 hover:border-slate-600/60 cursor-pointer transition-all duration-300 active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={u.imageUrl}
                        alt={u.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-500/40"
                      />

                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cyan-500 border-2 border-slate-700 rounded-full shadow-lg shadow-cyan-500/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {isOnline ? "🟢 Online" : "🔴 Offline"}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-lg shadow-red-500/60 min-w-fit">
                        {unreadCount}
                      </span>
                    )}

                    {loadingId === u._id && (
                      <div className="flex-shrink-0 w-4 h-4 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin" />
                    )}
                  </button>
                );
              })}
            </>
          )}

          {connectedUsers.length === 0 && suggestedUsers.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6 font-medium">No users found 👋</p>
          )}
        </div>

        {/* Groups Section */}
        {conversations && conversations.filter((c) => c.name).length > 0 && (
          <>
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <span className="text-cyan-400">●</span> Groups
            </h3>
            <div className="space-y-2">
              {conversations
                .filter((c) => c.name)
                .map((group) => {
                  const unreadCount = getUnreadCount(group._id);

                  return (
                    <button
                      key={group._id}
                      onClick={async () => {
                        try {
                          await markConversationAsRead({
                            conversationId: group._id,
                            userId: currentUser._id,
                          });
                        } catch (error) {
                          console.error("Error marking group as read:", error);
                        }
                        onSelectConversation(group._id);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-600/60 cursor-pointer transition-all duration-200 active:scale-95"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm">
                        {group.name?.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {group.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {group.members?.length || 0} members
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg shadow-red-500/50 min-w-fit">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>

      {/* Group creation modal */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setGroupModalOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 z-10 shadow-2xl">
            <h3 className="text-lg font-semibold mb-3">Create Group</h3>
            <input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white"
            />

            <div className="text-xs text-slate-400 mb-2">You can add 2 to 4 members (total: 3-5 including you)</div>
            <div className="max-h-44 overflow-y-auto mb-3 space-y-2">
              {filteredUsers.map((u) => {
                const isMaxReached = selectedMembers.length >= 4 && !selectedMembers.includes(u._id);
                return (
                  <label key={u._id} className={`flex items-center gap-2 ${isMaxReached ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(u._id)}
                      onChange={() => toggleSelectMember(u._id)}
                      disabled={isMaxReached}
                      className="accent-cyan-500"
                    />
                    <img src={u.imageUrl} className="w-6 h-6 rounded-full" />
                    <span className="text-sm text-slate-200">{u.name}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setGroupModalOpen(false)}
                className="px-3 py-1 rounded-md bg-slate-700/50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!groupName.trim()) return;
                  // Must select at least 2 other members, max 4 (total 5 with creator)
                  if (selectedMembers.length < 2) return;
                  if (selectedMembers.length > 4) return;
                  try {
                    const conversationId = await createGroupConversation({
                      name: groupName.trim(),
                      memberIds: selectedMembers as any,
                      creatorId: currentUser._id as any,
                    });
                    setGroupModalOpen(false);
                    setGroupName("");
                    setSelectedMembers([]);
                    onSelectConversation(conversationId);
                  } catch (err) {
                    console.error("Create group error", err);
                  }
                }}
                disabled={selectedMembers.length < 2 || selectedMembers.length > 4 || !groupName.trim()}
                className="px-3 py-1 rounded-md bg-cyan-500 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create ({selectedMembers.length + 1}/5)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-sm px-3 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={currentUser.imageUrl}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-700 rounded-full animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {currentUser.name}
            </p>
            <p className="text-[11px] text-slate-400">
              Online
            </p>
          </div>

          <SignOutButton>
            <button
              title="Logout"
              className="flex-shrink-0 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-150 active:scale-90"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
