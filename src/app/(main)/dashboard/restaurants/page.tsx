"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, UtensilsCrossed, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  rating: number;
  review_count: string;
  delivery_time: string;
  delivery_fee: string;
  min_order: number;
  address: string;
  is_open: boolean;
  emoji: string;
  promo_tag: string | null;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      setRestaurants(data.restaurants || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(restaurants); return; }
    const q = search.toLowerCase();
    setFiltered(
      restaurants.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q) ||
          r.categories?.some((c) => c.toLowerCase().includes(q)),
      ),
    );
  }, [restaurants, search]);

  async function toggleOpen(r: Restaurant) {
    setUpdatingId(r.id);
    try {
      await fetch("/api/restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, is_open: !r.is_open }),
      });
      setRestaurants((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, is_open: !r.is_open } : x)),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restaurants</h1>
          <p className="text-sm text-muted-foreground">
            {restaurants.length} restaurants on platform
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, category, address..."
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
                  {["Restaurant", "Categories", "Rating", "Delivery", "Min Order", "Address", "Status", "Actions"].map(
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
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtered.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{r.emoji}</span>
                            <div>
                              <p className="font-medium whitespace-nowrap">{r.name}</p>
                              {r.promo_tag && (
                                <p className="text-xs text-cyan-400">{r.promo_tag}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(r.categories || []).slice(0, 3).map((c) => (
                              <span
                                key={c}
                                className="rounded bg-muted px-1.5 py-0.5 text-xs"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-3 w-3 fill-current" />
                            {r.rating?.toFixed(1) || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {r.review_count} reviews
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div>{r.delivery_time}</div>
                          <div>{r.delivery_fee}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          ${r.min_order?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                          {r.address || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              r.is_open
                                ? "bg-green-500/15 text-green-400"
                                : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {r.is_open ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === r.id}
                            onClick={() => toggleOpen(r)}
                            className="text-xs h-7"
                          >
                            {r.is_open ? "Close" : "Open"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <UtensilsCrossed className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No restaurants found</p>
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
