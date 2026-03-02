"use client";

import { SignedIn } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";

import Sidebar from "../../components/Sidebar";
import ChatWindow from "../../components/ChatWindow";
import SyncUser from "../../components/SyncUser";

export default function ChatPage() {
  const { user } = useUser();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  return (
    <SignedIn>
      <SyncUser />
      <div className="h-[100dvh] w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden text-slate-100 flex">
        {currentUser ? (
          <>
            {/* Mobile: Friends List View (Sidebar) */}
            {!activeConversation && (
              <div className="md:hidden w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
                <Sidebar onSelectConversation={setActiveConversation} />
              </div>
            )}

            {/* Mobile: Chat View */}
            {activeConversation && (
              <div className="md:hidden w-full h-full flex flex-col bg-gradient-to-b from-slate-800 to-slate-900">
                <ChatWindow
                  conversationId={activeConversation}
                  currentUserId={currentUser._id}
                  onBack={() => setActiveConversation(null)}
                />
              </div>
            )}

            {/* Desktop: Sidebar + Chat Layout */}
            <div className="hidden md:flex h-full w-full">
              <div className="w-64 h-full border-r border-slate-700/50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex-shrink-0">
                <Sidebar onSelectConversation={setActiveConversation} />
              </div>

              <div className="flex-1 h-full bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col">
                {activeConversation ? (
                  <ChatWindow
                    conversationId={activeConversation}
                    currentUserId={currentUser._id}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-700/40 rounded-full flex items-center justify-center mb-6 border border-slate-600/50 shadow-2xl">
                      <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                    <p className="text-slate-400 max-w-sm text-center text-sm leading-relaxed">
                      Choose a friend from the sidebar to start messaging.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-slate-600 border-t-cyan-500 rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading chat...</p>
            </div>
          </div>
        )}
      </div>
    </SignedIn>
  );
}
