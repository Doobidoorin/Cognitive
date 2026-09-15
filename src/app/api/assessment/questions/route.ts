import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrderedPublicQuestions } from "@/lib/questions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Server-side one-attempt guard: don't even hand out questions (or the
  // answer-free version) if this user already has a result on file.
  const existing = await prisma.assessmentResult.findUnique({ where: { userId: session.userId } });
  if (existing) {
    return NextResponse.json({ error: "You have already completed the assessment." }, { status: 409 });
  }

  return NextResponse.json({ questions: getOrderedPublicQuestions() });
}
