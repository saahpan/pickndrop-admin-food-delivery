"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Payout {
  id: string;
  driver_uid: string;
  paypal_email: string;
  amount: number;
  status: string;
  paypal_batch_id: string | null;
  error: string | null;
  created_at: string | null;
  completed_at: string | null;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  completed: { label: "Completed", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  failed: { label: "Failed", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filtered, setFiltered] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payouts");
      const data = await res.json();
      setPayouts(data.payouts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = payouts;
    if (activeStatus !== "all") list = list.filter((p) => p.status === activeStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.paypal_email?.toLowerCase().includes(q) ||
          p.driver_uid?.toLowerCase().includes(q) ||
          p.paypal_batch_id?.toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  }, [payouts, activeStatus, search]);

  const totalPending = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const counts: Record<string, number> = {
    all: payouts.length,
    pending: payouts.filter((p) => p.status === "pending").length,
    completed: payouts.filter((p) => p.status === "completed").length,
    failed: payouts.filter((p) => p.status === "failed").length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Driver Payouts</h1>
          <p className="text-sm text-muted-foreground">PayPal payout requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Pending Payout</p>
            <p className="text-xl font-bold text-yellow-400">${totalPending.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{counts.pending} requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Paid Out</p>
            <p className="text-xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{counts.completed} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-xl font-bold text-red-400">{counts.failed}</p>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "completed", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeStatus === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {s === "all" ? "All" : STATUS_META[s]?.label || s}{" "}
            <span className="ml-1 opacity-60">({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search email, driver ID, batch ID..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Driver UID", "PayPal Email", "Amount", "PayPal Batch ID", "Requested", "Completed", "Status", "Error"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/40">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.map((p) => (
                      <tr key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {p.driver_uid.slice(0, 12)}…
                        </td>
                        <td className="px-4 py-3 text-xs">{p.paypal_email}</td>
                        <td className="px-4 py-3 font-mono font-semibold">
                          ${p.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {p.paypal_batch_id || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_META[p.status]?.color || "bg-muted text-muted-foreground"}`}
                          >
                            {STATUS_META[p.status]?.label || p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-red-400 max-w-[150px] truncate">
                          {p.error || "—"}
                        </td>
                      </tr>
                    ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Wallet className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No payout requests</p>
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
