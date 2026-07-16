import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import {motion, AnimatePresence} from "framer-motion";
import { useGeo } from "../../../../utils/geo";
import {
  getWishlist,
  removeFromWishlist,
  addToWishlist,
} from "../dashboard/dashboard_components/api";
import {usePlatformSettings} from "./dashboard_components/platformsettingscontext";
import {useCurrency} from "../../../../components/currencycontext";
import {getToken} from "../../../../components/cartcontext";
import PhoneInput from "../../../../components/phoneinput";

// ✅ API Base
const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

// Resolve image across different API response shapes
function getImg(p) {
  return (
    p?.primary_image ||
    p?.image_url ||
    p?.thumbnail ||
    p?.images?.[0]?.url ||
    p?.images?.[0]?.image_url ||
    null
  );
}

// ✅ Script loaders
const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const loadFlutterwaveScript = () => {
  return new Promise((resolve, reject) => {
    console.log("📥 Loading Flutterwave script...");
    
    const oldScript = document.querySelector('script[src*="checkout.flutterwave.com"]');
    if (oldScript) {
      console.log("🗑️ Removing old Flutterwave script...");
      oldScript.remove();
    }
    
    if (window.FlutterwaveCheckout) {
      console.log("🗑️ Deleting old FlutterwaveCheckout object...");
      delete window.FlutterwaveCheckout;
    }
    
    document.querySelectorAll('iframe[src*="flutterwave"], .flutterwave-modal, [class*="flw-modal"]').forEach(el => {
      console.log("🗑️ Removing leftover Flutterwave element:", el);
      el.remove();
    });
    
    setTimeout(() => {
      console.log("📥 Loading fresh Flutterwave script...");
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js?v=' + Date.now();
      
      script.onload = () => {
        setTimeout(() => {
          if (window.FlutterwaveCheckout) {
            console.log("✅ Fresh Flutterwave loaded successfully!");
            resolve(window.FlutterwaveCheckout);
          } else {
            console.error("❌ Flutterwave script loaded but object not available");
            reject(new Error('FlutterwaveCheckout not available after load'));
          }
        }, 100);
      };
      
      script.onerror = () => {
        console.error("❌ Failed to load Flutterwave script from CDN");
        reject(new Error('Failed to load Flutterwave script'));
      };
      
      document.body.appendChild(script);
    }, 50);
  });
};

const closePaymentModal = () => {
  if (window.PaystackPop) {
    try {
      const handler = window.PaystackPop;
      if (handler && typeof handler.close === 'function') handler.close();
    } catch(e) { console.warn("Paystack cleanup error:", e); }
  }
  try {
    const iframes = document.querySelectorAll(
      'iframe[src*="flutterwave"], iframe[src*="ravemodal"]'
    );
    iframes.forEach((iframe) => iframe.remove());
    const flwElements = document.querySelectorAll(
      '[class*="flutterwave-modal"], [class*="flw-modal"], [id*="flutterwave-modal"], [id*="flw-modal"]'
    );
    flwElements.forEach((el) => el.remove());
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
  } catch(e) { console.warn("Flutterwave cleanup error:", e); }
};

const STEPS = ["Contact", "Delivery", "Payment", "Review"];

const PAYMENT_METHODS = [
  {id: "card", label: "Credit / Debit Card", icon: "💳", description: "Powered by Paystack"},
  {id: "flutterwave", label: "Flutterwave", icon: "🦋", description: "Mobile Money, Bank & More"},
  {id: "transfer", label: "Bank Transfer", icon: "🏦", description: "Manual Transfer"},
];

const cinp = (err = false) => ({
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${err ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
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

const fr = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)");
const fb = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

function CLabel({c}) {
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

function CErr({m}) {
  return m ? (
    <span style={{color: "#ef4444", fontSize: 10, fontWeight: 700, marginTop: 2, display: "block"}}>
      {m}
    </span>
  ) : null;
}

// ✅ SearchSelect component
function SearchSelect({options, value, onChange, placeholder, disabled}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options.slice(0, 250);
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 250);
  }, [options, query]);

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
    <div style={{position: "relative"}}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(239,68,68,0.55)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 8,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.18s",
          outline: "none",
          fontFamily: "inherit",
        }}>
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
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 6,
            background: "#181818",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 12,
            zIndex: 99999,
            boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
            overflow: "hidden",
            maxHeight: 300,
          }}>
          <div
            style={{
              padding: "10px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "8px 10px",
                color: "#fff",
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>
          <div style={{maxHeight: 260, overflowY: "auto"}}>
            {filtered.length === 0 ? (
              <div style={{padding: 18, color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center"}}>
                No results
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
                    }}>
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
        </div>
      )}
    </div>
  );
}

