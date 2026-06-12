"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Car,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  X,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Driver {
  id: string;
  uid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  is_online: boolean;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: string;
  vehicle_color: string;
  license_plate: string;
  onboarding_status: string;
  terms_accepted: boolean;
  persona_completed: boolean;
  persona_inquiry_id: string | null;
  drivers_license_persona_completed: boolean;
  drivers_license_persona_inquiry_id: string | null;
  profile_picture_url: string | null;
  background_check_unlocked: boolean;
  background_check_status: string;
  background_check_order_id: string | null;
  camera_opt_in: boolean | null;
  camera_provider: string | null;
  camera_request_status: string | null;
  assigned_camera_serial: string | null;
  samsara_driver_id: string | null;
  samsara_vehicle_id: string | null;
  total_earnings: number;
  completed_deliveries: number;
  paypal_email: string | null;
  custom_docs: Record<string, string>;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string | null;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  CA: "🇨🇦",
  AU: "🇦🇺",
  GB: "🇬🇧",
  NZ: "🇳🇿",
  IN: "🇮🇳",
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  AU: "Australia",
  GB: "United Kingdom",
  NZ: "New Zealand",
  IN: "India",
};

const ONBOARDING_STATUSES = ["all", "in_progress", "submitted", "approved", "rejected"];

const ONBOARDING_META: Record<string, { label: string; color: string }> = {
  in_progress: { label: "In Progress", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  submitted: { label: "Submitted", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  approved: { label: "Approved", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const BG_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-gray-400" },
  invited: { label: "Invited", color: "text-blue-400" },
  clear: { label: "Clear ✓", color: "text-green-400" },
  flagged: { label: "Flagged ⚠", color: "text-red-400" },
};

const CAMERA_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/15 text-yellow-400" },
  approved: { label: "Approved", color: "bg-blue-500/15 text-blue-400" },
  shipped: { label: "Shipped", color: "bg-purple-500/15 text-purple-400" },
  assigned: { label: "Assigned", color: "bg-green-500/15 text-green-400" },
  cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-400" },
};

function StepBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${
        done ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
      }`}
    >
      {done ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  );
}

function getOnboardingSteps(d: Driver) {
  const hasPersonalInfo = !!(d.first_name && d.last_name && d.email && d.phone);
  const hasVehicle = !!(d.vehicle_make && d.vehicle_model && d.license_plate);
  const hasAllCustomDocs = Object.keys(d.custom_docs || {}).length > 0;

  return [
    { key: "personal", label: "Personal Info", done: hasPersonalInfo },
    { key: "license", label: "License", done: d.drivers_license_persona_completed },
    { key: "vehicle", label: "Vehicle", done: hasVehicle },
    { key: "selfie", label: "Selfie / ID", done: d.persona_completed },
    { key: "terms", label: "T&C", done: d.terms_accepted },
    { key: "bgcheck", label: "Background", done: d.background_check_status === "clear" },
    { key: "docs", label: "Documents", done: hasAllCustomDocs },
  ];
}

interface PersonaInquiry {
  id: string;
  status: string | null;
  nameFirst: string | null;
  nameMiddle: string | null;
  nameLast: string | null;
  birthdate: string | null;
}

function nameMatch(a: string | null, b: string | null) {
  if (!a || !b) return null;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function NameMatchBadge({ extracted, entered, label }: { extracted: string | null; entered: string; label: string }) {
  const match = nameMatch(extracted, entered);
  if (match === null) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
        <span>{label}: not extracted</span>
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-1.5 text-xs ${match ? "text-green-400" : "text-red-400"}`}>
      {match ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
      <span>
        {label}: <span className="font-mono font-semibold">{extracted}</span>
        {!match && <span className="ml-1 text-muted-foreground">(entered: {entered})</span>}
      </span>
    </div>
  );
}

