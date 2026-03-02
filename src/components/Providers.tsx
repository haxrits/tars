"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#6366f1', // Indigo-500
          colorBackground: '#0B1120', // Matches the deep background of our app
          colorText: '#f8fafc',
          colorInputBackground: '#1e293b',
          colorInputText: '#f8fafc',
          borderRadius: '1rem', 
        },
        elements: {
          // Keep modal shell transparent so only one card layer is visible
          rootBox: "bg-transparent shadow-none",
          modalContent: "!bg-transparent !shadow-none !border-0 !p-0",
          cardBox: "!bg-transparent !shadow-none !border-0",
          
          // Add glass blur behind the modal
          modalBackdrop: "bg-slate-950/80 backdrop-blur-sm", 
          
          // Single visible card
          card: "bg-slate-900/95 shadow-2xl shadow-indigo-500/10 border border-slate-800/60",
          
          // Header section
          headerTitle: "text-2xl font-bold text-white tracking-tight",
          headerSubtitle: "text-slate-400 text-sm",
          
          // Google/Social Buttons
          socialButtonsBlockButton: "bg-[#1e293b] border border-slate-700/50 hover:bg-slate-800 text-white transition-all duration-200",
          socialButtonsBlockButtonText: "font-medium text-sm",
          
          // Divider ("or")
          dividerLine: "bg-slate-800",
          dividerText: "text-slate-500 text-xs font-medium",
          
          // Form inputs
          formFieldLabel: "text-slate-300 font-medium text-sm",
          formFieldInput: "bg-[#0f172a] border-slate-700/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all rounded-lg",
          
          // Primary action buttons
          formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]",
          
          // Footer text
          footer: "bg-transparent border-t border-slate-800/60",
          footerActionText: "text-slate-400",
          footerActionLink: "text-indigo-400 hover:text-indigo-300 font-medium",
          
          // OTP / Identity screens
          identityPreview: "bg-[#1e293b] border border-slate-700/50 rounded-lg",
          identityPreviewText: "text-white",
          identityPreviewEditButtonIcon: "text-slate-400 hover:text-indigo-400 transition-colors",
          
          // Loading spinner
          logoImage: "opacity-90",
          loaderIcon: "text-indigo-500"
        }
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
