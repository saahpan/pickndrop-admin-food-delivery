"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Region {
  id: string | number;
  region_name?: string;
  name?: string;
  country: string;
  commission_rate?: number;
  commissionRate?: number;
  surge_cap?: number;
  surgeCap?: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CA: "🇨🇦", AU: "🇦🇺", GB: "🇬🇧", NZ: "🇳🇿", IN: "🇮🇳",
};

export default function PricingRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string | number, { commission: string; surge: string }>>({});
  const [saving, setSaving] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pricing/regions");
      if (!res.ok) throw new Error("Pricing API unavailable — make sure PicknDrop app is running on port 3000");
      const data = await res.json();
      setRegions(data.regions || data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load regions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(r: Region) {
    const id = r.id;
    setEditing((prev) => ({
      ...prev,
      [id]: {
        commission: String(r.commission_rate ?? r.commissionRate ?? ""),
        surge: String(r.surge_cap ?? r.surgeCap ?? ""),
      },
    }));
  }

  async function saveEdit(r: Region) {
    setSaving(r.id);
    try {
      await fetch("/api/pricing/regions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: r.id,
          commission_rate: parseFloat(editing[r.id]?.commission || "0"),
          surge_cap: parseFloat(editing[r.id]?.surge || "0"),
        }),
      });
      setRegions((prev) =>
        prev.map((x) =>
          x.id === r.id
            ? {
                ...x,
                commission_rate: parseFloat(editing[r.id]?.commission || "0"),
                surge_cap: parseFloat(editing[r.id]?.surge || "0"),
              }
            : x,
        ),
      );
      setEditing((prev) => { const next = { ...prev }; delete next[r.id]; return next; });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Regions</h1>
          <p className="text-sm text-muted-foreground">
            Commission rates and surge caps per region
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          ⚠ {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Region", "Country", "Commission Rate", "Surge Cap", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/40">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : regions.map((r) => {
                      const isEditing = !!editing[r.id];
                      const country = r.country?.toUpperCase();
                      return (
                        <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{r.region_name || r.name || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5">
                              <span className="text-base">{COUNTRY_FLAGS[country] || "🌐"}</span>
                              <span className="text-muted-foreground">{country}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <Input
                                className="h-7 w-24 text-xs"
                                value={editing[r.id]?.commission}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    [r.id]: { ...prev[r.id], commission: e.target.value },
                                  }))
                                }
                              />
                            ) : (
                              <span className="font-mono">
                                {((r.commission_rate ?? r.commissionRate ?? 0) * 100).toFixed(1)}%
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <Input
                                className="h-7 w-24 text-xs"
                                value={editing[r.id]?.surge}
                                onChange={(e) =>
                                  setEditing((prev) => ({
                                    ...prev,
                                    [r.id]: { ...prev[r.id], surge: e.target.value },
                                  }))
                                }
                              />
                            ) : (
                              <span className="font-mono">
                                {(r.surge_cap ?? r.surgeCap ?? 0).toFixed(1)}×
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={saving === r.id}
                                  onClick={() => saveEdit(r)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    setEditing((prev) => { const next = { ...prev }; delete next[r.id]; return next; })
                                  }
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => startEdit(r)}
                              >
                                Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                {!loading && regions.length === 0 && !error && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Globe className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No regions found</p>
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
