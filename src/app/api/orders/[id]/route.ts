import { foodDb } from "@/lib/firebase-admin";
import { pndApi } from "@/lib/pickndrop-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const snap = await foodDb.collection("orders").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const d = snap.data()!;
    return NextResponse.json({
      id: snap.id,
      status_history: d.status_history ?? [],
      receipt_url: d.receipt_url ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const res = await fetch(`${pndApi}/api/admin/food/orders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
