import { AssessmentResult } from "@prisma/client";
import { AssessmentReport, Difficulty, Domain } from "./types";
import { getRankAndPercentile } from "./ranking";

/** Converts a raw DB row (with JSON-stringified columns) into the
 * aggregate-only report shape that's safe to send to clients. This
 * NEVER includes `rawAnswers` — question-level detail stays server-side
 * forever, per spec §18/§19. */
export async function buildReport(row: AssessmentResult): Promise<AssessmentReport> {
  const { rank, percentile, totalParticipants } = await getRankAndPercentile(row.overallScore);

  return {
    overallScore: row.overallScore,
    classification: row.classification,
    title: row.title,
    typeOfSmart: row.typeOfSmart,
    domainScores: JSON.parse(row.domainScores) as Record<Domain, number>,
    domainPercentages: JSON.parse(row.domainPercentages) as Record<Domain, number>,
    domainRawCorrect: JSON.parse(row.domainRawCorrect) as Record<Domain, number>,
    overallAccuracy: row.overallAccuracy,
    avgResponseTimeMs: row.avgResponseTimeMs,
    fastestResponseMs: row.fastestResponseMs,
    slowestResponseMs: row.slowestResponseMs,
    performanceByDifficulty: JSON.parse(row.performanceByDifficulty) as Record<
      Difficulty,
      { correct: number; total: number; avgTimeMs: number }
    >,
    rank,
    percentile,
    totalParticipants,
    completedAt: row.completedAt.toISOString(),
  };
}
