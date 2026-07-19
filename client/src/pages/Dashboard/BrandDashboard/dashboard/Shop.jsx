import {useState, useEffect, useCallback, useRef, useMemo} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  getProducts,
  getBrands,
  getBrandProfile,
  listBrandProducts,
  updateBrandProductStatus,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../dashboard/dashboard_components/api";
import {usePlatformSettings} from "../dashboard/dashboard_components/platformsettingscontext";
import {getToken} from "../../../../components/cartcontext"; // ✅ NEW
import { useGeo } from "../../../../utils/geo"; // ✅ NEW
import PhoneInput from "../../../../components/phoneinput"; // ✅ NEW

// ✅ NEW: API base URL
const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

const STEPS = ["Contact", "Delivery", "Payment", "Review"];

// Card/Paystack is disabled to match the main site checkout — see
// CARD_PAYMENTS_ENABLED in checkout_components/checkoutform.jsx. Flip both
// back on together once the Paystack dashboard issue is resolved.
const CARD_PAYMENTS_ENABLED = false;

const PAYMENT_METHODS = [
  {id: "flutterwave", label: "Flutterwave", icon: "🦋", description: "Mobile Money, Bank & More"},
  {id: "transfer", label: "Bank Transfer", icon: "🏦", description: "Manual Transfer"},
  {id: "card", label: "Credit / Debit Card", icon: "💳", description: "Powered by Paystack", comingSoon: true},
];

const STATUS_COLORS = {
  active: {bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)", text: "#22c55e"},
  draft: {bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.4)", text: "#eab308"},
  sold_out: {bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#ef4444"},
  archived: {bg: "rgba(100,116,139,0.15)", border: "rgba(100,116,139,0.4)", text: "#64748b"},
};

const TAG_COLORS = {
  limited: {bg: "rgba(168,85,247,0.15)", text: "#a855f7"},
  streetwear: {bg: "rgba(59,130,246,0.15)", text: "#3b82f6"},
  super: {bg: "rgba(239,68,68,0.15)", text: "#ef4444"},
  exclusive: {bg: "rgba(245,158,11,0.15)", text: "#f59e0b"},
  hoodie: {bg: "rgba(20,184,166,0.15)", text: "#14b8a6"},
};

// ✅ NEW: Payment script loaders (from CheckoutForm fixes)
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
    console.log("🔄 Loading Flutterwave script (FRESH)...");
    
    const oldScripts = document.querySelectorAll('script[src*="flutterwave.com"]');
    oldScripts.forEach(script => {
      console.log("🗑️ Removing old Flutterwave script");
      script.remove();
    });
    
    delete window.FlutterwaveCheckout;
    
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      
      script.onload = () => {
        console.log("✅ Flutterwave script loaded");
        if (window.FlutterwaveCheckout) {
          console.log("✅ FlutterwaveCheckout available");
          resolve(window.FlutterwaveCheckout);
        } else {
          console.error("❌ Script loaded but FlutterwaveCheckout undefined");
          reject(new Error('FlutterwaveCheckout not available'));
        }
      };
      
      script.onerror = (err) => {
        console.error("❌ Flutterwave script failed to load", err);
        reject(new Error('Failed to load Flutterwave script'));
      };
      
      document.body.appendChild(script);
    }, 200);
  });
};

const closePaymentModal = () => {
  console.log("🧹 Cleaning up payment modals (surgical)...");
  
  if (window.PaystackPop) {
    try {
      const handler = window.PaystackPop;
      if (handler && typeof handler.close === 'function') {
        handler.close();
      }
    } catch(e) {
      console.warn("Paystack cleanup error:", e);
    }
  }
  
  try {
    const iframes = document.querySelectorAll(
      'iframe[src*="flutterwave"], ' +
      'iframe[src*="ravemodal"]'
    );
    
    console.log(`Found ${iframes.length} Flutterwave iframe(s)`);
    
    iframes.forEach((iframe, index) => {
      console.log(`Removing iframe ${index + 1}:`, iframe.src);
      iframe.remove();
    });
    
    const flwElements = document.querySelectorAll(
      '[class*="flutterwave-modal"], ' +
      '[class*="flw-modal"], ' +
      '[id*="flutterwave-modal"], ' +
      '[id*="flw-modal"]'
    );
    
    console.log(`Found ${flwElements.length} Flutterwave element(s)`);
    
    flwElements.forEach((el, index) => {
      console.log(`Removing element ${index + 1}:`, el.id || el.className);
      el.remove();
    });
    
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
    
    console.log("✅ Flutterwave modal closed safely");
    
  } catch(e) {
    console.warn("Flutterwave cleanup error:", e);
  }
  
  console.log("✅ Cleanup complete");
};

// ── Resolve image from either public-shop or brand-API response shape ─────────
function getImg(p) {
  return (
    p.primary_image ||
    p.image_url ||
    p.thumbnail ||
    p.images?.[0]?.url ||
    p.images?.[0]?.image_url ||
    p.images?.[0]?.src ||
    null
  );
}

// ── PriceDisplay: shows compare_price slashed + price unslashed ───────────────
function PriceDisplay({price, comparePrice, fmtMoney, size = "md"}) {
  const hasDiscount = comparePrice > 0 && comparePrice !== price;
  const mainSize = size === "lg" ? "1.3rem" : size === "sm" ? "0.9rem" : "1.1rem";
  const strikeSize = size === "lg" ? "1rem" : size === "sm" ? "0.8rem" : "0.85rem";

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 1}}>
      {hasDiscount && (
        <span
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: strikeSize,
            color: "rgba(255,255,255,0.3)",
            textDecoration: "line-through",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}>
          {fmtMoney(comparePrice)}
        </span>
      )}
      <span
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: mainSize,
          color: "#ef4444",
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}>
        {fmtMoney(price)}
      </span>
      {hasDiscount && (
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: "#22c55e",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
          You save {fmtMoney(comparePrice - price)}
        </span>
      )}
    </div>
  );
}

