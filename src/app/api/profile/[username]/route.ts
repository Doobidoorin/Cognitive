import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildReport } from "@/lib/report";

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const username = params.username;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { username: true, pfp: true, createdAt: true, result: true },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (!user.result) {
    return NextResponse.json({
      username: user.username,
      pfp: user.pfp,
      hasCompletedAssessment: false,
    });
  }

  // Only aggregate report data is ever returned — buildReport never
  // includes rawAnswers (spec §18/§19/§21/§30).
  const report = await buildReport(user.result);

  return NextResponse.json({
    username: user.username,
    pfp: user.pfp,
    hasCompletedAssessment: true,
    report,
  });
}
