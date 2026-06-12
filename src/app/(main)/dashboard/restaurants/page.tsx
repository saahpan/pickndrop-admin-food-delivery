"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw, Search, UtensilsCrossed, Star, Plus, X,
  Clock, MapPin, Phone, Mail, ChevronRight, Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  cuisine_types?: string[];
  rating: number;
  review_count: string;
  delivery_time: string;
  delivery_fee: string | number;
  min_order: number;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  is_open: boolean;
  emoji: string;
  promo_tag: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  opening_hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  menu_items?: MenuItem[];
  onboarded?: boolean;
}

interface MenuItem {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_SHORT: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Detail sheet
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Restaurant | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add restaurant modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addResult, setAddResult] = useState<{ link?: string; error?: string } | null>(null);

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
          (r.categories ?? r.cuisine_types ?? []).some((c) => c.toLowerCase().includes(q)),
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

  async function openDetail(id: string) {
    setSelectedId(id);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/restaurants/${id}`);
      if (res.ok) setDetailData(await res.json());
    } finally {
      setDetailLoading(false);
    }
  }

  async function sendInvite() {
    if (!addName.trim() || !addEmail.trim()) return;
    setAddLoading(true);
    setAddResult(null);
    try {
      const res = await fetch("/api/restaurants/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), email: addEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddResult({ error: data.error }); return; }
      const siteUrl = window.location.origin;
      setAddResult({ link: `${siteUrl}/onboard/restaurant?token=${data.token}` });
    } catch (e) {
      setAddResult({ error: String(e) });
    } finally {
      setAddLoading(false);
    }
  }

  const displayData = detailData ?? restaurants.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restaurants</h1>
          <p className="text-sm text-muted-foreground">{restaurants.length} restaurants on platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Restaurant
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
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
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/40">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => openDetail(r.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {r.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <span className="text-lg">{r.emoji ?? "🍽️"}</span>
                            )}
                            <div>
                              <p className="font-medium whitespace-nowrap flex items-center gap-1">
                                {r.name}
                                {r.onboarded && <span className="text-[10px] bg-cyan-500/15 text-cyan-400 rounded px-1">onboarded</span>}
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              </p>
                              {r.promo_tag && <p className="text-xs text-cyan-400">{r.promo_tag}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap gap-1">
                            {(r.cuisine_types ?? r.categories ?? []).slice(0, 3).map((c) => (
                              <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-xs">{c}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="h-3 w-3 fill-current" />
                            {r.rating?.toFixed(1) || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">{r.review_count} reviews</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div>{r.delivery_time}</div>
                          <div>{typeof r.delivery_fee === "number" ? `$${r.delivery_fee.toFixed(2)}` : r.delivery_fee}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">${r.min_order?.toFixed(2) || "0.00"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{r.address || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.is_open ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                            {r.is_open ? "Open" : "Closed"}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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

      {/* ── Restaurant Detail Sheet ──────────────────────────────── */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedId(null)} />
          <div className="w-full max-w-xl bg-background border-l border-border flex flex-col overflow-hidden">
            {/* Sheet header */}
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <h2 className="font-semibold text-lg">
                {displayData?.name ?? "Restaurant Details"}
              </h2>
              <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {detailLoading && !displayData && (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                </div>
              )}

              {displayData && (
                <div className="p-6 space-y-6">
                  {/* Cover image */}
                  {displayData.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayData.cover_image_url}
                      alt=""
                      className="w-full h-40 object-cover rounded-2xl"
                    />
                  )}

                  {/* Basic info */}
                  <div className="flex items-start gap-4">
                    {displayData.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={displayData.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl shrink-0">
                        {displayData.emoji ?? "🍽️"}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{displayData.name}</h3>
                      {displayData.description && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{displayData.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(displayData.cuisine_types ?? displayData.categories ?? []).map((c) => (
                          <span key={c} className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-2 py-0.5">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-3">
                    {displayData.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" /> {displayData.phone}
                      </div>
                    )}
                    {displayData.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" /> {displayData.email}
                      </div>
                    )}
                    {displayData.address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-2">
                        <MapPin className="h-4 w-4 shrink-0" /> {displayData.address}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-yellow-400 font-bold">
                        <Star className="h-4 w-4 fill-current" />
                        {displayData.rating?.toFixed(1) || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{displayData.review_count} reviews</div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1 font-bold">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm">{displayData.delivery_time || "—"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Delivery time</div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 text-center">
                      <div className="font-bold text-sm">
                        ${typeof displayData.delivery_fee === "number" ? displayData.delivery_fee.toFixed(2) : displayData.delivery_fee || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Delivery fee</div>
                    </div>
                  </div>

                  {/* Opening hours */}
                  {displayData.opening_hours && Object.keys(displayData.opening_hours).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Opening Hours</h4>
                      <div className="space-y-1.5">
                        {DAYS.filter((d) => displayData.opening_hours![d]).map((day) => {
                          const h = displayData.opening_hours![day];
                          return (
                            <div key={day} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground w-10">{DAY_SHORT[day]}</span>
                              {h.closed ? (
                                <span className="text-muted-foreground italic text-xs">Closed</span>
                              ) : (
                                <span>{h.open} – {h.close}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Menu items */}
                  {displayData.menu_items && displayData.menu_items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">
                        Menu ({displayData.menu_items.length} items)
                      </h4>
                      {/* Group by category */}
                      {Array.from(new Set(displayData.menu_items.map((i) => i.category))).map((cat) => (
                        <div key={cat} className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{cat}</span>
                          </div>
                          <div className="space-y-2">
                            {displayData.menu_items!.filter((i) => i.category === cat).map((item, idx) => (
                              <div key={item.id ?? idx} className="flex items-start justify-between gap-3 bg-muted/20 rounded-xl p-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                    {!item.available && (
                                      <span className="text-[10px] bg-red-500/15 text-red-400 rounded px-1 shrink-0">unavailable</span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                                  )}
                                </div>
                                <span className="font-bold text-sm shrink-0">${item.price?.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Restaurant Modal ──────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAdd(false); setAddResult(null); setAddName(""); setAddEmail(""); }} />
          <div className="relative bg-background border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Add Restaurant</h2>
              <button onClick={() => { setShowAdd(false); setAddResult(null); setAddName(""); setAddEmail(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {addResult?.link ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <p className="text-green-400 font-semibold text-sm mb-1">Invitation sent!</p>
                  <p className="text-muted-foreground text-xs">An email with an OTP and onboarding link has been sent to {addEmail}.</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Onboarding link (share manually if needed):</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={addResult.link}
                      className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs font-mono truncate focus:outline-none"
                    />
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(addResult.link!)}>
                      Copy
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => { setShowAdd(false); setAddResult(null); setAddName(""); setAddEmail(""); }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the restaurant&apos;s basic details. They&apos;ll receive an email with an OTP and a link to complete their profile.
                </p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Restaurant Name *</label>
                  <Input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Joe's Burgers"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Contact Email *</label>
                  <Input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                  />
                </div>
                {addResult?.error && (
                  <p className="text-red-400 text-sm">{addResult.error}</p>
                )}
                <Button
                  className="w-full"
                  onClick={sendInvite}
                  disabled={addLoading || !addName.trim() || !addEmail.trim()}
                >
                  {addLoading ? "Sending…" : "Send Onboarding Invitation"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
