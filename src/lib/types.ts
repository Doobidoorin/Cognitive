export const DOMAINS = [
  "LOGICAL",
  "NUMERICAL",
  "PATTERN",
  "SPATIAL",
  "MEMORY",
  "SPEED",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  LOGICAL: "Logical Reasoning",
  NUMERICAL: "Numerical Reasoning",
  PATTERN: "Pattern Recognition",
  SPATIAL: "Spatial Reasoning",
  MEMORY: "Memory",
  SPEED: "Processing Speed",
};

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "VERY_HARD", "EXTREME"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  VERY_HARD: "Very Hard",
  EXTREME: "Extreme",
};

// Relative weight of each difficulty tier in the scoring formula.
// Higher tiers are worth substantially more when answered correctly.
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 1.5,
  HARD: 2.25,
  VERY_HARD: 3.25,
  EXTREME: 4.5,
};

/** Recall mechanics supported by the Memory domain's dedicated engine. */
export type MemoryRecallType =
  | "SEQUENCE" // recall an ordered sequence exactly
  | "POSITIONAL" // recall what was in a specific position/location
  | "ITEM_POSITION_ASSOCIATION" // which item went with which slot
  | "SYMBOL_ASSOCIATION" // symbol <-> number/letter pairing
  | "MULTI_ATTRIBUTE" // remember multiple attributes of items at once
  | "DELAYED_RECALL"; // recall after an interference/distraction step

export interface MemoryConfig {
  recallType: MemoryRecallType;
  /** What is shown during the study phase. Shape is free-form per recallType;
   * the assessment renderer switches on recallType to interpret it. */
  studyItems: unknown;
  /** How long (ms) the study phase is shown before it's hidden. */
  studyDurationMs: number;
  /** Optional interference step shown between study and recall
   * (e.g. "solve this while you wait") to increase difficulty. */
  interference?: {
    prompt: string;
    durationMs: number;
  };
}

/** Processing Speed questions are rapid go/no-go style decisions rather
 * than untimed logic questions with a clock bolted on. */
export interface SpeedConfig {
  /** Optional short delay (ms) before the stimulus appears, to prevent
   * pre-emptive clicking. */
  stimulusDelayMs?: number;
}

export interface QuestionAsset {
  type: "image" | "svg-inline";
  src?: string; // path/URL for "image"
  markup?: string; // raw SVG markup for "svg-inline"
  alt: string;
}

/** Full question record — INCLUDES the correct answer. This type must
 * never be sent to the client as-is; see `toPublicQuestion` in
 * lib/questions.ts, which strips the answer key before it leaves the
 * server. */
export interface Question {
  id: number; // 1-30, fixed order per spec
  domain: Domain;
  difficulty: Difficulty;
  prompt: string;
  choices: string[]; // multiple choice, always
  correctIndex: number; // index into `choices`
  asset?: QuestionAsset;
  memory?: MemoryConfig; // only present when domain === "MEMORY"
  speed?: SpeedConfig; // only present when domain === "SPEED"
}

/** Sanitized version sent to the client — no correct answer, ever. */
export type PublicQuestion = Omit<Question, "correctIndex">;

export interface SubmittedAnswer {
  questionId: number;
  choiceIndex: number; // -1 if unanswered/timed out client-side
  timeMs: number; // reasoning/response time for this question
}

export interface DomainAggregate {
  correct: number;
  total: number;
  percentage: number;
  scaledScore: number; // 0-100, difficulty & speed weighted
}

export interface DifficultyAggregate {
  correct: number;
  total: number;
  avgTimeMs: number;
}

export interface AssessmentReport {
  overallScore: number; // IQ-style score
  classification: string;
  title: string;
  typeOfSmart: string;
  domainScores: Record<Domain, number>;
  domainPercentages: Record<Domain, number>;
  domainRawCorrect: Record<Domain, number>;
  overallAccuracy: number;
  avgResponseTimeMs: number;
  fastestResponseMs: number;
  slowestResponseMs: number;
  performanceByDifficulty: Record<Difficulty, DifficultyAggregate>;
  rank: number | null;
  percentile: number | null;
  totalParticipants: number;
  completedAt: string;
}
