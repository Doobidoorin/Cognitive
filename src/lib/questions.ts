import {
  DIFFICULTIES,
  DOMAINS,
  Question,
  PublicQuestion,
  Domain,
  Difficulty,
} from "./types";

/**
 * ============================================================
 * COGNITIVE — Question Engine
 * ============================================================
 * This file is the ONLY place question content lives. The actual
 * 30 questions are added at the very bottom of this file, inside
 * the clearly marked QUESTION BANK section. Nothing else in the
 * app needs to change when you add them.
 *
 * Fixed order shown to every user (per spec §7):
 *   Round 1 (EASY):      Logical, Numerical, Pattern, Spatial, Memory, Speed
 *   Round 2 (MEDIUM):    same domain order
 *   Round 3 (HARD):      same domain order
 *   Round 4 (VERY_HARD): same domain order
 *   Round 5 (EXTREME):   same domain order
 *
 * getOrderedQuestions() below builds this order automatically from
 * whatever is in QUESTION_BANK, so you never have to hand-order
 * anything — just fill in each placeholder with the right
 * domain/difficulty and the engine slots it into the right round.
 * ============================================================
 */

const DOMAIN_ORDER: Domain[] = ["LOGICAL", "NUMERICAL", "PATTERN", "SPATIAL", "MEMORY", "SPEED"];

/** Strips the answer key. This is the only version of a question that
 * should ever be sent to a browser before the user has submitted. */
export function toPublicQuestion(q: Question): PublicQuestion {
  const { correctIndex, ...rest } = q;
  return rest;
}

/** Returns the 30 questions in the fixed, spec-defined round order. */
export function getOrderedQuestions(): Question[] {
  const byKey = new Map<string, Question>();
  for (const q of QUESTION_BANK) byKey.set(`${q.difficulty}:${q.domain}`, q);

  const ordered: Question[] = [];
  for (const difficulty of DIFFICULTIES) {
    for (const domain of DOMAIN_ORDER) {
      const q = byKey.get(`${difficulty}:${domain}`);
      if (q) ordered.push(q);
    }
  }
  return ordered;
}

export function getOrderedPublicQuestions(): PublicQuestion[] {
  return getOrderedQuestions().map(toPublicQuestion);
}

export function getQuestionById(id: number): Question | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}

/** Basic integrity check — call this (e.g. at server startup or in a
 * script) once real questions are pasted in, to catch structural
 * mistakes early instead of at runtime mid-assessment. */
export function validateQuestionBank(): string[] {
  const errors: string[] = [];
  if (QUESTION_BANK.length !== 30) {
    errors.push(`Expected exactly 30 questions, found ${QUESTION_BANK.length}.`);
  }
  const seenIds = new Set<number>();
  const seenSlots = new Set<string>();
  for (const q of QUESTION_BANK) {
    if (seenIds.has(q.id)) errors.push(`Duplicate question id ${q.id}.`);
    seenIds.add(q.id);

    const slot = `${q.difficulty}:${q.domain}`;
    if (seenSlots.has(slot)) errors.push(`Duplicate slot ${slot} (only one question per domain per difficulty).`);
    seenSlots.add(slot);

    if (!DOMAINS.includes(q.domain)) errors.push(`Question ${q.id} has invalid domain "${q.domain}".`);
    if (!DIFFICULTIES.includes(q.difficulty)) errors.push(`Question ${q.id} has invalid difficulty "${q.difficulty}".`);
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      errors.push(`Question ${q.id} needs at least 2 multiple-choice options.`);
    }
    if (q.correctIndex < 0 || q.correctIndex >= q.choices.length) {
      errors.push(`Question ${q.id} has an out-of-range correctIndex.`);
    }
    if (q.domain === "MEMORY" && !q.memory) {
      errors.push(`Question ${q.id} is a Memory question but is missing its "memory" configuration.`);
    }
    if (!q.prompt || !q.prompt.trim()) {
      errors.push(`Question ${q.id} has empty placeholder content — fill this in before launch.`);
    }
  }
  return errors;
}

