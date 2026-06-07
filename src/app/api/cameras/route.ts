import { pndApi } from "@/lib/pickndrop-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${pndApi}/api/admin/food/cameras`, { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
