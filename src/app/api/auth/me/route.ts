import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, pfp: true, result: { select: { id: true } } },
  });

  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: { id: user.id, username: user.username, pfp: user.pfp, hasCompletedAssessment: !!user.result },
  });
}
