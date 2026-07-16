import {useState, useEffect, useCallback} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {
  getBrands,
  getBrand,
  updateBrand,
  deleteBrand,
  approveBrand,
  suspendBrand,
  getCategories,
  createUser,
} from "../dashboard/dashboard_components/api";
import {AdminTable, Badge, SearchBar, ConfirmModal, Icon} from "./Components";
import ImageUpload from "../../../../components/ImageUpload";

// ── Field mappings ────────────────────────────────────────────────────────────
const VERIFY_COLOR = {
  verified: "#22c55e",
  pending: "#f59e0b",
  rejected: "#ef4444",
  suspended: "#ef4444",
};
const VERIFY_LABEL = {
  verified: "Verified",
  pending: "Pending",
  rejected: "Rejected",
  suspended: "Suspended",
};

const SUB_COLOR = {
  active: "#22c55e",
  trial: "#3b82f6",
  none: "#6b7280",
  expired: "#f97316",
  cancelled: "#ef4444",
};

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Detail field row ──────────────────────────────────────────────────────────
function DetailRow({label, value, accent}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "9px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
      <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, flexShrink: 0}}>
        {label}
      </span>
      <span
        style={{
          color: accent || "rgba(255,255,255,0.7)",
          fontSize: 11,
          maxWidth: "58%",
          textAlign: "right",
          wordBreak: "break-all",
        }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── Edit text field ───────────────────────────────────────────────────────────
function EditField({label, name, value, onChange, type = "text"}) {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 4}}>
      <label style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600}}>{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7,
          padding: "8px 10px",
          color: "rgba(255,255,255,0.8)",
          fontSize: 11,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );
}

// ── Category dropdown ─────────────────────────────────────────────────────────
function CategorySelect({value, onChange, categories}) {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 4}}>
      <label style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600}}>
        Category
      </label>
      <select
        name="category"
        value={value || ""}
        onChange={onChange}
        style={{
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7,
          padding: "8px 10px",
          color: value ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
          fontSize: 11,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' viewBox='0 0 10 6'%3E%3Cpath stroke='rgba(255,255,255,0.3)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M1 1l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          paddingRight: 28,
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}>
        <option value="">— Select category —</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Brand detail drawer ───────────────────────────────────────────────────────
function BrandDrawer({brandId, onClose, onAction}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((d) => setCategories(d?.categories || d || []))
      .catch(console.error);
  }, []);

