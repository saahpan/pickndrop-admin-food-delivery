import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.PICKNDROP_API_BASE_URL || "http://localhost:3000";

export async function GET() {
  try {
    const res = await fetch(`${BASE}/api/admin/pricing/compliance`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Pricing API unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BASE}/api/admin/pricing/compliance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Pricing API unavailable" }, { status: 503 });
  }
}
