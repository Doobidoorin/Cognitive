"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicQuestion, SubmittedAnswer } from "@/lib/types";
import { Stopwatch } from "@/components/Stopwatch";
import { MemoryChallenge } from "@/components/MemoryChallenge";

type LoadState = "loading" | "ready" | "error";

export default function AssessmentClient() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);

  const [index, setIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [choicesVisible, setChoicesVisible] = useState(true);
  const [reasoningStartedAt, setReasoningStartedAt] = useState<number>(() => Date.now());
  const answersRef = useRef<SubmittedAnswer[]>([]);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const tabSwitchCountRef = useRef(0);
  const [showTabWarning, setShowTabWarning] = useState(false);

  const question = questions[index];

  // ---- Load the sanitized question set (server enforces one-attempt) ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assessment/questions", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (res.status === 409) {
          router.replace("/results");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error ?? "Could not load the assessment.");
          setLoadState("error");
          return;
        }
        setQuestions(data.questions);
        setLoadState("ready");
      } catch {
        setLoadError("Network error loading the assessment.");
        setLoadState("error");
      }
    })();
  }, [router]);

  // ---- Per-question setup: reset selection, start the reasoning clock ----
  useEffect(() => {
    if (!question) return;
    setSelectedChoice(null);

    if (question.domain === "MEMORY") {
      // MemoryChallenge controls when the reasoning clock starts (recall phase).
      setChoicesVisible(false);
      return;
    }

    const delay = question.speed?.stimulusDelayMs ?? 0;
    if (delay > 0) {
      setChoicesVisible(false);
      const t = setTimeout(() => {
        setChoicesVisible(true);
        setReasoningStartedAt(Date.now());
      }, delay);
      return () => clearTimeout(t);
    }

    setChoicesVisible(true);
    setReasoningStartedAt(Date.now());
  }, [question]);

  // ---- Warn before an accidental refresh/close mid-assessment. This is a
  // courtesy, not a security control: a refresh doesn't create a second
  // server-side attempt, it just loses in-progress (unsubmitted) answers. ----
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (loadState !== "ready" || submittingFinal) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [loadState, submittingFinal]);

  // ---- Anti-cheat: tab-switch detection, discourage copy/context menu ----
  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
      } else if (tabSwitchCountRef.current > 0) {
        setShowTabWarning(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const handleMemoryRecallStart = useCallback(() => {
    setChoicesVisible(true);
    setReasoningStartedAt(Date.now());
  }, []);

  async function finishAssessment(finalAnswers: SubmittedAnswer[]) {
    setSubmittingFinal(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: finalAnswers,
          tabSwitchCount: tabSwitchCountRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong submitting your assessment.");
        setSubmittingFinal(false);
        return;
      }
      router.replace("/results");
    } catch {
      setSubmitError("Network error submitting your assessment. Please try again.");
      setSubmittingFinal(false);
    }
  }

  function handleLockInAnswer() {
    if (!question) return;
    const timeMs = Math.max(0, Date.now() - reasoningStartedAt);
    const answer: SubmittedAnswer = {
      questionId: question.id,
      choiceIndex: selectedChoice ?? -1,
      timeMs,
    };
    answersRef.current = [...answersRef.current, answer];

    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      finishAssessment(answersRef.current);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="glass-panel mx-auto h-3 w-48 overflow-hidden rounded-full">
          <div className="h-full w-1/2 shimmer-bar animate-shimmer" />
        </div>
        <p className="mt-4 text-sm text-sky-700">Preparing your assessment…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="glass-panel px-6 py-8 text-sky-800">{loadError}</p>
      </div>
    );
  }

  if (!question) return null;

  const renderChoices = () => (
    <div className="flex flex-col gap-3">
      {question.choices.map((choice, i) => (
        <button
          key={i}
          disabled={submittingFinal}
          onClick={() => setSelectedChoice(i)}
          className={`choice-btn ${selectedChoice === i ? "selected" : ""}`}
        >
          <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-xs font-bold text-sky-700">
            {String.fromCharCode(65 + i)}
          </span>
          {choice || <span className="italic text-sky-500">(placeholder choice — add content)</span>}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-10 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      {showTabWarning && (
        <div className="glass-panel mb-4 flex items-center justify-between gap-3 border-2 border-amber-300/70 px-4 py-3 text-sm text-amber-800">
          <span>We noticed you left this tab. Please stay on the assessment page to keep your attempt fair.</span>
          <button onClick={() => setShowTabWarning(false)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Domain and difficulty are intentionally never shown here — users
          should not know which cognitive domain or difficulty tier a
          question belongs to while taking the assessment. That metadata
          is still used internally for scoring and reporting. */}
      <div className="mb-6 flex items-center justify-center">
        <div className="glass-panel px-4 py-2 text-sm font-semibold text-sky-800">
          Question {index + 1} / {questions.length}
        </div>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/40">
        <div
          className="h-full bg-gradient-to-r from-sky-400 to-aero-leaf transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      {question.domain === "MEMORY" && question.memory ? (
        <div className="glass-panel-strong p-6 sm:p-8">
          <MemoryChallenge
            question={question}
            onRecallPhaseStart={handleMemoryRecallStart}
            renderRecallChoices={renderChoices}
            renderStopwatch={() => (
              <Stopwatch startedAt={reasoningStartedAt} running={choicesVisible && !submittingFinal} />
            )}
          />
          {choicesVisible && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleLockInAnswer}
                disabled={selectedChoice === null || submittingFinal}
                className="btn-glossy"
              >
                {submittingFinal ? "Submitting…" : index + 1 === questions.length ? "Finish assessment" : "Submit & continue"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel-strong p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-lg font-semibold leading-snug text-sky-900">
              {question.prompt || (
                <span className="italic text-sky-500">(placeholder question — content not added yet)</span>
              )}
            </p>
          </div>

          {question.asset && (
            <div className="mb-6 flex justify-center">
              {question.asset.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={question.asset.src} alt={question.asset.alt} className="max-h-64 rounded-xl" />
              ) : (
                <div
                  className="max-h-64"
                  dangerouslySetInnerHTML={{ __html: question.asset.markup ?? "" }}
                  aria-label={question.asset.alt}
                />
              )}
            </div>
          )}

          <div className="mb-6 flex justify-center">
            <Stopwatch startedAt={reasoningStartedAt} running={choicesVisible && !submittingFinal} />
          </div>

          {choicesVisible ? (
            <>
              {renderChoices()}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleLockInAnswer}
                  disabled={selectedChoice === null || submittingFinal}
                  className="btn-glossy"
                >
                  {submittingFinal ? "Submitting…" : index + 1 === questions.length ? "Finish assessment" : "Submit & continue"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-sky-600">
              Get ready…
            </p>
          )}
        </div>
      )}

      {submitError && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{submitError}</div>
      )}

      <p className="mt-6 text-center text-xs text-sky-600/80">
        Once submitted, an answer is locked and cannot be changed. You will not see whether it was
        correct until your final results.
      </p>
    </div>
  );
}
