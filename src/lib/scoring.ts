import {
  DIFFICULTIES,
  DIFFICULTY_WEIGHT,
  DOMAINS,
  Difficulty,
  Domain,
  DomainAggregate,
  Question,
  SubmittedAnswer,
} from "./types";

/**
 * ============================================================
 * Scoring architecture
 * ============================================================
 * Every constant in this section is intentionally isolated so the
 * formula can be re-tuned later without touching the surrounding
 * application code (spec §13).
 *
 * Per correct answer:
 *   points = DIFFICULTY_WEIGHT[difficulty] * speedFactor
 *
 * speedFactor rewards reasonable speed and penalizes very slow
 * answers, but is capped so it can never let a fast guesser beat
 * someone who is actually solving hard problems correctly — a
 * correct EXTREME answer is worth ~4.5x a correct EASY answer
 * before speed is even considered, while speed alone can only
 * swing an individual question's value by +/-15%.
 * ============================================================
 */

// Rough expected "comfortable" solve time per difficulty tier, in ms.
// Used only to compute the speed factor — never a hard limit.
const EXPECTED_TIME_MS: Record<Difficulty, number> = {
  EASY: 8000,
  MEDIUM: 15000,
  HARD: 25000,
  VERY_HARD: 40000,
  EXTREME: 60000,
};

// Processing Speed questions are about rapid correct decisions, so they
// use a much tighter expected-time baseline than the reasoning domains.
const SPEED_DOMAIN_EXPECTED_TIME_MS: Record<Difficulty, number> = {
  EASY: 2000,
  MEDIUM: 1700,
  HARD: 1400,
  VERY_HARD: 1100,
  EXTREME: 900,
};

const SPEED_FACTOR_MIN = 0.85;
const SPEED_FACTOR_MAX = 1.15;
const SPEED_INFLUENCE = 0.15; // how much of the +/-15% band a full swing uses

// Clamp raw client-reported times to a sane window so a manipulated/garbage
// timestamp can't blow up or zero out the speed factor. This is a sanity
// bound, not a security guarantee — see spec §23/§24 notes in README.
const MIN_PLAUSIBLE_TIME_MS = 150;
const MAX_PLAUSIBLE_TIME_MS = 5 * 60 * 1000;

function computeSpeedFactor(domain: Domain, difficulty: Difficulty, timeMs: number): number {
  const clamped = Math.min(Math.max(timeMs, MIN_PLAUSIBLE_TIME_MS), MAX_PLAUSIBLE_TIME_MS);
  const expected =
    domain === "SPEED" ? SPEED_DOMAIN_EXPECTED_TIME_MS[difficulty] : EXPECTED_TIME_MS[difficulty];
  const influence = domain === "SPEED" ? SPEED_INFLUENCE * 1.6 : SPEED_INFLUENCE;

  const ratio = (expected - clamped) / expected; // positive = faster than expected
  const factor = 1 + ratio * influence;
  return Math.min(Math.max(factor, SPEED_FACTOR_MIN), SPEED_FACTOR_MAX);
}

// Sum of DIFFICULTY_WEIGHT across all 5 tiers, x 6 domains — the raw
// weighted total if every question were answered correctly at a neutral
// (factor = 1) speed. Used to normalize the raw score onto 0-1 before
// mapping to the IQ-style scale.
const MAX_RAW_SCORE = DIFFICULTIES.reduce((sum, d) => sum + DIFFICULTY_WEIGHT[d], 0) * DOMAINS.length;

// IQ-scale mapping. Deliberately a simple linear map from the normalized
// raw score so it stays easy to re-tune; see README for how to adjust.
const IQ_SCALE_MIN = 40;
const IQ_SCALE_MAX = 160;

export interface ScoredAnswer {
  questionId: number;
  domain: Domain;
  difficulty: Difficulty;
  correct: boolean;
  timeMs: number;
  points: number;
}

export function scoreAnswers(questions: Question[], answers: SubmittedAnswer[]): ScoredAnswer[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return answers.map((a) => {
    const q = byId.get(a.questionId);
    if (!q) {
      return { questionId: a.questionId, domain: "LOGICAL", difficulty: "EASY", correct: false, timeMs: a.timeMs, points: 0 };
    }
    const correct = a.choiceIndex === q.correctIndex;
    const points = correct ? DIFFICULTY_WEIGHT[q.difficulty] * computeSpeedFactor(q.domain, q.difficulty, a.timeMs) : 0;
    return { questionId: q.id, domain: q.domain, difficulty: q.difficulty, correct, timeMs: a.timeMs, points };
  });
}

