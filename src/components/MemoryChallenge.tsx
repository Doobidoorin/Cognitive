"use client";

import { useEffect, useState } from "react";
import { PublicQuestion } from "@/lib/types";

type Phase = "study" | "interference" | "recall";

// ---- Shape guards for each recall type's expected study-data shape ----
// These are intentionally permissive: if a question's studyItems doesn't
// match the expected shape for its recallType, we fall back to a generic
// (but still readable) renderer instead of crashing. This keeps the
// question bank fully data-driven — no engine changes are ever required
// to add a new question, only data.

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === "string");
}

interface GridCell {
  row: number;
  col: number;
  label: string;
}
interface PositionalGridObj {
  rows: number;
  cols: number;
  filled: GridCell[];
}
function isPositionalGridObj(x: unknown): x is PositionalGridObj {
  if (typeof x !== "object" || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return typeof o.rows === "number" && typeof o.cols === "number" && Array.isArray(o.filled);
}
function isGrid2DArray(x: unknown): x is (string | null)[][] {
  return Array.isArray(x) && x.length > 0 && x.every((row) => Array.isArray(row));
}

interface ItemPositionEntry {
  item: string;
  position: number;
}
function isItemPositionArray(x: unknown): x is ItemPositionEntry[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    x.every(
      (e) =>
        e &&
        typeof e === "object" &&
        typeof (e as Record<string, unknown>).item === "string" &&
        typeof (e as Record<string, unknown>).position === "number"
    )
  );
}

interface SymbolAssociationEntry {
  symbol: string;
  value: string;
}
function isSymbolAssociationArray(x: unknown): x is SymbolAssociationEntry[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    x.every(
      (e) =>
        e &&
        typeof e === "object" &&
        typeof (e as Record<string, unknown>).symbol === "string" &&
        typeof (e as Record<string, unknown>).value === "string"
    )
  );
}

function isObjectArray(x: unknown): x is Record<string, unknown>[] {
  return (
    Array.isArray(x) &&
    x.length > 0 &&
    x.every((e) => e && typeof e === "object" && !Array.isArray(e))
  );
}

/** Renders a positional/grid layout. Accepts either a plain 2D array
 * (row-major, null/empty = blank cell) or a {rows, cols, filled} object. */
function PositionalGrid({ studyItems }: { studyItems: unknown }) {
  let rows: number;
  let cols: number;
  let getCell: (r: number, c: number) => string | null;

  if (isGrid2DArray(studyItems)) {
    rows = studyItems.length;
    cols = Math.max(...studyItems.map((r) => r.length));
    getCell = (r, c) => studyItems[r]?.[c] ?? null;
  } else if (isPositionalGridObj(studyItems)) {
    rows = studyItems.rows;
    cols = studyItems.cols;
    const map = new Map(studyItems.filled.map((f) => [`${f.row}:${f.col}`, f.label]));
    getCell = (r, c) => map.get(`${r}:${c}`) ?? null;
  } else {
    return <GenericFallback studyItems={studyItems} />;
  }

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const label = getCell(r, c);
      cells.push(
        <div
          key={`${r}-${c}`}
          className={`flex aspect-square items-center justify-center rounded-lg text-sm font-semibold ${
            label ? "bg-white/80 text-sky-900 shadow" : "bg-white/25 text-transparent"
          }`}
        >
          {label ?? "·"}
        </div>
      );
    }
  }

  return (
    <div
      className="mx-auto grid w-full max-w-xs gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cells}
    </div>
  );
}

/** Renders item-to-position association: a strip of numbered slots with
 * the associated item shown in each. */
function ItemPositionAssociation({ entries }: { entries: ItemPositionEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.position - b.position);
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {sorted.map((e, i) => (
        <div key={i} className="glass-panel flex flex-col items-center px-4 py-3">
          <span className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
            {e.position}
          </span>
          <span className="text-sm font-semibold text-sky-900">{e.item}</span>
        </div>
      ))}
    </div>
  );
}

