import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {motion, AnimatePresence} from "framer-motion";
import { useGeo } from "../../../../utils/geo";
import {
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  toggleShippingMethod,
} from "./dashboard_components/api";
import {usePlatformSettings} from "./dashboard_components/platformsettingscontext";
import {
  useCurrency,
  CurrencyProvider,
  COUNTRY_CURRENCY,
  symbolFor,
} from "../../../../components/currencycontext";

// ── Responsive hook ───────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler, {passive: true});
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRICING_TYPES = [
  {value: "flat", label: "Flat Rate", desc: "Same price regardless of order size"},
  {value: "per_item", label: "Per Item", desc: "Base price + extra per additional item"},
  {value: "weight", label: "By Weight", desc: "Price calculated per kg"},
];

// ── Continent & Region Mappings ───────────────────────────────────────────────

const AFRICA_CODES = [
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD", "CI", "DJ", "EG",
  "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML",
  "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD",
  "TZ", "TG", "TN", "UG", "ZM", "ZW", "YT", "RE",
];
const ASIA_CODES = [
  "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "CY", "GE", "IN", "ID", "IR", "IQ", "IL",
  "JP", "JO", "KZ", "KW", "KG", "LA", "LB", "MY", "MV", "MN", "MM", "NP", "KP", "OM", "PK", "PS",
  "PH", "QA", "SA", "SG", "KR", "LK", "SY", "TW", "TJ", "TH", "TL", "TR", "TM", "AE", "UZ", "VN",
  "YE", "HK", "MO",
];
const EUROPE_CODES = [
  "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IS", "IE", "IT", "XK", "LV", "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK", "NO", "PL",
  "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "UA", "GB", "VA",
];
const NORTH_AMERICA_CODES = [
  "AG", "BS", "BB", "BZ", "CA", "CR", "CU", "DM", "DO", "SV", "GD", "GT", "HT", "HN", "JM", "MX",
  "NI", "PA", "KN", "LC", "VC", "TT", "US", "PR", "AW", "CW", "SX", "BM", "KY", "TC", "VG", "VI",
];
const SOUTH_AMERICA_CODES = [
  "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE", "FK", "GF",
];
const OCEANIA_CODES = [
  "AU", "FJ", "KI", "MH", "FM", "NR", "NZ", "PW", "PG", "WS", "SB", "TO", "TV", "VU", "NC", "PF",
  "GU", "AS", "CK",
];

const WEST_AFRICA = ["BJ", "BF", "CV", "CI", "GM", "GH", "GN", "GW", "LR", "ML", "MR", "NE", "NG", "SN", "SL", "TG"];
const EAST_AFRICA = ["BI", "KM", "DJ", "ER", "ET", "KE", "MG", "MW", "MU", "MZ", "RW", "SC", "SO", "SS", "TZ", "UG"];
const SOUTHERN_AFRICA = ["BW", "SZ", "LS", "NA", "ZA", "ZM", "ZW"];
const NORTH_AFRICA_SUB = ["DZ", "EG", "LY", "MA", "SD", "TN"];
const CENTRAL_AFRICA = ["CM", "CF", "TD", "CG", "CD", "GQ", "GA", "ST"];
const SUB_SAHARAN_AFRICA = AFRICA_CODES.filter((c) => !NORTH_AFRICA_SUB.includes(c));

const SOUTHEAST_ASIA = ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN"];
const SOUTH_ASIA = ["AF", "BD", "BT", "IN", "MV", "NP", "PK", "LK"];
const EAST_ASIA = ["CN", "JP", "KP", "KR", "MN", "TW", "HK", "MO"];
const MIDDLE_EAST = ["BH", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY", "AE", "YE", "TR"];
const GULF_STATES = ["BH", "KW", "OM", "QA", "SA", "AE"];
const CENTRAL_ASIA = ["KZ", "KG", "TJ", "TM", "UZ"];

const WESTERN_EUROPE = ["AT", "BE", "FR", "DE", "IE", "LI", "LU", "MC", "NL", "CH", "GB"];
const EASTERN_EUROPE = ["BY", "BG", "CZ", "HU", "MD", "PL", "RO", "RU", "SK", "UA"];
const NORTHERN_EUROPE = ["DK", "EE", "FI", "IS", "LV", "LT", "NO", "SE"];
const SOUTHERN_EUROPE = ["AL", "AD", "BA", "HR", "GR", "IT", "XK", "MT", "ME", "MK", "PT", "SM", "RS", "SI", "ES", "VA"];
const SCANDINAVIA = ["DK", "FI", "IS", "NO", "SE"];
const EU_CODES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV",
  "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];

const CARIBBEAN = [
  "AG", "BS", "BB", "CU", "DM", "DO", "GD", "HT", "JM", "KN", "LC", "VC", "TT", "AW", "CW", "SX",
  "PR", "VI", "VG", "BM", "KY", "TC",
];
const CENTRAL_AMERICA = ["BZ", "CR", "SV", "GT", "HN", "NI", "PA"];
const LATIN_AMERICA = [...SOUTH_AMERICA_CODES, ...CENTRAL_AMERICA, ...CARIBBEAN, "MX"];
const ASIA_PACIFIC = [...EAST_ASIA, ...SOUTHEAST_ASIA, ...OCEANIA_CODES];

const ZONE_COUNTRY_MAP = {
  Africa: AFRICA_CODES,
  Asia: ASIA_CODES,
  Europe: EUROPE_CODES,
  "North America": NORTH_AMERICA_CODES,
  "South America": SOUTH_AMERICA_CODES,
  Oceania: OCEANIA_CODES,
  "West Africa": WEST_AFRICA,
  "East Africa": EAST_AFRICA,
  "Southern Africa": SOUTHERN_AFRICA,
  "North Africa": NORTH_AFRICA_SUB,
  "Central Africa": CENTRAL_AFRICA,
  "Sub-Saharan Africa": SUB_SAHARAN_AFRICA,
  "Southeast Asia": SOUTHEAST_ASIA,
  "South Asia": SOUTH_ASIA,
  "East Asia": EAST_ASIA,
  "Middle East": MIDDLE_EAST,
  "Gulf States": GULF_STATES,
  "Central Asia": CENTRAL_ASIA,
  "Western Europe": WESTERN_EUROPE,
  "Eastern Europe": EASTERN_EUROPE,
  "Northern Europe": NORTHERN_EUROPE,
  "Southern Europe": SOUTHERN_EUROPE,
  Scandinavia: SCANDINAVIA,
  "European Union": EU_CODES,
  "Latin America": LATIN_AMERICA,
  "Central America": CENTRAL_AMERICA,
  Caribbean: CARIBBEAN,
  "Asia Pacific": ASIA_PACIFIC,
};

const ISO_TO_CONTINENT = {};
const CONTINENT_ENTRIES = {
  Africa: AFRICA_CODES,
  Asia: ASIA_CODES,
  Europe: EUROPE_CODES,
  "North America": NORTH_AMERICA_CODES,
  "South America": SOUTH_AMERICA_CODES,
  Oceania: OCEANIA_CODES,
};
Object.entries(CONTINENT_ENTRIES).forEach(([continent, codes]) => {
  codes.forEach((code) => {
    ISO_TO_CONTINENT[code] = continent;
  });
});

function getZoneCountryCodes(zoneName) {
  if (!zoneName || !zoneName.trim()) return null;
  const name = zoneName.trim();
  if (ZONE_COUNTRY_MAP[name]) return new Set(ZONE_COUNTRY_MAP[name]);
  if (["Worldwide", "International", "Rest of World", "Domestic"].includes(name)) return null;
  return null;
}

function getContinentForCountry(isoCode) {
  return ISO_TO_CONTINENT[isoCode] || null;
}

const ZONE_PRESETS = [
  "Africa", "Asia", "Europe", "North America", "South America", "Oceania",
  "West Africa", "East Africa", "Southern Africa", "North Africa", "Central Africa", "Sub-Saharan Africa",
  "Western Europe", "Eastern Europe", "Northern Europe", "Southern Europe", "Scandinavia", "European Union",
  "Latin America", "Central America", "Caribbean", "Middle East", "Gulf States",
  "Southeast Asia", "South Asia", "East Asia", "Central Asia", "Asia Pacific",
  "Domestic", "International", "Worldwide", "Rest of World",
];

const ALL_POPULAR_COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Ethiopia", "Tanzania", "Cameroon", "Senegal", "Morocco",
  "Algeria", "Uganda", "United Kingdom", "Germany", "France", "Italy", "Spain", "Netherlands", "Sweden", "Poland",
  "Portugal", "Norway", "Belgium", "Switzerland", "India", "China", "Japan", "South Korea", "UAE", "Saudi Arabia",
  "Indonesia", "Pakistan", "Bangladesh", "Thailand", "Singapore", "Malaysia", "Turkey", "Israel",
  "United States", "Canada", "Mexico", "Jamaica", "Brazil", "Argentina", "Colombia", "Chile", "Peru",
  "Australia", "New Zealand",
];

