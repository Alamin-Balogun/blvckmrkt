import {useState, useEffect, useCallback, useMemo} from "react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {AnimatePresence, motion} from "framer-motion";
import { useGeo } from "../../../../utils/geo";
import {
  getLocalShippingRates,
  createLocalShippingRate,
  updateLocalShippingRate,
  deleteLocalShippingRate,
  getAdminPickupLocations,
  createAdminPickupLocation,
  updateAdminPickupLocation,
  deleteAdminPickupLocation,
  getBrands,
} from "../dashboard/dashboard_components/api";
import {AdminTable, Badge, SearchBar, ConfirmModal, Icon} from "./Components";

// ── Currency symbol map ───────────────────────────────────────────────────────

const SYM = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  EGP: "E£",
  INR: "₹",
  PKR: "₨",
  BDT: "৳",
  AED: "د.إ",
  SAR: "﷼",
  TRY: "₺",
  RUB: "₽",
  BRL: "R$",
  MXN: "MX$",
  CAD: "CA$",
  AUD: "A$",
  NZD: "NZ$",
  SGD: "S$",
  MYR: "RM",
  THB: "฿",
  IDR: "Rp",
  PHP: "₱",
  VND: "₫",
  KRW: "₩",
  JPY: "¥",
  CNY: "¥",
  CHF: "CHF",
  XAF: "FCFA",
  XOF: "CFA",
  JMD: "J$",
  QAR: "QR",
  KWD: "KD",
  OMR: "OMR",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

function Lbl({children, opt}) {
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
}

// ── Portal SearchableSelect ───────────────────────────────────────────────────

