import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../Auth/context/authcontext";
import ImageUpload from "../../../../components/ImageUpload";
import PhoneInput from "../../../../components/phoneinput";
import { useGeo } from "../../../../utils/geo";
import {
  getBrandProfile,
  updateBrandProfile,
  getNotifications,
  markOneRead,
  markBroadcastRead,
  markAllRead,
} from "../dashboard/dashboard_components/api";

import Sidebar from "../dashboard/dashboard_components/sidebar";
import TopBar from "../dashboard/dashboard_components/topbar";

// ✅ Lazy load every brand dashboard section
const Overview      = lazy(() => import("../dashboard/dashboard_components/overview"));
const Products      = lazy(() => import("./Products"));
const Orders        = lazy(() => import("./Orders"));
const Analytics     = lazy(() => import("./Analytics"));
const Settings      = lazy(() => import("./Settings"));
const Shop          = lazy(() => import("./Shop"));
const Wishlist      = lazy(() => import("./Wishlist"));
const Addresses     = lazy(() => import("./Addresses"));
const Notifications = lazy(() => import("./Notifications"));
const Shipping      = lazy(() => import("./Shipping"));
const LocalShipping = lazy(() => import("./Localshipping"));
const BankAccount   = lazy(() => import("./Bankaccount"));

// ── Page titles ───────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  overview:      "Studio",
  shop:          "Shop View",
  products:      "Products",
  orders:        "Orders",
  analytics:     "Analytics",
  settings:      "Settings",
  wishlist:      "Wishlist",
  addresses:     "Addresses",
  notifications: "Notifications",
  shipping:      "Shipping",
  local_shipping:"Local Shipping",
  bank_account:  "Bank Account",
};

// ── Section loading spinner ───────────────────────────────────────────────────
function SectionLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 300,
      gap: 12,
    }}>
      <div style={{
        width: 20,
        height: 20,
        border: "2px solid rgba(239,68,68,0.15)",
        borderTop: "2px solid #ef4444",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{
        fontFamily: "monospace",
        fontSize: 11,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: "0.2em",
      }}>
        LOADING...
      </span>
    </div>
  );
}

// ── Missing field helpers ─────────────────────────────────────────────────────
function getMissingFields(brand) {
  if (!brand) return [];
  const missing = [];
  if (!brand.avatar_url?.trim()) missing.push("avatar_url");
  const name = brand.name || brand.brand_name || "";
  if (!name.trim()) missing.push("brand_name");
  if (!brand.description?.trim()) missing.push("description");
  if (!brand.logo_url?.trim()) missing.push("logo_url");
  if (!brand.phone?.trim()) missing.push("phone");
  if (!brand.country_code?.trim()) missing.push("country_code");
  const hasSocial =
    brand.instagram?.trim() ||
    brand.facebook?.trim() ||
    brand.twitter?.trim() ||
    brand.tiktok?.trim();
  if (!hasSocial) {
    missing.push("instagram");
    missing.push("facebook");
    missing.push("twitter");
    missing.push("tiktok");
  }
  return missing;
}

const FIELD_LABELS = {
  avatar_url:   "Profile Photo",
  brand_name:   "Brand Name",
  description:  "Brand Description",
  logo_url:     "Brand Logo",
  phone:        "Contact Phone",
  country_code: "Location (Country)",
  instagram:    "Instagram",
  facebook:     "Facebook",
  twitter:      "Twitter / X",
  tiktok:       "TikTok",
};

