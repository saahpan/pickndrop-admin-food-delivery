import { foodDb } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { target, title, body, data } = await req.json();
    if (!title || !body || !target) {
      return NextResponse.json({ error: "title, body, and target are required" }, { status: 400 });
    }

    const topics: string[] = [];
    if (target === "drivers" || target === "both") topics.push("food_drivers");
    if (target === "riders" || target === "both") topics.push("food_users");

    const messaging = getMessaging();
    const results = await Promise.all(
      topics.map((topic) =>
        messaging.send({
          topic,
          notification: { title, body },
          data: data || {},
          android: { priority: "high" },
          apns: { payload: { aps: { sound: "default" } } },
        }),
      ),
    );

    await foodDb.collection("notification_logs").add({
      target,
      title,
      body,
      data: data || {},
      message_ids: results,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message_ids: results });
  } catch (err) {
    console.error("FCM send error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snap = await foodDb
      .collection("notification_logs")
      .orderBy("sent_at", "desc")
      .limit(50)
      .get();
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
