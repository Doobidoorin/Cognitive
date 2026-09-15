"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/useSession";
import { Avatar } from "@/components/Avatar";

export function NavBar() {
  const { user, loading, refresh } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/30 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-xl font-bold tracking-tight text-sky-900">COGNITIVE</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/leaderboard"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-white/50 sm:block"
          >
            Leaderboards
          </Link>

          {loading ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-white/50" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-white/40 px-2 py-1 pr-3 hover:bg-white/60"
              >
                <Avatar pfp={user.pfp} size={32} />
                <span className="hidden text-sm font-semibold text-sky-900 sm:inline">{user.username}</span>
              </button>
              {menuOpen && (
                <div className="glass-panel-strong absolute right-0 mt-2 w-48 overflow-hidden p-2 text-sm">
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 font-medium text-sky-900 hover:bg-white/60"
                  >
                    My profile
                  </Link>
                  <Link
                    href="/leaderboard"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 font-medium text-sky-900 hover:bg-white/60 sm:hidden"
                  >
                    Leaderboards
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl px-3 py-2 font-medium text-sky-900 hover:bg-white/60"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-1 block w-full rounded-xl px-3 py-2 text-left font-medium text-red-600 hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-secondary text-sm !px-4 !py-2">
                Log in
              </Link>
              <Link href="/register" className="btn-glossy text-sm !px-4 !py-2">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
