import { foodDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FIELDS = new Set([
  "first_name",
  "last_name",
  "email",
  "phone",
  "country",
  "vehicle_make",
  "vehicle_model",
  "vehicle_year",
  "vehicle_color",
  "license_plate",
  "terms_accepted",
  "persona_completed",
  "drivers_license_persona_completed",
  "background_check_unlocked",
  "background_check_status",
  "onboarding_status",
  "email_verified",
  "phone_verified",
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(k)) update[k] = v;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "no valid fields" }, { status: 400 });
    }
    await foodDb.collection("drivers").doc(id).update(update);
    return NextResponse.json({ success: true, updated: Object.keys(update) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