// ── Logout Confirmation Modal ─────────────────────────────────────────────────
function LogoutConfirmationModal({ onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setSuccess(true);
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch (e) {
      console.error("Logout error:", e);
      setTimeout(() => { window.location.href = "/"; }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}
      >
        {success ? (
          <div style={{ padding: "40px 32px", textAlign: "center" }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.1)",
                border: "2px solid rgba(34,197,94,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg width="32" height="32" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "1.5rem",
              color: "#22c55e",
              letterSpacing: "0.06em",
              margin: "0 0 8px",
            }}>
              LOGGED OUT SUCCESSFULLY
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
              Redirecting you to homepage...
            </p>
          </div>
        ) : (
          <>
            <div style={{ height: 3, background: "linear-gradient(90deg,#ef4444,#ff6b6b,transparent)" }} />
            <div style={{ padding: "32px 28px" }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: "2px solid rgba(239,68,68,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "1.6rem",
                color: "#fff",
                letterSpacing: "0.06em",
                textAlign: "center",
                margin: "0 0 10px",
              }}>
                LOG OUT?
              </h2>
              <p style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                lineHeight: 1.6,
                textAlign: "center",
                margin: "0 0 24px",
              }}>
                Are you sure you want to log out of your brand account?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onCancel}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                    borderRadius: 10,
                    padding: "12px",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "#fff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: loading ? "#7f1d1d" : "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px",
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.background = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.background = "#ef4444";
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }} />
                      Logging out...
                    </>
                  ) : (
                    "Yes, Log Out"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Brand Profile Completion Popup ────────────────────────────────────────────
function BrandProfileCompletePopup({ brand, onDone, onSkip }) {
  const { Country, State, loaded } = useGeo();
  const missing = getMissingFields(brand);
  const [form, setForm] = useState({
    avatar_url:   brand?.avatar_url   || "",
    brand_name:   brand?.name || brand?.brand_name || "",
    description:  brand?.description  || "",
    logo_url:     brand?.logo_url     || "",
    phone:        brand?.phone        || "",
    instagram:    brand?.instagram    || "",
    facebook:     brand?.facebook     || "",
    twitter:      brand?.twitter      || "",
    tiktok:       brand?.tiktok       || "",
    country_code: brand?.country_code || "",
    country_name: brand?.country_name || "",
    state_code:   brand?.state_code   || "",
    state_name:   brand?.state_name   || "",
    city:         brand?.city         || "",
  });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [phoneValid, setPhoneValid] = useState(true);

  const filledMissing = missing.filter((f) => form[f] && form[f].trim() !== "").length;
  const pct = missing.length === 0 ? 100 : Math.round((filledMissing / missing.length) * 100);
  const missingLabels = missing.map((f) => FIELD_LABELS[f]).join(", ");

  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 13,
    padding: "11px 14px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };
  const focus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
  const blur  = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)");

  const handleSave = async () => {
    if (missing.includes("phone") && !phoneValid) {
      setError("Please enter a valid phone number.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateBrandProfile({
        brand_name:   form.brand_name,
        description:  form.description,
        logo_url:     form.logo_url,
        banner_url:   brand?.banner_url || "",
        phone:        form.phone,
        instagram:    form.instagram,
        facebook:     form.facebook,
        twitter:      form.twitter,
        tiktok:       form.tiktok,
        avatar_url:   form.avatar_url,
        first_name:   brand?.first_name || "",
        last_name:    brand?.last_name  || "",
        country_code: form.country_code,
        country_name: form.country_name,
        state_code:   form.state_code,
        state_name:   form.state_name,
        city:         form.city,
      });
      onDone({
        ...updated,
        avatar_url:   form.avatar_url,
        country_code: form.country_code,
        country_name: form.country_name,
        state_code:   form.state_code,
        state_name:   form.state_name,
        city:         form.city,
      });
    } catch (e) {
      onDone({
        ...brand,
        brand_name:   form.brand_name,
        description:  form.description,
        logo_url:     form.logo_url,
        phone:        form.phone,
        instagram:    form.instagram,
        facebook:     form.facebook,
        twitter:      form.twitter,
        tiktok:       form.tiktok,
        avatar_url:   form.avatar_url,
        country_code: form.country_code,
        country_name: form.country_name,
        state_code:   form.state_code,
        state_name:   form.state_name,
        city:         form.city,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg,#ef4444,#ff6b6b,transparent)" }} />
        <div style={{
          padding: "24px 28px 0",
          background: "linear-gradient(180deg,rgba(239,68,68,0.06) 0%,transparent 100%)",
        }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
            Your brand is missing:{" "}
            <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{missingLabels}</span>.
          </p>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}>
                Profile completion
              </span>
              <span style={{ color: "#ef4444", fontSize: 10, fontWeight: 800 }}>{pct}%</span>
            </div>
            <div style={{
              height: 4,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 99,
              overflow: "hidden",
            }}>
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg,#ef4444,#ff6b6b)",
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ padding: "4px 28px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 9,
              padding: "9px 13px",
              color: "#ef4444",
              fontSize: 11,
            }}>
              {error}
            </div>
          )}

          {/* Avatar */}
          {missing.includes("avatar_url") && (
            <div>
              <label style={{
                color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 6,
              }}>
                Profile Photo
              </label>
              <ImageUpload
                folder="avatars"
                shape="circle"
                label="Upload Photo"
                preview={form.avatar_url}
                onUpload={(url) => setForm({ ...form, avatar_url: url })}
              />
            </div>
          )}

          {/* Brand Name */}
          {missing.includes("brand_name") && (
            <div>
              <label style={{
                color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 5,
              }}>
                Brand Name
              </label>
              <input
                type="text"
                placeholder="e.g. BLVCK Studios"
                value={form.brand_name}
                onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                style={inp}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          )}

          {/* Description */}
          {missing.includes("description") && (
            <div>
              <label style={{
                color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 5,
              }}>
                Brand Description
              </label>
              <textarea
                placeholder="Tell buyers what your brand is about..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
          )}

          {/* Phone */}
          {missing.includes("phone") && (
            <div>
              <label style={{
                color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 5,
              }}>
                Contact Phone
              </label>
              <PhoneInput
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                onValidChange={(ok) => setPhoneValid(ok)}
              />
            </div>
          )}

          {/* Logo */}
          {missing.includes("logo_url") && (
            <div>
              <label style={{
                color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 5,
              }}>
                Brand Logo
              </label>
              <ImageUpload
                folder="brands"
                shape="square"
                label="Upload Logo"
                preview={form.logo_url}
                onUpload={(url) => setForm({ ...form, logo_url: url })}
              />
            </div>
          )}

          {/* Location — uses useGeo hook ✅ */}
          {missing.includes("country_code") && (
            <div>
              <label style={{
                color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 5,
              }}>
                Your Location
              </label>

              {/* Show loader while geo data loads */}
              {!loaded ? (
                <div style={{
                  padding: "11px 14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 9,
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 12,
                  fontFamily: "monospace",
                  letterSpacing: "0.1em",
                }}>
                  Loading countries...
                </div>
              ) : (
                <>
                  {/* Country select */}
                  <select
                    value={form.country_code}
                    onChange={(e) => {
                      const c = Country.getCountryByCode(e.target.value);
                      setForm({
                        ...form,
                        country_code: e.target.value,
                        country_name: c?.name || "",
                        state_code: "",
                        state_name: "",
                        city: "",
                      });
                    }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#111",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: form.country_code ? "#fff" : "rgba(255,255,255,0.35)",
                      fontSize: 13,
                      padding: "11px 14px",
                      borderRadius: 9,
                      outline: "none",
                      fontFamily: "inherit",
                      cursor: "pointer",
                      appearance: "none",
                      colorScheme: "dark",
                      marginBottom: 8,
                    }}
                  >
                    <option value="" style={{ background: "#111", color: "rgba(255,255,255,0.4)" }}>
                      Select country…
                    </option>
                    {Country.getAllCountries().map((c) => (
                      <option key={c.isoCode} value={c.isoCode} style={{ background: "#111", color: "#fff" }}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>

                  {/* State select — only show when country selected */}
                  {form.country_code &&
                    State.getStatesOfCountry(form.country_code).length > 0 && (
                      <select
                        value={form.state_code}
                        onChange={(e) => {
                          const s = State.getStateByCodeAndCountry(e.target.value, form.country_code);
                          setForm({
                            ...form,
                            state_code: e.target.value,
                            state_name: s?.name || "",
                            city: "",
                          });
                        }}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          background: "#111",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: form.state_code ? "#fff" : "rgba(255,255,255,0.35)",
                          fontSize: 13,
                          padding: "11px 14px",
                          borderRadius: 9,
                          outline: "none",
                          fontFamily: "inherit",
                          cursor: "pointer",
                          appearance: "none",
                          colorScheme: "dark",
                        }}
                      >
                        <option value="" style={{ background: "#111", color: "rgba(255,255,255,0.4)" }}>
                          Select state / region… (optional)
                        </option>
                        {State.getStatesOfCountry(form.country_code).map((s) => (
                          <option key={s.isoCode} value={s.isoCode} style={{ background: "#111", color: "#fff" }}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}

                  {/* Location preview */}
                  {form.country_name && (
                    <p style={{ color: "rgba(99,102,241,0.6)", fontSize: 10, margin: "7px 0 0" }}>
                      📍 {[form.state_name, form.country_name].filter(Boolean).join(", ")}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Social Media */}
          {(missing.includes("instagram") ||
            missing.includes("facebook") ||
            missing.includes("twitter") ||
            missing.includes("tiktok")) && (
            <div>
              <label style={{
                color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 5,
              }}>
                Social Media (at least one)
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["instagram", "facebook", "twitter", "tiktok"].map((s) => (
                  <input
                    key={s}
                    type="text"
                    placeholder={s}
                    value={form[s]}
                    onChange={(e) => setForm({ ...form, [s]: e.target.value.replace("@", "") })}
                    style={inp}
                    onFocus={focus}
                    onBlur={blur}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                background: saving ? "#7f1d1d" : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "13px",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save & Continue →"}
            </button>
            <button
              onClick={onSkip}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.35)",
                borderRadius: 9,
                padding: "13px 18px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Access Restricted ─────────────────────────────────────────────────────────
function AccessRestricted({ message, onLogout }) {
  return (
    <div style={{
      height: "100vh",
      background: "#070707",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0f0f0f",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 20,
          padding: "40px 36px",
          textAlign: "center",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.1)",
            border: "2px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg width="32" height="32" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </motion.div>
        <p style={{
          color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700,
          letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 10,
        }}>
          Access Denied
        </p>
        <h2 style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "1.9rem",
          color: "#fff",
          letterSpacing: "0.04em",
          lineHeight: 1.1,
          marginBottom: 14,
        }}>
          WRONG <span style={{ color: "#ef4444" }}>DASHBOARD</span>
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
          {message || "This dashboard is restricted to brand accounts."}
        </p>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "13px",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
        >
          Log Out &amp; Switch Account
        </button>
      </motion.div>
    </div>
  );
}

// ── Subscription Blocked Screen ───────────────────────────────────────────────
function SubscriptionBlocked({ status, onLogout }) {
  const navigate = useNavigate();

  const config = {
    none: {
      icon: "⏳",
      iconColor: "#f59e0b",
      iconBg: "rgba(245,158,11,0.1)",
      iconBorder: "rgba(245,158,11,0.3)",
      badge: "Payment Pending Verification",
      badgeColor: "rgba(245,158,11,0.3)",
      badgeText: "#f59e0b",
      headline: ["PAYMENT UNDER", "REVIEW"],
      accentWord: 1,
      accentColor: "#f59e0b",
      body: "Your bank transfer has been received and is currently being reviewed by our team. This process typically takes 24–72 hours and will not exceed 7 business days. You'll receive a confirmation email at your registered address once your subscription is activated.",
      tip: "Do NOT make another payment. If it's been over 7 business days, contact us at blvckmrkt.market@gmail.com with your submission reference.",
      tipColor: "rgba(245,158,11,0.15)",
      tipBorder: "rgba(245,158,11,0.25)",
      tipTextColor: "rgba(245,158,11,0.8)",
      primaryBtn: null,
      secondaryLabel: "Log Out",
      secondaryAction: onLogout,
    },
    expired: {
      icon: "📅",
      iconColor: "#ef4444",
      iconBg: "rgba(239,68,68,0.1)",
      iconBorder: "rgba(239,68,68,0.3)",
      badge: "Subscription Expired",
      badgeColor: "rgba(239,68,68,0.2)",
      badgeText: "#ef4444",
      headline: ["YOUR PLAN HAS", "EXPIRED"],
      accentWord: 1,
      accentColor: "#ef4444",
      body: "Your BLVCKMRKT subscription has reached its end date and your dashboard access has been paused. Renew your plan to instantly restore full access to your brand studio, products, orders, and analytics.",
      tip: "Your products and data are safe — nothing is deleted. Renewing restores everything instantly.",
      tipColor: "rgba(255,255,255,0.03)",
      tipBorder: "rgba(255,255,255,0.08)",
      tipTextColor: "rgba(255,255,255,0.4)",
      primaryBtn: { label: "Renew Subscription →", action: () => navigate("/subscribe") },
      secondaryLabel: "Log Out",
      secondaryAction: onLogout,
    },
    cancelled: {
      icon: "🚫",
      iconColor: "#64748b",
      iconBg: "rgba(100,116,139,0.1)",
      iconBorder: "rgba(100,116,139,0.3)",
      badge: "Subscription Cancelled",
      badgeColor: "rgba(100,116,139,0.15)",
      badgeText: "#64748b",
      headline: ["SUBSCRIPTION", "CANCELLED"],
      accentWord: 1,
      accentColor: "#94a3b8",
      body: "Your BLVCKMRKT subscription has been cancelled and your dashboard access has been revoked. If this was a mistake or you'd like to come back, you can resubscribe at any time — your brand profile and history will still be here waiting.",
      tip: "Changed your mind? Resubscribing is quick and your previous brand data remains intact.",
      tipColor: "rgba(255,255,255,0.03)",
      tipBorder: "rgba(255,255,255,0.08)",
      tipTextColor: "rgba(255,255,255,0.4)",
      primaryBtn: { label: "Resubscribe Now →", action: () => navigate("/subscribe") },
      secondaryLabel: "Log Out",
      secondaryAction: onLogout,
    },
  };

  const c = config[status] || config.none;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070707",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "system-ui, sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${c.accentColor}, transparent)` }} />

        <div style={{ padding: "36px 32px 32px" }}>
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: c.iconBg,
              border: `2px solid ${c.iconBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "2rem",
            }}
          >
            {c.icon}
          </motion.div>

          {/* Status badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <span style={{
              background: c.badgeColor,
              color: c.badgeText,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              padding: "4px 12px",
              borderRadius: 99,
              border: `1px solid ${c.badgeColor}`,
            }}>
              {c.badge}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            color: "#fff",
            letterSpacing: "0.05em",
            lineHeight: 1.1,
            textAlign: "center",
            margin: "0 0 16px",
          }}>
            {c.headline[0]}{" "}
            <span style={{ color: c.accentColor }}>{c.headline[1]}</span>
          </h1>

          {/* Body */}
          <p style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 13,
            lineHeight: 1.8,
            textAlign: "center",
            margin: "0 0 20px",
          }}>
            {c.body}
          </p>

          {/* Tip box */}
          <div style={{
            background: c.tipColor,
            border: `1px solid ${c.tipBorder}`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 24,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}>
            <span style={{ fontSize: "0.95rem", flexShrink: 0, marginTop: 1 }}>
              {status === "none" ? "⚠️" : "💡"}
            </span>
            <p style={{
              color: c.tipTextColor,
              fontSize: 11,
              lineHeight: 1.7,
              margin: 0,
            }}>
              {c.tip}
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {c.primaryBtn && (
              <button
                onClick={c.primaryBtn.action}
                style={{
                  width: "100%",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
              >
                {c.primaryBtn.label}
              </button>
            )}
            <button
              onClick={c.secondaryAction}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.35)",
                borderRadius: 10,
                padding: "13px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.35)";
              }}
            >
              {c.secondaryLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Root Brand Dashboard ──────────────────────────────────────────────────────
export default function BrandDashboard() {
  const { logout } = useAuth();
  const [activeSection, setActiveSection]     = useState("overview");
  const [brand, setBrand]                     = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [accessError, setAccessError]         = useState(null);
  const [notifications, setNotifications]     = useState([]);
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  const [showProfilePop, setShowProfilePop]   = useState(false);
const [showLogoutModal, setShowLogoutModal] = useState(false);
const [subscriptionStatus, setSubscriptionStatus] = useState(null);

const BLOCKED_STATUSES = ["none", "expired", "cancelled"];

useEffect(() => {
  getBrandProfile()
    .then((b) => {
      setBrand(b);
      const status = b?.subscription_status || "none";
      setSubscriptionStatus(status);
      // Only show profile popup if subscription allows dashboard access
      if (!BLOCKED_STATUSES.includes(status) && getMissingFields(b).length > 0) {
        setTimeout(() => setShowProfilePop(true), 800);
      }
    })
    .catch((err) => {
      if (err.message?.toLowerCase().includes("restricted")) setAccessError(err.message);
      else console.error(err);
    })
    .finally(() => setLoading(false));
}, []);

  useEffect(() => {
    getNotifications()
      .then((data) => setNotifications(data?.notifications || []))
      .catch(() => {});
  }, []);

  const goTo              = (id) => setActiveSection(id);
  const handleBrandUpdate = (updated) => setBrand(updated);
  const handleLogoutClick   = () => setShowLogoutModal(true);
  const handleLogoutConfirm = async () => { await logout(); };
  const handleLogoutCancel  = () => setShowLogoutModal(false);

  const handleMarkOneRead = async (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );
    try {
      if (notif.kind === "broadcast") {
        await markBroadcastRead(notif.id);
      } else {
        await markOneRead(notif.id);
      }
    } catch (e) {
      console.error(e);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: false } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllRead();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoToNotification = (notif) => {
    if (!notif.is_read) handleMarkOneRead(notif);
    setSelectedNotifId(notif.id);
    goTo("notifications");
  };

  const handleProfileDone = (updatedBrand) => {
    setShowProfilePop(false);
    if (updatedBrand) setBrand((prev) => ({ ...prev, ...updatedBrand }));
  };

  // ✅ All sections wrapped in Suspense — lazy loads on first visit
  const renderSection = () => (
    <Suspense fallback={<SectionLoader />}>
      {(() => {
        switch (activeSection) {
          case "overview":
            return <Overview onNav={goTo} />;
          case "products":
            return <Products />;
          case "shop":
            return <Shop brandID={brand?.brand_id} onNav={goTo} />;
          case "orders":
            return <Orders />;
          case "analytics":
            return <Analytics />;
          case "wishlist":
            return <Wishlist />;
          case "addresses":
            return <Addresses />;
          case "shipping":
            return <Shipping />;
          case "local_shipping":
            return <LocalShipping />;
          case "bank_account":
            return <BankAccount />;
          case "settings":
            return <Settings onBrandUpdate={handleBrandUpdate} />;
          case "notifications":
            return (
              <Notifications
                autoOpenId={selectedNotifId}
                notifications={notifications}
                onNotificationsUpdate={(updated) => setNotifications(updated)}
              />
            );
          default:
            return <Overview onNav={goTo} />;
        }
      })()}
    </Suspense>
  );

if (accessError) return <AccessRestricted message={accessError} onLogout={logout} />;

if (!loading && subscriptionStatus && BLOCKED_STATUSES.includes(subscriptionStatus)) {
  return <SubscriptionBlocked status={subscriptionStatus} onLogout={logout} />;
}

  return (
    <div style={{
      height: "100vh",
      overflow: "hidden",
      background: "#070707",
      fontFamily: "system-ui,sans-serif",
      display: "flex",
    }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @media (min-width:769px) { .brand-sidebar-desktop { display:block !important; } }
        @media (max-width:768px) { .brand-main { padding-left:20px !important; padding-right:20px !important; } }
        select option { background: #111 !important; color: #fff !important; }
        select option:checked { background: #ef4444 !important; color: #fff !important; }
      `}</style>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <LogoutConfirmationModal
            onConfirm={handleLogoutConfirm}
            onCancel={handleLogoutCancel}
          />
        )}
      </AnimatePresence>

      {/* Profile Completion Popup */}
      <AnimatePresence>
        {showProfilePop && brand && (
          <BrandProfileCompletePopup
            brand={brand}
            onDone={handleProfileDone}
            onSkip={() => setShowProfilePop(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div style={{ display: "none" }} className="brand-sidebar-desktop">
        <Sidebar
          active={activeSection}
          onNav={goTo}
          onLogout={handleLogoutClick}
          brand={brand}
          unreadCount={notifications.filter((n) => !n.is_read).length}
        />
      </div>

      {/* Main content */}
      <main
        className="brand-main"
        style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", padding: "0 0 60px" }}
      >
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "#070707",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "10px 32px",
        }}>
          <TopBar
            title={PAGE_TITLES[activeSection]}
            brand={brand}
            onNav={goTo}
            onLogout={handleLogoutClick}
            activeNav={activeSection}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onGoToNotifications={() => {
              setSelectedNotifId(null);
              goTo("notifications");
            }}
            onGoToNotification={handleGoToNotification}
          />
        </div>

        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 15px 0" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}