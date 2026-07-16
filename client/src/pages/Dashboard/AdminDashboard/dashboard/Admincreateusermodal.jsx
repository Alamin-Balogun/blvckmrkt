import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {createUser} from "./dashboard_components/api";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp = {
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
  transition: "border-color 0.18s",
};
const onF = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
const onB = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

function Lbl({children, optional}) {
  return (
    <label
      style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        display: "block",
        marginBottom: 5,
      }}>
      {children}
      {optional && (
        <span
          style={{
            color: "rgba(255,255,255,0.2)",
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
            marginLeft: 4,
          }}>
          (optional)
        </span>
      )}
    </label>
  );
}

function Field({label, optional, children}) {
  return (
    <div style={{marginBottom: 12}}>
      <Lbl optional={optional}>{label}</Lbl>
      {children}
    </div>
  );
}

function TextInput({value, onChange, placeholder, type = "text"}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inp}
      onFocus={onF}
      onBlur={onB}
    />
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({label}) {
  return (
    <div style={{display: "flex", alignItems: "center", gap: 10, margin: "4px 0 12px"}}>
      <div style={{flex: 1, height: 1, background: "rgba(255,255,255,0.06)"}} />
      <span
        style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}>
        {label}
      </span>
      <div style={{flex: 1, height: 1, background: "rgba(255,255,255,0.06)"}} />
    </div>
  );
}

// ── Initial form state ────────────────────────────────────────────────────────
const BLANK = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  account_type: "user",
  phone: "",
  brand_name: "",
  description: "",
  logo_url: "",
  banner_url: "",
  website: "",
  instagram: "",
  facebook: "",
  twitter: "",
  tiktok: "",
  category: "",
  auto_verify: false,
};

// ── Modal ─────────────────────────────────────────────────────────────────────
export default function AdminCreateUserModal({onClose, onCreated, defaultAccountType = "user"}) {
  const [form, setForm] = useState({...BLANK, account_type: defaultAccountType});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (val) => setForm((f) => ({...f, [key]: val}));
  const isBrand = form.account_type === "brand";

  const handleSave = async () => {
    // Validate
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!form.password.trim() || form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isBrand && !form.brand_name.trim()) {
      setError("Brand name is required for brand accounts.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await createUser(form);
      onCreated?.(result);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create account.");
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(520px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        {/* Red accent bar */}
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#ef4444,transparent)",
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: "0 0 3px",
              }}>
              Admin Action
            </p>
            <p style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>Create Account</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div style={{padding: "20px 24px", flex: 1}}>
          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 9,
                padding: "10px 14px",
                color: "#ef4444",
                fontSize: 12,
                marginBottom: 16,
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
                  lineHeight: 1,
                }}>
                ×
              </button>
            </div>
          )}

          {/* Account type selector */}
          <Field label="Account Type">
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8}}>
              {[
                ["user", "Buyer"],
                ["brand", "Brand"],
              ].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => set("account_type")(val)}
                  style={{
                    padding: "12px",
                    borderRadius: 9,
                    border: `1px solid ${form.account_type === val ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                    background:
                      form.account_type === val ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke={form.account_type === val ? "#ef4444" : "rgba(255,255,255,0.3)"}
                    strokeWidth="1.8"
                    viewBox="0 0 24 24">
                    {val === "user" ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    )}
                  </svg>
                  <span
                    style={{
                      color: form.account_type === val ? "#ef4444" : "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </Field>

          <Divider label="Personal Info" />

          {/* Name row */}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>
            <div>
              <Lbl>First Name</Lbl>
              <TextInput value={form.first_name} onChange={set("first_name")} placeholder="John" />
            </div>
            <div>
              <Lbl>Last Name</Lbl>
              <TextInput value={form.last_name} onChange={set("last_name")} placeholder="Doe" />
            </div>
          </div>

          <Field label="Email">
            <TextInput
              value={form.email}
              onChange={set("email")}
              placeholder="user@example.com"
              type="email"
            />
          </Field>

          <Field label="Password" optional={false}>
            <TextInput
              value={form.password}
              onChange={set("password")}
              placeholder="Min 8 characters"
              type="password"
            />
          </Field>

          {/* ── Buyer-specific ─────────────────────────────────────────────── */}
          {!isBrand && (
            <Field label="Phone" optional>
              <TextInput value={form.phone} onChange={set("phone")} placeholder="+234..." />
            </Field>
          )}

          {/* ── Brand-specific ─────────────────────────────────────────────── */}
          {isBrand && (
            <>
              <Divider label="Brand Info" />

              <Field label="Brand Name">
                <TextInput
                  value={form.brand_name}
                  onChange={set("brand_name")}
                  placeholder="e.g. BLVCK Studios"
                />
              </Field>

              <Field label="Description" optional>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                  placeholder="What is this brand about..."
                  rows={3}
                  style={{...inp, resize: "vertical", lineHeight: 1.6}}
                  onFocus={onF}
                  onBlur={onB}
                />
              </Field>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}>
                <div>
                  <Lbl optional>Logo URL</Lbl>
                  <TextInput
                    value={form.logo_url}
                    onChange={set("logo_url")}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Lbl optional>Banner URL</Lbl>
                  <TextInput
                    value={form.banner_url}
                    onChange={set("banner_url")}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}>
                <div>
                  <Lbl optional>Website</Lbl>
                  <TextInput
                    value={form.website}
                    onChange={set("website")}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Lbl optional>Category</Lbl>
                  <TextInput
                    value={form.category}
                    onChange={set("category")}
                    placeholder="e.g. Streetwear"
                  />
                </div>
              </div>

              <Divider label="Social Media" />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}>
                {[
                  ["instagram", "Instagram"],
                  ["facebook", "Facebook"],
                  ["twitter", "Twitter / X"],
                  ["tiktok", "TikTok"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <Lbl optional>{label}</Lbl>
                    <div style={{position: "relative"}}>
                      <span
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "rgba(255,255,255,0.25)",
                          fontSize: 12,
                        }}>
                        @
                      </span>
                      <input
                        type="text"
                        value={form[key]}
                        onChange={(e) => set(key)(e.target.value.replace("@", ""))}
                        placeholder={key}
                        style={{...inp, paddingLeft: 28}}
                        onFocus={onF}
                        onBlur={onB}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-verify toggle */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  userSelect: "none",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 9,
                  border: "1px solid rgba(255,255,255,0.07)",
                  marginBottom: 4,
                }}>
                <input
                  type="checkbox"
                  checked={form.auto_verify}
                  onChange={(e) => set("auto_verify")(e.target.checked)}
                  style={{
                    width: 15,
                    height: 15,
                    accentColor: "#ef4444",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      fontWeight: 700,
                      margin: 0,
                    }}>
                    Auto-verify brand
                  </p>
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0"}}>
                    Set verification status to "verified" immediately
                  </p>
                </div>
              </label>
            </>
          )}
        </div>

        {/* Sticky footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "#0f0f0f",
            flexShrink: 0,
            display: "flex",
            gap: 10,
          }}>
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
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.18s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              if (!saving) e.currentTarget.style.background = "#ef4444";
            }}>
            {saving && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                style={{animation: "spin 0.8s linear infinite"}}>
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {saving ? "Creating…" : `Create ${isBrand ? "Brand" : "Buyer"} Account`}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "13px 20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}>
            Cancel
          </button>
        </div>
      </motion.div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </motion.div>
  );
}
