"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface CameraRequest {
  id: string;
  driver_id: string;
  provider: string;
  status: string;
  camera_serial: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  order_notes: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  license_plate: string;
  requested_at: string | null;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Approval", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  approved: { label: "Approved", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  shipped: { label: "Shipped", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  assigned: { label: "Assigned", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const STATUSES = ["all", "pending", "approved", "shipped", "assigned", "cancelled"];

export default function CamerasPage() {
  const [requests, setRequests] = useState<CameraRequest[]>([]);
  const [filtered, setFiltered] = useState<CameraRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [serialInputs, setSerialInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cameras");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = requests;
    if (activeStatus !== "all") list = list.filter((r) => r.status === activeStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.provider?.toLowerCase().includes(q) ||
          r.camera_serial?.toLowerCase().includes(q) ||
          r.license_plate?.toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  }, [requests, activeStatus, search]);

  async function updateRequest(id: string, status: string, driverId: string, serial?: string) {
    setUpdatingId(id);
    try {
      await fetch(`/api/cameras/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, driver_id: driverId, camera_serial: serial }),
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, camera_serial: serial || r.camera_serial } : r,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "all" ? requests.length : requests.filter((r) => r.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Camera Hardware</h1>
          <p className="text-sm text-muted-foreground">
            Samsara & Zonar dashcam requests
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search driver, provider, serial..."
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
                  {["Driver", "Provider", "Vehicle & Plate", "Ship To", "Serial / Tracking", "Requested", "Status", "Actions"].map(
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
                  : filtered.map((r) => (
                      <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium whitespace-nowrap">
                            {r.first_name} {r.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                          <p className="text-xs text-muted-foreground font-mono">{r.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-bold ${
                              r.provider === "samsara"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {r.provider?.toUpperCase() || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <p className="font-medium">
                            {r.vehicle_make} {r.vehicle_model} {r.vehicle_year}
                          </p>
                          <p className="font-mono text-muted-foreground">{r.license_plate}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <p>{r.shipping_street}</p>
                          <p>
                            {r.shipping_city}, {r.shipping_state} {r.shipping_zip}
                          </p>
                          <p>{r.shipping_country}</p>
                          {r.order_notes && (
                            <p className="mt-1 italic text-yellow-400/70">Note: {r.order_notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.camera_serial ? (
                            <span className="font-mono text-xs text-green-400">
                              {r.camera_serial}
                            </span>
                          ) : (
                            <div className="flex gap-1">
                              <Input
                                className="h-7 w-32 text-xs font-mono"
                                placeholder="Enter serial..."
                                value={serialInputs[r.id] || ""}
                                onChange={(e) =>
                                  setSerialInputs((prev) => ({ ...prev, [r.id]: e.target.value }))
                                }
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {r.requested_at ? new Date(r.requested_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_META[r.status]?.color || "bg-muted text-muted-foreground"}`}
                          >
                            {STATUS_META[r.status]?.label || r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {r.status === "pending" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={updatingId === r.id}
                                onClick={() => updateRequest(r.id, "approved", r.driver_id)}
                              >
                                Approve
                              </Button>
                            )}
                            {r.status === "approved" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={updatingId === r.id || !serialInputs[r.id]}
                                onClick={() =>
                                  updateRequest(r.id, "shipped", r.driver_id, serialInputs[r.id])
                                }
                              >
                                Mark Shipped
                              </Button>
                            )}
                            {r.status === "shipped" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                disabled={updatingId === r.id}
                                onClick={() => updateRequest(r.id, "assigned", r.driver_id)}
                              >
                                Mark Assigned
                              </Button>
                            )}
                            {!["cancelled", "assigned"].includes(r.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-400 border-red-400/30 hover:bg-red-500/10"
                                disabled={updatingId === r.id}
                                onClick={() => updateRequest(r.id, "cancelled", r.driver_id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No camera requests</p>
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
