"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Car,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Target = "drivers" | "riders" | "both";

interface NotifLog {
  id: string;
  target: string;
  title: string;
  body: string;
  sent_at: string;
  message_ids: string[];
}

const TARGET_OPTIONS: { value: Target; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: "drivers",
    label: "Drivers",
    icon: <Car className="h-4 w-4" />,
    desc: "All drivers on the food delivery driver app",
  },
  {
    value: "riders",
    label: "Riders",
    icon: <Users className="h-4 w-4" />,
    desc: "All users on the food delivery rider app",
  },
  {
    value: "both",
    label: "Everyone",
    icon: <Bell className="h-4 w-4" />,
    desc: "Drivers and riders simultaneously",
  },
];

export default function NotificationsPage() {
  const [target, setTarget] = useState<Target>("drivers");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/notifications/send");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      // silent
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => { loadLogs(); }, []);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, msg: `Sent to ${target === "both" ? "drivers & riders" : target} successfully.` });
        setTitle("");
        setBody("");
        loadLogs();
      } else {
        setResult({ ok: false, msg: data.error || "Failed to send." });
      }
    } catch (err) {
      setResult({ ok: false, msg: String(err) });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Push Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send FCM push notifications to the driver app, rider app, or both.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              Compose Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Target selector */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Target audience
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTarget(opt.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                      target === opt.value
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                        : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.icon}
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {TARGET_OPTIONS.find((o) => o.value === target)?.desc}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Notification title
              </label>
              <Input
                placeholder="e.g. New promotion available!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Message body
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                rows={4}
                placeholder="e.g. Earn 2x points on all deliveries this weekend!"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{body.length}/500</p>
            </div>

            {/* Result */}
            {result && (
              <div
                className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                  result.ok
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                {result.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                {result.msg}
              </div>
            )}

            <Button
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sending…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Notification
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-muted/50 border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                  <Bell className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {title || <span className="text-muted-foreground italic">Notification title</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {body || <span className="italic">Message body will appear here…</span>}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">now</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              This is how the notification will appear on{" "}
              {target === "drivers" ? "driver" : target === "riders" ? "rider" : "both"}{" "}
              device{target === "both" ? "s" : ""}.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Recent Notifications
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadLogs} disabled={logsLoading}>
              <RefreshCw className={`h-4 w-4 ${logsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between px-5 py-3 gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        log.target === "drivers"
                          ? "bg-blue-500/15 text-blue-400"
                          : log.target === "riders"
                            ? "bg-purple-500/15 text-purple-400"
                            : "bg-cyan-500/15 text-cyan-400"
                      }`}
                    >
                      {log.target === "drivers" ? "D" : log.target === "riders" ? "R" : "A"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{log.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{log.body}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {log.sent_at ? new Date(log.sent_at).toLocaleString() : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
