"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AssessmentReport } from "@/lib/types";
import { CognitiveReport } from "@/components/CognitiveReport";
import { useSession } from "@/lib/useSession";

export default function ResultsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [state, setState] = useState<"loading" | "not-completed" | "ready" | "error">("loading");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assessment/status", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setState("error");
          return;
        }
        if (!data.completed) {
          setState("not-completed");
          return;
        }
        setReport(data.report);
        setState("ready");
      } catch {
        setState("error");
      }
    })();
  }, [router]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="glass-panel mx-auto h-3 w-48 overflow-hidden rounded-full">
          <div className="h-full w-1/2 shimmer-bar animate-shimmer" />
        </div>
      </div>
    );
  }

  if (state === "not-completed") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="glass-panel-strong px-8 py-10">
          <p className="text-lg font-semibold text-sky-900">You haven&apos;t taken the assessment yet.</p>
          <Link href="/assessment" className="btn-glossy mt-6 inline-block">
            Begin the assessment
          </Link>
        </div>
      </div>
    );
  }

  if (state === "error" || !report) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="glass-panel px-6 py-8 text-sky-800">Something went wrong loading your results.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-center text-3xl font-extrabold text-sky-900">Your COGNITIVE Report</h1>
      {!sessionLoading && user && (
        <p className="mb-8 text-center text-sm text-sky-700">
          Shareable at{" "}
          <Link href={`/profile/${user.username}`} className="font-semibold underline">
            your public profile
          </Link>
        </p>
      )}
      <CognitiveReport report={report} />
      <div className="mt-10 flex justify-center gap-4">
        <Link href="/leaderboard" className="btn-secondary">
          View leaderboards
        </Link>
        {user && (
          <Link href={`/profile/${user.username}`} className="btn-glossy">
            View public profile
          </Link>
        )}
      </div>
    </div>
  );
}
