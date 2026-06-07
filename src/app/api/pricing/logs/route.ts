import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.PICKNDROP_API_BASE_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qs = searchParams.toString();
    const res = await fetch(`${BASE}/api/admin/pricing/logs${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Pricing API unavailable" }, { status: 503 });
  }
}
