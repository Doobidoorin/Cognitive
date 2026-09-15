import { prisma } from "./db";

export async function getRankAndPercentile(
  overallScore: number
): Promise<{ rank: number; percentile: number; totalParticipants: number }> {
  const totalParticipants = await prisma.assessmentResult.count();
  if (totalParticipants === 0) {
    return { rank: 1, percentile: 100, totalParticipants: 1 };
  }
  // Rank = 1 + number of results strictly better than this one.
  const better = await prisma.assessmentResult.count({
    where: { overallScore: { gt: overallScore } },
  });
  const rank = better + 1;
  const percentile = Math.round(((totalParticipants - rank + 1) / totalParticipants) * 1000) / 10;
  return { rank, percentile, totalParticipants };
}
