import { NextRequest, NextResponse } from "next/server";

const PERSONA_API = "https://withpersona.com/api/v1";
const PERSONA_VERSION = "2023-01-05";

function headers() {
  return {
    Authorization: `Bearer ${process.env.PERSONA_API_KEY}`,
    "Persona-Version": PERSONA_VERSION,
    Accept: "application/json",
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    const res = await fetch(`${PERSONA_API}/inquiries/${id}`, {
      headers: headers(),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Persona API ${res.status}: ${text}` }, { status: res.status });
    }

    const json = await res.json();
    const attr = json?.data?.attributes ?? {};

    return NextResponse.json({
      id,
      status: attr.status ?? null,
      nameFirst: attr["name-first"] ?? null,
      nameMiddle: attr["name-middle"] ?? null,
      nameLast: attr["name-last"] ?? null,
      birthdate: attr.birthdate ?? null,
      createdAt: attr["created-at"] ?? null,
      completedAt: attr["completed-at"] ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
