import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  getSettings,
  saveSettings,
  clearSessions,
  flushCache,
  exportData,
  getBrands,
  updateBrandCommission,
} from "./dashboard_components/api";

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({value, onChange}) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 99,
        background: value ? "#ef4444" : "rgba(255,255,255,0.1)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
        border: `1px solid ${value ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
      }}>
      <motion.div
        animate={{x: value ? 22 : 2}}
        transition={{type: "spring", stiffness: 500, damping: 30}}
        style={{
          position: "absolute",
          top: 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function SettingInput({value, onChange, type = "text", placeholder, suffix}) {
  const base = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 13,
    padding: "10px 13px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };
  const onF = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)");
  const onB = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

  if (type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        style={{...base, resize: "vertical"}}
        onFocus={onF}
        onBlur={onB}
      />
    );
  }
  if (suffix) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 9,
          overflow: "hidden",
        }}>
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{...base, border: "none", background: "transparent", flex: 1}}
          onFocus={onF}
          onBlur={onB}
        />
        <span
          style={{
            padding: "0 12px",
            color: "rgba(255,255,255,0.3)",
            fontSize: 12,
            borderLeft: "1px solid rgba(255,255,255,0.08)",
          }}>
          {suffix}
        </span>
      </div>
    );
  }
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={base}
      onFocus={onF}
      onBlur={onB}
    />
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function SettingSelect({value, onChange, options}) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        fontSize: 13,
        padding: "10px 13px",
        borderRadius: 9,
        outline: "none",
        fontFamily: "inherit",
      }}>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({title, desc, children}) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 14,
      }}>
      <div style={{padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
        <p style={{color: "#fff", fontSize: 13, fontWeight: 800, margin: "0 0 3px"}}>{title}</p>
        {desc && <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>{desc}</p>}
      </div>
      <div style={{padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16}}>
        {children}
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function Row({label, desc, children}) {
  return (
    <div
      style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20}}>
      <div style={{flex: 1}}>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 12,
            fontWeight: 700,
            margin: "0 0 3px",
          }}>
          {label}
        </p>
        {desc && (
          <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0, lineHeight: 1.5}}>
            {desc}
          </p>
        )}
      </div>
      <div style={{flexShrink: 0, maxWidth: 280, width: "100%"}}>{children}</div>
    </div>
  );
}

// ── Danger button ─────────────────────────────────────────────────────────────
function DangerBtn({label, onClick, loading}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "9px 16px",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.2)",
        color: loading ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.7)",
        borderRadius: 9,
        fontSize: 11,
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = "rgba(239,68,68,0.15)";
          e.currentTarget.style.color = "#ef4444";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(239,68,68,0.08)";
        e.currentTarget.style.color = loading ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.7)";
      }}>
      {loading ? "Working…" : label}
    </button>
  );
}

// ── Brand Commission Manager ──────────────────────────────────────────────────
function BrandCommissionManager() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    getBrands()
      .then((d) => setBrands(Array.isArray(d) ? d : d?.brands || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleUpdate = async (brandId, rate) => {
    setSaving(brandId);
    try {
      await updateBrandCommission(brandId, rate);
      setBrands((prev) =>
        prev.map((b) => (b.id === brandId ? {...b, commission_rate: rate} : b))
      );
      showToast(rate === null ? "Reset to platform default" : "Commission updated");
    } catch (e) {
      alert(e.message || "Failed to update commission");
    } finally {
      setSaving(null);
    }
  };

  const inp = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 12,
    padding: "8px 12px",
    outline: "none",
    borderRadius: 7,
    fontFamily: "inherit",
    width: 80,
    textAlign: "center",
  };

  if (loading)
    return (
      <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, padding: "12px 0"}}>
        Loading brands...
      </p>
    );

  if (brands.length === 0)
    return (
      <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, padding: "12px 0"}}>
        No brands yet.
      </p>
    );

  return (
    <div style={{position: "relative"}}>
      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        {brands.map((brand) => (
          <div
            key={brand.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 9,
            }}>
            <div style={{flex: 1, minWidth: 0}}>
              <p
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  margin: "0 0 2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {brand.brand_name}
              </p>
              <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0}}>
                {brand.commission_rate !== null && brand.commission_rate !== undefined
                  ? `Custom: ${brand.commission_rate}%`
                  : "Using platform default"}
              </p>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
              <input
                type="number"
                min="0"
                max="99"
                step="0.1"
                value={brand.commission_rate ?? ""}
                placeholder="Default"
                onChange={(e) => {
                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                  setBrands((prev) =>
                    prev.map((b) => (b.id === brand.id ? {...b, commission_rate: val} : b))
                  );
                }}
                disabled={saving === brand.id}
                style={inp}
              />
              <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>%</span>
              <button
                onClick={() => handleUpdate(brand.id, brand.commission_rate)}
                disabled={saving === brand.id}
                style={{
                  padding: "7px 14px",
                  background: saving === brand.id ? "#7f1d1d" : "#ef4444",
                  border: "none",
                  color: "#fff",
                  borderRadius: 7,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: saving === brand.id ? "not-allowed" : "pointer",
                  minWidth: 60,
                }}>
                {saving === brand.id ? "..." : "Save"}
              </button>
              {brand.commission_rate !== null && brand.commission_rate !== undefined && (
                <button
                  onClick={() => handleUpdate(brand.id, null)}
                  disabled={saving === brand.id}
                  style={{
                    padding: "7px 12px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.4)",
                    borderRadius: 7,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: saving === brand.id ? "not-allowed" : "pointer",
                  }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 10}}
            style={{
              position: "absolute",
              top: -60,
              right: 0,
              background: "#22c55e",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              padding: "8px 16px",
              borderRadius: 8,
              boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
              zIndex: 10,
            }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
  site_name: "BLVCKMRKT",
  site_tagline: "The marketplace for underground culture",
  support_email: "support@blvckmrkt.com",
  support_phone: "",
  timezone: "Africa/Lagos",
  currency: "NGN",
  currency_symbol: "₦",
  allow_guest_checkout: false,
  auto_approve_reviews: false,
  review_moderation: true,
  max_cart_items: 20,
  low_stock_threshold: 5,
  enable_wishlist: true,
  enable_drops: true,
  drop_countdown: true,
  commission_rate: 10,
  require_email_verify: true,
  allow_social_login: true,
  session_timeout_days: 30,
  max_login_attempts: 5,
  require_phone: false,
  allow_brand_self_register: true,
  email_provider: "sendgrid",
  from_email: "noreply@blvckmrkt.com",
  from_name: "BLVCKMRKT",
  send_welcome_email: true,
  send_order_confirm: true,
  send_drop_alerts: true,
  send_marketing: false,
  maintenance_mode: false,
  maintenance_message: "We're updating the platform. Back soon.",
  allow_admin_access: true,
  read_only_mode: false,
  disable_new_signups: false,
  disable_purchases: false,
};

const TABS = [
  {id: "general", label: "General"},
  {id: "commerce", label: "Commerce"},
  {id: "auth", label: "Auth & Security"},
  {id: "email", label: "Email"},
  {id: "maintenance", label: "Maintenance"},
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [tab, setTab] = useState("general");
  const [values, setValues] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Danger zone loading states
  const [dLoading, setDLoading] = useState({sessions: false, cache: false, export: false});

  useEffect(() => {
    getSettings()
      .then((d) => {
        const raw = d?.settings ?? d ?? {};
        setValues({...DEFAULTS, ...raw});
      })
      .catch((e) => setError(e.message || "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (val) => setValues((v) => ({...v, [key]: val}));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await saveSettings(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || "Failed to save settings");
    }
    setSaving(false);
  };

  const handleDanger = async (key, fn, confirm_msg) => {
    if (!window.confirm(confirm_msg)) return;
    setDLoading((d) => ({...d, [key]: true}));
    try {
      await fn();
    } catch (e) {
      setError(e.message || "Action failed");
    }
    setDLoading((d) => ({...d, [key]: false}));
  };

  if (loading)
    return <p style={{color: "rgba(255,255,255,0.3)", fontSize: 13}}>Loading settings…</p>;

  const TABS_CONTENT = {
    general: (
      <>
        <Section title="Platform Identity" desc="Core site information shown to users">
          <Row label="Site Name" desc="Displayed in the browser tab and emails">
            <SettingInput
              value={values.site_name}
              onChange={set("site_name")}
              placeholder="Site name"
            />
          </Row>
          <Row label="Tagline" desc="Short description of the platform">
            <SettingInput
              value={values.site_tagline}
              onChange={set("site_tagline")}
              placeholder="Tagline"
            />
          </Row>
          <Row label="Support Email">
            <SettingInput
              value={values.support_email}
              onChange={set("support_email")}
              type="email"
            />
          </Row>
          <Row label="Support Phone">
            <SettingInput
              value={values.support_phone}
              onChange={set("support_phone")}
              placeholder="+234..."
            />
          </Row>
        </Section>
        <Section title="Regional" desc="Localisation and currency settings">
          <Row label="Timezone">
            <SettingSelect
              value={values.timezone}
              onChange={set("timezone")}
              options={[
                ["Africa/Lagos", "Africa/Lagos (WAT)"],
                ["UTC", "UTC"],
                ["Europe/London", "Europe/London"],
                ["America/New_York", "America/New_York"],
              ]}
            />
          </Row>
          <Row label="Currency Code">
            <SettingInput value={values.currency} onChange={set("currency")} placeholder="NGN" />
          </Row>
          <Row label="Currency Symbol">
            <SettingInput
              value={values.currency_symbol}
              onChange={set("currency_symbol")}
              placeholder="₦"
            />
          </Row>
        </Section>
      </>
    ),
    commerce: (
      <>
        <Section title="Checkout & Cart" desc="Controls for the buying experience">
          <Row label="Guest Checkout" desc="Let unregistered users complete purchases">
            <Toggle value={!!values.allow_guest_checkout} onChange={set("allow_guest_checkout")} />
          </Row>
          <Row label="Max Cart Items" desc="Maximum products a user can add to cart">
            <SettingInput
              value={values.max_cart_items}
              onChange={set("max_cart_items")}
              type="number"
            />
          </Row>
          <Row label="Low Stock Threshold" desc="Warn brand when stock drops below this">
            <SettingInput
              value={values.low_stock_threshold}
              onChange={set("low_stock_threshold")}
              type="number"
              suffix="units"
            />
          </Row>
          <Row
            label="Platform Commission (Default)"
            desc="Deducted from each brand's listed price, then re-added at checkout as a buyer-facing Tax line. Can be overridden per brand below.">
            <SettingInput
              value={values.commission_rate}
              onChange={set("commission_rate")}
              type="number"
              suffix="%"
            />
          </Row>
          <Row label="Disable Purchases" desc="Temporarily block all new purchases">
            <Toggle value={!!values.disable_purchases} onChange={set("disable_purchases")} />
          </Row>
        </Section>

        {/* ✅ NEW: Brand-Specific Commission Rates */}
        <Section
          title="Brand-Specific Commission Rates"
          desc="Override platform default for individual brands — leave blank to use platform rate">
          <BrandCommissionManager />
        </Section>

        <Section title="Drops" desc="Settings for the drops feature">
          <Row label="Enable Drops" desc="Show the drops section to users">
            <Toggle value={!!values.enable_drops} onChange={set("enable_drops")} />
          </Row>
          <Row label="Show Countdown Timers" desc="Display countdown on active drops">
            <Toggle value={!!values.drop_countdown} onChange={set("drop_countdown")} />
          </Row>
        </Section>
        <Section title="Reviews & Wishlist">
          <Row label="Wishlist Enabled" desc="Users can save products to a wishlist">
            <Toggle value={!!values.enable_wishlist} onChange={set("enable_wishlist")} />
          </Row>
          <Row label="Review Moderation" desc="Admin must approve reviews before they appear">
            <Toggle value={!!values.review_moderation} onChange={set("review_moderation")} />
          </Row>
          <Row label="Auto-approve Reviews" desc="Skip moderation and publish reviews instantly">
            <Toggle value={!!values.auto_approve_reviews} onChange={set("auto_approve_reviews")} />
          </Row>
        </Section>
      </>
    ),
    auth: (
      <>
        <Section title="Registration" desc="Control who can sign up and how">
          <Row
            label="Require Email Verification"
            desc="Users must verify before accessing the platform">
            <Toggle value={!!values.require_email_verify} onChange={set("require_email_verify")} />
          </Row>
          <Row label="Require Phone Number" desc="Phone number is mandatory during sign-up">
            <Toggle value={!!values.require_phone} onChange={set("require_phone")} />
          </Row>
          <Row label="Allow Social Login" desc="Enable Google / Apple sign-in options">
            <Toggle value={!!values.allow_social_login} onChange={set("allow_social_login")} />
          </Row>
          <Row label="Brand Self-Registration" desc="Brands can register without admin invitation">
            <Toggle
              value={!!values.allow_brand_self_register}
              onChange={set("allow_brand_self_register")}
            />
          </Row>
          <Row label="Disable New Sign-ups" desc="Temporarily block all new account creation">
            <Toggle value={!!values.disable_new_signups} onChange={set("disable_new_signups")} />
          </Row>
        </Section>
        <Section title="Session & Security">
          <Row label="Session Timeout" desc="How many days before users are logged out">
            <SettingInput
              value={values.session_timeout_days}
              onChange={set("session_timeout_days")}
              type="number"
              suffix="days"
            />
          </Row>
          <Row label="Max Login Attempts" desc="Lockout after this many failed attempts">
            <SettingInput
              value={values.max_login_attempts}
              onChange={set("max_login_attempts")}
              type="number"
              suffix="attempts"
            />
          </Row>
        </Section>
      </>
    ),
    email: (
      <>
        <Section title="Email Provider" desc="How transactional emails are sent">
          <Row label="Provider">
            <SettingSelect
              value={values.email_provider}
              onChange={set("email_provider")}
              options={[
                ["sendgrid", "SendGrid"],
                ["mailgun", "Mailgun"],
                ["resend", "Resend"],
                ["smtp", "Custom SMTP"],
              ]}
            />
          </Row>
          <Row label="From Email">
            <SettingInput value={values.from_email} onChange={set("from_email")} type="email" />
          </Row>
          <Row label="From Name">
            <SettingInput
              value={values.from_name}
              onChange={set("from_name")}
              placeholder="BLVCKMRKT"
            />
          </Row>
        </Section>
        <Section title="Email Triggers" desc="Which emails are sent automatically">
          <Row label="Welcome Email" desc="Send on successful registration">
            <Toggle value={!!values.send_welcome_email} onChange={set("send_welcome_email")} />
          </Row>
          <Row label="Order Confirmation" desc="Send when a purchase is completed">
            <Toggle value={!!values.send_order_confirm} onChange={set("send_order_confirm")} />
          </Row>
          <Row label="Drop Alerts" desc="Notify subscribers when a drop goes live">
            <Toggle value={!!values.send_drop_alerts} onChange={set("send_drop_alerts")} />
          </Row>
          <Row label="Marketing Emails" desc="Promotional messages and newsletters">
            <Toggle value={!!values.send_marketing} onChange={set("send_marketing")} />
          </Row>
        </Section>
      </>
    ),
    maintenance: (
      <>
        <Section title="Maintenance Mode" desc="Take the site offline temporarily">
          <Row
            label="Enable Maintenance Mode"
            desc="All non-admin visitors see the maintenance message">
            <Toggle value={!!values.maintenance_mode} onChange={set("maintenance_mode")} />
          </Row>
          {values.maintenance_mode && (
            <Row label="Maintenance Message" desc="Shown to users during maintenance">
              <SettingInput
                value={values.maintenance_message}
                onChange={set("maintenance_message")}
                type="textarea"
                placeholder="We'll be back soon..."
              />
            </Row>
          )}
          <Row label="Allow Admin Access" desc="Admins can still log in during maintenance">
            <Toggle value={!!values.allow_admin_access} onChange={set("allow_admin_access")} />
          </Row>
        </Section>
        <Section title="Platform Flags" desc="Emergency controls">
          <Row label="Read-Only Mode" desc="Users can browse but cannot purchase or post content">
            <Toggle value={!!values.read_only_mode} onChange={set("read_only_mode")} />
          </Row>
          <Row label="Disable Purchases" desc="No new orders can be placed">
            <Toggle value={!!values.disable_purchases} onChange={set("disable_purchases")} />
          </Row>
          <Row label="Disable New Sign-ups" desc="No new accounts can be created">
            <Toggle value={!!values.disable_new_signups} onChange={set("disable_new_signups")} />
          </Row>
        </Section>

        {/* Danger zone */}
        <div
          style={{
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 14,
            padding: "16px 20px",
          }}>
          <p style={{color: "#ef4444", fontSize: 13, fontWeight: 800, margin: "0 0 4px"}}>
            ⚠️ Danger Zone
          </p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "0 0 14px"}}>
            These actions are destructive. Some cannot be undone.
          </p>
          <div style={{display: "flex", gap: 10, flexWrap: "wrap"}}>
            <DangerBtn
              label="Clear All Sessions"
              loading={dLoading.sessions}
              onClick={() =>
                handleDanger(
                  "sessions",
                  clearSessions,
                  "This will log out ALL users immediately. Continue?",
                )
              }
            />
            <DangerBtn
              label="Flush Cache"
              loading={dLoading.cache}
              onClick={() =>
                handleDanger(
                  "cache",
                  flushCache,
                  "Flush the server cache? This may briefly slow the platform.",
                )
              }
            />
            <DangerBtn
              label="Export All Data"
              loading={dLoading.export}
              onClick={() =>
                handleDanger(
                  "export",
                  exportData,
                  "Download a full JSON export of all users, brands and orders?",
                )
              }
            />
          </div>
        </div>
      </>
    ),
  };

  return (
    <div>
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "11px 16px",
            marginBottom: 16,
            color: "#ef4444",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          {error}
          <button
            onClick={() => setError("")}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 16,
              padding: 0,
            }}>
            ×
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 22,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
          flexWrap: "wrap",
        }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 9,
              border: "none",
              background: tab === t.id ? "#ef4444" : "transparent",
              color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{opacity: 0, y: 8}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0}}
          transition={{duration: 0.15}}>
          {TABS_CONTENT[tab]}
        </motion.div>
      </AnimatePresence>

      {/* Sticky save bar */}
      <div
        style={{
          position: "sticky",
          bottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
        }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 28px",
            background: saved ? "#22c55e" : saving ? "#7f1d1d" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
          {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Settings"}
        </button>
        <button
          onClick={() => {
            setValues(DEFAULTS);
            setError("");
          }}
          style={{
            padding: "12px 20px",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}