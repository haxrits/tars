import "./globals.css";
import Providers from "../components/Providers";
import { Inter } from "next/font/google";
import { dark } from "@clerk/themes";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}