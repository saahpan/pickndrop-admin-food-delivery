"use client";

import { useEffect, useState } from "react";
import {
  Car,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  DollarSign,
  Camera,
  Wallet,
  Clock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  orders: { total: number; today: number; pending: number; active: number };
  drivers: { total: number; online: number; approved: number };
  customers: { total: number };
  restaurants: { total: number };
  revenue: { total: number; today: number };
  cameras: { pending: number };
  payouts: { pending: number };
}

interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  restaurant_name: string;
  total: number;
  order_status: string;
  payment_status: string;
  created_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  accepted: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  picked_up: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Confirmed",
  picked_up: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {sub && !loading && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function load() {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/orders?limit=10"),
      ]);
      const [statsData, ordersData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
      ]);
      setStats(statsData);
      setOrders(ordersData.orders || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const fmt = (n: number) =>
    n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Overview</h1>
          <p className="text-sm text-muted-foreground">
            Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Today's Orders"
          value={stats?.orders.today ?? 0}
          sub={`${stats?.orders.pending ?? 0} pending`}
          icon={ShoppingBag}
          color="bg-cyan-500/10 text-cyan-500"
          loading={loading}
        />
        <StatCard
          title="Today's Revenue"
          value={stats ? fmt(stats.revenue.today) : "$0"}
          sub={`${fmt(stats?.revenue.total ?? 0)} all time`}
          icon={DollarSign}
          color="bg-green-500/10 text-green-500"
          loading={loading}
        />
        <StatCard
          title="Drivers Online"
          value={stats?.drivers.online ?? 0}
          sub={`${stats?.drivers.approved ?? 0} approved total`}
          icon={Car}
          color="bg-purple-500/10 text-purple-500"
          loading={loading}
        />
        <StatCard
          title="Active Orders"
          value={stats?.orders.active ?? 0}
          sub="In-transit right now"
          icon={TrendingUp}
          color="bg-orange-500/10 text-orange-500"
          loading={loading}
        />
        <StatCard
          title="Customers"
          value={stats?.customers.total ?? 0}
          sub="Registered users"
          icon={Users}
          color="bg-blue-500/10 text-blue-500"
          loading={loading}
        />
        <StatCard
          title="Restaurants"
          value={stats?.restaurants.total ?? 0}
          sub="On platform"
          icon={UtensilsCrossed}
          color="bg-pink-500/10 text-pink-500"
          loading={loading}
        />
        <StatCard
          title="Camera Requests"
          value={stats?.cameras.pending ?? 0}
          sub="Awaiting approval"
          icon={Camera}
          color="bg-yellow-500/10 text-yellow-500"
          loading={loading}
        />
        <StatCard
          title="Payout Requests"
          value={stats?.payouts.pending ?? 0}
          sub="Awaiting processing"
          icon={Wallet}
          color="bg-red-500/10 text-red-500"
          loading={loading}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <a href="/dashboard/orders" className="text-xs text-cyan-400 hover:underline">
            View all →
          </a>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Order #", "Customer", "Restaurant", "Total", "Status", "Time"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : orders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          #{o.order_number || o.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.restaurant_name}</td>
                        <td className="px-4 py-3 font-mono">${(o.total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.order_status] || "bg-gray-500/15 text-gray-400"}`}
                          >
                            {STATUS_LABELS[o.order_status] || o.order_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {o.created_at ? new Date(o.created_at).toLocaleTimeString() : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No orders yet
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
