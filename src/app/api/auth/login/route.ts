import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  const user = await prisma.user.findUnique({ where: { username } });
  // Deliberately identical error for "no such user" and "wrong password"
  // so login can't be used to enumerate valid usernames.
  const invalid = () => NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });

  if (!user) return invalid();
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return invalid();

  const token = await createSessionToken({ userId: user.id, username: user.username });
  await setSessionCookie(token);

  return NextResponse.json({ id: user.id, username: user.username, pfp: user.pfp });
}
