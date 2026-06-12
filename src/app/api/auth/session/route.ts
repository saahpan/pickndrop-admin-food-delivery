import { type NextRequest, NextResponse } from "next/server";

import { adminAuth } from "@/lib/firebase-admin";

const ALLOWED_EMAILS = ["automation@pickndropapp.com", "atul@pickndropapp.com"];
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const idToken = body?.idToken as string | undefined;

  if (!idToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (!ALLOWED_EMAILS.includes(decoded.email ?? "")) {
      return NextResponse.json({ error: "Unauthorized email" }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
