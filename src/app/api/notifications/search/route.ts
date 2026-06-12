import { foodDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase().trim() ?? "";
  const type = searchParams.get("type") ?? "drivers"; // "drivers" | "users"

  try {
    const snap = await foodDb.collection(type).limit(200).get();
    const results = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((doc: Record<string, unknown>) => {
        if (!doc.fcm_token) return false;
        const full = `${doc.first_name ?? ""} ${doc.last_name ?? ""} ${doc.email ?? ""} ${doc.phone ?? ""}`.toLowerCase();
        return !q || full.includes(q);
      })
      .slice(0, 20)
      .map((doc: Record<string, unknown>) => ({
        uid: doc.id ?? doc.uid,
        name: `${doc.first_name ?? ""} ${doc.last_name ?? ""}`.trim() || (doc.email as string) || String(doc.uid),
        email: doc.email,
        fcm_token: doc.fcm_token,
      }));

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
