import {useState, useEffect, useCallback, useMemo} from "react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {AnimatePresence, motion} from "framer-motion";
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
} from "../dashboard/dashboard_components/api";
import {AdminTable, Badge, SearchBar, ConfirmModal, Icon} from "./Components";

// ── Continent & Region Mappings ───────────────────────────────────────────────

const AFRICA_CODES = [
  "DZ",
  "AO",
  "BJ",
  "BW",
  "BF",
  "BI",
  "CV",
  "CM",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "CI",
  "DJ",
  "EG",
  "GQ",
  "ER",
  "SZ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "KE",
  "LS",
  "LR",
  "LY",
  "MG",
  "MW",
  "ML",
  "MR",
  "MU",
  "MA",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RW",
  "ST",
  "SN",
  "SC",
  "SL",
  "SO",
  "ZA",
  "SS",
  "SD",
  "TZ",
  "TG",
  "TN",
  "UG",
  "ZM",
  "ZW",
  "YT",
  "RE",
];
const ASIA_CODES = [
  "AF",
  "AM",
  "AZ",
  "BH",
  "BD",
  "BT",
  "BN",
  "KH",
  "CN",
  "CY",
  "GE",
  "IN",
  "ID",
  "IR",
  "IQ",
  "IL",
  "JP",
  "JO",
  "KZ",
  "KW",
  "KG",
  "LA",
  "LB",
  "MY",
  "MV",
  "MN",
  "MM",
  "NP",
  "KP",
  "OM",
  "PK",
  "PS",
  "PH",
  "QA",
  "SA",
  "SG",
  "KR",
  "LK",
  "SY",
  "TW",
  "TJ",
  "TH",
  "TL",
  "TR",
  "TM",
  "AE",
  "UZ",
  "VN",
  "YE",
  "HK",
  "MO",
];
const EUROPE_CODES = [
  "AL",
  "AD",
  "AT",
  "BY",
  "BE",
  "BA",
  "BG",
  "HR",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "XK",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "MD",
  "MC",
  "ME",
  "NL",
  "MK",
  "NO",
  "PL",
  "PT",
  "RO",
  "RU",
  "SM",
  "RS",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
  "UA",
  "GB",
  "VA",
];
const NORTH_AMERICA_CODES = [
  "AG",
  "BS",
  "BB",
  "BZ",
  "CA",
  "CR",
  "CU",
  "DM",
  "DO",
  "SV",
  "GD",
  "GT",
  "HT",
  "HN",
  "JM",
  "MX",
  "NI",
  "PA",
  "KN",
  "LC",
  "VC",
  "TT",
  "US",
  "PR",
  "AW",
  "CW",
  "SX",
  "BM",
  "KY",
  "TC",
  "VG",
  "VI",
];
const SOUTH_AMERICA_CODES = [
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "EC",
  "GY",
  "PY",
  "PE",
  "SR",
  "UY",
  "VE",
  "FK",
  "GF",
];
const OCEANIA_CODES = [
  "AU",
  "FJ",
  "KI",
  "MH",
  "FM",
  "NR",
  "NZ",
  "PW",
  "PG",
  "WS",
  "SB",
  "TO",
  "TV",
  "VU",
  "NC",
  "PF",
  "GU",
  "AS",
  "CK",
];

