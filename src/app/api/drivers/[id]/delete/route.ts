import { adminAuth, foodDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await foodDb.collection("drivers").doc(id).delete();
    try {
      await adminAuth.deleteUser(id);
    } catch {
      // auth user may not exist — not fatal
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
