import { foodDb } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, title, body, data, targetType, targetId, targetName } = await req.json();
    if (!token || !title || !body) {
      return NextResponse.json({ error: "token, title, and body are required" }, { status: 400 });
    }

    const messaging = getMessaging();
    const messageId = await messaging.send({
      token,
      notification: { title, body },
      data: data || {},
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });

    await foodDb.collection("notification_logs").add({
      target: targetType ?? "specific",
      target_id: targetId ?? null,
      target_name: targetName ?? null,
      title,
      body,
      data: data || {},
      message_ids: [messageId],
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message_id: messageId });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
