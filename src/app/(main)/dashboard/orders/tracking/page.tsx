"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  Package,
  MapPin,
  Clock,
  User,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
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
  created_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; ring: string; progress: number }> = {
  pending:    { label: "Pending",     color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", ring: "text-yellow-400",  progress: 10 },
  accepted:   { label: "Accepted",    color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",       ring: "text-cyan-400",    progress: 35 },
  picked_up:  { label: "Picked Up",   color: "bg-purple-500/15 text-purple-400 border-purple-500/30", ring: "text-purple-400",  progress: 70 },
  delivered:  { label: "Delivered",   color: "bg-green-500/15 text-green-400 border-green-500/30",    ring: "text-green-500",   progress: 100 },
  cancelled:  { label: "Cancelled",   color: "bg-red-500/15 text-red-400 border-red-500/30",          ring: "text-red-400",     progress: 0 },
};

const ACTIVE_STATUSES = ["pending", "accepted", "picked_up"];

function ProgressRing({ status }: { status: string }) {
  const meta = STATUS_META[status];
  const angle = (meta?.progress ?? 0) * 3.6;
  return (
    <div
      style={{ "--angle": `${angle}deg` } as React.CSSProperties}
      className={cn(
        "grid size-3 place-items-center rounded-full p-[0.5px] bg-[conic-gradient(currentColor_0deg_var(--angle),transparent_var(--angle)_360deg)]",
        meta?.ring ?? "text-muted-foreground",
      )}
    >
      <div className="grid size-2 place-items-center rounded-full bg-card">
        <div className="size-1 rounded-full bg-current" />
      </div>
    </div>
  );
}

function OrderCard({
  order,
  active,
  onSelect,
}: {
  order: Order;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const meta = STATUS_META[order.order_status];
  const progress = meta?.progress ?? 0;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(order.id)}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border p-3 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "border-primary bg-muted/50",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">#{order.order_number || order.id.slice(0, 8)}</span>
        <div className="flex items-center gap-1.5">
          <ProgressRing status={order.order_status} />
          <span className="text-xs text-muted-foreground">{meta?.label ?? order.order_status}</span>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20">
          <UtensilsCrossed className="h-3 w-3 text-green-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{order.restaurant_name}</p>
          <p className="truncate text-xs text-muted-foreground">{order.pickup_address}</p>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20">
          <MapPin className="h-3 w-3 text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{order.customer_name}</p>
          <p className="truncate text-xs text-muted-foreground">{order.delivery_address}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              order.order_status === "cancelled" ? "bg-red-500" : "bg-primary",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""} · ${(order.total ?? 0).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
        </div>
      </div>
    </button>
  );
}

function RouteMap({ order }: { order: Order | null }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!order) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Select an order to view the route
      </div>
    );
  }

  const origin = encodeURIComponent(order.pickup_address || "");
  const destination = encodeURIComponent(order.delivery_address || "");

  if (!origin || !destination) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        No address data for this order
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}&mode=driving`;

  return (
    <iframe
      key={order.id}
      src={src}
      className="h-full w-full border-0"
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title={`Route for order #${order.order_number}`}
    />
  );
}

function StatusStep({
  label,
  time,
  done,
  active,
  last,
}: {
  label: string;
  time: string | null;
  done: boolean;
  active: boolean;
  last: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold",
            done
              ? "border-green-500 bg-green-500/20 text-green-400"
              : active
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-muted text-muted-foreground",
          )}
        >
          {done ? "✓" : "○"}
        </div>
        {!last && (
          <div className={cn("mt-1 w-0.5 flex-1 min-h-6", done ? "bg-green-500/40" : "bg-border")} />
        )}
      </div>
      <div className="pb-4">
        <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground">
          {time ? new Date(time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
        </p>
      </div>
    </div>
  );
}

