import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Domain } from "@/lib/types";

const VALID_DOMAINS: Domain[] = ["LOGICAL", "NUMERICAL", "PATTERN", "SPATIAL", "MEMORY", "SPEED"];

// GET /api/leaderboard?board=overall            -> top by overallScore
// GET /api/leaderboard?board=LOGICAL etc.        -> top by that domain's scaled score
export async function GET(req: NextRequest) {
  const board = (req.nextUrl.searchParams.get("board") ?? "overall").toUpperCase();
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit") ?? 50), 1), 200);

  if (board === "OVERALL") {
    const rows = await prisma.assessmentResult.findMany({
      orderBy: [{ overallScore: "desc" }, { avgResponseTimeMs: "asc" }, { completedAt: "asc" }],
      take: limit,
      include: { user: { select: { username: true, pfp: true } } },
    });
    const entries = rows.map((r, i) => ({
      rank: i + 1,
      username: r.user.username,
      pfp: r.user.pfp,
      score: r.overallScore,
      classification: r.classification,
      title: r.title,
    }));
    return NextResponse.json({ board: "OVERALL", entries });
  }

  if (!VALID_DOMAINS.includes(board as Domain)) {
    return NextResponse.json({ error: "Unknown leaderboard." }, { status: 400 });
  }

  // Domain scores live in a JSON column, so we can't ORDER BY them in SQL
  // portably across SQLite/Postgres — pull a reasonably sized page and
  // sort in JS. Fine at this scale; swap for a materialized column/view
  // if the user base gets large.
  const rows = await prisma.assessmentResult.findMany({
    take: 2000,
    include: { user: { select: { username: true, pfp: true } } },
  });

  const withDomainScore = rows.map((r) => {
    const domainScores = JSON.parse(r.domainScores) as Record<string, number>;
    return {
      username: r.user.username,
      pfp: r.user.pfp,
      score: domainScores[board] ?? 0,
      avgTime: r.avgResponseTimeMs,
    };
  });

  withDomainScore.sort((a, b) => b.score - a.score || a.avgTime - b.avgTime);

  const entries = withDomainScore.slice(0, limit).map((e, i) => ({
    rank: i + 1,
    username: e.username,
    pfp: e.pfp,
    score: e.score,
  }));

  return NextResponse.json({ board, entries });
}
