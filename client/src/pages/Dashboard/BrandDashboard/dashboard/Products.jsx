import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  listBrandProducts,
  createBrandProduct,
  updateBrandProduct,
  updateBrandProductStatus,
  deleteBrandProduct,
  listCategories,
  getBrandActiveDrop,
  addProductToDrop,
  removeProductFromDrop,
} from "./dashboard_components/api";
import ImageUpload from "../../../../components/ImageUpload";
import {
  usePlatformSettings,
  MaintenanceBanner,
} from "./dashboard_components/platformsettingscontext";

const MAX_DROP = 8;

const STATUS_MAP = {
  active: {label: "Active", color: "#22c55e", bg: "rgba(34,197,94,0.12)"},
  draft: {label: "Draft", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
  sold_out: {label: "Sold Out", color: "#ef4444", bg: "rgba(239,68,68,0.12)"},
  archived: {label: "Archived", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.07)"},
};

const STATUSES = [
  {value: "draft", label: "Draft", desc: "Saved but not visible to buyers", color: "#f97316"},
  {value: "active", label: "Active", desc: "Live and visible to all buyers", color: "#22c55e"},
  {value: "sold_out", label: "Sold Out", desc: "Visible but cannot be purchased", color: "#ef4444"},
  {
    value: "archived",
    label: "Archived",
    desc: "Hidden from shop — kept for records",
    color: "rgba(255,255,255,0.3)",
  },
];

const inp = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: 13,
  padding: "11px 14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 8,
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};
const focus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)");
const blur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");
const opt = {background: "#1a1a1a", color: "#fff"};

function Lbl({c}) {
  return (
    <label
      style={{
        color: "rgba(255,255,255,0.35)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        display: "block",
        marginBottom: 5,
      }}>
      {c}
    </label>
  );
}

function ToggleRow({enabled, onToggle, title, subtitle, color, disabled, disabledReason}) {
  return (
    <div
      onClick={() => !disabled && onToggle()}
      title={disabled ? disabledReason : ""}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: enabled
          ? `${color}0d`
          : disabled
            ? "rgba(255,255,255,0.01)"
            : "rgba(255,255,255,0.02)",
        border: `1px solid ${enabled ? `${color}35` : "rgba(255,255,255,0.08)"}`,
        borderRadius: 10,
        padding: "13px 16px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "all 0.2s",
        userSelect: "none",
      }}>
      <div style={{flex: 1, minWidth: 0}}>
        <p style={{color: "#fff", fontSize: 13, fontWeight: 700, margin: "0 0 2px"}}>{title}</p>
        <p
          style={{
            color: disabled ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.3)",
            fontSize: 11,
            margin: 0,
          }}>
          {disabled ? disabledReason : subtitle}
        </p>
      </div>
      <div
        style={{
          flexShrink: 0,
          width: 44,
          height: 24,
          borderRadius: 99,
          marginLeft: 16,
          background: enabled ? color : "rgba(255,255,255,0.1)",
          position: "relative",
          transition: "background 0.2s",
        }}>
        <div
          style={{
            position: "absolute",
            top: 3,
            left: enabled ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    </div>
  );
}

