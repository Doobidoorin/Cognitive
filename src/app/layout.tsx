import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { AeroBackground } from "@/components/AeroBackground";

export const metadata: Metadata = {
  title: "COGNITIVE — How sharp is your mind?",
  description:
    "COGNITIVE is an IQ-style cognitive assessment across six domains. Take the test once, compete on permanent leaderboards.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-sky-900 antialiased">
        <AeroBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1">{children}</main>
          <footer className="mx-auto w-full max-w-6xl px-4 py-8 text-center text-xs text-sky-800/70">
            ©2026 Cognitive. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  );
}
