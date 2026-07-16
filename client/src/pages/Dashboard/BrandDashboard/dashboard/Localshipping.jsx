import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import {createPortal} from "react-dom";
import {motion, AnimatePresence} from "framer-motion";
import { useGeo } from "../../../../utils/geo";
import PhoneInput from "../../../../components/phoneinput";
import {
  getLocalShippingRates,
  saveLocalShippingRate,
  deleteLocalShippingRate,
  getPickupLocations,
  savePickupLocation,
  updatePickupLocation,
  deletePickupLocation,
} from "./dashboard_components/api";

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler, {passive: true});
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── Currency code → symbol map ───────────────────────────────────────────────
const CURRENCY_SYMBOLS = {
  AED: "د.إ", AFN: "؋", ALL: "L", AMD: "֏", AOA: "Kz", ARS: "$",
  AUD: "A$", AZN: "₼", BAM: "KM", BBD: "Bds$", BDT: "৳", BGN: "лв",
  BHD: ".د.ب", BIF: "Fr", BMD: "$", BND: "B$", BOB: "Bs.", BRL: "R$",
  BSD: "B$", BTN: "Nu", BWP: "P", BYN: "Br", BZD: "BZ$", CAD: "C$",
  CDF: "Fr", CHF: "Fr", CLP: "$", CNY: "¥", COP: "$", CRC: "₡",
  CUP: "$", CVE: "$", CZK: "Kč", DJF: "Fr", DKK: "kr", DOP: "RD$",
  DZD: "دج", EGP: "E£", ERN: "Nfk", ETB: "Br", EUR: "€", FJD: "FJ$",
  FKP: "£", GBP: "£", GEL: "₾", GHS: "₵", GIP: "£", GMD: "D",
  GNF: "Fr", GTQ: "Q", GYD: "G$", HKD: "HK$", HNL: "L", HRK: "kn",
  HTG: "G", HUF: "Ft", IDR: "Rp", ILS: "₪", INR: "₹", IQD: "ع.د",
  IRR: "﷼", ISK: "kr", JMD: "J$", JOD: "JD", JPY: "¥", KES: "KSh",
  KGS: "с", KHR: "៛", KMF: "Fr", KPW: "₩", KRW: "₩", KWD: "د.ك",
  KYD: "CI$", KZT: "₸", LAK: "₭", LBP: "ل.ل", LKR: "Rs", LRD: "L$",
  LSL: "M", LYD: "LD", MAD: "MAD", MDL: "L", MGA: "Ar", MKD: "ден",
  MMK: "K", MNT: "₮", MOP: "P", MRU: "UM", MUR: "Rs", MVR: "Rf",
  MWK: "MK", MXN: "$", MYR: "RM", MZN: "MT", NAD: "N$", NGN: "₦",
  NIO: "C$", NOK: "kr", NPR: "Rs", NZD: "NZ$", OMR: "ر.ع.", PAB: "B/.",
  PEN: "S/.", PGK: "K", PHP: "₱", PKR: "Rs", PLN: "zł", PYG: "₲",
  QAR: "ر.ق", RON: "lei", RSD: "din", RUB: "₽", RWF: "Fr", SAR: "﷼",
  SBD: "SI$", SCR: "Rs", SDG: "ج.س.", SEK: "kr", SGD: "S$", SHP: "£",
  SLL: "Le", SOS: "Sh", SRD: "$", STN: "Db", SVC: "₡", SYP: "£",
  SZL: "L", THB: "฿", TJS: "SM", TMT: "T", TND: "د.ت", TOP: "T$",
  TRY: "₺", TTD: "TT$", TWD: "NT$", TZS: "Sh", UAH: "₴", UGX: "Sh",
  USD: "$", UYU: "$U", UZS: "лв", VES: "Bs.S", VND: "₫", VUV: "Vt",
  WST: "T", XAF: "Fr", XCD: "$", XOF: "Fr", XPF: "Fr", YER: "﷼",
  ZAR: "R", ZMW: "ZK", ZWL: "$",
};

function getCurrencySymbol(code) {
  if (!code) return "";
  return CURRENCY_SYMBOLS[code.toUpperCase()] || code;
}

