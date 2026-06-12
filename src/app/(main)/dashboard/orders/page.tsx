"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, ChevronDown, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  name: string;
  quantity: number;
  total: number;
}

interface StatusHistoryEntry {
  status: string;
  timestamp: string;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_uid: string;
  restaurant_name: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  taxes: number;
  tip: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  delivery_type: string;
  pickup_address: string;
  delivery_address: string;
  driver_uid: string | null;
  receipt_url?: string | null;
  status_history?: StatusHistoryEntry[];
  created_at: string | null;
  delivered_at: string | null;
}

const STATUSES = ["all", "pending", "accepted", "picked_up", "delivered", "cancelled"];

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  accepted: { label: "Confirmed", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  picked_up: { label: "On the Way", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  delivered: { label: "Delivered", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  paid: "bg-green-500/15 text-green-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-red-500/15 text-red-400",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, { status_history?: StatusHistoryEntry[]; receipt_url?: string | null }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?limit=200");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = orders;
    if (activeStatus !== "all") list = list.filter((o) => o.order_status === activeStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.customer_name?.toLowerCase().includes(q) ||
          o.restaurant_name?.toLowerCase().includes(q) ||
          String(o.order_number).includes(q),
      );
    }
    setFiltered(list);
  }, [orders, activeStatus, search]);

  async function expandRow(id: string) {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next && !orderDetails[id]) {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrderDetails((prev) => ({ ...prev, [id]: data }));
        }
      } catch { /* non-fatal */ }
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_status: status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, order_status: status } : o)),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "all" ? orders.length : orders.filter((o) => o.order_status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} orders shown</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customer, restaurant, #..."
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
                  {["Order #", "Customer", "Restaurant", "Items", "Total", "Payment", "Status", "Date", "Actions"].map(
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
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/40">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.map((o) => (
                      <>
                        <tr
                          key={o.id}
                          className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => expandRow(o.id)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            #{o.order_number || o.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {o.customer_name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {o.restaurant_name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {o.items?.length || 0} item{o.items?.length !== 1 ? "s" : ""}
                          </td>
                          <td className="px-4 py-3 font-mono whitespace-nowrap">
                            ${(o.total || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLOR[o.payment_status] || "bg-gray-500/15 text-gray-400"}`}
                            >
                              {o.payment_status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_META[o.order_status]?.color || "bg-gray-500/15 text-gray-400"}`}
                            >
                              {STATUS_META[o.order_status]?.label || o.order_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="rounded border border-border bg-background px-2 py-1 text-xs"
                              value={o.order_status}
                              disabled={updatingId === o.id}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateStatus(o.id, e.target.value)}
                            >
                              {Object.entries(STATUS_META).map(([val, meta]) => (
                                <option key={val} value={val}>
                                  {meta.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        {expandedId === o.id && (
                          <tr key={`${o.id}-exp`} className="border-b border-border/40 bg-muted/10">
                            <td colSpan={9} className="px-6 py-4">
                              {(() => {
                                const detail = orderDetails[o.id];
                                const statusHistory = detail?.status_history ?? o.status_history ?? [];
                                const receiptUrl = detail?.receipt_url ?? o.receipt_url;
                                return (
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                                    ITEMS
                                  </p>
                                  <div className="space-y-1">
                                    {(o.items || []).map((item, i) => (
                                      <div key={i} className="flex justify-between text-xs">
                                        <span>
                                          {item.quantity}× {item.name}
                                        </span>
                                        <span className="font-mono">
                                          ${(item.total || 0).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                                    BREAKDOWN
                                  </p>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Subtotal</span>
                                      <span>${(o.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Tax (13%)</span>
                                      <span>${(o.taxes || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Tip</span>
                                      <span>${(o.tip || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                                      <span>Total</span>
                                      <span>${(o.total || 0).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                                    DELIVERY
                                  </p>
                                  <div className="space-y-1 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">From: </span>
                                      {o.pickup_address}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">To: </span>
                                      {o.delivery_address}
                                    </div>
                                    {o.driver_uid && (
                                      <div>
                                        <span className="text-muted-foreground">Driver: </span>
                                        <span className="font-mono">{o.driver_uid.slice(0, 10)}…</span>
                                      </div>
                                    )}
                                    {o.delivered_at && (
                                      <div>
                                        <span className="text-muted-foreground">Delivered: </span>
                                        {new Date(o.delivered_at).toLocaleString()}
                                      </div>
                                    )}
                                    {receiptUrl && (
                                      <div>
                                        <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                                          View receipt photo ↗
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {statusHistory.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold text-muted-foreground mb-2">STATUS HISTORY</p>
                                  <div className="flex flex-wrap gap-2">
                                    {statusHistory.map((h, i) => (
                                      <div key={i} className="flex items-center gap-1.5 text-xs bg-muted/30 rounded-lg px-2.5 py-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_META[h.status]?.color?.split(" ")[1] ?? "bg-gray-400"}`} />
                                        <span className="font-medium">{STATUS_META[h.status]?.label ?? h.status}</span>
                                        <span className="text-muted-foreground">
                                          {h.timestamp ? new Date(h.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                                );
                              })()}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No orders found</p>
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
