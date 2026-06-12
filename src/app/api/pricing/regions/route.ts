import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.PICKNDROP_API_BASE_URL || "https://thepickndrop.us";

export async function GET() {
  try {
    const res = await fetch(`${BASE}/api/admin/pricing/regions`, { cache: "no-store" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Pricing API error" }));
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    // Normalize upstream field names (region_id → id, country_name → country)
    const raw: Record<string, unknown>[] = data.regions ?? data ?? [];
    const regions = raw.map((r) => ({
      id: r.region_id ?? r.id,
      region_name: r.region_name ?? r.name,
      country: r.country_name ?? r.country_code ?? r.country,
      commission_rate: r.commission_rate,
      surge_cap: r.surge_cap,
      base_price: r.base_price,
    }));
    return NextResponse.json({ regions });
  } catch {
    return NextResponse.json({ error: "Pricing API unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    // Map frontend 'id' back to upstream 'region_id'
    const upstream = {
      region_id: body.id,
      commission_rate: body.commission_rate,
      surge_cap: body.surge_cap,
      base_price: body.base_price ?? 0,
    };
    const res = await fetch(`${BASE}/api/admin/pricing/regions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstream),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Pricing API error" }));
      return NextResponse.json(err, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Pricing API unavailable" }, { status: 503 });
  }
}