function ProductModal({
  initial,
  onSave,
  onClose,
  saving,
  categories,
  dropIds,
  dropId,
  dropsEnabled,
  commissionRate,
  platformCommissionRate,
  isCustomCommission,
  fmtMoney,
}) {
  const alreadyInDrop = initial?.id ? dropIds.has(initial.id) : false;
  const dropFull = dropIds.size >= MAX_DROP && !alreadyInDrop;

  // When editing an existing product, the price field should show the brand's
  // original asking price (compare_price), not the post-commission buyer price.
  // compare_price is 0 only when commission_rate is 0 — fall back to price then.
  const initialPrice = initial?.id
    ? ((initial.compare_price > 0 ? initial.compare_price : initial.price) ?? "")
    : "";

  const [form, setForm] = useState(() => ({
    name: "",
    description: "",
    price: initialPrice,
    status: "draft",
    category_id: "",
    tags: "",
    is_featured: false,
    in_drop: false,
    images: [{url: "", position: 0}],
    sizes: [{size: "", stock: 0}],
    ...initial,
    // Override price with the brand's original asking price (see above)
    price: initialPrice,
    category_id: initial?.category_id ? String(initial.category_id) : "",
    is_featured: initial?.is_featured ?? false,
    in_drop: alreadyInDrop,
  }));

  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const selectedStatus = STATUSES.find((s) => s.value === form.status);

  // Live commission preview shown below the price input
  const enteredPrice = parseFloat(form.price) || 0;
  const previewBuyerPrice =
    enteredPrice > 0 && commissionRate > 0
      ? Math.round(enteredPrice * (1 - commissionRate / 100) * 100) / 100
      : enteredPrice;

  const handleSave = () => {
    const body = {
      ...form,
      // Send the brand's asking price — the backend applies commission server-side
      price: parseFloat(form.price) || 0,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      images: form.images.filter((i) => i.url),
      sizes: form.sizes.filter((s) => s.size),
    };
    onSave(body, alreadyInDrop);
  };

  // The size field is meant for ONE size per row, but the "XS, S, M, L, XL…"
  // placeholder reads like an example of what to type into it, so brands
  // naturally typed all their sizes into a single row as one comma-separated
  // string instead of using "+ Add Size" per size. Auto-split that back into
  // separate rows (same stock count on each — brand can adjust after) rather
  // than silently saving one garbled size.
  const splitSizeRow = (i) => {
    setForm((f) => {
      const row = f.sizes[i];
      const tokens = row.size.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
      if (tokens.length <= 1) return f;
      const expanded = tokens.map((size) => ({size, stock: row.stock}));
      const sizes = [...f.sizes];
      sizes.splice(i, 1, ...expanded);
      return {...f, sizes};
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <motion.div
        initial={{opacity: 0, scale: 0.96, y: 16}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.96, y: 16}}
        style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        }}>
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <h2
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "1.3rem",
              color: "#fff",
              letterSpacing: "0.06em",
              margin: 0,
            }}>
            {initial?.id ? "EDIT PRODUCT" : "NEW PRODUCT"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
              padding: 4,
            }}>
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14}}>
          {/* Name */}
          <div>
            <Lbl c="Product Name *" />
            <input
              value={form.name}
              onChange={set("name")}
              style={inp}
              onFocus={focus}
              onBlur={blur}
              placeholder="e.g. Alcatraz Hoodie"
            />
          </div>

          {/* Price — brand sets their asking price; commission is deducted server-side */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 5,
              }}>
              <Lbl c="Your Asking Price *" />
              {commissionRate > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                  {isCustomCommission && (
                    <span
                      style={{
                        color: "#a855f7",
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        background: "rgba(168,85,247,0.1)",
                        padding: "2px 6px",
                        borderRadius: 99,
                      }}
                      title={`Platform default is ${platformCommissionRate}%`}>
                      CUSTOM RATE
                    </span>
                  )}
                  <span
                    style={{color: "rgba(255,255,255,0.25)", fontSize: 9, letterSpacing: "0.12em"}}>
                    {commissionRate}% {isCustomCommission ? "FEE" : "PLATFORM FEE"} APPLIES
                  </span>
                </div>
              )}
            </div>
            <input
              type="number"
              value={form.price}
              onChange={set("price")}
              style={inp}
              onFocus={focus}
              onBlur={blur}
              placeholder="0.00"
            />
            {/* Live preview of what buyers will see */}
            {enteredPrice > 0 && commissionRate > 0 && (
              <div
                style={{
                  marginTop: 8,
                  padding: "9px 12px",
                  background: isCustomCommission
                    ? "rgba(168,85,247,0.05)"
                    : "rgba(239,68,68,0.05)",
                  border: `1px solid ${isCustomCommission ? "rgba(168,85,247,0.15)" : "rgba(239,68,68,0.15)"}`,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}>
                <span
                  style={{color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: "0.1em"}}>
                  BUYERS WILL SEE
                </span>
                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                  {/* Slashed original price */}
                  <span
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "0.95rem",
                      color: "rgba(255,255,255,0.25)",
                      textDecoration: "line-through",
                    }}>
                    {fmtMoney(enteredPrice)}
                  </span>
                  {/* Unslashed buyer price */}
                  <span
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "0.95rem",
                      color: isCustomCommission ? "#a855f7" : "#ef4444",
                    }}>
                    {fmtMoney(previewBuyerPrice)}
                  </span>
                </div>
              </div>
            )}
            {/* Show comparison to platform rate if custom */}
            {isCustomCommission && commissionRate !== platformCommissionRate && (
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 10,
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                <svg
                  width="10"
                  height="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                Platform default is {platformCommissionRate}% — you have a{" "}
                {commissionRate < platformCommissionRate ? "better" : "different"} rate
              </p>
            )}
          </div>

          {/* Category + Status */}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
            <div>
              <Lbl c="Category" />
              <select
                value={form.category_id}
                onChange={set("category_id")}
                style={{...inp, cursor: "pointer", appearance: "none"}}
                onFocus={focus}
                onBlur={blur}>
                <option value="" style={opt}>
                  — Select category —
                </option>
                {(categories || []).map((cat) => (
                  <option key={cat.id} value={String(cat.id)} style={opt}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl c="Status" />
              <select
                value={form.status}
                onChange={set("status")}
                style={{
                  ...inp,
                  cursor: "pointer",
                  appearance: "none",
                  borderColor: selectedStatus
                    ? `${selectedStatus.color}55`
                    : "rgba(255,255,255,0.1)",
                  color: selectedStatus?.color || "#fff",
                }}
                onFocus={focus}
                onBlur={blur}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value} style={opt}>
                    {s.label} — {s.desc}
                  </option>
                ))}
              </select>
              {selectedStatus && (
                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 4}}>
                  {selectedStatus.desc}
                </p>
              )}
            </div>
          </div>

          {/* Featured toggle */}
          <ToggleRow
            enabled={form.is_featured}
            onToggle={() => setForm((f) => ({...f, is_featured: !f.is_featured}))}
            title="Featured Product"
            subtitle="Highlighted in the shop homepage and featured sections"
            color="#ef4444"
          />

          {/* Latest Drop toggle — respects enable_drops setting */}
          <ToggleRow
            enabled={form.in_drop}
            onToggle={() => setForm((f) => ({...f, in_drop: !f.in_drop}))}
            title="Latest Drop"
            subtitle={`Add to your latest drop · ${dropIds.size} / ${MAX_DROP} slots used`}
            color="#a855f7"
            disabled={!dropsEnabled || dropFull}
            disabledReason={
              !dropsEnabled
                ? "Drops are currently disabled by the platform administrator"
                : `Drop is full (${MAX_DROP}/${MAX_DROP}) — remove a product first`
            }
          />

          {/* Description */}
          <div>
            <Lbl c="Description" />
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              style={{...inp, resize: "vertical", lineHeight: 1.6}}
              onFocus={focus}
              onBlur={blur}
              placeholder="Describe your product..."
            />
          </div>

          {/* Tags */}
          <div>
            <Lbl c="Tags (comma separated)" />
            <input
              value={form.tags}
              onChange={set("tags")}
              style={inp}
              onFocus={focus}
              onBlur={blur}
              placeholder="hoodie, streetwear, limited"
            />
          </div>

          {/* Images */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}>
              <Lbl c="Product Images" />
              {form.images.length < 10 && (
                <button
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      images: [...f.images, {url: "", position: f.images.length}],
                    }))
                  }
                  style={{
                    background: "none",
                    border: "1px dashed rgba(255,255,255,0.15)",
                    borderRadius: 7,
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 10,
                    padding: "5px 12px",
                    cursor: "pointer",
                    letterSpacing: "0.1em",
                  }}>
                  + Add Slot ({form.images.length}/10)
                </button>
              )}
            </div>
            <div style={{display: "flex", flexWrap: "wrap", gap: 12}}>
              {form.images.map((img, i) => (
                <div key={i} style={{position: "relative"}}>
                  <ImageUpload
                    folder="products"
                    shape="square"
                    preview={img.url}
                    label={i === 0 ? "Main Photo" : `Photo ${i + 1}`}
                    onUpload={(url) =>
                      setForm((f) => ({
                        ...f,
                        images: f.images.map((im, j) => (j === i ? {...im, url} : im)),
                      }))
                    }
                  />
                  {i === 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -8,
                        left: -8,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 900,
                        letterSpacing: "0.1em",
                        padding: "2px 6px",
                        borderRadius: 99,
                        textTransform: "uppercase",
                      }}>
                      Main
                    </span>
                  )}
                  {form.images.length > 1 && (
                    <button
                      onClick={() =>
                        setForm((f) => ({...f, images: f.images.filter((_, j) => j !== i)}))
                      }
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 20,
                        height: 20,
                        background: "#ef4444",
                        border: "2px solid #111",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 3,
                      }}>
                      <svg
                        width="8"
                        height="8"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 8}}>
              First image is the main product photo shown in listings.
            </p>
          </div>

          {/* Sizes & Stock */}
          <div>
            <Lbl c="Sizes & Stock" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 38px",
                gap: 8,
                marginBottom: 6,
              }}>
              <span
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}>
                Size
              </span>
              <span
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}>
                Stock
              </span>
              <span />
            </div>
            {form.sizes.map((sz, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 38px",
                  gap: 8,
                  marginBottom: 8,
                }}>
                <input
                  value={sz.size}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sizes: f.sizes.map((s, j) => (j === i ? {...s, size: e.target.value} : s)),
                    }))
                  }
                  style={inp}
                  onFocus={focus}
                  onBlur={(e) => { blur(e); splitSizeRow(i); }}
                  placeholder="One size per row, e.g. M"
                />
                <input
                  type="number"
                  min="0"
                  value={sz.stock}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sizes: f.sizes.map((s, j) =>
                        j === i ? {...s, stock: parseInt(e.target.value) || 0} : s,
                      ),
                    }))
                  }
                  style={{...inp, textAlign: "center"}}
                  onFocus={focus}
                  onBlur={blur}
                  placeholder="0"
                />
                {form.sizes.length > 1 && (
                  <button
                    onClick={() =>
                      setForm((f) => ({...f, sizes: f.sizes.filter((_, j) => j !== i)}))
                    }
                    style={{
                      width: 38,
                      height: 38,
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setForm((f) => ({...f, sizes: [...f.sizes, {size: "", stock: 0}]}))}
              style={{
                background: "none",
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                padding: "8px 14px",
                cursor: "pointer",
                width: "100%",
              }}>
              + Add Size
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
          }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "11px 22px",
              borderRadius: 8,
              cursor: "pointer",
            }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "#7f1d1d" : "#ef4444",
              border: "none",
              color: "#fff",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "11px 28px",
              borderRadius: 8,
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.18s",
              minWidth: 120,
            }}>
            {saving ? "Saving…" : initial?.id ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Products() {
  const {settings, fmtMoney} = usePlatformSettings();
  const dropsEnabled = settings.enable_drops !== false;
  const purchasesDisabled = settings.disable_purchases === true;
  const lowStockThreshold = Number(settings.low_stock_threshold ?? 5);
  
  // Commission rate - this comes from /api/brand/platform-settings
  // which already includes brand-specific override if set
  const commissionRate = Number(settings.commission_rate ?? 10);
  
  // // Platform default commission (for comparison)
  // // We need to fetch this separately to show if brand has custom rate
  const platformCommissionRate = Number(settings.platform_commission_rate ?? 10);
  const isCustomCommission = commissionRate !== platformCommissionRate;
  // const [platformCommissionRate, setPlatformCommissionRate] = useState(10);
  // const [isCustomCommission, setIsCustomCommission] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dropId, setDropId] = useState(null);
  const [dropIds, setDropIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Fetch platform default commission rate on mount
  // useEffect(() => {
  //   fetch("/api/admin/settings")
  //     .then(res => res.json())
  //     .then(data => {
  //       const platformRate = Number(data?.data?.settings?.commission_rate ?? 10);
  //       setPlatformCommissionRate(platformRate);
  //       // Check if current rate differs from platform default
  //       setIsCustomCommission(commissionRate !== platformRate);
  //     })
  //     .catch(() => {});
  // }, [commissionRate]);

  useEffect(() => {
    listCategories()
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getBrandActiveDrop()
      .then((d) => {
        if (d?.id) {
          setDropId(d.id);
          const ids = new Set((d.products || []).map((p) => Number(p.product_id || p.id)));
          setDropIds(ids);
        }
      })
      .catch(() => {});
  }, []);

  const load = (params = {}) => {
    setLoading(true);
    listBrandProducts({...params})
      .then((d) => {
        if (Array.isArray(d)) setProducts(d);
        else if (Array.isArray(d?.products)) setProducts(d.products);
        else if (Array.isArray(d?.items)) setProducts(d.items);
        else setProducts([]);
      })
      .catch((e) => {
        setError(e.message);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(
      () => {
        load({
          ...(search ? {search} : {}),
          ...(filter ? {status: filter} : {}),
          ...(catFilter ? {category_id: catFilter} : {}),
        });
      },
      search || filter || catFilter ? 300 : 0,
    );
    return () => clearTimeout(t);
  }, [search, filter, catFilter]);

  const showToast = (msg, isError = false) => {
    setToast({msg, isError});
    setTimeout(() => setToast(""), 3000);
  };

  const handleSave = async (body, wasInDrop) => {
    setSaving(true);
    const {in_drop, ...productBody} = body;
    try {
      let saved;
      if (modal?.id) {
        saved = await updateBrandProduct(modal.id, productBody);
        setProducts((prev) => prev.map((p) => (p.id === modal.id ? saved : p)));
        showToast("Product updated ✓");
      } else {
        saved = await createBrandProduct(productBody);
        setProducts((prev) => [saved, ...prev]);
        showToast("Product created ✓");
      }
      const pid = saved?.id || modal?.id;
      if (in_drop && !wasInDrop && dropsEnabled) {
        const result = await addProductToDrop(pid);
        if (result?.drop_id) setDropId(result.drop_id);
        setDropIds((prev) => new Set([...prev, pid]));
        showToast("Added to Latest Drop ✓");
      } else if (!in_drop && wasInDrop && dropId) {
        await removeProductFromDrop(dropId, pid);
        setDropIds((prev) => {
          const n = new Set(prev);
          n.delete(pid);
          return n;
        });
        showToast("Removed from Latest Drop");
      }
      setModal(null);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (p) => {
    const next = p.status === "active" ? "draft" : "active";
    try {
      await updateBrandProductStatus(p.id, next);
      setProducts((prev) => prev.map((x) => (x.id === p.id ? {...x, status: next} : x)));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await deleteBrandProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (dropIds.has(id))
        setDropIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      showToast("Product deleted");
    } catch (e) {
      setError(e.message);
    }
  };

  const catName = (id) => categories.find((c) => c.id === id)?.name || "";

  return (
    <div>
      <MaintenanceBanner />

      {/* Custom Commission Notice */}
      {isCustomCommission && (
        <div
          style={{
            background: "rgba(168,85,247,0.06)",
            border: "1px solid rgba(168,85,247,0.18)",
            borderRadius: 10,
            padding: "11px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <p style={{color: "#a855f7", fontSize: 12, fontWeight: 700, margin: 0}}>
            You have a custom commission rate of {commissionRate}% (platform default is{" "}
            {platformCommissionRate}%)
          </p>
        </div>
      )}

      {/* Purchases paused notice */}
      {purchasesDisabled && (
        <div
          style={{
            background: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.2)",
            borderRadius: 10,
            padding: "11px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p style={{color: "#f97316", fontSize: 12, fontWeight: 700, margin: 0}}>
            Purchases are currently paused. Products are visible but buyers cannot place orders.
          </p>
        </div>
      )}

      {/* Drops disabled notice */}
      {!dropsEnabled && (
        <div
          style={{
            background: "rgba(168,85,247,0.06)",
            border: "1px solid rgba(168,85,247,0.18)",
            borderRadius: 10,
            padding: "11px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
          <p style={{color: "#a855f7", fontSize: 12, fontWeight: 700, margin: 0}}>
            Drops are currently disabled by the platform administrator. The Latest Drop toggle is
            unavailable.
          </p>
        </div>
      )}

      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}>
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.28)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}>
            Catalogue
          </p>
          <h1
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(1.6rem,3vw,2.2rem)",
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              margin: 0,
            }}>
            PRODUCTS
          </h1>
        </div>

        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          {/* Drop slot counter — hidden when drops disabled */}
          {dropsEnabled && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background:
                  dropIds.size >= MAX_DROP ? "rgba(239,68,68,0.08)" : "rgba(168,85,247,0.08)",
                border: `1px solid ${dropIds.size >= MAX_DROP ? "rgba(239,68,68,0.25)" : "rgba(168,85,247,0.25)"}`,
                borderRadius: 99,
                padding: "6px 14px",
              }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: dropIds.size >= MAX_DROP ? "#ef4444" : "#a855f7",
                }}
              />
              <span
                style={{
                  color: dropIds.size >= MAX_DROP ? "#ef4444" : "#a855f7",
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                Drop {dropIds.size}/{MAX_DROP}
              </span>
            </div>
          )}

          <button
            onClick={() => setModal("new")}
            style={{
              background: "#ef4444",
              border: "none",
              color: "#fff",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "12px 22px",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#ef4444",
            fontSize: 13,
          }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap"}}>
        <div style={{position: "relative", flex: 1, minWidth: 200}}>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)"}}>
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{...inp, paddingLeft: 36}}
            onFocus={focus}
            onBlur={blur}
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{...inp, width: "auto", minWidth: 160, cursor: "pointer", appearance: "none"}}
          onFocus={focus}
          onBlur={blur}>
          <option value="" style={opt}>
            All categories
          </option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)} style={opt}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{...inp, width: "auto", minWidth: 140, cursor: "pointer", appearance: "none"}}
          onFocus={focus}
          onBlur={blur}>
          <option value="" style={opt}>
            All statuses
          </option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value} style={opt}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Product list */}
      {loading ? (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{
                  height: 72,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{textAlign: "center", padding: "60px 20px"}}>
          <p
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "1.8rem",
              color: "rgba(255,255,255,0.12)",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}>
            NO PRODUCTS YET
          </p>
          <p style={{color: "rgba(255,255,255,0.25)", fontSize: 13, marginBottom: 20}}>
            {search || filter || catFilter
              ? "No products match your filters."
              : "Add your first product to get started."}
          </p>
          {!search && !filter && !catFilter && (
            <button
              onClick={() => setModal("new")}
              style={{
                background: "#ef4444",
                border: "none",
                color: "#fff",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "12px 28px",
                borderRadius: 10,
                cursor: "pointer",
              }}>
              + Add First Product
            </button>
          )}
        </div>
      ) : (
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          {products.map((p) => {
            const s = STATUS_MAP[p.status] || {
              label: p.status,
              color: "#fff",
              bg: "rgba(255,255,255,0.07)",
            };
            const img = p.images?.[0]?.url || p.primary_image;
            const inDrop = dropIds.has(p.id);
            // Low stock calculation
            const totalStock = p.sizes?.reduce((acc, sz) => acc + (sz.stock ?? 0), 0) ?? null;
            const isLowStock =
              totalStock !== null && totalStock <= lowStockThreshold && totalStock > 0;
            const isOutOfStock = totalStock !== null && totalStock === 0;
            // Commission display:
            //   p.price        = buyer-facing price (post-commission) — shown unslashed
            //   p.compare_price = brand's original asking price       — shown slashed
            const hasCommission = p.compare_price > 0 && p.compare_price !== p.price;

            return (
              <motion.div
                key={p.id}
                layout
                style={{
                  background: "#0d0d0d",
                  border: `1px solid ${inDrop ? "rgba(168,85,247,0.22)" : isLowStock ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}>
                {/* Thumbnail */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                  }}>
                  {img && (
                    <img
                      src={img}
                      alt={p.name}
                      style={{width: "100%", height: "100%", objectFit: "cover"}}
                    />
                  )}
                </div>

                {/* Info */}
                <div style={{flex: 1, minWidth: 0}}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 3,
                      flexWrap: "wrap",
                    }}>
                    <span
                      style={{
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: s.color,
                        background: s.bg,
                        padding: "2px 7px",
                        borderRadius: 99,
                        flexShrink: 0,
                      }}>
                      {s.label}
                    </span>
                    {p.is_featured && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#ef4444",
                          background: "rgba(239,68,68,0.1)",
                          padding: "2px 7px",
                          borderRadius: 99,
                          flexShrink: 0,
                        }}>
                        Featured
                      </span>
                    )}
                    {inDrop && dropsEnabled && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#a855f7",
                          background: "rgba(168,85,247,0.12)",
                          padding: "2px 7px",
                          borderRadius: 99,
                          flexShrink: 0,
                        }}>
                        Drop
                      </span>
                    )}
                    {isLowStock && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#f59e0b",
                          background: "rgba(245,158,11,0.12)",
                          padding: "2px 7px",
                          borderRadius: 99,
                          flexShrink: 0,
                        }}>
                        Low Stock ({totalStock})
                      </span>
                    )}
                    {isOutOfStock && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#ef4444",
                          background: "rgba(239,68,68,0.1)",
                          padding: "2px 7px",
                          borderRadius: 99,
                          flexShrink: 0,
                        }}>
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <div style={{display: "flex", alignItems: "center", gap: 10}}>
                    {/* Price display: slashed compare_price + unslashed buyer price */}
                    <div style={{display: "flex", alignItems: "center", gap: 6}}>
                      {hasCommission && (
                        <span
                          style={{
                            fontFamily: "'Bebas Neue',sans-serif",
                            fontSize: "0.9rem",
                            color: "rgba(255,255,255,0.28)",
                            textDecoration: "line-through",
                          }}>
                          {fmtMoney(p.compare_price)}
                        </span>
                      )}
                      <span
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1rem",
                          color: isCustomCommission ? "#a855f7" : "#ef4444",
                        }}>
                        {fmtMoney(p.price)}
                      </span>
                    </div>
                    {p.category_id && (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontSize: 10,
                          background: "rgba(255,255,255,0.06)",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}>
                        {catName(p.category_id)}
                      </span>
                    )}
                    {p.sizes?.length > 0 && (
                      <span style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>
                        {p.sizes.map((sz) => sz.size).join(", ")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row actions */}
                <div style={{display: "flex", alignItems: "center", gap: 8, flexShrink: 0}}>
                  <button
                    onClick={() => handleStatusToggle(p)}
                    title={p.status === "active" ? "Set to Draft" : "Set to Active"}
                    style={{
                      padding: "6px 12px",
                      background:
                        p.status === "active" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                      border: `1px solid ${p.status === "active" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                      borderRadius: 7,
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 700,
                      color: p.status === "active" ? "#ef4444" : "#22c55e",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}>
                    {p.status === "active" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => setModal(p)}
                    style={{
                      width: 34,
                      height: 34,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      width: 34,
                      height: 34,
                      background: "rgba(239,68,68,0.07)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <ProductModal
            initial={modal === "new" ? null : modal}
            categories={categories}
            dropIds={dropIds}
            dropId={dropId}
            dropsEnabled={dropsEnabled}
            commissionRate={commissionRate}
            platformCommissionRate={platformCommissionRate}
            isCustomCommission={isCustomCommission}
            fmtMoney={fmtMoney}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 20}}
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.isError ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "12px 24px",
              borderRadius: 99,
              boxShadow: `0 8px 30px ${toast.isError ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}