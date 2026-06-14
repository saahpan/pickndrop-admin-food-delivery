"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  X,
  Mail,
  Phone,
  Shield,
  ShieldOff,
  Clock,
  UserCheck,
  UserX,
  Smartphone,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AppUser {
  uid: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  provider: string;
  photo_url: string | null;
  email_verified: boolean;
  disabled: boolean;
  created_at: string | null;
  last_sign_in: string | null;
  last_login_at?: string | null;
  last_login_method?: string | null;
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function providerLabel(p: string) {
  if (p === "google.com") return "Google";
  if (p === "phone") return "Phone";
  if (p === "password") return "Email";
  return p;
}

function ProviderBadge({ provider }: { provider: string }) {
  const label = providerLabel(provider);
  const icon =
    provider === "google.com" ? (
      <Globe className="h-3 w-3" />
    ) : provider === "phone" ? (
      <Smartphone className="h-3 w-3" />
    ) : (
      <Mail className="h-3 w-3" />
    );
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-white/5 text-muted-foreground border border-white/10">
      {icon}
      {label}
    </span>
  );
}

function getInitials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function UserSheet({
  user,
  onClose,
  onUpdate,
}: {
  user: AppUser;
  onClose: () => void;
  onUpdate: (uid: string, patch: Partial<AppUser>) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [editFields, setEditFields] = useState({
    displayName: user.display_name ?? "",
    phoneNumber: user.phone ?? "",
    disabled: user.disabled,
  });

  async function saveEdit() {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch(`/api/customers/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editFields.displayName || undefined,
          phoneNumber: editFields.phoneNumber || undefined,
          disabled: editFields.disabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, msg: "Saved successfully" });
        onUpdate(user.uid, {
          display_name: editFields.displayName || user.display_name,
          phone: editFields.phoneNumber || user.phone,
          disabled: editFields.disabled,
        });
        setEditOpen(false);
      } else {
        setResult({ ok: false, msg: data.error ?? "Failed to save" });
      }
    } catch (e) {
      setResult({ ok: false, msg: String(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#0f0f11] border-l border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0f0f11]/95 px-5 py-4 backdrop-blur">
          <span className="font-semibold text-sm text-foreground">User Details</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white uppercase">
              {getInitials(user.display_name)}
            </div>
            <div>
              <p className="font-semibold text-base text-foreground">{user.display_name ?? "No name"}</p>
              <p className="text-sm text-muted-foreground">{user.email ?? "—"}</p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <ProviderBadge provider={user.provider} />
                {user.disabled ? (
                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                    <UserX className="h-3 w-3" /> Disabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                    <UserCheck className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
            <Row label="UID" value={<span className="font-mono text-xs break-all">{user.uid}</span>} />
            <Row
              label="Email verified"
              value={
                user.email_verified ? (
                  <span className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-400 text-xs">
                    <XCircle className="h-3 w-3" /> Not verified
                  </span>
                )
              }
            />
            <Row
              label="Phone"
              value={
                user.phone ? (
                  <span className="flex items-center gap-1 text-xs">
                    <Phone className="h-3 w-3 text-muted-foreground" /> {user.phone}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <Row label="Joined" value={fmt(user.created_at)} />
            <Row label="Last sign-in (Firebase)" value={fmt(user.last_sign_in)} />
            {user.last_login_at && (
              <Row
                label="Last login"
                value={
                  <span className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {fmt(user.last_login_at)}
                    {user.last_login_method && (
                      <span className="text-muted-foreground">via {user.last_login_method}</span>
                    )}
                  </span>
                }
              />
            )}
          </div>

          {/* Edit section */}
          {!editOpen ? (
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="w-full">
              Edit account
            </Button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Edit account</p>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Display name</label>
                <Input
                  value={editFields.displayName}
                  onChange={(e) => setEditFields((f) => ({ ...f, displayName: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Phone number (E.164 format, e.g. +14155550100)</label>
                <Input
                  value={editFields.phoneNumber}
                  onChange={(e) => setEditFields((f) => ({ ...f, phoneNumber: e.target.value }))}
                  className="h-8 text-sm font-mono"
                  placeholder="+1..."
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground">Account status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditFields((f) => ({ ...f, disabled: false }))}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-xs border transition-colors ${
                      !editFields.disabled
                        ? "bg-green-500/15 text-green-400 border-green-500/30"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Shield className="h-3 w-3" /> Active
                  </button>
                  <button
                    onClick={() => setEditFields((f) => ({ ...f, disabled: true }))}
                    className={`flex items-center gap-1 rounded px-2 py-1 text-xs border transition-colors ${
                      editFields.disabled
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/20"
                    }`}
                  >
                    <ShieldOff className="h-3 w-3" /> Disabled
                  </button>
                </div>
              </div>

              {result && (
                <p className={`text-xs ${result.ok ? "text-green-400" : "text-red-400"}`}>{result.msg}</p>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit} disabled={saving} className="flex-1">
                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditOpen(false);
                    setResult(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="text-muted-foreground whitespace-nowrap text-xs">{label}</span>
      <span className="text-right text-xs text-foreground">{value}</span>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "disabled">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.customers ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleUpdate(uid: string, patch: Partial<AppUser>) {
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...patch } : u)));
    setSelected((prev) => (prev?.uid === uid ? { ...prev, ...patch } : prev));
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (u.display_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q);
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !u.disabled) ||
      (filter === "disabled" && u.disabled);
    return matchesSearch && matchesFilter;
  });

  const totalActive = users.filter((u) => !u.disabled).length;
  const totalDisabled = users.filter((u) => u.disabled).length;

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} total · {totalActive} active · {totalDisabled} disabled
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total users" value={users.length} />
        <StatCard label="Active" value={totalActive} />
        <StatCard label="Disabled" value={totalDisabled} />
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search by name, email, phone, UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(["all", "active", "disabled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs border capitalize transition-colors ${
              filter === f
                ? "bg-white/10 text-foreground border-white/20"
                : "bg-transparent text-muted-foreground border-white/10 hover:border-white/20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400 text-sm">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((u) => (
                <div
                  key={u.uid}
                  onClick={() => setSelected(u)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white uppercase">
                    {getInitials(u.display_name)}
                  </div>

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {u.display_name ?? "No name"}
                      </span>
                      <ProviderBadge provider={u.provider} />
                      {u.disabled && (
                        <span className="text-xs text-red-400 bg-red-500/10 rounded px-1.5 py-0.5 border border-red-500/20">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground truncate">{u.email ?? "—"}</span>
                      {u.phone && (
                        <span className="text-xs text-muted-foreground">{u.phone}</span>
                      )}
                    </div>
                  </div>

                  {/* Verified + dates */}
                  <div className="shrink-0 text-right space-y-0.5 hidden sm:block">
                    <div className="flex items-center justify-end gap-1">
                      {u.email_verified ? (
                        <span className="flex items-center gap-0.5 text-xs text-green-400">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-xs text-yellow-500/80">
                          <XCircle className="h-3 w-3" /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{fmt(u.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <UserSheet
          user={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
