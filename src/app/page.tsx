"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import SyncUser from "../components/SyncUser";

export default function Home() {
  const { user } = useUser();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  return (
    <div className="h-[100dvh] w-full bg-[#0B1120] text-slate-100 flex font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* ================= GLOBAL CUSTOM CSS FOR ANIMATIONS ================= */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Laptop/Desktop background animations (left panel) */
        @keyframes ambientLight {
          0%, 100% { background-position: 0% 50%; opacity: 0.08; transform: scale(1); }
          50% { background-position: 100% 50%; opacity: 0.12; transform: scale(1.1); }
        }
        @keyframes driftingSphere {
          0% { transform: translate(0px, 0px) scale(1); opacity: 0.05; }
          33% { transform: translate(30px, -50px) scale(1.1); opacity: 0.1; }
          66% { transform: translate(-20px, 20px) scale(1.2); opacity: 0.08; }
          100% { transform: translate(0px, 0px) scale(1); opacity: 0.05; }
        }
        
        /* Mobile overall background shift */
        @keyframes gradientShift {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }

        .bg-drifting-sphere {
          animation: driftingSphere 45s ease-in-out infinite;
        }
        .bg-ambient-light {
          background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.4) 0%, rgba(11, 17, 32, 0) 70%);
          animation: ambientLight 30s ease-in-out infinite;
          background-size: 200% 200%;
        }

        /* Applying the mobile shift directly via CSS */
        .mobile-gradient-bg {
          background-image: radial-gradient(at 10% 10%, rgba(30, 58, 138, 0.3) 0px, transparent 50%),
                            radial-gradient(at 90% 90%, rgba(30, 58, 138, 0.2) 0px, transparent 50%);
          animation: gradientShift 60s ease infinite;
          background-size: 150% 150%;
        }
      `}} />

      {/* ================= SIGNED OUT (LANDING PAGE - REDESIGNED WITH ANIMATIONS) ================= */}
      <SignedOut>
        <div className="flex w-full h-full flex-col md:flex-row overflow-hidden relative">
          
          {/* ================= MOBILE SHIFTING GRADIENT (HIDDEN ON DESKTOP) ================= */}
          <div className="fixed inset-0 z-0 md:hidden mobile-gradient-bg"></div>

          {/* Left Side: Brand & Copy (Visible on tablets/desktops, fit to one screen) */}
          <div className="hidden md:flex flex-col justify-center flex-1 p-12 lg:p-24 relative overflow-hidden bg-[#0B1120]">
            
            {/* ================= LAPTOP/DESKTOP ADVANCED BACKGROUND ANIMATIONS ================= */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {/* Slower, morphing ambient light layer */}
              <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-ambient-light blur-[100px] rounded-full" />
              {/* Very slow, drifting cyan sphere */}
              <div className="absolute top-[30%] left-[60%] w-[300px] h-[300px] bg-cyan-600/10 blur-[90px] rounded-full bg-drifting-sphere" />
              {/* Very slow, drifting purple sphere */}
              <div className="absolute bottom-[20%] left-[20%] w-[250px] h-[250px] bg-purple-600/10 blur-[80px] rounded-full bg-drifting-sphere" style={{ animationDelay: '15s', animationDuration: '60s' }} />
            </div>

            <div className="relative z-10 max-w-xl flex flex-col justify-center">
              {/* Clean Logo Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">TarsChat</span>
              </div>

              {/* Minimalist Typography - Resized for professional look & vertical space */}
              <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] mb-6 tracking-tight">
                Where secure conversations happen.
              </h1>
              <p className="text-base text-slate-400 leading-relaxed mb-10 max-w-md">
                Experience lightning-fast, end-to-end encrypted messaging without the clutter. Designed for those who value privacy and clean design.
              </p>

              {/* Trust Badges - Lowered opacity for professionalism */}
              <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  End-to-end Encrypted
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Real-time Sync
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Auth Component - Glass layer */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-[#0f172a]/40 md:bg-[#0f172a]/40 border-l border-slate-800/50 backdrop-blur-sm md:backdrop-blur-0 z-10">
            
            {/* Mobile-only Logo (Shows only when left side is hidden, centered vertically) */}
            <div className="md:hidden flex flex-col items-center mb-8 flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">TarsChat</h1>
            </div>

            <div className="w-full max-w-[360px] flex flex-col gap-6 flex-shrink-0">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-semibold text-white mb-2 tracking-tight">Welcome back</h2>
                <p className="text-slate-400 text-sm">Log in or sign up to access your chats.</p>
              </div>

              {/* Clean, Flat Buttons */}
              <div className="space-y-3">
                <SignInButton mode="modal">
                  <button className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 py-2.5 px-4 rounded-lg font-medium transition-colors border border-transparent active:scale-[0.98]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#1f2937"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#1f2937"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#1f2937"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#1f2937"/>
                    </svg>
                    Continue with Google
                  </button>
                </SignInButton>

                <SignInButton mode="modal">
                  <button className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors border border-slate-700 active:scale-[0.98]">
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Continue with Email
                  </button>
                </SignInButton>
              </div>

              <p className="text-center text-xs text-slate-500 leading-relaxed max-w-sm mx-auto flex-shrink-0">
                By continuing, you agree to TarsChat's <br className="hidden md:block" /> Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>

        </div>
      </SignedOut>

      {/* ================= SIGNED IN (CHAT APP) - RETAINS THE PREMIUM FIT ================= */}
      <SignedIn>
        <SyncUser />
        {currentUser ? (
          <div className="flex h-full w-full bg-[#0B1120] overflow-hidden z-10 relative">
            
            {/* Mobile: Sidebar View */}
            {!activeConversation && (
              <div className="md:hidden w-full h-full bg-[#0B1120] overflow-hidden border-r border-slate-800/60 flex flex-col">
                <Sidebar onSelectConversation={setActiveConversation} />
              </div>
            )}

            {/* Mobile: Active Chat View */}
            {activeConversation && (
              <div className="md:hidden w-full h-full flex flex-col bg-[#0f172a] overflow-hidden">
                <div className="flex-1 overflow-hidden relative">
                  <ChatWindow
                    conversationId={activeConversation}
                    currentUserId={currentUser._id}
                    onBack={() => setActiveConversation(null)}
                  />
                </div>
              </div>
            )}

            {/* Desktop: Split Layout */}
            <div className="hidden md:flex h-full w-full overflow-hidden">
              {/* Sidebar Panel */}
              <div className="w-[320px] lg:w-[360px] h-full border-r border-slate-800/60 bg-[#0B1120] flex-shrink-0 flex flex-col z-10 overflow-hidden">
                <Sidebar onSelectConversation={setActiveConversation} />
              </div>

              {/* Main Chat Panel */}
              <div className="flex-1 h-full bg-[#0f172a] flex flex-col relative overflow-hidden">
                <div className="relative z-10 flex-1 flex flex-col h-full w-full overflow-hidden">
                  {activeConversation ? (
                    <ChatWindow
                      conversationId={activeConversation}
                      currentUserId={currentUser._id}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 text-slate-600 flex-shrink-0 border border-slate-700/50">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-slate-300 mb-2">Your Messages</h3>
                      <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                        Select a conversation from the sidebar or start a new secure chat.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Global Loading State */
          <div className="h-full w-full flex items-center justify-center bg-[#0B1120] z-10 relative">
            <div className="flex flex-col items-center gap-4">
              <div className="w-6 h-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-500 tracking-widest uppercase">Loading...</p>
            </div>
          </div>
        )}
      </SignedIn>
      
    </div>
  );
}
