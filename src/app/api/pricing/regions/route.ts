import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  host:     process.env.PRICING_DB_HOST,
  port:     Number(process.env.PRICING_DB_PORT ?? 5432),
  database: process.env.PRICING_DB_NAME,
  user:     process.env.PRICING_DB_USER,
  password: process.env.PRICING_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT region_id AS id, region_name, country_code AS country, base_price,
              commission_rate, surge_cap
       FROM regions_config
       ORDER BY country_code ASC, region_id ASC`
    );
    return NextResponse.json({ regions: rows });
  } catch (err) {
    console.error("[pricing/regions] GET error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, commission_rate, surge_cap, base_price } = await req.json();
    if (!id || commission_rate == null || surge_cap == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const cr = Math.min(Math.max(Number(commission_rate), 0), 0.99);
    const sc = Math.min(Math.max(Number(surge_cap), 1.0), 5.0);
    const bp = Math.max(Number(base_price ?? 0), 0);
    await pool.query(
      `UPDATE regions_config SET commission_rate = $1, surge_cap = $2, base_price = $3 WHERE region_id = $4`,
      [cr, sc, bp, id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pricing/regions] PATCH error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
