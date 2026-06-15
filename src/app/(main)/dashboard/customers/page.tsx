"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Search, Users, X, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Customer {
  uid: string;
  display_name: string;
  email: string;
  phone: string;
  provider: string;
  photo_url: string | null;
  email_verified: boolean;
  disabled: boolean;
  created_at: string | null;
  last_sign_in: string | null;
  last_login_at: string | null;
  last_login_method: string | null;
}

const PROVIDER_LABELS: Record<string, string> = {
  password: "Email",
  "google.com": "Google",
  phone: "Phone",
};

const PROVIDER_COLORS: Record<string, string> = {
  password: "bg-blue-500/15 text-blue-400",
  "google.com": "bg-red-500/15 text-red-400",
  phone: "bg-green-500/15 text-green-400",
};

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CA: "🇨🇦", AU: "🇦🇺", GB: "🇬🇧",
  NZ: "🇳🇿", IN: "🇮🇳", PK: "🇵🇰", AE: "🇦🇪", IE: "🇮🇪",
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", AU: "Australia", GB: "United Kingdom",
  NZ: "New Zealand", IN: "India", PK: "Pakistan", AE: "UAE", IE: "Ireland",
};

// Check longer prefixes first to avoid false matches
function getCountryFromPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.startsWith("+971")) return "AE";
  if (phone.startsWith("+353")) return "IE";
  if (phone.startsWith("+64"))  return "NZ";
  if (phone.startsWith("+61"))  return "AU";
  if (phone.startsWith("+44"))  return "GB";
  if (phone.startsWith("+92"))  return "PK";
  if (phone.startsWith("+91"))  return "IN";
  if (phone.startsWith("+1"))   return "US";
  return null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function CustomerSheet({
  customer,
  onClose,
  onUpdate,
}: {
  customer: Customer;
  onClose: () => void;
  onUpdate: (uid: string, update: Partial<Customer>) => void;
}) {
  const country = getCountryFromPhone(customer.phone);
  const flag = country ? COUNTRY_FLAGS[country] : null;
  const countryName = country ? COUNTRY_NAMES[country] : null;

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [fields, setFields] = useState({
    display_name: customer.display_name ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    disabled: customer.disabled,
  });

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch(`/api/customers/${customer.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: fields.display_name,
          email: fields.email,
          phoneNumber: fields.phone,
          disabled: fields.disabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, msg: "Saved successfully" });
        onUpdate(customer.uid, fields);
      } else {
        setResult({ ok: false, msg: data.error || "Save failed" });
      }
    } catch (err) {
      setResult({ ok: false, msg: String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg overflow-y-auto bg-background border-l border-border shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">{customer.display_name || "Customer"}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditOpen((o) => !o); setResult(null); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                editOpen
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {editOpen ? "Close Editor" : "✏ Edit"}
            </button>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            {customer.photo_url ? (
              <img src={customer.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
                {(customer.display_name || customer.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xl font-bold">
                {customer.display_name || <span className="italic text-muted-foreground text-base">No name</span>}
              </p>
              <p className="text-sm text-muted-foreground">{customer.email || "—"}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLORS[customer.provider] || "bg-muted text-muted-foreground"}`}>
                  {PROVIDER_LABELS[customer.provider] || customer.provider}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${customer.disabled ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
                  {customer.disabled ? "Disabled" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Edit panel */}
          {editOpen && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-4">
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Edit Account — writes to Firebase Auth
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Display Name</label>
                  <Input value={fields.display_name} onChange={(e) => setFields((f) => ({ ...f, display_name: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Email</label>
                  <Input value={fields.email} onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Phone</label>
                  <Input value={fields.phone} onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))} className="h-8 text-sm" />
                </div>
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-2.5 hover:bg-muted/20 transition-colors">
                <span className="text-sm">Account Disabled</span>
                <button
                  onClick={() => setFields((f) => ({ ...f, disabled: !f.disabled }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${fields.disabled ? "bg-red-500" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${fields.disabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </label>
              {result && (
                <div className={`rounded-lg border p-3 text-sm ${result.ok ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
                  {result.msg}
                </div>
              )}
              <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold" onClick={save} disabled={saving}>
                {saving ? <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Saving…</span> : "Save Changes"}
              </Button>
            </div>
          )}

          {/* Account Information */}
          <Section title="Account Information">
            <Row label="UID" value={<span className="font-mono text-xs text-muted-foreground">{customer.uid}</span>} />
            <Row label="Sign-in Method" value={
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLORS[customer.provider] || "bg-muted text-muted-foreground"}`}>
                {PROVIDER_LABELS[customer.provider] || customer.provider}
              </span>
            } />
            <Row label="Email Verified" value={
              <span className={customer.email_verified ? "text-green-400" : "text-red-400"}>
                {customer.email_verified ? "Yes" : "No"}
              </span>
            } />
            <Row label="Status" value={
              <span className={customer.disabled ? "text-red-400" : "text-green-400"}>
                {customer.disabled ? "Disabled" : "Active"}
              </span>
            } />
            {customer.phone && (
              <Row label="Phone" value={<span className="font-mono text-xs">{customer.phone}</span>} />
            )}
            {flag && countryName && (
              <Row label="Country (from phone)" value={
                <span className="flex items-center gap-1.5">
                  <span className="text-lg">{flag}</span>
                  {countryName}
                </span>
              } />
            )}
          </Section>

          {/* Activity */}
          <Section title="Activity">
            <Row label="Joined" value={
              <span className="font-mono text-xs text-muted-foreground">
                {customer.created_at ? new Date(customer.created_at).toLocaleString() : "—"}
              </span>
            } />
            <Row label="Last Sign-In (Firebase)" value={
              <span className="font-mono text-xs text-muted-foreground">
                {customer.last_sign_in ? new Date(customer.last_sign_in).toLocaleString() : "—"}
              </span>
            } />
            {customer.last_login_at && (
              <Row label="Last Login (app)" value={
                <span className="text-xs text-muted-foreground">
                  {new Date(customer.last_login_at).toLocaleString()}
                  {customer.last_login_method && (
                    <span className="ml-1.5 rounded px-1.5 py-0.5 text-xs bg-muted text-muted-foreground">
                      {customer.last_login_method}
                    </span>
                  )}
                </span>
              } />
            )}
          </Section>

          <p className="text-xs text-muted-foreground">UID: {customer.uid}</p>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const availableCountries = [...new Set(
    customers.map((c) => getCountryFromPhone(c.phone)).filter(Boolean) as string[]
  )].sort();

  useEffect(() => {
    let list = customers;
    if (countryFilter !== "all") {
      list = list.filter((c) => getCountryFromPhone(c.phone) === countryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.display_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q),
      );
    }
    setFiltered(list);
  }, [customers, search, countryFilter]);

  function handleUpdate(uid: string, update: Partial<Customer>) {
    setCustomers((prev) => prev.map((c) => c.uid === uid ? { ...c, ...update } : c));
    if (selectedCustomer?.uid === uid) {
      setSelectedCustomer((prev) => prev ? { ...prev, ...update } : null);
    }
  }

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-sm text-muted-foreground">{customers.length} registered users</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {availableCountries.length > 0 && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {COUNTRY_FLAGS[c] || ""} {COUNTRY_NAMES[c] || c}
                </option>
              ))}
            </select>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Name", "Email", "Phone", "Country", "Sign-in", "Joined", "Last Active", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/40">
                          {Array.from({ length: 9 }).map((_, j) => (
                            <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    : filtered.map((c) => {
                        const country = getCountryFromPhone(c.phone);
                        const flag = country ? COUNTRY_FLAGS[country] : null;
                        return (
                          <tr
                            key={c.uid}
                            className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => setSelectedCustomer(c)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {c.photo_url ? (
                                  <img src={c.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                    {(c.display_name || c.email || "?")[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="font-medium whitespace-nowrap">
                                  {c.display_name || <span className="text-muted-foreground italic">No name</span>}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{c.phone || "—"}</td>
                            <td className="px-4 py-3">
                              {flag && country ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="text-base">{flag}</span>
                                  <span className="text-muted-foreground text-xs">{COUNTRY_NAMES[country] || country}</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROVIDER_COLORS[c.provider] || "bg-muted text-muted-foreground"}`}>
                                {PROVIDER_LABELS[c.provider] || c.provider}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {c.last_sign_in ? new Date(c.last_sign_in).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.disabled ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400"}`}>
                                {c.disabled ? "Disabled" : "Active"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </td>
                          </tr>
                        );
                      })}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No customers found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedCustomer && (
        <CustomerSheet
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}
