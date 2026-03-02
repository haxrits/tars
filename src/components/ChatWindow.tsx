"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";

export default function ChatWindow({
  conversationId,
  currentUserId,
  onBack,
}: {
  conversationId: any;
  currentUserId: any;
  onBack?: () => void;
}) {
  // Queries
  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId } : "skip"
  );

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    conversationId ? { conversationId } : "skip"
  );

  // Mutations
  const sendMessage = useMutation(api.messages.sendMessage);
  const updateTyping = useMutation(api.typing.updateTyping);
  const markConversationAsRead = useMutation(
    api.conversations.markConversationAsRead
  );
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const editMessage = useMutation(api.messages.editMessage);

  // Group management queries / mutations
  const conversation = useQuery(
    api.conversations.getConversationById,
    conversationId ? { conversationId } : "skip"
  );
  const allUsers = useQuery(api.users.getUsers);
  const addMembers = useMutation(api.conversations.addMembers);
  const removeMembers = useMutation(api.conversations.removeMembers);
  const renameGroup = useMutation(api.conversations.renameGroup);
  const deleteGroup = useMutation(api.conversations.deleteGroup);

  const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

  // State
  const [text, setText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Reset one-time auto-scroll state when conversation changes
  useEffect(() => {
    hasAutoScrolledRef.current = false;
    setSelectedMessageId(null);
  }, [conversationId]);

  // Scroll to latest once when opening a chat
  useEffect(() => {
    if (!conversationId || !messages || hasAutoScrolledRef.current) return;

    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      hasAutoScrolledRef.current = true;
      setShowScrollButton(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [conversationId, messages]);

  // Smart auto-scroll - only scroll if already near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    const isNearBottom = distanceFromBottom < 120;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
  }, [messages]);

  // Keep scroll button in sync with manual scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollButton(distanceFromBottom >= 120);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [conversationId]);

  // Mark conversation as read
  useEffect(() => {
    if (!conversationId || !messages) return;

    markConversationAsRead({
      conversationId,
      userId: currentUserId,
    });
  }, [conversationId, currentUserId, messages?.length, markConversationAsRead]);

  const handleSend = async () => {
    if (!text.trim()) return;

    await sendMessage({
      conversationId,
      senderId: currentUserId,
      content: text,
    });

    setText("");
  };

  const handleEditSave = async (messageId: string) => {
    if (!editingText.trim()) {
      setEditingMessageId(null);
      return;
    }

    await editMessage({
      messageId: messageId as any,
      userId: currentUserId,
      newContent: editingText,
    });

    setEditingMessageId(null);
    setEditingText("");
  };

  // Helper function to format timestamp with date for previous days
  const formatMessageTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      // Today: show just time (HH:MM)
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isYesterday) {
      // Yesterday: show "Yesterday" and time
      return `Yesterday ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      // Older: show date and time (DD MMM HH:MM)
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Get user name from ID
  const getUserName = (userId: string) => {
    return allUsers?.find((u: any) => u._id === userId)?.name || "Unknown";
  };

  // Check if user is online (lastSeen within 30 seconds)
  const isUserOnline = (userId: string) => {
    const user = allUsers?.find((u: any) => u._id === userId);
    if (!user) return false;
    return Date.now() - user.lastSeen < 30000;
  };

  // Filter messages based on search
  const filteredMessages = messages?.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group management UI state
  const [groupManageOpen, setGroupManageOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [membersToAdd, setMembersToAdd] = useState<string[]>([]);

  if (!messages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-3 border-slate-600 border-t-cyan-500 rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Conversation Header */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-emerald-500/30 bg-gradient-to-r from-slate-900/90 via-slate-850/90 to-slate-900/90 backdrop-blur-xl shadow-lg shadow-emerald-500/10 flex items-start sm:items-center justify-between gap-2 sm:gap-3 flex-shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400/60 hover:bg-emerald-700/20 transition-colors flex-shrink-0"
              title="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="sr-only">Back</span>
            </button>
          )}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-cyan-600 to-emerald-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-lg shadow-emerald-500/40">
            {conversation && conversation.name
              ? conversation.name.charAt(0).toUpperCase()
              : allUsers
              ? allUsers
                  .find((u: any) => conversation?.members?.includes(u._id) && u._id !== currentUserId)
                  ?.name?.charAt(0)
                  .toUpperCase()
              : "T"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
              {conversation && conversation.name
                ? conversation.name
                : allUsers && conversation
                ? allUsers
                    .filter((u: any) => conversation.members.includes(u._id) && u._id !== currentUserId)
                    .map((u: any) => u.name)
                    .join(", ")
                : "Conversation"}
            </div>
            <div className="text-xs text-emerald-300/70 truncate font-medium">
              {conversation && conversation.members && conversation.name
                ? `${conversation.members.length} members`
                : isUserOnline(
                    conversation?.members?.find((m: any) => m !== currentUserId) || ""
                  )
                ? "🟢 Online now"
                : "🔴 Offline"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="text-base sm:text-xl text-emerald-300 hover:text-emerald-200 bg-gradient-to-r from-emerald-700/40 to-cyan-700/40 hover:from-emerald-600/60 hover:to-cyan-600/60 px-2.5 sm:px-4 py-2 rounded-lg transition-all flex-shrink-0 whitespace-nowrap border border-emerald-500/40 hover:border-emerald-400/60 font-semibold"
            title="Search messages"
          >
            🔍
          </button>
          {conversation && conversation.name && (
            <button
              onClick={() => {
                setGroupManageOpen(true);
                setEditName(conversation?.name || "");
              }}
              className="hidden sm:inline-flex text-xs sm:text-sm text-emerald-300 hover:text-emerald-200 bg-gradient-to-r from-emerald-700/40 to-cyan-700/40 hover:from-emerald-600/60 hover:to-cyan-600/60 px-3 sm:px-4 py-2 rounded-lg transition-all flex-shrink-0 whitespace-nowrap border border-emerald-500/40 hover:border-emerald-400/60 font-semibold"
            >
              ⚙️ Group
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 sm:px-4 py-2 border-b border-purple-500/20 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full bg-slate-800/80 border border-purple-500/30 text-white placeholder-slate-400 px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-slate-800 focus:ring-2 focus:ring-purple-500/30 transition duration-200 text-sm"
          />
        </div>
      )}

      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 py-4 space-y-3 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {filteredMessages && filteredMessages.length === 0 && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg
              className="w-16 h-16 mb-4 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm font-medium">No messages yet. Start the conversation! 💬</p>
          </div>
        )}

        {filteredMessages && filteredMessages.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-medium">No messages found for "{searchQuery}"</p>
          </div>
        )}

        {filteredMessages?.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          const reactions = msg.reactions || {};
          const isEditing = editingMessageId === msg._id;
          const isSelected = selectedMessageId === msg._id;

          return (
            <div
              key={msg._id}
              className={`group flex flex-col ${isOwn ? "items-end" : "items-start"} animate-fadeIn px-0 relative`}
            >
              <div
                className={`flex flex-col gap-1.5 sm:gap-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${
                  isOwn ? "items-end" : "items-start"
                }`}
              >
                {/* Action Menu - Show only when selected */}
                {isSelected && !isEditing && (
                  <div
                    className={`opacity-100 transition-opacity duration-200 mb-1 flex-shrink-0 flex items-center flex-wrap gap-1.5 bg-gradient-to-r from-slate-700/70 to-slate-800/70 px-3 py-2 rounded-xl backdrop-blur-md border border-emerald-500/40 shadow-lg shadow-emerald-500/10 animate-fadeIn`}
                  >
                    {!msg.isDeleted && (
                      EMOJIS.map((emoji, idx) => (
                        <button
                          key={`${msg._id}-${emoji}`}
                          onClick={() => {
                            toggleReaction({
                              messageId: msg._id,
                              userId: currentUserId,
                              emoji: idx.toString(),
                            });
                            setSelectedMessageId(null);
                          }}
                          className="text-lg sm:text-xl hover:scale-125 transition-all duration-150 active:scale-95 p-1.5 hover:bg-emerald-500/40 rounded-lg"
                          title="Add reaction"
                        >
                          {emoji}
                        </button>
                      ))
                    )}
                    {isOwn && !msg.isDeleted && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessageId(msg._id);
                            setEditingText(msg.content);
                            setSelectedMessageId(null);
                          }}
                          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/30 rounded-lg transition-all duration-150 active:scale-95 text-xs sm:text-sm font-medium"
                          title="Edit message"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            deleteMessage({
                              messageId: msg._id,
                              userId: currentUserId,
                            });
                            setSelectedMessageId(null);
                          }}
                          className="p-2 text-slate-300 hover:text-red-300 hover:bg-red-500/30 rounded-lg transition-all duration-150 active:scale-95 text-xs sm:text-sm font-medium"
                          title="Delete message"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                {isEditing ? (
                  <div className="flex gap-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      autoFocus
                      className="flex-1 bg-slate-700/50 border border-slate-600/50 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500/50 focus:bg-slate-700/80 focus:ring-2 focus:ring-purple-500/20 transition duration-200 text-sm"
                    />
                    <button
                      onClick={() => handleEditSave(msg._id)}
                      className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-purple-500 hover:to-purple-400 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessageId(null);
                        setSelectedMessageId(null);
                      }}
                      className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className={`px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl text-sm leading-relaxed transition-all duration-200 cursor-pointer group relative font-medium ${
                      isOwn
                        ? "bg-gradient-to-br from-emerald-600 via-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/40 rounded-br-none hover:shadow-emerald-500/60 hover:from-emerald-500 hover:scale-[1.02]"
                        : "bg-gradient-to-br from-slate-700/80 via-slate-700/70 to-slate-800/80 text-slate-50 shadow-lg shadow-slate-900/50 rounded-bl-none border border-slate-600/50 backdrop-blur-sm hover:bg-slate-700/90 hover:border-slate-600/70"
                    } break-words whitespace-pre-wrap`}
                    onClick={() => setSelectedMessageId(isSelected ? null : msg._id)}
                  >
                    {msg.isDeleted ? (
                      <i className="opacity-60 text-slate-300 text-xs">This message was deleted</i>
                    ) : (
                      <>{msg.content}</>
                    )}

                    <div
                      className={`text-xs mt-1.5 font-medium opacity-75 ${
                        isOwn ? "text-purple-200" : "text-slate-400"
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </div>

                    {/* Click hint for mobile */}
                    {!isOwn && !isSelected && (
                      <div className="absolute top-0 right-0 text-xs text-purple-300 opacity-0 group-hover:opacity-50 sm:hidden">
                        tap to react
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reactions Container */}
              <div
                className={`flex flex-col gap-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mt-1 ${
                  isOwn ? "items-end self-end" : "items-start self-start"
                }`}
              >
                {/* Reaction Display */}
                {Object.keys(reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center flex-shrink-0">
                    {Object.entries(reactions).map(([emojiIdx, users]: any) =>
                      users.length > 0 ? (
                        <button
                          key={emojiIdx}
                          onClick={() =>
                            toggleReaction({
                              messageId: msg._id,
                              userId: currentUserId,
                              emoji: emojiIdx,
                            })
                          }
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 backdrop-blur cursor-pointer ${
                            users.includes(currentUserId)
                              ? "bg-gradient-to-r from-purple-500/40 to-purple-600/40 text-purple-100 border border-purple-500/50 shadow-md shadow-purple-500/20 hover:from-purple-500/50 hover:to-purple-600/50"
                              : "bg-slate-700/50 text-slate-300 border border-slate-600/40 shadow-md shadow-slate-900/20 hover:bg-slate-600/70"
                          }`}
                          title={`${users.map((u: string) => getUserName(u)).join(", ")}`}
                        >
                          <span>{EMOJIS[parseInt(emojiIdx)]}</span>
                          <span className="font-semibold">{users.length}</span>
                        </button>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator with User Names */}
        {typingUsers &&
          typingUsers.some(
            (t) =>
              t.userId !== currentUserId && Date.now() - t.updatedAt < 2000
          ) && (
            <div className="text-sm text-purple-300 italic px-2 sm:px-4 flex items-center gap-2 animate-pulse">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
              <span className="font-medium">
                {typingUsers
                  .filter((t) => t.userId !== currentUserId && Date.now() - t.updatedAt < 2000)
                  .map((t) => getUserName(t.userId))
                  .join(", ")}{" "}
                {typingUsers.filter((t) => t.userId !== currentUserId && Date.now() - t.updatedAt < 2000).length === 1
                  ? "is typing..."
                  : "are typing..."}
              </span>
            </div>
          )}

        {showScrollButton && (
          <button
            onClick={() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              setShowScrollButton(false);
            }}
            className="fixed bottom-24 right-4 sm:right-6 bg-gradient-to-r from-purple-600 to-emerald-600 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg shadow-purple-500/50 text-xs sm:text-sm font-semibold hover:shadow-purple-500/75 transition-all duration-200 active:scale-95 flex items-center gap-2 z-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            <span className="hidden sm:inline">New</span>
          </button>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Group Management Modal */}
      {groupManageOpen && conversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGroupManageOpen(false)} />
          <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/30 rounded-2xl p-5 z-10 shadow-2xl shadow-purple-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">Group Settings</h3>
              <button onClick={() => setGroupManageOpen(false)} className="text-slate-400 hover:text-white transition text-2xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Group name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-purple-500/30 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition"
                />
              </div>

              <div>
                <div className="text-sm font-bold text-emerald-300 mb-2 flex items-center gap-2">
                  <span>👥 Members ({conversation.members.length})</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-800/30 p-2 rounded-lg">
                  {allUsers &&
                    conversation.members.map((m: any) => {
                      const user = allUsers.find((u: any) => u._id === m);
                      if (!user) return null;
                      const online = isUserOnline(m);
                      return (
                        <div key={m} className="flex items-center justify-between gap-2 bg-slate-700/40 px-3 py-2 rounded-md border border-slate-600/30 hover:border-purple-500/30 transition">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative flex-shrink-0">
                              <img src={user.imageUrl} alt={user.name} className="w-7 h-7 rounded-full" />
                              <div
                                className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-800 ${
                                  online ? "bg-emerald-500" : "bg-red-500"
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm text-white font-medium truncate">{user.name}</div>
                              <div className={`text-xs ${online ? "text-emerald-400" : "text-red-400"}`}>
                                {online ? "online" : "offline"}
                              </div>
                            </div>
                          </div>
                          {m !== currentUserId && (
                            <button
                              onClick={async () => {
                                await removeMembers({
                                  conversationId: conversationId as any,
                                  memberIds: [m] as any,
                                });
                              }}
                              className="text-xs px-2 py-1 rounded text-red-300 hover:text-red-200 hover:bg-red-500/20 transition flex-shrink-0"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-emerald-300 mb-2">➕ Add members</div>
                <div className="max-h-40 overflow-y-auto space-y-2 bg-slate-800/30 p-2 rounded-lg">
                  {allUsers &&
                    allUsers
                      .filter((u: any) => !conversation.members.includes(u._id))
                      .map((u: any) => (
                        <label key={u._id} className="flex items-center gap-2 p-2 hover:bg-slate-700/30 rounded cursor-pointer transition">
                          <input
                            type="checkbox"
                            checked={membersToAdd.includes(u._id)}
                            onChange={() =>
                              setMembersToAdd((prev) =>
                                prev.includes(u._id)
                                  ? prev.filter((p) => p !== u._id)
                                  : [...prev, u._id]
                              )
                            }
                            className="w-4 h-4 accent-purple-600 cursor-pointer"
                          />
                          <div className="relative">
                            <img src={u.imageUrl} alt={u.name} className="w-6 h-6 rounded-full" />
                            <div
                              className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full border border-slate-800 ${
                                isUserOnline(u._id) ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                          </div>
                          <span className="text-sm text-slate-200">{u.name}</span>
                        </label>
                      ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-purple-500/20">
              <button
                onClick={async () => {
                  await deleteGroup({ conversationId: conversationId as any });
                  setGroupManageOpen(false);
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:text-red-200 hover:bg-red-500/30 transition text-sm font-medium"
              >
                🗑️ Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setGroupManageOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-200 hover:bg-slate-700 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (editName.trim() && editName !== conversation.name) {
                      await renameGroup({ conversationId: conversationId as any, name: editName.trim() });
                    }
                    if (membersToAdd.length > 0) {
                      await addMembers({ conversationId: conversationId as any, memberIds: membersToAdd as any });
                      setMembersToAdd([]);
                    }
                    setGroupManageOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-purple-500/50 transition text-sm font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-purple-500/20 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-lg px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative group min-w-0">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-emerald-600/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-300" />
            <input
              className="relative w-full bg-slate-800/80 border border-purple-500/30 text-white placeholder-slate-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-slate-800 focus:ring-2 focus:ring-purple-500/30 transition duration-200 text-sm"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (conversationId) {
                  updateTyping({
                    conversationId,
                    userId: currentUserId,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
            />
          </div>

          <button
            onClick={handleSend}
            className="bg-gradient-to-r from-purple-600 to-emerald-600 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/60 hover:scale-105 shadow-md active:scale-95 transition-all duration-200 flex items-center gap-1 sm:gap-2 flex-shrink-0 whitespace-nowrap text-sm sm:text-base"
            title="Send message (Enter)"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16865566 C3.34915502,0.9115582 2.40734225,1.0226742 1.77946707,1.4939663 C0.994623095,2.12034234 0.837654326,3.20972416 1.15159189,3.99521108 L3.03521743,10.4362041 C3.03521743,10.5472201 3.19218622,10.7043175 3.50612381,10.7043175 L16.6915026,11.4898045 C16.6915026,11.4898045 17.1624089,11.4898045 17.1624089,11.0185127 L17.1624089,12.0610971 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
            </svg>
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}