// ─── Portal dropdown ──────────────────────────────────────────────────────────
function SearchSelect({options, value, onChange, placeholder, disabled}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({top: 0, left: 0, width: 0});

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options.slice(0, 250);
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 250);
  }, [options, query]);

  const syncCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) {
      setOpen(false);
      return;
    }
    // ── Responsive: keep dropdown within viewport width ──
    const vw = window.innerWidth;
    const dropW = Math.min(r.width, vw - 16); // never wider than viewport − 16px margin
    const left  = Math.max(8, Math.min(r.left, vw - dropW - 8));
    setCoords({top: r.bottom + 6, left, width: dropW});
  }, []);

  const openDropdown = useCallback(() => {
    if (disabled || !triggerRef.current) return;
    syncCoords();
    setOpen(true);
  }, [disabled, syncCoords]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", syncCoords, {passive: true, capture: true});
    window.addEventListener("resize", syncCoords, {passive: true});
    return () => {
      window.removeEventListener("scroll", syncCoords, {capture: true});
      window.removeEventListener("resize", syncCoords);
    };
  }, [open, syncCoords]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  const pick = (opt) => { onChange(opt.value); setOpen(false); };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        style={{
          width: "100%",
          background: disabled ? "rgba(255,255,255,0.02)" : open ? "#1e1e1e" : "#141414",
          border: `1px solid ${open ? "rgba(239,68,68,0.55)" : disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 10,
          padding: "11px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.18s",
          outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
        }}>
        <div style={{display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0}}>
          {selected?.flag && (
            <span style={{fontSize: 16, lineHeight: 1, flexShrink: 0}}>{selected.flag}</span>
          )}
          <span style={{
            fontSize: 13,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: disabled ? "rgba(255,255,255,0.18)" : selected ? "#fff" : "rgba(255,255,255,0.28)",
          }}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <svg
          style={{flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s"}}
          width="11" height="11" fill="none" viewBox="0 0 24 24"
          stroke={disabled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"} strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            background: "#181818",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 12,
            zIndex: 99999,
            boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(239,68,68,0.08)",
            overflow: "hidden",
          }}>
          <div style={{padding: "10px 10px 8px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#1e1e1e"}}>
            <div style={{position: "relative"}}>
              <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"
                viewBox="0 0 24 24"
                style={{position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none"}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "8px 10px 8px 32px",
                  color: "#fff", fontSize: 12, outline: "none",
                  fontFamily: "inherit", transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
          </div>
          <div style={{maxHeight: 260, overflowY: "auto"}}>
            {filtered.length === 0 ? (
              <div style={{padding: "18px", color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center"}}>
                No results for "{query}"
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => pick(opt)}
                    style={{
                      width: "100%", textAlign: "left", border: "none",
                      padding: "9px 14px", cursor: "pointer", fontSize: 13,
                      background: isSelected ? "rgba(239,68,68,0.1)" : "transparent",
                      color: isSelected ? "#ef4444" : "rgba(255,255,255,0.72)",
                      display: "flex", alignItems: "center", gap: 9, transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    {opt.flag && <span style={{fontSize: 15, lineHeight: 1, flexShrink: 0}}>{opt.flag}</span>}
                    <span style={{flex: 1}}>{opt.label}</span>
                    {isSelected && (
                      <svg width="11" height="11" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24">
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

// ─── Shared primitives ────────────────────────────────────────────────────────
function Label({children}) {
  return (
    <p style={{
      color: "rgba(255,255,255,0.38)", fontSize: 10, fontWeight: 700,
      letterSpacing: "0.2em", textTransform: "uppercase",
      marginBottom: 7, marginTop: 0,
    }}>
      {children}
    </p>
  );
}

function Hint({children}) {
  return (
    <p style={{
      color: "rgba(255,255,255,0.2)", fontSize: 11,
      marginTop: 6, lineHeight: 1.55, marginBottom: 0,
    }}>
      {children}
    </p>
  );
}

function Toast({msg, type}) {
  const isOk = type === "ok";
  return (
    <div style={{
      background: isOk ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${isOk ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.28)"}`,
      borderRadius: 10, padding: "11px 14px",
      color: isOk ? "#22c55e" : "#ef4444",
      fontSize: 13, display: "flex", alignItems: "center", gap: 8,
    }}>
      {isOk ? (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
      )}
      {msg}
    </div>
  );
}

function FieldInput({label, hint, placeholder, value, onChange, type = "text", prefix, disabled}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div style={{position: "relative"}}>
        {prefix && (
          <span style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 48,
            borderRight: `1px solid ${focused ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)"}`,
            color: focused ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
            fontSize: 18, fontWeight: 700, pointerEvents: "none", zIndex: 1,
            transition: "color 0.18s, border-color 0.18s",
            borderRadius: "10px 0 0 10px",
            background: focused ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
          }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: disabled ? "rgba(255,255,255,0.02)" : focused ? "#161616" : "#111",
            border: `1px solid ${focused ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
            color: disabled ? "rgba(255,255,255,0.2)" : "#fff",
            fontSize: 15, fontWeight: 600,
            padding: prefix ? "11px 14px 11px 60px" : "11px 14px",
            borderRadius: 10, outline: "none", fontFamily: "inherit",
            transition: "all 0.18s",
            boxShadow: focused ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
          }}
        />
      </div>
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

function FieldTextarea({label, hint, placeholder, value, onChange, rows = 3}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <Label>{label}</Label>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box", resize: "vertical",
          background: focused ? "#161616" : "#111",
          border: `1px solid ${focused ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
          color: "#fff", fontSize: 13, padding: "11px 14px", borderRadius: 10,
          outline: "none", fontFamily: "inherit", lineHeight: 1.65,
          transition: "all 0.18s",
          boxShadow: focused ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
        }}
      />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

function Toggle({value, onChange, onLabel = "Active", offLabel = "Inactive"}) {
  return (
    <div
      style={{display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none"}}
      onClick={() => onChange(!value)}>
      <div style={{
        width: 46, height: 26, borderRadius: 99,
        background: value ? "#ef4444" : "rgba(255,255,255,0.1)",
        position: "relative", flexShrink: 0, transition: "background 0.2s",
        border: `1px solid ${value ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.15)"}`,
      }}>
        <motion.div
          animate={{x: value ? 22 : 2}}
          transition={{type: "spring", stiffness: 500, damping: 32}}
          style={{
            position: "absolute", top: 4, width: 16, height: 16,
            borderRadius: "50%", background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}
        />
      </div>
      <div>
        <span style={{fontSize: 13, fontWeight: 600, color: value ? "#fff" : "rgba(255,255,255,0.35)"}}>
          {value ? onLabel : offLabel}
        </span>
        <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: "1px 0 0"}}>
          {value ? "Visible to customers at checkout" : "Hidden from customers"}
        </p>
      </div>
    </div>
  );
}

function PrimaryBtn({children, onClick, disabled, loading, icon, fullWidth}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: fullWidth ? "100%" : undefined,
        background: "#ef4444", color: "#fff", border: "none",
        borderRadius: 10, padding: "11px 20px",
        fontSize: 11, fontWeight: 900, letterSpacing: "0.16em",
        textTransform: "uppercase",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 7, opacity: disabled || loading ? 0.55 : 1, transition: "all 0.18s",
      }}
      onMouseEnter={(e) => { if (!disabled && !loading) e.currentTarget.style.background = "#dc2626"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#ef4444"; }}>
      {loading ? (
        <span style={{
          width: 13, height: 13,
          border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
          borderRadius: "50%", animation: "lspin 0.7s linear infinite",
        }} />
      ) : icon}
      {children}
    </button>
  );
}

function GhostBtn({children, onClick}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none", color: "rgba(255,255,255,0.4)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10, padding: "11px 20px",
        fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.18s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        e.currentTarget.style.color = "rgba(255,255,255,0.4)";
      }}>
      {children}
    </button>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────
