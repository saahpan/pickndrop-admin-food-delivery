import { pndApi } from "@/lib/pickndrop-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const type = searchParams.get("type") ?? "drivers";
    const res = await fetch(
      `${pndApi}/api/admin/food/notifications/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