// ── Size Picker (bottom sheet) ─────────────────────────────────────────────────
function SizePicker({product, onConfirm, onClose}) {
  const {fmtMoney} = usePlatformSettings();
  const [sel, setSel] = useState(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const avail = product.sizes?.filter((s) => s.stock > 0) || [];
  const hasDiscount = product.compare_price > 0 && product.compare_price !== product.price;

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const maxStock = sel ? product.sizes?.find((s) => s.size === sel)?.stock || 10 : 10;
  const go = () => {
    if (avail.length > 0 && !sel) {
      setErr("Please select a size");
      return;
    }
    onConfirm(sel || "One Size", qty);
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
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}>
      <motion.div
        initial={{y: 60, opacity: 0}}
        animate={{y: 0, opacity: 1}}
        exit={{y: 60, opacity: 0}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#111",
          borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(255,255,255,0.1)",
          overflow: "hidden",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.8)",
        }}>
        <div style={{display: "flex", justifyContent: "center", padding: "12px 0 0"}}>
          <div
            style={{width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)"}}
          />
        </div>
        <div style={{padding: "16px 22px 28px"}}>
          <div style={{display: "flex", gap: 12, alignItems: "center", marginBottom: 20}}>
            <img
              src={getImg(product) || "https://placehold.co/60x60/111/333?text=?"}
              alt={product.name}
              style={{
                width: 60,
                height: 60,
                borderRadius: 10,
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            />
            <div style={{flex: 1, minWidth: 0}}>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  margin: 0,
                }}>
                {product.brand_name}
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  margin: "3px 0 4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {product.name}
              </p>
              <div style={{display: "flex", alignItems: "center", gap: 8}}>
                {hasDiscount && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1rem",
                      textDecoration: "line-through",
                      letterSpacing: "0.04em",
                    }}>
                    {fmtMoney(product.compare_price)}
                  </span>
                )}
                <span
                  style={{
                    color: "#ef4444",
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: "1.2rem",
                    letterSpacing: "0.04em",
                  }}>
                  {fmtMoney(product.price)}
                </span>
                {hasDiscount && (
                  <span
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: "#22c55e",
                      fontSize: 8,
                      fontWeight: 900,
                      letterSpacing: "0.1em",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}>
                    SAVE {fmtMoney(product.compare_price - product.price)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
              <svg
                width="11"
                height="11"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {avail.length > 0 && (
            <>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}>
                Select Size
              </p>
              <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20}}>
                {product.sizes?.map((sz) => (
                  <button
                    key={sz.id}
                    disabled={sz.stock === 0}
                    onClick={() => {
                      setSel(sz.size);
                      setErr("");
                    }}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 8,
                      border: `1px solid ${sel === sz.size ? "#ef4444" : sz.stock > 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                      background:
                        sel === sz.size
                          ? "rgba(239,68,68,0.12)"
                          : sz.stock > 0
                            ? "rgba(255,255,255,0.04)"
                            : "transparent",
                      color:
                        sel === sz.size
                          ? "#ef4444"
                          : sz.stock > 0
                            ? "rgba(255,255,255,0.7)"
                            : "rgba(255,255,255,0.2)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: sz.stock === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      textDecoration: sz.stock === 0 ? "line-through" : "none",
                      position: "relative",
                    }}>
                    {sz.size}
                    {sz.stock > 0 && sz.stock <= 3 && (
                      <span
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          background: "#f59e0b",
                          borderRadius: "50%",
                          width: 7,
                          height: 7,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
              {err && (
                <p
                  style={{color: "#ef4444", fontSize: 11, fontWeight: 700, margin: "-12px 0 14px"}}>
                  {err}
                </p>
              )}
            </>
          )}

          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}>
            Quantity
          </p>
          <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 22}}>
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}>
              −
            </button>
            <span
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
                width: 28,
                textAlign: "center",
              }}>
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}>
              +
            </button>
            <div style={{marginLeft: 4}}>
              {hasDiscount && (
                <span
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 10,
                    textDecoration: "line-through",
                    display: "block",
                    lineHeight: 1,
                  }}>
                  {fmtMoney(product.compare_price * qty)}
                </span>
              )}
              <span style={{color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700}}>
                {fmtMoney(product.price * qty)} total
              </span>
            </div>
          </div>

          <button
            onClick={go}
            style={{
              width: "100%",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "15px",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
            Proceed to Checkout →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Quick Checkout modal ────────────────────────────────────────────────────────
function QuickCheckout({product, size, qty, onClose}) {
const {fmtMoney} = usePlatformSettings();
  const {convert, userCurrency, baseCurrency} = useCurrency();
  const { Country, State, City, loaded: geoLoaded } = useGeo();

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderRef, setOrderRef] = useState("");
  
 const paymentTimeoutRef = useRef(null);
  const paystackHandlerRef = useRef(null);
  const flutterwaveModalRef = useRef(null);
  const flwCloseHandledRef = useRef(false);
  const [paymentStuck, setPaymentStuck] = useState(false);
  
  const [shippingData, setShippingData] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState(null);
  
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
  const [payment, setPayment] = useState({
    method: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });

const countryOptions = useMemo(() => {
    if (!geoLoaded) return [];
    return Country.getAllCountries().map(c => ({
      value: c.isoCode,
      label: c.name,
      flag: c.flag
    }));
  }, [geoLoaded, Country]);

  const stateOptions = useMemo(() => {
    if (!geoLoaded || !delivery.country_code) return [];
    return State.getStatesOfCountry(delivery.country_code).map(s => ({
      value: s.isoCode,
      label: s.name,
    }));
  }, [geoLoaded, State, delivery.country_code]);

  const cityOptions = useMemo(() => {
    if (!geoLoaded || !delivery.country_code || !delivery.state_code) return [];
    return City.getCitiesOfState(delivery.country_code, delivery.state_code).map(c => ({
      value: c.name,
      label: c.name,
    }));
  }, [geoLoaded, City, delivery.country_code, delivery.state_code]);

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
      const locations = method.locations || [];
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
          (s) =>
            s.name.toLowerCase().includes(loc.state.toLowerCase()) ||
            loc.state.toLowerCase().includes(s.name.toLowerCase())
        );
        if (stateObj) {
          result.state_code = stateObj.isoCode;
          result.state_name = stateObj.name;
        }
      }
    }
    return result;
  }, [geoLoaded, Country, State]);

const handleShippingMethodSelect = useCallback((method) => {
    setSelectedShippingMethod(method);
    if (!delivery.country_code && geoLoaded) {
      const locationData = extractLocationFromMethod(method);
      if (Object.keys(locationData).length > 0) {
        setDelivery((prev) => ({...prev, ...locationData}));
      }
    }
  }, [delivery.country_code, geoLoaded, extractLocationFromMethod]);

  const getFilteredShippingOptions = useCallback(() => {
    if (!shippingData) return [];

    const zoneMethods = (shippingData.zones || []).flatMap((zone) =>
      (zone.methods || []).map((m) => ({
        ...m,
        type: "zone",
        zoneName: zone.name,
        locations: zone.locations || [],
      }))
    );

    const localRates = (shippingData.local || []).map((l) => ({
      ...l,
      type: "local",
      name: `Local Shipping - ${l.city || l.state || l.country}`,
      flat_rate: Number(l.base_price || 0),
      rate: Number(l.base_price || 0),
      _currency: (l.currency_code || l.currency || baseCurrency || "NGN").toUpperCase(),
    }));

    const allMethods = [...zoneMethods, ...localRates];

    if (!delivery.country_name && !delivery.state_name && !delivery.city) {
      return allMethods;
    }

    return allMethods.filter((method) => {
      if (method.type === "zone") {
        if (!method.locations || method.locations.length === 0) return true;
        return method.locations.some((loc) => {
          if (delivery.country_name && loc.country) {
            if (loc.country.toLowerCase() !== delivery.country_name.toLowerCase()) return false;
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
          if (method.country.toLowerCase() !== delivery.country_name.toLowerCase()) return false;
        }
        if (delivery.state_name && method.state) {
          if (method.state.toLowerCase() !== delivery.state_name.toLowerCase()) return false;
        }
        if (delivery.city && method.city) {
          if (method.city.toLowerCase() !== delivery.city.toLowerCase()) return false;
        }
        return true;
      }
    });
  }, [shippingData, baseCurrency, delivery.country_name, delivery.state_name, delivery.city]);

  useEffect(() => {
    if (!product.brand_id) return;
    
    setShippingLoading(true);
    fetch(`${API_BASE}/api/shop/brands/${product.brand_id}/shipping`)
      .then(r => r.json())
      .then(json => {
        const data = json?.data ?? json;
        setShippingData(data);
        if (data?.pickups?.length > 0) {
          setSelectedPickupLocation(data.pickups[0]);
        }
      })
      .catch(() => setShippingData(null))
      .finally(() => setShippingLoading(false));
  }, [product.brand_id]);

  const itemTotal = useMemo(() => {
    const rawPrice = product.price * qty;
    return convert ? convert(rawPrice, baseCurrency) : rawPrice;
  }, [product.price, qty, convert, baseCurrency]);

  const deliveryCost = useMemo(() => {
    if (deliveryMode !== "delivery" || !selectedShippingMethod) return 0;
    
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
    
    return convert ? convert(rawPrice, fromCurrency) : rawPrice;
  }, [selectedShippingMethod, deliveryMode, convert, baseCurrency]);

  const orderTotal = Math.max(0, itemTotal + deliveryCost);
  const hasDiscount = product.compare_price > 0 && product.compare_price !== product.price;

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
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
        if (!selectedShippingMethod) e.shipping = "Please select a shipping method";
      } else {
        if (!selectedPickupLocation) e.pickup = "Please select a pickup location";
      }
    }
    if (step === 2 && payment.method === "transfer" && !receipt)
      e.receipt = "Please upload receipt";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

useEffect(() => {
    if (placing && !done) {
      paymentTimeoutRef.current = setTimeout(() => {
        flwCloseHandledRef.current = true;
        closePaymentModal();
        paystackHandlerRef.current = null;
        flutterwaveModalRef.current = null;
        setPaymentStuck(false);
        setPlacing(false);
        setOrderError(
          "⏱️ Payment window timed out. Click 'Place Order' again to retry. " +
          "If you were charged, do NOT pay again - contact blvckmrkt.market@gmail.com with your reference."
        );
      }, 10800000);
      return () => {
        if (paymentTimeoutRef.current) {
          clearTimeout(paymentTimeoutRef.current);
          paymentTimeoutRef.current = null;
        }
      };
    }
  }, [placing, done]);

  useEffect(() => {
    setPaymentStuck(false);
    setOrderError("");
  }, [step]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape" && !done && !placing) onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [done, placing, onClose]);

  const handlePaymentSuccess = useCallback(async (paymentRef, gateway) => {
    console.log("🔄 Starting handlePaymentSuccess...", { paymentRef, gateway });
    
    setPlacing(true);
    setOrderError("");
    
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
    }
    
    try {
      const token = getToken();

      const body = {
        source: "buyNow",
        items: [{
          product_id: product.id,
          quantity: qty,
          size: size,
          unit_price: product.price,
        }],
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
                shipping_method_id: selectedShippingMethod?.type === "zone" ? selectedShippingMethod?.id : null,
                local_shipping_rate_id: selectedShippingMethod?.type === "local" ? selectedShippingMethod?.id : null,
              },
            }
          : {
              pickup: {
                pickup_location_id: selectedPickupLocation?.id,
              },
            }),
        payment: {
          method: gateway,
          reference: paymentRef,
        },
        subtotal: itemTotal,
        discount: 0,
        shipping_cost: deliveryCost,
        total: orderTotal,
        currency: userCurrency,
      };

      const res = await fetch(`${API_BASE}/api/user/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify(body),
      });

      const responseText = await res.text();
      let json;
      
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned invalid response. Status: ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(json.error || json.message || `Server error: ${res.status}`);
      }

      const ref = 
        json?.data?.reference || 
        json?.data?.order?.reference || 
        json?.data?.order?.display_id ||
        json?.data?.display_id ||
        paymentRef;

      setOrderRef(ref);
      setDone(true);
      
    } catch (error) {
      console.error("❌ Order creation failed:", error);
      setOrderError(
        "Payment received but order could not be confirmed. " +
        "Do NOT pay again. Contact blvckmrkt.market@gmail.com with reference: " +
        paymentRef
      );
    } finally {
      setPlacing(false);
    }
  }, [product, qty, size, contact, deliveryMode, delivery, selectedShippingMethod, selectedPickupLocation, itemTotal, deliveryCost, orderTotal, userCurrency]);

  const placeOrder = async () => {
    if (!validate()) return;

    if (payment.method === "card") {
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      
      try {
        const PaystackPop = await loadPaystackScript();
        
        const handler = PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: contact.email,
          amount: Math.round(orderTotal * 100),
          currency: userCurrency,
          ref: `BLVCK-${Date.now()}`,
          metadata: {
            custom_fields: [{
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: `${delivery.firstName} ${delivery.lastName}`.trim() || "Guest",
            }],
          },
          callback: function(response) {
            handlePaymentSuccess(response.reference, "paystack");
          },
          onClose: function() {
            if (paymentTimeoutRef.current) {
              clearTimeout(paymentTimeoutRef.current);
              paymentTimeoutRef.current = null;
            }
            paystackHandlerRef.current = null;
            setOrderError("Payment cancelled. Please try again.");
            setPlacing(false);
            setPaymentStuck(false);
          },
        });
        
        handler.openIframe();
        paystackHandlerRef.current = handler;
        
      } catch (error) {
        setOrderError("Failed to initialize payment. Please try again.");
        setPlacing(false);
      }
      return;
    }

