import { foodDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

async function uploadBase64Image(
  base64: string,
  mimeType: string,
  path: string,
): Promise<string> {
  const bucket = getStorage().bucket();
  const buffer = Buffer.from(base64, "base64");
  const file = bucket.file(path);
  await file.save(buffer, { metadata: { contentType: mimeType }, resumable: false });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, info, menu_items, logo, cover_image } = body as {
      token: string;
      info: {
        name: string;
        email: string;
        phone: string;
        address: string;
        description: string;
        cuisine_types: string[];
        delivery_fee: number;
        min_order: number;
        delivery_time: string;
        opening_hours: Record<string, { open: string; close: string }>;
      };
      menu_items: Array<{
        name: string;
        description: string;
        price: number;
        category: string;
        available: boolean;
      }>;
      logo?: { base64: string; mimeType: string } | null;
      cover_image?: { base64: string; mimeType: string } | null;
    };

    if (!token || !info?.name || !info?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify token
    const tokenRef = foodDb.collection("restaurant_onboard_tokens").doc(token);
    const tokenSnap = await tokenRef.get();
    if (!tokenSnap.exists || tokenSnap.data()!.used) {
      return NextResponse.json({ error: "Invalid or already used token" }, { status: 410 });
    }
    const tokenData = tokenSnap.data()!;
    const expiresAt = tokenData.expires_at?.toDate ? tokenData.expires_at.toDate() : new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 410 });
    }

    const restaurantId = foodDb.collection("restaurants").doc().id;
    let logoUrl: string | null = null;
    let coverUrl: string | null = null;

    if (logo?.base64) {
      logoUrl = await uploadBase64Image(
        logo.base64,
        logo.mimeType,
        `restaurants/${restaurantId}/logo.jpg`,
      );
    }
    if (cover_image?.base64) {
      coverUrl = await uploadBase64Image(
        cover_image.base64,
        cover_image.mimeType,
        `restaurants/${restaurantId}/cover.jpg`,
      );
    }

    await foodDb.collection("restaurants").doc(restaurantId).set({
      name: info.name.trim(),
      email: info.email.trim().toLowerCase(),
      phone: info.phone?.trim() ?? "",
      address: info.address?.trim() ?? "",
      description: info.description?.trim() ?? "",
      cuisine_types: info.cuisine_types ?? [],
      delivery_fee: Number(info.delivery_fee) || 0,
      min_order: Number(info.min_order) || 0,
      delivery_time: info.delivery_time?.trim() ?? "30-45 min",
      opening_hours: info.opening_hours ?? {},
      logo_url: logoUrl,
      cover_image_url: coverUrl,
      menu_items: (menu_items ?? []).map((item, i) => ({
        id: `item_${i}_${Date.now()}`,
        name: item.name?.trim() ?? "",
        description: item.description?.trim() ?? "",
        price: Number(item.price) || 0,
        category: item.category?.trim() ?? "Main",
        available: item.available !== false,
      })),
      rating: 0,
      review_count: "0",
      is_open: false,
      onboarded: true,
      onboarded_at: FieldValue.serverTimestamp(),
      created_at: FieldValue.serverTimestamp(),
    });

    await tokenRef.update({ used: true, restaurant_id: restaurantId });

    return NextResponse.json({ success: true, id: restaurantId });
  } catch (err) {
    console.error("submit error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