const fetchBrand = useCallback(() => {
  setLoading(true);
  getBrand(brandId)
    .then((d) => {
      setData(d);
      const b = d?.brand || d;
      setEditFields({
        brand_name: b?.brand_name || "",
        category: b?.category || "",
        phone: b?.phone || "",
        website: b?.website || "",
        instagram: b?.instagram || "",
        twitter: b?.twitter || "",
        tiktok: b?.tiktok || "",
        facebook: b?.facebook || "",
        description: b?.description || "",
        logo_url: b?.logo_url || "",
        commission_rate: b?.commission_rate ?? "", // ✅ ADD THIS LINE
      });
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, [brandId]);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  const brand = data?.brand || data;
  const owner = data?.owner;
  const verifyColor = VERIFY_COLOR[brand?.verification_status] || "#6b7280";
  const verifyLabel = VERIFY_LABEL[brand?.verification_status] || brand?.verification_status || "—";
  const subColor = SUB_COLOR[brand?.subscription_status] || "#6b7280";
  const isVerified = brand?.verification_status === "verified";
  const isSuspended = brand?.verification_status === "suspended";

  const handleFieldChange = (e) => {
    setEditFields((prev) => ({...prev, [e.target.name]: e.target.value}));
  };

const handleSave = async () => {
  setSaving(true);
  setSaveError(null);
  try {
    // ✅ Prepare payload with commission validation
    const payload = {...editFields};
    
    // Convert commission_rate to number or null
    if (payload.commission_rate === "" || payload.commission_rate === null) {
      payload.commission_rate = null; // Reset to platform default
    } else {
      const rate = parseFloat(payload.commission_rate);
      if (isNaN(rate) || rate < 0 || rate >= 100) {
        setSaveError("Commission rate must be between 0 and 100, or leave empty for platform default.");
        setSaving(false);
        return;
      }
      payload.commission_rate = rate;
    }

    await updateBrand(brand.id, payload);
    setEditMode(false);
    fetchBrand();
  } catch (e) {
    setSaveError("Failed to save changes. Please try again.");
    console.error(e);
  } finally {
    setSaving(false);
  }
};

  const handleActionAndRefresh = (type, b) => {
    onAction(type, b, fetchBrand);
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
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(3px)",
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
          width: "min(460px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        {/* Header */}
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          {loading ? (
            <div
              style={{
                height: 44,
                width: 180,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 8,
                animation: "pulse 1.4s infinite",
              }}
            />
          ) : (
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              {(editMode ? editFields.logo_url : brand?.logo_url) ? (
                <img
                  src={editMode ? editFields.logo_url : brand.logo_url}
                  alt=""
                  style={{width: 44, height: 44, borderRadius: 10, objectFit: "cover"}}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(239,68,68,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    fontWeight: 900,
                    color: "#ef4444",
                  }}>
                  {(brand?.brand_name || "B")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>
                  {brand?.brand_name || "—"}
                </p>
                <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                  {owner?.email || "—"}
                </p>
              </div>
            </div>
          )}
          <div style={{display: "flex", gap: 8, alignItems: "center"}}>
            {!loading && (
              <button
                onClick={() => {
                  setEditMode((p) => !p);
                  setSaveError(null);
                }}
                title={editMode ? "Cancel editing" : "Edit brand"}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: editMode ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${editMode ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: editMode ? "#ef4444" : "rgba(255,255,255,0.5)",
                }}>
                {editMode ? "✕" : "✎"}
              </button>
            )}
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
              <Icon name="x" size={12} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{padding: "22px", display: "flex", flexDirection: "column", gap: 10}}>
            {Array.from({length: 8}).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 32,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  animation: "pulse 1.4s infinite",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{padding: "18px 22px", flex: 1}}>
            {/* Status badges */}
<div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18}}>
  <Badge label={verifyLabel} color={verifyColor} />
  <Badge label={brand?.subscription_status || "none"} color={subColor} />
  {brand?.subscription_plan && brand.subscription_plan !== "none" && (
    <Badge label={brand.subscription_plan} color="#06b6d4" />
  )}
  {/* ✅ ADD THIS CUSTOM COMMISSION BADGE */}
  {brand?.commission_rate !== null && brand?.commission_rate !== undefined && (
    <Badge label={`${brand.commission_rate}% custom fee`} color="#a855f7" />
  )}
</div>

            {/* ── EDIT MODE ── */}
            {editMode ? (
              <>
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}>
                  Edit Brand Info
                </p>

                <div style={{marginBottom: 14}}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 10,
                      fontWeight: 600,
                      margin: "0 0 6px",
                    }}>
                    Logo
                  </p>
                  <ImageUpload
                    folder="logos"
                    shape="square"
                    label="Change Logo"
                    preview={editFields.logo_url}
                    onUpload={(url) => setEditFields((prev) => ({...prev, logo_url: url}))}
                  />
                </div>

<div style={{display: "flex", flexDirection: "column", gap: 10}}>
  <EditField
    label="Brand Name"
    name="brand_name"
    value={editFields.brand_name}
    onChange={handleFieldChange}
  />
  <CategorySelect
    value={editFields.category}
    onChange={handleFieldChange}
    categories={categories}
  />
  
  {/* ✅ ADD THIS COMMISSION RATE INPUT */}
  <div style={{display: "flex", flexDirection: "column", gap: 4}}>
    <label style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600}}>
      Custom Commission Rate (%)
      <span style={{color: "rgba(255,255,255,0.2)", fontWeight: 400, marginLeft: 4}}>
        (optional)
      </span>
    </label>
    <input
      type="number"
      name="commission_rate"
      value={editFields.commission_rate}
      onChange={handleFieldChange}
      min="0"
      max="99.99"
      step="0.01"
      placeholder="Leave empty for platform default (10%)"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 7,
        padding: "8px 10px",
        color: "rgba(255,255,255,0.8)",
        fontSize: 11,
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.4)")}
      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
    />
    <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "4px 0 0"}}>
      {editFields.commission_rate === "" || editFields.commission_rate === null
        ? "Using platform default (10%)"
        : `Custom rate: ${editFields.commission_rate}% — All products will be recalculated on save`}
    </p>
  </div>
                  <EditField
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={editFields.phone}
                    onChange={handleFieldChange}
                  />
                  <EditField
                    label="Website"
                    name="website"
                    value={editFields.website}
                    onChange={handleFieldChange}
                  />
                  <EditField
                    label="Instagram"
                    name="instagram"
                    value={editFields.instagram}
                    onChange={handleFieldChange}
                  />
                  <EditField
                    label="Twitter"
                    name="twitter"
                    value={editFields.twitter}
                    onChange={handleFieldChange}
                  />
                  <EditField
                    label="TikTok"
                    name="tiktok"
                    value={editFields.tiktok}
                    onChange={handleFieldChange}
                  />
                  <EditField
                    label="Facebook"
                    name="facebook"
                    value={editFields.facebook}
                    onChange={handleFieldChange}
                  />
                  <div style={{display: "flex", flexDirection: "column", gap: 4}}>
                    <label style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600}}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editFields.description || ""}
                      onChange={handleFieldChange}
                      rows={3}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 7,
                        padding: "8px 10px",
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 11,
                        outline: "none",
                        width: "100%",
                        boxSizing: "border-box",
                        resize: "vertical",
                        fontFamily: "inherit",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>

                {saveError && (
                  <p style={{color: "#ef4444", fontSize: 11, marginTop: 10}}>{saveError}</p>
                )}

                <div style={{display: "flex", gap: 8, marginTop: 16}}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: saving ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: saving ? "rgba(34,197,94,0.4)" : "#22c55e",
                      borderRadius: 9,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}>
                    {saving ? "Saving…" : "✓ Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setSaveError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.4)",
                      borderRadius: 9,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ── VIEW MODE ── */}
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "0 0 4px",
                  }}>
                  Brand Info
                </p>
                <DetailRow label="Display ID" value={brand?.display_id} />
                <DetailRow label="Brand Name" value={brand?.brand_name} />
                <DetailRow label="Category" value={brand?.category || "—"} />
                <DetailRow 
                  label="Commission Rate" 
                  value={
                    brand?.commission_rate !== null && brand?.commission_rate !== undefined
                    ? `${brand.commission_rate}% (custom)`
                    : "10% (platform default)"
                  }
                  accent={brand?.commission_rate !== null && brand?.commission_rate !== undefined ? "#a855f7" : "rgba(255,255,255,0.7)"}
                />
                <DetailRow label="Phone" value={brand?.phone || "—"} />
                <DetailRow label="Website" value={brand?.website || "—"} />
                <DetailRow
                  label="Instagram"
                  value={brand?.instagram ? `@${brand.instagram}` : "—"}
                />
                <DetailRow label="Twitter" value={brand?.twitter ? `@${brand.twitter}` : "—"} />
                <DetailRow label="TikTok" value={brand?.tiktok ? `@${brand.tiktok}` : "—"} />
                <DetailRow label="Facebook" value={brand?.facebook || "—"} />
                <DetailRow label="Created" value={fmt(brand?.created_at)} />

                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "16px 0 4px",
                  }}>
                  Subscription
                </p>
                <DetailRow label="Plan" value={brand?.subscription_plan || "none"} />
                <DetailRow
                  label="Status"
                  value={brand?.subscription_status || "none"}
                  accent={subColor}
                />
                <DetailRow label="Billing" value={brand?.subscription_billing || "—"} />
                <DetailRow
                  label="Period End"
                  value={brand?.current_period_end ? fmt(brand.current_period_end) : "—"}
                />

                {owner && (
                  <>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        margin: "16px 0 4px",
                      }}>
                      Owner Account
                    </p>
                    <DetailRow label="Name" value={`${owner.first_name} ${owner.last_name}`} />
                    <DetailRow label="Email" value={owner.email} />
                    <DetailRow label="User ID" value={owner.display_id} />
                  </>
                )}

                {/* Actions */}
                <div style={{marginTop: 22, display: "flex", flexDirection: "column", gap: 8}}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      margin: "0 0 4px",
                    }}>
                    Actions
                  </p>

                  {/* Approve — only for pending/rejected, not suspended */}
                  {!isVerified && !isSuspended && (
                    <button
                      onClick={() => handleActionAndRefresh("approve", brand)}
                      style={actionBtn("#22c55e")}>
                      ✓ Approve Brand
                    </button>
                  )}

                  {/* Suspended → Reinstate */}
                  {isSuspended && (
                    <button
                      onClick={() => handleActionAndRefresh("reinstate", brand)}
                      style={actionBtn("#22c55e")}>
                      ↩ Reinstate Brand
                    </button>
                  )}

                  {/* Not suspended → Suspend */}
                  {!isSuspended && (
                    <button
                      onClick={() => handleActionAndRefresh("suspend", brand)}
                      style={actionBtn("#f59e0b", true)}>
                      ⏸ Suspend Brand
                    </button>
                  )}

                  <button onClick={() => handleActionAndRefresh("delete", brand)} style={dangerBtn}>
                    🗑 Delete Brand
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Shared button styles ──────────────────────────────────────────────────────
const actionBtn = (color, soft = false) => ({
  padding: "10px 14px",
  background: soft ? `${color}10` : `${color}15`,
  border: `1px solid ${color}30`,
  color,
  borderRadius: 9,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
});
const dangerBtn = {
  padding: "10px 14px",
  background: "rgba(239,68,68,0.05)",
  border: "1px solid rgba(239,68,68,0.15)",
  color: "rgba(239,68,68,0.6)",
  borderRadius: 9,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
};

