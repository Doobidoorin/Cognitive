import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildReport } from "@/lib/report";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const result = await prisma.assessmentResult.findUnique({ where: { userId: session.userId } });

  if (!result) return NextResponse.json({ completed: false });

  const report = await buildReport(result);
  return NextResponse.json({ completed: true, report });
}
