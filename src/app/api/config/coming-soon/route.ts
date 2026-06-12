import { foodDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

const DOC = () => foodDb.collection("config").doc("coming_soon_food");

export async function GET() {
  try {
    const snap = await DOC().get();
    if (!snap.exists) {
      return NextResponse.json({
        enabled: false,
        title: "Coming Soon to Your Region",
        subtitle: "We're working hard to bring Pick N Drop Food to your area. Stay tuned!",
      });
    }
    return NextResponse.json(snap.data());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enabled, title, subtitle } = body;
    await DOC().set({ enabled: !!enabled, title: title || "", subtitle: subtitle || "" }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