function DriverSheet({
  driver,
  onClose,
  onUpdate,
}: {
  driver: Driver;
  onClose: () => void;
  onUpdate: (id: string, update: Record<string, string>) => void;
}) {
  const steps = getOnboardingSteps(driver);
  const completedSteps = steps.filter((s) => s.done).length;
  const country = driver.country?.toUpperCase();
  const flag = COUNTRY_FLAGS[country] || "🌐";
  const countryName = COUNTRY_NAMES[country] || driver.country;

  const [licenseInquiry, setLicenseInquiry] = useState<PersonaInquiry | null>(null);
  const [selfieInquiry, setSelfieInquiry] = useState<PersonaInquiry | null>(null);
  const [personaLoading, setPersonaLoading] = useState(false);

  useEffect(() => {
    async function fetchInquiry(id: string): Promise<PersonaInquiry | null> {
      try {
        const res = await fetch(`/api/persona/${id}`);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    async function load() {
      setPersonaLoading(true);
      const [license, selfie] = await Promise.all([
        driver.drivers_license_persona_inquiry_id
          ? fetchInquiry(driver.drivers_license_persona_inquiry_id)
          : Promise.resolve(null),
        driver.persona_inquiry_id
          ? fetchInquiry(driver.persona_inquiry_id)
          : Promise.resolve(null),
      ]);
      setLicenseInquiry(license);
      setSelfieInquiry(selfie);
      setPersonaLoading(false);
    }

    load();
  }, [driver.drivers_license_persona_inquiry_id, driver.persona_inquiry_id]);

  const hasPersonaData = licenseInquiry || selfieInquiry;
  const source = licenseInquiry ?? selfieInquiry;
  const firstMatch = source ? nameMatch(source.nameFirst, driver.first_name) : null;
  const lastMatch = source ? nameMatch(source.nameLast, driver.last_name) : null;
  const bothMatch = firstMatch === true && lastMatch === true;
  const anyMismatch = firstMatch === false || lastMatch === false;

  async function handleStatusChange(status: string) {
    await fetch(`/api/drivers/${driver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_status: status }),
    });
    onUpdate(driver.id, { onboarding_status: status });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl overflow-y-auto bg-background border-l border-border shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">
            {driver.first_name} {driver.last_name}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            {driver.profile_picture_url ? (
              <img
                src={driver.profile_picture_url}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
                {driver.first_name?.[0]}{driver.last_name?.[0]}
              </div>
            )}
            <div>
              <p className="text-xl font-bold">
                {driver.first_name} {driver.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{driver.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ONBOARDING_META[driver.onboarding_status]?.color || "bg-muted text-muted-foreground"}`}
                >
                  {ONBOARDING_META[driver.onboarding_status]?.label || driver.onboarding_status}
                </span>
                {driver.is_online && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            {driver.onboarding_status === "submitted" && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange("approved")}>
                  Approve Driver
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatusChange("rejected")}>
                  Reject
                </Button>
              </>
            )}
            {driver.onboarding_status === "approved" && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange("rejected")}>
                Suspend
              </Button>
            )}
          </div>

          {/* Onboarding Progress */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Onboarding Progress</h3>
              <span className="text-xs text-muted-foreground">
                {completedSteps}/{steps.length} steps
              </span>
            </div>
            <div className="mb-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all"
                style={{ width: `${(completedSteps / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map((s) => (
                <StepBadge key={s.key} done={s.done} label={s.label} />
              ))}
            </div>
          </div>

          {/* Personal Details */}
          <Section title="Personal Information">
            <Row label="Full Name" value={`${driver.first_name} ${driver.last_name}`} />
            <Row label="Email" value={driver.email} />
            <Row label="Phone" value={driver.phone} />
            <Row
              label="Country"
              value={
                <span className="flex items-center gap-1.5">
                  <span className="text-lg">{flag}</span>
                  {countryName}
                </span>
              }
            />
            <Row
              label="Email Verified"
              value={
                <span className={driver.email_verified ? "text-green-400" : "text-red-400"}>
                  {driver.email_verified ? "Yes" : "No"}
                </span>
              }
            />
          </Section>

          {/* Vehicle */}
          <Section title="Vehicle Information">
            <Row label="Make" value={driver.vehicle_make || "—"} />
            <Row label="Model" value={driver.vehicle_model || "—"} />
            <Row label="Year" value={driver.vehicle_year || "—"} />
            <Row label="Color" value={driver.vehicle_color || "—"} />
            <Row label="License Plate" value={<span className="font-mono">{driver.license_plate || "—"}</span>} />
          </Section>

          {/* Identity Verification */}
          <Section title="Identity Verification (Persona)">
            <Row
              label="License Verification"
              value={
                driver.drivers_license_persona_completed ? (
                  <span className="text-green-400">Completed</span>
                ) : (
                  <span className="text-red-400">Pending</span>
                )
              }
            />
            {driver.drivers_license_persona_inquiry_id && (
              <Row
                label="License Inquiry ID"
                value={<span className="font-mono text-xs">{driver.drivers_license_persona_inquiry_id}</span>}
              />
            )}
            <Row
              label="Selfie Verification"
              value={
                driver.persona_completed ? (
                  <span className="text-green-400">Completed</span>
                ) : (
                  <span className="text-red-400">Pending</span>
                )
              }
            />
            {driver.persona_inquiry_id && (
              <Row
                label="Selfie Inquiry ID"
                value={<span className="font-mono text-xs">{driver.persona_inquiry_id}</span>}
              />
            )}
            <Row
              label="Terms Accepted"
              value={
                driver.terms_accepted ? (
                  <span className="text-green-400">Yes</span>
                ) : (
                  <span className="text-red-400">No</span>
                )
              }
            />

            {/* Name match */}
            {(driver.drivers_license_persona_completed || driver.persona_completed) && (
              <div className="px-4 py-3 border-t border-border">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Name Match
                  </p>
                  {personaLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                  {!personaLoading && hasPersonaData && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                        anyMismatch
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : bothMatch
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                      }`}
                    >
                      {anyMismatch ? "⚠ Mismatch" : bothMatch ? "✓ Match" : "Partial"}
                    </span>
                  )}
                </div>

                {personaLoading ? (
                  <p className="text-xs text-muted-foreground">Loading Persona data…</p>
                ) : !hasPersonaData ? (
                  <p className="text-xs text-muted-foreground italic">No completed inquiry found</p>
                ) : (
                  <div className="space-y-2">
                    <NameMatchBadge
                      extracted={source?.nameFirst ?? null}
                      entered={driver.first_name}
                      label="First"
                    />
                    <NameMatchBadge
                      extracted={source?.nameLast ?? null}
                      entered={driver.last_name}
                      label="Last"
                    />
                    {source?.nameMiddle && (
                      <div className="text-xs text-muted-foreground">
                        Middle on document: <span className="font-mono">{source.nameMiddle}</span>
                      </div>
                    )}
                    {source?.birthdate && (
                      <div className="text-xs text-muted-foreground">
                        DOB on document: <span className="font-mono">{source.birthdate}</span>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground pt-1">
                      Source: {licenseInquiry ? "driver's license" : "selfie"} inquiry
                    </p>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* Background Check */}
          <Section title="Background Check (Verified First)">
            <Row
              label="Unlocked"
              value={
                driver.background_check_unlocked ? (
                  <span className="text-green-400">Yes</span>
                ) : (
                  <span className="text-yellow-400">Waiting for steps</span>
                )
              }
            />
            <Row
              label="Status"
              value={
                <span className={BG_META[driver.background_check_status]?.color || "text-muted-foreground"}>
                  {BG_META[driver.background_check_status]?.label || driver.background_check_status}
                </span>
              }
            />
            {driver.background_check_order_id && (
              <Row
                label="Order ID"
                value={<span className="font-mono text-xs">{driver.background_check_order_id}</span>}
              />
            )}
          </Section>

          {/* Camera Hardware */}
          <Section title="Camera Hardware">
            <Row
              label="Opted In"
              value={
                driver.camera_opt_in === null ? (
                  <span className="text-muted-foreground">Not decided</span>
                ) : driver.camera_opt_in ? (
                  <span className="text-green-400">Yes</span>
                ) : (
                  <span className="text-red-400">No</span>
                )
              }
            />
            {driver.camera_provider && (
              <>
                <Row
                  label="Provider"
                  value={
                    <span className="rounded px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400">
                      {driver.camera_provider.toUpperCase()}
                    </span>
                  }
                />
                <Row
                  label="Request Status"
                  value={
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CAMERA_STATUS_META[driver.camera_request_status || ""]?.color || "bg-muted text-muted-foreground"}`}
                    >
                      {CAMERA_STATUS_META[driver.camera_request_status || ""]?.label || driver.camera_request_status || "—"}
                    </span>
                  }
                />
                {driver.assigned_camera_serial && (
                  <Row
                    label="Camera Serial"
                    value={<span className="font-mono text-xs">{driver.assigned_camera_serial}</span>}
                  />
                )}
                {driver.samsara_driver_id && (
                  <Row
                    label="Samsara Driver ID"
                    value={<span className="font-mono text-xs text-blue-400">{driver.samsara_driver_id}</span>}
                  />
                )}
                {driver.samsara_vehicle_id && (
                  <Row
                    label="Samsara Vehicle ID"
                    value={<span className="font-mono text-xs text-blue-400">{driver.samsara_vehicle_id}</span>}
                  />
                )}
              </>
            )}
          </Section>

          {/* Earnings */}
          <Section title="Earnings & Payouts">
            <Row
              label="Total Earnings"
              value={<span className="font-mono">${driver.total_earnings.toFixed(2)}</span>}
            />
            <Row label="Completed Deliveries" value={driver.completed_deliveries} />
            <Row label="PayPal Email" value={driver.paypal_email || <span className="text-muted-foreground italic">Not set</span>} />
          </Section>

          {/* Custom Documents */}
          {Object.keys(driver.custom_docs || {}).length > 0 && (
            <Section title="Uploaded Documents">
              {Object.entries(driver.custom_docs).map(([key, url]) => (
                <Row
                  key={key}
                  label={key.replace(/_/g, " ")}
                  value={
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline text-xs"
                    >
                      View document ↗
                    </a>
                  }
                />
              ))}
            </Section>
          )}

          <p className="text-xs text-muted-foreground">
            Joined: {driver.created_at ? new Date(driver.created_at).toLocaleDateString() : "—"} &middot; UID: {driver.uid}
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filtered, setFiltered] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drivers");
      const data = await res.json();
      setDrivers(data.drivers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = drivers;
    if (activeStatus !== "all") {
      list = list.filter((d) => d.onboarding_status === activeStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.phone?.includes(q) ||
          d.country?.toLowerCase().includes(q) ||
          d.vehicle_make?.toLowerCase().includes(q) ||
          d.license_plate?.toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  }, [drivers, activeStatus, search]);

  function handleDriverUpdate(id: string, update: Record<string, string>) {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...update } : d)),
    );
    if (selectedDriver?.id === id) {
      setSelectedDriver((prev) => prev ? { ...prev, ...update } : null);
    }
  }

  const counts = ONBOARDING_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "all" ? drivers.length : drivers.filter((d) => d.onboarding_status === s).length;
    return acc;
  }, {});

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Drivers</h1>
            <p className="text-sm text-muted-foreground">{drivers.length} total drivers</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {ONBOARDING_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                activeStatus === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s === "all" ? "All" : ONBOARDING_META[s]?.label || s}{" "}
              <span className="ml-1 opacity-60">({counts[s] || 0})</span>
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, country, plate..."
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
                    {[
                      "Driver",
                      "Country",
                      "Vehicle",
                      "Onboarding Steps",
                      "Background Check",
                      "Camera",
                      "Deliveries",
                      "Status",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
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
                    : filtered.map((d) => {
                        const steps = getOnboardingSteps(d);
                        const doneCount = steps.filter((s) => s.done).length;
                        const country = d.country?.toUpperCase();
                        const flag = COUNTRY_FLAGS[country] || "🌐";

                        return (
                          <tr
                            key={d.id}
                            className="border-b border-border/40 hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => setSelectedDriver(d)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {d.profile_picture_url ? (
                                  <img
                                    src={d.profile_picture_url}
                                    alt=""
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                    {d.first_name?.[0]}{d.last_name?.[0]}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium whitespace-nowrap">
                                    {d.first_name} {d.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{d.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 text-sm">
                                <span className="text-base">{flag}</span>
                                <span className="text-muted-foreground text-xs">
                                  {COUNTRY_NAMES[country] || d.country || "—"}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {d.vehicle_make && d.vehicle_model ? (
                                <div>
                                  <p className="font-medium text-foreground">
                                    {d.vehicle_make} {d.vehicle_model}
                                  </p>
                                  <p className="font-mono">{d.license_plate}</p>
                                </div>
                              ) : (
                                <span className="italic">Not set</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-cyan-500"
                                    style={{ width: `${(doneCount / steps.length) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {doneCount}/{steps.length}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs ${BG_META[d.background_check_status]?.color || "text-muted-foreground"}`}>
                                {BG_META[d.background_check_status]?.label || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {d.camera_opt_in === null ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : d.camera_opt_in ? (
                                <div>
                                  <span className="rounded px-1.5 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400">
                                    {d.camera_provider?.toUpperCase() || "—"}
                                  </span>
                                  {d.camera_request_status && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {CAMERA_STATUS_META[d.camera_request_status]?.label || d.camera_request_status}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Opted out</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <p className="font-semibold">{d.completed_deliveries}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                ${d.total_earnings.toFixed(0)}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ONBOARDING_META[d.onboarding_status]?.color || "bg-muted text-muted-foreground"}`}
                              >
                                {ONBOARDING_META[d.onboarding_status]?.label || d.onboarding_status}
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
                        <Car className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No drivers found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedDriver && (
        <DriverSheet
          driver={selectedDriver}
          onClose={() => setSelectedDriver(null)}
          onUpdate={handleDriverUpdate}
        />
      )}
    </>
  );
}
