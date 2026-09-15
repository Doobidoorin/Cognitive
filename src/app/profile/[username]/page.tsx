"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CognitiveReport } from "@/components/CognitiveReport";
import { AssessmentReport } from "@/lib/types";

interface ProfileData {
  username: string;
  pfp: string | null;
  hasCompletedAssessment: boolean;
  report?: AssessmentReport;
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "not-found" | "error">("loading");

  useEffect(() => {
    fetch(`/api/profile/${encodeURIComponent(params.username)}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 404) {
          setState("not-found");
          return;
        }
        const json = await res.json();
        if (!res.ok) {
          setState("error");
          return;
        }
        setData(json);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [params.username]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="glass-panel mx-auto h-3 w-48 overflow-hidden rounded-full">
          <div className="h-full w-1/2 shimmer-bar animate-shimmer" />
        </div>
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="glass-panel px-6 py-8 text-sky-800">No user found with that username.</p>
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="glass-panel px-6 py-8 text-sky-800">Something went wrong loading this profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Avatar pfp={data.pfp} size={88} />
        <h1 className="text-2xl font-extrabold text-sky-900">{data.username}</h1>
      </div>

      {data.hasCompletedAssessment && data.report ? (
        <CognitiveReport report={data.report} />
      ) : (
        <div className="glass-panel-strong px-8 py-12 text-center">
          <p className="text-sky-800">{data.username} hasn&apos;t completed the assessment yet.</p>
        </div>
      )}
    </div>
  );
}