if (payment.method === "flutterwave") {
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      flwCloseHandledRef.current = false;

      try {
        const FlutterwaveCheckout = await loadFlutterwaveScript();

        const txRef = `BLVCK-FLW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const config = {
          public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
          tx_ref: txRef,
          amount: Math.max(100, Math.round(orderTotal)),
          currency: "NGN",
          payment_options: "card,mobilemoney,ussd,banktransfer",
          customer: {
            email: contact.email,
            phone_number: contact.phone,
            name: `${delivery.firstName} ${delivery.lastName}`.trim() || "Guest",
          },
          customizations: {
            title: "BLVCKMRKT",
            description: "Order Payment",
            logo: "https://blvckmrktng.com/logo.png",
          },
          callback: function(response) {
            flwCloseHandledRef.current = true;
            if (paymentTimeoutRef.current) {
              clearTimeout(paymentTimeoutRef.current);
              paymentTimeoutRef.current = null;
            }
            const ref = String(
              response?.transaction_id ||
              response?.flw_ref ||
              response?.tx_ref ||
              txRef
            );
            handlePaymentSuccess(ref, "flutterwave");
          },
          onclose: function() {
            if (flwCloseHandledRef.current) return;
            flwCloseHandledRef.current = true;
            if (paymentTimeoutRef.current) {
              clearTimeout(paymentTimeoutRef.current);
              paymentTimeoutRef.current = null;
            }
            setTimeout(() => {
              closePaymentModal();
            }, 1000);
            flutterwaveModalRef.current = null;
            setOrderError("Payment cancelled. Click 'Place Order' to try again.");
            setPlacing(false);
            setPaymentStuck(false);
          },
        };

        const modal = FlutterwaveCheckout(config);
        flutterwaveModalRef.current = modal;

      } catch(error) {
        setOrderError("Failed to open Flutterwave: " + error.message);
        setPlacing(false);
        setPaymentStuck(false);
      }
      return;
    }

    if (payment.method === "transfer") {
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      
      try {
        const token = getToken();
        let receiptUrl = null;

        if (receipt) {
          const formData = new FormData();
          formData.append("receipt", receipt);

          const uploadRes = await fetch(`${API_BASE}/api/upload/receipt`, {
            method: "POST",
            headers: {
              ...(token ? {Authorization: `Bearer ${token}`} : {}),
            },
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            receiptUrl = uploadJson.url || uploadJson.data?.url;
          }
        }

        const body = {
          source: "buyNow",
          items: [{
            product_id: product.id,
            quantity: qty,
            size: size,
            unit_price: product.price,
          }],
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
                  shipping_method_id: selectedShippingMethod?.type === "zone" ? selectedShippingMethod?.id : null,
                  local_shipping_rate_id: selectedShippingMethod?.type === "local" ? selectedShippingMethod?.id : null,
                },
              }
            : {
                pickup: {
                  pickup_location_id: selectedPickupLocation?.id,
                },
              }),
          payment: {
            method: "transfer",
            receipt_url: receiptUrl,
          },
          subtotal: itemTotal,
          discount: 0,
          shipping_cost: deliveryCost,
          total: orderTotal,
          currency: userCurrency,
        };

        const res = await fetch(`${API_BASE}/api/user/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
          },
          body: JSON.stringify(body),
        });

        const responseText = await res.text();
        const json = JSON.parse(responseText);
        
        if (!res.ok) {
          throw new Error(json.error || "Failed to create order");
        }

        const ref = json?.data?.reference ?? json?.data?.order?.reference ?? 
                   "BLVCK-" + Math.random().toString(36).slice(2, 8).toUpperCase();

        setOrderRef(ref);
        setDone(true);
        
      } catch (error) {
        setOrderError(error.message || "Failed to place order.");
      } finally {
        setPlacing(false);
      }
    }
  };

  // ✅ Order confirmed screen
  if (done)
    return (
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}>
        <motion.div
          initial={{opacity: 0, scale: 0.94}}
          animate={{opacity: 1, scale: 1}}
          style={{maxWidth: 480, width: "100%", textAlign: "center"}}>
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
            <svg
              width="36"
              height="36"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
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
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.3}}>
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
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "clamp(2rem,5vw,3rem)",
                color: "#fff",
                letterSpacing: "0.05em",
                lineHeight: 1,
                marginBottom: 14,
              }}>
              YOU'RE <span style={{color: "#ef4444"}}>ALL SET!</span>
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                lineHeight: 1.7,
                marginBottom: 28,
              }}>
              Your order for <strong style={{color: "#fff"}}>{product.name}</strong> has been
              placed. Confirmation sent to <strong style={{color: "#fff"}}>{contact.email}</strong>.
            </p>
            <div
              style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "14px 22px",
                marginBottom: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
              <span
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                Order Reference
              </span>
              <span
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1.2rem",
                  color: "#ef4444",
                  letterSpacing: "0.1em",
                }}>
                {orderRef || `BLVCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "13px 32px",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
              Back to Wishlist →
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    );

  // ✅ Main checkout modal
  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget && !placing) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 2000,
        overflowY: "auto",
        padding: "40px 16px",
      }}>
      <motion.div
        initial={{opacity: 0, y: 24}}
        animate={{opacity: 1, y: 0}}
        transition={{type: "spring", stiffness: 260, damping: 26}}
        style={{
          maxWidth: 660,
          margin: "0 auto",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.9)",
        }}>
        
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}>
          <div style={{display: "flex", alignItems: "center", gap: 12, minWidth: 0}}>
            <img
              src={getImg(product) || "https://placehold.co/48x48/111/333?text=?"}
              alt={product.name}
              style={{
                width: 44,
                height: 44,
                borderRadius: 9,
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            />
            <div style={{minWidth: 0}}>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: 0,
                }}>
                {product.brand_name}
              </p>
              <p
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  margin: "2px 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {product.name} · Size {size} · Qty {qty}
              </p>
            </div>
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 10, flexShrink: 0}}>
            <div style={{textAlign: "right"}}>
              {hasDiscount && (
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: "0.9rem",
                    textDecoration: "line-through",
                    letterSpacing: "0.04em",
                    margin: 0,
                    lineHeight: 1,
                  }}>
                  {fmtMoney(product.compare_price * qty + deliveryCost)}
                </p>
              )}
              <span
                style={{
                  color: "#ef4444",
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1.2rem",
                  letterSpacing: "0.04em",
                }}>
                {fmtMoney(orderTotal)}
              </span>
            </div>
            <button
              onClick={onClose}
              disabled={placing}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: placing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: placing ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!placing) {
                  e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!placing) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }
              }}>
              <svg
                width="11"
                height="11"
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="2.5"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div style={{padding: "16px 24px 0", display: "flex", alignItems: "center"}}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                flex: i < STEPS.length - 1 ? 1 : "none",
              }}>
              <div style={{display: "flex", alignItems: "center", gap: 5, flexShrink: 0}}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 900,
                    background:
                      i < step ? "#22c55e" : i === step ? "#ef4444" : "rgba(255,255,255,0.07)",
                    color: "#fff",
                    transition: "all 0.3s",
                  }}>
                  {i < step ? (
                    <svg
                      width="9"
                      height="9"
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
                  className="step-label"
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: i < step ? "#22c55e" : i === step ? "#fff" : "rgba(255,255,255,0.2)",
                    whiteSpace: "nowrap",
                  }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: i < step ? "#22c55e" : "rgba(255,255,255,0.08)",
                    margin: "0 6px",
                    transition: "background 0.3s",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form body */}
        <div style={{padding: "20px 24px 24px"}}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{opacity: 0, x: 16}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: -16}}
              transition={{duration: 0.2}}>

              {/* STEP 0 — Contact */}
              {step === 0 && (
                <div>
                  <p
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.1rem",
                      color: "#fff",
                      letterSpacing: "0.08em",
                      margin: "0 0 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                    <span
                      style={{width: 3, height: 16, background: "#ef4444", display: "inline-block"}}
                    />
                    Contact Information
                  </p>
                  
                  <div style={{marginBottom: 12}}>
                    <CLabel c="Email Address *" />
                    <input
                      style={cinp(!!errors.email)}
                      type="email"
                      placeholder="you@example.com"
                      value={contact.email}
                      onChange={(e) => setContact({...contact, email: e.target.value})}
                      onFocus={fr}
                      onBlur={fb}
                    />
                    <CErr m={errors.email} />
                  </div>

                  <div style={{marginBottom: 12}}>
                    <CLabel c="Phone Number *" />
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

                  <div
                    style={{display: "flex", alignItems: "center", gap: 9, cursor: "pointer"}}
                    onClick={() => setContact((c) => ({...c, subscribe: !c.subscribe}))}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: `1px solid ${contact.subscribe ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                        borderRadius: 3,
                        background: contact.subscribe ? "#ef4444" : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
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

              {/* STEP 1 — Delivery */}
              {step === 1 && (
                <div>
                  {/* Delivery/Pickup Mode Toggle */}
                  <div style={{
                    display: "inline-flex",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: 4,
                    marginBottom: 20,
                  }}>
                    {[
                      {id: "delivery", icon: "🚚", label: "Delivery"},
                      {id: "pickup", icon: "🏪", label: "Pickup"},
                    ].map(({id, icon, label}) => (
                      <button
                        key={id}
                        onClick={() => setDeliveryMode(id)}
                        style={{
                          padding: "10px 24px",
                          border: "none",
                          background: deliveryMode === id ? "#ef4444" : "transparent",
                          color: deliveryMode === id ? "#fff" : "rgba(255,255,255,0.4)",
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          borderRadius: 7,
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}>
                        <span style={{fontSize: 13}}>{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>

                  {deliveryMode === "delivery" ? (
                    <>
                      {/* DELIVERY ADDRESS FORM */}
                      <p
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1.1rem",
                          color: "#fff",
                          letterSpacing: "0.08em",
                          margin: "0 0 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                        <span style={{width: 3, height: 16, background: "#ef4444", display: "inline-block"}} />
                        Delivery Address
                      </p>

                      {/* Country */}
                      <div style={{marginBottom: 12}}>
                        <CLabel c="Country *" />
                        <SearchSelect
                          options={countryOptions}
                          value={delivery.country_code}
                          onChange={(code) => {
                            const c = geoLoaded ? Country.getCountryByCode(code) : null;
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
                          placeholder="Select country…"
                        />
                        <CErr m={errors.country} />
                      </div>

                      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}} className="co-2col">
                        <div>
                          <CLabel c="First Name *" />
                          <input
                            style={cinp(!!errors.firstName)}
                            placeholder="John"
                            value={delivery.firstName}
                            onChange={(e) => setDelivery({...delivery, firstName: e.target.value})}
                            onFocus={fr}
                            onBlur={fb}
                          />
                          <CErr m={errors.firstName} />
                        </div>
                        <div>
                          <CLabel c="Last Name *" />
                          <input
                            style={cinp(!!errors.lastName)}
                            placeholder="Doe"
                            value={delivery.lastName}
                            onChange={(e) => setDelivery({...delivery, lastName: e.target.value})}
                            onFocus={fr}
                            onBlur={fb}
                          />
                          <CErr m={errors.lastName} />
                        </div>
                      </div>

                      <div style={{marginBottom: 12}}>
                        <CLabel c="Street Address *" />
                        <input
                          style={cinp(!!errors.address)}
                          placeholder="12 Victoria Island Road"
                          value={delivery.address}
                          onChange={(e) => setDelivery({...delivery, address: e.target.value})}
                          onFocus={fr}
                          onBlur={fb}
                        />
                        <CErr m={errors.address} />
                      </div>

                      <div style={{marginBottom: 12}}>
                        <CLabel c="Apt / Suite (optional)" />
                        <input
                          style={cinp(false)}
                          placeholder="Apt 4B"
                          value={delivery.apt}
                          onChange={(e) => setDelivery({...delivery, apt: e.target.value})}
                          onFocus={fr}
                          onBlur={fb}
                        />
                      </div>

                      {/* State */}
                      {delivery.country_code && (
                        <div style={{marginBottom: 12}}>
                          <CLabel c="State / Region *" />
                          <SearchSelect
                            options={stateOptions}
                            value={delivery.state_code}
                            onChange={(iso) => {
                              const s = geoLoaded ? State.getStateByCodeAndCountry(iso, delivery.country_code) : null;
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
                      )}

                      {/* City */}
                      {delivery.state_code && (
                        <div style={{marginBottom: 12}}>
                          <CLabel c="City *" />
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
                              style={cinp(!!errors.city)}
                              placeholder="Type city name…"
                              value={delivery.city}
                              onChange={(e) => setDelivery({...delivery, city: e.target.value})}
                              onFocus={fr}
                              onBlur={fb}
                            />
                          )}
                          <CErr m={errors.city} />
                        </div>
                      )}

                      <div style={{marginBottom: 20}}>
                        <CLabel c="Postcode / ZIP *" />
                        <input
                          style={cinp(!!errors.zip)}
                          placeholder="100001"
                          value={delivery.zip}
                          onChange={(e) => setDelivery({...delivery, zip: e.target.value})}
                          onFocus={fr}
                          onBlur={fb}
                        />
                        <CErr m={errors.zip} />
                      </div>

                      {/* SHIPPING METHODS */}
                      <p
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1rem",
                          color: "#fff",
                          letterSpacing: "0.08em",
                          margin: "0 0 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                        <span style={{width: 3, height: 14, background: "#ef4444", display: "inline-block"}} />
                        Shipping Method
                      </p>

{!delivery.country_code && !delivery.state_name && !delivery.city && (
                        <div style={{
                          padding: "12px 14px",
                          background: "rgba(34,197,94,0.05)",
                          border: "1px solid rgba(34,197,94,0.2)",
                          borderRadius: 10,
                          marginBottom: 12,
                        }}>
                          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0}}>
                            💡 <strong style={{color: "#22c55e"}}>Tip:</strong> Select a shipping method below to auto-fill your location, or fill your address first to filter methods.
                          </p>
                        </div>
                      )}
                      {shippingLoading ? (
                        <div style={{
                          height: 56,
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: 10,
                          animation: "pulse 1.4s infinite",
                        }} />
                      ) : getFilteredShippingOptions().length === 0 ? (
                        <div style={{
                          padding: "16px",
                          background: "rgba(239,68,68,0.05)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 10,
                        }}>
                          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 4px"}}>
                            🚫 No shipping available
                            {delivery.country_name && (
                              <> to <strong style={{color: "#ef4444"}}>{delivery.country_name}{delivery.state_name ? `, ${delivery.state_name}` : ""}{delivery.city ? `, ${delivery.city}` : ""}</strong></>
                            )}
                          </p>
                          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "6px 0 0"}}>
                            Try pickup instead or contact support.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div style={{marginBottom: 8, color: "rgba(255,255,255,0.3)", fontSize: 10}}>
                            {delivery.country_name ? (
                              <span>Showing methods for <strong style={{color: "#fff"}}>{delivery.country_name}{delivery.state_name ? `, ${delivery.state_name}` : ""}{delivery.city ? `, ${delivery.city}` : ""}</strong></span>
                            ) : (
                              <span>Showing all {getFilteredShippingOptions().length} available method{getFilteredShippingOptions().length !== 1 ? "s" : ""}</span>
                            )}
                          </div>
                          {getFilteredShippingOptions().map((method) => {
                            const isSelected = selectedShippingMethod?.id === method.id && selectedShippingMethod?.type === method.type;
                            const rawPrice = Number(method.flat_rate || method.base_price || method.rate || 0);
                            const methodCur = (method._currency || method.currency_code || method.currency || baseCurrency || "NGN").toUpperCase();
                            const convertedPrice = convert ? convert(rawPrice, methodCur) : rawPrice;
                            const priceLabel = rawPrice === 0 ? "FREE" : fmtMoney(convertedPrice);

                            return (
                              <div
                                key={`${method.type}-${method.id}`}
                                onClick={() => handleShippingMethodSelect(method)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "12px 14px",
                                  border: `1px solid ${isSelected ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                                  borderRadius: 10,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  marginBottom: 8,
                                  background: isSelected ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                                }}>
                                <div style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  border: `2px solid ${isSelected ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}>
                                  {isSelected && <div style={{width: 8, height: 8, borderRadius: "50%", background: "#ef4444"}} />}
                                </div>
                                <div style={{flex: 1}}>
                                  <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 2}}>
                                    <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>
                                      {method.name}
                                    </p>
                                    {method.type === "local" && (
                                      <span style={{
                                        background: "rgba(34,197,94,0.1)",
                                        border: "1px solid rgba(34,197,94,0.3)",
                                        color: "#22c55e",
                                        fontSize: 7, fontWeight: 900, letterSpacing: "0.1em",
                                        textTransform: "uppercase", padding: "1px 5px", borderRadius: 3,
                                      }}>LOCAL</span>
                                    )}
                                  </div>
                                  {method.description && (
                                    <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "0 0 2px"}}>
                                      {method.description}
                                    </p>
                                  )}
                                  {method.type === "zone" && method.locations && method.locations.length > 0 && (
                                    <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "2px 0"}}>
                                      📍 {method.locations.map((l) => l.state || l.country).join(", ")}
                                    </p>
                                  )}
                                  {method.type === "local" && (
                                    <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "2px 0"}}>
                                      📍 {[method.city, method.state, method.country].filter(Boolean).join(", ")}
                                    </p>
                                  )}
                                  {method.min_days && method.max_days && (
                                    <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "2px 0 0"}}>
                                      ⏱ Est. {method.min_days}–{method.max_days} days
                                    </p>
                                  )}
                                </div>
                                <span style={{
                                  fontFamily: "'Bebas Neue',sans-serif",
                                  fontSize: "1rem",
                                  color: rawPrice === 0 ? "#22c55e" : "#fff",
                                  flexShrink: 0,
                                }}>
                                  {priceLabel}
                                </span>
                              </div>
                            );
                          })}
                        </>
                      )}
                      <CErr m={errors.shipping} />
                    </>
                  ) : (
                    <>
                      {/* PICKUP LOCATIONS */}
                      <p
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1.1rem",
                          color: "#fff",
                          letterSpacing: "0.08em",
                          margin: "0 0 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                        <span style={{width: 3, height: 16, background: "#ef4444", display: "inline-block"}} />
                        Select Pickup Location
                      </p>

                      {shippingLoading ? (
                        <div style={{
                          height: 80,
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: 10,
                          animation: "pulse 1.4s infinite",
                        }} />
                      ) : !shippingData?.pickups || shippingData.pickups.length === 0 ? (
                        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
                          No pickup locations available
                        </p>
                      ) : (
                        shippingData.pickups.map((pickup) => {
                          const isSelected = selectedPickupLocation?.id === pickup.id;
                          return (
                            <div
                              key={pickup.id}
                              onClick={() => setSelectedPickupLocation(pickup)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "12px 14px",
                                border: `1px solid ${isSelected ? "rgba(147,51,234,0.5)" : "rgba(255,255,255,0.08)"}`,
                                borderRadius: 10,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                marginBottom: 8,
                                background: isSelected ? "rgba(147,51,234,0.07)" : "rgba(255,255,255,0.02)",
                              }}>
                              <div style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: `2px solid ${isSelected ? "#9333ea" : "rgba(255,255,255,0.2)"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}>
                                {isSelected && <div style={{width: 8, height: 8, borderRadius: "50%", background: "#9333ea"}} />}
                              </div>
                              <div style={{flex: 1}}>
                                <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 2px"}}>
                                  {pickup.name}
                                </p>
                                <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0}}>
                                  {pickup.address}, {pickup.city}
                                  {pickup.state && `, ${pickup.state}`}
                                </p>
                                {pickup.phone && (
                                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "2px 0 0"}}>
                                    📞 {pickup.phone}
                                  </p>
                                )}
                              </div>
                              <span style={{color: "#22c55e", fontSize: 13, fontWeight: 800}}>FREE</span>
                            </div>
                          );
                        })
                      )}
                      <CErr m={errors.pickup} />
                    </>
                  )}
                </div>
              )}

              {/* STEP 2 — Payment */}
              {step === 2 && (
                <div>
                  <p
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.1rem",
                      color: "#fff",
                      letterSpacing: "0.08em",
                      margin: "0 0 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                    <span
                      style={{width: 3, height: 16, background: "#ef4444", display: "inline-block"}}
                    />
                    Payment Method
                  </p>
                  <div style={{display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap"}}>
                    {PAYMENT_METHODS.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setPayment({...payment, method: m.id})}
                        style={{
                          flex: 1,
                          minWidth: 140,
                          padding: "14px 12px",
                          border: `1px solid ${payment.method === m.id ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                          borderRadius: 10,
                          background:
                            payment.method === m.id
                              ? "rgba(239,68,68,0.08)"
                              : "rgba(255,255,255,0.02)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.2s",
                        }}>
                        <span style={{fontSize: 24}}>{m.icon}</span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: payment.method === m.id ? "#fff" : "rgba(255,255,255,0.4)",
                            textAlign: "center",
                          }}>
                          {m.label}
                        </span>
                        {m.description && (
                          <span
                            style={{
                              fontSize: 8,
                              color: "rgba(255,255,255,0.25)",
                              textAlign: "center",
                            }}>
                            {m.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {payment.method === "card" && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "20px 18px",
                        textAlign: "center",
                      }}>
                      <p style={{fontSize: "2rem", marginBottom: 10}}>💳</p>
                      <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6}}>
                        You'll be redirected to <strong style={{color: "#fff"}}>Paystack</strong> to
                        complete your payment securely after reviewing your order.
                      </p>
                      <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 8}}>
                        🔒 Encrypted & Secure Payment
                      </p>
                    </div>
                  )}

                  {payment.method === "flutterwave" && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "20px 18px",
                        textAlign: "center",
                      }}>
                      <p style={{fontSize: "2rem", marginBottom: 10}}>🦋</p>
                      <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.6}}>
                        You'll be redirected to <strong style={{color: "#fff"}}>Flutterwave</strong> to
                        complete payment via Mobile Money, Bank Transfer, Card & more.
                      </p>
                      <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 8}}>
                        🔒 Multiple Payment Options
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
                          padding: "16px 18px",
                          marginBottom: 14,
                        }}>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.28)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            marginBottom: 10,
                          }}>
                          Bank Transfer Instructions
                        </p>
                        {[
                          {l: "Bank", v: "First Bank of Nigeria"},
                          {l: "Account Name", v: "BLVCKMRKT Limited"},
                          {l: "Account No.", v: "3012 4567 89"},
                          {l: "Amount", v: fmtMoney(orderTotal)},
                          {l: "Reference", v: `ORDER-${Date.now().toString().slice(-6)}`},
                        ].map((r) => (
                          <div
                            key={r.l}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "6px 0",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                            }}>
                            <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
                              {r.l}
                            </span>
                            <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>
                              {r.v}
                            </span>
                          </div>
                        ))}
                      </div>
                      <CLabel c="Upload Payment Receipt *" />
                      <div
                        onClick={() => document.getElementById("wl-brand-receipt").click()}
                        style={{
                          border: `2px dashed ${errors.receipt ? "#ef4444" : receipt ? "#22c55e" : "rgba(255,255,255,0.15)"}`,
                          borderRadius: 12,
                          padding: "28px 16px",
                          textAlign: "center",
                          cursor: "pointer",
                          background: receipt ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)",
                          transition: "all 0.2s",
                        }}>
                        {receipt ? (
                          <>
                            <p
                              style={{
                                color: "#22c55e",
                                fontSize: 12,
                                fontWeight: 700,
                                margin: "0 0 6px",
                              }}>
                              ✓ {receipt.name}
                            </p>
                            <span
                              style={{
                                color: "#ef4444",
                                fontSize: 10,
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setReceipt(null);
                              }}>
                              Remove
                            </span>
                          </>
                        ) : (
                          <>
                            <p
                              style={{
                                fontSize: "2rem",
                                margin: "0 0 8px",
                              }}>
                              📤
                            </p>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.45)",
                                fontSize: 12,
                                margin: "0 0 3px",
                              }}>
                              Click to upload receipt
                            </p>
                            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                              PNG, JPG, PDF — max 5MB
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        id="wl-brand-receipt"
                        type="file"
                        accept="image/*,application/pdf"
                        style={{display: "none"}}
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (f && f.size <= 5 * 1024 * 1024) {
                            setReceipt(f);
                            setErrors((p) => ({...p, receipt: null}));
                          } else if (f) {
                            setErrors((p) => ({...p, receipt: "File too large (max 5MB)"}));
                          }
                        }}
                      />
                      <CErr m={errors.receipt} />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 — Review */}
              {step === 3 && (
                <div>
                  <p
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.1rem",
                      color: "#fff",
                      letterSpacing: "0.08em",
                      margin: "0 0 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                    <span
                      style={{width: 3, height: 16, background: "#ef4444", display: "inline-block"}}
                    />
                    Review Your Order
                  </p>

                  {/* Product Summary */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: "12px 16px",
                      marginBottom: 12,
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                    }}>
                    <img
                      src={getImg(product) || "https://placehold.co/50x50/111/333?text=?"}
                      alt={product.name}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 8,
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                    <div style={{flex: 1, minWidth: 0}}>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          margin: 0,
                        }}>
                        {product.brand_name}
                      </p>
                      <p
                        style={{
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          margin: "2px 0 2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                        {product.name}
                      </p>
                      <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                        Size {size} · Qty {qty}
                      </p>
                    </div>
                    <div style={{flexShrink: 0, textAlign: "right"}}>
                      {hasDiscount && (
                        <p
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: "'Bebas Neue',sans-serif",
                            fontSize: "0.9rem",
                            textDecoration: "line-through",
                            margin: "0 0 1px",
                            letterSpacing: "0.04em",
                            lineHeight: 1,
                          }}>
                          {fmtMoney(product.compare_price * qty)}
                        </p>
                      )}
                      <p
                        style={{
                          color: "#ef4444",
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1.1rem",
                          margin: 0,
                          lineHeight: 1.1,
                        }}>
                        {fmtMoney(itemTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 8,
                    }}>
                    <div
                      style={{display: "flex", justifyContent: "space-between", marginBottom: 6}}>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.28)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                        }}>
                        Contact
                      </span>
                      <button
                        onClick={() => setStep(0)}
                        style={{
                          color: "#ef4444",
                          fontSize: 9,
                          fontWeight: 700,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}>
                        Edit
                      </button>
                    </div>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 12,
                        margin: 0,
                        lineHeight: 1.7,
                      }}>
                      {contact.email}
                      <br />
                      {contact.phone}
                    </p>
                  </div>

                  {/* Delivery/Pickup Info */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 8,
                    }}>
                    <div
                      style={{display: "flex", justifyContent: "space-between", marginBottom: 6}}>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.28)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                        }}>
                        {deliveryMode === "delivery" ? "Delivery Address" : "Pickup Location"}
                      </span>
                      <button
                        onClick={() => setStep(1)}
                        style={{
                          color: "#ef4444",
                          fontSize: 9,
                          fontWeight: 700,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}>
                        Edit
                      </button>
                    </div>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 12,
                        margin: 0,
                        lineHeight: 1.7,
                      }}>
                      {deliveryMode === "delivery" ? (
                        <>
                          {delivery.firstName} {delivery.lastName}
                          <br />
                          {delivery.address}
                          {delivery.apt ? `, ${delivery.apt}` : ""}
                          <br />
                          {delivery.city}, {delivery.state_name || delivery.zip}
                          <br />
                          {delivery.country_name}
                        </>
                      ) : (
                        <>
                          {selectedPickupLocation?.name}
                          <br />
                          {selectedPickupLocation?.address}
                          <br />
                          {selectedPickupLocation?.city}
                          {selectedPickupLocation?.state && `, ${selectedPickupLocation.state}`}
                          {selectedPickupLocation?.phone && (
                            <>
                              <br />
                              📞 {selectedPickupLocation.phone}
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Shipping Method */}
                  {deliveryMode === "delivery" && selectedShippingMethod && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        marginBottom: 8,
                      }}>
                      <div
                        style={{display: "flex", justifyContent: "space-between", marginBottom: 6}}>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.28)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                          }}>
                          Shipping Method
                        </span>
                        <button
                          onClick={() => setStep(1)}
                          style={{
                            color: "#ef4444",
                            fontSize: 9,
                            fontWeight: 700,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}>
                          Edit
                        </button>
                      </div>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.65)",
                          fontSize: 12,
                          margin: 0,
                          lineHeight: 1.7,
                        }}>
                        {selectedShippingMethod.name} —{" "}
                        {deliveryCost === 0 ? "FREE" : fmtMoney(deliveryCost)}
                      </p>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginBottom: 12,
                    }}>
                    <div
                      style={{display: "flex", justifyContent: "space-between", marginBottom: 6}}>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.28)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                        }}>
                        Payment Method
                      </span>
                      <button
                        onClick={() => setStep(2)}
                        style={{
                          color: "#ef4444",
                          fontSize: 9,
                          fontWeight: 700,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}>
                        Edit
                      </button>
                    </div>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        fontSize: 12,
                        margin: 0,
                        lineHeight: 1.7,
                      }}>
                      {PAYMENT_METHODS.find((m) => m.id === payment.method)?.label}
                      {payment.method === "transfer" && receipt && (
                        <>
                          <br />
                          <span style={{color: "#22c55e", fontSize: 11}}>
                            ✓ Receipt uploaded
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Order Total Breakdown */}
                  <div
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}>
                    {hasDiscount && (
                      <div
                        style={{display: "flex", justifyContent: "space-between", marginBottom: 6}}>
                        <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>
                          Original Price
                        </span>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "line-through",
                          }}>
                          {fmtMoney(product.compare_price * qty)}
                        </span>
                      </div>
                    )}
                    <div
                      style={{display: "flex", justifyContent: "space-between", marginBottom: 6}}>
                      <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>Subtotal</span>
                      <span style={{color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700}}>
                        {fmtMoney(itemTotal)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: hasDiscount ? 6 : 10,
                      }}>
                      <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>
                        {deliveryMode === "delivery" ? "Shipping" : "Pickup"}
                      </span>
                      <span
                        style={{
                          color: deliveryCost === 0 ? "#22c55e" : "rgba(255,255,255,0.7)",
                          fontSize: 12,
                          fontWeight: 700,
                        }}>
                        {deliveryCost === 0 ? "FREE" : fmtMoney(deliveryCost)}
                      </span>
                    </div>
                    {hasDiscount && (
                      <div
                        style={{display: "flex", justifyContent: "space-between", marginBottom: 10}}>
                        <span style={{color: "#22c55e", fontSize: 12, fontWeight: 700}}>
                          You Save
                        </span>
                        <span style={{color: "#22c55e", fontSize: 12, fontWeight: 700}}>
                          {fmtMoney((product.compare_price - product.price) * qty)}
                        </span>
                      </div>
                    )}
                    <div
                      style={{height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 10px"}}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                      <span
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1rem",
                          color: "#fff",
                          letterSpacing: "0.08em",
                        }}>
                        TOTAL ({userCurrency})
                      </span>
                      <span
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1.5rem",
                          color: "#ef4444",
                          letterSpacing: "0.04em",
                        }}>
                        {fmtMoney(orderTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Error Display */}
                  {orderError && (
                    <div
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        marginTop: 12,
                      }}>
                      <p style={{color: "#ef4444", fontSize: 11, margin: 0, lineHeight: 1.6}}>
                        ⚠️ {orderError}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div style={{display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap"}}>
                {step > 0 && (
                  <button
                    onClick={() => {
                      setStep((s) => s - 1);
                      setErrors({});
                      setOrderError("");
                    }}
                    disabled={placing}
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: placing ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "13px 20px",
                      cursor: placing ? "not-allowed" : "pointer",
                      borderRadius: 8,
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!placing) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                        e.currentTarget.style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!placing) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                      }
                    }}>
                    ← Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={() => {
                      if (validate()) {
                        setStep((s) => s + 1);
                        setOrderError("");
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: 140,
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      padding: "13px 20px",
                      cursor: "pointer",
                      borderRadius: 8,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
                    {step === 2 ? "Review Order →" : "Continue →"}
                  </button>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={placing && !paymentStuck}
                    style={{
                      flex: 1,
                      minWidth: 140,
                      background: placing ? "rgba(34,197,94,0.5)" : "#22c55e",
                      color: "#fff",
                      border: "none",
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      padding: "13px 20px",
                      cursor: placing ? "not-allowed" : "pointer",
                      borderRadius: 8,
                      transition: "background 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (!placing) e.currentTarget.style.background = "#16a34a";
                    }}
                    onMouseLeave={(e) => {
                      if (!placing) e.currentTarget.style.background = "#22c55e";
                    }}>
                    {placing && !paymentStuck ? (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          style={{animation: "pulse 0.8s linear infinite"}}>
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                    Processing...
                      </>
                    ) : paymentStuck ? (
                      "Retry Payment"
                    ) : (
                      <>🔒 Place Order — {fmtMoney(orderTotal)}</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        overflow: "hidden",
      }}>
      <div
        style={{
          width: "100%",
          aspectRatio: "1",
          background: "rgba(255,255,255,0.07)",
          animation: "pulse 1.4s infinite",
        }}
      />
      <div style={{padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6}}>
        {[
          ["50%", 9],
          ["80%", 12],
          ["40%", 18],
        ].map(([w, h], i) => (
          <div
            key={i}
            style={{
              height: h,
              width: w,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 4,
              animation: "pulse 1.4s infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Wishlist ─────────────────────────────────────────────────────────────
export default function BrandWishlist() {
  const {fmtMoney} = usePlatformSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [toast, setToast] = useState(null);
  const [picker, setPicker] = useState(null);
  const [checkout, setCheckout] = useState(null);

  useEffect(() => {
    getWishlist()
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({msg, ok});
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemove = async (productId, wishlistId) => {
    setRemoving(wishlistId);
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => i.id !== wishlistId));
      showToast("Removed from wishlist");
    } catch (e) {
      showToast(e.message, false);
    } finally {
      setRemoving(null);
    }
  };

  const handleBuyNow = (item) => {
    const p = item.product || item;
    setPicker({
      id: item.product_id ?? p.id,
      name: p.name,
      price: p.price,
      compare_price: p.compare_price ?? 0,
      brand_name: p.brand_name,
      brand_id: p.brand_id,
      primary_image: p.primary_image || getImg(p),
      sizes: p.sizes || [],
    });
  };

  return (
    <div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .wl-brand-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}
        @media(max-width:500px){.wl-brand-grid{grid-template-columns:repeat(2,1fr);gap:10px;}}
        @media(max-width:340px){.wl-brand-grid{grid-template-columns:1fr;}}
        .co-2col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        @media(max-width:480px){.co-2col{grid-template-columns:1fr!important;}}
        @media(max-width:380px){.step-label{display:none!important;}}
      `}</style>

      <AnimatePresence>
        {picker && (
          <SizePicker
            product={picker}
            onConfirm={(size, qty) => {
              setPicker(null);
              setCheckout({product: picker, size, qty});
            }}
            onClose={() => setPicker(null)}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {checkout && (
          <QuickCheckout
            product={checkout.product}
            size={checkout.size}
            qty={checkout.qty}
            onClose={() => setCheckout(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 10}}
            style={{
              position: "fixed",
              bottom: 28,
              right: 20,
              zIndex: 999,
              background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${toast.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: 10,
              padding: "12px 18px",
              color: toast.ok ? "#22c55e" : "#ef4444",
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              maxWidth: "calc(100vw - 40px)",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{marginBottom: 24}}>
        <p
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            margin: "0 0 4px",
          }}>
          Saved Items
        </p>
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(1.8rem,3vw,2.4rem)",
            color: "#fff",
            letterSpacing: "0.04em",
            margin: "0 0 4px",
          }}>
          WISHLIST
        </h2>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
          {loading
            ? "Loading..."
            : `${items.length} item${items.length !== 1 ? "s" : ""} saved · Click Buy Now to purchase`}
        </p>
      </div>

      {loading ? (
        <div className="wl-brand-grid">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            background: "#0d0d0d",
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "80px 24px",
            textAlign: "center",
          }}>
          <svg
            width="40"
            height="40"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            style={{margin: "0 auto 14px", display: "block"}}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 13}}>
            Your wishlist is empty. Start browsing the shop.
          </p>
        </div>
      ) : (
        <div className="wl-brand-grid">
          {items.map((item) => {
            const prod = item.product || item;
            const price = prod.price;
            const comparePrice = prod.compare_price ?? 0;
            const hasDiscount = comparePrice > 0 && comparePrice !== price;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{opacity: 0, y: 8}}
                animate={{opacity: 1, y: 0}}
                style={{
                  background: "#0d0d0d",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "border-color 0.18s,transform 0.18s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                <button
                  onClick={() => handleRemove(item.product_id ?? prod.id, item.id)}
                  disabled={removing === item.id}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    cursor: removing === item.id ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}>
                  {removing === item.id ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      style={{animation: "pulse 0.8s linear infinite"}}>
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  ) : (
                    <svg
                      width="10"
                      height="10"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>

                <div style={{position: "absolute", top: 8, left: 8, zIndex: 2}}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#ef4444"
                    stroke="#ef4444"
                    strokeWidth="1.5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                {hasDiscount && (
                  <span
                    style={{
                      position: "absolute",
                      top: 32,
                      left: 8,
                      background: "#22c55e",
                      color: "#000",
                      fontSize: 8,
                      fontWeight: 900,
                      letterSpacing: "0.1em",
                      padding: "3px 7px",
                      borderRadius: 4,
                      zIndex: 2,
                    }}>
                    SAVE {fmtMoney(comparePrice - price)}
                  </span>
                )}

                <img
                  src={getImg(prod) || "https://placehold.co/200x200/111/333?text=?"}
                  alt={prod.name}
                  style={{width: "100%", aspectRatio: "1", objectFit: "cover", display: "block"}}
                />

                <div style={{padding: "11px 12px"}}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      margin: "0 0 3px",
                    }}>
                    {prod.brand_name}
                  </p>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      margin: "0 0 6px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                    {prod.name}
                  </p>

                  {prod?.sizes?.length > 0 && (
                    <div style={{display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 9}}>
                      {prod.sizes.slice(0, 4).map((sz) => (
                        <span
                          key={sz.id}
                          style={{
                            background:
                              sz.stock > 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${sz.stock > 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                            color: sz.stock > 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                            fontSize: 9,
                            padding: "2px 5px",
                            borderRadius: 4,
                            textDecoration: sz.stock === 0 ? "line-through" : "none",
                          }}>
                          {sz.size}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 6,
                    }}>
                    <div>
                      {hasDiscount && (
                        <p
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: "'Bebas Neue',sans-serif",
                            fontSize: "0.85rem",
                            textDecoration: "line-through",
                            margin: 0,
                            lineHeight: 1,
                            letterSpacing: "0.04em",
                          }}>
                          {fmtMoney(comparePrice)}
                        </p>
                      )}
                      <p
                        style={{
                          color: "#ef4444",
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1.1rem",
                          letterSpacing: "0.04em",
                          margin: 0,
                          lineHeight: 1.1,
                        }}>
                        {fmtMoney(price)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuyNow(item)}
                      style={{
                        background: "#ef4444",
                        border: "none",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "7px 10px",
                        borderRadius: 6,
                        cursor: "pointer",
                        transition: "background 0.15s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
                      Buy Now
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}