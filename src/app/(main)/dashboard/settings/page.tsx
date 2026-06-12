"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ComingSoonConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
}

const DEFAULTS: ComingSoonConfig = {
  enabled: false,
  title: "Coming Soon to Your Region",
  subtitle: "We're working hard to bring Pick N Drop Food to your area. Stay tuned!",
};

export default function SettingsPage() {
  const [config, setConfig] = useState<ComingSoonConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/config/coming-soon");
      const data = await res.json();
      setConfig({ ...DEFAULTS, ...data });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/config/coming-soon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, msg: "Settings saved. Both apps will reflect this immediately." });
      } else {
        setResult({ ok: false, msg: data.error || "Save failed." });
      }
    } catch (err) {
      setResult({ ok: false, msg: String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">App Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control app-wide configuration that both the driver and rider apps read in real-time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Coming Soon Screen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Enable toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="text-sm font-semibold">Enable screen</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      When on, both apps show this screen instead of the main app.
                    </p>
                  </div>
                  <div
                    role="switch"
                    aria-checked={config.enabled}
                    onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                      config.enabled ? "bg-cyan-500" : "bg-muted border border-border"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 my-0.5 ${
                        config.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Screen title
                  </label>
                  <Input
                    value={config.title}
                    onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))}
                    placeholder="Coming Soon to Your Region"
                    maxLength={80}
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Subtitle / description
                  </label>
                  <textarea
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    rows={3}
                    value={config.subtitle}
                    onChange={(e) => setConfig((c) => ({ ...c, subtitle: e.target.value }))}
                    placeholder="We're working hard to bring Pick N Drop Food to your area."
                    maxLength={300}
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {config.subtitle.length}/300
                  </p>
                </div>

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
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Settings
                    </span>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Phone preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              App Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="relative w-56">
              {/* Phone frame */}
              <div className="rounded-[2.5rem] border-4 border-border bg-[#0a0a0b] overflow-hidden shadow-2xl">
                <div className="h-6 bg-[#0a0a0b] flex items-center justify-center">
                  <div className="h-1.5 w-16 rounded-full bg-border" />
                </div>
                <div className="flex min-h-[380px] flex-col items-center justify-center gap-6 px-6 py-8">
                  {/* Icon placeholder */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/30">
                    <Smartphone className="h-10 w-10 text-cyan-400" />
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-white leading-snug">
                      {config.title || DEFAULTS.title}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {config.subtitle || DEFAULTS.subtitle}
                    </p>
                  </div>

                  <div className="h-1.5 w-24 rounded-full bg-white/10" />
                </div>
                <div className="h-5 bg-[#0a0a0b] flex items-center justify-center">
                  <div className="h-1.5 w-24 rounded-full bg-border" />
                </div>
              </div>

              {/* Status badge */}
              <div className="absolute -top-3 -right-3">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    config.enabled
                      ? "border-red-500/40 bg-red-500/15 text-red-400"
                      : "border-green-500/40 bg-green-500/15 text-green-400"
                  }`}
                >
                  {config.enabled ? "Screen Active" : "Hidden"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
