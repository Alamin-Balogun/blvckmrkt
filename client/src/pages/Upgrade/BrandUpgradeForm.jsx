import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const TOKEN_KEY = "blvck_token";

export default function BrandUpgradeForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    brandName: "",
    phone: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const token =
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY) ||
    "";

  const validate = () => {
    const e = {};
    if (!form.brandName.trim()) e.brandName = "Brand name is required";
    if (form.brandName.trim().length < 2) e.brandName = "Brand name must be at least 2 characters";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.description.trim()) e.description = "Tell us a bit about your brand";
    if (form.description.trim().length < 20) e.description = "Please write at least 20 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    setApiError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/buyer/upgrade-to-brand`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            brand_name:  form.brandName.trim(),
            phone:       form.phone.trim(),
            description: form.description.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.message || "Something went wrong. Please try again.");
        return;
      }

// ✅ Save brand name so the partnership agreement page can read it
localStorage.setItem("brand_name", form.brandName.trim());

// ✅ Update token — MUST happen before redirect so auth context re-reads it
if (data.data?.token) {
  // Check which storage had the old token
  const wasInLocal = !!localStorage.getItem(TOKEN_KEY);
  // Remove old token from both storages to avoid stale reads
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  // Write new brand token to the correct storage
  if (wasInLocal) {
    localStorage.setItem(TOKEN_KEY, data.data.token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, data.data.token);
  }
}

// ✅ HARD redirect — forces full app remount so auth context
// re-reads the new brand token and renders brand sidebar/dashboard
// DO NOT use navigate() here — it keeps the old auth state in memory
// Straight to the partnership agreement — the subscription/plan-picking
// step this used to go through has been removed. The agreement page
// always re-fetches the current registered brand name itself, so no
// brandName needs to be carried across this redirect.
window.location.href = `/brand-partnership-agreement`;

    } catch {
      setApiError("Cannot reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const inp = (hasErr) => ({
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasErr ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
    color: "#fff", fontSize: 13, padding: "13px 16px",
    outline: "none", width: "100%", boxSizing: "border-box",
    borderRadius: 10, transition: "border-color 0.2s",
    fontFamily: "inherit",
  });

  return (
    <div style={{
      minHeight: "100vh", background: "#050505",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "60px 24px", fontFamily: "system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        opacity: 0.025,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Red glow */}
      <div style={{
        position: "fixed", top: "-10%", right: "-5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(239,68,68,0.08) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 1 }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate("/dashboard/buyer")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            padding: 0, marginBottom: 32, transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: "0.32em", color: "#ef4444",
            textTransform: "uppercase", marginBottom: 10,
          }}>
            // Brand Upgrade
          </p>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(2.2rem, 6vw, 3.2rem)",
            color: "#fff", letterSpacing: "0.04em",
            lineHeight: 1, marginBottom: 12,
          }}>
            SET UP YOUR<br />
            <span style={{ color: "#ef4444" }}>BRAND PROFILE</span>
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7,
          }}>
            Tell us about your brand. You'll pick a subscription plan and sign our
            partnership agreement on the next steps.
          </p>
        </div>

        {/* Steps indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 28,
        }}>
          {[
            { num: "01", label: "Brand Info", active: true },
            { num: "02", label: "Agreement", active: false },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                opacity: s.active ? 1 : 0.35,
              }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 8,
                  color: s.active ? "#ef4444" : "rgba(255,255,255,0.3)",
                  background: s.active ? "rgba(239,68,68,0.1)" : "transparent",
                  border: `1px solid ${s.active ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                  padding: "2px 6px",
                }}>
                  {s.num}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: s.active ? "#fff" : "rgba(255,255,255,0.25)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                  {s.label}
                </span>
              </div>
              {i < 1 && (
                <div style={{ width: 16, height: 1, background: "rgba(255,255,255,0.1)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "28px 28px",
        }}>

          {/* API Error */}
          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 10, padding: "10px 14px",
                  marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span style={{ color: "#ef4444", fontSize: 12 }}>{apiError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Brand Name */}
            <div>
              <label style={{
                display: "block", color: "rgba(255,255,255,0.35)",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
                textTransform: "uppercase", marginBottom: 7,
              }}>
                Brand Name *
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)", color: "#ef4444",
                  display: "flex", pointerEvents: "none",
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="e.g. Corteiz, Palace, Your Brand"
                  value={form.brandName}
                  onChange={e => { setForm({ ...form, brandName: e.target.value }); setErrors({ ...errors, brandName: "" }); }}
                  style={{ ...inp(errors.brandName), paddingLeft: 40 }}
                  onFocus={e => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                  onBlur={e => (e.target.style.borderColor = errors.brandName ? "#ef4444" : "rgba(255,255,255,0.1)")}
                />
              </div>
              {errors.brandName && (
                <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4 }}>{errors.brandName}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label style={{
                display: "block", color: "rgba(255,255,255,0.35)",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
                textTransform: "uppercase", marginBottom: 7,
              }}>
                Phone Number *
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)", color: "#ef4444",
                  display: "flex", pointerEvents: "none",
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <input
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={e => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }}
                  style={{ ...inp(errors.phone), paddingLeft: 40 }}
                  onFocus={e => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                  onBlur={e => (e.target.style.borderColor = errors.phone ? "#ef4444" : "rgba(255,255,255,0.1)")}
                />
              </div>
              {errors.phone && (
                <p style={{ color: "#ef4444", fontSize: 10, marginTop: 4 }}>{errors.phone}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={{
                display: "block", color: "rgba(255,255,255,0.35)",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
                textTransform: "uppercase", marginBottom: 7,
              }}>
                Brand Description *
              </label>
              <textarea
                placeholder="Tell us what your brand is about — your style, your story, what you sell..."
                value={form.description}
                onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: "" }); }}
                rows={4}
                style={{
                  ...inp(errors.description),
                  resize: "vertical", minHeight: 100,
                  lineHeight: 1.6,
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                onBlur={e => (e.target.style.borderColor = errors.description ? "#ef4444" : "rgba(255,255,255,0.1)")}
              />
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginTop: 4,
              }}>
                {errors.description ? (
                  <p style={{ color: "#ef4444", fontSize: 10, margin: 0 }}>{errors.description}</p>
                ) : (
                  <span />
                )}
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 9,
                  color: form.description.length >= 20
                    ? "rgba(34,197,94,0.6)"
                    : "rgba(255,255,255,0.2)",
                }}>
                  {form.description.length} chars
                </span>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                width: "100%", padding: "15px 20px",
                background: loading ? "#7f1d1d" : "#ef4444",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 11, fontWeight: 900, letterSpacing: "0.22em",
                textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 4,
              }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                    style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                  Setting Up Your Brand...
                </>
              ) : (
                "Continue to Subscription Plans →"
              )}
            </motion.button>
          </div>
        </div>

        <p style={{
          fontFamily: "'Space Mono', monospace", fontSize: 8,
          color: "rgba(255,255,255,0.15)", textAlign: "center",
          marginTop: 16, letterSpacing: "0.1em",
        }}>
          // Your account converts to a brand account immediately — next you'll sign the partnership agreement
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}