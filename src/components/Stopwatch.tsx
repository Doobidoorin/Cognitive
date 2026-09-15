"use client";

import { useEffect, useState } from "react";

/** Purely visual ticking stopwatch. The authoritative elapsed time used
 * for scoring is computed separately from timestamps (see
 * AssessmentClient) — this component just re-renders the display. */
export function Stopwatch({ startedAt, running }: { startedAt: number; running: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 47);
    return () => clearInterval(id);
  }, [running]);

  const elapsedMs = Math.max(0, now - startedAt);
  const totalSeconds = elapsedMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;

  const display = `${minutes.toString().padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;

  return (
    <div className="glass-panel inline-flex items-center gap-2 px-4 py-2 font-mono text-sm font-semibold text-sky-800">
      <span className="text-base">⏱</span>
      {display}
    </div>
  );
}