// ============================================================
// ================ QUESTION BANK — ADD QUESTIONS HERE ================
// ============================================================
//
// Replace each placeholder object below with the real question.
// Do NOT change: `id`, `domain`, or `difficulty` — those define the
// fixed slot the question occupies in the assessment. Everything
// else (prompt, choices, correctIndex, asset, memory, speed) is
// yours to fill in.
//
// FIELD GUIDE
//   id            — 1-30, already assigned per spec. Leave as-is.
//   domain        — one of: LOGICAL | NUMERICAL | PATTERN | SPATIAL | MEMORY | SPEED
//   difficulty    — one of: EASY | MEDIUM | HARD | VERY_HARD | EXTREME
//   prompt        — the question text shown to the user
//   choices       — array of answer strings (multiple choice only)
//   correctIndex  — index (0-based) into `choices` of the right answer
//   asset         — OPTIONAL. For images/visual patterns:
//                     { type: "image", src: "/questions/q13.png", alt: "..." }
//                   or inline SVG:
//                     { type: "svg-inline", markup: "<svg>...</svg>", alt: "..." }
//   memory        — REQUIRED for domain === "MEMORY". See MemoryConfig in
//                   lib/types.ts. Example shapes per recallType:
//                     SEQUENCE:                  studyItems: string[] (shown in order)
//                     POSITIONAL:                studyItems: { grid: string[][] } or similar
//                     ITEM_POSITION_ASSOCIATION:  studyItems: { item: string; position: number }[]
//                     SYMBOL_ASSOCIATION:         studyItems: { symbol: string; value: string }[]
//                     MULTI_ATTRIBUTE:            studyItems: { name: string; color: string; shape: string }[]
//                     DELAYED_RECALL:             same as any of the above + `interference`
//                   studyDurationMs — how long the study phase is shown
//                   interference    — OPTIONAL { prompt, durationMs } distraction step
//   speed         — OPTIONAL for domain === "SPEED": { stimulusDelayMs }
//
// The assessment engine (ordering, stopwatch, scoring, one-attempt
// enforcement, leaderboards) already works against this array — you
// only ever need to edit data here, never application logic.
// ============================================================

