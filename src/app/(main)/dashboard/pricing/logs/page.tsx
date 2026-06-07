"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ChartBar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface EstimationLog {
  id: string | number;
  region?: string;
  service?: string;
  weather?: string;
  distance_km?: number;
  duration_min?: number;
  surge_multiplier?: number;
  floor_price?: number;
  final_price?: number;
  driver_pay?: number;
  outcome?: string;
  actual_price?: number;
  created_at?: string;
}

interface LogsResponse {
  logs: EstimationLog[];
  total: number;
  page: number;
  limit: number;
  stats?: {
    totalEstimates: number;
    booked: number;
    completed: number;
    conversionRate: number;
    avgFinalPrice: number;
  };
}

const OUTCOME_META: Record<string, { label: string; color: string }> = {
  completed: { label: "Completed", color: "text-green-400" },
  booked: { label: "Booked", color: "text-cyan-400" },
  abandoned: { label: "Abandoned", color: "text-red-400" },
  pending: { label: "Pending", color: "text-muted-foreground" },
};

const WEATHER_ICONS: Record<string, string> = {
  clear: "☀️",
  rain: "🌧️",
  storm: "⛈️",
};

export default function PricingLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pricing/logs?page=${p}&limit=50`);
      if (!res.ok) throw new Error("Pricing API unavailable — make sure PicknDrop app is running on port 3000");
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const logs = data?.logs || [];
  const stats = data?.stats;
  const totalPages = data ? Math.ceil((data.total || 0) / (data.limit || 50)) : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estimation Logs</h1>
          <p className="text-sm text-muted-foreground">Pricing engine calculation history</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          ⚠ {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Total Estimates", value: stats.totalEstimates },
            { label: "Booked", value: stats.booked, color: "text-cyan-400" },
            { label: "Completed", value: stats.completed, color: "text-green-400" },
            { label: "Conversion Rate", value: `${stats.conversionRate?.toFixed(1)}%` },
            { label: "Avg Final Price", value: `$${stats.avgFinalPrice?.toFixed(2)}` },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color || ""}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Time", "Region", "Service", "Weather", "Dist", "Dur", "Surge", "Floor", "Final", "Driver $", "Outcome"].map(
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
                        {Array.from({ length: 11 }).map((_, j) => (
                          <td key={j} className="px-3 py-2.5">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : logs.map((log, i) => (
                      <tr key={log.id || i} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs">{log.region || "—"}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{log.service || "—"}</td>
                        <td className="px-3 py-2.5 text-xs">
                          {WEATHER_ICONS[log.weather || ""] || log.weather || "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {log.distance_km?.toFixed(1) || "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {log.duration_min?.toFixed(0) || "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-orange-400">
                          {log.surge_multiplier ? `${log.surge_multiplier.toFixed(2)}×` : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {log.floor_price ? `$${log.floor_price.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold">
                          {log.final_price ? `$${log.final_price.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-green-400">
                          {log.driver_pay ? `$${log.driver_pay.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-medium ${OUTCOME_META[log.outcome || ""]?.color || "text-muted-foreground"}`}>
                            {OUTCOME_META[log.outcome || ""]?.label || log.outcome || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                {!loading && logs.length === 0 && !error && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center">
                      <ChartBar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No estimation logs</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} &middot; {data?.total} total
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
