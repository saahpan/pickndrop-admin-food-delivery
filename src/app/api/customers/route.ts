import { pndApi } from "@/lib/pickndrop-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${pndApi}/api/admin/food/users`, { cache: "no-store" });
    const data = await res.json();
    // Normalize field names
    const customers = (data.users || []).map((u: Record<string, unknown>) => ({
      uid: u.id,
      display_name: u.name,
      email: u.email,
      phone: u.phone,
      provider: u.provider,
      photo_url: u.photo_url,
      email_verified: u.email_verified ?? false,
      disabled: u.disabled,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in,
      last_login_at: u.last_login_at ?? null,
      last_login_method: u.last_login_method ?? null,
    }));
    return NextResponse.json({ customers, total: customers.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
