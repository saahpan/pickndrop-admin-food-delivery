"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface ComplianceRow {
  id: string | number;
  region_name?: string;
  country_code?: string;
  country?: string;
  currency?: string;
  min_wage_hourly?: number;
  driver_hourly_pay?: number;
  per_km_rate?: number;
  per_min_rate?: number;
  tax_notes?: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CA: "🇨🇦", AU: "🇦🇺", GB: "🇬🇧", NZ: "🇳🇿", IN: "🇮🇳",
};

export default function CompliancePage() {
  const [rows, setRows] = useState<ComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string | number, Partial<ComplianceRow>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pricing/compliance");
      if (!res.ok) throw new Error("Pricing API unavailable — make sure PicknDrop app is running on port 3000");
      const data = await res.json();
      setRows(data.rows || data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateDirty(id: string | number, field: keyof ComplianceRow, val: string) {
    setDirty((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: field === "tax_notes" ? val : parseFloat(val) },
    }));
  }

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(dirty).map(([id, changes]) =>
          fetch("/api/pricing/compliance", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...changes }),
          }),
        ),
      );
      setRows((prev) =>
        prev.map((r) => (dirty[r.id] ? { ...r, ...dirty[r.id] } : r)),
      );
      setDirty({});
    } finally {
      setSaving(false);
    }
  }

  const hasDirty = Object.keys(dirty).length > 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Floor Compliance</h1>
          <p className="text-sm text-muted-foreground">
            Minimum wages, driver pay, per-km and per-min rates
          </p>
        </div>
        <div className="flex gap-2">
          {hasDirty && (
            <Button size="sm" disabled={saving} onClick={saveAll}>
              {saving ? "Saving…" : `Save ${Object.keys(dirty).length} Changes`}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          ⚠ {error}
        </div>
      )}

      {hasDirty && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-400">
          {Object.keys(dirty).length} unsaved change{Object.keys(dirty).length !== 1 ? "s" : ""} — click Save to apply
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Region", "Country", "Currency", "Min Wage/hr", "Driver Pay/hr", "Per km", "Per min", "Tax Notes"].map(
                    (h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/40">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-3 py-2.5">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.map((r) => {
                      const isDirty = !!dirty[r.id];
                      const cc = (r.country_code || r.country || "").toUpperCase();
                      const val = (field: keyof ComplianceRow) =>
                        dirty[r.id]?.[field] !== undefined
                          ? String(dirty[r.id][field])
                          : String(r[field] ?? "");

                      return (
                        <tr
                          key={r.id}
                          className={`border-b border-border/40 transition-colors ${isDirty ? "bg-cyan-500/5" : "hover:bg-muted/20"}`}
                        >
                          <td className="px-3 py-2.5 font-medium text-xs">{r.region_name || "—"}</td>
                          <td className="px-3 py-2.5">
                            <span className="flex items-center gap-1.5 text-xs">
                              <span>{COUNTRY_FLAGS[cc] || "🌐"}</span>
                              <span className="text-muted-foreground">{cc}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.currency || "—"}</td>
                          <td className="px-3 py-2.5">
                            <Input
                              className={`h-7 w-20 text-xs font-mono ${isDirty && dirty[r.id]?.min_wage_hourly !== undefined ? "border-cyan-500/50" : ""}`}
                              value={val("min_wage_hourly")}
                              onChange={(e) => updateDirty(r.id, "min_wage_hourly", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              className={`h-7 w-20 text-xs font-mono ${isDirty && dirty[r.id]?.driver_hourly_pay !== undefined ? "border-cyan-500/50" : ""}`}
                              value={val("driver_hourly_pay")}
                              onChange={(e) => updateDirty(r.id, "driver_hourly_pay", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              className={`h-7 w-20 text-xs font-mono ${isDirty && dirty[r.id]?.per_km_rate !== undefined ? "border-cyan-500/50" : ""}`}
                              value={val("per_km_rate")}
                              onChange={(e) => updateDirty(r.id, "per_km_rate", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              className={`h-7 w-20 text-xs font-mono ${isDirty && dirty[r.id]?.per_min_rate !== undefined ? "border-cyan-500/50" : ""}`}
                              value={val("per_min_rate")}
                              onChange={(e) => updateDirty(r.id, "per_min_rate", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              className={`h-7 w-40 text-xs ${isDirty && dirty[r.id]?.tax_notes !== undefined ? "border-cyan-500/50" : ""}`}
                              value={val("tax_notes")}
                              onChange={(e) => updateDirty(r.id, "tax_notes", e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                {!loading && rows.length === 0 && !error && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Scale className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No compliance data</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
