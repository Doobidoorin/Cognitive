"use client";

import Link from "next/link";
import { useSession } from "@/lib/useSession";
import { DOMAIN_LABELS, DOMAINS } from "@/lib/types";

const DOMAIN_ICON: Record<string, string> = {
  LOGICAL: "🧩",
  NUMERICAL: "🔢",
  PATTERN: "🌀",
  SPATIAL: "📐",
  MEMORY: "💭",
  SPEED: "⚡",
};

export default function HomePage() {
  const { user, loading } = useSession();

  let ctaHref = "/register";
  let ctaLabel = "BEGIN";
  if (!loading && user) {
    ctaHref = user.hasCompletedAssessment ? `/results` : "/assessment";
    ctaLabel = user.hasCompletedAssessment ? "VIEW MY RESULTS" : "BEGIN";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:pt-20">
      <section className="flex flex-col items-center text-center">
        <div className="glass-panel mb-8 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-sky-700">
          <span className="h-2 w-2 rounded-full bg-aero-leaf" /> A clear-sky cognitive challenge
        </div>

        <h1 className="text-glow text-5xl font-extrabold tracking-tight text-sky-900 sm:text-7xl">
          COGNITIVE
        </h1>
        <p className="mt-4 text-xl font-medium text-sky-800 sm:text-2xl">How sharp is your mind?</p>
        <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-sky-600">
          30 challenges · 6 cognitive domains
        </p>

        <Link href={ctaHref} className="btn-glossy mt-10 px-12 py-4 text-lg tracking-wide">
          {ctaLabel}
        </Link>

        <p className="mt-4 max-w-md text-xs text-sky-700/80">
          No email required — just create a username and password you can remember.
        </p>
      </section>

      <section className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
        {DOMAINS.map((d) => (
          <div key={d} className="glass-panel flex flex-col items-center gap-2 px-4 py-6 text-center">
            <span className="text-3xl">{DOMAIN_ICON[d]}</span>
            <span className="text-sm font-semibold text-sky-900">{DOMAIN_LABELS[d]}</span>
          </div>
        ))}
      </section>

      <section className="glass-panel mt-16 mx-auto max-w-3xl px-6 py-8 text-center">
        <h2 className="text-lg font-bold text-sky-900">What to expect</h2>
        <p className="mt-3 text-sm leading-relaxed text-sky-800">
          COGNITIVE measures performance across six cognitive domains through five rounds of
          increasing difficulty — 30 questions in total. Each question is timed individually with
          no overall countdown, so you can focus on getting it right. You get exactly one attempt,
          and your result is saved permanently to the leaderboards.
        </p>
        <p className="mt-4 text-xs text-sky-700/70">
          COGNITIVE is an IQ-style cognitive test. Scores are designed for entertainment and
          self-comparison and are not equivalent to a standardized clinical or professional IQ test.
        </p>
      </section>

      <section className="mt-10 flex justify-center">
        <Link href="/leaderboard" className="btn-secondary">
          View the leaderboards →
        </Link>
      </section>
    </div>
  );
}
