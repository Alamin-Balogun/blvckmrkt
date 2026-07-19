import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import {createPortal} from "react-dom";
import {motion, AnimatePresence} from "framer-motion";
import {Link, useNavigate, useLocation} from "react-router-dom";
import {useCartWishlist, getToken} from "../../../components/cartcontext";
import {useCurrency} from "../../../components/currencycontext";
import { useGeo } from "../../../utils/geo";
import PhoneInput from "../../../components/phoneinput";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

const STEPS = ["Contact", "Delivery", "Payment", "Review"];

// Paystack is temporarily disabled ("Coming Soon" in the UI) while a Paystack
// dashboard configuration issue gets sorted out. Flip this back on once that's
// fixed — it's wired up as a hosted checkout exactly like Flutterwave below
// (opens in a new tab, finalized via /payment/callback) and is ready to go.
const CARD_PAYMENTS_ENABLED = false;

const paymentMethods = [
  {id: "flutterwave", label: "Pay with Flutterwave", icon: "🦋", description: "Card, Mobile Money, Bank & USSD"},
  {id: "transfer", label: "Bank Transfer", icon: "🏦", description: "Manual Transfer"},
  {id: "card", label: "Credit / Debit Card", icon: "💳", description: "Powered by Paystack", comingSoon: true},
];

const gatewayLabel = (g) =>
  ({flutterwave: "Flutterwave", paystack: "Paystack / Card", transfer: "Bank Transfer"}[g] || g || "—");

// ─── Copyable reference row — order/payment confirmation screens use several
// of these so the customer can grab exactly what they'd need to quote to
// support if anything goes wrong later. ───────────────────────────────────────
function CopyRow({label, value, highlight}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = () => {
    navigator.clipboard?.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
      <span style={{color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase"}}>
        {label}
      </span>
      <button
        type="button"
        onClick={copy}
        title="Copy"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: highlight ? "1.05rem" : "0.95rem",
          color: highlight ? "#ef4444" : "#fff",
          letterSpacing: "0.06em",
        }}>
        {value}
        <svg width="12" height="12" fill="none" stroke={copied ? "#22c55e" : "rgba(255,255,255,0.3)"} strokeWidth="2" viewBox="0 0 24 24">
          {copied ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          )}
        </svg>
      </button>
    </div>
  );
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
    setCoords({top: r.bottom + 6, left: r.left, width: r.width});
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
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
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
        onClick={() => (open ? setOpen(false) : openDropdown())}
        style={{
          width: "100%",
          background: disabled ? "rgba(255,255,255,0.02)" : open ? "#1e1e1e" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(239,68,68,0.55)" : disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 8,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.18s",
          outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
          fontFamily: "inherit",
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
              color: disabled ? "rgba(255,255,255,0.18)" : selected ? "#fff" : "rgba(255,255,255,0.28)",
            }}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <svg
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
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
        createPortal(
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
            <div
              style={{
                padding: "10px 10px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: "#1e1e1e",
              }}>
              <div style={{position: "relative"}}>
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                    borderRadius: 8,
                    padding: "8px 10px 8px 32px",
                    color: "#fff",
                    fontSize: 12,
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s",
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
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        padding: "9px 14px",
                        cursor: "pointer",
                        fontSize: 13,
                        background: isSelected ? "rgba(239,68,68,0.1)" : "transparent",
                        color: isSelected ? "#ef4444" : "rgba(255,255,255,0.72)",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}>
                      {opt.flag && (
                        <span style={{fontSize: 15, lineHeight: 1, flexShrink: 0}}>{opt.flag}</span>
                      )}
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

