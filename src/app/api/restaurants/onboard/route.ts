import { foodDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
  return randomBytes(32).toString("hex");
}

async function sendMailgunEmail(to: string, subject: string, html: string) {
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;
  const from = process.env.MAILGUN_FROM ?? `noreply@${domain}`;

  if (!domain || !apiKey) throw new Error("Mailgun not configured");

  const body = new URLSearchParams({ from, to, subject, html });
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mailgun error ${res.status}: ${text}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }

    const otp = generateOtp();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await foodDb.collection("restaurant_onboard_tokens").doc(token).set({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      otp,
      expires_at: expiresAt,
      used: false,
      created_at: FieldValue.serverTimestamp(),
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.pickndrop.com";
    const link = `${siteUrl}/onboard/restaurant?token=${token}`;

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0b;border-radius:16px;border:1px solid #222">
        <h2 style="color:#00D1FF;margin:0 0 8px">PicknDrop Restaurant Onboarding</h2>
        <p style="color:#ccc;margin:0 0 24px">Hi <strong>${name}</strong>, you've been invited to join PicknDrop as a restaurant partner.</p>
        <p style="color:#aaa;margin:0 0 8px">Your one-time verification code is:</p>
        <div style="background:#141414;border:1px solid #333;border-radius:12px;padding:20px 32px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:900;color:#00D1FF;letter-spacing:8px">${otp}</span>
        </div>
        <p style="color:#aaa;margin:0 0 16px">Or click the link below to open your onboarding form:</p>
        <a href="${link}" style="display:block;background:#00D1FF;color:#000;text-align:center;padding:14px 24px;border-radius:10px;font-weight:700;text-decoration:none;margin-bottom:24px">Start Onboarding</a>
        <p style="color:#555;font-size:12px;margin:0">This link and code expire in 1 hour. If you did not expect this email, you can ignore it.</p>
      </div>
    `;

    await sendMailgunEmail(email.trim(), "PicknDrop – Restaurant Onboarding Invitation", html);

    return NextResponse.json({ success: true, token });
  } catch (err) {
    console.error("onboard error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