// ── SearchSelect ──────────────────────────────────────────────────────────────
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
          borderRadius: 8, padding: "12px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.18s", outline: "none", fontFamily: "inherit",
        }}>
        <span style={{
          fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: disabled ? "rgba(255,255,255,0.18)" : selected ? "#fff" : "rgba(255,255,255,0.28)",
        }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          style={{flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s"}}
          width="11" height="11" fill="none" viewBox="0 0 24 24"
          stroke="rgba(255,255,255,0.3)" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div ref={dropdownRef} style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6,
          background: "#181818", border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 12, zIndex: 99999, boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
          overflow: "hidden", maxHeight: 300,
        }}>
          <div style={{padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.07)"}}>
            <input
              autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                padding: "8px 10px", color: "#fff", fontSize: 12, outline: "none",
              }}
            />
          </div>
          <div style={{maxHeight: 260, overflowY: "auto"}}>
            {filtered.length === 0 ? (
              <div style={{padding: 18, color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center"}}>No results</div>
            ) : filtered.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button key={opt.value} type="button" onClick={() => pick(opt)} style={{
                  width: "100%", textAlign: "left", border: "none", padding: "9px 14px",
                  cursor: "pointer", fontSize: 13,
                  background: isSelected ? "rgba(239,68,68,0.1)" : "transparent",
                  color: isSelected ? "#ef4444" : "rgba(255,255,255,0.72)",
                  display: "flex", alignItems: "center", gap: 9,
                }}>
                  <span style={{flex: 1}}>{opt.label}</span>
                  {isSelected && (
                    <svg width="11" height="11" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Input & Label Helpers ──────────────────────────────────────────────────────
const inp = (err = false) => ({
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

const focusRed = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)");
const blurRed = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

function CLabel({children}) {
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
      {children}
    </label>
  );
}

function CError({msg}) {
  return msg ? (
    <span style={{color: "#ef4444", fontSize: 10, fontWeight: 700, marginTop: 2, display: "block"}}>
      {msg}
    </span>
  ) : null;
}

// ─── Quick Checkout Modal with FULL Payment Integration ───────────────────────
function QuickCheckout({product, size, qty, onClose}) {
const {fmtMoney, userCurrency, baseCurrency} = usePlatformSettings();
  const { Country, State, City, loaded: geoLoaded } = useGeo();

  // ✅ NEW: Payment refs and state
  const paymentTimeoutRef = useRef(null);
  const paystackHandlerRef = useRef(null);
  const flutterwaveModalRef = useRef(null);
  const flwCloseHandledRef = useRef(false);
  
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [placing, setPlacing] = useState(false); // ✅ NEW
  const [orderError, setOrderError] = useState(""); // ✅ NEW
  const [paymentStuck, setPaymentStuck] = useState(false); // ✅ NEW
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [receiptError, setReceiptError] = useState(""); // ✅ NEW
  const [orderRef, setOrderRef] = useState(""); // ✅ NEW
  
  const [contact, setContact] = useState({email: "", phone: "", subscribe: false});
  const [delivery, setDelivery] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apt: "",
    city: "",
    state_code: "", // ✅ NEW
    state_name: "", // ✅ NEW
    zip: "",
    country_code: "NG", // ✅ NEW: Default Nigeria
    country_name: "Nigeria", // ✅ NEW
  });
  const [payment, setPayment] = useState({
    method: "flutterwave",
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });

  // ✅ NEW: Shipping data from API
  const [shippingData, setShippingData] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const [selectedPickup, setSelectedPickup] = useState(null);

  // ✅ NEW: Fetch shipping data when delivery step opens
  useEffect(() => {
    if (step === 1 && !shippingData && product.brand_id) {
      setShippingLoading(true);
      fetch(`${API_BASE}/api/shop/brands/${product.brand_id}/shipping`)
        .then((r) => r.json())
        .then((json) => {
          const data = json?.data ?? json;
          setShippingData(data);
          if (data?.pickups?.length > 0) {
            setSelectedPickup(data.pickups[0]);
          }
        })
        .catch(() => setShippingData(null))
        .finally(() => setShippingLoading(false));
    }
  }, [step, product.brandId, shippingData]);

  // ✅ NEW: Country/State/City options
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
      label: s.name
    }));
  }, [geoLoaded, State, delivery.country_code]);

  const cityOptions = useMemo(() => {
    if (!geoLoaded || !delivery.country_code || !delivery.state_code) return [];
    return City.getCitiesOfState(delivery.country_code, delivery.state_code).map(c => ({
      value: c.name,
      label: c.name
    }));
  }, [geoLoaded, City, delivery.country_code, delivery.state_code]);

  // ✅ NEW: Get filtered shipping options based on delivery location
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

  // ✅ ADD THIS: Filter shipping options by location
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

  // ✅ ADD THIS: Handle shipping method selection with auto-fill
  const handleShippingMethodSelect = useCallback((method) => {
    setSelectedShippingMethod(method);
    if (!delivery.country_code && geoLoaded) {
      const locationData = extractLocationFromMethod(method);
      if (Object.keys(locationData).length > 0) {
        setDelivery((prev) => ({...prev, ...locationData}));
      }
    }
  }, [delivery.country_code, geoLoaded, extractLocationFromMethod]);

  // ✅ NOW the deliveryCost calculation (UPDATE IT):
  const deliveryCost = useMemo(() => {
    if (deliveryMode !== "delivery" || !selectedShippingMethod) return 0;
    
    const rawPrice = Number(
      selectedShippingMethod.flat_rate ||
      selectedShippingMethod.base_price ||
      selectedShippingMethod.rate ||
      0
    );
    
    return rawPrice; // Already in user currency from API
  }, [selectedShippingMethod, deliveryMode]);


  const itemTotal = product.price * qty;
  // Tax — the platform's commission, re-surfaced here as a checkout line
  // instead of only being baked into the (already-discounted) product price.
  // (compare_price - price) is exactly the fee that was deducted when the
  // price was set — mirrors the server's itemTax() in create_order.go.
  const tax = Math.max(0, (product.compare_price || 0) - product.price) * qty;
  const orderTotal = itemTotal + deliveryCost + tax;

  // ✅ NEW: Payment timeout (1 minute auto-close)
  useEffect(() => {
    if (placing && !done) {
      console.log("⏱️ Starting 1-minute payment timeout...");
      
      paymentTimeoutRef.current = setTimeout(() => {
        console.warn("⚠️ PAYMENT TIMEOUT - 1 minute elapsed");
        
        flwCloseHandledRef.current = true;
        closePaymentModal();
        
        paystackHandlerRef.current = null;
        flutterwaveModalRef.current = null;
        setPaymentStuck(false);
        setPlacing(false);
        
        setOrderError(
          "⏱️ Payment window timed out (3 hours). Click 'Place Order' again to retry. " +
          "If you were charged, do NOT pay again - contact blvckmrkt.market@gmail.com with your reference."
        );
      }, 10800000);

      return () => {
        if (paymentTimeoutRef.current) {
          console.log("🧹 Clearing payment timeout");
          clearTimeout(paymentTimeoutRef.current);
          paymentTimeoutRef.current = null;
        }
      };
    }
  }, [placing, done]);

  // Reset stuck state when step changes
  useEffect(() => {
    setPaymentStuck(false);
    setOrderError("");
  }, [step]);

  const formatCard = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
      
  const formatExpiry = (v) => {
    const s = v.replace(/\D/g, "").slice(0, 4);
    return s.length >= 3 ? s.slice(0, 2) + "/" + s.slice(2) : s;
  };

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
        if (!selectedPickup) e.pickup = "Please select a pickup location";
      }
    }
    if (step === 2 && payment.method === "card") {
      if (!payment.cardName.trim()) e.cardName = "Required";
      if (!payment.cardNumber.replace(/\s/g, "").match(/^\d{16}$/))
        e.cardNumber = "16-digit card number required";
      if (!payment.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = "MM/YY format";
      if (!payment.cvv.match(/^\d{3,4}$/)) e.cvv = "3–4 digits";
    }
    if (step === 2 && payment.method === "transfer" && !receipt)
      e.receipt = "Please upload transfer receipt";
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

  // ✅ NEW: Handle payment success
  const handlePaymentSuccess = useCallback(async (paymentRef, gateway) => {
    console.log("🔄 Starting handlePaymentSuccess...", { paymentRef, gateway });
    
    setPlacing(true);
    setOrderError("");
    setPaymentStuck(false);
    
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
    }
    
    try {
      const token = getToken();
      console.log("🔑 Token retrieved:", token ? "✅ Found" : "❌ Missing");

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
                pickup_location_id: selectedPickup?.id,
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

      console.log("📤 Sending order request to:", `${API_BASE}/api/user/orders`);
      console.log("📦 Request body:", JSON.stringify(body, null, 2));

      const res = await fetch(`${API_BASE}/api/user/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify(body),
      });

      console.log("📥 Response status:", res.status, res.statusText);

      const responseText = await res.text();
      console.log("📥 Raw response:", responseText);

      let json;
      try {
        json = JSON.parse(responseText);
        console.log("📥 Parsed response:", json);
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError);
        throw new Error(`Server returned invalid response. Status: ${res.status}`);
      }

      if (!res.ok) {
        console.error("❌ Server error:", json);
        throw new Error(json.error || json.message || `Server error: ${res.status}`);
      }

      const ref = 
        json?.data?.reference || 
        json?.data?.order?.reference || 
        json?.data?.order?.display_id ||
        json?.data?.display_id ||
        paymentRef;
      
      console.log("✅ Order created with reference:", ref);

      setOrderRef(ref);
      setDone(true);
      console.log("✅ Order process completed successfully!");
      
    } catch (error) {
      console.error("❌ Order creation failed:", error);
      
      setOrderError(
        "Payment was received but your order could not be confirmed automatically. " +
        "Do NOT pay again. Please contact us at blvckmrkt.market@gmail.com with your payment reference: " +
        paymentRef + " and we will manually confirm your order within 24 hours."
      );
    } finally {
      setPlacing(false);
    }
  }, [product, qty, size, contact, deliveryMode, delivery, selectedShippingMethod, selectedPickup, itemTotal, deliveryCost, orderTotal, userCurrency]);

  // ✅ NEW: Place order with real payment gateways
  const placeOrder = async () => {
    if (!validate()) return;

    console.log("🚀 Place order initiated with method:", payment.method);
    console.log("💰 Order total:", orderTotal, userCurrency);

    // PAYSTACK — coming soon, see CARD_PAYMENTS_ENABLED
    if (payment.method === "card") {
      if (!CARD_PAYMENTS_ENABLED) {
        setOrderError("Card payments are coming soon. Please use Flutterwave or Bank Transfer for now.");
        return;
      }
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);

      console.log("💳 Initializing Paystack payment...");
      
      try {
        const PaystackPop = await loadPaystackScript();
        
        const handler = PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: contact.email,
          amount: Math.round(orderTotal * 100),
          currency: userCurrency,
          ref: `BLVCK-${Date.now()}`,
          metadata: {
            custom_fields: [
              {
                display_name: "Customer Name",
                variable_name: "customer_name",
                value: `${delivery.firstName} ${delivery.lastName}`.trim() || "Guest",
              },
            ],
          },
          callback: function(response) {
            console.log("✅ PAYSTACK SUCCESS!", response);
            handlePaymentSuccess(response.reference, "paystack");
          },
          onClose: function() {
            console.log("❌ PAYSTACK CLOSED!");
            if (paymentTimeoutRef.current) {
              clearTimeout(paymentTimeoutRef.current);
              paymentTimeoutRef.current = null;
            }
            paystackHandlerRef.current = null;
            setOrderError("Payment was cancelled. Please try again.");
            setPlacing(false);
            setPaymentStuck(false);
          },
        });
        
        handler.openIframe();
        paystackHandlerRef.current = handler; 
        
      } catch (error) {
        console.error("❌ Paystack failed:", error);
        setOrderError("Failed to initialize payment. Please try again.");
        setPlacing(false);
      }
      return;
    }

    // FLUTTERWAVE
    if (payment.method === "flutterwave") {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🦋 FLUTTERWAVE PAYMENT INITIATED");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      flwCloseHandledRef.current = false;
      
      console.log("📊 Payment Details:");
      console.log("  - Amount:", orderTotal);
      console.log("  - Currency:", userCurrency);
      console.log("  - Email:", contact.email);
      console.log("  - Phone:", contact.phone);
      
      if (!contact.email || !contact.email.includes('@')) {
        setOrderError("Valid email required for payment");
        setPlacing(false);
        return;
      }
      
      if (orderTotal <= 0) {
        setOrderError("Invalid order amount");
        setPlacing(false);
        return;
      }
      
      const flwKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
      console.log("🔑 Flutterwave Key Check:");
      console.log("  - Exists:", !!flwKey);
      console.log("  - Prefix:", flwKey ? flwKey.substring(0, 10) + "..." : "MISSING");
      
      if (!flwKey) {
        setOrderError("Payment gateway not configured. Contact support.");
        setPlacing(false);
        return;
      }
      
      try {
        console.log("📥 Loading Flutterwave script...");
        const FlutterwaveCheckout = await loadFlutterwaveScript();
        
        console.log("✅ Script loaded, type:", typeof FlutterwaveCheckout);
        
        if (typeof FlutterwaveCheckout !== 'function') {
          throw new Error('FlutterwaveCheckout is not a function');
        }
        
        const txRef = `BLVCK-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        
        const config = {
          public_key: flwKey,
          tx_ref: txRef,
          amount: orderTotal,
          currency: "NGN",
          payment_options: "card,mobilemoney,ussd,banktransfer",
          customer: {
            email: contact.email,
            phone_number: contact.phone || "+2348000000000",
            name: `${delivery.firstName} ${delivery.lastName}`.trim() || "Guest",
          },
          customizations: {
            title: "BLVCKMRKT",
            description: "Order Payment",
            logo: "https://blvckmrktng.com/logo.png",
          },
          callback: function(response) {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("✅ FLUTTERWAVE SUCCESS CALLBACK");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("Response:", response);
            
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
            
            console.log("📝 Using reference:", ref);
            handlePaymentSuccess(ref, "flutterwave");
          },
          onclose: function() {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("❌ FLUTTERWAVE CLOSE CALLBACK");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("Already handled?", flwCloseHandledRef.current);
            
            if (flwCloseHandledRef.current) {
              console.log("Skipping - already handled by success or timeout");
              return;
            }
            
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
        
        console.log("🚀 Calling FlutterwaveCheckout with config:");
        console.log(JSON.stringify({...config, public_key: "HIDDEN"}, null, 2));
        
        const modal = FlutterwaveCheckout(config);
        flutterwaveModalRef.current = modal;
        
        console.log("✅ FlutterwaveCheckout called, modal ref:", !!modal);
        
      } catch(error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ FLUTTERWAVE ERROR");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("Error:", error);
        console.error("Stack:", error.stack);
        
        setOrderError(`Payment failed: ${error.message}. Please try again or use another method.`);
        setPlacing(false);
        setPaymentStuck(false);
      }
      
      return;
    }

    // BANK TRANSFER
    if (payment.method === "transfer") {
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      console.log("🏦 Processing bank transfer order...");
      
      try {
        const token = getToken();
        let receiptUrl = null;

        if (receipt) {
          console.log("📄 Uploading receipt...");
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
            console.log("✅ Receipt uploaded:", receiptUrl);
          } else {
            console.warn("⚠️ Receipt upload failed, continuing without receipt");
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
                  pickup_location_id: selectedPickup?.id,
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

        console.log("📤 Sending transfer order request...");
        const res = await fetch(`${API_BASE}/api/user/orders`, {
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

        setOrderRef(ref);
        setDone(true);
        console.log("✅ Transfer order created successfully!");
        
      } catch (error) {
        console.error("❌ Transfer order error:", error);
        setOrderError(error.message || "Failed to place order. Please try again.");
      } finally {
        setPlacing(false);
      }
    }
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape" && !done) onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [done, onClose]);

    // ✅ SUCCESS SCREEN (when done = true)
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
          flexDirection: "column",
        }}>
        <motion.div
          initial={{opacity: 0, scale: 0.94}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 0.5}}
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
                fontSize: "clamp(2.2rem,5vw,3rem)",
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
              placed. A confirmation email is on its way to{" "}
              <strong style={{color: "#fff"}}>{contact.email}</strong>.
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
                {orderRef || "BLVCK-" + Math.random().toString(36).slice(2, 8).toUpperCase()}
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
              Back to Shop →
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    );

  // ✅ MAIN CHECKOUT MODAL
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
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 2000,
        overflowY: "auto",
        padding: "60px 20px 40px",
      }}>
      <motion.div
        initial={{opacity: 0, y: 24}}
        animate={{opacity: 1, y: 0}}
        exit={{opacity: 0, y: 24}}
        transition={{type: "spring", stiffness: 260, damping: 26}}
        style={{
          maxWidth: 680,
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
            padding: "20px 26px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <div style={{display: "flex", alignItems: "center", gap: 14}}>
            <img
              src={getImg(product) || "https://placehold.co/48x48/111/333?text=?"}
              alt={product.name}
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            />
            <div>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: 0,
                }}>
                {product.brand_name}
              </p>
              <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: "2px 0 0"}}>
                {product.name}
              </p>
              <div style={{display: "flex", alignItems: "center", gap: 8, marginTop: 2}}>
                {product.compare_price > 0 && product.compare_price !== product.price && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "0.95rem",
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
                    fontSize: "1.1rem",
                    letterSpacing: "0.04em",
                  }}>
                  {fmtMoney(orderTotal)} · Size {size} · Qty {qty}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}>
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div style={{padding: "18px 26px 0", display: "flex", alignItems: "center"}}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                flex: i < STEPS.length - 1 ? 1 : "none",
              }}>
              <div style={{display: "flex", alignItems: "center", gap: 6, flexShrink: 0}}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 900,
                    flexShrink: 0,
                    transition: "all 0.3s",
                    background:
                      i < step ? "#22c55e" : i === step ? "#ef4444" : "rgba(255,255,255,0.07)",
                    color: "#fff",
                  }}>
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
                  className="step-label"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    transition: "color 0.3s",
                    color: i < step ? "#22c55e" : i === step ? "#fff" : "rgba(255,255,255,0.2)",
                  }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    margin: "0 8px",
                    minWidth: 12,
                    transition: "background 0.3s",
                    background: i < step ? "#22c55e" : "rgba(255,255,255,0.08)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form body */}
        <div style={{padding: "22px 26px 26px"}}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{opacity: 0, x: 20}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: -20}}
              transition={{duration: 0.25}}>
              {/* ── STEP 0: Contact ── */}
              {step === 0 && (
                <div>
                  <p
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.1rem",
                      color: "#fff",
                      letterSpacing: "0.08em",
                      margin: "0 0 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                    <span
                      style={{
                        width: 3,
                        height: 16,
                        background: "#ef4444",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    Contact Information
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginBottom: 12,
                    }}>
                    <div>
                      <CLabel>Email *</CLabel>
                      <input
                        style={inp(!!errors.email)}
                        type="email"
                        placeholder="you@example.com"
                        value={contact.email}
                        onChange={(e) => setContact({...contact, email: e.target.value})}
                        onFocus={focusRed}
                        onBlur={blurRed}
                      />
                      <CError msg={errors.email} />
                    </div>
                    <div>
                      <CLabel>Phone *</CLabel>
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
                      gap: 9,
                      cursor: "pointer",
                      marginTop: 8,
                    }}
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
                  {/* ✅ NEW: Delivery/Pickup mode toggle */}
                  <div style={{
                    display: "inline-flex",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: 4,
                    marginBottom: 20,
                  }}>
                    <button
                      onClick={() => setDeliveryMode("delivery")}
                      style={{
                        flex: 1,
                        padding: "10px 24px",
                        border: "none",
                        background: deliveryMode === "delivery" ? "#ef4444" : "none",
                        color: deliveryMode === "delivery" ? "#fff" : "rgba(255,255,255,0.4)",
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        borderRadius: 7,
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}>
                      🚚 Delivery
                    </button>
                    <button
                      onClick={() => setDeliveryMode("pickup")}
                      style={{
                        flex: 1,
                        padding: "10px 24px",
                        border: "none",
                        background: deliveryMode === "pickup" ? "#ef4444" : "none",
                        color: deliveryMode === "pickup" ? "#fff" : "rgba(255,255,255,0.4)",
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        borderRadius: 7,
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}>
                      🏪 Pickup
                    </button>
                  </div>

                  {deliveryMode === "delivery" ? (
                    <>
                      <p
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1.1rem",
                          color: "#fff",
                          letterSpacing: "0.08em",
                          margin: "0 0 18px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                        <span
                          style={{
                            width: 3,
                            height: 16,
                            background: "#ef4444",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        Delivery Address
                      </p>
                      
          {/* Country */}
<div style={{marginBottom: 12}}>
  <CLabel>Country *</CLabel>
  <SearchSelect
    options={countryOptions}
    value={delivery.country_code || ""}
    onChange={(code) => {
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
    placeholder="Select country…"
  />
  <CError msg={errors.country} />
</div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                          marginBottom: 12,
                        }}>
                        <div>
                          <CLabel>First Name *</CLabel>
                          <input
                            style={inp(!!errors.firstName)}
                            placeholder="John"
                            value={delivery.firstName}
                            onChange={(e) =>
                              setDelivery({...delivery, firstName: e.target.value})
                            }
                            onFocus={focusRed}
                            onBlur={blurRed}
                          />
                          <CError msg={errors.firstName} />
                        </div>
                        <div>
                          <CLabel>Last Name *</CLabel>
                          <input
                            style={inp(!!errors.lastName)}
                            placeholder="Doe"
                            value={delivery.lastName}
                            onChange={(e) =>
                              setDelivery({...delivery, lastName: e.target.value})
                            }
                            onFocus={focusRed}
                            onBlur={blurRed}
                          />
                          <CError msg={errors.lastName} />
                        </div>
                      </div>

                      <div style={{marginBottom: 12}}>
                        <CLabel>Street Address *</CLabel>
                        <input
                          style={inp(!!errors.address)}
                          placeholder="12 Victoria Island Road"
                          value={delivery.address}
                          onChange={(e) =>
                            setDelivery({...delivery, address: e.target.value})
                          }
                          onFocus={focusRed}
                          onBlur={blurRed}
                        />
                        <CError msg={errors.address} />
                      </div>

                      <div style={{marginBottom: 12}}>
                        <CLabel>Apt / Suite (optional)</CLabel>
                        <input
                          style={inp(false)}
                          placeholder="Apt 4B"
                          value={delivery.apt}
                          onChange={(e) => setDelivery({...delivery, apt: e.target.value})}
                          onFocus={focusRed}
                          onBlur={blurRed}
                        />
                      </div>

{/* State select */}
{delivery.country_code && (
  <div style={{marginBottom: 12}}>
    <CLabel>State / Region *</CLabel>
    <SearchSelect
      options={stateOptions}
      value={delivery.state_code || ""}
      onChange={(code) => {
        const s = geoLoaded ? State.getStateByCodeAndCountry(code, delivery.country_code) : null;
        setDelivery({
          ...delivery,
          state_code: code,
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
{/* City - conditional on state being selected */}
{delivery.state_code && (
  <div style={{marginBottom: 12}}>
    <CLabel>City *</CLabel>
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
        style={inp(!!errors.city)}
        placeholder="Type city name…"
        value={delivery.city}
        onChange={(e) => setDelivery({...delivery, city: e.target.value})}
        onFocus={focusRed}
        onBlur={blurRed}
      />
    )}
    <CError msg={errors.city} />
  </div>
)}

<div style={{marginBottom: 20}}>
  <CLabel>Postcode / ZIP *</CLabel>
  <input
    style={inp(!!errors.zip)}
    placeholder="100001"
    value={delivery.zip}
    onChange={(e) => setDelivery({...delivery, zip: e.target.value})}
    onFocus={focusRed}
    onBlur={blurRed}
  />
  <CError msg={errors.zip} />
</div>

                      {/* ✅ NEW: Shipping Method from API */}
                      <p
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1.1rem",
                          color: "#fff",
                          letterSpacing: "0.08em",
                          margin: "22px 0 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                        <span
                          style={{width: 3, height: 16, background: "#ef4444", display: "inline-block"}}
                        />
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
                            const priceLabel = rawPrice === 0 ? "FREE" : fmtMoney(rawPrice);

                            return (
                              <div
                                key={`${method.type}-${method.id}`}
                                onClick={() => handleShippingMethodSelect(method)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "13px 14px",
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
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  border: `2px solid ${isSelected ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
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
                      <CError msg={errors.shipping} />
                    </>
                  ) : (
                    <>
                      {/* ✅ NEW: Pickup locations from API */}
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
                        <span
                          style={{width: 3, height: 16, background: "#ef4444", display: "inline-block"}}
                        />
                        Select Pickup Location
                      </p>
                      {shippingLoading ? (
                        <div
                          style={{
                            height: 80,
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 10,
                            animation: "pulse 1.4s infinite",
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
                            onClick={() => setSelectedPickup(pickup)}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              padding: "13px 14px",
                              border: `1px solid ${selectedPickup?.id === pickup.id ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                              borderRadius: 10,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              marginBottom: 8,
                              background: selectedPickup?.id === pickup.id ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                            }}>
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 2,
                                border: `2px solid ${selectedPickup?.id === pickup.id ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                              }}>
                              {selectedPickup?.id === pickup.id && (
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#ef4444",
                                  }}
                                />
                              )}
                            </div>
                            <div style={{flex: 1}}>
                              <p
                                style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 4px"}}>
                                {pickup.name}
                              </p>
                              <p
                                style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 2px"}}>
                                {pickup.address}, {pickup.city}
                                {pickup.state ? `, ${pickup.state}` : ""}
                              </p>
                              {pickup.phone && (
                                <p
                                  style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "2px 0 0"}}>
                                  📞 {pickup.phone}
                                </p>
                              )}
                              {pickup.instructions && (
                                <p
                                  style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "4px 0 0", fontStyle: "italic"}}>
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
                      <CError msg={errors.pickup} />
                    </>
                  )}
                </div>
              )}

              {/* ── STEP 2: Payment ── (keeping your existing payment UI) */}
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
                  <div style={{display: "flex", gap: 10, marginBottom: 18}}>
                    {PAYMENT_METHODS.map((m) => {
                      const disabled = m.comingSoon && !CARD_PAYMENTS_ENABLED;
                      return (
                        <div
                          key={m.id}
                          onClick={() => { if (!disabled) setPayment({...payment, method: m.id}); }}
                          style={{
                            flex: 1,
                            position: "relative",
                            padding: "12px 8px",
                            borderRadius: 10,
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.45 : 1,
                            border: `1px solid ${payment.method === m.id ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                            background:
                              payment.method === m.id
                                ? "rgba(239,68,68,0.07)"
                                : "rgba(255,255,255,0.02)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 5,
                            transition: "all 0.2s",
                          }}>
                          {disabled && (
                            <span style={{
                              position: "absolute", top: -7, right: -4,
                              background: "#eab308", color: "#000", fontSize: 6,
                              fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase",
                              padding: "2px 5px", borderRadius: 999,
                            }}>
                              Coming Soon
                            </span>
                          )}
                          <span style={{fontSize: 18}}>{m.icon}</span>
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              textAlign: "center",
                              color: payment.method === m.id ? "#fff" : "rgba(255,255,255,0.4)",
                            }}>
                            {m.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card preview - shown but not used (Paystack handles real payment) */}
                  {payment.method === "card" && (
                    <>
                      <div
                        style={{
                          background: "linear-gradient(135deg,#1a1a1a,#2d2d2d)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 14,
                          padding: 18,
                          marginBottom: 16,
                          position: "relative",
                          overflow: "hidden",
                        }}>
                        <div
                          style={{
                            position: "absolute",
                            top: -25,
                            right: -25,
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            background: "rgba(239,68,68,0.08)",
                          }}
                        />
                        <p
                          style={{
                            color: "rgba(255,255,255,0.2)",
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            margin: "0 0 14px",
                          }}>
                          Card Preview
                        </p>
                        <p
                          style={{
                            fontFamily: "'Bebas Neue',sans-serif",
                            fontSize: "1.2rem",
                            color: "rgba(255,255,255,0.7)",
                            letterSpacing: "0.22em",
                            margin: "0 0 12px",
                          }}>
                          {payment.cardNumber || "•••• •••• •••• ••••"}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                          }}>
                          <div>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.3)",
                                fontSize: 8,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                margin: "0 0 2px",
                              }}>
                              Card Holder
                            </p>
                            <p style={{color: "#fff", fontSize: 11, fontWeight: 700, margin: 0}}>
                              {payment.cardName || "YOUR NAME"}
                            </p>
                          </div>
                          <div style={{textAlign: "right"}}>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.3)",
                                fontSize: 8,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                margin: "0 0 2px",
                              }}>
                              Expires
                            </p>
                            <p style={{color: "#fff", fontSize: 11, fontWeight: 700, margin: 0}}>
                              {payment.expiry || "MM/YY"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div style={{marginBottom: 12}}>
                        <CLabel>Name on Card *</CLabel>
                        <input
                          style={inp(!!errors.cardName)}
                          placeholder="John Doe"
                          value={payment.cardName}
                          onChange={(e) => setPayment({...payment, cardName: e.target.value})}
                          onFocus={focusRed}
                          onBlur={blurRed}
                        />
                        <CError msg={errors.cardName} />
                      </div>
                      <div style={{marginBottom: 12}}>
                        <CLabel>Card Number *</CLabel>
                        <input
                          style={inp(!!errors.cardNumber)}
                          placeholder="1234 5678 9012 3456"
                          value={payment.cardNumber}
                          onChange={(e) =>
                            setPayment({...payment, cardNumber: formatCard(e.target.value)})
                          }
                          onFocus={focusRed}
                          onBlur={blurRed}
                        />
                        <CError msg={errors.cardNumber} />
                      </div>
                      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                        <div>
                          <CLabel>Expiry *</CLabel>
                          <input
                            style={inp(!!errors.expiry)}
                            placeholder="MM/YY"
                            value={payment.expiry}
                            onChange={(e) =>
                              setPayment({...payment, expiry: formatExpiry(e.target.value)})
                            }
                            onFocus={focusRed}
                            onBlur={blurRed}
                          />
                          <CError msg={errors.expiry} />
                        </div>
                        <div>
                          <CLabel>CVV *</CLabel>
                          <input
                            style={inp(!!errors.cvv)}
                            placeholder="•••"
                            type="password"
                            maxLength={4}
                            value={payment.cvv}
                            onChange={(e) =>
                              setPayment({
                                ...payment,
                                cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                              })
                            }
                            onFocus={focusRed}
                            onBlur={blurRed}
                          />
                          <CError msg={errors.cvv} />
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          padding: "10px 14px",
                          background: "rgba(239,68,68,0.05)",
                          border: "1px solid rgba(239,68,68,0.15)",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}>
                        <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p style={{color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0, lineHeight: 1.5}}>
                          Preview only - actual payment processed securely by Paystack
                        </p>
                      </div>
                    </>
                  )}

                  {payment.method === "flutterwave" && (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "36px 24px",
                        textAlign: "center",
                      }}>
                      <p style={{fontSize: "2rem", marginBottom: 10}}>🦋</p>
                      <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13}}>
                        You'll be redirected to <strong style={{color: "#fff"}}>Flutterwave</strong> for payment
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
                          padding: "18px 20px",
                          marginBottom: 16,
                        }}>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.28)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            marginBottom: 12,
                          }}>
                          Transfer To This Account
                        </p>
                        {[
                          {label: "Bank Name", value: "Fidelity Bank Plc"},
                          {label: "Account Name", value: "OLATOMIWA AYOMIDE SHITTU"},
                          {label: "Account Number", value: "6174 0498 08"},
                          {label: "Amount", value: fmtMoney(orderTotal)},
                          {label: "Reference", value: `ORDER-${Date.now().toString().slice(-6)}`},
                        ].map((r) => (
                          <div
                            key={r.label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "7px 0",
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
                        <CLabel>Upload Transfer Receipt *</CLabel>
                        <div
                          onClick={() => document.getElementById("brand-receipt-input").click()}
                          style={{
                            border: `2px dashed ${errors.receipt ? "#ef4444" : receipt ? "#22c55e" : "rgba(255,255,255,0.15)"}`,
                            borderRadius: 12,
                            padding: "28px 20px",
                            textAlign: "center",
                            cursor: "pointer",
                            background: receipt ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)",
                          }}>
                          {receipt ? (
                            <>
                              <p style={{color: "#22c55e", fontSize: 12, fontWeight: 700, margin: "0 0 4px"}}>
                                {receipt.name}
                              </p>
                              <span
                                style={{color: "#ef4444", fontSize: 10, cursor: "pointer", textDecoration: "underline"}}
                                onClick={(e) => { e.stopPropagation(); setReceipt(null); }}>
                                Remove
                              </span>
                            </>
                          ) : (
                            <>
                              <p style={{color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "0 0 4px"}}>
                                Click to upload receipt
                              </p>
                              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                                PNG, JPG, PDF — max 5MB
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          id="brand-receipt-input"
                          type="file"
                          accept="image/*,application/pdf"
                          style={{display: "none"}}
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f && f.size <= 5 * 1024 * 1024) {
                              setReceipt(f);
                              setErrors((p) => ({...p, receipt: null}));
                            } else if (f) {
                              setReceiptError("File too large — max 5MB");
                            }
                          }}
                        />
                        <CError msg={errors.receipt || receiptError} />
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
                  <p
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.1rem",
                      color: "#fff",
                      letterSpacing: "0.08em",
                      margin: "0 0 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                    <span
                      style={{width: 3, height: 16, background: "#ef4444", display: "inline-block"}}
                    />
                    Review Your Order
                  </p>

                  {/* Product summary */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: "14px 16px",
                      marginBottom: 12,
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                    }}>
                    <img
                      src={getImg(product) || "https://placehold.co/56x56/111/333?text=?"}
                      alt={product.name}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 9,
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid rgba(255,255,255,0.07)",
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
                          margin: "0 0 2px",
                        }}>
                        {product.brand_name}
                      </p>
                      <p
                        style={{
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          margin: "0 0 3px",
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
                      {product.compare_price > 0 && product.compare_price !== product.price && (
                        <p
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: "'Bebas Neue',sans-serif",
                            fontSize: "0.9rem",
                            textDecoration: "line-through",
                            margin: "0 0 1px",
                            letterSpacing: "0.04em",
                          }}>
                          {fmtMoney(product.compare_price * qty)}
                        </p>
                      )}
                      <p
                        style={{
                          color: "#ef4444",
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1.2rem",
                          margin: 0,
                          letterSpacing: "0.04em",
                        }}>
                        {fmtMoney(itemTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Review blocks */}
                  {[
                    {
                      title: "Contact",
                      editStep: 0,
                      val: (
                        <>
                          {contact.email}
                          <br />
                          {contact.phone}
                        </>
                      ),
                    },
                    deliveryMode === "delivery" ? {
                      title: "Delivery Address",
                      editStep: 1,
                      val: (
                        <>
                          {delivery.firstName} {delivery.lastName}
                          <br />
                          {delivery.address}
                          {delivery.apt ? `, ${delivery.apt}` : ""}
                          <br />
                          {delivery.city}, {delivery.zip}
                          <br />
                          {delivery.state_name && `${delivery.state_name}, `}
                          {delivery.country_name}
                        </>
                      ),
                    } : {
                      title: "Pickup Location",
                      editStep: 1,
                      val: selectedPickup ? (
                        <>
                          {selectedPickup.name}
                          <br />
                          {selectedPickup.address}, {selectedPickup.city}
                          {selectedPickup.state && `, ${selectedPickup.state}`}
                          {selectedPickup.phone && (
                            <>
                              <br />
                              📞 {selectedPickup.phone}
                            </>
                          )}
                        </>
                      ) : "Not selected",
                    },
                    deliveryMode === "delivery" ? {
                      title: "Shipping Method",
                      editStep: 1,
val: selectedShippingMethod ? (
  <>
    {selectedShippingMethod.name}
    {selectedShippingMethod.description && ` — ${selectedShippingMethod.description}`}
    {deliveryCost > 0 ? ` (${fmtMoney(deliveryCost)})` : " (FREE)"}
  </>
) : "Not selected",
                    } : null,
                    {
                      title: "Payment",
                      editStep: 2,
                      val:
                        payment.method === "card"
                          ? `Card ending in ${payment.cardNumber.replace(/\s/g, "").slice(-4) || "••••"}`
                          : payment.method === "flutterwave"
                          ? "Flutterwave"
                          : payment.method === "transfer" && receipt
                          ? `Bank Transfer (Receipt: ${receipt.name})`
                          : PAYMENT_METHODS.find((m) => m.id === payment.method)?.label,
                    },
                  ].filter(Boolean).map((block) => (
                    <div
                      key={block.title}
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 12,
                        padding: "13px 16px",
                        marginBottom: 10,
                      }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.28)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                          }}>
                          {block.title}
                        </span>
                        <button
                          onClick={() => setStep(block.editStep)}
                          style={{
                            color: "#ef4444",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
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
                        {block.val}
                      </p>
                    </div>
                  ))}

                  {/* Order total breakdown */}
                  <div
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      borderRadius: 12,
                      padding: "14px 18px",
                      marginTop: 14,
                    }}>
                    {product.compare_price > 0 && product.compare_price !== product.price && (
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
                      style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                      <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>
                        {deliveryMode === "pickup" ? "Pickup" : "Shipping"}
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
                    {tax > 0 && (
                      <div
                        style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                        <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>Tax</span>
                        <span style={{color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700}}>
                          {fmtMoney(tax)}
                        </span>
                      </div>
                    )}
                    {product.compare_price > 0 && product.compare_price !== product.price && (
                      <div
                        style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                        <span style={{color: "#22c55e", fontSize: 12, fontWeight: 700}}>
                          You Save
                        </span>
                        <span style={{color: "#22c55e", fontSize: 12, fontWeight: 700}}>
                          {fmtMoney((product.compare_price - product.price) * qty)}
                        </span>
                      </div>
                    )}
                    <div
                      style={{height: 1, background: "rgba(255,255,255,0.07)", margin: "0 0 10px"}}
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
                          fontSize: "1.1rem",
                          color: "#fff",
                          letterSpacing: "0.08em",
                        }}>
                        TOTAL
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

                  {/* ✅ NEW: Order error display */}
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
                </div>
              )}

              {/* ✅ Navigation buttons */}
              <div style={{display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap"}}>
                {step > 0 && (
                  <button
                    onClick={back}
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "14px 20px",
                      cursor: "pointer",
                      borderRadius: 8,
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                    }}>
                    ← Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={next}
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
                      padding: "14px 20px",
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
                      background: placing ? "#15803d" : "#22c55e",
                      color: "#fff",
                      border: "none",
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      padding: "14px 20px",
                      cursor: placing && !paymentStuck ? "not-allowed" : "pointer",
                      borderRadius: 8,
                      transition: "background 0.2s",
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
                )}
              </div>

              {/* ✅ NEW: Processing message */}
              {placing && !paymentStuck && (
                <p
                  style={{
                    width: "100%",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 10,
                    marginTop: 12,
                    animation: "pulse 1.4s infinite",
                  }}>
                  Please complete payment in the popup window...
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Size Picker Modal (Keep as-is) ────────────────────────────────────────────
function SizePicker({product, onConfirm, onClose}) {
  const {fmtMoney} = usePlatformSettings();
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const availSizes = product.sizes?.filter((s) => s.stock > 0) || [];

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleConfirm = () => {
    if (availSizes.length > 0 && !selectedSize) {
      setError("Please select a size");
      return;
    }
    onConfirm(selectedSize || "One Size", qty);
  };
  
  const maxStock = selectedSize
    ? product.sizes?.find((s) => s.size === selectedSize)?.stock || 10
    : 10;

  const hasDiscount = product.compare_price > 0 && product.compare_price !== product.price;

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
        zIndex: 2000,
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
          {availSizes.length > 0 && (
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
                      setSelectedSize(sz.size);
                      setError("");
                    }}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 8,
                      border: `1px solid ${selectedSize === sz.size ? "#ef4444" : sz.stock > 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                      background:
                        selectedSize === sz.size
                          ? "rgba(239,68,68,0.12)"
                          : sz.stock > 0
                            ? "rgba(255,255,255,0.04)"
                            : "transparent",
                      color:
                        selectedSize === sz.size
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
              {error && (
                <p
                  style={{color: "#ef4444", fontSize: 11, fontWeight: 700, margin: "-12px 0 14px"}}>
                  {error}
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
            onClick={handleConfirm}
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

// ─── Skeleton Card (Keep as-is) ────────────────────────────────────────────────
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
        {[40, 80, 35].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 2 ? 18 : i === 1 ? 12 : 9,
              width: `${w}%`,
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

// ─── My Products Card (Keep as-is from your original) ──────────────────────────
function MyProductCard({product, viewMode, onStatusChange}) {
  const {fmtMoney} = usePlatformSettings();
  const [updating, setUpdating] = useState(false);
  const st = STATUS_COLORS[product.status] || STATUS_COLORS.draft;
  const tag = product.tags
    ? TAG_COLORS[product.tags.toLowerCase()] || {
        bg: "rgba(255,255,255,0.08)",
        text: "rgba(255,255,255,0.5)",
      }
    : null;
  const hasDiscount = product.compare_price > 0 && product.compare_price !== product.price;

  const handleTogglePublish = async () => {
    const newStatus = product.status === "active" ? "draft" : "active";
    setUpdating(true);
    try {
      await updateBrandProductStatus(product.id, newStatus);
      onStatusChange(product.id, newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdating(false);
    }
  };

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{opacity: 0, y: 8}}
        animate={{opacity: 1, y: 0}}
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: 0,
          transition: "border-color 0.18s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}>
        <div style={{position: "relative", flexShrink: 0}}>
          <img
            src={getImg(product) || "https://placehold.co/80x80/111/333?text=?"}
            alt={product.name}
            style={{width: 80, height: 80, objectFit: "cover", display: "block"}}
          />
          {product.is_featured === 1 && (
            <span
              style={{
                position: "absolute",
                bottom: 4,
                left: 4,
                background: "#f59e0b",
                color: "#000",
                fontSize: 7,
                fontWeight: 900,
                letterSpacing: "0.1em",
                padding: "2px 5px",
                borderRadius: 3,
                textTransform: "uppercase",
              }}>
              ★ Featured
            </span>
          )}
        </div>
        <div style={{flex: 1, padding: "12px 16px", minWidth: 0}}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
              flexWrap: "wrap",
            }}>
            <span
              style={{
                background: st.bg,
                border: `1px solid ${st.border}`,
                color: st.text,
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "2px 7px",
                borderRadius: 4,
              }}>
              {product.status?.replace("_", " ")}
            </span>
            {tag && (
              <span
                style={{
                  background: tag.bg,
                  color: tag.text,
                  fontSize: 8,
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: 4,
                }}>
                {product.tags}
              </span>
            )}
            <span
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}>
              {product.category_name}
            </span>
          </div>
          <p
            style={{
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              margin: "0 0 4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
            {product.name}
          </p>
          {product.sizes?.length > 0 && (
            <div style={{display: "flex", gap: 3, flexWrap: "wrap"}}>
              {product.sizes.slice(0, 5).map((sz) => (
                <span
                  key={sz.id}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: sz.stock > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                    fontSize: 8,
                    padding: "1px 5px",
                    borderRadius: 3,
                    textDecoration: sz.stock === 0 ? "line-through" : "none",
                  }}>
                  {sz.size}
                </span>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "12px 16px",
            flexShrink: 0,
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
          }}>
          <div style={{textAlign: "right"}}>
            {hasDiscount && (
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "0.9rem",
                  textDecoration: "line-through",
                  margin: 0,
                  letterSpacing: "0.04em",
                }}>
                {fmtMoney(product.compare_price)}
              </p>
            )}
            <p
              style={{
                color: "#ef4444",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "1.2rem",
                letterSpacing: "0.04em",
                margin: 0,
              }}>
              {fmtMoney(product.price)}
            </p>
          </div>
          {product.status !== "archived" && product.status !== "sold_out" && (
            <button
              onClick={handleTogglePublish}
              disabled={updating}
              style={{
                background:
                  product.status === "active" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                border: `1px solid ${product.status === "active" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                color: product.status === "active" ? "#ef4444" : "#22c55e",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: updating ? "not-allowed" : "pointer",
                opacity: updating ? 0.6 : 1,
                whiteSpace: "nowrap",
              }}>
              {updating ? "…" : product.status === "active" ? "Unpublish" : "Publish"}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Grid view (keep your existing code from the original file)
  return (
    <motion.div
      initial={{opacity: 0, y: 8}}
      animate={{opacity: 1, y: 0}}
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 0.18s,transform 0.18s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "translateY(0)";
      }}>
      <div style={{position: "relative"}}>
        <img
          src={getImg(product) || "https://placehold.co/200x200/111/333?text=?"}
          alt={product.name}
          style={{width: "100%", aspectRatio: "1", objectFit: "cover", display: "block"}}
        />
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: st.bg,
            border: `1px solid ${st.border}`,
            color: st.text,
            fontSize: 8,
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            padding: "3px 7px",
            borderRadius: 4,
            backdropFilter: "blur(4px)",
          }}>
          {product.status?.replace("_", " ")}
        </span>
        {tag && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: tag.bg,
              color: tag.text,
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "3px 7px",
              borderRadius: 4,
              backdropFilter: "blur(4px)",
            }}>
            {product.tags}
          </span>
        )}
        {product.is_featured === 1 && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "rgba(245,158,11,0.9)",
              color: "#000",
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: "0.1em",
              padding: "3px 8px",
              borderRadius: 4,
              textTransform: "uppercase",
            }}>
            ★ Featured
          </span>
        )}
      </div>
      <div
        style={{padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 0}}>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            margin: "0 0 3px",
          }}>
          {product.category_name}
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
          {product.name}
        </p>
        {product.sizes?.length > 0 && (
          <div style={{display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8}}>
            {product.sizes.slice(0, 4).map((sz) => (
              <span
                key={sz.id}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: sz.stock > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                  fontSize: 8,
                  padding: "1px 5px",
                  borderRadius: 3,
                  textDecoration: sz.stock === 0 ? "line-through" : "none",
                }}>
                {sz.size}
              </span>
            ))}
            {product.sizes.length > 4 && (
              <span style={{color: "rgba(255,255,255,0.2)", fontSize: 8, alignSelf: "center"}}>
                +{product.sizes.length - 4}
              </span>
            )}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
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
                {fmtMoney(product.compare_price)}
              </p>
            )}
            <p
              style={{
                color: "#ef4444",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "1.15rem",
                letterSpacing: "0.04em",
                margin: 0,
                lineHeight: 1.1,
              }}>
              {fmtMoney(product.price)}
            </p>
          </div>
          {product.status !== "archived" && product.status !== "sold_out" ? (
            <button
              onClick={handleTogglePublish}
              disabled={updating}
              style={{
                background:
                  product.status === "active" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                border: `1px solid ${product.status === "active" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
                color: product.status === "active" ? "#ef4444" : "#22c55e",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "7px 11px",
                borderRadius: 6,
                cursor: updating ? "not-allowed" : "pointer",
                opacity: updating ? 0.6 : 1,
                transition: "all 0.15s",
              }}>
              {updating ? "…" : product.status === "active" ? "Unpublish" : "Publish"}
            </button>
          ) : (
            <span
              style={{
                background: "rgba(100,116,139,0.12)",
                border: "1px solid rgba(100,116,139,0.25)",
                color: "#64748b",
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "7px 11px",
                borderRadius: 6,
              }}>
              {product.status}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Brand Shop Component ─────────────────────────────────────────────────
export default function BrandShop({currentBrandId}) {
  const {settings, fmtMoney} = usePlatformSettings();
  const purchasesDisabled = settings.disable_purchases === true;

  const [activeTab, setActiveTab] = useState("browse");

  const [resolvedBrandId, setResolvedBrandId] = useState(currentBrandId || null);

  useEffect(() => {
    if (currentBrandId) {
      setResolvedBrandId(currentBrandId);
      return;
    }
    getBrandProfile()
      .then((p) => {
        const bid = p?.brand_id ?? p?.id ?? p?.brand?.id ?? null;
        if (bid) setResolvedBrandId(String(bid));
      })
      .catch(() => {});
  }, [currentBrandId]);

  const [browseProducts, setBrowseProducts] = useState([]);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browsePages, setBrowsePages] = useState(1);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseSearch, setBrowseSearch] = useState("");
  const [browseDSearch, setBrowseDSearch] = useState("");
  const [browseSort, setBrowseSort] = useState("newest");
  const [browseBrandID, setBrowseBrandID] = useState("");
  const [brands, setBrands] = useState([]);
  const [pickerProduct, setPickerProduct] = useState(null);
  const [checkoutItem, setCheckoutItem] = useState(null);

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishTogging, setWishToggling] = useState(new Set());
  const [wishToast, setWishToast] = useState(null);

  useEffect(() => {
    getWishlist()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setWishlistIds(new Set(arr.map((i) => String(i.product_id ?? i.id))));
      })
      .catch(() => {});
  }, []);

  const showWishToast = (msg, ok = true) => {
    setWishToast({msg, ok});
    setTimeout(() => setWishToast(null), 2800);
  };

  const handleWishToggle = async (p) => {
    const pid = String(p.id);
    if (wishTogging.has(pid)) return;
    setWishToggling((prev) => new Set([...prev, pid]));
    const isWished = wishlistIds.has(pid);
    try {
      if (isWished) {
        await removeFromWishlist(p.id);
        setWishlistIds((prev) => {
          const n = new Set(prev);
          n.delete(pid);
          return n;
        });
        showWishToast("Removed from wishlist", false);
      } else {
        await addToWishlist(p.id);
        setWishlistIds((prev) => new Set([...prev, pid]));
        showWishToast("Added to wishlist ♥");
      }
    } catch (e) {
      showWishToast(e.message || "Something went wrong", false);
    } finally {
      setWishToggling((prev) => {
        const n = new Set(prev);
        n.delete(pid);
        return n;
      });
    }
  };

  const [myProducts, setMyProducts] = useState([]);
  const [myTotal, setMyTotal] = useState(0);
  const [myPages, setMyPages] = useState(1);
  const [myPage, setMyPage] = useState(1);
  const [myLoading, setMyLoading] = useState(true);
  const [mySearch, setMySearch] = useState("");
  const [myDSearch, setMyDSearch] = useState("");
  const [myStatusFilter, setMyStatusFilter] = useState("all");
  const [myCategory, setMyCategory] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setBrowseDSearch(browseSearch), 400);
    return () => clearTimeout(t);
  }, [browseSearch]);
  useEffect(() => {
    const t = setTimeout(() => setMyDSearch(mySearch), 400);
    return () => clearTimeout(t);
  }, [mySearch]);
  useEffect(() => {
    setBrowsePage(1);
  }, [browseDSearch, browseBrandID, browseSort]);
  useEffect(() => {
    setMyPage(1);
  }, [myDSearch, myStatusFilter, myCategory]);

  useEffect(() => {
    getBrands()
      .then((d) => setBrands(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchBrowse = useCallback(() => {
    setBrowseLoading(true);
    const params = {page: browsePage, limit: 16, sort: browseSort, status: "active"};
    if (browseDSearch) params.search = browseDSearch;
    if (browseBrandID) params.brand_id = browseBrandID;
    getProducts(params)
      .then((d) => {
        const all = Array.isArray(d) ? d : d?.products || [];
        const filtered = resolvedBrandId
          ? all.filter(
              (p) =>
                String(p.brand_id) !== String(resolvedBrandId) &&
                String(p.brand?.id) !== String(resolvedBrandId),
            )
          : all;
        setBrowseProducts(filtered);
        setBrowseTotal(filtered.length);
        setBrowsePages(Array.isArray(d) ? 1 : d?.pages || 1);
        setBrowseLoading(false);
      })
      .catch(() => setBrowseLoading(false));
  }, [browsePage, browseDSearch, browseBrandID, browseSort, resolvedBrandId]);

  useEffect(() => {
    if (activeTab === "browse") fetchBrowse();
  }, [fetchBrowse, activeTab]);

  useEffect(() => {
    listBrandProducts({page: 1, limit: 1})
      .then((d) => {
        const total = Array.isArray(d) ? d.length : (d?.total ?? 0);
        setMyTotal(total);
      })
      .catch(() => {});
  }, []);

  const fetchMine = useCallback(() => {
    setMyLoading(true);
    const params = {page: myPage, limit: 16};
    if (myDSearch) params.search = myDSearch;
    if (myStatusFilter !== "all") params.status = myStatusFilter;
    if (myCategory) params.category_id = myCategory;
    listBrandProducts(params)
      .then((d) => {
        const prods = Array.isArray(d) ? d : d?.products || [];
        setMyProducts(prods);
        setMyTotal(Array.isArray(d) ? prods.length : d?.total || prods.length);
        setMyPages(Array.isArray(d) ? 1 : d?.pages || 1);
        const cats = [
          ...new Map(
            prods
              .filter((p) => p.category_id && p.category_name)
              .map((p) => [p.category_id, {id: p.category_id, name: p.category_name}]),
          ).values(),
        ];
        if (cats.length) setCategories(cats);
        setMyLoading(false);
      })
      .catch(() => setMyLoading(false));
  }, [myPage, myDSearch, myStatusFilter, myCategory]);

  useEffect(() => {
    if (activeTab === "mine") fetchMine();
  }, [fetchMine, activeTab]);

  const handleBuyNow = (p) => setPickerProduct(p);
  const handlePickerConfirm = (size, qty) => {
    setPickerProduct(null);
    setCheckoutItem({product: pickerProduct, size, qty});
  };
  const handleStatusChange = (id, newStatus) => {
    setMyProducts((prev) => prev.map((p) => (p.id === id ? {...p, status: newStatus} : p)));
  };

  const myActiveCount = myProducts.filter((p) => p.status === "active").length;

  return (
    <div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .brand-shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;}
        .my-prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}
        .my-prod-list{display:flex;flex-direction:column;gap:8px;}
        .step-label{display:inline!important;}
        @media(max-width:600px){
          .brand-shop-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
          .my-prod-grid{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
        }
        @media(max-width:380px){
          .brand-shop-grid{grid-template-columns:1fr!important;}
          .my-prod-grid{grid-template-columns:1fr!important;}
          .step-label{display:none!important;}
        }
      `}</style>

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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p style={{color: "#f97316", fontSize: 12, fontWeight: 700, margin: 0}}>
            Purchases are currently paused by the platform administrator. Browsing is still
            available.
          </p>
        </div>
      )}

      <AnimatePresence>
        {wishToast && (
          <motion.div
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 10}}
            style={{
              position: "fixed",
              bottom: 28,
              right: 20,
              zIndex: 3000,
              background: wishToast.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${wishToast.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: 10,
              padding: "12px 18px",
              color: wishToast.ok ? "#22c55e" : "#ef4444",
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              maxWidth: "calc(100vw - 40px)",
            }}>
            {wishToast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pickerProduct && (
          <SizePicker
            product={pickerProduct}
            onConfirm={handlePickerConfirm}
            onClose={() => setPickerProduct(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {checkoutItem && (
          <QuickCheckout
            product={checkoutItem.product}
            size={checkoutItem.size}
            qty={checkoutItem.qty}
            onClose={() => setCheckoutItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Page header */}
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
          Storefront
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}>
          <h2
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(1.8rem,3vw,2.4rem)",
              color: "#fff",
              letterSpacing: "0.04em",
              margin: 0,
            }}>
            SHOP
          </h2>
          <button
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 24,
        }}>
        {[
          {id: "browse", label: "Browse Shop", count: browseTotal},
          {id: "mine", label: "My Products", count: myTotal},
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.id ? "#ef4444" : "transparent"}`,
              color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.35)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "5px 10px 15px",
              marginRight: 28,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}>
            {tab.label}
            <span
              style={{
                background: activeTab === tab.id ? "#ef4444" : "rgba(255,255,255,0.08)",
                color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: 900,
                padding: "3px 7px",
                borderRadius: 99,
                minWidth: 18,
                textAlign: "center",
                transition: "all 0.2s",
              }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── BROWSE SHOP TAB ── */}
      {activeTab === "browse" && (
        <div>
          <div style={{display: "flex", flexDirection: "column", gap: 12, marginBottom: 22}}>
            <div style={{display: "flex", gap: 10}}>
              <div style={{position: "relative", flex: 1}}>
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                  style={{
                    position: "absolute",
                    left: 13,
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
                  type="text"
                  placeholder="Search products…"
                  value={browseSearch}
                  onChange={(e) => setBrowseSearch(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 13,
                    padding: "11px 14px 11px 38px",
                    borderRadius: 10,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
              <select
                value={browseSort}
                onChange={(e) => setBrowseSort(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  padding: "11px 14px",
                  borderRadius: 10,
                  outline: "none",
                  cursor: "pointer",
                }}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
            <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
              <button
                onClick={() => setBrowseBrandID("")}
                style={{
                  padding: "7px 15px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${browseBrandID === "" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: browseBrandID === "" ? "rgba(239,68,68,0.1)" : "transparent",
                  color: browseBrandID === "" ? "#ef4444" : "rgba(255,255,255,0.45)",
                }}>
                All Brands
              </button>
              {brands
                .filter((b) => String(b.id) !== String(resolvedBrandId))
                .map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBrowseBrandID(String(b.id))}
                    style={{
                      padding: "7px 15px",
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `1px solid ${browseBrandID === String(b.id) ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                      background:
                        browseBrandID === String(b.id) ? "rgba(239,68,68,0.1)" : "transparent",
                      color: browseBrandID === String(b.id) ? "#ef4444" : "rgba(255,255,255,0.45)",
                    }}>
                    {b.brand_name}
                  </button>
                ))}
            </div>
          </div>

          {browseLoading ? (
            <div className="brand-shop-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : browseProducts.length === 0 ? (
            <div
              style={{
                background: "#0d0d0d",
                border: "1px dashed rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: "80px 20px",
                textAlign: "center",
              }}>
              <svg
                width="40"
                height="40"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                style={{margin: "0 auto 16px", display: "block"}}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Bebas Neue',sans-serif",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}>
                NO PRODUCTS FOUND
              </p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, marginBottom: 16}}>
                No products from other brands yet.
              </p>
              {(browseSearch || browseBrandID) && (
                <button
                  onClick={() => {
                    setBrowseSearch("");
                    setBrowseBrandID("");
                  }}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "8px 18px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{marginBottom: 14}}>
                <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
                  {browseTotal} product{browseTotal !== 1 ? "s" : ""} available from other brands
                </p>
              </div>
              <div className="brand-shop-grid">
                {browseProducts.map((p) => {
                  const hasDiscount = p.compare_price > 0 && p.compare_price !== p.price;
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: "#0d0d0d",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 14,
                        overflow: "hidden",
                        transition: "border-color 0.18s,transform 0.18s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}>
                      <div style={{position: "relative"}}>
                        <img
                          src={getImg(p) || "https://placehold.co/200x200/111/333?text=?"}
                          alt={p.name}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        {p.tags && (
                          <span
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              background: "#ef4444",
                              color: "#fff",
                              fontSize: 8,
                              fontWeight: 900,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              padding: "3px 7px",
                              borderRadius: 4,
                            }}>
                            {p.tags}
                          </span>
                        )}
                        {hasDiscount && (
                          <span
                            style={{
                              position: "absolute",
                              top: p.tags ? 32 : 8,
                              right: 8,
                              background: "#22c55e",
                              color: "#000",
                              fontSize: 8,
                              fontWeight: 900,
                              letterSpacing: "0.1em",
                              padding: "3px 7px",
                              borderRadius: 4,
                            }}>
                            SAVE {fmtMoney(p.compare_price - p.price)}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!purchasesDisabled) handleWishToggle(p);
                          }}
                          disabled={purchasesDisabled || wishTogging.has(String(p.id))}
                          title={purchasesDisabled ? "Purchases are currently paused" : ""}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: hasDiscount ? 46 : 8,
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: wishlistIds.has(String(p.id))
                              ? "rgba(239,68,68,0.85)"
                              : "rgba(0,0,0,0.55)",
                            border: `1px solid ${wishlistIds.has(String(p.id)) ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.15)"}`,
                            backdropFilter: "blur(4px)",
                            cursor:
                              purchasesDisabled || wishTogging.has(String(p.id))
                                ? "not-allowed"
                                : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.18s",
                            opacity: wishTogging.has(String(p.id)) ? 0.6 : 1,
                            zIndex: 2,
                          }}
                          onMouseEnter={(e) => {
                            if (!wishlistIds.has(String(p.id)))
                              e.currentTarget.style.background = "rgba(239,68,68,0.7)";
                          }}
                          onMouseLeave={(e) => {
                            if (!wishlistIds.has(String(p.id)))
                              e.currentTarget.style.background = "rgba(0,0,0,0.55)";
                          }}>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill={wishlistIds.has(String(p.id)) ? "#fff" : "none"}
                            stroke={
                              wishlistIds.has(String(p.id)) ? "#fff" : "rgba(255,255,255,0.8)"
                            }
                            strokeWidth="2.5">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>
                      </div>
                      <div style={{padding: "12px 14px"}}>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            margin: "0 0 3px",
                          }}>
                          {p.brand_name}
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
                          {p.name}
                        </p>
                        {p.sizes?.length > 0 && (
                          <div style={{display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8}}>
                            {p.sizes.slice(0, 4).map((sz) => (
                              <span
                                key={sz.id}
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  fontSize: 8,
                                  padding: "1px 5px",
                                  borderRadius: 3,
                                  color:
                                    sz.stock > 0
                                      ? "rgba(255,255,255,0.4)"
                                      : "rgba(255,255,255,0.15)",
                                  textDecoration: sz.stock === 0 ? "line-through" : "none",
                                }}>
                                {sz.size}
                              </span>
                            ))}
                            {p.sizes.length > 4 && (
                              <span
                                style={{
                                  color: "rgba(255,255,255,0.2)",
                                  fontSize: 8,
                                  alignSelf: "center",
                                }}>
                                +{p.sizes.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
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
                                {fmtMoney(p.compare_price)}
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
                              {fmtMoney(p.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => !purchasesDisabled && handleBuyNow(p)}
                            disabled={purchasesDisabled}
                            title={purchasesDisabled ? "Purchases are currently paused" : ""}
                            style={{
                              background: purchasesDisabled ? "rgba(255,255,255,0.06)" : "#ef4444",
                              border: purchasesDisabled
                                ? "1px solid rgba(255,255,255,0.1)"
                                : "none",
                              color: purchasesDisabled ? "rgba(255,255,255,0.25)" : "#fff",
                              fontSize: 9,
                              fontWeight: 900,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              padding: "7px 11px",
                              borderRadius: 6,
                              cursor: purchasesDisabled ? "not-allowed" : "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (!purchasesDisabled) e.currentTarget.style.background = "#dc2626";
                            }}
                            onMouseLeave={(e) => {
                              if (!purchasesDisabled) e.currentTarget.style.background = "#ef4444";
                            }}>
                            {purchasesDisabled ? "Paused" : "Buy Now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {browsePages > 1 && (
                <div style={{display: "flex", justifyContent: "center", gap: 8, marginTop: 28}}>
                  <button
                    onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                    disabled={browsePage === 1}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: browsePage === 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: browsePage === 1 ? "not-allowed" : "pointer",
                    }}>
                    ← Prev
                  </button>
                  {Array.from({length: Math.min(5, browsePages)}, (_, i) => {
                    const pg =
                      browsePage <= 3
                        ? i + 1
                        : browsePage >= browsePages - 2
                          ? browsePages - 4 + i
                          : browsePage - 2 + i;
                    return pg >= 1 && pg <= browsePages ? (
                      <button
                        key={pg}
                        onClick={() => setBrowsePage(pg)}
                        style={{
                          background: pg === browsePage ? "#ef4444" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${pg === browsePage ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                          color: pg === browsePage ? "#fff" : "rgba(255,255,255,0.5)",
                          fontSize: 11,
                          fontWeight: 700,
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          cursor: "pointer",
                        }}>
                        {pg}
                      </button>
                    ) : null;
                  })}
                  <button
                    onClick={() => setBrowsePage((p) => Math.min(browsePages, p + 1))}
                    disabled={browsePage === browsePages}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color:
                        browsePage === browsePages
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(255,255,255,0.6)",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: browsePage === browsePages ? "not-allowed" : "pointer",
                    }}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── MY PRODUCTS TAB ── */}
      {activeTab === "mine" && (
        <div>
          <div style={{display: "flex", gap: 10, marginBottom: 14}}>
            <div style={{position: "relative", flex: 1}}>
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                style={{
                  position: "absolute",
                  left: 13,
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
                type="text"
                placeholder="Search your products…"
                value={mySearch}
                onChange={(e) => setMySearch(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 13,
                  padding: "11px 14px 11px 38px",
                  borderRadius: 10,
                  outline: "none",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                overflow: "hidden",
              }}>
              {[
                {
                  id: "grid",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="8" height="8" rx="1" />
                      <rect x="13" y="3" width="8" height="8" rx="1" />
                      <rect x="3" y="13" width="8" height="8" rx="1" />
                      <rect x="13" y="13" width="8" height="8" rx="1" />
                    </svg>
                  ),
                },
                {
                  id: "list",
                  icon: (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5">
                      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ),
                },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  style={{
                    padding: "10px 14px",
                    background: viewMode === v.id ? "rgba(239,68,68,0.15)" : "transparent",
                    border: "none",
                    color: viewMode === v.id ? "#ef4444" : "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {v.icon}
                </button>
              ))}
            </div>
          </div>

          <div style={{display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14}}>
            {[
              {id: "all", label: "All"},
              {id: "active", label: "Active"},
              {id: "draft", label: "Draft"},
              {id: "sold_out", label: "Sold Out"},
              {id: "archived", label: "Archived"},
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setMyStatusFilter(f.id)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${myStatusFilter === f.id ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: myStatusFilter === f.id ? "rgba(239,68,68,0.1)" : "transparent",
                  color: myStatusFilter === f.id ? "#ef4444" : "rgba(255,255,255,0.4)",
                  transition: "all 0.15s",
                }}>
                {f.label}
              </button>
            ))}
            {categories.length > 0 && (
              <select
                value={myCategory}
                onChange={(e) => setMyCategory(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  padding: "7px 14px",
                  borderRadius: 99,
                  outline: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                }}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {myLoading ? (
            <div className={viewMode === "grid" ? "my-prod-grid" : "my-prod-list"}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : myProducts.length === 0 ? (
            <div
              style={{
                background: "#0d0d0d",
                border: "1px dashed rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: "80px 20px",
                textAlign: "center",
              }}>
              <svg
                width="40"
                height="40"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                style={{margin: "0 auto 16px", display: "block"}}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Bebas Neue',sans-serif",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}>
                NO PRODUCTS FOUND
              </p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, marginBottom: 16}}>
                {mySearch || myStatusFilter !== "all" || myCategory
                  ? "No products match your filters."
                  : "You haven't added any products yet."}
              </p>
              {(mySearch || myStatusFilter !== "all" || myCategory) && (
                <button
                  onClick={() => {
                    setMySearch("");
                    setMyStatusFilter("all");
                    setMyCategory("");
                  }}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "8px 18px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{marginBottom: 14}}>
                <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
                  {myTotal} product{myTotal !== 1 ? "s" : ""} · {myActiveCount} active
                </p>
              </div>
              <div className={viewMode === "grid" ? "my-prod-grid" : "my-prod-list"}>
                {myProducts.map((p) => (
                  <MyProductCard
                    key={p.id}
                    product={p}
                    viewMode={viewMode}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
              {myPages > 1 && (
                <div style={{display: "flex", justifyContent: "center", gap: 8, marginTop: 28}}>
                  <button
                    onClick={() => setMyPage((p) => Math.max(1, p - 1))}
                    disabled={myPage === 1}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: myPage === 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: myPage === 1 ? "not-allowed" : "pointer",
                    }}>
                    ← Prev
                  </button>
                  {Array.from({length: Math.min(5, myPages)}, (_, i) => {
                    const pg =
                      myPage <= 3
                        ? i + 1
                        : myPage >= myPages - 2
                          ? myPages - 4 + i
                          : myPage - 2 + i;
                    return pg >= 1 && pg <= myPages ? (
                      <button
                        key={pg}
                        onClick={() => setMyPage(pg)}
                        style={{
                          background: pg === myPage ? "#ef4444" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${pg === myPage ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                          color: pg === myPage ? "#fff" : "rgba(255,255,255,0.5)",
                          fontSize: 11,
                          fontWeight: 700,
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          cursor: "pointer",
                        }}>
                        {pg}
                      </button>
                    ) : null;
                  })}
                  <button
                    onClick={() => setMyPage((p) => Math.min(myPages, p + 1))}
                    disabled={myPage === myPages}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: myPage === myPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: myPage === myPages ? "not-allowed" : "pointer",
                    }}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}