// ── CheckoutBrandShippingPanel ────────────────────────────────────────────────
// Inline shipping method selector for the checkout Delivery step (cart flow).
// Fetches the brand's shipping options once, caches them, and lets the user
// change the selected method — supports both delivery and pickup tabs.
function CheckoutBrandShippingPanel({
  brandId, brandName, selected, cache, setCache,
  fmtMoney, convert, baseCurrency, onSelect,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shippingData, setShippingData] = useState(cache[brandId] ?? null);
  // ✅ Tab state — default to whichever mode is currently selected for this brand
  const [tab, setTab] = useState(selected?.pickupMode ? "pickup" : "delivery");

  // Fetch once per brandId, store in parent cache so re-renders don't re-fetch
  useEffect(() => {
    if (cache[brandId]) { setShippingData(cache[brandId]); return; }
    setLoading(true);
    fetch(`${API_BASE}/api/shop/brands/${brandId}/shipping`)
      .then((r) => r.json())
      .then((json) => {
        const data = json?.data ?? json;
        const safe = {
          zones:   Array.isArray(data?.zones)   ? data.zones   : [],
          local:   Array.isArray(data?.local)   ? data.local   : [],
          pickups: Array.isArray(data?.pickups) ? data.pickups : [],
        };
        setShippingData(safe);
        setCache((prev) => ({...prev, [brandId]: safe}));
      })
      .catch(() => {
        const empty = {zones: [], local: [], pickups: []};
        setShippingData(empty);
        setCache((prev) => ({...prev, [brandId]: empty}));
      })
      .finally(() => setLoading(false));
  }, [brandId]); // eslint-disable-line

  // ✅ Sync tab when selected changes externally (e.g. global mode toggle)
  useEffect(() => {
    setTab(selected?.pickupMode ? "pickup" : "delivery");
  }, [selected?.pickupMode]);

  const deliveryMethods = shippingData ? [
    ...(shippingData.zones?.flatMap((z) =>
      (z.methods ?? []).map((m) => ({
        ...m, type: "zone",
        locations: z.locations ?? [],
        zone: z,
      }))
    ) ?? []),
    ...(shippingData.local?.map((m) => ({
      ...m,
      type: "local",
      _currency: (m.currency_code || m.currency || baseCurrency || "NGN").toUpperCase(),
    })) ?? []),
  ] : [];

  const pickupMethods = shippingData?.pickups ?? [];
  const hasDelivery = deliveryMethods.length > 0;
  const hasPickup   = pickupMethods.length > 0;

  const rawSelected = selected?.pickupMode ? 0 : Number(selected?.flat_rate ?? selected?.base_price ?? selected?.rate ?? 0);
  const selCur = (selected?._currency || selected?.currency_code || selected?.currency || baseCurrency || "NGN").toUpperCase();
  const convertedSelected = convert ? convert(rawSelected, selCur) : rawSelected;
  const selectedPriceLabel = selected?.pickupMode ? "FREE" : (rawSelected === 0 ? "FREE" : (fmtMoney ? fmtMoney(convertedSelected) : `₦${convertedSelected.toLocaleString()}`));

  return (
    <div style={{marginBottom: 12}}>
      {/* Brand label */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 6,
      }}>
        <span style={{
          color: "rgba(255,255,255,0.28)", fontSize: 9, fontWeight: 900,
          letterSpacing: "0.22em", textTransform: "uppercase",
        }}>
          {brandName}
        </span>
        <div style={{flex: 1, height: 1, background: "rgba(255,255,255,0.06)"}} />
      </div>

      {/* Selector box */}
      <div style={{
        border: `1px solid ${selected ? (selected.pickupMode ? "rgba(147,51,234,0.4)" : "rgba(34,197,94,0.3)") : "rgba(255,193,7,0.3)"}`,
        borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}>
        {/* Current selection / toggle */}
        <div
          onClick={() => setOpen((v) => !v)}
          style={{
            padding: "13px 15px",
            display: "flex", alignItems: "center", gap: 12,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <div style={{flex: 1, minWidth: 0}}>
            {selected ? (
              <div>
                <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 3}}>
                  <span style={{color: selected.pickupMode ? "#9333ea" : "#22c55e", fontSize: 10}}>✓</span>
                  <span style={{color: "#fff", fontSize: 12, fontWeight: 600}}>
                    {selected.name || (selected.pickupMode ? "Pickup" : "Delivery")}
                  </span>
                  {selected.pickupMode ? (
                    <span style={{
                      background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.3)",
                      color: "#9333ea", fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "1px 5px", borderRadius: 3,
                    }}>PICKUP</span>
                  ) : selected.type === "local" ? (
                    <span style={{
                      background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                      color: "#22c55e", fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "1px 5px", borderRadius: 3,
                    }}>LOCAL</span>
                  ) : null}
                </div>
                {selected.pickupMode ? (
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
                    📍 {[selected.address, selected.city, selected.state].filter(Boolean).join(", ") || "See pickup details"}
                  </p>
                ) : (
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
                    🚚 {[
                      selected.city,
                      selected.state,
                      selected.country,
                      ...(selected.locations ?? []).map((l) => [l.city, l.state, l.country].filter(Boolean).join(", ")),
                    ].filter(Boolean).slice(0, 3).join(", ") || "Delivery"}
                  </p>
                )}
              </div>
            ) : loading ? (
              <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>Loading options…</span>
            ) : (
              <span style={{color: "rgba(255,193,7,0.7)", fontSize: 11}}>Click to select a shipping method</span>
            )}
          </div>
          <span style={{
            color: selected ? (selected.pickupMode ? "#9333ea" : "#22c55e") : "rgba(255,255,255,0.4)",
            fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
          }}>
            {selected ? selectedPriceLabel : ""}
          </span>
          <svg
            style={{
              flexShrink: 0,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
            width="11" height="11" fill="none" viewBox="0 0 24 24"
            stroke="rgba(255,255,255,0.3)" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Expanded options */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{height: 0, opacity: 0}}
              animate={{height: "auto", opacity: 1}}
              exit={{height: 0, opacity: 0}}
              transition={{duration: 0.22}}
              style={{overflow: "hidden"}}>
              <div style={{
                padding: "12px 14px",
                background: "rgba(0,0,0,0.25)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                {loading ? (
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", padding: "10px 0"}}>
                    Loading shipping options…
                  </p>
                ) : (
                  <>
                    {/* ✅ Tab switcher — show only when both delivery AND pickup exist */}
                    {hasDelivery && hasPickup && (
                      <div style={{display: "flex", gap: 6, marginBottom: 12}}>
                        {[
                          {id: "delivery", icon: "🚚", label: "Delivery"},
                          {id: "pickup",   icon: "🏪", label: "Pickup"},
                        ].map(({id, icon, label}) => (
                          <button
                            key={id}
                            onClick={() => setTab(id)}
                            style={{
                              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                              padding: "7px 0", borderRadius: 7, cursor: "pointer", fontSize: 10,
                              fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
                              border: tab === id
                                ? (id === "pickup" ? "1px solid rgba(147,51,234,0.5)" : "1px solid #ef4444")
                                : "1px solid rgba(255,255,255,0.08)",
                              background: tab === id
                                ? (id === "pickup" ? "rgba(147,51,234,0.1)" : "rgba(239,68,68,0.1)")
                                : "transparent",
                              color: tab === id
                                ? (id === "pickup" ? "#9333ea" : "#ef4444")
                                : "rgba(255,255,255,0.35)",
                              transition: "all 0.18s",
                            }}>
                            <span style={{fontSize: 11}}>{icon}</span> {label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ✅ DELIVERY METHODS */}
                    {(tab === "delivery" || !hasPickup) && (
                      <>
                        {deliveryMethods.length === 0 ? (
                          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", padding: "10px 0"}}>
                            No delivery methods available for this brand.
                          </p>
                        ) : (
                          deliveryMethods.map((method) => {
                            const isSelected = selected && !selected.pickupMode &&
                              selected.id === method.id && selected.type === method.type;
                            const rawPrice = Number(method.flat_rate ?? method.base_price ?? method.rate ?? 0);
                            const methodCur = (method._currency || method.currency_code || method.currency || baseCurrency || "NGN").toUpperCase();
                            const convertedPrice = convert ? convert(rawPrice, methodCur) : rawPrice;
                            const priceLabel = rawPrice === 0 ? "FREE" : (fmtMoney ? fmtMoney(convertedPrice) : `₦${convertedPrice.toLocaleString()}`);
                            const locationParts = method.type === "local"
                              ? [method.city, method.state, method.country].filter(Boolean)
                              : (method.locations ?? []).flatMap((l) => [l.city, l.state, l.country].filter(Boolean)).slice(0, 4);
                            const locationStr = locationParts.join(", ");

                            return (
                              <div
                                key={`${method.type}-${method.id}`}
                                onClick={() => { onSelect(method); setOpen(false); }}
                                style={{
                                  padding: "11px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 8,
                                  border: isSelected ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                  background: isSelected ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.02)",
                                  transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
                                onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; } }}>
                                <div style={{display: "flex", alignItems: "flex-start", gap: 10}}>
                                  <div style={{
                                    width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                                    border: isSelected ? "2px solid #ef4444" : "2px solid rgba(255,255,255,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    {isSelected && <div style={{width: 6, height: 6, borderRadius: "50%", background: "#ef4444"}} />}
                                  </div>
                                  <div style={{flex: 1, minWidth: 0}}>
                                    <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap"}}>
                                      <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>{method.name}</span>
                                      {method.type === "local" && (
                                        <span style={{
                                          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                                          color: "#22c55e", fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                                          textTransform: "uppercase", padding: "1px 5px", borderRadius: 3,
                                        }}>LOCAL</span>
                                      )}
                                    </div>
                                    {method.description && (
                                      <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "0 0 4px"}}>{method.description}</p>
                                    )}
                                    {locationStr && (
                                      <p style={{color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 3px"}}>📍 {locationStr}</p>
                                    )}
                                    {method.min_days && method.max_days && (
                                      <p style={{color: "rgba(255,255,255,0.28)", fontSize: 10, margin: 0}}>
                                        ⏱ Est. {method.min_days}–{method.max_days} days
                                      </p>
                                    )}
                                  </div>
                                  <span style={{
                                    fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem",
                                    color: rawPrice === 0 ? "#22c55e" : "#fff", flexShrink: 0,
                                  }}>
                                    {priceLabel}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </>
                    )}

                    {/* ✅ PICKUP LOCATIONS */}
                    {(tab === "pickup" || !hasDelivery) && hasPickup && (
                      <>
                        {pickupMethods.map((loc) => {
                          const isSelected = selected?.pickupMode && selected?.id === loc.id;
                          const fullAddress = [loc.address, loc.city, loc.state, loc.country].filter(Boolean).join(", ");
                          return (
                            <div
                              key={loc.id}
                              onClick={() => { onSelect({...loc, pickupMode: true, type: "pickup"}); setOpen(false); }}
                              style={{
                                padding: "12px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 8,
                                border: isSelected ? "1px solid rgba(147,51,234,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                background: isSelected ? "rgba(147,51,234,0.07)" : "rgba(255,255,255,0.02)",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
                              onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; } }}>
                              <div style={{display: "flex", alignItems: "flex-start", gap: 10}}>
                                <div style={{
                                  width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                                  border: isSelected ? "2px solid #9333ea" : "2px solid rgba(255,255,255,0.2)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {isSelected && <div style={{width: 6, height: 6, borderRadius: "50%", background: "#9333ea"}} />}
                                </div>
                                <div style={{flex: 1, minWidth: 0}}>
                                  <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 3}}>
                                    <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>{loc.name}</span>
                                    <span style={{
                                      background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.3)",
                                      color: "#9333ea", fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                                      textTransform: "uppercase", padding: "1px 5px", borderRadius: 3,
                                    }}>PICKUP</span>
                                  </div>
                                  {fullAddress && (
                                    <p style={{color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 3px"}}>📍 {fullAddress}</p>
                                  )}
                                  {loc.phone && (
                                    <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "2px 0 0"}}>📞 {loc.phone}</p>
                                  )}
                                  {loc.instructions && (
                                    <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "4px 0 0", fontStyle: "italic"}}>
                                      {loc.instructions}
                                    </p>
                                  )}
                                </div>
                                <span style={{color: "#22c55e", fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", marginTop: 2}}>
                                  FREE
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CheckoutForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const {cartItems, refreshCart, clearCart} = useCartWishlist();
  const {fmtMoney, convert, userCurrency, baseCurrency} = useCurrency();
  const { Country, State, City, loaded: geoLoaded } = useGeo();

  // ── Source detection ──────────────────────────────────────────────────────
  const stateData = location.state || {};
  const source = stateData.source;
  const buyNowProduct = source === "buyNow" ? stateData.product : null;
  const passedCoupon = stateData.coupon ?? null;
  const passedDiscount = stateData.discount ?? 0;
  // Cart passes pre-selected per-brand shipping: { [brandId]: methodObject }
  const passedBrandShippingMap = stateData.brandShippingMap ?? null;

  // Mutable copy of the brand shipping map so user can change it on the checkout page
  const [brandShippingMap, setBrandShippingMap] = useState(passedBrandShippingMap ?? {});

  // ── Items state ───────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [paymentStuck, setPaymentStuck] = useState(false);
  const paymentTimeoutRef = useRef(null);
  const coWrapRef = useRef(null);
  const summaryRef = useRef(null);
  // Flutterwave/Paystack both open their hosted checkout in a new tab; this
  // tab resolves the order by polling GET /api/user/payments/status for the
  // parked PaymentIntent (see the pendingTxRef effect below), as a fallback
  // to the /payment/callback page finalizing it directly in the other tab.
  const [pendingTxRef, setPendingTxRef] = useState(null);
  const pollTimerRef = useRef(null);

  // ── Shipping state ────────────────────────────────────────────────────────
  const [shippingData, setShippingData] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  // ✅ If ALL brands in the cart had pickup selected, start on pickup tab
  const [deliveryMode, setDeliveryMode] = useState(() => {
    if (!passedBrandShippingMap) return "delivery";
    const vals = Object.values(passedBrandShippingMap);
    return vals.length > 0 && vals.every((m) => m.pickupMode) ? "pickup" : "delivery";
  });
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  // Populated once we know how the order was actually paid for, so the
  // confirmation screen can show something the customer can copy and save —
  // not just the order reference.
  const [paymentDetails, setPaymentDetails] = useState(null); // {gateway, reference, amount, currency}

  const [contact, setContact] = useState({email: "", phone: "", subscribe: false});
  const [delivery, setDelivery] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apt: "",
    city: "",
    state_code: "",
    state_name: "",
    zip: "",
    country_code: "",
    country_name: "",
  });
  // Guest checkout only supports bank transfer (see guest_checkout.go) —
  // the hosted-checkout gateways are tied to an authenticated PaymentIntent.
  const isGuest = !getToken();
  const [payment, setPayment] = useState(() => ({method: isGuest ? "transfer" : "flutterwave"}));

  const [receipt, setReceipt] = useState(null);
  const [receiptError, setReceiptError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [appliedCoupon] = useState(passedCoupon);

  // ✅ Environment check
  useEffect(() => {
    console.log("🔧 CheckoutForm Environment Variables Check:");
    console.log("API URL:", import.meta.env.VITE_API_URL);
    console.log("Paystack Key:", import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? "✅ Loaded" : "❌ Missing");
    console.log("Flutterwave Key:", import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ? "✅ Loaded" : "❌ Missing");
    
    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
    
    if (paystackKey) {
      const isTestKey = paystackKey.startsWith('pk_test_');
      const isLiveKey = paystackKey.startsWith('pk_live_');
      console.log("🔑 Paystack Key Type:", {
        isTest: isTestKey,
        isLive: isLiveKey,
        keyPrefix: paystackKey.substring(0, 10) + "..."
      });
      
      if (!isTestKey && !isLiveKey) {
        console.error("❌ Invalid Paystack key format!");
      }
    }
    
    if (flutterwaveKey && !flutterwaveKey.startsWith('FLWPUBK_') && !flutterwaveKey.startsWith('FLWPUBK-')) {
      console.error(" Flutterwave key should start with 'FLWPUBK_' (test) or 'FLWPUBK-' (live)");
    }
  }, []);
  // ✅ Detect stuck payments (payment tab opened, but never completed/returned)
useEffect(() => {
  if (placing && !complete) {
    console.log("⏱️ Starting payment timeout...");

    paymentTimeoutRef.current = setTimeout(() => {
      console.warn("⚠️ PAYMENT TIMEOUT - 3 hours elapsed");

      clearTimeout(pollTimerRef.current);

      // Reset ALL state
      setPendingTxRef(null);
      setPaymentStuck(false);
      setPlacing(false); // ✅ KEY FIX - Unlock the button

      setOrderError(
        "⏱️ Payment window timed out (3 hours). Click 'Place Order' again to retry. " +
        "If you were charged, do NOT pay again - contact blvckmrkt.market@gmail.com with your reference."
      );
    }, 10800000); // 3 hours

    return () => {
      if (paymentTimeoutRef.current) {
        console.log("🧹 Clearing payment timeout");
        clearTimeout(paymentTimeoutRef.current);
        paymentTimeoutRef.current = null;
      }
    };
  }
}, [placing, complete]);

  // ✅ Poll for hosted-checkout (Flutterwave/Paystack) completion — fallback
  // to the /payment/callback page finalizing it in the new tab, in case that
  // tab is closed before it finishes (or its own request is blocked/fails).
  useEffect(() => {
    if (!pendingTxRef) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const token = getToken();
        const res = await fetch(
          `${API_BASE}/api/user/payments/status?tx_ref=${encodeURIComponent(pendingTxRef)}`,
          {headers: token ? {Authorization: `Bearer ${token}`} : {}}
        );
        const json = await res.json();
        if (cancelled) return;

        const status = json?.data?.status;
        if (status === "completed") {
          setOrderRef(json.data.order_ref || pendingTxRef);
          setPaymentDetails({
            gateway: json.data.gateway || "flutterwave",
            reference: json.data.tx_ref || pendingTxRef,
            amount: json.data.amount,
            currency: json.data.currency,
          });
          setComplete(true);
          setPlacing(false);
          setPendingTxRef(null);
          if (source !== "buyNow") refreshCart().catch(() => {});
          return;
        }
        if (status === "failed") {
          // The backend's failure_reason is already a complete, correctly
          // worded message — for a payment that was actually charged before
          // failing (e.g. stock ran out while the customer was on the
          // gateway's page), it explicitly says NOT to retry, since retrying
          // would charge them a second time. Appending our own "Please try
          // again." here unconditionally used to override that warning.
          setOrderError(json.data.failure_reason || "Payment failed. Please try again.");
          setPlacing(false);
          setPendingTxRef(null);
          return;
        }

        pollTimerRef.current = setTimeout(poll, 4000);
      } catch {
        if (!cancelled) pollTimerRef.current = setTimeout(poll, 4000);
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(pollTimerRef.current);
    };
  }, [pendingTxRef, source, refreshCart]);

  // Reset stuck state when step changes
  useEffect(() => {
    setPaymentStuck(false);
    setOrderError("");
  }, [step]);

  // ── Sticky summary scroll tracker ─────────────────────────────────────────
  // CSS sticky can be blocked by parent overflow or transforms, so we drive it
  // with a scroll listener instead — this works in every browser/CSS context.
  useEffect(() => {
    const NAVBAR = 108; // px from viewport top where summary should stop

    const onScroll = () => {
      const el = summaryRef.current;
      const wrap = coWrapRef.current;
      if (!el || !wrap || window.innerWidth <= 960) {
        if (el) el.style.transform = "";
        return;
      }
      const wrapTop  = wrap.getBoundingClientRect().top + window.scrollY;
      const scrolled = window.scrollY;
      const maxY     = wrap.offsetHeight - el.offsetHeight - 80; // 80 = bottom padding
      const y        = Math.max(0, Math.min(scrolled - wrapTop + NAVBAR, maxY));
      el.style.transform = `translateY(${y}px)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    // Run immediately after step change so height is recalculated
    const t = setTimeout(onScroll, 50);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(t);
    };
  }, [step]);

  // ── Per-brand shipping data cache (for the inline checkout shipping panels) ──
  const [brandShippingDataCache, setBrandShippingDataCache] = useState({});

  // ── Extract delivery location from a method object ─────────────────────────
const extractLocationFromMethod = useCallback((method) => {
    if (!method || method.pickupMode || !geoLoaded) return {};
    const result = {};

    if (method.type === "local") {
      if (method.country) {
        const countryObj = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === method.country.toLowerCase()
        );
        if (countryObj) {
          result.country_code = countryObj.isoCode;
          result.country_name = countryObj.name;
        }
      }
      if (method.state && result.country_code) {
        const stateObj = State.getStatesOfCountry(result.country_code).find(
          (s) => s.name.toLowerCase() === method.state.toLowerCase()
        );
        if (stateObj) {
          result.state_code = stateObj.isoCode;
          result.state_name = stateObj.name;
        }
      }
      if (method.city) result.city = method.city;
    } else if (method.type === "zone") {
      // Zone method — use the first location in the zone
      const locations = method.locations || (method.zone?.locations) || [];
      const loc = locations[0];
      if (loc?.country) {
        const countryObj = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === loc.country.toLowerCase()
        );
        if (countryObj) {
          result.country_code = countryObj.isoCode;
          result.country_name = countryObj.name;
        }
      }
      if (loc?.state && result.country_code) {
        const stateObj = State.getStatesOfCountry(result.country_code).find(
          (s) => s.name.toLowerCase().includes(loc.state.toLowerCase()) ||
                 loc.state.toLowerCase().includes(s.name.toLowerCase())
        );
        if (stateObj) {
          result.state_code = stateObj.isoCode;
          result.state_name = stateObj.name;
        }
      }
    }
    return result;
  }, []);

  // ── Auto-populate delivery location from cart shipping map ───────────────
  useEffect(() => {
    if (!passedBrandShippingMap || step !== 1) return;
    // Only auto-fill if delivery location is still blank
    if (delivery.country_code) return;
    const firstMethod = Object.values(brandShippingMap).find((m) => !m.pickupMode);
    if (!firstMethod) return;
    const locationData = extractLocationFromMethod(firstMethod);
    if (Object.keys(locationData).length > 0) {
      setDelivery((prev) => ({...prev, ...locationData}));
    }
  }, [step]); // eslint-disable-line

const stateOptions = useMemo(() => {
    if (!geoLoaded || !delivery.country_code) return [];
    return State.getStatesOfCountry(delivery.country_code).map((s) => ({
      value: s.isoCode,
      label: s.name,
    }));
  }, [geoLoaded, State, delivery.country_code]);

const cityOptions = useMemo(() => {
    if (!geoLoaded || !delivery.country_code || !delivery.state_code) return [];
    return City.getCitiesOfState(delivery.country_code, delivery.state_code).map((c) => ({
      value: c.name,
      label: c.name,
    }));
  }, [geoLoaded, City, delivery.country_code, delivery.state_code]);

  // ── Load items ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (buyNowProduct) {
      setItems([buyNowProduct]);
      setCartLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    refreshCart();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (buyNowProduct) return;
    if (!Array.isArray(cartItems)) return;
    const mapped = cartItems.map((ci) => ({
      id: ci.id,
      productId: ci.product_id,
      name: ci.product?.name ?? "Product",
      brand: ci.product?.brand_name ?? "",
      brandId: ci.product?.brand_id,
      size: ci.selected_size ?? "—",
      price: Number(ci.product?.price ?? 0),
      comparePrice: Number(ci.product?.compare_price ?? 0),
      qty: ci.quantity ?? 1,
      image: ci.product?.primary_image ?? "",
      slug: ci.product?.slug ?? ci.product_id,
    }));
    setItems(mapped);
    setCartLoading(false);
  }, [cartItems]); // eslint-disable-line

  // ── Fetch shipping data ───────────────────────────────────────────────────
  useEffect(() => {
    // Cart flow: shipping already selected per-brand in cartgrid.
    // deliveryCost now reads directly from brandShippingMap state — no virtual method needed.
    if (passedBrandShippingMap) return;
    // BuyNow flow: fetch shipping for the single brand
    if (items.length === 0) return;
    const brandId = buyNowProduct?.brandId ?? items[0]?.brandId;
    if (!brandId) return;

    setShippingLoading(true);
    fetch(`${API_BASE}/api/shop/brands/${brandId}/shipping`)
      .then((r) => r.json())
      .then((json) => {
        const data = json?.data ?? json;
        setShippingData(data);
        if (data?.pickups?.length > 0) {
          setSelectedPickupLocation(data.pickups[0]);
        }
      })
      .catch(() => setShippingData(null))
      .finally(() => setShippingLoading(false));
  }, [items, buyNowProduct, passedBrandShippingMap]); // eslint-disable-line

  // ── Calculations ───────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, i) => {
    const convertedUnitPrice = convert(i.price, baseCurrency);
    return s + convertedUnitPrice * i.qty;
  }, 0);

  const discount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : convert(appliedCoupon.value, baseCurrency)
    : convert(passedDiscount, baseCurrency);

  // Tax — the platform's commission, re-surfaced here as a checkout line
  // instead of only being baked into the (already-discounted) product price.
  // Mirrors the server's itemTax() in create_order.go exactly: per item,
  // (comparePrice - price) is the fee that was deducted when the price was
  // set, converted to the buyer's display currency and summed across items.
  const tax = items.reduce((s, i) => {
    const cmp = convert(i.comparePrice || 0, baseCurrency);
    const price = convert(i.price, baseCurrency);
    return s + Math.max(0, cmp - price) * i.qty;
  }, 0);

  const deliveryCost = useMemo(() => {
    if (deliveryMode !== "delivery") return 0;
    // Cart flow: sum up all non-pickup methods from the live (mutable) brandShippingMap
    if (passedBrandShippingMap) {
      const total = Object.values(brandShippingMap).reduce((s, m) => {
        if (m.pickupMode) return s;
        const rawPrice = Number(m.flat_rate ?? m.base_price ?? m.rate ?? 0);
        const fromCurrency = (m._currency || m.currency_code || m.currency || baseCurrency).toUpperCase();
        return s + convert(rawPrice, fromCurrency);
      }, 0);
      return total;
    }
    if (!selectedShippingMethod) return 0;
    const rawPrice = Number(
      selectedShippingMethod.flat_rate ||
      selectedShippingMethod.base_price ||
      selectedShippingMethod.rate ||
      0
    );
    const fromCurrency = (
      selectedShippingMethod._currency ||
      selectedShippingMethod.currency_code ||
      selectedShippingMethod.currency ||
      baseCurrency
    ).toUpperCase();
    return convert(rawPrice, fromCurrency);
  }, [selectedShippingMethod, deliveryMode, convert, baseCurrency, brandShippingMap, passedBrandShippingMap]);

  const orderTotal = Math.max(0, subtotal - discount + deliveryCost + tax);

  // ✅ Shared order payload — everything CreateOrder needs except the `payment`
  // block, which differs per method (gateway reference, transfer receipt, ...).
  // Used by the synchronous Paystack/transfer flows and the Flutterwave
  // hosted-checkout initiate call.
  const buildOrderPayload = useCallback(() => ({
    source,
    items: items.map((i) => ({
      product_id: i.productId,
      cart_item_id: i.id,
      quantity: i.qty,
      size: i.size,
      unit_price: i.price,
    })),
    contact: {
      email: contact.email,
      phone: contact.phone,
      subscribe: contact.subscribe,
    },
    delivery_mode: deliveryMode,
    ...(deliveryMode === "delivery"
      ? {
          delivery: {
            first_name: delivery.firstName,
            last_name: delivery.lastName,
            address: delivery.address,
            apt: delivery.apt,
            city: delivery.city,
            state: delivery.state_name,
            zip: delivery.zip,
            country: delivery.country_name,
            shipping_method_id: (() => {
              if (passedBrandShippingMap) {
                // Cart: use first zone method found across brands (from live mutable map)
                const m = Object.values(brandShippingMap).find((m) => m.type === "zone" && !m.pickupMode);
                return m?.id ?? null;
              }
              return selectedShippingMethod?.type === "zone" ? selectedShippingMethod?.id : null;
            })(),
            local_shipping_rate_id: (() => {
              if (passedBrandShippingMap) {
                // Cart: use first local method found across brands (from live mutable map)
                const m = Object.values(brandShippingMap).find((m) => m.type === "local" && !m.pickupMode);
                return m?.id ?? null;
              }
              return selectedShippingMethod?.type === "local" ? selectedShippingMethod?.id : null;
            })(),
          },
        }
      : {
          pickup: {
            pickup_location_id: passedBrandShippingMap
              ? Object.values(brandShippingMap).find((m) => m.pickupMode)?.id ?? null
              : selectedPickupLocation?.id,
          },
        }),
    coupon: appliedCoupon?.code ?? null,
    subtotal,
    discount,
    shipping_cost: deliveryCost,
    total: orderTotal,
    currency: userCurrency,
  }), [source, items, contact, deliveryMode, delivery, passedBrandShippingMap, brandShippingMap, selectedShippingMethod, selectedPickupLocation, appliedCoupon, subtotal, discount, deliveryCost, orderTotal, userCurrency]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
      // PhoneInput always emits valid E.164 or "" — just check it's non-empty
      if (!contact.phone || contact.phone.length < 7) e.phone = "Valid phone required";
    }
    if (step === 1) {
      if (deliveryMode === "delivery") {
        if (!delivery.country_code) e.country = "Required";
        if (!delivery.firstName.trim()) e.firstName = "Required";
        if (!delivery.lastName.trim()) e.lastName = "Required";
        if (!delivery.address.trim()) e.address = "Required";
        if (!delivery.city.trim()) e.city = "Required";
        if (!delivery.zip.trim()) e.zip = "Required";
        // Cart orders have shipping pre-selected per-brand; skip this check
        if (!passedBrandShippingMap && !selectedShippingMethod) e.shipping = "Please select a shipping method";
      } else {
        // ✅ Cart flow: check brandShippingMap has at least one pickup selected
        if (passedBrandShippingMap) {
          const hasPickup = Object.values(brandShippingMap).some((m) => m.pickupMode);
          if (!hasPickup) e.pickup = "Please select a pickup location";
        } else {
          if (!selectedPickupLocation) e.pickup = "Please select a pickup location";
        }
      }
    }
    if (step === 2 && payment.method === "transfer") {
      if (!receipt) e.receipt = "Please upload your transfer receipt to continue";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) setStep((s) => Math.min(3, s + 1));
  };
  
  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    setErrors({});
  };

  // ✅ Shared hosted-checkout initiator — Flutterwave and Paystack (once
  // re-enabled) both work the same way: ask the backend to price + park the
  // order, open the returned link in a new tab, then let this tab poll for
  // completion (see the pendingTxRef effect below) while /payment/callback
  // finalizes it in the new tab.
  const initiateHostedCheckout = useCallback(async (gateway, endpoint) => {
    setPlacing(true);
    setOrderError("");
    setPaymentStuck(false);

    if (!contact.email || !contact.email.includes("@")) {
      setOrderError("Valid email required for payment");
      setPlacing(false);
      return;
    }
    if (orderTotal <= 0) {
      setOrderError("Invalid order amount");
      setPlacing(false);
      return;
    }

    try {
      const token = getToken();
      const body = {
        ...buildOrderPayload(),
        payment: {method: gateway},
      };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || "Failed to start payment");
      }

      const {link, tx_ref} = json?.data ?? json;
      if (!link || !tx_ref) {
        throw new Error("Payment gateway did not return a checkout link");
      }

      const paymentTab = window.open(link, "_blank");
      if (!paymentTab) {
        setOrderError("Please allow pop-ups for this site, then click 'Place Order' again to open the payment tab.");
        setPlacing(false);
        return;
      }

      setPendingTxRef(tx_ref);
    } catch (error) {
      console.error(`❌ ${gateway} initiate failed:`, error);
      setOrderError(error.message || "Failed to start payment. Please try again.");
      setPlacing(false);
    }
  }, [buildOrderPayload, contact.email, orderTotal]);

  // ✅ MAIN PLACE ORDER FUNCTION
  const placeOrder = async () => {
    if (!validate()) return;

    console.log("🚀 Place order initiated with method:", payment.method);
    console.log("💰 Order total:", orderTotal, userCurrency);

    // ✅ CREDIT/DEBIT CARD (Paystack) — Coming Soon (disabled in the UI; a
    // Paystack dashboard issue needs fixing before this reopens). Wired up as
    // a hosted checkout exactly like Flutterwave, so it's ready to go.
    if (payment.method === "card") {
      if (!CARD_PAYMENTS_ENABLED) {
        setOrderError("Card payments are coming soon. Please use Flutterwave or Bank Transfer for now.");
        return;
      }
      await initiateHostedCheckout("paystack", "/api/user/payments/paystack/initiate");
      return;
    }

    // ✅ FLUTTERWAVE — hosted checkout, opens in its own browser tab instead of
    // an inline popup/iframe. We ask our backend to price + park the order and
    // hand back a checkout link; /payment/callback (opened in that new tab)
    // finalizes the order once Flutterwave redirects back, and this tab polls
    // for completion so it updates too (see the pendingTxRef effect below).
    if (payment.method === "flutterwave") {
      await initiateHostedCheckout("flutterwave", "/api/user/payments/flutterwave/initiate");
      return;
    }

    // ✅ BANK TRANSFER
    if (payment.method === "transfer") {
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      console.log("🏦 Processing bank transfer order...");
      
      try {
        const token = getToken();
        let receiptUrl = null;

if (receipt) {
      console.log("📄 Uploading receipt to Cloudinary...");
      const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) {
        setOrderError("Image upload is not configured. Contact support.");
        setPlacing(false);
        return;
      }
      try {
        const fd = new FormData();
        fd.append("file",          receipt);
        fd.append("upload_preset", uploadPreset);
        fd.append("folder",        "receipts");
        const cloudRes  = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {method: "POST", body: fd}
        );
        const cloudJson = await cloudRes.json();
        if (cloudJson.secure_url) {
          receiptUrl = cloudJson.secure_url;
          console.log("✅ Receipt uploaded:", receiptUrl);
        } else {
          throw new Error(cloudJson.error?.message || "Upload failed — no URL returned.");
        }
      } catch (e) {
        console.error("❌ Receipt upload failed:", e);
        setOrderError("Receipt upload failed: " + e.message + ". Please try again.");
        setPlacing(false);
        return;
      }
    }

        const body = {
          source,
          items: items.map((i) => ({
            product_id: i.productId,
            cart_item_id: i.id,
            quantity: i.qty,
            size: i.size,
            unit_price: i.price,
          })),
          contact: {
            email: contact.email,
            phone: contact.phone,
            subscribe: contact.subscribe,
          },
          delivery_mode: deliveryMode,
          ...(deliveryMode === "delivery"
            ? {
                delivery: {
                  first_name: delivery.firstName,
                  last_name: delivery.lastName,
                  address: delivery.address,
                  apt: delivery.apt,
                  city: delivery.city,
                  state: delivery.state_name,
                  zip: delivery.zip,
                  country: delivery.country_name,
                  shipping_method_id: (() => {
                    if (passedBrandShippingMap) {
                      const m = Object.values(brandShippingMap).find((m) => m.type === "zone" && !m.pickupMode);
                      return m?.id ?? null;
                    }
                    return selectedShippingMethod?.type === "zone" ? selectedShippingMethod?.id : null;
                  })(),
                  local_shipping_rate_id: (() => {
                    if (passedBrandShippingMap) {
                      const m = Object.values(brandShippingMap).find((m) => m.type === "local" && !m.pickupMode);
                      return m?.id ?? null;
                    }
                    return selectedShippingMethod?.type === "local" ? selectedShippingMethod?.id : null;
                  })(),
                },
              }
            : {
                pickup: {
                  pickup_location_id: passedBrandShippingMap
                    ? Object.values(brandShippingMap).find((m) => m.pickupMode)?.id ?? null
                    : selectedPickupLocation?.id,
                },
              }),
          payment: {
            method: "transfer",
            receipt_url: receiptUrl,
          },
          coupon: appliedCoupon?.code ?? null,
          subtotal,
          discount,
          shipping_cost: deliveryCost,
          total: orderTotal,
          currency: userCurrency,
        };

        console.log("📤 Sending transfer order request...");
        // No token = guest checkout, hits the separate unauthenticated
        // endpoint (identified by contact.email instead of an account).
        const res = await fetch(`${API_BASE}${token ? "/api/user/orders" : "/api/guest/orders"}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
          },
          body: JSON.stringify(body),
        });

        const responseText = await res.text();
        console.log("📥 Transfer order response:", responseText);

        const json = JSON.parse(responseText);
        if (!res.ok) {
          throw new Error(json.error || "Failed to create transfer order");
        }

        const ref = json?.data?.reference ?? json?.data?.order?.reference ?? 
                   "BLVCK-" + Math.random().toString(36).slice(2, 8).toUpperCase();

        if (source !== "buyNow" && typeof clearCart === "function") {
          await clearCart().catch(() => {});
        }

        setOrderRef(ref);
        setPaymentDetails({
          gateway: "transfer",
          reference: ref,
          amount: orderTotal,
          currency: userCurrency,
        });
        setComplete(true);
        console.log("✅ Transfer order created successfully!");
        
      } catch (error) {
        console.error("❌ Transfer order error:", error);
        setOrderError(error.message || "Failed to place order. Please try again.");
      } finally {
        setPlacing(false);
      }
    }
  };

  // Helper functions
  const inp = (hasErr) => ({
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasErr ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
    color: "#fff",
    fontSize: 13,
    padding: "12px 14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 8,
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  });

  const getFilteredShippingOptions = () => {
    if (!shippingData) return [];

    const zoneMethods = (shippingData.zones || []).flatMap((zone) =>
      (zone.methods || []).map((m) => ({
        ...m,
        type: "zone",
        zoneName: zone.name,
        locations: zone.locations || [],
      }))
    );

    const localRates = (shippingData.local || []).map((l) => {
      const resolvedCurrency = (l.currency_code || l.currency || baseCurrency).toUpperCase();
      return {
        ...l,
        type: "local",
        name: `Local Shipping - ${l.city || l.state || l.country}`,
        flat_rate: Number(l.base_price || 0),
        rate: Number(l.base_price || 0),
        _currency: resolvedCurrency,
      };
    });

    const allMethods = [...zoneMethods, ...localRates];

    if (!delivery.country_name && !delivery.state_name && !delivery.city) {
      return allMethods;
    }

    return allMethods.filter((method) => {
      if (method.type === "zone") {
        if (!method.locations || method.locations.length === 0) return true;
        return method.locations.some((loc) => {
          if (delivery.country_name && loc.country) {
            const countryMatch =
              loc.country.toLowerCase() === delivery.country_name.toLowerCase();
            if (!countryMatch) return false;
          }
          if (delivery.state_name && loc.state) {
            const stateMatch =
              loc.state.toLowerCase().includes(delivery.state_name.toLowerCase()) ||
              delivery.state_name.toLowerCase().includes(loc.state.toLowerCase());
            if (!stateMatch) return false;
          }
          return true;
        });
      } else {
        if (delivery.country_name && method.country) {
          const countryMatch =
            method.country.toLowerCase() === delivery.country_name.toLowerCase();
          if (!countryMatch) return false;
        }
        if (delivery.state_name && method.state) {
          const stateMatch =
            method.state.toLowerCase() === delivery.state_name.toLowerCase();
          if (!stateMatch) return false;
        }
        if (delivery.city && method.city) {
          const cityMatch = method.city.toLowerCase() === delivery.city.toLowerCase();
          if (!cityMatch) return false;
        }
        return true;
      }
    });
  };

  const filteredShippingOptions = getFilteredShippingOptions();

  const handleShippingMethodSelect = (method) => {
    setSelectedShippingMethod(method);

if (!delivery.country_code && geoLoaded) {
      let autoFillData = {};

      if (method.type === "zone" && method.locations && method.locations.length > 0) {
        const loc = method.locations[0];
        const countryObj = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === loc.country?.toLowerCase()
        );
        if (countryObj) {
          autoFillData.country_code = countryObj.isoCode;
          autoFillData.country_name = countryObj.name;
          if (loc.state) {
            const stateObj = State.getStatesOfCountry(countryObj.isoCode).find((s) =>
              s.name.toLowerCase().includes(loc.state.toLowerCase())
            );
            if (stateObj) {
              autoFillData.state_code = stateObj.isoCode;
              autoFillData.state_name = stateObj.name;
            }
          }
        }
      } else if (method.type === "local") {
        const countryObj = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === method.country?.toLowerCase()
        );
        if (countryObj) {
          autoFillData.country_code = countryObj.isoCode;
          autoFillData.country_name = countryObj.name;
          if (method.state) {
            const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(
              (s) => s.name.toLowerCase() === method.state.toLowerCase()
            );
            if (stateObj) {
              autoFillData.state_code = stateObj.isoCode;
              autoFillData.state_name = stateObj.name;
            }
          }
          if (method.city) {
            autoFillData.city = method.city;
          }
        }
      }

      if (Object.keys(autoFillData).length > 0) {
        setDelivery((prev) => ({...prev, ...autoFillData}));
      }
    }
  };

  // Order confirmed screen
  if (complete)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 80px",
        }}>
        <motion.div
          initial={{opacity: 0, scale: 0.94}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 0.5}}
          style={{maxWidth: 540, width: "100%", textAlign: "center"}}>
          <motion.div
            initial={{scale: 0}}
            animate={{scale: 1}}
            transition={{type: "spring", stiffness: 260, damping: 20, delay: 0.2}}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.1)",
              border: "2px solid rgba(34,197,94,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 28px",
            }}>
            <svg width="36" height="36" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
                initial={{pathLength: 0}}
                animate={{pathLength: 1}}
                transition={{duration: 0.5, delay: 0.4}}
              />
            </svg>
          </motion.div>
          <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}}>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}>
              Order Confirmed
            </p>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.4rem, 6vw, 3.6rem)",
                color: "#fff",
                letterSpacing: "0.05em",
                lineHeight: 1,
                marginBottom: 16,
              }}>
              YOU'RE <span style={{color: "#ef4444"}}>ALL SET!</span>
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 13,
                lineHeight: 1.7,
                marginBottom: 32,
              }}>
              Your order has been placed and is being processed. You'll receive a confirmation email
              at <strong style={{color: "#fff"}}>{contact.email}</strong> shortly.
            </p>
            <div
              style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "6px 20px",
                marginBottom: 16,
                textAlign: "left",
              }}>
              <CopyRow label="Order Reference" value={orderRef} highlight />
              {paymentDetails && (
                <>
                  <CopyRow label="Payment Reference" value={paymentDetails.reference} />
                  <CopyRow label="Payment Type" value={gatewayLabel(paymentDetails.gateway)} />
                  {paymentDetails.amount != null && (
                    <CopyRow
                      label="Amount Paid"
                      value={`${paymentDetails.currency || ""} ${Number(paymentDetails.amount).toLocaleString()}`.trim()}
                    />
                  )}
                </>
              )}
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: 11,
                lineHeight: 1.6,
                marginBottom: 32,
                maxWidth: 420,
                marginLeft: "auto",
                marginRight: "auto",
              }}>
              Tap any line above to copy it. Save these details somewhere safe (a note, a
              screenshot) in case you ever need to contact support about this order.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}>
              <Link
                to="/shop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "13px 28px",
                  textDecoration: "none",
                  borderRadius: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
                Continue Shopping →
              </Link>
              <Link
                to="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "13px 28px",
                  textDecoration: "none",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}>
                Back to Home
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );

  return (
    <div style={{background: "#000", paddingTop: 120, minHeight: "100vh"}}>
      <style>{`
        .co-wrap { max-width: 1200px; margin: 0 auto; padding: 0 48px 80px; display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: stretch; }
        @media (max-width: 960px)  { .co-wrap { grid-template-columns: 1fr; gap: 32px; } }
        @media (max-width: 600px)  { .co-wrap { padding: 0 20px 60px; } }
        .co-stepper { display: flex; align-items: center; margin-bottom: 36px; }
        .co-step { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
        .co-step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; flex-shrink: 0; transition: all 0.3s; }
        .co-step-num.done { background: #22c55e; color: #fff; }
        .co-step-num.active { background: #ef4444; color: #fff; }
        .co-step-num.pending { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.3); }
        .co-step-label { font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; transition: color 0.3s; white-space: nowrap; }
        .co-step-label.active { color: #fff; }
        .co-step-label.done { color: #22c55e; }
        .co-step-label.pending { color: rgba(255,255,255,0.2); }
        .co-step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); margin: 0 8px; min-width: 12px; }
        .co-step-line.done { background: #22c55e; }
        @media (max-width: 420px) { .co-step-label { display: none; } }
        .co-section-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: #fff; letter-spacing: 0.08em; margin: 0 0 20px; display: flex; align-items: center; gap: 10px; }
        .co-section-title::before { content: ''; width: 4px; height: 18px; background: #ef4444; display: block; flex-shrink: 0; }
        .co-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .co-row-1 { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }
        @media (max-width: 500px) { .co-row { grid-template-columns: 1fr; } }
        .co-field { display: flex; flex-direction: column; gap: 5px; }
        .co-label { color: rgba(255,255,255,0.35); font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
        .co-error { color: #ef4444; font-size: 10px; font-weight: 700; margin-top: 2px; }
        .co-mode-toggle { display: inline-flex; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 4px; margin-bottom: 20px; }
        .co-mode-btn { flex: 1; padding: 10px 24px; border: none; background: none; color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; border-radius: 7px; transition: all 0.2s; white-space: nowrap; }
        .co-mode-btn.active { background: #ef4444; color: #fff; }
        .co-mode-btn:hover:not(.active) { color: rgba(255,255,255,0.7); }
        .co-delivery-opt { display: flex; align-items: flex-start; gap: 12px; padding: 13px 14px; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 10px; background: rgba(255,255,255,0.02); }
        .co-delivery-opt:hover { border-color: rgba(255,255,255,0.2); }
        .co-delivery-opt.active { border-color: #ef4444; background: rgba(239,68,68,0.06); }
        .co-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: border-color 0.2s; margin-top: 2px; }
        .co-radio.active { border-color: #ef4444; }
        .co-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; }
        .co-pay-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .co-pay-tab { flex: 1; padding: 12px 8px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.02); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: all 0.2s; min-width: 0; }
        .co-pay-tab:hover { border-color: rgba(255,255,255,0.25); }
        .co-pay-tab.active { border-color: #ef4444; background: rgba(239,68,68,0.07); }
        .co-pay-tab-icon { font-size: 18px; }
        .co-pay-tab-label { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.4); text-align: center; }
        .co-pay-tab.active .co-pay-tab-label { color: #fff; }
        .co-pay-tab.coming-soon { cursor: not-allowed; opacity: 0.45; position: relative; }
        .co-pay-tab.coming-soon:hover { border-color: rgba(255,255,255,0.1); }
        .co-pay-tab-badge { position: absolute; top: -7px; right: -6px; background: #181818; border: 1px solid rgba(255,255,255,0.18); color: rgba(255,255,255,0.5); font-size: 6px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; white-space: nowrap; }
        .co-btn-row { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
        .co-btn-next { flex: 1; min-width: 140px; background: #ef4444; color: #fff; border: none; font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; padding: 15px 20px; cursor: pointer; border-radius: 8px; transition: background 0.2s; }
        .co-btn-next:hover { background: #dc2626; }
        .co-btn-next:disabled { opacity: 0.55; cursor: not-allowed; }
        .co-btn-back { background: none; border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 15px 20px; cursor: pointer; border-radius: 8px; transition: all 0.2s; white-space: nowrap; }
        .co-btn-back:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .co-summary-wrap { }
        .co-summary { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; height: fit-content; will-change: transform; }
        @media (max-width: 960px) { .co-summary { height: auto; transform: none !important; } }
        .co-sum-toggle { display: none; }
        @media (max-width: 960px) {
          .co-sum-toggle { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
          .co-sum-body { overflow: hidden; transition: max-height 0.35s ease, opacity 0.3s; }
          .co-sum-body.collapsed { max-height: 0 !important; opacity: 0; }
          .co-sum-body.expanded { opacity: 1; }
        }
        .co-sum-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .co-sum-item:last-of-type { border-bottom: none; }
        .co-sum-img { width: 52px; height: 52px; border-radius: 8px; overflow: visible; border: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; position: relative; }
        .co-sum-img-inner { width: 100%; height: 100%; border-radius: 8px; overflow: hidden; }
        .co-sum-img-inner img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(15%); }
        .co-sum-qty { position: absolute; top: -6px; left: -6px; min-width: 20px; height: 20px; background: #ef4444; border-radius: 50%; font-size: 9px; font-weight: 900; color: #fff; display: flex; align-items: center; justify-content: center; padding: 0 4px; border: 2px solid #0d0d0d; z-index: 1; }
        .co-sum-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
        .co-sum-label { color: rgba(255,255,255,0.35); font-size: 11px; }
        .co-sum-value { color: #fff; font-size: 11px; font-weight: 700; }
        .co-sum-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 4px 0; }
        .co-review-block { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 18px; margin-bottom: 14px; }
        .co-review-block-title { color: rgba(255,255,255,0.28); font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .co-review-edit { color: #ef4444; font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
        .co-review-val { color: rgba(255,255,255,0.65); font-size: 12px; line-height: 1.7; margin: 0; }
        @keyframes co-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (min-width: 961px) {
          .co-sum-toggle { display: none !important; }
          .co-sum-body { max-height: none !important; opacity: 1 !important; margin-top: 0 !important; }
        }
      `}</style>

      <div className="co-wrap" ref={coWrapRef}>
        <div>
          <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 28}}>
            <Link
              to={source === "buyNow" ? "/shop" : "/cart"}
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}>
              ← {source === "buyNow" ? "Back to Product" : "Back to Cart"}
            </Link>
            {source === "buyNow" && (
              <span
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#ef4444",
                  fontSize: 8,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}>
                Buy Now
              </span>
            )}
          </div>

          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "#fff",
              letterSpacing: "0.06em",
              marginBottom: 28,
              lineHeight: 1,
            }}>
            SECURE <span style={{color: "#ef4444"}}>CHECKOUT</span>
          </h1>

          <div className="co-stepper">
            {STEPS.map((s, i) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: i < STEPS.length - 1 ? 1 : "none",
                }}>
                <div className="co-step">
                  <div
                    className={`co-step-num ${i < step ? "done" : i === step ? "active" : "pending"}`}>
                    {i < step ? (
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`co-step-label ${
                      i < step ? "done" : i === step ? "active" : "pending"
                    }`}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`co-step-line ${i < step ? "done" : ""}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{opacity: 0, x: 20}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: -20}}
              transition={{duration: 0.28}}>

              {/* ── STEP 0: Contact ── */}
              {step === 0 && (
                <div>
                  <p className="co-section-title">Contact Information</p>
                  <div className="co-row-1">
                    <div className="co-field">
                      <label className="co-label">Email Address *</label>
                      <input
                        style={inp(errors.email)}
                        type="email"
                        placeholder="you@example.com"
                        value={contact.email}
                        onChange={(e) => setContact({...contact, email: e.target.value})}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                        onBlur={(e) =>
                          (e.target.style.borderColor = errors.email
                            ? "#ef4444"
                            : "rgba(255,255,255,0.1)")
                        }
                      />
                      {errors.email && <span className="co-error">{errors.email}</span>}
                    </div>
                    <div className="co-field">
                      <label className="co-label">Phone Number *</label>
                      <PhoneInput
                        value={contact.phone}
                        onChange={(e164) => {
                          setContact({...contact, phone: e164});
                          if (errors.phone) setErrors((prev) => ({...prev, phone: null}));
                        }}
                        onValidChange={(isValid) => {
                          if (!isValid) setErrors((prev) => ({...prev, phone: "Valid phone required"}));
                          else setErrors((prev) => ({...prev, phone: null}));
                        }}
                        defaultCountry={delivery.country_code || "NG"}
                        error={errors.phone}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => setContact((c) => ({...c, subscribe: !c.subscribe}))}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: `1px solid ${
                          contact.subscribe ? "#ef4444" : "rgba(255,255,255,0.2)"
                        }`,
                        borderRadius: 3,
                        background: contact.subscribe ? "#ef4444" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                        flexShrink: 0,
                      }}>
                      {contact.subscribe && (
                        <svg
                          width="9"
                          height="9"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>
                      Email me with news and exclusive offers
                    </span>
                  </div>
                </div>
              )}

                  {/* ── STEP 1: Delivery ── */}
{step === 1 && (
                <div>
                  <div className="co-mode-toggle">
                    <button
                      className={`co-mode-btn ${deliveryMode === "delivery" ? "active" : ""}`}
                      onClick={() => {
                        setDeliveryMode("delivery");
                        // ✅ In cart flow: switch any pickup-mode brands back to their first delivery method
                        if (passedBrandShippingMap) {
                          setBrandShippingMap((prev) => {
                            const next = {...prev};
                            Object.entries(next).forEach(([bId, m]) => {
                              if (!m.pickupMode) return; // already delivery
                              const cached = brandShippingDataCache[bId];
                              if (!cached) return;
                              const delivMethods = [
                                ...(cached.zones?.flatMap((z) => (z.methods ?? []).map((dm) => ({...dm, type: "zone", locations: z.locations ?? [], zone: z}))) ?? []),
                                ...(cached.local?.map((lm) => ({...lm, type: "local", _currency: (lm.currency_code || lm.currency || baseCurrency || "NGN").toUpperCase()})) ?? []),
                              ];
                              if (delivMethods.length > 0) {
                                next[bId] = {...delivMethods[0], brandName: m.brandName};
                              }
                            });
                            return next;
                          });
                        }
                      }}>
                      🚚 Delivery
                    </button>
                    <button
                      className={`co-mode-btn ${deliveryMode === "pickup" ? "active" : ""}`}
                      onClick={() => {
                        setDeliveryMode("pickup");
                        // ✅ In cart flow: switch all delivery-mode brands to their first pickup location
                        if (passedBrandShippingMap) {
                          setBrandShippingMap((prev) => {
                            const next = {...prev};
                            Object.entries(next).forEach(([bId, m]) => {
                              if (m.pickupMode) return; // already pickup
                              const cached = brandShippingDataCache[bId];
                              if (!cached || !cached.pickups?.length) return;
                              next[bId] = {...cached.pickups[0], pickupMode: true, type: "pickup", brandName: m.brandName};
                            });
                            return next;
                          });
                        }
                      }}>
                      🏪 Pickup
                    </button>
                  </div>

                  {deliveryMode === "delivery" ? (
                    <>
                      <p className="co-section-title">Delivery Address</p>

                      {/* Country */}
                      <div className="co-row-1">
                        <div className="co-field">
                          <label className="co-label">Country *</label>
                          <select
                            value={delivery.country_code || ""}
                            onChange={(e) => {
                              const code = e.target.value;
                              const c = (geoLoaded && code) ? Country.getCountryByCode(code) : null;
                              setDelivery((prev) => ({
                                ...prev,
                                country_code: code,
                                country_name: c?.name || "",
                                state_code: "",
                                state_name: "",
                                city: "",
                              }));
                              setErrors((prev) => ({...prev, country: null}));
                            }}
                            style={{
                              ...inp(errors.country),
                              cursor: "pointer",
                              appearance: "none",
                              color: "#fff",
                              backgroundColor: "#111",
                            }}>
                            <option value="">Select Country</option>
                            {(geoLoaded ? Country.getAllCountries() : []).map((c) => (
                              <option key={c.isoCode} value={c.isoCode}>
                                {c.flag} {c.name}
                              </option>
                            ))}
                          </select>
                          {errors.country && (
                            <span className="co-error">{errors.country}</span>
                          )}
                        </div>
                      </div>

                      <div className="co-row">
                        <div className="co-field">
                          <label className="co-label">First Name *</label>
                          <input
                            style={inp(errors.firstName)}
                            placeholder="John"
                            value={delivery.firstName}
                            onChange={(e) =>
                              setDelivery({...delivery, firstName: e.target.value})
                            }
                            onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                            onBlur={(e) =>
                              (e.target.style.borderColor = errors.firstName
                                ? "#ef4444"
                                : "rgba(255,255,255,0.1)")
                            }
                          />
                          {errors.firstName && (
                            <span className="co-error">{errors.firstName}</span>
                          )}
                        </div>
                        <div className="co-field">
                          <label className="co-label">Last Name *</label>
                          <input
                            style={inp(errors.lastName)}
                            placeholder="Doe"
                            value={delivery.lastName}
                            onChange={(e) =>
                              setDelivery({...delivery, lastName: e.target.value})
                            }
                            onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                            onBlur={(e) =>
                              (e.target.style.borderColor = errors.lastName
                                ? "#ef4444"
                                : "rgba(255,255,255,0.1)")
                            }
                          />
                          {errors.lastName && (
                            <span className="co-error">{errors.lastName}</span>
                          )}
                        </div>
                      </div>

                      <div className="co-row-1">
                        <div className="co-field">
                          <label className="co-label">Street Address *</label>
                          <input
                            style={inp(errors.address)}
                            placeholder="12 Victoria Island Road"
                            value={delivery.address}
                            onChange={(e) =>
                              setDelivery({...delivery, address: e.target.value})
                            }
                            onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                            onBlur={(e) =>
                              (e.target.style.borderColor = errors.address
                                ? "#ef4444"
                                : "rgba(255,255,255,0.1)")
                            }
                          />
                          {errors.address && (
                            <span className="co-error">{errors.address}</span>
                          )}
                        </div>
                        <div className="co-field">
                          <label className="co-label">Apt / Suite (optional)</label>
                          <input
                            style={inp(false)}
                            placeholder="Apt 4B"
                            value={delivery.apt}
                            onChange={(e) => setDelivery({...delivery, apt: e.target.value})}
                            onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                            onBlur={(e) =>
                              (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                            }
                          />
                        </div>
                      </div>

                      {/* State */}
                      {delivery.country_code && (
                        <div className="co-row-1" style={{marginBottom: 12}}>
                          <div className="co-field">
                            <label className="co-label">State / Region *</label>
                            <SearchSelect
                              options={stateOptions}
                              value={delivery.state_code}
                              onChange={(iso) => {
                                const s = geoLoaded ? State.getStateByCodeAndCountry(
                                  iso,
                                  delivery.country_code
                                ) : null;
                                setDelivery({
                                  ...delivery,
                                  state_code: iso,
                                  state_name: s?.name || "",
                                  city: "",
                                });
                              }}
                              placeholder="Select state…"
                              disabled={!delivery.country_code}
                            />
                          </div>
                        </div>
                      )}

                      {/* City */}
                      {delivery.state_code && (
                        <div className="co-row-1">
                          <div className="co-field">
                            <label className="co-label">City *</label>
                            {cityOptions.length > 0 ? (
                              <SearchSelect
                                options={cityOptions}
                                value={delivery.city}
                                onChange={(name) => setDelivery({...delivery, city: name})}
                                placeholder="Select city…"
                                disabled={!delivery.state_code}
                              />
                            ) : (
                              <input
                                style={inp(errors.city)}
                                placeholder="Type city name…"
                                value={delivery.city}
                                onChange={(e) =>
                                  setDelivery({...delivery, city: e.target.value})
                                }
                                onFocus={(e) =>
                                  (e.target.style.borderColor = "rgba(239,68,68,0.6)")
                                }
                                onBlur={(e) =>
                                  (e.target.style.borderColor = errors.city
                                    ? "#ef4444"
                                    : "rgba(255,255,255,0.1)")
                                }
                              />
                            )}
                            {errors.city && <span className="co-error">{errors.city}</span>}
                          </div>
                        </div>
                      )}

                      <div className="co-row">
                        <div className="co-field">
                          <label className="co-label">Postcode / ZIP *</label>
                          <input
                            style={inp(errors.zip)}
                            placeholder="100001"
                            value={delivery.zip}
                            onChange={(e) => setDelivery({...delivery, zip: e.target.value})}
                            onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                            onBlur={(e) =>
                              (e.target.style.borderColor = errors.zip
                                ? "#ef4444"
                                : "rgba(255,255,255,0.1)")
                            }
                          />
                          {errors.zip && <span className="co-error">{errors.zip}</span>}
                        </div>
                      </div>

                      {/* Shipping Method — always shown; cart flow gets interactive change panel */}
                      <p className="co-section-title" style={{marginTop: 28}}>
                        Shipping Method
                      </p>
                      {passedBrandShippingMap ? (
                        /* ── CART FLOW: per-brand interactive shipping panel ── */
                        <div>
                          {Object.entries(brandShippingMap).map(([bId, selected]) => (
                            <CheckoutBrandShippingPanel
                              key={bId}
                              brandId={bId}
                              brandName={selected.brandName}
                              selected={selected}
                              cache={brandShippingDataCache}
                              setCache={setBrandShippingDataCache}
                              fmtMoney={fmtMoney}
                              convert={convert}
                              baseCurrency={baseCurrency}
                              onSelect={(method) => {
                                setBrandShippingMap((prev) => ({
                                  ...prev,
                                  [bId]: {...method, brandName: selected.brandName},
                                }));
                                // ✅ Sync the global mode toggle to match what was selected
                                setDeliveryMode(method.pickupMode ? "pickup" : "delivery");
                                if (!method.pickupMode) {
                                  const locationData = extractLocationFromMethod(method);
                                  if (Object.keys(locationData).length > 0) {
                                    setDelivery((prev) => ({...prev, ...locationData}));
                                  }
                                }
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        /* ── BUY NOW FLOW: existing shipping method selector ── */
                        <>
                      {!delivery.country_code &&
                        !delivery.state_name &&
                        !delivery.city && (
                          <div
                            style={{
                              padding: "12px 14px",
                              background: "rgba(34,197,94,0.05)",
                              border: "1px solid rgba(34,197,94,0.2)",
                              borderRadius: 10,
                              marginBottom: 12,
                            }}>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.4)",
                                fontSize: 11,
                                margin: 0,
                              }}>
                              💡{" "}
                              <strong style={{color: "#22c55e"}}>Tip:</strong> Select a
                              shipping method below to auto-fill your location, or fill your
                              address first to filter methods.
                            </p>
                          </div>
                        )}

                      {shippingLoading ? (
                        <div
                          style={{
                            height: 56,
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 10,
                            animation: "co-pulse 1.4s infinite",
                          }}
                        />
                      ) : filteredShippingOptions.length === 0 ? (
                        <div
                          style={{
                            padding: "16px",
                            background: "rgba(239,68,68,0.05)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 10,
                          }}>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.4)",
                              fontSize: 11,
                              margin: "0 0 4px",
                            }}>
                            🚫 No shipping available
                            {delivery.country_name && (
                              <>
                                {" "}
                                to{" "}
                                <strong style={{color: "#ef4444"}}>
                                  {delivery.country_name}
                                  {delivery.state_name ? `, ${delivery.state_name}` : ""}
                                  {delivery.city ? `, ${delivery.city}` : ""}
                                </strong>
                              </>
                            )}
                          </p>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.3)",
                              fontSize: 10,
                              margin: "6px 0 0",
                            }}>
                            Try pickup instead or contact support.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              marginBottom: 8,
                              color: "rgba(255,255,255,0.3)",
                              fontSize: 10,
                            }}>
                            {delivery.country_name ? (
                              <span>
                                Showing methods for{" "}
                                <strong style={{color: "#fff"}}>
                                  {delivery.country_name}
                                  {delivery.state_name ? `, ${delivery.state_name}` : ""}
                                  {delivery.city ? `, ${delivery.city}` : ""}
                                </strong>
                              </span>
                            ) : (
                              <span>
                                Showing all {filteredShippingOptions.length} available method
                                {filteredShippingOptions.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          {filteredShippingOptions.map((method) => {
                            const isSelected =
                              selectedShippingMethod?.id === method.id &&
                              selectedShippingMethod?.type === method.type;

                            const methodRawPrice = Number(
                              method.flat_rate ||
                                method.base_price ||
                                method.rate ||
                                0
                            );

                            const methodCurrency = (
                              method._currency ||
                              method.currency_code ||
                              method.currency ||
                              baseCurrency
                            ).toUpperCase();

                            const convertedMethodPrice = convert(
                              methodRawPrice,
                              methodCurrency
                            );

                            return (
                              <div
                                key={`${method.type}-${method.id}`}
                                className={`co-delivery-opt ${isSelected ? "active" : ""}`}
                                onClick={() => handleShippingMethodSelect(method)}>
                                <div className={`co-radio ${isSelected ? "active" : ""}`}>
                                  {isSelected && <div className="co-radio-dot" />}
                                </div>

                                <div style={{flex: 1}}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      marginBottom: 2,
                                    }}>
                                    <p
                                      style={{
                                        color: "#fff",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        margin: 0,
                                      }}>
                                      {method.name}
                                    </p>
                                    {method.type === "local" && (
                                      <span
                                        style={{
                                          background: "rgba(34,197,94,0.1)",
                                          border: "1px solid rgba(34,197,94,0.3)",
                                          color: "#22c55e",
                                          fontSize: 7,
                                          fontWeight: 900,
                                          letterSpacing: "0.1em",
                                          textTransform: "uppercase",
                                          padding: "1px 5px",
                                          borderRadius: 3,
                                        }}>
                                        LOCAL
                                      </span>
                                    )}
                                  </div>

                                  {method.description && (
                                    <p
                                      style={{
                                        color: "rgba(255,255,255,0.3)",
                                        fontSize: 11,
                                        margin: "0 0 2px",
                                      }}>
                                      {method.description}
                                    </p>
                                  )}

                                  {method.type === "zone" &&
                                    method.locations &&
                                    method.locations.length > 0 && (
                                      <p
                                        style={{
                                          color: "rgba(255,255,255,0.25)",
                                          fontSize: 10,
                                          margin: "2px 0",
                                        }}>
                                        📍{" "}
                                        {method.locations
                                          .map((l) => l.state || l.country)
                                          .join(", ")}
                                      </p>
                                    )}

                                  {method.type === "local" && (
                                    <p
                                      style={{
                                        color: "rgba(255,255,255,0.25)",
                                        fontSize: 10,
                                        margin: "2px 0",
                                      }}>
                                      📍{" "}
                                      {[method.city, method.state, method.country]
                                        .filter(Boolean)
                                        .join(", ")}
                                    </p>
                                  )}

                                  {method.min_days && method.max_days && (
                                    <p
                                      style={{
                                        color: "rgba(255,255,255,0.25)",
                                        fontSize: 10,
                                        margin: "2px 0 0",
                                      }}>
                                      ⏱ Est. {method.min_days}–{method.max_days} days
                                    </p>
                                  )}

                                  {method.free_above && (
                                    <p
                                      style={{
                                        color: "rgba(255,255,255,0.25)",
                                        fontSize: 10,
                                        margin: "4px 0 0",
                                      }}>
                                      Free above{" "}
                                      {fmtMoney(convert(Number(method.free_above), methodCurrency))}
                                    </p>
                                  )}
                                </div>

                                <span
                                  style={{
                                    fontFamily: "'Bebas Neue', sans-serif",
                                    fontSize: "1rem",
                                    color: convertedMethodPrice === 0 ? "#22c55e" : "#fff",
                                    flexShrink: 0,
                                  }}>
                                  {convertedMethodPrice === 0
                                    ? "FREE"
                                    : fmtMoney(convertedMethodPrice)}
                                </span>
                              </div>
                            );
                          })}
                        </>
                      )}
                      {errors.shipping && (
                        <span className="co-error">{errors.shipping}</span>
                      )}
                        </>
                      )} {/* end passedBrandShippingMap ternary */}
                    </>
                  ) : (
                    <>
                      <p className="co-section-title">Select Pickup Location</p>

                      {/* ✅ Cart flow: reuse the per-brand shipping panels, they now have pickup tabs */}
                      {passedBrandShippingMap ? (
                        <div>
                          {Object.entries(brandShippingMap).map(([bId, sel]) => (
                            <CheckoutBrandShippingPanel
                              key={bId}
                              brandId={bId}
                              brandName={sel.brandName}
                              selected={sel}
                              cache={brandShippingDataCache}
                              setCache={setBrandShippingDataCache}
                              fmtMoney={fmtMoney}
                              convert={convert}
                              baseCurrency={baseCurrency}
                              onSelect={(method) => {
                                setBrandShippingMap((prev) => ({
                                  ...prev,
                                  [bId]: {...method, brandName: sel.brandName},
                                }));
                                setDeliveryMode(method.pickupMode ? "pickup" : "delivery");
                                if (!method.pickupMode) {
                                  const locationData = extractLocationFromMethod(method);
                                  if (Object.keys(locationData).length > 0) {
                                    setDelivery((prev) => ({...prev, ...locationData}));
                                  }
                                }
                              }}
                            />
                          ))}
                          {errors.pickup && <span className="co-error">{errors.pickup}</span>}
                        </div>
                      ) : (
                        /* BuyNow flow: single brand pickup list */
                        <>
                          {shippingLoading ? (
                            <div
                              style={{
                                height: 80,
                                background: "rgba(255,255,255,0.04)",
                                borderRadius: 10,
                                animation: "co-pulse 1.4s infinite",
                              }}
                            />
                          ) : !shippingData?.pickups || shippingData.pickups.length === 0 ? (
                            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
                              No pickup locations available.
                            </p>
                          ) : (
                            shippingData.pickups.map((pickup) => (
                              <div
                                key={pickup.id}
                                className={`co-delivery-opt ${
                                  selectedPickupLocation?.id === pickup.id ? "active" : ""
                                }`}
                                onClick={() => setSelectedPickupLocation(pickup)}>
                                <div
                                  className={`co-radio ${
                                    selectedPickupLocation?.id === pickup.id ? "active" : ""
                                  }`}>
                                  {selectedPickupLocation?.id === pickup.id && (
                                    <div className="co-radio-dot" />
                                  )}
                                </div>
                                <div style={{flex: 1}}>
                                  <p
                                    style={{
                                      color: "#fff",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      margin: "0 0 4px",
                                    }}>
                                    {pickup.name}
                                  </p>
                                  <p
                                    style={{
                                      color: "rgba(255,255,255,0.4)",
                                      fontSize: 11,
                                      margin: "0 0 2px",
                                    }}>
                                    {pickup.address}, {pickup.city}
                                    {pickup.state ? `, ${pickup.state}` : ""}
                                  </p>
                                  {pickup.phone && (
                                    <p
                                      style={{
                                        color: "rgba(255,255,255,0.3)",
                                        fontSize: 10,
                                        margin: "2px 0 0",
                                      }}>
                                      📞 {pickup.phone}
                                    </p>
                                  )}
                                  {pickup.instructions && (
                                    <p
                                      style={{
                                        color: "rgba(255,255,255,0.25)",
                                        fontSize: 10,
                                        margin: "4px 0 0",
                                        fontStyle: "italic",
                                      }}>
                                      {pickup.instructions}
                                    </p>
                                  )}
                                </div>
                                <div
                                  style={{
                                    background: "rgba(34,197,94,0.1)",
                                    border: "1px solid rgba(34,197,94,0.25)",
                                    borderRadius: 6,
                                    padding: "4px 10px",
                                    alignSelf: "flex-start",
                                  }}>
                                  <span
                                    style={{
                                      color: "#22c55e",
                                      fontSize: 9,
                                      fontWeight: 900,
                                      letterSpacing: "0.12em",
                                      textTransform: "uppercase",
                                    }}>
                                    FREE
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                          {errors.pickup && <span className="co-error">{errors.pickup}</span>}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Continue with Step 2 and 3 in next part... */}
{/* ── STEP 2: Payment ── */}
{step === 2 && (
                <div>
                  <p className="co-section-title">Payment Method</p>
                  <div className="co-pay-tabs">
                    {paymentMethods.map((m) => {
                      const guestLocked = isGuest && m.id !== "transfer";
                      const disabled = (m.comingSoon && !CARD_PAYMENTS_ENABLED) || guestLocked;
                      return (
                        <div
                          key={m.id}
                          className={`co-pay-tab ${payment.method === m.id ? "active" : ""} ${disabled ? "coming-soon" : ""}`}
                          onClick={() => {
                            if (disabled) return;
                            setPayment({method: m.id});
                          }}>
                          {guestLocked
                            ? <span className="co-pay-tab-badge">Log in to use</span>
                            : disabled && <span className="co-pay-tab-badge">Coming Soon</span>}
                          <span className="co-pay-tab-icon">{m.icon}</span>
                          <span className="co-pay-tab-label">{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {isGuest && (
                    <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 8}}>
                      Checking out as a guest supports bank transfer. <Link to="/login" style={{color: "#ef4444"}}>Log in</Link> to pay by card or Flutterwave.
                    </p>
                  )}

                  {payment.method === "card" && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "40px 24px",
                        textAlign: "center",
                      }}>
                      <p style={{fontSize: "2.5rem", marginBottom: 10}}>💳</p>
                      {CARD_PAYMENTS_ENABLED ? (
                        <>
                          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 6}}>
                            You'll be redirected to <strong style={{color: "#fff"}}>Paystack</strong> for payment
                          </p>
                          <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>
                            Cards, Bank & USSD
                          </p>
                        </>
                      ) : (
                        <>
                          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 6}}>
                            Credit/Debit Card payments via <strong style={{color: "#fff"}}>Paystack</strong> are{" "}
                            <strong style={{color: "#fff"}}>coming soon</strong>
                          </p>
                          <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>
                            Please use Flutterwave or Bank Transfer for now
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {payment.method === "flutterwave" && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "40px 24px",
                        textAlign: "center",
                      }}>
                      <p style={{fontSize: "2.5rem", marginBottom: 10}}>🦋</p>
                      <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 6}}>
                        You'll be redirected to{" "}
                        <strong style={{color: "#fff"}}>Flutterwave</strong> for payment
                      </p>
                      <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>
                        Cards, Mobile Money, Bank Transfer & USSD
                      </p>
                    </div>
                  )}

                  {payment.method === "transfer" && (
                    <div>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          padding: "20px 22px",
                          marginBottom: 20,
                        }}>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.28)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            marginBottom: 14,
                          }}>
                          Transfer To This Account
                        </p>
                        {[
                          {label: "Bank Name", value: "Fidelity Bank Plc"},
                          {label: "Account Name", value: "OLATOMIWA AYOMIDE SHITTU"},
                          {label: "Account Number", value: "6174 0498 08"},
                          {label: "Amount", value: fmtMoney(orderTotal)},
                          {
                            label: "Reference",
                            value: `ORDER-${Date.now().toString().slice(-6)}`,
                          },
                        ].map((r) => (
                          <div
                            key={r.label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 0",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}>
                            <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
                              {r.label}
                            </span>
                            <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>
                              {r.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label
                          className="co-label"
                          style={{display: "block", marginBottom: 8}}>
                          Upload Transfer Receipt *
                        </label>
                        <div
                          onClick={() =>
                            document.getElementById("receipt-input").click()
                          }
                          style={{
                            border: `2px dashed ${
                              errors.receipt
                                ? "#ef4444"
                                : receipt
                                ? "#22c55e"
                                : "rgba(255,255,255,0.15)"
                            }`,
                            borderRadius: 12,
                            padding: "32px 24px",
                            textAlign: "center",
                            cursor: "pointer",
                            background: receipt
                              ? "rgba(34,197,94,0.05)"
                              : "rgba(255,255,255,0.02)",
                          }}>
                          {receipt ? (
                            <>
                              <p
                                style={{
                                  color: "#22c55e",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  marginBottom: 4,
                                }}>
                                {receipt.name}
                              </p>
                              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>
                                ({(receipt.size / 1024).toFixed(1)} KB) —{" "}
                                <span
                                  style={{
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReceipt(null);
                                    setReceiptError("");
                                  }}>
                                  Remove
                                </span>
                              </p>
                            </>
                          ) : (
                            <>
                              <p
                                style={{
                                  color: "rgba(255,255,255,0.45)",
                                  fontSize: 12,
                                  marginBottom: 4,
                                }}>
                                Click to upload your receipt
                              </p>
                              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                                PNG, JPG, PDF — max 5MB
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          id="receipt-input"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          style={{display: "none"}}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              setReceiptError("File too large — max 5MB");
                              return;
                            }
                            setReceipt(file);
                            setReceiptError("");
                            setErrors((prev) => ({...prev, receipt: null}));
                          }}
                        />
                        {(errors.receipt || receiptError) && (
                          <p
                            style={{
                              color: "#ef4444",
                              fontSize: 10,
                              fontWeight: 700,
                              marginTop: 6,
                            }}>
                            {errors.receipt || receiptError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <p
                    style={{
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 10,
                      marginTop: 14,
                      textAlign: "center",
                      letterSpacing: "0.08em",
                    }}>
                    🔒 Your payment information is encrypted and secure
                  </p>
                </div>
              )}

{/* ── STEP 3: Review ── */}
              {step === 3 && (
                <div>
                  <p className="co-section-title">Review Your Order</p>

                  <div className="co-review-block">
                    <div className="co-review-block-title">
                      <span>Contact</span>
                      <button className="co-review-edit" onClick={() => setStep(0)}>
                        Edit
                      </button>
                    </div>
                    <p className="co-review-val">
                      {contact.email}
                      <br />
                      {contact.phone}
                    </p>
                  </div>

                  {deliveryMode === "delivery" ? (
                    <>
                      <div className="co-review-block">
                        <div className="co-review-block-title">
                          <span>Delivery Address</span>
                          <button className="co-review-edit" onClick={() => setStep(1)}>
                            Edit
                          </button>
                        </div>
                        <p className="co-review-val">
                          {delivery.firstName} {delivery.lastName}
                          <br />
                          {delivery.address}
                          {delivery.apt ? `, ${delivery.apt}` : ""}
                          <br />
                          {delivery.city}, {delivery.zip}
                          <br />
                          {delivery.state_name && `${delivery.state_name}, `}
                          {delivery.country_name}
                        </p>
                      </div>

                      <div className="co-review-block">
                        <div className="co-review-block-title">
                          <span>Shipping Method</span>
                          <button className="co-review-edit" onClick={() => setStep(1)}>
                            Edit
                          </button>
                        </div>
                        <p className="co-review-val">
                          {passedBrandShippingMap ? (
                            // Cart: show per-brand shipping breakdown
                            <>
                              {Object.entries(passedBrandShippingMap).map(([bId, m]) => {
                                const raw = m.pickupMode ? 0 : Number(m.flat_rate ?? m.base_price ?? m.rate ?? 0);
                                return (
                                  <span key={bId} style={{display: "block", fontSize: 11, marginBottom: 2}}>
                                    <span style={{color: "rgba(255,255,255,0.4)"}}>{m.brandName}</span>
                                    {" — "}
                                    <span style={{color: "#fff"}}>{m.name || (m.pickupMode ? "Pickup" : "Delivery")}</span>
                                    {" "}
                                    <span style={{color: raw === 0 ? "#22c55e" : "rgba(255,255,255,0.6)"}}>
                                      ({raw === 0 ? "FREE" : fmtMoney(raw)})
                                    </span>
                                  </span>
                                );
                              })}
                            </>
                          ) : (
                            // BuyNow: single method display
                            <>
                              {selectedShippingMethod?.name || "Not selected"}
                              {selectedShippingMethod && (
                                <>
                                  {selectedShippingMethod.type === "local" && (
                                    <span style={{color: "#22c55e"}}> (Local)</span>
                                  )}
                                  {selectedShippingMethod.description && (
                                    <> — {selectedShippingMethod.description}</>
                                  )}
                                  {selectedShippingMethod.min_days &&
                                    selectedShippingMethod.max_days && (
                                      <>
                                        {" "}
                                        (Est. {selectedShippingMethod.min_days}–
                                        {selectedShippingMethod.max_days} days)
                                      </>
                                    )}
                                  {deliveryCost > 0
                                    ? ` — ${fmtMoney(deliveryCost)}`
                                    : " — FREE"}
                                </>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="co-review-block">
                      <div className="co-review-block-title">
                        <span>Pickup Location</span>
                        <button className="co-review-edit" onClick={() => setStep(1)}>
                          Edit
                        </button>
                      </div>
                      <p className="co-review-val">
                        {/* ✅ Cart flow: show all per-brand pickup selections */}
                        {passedBrandShippingMap ? (
                          Object.values(brandShippingMap).filter((m) => m.pickupMode).length > 0 ? (
                            Object.entries(brandShippingMap)
                              .filter(([, m]) => m.pickupMode)
                              .map(([bId, m]) => (
                                <span key={bId} style={{display: "block", marginBottom: 6}}>
                                  <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>{m.brandName} — </span>
                                  <span style={{color: "#fff", fontWeight: 700}}>{m.name}</span>
                                  <br />
                                  <span style={{color: "rgba(255,255,255,0.45)", fontSize: 11}}>
                                    {[m.address, m.city, m.state].filter(Boolean).join(", ")}
                                  </span>
                                  {m.phone && (
                                    <><br /><span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>📞 {m.phone}</span></>
                                  )}
                                </span>
                              ))
                          ) : (
                            <span style={{color: "rgba(255,255,255,0.35)"}}>No pickup selected</span>
                          )
                        ) : (
                          // BuyNow flow
                          <>
                            {selectedPickupLocation?.name || "Not selected"}
                            {selectedPickupLocation && (
                              <>
                                <br />
                                {selectedPickupLocation.address}, {selectedPickupLocation.city}
                                {selectedPickupLocation.state &&
                                  `, ${selectedPickupLocation.state}`}
                                {selectedPickupLocation.phone && (
                                  <>
                                    <br />
                                    📞 {selectedPickupLocation.phone}
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="co-review-block">
                    <div className="co-review-block-title">
                      <span>Payment</span>
                      <button className="co-review-edit" onClick={() => setStep(2)}>
                        Edit
                      </button>
                    </div>
                    <p className="co-review-val">
                      {payment.method === "card" ? (
                        "Credit / Debit Card (Paystack)"
                      ) : payment.method === "flutterwave" ? (
                        "Flutterwave"
                      ) : payment.method === "transfer" ? (
                        <>
                          Bank Transfer{" "}
                          {receipt && (
                            <span style={{color: "#22c55e"}}>
                              ✓ Receipt: {receipt.name}
                            </span>
                          )}
                        </>
                      ) : (
                        paymentMethods.find((m) => m.id === payment.method)?.label
                      )}
                    </p>
                  </div>

                  {orderError && (
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 8,
                        marginTop: 16,
                      }}>
                      <p style={{color: "#ef4444", fontSize: 11, fontWeight: 700, margin: 0}}>
                        {orderError}
                      </p>
                    </div>
                  )}

                  <p
                    style={{
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 11,
                      lineHeight: 1.7,
                      marginTop: 16,
                    }}>
                    By placing this order you agree to our{" "}
                    <Link to="/terms" style={{color: "#ef4444", textDecoration: "none"}}>
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" style={{color: "#ef4444", textDecoration: "none"}}>
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              )}

              <div className="co-btn-row">
                {step > 0 && (
                  <button className="co-btn-back" onClick={back}>
                    ← Back
                  </button>
                )}
                {step < 3 ? (
                  <button className="co-btn-next" onClick={next}>
                    {step === 2 ? "Review Order →" : "Continue →"}
                  </button>
                ) : (
                  <>
                    <button
                      className="co-btn-next"
                      onClick={placeOrder}
                      disabled={placing && !paymentStuck}
                      style={{
                        background: placing ? "#15803d" : "#22c55e",
                        opacity: placing && !paymentStuck ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!placing) e.currentTarget.style.background = "#16a34a";
                      }}
                      onMouseLeave={(e) => {
                        if (!placing) e.currentTarget.style.background = "#22c55e";
                      }}>
                      {placing && !paymentStuck
                        ? "Processing Payment..."
                        : paymentStuck
                        ? "Retry Payment"
                        : `🔒 Place Order — ${fmtMoney(orderTotal)}`}
                    </button>
                    
                    {placing && !paymentStuck && (
                      <p
                        style={{
                          width: "100%",
                          textAlign: "center",
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 10,
                          marginTop: 12,
                          animation: "co-pulse 1.4s infinite",
                        }}>
                        Please complete payment in the popup window...
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

{/* Order Summary */}
        <div className="co-summary-wrap">
        <div className="co-summary" ref={summaryRef}>
          <div
            className="co-sum-toggle"
            onClick={() => setSummaryOpen((o) => !o)}>
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.1rem",
                  color: "#fff",
                  letterSpacing: "0.08em",
                  margin: 0,
                }}>
                {summaryOpen ? "Hide" : "Show"} Order Summary
              </h3>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 10}}>
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.2rem",
                  color: "#ef4444",
                }}>
                {fmtMoney(orderTotal)}
              </span>
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                style={{
                  transition: "transform 0.3s",
                  transform: summaryOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.2rem",
              color: "#fff",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}>
            Your Order
            {source === "buyNow" && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 99,
                  padding: "2px 8px",
                  marginLeft: 8,
                  verticalAlign: "middle",
                }}>
                BUY NOW
              </span>
            )}
          </h3>

          <div
            className={`co-sum-body ${summaryOpen ? "expanded" : "collapsed"}`}
            style={{maxHeight: summaryOpen ? 2000 : 0, marginTop: summaryOpen ? 16 : 0}}>
            {cartLoading ? (
              <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 64,
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 8,
                      animation: "co-pulse 1.4s infinite",
                    }}
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 12,
                  textAlign: "center",
                  padding: "20px 0",
                }}>
                No items
              </p>
            ) : (
              items.map((item, idx) => {
                const convertedUnitPrice = convert(item.price, baseCurrency);
                const convertedLineTotal = convertedUnitPrice * item.qty;

                return (
                  <div key={item.id ?? idx} className="co-sum-item">
                    <div className="co-sum-img">
                      <div className="co-sum-img-inner">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "rgba(255,255,255,0.04)",
                            }}
                          />
                        )}
                      </div>
                      <div className="co-sum-qty">{item.qty}</div>
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <p
                        style={{
                          color: "#fff",
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: "0.95rem",
                          letterSpacing: "0.05em",
                          margin: "0 0 2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                        {item.name}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.28)",
                          fontSize: 10,
                          margin: 0,
                          letterSpacing: "0.08em",
                        }}>
                        {item.brand}
                        {item.size && item.size !== "—" ? ` · ${item.size}` : ""}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 2,
                      }}>
                      {item.qty > 1 && (
                        <span
                          style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: 9,
                            fontWeight: 600,
                          }}>
                          {fmtMoney(convertedUnitPrice)} × {item.qty}
                        </span>
                      )}
                      <span
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: "1rem",
                          color: "#fff",
                          flexShrink: 0,
                        }}>
                        {fmtMoney(convertedLineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            <div style={{marginTop: 8}}>
              <div className="co-sum-divider" />
              <div className="co-sum-row">
                <span className="co-sum-label">Subtotal</span>
                <span className="co-sum-value">{fmtMoney(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="co-sum-row">
                  <span className="co-sum-label">
                    Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ""}
                  </span>
                  <span className="co-sum-value" style={{color: "#22c55e"}}>
                    −{fmtMoney(discount)}
                  </span>
                </div>
              )}
              <div className="co-sum-row">
                <span className="co-sum-label">
                  {deliveryMode === "pickup" ? "Pickup" : "Shipping"}
                </span>
                <span
                  className="co-sum-value"
                  style={{color: deliveryCost === 0 ? "#22c55e" : "#fff"}}>
                  {deliveryCost === 0 ? "FREE" : fmtMoney(deliveryCost)}
                </span>
              </div>
              {tax > 0 && (
                <div className="co-sum-row">
                  <span className="co-sum-label">Tax</span>
                  <span className="co-sum-value">{fmtMoney(tax)}</span>
                </div>
              )}
              <div className="co-sum-divider" />
              <div className="co-sum-row" style={{paddingTop: 10}}>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1rem",
                    color: "#fff",
                    letterSpacing: "0.08em",
                  }}>
                  TOTAL
                </span>
                <motion.span
                  key={orderTotal}
                  initial={{scale: 1.05}}
                  animate={{scale: 1}}
                  transition={{duration: 0.3}}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
                    letterSpacing: "0.04em",
                    color: "#ef4444",
                  }}>
                  {fmtMoney(orderTotal)}
                </motion.span>
              </div>

              {userCurrency !== baseCurrency && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "rgba(34,197,94,0.05)",
                    border: "1px solid rgba(34,197,94,0.15)",
                    borderRadius: 8,
                  }}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 9,
                      margin: 0,
                      lineHeight: 1.5,
                    }}>
                    💱 Converted from {baseCurrency} to{" "}
                    <strong style={{color: "#22c55e"}}>{userCurrency}</strong>
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}>
              {["Visa", "Mastercard", "PayPal", "Transfer"].map((p) => (
                <span
                  key={p}
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    border: "1px solid rgba(255,255,255,0.07)",
                    padding: "2px 7px",
                    borderRadius: 3,
                  }}>
                  {p}
                </span>
              ))}
            </div>
            <p
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.15)",
                fontSize: 9,
                marginTop: 8,
                letterSpacing: "0.08em",
              }}>
              🔒 256-bit SSL Encryption
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
