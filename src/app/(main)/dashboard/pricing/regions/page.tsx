"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Globe, Map } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";

interface Region {
  id: string | number;
  region_name?: string;
  name?: string;
  country: string;
  commission_rate?: number;
  commissionRate?: number;
  surge_cap?: number;
  surgeCap?: number;
  base_price?: number;
}

interface GeoPoint { lat: number; lng: number }

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CA: "🇨🇦", AU: "🇦🇺", GB: "🇬🇧", NZ: "🇳🇿", IN: "🇮🇳",
};

const COUNTRY_CENTROIDS: Record<string, GeoPoint> = {
  US: { lat: 39.5, lng: -98.35 },
  CA: { lat: 56.1, lng: -106.35 },
  AU: { lat: -25.3, lng: 133.8 },
  GB: { lat: 55.38, lng: -3.44 },
  NZ: { lat: -40.9, lng: 174.89 },
  IN: { lat: 20.59, lng: 78.96 },
};

const WORLD_ATLAS = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const W = 800; const H = 400;

function surgeColor(cap: number): string {
  if (cap <= 1.5) return "#22c55e";
  if (cap <= 2.0) return "#f59e0b";
  return "#ef4444";
}

export default function PricingRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string | number, { commission: string; surge: string }>>({});
  const [saving, setSaving] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"list" | "map">("list");

  // Map state
  const [geoData, setGeoData] = useState<unknown>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Group regions by country for map pins
  const countryGroups = regions.reduce<Record<string, Region[]>>((acc, r) => {
    const c = (r.country ?? "").toUpperCase();
    if (!c || !COUNTRY_CENTROIDS[c]) return acc;
    (acc[c] ??= []).push(r);
    return acc;
  }, {});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pricing/regions");
      if (!res.ok) throw new Error("Pricing API unavailable");
      const data = await res.json();
      const list = data.regions;
      if (!Array.isArray(list)) throw new Error(data.error || "Unexpected response from pricing API");
      setRegions(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load regions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load world atlas when map tab is active
  useEffect(() => {
    if (tab !== "map" || geoData) return;
    fetch(WORLD_ATLAS)
      .then((r) => r.json())
      .then(setGeoData)
      .catch(() => {});
  }, [tab, geoData]);


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
          base_price: r.base_price ?? 0,
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

  // Build SVG path generator
  const projection = geoMercator().scale(120).translate([W / 2, H / 1.45]);
  const pathGen = geoPath().projection(projection);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countries = geoData ? (feature(geoData as any, (geoData as any).objects.countries) as any) : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Regions</h1>
          <p className="text-sm text-muted-foreground">Commission rates and surge caps per region</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            <button
              onClick={() => setTab("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${tab === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Globe className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setTab("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${tab === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Map className="h-3.5 w-3.5" /> Map
            </button>
          </div>
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

      {/* ── LIST TAB ─────────────────────────────────────────── */}
      {tab === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Region", "Country", "Commission Rate", "Surge Cap", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
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
                        const surge = r.surge_cap ?? r.surgeCap ?? 0;
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
                                    setEditing((prev) => ({ ...prev, [r.id]: { ...prev[r.id], commission: e.target.value } }))
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
                                    setEditing((prev) => ({ ...prev, [r.id]: { ...prev[r.id], surge: e.target.value } }))
                                  }
                                />
                              ) : (
                                <span className="flex items-center gap-1.5 font-mono">
                                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: surgeColor(surge) }} />
                                  {surge.toFixed(1)}×
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex gap-1">
                                  <Button size="sm" className="h-7 text-xs" disabled={saving === r.id} onClick={() => saveEdit(r)}>Save</Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing((prev) => { const next = { ...prev }; delete next[r.id]; return next; })}>Cancel</Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startEdit(r)}>Edit</Button>
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
      )}

      {/* ── MAP TAB ──────────────────────────────────────────── */}
      {tab === "map" && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Legend */}
            <div className="flex items-center gap-6 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">Avg Surge Cap per Country:</span>
              {[
                { color: "#22c55e", label: "≤ 1.5×  Low" },
                { color: "#f59e0b", label: "≤ 2.0×  Medium" },
                { color: "#ef4444", label: "> 2.0×  High" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>

            {/* SVG world map */}
            <div className="relative bg-muted/20 rounded-xl overflow-hidden border border-border">
              {!geoData ? (
                <div className="flex items-center justify-center h-80 text-muted-foreground text-sm">
                  Loading map…
                </div>
              ) : (
                <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block" }}>
                  {/* Ocean */}
                  <rect width={W} height={H} fill="#0f172a" />

                  {/* Countries */}
                  {countries && (countries as { features: unknown[] }).features.map((feat: unknown, i: number) => (
                    <path
                      key={i}
                      d={pathGen(feat as GeoPermissibleObjects) ?? ""}
                      fill="#1e293b"
                      stroke="#334155"
                      strokeWidth={0.4}
                    />
                  ))}

                  {/* One pin per country */}
                  {Object.entries(countryGroups).map(([code, group]) => {
                    const pt = COUNTRY_CENTROIDS[code];
                    const [px, py] = projection([pt.lng, pt.lat]) ?? [0, 0];
                    const avgSurge = group.reduce((s, r) => s + (r.surge_cap ?? r.surgeCap ?? 1), 0) / group.length;
                    const color = surgeColor(avgSurge);
                    const isHov = hoveredCountry === code;
                    const radius = isHov ? 11 : 8;
                    const tooltipW = 160;
                    const tooltipH = Math.min(group.length, 6) * 13 + 28;
                    return (
                      <g
                        key={code}
                        transform={`translate(${px},${py})`}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredCountry(code)}
                        onMouseLeave={() => setHoveredCountry(null)}
                      >
                        <circle r={radius + 4} fill={color} opacity={0.12} />
                        <circle r={radius} fill={color} opacity={0.85} />
                        <text x={0} y={4} textAnchor="middle" fill="#0f172a" fontSize={9} fontWeight={700}>
                          {group.length}
                        </text>
                        {isHov && (
                          <>
                            <rect x={-tooltipW / 2} y={-(tooltipH + 14)} width={tooltipW} height={tooltipH} rx={6} fill="#1e293b" stroke="#334155" strokeWidth={1} />
                            <text x={0} y={-(tooltipH + 14) + 14} textAnchor="middle" fill="#e2e8f0" fontSize={10} fontWeight={700}>
                              {COUNTRY_FLAGS[code] ?? "🌐"} {code} — {group.length} regions
                            </text>
                            {group.slice(0, 6).map((r, idx) => (
                              <text key={r.id} x={-tooltipW / 2 + 8} y={-(tooltipH + 14) + 28 + idx * 13} fill="#94a3b8" fontSize={8}>
                                {r.region_name ?? r.name} · {((r.commission_rate ?? 0) * 100).toFixed(0)}% · {(r.surge_cap ?? 1).toFixed(1)}×
                              </text>
                            ))}
                            {group.length > 6 && (
                              <text x={0} y={-(tooltipH + 14) + 28 + 6 * 13} textAnchor="middle" fill="#64748b" fontSize={8}>
                                +{group.length - 6} more
                              </text>
                            )}
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Country summary chips */}
            {Object.keys(countryGroups).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(countryGroups).map(([code, group]) => {
                  const avgSurge = group.reduce((s, r) => s + (r.surge_cap ?? r.surgeCap ?? 1), 0) / group.length;
                  return (
                    <div
                      key={code}
                      className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs cursor-pointer hover:bg-muted/40 transition-colors"
                      onMouseEnter={() => setHoveredCountry(code)}
                      onMouseLeave={() => setHoveredCountry(null)}
                    >
                      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: surgeColor(avgSurge) }} />
                      <span className="font-medium">{COUNTRY_FLAGS[code] ?? "🌐"} {code}</span>
                      <span className="text-muted-foreground">{group.length} regions</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
