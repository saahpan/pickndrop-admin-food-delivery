import { foodDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const snap = await foodDb.collection("restaurants").doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const data = snap.data()!;
    return NextResponse.json({
      id: snap.id,
      ...data,
      onboarded_at: data.onboarded_at?.toDate?.()?.toISOString() ?? null,
      created_at: data.created_at?.toDate?.()?.toISOString() ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
