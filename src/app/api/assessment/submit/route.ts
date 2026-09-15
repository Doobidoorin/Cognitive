import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrderedQuestions } from "@/lib/questions";
import {
  classify,
  computeDifficultyAggregates,
  computeDomainAggregates,
  computeOverallScore,
  determineTypeOfSmart,
  scoreAnswers,
} from "@/lib/scoring";
import { buildReport } from "@/lib/report";
import { SubmittedAnswer } from "@/lib/types";

interface SubmitBody {
  answers: SubmittedAnswer[];
  tabSwitchCount?: number;
  suspiciousActivityNote?: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // ---- One-attempt enforcement, source of truth = database ----
  // We check first for a fast, friendly error message, but the *real*
  // guarantee is the unique constraint on AssessmentResult.userId caught
  // below — that's what protects against race conditions from double
  // submits (e.g. a duplicated network request).
  const existing = await prisma.assessmentResult.findUnique({ where: { userId: session.userId } });
  if (existing) {
    return NextResponse.json({ error: "You have already completed the assessment." }, { status: 409 });
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const questions = getOrderedQuestions();

  if (!Array.isArray(body.answers) || body.answers.length !== questions.length) {
    return NextResponse.json(
      { error: `Expected exactly ${questions.length} answers.` },
      { status: 400 }
    );
  }

  const questionIds = new Set(questions.map((q) => q.id));
  for (const a of body.answers) {
    if (
      typeof a.questionId !== "number" ||
      !questionIds.has(a.questionId) ||
      typeof a.choiceIndex !== "number" ||
      typeof a.timeMs !== "number" ||
      !Number.isFinite(a.timeMs)
    ) {
      return NextResponse.json({ error: "Malformed answer payload." }, { status: 400 });
    }
  }
  const submittedIds = new Set(body.answers.map((a) => a.questionId));
  if (submittedIds.size !== questions.length) {
    return NextResponse.json({ error: "Duplicate or missing question answers." }, { status: 400 });
  }

  // ---- Score entirely server-side using the full (answer-bearing) bank ----
  const scored = scoreAnswers(questions, body.answers);
  const domainAggregates = computeDomainAggregates(scored);
  const difficultyAggregates = computeDifficultyAggregates(scored);
  const overallScore = computeOverallScore(scored);
  const { label: classification, title } = classify(overallScore);
  const typeOfSmart = determineTypeOfSmart(domainAggregates);

  const correctCount = scored.filter((s) => s.correct).length;
  const overallAccuracy = Math.round((correctCount / scored.length) * 1000) / 10;
  const times = scored.map((s) => s.timeMs);
  const avgResponseTimeMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const fastestResponseMs = Math.min(...times);
  const slowestResponseMs = Math.max(...times);

  const domainScoresJson: Record<string, number> = {};
  const domainPercentagesJson: Record<string, number> = {};
  const domainRawCorrectJson: Record<string, number> = {};
  for (const [domain, agg] of Object.entries(domainAggregates)) {
    domainScoresJson[domain] = agg.scaledScore;
    domainPercentagesJson[domain] = agg.percentage;
    domainRawCorrectJson[domain] = agg.correct;
  }

  const tabSwitchCount =
    typeof body.tabSwitchCount === "number" && Number.isFinite(body.tabSwitchCount)
      ? Math.max(0, Math.round(body.tabSwitchCount))
      : 0;

  try {
    const created = await prisma.assessmentResult.create({
      data: {
        userId: session.userId,
        overallScore,
        classification,
        title,
        typeOfSmart,
        domainScores: JSON.stringify(domainScoresJson),
        domainPercentages: JSON.stringify(domainPercentagesJson),
        domainRawCorrect: JSON.stringify(domainRawCorrectJson),
        overallAccuracy,
        avgResponseTimeMs,
        fastestResponseMs,
        slowestResponseMs,
        performanceByDifficulty: JSON.stringify(difficultyAggregates),
        rawAnswers: JSON.stringify(scored),
        tabSwitchCount,
        suspiciousActivityNote: body.suspiciousActivityNote?.slice(0, 500) ?? null,
      },
    });

    const report = await buildReport(created);
    return NextResponse.json({ report });
  } catch (err) {
    // P2002 = unique constraint violation on userId: someone else's
    // concurrent request already created a result for this user.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "You have already completed the assessment." }, { status: 409 });
    }
    console.error("Assessment submit failed:", err);
    return NextResponse.json({ error: "Something went wrong saving your result." }, { status: 500 });
  }
}
