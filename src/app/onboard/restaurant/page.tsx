"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface MenuItem {
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};
const DEFAULT_HOURS = Object.fromEntries(DAYS.map((d) => [d, { open: "09:00", close: "22:00", closed: false }]));

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function OnboardContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [step, setStep] = useState<"otp" | "info" | "menu" | "done">("otp");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [restaurantName, setRestaurantName] = useState("");

  const [info, setInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    cuisine_types: "",
    delivery_fee: "2.99",
    min_order: "10",
    delivery_time: "30-45 min",
  });
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: "", description: "", price: "", category: "Main", available: true },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Link</h2>
          <p className="text-[#888]">This onboarding link is missing a token. Please use the link from your invitation email.</p>
        </div>
      </div>
    );
  }

  async function verifyOtp() {
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Enter the 6-digit code from your email"); return; }
    setVerifying(true);
    setOtpError("");
    try {
      const res = await fetch("/api/restaurants/onboard/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.error || "Verification failed"); return; }
      setRestaurantName(data.name);
      setInfo((prev) => ({ ...prev, name: data.name, email: data.email }));
      setStep("info");
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleOtpInput(idx: number, val: string) {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!digit && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!info.name || !info.address || !info.phone) {
      setSubmitError("Name, phone and address are required");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      let logo = null;
      let cover_image = null;
      if (logoFile) logo = await fileToBase64(logoFile);
      if (coverFile) cover_image = await fileToBase64(coverFile);

      const validItems = menuItems.filter((m) => m.name.trim());

      const payload = {
        token,
        info: {
          ...info,
          cuisine_types: info.cuisine_types.split(",").map((s) => s.trim()).filter(Boolean),
          delivery_fee: parseFloat(info.delivery_fee) || 0,
          min_order: parseFloat(info.min_order) || 0,
          opening_hours: hours,
        },
        menu_items: validItems.map((m) => ({
          ...m,
          price: parseFloat(m.price) || 0,
        })),
        logo,
        cover_image,
      };

      const res = await fetch("/api/restaurants/onboard/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Submission failed"); return; }
      setStep("done");
    } catch (e) {
      setSubmitError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">You&apos;re all set!</h2>
          <p className="text-[#888] text-sm leading-relaxed">
            Your restaurant <strong className="text-white">{info.name}</strong> has been submitted for review. Our team will activate your account shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0b]/90 backdrop-blur border-b border-white/5 z-10">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-black font-black text-sm">P</div>
          <span className="font-bold text-sm">PicknDrop Restaurant Onboarding</span>
          <div className="ml-auto flex gap-2">
            {(["otp", "info", "menu"] as const).map((s, i) => (
              <div key={s} className={`w-2 h-2 rounded-full transition-colors ${step === s ? "bg-cyan-500" : i < ["otp","info","menu"].indexOf(step) ? "bg-cyan-500/40" : "bg-white/10"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">

        {/* ── Step 1: OTP ─────────────────────────────────────── */}
        {step === "otp" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Verify your email</h1>
              <p className="text-[#888] text-sm">Enter the 6-digit code sent to your invitation email.</p>
            </div>
            <div className="flex gap-3 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) { otpRefs.current[i-1]?.focus(); } }}
                  className="w-12 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
                />
              ))}
            </div>
            {otpError && <p className="text-red-400 text-sm text-center">{otpError}</p>}
            <button
              onClick={verifyOtp}
              disabled={verifying}
              className="w-full bg-cyan-500 text-black font-black py-3.5 rounded-xl disabled:opacity-50 transition-opacity"
            >
              {verifying ? "Verifying…" : "Verify Code"}
            </button>
          </div>
        )}

        {/* ── Step 2: Restaurant Info ──────────────────────────── */}
        {step === "info" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Restaurant details</h1>
              <p className="text-[#888] text-sm">Tell us about <strong className="text-white">{restaurantName}</strong>.</p>
            </div>

            {/* Logo + Cover images */}
            <div className="grid grid-cols-2 gap-4">
              <label className="cursor-pointer">
                <div className="text-xs text-[#888] mb-2">Logo</div>
                <div className="h-24 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center hover:border-cyan-500/50 transition-colors">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#555] text-sm">+ Upload</span>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              <label className="cursor-pointer">
                <div className="text-xs text-[#888] mb-2">Cover Image</div>
                <div className="h-24 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center hover:border-cyan-500/50 transition-colors">
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#555] text-sm">+ Upload</span>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>
            </div>

            <Field label="Restaurant Name *" value={info.name} onChange={(v) => setInfo((p) => ({ ...p, name: v }))} />
            <Field label="Phone *" value={info.phone} onChange={(v) => setInfo((p) => ({ ...p, phone: v }))} type="tel" />
            <Field label="Address *" value={info.address} onChange={(v) => setInfo((p) => ({ ...p, address: v }))} />
            <Field label="Description" value={info.description} onChange={(v) => setInfo((p) => ({ ...p, description: v }))} multiline />
            <Field label="Cuisine Types (comma separated)" value={info.cuisine_types} onChange={(v) => setInfo((p) => ({ ...p, cuisine_types: v }))} placeholder="e.g. Burgers, American, Fast Food" />

            <div className="grid grid-cols-3 gap-4">
              <Field label="Delivery Fee ($)" value={info.delivery_fee} onChange={(v) => setInfo((p) => ({ ...p, delivery_fee: v }))} type="number" />
              <Field label="Min Order ($)" value={info.min_order} onChange={(v) => setInfo((p) => ({ ...p, min_order: v }))} type="number" />
              <Field label="Delivery Time" value={info.delivery_time} onChange={(v) => setInfo((p) => ({ ...p, delivery_time: v }))} placeholder="30-45 min" />
            </div>

            {/* Opening hours */}
            <div>
              <div className="text-sm font-medium mb-3">Opening Hours</div>
              <div className="space-y-2">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
                    <span className="text-sm w-8 text-[#888]">{DAY_LABELS[day]}</span>
                    <input
                      type="checkbox"
                      checked={!hours[day].closed}
                      onChange={(e) => setHours((h) => ({ ...h, [day]: { ...h[day], closed: !e.target.checked } }))}
                      className="accent-cyan-500"
                    />
                    {!hours[day].closed && (
                      <>
                        <input
                          type="time"
                          value={hours[day].open}
                          onChange={(e) => setHours((h) => ({ ...h, [day]: { ...h[day], open: e.target.value } }))}
                          className="bg-transparent text-sm border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
                        />
                        <span className="text-[#555] text-xs">–</span>
                        <input
                          type="time"
                          value={hours[day].close}
                          onChange={(e) => setHours((h) => ({ ...h, [day]: { ...h[day], close: e.target.value } }))}
                          className="bg-transparent text-sm border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
                        />
                      </>
                    )}
                    {hours[day].closed && <span className="text-[#555] text-sm italic">Closed</span>}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("menu")}
              className="w-full bg-cyan-500 text-black font-black py-3.5 rounded-xl"
            >
              Next: Menu Items →
            </button>
          </div>
        )}

        {/* ── Step 3: Menu Items ───────────────────────────────── */}
        {step === "menu" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Menu Items</h1>
              <p className="text-[#888] text-sm">Add your menu items. You can add more later from your dashboard.</p>
            </div>

            <div className="space-y-4">
              {menuItems.map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#888]">Item {idx + 1}</span>
                    {menuItems.length > 1 && (
                      <button
                        onClick={() => setMenuItems((m) => m.filter((_, i) => i !== idx))}
                        className="text-red-400 text-xs hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <Field label="Item Name *" value={item.name} onChange={(v) => setMenuItems((m) => m.map((x, i) => i === idx ? { ...x, name: v } : x))} />
                  <Field label="Description" value={item.description} onChange={(v) => setMenuItems((m) => m.map((x, i) => i === idx ? { ...x, description: v } : x))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Price ($) *" value={item.price} onChange={(v) => setMenuItems((m) => m.map((x, i) => i === idx ? { ...x, price: v } : x))} type="number" />
                    <Field label="Category" value={item.category} onChange={(v) => setMenuItems((m) => m.map((x, i) => i === idx ? { ...x, category: v } : x))} placeholder="Main, Sides, Drinks…" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.available}
                      onChange={(e) => setMenuItems((m) => m.map((x, i) => i === idx ? { ...x, available: e.target.checked } : x))}
                      className="accent-cyan-500"
                    />
                    <span className="text-sm text-[#888]">Available now</span>
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={() => setMenuItems((m) => [...m, { name: "", description: "", price: "", category: "Main", available: true }])}
              className="w-full py-3 rounded-xl border border-white/10 text-[#888] text-sm hover:border-cyan-500/50 hover:text-white transition-colors"
            >
              + Add Another Item
            </button>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{submitError}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("info")}
                className="flex-1 py-3.5 rounded-xl border border-white/10 text-[#888] font-semibold"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-2 flex-1 bg-cyan-500 text-black font-black py-3.5 rounded-xl disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Restaurant"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type, placeholder, multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const base = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-cyan-500 transition-colors";
  return (
    <div>
      <label className="text-xs text-[#888] mb-1.5 block">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  );
}

export default function RestaurantOnboardPage() {
  return (
    <Suspense>
      <OnboardContent />
    </Suspense>
  );
}
