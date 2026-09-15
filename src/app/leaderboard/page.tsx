"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { DOMAIN_LABELS, Domain } from "@/lib/types";

type BoardKey = "OVERALL" | Domain;

const BOARDS: { key: BoardKey; label: string; icon: string }[] = [
  { key: "OVERALL", label: "Overall" },
  { key: "LOGICAL", label: DOMAIN_LABELS.LOGICAL },
  { key: "NUMERICAL", label: DOMAIN_LABELS.NUMERICAL },
  { key: "PATTERN", label: DOMAIN_LABELS.PATTERN },
  { key: "SPATIAL", label: DOMAIN_LABELS.SPATIAL },
  { key: "MEMORY", label: DOMAIN_LABELS.MEMORY },
  { key: "SPEED", label: DOMAIN_LABELS.SPEED },
];

interface Entry {
  rank: number;
  username: string;
  pfp: string | null;
  score: number;
  classification?: string;
  title?: string;
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<BoardKey>("OVERALL");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?board=${board}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .finally(() => setLoading(false));
  }, [board]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center text-3xl font-extrabold text-sky-900">Leaderboards</h1>
      <p className="mt-2 text-center text-sm text-sky-700">Permanent rankings one attempt each </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {BOARDS.map((b) => (
          <button
            key={b.key}
            onClick={() => setBoard(b.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              board === b.key ? "btn-glossy !px-4 !py-2" : "btn-secondary !px-4 !py-2"
            }`}
          >
            {b.icon} {b.label}
          </button>
        ))}
      </div>

      <div className="glass-panel-strong mt-8 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="glass-panel mx-auto h-3 w-48 overflow-hidden rounded-full">
              <div className="h-full w-1/2 shimmer-bar animate-shimmer" />
            </div>
          </div>
        ) : entries.length === 0 ? (
          <p className="p-10 text-center text-sm text-sky-700">
            No results yet be the first to complete the assessment!
          </p>
        ) : (
          <ul className="divide-y divide-white/40">
            {entries.map((e) => (
              <li key={e.username}>
                <Link
                  href={`/profile/${e.username}`}
                  className="flex items-center gap-4 px-5 py-3 transition hover:bg-white/40"
                >
                  <span
                    className={`w-8 text-center text-sm font-extrabold ${
                      e.rank === 1
                        ? "text-amber-500"
                        : e.rank === 2
                        ? "text-slate-400"
                        : e.rank === 3
                        ? "text-orange-400"
                        : "text-sky-700"
                    }`}
                  >
                    {e.rank}
                  </span>
                  <Avatar pfp={e.pfp} size={36} />
                  <span className="flex-1 truncate font-semibold text-sky-900">{e.username}</span>
                  {e.title && <span className="hidden text-xs text-sky-600 sm:inline">{e.title}</span>}
                  <span className="font-mono text-lg font-bold text-sky-900">{e.score}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