/** Renders symbol <-> value pairs as paired cards. */
function SymbolAssociation({ entries }: { entries: SymbolAssociationEntry[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {entries.map((e, i) => (
        <div key={i} className="glass-panel flex flex-col items-center gap-1 px-5 py-3">
          <span className="text-2xl font-bold text-sky-900">{e.symbol}</span>
          <span className="h-px w-8 bg-sky-300" />
          <span className="text-sm font-semibold text-sky-700">{e.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Renders items with multiple attributes as attribute cards (pills)
 * rather than raw "key: value" lines. Works with any attribute names,
 * so new multi-attribute questions never require code changes. */
function MultiAttribute({ entries }: { entries: Record<string, unknown>[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {entries.map((obj, i) => {
        const entries2 = Object.entries(obj);
        const titleEntry = entries2.find(([k]) => /name|label|title/i.test(k)) ?? entries2[0];
        const rest = entries2.filter(([k]) => k !== titleEntry?.[0]);
        return (
          <div key={i} className="glass-panel flex flex-col items-center gap-2 px-4 py-3">
            {titleEntry && (
              <span className="text-sm font-bold text-sky-900">{String(titleEntry[1])}</span>
            )}
            <div className="flex flex-wrap justify-center gap-1">
              {rest.map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-sky-700"
                >
                  {String(v)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Ordered sequence display (SEQUENCE and, by default, DELAYED_RECALL). */
function SequenceList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {items.map((item, i) => (
        <div key={i} className="glass-panel flex flex-col items-center px-5 py-3">
          <span className="mb-1 text-[10px] font-bold uppercase tracking-wide text-sky-500">
            #{i + 1}
          </span>
          <span className="text-lg font-semibold text-sky-900">{item}</span>
        </div>
      ))}
    </div>
  );
}

function GenericFallback({ studyItems }: { studyItems: unknown }) {
  if (!studyItems || (Array.isArray(studyItems) && studyItems.length === 0)) {
    return (
      <p className="text-center text-sm italic text-sky-600">
        (No study material configured for this placeholder question yet.)
      </p>
    );
  }
  if (isObjectArray(studyItems)) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {studyItems.map((obj, i) => (
          <div key={i} className="glass-panel px-4 py-3 text-sm text-sky-900">
            {Object.entries(obj).map(([k, v]) => (
              <div key={k}>
                <span className="font-semibold capitalize">{k}:</span> {String(v)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <pre className="glass-panel max-w-full overflow-x-auto px-4 py-3 text-xs text-sky-900">
      {JSON.stringify(studyItems, null, 2)}
    </pre>
  );
}

/** Dispatches to a recall-type-specific renderer, falling back to a
 * generic display if the data doesn't match the expected shape. */
function StudyDisplay({ recallType, studyItems }: { recallType: string; studyItems: unknown }) {
  if (!studyItems || (Array.isArray(studyItems) && studyItems.length === 0)) {
    return (
      <p className="text-center text-sm italic text-sky-600">
        (No study material configured for this placeholder question yet.)
      </p>
    );
  }

  switch (recallType) {
    case "SEQUENCE":
      return isStringArray(studyItems) ? <SequenceList items={studyItems} /> : <GenericFallback studyItems={studyItems} />;

    case "POSITIONAL":
      return <PositionalGrid studyItems={studyItems} />;

    case "ITEM_POSITION_ASSOCIATION":
      return isItemPositionArray(studyItems) ? (
        <ItemPositionAssociation entries={studyItems} />
      ) : (
        <GenericFallback studyItems={studyItems} />
      );

    case "SYMBOL_ASSOCIATION":
      return isSymbolAssociationArray(studyItems) ? (
        <SymbolAssociation entries={studyItems} />
      ) : (
        <GenericFallback studyItems={studyItems} />
      );

    case "MULTI_ATTRIBUTE":
      return isObjectArray(studyItems) ? (
        <MultiAttribute entries={studyItems} />
      ) : (
        <GenericFallback studyItems={studyItems} />
      );

    case "DELAYED_RECALL":
      // DELAYED_RECALL pairs with any content shape plus an interference
      // step — default to the sequence-style display, but degrade
      // gracefully if richer content (objects) is supplied instead.
      if (isStringArray(studyItems)) return <SequenceList items={studyItems} />;
      if (isObjectArray(studyItems)) return <MultiAttribute entries={studyItems} />;
      return <GenericFallback studyItems={studyItems} />;

    default:
      return <GenericFallback studyItems={studyItems} />;
  }
}

interface MemoryChallengeProps {
  question: PublicQuestion;
  /** Called once the recall phase begins — this is when the reasoning
   * stopwatch should start, per spec §12. */
  onRecallPhaseStart: () => void;
  /** Renders the actual multiple-choice recall UI. Kept external so the
   * parent controls answer selection/submission consistently with
   * non-memory questions. */
  renderRecallChoices: () => React.ReactNode;
  /** Renders the same visible stopwatch used by other questions. Called
   * only during the recall phase, so study/interference time is never
   * included in the displayed or recorded response time. */
  renderStopwatch: () => React.ReactNode;
}

export function MemoryChallenge({
  question,
  onRecallPhaseStart,
  renderRecallChoices,
  renderStopwatch,
}: MemoryChallengeProps) {
  const memory = question.memory!;
  const [phase, setPhase] = useState<Phase>("study");
  const [remainingMs, setRemainingMs] = useState(memory.studyDurationMs);

  useEffect(() => {
    setPhase("study");
    setRemainingMs(memory.studyDurationMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  useEffect(() => {
    if (phase !== "study" && phase !== "interference") return;
    const duration = phase === "study" ? memory.studyDurationMs : memory.interference?.durationMs ?? 0;
    const start = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, duration - (Date.now() - start));
      setRemainingMs(left);
      if (left <= 0) {
        clearInterval(id);
        if (phase === "study") {
          if (memory.interference) {
            setPhase("interference");
            setRemainingMs(memory.interference.durationMs);
          } else {
            setPhase("recall");
            onRecallPhaseStart();
          }
        } else {
          setPhase("recall");
          onRecallPhaseStart();
        }
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, question.id]);

  const progressPct =
    phase === "study"
      ? 100 - (remainingMs / Math.max(memory.studyDurationMs, 1)) * 100
      : phase === "interference"
      ? 100 - (remainingMs / Math.max(memory.interference?.durationMs ?? 1, 1)) * 100
      : 100;

  if (phase === "study") {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
          Memorize — {(remainingMs / 1000).toFixed(1)}s left
        </p>
        <StudyDisplay recallType={memory.recallType} studyItems={memory.studyItems} />
        <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/50">
          <div className="h-full bg-sky-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    );
  }

  if (phase === "interference") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">Quick distraction</p>
        <p className="glass-panel px-6 py-4 text-lg font-semibold text-sky-900">
          {memory.interference?.prompt}
        </p>
        <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/50">
          <div className="h-full bg-aero-leaf transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    );
  }

  // ---- Recall phase ----
  // The study material is fully hidden here — only the question prompt
  // and the stopwatch (started fresh for this phase) are shown, along
  // with the multiple-choice recall UI.
  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-sky-600">
        Now recall
      </p>
      <p className="text-center text-lg font-semibold leading-snug text-sky-900">
        {question.prompt || (
          <span className="italic text-sky-500">(placeholder question — content not added yet)</span>
        )}
      </p>
      <div className="flex justify-center">{renderStopwatch()}</div>
      {renderRecallChoices()}
    </div>
  );
}
