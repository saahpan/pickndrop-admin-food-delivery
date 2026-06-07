import { pndApi } from "@/lib/pickndrop-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${pndApi}/api/admin/food/stats`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