const WEST_AFRICA = [
  "BJ",
  "BF",
  "CV",
  "CI",
  "GM",
  "GH",
  "GN",
  "GW",
  "LR",
  "ML",
  "MR",
  "NE",
  "NG",
  "SN",
  "SL",
  "TG",
];
const EAST_AFRICA = [
  "BI",
  "KM",
  "DJ",
  "ER",
  "ET",
  "KE",
  "MG",
  "MW",
  "MU",
  "MZ",
  "RW",
  "SC",
  "SO",
  "SS",
  "TZ",
  "UG",
];
const SOUTHERN_AFRICA = ["BW", "SZ", "LS", "NA", "ZA", "ZM", "ZW"];
const NORTH_AFRICA_SUB = ["DZ", "EG", "LY", "MA", "SD", "TN"];
const CENTRAL_AFRICA = ["CM", "CF", "TD", "CG", "CD", "GQ", "GA", "ST"];
const SUB_SAHARAN_AFRICA = AFRICA_CODES.filter((c) => !NORTH_AFRICA_SUB.includes(c));
const SOUTHEAST_ASIA = ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN"];
const SOUTH_ASIA = ["AF", "BD", "BT", "IN", "MV", "NP", "PK", "LK"];
const EAST_ASIA_CODES = ["CN", "JP", "KP", "KR", "MN", "TW", "HK", "MO"];
const MIDDLE_EAST = [
  "BH",
  "IR",
  "IQ",
  "IL",
  "JO",
  "KW",
  "LB",
  "OM",
  "PS",
  "QA",
  "SA",
  "SY",
  "AE",
  "YE",
  "TR",
];
const GULF_STATES = ["BH", "KW", "OM", "QA", "SA", "AE"];
const CENTRAL_ASIA = ["KZ", "KG", "TJ", "TM", "UZ"];
const WESTERN_EUROPE = ["AT", "BE", "FR", "DE", "IE", "LI", "LU", "MC", "NL", "CH", "GB"];
const EASTERN_EUROPE = ["BY", "BG", "CZ", "HU", "MD", "PL", "RO", "RU", "SK", "UA"];
const NORTHERN_EUROPE = ["DK", "EE", "FI", "IS", "LV", "LT", "NO", "SE"];
const SOUTHERN_EUROPE = [
  "AL",
  "AD",
  "BA",
  "HR",
  "GR",
  "IT",
  "XK",
  "MT",
  "ME",
  "MK",
  "PT",
  "SM",
  "RS",
  "SI",
  "ES",
  "VA",
];
const SCANDINAVIA = ["DK", "FI", "IS", "NO", "SE"];
const EU_CODES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
];
const CARIBBEAN = [
  "AG",
  "BS",
  "BB",
  "CU",
  "DM",
  "DO",
  "GD",
  "HT",
  "JM",
  "KN",
  "LC",
  "VC",
  "TT",
  "AW",
  "CW",
  "SX",
  "PR",
  "VI",
  "VG",
  "BM",
  "KY",
  "TC",
];
const CENTRAL_AMERICA_CODES = ["BZ", "CR", "SV", "GT", "HN", "NI", "PA"];
const LATIN_AMERICA = [...SOUTH_AMERICA_CODES, ...CENTRAL_AMERICA_CODES, ...CARIBBEAN, "MX"];
const ASIA_PACIFIC = [...EAST_ASIA_CODES, ...SOUTHEAST_ASIA, ...OCEANIA_CODES];

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
  "East Asia": EAST_ASIA_CODES,
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
  "Central America": CENTRAL_AMERICA_CODES,
  Caribbean: CARIBBEAN,
  "Asia Pacific": ASIA_PACIFIC,
};

// Build ISO → Continent map
const ISO_TO_CONTINENT = {};
const CONTINENT_DEFS = {
  Africa: AFRICA_CODES,
  Asia: ASIA_CODES,
  Europe: EUROPE_CODES,
  "North America": NORTH_AMERICA_CODES,
  "South America": SOUTH_AMERICA_CODES,
  Oceania: OCEANIA_CODES,
};
Object.entries(CONTINENT_DEFS).forEach(([continent, codes]) => {
  codes.forEach((code) => {
    ISO_TO_CONTINENT[code] = continent;
  });
});

function getZoneCountryCodes(zoneName) {
  if (!zoneName?.trim()) return null;
  const name = zoneName.trim();
  if (ZONE_COUNTRY_MAP[name]) return new Set(ZONE_COUNTRY_MAP[name]);
  return null;
}

function getContinentForCountry(iso) {
  return ISO_TO_CONTINENT[iso] || null;
}

const ZONE_PRESETS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "West Africa",
  "East Africa",
  "Southern Africa",
  "North Africa",
  "Central Africa",
  "Sub-Saharan Africa",
  "Western Europe",
  "Eastern Europe",
  "Northern Europe",
  "Southern Europe",
  "Scandinavia",
  "European Union",
  "Latin America",
  "Central America",
  "Caribbean",
  "Middle East",
  "Gulf States",
  "Southeast Asia",
  "South Asia",
  "East Asia",
  "Central Asia",
  "Asia Pacific",
  "Domestic",
  "International",
  "Worldwide",
  "Rest of World",
];

const ALL_POPULAR_COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Egypt",
  "Ethiopia",
  "Tanzania",
  "Cameroon",
  "Senegal",
  "Morocco",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Poland",
  "India",
  "China",
  "Japan",
  "South Korea",
  "UAE",
  "Saudi Arabia",
  "Indonesia",
  "Singapore",
  "Turkey",
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "Colombia",
  "Australia",
  "New Zealand",
];