function SearchableSelect({options, value, onChange, placeholder, disabled}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const triggerRef = React.useRef(null);
  const dropRef = React.useRef(null);
  const [coords, setCoords] = React.useState({top: 0, left: 0, width: 0});

  const selected = options.find((o) => o.value === value);
  const filtered = React.useMemo(() => {
    if (!query.trim()) return options.slice(0, 250);
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 250);
  }, [options, query]);

  const syncCoords = React.useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) {
      setOpen(false);
      return;
    }
    setCoords({top: r.bottom + 4, left: r.left, width: r.width});
  }, []);

  const openDD = () => {
    if (disabled) return;
    syncCoords();
    setOpen(true);
  };

  React.useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", syncCoords, {passive: true, capture: true});
    window.addEventListener("resize", syncCoords, {passive: true});
    return () => {
      window.removeEventListener("scroll", syncCoords, {capture: true});
      window.removeEventListener("resize", syncCoords);
    };
  }, [open, syncCoords]);

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropRef.current &&
        !dropRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openDD())}
        style={{
          width: "100%",
          background: disabled
            ? "rgba(255,255,255,0.02)"
            : open
              ? "#1e1e1e"
              : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 8,
          padding: "10px 13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "all 0.18s",
        }}>
        <div style={{display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0}}>
          {selected?.flag && (
            <span style={{fontSize: 16, lineHeight: 1, flexShrink: 0}}>{selected.flag}</span>
          )}
          <span
            style={{
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: disabled
                ? "rgba(255,255,255,0.18)"
                : selected
                  ? "#fff"
                  : "rgba(255,255,255,0.3)",
            }}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <svg
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.18s",
          }}
          width="11"
          height="11"
          fill="none"
          viewBox="0 0 24 24"
          stroke={disabled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"}
          strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open &&
        ReactDOM.createPortal(
          <div
            ref={dropRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              background: "#181818",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 10,
              zIndex: 99999,
              boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
              overflow: "hidden",
            }}>
            <div
              style={{
                padding: "8px 8px 6px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: "#1e1e1e",
              }}>
              <div style={{position: "relative"}}>
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{
                    position: "absolute",
                    left: 9,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 7,
                    padding: "7px 9px 7px 28px",
                    color: "#fff",
                    fontSize: 12,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>
            <div style={{maxHeight: 220, overflowY: "auto"}}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: 14,
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 12,
                    textAlign: "center",
                  }}>
                  No results
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSel = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        padding: "8px 13px",
                        cursor: "pointer",
                        fontSize: 13,
                        background: isSel ? "rgba(239,68,68,0.1)" : "transparent",
                        color: isSel ? "#ef4444" : "rgba(255,255,255,0.72)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSel) e.currentTarget.style.background = "transparent";
                      }}>
                      {opt.flag && (
                        <span style={{fontSize: 15, lineHeight: 1, flexShrink: 0}}>{opt.flag}</span>
                      )}
                      <span style={{flex: 1}}>{opt.label}</span>
                      {isSel && (
                        <svg
                          width="10"
                          height="10"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3"
                          viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RATES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function RateDrawer({rate, brandMap, onClose, onRefresh}) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const allCountries = useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        value: c.isoCode,
        label: c.name,
        flag: c.flag,
        currency: c.currency,
      })),
    [],
  );
  const [form, setForm] = useState({
    countryIso: rate.country_code || "",
    country: rate.country || "",
    stateIso: rate.state_code || "",
    state: rate.state || "",
    city: rate.city || "",
    currency: rate.currency || "",
    currency_symbol: rate.currency_symbol || "",
    base_price: rate.base_price ?? "",
    area_overrides: (() => {
      try {
        const p =
          typeof rate.area_overrides === "string"
            ? JSON.parse(rate.area_overrides)
            : rate.area_overrides;
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    })(),
  });

  const stateOptions = useMemo(
    () =>
      form.countryIso
        ? State.getStatesOfCountry(form.countryIso).map((s) => ({value: s.isoCode, label: s.name}))
        : [],
    [form.countryIso],
  );

  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const setCountry = (iso) => {
    const c = Country.getCountryByCode(iso);
    const cur = c?.currency || "";
    setForm((f) => ({
      ...f,
      countryIso: iso,
      country: c?.name || "",
      stateIso: "",
      state: "",
      currency: cur,
      currency_symbol: SYM[cur] || cur,
    }));
  };
  const setState = (iso) => {
    const s = stateOptions.find((o) => o.value === iso);
    setForm((f) => ({...f, stateIso: iso, state: s?.label || ""}));
  };

  const overrides = (() => {
    try {
      const p =
        typeof rate.area_overrides === "string"
          ? JSON.parse(rate.area_overrides)
          : rate.area_overrides;
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  })();
  const brand = rate.brand_id ? brandMap[rate.brand_id] : null;
  const flag = (() => {
    if (!rate.country_code) return null;
    const c = Country.getCountryByCode(rate.country_code);
    return c?.flag || null;
  })();

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateLocalShippingRate(rate.id, {
        brand_id: rate.brand_id,
        country: form.country,
        country_code: form.countryIso,
        state: form.state,
        state_code: form.stateIso,
        city: form.city,
        currency: form.currency,
        currency_symbol: form.currency_symbol,
        base_price: parseFloat(form.base_price) || 0,
        area_overrides: form.area_overrides
          .filter((a) => a.area?.trim())
          .map((a) => ({
            area: a.area,
            price: parseFloat(a.price) || 0,
            is_special: a.is_special || false,
          })),
      });
      setEditMode(false);
      onRefresh();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
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
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <div style={{display: "flex", alignItems: "center", gap: 12}}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "rgba(239,68,68,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}>
              {flag || "🌍"}
            </div>
            <div>
              <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>
                {rate.city ? `${rate.city}, ` : ""}
                {rate.country}
              </p>
              <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                {rate.currency_symbol}
                {Number(rate.base_price).toLocaleString(undefined, {minimumFractionDigits: 2})}{" "}
                {rate.currency}
              </p>
            </div>
          </div>
          <div style={{display: "flex", gap: 8, alignItems: "center"}}>
            <button
              onClick={() => {
                setEditMode((p) => !p);
                setSaveError(null);
              }}
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

        <div style={{padding: "18px 22px", flex: 1}}>
          <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18}}>
            <Badge label={rate.currency} color="#3b82f6" />
            {brand && (
              <Badge
                label={brand.name || brand.brand_name || `Brand #${rate.brand_id}`}
                color="#a855f7"
              />
            )}
            {overrides.length > 0 && (
              <Badge
                label={`${overrides.length} area${overrides.length !== 1 ? "s" : ""}`}
                color="#f97316"
              />
            )}
          </div>

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
                Edit Rate
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}>
                <div>
                  <Lbl>Country</Lbl>
                  <SearchableSelect
                    options={allCountries}
                    value={form.countryIso}
                    onChange={setCountry}
                    placeholder="Country"
                  />
                </div>
                <div>
                  <Lbl>State</Lbl>
                  <SearchableSelect
                    options={[{value: "", label: "— All —"}, ...stateOptions]}
                    value={form.stateIso}
                    onChange={setState}
                    placeholder={form.countryIso ? "State" : "Pick country"}
                    disabled={!form.countryIso}
                  />
                </div>
              </div>
              <div style={{marginBottom: 12}}>
                <Lbl>City</Lbl>
                <input
                  value={form.city}
                  onChange={set("city")}
                  style={inp}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="e.g. Ijebu-Ode"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}>
                <div>
                  <Lbl>Currency</Lbl>
                  <input
                    value={form.currency}
                    onChange={set("currency")}
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder="NGN"
                  />
                </div>
                <div>
                  <Lbl>Symbol</Lbl>
                  <input
                    value={form.currency_symbol}
                    onChange={set("currency_symbol")}
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder="₦"
                  />
                </div>
                <div>
                  <Lbl>Base Price</Lbl>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.base_price}
                    onChange={set("base_price")}
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}>
                <Lbl>Area Overrides</Lbl>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      area_overrides: [
                        ...f.area_overrides,
                        {area: "", price: "", is_special: false},
                      ],
                    }))
                  }
                  style={{
                    background: "none",
                    border: "1px dashed rgba(255,255,255,0.15)",
                    borderRadius: 7,
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 10,
                    padding: "3px 10px",
                    cursor: "pointer",
                  }}>
                  + Area
                </button>
              </div>
              {form.area_overrides.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 32px 32px",
                    gap: 6,
                    marginBottom: 6,
                    alignItems: "center",
                  }}>
                  <input
                    value={a.area}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        area_overrides: f.area_overrides.map((x, j) =>
                          j === i ? {...x, area: v} : x,
                        ),
                      }));
                    }}
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder="Area name"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={a.price}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        area_overrides: f.area_overrides.map((x, j) =>
                          j === i ? {...x, price: v} : x,
                        ),
                      }));
                    }}
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        area_overrides: f.area_overrides.map((x, j) =>
                          j === i ? {...x, is_special: !x.is_special} : x,
                        ),
                      }))
                    }
                    title={a.is_special ? "Special area" : "Regular area"}
                    style={{
                      width: 32,
                      height: 34,
                      background: a.is_special ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${a.is_special ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 7,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: a.is_special ? "#eab308" : "rgba(255,255,255,0.2)",
                    }}>
                    ★
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        area_overrides: f.area_overrides.filter((_, j) => j !== i),
                      }))
                    }
                    style={{
                      width: 32,
                      height: 34,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      borderRadius: 7,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <Icon name="x" size={10} color="#ef4444" />
                  </button>
                </div>
              ))}
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
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                }}>
                Location
              </p>
              <DetailRow label="Country" value={rate.country} />
              <DetailRow label="State" value={rate.state || "—"} />
              <DetailRow label="City" value={rate.city || "—"} />
              <DetailRow label="Created" value={fmt(rate.created_at)} />

              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "16px 0 4px",
                }}>
                Pricing
              </p>
              <DetailRow label="Currency" value={`${rate.currency_symbol} ${rate.currency}`} />
              <DetailRow
                label="Base Price"
                value={`${rate.currency_symbol}${Number(rate.base_price).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                accent="#ef4444"
              />
              {brand && (
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
                    Brand
                  </p>
                  <DetailRow
                    label="Brand"
                    value={brand.name || brand.brand_name || `#${rate.brand_id}`}
                  />
                </>
              )}
              {overrides.length > 0 && (
                <>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      margin: "16px 0 8px",
                    }}>
                    Area Overrides ({overrides.length})
                  </p>
                  {overrides.map((a, i) => (
                    <DetailRow
                      key={i}
                      label={
                        <span style={{display: "flex", alignItems: "center", gap: 4}}>
                          {a.is_special && <span style={{color: "#eab308"}}>★</span>}
                          {a.area}
                        </span>
                      }
                      value={`${rate.currency_symbol}${Number(a.price).toLocaleString()}`}
                      accent={a.is_special ? "#eab308" : "#f97316"}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateRateDrawer({brands, onClose, onCreated}) {
  const allCountries = useMemo(
    () =>
      Country.getAllCountries().map((c) => ({
        value: c.isoCode,
        label: c.name,
        flag: c.flag,
        currency: c.currency,
      })),
    [],
  );
  const [form, setForm] = useState({
    brand_id: "",
    countryIso: "",
    country: "",
    stateIso: "",
    state: "",
    city: "",
    currency: "",
    currency_symbol: "",
    base_price: "",
    area_overrides: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stateOptions = useMemo(
    () =>
      form.countryIso
        ? State.getStatesOfCountry(form.countryIso).map((s) => ({value: s.isoCode, label: s.name}))
        : [],
    [form.countryIso],
  );
  const brandOptions = useMemo(
    () => [
      {value: "", label: "— Select brand —"},
      ...brands.map((b) => ({
        value: String(b.id),
        label: b.name || b.brand_name || `Brand #${b.id}`,
      })),
    ],
    [brands],
  );
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const setCountry = (iso) => {
    const c = Country.getCountryByCode(iso);
    const cur = c?.currency || "";
    setForm((f) => ({
      ...f,
      countryIso: iso,
      country: c?.name || "",
      stateIso: "",
      state: "",
      currency: cur,
      currency_symbol: SYM[cur] || cur,
    }));
  };
  const setState = (iso) => {
    const s = stateOptions.find((o) => o.value === iso);
    setForm((f) => ({...f, stateIso: iso, state: s?.label || ""}));
  };

  const handleSave = async () => {
    if (!form.country.trim()) {
      setError("Country is required.");
      return;
    }
    if (!form.brand_id) {
      setError("Brand is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createLocalShippingRate({
        brand_id: parseInt(form.brand_id),
        country: form.country,
        country_code: form.countryIso,
        state: form.state,
        state_code: form.stateIso,
        city: form.city || null,
        currency: form.currency,
        currency_symbol: form.currency_symbol,
        base_price: parseFloat(form.base_price) || 0,
        area_overrides: form.area_overrides
          .filter((a) => a.area?.trim())
          .map((a) => ({
            area: a.area,
            price: parseFloat(a.price) || 0,
            is_special: a.is_special || false,
          })),
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
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
              Local Shipping
            </p>
            <p style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
              Create Local Rate
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
        <div style={{padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column"}}>
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
            Brand
          </p>
          <div style={{marginBottom: 16}}>
            <Lbl>Brand</Lbl>
            <SearchableSelect
              options={brandOptions}
              value={String(form.brand_id)}
              onChange={(v) => setForm((f) => ({...f, brand_id: v}))}
              placeholder="Select brand"
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
            Location
          </p>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12}}>
            <div>
              <Lbl>Country</Lbl>
              <SearchableSelect
                options={allCountries}
                value={form.countryIso}
                onChange={setCountry}
                placeholder="Country"
              />
            </div>
            <div>
              <Lbl>State</Lbl>
              <SearchableSelect
                options={[{value: "", label: "— All —"}, ...stateOptions]}
                value={form.stateIso}
                onChange={setState}
                placeholder={form.countryIso ? "State" : "Pick country"}
                disabled={!form.countryIso}
              />
            </div>
          </div>
          <div style={{marginBottom: 16}}>
            <Lbl opt>City</Lbl>
            <input
              value={form.city}
              onChange={set("city")}
              style={inp}
              onFocus={onF}
              onBlur={onB}
              placeholder="e.g. Ijebu-Ode"
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
            Pricing
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 1fr",
              gap: 10,
              marginBottom: 12,
            }}>
            <div>
              <Lbl>Currency</Lbl>
              <input
                value={form.currency}
                onChange={set("currency")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="NGN"
              />
            </div>
            <div>
              <Lbl>Symbol</Lbl>
              <input
                value={form.currency_symbol}
                onChange={set("currency_symbol")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="₦"
              />
            </div>
            <div>
              <Lbl>Base Price</Lbl>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.base_price}
                onChange={set("base_price")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="0.00"
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}>
            <Lbl opt>Area Overrides</Lbl>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  area_overrides: [...f.area_overrides, {area: "", price: "", is_special: false}],
                }))
              }
              style={{
                background: "none",
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: 7,
                color: "rgba(255,255,255,0.4)",
                fontSize: 10,
                padding: "3px 10px",
                cursor: "pointer",
              }}>
              + Area
            </button>
          </div>
          {form.area_overrides.map((a, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 32px 32px",
                gap: 6,
                marginBottom: 6,
                alignItems: "center",
              }}>
              <input
                value={a.area}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    area_overrides: f.area_overrides.map((x, j) => (j === i ? {...x, area: v} : x)),
                  }));
                }}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="Area name"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={a.price}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    area_overrides: f.area_overrides.map((x, j) =>
                      j === i ? {...x, price: v} : x,
                    ),
                  }));
                }}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    area_overrides: f.area_overrides.map((x, j) =>
                      j === i ? {...x, is_special: !x.is_special} : x,
                    ),
                  }))
                }
                title={a.is_special ? "Special" : "Regular"}
                style={{
                  width: 32,
                  height: 34,
                  background: a.is_special ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${a.is_special ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: a.is_special ? "#eab308" : "rgba(255,255,255,0.2)",
                }}>
                ★
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    area_overrides: f.area_overrides.filter((_, j) => j !== i),
                  }))
                }
                style={{
                  width: 32,
                  height: 34,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <Icon name="x" size={10} color="#ef4444" />
              </button>
            </div>
          ))}
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
            }}>
            {saving ? "Creating…" : "Create Rate"}
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
            }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PICKUP LOCATIONS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function PickupDrawer({loc, brandMap, onClose, onRefresh}) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const allCountries = useMemo(
    () => Country.getAllCountries().map((c) => ({value: c.isoCode, label: c.name, flag: c.flag})),
    [],
  );
  const [form, setForm] = useState({
    name: loc.name || "",
    address: loc.address || "",
    city: loc.city || "",
    state: loc.state || "",
    state_code: loc.state_code || "",
    country: loc.country || "",
    country_code: loc.country_code || "",
    phone: loc.phone || "",
    instructions: loc.instructions || "",
    active: loc.active ?? true,
  });

  const stateOptions = useMemo(
    () =>
      form.country_code
        ? State.getStatesOfCountry(form.country_code).map((s) => ({
            value: s.isoCode,
            label: s.name,
          }))
        : [],
    [form.country_code],
  );

  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const setCountry = (iso) => {
    const c = Country.getCountryByCode(iso);
    setForm((f) => ({...f, country_code: iso, country: c?.name || "", state_code: "", state: ""}));
  };
  const setState = (iso) => {
    const s = stateOptions.find((o) => o.value === iso);
    setForm((f) => ({...f, state_code: iso, state: s?.label || ""}));
  };

  const brand = loc.brand_id ? brandMap[loc.brand_id] : null;
  const flag = (() => {
    if (!loc.country_code) return null;
    const c = Country.getCountryByCode(loc.country_code);
    return c?.flag || null;
  })();

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateAdminPickupLocation(loc.id, form);
      setEditMode(false);
      onRefresh();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
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
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <div style={{display: "flex", alignItems: "center", gap: 12}}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: loc.active ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Icon
                name="map-pin"
                size={20}
                color={loc.active ? "#ef4444" : "rgba(255,255,255,0.3)"}
              />
            </div>
            <div>
              <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>{loc.name}</p>
              <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                {[loc.city, loc.state, loc.country].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
          <div style={{display: "flex", gap: 8, alignItems: "center"}}>
            <button
              onClick={() => {
                setEditMode((p) => !p);
                setSaveError(null);
              }}
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
        <div style={{padding: "18px 22px", flex: 1}}>
          <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18}}>
            <Badge
              label={loc.active ? "Active" : "Inactive"}
              color={loc.active ? "#22c55e" : "#6b7280"}
            />
            {brand && (
              <Badge
                label={brand.name || brand.brand_name || `Brand #${loc.brand_id}`}
                color="#a855f7"
              />
            )}
          </div>

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
                Edit Pickup Location
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                <div>
                  <Lbl>Name</Lbl>
                  <input
                    value={form.name}
                    onChange={set("name")}
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder="Location name"
                  />
                </div>
                <div>
                  <Lbl>Address</Lbl>
                  <input
                    value={form.address}
                    onChange={set("address")}
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder="Full address"
                  />
                </div>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                  <div>
                    <Lbl>Country</Lbl>
                    <SearchableSelect
                      options={allCountries}
                      value={form.country_code}
                      onChange={setCountry}
                      placeholder="Country"
                    />
                  </div>
                  <div>
                    <Lbl>State</Lbl>
                    <SearchableSelect
                      options={[{value: "", label: "— All —"}, ...stateOptions]}
                      value={form.state_code}
                      onChange={setState}
                      placeholder={form.country_code ? "State" : "Pick country"}
                      disabled={!form.country_code}
                    />
                  </div>
                </div>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                  <div>
                    <Lbl>City</Lbl>
                    <input
                      value={form.city}
                      onChange={set("city")}
                      style={inp}
                      onFocus={onF}
                      onBlur={onB}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Lbl>Phone</Lbl>
                    <input
                      value={form.phone}
                      onChange={set("phone")}
                      style={inp}
                      onFocus={onF}
                      onBlur={onB}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div>
                  <Lbl opt>Instructions</Lbl>
                  <textarea
                    value={form.instructions}
                    onChange={set("instructions")}
                    rows={3}
                    style={{...inp, resize: "vertical", lineHeight: 1.6}}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder="Pickup instructions…"
                  />
                </div>
                <label
                  onClick={() => setForm((f) => ({...f, active: !f.active}))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    userSelect: "none",
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 9,
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <div
                    style={{
                      width: 36,
                      height: 20,
                      borderRadius: 99,
                      background: form.active ? "#22c55e" : "rgba(255,255,255,0.1)",
                      position: "relative",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}>
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: form.active ? 18 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                      }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 11,
                        fontWeight: 700,
                        margin: 0,
                      }}>
                      {form.active ? "Active" : "Inactive"}
                    </p>
                    <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0}}>
                      Visible to customers
                    </p>
                  </div>
                </label>
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
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                }}>
                Location Info
              </p>
              <DetailRow label="Name" value={loc.name} />
              <DetailRow label="Address" value={loc.address} />
              <DetailRow label="City" value={loc.city || "—"} />
              <DetailRow label="State" value={loc.state || "—"} />
              <DetailRow label="Country" value={loc.country || "—"} />
              <DetailRow label="Phone" value={loc.phone || "—"} />
              <DetailRow
                label="Status"
                value={loc.active ? "Active" : "Inactive"}
                accent={loc.active ? "#22c55e" : "#6b7280"}
              />
              <DetailRow label="Created" value={fmt(loc.created_at)} />
              {loc.instructions && (
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
                    Instructions
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 12,
                      lineHeight: 1.6,
                      fontStyle: "italic",
                      margin: 0,
                    }}>
                    "{loc.instructions}"
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreatePickupDrawer({brands, onClose, onCreated}) {
  const allCountries = useMemo(
    () => Country.getAllCountries().map((c) => ({value: c.isoCode, label: c.name, flag: c.flag})),
    [],
  );
  const [form, setForm] = useState({
    brand_id: "",
    name: "",
    address: "",
    city: "",
    state: "",
    state_code: "",
    country: "",
    country_code: "",
    phone: "",
    instructions: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const stateOptions = useMemo(
    () =>
      form.country_code
        ? State.getStatesOfCountry(form.country_code).map((s) => ({
            value: s.isoCode,
            label: s.name,
          }))
        : [],
    [form.country_code],
  );
  const brandOptions = useMemo(
    () => [
      {value: "", label: "— Select brand —"},
      ...brands.map((b) => ({
        value: String(b.id),
        label: b.name || b.brand_name || `Brand #${b.id}`,
      })),
    ],
    [brands],
  );
  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));
  const setCountry = (iso) => {
    const c = Country.getCountryByCode(iso);
    setForm((f) => ({...f, country_code: iso, country: c?.name || "", state_code: "", state: ""}));
  };
  const setState = (iso) => {
    const s = stateOptions.find((o) => o.value === iso);
    setForm((f) => ({...f, state_code: iso, state: s?.label || ""}));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.address.trim()) {
      setError("Address is required.");
      return;
    }
    if (!form.brand_id) {
      setError("Brand is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createAdminPickupLocation({...form, brand_id: parseInt(form.brand_id)});
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
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
              Pickup
            </p>
            <p style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
              New Pickup Location
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
          style={{
            padding: "20px 24px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 9,
                padding: "10px 14px",
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

          <div>
            <Lbl>Brand</Lbl>
            <SearchableSelect
              options={brandOptions}
              value={String(form.brand_id)}
              onChange={(v) => setForm((f) => ({...f, brand_id: v}))}
              placeholder="Select brand"
            />
          </div>
          <div>
            <Lbl>Location Name</Lbl>
            <input
              value={form.name}
              onChange={set("name")}
              style={inp}
              onFocus={onF}
              onBlur={onB}
              placeholder="e.g. Lagos Island Store"
            />
          </div>
          <div>
            <Lbl>Address</Lbl>
            <input
              value={form.address}
              onChange={set("address")}
              style={inp}
              onFocus={onF}
              onBlur={onB}
              placeholder="14 Broad Street"
            />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            <div>
              <Lbl>Country</Lbl>
              <SearchableSelect
                options={allCountries}
                value={form.country_code}
                onChange={setCountry}
                placeholder="Country"
              />
            </div>
            <div>
              <Lbl>State</Lbl>
              <SearchableSelect
                options={[{value: "", label: "— All —"}, ...stateOptions]}
                value={form.state_code}
                onChange={setState}
                placeholder={form.country_code ? "State" : "Pick country"}
                disabled={!form.country_code}
              />
            </div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            <div>
              <Lbl>City</Lbl>
              <input
                value={form.city}
                onChange={set("city")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="City"
              />
            </div>
            <div>
              <Lbl opt>Phone</Lbl>
              <input
                value={form.phone}
                onChange={set("phone")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="Phone number"
              />
            </div>
          </div>
          <div>
            <Lbl opt>Instructions</Lbl>
            <textarea
              value={form.instructions}
              onChange={set("instructions")}
              rows={3}
              style={{...inp, resize: "vertical", lineHeight: 1.6}}
              onFocus={onF}
              onBlur={onB}
              placeholder="Pickup instructions…"
            />
          </div>
          <label
            onClick={() => setForm((f) => ({...f, active: !f.active}))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              userSelect: "none",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
            <div
              style={{
                width: 36,
                height: 20,
                borderRadius: 99,
                background: form.active ? "#22c55e" : "rgba(255,255,255,0.1)",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}>
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: form.active ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}
              />
            </div>
            <div>
              <p style={{color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, margin: 0}}>
                {form.active ? "Active" : "Inactive"}
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
            }}>
            {saving ? "Creating…" : "Add Location"}
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
            }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminLocalShipping() {
  const [tab, setTab] = useState("rates");

  // ── Shared state ──
  const [brands, setBrands] = useState([]);
  const [confirm, setConfirm] = useState(null);

  // ── Rates state ──
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [rateSearch, setRateSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [selectedRate, setSelectedRate] = useState(null);
  const [showCreateRate, setShowCreateRate] = useState(false);

  // ── Pickup state ──
  const [pickups, setPickups] = useState([]);
  const [pickupsLoading, setPickupsLoading] = useState(true);
  const [pickupSearch, setPickupSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [showCreatePickup, setShowCreatePickup] = useState(false);

  const loadBrands = useCallback(() => {
    getBrands({per_page: 200})
      .then((d) => setBrands(d?.brands || (Array.isArray(d) ? d : [])))
      .catch(() => {});
  }, []);

  const loadRates = useCallback(() => {
    setRatesLoading(true);
    getLocalShippingRates()
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setRates(list);
        if (selectedRate) {
          const u = list.find((r) => r.id === selectedRate.id);
          if (u) setSelectedRate(u);
          else setSelectedRate(null);
        }
      })
      .catch(console.error)
      .finally(() => setRatesLoading(false));
  }, []);

  const loadPickups = useCallback(() => {
    setPickupsLoading(true);
    getAdminPickupLocations()
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setPickups(list);
        if (selectedPickup) {
          const u = list.find((p) => p.id === selectedPickup.id);
          if (u) setSelectedPickup(u);
          else setSelectedPickup(null);
        }
      })
      .catch(console.error)
      .finally(() => setPickupsLoading(false));
  }, []);

  useEffect(() => {
    loadBrands();
    loadRates();
    loadPickups();
  }, []);

  const brandMap = useMemo(() => {
    const m = {};
    brands.forEach((b) => {
      m[b.id] = b;
    });
    return m;
  }, [brands]);

  // ── Rates filtered ──
  const filteredRates = useMemo(() => {
    let list = rates;
    if (rateSearch.trim()) {
      const q = rateSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.country?.toLowerCase().includes(q) ||
          r.state?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q),
      );
    }
    if (brandFilter) list = list.filter((r) => String(r.brand_id) === brandFilter);
    return list;
  }, [rates, rateSearch, brandFilter]);

  // ── Pickups filtered ──
  const filteredPickups = useMemo(() => {
    let list = pickups;
    if (pickupSearch.trim()) {
      const q = pickupSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.state?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q),
      );
    }
    if (statusFilter === "active") list = list.filter((p) => p.active);
    if (statusFilter === "inactive") list = list.filter((p) => !p.active);
    return list;
  }, [pickups, pickupSearch, statusFilter]);

  const uniqueCountries = useMemo(() => new Set(rates.map((r) => r.country_code)).size, [rates]);
  const activePickups = pickups.filter((p) => p.active).length;

  const brandFilterOptions = useMemo(() => {
    const ids = [...new Set(rates.map((r) => r.brand_id).filter(Boolean))];
    return ids.map((id) => {
      const b = brandMap[id];
      return {value: String(id), label: b?.name || b?.brand_name || `Brand #${id}`};
    });
  }, [rates, brandMap]);

  const handleConfirmDelete = async () => {
    try {
      if (confirm.type === "rate") {
        await deleteLocalShippingRate(confirm.item.id);
        setSelectedRate(null);
        loadRates();
      }
      if (confirm.type === "pickup") {
        await deleteAdminPickupLocation(confirm.item.id);
        setSelectedPickup(null);
        loadPickups();
      }
    } catch (e) {
      console.error(e);
    }
    setConfirm(null);
  };

  // ── Rate table columns ──
  const rateCols = [
    {
      key: "flag",
      label: "",
      render: (r) => {
        const c = r.country_code ? Country.getCountryByCode(r.country_code) : null;
        return (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}>
            {c?.flag || "🌍"}
          </div>
        );
      },
    },
    {
      key: "location",
      label: "Location",
      render: (r) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>
            {r.city ? `${r.city}, ` : ""}
            {r.country}
          </p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
            {r.state || "All states"}
          </p>
        </div>
      ),
    },
    {
      key: "price",
      label: "Base Price",
      render: (r) => (
        <span
          style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.95rem", color: "#ef4444"}}>
          {r.currency_symbol}
          {Number(r.base_price).toLocaleString(undefined, {minimumFractionDigits: 2})}
        </span>
      ),
    },
    {
      key: "currency",
      label: "Currency",
      render: (r) => <Badge label={r.currency || "—"} color="#3b82f6" />,
    },
    {
      key: "areas",
      label: "Areas",
      render: (r) => {
        const n = (() => {
          try {
            const p =
              typeof r.area_overrides === "string"
                ? JSON.parse(r.area_overrides)
                : r.area_overrides;
            return Array.isArray(p) ? p.length : 0;
          } catch {
            return 0;
          }
        })();
        return n > 0 ? (
          <Badge label={`${n}`} color="#f97316" />
        ) : (
          <span style={{color: "rgba(255,255,255,0.15)", fontSize: 11}}>—</span>
        );
      },
    },
    {
      key: "brand",
      label: "Brand",
      render: (r) => {
        const b = r.brand_id ? brandMap[r.brand_id] : null;
        return b ? (
          <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>
            {b.name || b.brand_name}
          </span>
        ) : (
          <span style={{color: "rgba(255,255,255,0.15)", fontSize: 11}}>—</span>
        );
      },
    },
    {
      key: "created",
      label: "Created",
      render: (r) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmt(r.created_at)}</span>
      ),
    },
  ];

  // ── Pickup table columns ──
  const pickupCols = [
    {
      key: "icon",
      label: "",
      render: (p) => (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: p.active ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Icon name="map-pin" size={14} color={p.active ? "#ef4444" : "rgba(255,255,255,0.2)"} />
        </div>
      ),
    },
    {
      key: "name",
      label: "Location",
      render: (p) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>{p.name}</p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>{p.address}</p>
        </div>
      ),
    },
    {
      key: "city",
      label: "City",
      render: (p) => (
        <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>
          {[p.city, p.state].filter(Boolean).join(", ")}
        </span>
      ),
    },
    {
      key: "country",
      label: "Country",
      render: (p) => {
        const c = p.country_code ? Country.getCountryByCode(p.country_code) : null;
        return (
          <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>
            {c?.flag || ""} {p.country || "—"}
          </span>
        );
      },
    },
    {
      key: "phone",
      label: "Phone",
      render: (p) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{p.phone || "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <Badge label={p.active ? "Active" : "Inactive"} color={p.active ? "#22c55e" : "#6b7280"} />
      ),
    },
    {
      key: "created",
      label: "Created",
      render: (p) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmt(p.created_at)}</span>
      ),
    },
  ];

  return (
    <div>
      <AnimatePresence>
        {selectedRate && (
          <RateDrawer
            rate={selectedRate}
            brandMap={brandMap}
            onClose={() => setSelectedRate(null)}
            onRefresh={loadRates}
          />
        )}
        {showCreateRate && (
          <CreateRateDrawer
            brands={brands}
            onClose={() => setShowCreateRate(false)}
            onCreated={loadRates}
          />
        )}
        {selectedPickup && (
          <PickupDrawer
            loc={selectedPickup}
            brandMap={brandMap}
            onClose={() => setSelectedPickup(null)}
            onRefresh={loadPickups}
          />
        )}
        {showCreatePickup && (
          <CreatePickupDrawer
            brands={brands}
            onClose={() => setShowCreatePickup(false)}
            onCreated={loadPickups}
          />
        )}
        {confirm && (
          <ConfirmModal
            title={confirm.type === "rate" ? "Delete Rate" : "Delete Location"}
            message={
              confirm.type === "rate"
                ? `Delete rate for ${confirm.item.city ? `${confirm.item.city}, ` : ""}${confirm.item.country}?`
                : `Delete "${confirm.item.name}"?`
            }
            confirmLabel="Delete"
            danger
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Tab switcher ── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 18,
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: 5,
          width: "fit-content",
          maxWidth: "100%",
        }}>
        {[
          {id: "rates", label: "Shipping Rates", count: rates.length},
          {id: "pickup", label: "Pickup Locations", count: pickups.length},
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: tab === t.id ? "#ef4444" : "none",
              color: tab === t.id ? "#fff" : "rgba(255,255,255,0.38)",
              border: "none",
              borderRadius: 9,
              padding: "9px 18px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.18s",
              whiteSpace: "nowrap",
            }}>
            {t.label}
            <span style={{fontSize: 10, opacity: 0.7}}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* ═══ RATES TAB ═══ */}
      {tab === "rates" && (
        <>
          {brandFilterOptions.length > 0 && (
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
                Brand
              </p>
              <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
                <button
                  onClick={() => setBrandFilter("")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: `1px solid ${!brandFilter ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                    background: !brandFilter ? "rgba(239,68,68,0.1)" : "transparent",
                    color: !brandFilter ? "#ef4444" : "rgba(255,255,255,0.45)",
                  }}>
                  All
                </button>
                {brandFilterOptions.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setBrandFilter(f.value)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `1px solid ${brandFilter === f.value ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.1)"}`,
                      background: brandFilter === f.value ? "rgba(168,85,247,0.1)" : "transparent",
                      color: brandFilter === f.value ? "#a855f7" : "rgba(255,255,255,0.45)",
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <SearchBar
            value={rateSearch}
            onChange={setRateSearch}
            placeholder="Search by country, state, city..."
            actions={
              <div style={{display: "flex", gap: 8}}>
                <button
                  onClick={() => setShowCreateRate(true)}
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
                  + New Rate
                </button>
                <button
                  onClick={loadRates}
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
                {filteredRates.length} rate{filteredRates.length !== 1 ? "s" : ""} ·{" "}
                {uniqueCountries} countr{uniqueCountries !== 1 ? "ies" : "y"}
              </p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
                Click a row to view
              </p>
            </div>
            <AdminTable
              columns={rateCols}
              rows={filteredRates}
              loading={ratesLoading}
              onRowClick={(r) => setSelectedRate(r)}
              emptyMsg="No local shipping rates found."
            />
          </div>
        </>
      )}

      {/* ═══ PICKUP TAB ═══ */}
      {tab === "pickup" && (
        <>
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
              Status
            </p>
            <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
              {[
                {value: "", label: "All"},
                {value: "active", label: "Active"},
                {value: "inactive", label: "Inactive"},
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: `1px solid ${statusFilter === f.value ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                    background: statusFilter === f.value ? "rgba(239,68,68,0.1)" : "transparent",
                    color: statusFilter === f.value ? "#ef4444" : "rgba(255,255,255,0.45)",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <SearchBar
            value={pickupSearch}
            onChange={setPickupSearch}
            placeholder="Search by name, city, address..."
            actions={
              <div style={{display: "flex", gap: 8}}>
                <button
                  onClick={() => setShowCreatePickup(true)}
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
                  + New Location
                </button>
                <button
                  onClick={loadPickups}
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
                {filteredPickups.length} location{filteredPickups.length !== 1 ? "s" : ""} ·{" "}
                {activePickups} active
              </p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
                Click a row to view
              </p>
            </div>
            <AdminTable
              columns={pickupCols}
              rows={filteredPickups}
              loading={pickupsLoading}
              onRowClick={(p) => setSelectedPickup(p)}
              emptyMsg="No pickup locations found."
            />
          </div>
        </>
      )}
    </div>
  );
}
