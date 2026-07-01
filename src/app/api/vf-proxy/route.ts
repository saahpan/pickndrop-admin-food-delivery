// Proxy for Verified First background-check API.
// Keeps VF credentials server-side; Flutter apps authenticate via their Laravel Bearer token.
//
// POST body: { driverId, firstName, lastName, email, phone }
// Required env vars: VF_AUTH_KEY, VF_PACKAGE_ID, TAXI_API_BASE_URL

import { type NextRequest, NextResponse } from "next/server";

const VF_ENDPOINT = process.env.VF_ENDPOINT ?? "https://testing.api.verifiedfirst.com/external/verified-first";

const TAXI_API_BASE = process.env.TAXI_API_BASE_URL ?? "https://taxiapp.thepickndrop.com/api";

async function verifyLaravelToken(bearerToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${TAXI_API_BASE}/user`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Verify driver's Laravel Bearer token
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7);
  const valid = await verifyLaravelToken(token);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { driverId?: number; firstName?: string; lastName?: string; email?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { driverId, firstName, lastName, email, phone } = body;
  if (!driverId || !firstName || !lastName || !email || !phone) {
    return NextResponse.json(
      { error: "driverId, firstName, lastName, email, and phone are required" },
      { status: 400 },
    );
  }

  // Create VF order — reference_code ties webhook callbacks back to this driver
  let vfOrderId: string | null = null;
  try {
    const vfRes = await fetch(`${VF_ENDPOINT}/order`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.VF_AUTH_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: {
          search_type: "app_invitation",
          package_id: process.env.VF_PACKAGE_ID,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        },
      }),
    });

    if (!vfRes.ok) {
      const errBody = await vfRes.text();
      console.error("[vf-proxy] VF error:", errBody);
      return NextResponse.json({ error: "VF order creation failed" }, { status: 502 });
    }

    const vfData = (await vfRes.json()) as { order?: { order_id?: string } };
    vfOrderId = vfData?.order?.order_id ?? null;
  } catch (err) {
    console.error("[vf-proxy] fetch error:", err);
    return NextResponse.json({ error: "Network error contacting VF" }, { status: 502 });
  }

  // Persist the order ID in Laravel so the hub can display pending state immediately
  if (vfOrderId) {
    try {
      await fetch(`${TAXI_API_BASE}/driver/save-vf-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vf_order_id: vfOrderId, driver_id: driverId }),
      });
    } catch (err) {
      // Non-fatal — the webhook will update status regardless
      console.warn("[vf-proxy] failed to save order_id to Laravel:", err);
    }
  }

  return NextResponse.json({ ok: true, vf_order_id: vfOrderId });
}