const PRICING_TYPES = [
  {value: "flat", label: "Flat Rate", desc: "Same price regardless of order size"},
  {value: "per_item", label: "Per Item", desc: "Base price + extra per additional item"},
  {value: "weight", label: "By Weight", desc: "Price calculated per kg"},
];
const PRICING_COLOR = {flat: "#22c55e", per_item: "#f97316", weight: "#a855f7"};
const PRICING_LABEL = {flat: "Flat", per_item: "Per Item", weight: "Weight"};

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

// ── Zone Name Input ───────────────────────────────────────────────────────────

function ZoneNameInput({value, onChange}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value || "");
  const wrapRef = React.useRef(null);
  const dropRef = React.useRef(null);
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
    setCoords({top: r.bottom + 4, left: r.left, width: r.width});
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
    const h = (e) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target) &&
        dropRef.current &&
        !dropRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const pick = (p) => {
    onChange(p);
    setQuery(p);
    setOpen(false);
  };
  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    if (!open) openDD();
  };

  return (
    <>
      <div ref={wrapRef} style={{position: "relative"}}>
        <input
          value={query}
          onChange={handleInput}
          onFocus={openDD}
          placeholder="e.g. Africa, West Africa, Europe, Worldwide"
          style={{...inp, paddingRight: 36}}
        />
        <svg
          onClick={() => (open ? setOpen(false) : openDD())}
          width="11"
          height="11"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            right: 12,
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
              borderRadius: 10,
              zIndex: 99999,
              boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
              overflow: "hidden",
            }}>
            <div style={{maxHeight: 260, overflowY: "auto"}}>
              {query.trim() &&
                !ZONE_PRESETS.find((z) => z.toLowerCase() === query.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => pick(query.trim())}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      padding: "9px 13px",
                      cursor: "pointer",
                      fontSize: 13,
                      background: "rgba(239,68,68,0.08)",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                    <span>+ Use "{query.trim()}"</span>
                  </button>
                )}
              {filtered.map((preset) => {
                const isSel = preset.toLowerCase() === value?.toLowerCase();
                const codes = ZONE_COUNTRY_MAP[preset];
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => pick(preset)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      padding: "9px 13px",
                      cursor: "pointer",
                      fontSize: 13,
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
                      {codes && (
                        <span style={{fontSize: 10, color: "rgba(255,255,255,0.2)"}}>
                          {codes.length}
                        </span>
                      )}
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
                    </span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Location Row ──────────────────────────────────────────────────────────────

function LocationRow({loc, onChange, onRemove, showRemove, allowedCodes}) {
  const countryOptions = useMemo(() => {
    let c = Country.getAllCountries();
    if (allowedCodes) c = c.filter((x) => allowedCodes.has(x.isoCode));
    return c.map((x) => ({value: x.isoCode, label: x.name, flag: x.flag}));
  }, [allowedCodes]);

  const stateOptions = useMemo(
    () =>
      loc.countryIso
        ? State.getStatesOfCountry(loc.countryIso).map((s) => ({value: s.name, label: s.name}))
        : [],
    [loc.countryIso],
  );

  return (
    <div
      style={{display: "grid", gridTemplateColumns: "1fr 1fr 32px", gap: 8, alignItems: "center"}}>
      <SearchableSelect
        options={countryOptions}
        value={loc.countryIso || ""}
        onChange={(iso) => {
          const c = Country.getCountryByCode(iso);
          onChange({countryIso: iso, country: c?.name || "", state: ""});
        }}
        placeholder="Country"
      />
      <SearchableSelect
        options={[{value: "", label: "— All —"}, ...stateOptions]}
        value={loc.state || ""}
        onChange={(name) => onChange({...loc, state: name})}
        placeholder={loc.countryIso ? "All states" : "Pick country"}
        disabled={!loc.countryIso}
      />
      {showRemove ? (
        <button
          type="button"
          onClick={onRemove}
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
      ) : (
        <div />
      )}
    </div>
  );
}

// ── Method Form Modal ─────────────────────────────────────────────────────────

function MethodFormModal({initial, onSave, onClose, saving}) {
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
    onSave({
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
    });
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
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(2px)",
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
      <motion.div
        initial={{scale: 0.96, y: 16}}
        animate={{scale: 1, y: 0}}
        exit={{scale: 0.96, y: 16}}
        style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        }}>
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>
            {initial?.id ? "Edit Method" : "New Method"}
          </p>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
            }}>
            ✕
          </button>
        </div>

        <div style={{padding: "18px 22px", display: "flex", flexDirection: "column", gap: 12}}>
          <div>
            <Lbl>Method Name</Lbl>
            <input
              value={form.name}
              onChange={set("name")}
              style={inp}
              onFocus={onF}
              onBlur={onB}
              placeholder="e.g. Standard Delivery"
            />
          </div>
          <div>
            <Lbl opt>Description</Lbl>
            <input
              value={form.description}
              onChange={set("description")}
              style={inp}
              onFocus={onF}
              onBlur={onB}
              placeholder="e.g. 3–5 business days"
            />
          </div>

          <div>
            <Lbl>Pricing Type</Lbl>
            <div style={{display: "flex", gap: 6}}>
              {PRICING_TYPES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setForm((f) => ({...f, pricing_type: p.value}))}
                  style={{
                    flex: 1,
                    padding: "8px 6px",
                    borderRadius: 8,
                    cursor: "pointer",
                    border: `1px solid ${form.pricing_type === p.value ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
                    background:
                      form.pricing_type === p.value ? "rgba(239,68,68,0.08)" : "transparent",
                    color: form.pricing_type === p.value ? "#ef4444" : "rgba(255,255,255,0.45)",
                  }}>
                  <p style={{fontSize: 10, fontWeight: 700, margin: "0 0 1px"}}>{p.label}</p>
                  <p style={{fontSize: 8, margin: 0, opacity: 0.5}}>{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {form.pricing_type === "flat" && (
            <div>
              <Lbl>Flat Rate ($)</Lbl>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.flat_rate}
                onChange={set("flat_rate")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="0.00"
              />
            </div>
          )}
          {form.pricing_type === "per_item" && (
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
              <div>
                <Lbl>Base Rate ($)</Lbl>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.flat_rate}
                  onChange={set("flat_rate")}
                  style={inp}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Lbl>Per Item ($)</Lbl>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.per_item_rate}
                  onChange={set("per_item_rate")}
                  style={inp}
                  onFocus={onF}
                  onBlur={onB}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
          {form.pricing_type === "weight" && (
            <div>
              <Lbl>Rate Per kg ($)</Lbl>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.weight_rate}
                onChange={set("weight_rate")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <Lbl opt>Free Shipping Above ($)</Lbl>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.free_above}
              onChange={set("free_above")}
              style={inp}
              onFocus={onF}
              onBlur={onB}
              placeholder="Leave empty to disable"
            />
          </div>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            <div>
              <Lbl opt>Min Days</Lbl>
              <input
                type="number"
                min="0"
                value={form.min_days}
                onChange={set("min_days")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="e.g. 2"
              />
            </div>
            <div>
              <Lbl opt>Max Days</Lbl>
              <input
                type="number"
                min="0"
                value={form.max_days}
                onChange={set("max_days")}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                placeholder="e.g. 7"
              />
            </div>
          </div>

          <div
            onClick={() => setForm((f) => ({...f, is_active: !f.is_active}))}
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
                background: form.is_active ? "#22c55e" : "rgba(255,255,255,0.1)",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}>
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: form.is_active ? 18 : 2,
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
                Active
              </p>
              <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0}}>
                Show at checkout
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 8,
          }}>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            style={{
              flex: 1,
              background: saving ? "#7f1d1d" : "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "11px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: saving || !form.name.trim() ? "not-allowed" : "pointer",
            }}>
            {saving ? "Saving…" : initial?.id ? "Save Changes" : "Create Method"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "11px 18px",
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
      </motion.div>
    </motion.div>
  );
}

// ── Zone Drawer ───────────────────────────────────────────────────────────────

function ZoneDrawer({zone, onClose, onRefresh}) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [name, setName] = useState(zone.name || "");
  const [locations, setLocations] = useState(() => {
    if (zone.locations?.length) {
      const allC = Country.getAllCountries();
      return zone.locations.map((l) => {
        const f = allC.find((c) => c.name === l.country);
        return {countryIso: f?.isoCode || "", country: l.country, state: l.state || ""};
      });
    }
    return [{countryIso: "", country: "", state: ""}];
  });
  const [methodEdit, setMethodEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const allowedCodes = useMemo(() => getZoneCountryCodes(name), [name]);
  const activeMethods = zone.methods?.filter((m) => !m.deleted_at) || [];

  const popularCountries = useMemo(() => {
    if (!allowedCodes) return ALL_POPULAR_COUNTRIES.slice(0, 12);
    const allC = Country.getAllCountries();
    return ALL_POPULAR_COUNTRIES.filter((cn) => {
      const f = allC.find((c) => c.name === cn);
      return f && allowedCodes.has(f.isoCode);
    });
  }, [allowedCodes]);

  const handleZoneNameChange = (newName) => {
    setName(newName);
    const codes = getZoneCountryCodes(newName);
    if (codes)
      setLocations((prev) => {
        const valid = prev.filter((l) => !l.countryIso || codes.has(l.countryIso));
        return valid.length ? valid : [{countryIso: "", country: "", state: ""}];
      });
  };

  const handleLocationChange = (i, val) => {
    setLocations((l) => l.map((loc, j) => (j === i ? val : loc)));
    if (!name.trim() && val.countryIso) {
      const cont = getContinentForCountry(val.countryIso);
      if (cont) setName(cont);
    }
  };

  const quickAdd = (cn) => {
    const allC = Country.getAllCountries();
    const f = allC.find((c) => c.name === cn);
    if (!f || (allowedCodes && !allowedCodes.has(f.isoCode))) return;
    if (locations.find((l) => l.countryIso === f.isoCode)) return;
    const entry = {countryIso: f.isoCode, country: f.name, state: ""};
    const empty = locations.findIndex((l) => !l.country);
    if (empty >= 0) setLocations((l) => l.map((loc, i) => (i === empty ? entry : loc)));
    else setLocations((l) => [...l, entry]);
    if (!name.trim()) {
      const cont = getContinentForCountry(f.isoCode);
      if (cont) setName(cont);
    }
  };

  const handleSaveZone = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateShippingZone(zone.id, {
        name,
        locations: locations
          .filter((l) => l.country.trim())
          .map((l) => ({country: l.country, state: l.state})),
      });
      setEditMode(false);
      onRefresh();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMethod = async (body) => {
    setSaving(true);
    try {
      if (methodEdit?.id) await updateShippingMethod(methodEdit.id, body);
      else await createShippingMethod(zone.id, body);
      setMethodEdit(null);
      onRefresh();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (m) => {
    try {
      await toggleShippingMethod(m.id);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (confirm.type === "zone") {
        await deleteShippingZone(zone.id);
        onClose();
        onRefresh();
      }
      if (confirm.type === "method") {
        await deleteShippingMethod(confirm.item.id);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
    setConfirm(null);
  };

  const priceLabel = (m) => {
    if (m.pricing_type === "flat") return `$${m.flat_rate?.toFixed(2)}`;
    if (m.pricing_type === "per_item")
      return `$${m.flat_rate?.toFixed(2)} + $${m.per_item_rate?.toFixed(2)}/item`;
    if (m.pricing_type === "weight") return `$${m.weight_rate?.toFixed(2)}/kg`;
    return "—";
  };
  const deliveryLabel = (m) => {
    if (m.min_days && m.max_days) return `${m.min_days}–${m.max_days} days`;
    if (m.min_days) return `From ${m.min_days} days`;
    if (m.max_days) return `Up to ${m.max_days} days`;
    return null;
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
              }}>
              <Icon name="globe" size={20} color="#ef4444" />
            </div>
            <div>
              <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>{zone.name}</p>
              <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                {zone.locations?.length || 0} countries · {activeMethods.length} methods
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
              label={zone.is_active ? "Active" : "Inactive"}
              color={zone.is_active ? "#22c55e" : "#6b7280"}
            />
            <Badge
              label={`${activeMethods.length} method${activeMethods.length !== 1 ? "s" : ""}`}
              color="#a855f7"
            />
            <Badge label={`${zone.locations?.length || 0} countries`} color="#3b82f6" />
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
                Edit Zone
              </p>
              <div style={{marginBottom: 14}}>
                <Lbl>Zone / Region</Lbl>
                <ZoneNameInput value={name} onChange={handleZoneNameChange} />
                {allowedCodes && (
                  <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 4}}>
                    Filtered to {allowedCodes.size} countries in {name}
                  </p>
                )}
              </div>
              <div style={{marginBottom: 14}}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}>
                  <Lbl>Countries</Lbl>
                  <button
                    type="button"
                    onClick={() =>
                      setLocations((l) => [...l, {countryIso: "", country: "", state: ""}])
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
                    + Row
                  </button>
                </div>
                {popularCountries.length > 0 && (
                  <div style={{display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10}}>
                    {popularCountries.map((c) => {
                      const already = locations.some((l) => l.country === c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => !already && quickAdd(c)}
                          style={{
                            fontSize: 9,
                            padding: "2px 8px",
                            borderRadius: 99,
                            cursor: already ? "default" : "pointer",
                            border: `1px solid ${already ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                            background: already ? "rgba(239,68,68,0.08)" : "transparent",
                            color: already ? "#ef4444" : "rgba(255,255,255,0.4)",
                          }}>
                          {already && "✓ "}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{display: "flex", flexDirection: "column", gap: 6}}>
                  {locations.map((loc, i) => (
                    <LocationRow
                      key={i}
                      loc={loc}
                      onChange={(val) => handleLocationChange(i, val)}
                      onRemove={() => setLocations((l) => l.filter((_, j) => j !== i))}
                      showRemove={locations.length > 1}
                      allowedCodes={allowedCodes}
                    />
                  ))}
                </div>
              </div>
              {saveError && (
                <p style={{color: "#ef4444", fontSize: 11, marginTop: 10}}>{saveError}</p>
              )}
              <div style={{display: "flex", gap: 8, marginTop: 16}}>
                <button
                  onClick={handleSaveZone}
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
                Zone Info
              </p>
              <DetailRow label="Zone Name" value={zone.name} />
              <DetailRow
                label="Status"
                value={zone.is_active ? "Active" : "Inactive"}
                accent={zone.is_active ? "#22c55e" : "#6b7280"}
              />
              <DetailRow label="Created" value={fmt(zone.created_at)} />

              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "16px 0 8px",
                }}>
                Locations ({zone.locations?.length || 0})
              </p>
              {zone.locations?.length > 0 ? (
                <div style={{display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 4}}>
                  {zone.locations.map((l, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 99,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.6)",
                      }}>
                      {l.state ? `${l.state}, ${l.country}` : l.country}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11}}>No locations assigned</p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  margin: "20px 0 8px",
                }}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: 0,
                  }}>
                  Methods ({activeMethods.length})
                </p>
                <button
                  onClick={() => setMethodEdit("new")}
                  style={{
                    padding: "5px 12px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#ef4444",
                    borderRadius: 7,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}>
                  + Add Method
                </button>
              </div>

              {activeMethods.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px 0",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10,
                  }}>
                  <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: "0 0 8px"}}>
                    No methods yet
                  </p>
                  <button
                    onClick={() => setMethodEdit("new")}
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px dashed rgba(239,68,68,0.25)",
                      borderRadius: 8,
                      color: "#ef4444",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "6px 14px",
                      cursor: "pointer",
                    }}>
                    + Add First Method
                  </button>
                </div>
              ) : (
                activeMethods.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 8,
                      opacity: m.is_active ? 1 : 0.55,
                    }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}>
                      <div style={{display: "flex", alignItems: "center", gap: 8}}>
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: m.is_active ? "#22c55e" : "rgba(255,255,255,0.15)",
                          }}
                        />
                        <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>{m.name}</span>
                        <Badge
                          label={PRICING_LABEL[m.pricing_type] || m.pricing_type}
                          color={PRICING_COLOR[m.pricing_type] || "#fff"}
                        />
                      </div>
                      <div style={{display: "flex", gap: 4}}>
                        <button
                          onClick={() => handleToggle(m)}
                          style={{
                            padding: "3px 8px",
                            fontSize: 9,
                            fontWeight: 700,
                            borderRadius: 6,
                            cursor: "pointer",
                            background: m.is_active
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(34,197,94,0.08)",
                            border: `1px solid ${m.is_active ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                            color: m.is_active ? "#ef4444" : "#22c55e",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}>
                          {m.is_active ? "Off" : "On"}
                        </button>
                        <button
                          onClick={() => setMethodEdit(m)}
                          style={{
                            width: 28,
                            height: 28,
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.09)",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <span style={{fontSize: 10, color: "rgba(255,255,255,0.5)"}}>✎</span>
                        </button>
                        <button
                          onClick={() => setConfirm({type: "method", item: m})}
                          style={{
                            width: 28,
                            height: 28,
                            background: "rgba(239,68,68,0.07)",
                            border: "1px solid rgba(239,68,68,0.15)",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <Icon name="trash" size={10} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                    <div style={{display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center"}}>
                      <span
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "0.95rem",
                          color: "#ef4444",
                        }}>
                        {priceLabel(m)}
                      </span>
                      {m.free_above != null && (
                        <span style={{color: "#22c55e", fontSize: 10}}>
                          Free &gt;${m.free_above}
                        </span>
                      )}
                      {deliveryLabel(m) && (
                        <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>
                          {deliveryLabel(m)}
                        </span>
                      )}
                      {m.description && (
                        <span style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                          {m.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}

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
                <button
                  onClick={() => setConfirm({type: "zone", item: zone})}
                  style={{
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
                  }}>
                  🗑 Delete Zone & All Methods
                </button>
              </div>
            </>
          )}
        </div>

        <AnimatePresence>
          {methodEdit && (
            <MethodFormModal
              initial={methodEdit === "new" ? null : methodEdit}
              onSave={handleSaveMethod}
              onClose={() => setMethodEdit(null)}
              saving={saving}
            />
          )}
          {confirm && (
            <ConfirmModal
              title={confirm.type === "zone" ? "Delete Zone" : "Delete Method"}
              message={
                confirm.type === "zone"
                  ? `Delete zone "${zone.name}" and all its methods?`
                  : `Delete method "${confirm.item.name}"?`
              }
              confirmLabel="Delete"
              danger
              onConfirm={handleConfirmDelete}
              onCancel={() => setConfirm(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Create Zone Drawer ────────────────────────────────────────────────────────

function CreateZoneDrawer({onClose, onCreated}) {
  const [name, setName] = useState("");
  const [locations, setLocations] = useState([{countryIso: "", country: "", state: ""}]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allowedCodes = useMemo(() => getZoneCountryCodes(name), [name]);
  const popularCountries = useMemo(() => {
    if (!allowedCodes) return ALL_POPULAR_COUNTRIES.slice(0, 12);
    const allC = Country.getAllCountries();
    return ALL_POPULAR_COUNTRIES.filter((cn) => {
      const f = allC.find((c) => c.name === cn);
      return f && allowedCodes.has(f.isoCode);
    });
  }, [allowedCodes]);

  const handleZoneNameChange = (newName) => {
    setName(newName);
    const codes = getZoneCountryCodes(newName);
    if (codes)
      setLocations((prev) => {
        const valid = prev.filter((l) => !l.countryIso || codes.has(l.countryIso));
        return valid.length ? valid : [{countryIso: "", country: "", state: ""}];
      });
  };

  const handleLocationChange = (i, val) => {
    setLocations((l) => l.map((loc, j) => (j === i ? val : loc)));
    if (!name.trim() && val.countryIso) {
      const cont = getContinentForCountry(val.countryIso);
      if (cont) setName(cont);
    }
  };

  const quickAdd = (cn) => {
    const allC = Country.getAllCountries();
    const f = allC.find((c) => c.name === cn);
    if (!f || (allowedCodes && !allowedCodes.has(f.isoCode))) return;
    if (locations.find((l) => l.countryIso === f.isoCode)) return;
    const entry = {countryIso: f.isoCode, country: f.name, state: ""};
    const empty = locations.findIndex((l) => !l.country);
    if (empty >= 0) setLocations((l) => l.map((loc, i) => (i === empty ? entry : loc)));
    else setLocations((l) => [...l, entry]);
    if (!name.trim()) {
      const cont = getContinentForCountry(f.isoCode);
      if (cont) setName(cont);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Zone name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createShippingZone({
        name,
        locations: locations
          .filter((l) => l.country.trim())
          .map((l) => ({country: l.country, state: l.state})),
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
              Shipping
            </p>
            <p style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
              Create Shipping Zone
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

          <div style={{marginBottom: 14}}>
            <Lbl>Zone / Region</Lbl>
            <ZoneNameInput value={name} onChange={handleZoneNameChange} />
            {allowedCodes && (
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 4}}>
                Filtered to {allowedCodes.size} countries in {name}
              </p>
            )}
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
            Countries
          </p>

          {popularCountries.length > 0 && (
            <div style={{display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10}}>
              {popularCountries.map((c) => {
                const already = locations.some((l) => l.country === c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => !already && quickAdd(c)}
                    style={{
                      fontSize: 9,
                      padding: "2px 8px",
                      borderRadius: 99,
                      cursor: already ? "default" : "pointer",
                      border: `1px solid ${already ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                      background: already ? "rgba(239,68,68,0.08)" : "transparent",
                      color: already ? "#ef4444" : "rgba(255,255,255,0.4)",
                    }}>
                    {already && "✓ "}
                    {c}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{display: "flex", flexDirection: "column", gap: 6, marginBottom: 12}}>
            {locations.map((loc, i) => (
              <LocationRow
                key={i}
                loc={loc}
                onChange={(val) => handleLocationChange(i, val)}
                onRemove={() => setLocations((l) => l.filter((_, j) => j !== i))}
                showRemove={locations.length > 1}
                allowedCodes={allowedCodes}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLocations((l) => [...l, {countryIso: "", country: "", state: ""}])}
            style={{
              background: "none",
              border: "1px dashed rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "rgba(255,255,255,0.3)",
              fontSize: 11,
              padding: "8px",
              cursor: "pointer",
              width: "100%",
              marginBottom: 12,
            }}>
            + Add Another Country
          </button>
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
            disabled={saving || !name.trim()}
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
              cursor: saving || !name.trim() ? "not-allowed" : "pointer",
            }}>
            {saving ? "Creating…" : "Create Zone"}
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminShipping() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedZone, setSelectedZone] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getShippingZones()
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setZones(list);
        if (selectedZone) {
          const updated = list.find((z) => z.id === selectedZone.id);
          if (updated) setSelectedZone(updated);
          else setSelectedZone(null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = zones;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (z) =>
          z.name.toLowerCase().includes(q) ||
          z.locations?.some(
            (l) => l.country.toLowerCase().includes(q) || l.state?.toLowerCase().includes(q),
          ),
      );
    }
    if (statusFilter === "active") list = list.filter((z) => z.is_active);
    if (statusFilter === "inactive") list = list.filter((z) => !z.is_active);
    return list;
  }, [zones, search, statusFilter]);

  const totalMethods = zones.reduce(
    (s, z) => s + (z.methods?.filter((m) => !m.deleted_at)?.length || 0),
    0,
  );
  const activeMethods = zones.reduce(
    (s, z) => s + (z.methods?.filter((m) => m.is_active && !m.deleted_at)?.length || 0),
    0,
  );

  const cols = [
    {
      key: "icon",
      label: "",
      render: () => (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            background: "rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Icon name="globe" size={14} color="#ef4444" />
        </div>
      ),
    },
    {
      key: "name",
      label: "Zone",
      render: (z) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>{z.name}</p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
            {z.locations?.length
              ? z.locations
                  .slice(0, 3)
                  .map((l) => (l.state ? `${l.state}, ${l.country}` : l.country))
                  .join(" · ")
              : "No locations"}
            {z.locations?.length > 3 && ` +${z.locations.length - 3}`}
          </p>
        </div>
      ),
    },
    {
      key: "countries",
      label: "Countries",
      render: (z) => <Badge label={`${z.locations?.length || 0}`} color="#3b82f6" />,
    },
    {
      key: "methods",
      label: "Methods",
      render: (z) => {
        const active = z.methods?.filter((m) => m.is_active && !m.deleted_at)?.length || 0;
        const total = z.methods?.filter((m) => !m.deleted_at)?.length || 0;
        return <Badge label={`${active}/${total}`} color="#a855f7" />;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (z) => (
        <Badge
          label={z.is_active ? "Active" : "Inactive"}
          color={z.is_active ? "#22c55e" : "#6b7280"}
        />
      ),
    },
    {
      key: "created",
      label: "Created",
      render: (z) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmt(z.created_at)}</span>
      ),
    },
  ];

  return (
    <div>
      <AnimatePresence>
        {selectedZone && (
          <ZoneDrawer zone={selectedZone} onClose={() => setSelectedZone(null)} onRefresh={load} />
        )}
        {showCreate && <CreateZoneDrawer onClose={() => setShowCreate(false)} onCreated={load} />}
      </AnimatePresence>

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
        value={search}
        onChange={setSearch}
        placeholder="Search by zone name or country..."
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
              + New Zone
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
            {filtered.length} zone{filtered.length !== 1 ? "s" : ""} · {activeMethods}/
            {totalMethods} active methods
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
            Click a row to view details
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={filtered}
          loading={loading}
          onRowClick={(z) => setSelectedZone(z)}
          emptyMsg="No shipping zones found."
        />
      </div>
    </div>
  );
}