function ConfirmDelete({msg, onConfirm, onCancel}) {
  return (
    <motion.div
      initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(6px)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,                              // ← padding so modal never touches edges
      }}>
      <motion.div
        initial={{scale: 0.92, y: 16}} animate={{scale: 1, y: 0}}
        exit={{scale: 0.92, y: 16}}
        transition={{type: "spring", stiffness: 320, damping: 28}}
        style={{
          width: "100%", maxWidth: 400,
          background: "#111", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
        }}>
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,#dc2626)"}} />
        <div style={{padding: "26px"}}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
          }}>
            <svg width="18" height="18" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p style={{color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 8}}>Remove this?</p>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24, lineHeight: 1.65}}>{msg}</p>
          <div style={{display: "flex", gap: 10}}>
            <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
            <div style={{flex: 1}}>
              <PrimaryBtn onClick={onConfirm} fullWidth>Delete</PrimaryBtn>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({title, subtitle, action, children}) {
  return (
    <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16}}>
      <div style={{
        padding: "16px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{minWidth: 0}}>
          <h3 style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.25rem",
            color: "#fff", letterSpacing: "0.06em", margin: 0, lineHeight: 1,
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{color: "rgba(255,255,255,0.28)", fontSize: 12, marginTop: 5, marginBottom: 0}}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div style={{flexShrink: 0}}>{action}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Location cascade ─────────────────────────────────────────────────────────
function LocationCascade({value, onChange, showCity = true, cityOptional = false}) {
  const {countryIso = "", stateIso = "", cityName = ""} = value;
  const { Country, State, City, loaded } = useGeo();
  const w = useWindowWidth();
  const isMobile = w < 640;

  const countryOptions = useMemo(
    () => loaded ? Country.getAllCountries().map((c) => ({value: c.isoCode, label: c.name, flag: c.flag})) : [],
    [loaded, Country],
  );
  const stateOptions = useMemo(
    () => loaded && countryIso ? State.getStatesOfCountry(countryIso).map((s) => ({value: s.isoCode, label: s.name})) : [],
    [loaded, State, countryIso],
  );
  const cityOptions = useMemo(
    () => loaded && countryIso && stateIso ? City.getCitiesOfState(countryIso, stateIso).map((c) => ({value: c.name, label: c.name})) : [],
    [loaded, City, countryIso, stateIso],
  );

  const setCountry = (iso) => {
    const c = loaded ? Country.getCountryByCode(iso) : null;
    onChange({
      countryIso: iso, countryName: c?.name || "",
      currency: c?.currency || "", currencySymbol: getCurrencySymbol(c?.currency),
      stateIso: "", stateName: "", cityName: "",
    });
  };
  const setState = (iso) => {
    const s = loaded ? State.getStateByCodeAndCountry(iso, countryIso) : null;
    onChange({...value, stateIso: iso, stateName: s?.name || "", cityName: ""});
  };
  const setCity = (name) => onChange({...value, cityName: name});

  // ── Responsive columns ──
  // Mobile  → 1 column (all selects stack)
  // Tablet+ → 2 cols when no city, 3 cols when city shown (but only if wide enough)
  const cols = isMobile
    ? "1fr"
    : showCity
      ? w < 900 ? "1fr 1fr" : "1fr 1fr 1fr"   // ← 2-col at 640–899, 3-col at 900+
      : "1fr 1fr";

  return (
    <div style={{display: "grid", gridTemplateColumns: cols, gap: isMobile ? 10 : 14}}>
      <div>
        <Label>Country</Label>
        <SearchSelect options={countryOptions} value={countryIso} onChange={setCountry} placeholder="Select country" />
      </div>
      <div>
        <Label>State / Region</Label>
        <SearchSelect
          options={stateOptions} value={stateIso} onChange={setState}
          placeholder={countryIso ? "Select state" : "Pick country first"}
          disabled={!countryIso}
        />
      </div>
      {showCity && (
        <div style={isMobile || w < 900 ? {gridColumn: "1 / -1"} : {}}>
          {/* ↑ on mobile AND narrow tablet, city spans full width */}
          <Label>
            City
            {cityOptional && (
              <span style={{color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", letterSpacing: 0}}>
                {" "}(optional)
              </span>
            )}
          </Label>
          {cityOptions.length > 0 ? (
            <SearchSelect
              options={cityOptional ? [{value: "", label: "— Whole state —"}, ...cityOptions] : cityOptions}
              value={cityName} onChange={setCity}
              placeholder={stateIso ? "Select city" : "Pick state first"}
              disabled={!stateIso}
            />
          ) : (
            <input
              value={cityName}
              onChange={(e) => setCity(e.target.value)}
              placeholder={stateIso ? "Type city name" : "Pick state first"}
              disabled={!stateIso}
              style={{
                width: "100%", boxSizing: "border-box",
                background: !stateIso ? "rgba(255,255,255,0.02)" : "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                color: !stateIso ? "rgba(255,255,255,0.18)" : "#fff",
                fontSize: 13, padding: "11px 14px", borderRadius: 10,
                outline: "none", fontFamily: "inherit",
                cursor: !stateIso ? "not-allowed" : "text",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── AreaSection ──────────────────────────────────────────────────────────────
function AreaSection({items, onChange, currency, accentColor, accentBg, icon, title, hint, namePlaceholder, pricePlaceholder}) {
  const w = useWindowWidth();
  const isMobile = w < 560;

  const setField = (idx, key, val) => onChange(items.map((r, i) => (i === idx ? {...r, [key]: val} : r)));
  const remove   = (idx) => onChange(items.filter((_, i) => i !== idx));
  const addRow   = () => onChange([...items, {area: "", price: "", is_special: items[0]?.is_special || false}]);

  return (
    <div style={{background: `${accentColor}06`, border: `1px solid ${accentColor}18`, borderRadius: 12, overflow: "hidden"}}>
      {/* Header */}
      <div style={{padding: "12px 16px", borderBottom: `1px solid ${accentColor}14`, display: "flex", alignItems: "center", gap: 8}}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, background: `${accentColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <span style={{color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase"}}>
            {title}
          </span>
          <p style={{color: "rgba(255,255,255,0.22)", fontSize: 11, margin: "2px 0 0", lineHeight: 1.45}}>{hint}</p>
        </div>
        <span style={{
          background: `${accentColor}20`, border: `1px solid ${accentColor}30`,
          borderRadius: 99, padding: "2px 9px", fontSize: 10, fontWeight: 700,
          color: accentColor, flexShrink: 0,
        }}>
          {items.length} {items.length === 1 ? "area" : "areas"}
        </span>
      </div>

      {/* Column headers — desktop only */}
      {!isMobile && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 160px 32px",
          gap: 8, padding: "8px 16px 4px", borderBottom: `1px solid ${accentColor}0a`,
        }}>
          <span style={{color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase"}}>
            Area Name
          </span>
          <span style={{color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase"}}>
            Price ({currency || "—"})
          </span>
          <span />
        </div>
      )}

      {/* Rows */}
      <div style={{padding: "6px 16px 0"}}>
        <AnimatePresence initial={false}>
          {items.map((row, idx) => (
            <motion.div
              key={idx}
              initial={{opacity: 0, height: 0, marginBottom: 0}}
              animate={{opacity: 1, height: "auto", marginBottom: 8}}
              exit={{opacity: 0, height: 0, marginBottom: 0}}
              transition={{duration: 0.18}}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 32px" : "1fr 160px 32px",
                gap: 8,
                alignItems: isMobile ? "flex-start" : "center",
              }}>
              {isMobile ? (
                <div style={{display: "flex", flexDirection: "column", gap: 6}}>
                  <input
                    value={row.area}
                    onChange={(e) => setField(idx, "area", e.target.value)}
                    placeholder={namePlaceholder}
                    style={{
                      boxSizing: "border-box", background: "#111",
                      border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                      fontSize: 13, padding: "9px 12px", borderRadius: 8,
                      outline: "none", fontFamily: "inherit", width: "100%",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = `${accentColor}70`)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <div style={{position: "relative"}}>
                    <span style={{
                      position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.25)", fontSize: 12, pointerEvents: "none",
                    }}>
                      {currency}
                    </span>
                    <input
                      type="number" min="0"
                      value={row.price}
                      onChange={(e) => setField(idx, "price", e.target.value)}
                      placeholder={pricePlaceholder || "0.00"}
                      style={{
                        boxSizing: "border-box", width: "100%", background: "#111",
                        border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                        fontSize: 13, padding: `9px 10px 9px ${currency ? "26px" : "12px"}`,
                        borderRadius: 8, outline: "none", fontFamily: "inherit",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = `${accentColor}70`)}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <input
                    value={row.area}
                    onChange={(e) => setField(idx, "area", e.target.value)}
                    placeholder={namePlaceholder}
                    style={{
                      boxSizing: "border-box", background: "#111",
                      border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                      fontSize: 13, padding: "9px 12px", borderRadius: 8,
                      outline: "none", fontFamily: "inherit", width: "100%",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = `${accentColor}70`)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <div style={{position: "relative"}}>
                    <span style={{
                      position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.25)", fontSize: 12, pointerEvents: "none",
                    }}>
                      {currency}
                    </span>
                    <input
                      type="number" min="0"
                      value={row.price}
                      onChange={(e) => setField(idx, "price", e.target.value)}
                      placeholder={pricePlaceholder || "0.00"}
                      style={{
                        boxSizing: "border-box", width: "100%", background: "#111",
                        border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                        fontSize: 13, padding: `9px 10px 9px ${currency ? "26px" : "12px"}`,
                        borderRadius: 8, outline: "none", fontFamily: "inherit",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = `${accentColor}70`)}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={items.length === 1}
                style={{
                  width: 32, height: 32, display: "flex", alignItems: "center",
                  justifyContent: "center", background: "none", border: "none",
                  borderRadius: 7, cursor: items.length === 1 ? "not-allowed" : "pointer",
                  color: items.length === 1 ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.4)",
                  transition: "color 0.15s", padding: 0,
                  marginTop: isMobile ? 8 : 0,
                  alignSelf: isMobile ? "flex-end" : "center",  // ← aligns to bottom of stacked fields
                }}
                onMouseEnter={(e) => { if (items.length > 1) e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={(e) => { if (items.length > 1) e.currentTarget.style.color = "rgba(239,68,68,0.4)"; }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add row */}
      <div style={{padding: "8px 16px 14px"}}>
        <button
          type="button"
          onClick={addRow}
          style={{
            width: "100%", background: "none",
            border: `1px dashed ${accentColor}35`, borderRadius: 8,
            padding: "9px", fontSize: 11, fontWeight: 700,
            color: `${accentColor}80`, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, transition: "all 0.15s", letterSpacing: "0.12em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accentColor;
            e.currentTarget.style.color = accentColor;
            e.currentTarget.style.background = `${accentColor}08`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${accentColor}35`;
            e.currentTarget.style.color = `${accentColor}80`;
            e.currentTarget.style.background = "none";
          }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Another {title.replace(" Overrides", "").replace(" Areas", "")} Area
        </button>
      </div>
    </div>
  );
}

// ─── AreaOverrides ────────────────────────────────────────────────────────────
function AreaOverrides({areas, onChange, currency}) {
  const regular = areas.filter((a) => !a.is_special);
  const special  = areas.filter((a) => a.is_special);
  const regularRows = regular.length > 0 ? regular : [{area: "", price: "", is_special: false}];
  const specialRows  = special.length  > 0 ? special  : [{area: "", price: "", is_special: true}];

  const updateRegular = (rows) => onChange([...rows.map((r) => ({...r, is_special: false})), ...special]);
  const updateSpecial  = (rows) => onChange([...regular, ...rows.map((r) => ({...r, is_special: true}))]);

  const ICON_PIN = (
    <svg width="12" height="12" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  const ICON_STAR = (
    <svg width="12" height="12" fill="none" stroke="#eab308" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 16}}>
      <AreaSection
        items={regularRows} onChange={updateRegular} currency={currency}
        accentColor="#ef4444" accentBg="rgba(239,68,68,0.05)" icon={ICON_PIN}
        title="Area Overrides"
        hint="Zones with a different price from the base — e.g. Lekki Phase 1, GRA, Ajah"
        namePlaceholder="e.g. Lekki Phase 1" pricePlaceholder="2000"
      />
      <AreaSection
        items={specialRows} onChange={updateSpecial} currency={currency}
        accentColor="#eab308" accentBg="rgba(234,179,8,0.04)" icon={ICON_STAR}
        title="Special Areas"
        hint="Hard-to-reach or premium zones — e.g. ABUAD, Babcock, Nile, Pan-Atlantic"
        namePlaceholder="e.g. AFE BABALOLA UNIVERSITY ADO EKITI" pricePlaceholder="5000"
      />
    </div>
  );
}

// ─── TAB 1: Shipping Rates ────────────────────────────────────────────────────
function ShippingRatesTab() {
  const fmtRate = (amount, symbolOrCode) => {
    const sym = symbolOrCode || "";
    return sym + Number(amount || 0).toLocaleString("en-US", {minimumFractionDigits: 0, maximumFractionDigits: 0});
  };

  const w = useWindowWidth();
  const isMobile = w < 560;

  const [rates, setRates]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const emptyLoc = {countryIso: "", countryName: "", stateIso: "", stateName: "", cityName: "", currency: "", currencySymbol: ""};
  const [loc, setLoc]           = useState(emptyLoc);
  const [basePrice, setBasePrice] = useState("");
  const [areas, setAreas]       = useState([]);

  useEffect(() => { setAreas([]); }, [loc.stateIso, loc.cityName]);

  useEffect(() => {
    getLocalShippingRates()
      .then((d) => setRates(Array.isArray(d) ? d : d?.rates || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!loc.countryIso) return setError("Please select a country.");
    if (!loc.stateIso)   return setError("Please select a state.");
    if (!basePrice || isNaN(+basePrice) || +basePrice < 0) return setError("Enter a valid base price.");
    setSaving(true); setError(""); setSuccess("");
    try {
      const payload = {
        country: loc.countryName, country_code: loc.countryIso,
        state: loc.stateName, state_code: loc.stateIso,
        city: loc.cityName || null, base_price: +basePrice,
        currency: loc.currency, currency_symbol: loc.currencySymbol || "",
        area_overrides: areas
          .filter((a) => a.price !== "" && !isNaN(+a.price))
          .map((a) => ({area: a.area, price: +a.price, is_special: a.is_special || false})),
      };
      const saved = await saveLocalShippingRate(payload);
      setRates((prev) => {
        const idx = prev.findIndex((r) =>
          r.country_code === loc.countryIso && r.state_code === loc.stateIso &&
          (r.city || "") === (loc.cityName || ""),
        );
        if (idx >= 0) { const c = [...prev]; c[idx] = saved; return c; }
        return [...prev, saved];
      });
      const where = [loc.cityName, loc.stateName, loc.countryName].filter(Boolean).join(", ");
      setSuccess(`Shipping rate saved for ${where}.`);
      setLoc(emptyLoc); setBasePrice(""); setAreas([]);
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLocalShippingRate(deleteTarget.id);
      setRates((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) { setError(e.message); }
  };

  const grouped = rates.reduce((acc, r) => {
    const k = r.country || "Other";
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {});

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 24}}>
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDelete
            msg={`Remove rate for ${[deleteTarget.city, deleteTarget.state, deleteTarget.country].filter(Boolean).join(", ")}?`}
            onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Form */}
      <SectionCard title="Set Shipping Rate" subtitle="Choose a location then set your base fee. Add area-level overrides for specific zones.">
        <div style={{padding: isMobile ? "14px" : "22px", display: "flex", flexDirection: "column", gap: 20}}>
          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity: 0, y: -4}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -4}}>
                <Toast msg={error} type="err" />
              </motion.div>
            )}
            {success && (
              <motion.div initial={{opacity: 0, y: -4}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -4}}>
                <Toast msg={success} type="ok" />
              </motion.div>
            )}
          </AnimatePresence>

          <LocationCascade value={loc} onChange={setLoc} showCity cityOptional />

          <AnimatePresence>
            {loc.stateIso && (
              <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: "auto"}} exit={{opacity: 0, height: 0}} style={{overflow: "hidden"}}>
                <FieldInput
                  label={loc.currency ? `Base Shipping Price — ${loc.currency} (${loc.currencySymbol || loc.currency})` : "Base Shipping Price"}
                  type="number" placeholder="e.g. 2500"
                  value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
                  prefix={loc.currencySymbol || loc.currency || undefined}
                  hint={`Default fee for all of ${loc.cityName || loc.stateName || "the selected location"}. Add area overrides below for zones with different prices.`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {loc.stateIso && basePrice && (
              <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: "auto"}} exit={{opacity: 0, height: 0}} style={{overflow: "hidden"}}>
                <div>
                  <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6}}>
                    <Label>
                      Area Overrides &amp; Special Areas{" "}
                      <span style={{color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", letterSpacing: 0}}>
                        (optional)
                      </span>
                    </Label>
                    {areas.length > 0 && (
                      <span style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>{areas.length} total</span>
                    )}
                  </div>
                  <AreaOverrides areas={areas} onChange={setAreas} currency={loc.currencySymbol || loc.currency} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loc.stateIso && (
            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "space-between",
              gap: isMobile ? 10 : 0,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
                {[loc.cityName, loc.stateName, loc.countryName].filter(Boolean).join(" › ")}
              </p>
              <PrimaryBtn
                onClick={handleSave} loading={saving} fullWidth={isMobile}
                icon={
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                }>
                Save Rate
              </PrimaryBtn>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Saved rates */}
      <SectionCard title="Saved Rates" subtitle={`${rates.length} rate${rates.length !== 1 ? "s" : ""} configured`}>
        {loading ? (
          <div style={{padding: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.2)", fontSize: 13}}>
            <span style={{width: 14, height: 14, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.4)", borderRadius: "50%", animation: "lspin 0.7s linear infinite"}} />
            Loading rates…
          </div>
        ) : rates.length === 0 ? (
          <div style={{padding: isMobile ? "36px 14px" : "48px 22px", textAlign: "center"}}>
            <div style={{width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px"}}>
              <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 13}}>No rates yet — add your first one above.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([ctry, ctryRates], gi) => (
            <div key={ctry} style={{borderBottom: gi < Object.keys(grouped).length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none"}}>
              <div style={{padding: isMobile ? "8px 14px" : "9px 22px", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 10}}>
                <span style={{color: "rgba(255,255,255,0.22)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase"}}>{ctry}</span>
                <span style={{flex: 1, height: 1, background: "rgba(255,255,255,0.05)"}} />
                <span style={{color: "rgba(255,255,255,0.18)", fontSize: 10}}>{ctryRates.length} entry</span>
              </div>
              {ctryRates.map((r, i) => (
                <div key={r.id} style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  padding: isMobile ? "12px 14px" : "15px 22px",
                  borderBottom: i < ctryRates.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  gap: isMobile ? 8 : 14,
                }}>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap"}}>
                      <p style={{color: "#fff", fontSize: isMobile ? 12 : 13, fontWeight: 700, margin: 0}}>
                        {r.city ? `${r.city}, ` : ""}{r.state}
                      </p>
                      <span style={{display: "flex", alignItems: "center", gap: 4, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "2px 8px"}}>
                        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em"}}>Base</span>
                        <span style={{color: "#ef4444", fontSize: 11, fontWeight: 700}}>
                          {fmtRate(r.base_price, r.currency_symbol || r.currency)}
                        </span>
                      </span>
                    </div>
                    {r.area_overrides?.length > 0 && (
                      <div style={{display: "flex", flexWrap: "wrap", gap: 5}}>
                        {r.area_overrides.map((ao) => (
                          <span key={ao.area} style={{
                            background: ao.is_special ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${ao.is_special ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 6, padding: "3px 9px", fontSize: 10,
                            color: ao.is_special ? "rgba(234,179,8,0.8)" : "rgba(255,255,255,0.45)",
                            display: "flex", alignItems: "center", gap: 4,
                          }}>
                            {ao.is_special && (
                              <svg width="8" height="8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            )}
                            {ao.area}{" "}
                            <span style={{color: "rgba(255,255,255,0.18)"}}>·</span>
                            <span style={{color: ao.is_special ? "#eab308" : "rgba(255,255,255,0.7)", fontWeight: 600}}>
                              {fmtRate(ao.price, r.currency_symbol || r.currency)}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button" onClick={() => setDeleteTarget(r)}
                    style={{
                      background: "none", border: "none", color: "rgba(239,68,68,0.3)",
                      cursor: "pointer", padding: 6, borderRadius: 7,
                      display: "flex", alignItems: "center", flexShrink: 0, transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(239,68,68,0.3)")}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}

// ─── TAB 2: Pickup Locations ──────────────────────────────────────────────────
const EMPTY_LOC = {
  name: "", address: "", city: "", state: "", country: "",
  country_code: "", state_code: "", phone: "", instructions: "", active: true,
};

function PickupLocationsTab() {
  const w = useWindowWidth();
  const isMobile = w < 560;

  const [locations, setLocations]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_LOC);
  const [showForm, setShowForm]     = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);

  const locValue = {
    countryIso: form.country_code || "", countryName: form.country || "",
    stateIso: form.state_code || "", stateName: form.state || "",
    cityName: form.city || "", currency: "",
  };
  const setLocValue = (v) => {
    const countryChanged = v.countryIso !== form.country_code;
    setForm((f) => ({
      ...f,
      country_code: v.countryIso, country: v.countryName,
      state_code: v.stateIso, state: v.stateName,
      city: v.cityName,
      phone: countryChanged ? "" : f.phone,
    }));
    if (countryChanged) setPhoneValid(true);
  };

  useEffect(() => {
    getPickupLocations()
      .then((d) => setLocations(Array.isArray(d) ? d : d?.locations || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const openNew  = () => { setForm(EMPTY_LOC); setEditingId(null); setError(""); setPhoneValid(true); setShowForm(true); };
  const openEdit = (loc) => { setForm({...EMPTY_LOC, ...loc}); setEditingId(loc.id); setError(""); setPhoneValid(true); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_LOC); setError(""); setPhoneValid(true); };
  const set = (k, v) => setForm((f) => ({...f, [k]: v}));

  const handleSave = async () => {
    if (!form.name.trim())    return setError("Location name is required.");
    if (!form.address.trim()) return setError("Address is required.");
    if (!form.city.trim())    return setError("City is required.");
    if (!phoneValid) return setError("Please enter a valid phone number or leave it blank.");
    setSaving(true); setError(""); setSuccess("");
    try {
      if (editingId) {
        const updated = await updatePickupLocation(editingId, form);
        setLocations((prev) => prev.map((l) => (l.id === editingId ? updated : l)));
        setSuccess("Pickup location updated.");
      } else {
        const created = await savePickupLocation(form);
        setLocations((prev) => [...prev, created]);
        setSuccess("Pickup location added.");
      }
      closeForm();
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePickupLocation(deleteTarget.id);
      setLocations((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 24}}>
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDelete
            msg={`Remove "${deleteTarget.name}"? This cannot be undone.`}
            onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div initial={{opacity: 0, y: -4}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -4}}>
            <Toast msg={success} type="ok" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* New / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}} transition={{duration: 0.2}}>
            <SectionCard
              title={editingId ? "Edit Location" : "New Pickup Location"}
              action={
                <button
                  type="button" onClick={closeForm}
                  style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "5px 8px",
                    color: "rgba(255,255,255,0.3)", cursor: "pointer",
                    display: "flex", alignItems: "center", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              }>
              <div style={{padding: isMobile ? "14px" : "22px", display: "flex", flexDirection: "column", gap: 16}}>
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{opacity: 0, y: -4}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -4}}>
                      <Toast msg={error} type="err" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <FieldInput
                  label="Location Name *" placeholder="e.g. Lagos Island Store"
                  value={form.name} onChange={(e) => set("name", e.target.value)}
                />

                <div>
                  <Label>Location</Label>
                  <LocationCascade value={locValue} onChange={setLocValue} showCity />
                </div>

                {/* Phone + Address — stack on mobile */}
                <div style={{display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14}}>
                  <div>
                    <Label>Phone</Label>
                    <PhoneInput
                      value={form.phone} onChange={(v) => set("phone", v)}
                      onValidChange={setPhoneValid} defaultCountry={form.country_code || "NG"}
                    />
                  </div>
                  <FieldInput
                    label="Full Address *" placeholder="14 Broad Street"
                    value={form.address} onChange={(e) => set("address", e.target.value)}
                  />
                </div>

                <FieldTextarea
                  label="Pickup Instructions (optional)"
                  placeholder="e.g. Call ahead, gate code 1234, Mon–Sat 10am–6pm"
                  value={form.instructions} onChange={(e) => set("instructions", e.target.value)}
                  rows={3}
                />

                <div style={{background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px"}}>
                  <Toggle value={form.active} onChange={(v) => set("active", v)} onLabel="Active" offLabel="Inactive" />
                </div>

                <div style={{display: "flex", gap: 10, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.06)"}}>
                  <GhostBtn onClick={closeForm}>Cancel</GhostBtn>
                  <div style={{flex: 1}}>
                    <PrimaryBtn onClick={handleSave} loading={saving} fullWidth>
                      {editingId ? "Update Location" : "Add Location"}
                    </PrimaryBtn>
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <SectionCard
        title="Pickup Locations"
        subtitle={`${locations.length} location${locations.length !== 1 ? "s" : ""}`}
        action={
          !showForm && (
            <PrimaryBtn
              onClick={openNew}
              icon={
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }>
              {isMobile ? "Add" : "Add Location"}
            </PrimaryBtn>
          )
        }>
        {loading ? (
          <div style={{padding: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.2)", fontSize: 13}}>
            <span style={{width: 14, height: 14, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.4)", borderRadius: "50%", animation: "lspin 0.7s linear infinite"}} />
            Loading…
          </div>
        ) : locations.length === 0 ? (
          <div style={{padding: isMobile ? "36px 14px" : "48px 22px", textAlign: "center"}}>
            <div style={{width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px"}}>
              <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 13, marginBottom: 16}}>No pickup locations yet.</p>
            <PrimaryBtn onClick={openNew}>Add First Location</PrimaryBtn>
          </div>
        ) : (
          locations.map((loc, i) => (
            <motion.div
              key={loc.id}
              initial={{opacity: 0, y: 6}} animate={{opacity: 1, y: 0}}
              transition={{delay: i * 0.04}}
              style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                padding: isMobile ? "12px 14px" : "18px 22px",
                borderBottom: i < locations.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                gap: isMobile ? 8 : 14,
              }}>
              {/* Icon — hide on very small screens to save space */}
              {!isMobile && (
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: loc.active ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${loc.active ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 2,
                }}>
                  <svg width="16" height="16" fill="none" stroke={loc.active ? "#ef4444" : "rgba(255,255,255,0.2)"} strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}

              <div style={{flex: 1, minWidth: 0}}>
                <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap"}}>
                  <p style={{color: "#fff", fontSize: isMobile ? 12 : 13, fontWeight: 700, margin: 0}}>{loc.name}</p>
                  <span style={{
                    background: loc.active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${loc.active ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}`,
                    color: loc.active ? "#22c55e" : "rgba(255,255,255,0.25)",
                    fontSize: 8, fontWeight: 900, letterSpacing: "0.15em",
                    textTransform: "uppercase", padding: "2px 8px", borderRadius: 99,
                  }}>
                    {loc.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 2px"}}>{loc.address}</p>
                <p style={{color: "rgba(255,255,255,0.22)", fontSize: 11, margin: 0}}>
                  {[loc.city, loc.state, loc.country].filter(Boolean).join(" · ")}
                  {loc.phone && <span style={{marginLeft: 8, color: "rgba(255,255,255,0.18)"}}>{loc.phone}</span>}
                </p>
                {loc.instructions && (
                  <p style={{color: "rgba(255,255,255,0.18)", fontSize: 11, marginTop: 5, fontStyle: "italic"}}>
                    "{loc.instructions}"
                  </p>
                )}
              </div>

              {/* Action buttons — stack vertically on mobile */}
              <div style={{display: "flex", flexDirection: isMobile ? "column" : "row", gap: 6, flexShrink: 0}}>
                <button
                  type="button" onClick={() => openEdit(loc)}
                  style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.3)", cursor: "pointer",
                    padding: isMobile ? "5px 8px" : "6px 12px",
                    borderRadius: 8, fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}>
                  {isMobile ? (
                    // pencil icon on mobile to save space
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  ) : "Edit"}
                </button>
                <button
                  type="button" onClick={() => setDeleteTarget(loc)}
                  style={{
                    background: "none", border: "1px solid rgba(239,68,68,0.15)",
                    color: "rgba(239,68,68,0.4)", cursor: "pointer",
                    padding: isMobile ? "5px 8px" : "6px 8px",
                    borderRadius: 8, display: "flex", alignItems: "center",
                    justifyContent: "center", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "rgba(239,68,68,0.4)"; }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </SectionCard>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function LocalShipping() {
  const [tab, setTab] = useState("rates");
  const w = useWindowWidth();
  const isMobile = w < 560;

  return (
    <div>
      <div style={{marginBottom: 24}}>
        <p style={{
          color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.24em", textTransform: "uppercase", margin: "0 0 4px",
        }}>
          {new Date().toLocaleDateString("en-GB", {weekday: "long", day: "numeric", month: "long", year: "numeric"})}
        </p>
        <h1 style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(1.6rem, 4vw, 2.6rem)",     // ← fluid on all screens
          color: "#fff", letterSpacing: "0.04em",
          lineHeight: 1, margin: "0 0 8px",
        }}>
          LOCAL SHIPPING
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.28)",
          fontSize: isMobile ? 12 : 13,
          lineHeight: 1.6, margin: 0,
        }}>
          Set shipping fees per country, state and city — with per-area overrides.
          {!isMobile && " Manage your pickup locations."}
          {isMobile && <><br />Manage your pickup locations.</>}
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 24,
        background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12, padding: 5,
        width: "fit-content", maxWidth: "100%",
      }}>
        {[
          {
            id: "rates",
            label: isMobile ? "Rates" : "Shipping Rates",
            d: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
          },
          {
            id: "pickup",
            label: isMobile ? "Pickups" : "Pickup Locations",
            d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
          },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: isMobile ? 5 : 7,
              background: tab === t.id ? "#ef4444" : "none",
              color: tab === t.id ? "#fff" : "rgba(255,255,255,0.38)",
              border: "none", borderRadius: 9,
              padding: isMobile ? "8px 12px" : "9px 18px",
              fontSize: isMobile ? 10 : 11,
              fontWeight: 700, letterSpacing: "0.1em",
              cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap",
            }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={t.d} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -8}} transition={{duration: 0.2}}>
          {tab === "rates" ? <ShippingRatesTab /> : <PickupLocationsTab />}
        </motion.div>
      </AnimatePresence>

      <style>{`@keyframes lspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}