export function computeDomainAggregates(scored: ScoredAnswer[]): Record<Domain, DomainAggregate> {
  const result = {} as Record<Domain, DomainAggregate>;
  for (const domain of DOMAINS) {
    const inDomain = scored.filter((s) => s.domain === domain);
    const correct = inDomain.filter((s) => s.correct).length;
    const total = inDomain.length;
    const maxDomainRaw = DIFFICULTIES.reduce((sum, d) => sum + DIFFICULTY_WEIGHT[d], 0);
    const rawPoints = inDomain.reduce((sum, s) => sum + s.points, 0);
    result[domain] = {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 1000) / 10 : 0,
      scaledScore: maxDomainRaw > 0 ? Math.round((rawPoints / maxDomainRaw) * 1000) / 10 : 0,
    };
  }
  return result;
}

export function computeOverallScore(scored: ScoredAnswer[]): number {
  const raw = scored.reduce((sum, s) => sum + s.points, 0);
  const normalized = Math.min(Math.max(raw / MAX_RAW_SCORE, 0), 1.15); // small headroom for speed bonuses
  const iq = IQ_SCALE_MIN + normalized * (IQ_SCALE_MAX - IQ_SCALE_MIN);
  return Math.round(Math.min(Math.max(iq, IQ_SCALE_MIN), IQ_SCALE_MAX));
}

export interface Classification {
  label: string;
  title: string;
}

// Exact ranges/labels/titles per spec §14 and §15 — keep in sync if the
// spec ever changes; both tables are intentionally right next to each
// other so they can't drift apart.
export function classify(score: number): Classification {
  if (score < 85) return { label: "Below Average", title: "The Learner" };
  if (score <= 105) return { label: "Average", title: "The Thinker" };
  if (score <= 114) return { label: "Above Average", title: "The Analyst" };
  if (score <= 129) return { label: "High", title: "The Strategist" };
  if (score <= 144) return { label: "Very High", title: "The Visionary" };
  return { label: "Exceptional / Genius", title: "The Polymath" };
}

// Short nouns used to build hybrid "Type of Smart" names, e.g.
// "Pattern–Spatial Mind". Kept separate from DOMAIN_LABELS so the
// two naming systems (technical domain names vs. flavor names) can
// evolve independently.
const TYPE_SHORT_NAME: Record<Domain, string> = {
  LOGICAL: "Logical",
  NUMERICAL: "Quantitative",
  PATTERN: "Pattern",
  SPATIAL: "Spatial",
  MEMORY: "Memory",
  SPEED: "Quick",
};

const TYPE_SINGLE_NAME: Record<Domain, string> = {
  LOGICAL: "The Logical Mind",
  NUMERICAL: "The Quantitative Mind",
  PATTERN: "The Pattern Mind",
  SPATIAL: "The Visual Mind",
  MEMORY: "The Memory Mind",
  SPEED: "The Quick Mind",
};

// How close (in scaled 0-100 domain score) the top two domains need to be
// to produce a hybrid "Type of Smart" instead of a single one. Easy to
// retune — widen for more hybrids, narrow for more single types.
const HYBRID_THRESHOLD = 6;

export function determineTypeOfSmart(domainScores: Record<Domain, DomainAggregate>): string {
  const ranked = [...DOMAINS].sort(
    (a, b) => domainScores[b].scaledScore - domainScores[a].scaledScore
  );
  const [first, second] = ranked;
  const gap = domainScores[first].scaledScore - domainScores[second].scaledScore;

  if (gap <= HYBRID_THRESHOLD) {
    return `${TYPE_SHORT_NAME[first]}–${TYPE_SHORT_NAME[second]} Mind`;
  }
  return TYPE_SINGLE_NAME[first];
}

export function computeDifficultyAggregates(scored: ScoredAnswer[]) {
  const result = {} as Record<Difficulty, { correct: number; total: number; avgTimeMs: number }>;
  for (const difficulty of DIFFICULTIES) {
    const inTier = scored.filter((s) => s.difficulty === difficulty);
    const correct = inTier.filter((s) => s.correct).length;
    const total = inTier.length;
    const avgTimeMs =
      total > 0 ? Math.round(inTier.reduce((sum, s) => sum + s.timeMs, 0) / total) : 0;
    result[difficulty] = { correct, total, avgTimeMs };
  }
  return result;
}