// ── Create Brand drawer ───────────────────────────────────────────────────────
const BRAND_BLANK = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
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

function CreateBrandDrawer({onClose, onCreated}) {
  const [form, setForm] = useState(BRAND_BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((d) => setCategories(d?.categories || d || []))
      .catch(() => {});
  }, []);

  const set = (k) => (v) => setForm((f) => ({...f, [k]: v}));

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

  const Lbl = ({children, opt}) => (
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
      {opt && (
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

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!form.brand_name.trim()) {
      setError("Brand name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createUser({...form, account_type: "brand"});
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create brand account.");
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
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#ef4444,transparent)",
            flexShrink: 0,
          }}
        />
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
              Admin
            </p>
            <p style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
              Create Brand Account
            </p>
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
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
            }}>
            ✕
          </button>
        </div>

        <div
          style={{padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 0}}>
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
                }}>
                ×
              </button>
            </div>
          )}

          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}>
            Personal Info
          </p>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>
            <div>
              <Lbl>First Name</Lbl>
              <input
                value={form.first_name}
                onChange={(e) => set("first_name")(e.target.value)}
                placeholder="John"
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
            <div>
              <Lbl>Last Name</Lbl>
              <input
                value={form.last_name}
                onChange={(e) => set("last_name")(e.target.value)}
                placeholder="Doe"
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
          </div>
          <div style={{marginBottom: 12}}>
            <Lbl>Email</Lbl>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="brand@example.com"
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>
          <div style={{marginBottom: 20}}>
            <Lbl>Password</Lbl>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="Min 8 characters"
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>

          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}>
            Brand Info
          </p>
          <div style={{marginBottom: 12}}>
            <Lbl>Brand Name</Lbl>
            <input
              value={form.brand_name}
              onChange={(e) => set("brand_name")(e.target.value)}
              placeholder="e.g. BLVCK Studios"
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>
          <div style={{marginBottom: 12}}>
            <Lbl opt>Category</Lbl>
            <select
              value={form.category}
              onChange={(e) => set("category")(e.target.value)}
              style={{...inp, background: "#1a1a1a", cursor: "pointer"}}
              onFocus={onF}
              onBlur={onB}>
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{marginBottom: 12}}>
            <Lbl opt>Description</Lbl>
            <textarea
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Tell buyers what this brand is about..."
              rows={3}
              style={{...inp, resize: "vertical", lineHeight: 1.6}}
              onFocus={onF}
              onBlur={onB}
            />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>
            <div>
              <Lbl opt>Logo URL</Lbl>
              <input
                value={form.logo_url}
                onChange={(e) => set("logo_url")(e.target.value)}
                placeholder="https://..."
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
            <div>
              <Lbl opt>Website</Lbl>
              <input
                value={form.website}
                onChange={(e) => set("website")(e.target.value)}
                placeholder="https://..."
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
          </div>

          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}>
            Social Media
          </p>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16}}>
            {[
              ["instagram", "Instagram"],
              ["twitter", "Twitter / X"],
              ["tiktok", "TikTok"],
              ["facebook", "Facebook"],
            ].map(([k, l]) => (
              <div key={k}>
                <Lbl opt>{l}</Lbl>
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
                    value={form[k]}
                    onChange={(e) => set(k)(e.target.value.replace("@", ""))}
                    placeholder={k}
                    style={{...inp, paddingLeft: 28}}
                    onFocus={onF}
                    onBlur={onB}
                  />
                </div>
              </div>
            ))}
          </div>

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
              <p style={{color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700, margin: 0}}>
                Auto-verify brand
              </p>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0"}}>
                Set verification status to "verified" immediately
              </p>
            </div>
          </label>
        </div>

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
            {saving ? "Creating…" : "Create Brand Account"}
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
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifyFilter, setVerifyFilter] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {limit: 20, page};
    if (verifyFilter) params.verification_status = verifyFilter;
    if (subFilter) params.subscription_status = subFilter;
    if (search.trim()) params.search = search.trim();

    getBrands(params)
      .then((d) => {
        setBrands(d?.brands || d || []);
        setTotal(d?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [verifyFilter, subFilter, search, page]);

  useEffect(() => {
    setPage(1);
  }, [verifyFilter, subFilter, search]);
  useEffect(() => {
    load();
  }, [load]);

  const handleAction = (type, brand, refreshDrawer) => {
    setConfirm({type, brand, refreshDrawer});
  };

  const handleConfirm = async () => {
    const {type, brand, refreshDrawer} = confirm;
    try {
      if (type === "approve" || type === "reinstate") await approveBrand(brand.id);
      if (type === "suspend") await suspendBrand(brand.id);
      if (type === "delete") {
        await deleteBrand(brand.id);
        setSelectedId(null);
      }
      load();
      if (type !== "delete" && refreshDrawer) refreshDrawer();
    } catch (e) {
      console.error(e);
    }
    setConfirm(null);
  };

  const cols = [
    {
      key: "logo",
      label: "",
      render: (b) =>
        b.logo_url ? (
          <img
            src={b.logo_url}
            alt=""
            style={{width: 32, height: 32, borderRadius: 7, objectFit: "cover"}}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: "rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontWeight: 900,
              color: "#ef4444",
            }}>
            {(b.brand_name || "B")[0].toUpperCase()}
          </div>
        ),
    },
    {
      key: "name",
      label: "Brand",
      render: (b) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>{b.brand_name}</p>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              margin: 0,
              fontFamily: "monospace",
            }}>
            {b.display_id}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (b) => (
        <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>{b.category || "—"}</span>
      ),
    },
    {
      key: "verification",
      label: "Verification",
      render: (b) => (
        <Badge
          label={VERIFY_LABEL[b.verification_status] || b.verification_status || "—"}
          color={VERIFY_COLOR[b.verification_status] || "#6b7280"}
        />
      ),
    },
    {
      key: "subscription",
      label: "Subscription",
      render: (b) => (
        <div style={{display: "flex", gap: 5, flexWrap: "wrap"}}>
          <Badge
            label={b.subscription_status || "none"}
            color={SUB_COLOR[b.subscription_status] || "#6b7280"}
          />
          {b.subscription_plan && b.subscription_plan !== "none" && (
            <Badge label={b.subscription_plan} color="#06b6d4" />
          )}
        </div>
      ),
    },
    {
      key: "created",
      label: "Joined",
      render: (b) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmt(b.created_at)}</span>
      ),
    },
  ];

  const confirmCopy = {
    approve: {
      title: "Approve Brand",
      msg: `Approve "${confirm?.brand?.brand_name}"? This will set their verification to verified.`,
      label: "Approve",
      danger: false,
    },
    reinstate: {
      title: "Reinstate Brand",
      msg: `Reinstate "${confirm?.brand?.brand_name}"? This will restore verification to verified and subscription to active.`,
      label: "Reinstate",
      danger: false,
    },
    suspend: {
      title: "Suspend Brand",
      msg: `Suspend "${confirm?.brand?.brand_name}"? Their verification will be set to suspended and subscription cancelled.`,
      label: "Suspend",
      danger: true,
    },
    delete: {
      title: "Delete Brand",
      msg: `Permanently delete "${confirm?.brand?.brand_name}"? This cannot be undone.`,
      label: "Delete",
      danger: true,
    },
  };

  return (
    <div>
      <AnimatePresence>
        {selectedId && (
          <BrandDrawer
            brandId={selectedId}
            onClose={() => setSelectedId(null)}
            onAction={handleAction}
          />
        )}
        {confirm && (
          <ConfirmModal
            title={confirmCopy[confirm.type]?.title}
            message={confirmCopy[confirm.type]?.msg}
            confirmLabel={confirmCopy[confirm.type]?.label}
            danger={confirmCopy[confirm.type]?.danger}
            onConfirm={handleConfirm}
            onCancel={() => setConfirm(null)}
          />
        )}
        {showCreate && (
          <CreateBrandDrawer onClose={() => setShowCreate(false)} onCreated={() => load()} />
        )}
      </AnimatePresence>

      {/* Verification filter */}
      <div style={{marginBottom: 10}}>
        <p
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            margin: "0 0 6px",
          }}>
          Verification
        </p>
        <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
          {[
            {value: "", label: "All"},
            {value: "pending", label: "Pending"},
            {value: "verified", label: "Verified"},
            {value: "suspended", label: "Suspended"},
          ].map(({value, label}) => (
            <button
              key={value}
              onClick={() => setVerifyFilter(value)}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${
                  verifyFilter === value
                    ? value === "suspended"
                      ? "rgba(239,68,68,0.5)"
                      : "rgba(239,68,68,0.5)"
                    : "rgba(255,255,255,0.1)"
                }`,
                background:
                  verifyFilter === value
                    ? value === "suspended"
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(239,68,68,0.1)"
                    : "transparent",
                color:
                  verifyFilter === value
                    ? value === "suspended"
                      ? "#ef4444"
                      : "#ef4444"
                    : "rgba(255,255,255,0.45)",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Subscription filter */}
      <div style={{marginBottom: 14}}>
        <p
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            margin: "0 0 6px",
          }}>
          Subscription
        </p>
        <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
          {[
            {value: "", label: "All"},
            {value: "active", label: "Active"},
            {value: "trial", label: "Trial"},
            {value: "none", label: "No Plan"},
            {value: "expired", label: "Expired"},
            {value: "cancelled", label: "Cancelled"},
          ].map(({value, label}) => (
            <button
              key={value}
              onClick={() => setSubFilter(value)}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${subFilter === value ? `${SUB_COLOR[value] || "rgba(239,68,68,0.5)"}80` : "rgba(255,255,255,0.1)"}`,
                background:
                  subFilter === value ? `${SUB_COLOR[value] || "#ef4444"}12` : "transparent",
                color:
                  subFilter === value ? SUB_COLOR[value] || "#ef4444" : "rgba(255,255,255,0.45)",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by brand name..."
        actions={
          <div style={{display: "flex", gap: 8}}>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: "10px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
              + New Brand
            </button>
            <button
              onClick={load}
              style={{
                padding: "10px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Refresh
            </button>
          </div>
        }
      />

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} brands
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
            Click a row to view details
          </p>
        </div>

        <AdminTable
          columns={cols}
          rows={brands}
          loading={loading}
          onRowClick={(b) => setSelectedId(b.id)}
          emptyMsg="No brands found."
        />

        {total > 20 && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            <span style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>
              Page {page} · {brands.length} of {total}
            </span>
            <div style={{display: "flex", gap: 8}}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={pageBtn(page === 1)}>
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={brands.length < 20}
                style={pageBtn(brands.length < 20)}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const pageBtn = (disabled) => ({
  padding: "6px 14px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
  fontSize: 11,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
});
