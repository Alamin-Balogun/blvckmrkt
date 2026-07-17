import {useState, useEffect, useCallback} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link, useNavigate} from "react-router-dom";
import {useCartWishlist, getToken} from "../../../components/cartcontext";
import {useCurrency} from "../../../components/currencycontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";


const VALID_COUPONS = {
  BLVCK10:  {type: "percent", value: 10,   label: "10% off"},
  STREET20: {type: "percent", value: 20,   label: "20% off"},
  SAVE5000: {type: "flat",    value: 5000, label: "₦5,000 off"},
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const ChevronIcon = ({open}) => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
    style={{transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s"}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const TruckIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
  </svg>
);

const PinIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  </svg>
);

const PackageIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>
);

const MapIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
);

// ── BrandShippingPanel ─────────────────────────────────────────────────────────
function BrandShippingPanel({brand, brandId, items, onSelect, selected, fmtMoney, convert, baseCurrency}) {
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [shippingData, setData] = useState(null);
  const [fetched, setFetched]   = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [tab, setTab]           = useState("delivery");

  // Auto-fetch shipping on mount so we know immediately if the brand has options
  useEffect(() => {
    if (fetched || loading) return;
    setLoading(true);
    setFetchError(false);
    fetch(`${API_BASE}/api/shop/brands/${brandId}/shipping`)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((json) => {
        const data = json?.data ?? json;
        // Normalise: ensure arrays exist
        const safe = {
          zones:   Array.isArray(data?.zones)   ? data.zones   : [],
          local:   Array.isArray(data?.local)   ? data.local   : [],
          pickups: Array.isArray(data?.pickups) ? data.pickups : [],
        };
        setData(safe);
        setFetched(true);
        // Auto-select the first available method if none selected yet
        if (!selected) {
          const methods = [
            ...safe.zones.flatMap((z) =>
              (z.methods ?? []).map((m) => ({...m, type: "zone", zone: z}))
            ),
            ...safe.local.map((m) => ({...m, type: "local"})),
          ];
          if (methods.length > 0) {
            onSelect(brandId, methods[0]);
          }
        }
      })
      .catch(() => {
        setData({zones: [], local: [], pickups: []});
        setFetched(true);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [brandId]); // eslint-disable-line

  const handleToggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const deliveryMethods = shippingData ? [
    ...(shippingData.zones?.flatMap((z) =>
      (z.methods ?? []).map((m) => ({...m, type: "zone", zone: z}))
    ) ?? []),
    ...(shippingData.local?.map((m) => ({
      ...m,
      type: "local",
      name: [m.city, m.state, m.country].filter(Boolean).join(", "),
      coverage: [
        m.city    && `City: ${m.city}`,
        m.state   && `State: ${m.state}`,
        m.country && `Country: ${m.country}`,
      ].filter(Boolean).join("  ·  "),
      _currency: (m.currency_code || m.currency || baseCurrency || "NGN").toUpperCase(),
    })) ?? []),
  ] : [];

  const pickupMethods = shippingData?.pickups ?? [];

  const hasDelivery = deliveryMethods.length > 0;
  const hasPickup   = pickupMethods.length > 0;
  const noShipping  = fetched && !loading && !fetchError && !hasDelivery && !hasPickup;

  const selectedLabel = (() => {
    if (!selected) return null;
    if (selected.pickupMode) {
      return {text: selected.name, type: "pickup", price: "FREE"};
    }
    const rawPrice = Number(selected.flat_rate ?? selected.base_price ?? selected.rate ?? 0);
    const selCur = (selected._currency || selected.currency_code || selected.currency || baseCurrency || "NGN").toUpperCase();
    return {
      text: selected.name,
      type: selected.type,
      price: rawPrice === 0 ? "FREE" : (fmtMoney ? fmtMoney(rawPrice, selCur) : `₦${rawPrice.toLocaleString()}`),
    };
  })();

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", marginBottom: 8,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <TruckIcon />
        <span style={{
          color: "rgba(255,255,255,0.4)", fontSize: 10,
          fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase",
        }}>
          Shipping Method
        </span>
        {selected && (
          <span style={{
            marginLeft: "auto",
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e", fontSize: 8, fontWeight: 900, letterSpacing: "0.12em",
            textTransform: "uppercase", padding: "2px 8px", borderRadius: 4,
          }}>✓ SELECTED</span>
        )}
      </div>

      {/* Selector */}
      <div style={{
        border: `1px solid ${noShipping ? "rgba(239,68,68,0.3)" : selected ? "rgba(34,197,94,0.25)" : "rgba(255,193,7,0.3)"}`,
        borderRadius: 10,
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
        transition: "border-color 0.25s",
      }}>
        {/* Selection display / toggle */}
        <div
          onClick={noShipping ? undefined : handleToggle}
          style={{
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
            cursor: noShipping ? "default" : "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => { if (!noShipping) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
          onMouseLeave={(e) => { if (!noShipping) e.currentTarget.style.background = "transparent"; }}>
          <div style={{flex: 1, minWidth: 0}}>
            {noShipping ? (
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <AlertIcon />
                <span style={{color: "#ef4444", fontSize: 11, fontWeight: 700}}>
                  No shipping available
                </span>
              </div>
            ) : selected ? (
              <div>
                <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 3}}>
                  <span style={{color: "#22c55e", fontSize: 10}}>✓</span>
                  <span style={{color: "#fff", fontSize: 12, fontWeight: 600}}>
                    {selectedLabel.text}
                  </span>
                  {selected.type === "local" && (
                    <span style={{
                      background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                      color: "#22c55e", fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                      textTransform: "uppercase", padding: "1px 5px", borderRadius: 3,
                    }}>LOCAL</span>
                  )}
                </div>
                <div style={{display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"}}>
                  <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>
                    {selected.pickupMode ? "📍 Pickup Location" : "🚚 Delivery"}
                  </span>
                  {selected.zone && (
                    <span style={{
                      color: "rgba(255,255,255,0.25)", fontSize: 9,
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      <MapIcon /> {selected.zone.name}
                    </span>
                  )}
                  {selected.min_days && selected.max_days && (
                    <span style={{
                      color: "rgba(255,255,255,0.25)", fontSize: 9,
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      <ClockIcon /> {selected.min_days}–{selected.max_days} days
                    </span>
                  )}
                </div>
              </div>
            ) : loading ? (
              <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
                Loading shipping options...
              </span>
            ) : (
              <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>
                Click to select a shipping method...
              </span>
            )}
          </div>

          {!noShipping && (
            <>
              <span style={{
                color: selected ? "#22c55e" : "rgba(255,255,255,0.4)",
                fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
              }}>
                {selected ? selectedLabel.price : ""}
              </span>
              <div style={{color: "rgba(255,255,255,0.3)"}}>
                <ChevronIcon open={open} />
              </div>
            </>
          )}
        </div>

        {/* No shipping warning */}
        {noShipping && (
          <div style={{
            padding: "0 16px 14px",
            color: "rgba(255,255,255,0.35)", fontSize: 10, lineHeight: 1.6,
          }}>
            This brand hasn't set up shipping yet. You can still checkout with items from other brands.
          </div>
        )}
        {fetchError && (
          <div style={{
            padding: "0 16px 14px",
            color: "rgba(255,193,7,0.7)", fontSize: 10, lineHeight: 1.6,
          }}>
            Could not load shipping options. Please refresh the page.
          </div>
        )}

        {/* Collapsible options */}
        <AnimatePresence>
          {open && !noShipping && (
            <motion.div
              initial={{height: 0, opacity: 0}}
              animate={{height: "auto", opacity: 1}}
              exit={{height: 0, opacity: 0}}
              transition={{duration: 0.25}}
              style={{overflow: "hidden"}}>
              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                padding: "16px",
                background: "rgba(0,0,0,0.2)",
              }}>
                {loading ? (
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", padding: "12px 0"}}>
                    Loading options...
                  </p>
                ) : (
                  <>
                    {/* Tab switcher */}
                    {hasDelivery && hasPickup && (
                      <div style={{display: "flex", gap: 6, marginBottom: 16}}>
                        {[{id: "delivery", icon: <TruckIcon />, label: "Delivery"},
                          {id: "pickup",   icon: <PinIcon />,   label: "Pickup"}].map(({id, icon, label}) => (
                          <button key={id} onClick={() => setTab(id)} style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                            padding: "8px 0", borderRadius: 7, cursor: "pointer", fontSize: 10,
                            fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
                            border: tab === id ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                            background: tab === id ? "rgba(239,68,68,0.12)" : "transparent",
                            color: tab === id ? "#ef4444" : "rgba(255,255,255,0.35)",
                            transition: "all 0.18s",
                          }}>
                            {icon} {label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Delivery methods */}
                    {(tab === "delivery" || !hasPickup) && hasDelivery && (
                      <div>
                        {!hasPickup && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            marginBottom: 12, paddingBottom: 10,
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}>
                            <TruckIcon />
                            <span style={{
                              color: "rgba(255,255,255,0.4)", fontSize: 10,
                              fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase",
                            }}>
                              Available Delivery Options
                            </span>
                          </div>
                        )}

                        {deliveryMethods.map((method) => {
                          const isSelected = selected && !selected.pickupMode &&
                            selected.id === method.id && selected.type === method.type;
                          const rawPrice = Number(method.flat_rate ?? method.base_price ?? method.rate ?? 0);
                          const methodCur = (method._currency || method.currency_code || method.currency || baseCurrency || "NGN").toUpperCase();
                          const convertedPrice = convert ? convert(rawPrice, methodCur) : rawPrice;
                          const priceLabel = rawPrice === 0 ? "FREE" : (fmtMoney ? fmtMoney(rawPrice, methodCur) : `₦${rawPrice.toLocaleString()}`);

                          // Coverage: for local rates use the enriched coverage field; for zones use locations
                          const coverage = method.type === "zone"
                            ? (method.zone?.locations ?? []).map(l => [l.country, l.state].filter(Boolean).join(" — ")).join(", ")
                            : method.coverage;

                          return (
                            <div key={`${method.type}-${method.id}`}
                              onClick={() => { 
                                onSelect(brandId, {
                                  ...method,
                                  zone: method.type === "zone" ? method.zone : undefined
                                }); 
                              }}
                              style={{
                                padding: "12px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 8,
                                border: isSelected ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                background: isSelected ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                }
                              }}>
                              <div style={{display: "flex", alignItems: "flex-start", gap: 12}}>
                                {/* Radio */}
                                <div style={{
                                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                                  border: isSelected ? "2px solid #ef4444" : "2px solid rgba(255,255,255,0.2)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {isSelected && <div style={{width: 7, height: 7, borderRadius: "50%", background: "#ef4444"}} />}
                                </div>

                                {/* Content */}
                                <div style={{flex: 1, minWidth: 0}}>
                                  {/* Method name & badges */}
                                  <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap"}}>
                                    <span style={{color: "#fff", fontSize: 13, fontWeight: 700}}>
                                      {method.name}
                                    </span>
                                    {method.type === "local" && (
                                      <span style={{
                                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                                        color: "#22c55e", fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                                        textTransform: "uppercase", padding: "2px 6px", borderRadius: 3,
                                      }}>LOCAL DELIVERY</span>
                                    )}
                                    {method.type === "zone" && (
                                      <span style={{
                                        background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
                                        color: "#3b82f6", fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                                        textTransform: "uppercase", padding: "2px 6px", borderRadius: 3,
                                      }}>ZONE: {method.zone?.name}</span>
                                    )}
                                  </div>

                                  {/* Description */}
                                  {method.description && (
                                    <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 6px", lineHeight: 1.5}}>
                                      {method.description}
                                    </p>
                                  )}

                                  {/* Coverage / delivery location details */}
                                  {coverage && (
                                    <div style={{
                                      display: "flex", alignItems: "flex-start", gap: 6,
                                      padding: "6px 10px", borderRadius: 6,
                                      background: method.type === "local" ? "rgba(34,197,94,0.05)" : "rgba(59,130,246,0.06)",
                                      border: method.type === "local" ? "1px solid rgba(34,197,94,0.18)" : "1px solid rgba(59,130,246,0.15)",
                                      marginBottom: 6,
                                    }}>
                                      <MapIcon />
                                      <div style={{flex: 1, minWidth: 0}}>
                                        <p style={{
                                          color: "rgba(255,255,255,0.3)", fontSize: 8,
                                          fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
                                          margin: "0 0 3px",
                                        }}>
                                          {method.type === "local" ? "Delivery Location" : "Coverage Area"}
                                        </p>
                                        <p style={{color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0, lineHeight: 1.4}}>
                                          {coverage}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Area overrides (local rates with per-area pricing) */}
                                  {method.type === "local" && Array.isArray(method.area_overrides) && method.area_overrides.length > 0 && (
                                    <div style={{
                                      padding: "6px 10px", borderRadius: 6, marginBottom: 6,
                                      background: "rgba(251,191,36,0.05)",
                                      border: "1px solid rgba(251,191,36,0.15)",
                                    }}>
                                      <p style={{
                                        color: "rgba(255,255,255,0.3)", fontSize: 8,
                                        fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
                                        margin: "0 0 6px",
                                      }}>Area Rates</p>
                                      {method.area_overrides.map((ao, i) => (
                                        <div key={i} style={{
                                          display: "flex", justifyContent: "space-between",
                                          marginBottom: 3,
                                        }}>
                                          <span style={{color: ao.is_special ? "#fbbf24" : "rgba(255,255,255,0.5)", fontSize: 10}}>
                                            {ao.area}{ao.is_special ? " ★" : ""}
                                          </span>
                                          <span style={{color: "#fff", fontSize: 10, fontWeight: 700}}>
                                            {fmtMoney ? fmtMoney(ao.price, methodCur) : ao.price}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Delivery time */}
                                  {method.min_days && method.max_days && (
                                    <div style={{display: "flex", alignItems: "center", gap: 5}}>
                                      <ClockIcon />
                                      <span style={{color: "rgba(255,255,255,0.35)", fontSize: 10}}>
                                        Estimated delivery: {method.min_days}–{method.max_days} days
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Price */}
                                <span style={{
                                  color: rawPrice === 0 ? "#22c55e" : "#fff",
                                  fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", marginTop: 2,
                                }}>
                                  {priceLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pickup locations */}
                    {(tab === "pickup" || !hasDelivery) && hasPickup && (
                      <div>
                        {!hasDelivery && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            marginBottom: 12, paddingBottom: 10,
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                          }}>
                            <PinIcon />
                            <span style={{
                              color: "rgba(255,255,255,0.4)", fontSize: 10,
                              fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase",
                            }}>
                              Pickup Locations
                            </span>
                          </div>
                        )}

                        {pickupMethods.map((loc) => {
                          const isSelected = selected?.pickupMode && selected?.id === loc.id;
                          const fullAddress = [loc.address, loc.city, loc.state, loc.country, loc.postal_code].filter(Boolean).join(", ");

                          return (
                            <div key={loc.id}
                              onClick={() => onSelect(brandId, {...loc, pickupMode: true, type: "pickup"})}
                              style={{
                                padding: "12px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 8,
                                border: isSelected ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                background: isSelected ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                }
                              }}>
                              <div style={{display: "flex", alignItems: "flex-start", gap: 12}}>
                                {/* Radio */}
                                <div style={{
                                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                                  border: isSelected ? "2px solid #ef4444" : "2px solid rgba(255,255,255,0.2)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {isSelected && <div style={{width: 7, height: 7, borderRadius: "50%", background: "#ef4444"}} />}
                                </div>

                                {/* Content */}
                                <div style={{flex: 1, minWidth: 0}}>
                                  <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 4}}>
                                    <span style={{color: "#fff", fontSize: 13, fontWeight: 700}}>
                                      {loc.name}
                                    </span>
                                    <span style={{
                                      background: "rgba(147,51,234,0.1)", border: "1px solid rgba(147,51,234,0.3)",
                                      color: "#9333ea", fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                                      textTransform: "uppercase", padding: "2px 6px", borderRadius: 3,
                                    }}>PICKUP</span>
                                  </div>

                                  {/* Full address */}
                                  {fullAddress && (
                                    <div style={{
                                      display: "flex", alignItems: "flex-start", gap: 6,
                                      padding: "6px 10px", borderRadius: 6,
                                      background: "rgba(147,51,234,0.06)",
                                      border: "1px solid rgba(147,51,234,0.15)",
                                      marginBottom: 6,
                                    }}>
                                      <PinIcon />
                                      <div style={{flex: 1, minWidth: 0}}>
                                        <p style={{
                                          color: "rgba(255,255,255,0.3)", fontSize: 8,
                                          fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
                                          margin: "0 0 3px",
                                        }}>
                                          Location
                                        </p>
                                        <p style={{color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0, lineHeight: 1.4}}>
                                          {fullAddress}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Instructions */}
                                  {loc.instructions && (
                                    <div style={{
                                      padding: "6px 10px", borderRadius: 6,
                                      background: "rgba(251,191,36,0.06)",
                                      border: "1px solid rgba(251,191,36,0.15)",
                                    }}>
                                      <p style={{
                                        color: "rgba(255,255,255,0.3)", fontSize: 8,
                                        fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase",
                                        margin: "0 0 3px",
                                      }}>
                                        ℹ️ Pickup Instructions
                                      </p>
                                      <p style={{color: "rgba(255,255,255,0.45)", fontSize: 10, margin: 0, lineHeight: 1.4}}>
                                        {loc.instructions}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Free badge */}
                                <span style={{
                                  color: "#22c55e", fontSize: 14, fontWeight: 800,
                                  whiteSpace: "nowrap", marginTop: 2,
                                }}>
                                  FREE
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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

// ── Main CartGrid ──────────────────────────────────────────────────────────────
export default function CartGrid() {
  const {cartItems, refreshCart, removeFromCart} = useCartWishlist();
  const {fmtMoney, convert, baseCurrency} = useCurrency();
  const [items,        setItems]       = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [coupon,       setCoupon]      = useState("");
  const [appliedCoupon,setApplied]     = useState(null);
  const [couponError,  setCouponError] = useState("");
  const [couponSuccess,setCouponSuccess] = useState("");
  const [updatingId,   setUpdatingId]  = useState(null);
  const [qtyError,     setQtyError]    = useState("");
  const [brandShipping, setBrandShipping] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/login"); return; }
    refreshCart();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!Array.isArray(cartItems) || !cartItems.length) {
      setItems([]); setLoading(false); return;
    }
    const mapped = cartItems.map((ci) => ({
      cartItemId: ci.id,
      productId:  ci.product_id,
      name:       ci.product?.name       ?? "Product",
      brand:      ci.product?.brand_name ?? "",
      brandId:    ci.product?.brand_id,
      size:       ci.selected_size       ?? "—",
      price:      Number(ci.product?.price        ?? 0),
      comparePrice: Number(ci.product?.compare_price ?? 0),
      qty:        ci.quantity ?? 1,
      image:      ci.product?.primary_image ?? "",
      slug:       ci.product?.slug ?? ci.product_id,
    }));
    setItems(mapped);
    setLoading(false);
  }, [cartItems]);

  const brandGroups = items.reduce((acc, item) => {
    const key = item.brandId ?? item.brand;
    if (!acc[key]) acc[key] = {brandId: item.brandId, brand: item.brand, items: []};
    acc[key].items.push(item);
    return acc;
  }, {});
  const brandGroupList = Object.values(brandGroups);

  const handleShippingSelect = useCallback((brandId, method) => {
    setBrandShipping((prev) => ({...prev, [brandId]: method}));
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  const totalShipping = brandGroupList.reduce((s, g) => {
    const sel = brandShipping[g.brandId];
    if (!sel) return s;
    if (sel.pickupMode) return s;
    const raw = Number(sel.flat_rate ?? sel.base_price ?? sel.rate ?? 0);
    const cur = (sel._currency || sel.currency_code || sel.currency || baseCurrency || "NGN").toUpperCase();
    return s + (convert ? convert(raw, cur) : raw);
  }, 0);

  const discount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : appliedCoupon.value
    : 0;

  const total = Math.max(0, subtotal - discount + totalShipping);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  const hasAtLeastOneShipping = brandGroupList.some((g) => !!brandShipping[g.brandId]);
  const canCheckout = items.length > 0 && hasAtLeastOneShipping;

  const updateQty = async (item, delta) => {
    const newQty = Math.max(1, item.qty + delta);
    const prevQty = item.qty;
    setItems((prev) => prev.map((i) => i.cartItemId === item.cartItemId ? {...i, qty: newQty} : i));
    setUpdatingId(item.cartItemId);
    setQtyError("");
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/user/cart/${item.cartItemId}`, {
        method: "PUT",
        headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
        body: JSON.stringify({quantity: newQty}),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setItems((prev) => prev.map((i) => i.cartItemId === item.cartItemId ? {...i, qty: prevQty} : i));
        setQtyError(json.message || "Couldn't update quantity — not enough stock.");
      }
    } catch {
      setItems((prev) => prev.map((i) => i.cartItemId === item.cartItemId ? {...i, qty: prevQty} : i));
      setQtyError("Couldn't update quantity. Please try again.");
    }
    setUpdatingId(null);
  };

  const handleRemove = async (item) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== item.cartItemId));
    const remaining = items.filter((i) => i.cartItemId !== item.cartItemId && i.brandId === item.brandId);
    if (remaining.length === 0) {
      setBrandShipping((prev) => { const n = {...prev}; delete n[item.brandId]; return n; });
    }
    await removeFromCart(item.cartItemId, item.productId);
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setApplied({...VALID_COUPONS[code], code});
      setCouponError("");
      setCouponSuccess(`Code "${code}" applied — ${VALID_COUPONS[code].label}!`);
    } else {
      setApplied(null); setCouponSuccess(""); setCouponError("Invalid code.");
    }
  };

  const removeCoupon = () => {
    setApplied(null); setCoupon(""); setCouponSuccess(""); setCouponError("");
  };

  const handleCheckout = () => {
    if (!canCheckout) return;

    const brandShippingMap = {};
    brandGroupList.forEach((g) => {
      const sel = brandShipping[g.brandId];
      if (sel) brandShippingMap[g.brandId] = {
        ...sel,
        brandName: g.brand,
      };
    });

    navigate("/checkout", {
      state: {
        source:           "cart",
        coupon:           appliedCoupon,
        discount,
        shipping:         totalShipping,
        subtotal,
        total,
        brandShippingMap,
      },
    });
  };

  if (loading) {
    return (
      <section style={{background: "#000", padding: "80px 48px", textAlign: "center"}}>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 13, letterSpacing: "0.2em"}}>
          LOADING CART...
        </p>
      </section>
    );
  }

  return (
    <section style={{background: "#000", padding: "56px 48px 80px"}}>
      <style>{`
        .cart-wrap { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
        @media (max-width: 960px) { .cart-wrap { grid-template-columns: 1fr; } }
        @media (max-width: 600px) { section { padding: 32px 20px 60px !important; } }

        .cart-head { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 36px; gap: 16px; padding: 10px 20px; margin-bottom: 4px; }
        .cart-head span { color: rgba(255,255,255,0.25); font-size: 9px; font-weight: 900; letter-spacing: 0.28em; text-transform: uppercase; }
        @media (max-width: 640px) { .cart-head { display: none; } }

        .brand-container {
          background: linear-gradient(135deg, rgba(13,13,13,0.6) 0%, rgba(20,20,20,0.4) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }
        .brand-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #ef4444, transparent);
          opacity: 0.4;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          margin-bottom: 12px;
          background: rgba(239,68,68,0.05);
          border-left: 3px solid #ef4444;
          border-radius: 6px;
        }

        .cart-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 36px; gap: 16px; align-items: center; padding: 18px 20px; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; margin-bottom: 10px; background: rgba(0,0,0,0.3); transition: border-color 0.25s; }
        .cart-row:hover { border-color: rgba(255,255,255,0.14); }
        @media (max-width: 640px) { .cart-row { grid-template-columns: 1fr; gap: 12px; } }

        .qty-ctrl { display: inline-flex; align-items: center; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; }
        .qty-btn  { width: 30px; height: 30px; background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s; }
        .qty-btn:hover { background: #ef4444; color: #fff; }
        .qty-num  { width: 32px; text-align: center; color: #fff; font-size: 13px; font-weight: 700; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1); height: 30px; line-height: 30px; background: rgba(255,255,255,0.03); }
        .remove-btn { width: 30px; height: 30px; background: none; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: rgba(255,255,255,0.25); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .remove-btn:hover { background: #ef4444; border-color: #ef4444; color: #fff; }

        .summary-card { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; position: sticky; top: 100px; align-self: start; }
        .summary-row  { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .summary-row:last-of-type { border-bottom: none; }
        .s-label { color: rgba(255,255,255,0.38); font-size: 12px; letter-spacing: 0.06em; }
        .s-value { color: #fff; font-size: 12px; font-weight: 700; }

        .coupon-wrap  { display: flex; gap: 8px; }
        .coupon-input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 12px; padding: 11px 14px; outline: none; border-radius: 8px; transition: border-color 0.2s; letter-spacing: 0.06em; }
        .coupon-input:focus { border-color: rgba(239,68,68,0.6); }
        .coupon-input::placeholder { color: rgba(255,255,255,0.22); }
        .coupon-apply { background: #ef4444; color: #fff; border: none; border-radius: 8px; padding: 0 18px; font-size: 10px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
        .coupon-apply:hover { background: #dc2626; }

        .checkout-hint { font-size: 10px; color: rgba(255,255,255,0.3); text-align: center; margin-top: 10px; letter-spacing: 0.04em; line-height: 1.5; }
      `}</style>

      <div className="cart-wrap">
        <div>
          {items.length === 0 ? (
            <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
              style={{textAlign: "center", padding: "80px 0"}}>
              <p style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem",
                color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em", marginBottom: 8}}>
                Your cart is empty
              </p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, marginBottom: 24}}>
                Add items from the shop to get started.
              </p>
              <Link to="/shop" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 900,
                letterSpacing: "0.22em", textTransform: "uppercase", padding: "12px 28px",
                textDecoration: "none", borderRadius: 8,
              }}>
                Browse Shop →
              </Link>
            </motion.div>
          ) : (
            <>
              {qtyError && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
                  style={{
                    padding: "12px 16px", borderRadius: 10, marginBottom: 16,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                  <AlertIcon />
                  <span style={{color: "#ef4444", fontSize: 11, lineHeight: 1.5}}>{qtyError}</span>
                </motion.div>
              )}
              {brandGroupList.map((group) => (
                <div key={group.brandId ?? group.brand} className="brand-container">
                  <div className="brand-header">
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 900, color: "#fff", fontSize: 14,
                    }}>
                      {group.brand.charAt(0)}
                    </div>
                    <div style={{flex: 1}}>
                      <h3 style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "1.3rem", color: "#fff", margin: 0,
                        letterSpacing: "0.08em",
                      }}>
                        {group.brand}
                      </h3>
                      <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "2px 0 0"}}>
                        {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="section-header">
                      <PackageIcon />
                      <span style={{
                        color: "rgba(255,255,255,0.5)", fontSize: 10,
                        fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase",
                      }}>
                        Products in Cart
                      </span>
                    </div>

                    <div className="cart-head">
                      <span>Product</span>
                      <span>Price</span>
                      <span>Qty</span>
                      <span>Total</span>
                      <span />
                    </div>

                    <AnimatePresence>
                      {group.items.map((item) => (
                        <motion.div key={item.cartItemId} layout exit={{opacity: 0, x: -20}}
                          className="cart-row">
                          <div style={{display: "flex", gap: 14, alignItems: "center"}}>
                            <Link to={`/shop/${item.slug}`} style={{flexShrink: 0}}>
                              {item.image
                                ? <img src={item.image} alt={item.name}
                                    style={{width: 64, height: 64, objectFit: "cover", borderRadius: 8}} />
                                : <div style={{width: 64, height: 64, background: "rgba(255,255,255,0.04)", borderRadius: 8}} />
                              }
                            </Link>
                            <div>
                              <Link to={`/shop/${item.slug}`} style={{
                                color: "#fff", fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "1rem", letterSpacing: "0.05em", textDecoration: "none",
                                display: "block", marginBottom: 4,
                              }}>
                                {item.name}
                              </Link>
                              {item.size !== "—" && (
                                <span style={{
                                  fontSize: 9, color: "rgba(255,255,255,0.3)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  padding: "2px 6px", fontWeight: 700, letterSpacing: "0.1em",
                                  borderRadius: 4,
                                }}>
                                  SIZE {item.size}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span style={{color: "#ef4444", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem"}}>
                              {fmtMoney(item.price, baseCurrency)}
                            </span>
                          </div>
                          <div className="qty-ctrl">
                            <button className="qty-btn" disabled={updatingId === item.cartItemId}
                              onClick={() => updateQty(item, -1)}>−</button>
                            <span className="qty-num">{item.qty}</span>
                            <button className="qty-btn" disabled={updatingId === item.cartItemId}
                              onClick={() => updateQty(item, 1)}>+</button>
                          </div>
                          <span style={{color: "#fff", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem"}}>
                            {fmtMoney(item.price * item.qty, baseCurrency)}
                            </span>
                          <button className="remove-btn" onClick={() => handleRemove(item)}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div style={{marginTop: 20}}>
                    <BrandShippingPanel
                      brand={group.brand}
                      brandId={group.brandId}
                      items={group.items}
                      selected={brandShipping[group.brandId]}
                      onSelect={handleShippingSelect}
                      fmtMoney={fmtMoney}
                      convert={convert}
                      baseCurrency={baseCurrency}
                    />
                  </div>
                </div>
              ))}

              {!hasAtLeastOneShipping && items.length > 0 && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}}
                  style={{
                    padding: "14px 18px", borderRadius: 10, marginTop: 8,
                    background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                  <AlertIcon />
                  <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.5}}>
                    Select at least one shipping method to proceed to checkout.
                  </span>
                </motion.div>
              )}
            </>
          )}
        </div>

        <div className="summary-card">
          <h3 style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem",
            color: "#fff", letterSpacing: "0.08em", marginBottom: 20}}>
            Order Summary
          </h3>

          <div className="summary-row">
            <span className="s-label">Items ({totalQty})</span>
            <span className="s-value">{fmtMoney(subtotal)}</span>
          </div>

          <div className="summary-row" style={{flexDirection: "column", alignItems: "stretch", gap: 6}}>
            <div style={{display: "flex", justifyContent: "space-between"}}>
              <span className="s-label">Shipping</span>
              <span className="s-value" style={{color: totalShipping === 0 && hasAtLeastOneShipping ? "#22c55e" : "#fff"}}>
                {hasAtLeastOneShipping
                  ? (totalShipping === 0 ? "FREE" : fmtMoney(totalShipping))
                  : fmtMoney(0)}
              </span>
            </div>
            {brandGroupList.map((g) => {
              const sel = brandShipping[g.brandId];
              if (!sel) return null;
              const rawBrand = sel.pickupMode ? 0 : Number(sel.flat_rate ?? sel.base_price ?? sel.rate ?? 0);
              const brandCur = (sel._currency || sel.currency_code || sel.currency || baseCurrency || "NGN").toUpperCase();
              const convertedBrand = rawBrand === 0 ? 0 : (convert ? convert(rawBrand, brandCur) : rawBrand);
              return (
                <div key={g.brandId} style={{display: "flex", justifyContent: "space-between", paddingLeft: 8}}>
                  <span style={{color: "rgba(255,255,255,0.25)", fontSize: 10}}>
                    {g.brand} · {sel.pickupMode ? "Pickup" : sel.name}
                  </span>
                  <span style={{color: convertedBrand === 0 ? "#22c55e" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700}}>
                    {convertedBrand === 0 ? "FREE" : fmtMoney(rawBrand, brandCur)}
                  </span>
                </div>
              );
            })}
          </div>

          {appliedCoupon && (
            <div className="summary-row">
              <div>
                <span className="s-label">Coupon </span>
                <span style={{color: "#22c55e", fontSize: 10, fontWeight: 700}}>({appliedCoupon.code})</span>
              </div>
              <span className="s-value" style={{color: "#22c55e"}}>−{fmtMoney(discount)}</span>
            </div>
          )}

          <div className="summary-row">
            <span className="s-label">Taxes</span>
            <span className="s-value">₦0.00</span>
          </div>

          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 20px"}}>
            <span style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem",
              color: "#fff", letterSpacing: "0.08em"}}>TOTAL</span>
            <motion.span key={total} initial={{scale: 1.1, color: "#ef4444"}}
              animate={{scale: 1, color: "#fff"}} transition={{duration: 0.3}}
              style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: "0.04em"}}>
              {fmtMoney(total)}
            </motion.span>
          </div>

          <div style={{marginBottom: 20}}>
            {!appliedCoupon ? (
              <div className="coupon-wrap">
                <input className="coupon-input" placeholder="Coupon code" value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()} />
                <button className="coupon-apply" onClick={applyCoupon}>Apply</button>
              </div>
            ) : (
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 8, padding: "10px 14px"}}>
                <span style={{color: "#22c55e", fontSize: 11, fontWeight: 700}}>{couponSuccess}</span>
                <button onClick={removeCoupon} style={{background: "none", border: "none",
                  color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 14}}>✕</button>
              </div>
            )}
            {couponError && (
              <p style={{color: "#ef4444", fontSize: 10, marginTop: 6}}>{couponError}</p>
            )}
          </div>

          <button onClick={handleCheckout} disabled={!canCheckout}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "15px", border: "none", borderRadius: 10,
              background: canCheckout ? "#ef4444" : "rgba(239,68,68,0.3)",
              color: "#fff", fontSize: 12, fontWeight: 900, letterSpacing: "0.22em",
              textTransform: "uppercase", cursor: canCheckout ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { if (canCheckout) e.currentTarget.style.background = "#dc2626"; }}
            onMouseLeave={(e) => { if (canCheckout) e.currentTarget.style.background = "#ef4444"; }}>
            Proceed to Checkout
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {!canCheckout && items.length > 0 && (
            <p className="checkout-hint">
              Select at least one shipping method to continue.
            </p>
          )}

          <Link to="/shop" style={{display: "block", textAlign: "center", marginTop: 14,
            color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", textDecoration: "none"}}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
}