export const QUESTION_BANK: Question[] = [
  // ---------------- ROUND 1 — EASY (IDs 1-6) ----------------
  {
    id: 1,
    domain: "LOGICAL",
    difficulty: "EASY",
    prompt:
      "Four students Tahseen, Noah, Omar, and Yusha are standing in a line. Tahseen is somewhere to the left of Noah; Omar is somewhere to the right of Noah; Yusha is somewhere to the left of Tahseen. Who must be standing farthest to the left?",
    choices: ["Tahseen", "Noah", "Omar", "Yusha"],
    correctIndex: 3,
  },
  {
    id: 2,
    domain: "NUMERICAL",
    difficulty: "EASY",
    prompt: "What number comes next? 2, 4, 8, 16, ?",
    choices: ["24", "28", "32", "36"],
    correctIndex: 2,
  },
  {
    id: 3,
    domain: "PATTERN",
    difficulty: "EASY",
    prompt: "What comes next in the sequence? ○ △ ○ △ ○ ?",
    choices: ["○", "△", "□", "◇"],
    correctIndex: 1,
  },
  {
    id: 4,
    domain: "SPATIAL",
    difficulty: "EASY",
    prompt: "An arrow is pointing upward (↑). It is rotated 90° clockwise. Which direction does it point?",
    choices: ["↑", "←", "→", "↓"],
    correctIndex: 2,
  },
  {
    id: 5,
    domain: "MEMORY",
    difficulty: "EASY",
    prompt: "Which sequence was shown?",
    choices: ["7 2 4 9 1", "7 2 9 4 1", "7 9 2 4 1", "2 7 9 1 4"],
    correctIndex: 1,
    memory: {
      recallType: "SEQUENCE",
      studyItems: ["7", "2", "9", "4", "1"],
      studyDurationMs: 5000,
    },
  },
  {
    id: 6,
    domain: "SPEED",
    difficulty: "EASY",
    prompt: "Which symbol appears exactly twice? ◆ ● ▲ ■ ● ◆",
    choices: ["◆", "●", "▲", "■"],
    correctIndex: 1,
    speed: {},
  },

  // ---------------- ROUND 2 — MEDIUM (IDs 7-12) ----------------
  {
    id: 7,
    domain: "LOGICAL",
    difficulty: "MEDIUM",
    prompt:
      "Six books P, Q, R, S, T, and U are arranged from left to right. P is somewhere before Q; R is immediately after P; S is somewhere after Q; T is immediately before U; Q is immediately before T. Which arrangement could be correct?",
    choices: ["P R Q T U S", "P Q R T U S", "T U P R Q S", "P R T U Q S"],
    correctIndex: 0,
  },
  {
    id: 8,
    domain: "NUMERICAL",
    difficulty: "MEDIUM",
    prompt: "What number comes next? 5, 9, 17, 33, 65, ?",
    choices: ["97", "113", "129", "131"],
    correctIndex: 2,
  },
  {
    id: 9,
    domain: "PATTERN",
    difficulty: "MEDIUM",
    prompt: "What comes next? ▲ ▲ ● ■ ▲ ▲ ● ■ ▲ ▲ ?",
    choices: ["▲", "●", "■", "◆"],
    correctIndex: 1,
  },
  {
    id: 10,
    domain: "SPATIAL",
    difficulty: "MEDIUM",
    prompt:
      "A pointer initially faces →. It is rotated 90° clockwise, then 180° counterclockwise, then 90° clockwise. Which direction does it face?",
    choices: ["↑", "→", "↓", "←"],
    correctIndex: 1,
  },
  {
    id: 11,
    domain: "MEMORY",
    difficulty: "MEDIUM",
    prompt: "Which item occupied the sixth position?",
    choices: ["8", "◆", "2", "■"],
    correctIndex: 2,
    memory: {
      recallType: "POSITIONAL",
      studyItems: [["▲", "4", "●", "8", "◆", "2", "■", "9"]],
      studyDurationMs: 7000,
    },
  },
  {
    id: 12,
    domain: "SPEED",
    difficulty: "MEDIUM",
    prompt: "Which option contains two completely identical codes?",
    choices: ["K7P4Q2 / K7P4O2", "M3Q8R5 / M3Q8R5", "R5T2L9 / R5T2I9", "B9L6X3 / B9I6X3"],
    correctIndex: 1,
    speed: {},
  },

  // ---------------- ROUND 3 — HARD (IDs 13-18) ----------------
  {
    id: 13,
    domain: "LOGICAL",
    difficulty: "HARD",
    prompt:
      "Seven people A, B, C, D, E, F, and G stand in a line. A is somewhere before D; B is immediately before E; C is immediately before F; G is somewhere after E; D is somewhere after F; B is not first; G is not last. Who must occupy the seventh position?",
    choices: ["A", "B", "D", "G"],
    correctIndex: 2,
  },
  {
    id: 14,
    domain: "NUMERICAL",
    difficulty: "HARD",
    prompt: "What number comes next? 3, 7, 15, 31, 63, 127, ?",
    choices: ["191", "239", "255", "257"],
    correctIndex: 2,
  },
  {
    id: 15,
    domain: "PATTERN",
    difficulty: "HARD",
    prompt:
      "Each row follows the same cyclic transformation. Row 1: ▲ ● ■ ◆. Row 2: ● ■ ◆ ▲. Row 3: ■ ◆ ▲ ●. Row 4: ◆ ▲ ● ?. What replaces the question mark?",
    choices: ["▲", "●", "■", "◆"],
    correctIndex: 1,
  },
  {
    id: 16,
    domain: "SPATIAL",
    difficulty: "HARD",
    prompt:
      "A cube has Red opposite Blue, Green opposite Yellow, and White opposite Black. Initially Red is on top, Green is in front, and White is on the right. The cube is rotated so that Green moves to the top. Which color must now be on the bottom?",
    choices: ["Red", "Blue", "Yellow", "White"],
    correctIndex: 2,
  },
  {
    id: 17,
    domain: "MEMORY",
    difficulty: "HARD",
    prompt: "Which item was immediately before ◆?",
    choices: ["1", "■", "6", "4"],
    correctIndex: 2,
    memory: {
      recallType: "ITEM_POSITION_ASSOCIATION",
      studyItems: [
        { item: "3", position: 1 },
        { item: "▲", position: 2 },
        { item: "8", position: 3 },
        { item: "●", position: 4 },
        { item: "1", position: 5 },
        { item: "■", position: 6 },
        { item: "6", position: 7 },
        { item: "◆", position: 8 },
        { item: "4", position: 9 },
      ],
      studyDurationMs: 9000,
    },
  },
  {
    id: 18,
    domain: "SPEED",
    difficulty: "HARD",
    prompt: "The target code is Q7M4K9. Which option differs from the target by exactly one character?",
    choices: ["Q7M4K8", "Q7N4X9", "Q7M9K8", "Q2M4K8"],
    correctIndex: 0,
    speed: {},
  },

  // ---------------- ROUND 4 — VERY HARD (IDs 19-24) ----------------
  {
    id: 19,
    domain: "LOGICAL",
    difficulty: "VERY_HARD",
    prompt:
      "Eight people A, B, C, D, E, F, G, and H stand in positions 1 to 8. A is somewhere before D; B is immediately before E; C is immediately after F; G is somewhere after D; H is somewhere before B; there are exactly two people between A and F; D is immediately before H. Who must occupy position 4?",
    choices: ["B", "D", "F", "H"],
    correctIndex: 2,
  },
  {
    id: 20,
    domain: "NUMERICAL",
    difficulty: "VERY_HARD",
    prompt: "What number comes next? 2, 6, 15, 31, 56, 92, ?",
    choices: ["127", "134", "141", "148"],
    correctIndex: 2,
  },
  {
    id: 21,
    domain: "PATTERN",
    difficulty: "VERY_HARD",
    prompt:
      "In this grid, each row and each column contains every symbol exactly once. Row 1: ▲ ● ■ ◆. Row 2: ■ ◆ ▲ ●. Row 3: ● ▲ ◆ ■. Row 4: ◆ ■ ● ?. Find the missing symbol.",
    choices: ["▲", "●", "■", "◆"],
    correctIndex: 0,
  },
  {
    id: 22,
    domain: "SPATIAL",
    difficulty: "VERY_HARD",
    prompt:
      "A square contains a black dot in its upper-left corner. The square is rotated 90° clockwise, then 180° counterclockwise, then 180° clockwise, then 90° clockwise. Relative to the square's final orientation, where is the dot?",
    choices: ["Upper-left", "Upper-right", "Lower-left", "Lower-right"],
    correctIndex: 3,
  },
  {
    id: 23,
    domain: "MEMORY",
    difficulty: "VERY_HARD",
    prompt: "Which shape was associated with the number 9?",
    choices: ["Triangle", "Circle", "Star", "Diamond"],
    correctIndex: 2,
    memory: {
      recallType: "MULTI_ATTRIBUTE",
      studyItems: [
        { color: "Red", number: "7", shape: "Triangle" },
        { color: "Blue", number: "2", shape: "Circle" },
        { color: "Green", number: "9", shape: "Star" },
        { color: "Yellow", number: "4", shape: "Diamond" },
      ],
      studyDurationMs: 10000,
    },
  },
  {
    id: 24,
    domain: "SPEED",
    difficulty: "VERY_HARD",
    prompt: "The target code is 7KQ29M. Which option differs from the target by exactly one character?",
    choices: ["7KQ29N", "7KQ39N", "7KQ92M", "7K29QM"],
    correctIndex: 0,
    speed: {},
  },

  // ---------------- ROUND 5 — EXTREME (IDs 25-30) ----------------
  {
    id: 25,
    domain: "LOGICAL",
    difficulty: "EXTREME",
    prompt:
      "Eight people A, B, C, D, E, F, G, and H stand in positions 1 to 8. A is immediately before B; C is immediately before D; E is somewhere before F; G is immediately before H; B is somewhere before E; D is somewhere after F; there are exactly two people between B and C; A is not in position 1. Which person must occupy position 5?",
    choices: ["B", "C", "E", "F"],
    correctIndex: 2,
  },
  {
    id: 26,
    domain: "NUMERICAL",
    difficulty: "EXTREME",
    prompt: "What number comes next? 2, 5, 12, 27, 58, 121, ?",
    choices: ["244", "248", "250", "252"],
    correctIndex: 1,
  },
  {
    id: 27,
    domain: "PATTERN",
    difficulty: "EXTREME",
    prompt:
      "Each row follows its own multiplication pattern. Row 1: 2 → 6 → 18 → 54. Row 2: 3 → 12 → 48 → 192. Row 3: 4 → 20 → 100 → 500. Row 4: 5 → 30 → 180 → ?",
    choices: ["720", "900", "1080", "1200"],
    correctIndex: 2,
  },
  {
    id: 28,
    domain: "SPATIAL",
    difficulty: "EXTREME",
    prompt:
      "A cube has six faces: Red opposite Blue, Green opposite Yellow, White opposite Black. Initially Red is on top, Green is in front, and White is on the right. The cube is rotated so that White becomes the top and Green remains the front. Which color must now be on the bottom?",
    choices: ["Red", "Blue", "Yellow", "Black"],
    correctIndex: 3,
  },
  {
    id: 29,
    domain: "MEMORY",
    difficulty: "EXTREME",
    prompt: "Which symbol was directly to the right of the number 2?",
    choices: ["▲", "●", "○", "■"],
    correctIndex: 0,
    memory: {
      recallType: "POSITIONAL",
      studyItems: [
        ["5", "◆", "2", "▲"],
        ["9", "●", "4", "■"],
        ["7", "○", "1", "★"],
      ],
      studyDurationMs: 12000,
      // 8-second interference step per spec — exact filler text wasn't
      // specified in the source material, so a neutral distraction task
      // is used here. Edit freely; it does not affect scoring.
      interference: { prompt: "Quick distraction: what is 9 minus 4?", durationMs: 8000 },
    },
  },
  {
    id: 30,
    domain: "SPEED",
    difficulty: "EXTREME",
    prompt: "The target code is R7K29PX4. Which option is completely identical to the target?",
    choices: ["R7K29PX4", "R7K29XP4", "R7K92PX4", "R7K29PX7"],
    correctIndex: 0,
    speed: {},
  },
];
