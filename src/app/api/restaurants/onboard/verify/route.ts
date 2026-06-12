import { foodDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, otp } = await req.json();
    if (!token || !otp) {
      return NextResponse.json({ error: "token and otp required" }, { status: 400 });
    }

    const ref = foodDb.collection("restaurant_onboard_tokens").doc(token);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    const data = snap.data()!;

    if (data.used) {
      return NextResponse.json({ error: "This onboarding link has already been used" }, { status: 410 });
    }

    const expiresAt = data.expires_at?.toDate ? data.expires_at.toDate() : new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "This link has expired. Please ask your admin to resend the invitation." }, { status: 410 });
    }

    if (data.otp !== String(otp).trim()) {
      return NextResponse.json({ error: "Incorrect verification code" }, { status: 400 });
    }

    return NextResponse.json({ success: true, name: data.name, email: data.email });
  } catch (err) {
    console.error("verify error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