// ── Styles ────────────────────────────────────────────────────────────────────

function Lbl({c, required}) {
  const w = useWindowWidth();
  return (
    <label
      style={{
        color: "rgba(255,255,255,0.35)",
        fontSize: w < 640 ? 8 : 9,
        fontWeight: 700,
        letterSpacing: w < 640 ? "0.18em" : "0.22em",
        textTransform: "uppercase",
        display: "block",
        marginBottom: w < 640 ? 4 : 5,
      }}>
      {c}
      {required && <span style={{color: "#ef4444", marginLeft: 3}}>*</span>}
    </label>
  );
}

function PricingBadge({type}) {
  const w = useWindowWidth();
  const map = {
    flat: ["#22c55e", "Flat"],
    per_item: ["#f97316", "Per Item"],
    weight: ["#a855f7", "Weight"],
  };
  const [color, label] = map[type] || ["#fff", type];
  return (
    <span
      style={{
        fontSize: w < 640 ? 7 : 8,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        background: `${color}18`,
        padding: w < 640 ? "2px 6px" : "2px 7px",
        borderRadius: 99,
        flexShrink: 0,
      }}>
      {label}
    </span>
  );
}

// ── Method Modal ──────────────────────────────────────────────────────────────

function MethodModal({
  initial,
  zoneId,
  zoneName,
  zoneLocations,
  onSave,
  onClose,
  saving,
  brandCurrency,
  brandSymbol,
}) {
  const w = useWindowWidth();
  const isMobile = w < 640;
  const { Country: GeoCountry, loaded: geoLoaded } = useGeo();

  const zoneCurrencies = React.useMemo(() => {
    const seen = new Set();
    const list = [];

    if (brandCurrency && brandSymbol) {
      seen.add(brandCurrency);
      list.push({
        code: brandCurrency,
        symbol: brandSymbol,
        label: `${brandSymbol} ${brandCurrency}`,
        source: "Your currency",
      });
    }

    (zoneLocations || []).forEach((loc) => {
      const iso =
        loc.countryIso ||
        loc.country_code ||
        (geoLoaded ? GeoCountry.getAllCountries().find((c) => c.name === loc.country)?.isoCode : undefined);
      if (!iso) return;
      const code = COUNTRY_CURRENCY[iso?.toUpperCase()];
      if (!code || seen.has(code)) return;
      seen.add(code);
      const sym = symbolFor(code);
      const countryName = loc.country || iso;
      list.push({code, symbol: sym, label: `${sym} ${code}`, source: countryName});
    });

    return list;
  }, [zoneLocations, brandCurrency, brandSymbol, geoLoaded, GeoCountry]);

  const defaultCurrency = initial?.currency || brandCurrency || zoneCurrencies[0]?.code || "NGN";
  const defaultSymbol = initial?.currency_symbol || brandSymbol || zoneCurrencies[0]?.symbol || "₦";

  const [selectedCurrency, setSelectedCurrency] = React.useState(defaultCurrency);
  const [selectedSymbol, setSelectedSymbol] = React.useState(defaultSymbol);

  const sym = selectedSymbol || "₦";

  const pickCurrency = (cur) => {
    setSelectedCurrency(cur.code);
    setSelectedSymbol(cur.symbol);
  };

  const [form, setForm] = useState({
    name: "",
    description: "",
    pricing_type: "flat",
    flat_rate: "",
    per_item_rate: "",
    weight_rate: "",
    free_above: "",
    min_days: "",
    max_days: "",
    is_active: true,
    ...initial,
    flat_rate: initial?.flat_rate ?? "",
    per_item_rate: initial?.per_item_rate ?? "",
    weight_rate: initial?.weight_rate ?? "",
    free_above: initial?.free_above != null ? initial.free_above : "",
    min_days: initial?.min_days ?? "",
    max_days: initial?.max_days ?? "",
  });

  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));

  const handleSave = () => {
    const body = {
      name: form.name,
      description: form.description,
      pricing_type: form.pricing_type,
      flat_rate: parseFloat(form.flat_rate) || 0,
      per_item_rate: parseFloat(form.per_item_rate) || 0,
      weight_rate: parseFloat(form.weight_rate) || 0,
      free_above: form.free_above !== "" ? parseFloat(form.free_above) : null,
      min_days: form.min_days !== "" ? parseInt(form.min_days) : null,
      max_days: form.max_days !== "" ? parseInt(form.max_days) : null,
      is_active: form.is_active,
      currency: selectedCurrency || brandCurrency || "NGN",
      currency_symbol: selectedSymbol || sym,
    };
    onSave(body);
  };

  const inp = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: isMobile ? 12 : 13,
    padding: isMobile ? "9px 11px" : "10px 13px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    borderRadius: isMobile ? 7 : 8,
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };
  const focus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)");
  const blur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

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
        padding: isMobile ? 12 : 20,
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
          borderRadius: isMobile ? 14 : 18,
          width: "100%",
          maxWidth: isMobile ? "100%" : 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        }}>
        <div
          style={{
            padding: isMobile ? "16px 18px" : "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <h2
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: isMobile ? "1.1rem" : "1.3rem",
              color: "#fff",
              letterSpacing: "0.06em",
              margin: 0,
            }}>
            {initial?.id ? "EDIT METHOD" : "NEW SHIPPING METHOD"}
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
              width={isMobile ? "14" : "16"}
              height={isMobile ? "14" : "16"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{padding: isMobile ? "16px 18px" : "20px 24px", display: "flex", flexDirection: "column", gap: isMobile ? 12 : 14}}>
          <div>
            <Lbl c="Method Name" required />
            <input
              value={form.name}
              onChange={set("name")}
              style={inp}
              onFocus={focus}
              onBlur={blur}
              placeholder="e.g. Standard Delivery"
            />
          </div>
          <div>
            <Lbl c="Description" />
            <input
              value={form.description}
              onChange={set("description")}
              style={inp}
              onFocus={focus}
              onBlur={blur}
              placeholder="e.g. 3–5 business days"
            />
          </div>
          <div>
            <Lbl c="Pricing Type" required />
            <div style={{display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 6 : 8}}>
              {PRICING_TYPES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setForm((f) => ({...f, pricing_type: p.value}))}
                  style={{
                    flex: 1,
                    padding: isMobile ? "9px 7px" : "10px 8px",
                    borderRadius: isMobile ? 8 : 9,
                    cursor: "pointer",
                    border: `1px solid ${form.pricing_type === p.value ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                    background:
                      form.pricing_type === p.value
                        ? "rgba(239,68,68,0.08)"
                        : "rgba(255,255,255,0.02)",
                    color: form.pricing_type === p.value ? "#ef4444" : "rgba(255,255,255,0.45)",
                    transition: "all 0.18s",
                  }}>
                  <p
                    style={{
                      fontSize: isMobile ? 10 : 11,
                      fontWeight: 700,
                      margin: "0 0 2px",
                      letterSpacing: "0.04em",
                    }}>
                    {p.label}
                  </p>
                  <p style={{fontSize: isMobile ? 8 : 9, margin: 0, opacity: 0.6, lineHeight: 1.4}}>{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Lbl c="Billing Currency" required />
            {zoneCurrencies.length > 1 ? (
              <>
                <p
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    fontSize: isMobile ? 10 : 11,
                    margin: "0 0 10px",
                    lineHeight: 1.5,
                  }}>
                  This zone has countries using different currencies. Pick which one to price this
                  method in.
                </p>
                <div style={{display: "flex", flexWrap: "wrap", gap: isMobile ? 6 : 8}}>
                  {zoneCurrencies.map((cur) => {
                    const active = selectedCurrency === cur.code;
                    return (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => pickCurrency(cur)}
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          padding: isMobile ? "9px 12px" : "10px 14px",
                          borderRadius: isMobile ? 9 : 10,
                          cursor: "pointer",
                          border: `1px solid ${active ? "rgba(239,68,68,0.55)" : "rgba(255,255,255,0.1)"}`,
                          background: active ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
                          transition: "all 0.18s",
                          minWidth: isMobile ? 80 : 90,
                        }}>
                        <span
                          style={{
                            fontFamily: "'Bebas Neue',sans-serif",
                            fontSize: isMobile ? "1.1rem" : "1.2rem",
                            color: active ? "#ef4444" : "#fff",
                            letterSpacing: "0.04em",
                          }}>
                          {cur.symbol}
                        </span>
                        <span
                          style={{
                            fontSize: isMobile ? 9 : 10,
                            fontWeight: 700,
                            color: active ? "#ef4444" : "rgba(255,255,255,0.5)",
                            letterSpacing: "0.1em",
                          }}>
                          {cur.code}
                        </span>
                        <span style={{fontSize: isMobile ? 8 : 9, color: "rgba(255,255,255,0.25)", marginTop: 2}}>
                          {cur.source}
                        </span>
                        {active && (
                          <div style={{position: "absolute", top: 6, right: 6}}>
                            <svg
                              width={isMobile ? "9" : "10"}
                              height={isMobile ? "9" : "10"}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="3"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: isMobile ? 8 : 10,
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: isMobile ? 9 : 10,
                  padding: isMobile ? "9px 14px" : "10px 16px",
                }}>
                <span
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: isMobile ? "1.2rem" : "1.3rem",
                    color: "#ef4444",
                  }}>
                  {selectedSymbol}
                </span>
                <div>
                  <p style={{color: "#fff", fontSize: isMobile ? 11 : 12, fontWeight: 700, margin: 0}}>
                    {selectedCurrency}
                  </p>
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: isMobile ? 9 : 10, margin: 0}}>
                    {zoneCurrencies[0]?.source || "Your currency"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {form.pricing_type === "flat" && (
            <div>
              <Lbl c={`Flat Rate (${sym})`} required />
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.flat_rate}
                onChange={set("flat_rate")}
                style={inp}
                onFocus={focus}
                onBlur={blur}
                placeholder="0.00"
              />
            </div>
          )}
          {form.pricing_type === "per_item" && (
            <div style={{display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 12}}>
              <div>
                <Lbl c={`Base Rate (${sym})`} required />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.flat_rate}
                  onChange={set("flat_rate")}
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Lbl c={`Per Additional Item (${sym})`} />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.per_item_rate}
                  onChange={set("per_item_rate")}
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
          {form.pricing_type === "weight" && (
            <div>
              <Lbl c={`Rate Per kg (${sym})`} required />
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.weight_rate}
                onChange={set("weight_rate")}
                style={inp}
                onFocus={focus}
                onBlur={blur}
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <Lbl c={`Free Shipping Above (${sym}) — leave empty to disable`} />
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.free_above}
              onChange={set("free_above")}
              style={inp}
              onFocus={focus}
              onBlur={blur}
              placeholder="e.g. 50.00"
            />
          </div>

          <div>
            <Lbl c="Estimated Delivery (days)" />
            <div style={{display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 12}}>
              <input
                type="number"
                min="0"
                value={form.min_days}
                onChange={set("min_days")}
                style={inp}
                onFocus={focus}
                onBlur={blur}
                placeholder="Min days (e.g. 2)"
              />
              <input
                type="number"
                min="0"
                value={form.max_days}
                onChange={set("max_days")}
                style={inp}
                onFocus={focus}
                onBlur={blur}
                placeholder="Max days (e.g. 7)"
              />
            </div>
          </div>

          <div
            onClick={() => setForm((f) => ({...f, is_active: !f.is_active}))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: form.is_active ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${form.is_active ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: isMobile ? 9 : 10,
              padding: isMobile ? "10px 14px" : "12px 16px",
              cursor: "pointer",
            }}>
            <div>
              <p style={{color: "#fff", fontSize: isMobile ? 12 : 13, fontWeight: 700, margin: "0 0 2px"}}>
                Active
              </p>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: isMobile ? 10 : 11, margin: 0}}>
                Show this method to buyers at checkout
              </p>
            </div>
            <div
              style={{
                width: isMobile ? 40 : 44,
                height: isMobile ? 22 : 24,
                borderRadius: 99,
                marginLeft: isMobile ? 12 : 16,
                background: form.is_active ? "#22c55e" : "rgba(255,255,255,0.1)",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}>
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: form.is_active ? (isMobile ? 21 : 23) : 3,
                  width: isMobile ? 16 : 18,
                  height: isMobile ? 16 : 18,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: isMobile ? "14px 18px" : "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 8 : 10,
            justifyContent: "flex-end",
          }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: isMobile ? "10px 20px" : "11px 22px",
              borderRadius: isMobile ? 7 : 8,
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
              fontSize: isMobile ? 11 : 12,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: isMobile ? "10px 24px" : "11px 28px",
              borderRadius: isMobile ? 7 : 8,
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.18s",
              minWidth: isMobile ? "auto" : 120,
            }}>
            {saving ? "Saving…" : initial?.id ? "Save Changes" : "Create Method"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── SearchableSelect (portal dropdown) ────────────────────────────────────────

function SearchableSelect({options, value, onChange, placeholder, disabled}) {
  const w = useWindowWidth();
  const isMobile = w < 640;
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
    setCoords({top: r.bottom + 4, left: Math.max(8, r.left), width: Math.min(r.width, window.innerWidth - 16)});
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
    const handler = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropRef.current &&
        !dropRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const pick = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

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
          borderRadius: isMobile ? 7 : 8,
          padding: isMobile ? "9px 11px" : "10px 13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isMobile ? 6 : 8,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "all 0.18s",
        }}>
        <div style={{display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, flex: 1, minWidth: 0}}>
          {selected?.flag && (
            <span style={{fontSize: isMobile ? 14 : 16, lineHeight: 1, flexShrink: 0}}>{selected.flag}</span>
          )}
          <span
            style={{
              fontSize: isMobile ? 12 : 13,
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
          width={isMobile ? "10" : "11"}
          height={isMobile ? "10" : "11"}
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
              borderRadius: isMobile ? 9 : 10,
              zIndex: 99999,
              boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
              overflow: "hidden",
            }}>
            <div
              style={{
                padding: isMobile ? "7px 7px 5px" : "8px 8px 6px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: "#1e1e1e",
              }}>
              <div style={{position: "relative"}}>
                <svg
                  width={isMobile ? "11" : "12"}
                  height={isMobile ? "11" : "12"}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{
                    position: "absolute",
                    left: isMobile ? 8 : 9,
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
                    borderRadius: isMobile ? 6 : 7,
                    padding: isMobile ? "6px 8px 6px 26px" : "7px 9px 7px 28px",
                    color: "#fff",
                    fontSize: isMobile ? 11 : 12,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>
            <div style={{maxHeight: isMobile ? 200 : 220, overflowY: "auto"}}>
              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: isMobile ? "12px" : "14px",
                    color: "rgba(255,255,255,0.25)",
                    fontSize: isMobile ? 11 : 12,
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
                      onClick={() => pick(opt)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        padding: isMobile ? "7px 11px" : "8px 13px",
                        cursor: "pointer",
                        fontSize: isMobile ? 12 : 13,
                        background: isSel ? "rgba(239,68,68,0.1)" : "transparent",
                        color: isSel ? "#ef4444" : "rgba(255,255,255,0.72)",
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? 6 : 8,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSel) e.currentTarget.style.background = "transparent";
                      }}>
                      {opt.flag && (
                        <span style={{fontSize: isMobile ? 13 : 15, lineHeight: 1, flexShrink: 0}}>{opt.flag}</span>
                      )}
                      <span style={{flex: 1}}>{opt.label}</span>
                      {isSel && (
                        <svg
                          width={isMobile ? "9" : "10"}
                          height={isMobile ? "9" : "10"}
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

// ── LocationRow ───────────────────────────────────────────────────────────────

function LocationRow({loc, onChange, onRemove, showRemove, allowedCodes}) {
  const w = useWindowWidth();
  const isMobile = w < 640;
  const { Country, State, loaded } = useGeo();

  const countryOptions = React.useMemo(() => {
    if (!loaded) return [];
    let countries = Country.getAllCountries();
    if (allowedCodes) {
      countries = countries.filter((c) => allowedCodes.has(c.isoCode));
    }
    return countries.map((c) => ({value: c.isoCode, label: c.name, flag: c.flag}));
  }, [loaded, Country, allowedCodes]);

  const stateOptions = React.useMemo(
    () =>
      loaded && loc.countryIso
        ? State.getStatesOfCountry(loc.countryIso).map((s) => ({value: s.name, label: s.name}))
        : [],
    [loaded, State, loc.countryIso],
  );

  const setCountry = (iso) => {
    const c = loaded ? Country.getCountryByCode(iso) : null;
    onChange({countryIso: iso, country: c?.name || "", state: ""});
  };
  const setState = (name) => onChange({...loc, state: name});

  return (
    <div
      style={{display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 36px", gap: isMobile ? 6 : 8, alignItems: "center"}}>
      <SearchableSelect
        options={countryOptions}
        value={loc.countryIso || ""}
        onChange={setCountry}
        placeholder="Select country"
      />
      <SearchableSelect
        options={[{value: "", label: "— All states —"}, ...stateOptions]}
        value={loc.state || ""}
        onChange={setState}
        placeholder={loc.countryIso ? "All states" : "Pick country first"}
        disabled={!loc.countryIso}
      />
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            width: isMobile ? "100%" : 36,
            height: isMobile ? 36 : 38,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: isMobile ? 7 : 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <svg
            width={isMobile ? "11" : "12"}
            height={isMobile ? "11" : "12"}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Zone Name Input ───────────────────────────────────────────────────────────

function ZoneNameInput({value, onChange}) {
  const w = useWindowWidth();
  const isMobile = w < 640;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value || "");
  const inputRef = React.useRef(null);
  const dropRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const [coords, setCoords] = React.useState({top: 0, left: 0, width: 0});

  React.useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return ZONE_PRESETS;
    const q = query.toLowerCase();
    return ZONE_PRESETS.filter((z) => z.toLowerCase().includes(q));
  }, [query]);

  const syncCoords = React.useCallback(() => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setCoords({top: r.bottom + 4, left: Math.max(8, r.left), width: Math.min(r.width, window.innerWidth - 16)});
  }, []);

  const openDD = () => {
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
    const handler = (e) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target) &&
        dropRef.current &&
        !dropRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pick = (preset) => {
    onChange(preset);
    setQuery(preset);
    setOpen(false);
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    if (!open) openDD();
  };

  const inp = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: isMobile ? 12 : 13,
    padding: isMobile ? "9px 32px 9px 11px" : "10px 36px 10px 13px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    borderRadius: isMobile ? 7 : 8,
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  return (
    <>
      <div ref={wrapRef} style={{position: "relative"}}>
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          onFocus={openDD}
          placeholder="e.g. Africa, West Africa, Europe, Worldwide"
          style={inp}
        />
        <svg
          onClick={() => (open ? setOpen(false) : openDD())}
          width={isMobile ? "10" : "11"}
          height={isMobile ? "10" : "11"}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            right: isMobile ? 10 : 12,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform 0.18s",
            cursor: "pointer",
            pointerEvents: "auto",
          }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

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
              borderRadius: isMobile ? 9 : 10,
              zIndex: 99999,
              boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
              overflow: "hidden",
            }}>
            <div style={{maxHeight: isMobile ? 240 : 260, overflowY: "auto"}}>
              {query.trim() &&
                !ZONE_PRESETS.find((z) => z.toLowerCase() === query.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => pick(query.trim())}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      padding: isMobile ? "8px 11px" : "9px 13px",
                      cursor: "pointer",
                      fontSize: isMobile ? 12 : 13,
                      background: "rgba(239,68,68,0.08)",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? 6 : 8,
                    }}>
                    <svg
                      width={isMobile ? "11" : "12"}
                      height={isMobile ? "11" : "12"}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Use "{query.trim()}"
                  </button>
                )}
              {filtered.length === 0 && !query.trim() ? null : filtered.length === 0 ? (
                <div
                  style={{
                    padding: isMobile ? "12px" : "14px",
                    color: "rgba(255,255,255,0.25)",
                    fontSize: isMobile ? 11 : 12,
                    textAlign: "center",
                  }}>
                  No presets match — you can still use your typed name above.
                </div>
              ) : (
                filtered.map((preset) => {
                  const isSel = preset.toLowerCase() === value?.toLowerCase();
                  const countryCodes = ZONE_COUNTRY_MAP[preset];
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => pick(preset)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        padding: isMobile ? "8px 11px" : "9px 13px",
                        cursor: "pointer",
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: isSel ? 700 : 400,
                        background: isSel ? "rgba(239,68,68,0.1)" : "transparent",
                        color: isSel ? "#ef4444" : "rgba(255,255,255,0.72)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSel) e.currentTarget.style.background = "transparent";
                      }}>
                      <span>{preset}</span>
                      <span style={{display: "flex", alignItems: "center", gap: 6}}>
                        {countryCodes && (
                          <span style={{fontSize: isMobile ? 9 : 10, color: "rgba(255,255,255,0.2)"}}>
                            {countryCodes.length} countries
                          </span>
                        )}
                        {isSel && (
                          <svg
                            width={isMobile ? "9" : "10"}
                            height={isMobile ? "9" : "10"}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="3"
                            viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
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

// ── Zone Modal ────────────────────────────────────────────────────────────────

function ZoneModal({initial, onSave, onClose, saving}) {
  const w = useWindowWidth();
  const isMobile = w < 640;
  const { Country, loaded } = useGeo();
  const [name, setName] = React.useState(initial?.name || "");
  const [locations, setLocations] = React.useState([{countryIso: "", country: "", state: ""}]);

  React.useEffect(() => {
    if (!loaded) return;
    if (initial?.locations?.length) {
      const allCountries = Country.getAllCountries();
      setLocations(initial.locations.map((l) => {
        const found = allCountries.find((c) => c.name === l.country);
        return {countryIso: found?.isoCode || "", country: l.country, state: l.state || ""};
      }));
    }
  }, [loaded]);

  const allowedCodes = React.useMemo(() => getZoneCountryCodes(name), [name]);

  const popularCountries = React.useMemo(() => {
    if (!loaded) return [];
    if (!allowedCodes) return ALL_POPULAR_COUNTRIES;
    const allC = Country.getAllCountries();
    return ALL_POPULAR_COUNTRIES.filter((countryName) => {
      const found = allC.find((c) => c.name === countryName);
      return found && allowedCodes.has(found.isoCode);
    });
  }, [loaded, Country, allowedCodes]);

  const handleZoneNameChange = (newName) => {
    setName(newName);
    const newAllowed = getZoneCountryCodes(newName);
    if (newAllowed) {
      setLocations((prev) => {
        const valid = prev.filter((l) => !l.countryIso || newAllowed.has(l.countryIso));
        return valid.length > 0 ? valid : [{countryIso: "", country: "", state: ""}];
      });
    }
  };

  const handleLocationChange = (i, val) => {
    setLocations((l) => l.map((loc, j) => (j === i ? val : loc)));
    if (!name.trim() && val.countryIso) {
      const continent = getContinentForCountry(val.countryIso);
      if (continent) setName(continent);
    }
  };

  const addLocation = () => setLocations((l) => [...l, {countryIso: "", country: "", state: ""}]);
  const removeLocation = (i) => setLocations((l) => l.filter((_, j) => j !== i));

  const quickAdd = (countryName) => {
    if (!loaded) return;
    const allCountries = Country.getAllCountries();
    const found = allCountries.find((c) => c.name === countryName);
    if (!found) return;
    if (allowedCodes && !allowedCodes.has(found.isoCode)) return;
    const newEntry = {countryIso: found.isoCode, country: found.name, state: ""};
    if (locations.find((l) => l.countryIso === found.isoCode)) return;
    const emptyIdx = locations.findIndex((l) => !l.country);
    if (emptyIdx >= 0) {
      setLocations((l) => l.map((loc, i) => (i === emptyIdx ? newEntry : loc)));
    } else {
      setLocations((l) => [...l, newEntry]);
    }
    if (!name.trim()) {
      const continent = getContinentForCountry(found.isoCode);
      if (continent) setName(continent);
    }
  };

  const handleSave = () => {
    onSave({
      name,
      locations: locations
        .filter((l) => l.country.trim() !== "")
        .map((l) => ({country: l.country, state: l.state})),
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
        padding: isMobile ? 12 : 20,
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
          borderRadius: isMobile ? 14 : 18,
          width: "100%",
          maxWidth: isMobile ? "100%" : 500,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        }}>
        <div
          style={{
            padding: isMobile ? "16px 18px" : "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <h2
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: isMobile ? "1.1rem" : "1.3rem",
              color: "#fff",
              letterSpacing: "0.06em",
              margin: 0,
            }}>
            {initial?.id ? "EDIT ZONE" : "NEW SHIPPING ZONE"}
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
              width={isMobile ? "14" : "16"}
              height={isMobile ? "14" : "16"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{padding: isMobile ? "16px 18px" : "20px 24px", display: "flex", flexDirection: "column", gap: isMobile ? 14 : 16}}>
          <div>
            <Lbl c="Zone / Region" required />
            <ZoneNameInput value={name} onChange={handleZoneNameChange} />
            {allowedCodes && (
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: isMobile ? 9 : 10,
                  marginTop: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}>
                <svg
                  width={isMobile ? "9" : "10"}
                  height={isMobile ? "9" : "10"}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Country dropdown filtered to {allowedCodes.size} countries in{" "}
                <strong style={{color: "rgba(255,255,255,0.4)"}}>{name}</strong>
              </p>
            )}
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: isMobile ? 6 : 8,
              }}>
              <Lbl c="Countries & Regions" />
              <button
                type="button"
                onClick={addLocation}
                style={{
                  background: "none",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  borderRadius: isMobile ? 6 : 7,
                  color: "rgba(255,255,255,0.4)",
                  fontSize: isMobile ? 9 : 10,
                  padding: isMobile ? "3px 10px" : "4px 12px",
                  cursor: "pointer",
                }}>
                + Add Row
              </button>
            </div>

            {popularCountries.length > 0 && (
              <div style={{display: "flex", flexWrap: "wrap", gap: isMobile ? 4 : 5, marginBottom: isMobile ? 10 : 12}}>
                {popularCountries.map((c) => {
                  const already = locations.some((l) => l.country === c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => !already && quickAdd(c)}
                      style={{
                        fontSize: isMobile ? 9 : 10,
                        padding: isMobile ? "2px 7px" : "3px 9px",
                        borderRadius: 99,
                        cursor: already ? "default" : "pointer",
                        border: `1px solid ${already ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                        background: already ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)",
                        color: already ? "#ef4444" : "rgba(255,255,255,0.4)",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!already) {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                          e.currentTarget.style.color = "#fff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!already) {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                        }
                      }}>
                      {already && <span style={{marginRight: 4}}>✓</span>}
                      {c}
                    </button>
                  );
                })}
              </div>
            )}

            {!isMobile && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 36px",
                  gap: 8,
                  marginBottom: 6,
                }}>
                <span
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}>
                  Country
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}>
                  State / Region
                </span>
                <span />
              </div>
            )}

            <div style={{display: "flex", flexDirection: "column", gap: isMobile ? 6 : 8}}>
              {locations.map((loc, i) => (
                <LocationRow
                  key={i}
                  loc={loc}
                  onChange={(val) => handleLocationChange(i, val)}
                  onRemove={() => removeLocation(i)}
                  showRemove={locations.length > 1}
                  allowedCodes={allowedCodes}
                />
              ))}
            </div>
            <p
              style={{color: "rgba(255,255,255,0.2)", fontSize: isMobile ? 9 : 10, marginTop: 6, lineHeight: 1.5}}>
              Leave state blank to cover the entire country.
              {!name.trim() && " Pick a country and the zone will auto-set to its continent."}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: isMobile ? "14px 18px" : "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 8 : 10,
            justifyContent: "flex-end",
          }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: isMobile ? "10px 20px" : "11px 22px",
              borderRadius: isMobile ? 7 : 8,
              cursor: "pointer",
            }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{
              background: saving ? "#7f1d1d" : "#ef4444",
              border: "none",
              color: "#fff",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: isMobile ? "10px 24px" : "11px 28px",
              borderRadius: isMobile ? 7 : 8,
              cursor: saving || !name.trim() ? "not-allowed" : "pointer",
              minWidth: isMobile ? "auto" : 120,
            }}>
            {saving ? "Saving…" : initial?.id ? "Save Changes" : "Create Zone"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Method Card ───────────────────────────────────────────────────────────────

function MethodCard({method, onEdit, onDelete, onToggle}) {
  const w = useWindowWidth();
  const isMobile = w < 640;
  const {settings} = usePlatformSettings();
  const sym =
    method.currency_symbol || symbolFor(method.currency) || settings.currency_symbol || "₦";
  const fmt = (v) =>
    sym +
    Number(v || 0).toLocaleString("en-US", {minimumFractionDigits: 0, maximumFractionDigits: 0});

  const priceLabel = () => {
    if (method.pricing_type === "flat") return fmt(method.flat_rate);
    if (method.pricing_type === "per_item")
      return `${fmt(method.flat_rate)} + ${fmt(method.per_item_rate)}/item`;
    if (method.pricing_type === "weight") return `${fmt(method.weight_rate)}/kg`;
    return "—";
  };
  const deliveryLabel = () => {
    if (method.min_days && method.max_days) return `${method.min_days}–${method.max_days} days`;
    if (method.min_days) return `From ${method.min_days} days`;
    if (method.max_days) return `Up to ${method.max_days} days`;
    return null;
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: isMobile ? 9 : 10,
        padding: isMobile ? "11px 14px" : "13px 16px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 10 : 12,
        opacity: method.is_active ? 1 : 0.55,
      }}>
      <div
        style={{
          width: isMobile ? 6 : 8,
          height: isMobile ? 6 : 8,
          borderRadius: "50%",
          flexShrink: 0,
          background: method.is_active ? "#22c55e" : "rgba(255,255,255,0.15)",
        }}
      />
      <div style={{flex: 1, minWidth: 0}}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 6 : 8,
            marginBottom: isMobile ? 2 : 3,
            flexWrap: "wrap",
          }}>
          <span style={{color: "#fff", fontSize: isMobile ? 12 : 13, fontWeight: 700}}>{method.name}</span>
          <PricingBadge type={method.pricing_type} />
          {!method.is_active && (
            <span
              style={{
                fontSize: isMobile ? 7 : 8,
                fontWeight: 700,
                color: "rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.05)",
                padding: isMobile ? "2px 6px" : "2px 7px",
                borderRadius: 99,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}>
              Inactive
            </span>
          )}
        </div>
        <div style={{display: "flex", alignItems: "center", gap: isMobile ? 10 : 12, flexWrap: "wrap"}}>
          <span style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: isMobile ? "0.9rem" : "1rem", color: "#ef4444"}}>
            {priceLabel()}
          </span>
          {method.free_above != null && (
            <span style={{color: "#22c55e", fontSize: isMobile ? 9 : 10}}>
              Free above {fmt(method.free_above)}
            </span>
          )}
          {deliveryLabel() && (
            <span style={{color: "rgba(255,255,255,0.3)", fontSize: isMobile ? 10 : 11}}>
              <svg
                width={isMobile ? "9" : "10"}
                height={isMobile ? "9" : "10"}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                style={{marginRight: 3, verticalAlign: "middle"}}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 6v6l4 2" />
              </svg>
              {deliveryLabel()}
            </span>
          )}
          {method.description && (
            <span style={{color: "rgba(255,255,255,0.25)", fontSize: isMobile ? 10 : 11}}>
              {method.description}
            </span>
          )}
        </div>
      </div>
      <div style={{display: "flex", alignItems: "center", gap: isMobile ? 5 : 6, flexShrink: 0, width: isMobile ? "100%" : "auto"}}>
        <button
          onClick={() => onToggle(method)}
          title={method.is_active ? "Deactivate" : "Activate"}
          style={{
            padding: isMobile ? "4px 9px" : "5px 10px",
            fontSize: isMobile ? 9 : 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: method.is_active ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
            border: `1px solid ${method.is_active ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
            color: method.is_active ? "#ef4444" : "#22c55e",
            borderRadius: isMobile ? 6 : 7,
            cursor: "pointer",
          }}>
          {method.is_active ? "Disable" : "Enable"}
        </button>
        <button
          onClick={() => onEdit(method)}
          style={{
            width: isMobile ? 30 : 32,
            height: isMobile ? 30 : 32,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: isMobile ? 6 : 7,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <svg
            width={isMobile ? "11" : "12"}
            height={isMobile ? "11" : "12"}
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
          onClick={() => onDelete(method)}
          style={{
            width: isMobile ? 30 : 32,
            height: isMobile ? 30 : 32,
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: isMobile ? 6 : 7,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <svg
            width={isMobile ? "11" : "12"}
            height={isMobile ? "11" : "12"}
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
    </div>
  );
}

// ── Zone Card ─────────────────────────────────────────────────────────────────

function ZoneCard({
  zone,
  onEditZone,
  onDeleteZone,
  onAddMethod,
  onEditMethod,
  onDeleteMethod,
  onToggleMethod,
}) {
  const w = useWindowWidth();
  const isMobile = w < 640;
  const [expanded, setExpanded] = useState(true);
  const activeMethods = zone.methods?.filter((m) => !m.deleted_at) || [];

  return (
    <motion.div
      layout
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: isMobile ? 12 : 14,
        overflow: "hidden",
      }}>
      <div
        style={{
          padding: isMobile ? "14px 16px" : "16px 20px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 10 : 12,
          borderBottom: expanded ? "1px solid rgba(255,255,255,0.06)" : "none",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}>
        <div
          style={{
            width: isMobile ? 32 : 36,
            height: isMobile ? 32 : 36,
            borderRadius: isMobile ? 8 : 9,
            flexShrink: 0,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <svg
            width={isMobile ? "14" : "16"}
            height={isMobile ? "14" : "16"}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.8"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, flexWrap: "wrap"}}>
            <h3 style={{color: "#fff", fontSize: isMobile ? 13 : 14, fontWeight: 700, margin: 0}}>{zone.name}</h3>
            <span
              style={{
                fontSize: isMobile ? 8 : 9,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#a855f7",
                background: "rgba(168,85,247,0.12)",
                padding: isMobile ? "2px 6px" : "2px 7px",
                borderRadius: 99,
              }}>
              {activeMethods.length} method{activeMethods.length !== 1 ? "s" : ""}
            </span>
          </div>
          {zone.locations?.length > 0 && (
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: isMobile ? 10 : 11, margin: "3px 0 0"}}>
              {zone.locations
                .map((l) => (l.state ? `${l.state}, ${l.country}` : l.country))
                .join(" · ")}
            </p>
          )}
        </div>
        <div
          style={{display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, flexShrink: 0, width: isMobile ? "100%" : "auto"}}
          onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAddMethod(zone)}
            style={{
              padding: isMobile ? "5px 10px" : "6px 12px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: isMobile ? 6 : 7,
              color: "#ef4444",
              fontSize: isMobile ? 9 : 10,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
            + Method
          </button>
          <button
            onClick={() => onEditZone(zone)}
            style={{
              width: isMobile ? 30 : 32,
              height: isMobile ? 30 : 32,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: isMobile ? 6 : 7,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <svg
              width={isMobile ? "11" : "12"}
              height={isMobile ? "11" : "12"}
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
            onClick={() => onDeleteZone(zone)}
            style={{
              width: isMobile ? 30 : 32,
              height: isMobile ? 30 : 32,
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: isMobile ? 6 : 7,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <svg
              width={isMobile ? "11" : "12"}
              height={isMobile ? "11" : "12"}
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
          <svg
            width={isMobile ? "13" : "14"}
            height={isMobile ? "13" : "14"}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none"}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{height: 0, opacity: 0}}
            animate={{height: "auto", opacity: 1}}
            exit={{height: 0, opacity: 0}}
            style={{overflow: "hidden"}}>
            <div style={{padding: isMobile ? "10px 14px" : "12px 16px", display: "flex", flexDirection: "column", gap: isMobile ? 6 : 8}}>
              {activeMethods.length === 0 ? (
                <div style={{textAlign: "center", padding: isMobile ? "16px 0" : "20px 0"}}>
                  <p style={{color: "rgba(255,255,255,0.2)", fontSize: isMobile ? 11 : 12, margin: "0 0 10px"}}>
                    No shipping methods yet
                  </p>
                  <button
                    onClick={() => onAddMethod(zone)}
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px dashed rgba(239,68,68,0.25)",
                      borderRadius: isMobile ? 7 : 8,
                      color: "#ef4444",
                      fontSize: isMobile ? 10 : 11,
                      fontWeight: 700,
                      padding: isMobile ? "7px 16px" : "8px 18px",
                      cursor: "pointer",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}>
                    + Add First Method
                  </button>
                </div>
              ) : (
                activeMethods.map((method) => (
                  <MethodCard
                    key={method.id}
                    method={method}
                    onEdit={onEditMethod}
                    onDelete={onDeleteMethod}
                    onToggle={onToggleMethod}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function ShippingInner() {
  const w = useWindowWidth();
  const isMobile = w < 640;
  const {userCurrency, userSymbol} = useCurrency();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [zoneModal, setZoneModal] = useState(null);
  const [methodModal, setMethodModal] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({msg, isError});
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getShippingZones();
      setZones(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveZone = async (body) => {
    setSaving(true);
    try {
      if (zoneModal?.id) {
        const updated = await updateShippingZone(zoneModal.id, body);
        setZones((prev) => prev.map((z) => (z.id === zoneModal.id ? {...z, ...updated} : z)));
        showToast("Zone updated ✓");
      } else {
        const created = await createShippingZone(body);
        setZones((prev) => [...prev, created]);
        showToast("Zone created ✓");
      }
      setZoneModal(null);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zone) => {
    if (!window.confirm(`Delete zone "${zone.name}" and all its methods?`)) return;
    try {
      await deleteShippingZone(zone.id);
      setZones((prev) => prev.filter((z) => z.id !== zone.id));
      showToast("Zone deleted");
    } catch (e) {
      showToast(e.message, true);
    }
  };

  const handleSaveMethod = async (body) => {
    setSaving(true);
    const {zone, method} = methodModal;
    try {
      if (method?.id) {
        const updated = await updateShippingMethod(method.id, body);
        setZones((prev) =>
          prev.map((z) =>
            z.id === zone.id
              ? {...z, methods: (z.methods || []).map((m) => (m.id === method.id ? updated : m))}
              : z,
          ),
        );
        showToast("Method updated ✓");
      } else {
        const created = await createShippingMethod(zone.id, body);
        setZones((prev) =>
          prev.map((z) =>
            z.id === zone.id ? {...z, methods: [...(z.methods || []), created]} : z,
          ),
        );
        showToast("Method added ✓");
      }
      setMethodModal(null);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMethod = async (method) => {
    if (!window.confirm(`Delete method "${method.name}"?`)) return;
    try {
      await deleteShippingMethod(method.id);
      setZones((prev) =>
        prev.map((z) => ({...z, methods: (z.methods || []).filter((m) => m.id !== method.id)})),
      );
      showToast("Method deleted");
    } catch (e) {
      showToast(e.message, true);
    }
  };

  const handleToggleMethod = async (method) => {
    try {
      const result = await toggleShippingMethod(method.id);
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          methods: (z.methods || []).map((m) =>
            m.id === method.id ? {...m, is_active: result.is_active} : m,
          ),
        })),
      );
    } catch (e) {
      showToast(e.message, true);
    }
  };

  const totalMethods = zones.reduce((s, z) => s + (z.methods?.length || 0), 0);
  const activeMethods = zones.reduce(
    (s, z) => s + (z.methods?.filter((m) => m.is_active)?.length || 0),
    0,
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          marginBottom: isMobile ? 20 : 24,
          gap: isMobile ? 12 : 12,
        }}>
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.28)",
              fontSize: isMobile ? 9 : 10,
              fontWeight: 700,
              letterSpacing: isMobile ? "0.2em" : "0.24em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}>
            Delivery
          </p>
          <h1
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: isMobile ? "1.5rem" : "clamp(1.6rem,3vw,2.2rem)",
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              margin: 0,
            }}>
            SHIPPING
          </h1>
        </div>
        <div style={{display: "flex", flexWrap: "wrap", alignItems: "center", gap: isMobile ? 8 : 10}}>
          {!loading && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 5 : 6,
                  background: "rgba(168,85,247,0.08)",
                  border: "1px solid rgba(168,85,247,0.2)",
                  borderRadius: 99,
                  padding: isMobile ? "5px 12px" : "6px 14px",
                }}>
                <div style={{width: isMobile ? 6 : 7, height: isMobile ? 6 : 7, borderRadius: "50%", background: "#a855f7"}} />
                <span style={{color: "#a855f7", fontSize: isMobile ? 10 : 11, fontWeight: 700}}>
                  {zones.length} Zone{zones.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 5 : 6,
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 99,
                  padding: isMobile ? "5px 12px" : "6px 14px",
                }}>
                <div style={{width: isMobile ? 6 : 7, height: isMobile ? 6 : 7, borderRadius: "50%", background: "#22c55e"}} />
                <span style={{color: "#22c55e", fontSize: isMobile ? 10 : 11, fontWeight: 700}}>
                  {activeMethods}/{totalMethods} Active
                </span>
              </div>
            </>
          )}
          <button
            onClick={() => setZoneModal("new")}
            style={{
              background: "#ef4444",
              border: "none",
              color: "#fff",
              fontSize: isMobile ? 10 : 11,
              fontWeight: 900,
              letterSpacing: isMobile ? "0.14em" : "0.18em",
              textTransform: "uppercase",
              padding: isMobile ? "10px 18px" : "12px 22px",
              borderRadius: isMobile ? 9 : 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 6 : 8,
            }}>
            <svg
              width={isMobile ? "13" : "14"}
              height={isMobile ? "13" : "14"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add Zone
          </button>
        </div>
      </div>

      <div
        style={{
          background: "rgba(239,68,68,0.04)",
          border: "1px solid rgba(239,68,68,0.1)",
          borderRadius: isMobile ? 10 : 12,
          padding: isMobile ? "12px 14px" : "14px 18px",
          marginBottom: isMobile ? 20 : 24,
          display: "flex",
          gap: isMobile ? 10 : 12,
          alignItems: "flex-start",
        }}>
        <svg
          width={isMobile ? "14" : "16"}
          height={isMobile ? "14" : "16"}
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          style={{flexShrink: 0, marginTop: 1}}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p style={{color: "rgba(255,255,255,0.4)", fontSize: isMobile ? 11 : 12, margin: 0, lineHeight: 1.6}}>
          Create <strong style={{color: "rgba(255,255,255,0.7)"}}>Shipping Zones</strong> by
          selecting a continent or region, then pick specific countries within it. Add one or more{" "}
          <strong style={{color: "rgba(255,255,255,0.7)"}}>Shipping Methods</strong> per zone (e.g.
          Standard, Express). The country dropdown auto-filters to match your zone.
        </p>
      </div>

      {loading ? (
        <div style={{display: "flex", flexDirection: "column", gap: isMobile ? 12 : 14}}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: isMobile ? 100 : 110,
                background: "rgba(255,255,255,0.04)",
                borderRadius: isMobile ? 12 : 14,
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div style={{textAlign: "center", padding: isMobile ? "48px 16px" : "60px 20px"}}>
          <div
            style={{
              width: isMobile ? 56 : 64,
              height: isMobile ? 56 : 64,
              borderRadius: isMobile ? 14 : 16,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
            <svg
              width={isMobile ? "24" : "28"}
              height={isMobile ? "24" : "28"}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: isMobile ? "1.5rem" : "1.8rem",
              color: "rgba(255,255,255,0.12)",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}>
            NO ZONES YET
          </p>
          <p style={{color: "rgba(255,255,255,0.25)", fontSize: isMobile ? 12 : 13, marginBottom: isMobile ? 16 : 20}}>
            Create your first shipping zone to start configuring delivery options for buyers.
          </p>
          <button
            onClick={() => setZoneModal("new")}
            style={{
              background: "#ef4444",
              border: "none",
              color: "#fff",
              fontSize: isMobile ? 10 : 11,
              fontWeight: 900,
              letterSpacing: isMobile ? "0.14em" : "0.18em",
              textTransform: "uppercase",
              padding: isMobile ? "10px 24px" : "12px 28px",
              borderRadius: isMobile ? 9 : 10,
              cursor: "pointer",
            }}>
            + Create First Zone
          </button>
        </div>
      ) : (
        <div style={{display: "flex", flexDirection: "column", gap: isMobile ? 12 : 14}}>
          {zones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              onEditZone={(z) => setZoneModal(z)}
              onDeleteZone={handleDeleteZone}
              onAddMethod={(z) => setMethodModal({zone: z, method: null})}
              onEditMethod={(m) => {
                const zone = zones.find((z) => z.methods?.some((x) => x.id === m.id));
                setMethodModal({zone, method: m});
              }}
              onDeleteMethod={handleDeleteMethod}
              onToggleMethod={handleToggleMethod}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {zoneModal && (
          <ZoneModal
            initial={zoneModal === "new" ? null : zoneModal}
            onSave={handleSaveZone}
            onClose={() => setZoneModal(null)}
            saving={saving}
          />
        )}
        {methodModal && (
          <MethodModal
            initial={methodModal.method}
            zoneId={methodModal.zone?.id}
            zoneName={methodModal.zone?.name}
            zoneLocations={methodModal.zone?.locations || []}
            onSave={handleSaveMethod}
            onClose={() => setMethodModal(null)}
            saving={saving}
            brandCurrency={userCurrency}
            brandSymbol={userSymbol}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 20}}
            style={{
              position: "fixed",
              bottom: isMobile ? 20 : 28,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.isError ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: isMobile ? 11 : 12,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: isMobile ? "10px 20px" : "12px 24px",
              borderRadius: 99,
              boxShadow: `0 8px 30px ${toast.isError ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
              zIndex: 9999,
              whiteSpace: "nowrap",
              maxWidth: "calc(100vw - 40px)",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

function ShippingWithCurrency() {
  const {settings} = usePlatformSettings();
  const baseCurrency = settings?.currency || "NGN";
  return (
    <CurrencyProvider baseCurrency={baseCurrency}>
      <ShippingInner />
    </CurrencyProvider>
  );
}

export default ShippingWithCurrency;