function OrderDetails({ order }: { order: Order }) {
  const meta = STATUS_META[order.order_status];

  const steps = [
    { label: "Order Placed",   time: order.created_at,   done: true,                                  active: false },
    { label: "Accepted",       time: order.accepted_at,  done: !!order.accepted_at,                   active: order.order_status === "pending" },
    { label: "Picked Up",      time: order.picked_up_at, done: !!order.picked_up_at,                  active: order.order_status === "accepted" },
    { label: "Delivered",      time: order.delivered_at, done: order.order_status === "delivered",    active: order.order_status === "picked_up" },
  ];

  return (
    <div className="h-full min-h-0 overflow-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Order #{order.order_number || order.id.slice(0, 8)}</h2>
          <p className="text-xs text-muted-foreground">
            {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
          </p>
        </div>
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", meta?.color)}>
          {meta?.label ?? order.order_status}
        </span>
      </div>

      <Separator />

      {/* Addresses */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-border p-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/20">
            <UtensilsCrossed className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pickup — {order.restaurant_name}</p>
            <p className="text-sm font-medium">{order.pickup_address || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3">
          <div className="h-px flex-1 border-t border-dashed border-border" />
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <div className="h-px flex-1 border-t border-dashed border-border" />
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border p-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/20">
            <MapPin className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dropoff — {order.customer_name}</p>
            <p className="text-sm font-medium">{order.delivery_address || "—"}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h3>
        <div>
          {steps.map((step, i) => (
            <StatusStep
              key={step.label}
              label={step.label}
              time={step.time}
              done={step.done}
              active={step.active}
              last={i === steps.length - 1}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Items */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</h3>
        <div className="space-y-1">
          {(order.items ?? []).map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity}× {item.name}
              </span>
              <span>${((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Fare */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span><span>${(order.subtotal ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery fee</span><span>${(order.delivery_fee ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Taxes</span><span>${(order.taxes ?? 0).toFixed(2)}</span>
        </div>
        {(order.tip ?? 0) > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Tip</span><span>${(order.tip ?? 0).toFixed(2)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span><span>${(order.total ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{order.payment_method}</span>
          <span className={order.payment_status === "paid" ? "text-green-400" : "text-yellow-400"}>
            {order.payment_status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active">("active");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?limit=50");
      const data = await res.json();
      const list: Order[] = data.orders ?? [];
      setOrders(list);
      // Auto-select first active order
      const first = list.find((o) => ACTIVE_STATUSES.includes(o.order_status)) ?? list[0];
      if (first && !selectedId) setSelectedId(first.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = orders;
    if (activeTab === "active") {
      list = list.filter((o) => ACTIVE_STATUSES.includes(o.order_status));
    }
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
  }, [orders, activeTab, search]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.order_status)).length;

  return (
    <div
      data-content-padding="false"
      className="grid h-[calc(100dvh-var(--dashboard-header-height))] overflow-hidden lg:grid-cols-[380px_minmax(0,1fr)] lg:divide-x"
    >
      {/* Left: order list */}
      <Card className="h-full rounded-none ring-0 flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl font-normal flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Live Tracking
          </CardTitle>
          <CardAction>
            <Button size="icon-sm" variant="ghost" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden px-0 pb-0">
          {/* Tabs */}
          <div className="flex border-b px-4">
            {[
              { key: "active", label: `Active (${activeCount})` },
              { key: "all",    label: `All (${orders.length})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as "all" | "active")}
                className={cn(
                  "pb-2 pr-4 text-xs font-medium border-b-2 transition-colors",
                  activeTab === t.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-4">
            <InputGroup className="h-8">
              <InputGroupInput
                className="h-8"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputGroupAddon>
                <Search className="h-3.5 w-3.5" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <ScrollArea className="h-0 flex-1">
            <div className="flex flex-col gap-3 px-4 pb-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 opacity-40" />
                  <p className="text-sm">No orders found</p>
                </div>
              ) : (
                filtered.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    active={selectedId === order.id}
                    onSelect={setSelectedId}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: map + details */}
      <div className="hidden h-full overflow-hidden lg:grid lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Map */}
        <div className="min-h-0 overflow-hidden border-b border-border">
          <RouteMap order={selected} />
        </div>

        {/* Details */}
        <div className="min-h-0 overflow-hidden">
          {selected ? (
            <OrderDetails order={selected} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <div className="text-center space-y-2">
                <User className="h-8 w-8 mx-auto opacity-30" />
                <p>Select an order to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
