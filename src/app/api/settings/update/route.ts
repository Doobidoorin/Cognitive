import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSession,
  hashPassword,
  isValidPassword,
  isValidUsername,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_PFP_DATA_URL_LENGTH = 250_000; // ~180KB image, generous for a small avatar
const PRESET_PFP_REGEX = /^preset:[a-z0-9-]{1,40}$/;

function isValidPfp(pfp: string): boolean {
  if (PRESET_PFP_REGEX.test(pfp)) return true;
  if (pfp.startsWith("data:image/") && pfp.length <= MAX_PFP_DATA_URL_LENGTH) return true;
  return false;
}

interface UpdateBody {
  newUsername?: string;
  currentPassword?: string;
  newPassword?: string;
  pfp?: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: UpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const updates: { username?: string; passwordHash?: string; pfp?: string } = {};
  const changedUsername = { to: user.username };

  // --- Username change ---
  if (body.newUsername !== undefined && body.newUsername.trim() !== user.username) {
    const newUsername = body.newUsername.trim();
    if (!isValidUsername(newUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters: letters, numbers, and underscores only." },
        { status: 400 }
      );
    }
    const clash = await prisma.user.findUnique({ where: { username: newUsername } });
    if (clash && clash.id !== user.id) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    updates.username = newUsername;
    changedUsername.to = newUsername;
  }

  // --- Password change (requires current password) ---
  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
    }
    const ok = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
    if (!isValidPassword(body.newPassword)) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }
    updates.passwordHash = await hashPassword(body.newPassword);
  }

  // --- PFP change ---
  if (body.pfp !== undefined) {
    if (!isValidPfp(body.pfp)) {
      return NextResponse.json({ error: "Invalid profile picture." }, { status: 400 });
    }
    updates.pfp = body.pfp;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: updates });

  // Username/pfp are referenced by leaderboards & public profile lookups
  // via the User table directly, so no denormalized copies need fixing up.
  // The session cookie DOES embed the username though, so refresh it if
  // that's what changed, or future requests would carry a stale value.
  if (updates.username) {
    const token = await createSessionToken({ userId: updated.id, username: updated.username });
    await setSessionCookie(token);
  }

  return NextResponse.json({ id: updated.id, username: updated.username, pfp: updated.pfp });
}
