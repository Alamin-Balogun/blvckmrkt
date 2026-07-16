import {useState, useEffect, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  getBrandProfile,
  updateBrandProfile,
  getSubscriptionPlans,
  getSubscriptionStatus,
  activateSubscription,
  deleteBrandAccount,
} from "./dashboard_components/api";
import ImageUpload from "../../../../components/ImageUpload";
import PhoneInput from "../../../../components/phoneinput";
import { useGeo } from "../../../../utils/geo";

const BASE = "https://blvckmrktng.com/api";
function token() {
  return localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
}

const inp = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: 13,
  padding: "12px 14px",
  borderRadius: 9,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};
const onF = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
const onB = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

function Label({c}) {
  return (
    <label
      style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        display: "block",
        marginBottom: 6,
      }}>
      {c}
    </label>
  );
}

function Toast({msg, ok}) {
  if (!msg) return null;
  return (
    <div
      style={{
        background: ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        border: `1px solid ${ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
        borderRadius: 9,
        padding: "10px 14px",
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
      {ok ? (
        <svg width="13" height="13" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span style={{color: ok ? "#22c55e" : "#ef4444", fontSize: 12, fontWeight: 600}}>{msg}</span>
    </div>
  );
}

const CATEGORIES = [
  "Streetwear",
  "Sneakers",
  "Accessories",
  "Outerwear",
  "Bottoms",
  "Tops",
  "Headwear",
  "Bags",
  "Jewellery",
  "Vintage",
  "Other",
];

// ─── Brand Plans & Upgrade Flow ──────────────────────────────────────────────
function planColors(p) {
  if (p.is_popular)
    return {color: "#ef4444", accent: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.4)"};
  if (p.plan_type === "brand")
    return {color: "#f59e0b", accent: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.4)"};
  if (p.plan_type === "buyer")
    return {color: "#3b82f6", accent: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.4)"};
  return {color: "rgba(255,255,255,0.7)", accent: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.15)"};
}

function parsePerks(featuresJson) {
  if (!featuresJson) return [];
  try {
    const arr = JSON.parse(featuresJson);
    return arr.filter((f) => f.included).map((f) => f.text);
  } catch {
    return [];
  }
}

const BILLING_OPTIONS = [
  {id: "monthly", label: "Monthly Billing", sub: "Billed every month", discount: null},
  {id: "annual", label: "Annual Billing", sub: "Billed once per year", discount: "Save 20%"},
];

const uInp = (err = false) => ({
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
const uf = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)");
const ub = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");
function ULabel({c}) {
  return (
    <label style={{
      color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
      letterSpacing: "0.22em", textTransform: "uppercase", display: "block", marginBottom: 5,
    }}>
      {c}
    </label>
  );
}
function UErr({m}) {
  return m ? (
    <span style={{color: "#ef4444", fontSize: 10, fontWeight: 700, marginTop: 3, display: "block"}}>
      {m}
    </span>
  ) : null;
}

function BrandUpgradeFlow() {
  const [step, setStep]       = useState(0);
  const [errors, setErrors]   = useState({});
  const [placing, setPlacing] = useState(false);
  const [done, setDone]       = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [plans, setPlans]                     = useState([]);
  const [plansLoading, setPlansLoading]       = useState(true);
  const [currentPlanSlug, setCurrentPlanSlug] = useState("");
  const [currentStatus, setCurrentStatus]     = useState("");
  const [plan, setPlan]                       = useState("");
  const [billing, setBilling]                 = useState("monthly");

  const [payment, setPayment] = useState({
    method: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });

  useEffect(() => {
    Promise.all([getSubscriptionPlans(), getSubscriptionStatus()])
      .then(([plansData, statusData]) => {
        const loaded = plansData?.plans || [];
        setPlans(loaded);
        const slug =
          statusData?.brand?.subscription_plan ||
          statusData?.subscription?.plan_slug ||
          "";
        setCurrentPlanSlug(slug);
        setCurrentStatus(
          statusData?.brand?.subscription_status ||
          statusData?.subscription?.status ||
          ""
        );
        const defaultSlug =
          loaded.find((p) => p.slug !== slug)?.slug ||
          loaded[0]?.slug ||
          "";
        setPlan(defaultSlug);
      })
      .catch(() => {
        getSubscriptionPlans()
          .then((d) => {
            const loaded = d?.plans || [];
            setPlans(loaded);
            setPlan(loaded[0]?.slug || "");
          })
          .catch(() => {});
      })
      .finally(() => setPlansLoading(false));
  }, []);

  const sel       = plans.find((p) => p.slug === plan);
  const selColors = sel ? planColors(sel) : planColors({});

  const getDisplayPrice = (p, billingCycle) => {
    if (!p) return "—";
    const isFree = p.monthly_price === 0 && p.annual_price === 0;
    if (isFree) return "Free";
    const isTrial = p.trial_days > 0;
    if (isTrial) return "Free";
    if (billingCycle === "annual") {
      const amount = p.annual_price > 0 ? p.annual_price : p.monthly_price;
      return `₦${amount.toLocaleString()}/mo · billed as ₦${(amount * 12).toLocaleString()}/yr`;
    }
    return `₦${p.monthly_price.toLocaleString()}/mo`;
  };

  const getPlanCardPrice = (p, billingCycle) => {
    if (!p) return {main: "—", suffix: "", strikethrough: null};
    const isFree = p.monthly_price === 0 && p.annual_price === 0;
    if (isFree) return {main: "Free", suffix: "", strikethrough: null};
    const isTrial = p.trial_days > 0;
    if (isTrial) return {
      main: "Free",
      suffix: "",
      strikethrough: `₦${p.monthly_price.toLocaleString()}`,
    };
    if (billingCycle === "annual") {
      const amount = p.annual_price > 0 ? p.annual_price : p.monthly_price;
      return {main: `₦${amount.toLocaleString()}`, suffix: "/mo", strikethrough: null};
    }
    return {main: `₦${p.monthly_price.toLocaleString()}`, suffix: "/mo", strikethrough: null};
  };

  const displayPx = getDisplayPrice(sel, billing);

  const fmtCard   = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExpiry = (v) => {
    const s = v.replace(/\D/g, "").slice(0, 4);
    return s.length >= 3 ? s.slice(0, 2) + "/" + s.slice(2) : s;
  };

  const inpStyle = (hasErr = false) => ({
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasErr ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
    color: "#fff", fontSize: 13, padding: "12px 14px", outline: "none",
    width: "100%", boxSizing: "border-box", borderRadius: 8,
    transition: "border-color 0.2s", fontFamily: "inherit",
  });
  const onFocus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)");
  const onBlur  = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

  const validate = () => {
    const e = {};
    if (step === 1 && payment.method === "card") {
      if (!payment.cardName.trim()) e.cardName = "Required";
      if (!payment.cardNumber.replace(/\s/g, "").match(/^\d{16}$/))
        e.cardNumber = "Valid 16-digit number required";
      if (!payment.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = "MM/YY";
      if (!payment.cvv.match(/^\d{3,4}$/)) e.cvv = "3–4 digits";
    }
    if (step === 1 && payment.method === "transfer" && !receipt)
      e.receipt = "Please upload payment receipt";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext  = () => { if (validate()) setStep((s) => s + 1); };

  const handlePlace = async () => {
    if (!validate()) return;
    setPlacing(true);
    setErrors({});
    try {
      const isFree   = sel && sel.monthly_price === 0 && sel.annual_price === 0;
      const hasTrial = sel && sel.trial_days > 0;
      const paymentInfo =
        !isFree && !hasTrial
          ? {
              method: payment.method,
              reference:
                payment.method === "transfer"
                  ? `TRF-${Date.now()}`
                  : `REF-${Date.now()}`,
              receipt_url: receipt ? URL.createObjectURL(receipt) : undefined,
            }
          : undefined;

      await activateSubscription({plan, billing, payment: paymentInfo});
      setDone(true);
    } catch (e) {
      setErrors({submit: e.message || "Failed to activate subscription. Please try again."});
    } finally {
      setPlacing(false);
    }
  };

  const UP_STEPS = ["Plan", "Payment", "Review"];

  if (done)
    return (
      <motion.div
        initial={{opacity: 0, y: 16}}
        animate={{opacity: 1, y: 0}}
        style={{background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "36px 28px", textAlign: "center"}}>
        <motion.div
          initial={{scale: 0}} animate={{scale: 1}}
          transition={{type: "spring", stiffness: 260, damping: 20, delay: 0.1}}
          style={{width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px"}}>
          <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
            <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
              initial={{pathLength: 0}} animate={{pathLength: 1}} transition={{duration: 0.5, delay: 0.3}} />
          </svg>
        </motion.div>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8}}>
          Upgrade Successful
        </p>
        <h3 style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", color: "#fff", letterSpacing: "0.04em", margin: "0 0 10px", lineHeight: 1}}>
          WELCOME TO <span style={{color: "#ef4444"}}>BLVCKMRKT</span> BRANDS
        </h3>
        <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.7, margin: "0 auto 20px", maxWidth: 380}}>
          Your <strong style={{color: "#fff"}}>{sel?.name}</strong> plan is now active.
          Confirmation sent to your email.
        </p>
      </motion.div>
    );

  if (plansLoading)
    return (
      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{height: 72, borderRadius: 12, background: "rgba(255,255,255,0.04)", animation: "pulse 1.4s infinite", animationDelay: `${i * 0.1}s`}} />
        ))}
      </div>
    );

  return (
    <div>
      {/* Stepper */}
      <div style={{display: "flex", alignItems: "center", marginBottom: 24}}>
        {UP_STEPS.map((s, i) => (
          <div key={s} style={{display: "flex", alignItems: "center", flex: i < UP_STEPS.length - 1 ? 1 : "none"}}>
            <div style={{display: "flex", alignItems: "center", gap: 7, flexShrink: 0}}>
              <div style={{width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, transition: "all 0.3s", color: "#fff", background: i < step ? "#22c55e" : i === step ? "#ef4444" : "rgba(255,255,255,0.07)"}}>
                {i < step ? (
                  <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className="bs-steplabel" style={{fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: i < step ? "#22c55e" : i === step ? "#fff" : "rgba(255,255,255,0.2)"}}>
                {s}
              </span>
            </div>
            {i < UP_STEPS.length - 1 && (
              <div style={{flex: 1, height: 1, margin: "0 8px", transition: "background 0.3s", background: i < step ? "#22c55e" : "rgba(255,255,255,0.08)"}} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{opacity: 0, x: 14}}
          animate={{opacity: 1, x: 0}}
          exit={{opacity: 0, x: -14}}
          transition={{duration: 0.2}}>

          {/* ── STEP 0: Plan ── */}
          {step === 0 && (
            <div>
              <p style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: "#fff", letterSpacing: "0.08em", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8}}>
                <span style={{width: 3, height: 14, background: "#ef4444", display: "inline-block", borderRadius: 2}} />
                Choose Your Plan
              </p>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 16px"}}>
                Pick the plan that fits your brand — upgrade anytime.
              </p>

              <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 18}}>
                {plans.map((p) => {
                  const c          = planColors(p);
                  const isSelected = plan === p.slug;
                  const isCurrent  = p.slug === currentPlanSlug;
                  const isDisabled = isCurrent;
                  const badge      = p.is_popular ? (p.tag || "Most Popular") : (p.tag || null);
                  const cardPrice  = getPlanCardPrice(p, billing);

                  return (
                    <div
                      key={p.slug}
                      onClick={() => !isDisabled && setPlan(p.slug)}
                      style={{background: isSelected ? c.accent : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? c.border : isCurrent ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "14px 16px", cursor: isDisabled ? "not-allowed" : "pointer", transition: "all 0.2s", position: "relative", opacity: isDisabled ? 0.6 : 1}}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isDisabled) {
                          e.currentTarget.style.borderColor = c.border;
                          e.currentTarget.style.background  = c.accent;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isDisabled) {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                          e.currentTarget.style.background  = "rgba(255,255,255,0.02)";
                        }
                      }}>

                      {badge && (
                        <span style={{position: "absolute", top: -10, right: isCurrent ? 110 : 14, background: c.color, color: p.plan_type === "none" ? "#fff" : "#000", fontSize: 8, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 99}}>
                          {badge}
                        </span>
                      )}

                      {isCurrent && (
                        <span style={{position: "absolute", top: -10, right: 14, background: currentStatus === "active" ? "rgba(34,197,94,0.15)" : currentStatus === "trial" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.08)", border: `1px solid ${currentStatus === "active" ? "rgba(34,197,94,0.4)" : currentStatus === "trial" ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.15)"}`, color: currentStatus === "active" ? "#22c55e" : currentStatus === "trial" ? "#3b82f6" : "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4}}>
                          <span style={{width: 5, height: 5, borderRadius: "50%", background: currentStatus === "active" ? "#22c55e" : currentStatus === "trial" ? "#3b82f6" : "rgba(255,255,255,0.4)", display: "inline-block"}} />
                          {currentStatus === "trial" ? "Current · Trial" : "Current Plan"}
                        </span>
                      )}

                      <div style={{display: "flex", alignItems: "flex-start", gap: 12}}>
                        <div style={{width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2, border: `2px solid ${isSelected ? c.color : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s", opacity: isCurrent ? 0.4 : 1}}>
                          {isSelected && !isCurrent && (
                            <div style={{width: 8, height: 8, borderRadius: "50%", background: c.color}} />
                          )}
                          {isCurrent && (
                            <svg width="8" height="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>

                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6}}>
                            <span style={{color: isSelected ? c.color : "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase"}}>
                              {p.name}
                            </span>
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={billing + p.slug}
                                initial={{opacity: 0, y: 6}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -6}}
                                transition={{duration: 0.18}}
                                style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.2rem", color: isSelected ? "#fff" : "rgba(255,255,255,0.5)"}}>
                                {cardPrice.main}
                                {cardPrice.suffix && (
                                  <span style={{fontSize: "0.65rem", fontFamily: "system-ui", color: "rgba(255,255,255,0.3)"}}>
                                    {cardPrice.suffix}
                                  </span>
                                )}
                              </motion.span>
                            </AnimatePresence>
                            {cardPrice.strikethrough && (
                              <span style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.95rem", color: "rgba(255,255,255,0.2)", textDecoration: "line-through"}}>
                                {cardPrice.strikethrough}
                              </span>
                            )}
                            {p.trial_days > 0 && (
                              <span style={{background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: 8, fontWeight: 900, padding: "2px 7px", borderRadius: 99, letterSpacing: "0.08em"}}>
                                {p.trial_days}d free trial
                              </span>
                            )}
                          </div>
                          {billing === "annual" && p.annual_price > 0 && !isCurrent && p.monthly_price > 0 && (
                            <p style={{color: "#22c55e", fontSize: 9, fontWeight: 700, margin: "0 0 6px", letterSpacing: "0.05em"}}>
                              Save ₦{((p.monthly_price - p.annual_price) * 12).toLocaleString()}/yr vs monthly
                            </p>
                          )}
                          <div style={{display: "flex", flexWrap: "wrap", gap: "4px 14px"}}>
                            {parsePerks(p.features).slice(0, 5).map((pk) => (
                              <span key={pk} style={{display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.4)", fontSize: 11}}>
                                <svg width="9" height="9" fill="none" stroke={isSelected ? c.color : "rgba(255,255,255,0.2)"} strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {pk}
                              </span>
                            ))}
                          </div>
                          {isCurrent && (
                            <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "8px 0 0", fontStyle: "italic"}}>
                              You are already on this plan
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10}}>
                Billing Cycle
              </p>
              <div style={{display: "flex", gap: 10, marginBottom: 4, flexWrap: "wrap"}}>
                {BILLING_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setBilling(opt.id)}
                    style={{flex: 1, minWidth: 140, padding: "11px 14px", border: `1px solid ${billing === opt.id ? "#ef4444" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, cursor: "pointer", transition: "all 0.2s", background: billing === opt.id ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 10}}>
                    <div style={{width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `2px solid ${billing === opt.id ? "#ef4444" : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center"}}>
                      {billing === opt.id && <div style={{width: 7, height: 7, borderRadius: "50%", background: "#ef4444"}} />}
                    </div>
                    <div style={{flex: 1}}>
                      <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>{opt.label}</p>
                      <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>{opt.sub}</p>
                    </div>
                    {opt.discount && (
                      <span style={{background: "rgba(34,197,94,0.1)", color: "#22c55e", fontSize: 9, fontWeight: 900, padding: "2px 8px", borderRadius: 99}}>
                        {opt.discount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: Payment ── */}
          {step === 1 && (
            <div>
              <p style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: "#fff", letterSpacing: "0.08em", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8}}>
                <span style={{width: 3, height: 14, background: "#ef4444", display: "inline-block", borderRadius: 2}} />
                Payment Method
              </p>

              <div style={{display: "flex", gap: 10, marginBottom: 20}}>
                {[
                  {id: "card",        label: "Credit / Debit Card", icon: "💳"},
                  {id: "flutterwave", label: "Flutterwave",         icon: "🦋"},
                  {id: "transfer",    label: "Bank Transfer",       icon: "🏦"},
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPayment({...payment, method: m.id})}
                    style={{flex: 1, padding: "12px 8px", border: `1px solid ${payment.method === m.id ? "#ef4444" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, background: payment.method === m.id ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "all 0.2s"}}
                    onMouseEnter={(e) => { if (payment.method !== m.id) e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                    onMouseLeave={(e) => { if (payment.method !== m.id) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                    <span style={{fontSize: 18}}>{m.icon}</span>
                    <span style={{fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: payment.method === m.id ? "#fff" : "rgba(255,255,255,0.4)", textAlign: "center"}}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>

              {payment.method === "card" && (
                <>
                  <div style={{background: "linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, marginBottom: 20, position: "relative", overflow: "hidden"}}>
                    <div style={{position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(239,68,68,0.08)"}} />
                    <p style={{color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20}}>Card Preview</p>
                    <p style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.25em", marginBottom: 14}}>
                      {payment.cardNumber || "•••• •••• •••• ••••"}
                    </p>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
                      <div>
                        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 2px"}}>Card Holder</p>
                        <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>{payment.cardName || "YOUR NAME"}</p>
                      </div>
                      <div style={{textAlign: "right"}}>
                        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 2px"}}>Expires</p>
                        <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>{payment.expiry || "MM/YY"}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                    <div>
                      <ULabel c="Name on Card *" />
                      <input style={inpStyle(!!errors.cardName)} placeholder="John Doe" value={payment.cardName} onChange={(e) => setPayment({...payment, cardName: e.target.value})} onFocus={onFocus} onBlur={onBlur} />
                      <UErr m={errors.cardName} />
                    </div>
                    <div>
                      <ULabel c="Card Number *" />
                      <input style={inpStyle(!!errors.cardNumber)} placeholder="1234 5678 9012 3456" value={payment.cardNumber} onChange={(e) => setPayment({...payment, cardNumber: fmtCard(e.target.value)})} onFocus={onFocus} onBlur={onBlur} />
                      <UErr m={errors.cardNumber} />
                    </div>
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                      <div>
                        <ULabel c="Expiry *" />
                        <input style={inpStyle(!!errors.expiry)} placeholder="MM/YY" value={payment.expiry} onChange={(e) => setPayment({...payment, expiry: fmtExpiry(e.target.value)})} onFocus={onFocus} onBlur={onBlur} />
                        <UErr m={errors.expiry} />
                      </div>
                      <div>
                        <ULabel c="CVV *" />
                        <input type="password" style={inpStyle(!!errors.cvv)} placeholder="•••" maxLength={4} value={payment.cvv} onChange={(e) => setPayment({...payment, cvv: e.target.value.replace(/\D/g, "").slice(0, 4)})} onFocus={onFocus} onBlur={onBlur} />
                        <UErr m={errors.cvv} />
                      </div>
                    </div>
                  </div>
                  <div style={{marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8}}>
                    <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p style={{color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0}}>
                      Preview only — actual payment processed securely by Paystack
                    </p>
                  </div>
                </>
              )}

              {payment.method === "flutterwave" && (
                <div style={{background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: "40px 24px", textAlign: "center"}}>
                  <p style={{fontSize: "2.5rem", marginBottom: 10}}>🦋</p>
                  <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 6}}>
                    You'll be redirected to <strong style={{color: "#fff"}}>Flutterwave</strong> for payment
                  </p>
                  <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>Cards, Mobile Money, Bank Transfer & USSD</p>
                </div>
              )}

              {payment.method === "transfer" && (
                <div>
                  <div style={{background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "20px 22px", marginBottom: 20}}>
                    <p style={{color: "rgba(255,255,255,0.28)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 14}}>
                      Transfer To This Account
                    </p>
                    {[
                      {label: "Bank Name",      value: "First Bank of Nigeria"},
                      {label: "Account Name",   value: "BLVCKMRKT Limited"},
                      {label: "Account Number", value: "3012 4567 89"},
                      {label: "Amount",         value: displayPx},
                      {label: "Reference",      value: `BRAND-${Date.now().toString().slice(-6)}`},
                    ].map((r) => (
                      <div key={r.label} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
                        <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>{r.label}</span>
                        <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <ULabel c="Upload Transfer Receipt *" />
                    <div
                      onClick={() => document.getElementById("bu-receipt").click()}
                      style={{border: `2px dashed ${errors.receipt ? "#ef4444" : receipt ? "#22c55e" : "rgba(255,255,255,0.15)"}`, borderRadius: 12, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: receipt ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)"}}>
                      {receipt ? (
                        <>
                          <div style={{width: 44, height: 44, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px"}}>
                            <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p style={{color: "#22c55e", fontSize: 12, fontWeight: 700, marginBottom: 4}}>{receipt.name}</p>
                          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>
                            ({(receipt.size / 1024).toFixed(1)} KB) —{" "}
                            <span style={{color: "#ef4444", cursor: "pointer", textDecoration: "underline"}}
                              onClick={(e) => { e.stopPropagation(); setReceipt(null); }}>
                              Remove
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" viewBox="0 0 24 24" style={{margin: "0 auto 12px"}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p style={{color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 4}}>Click to upload receipt</p>
                          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>PNG, JPG, PDF — max 5MB</p>
                        </>
                      )}
                    </div>
                    <input id="bu-receipt" type="file" accept="image/png,image/jpeg,application/pdf" style={{display: "none"}}
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f && f.size <= 5 * 1024 * 1024) { setReceipt(f); setErrors((p) => ({...p, receipt: null})); }
                      }} />
                    <UErr m={errors.receipt} />
                  </div>
                </div>
              )}

              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 14, textAlign: "center"}}>
                🔒 Your payment information is encrypted and secure
              </p>
            </div>
          )}

          {/* ── STEP 2: Review ── */}
          {step === 2 && (
            <div>
              <p style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: "#fff", letterSpacing: "0.08em", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8}}>
                <span style={{width: 3, height: 14, background: "#ef4444", display: "inline-block", borderRadius: 2}} />
                Review & Confirm
              </p>
              <div style={{background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", marginBottom: 12}}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                  <span style={{color: "rgba(255,255,255,0.28)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase"}}>Brand Plan</span>
                  <button onClick={() => setStep(0)} style={{color: "#ef4444", fontSize: 9, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0}}>Edit</button>
                </div>
                <p style={{color: "rgba(255,255,255,0.65)", fontSize: 12, margin: 0, lineHeight: 1.7}}>
                  {sel?.name} — {displayPx}
                  {sel?.trial_days > 0 && (
                    <span style={{color: "#22c55e", fontSize: 10, marginLeft: 8, fontWeight: 700}}>{sel.trial_days}d free trial</span>
                  )}
                </p>
              </div>
              <div style={{background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", marginBottom: 12}}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                  <span style={{color: "rgba(255,255,255,0.28)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase"}}>Payment</span>
                  <button onClick={() => setStep(1)} style={{color: "#ef4444", fontSize: 9, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0}}>Edit</button>
                </div>
                <p style={{color: "rgba(255,255,255,0.65)", fontSize: 12, margin: 0}}>
                  {payment.method === "card"
                    ? `Card ending in ${payment.cardNumber.replace(/\s/g, "").slice(-4) || "••••"}`
                    : payment.method === "transfer"
                    ? <>{`Bank Transfer `}{receipt && <span style={{color: "#22c55e"}}>✓ Receipt uploaded</span>}</>
                    : payment.method === "flutterwave"
                    ? "Flutterwave"
                    : "—"}
                </p>
              </div>
              <div style={{background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "14px 16px", marginTop: 4}}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 5}}>
                  <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>Plan</span>
                  <span style={{color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700}}>{sel?.name}</span>
                </div>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                  <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>Billing</span>
                  <span style={{color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700}}>{billing === "annual" ? "Annual" : "Monthly"}</span>
                </div>
                <div style={{height: 1, background: "rgba(255,255,255,0.07)", margin: "0 0 8px"}} />
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <span style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: "#fff", letterSpacing: "0.08em"}}>TOTAL</span>
                  <span style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", color: selColors.color}}>{displayPx}</span>
                </div>
              </div>
              {errors.submit && (
                <div style={{background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", marginTop: 12, color: "#ef4444", fontSize: 12}}>
                  {errors.submit}
                </div>
              )}
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: "12px 0 0", lineHeight: 1.6}}>
                By upgrading you agree to our brand terms of service.
              </p>
            </div>
          )}

          {/* Nav */}
          <div style={{display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap"}}>
            {step > 0 && (
              <button
                onClick={() => { setStep((s) => s - 1); setErrors({}); }}
                style={{background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer", borderRadius: 8, transition: "all 0.2s", whiteSpace: "nowrap"}}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>
                ← Back
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={handleNext}
                style={{flex: 1, minWidth: 140, background: "#ef4444", color: "#fff", border: "none", fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer", borderRadius: 8, transition: "background 0.2s"}}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
                {step === 1 ? "Review Upgrade →" : "Continue →"}
              </button>
            ) : (
              <button
                onClick={handlePlace}
                disabled={placing}
                style={{flex: 1, minWidth: 140, background: placing ? "#15803d" : "#22c55e", color: "#fff", border: "none", fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", padding: "12px 20px", cursor: placing ? "not-allowed" : "pointer", borderRadius: 8, transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8}}>
                {placing && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                )}
                {placing ? "Processing..." : `🔒 Upgrade to ${sel?.name || "—"} — ${displayPx}`}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────
export default function Settings({onBrandUpdate}) {
  const { Country, State, City, loaded } = useGeo();
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [savingPw, setSavingPw]     = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg]           = useState(null);
  const [socialMsg, setSocialMsg]   = useState(null);
  const [phoneValid, setPhoneValid] = useState(true);

  const [form, setForm] = useState({
    first_name:   "",
    last_name:    "",
    email:        "",
    avatar_url:   "",
    brand_name:   "",
    category:     "Streetwear",
    description:  "",
    logo_url:     "",
    banner_url:   "",
    website:      "",
    instagram:    "",
    facebook:     "",
    twitter:      "",
    // ✅ FIX: DB column is tik_tok — use tik_tok as the key throughout
    tik_tok:      "",
    phone:        "",
    country_code: "",
    country_name: "",
    state_code:   "",
    state_name:   "",
    city:         "",
  });

  const [pw, setPw] = useState({current: "", newPass: "", confirm: ""});

  useEffect(() => {
    getBrandProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          first_name:   p.first_name   || "",
          last_name:    p.last_name    || "",
          email:        p.email        || "",
          avatar_url:   p.avatar_url   || "",
          brand_name:   p.brand_name   || p.name || "",
          category:     p.category     || "Streetwear",
          description:  p.description  || "",
          logo_url:     p.logo_url     || "",
          banner_url:   p.banner_url   || "",
          website:      p.website      || "",
          instagram:    p.instagram    || "",
          facebook:     p.facebook     || "",
          twitter:      p.twitter      || "",
          // ✅ FIX: read from both possible keys the API might return
          tik_tok:      p.tik_tok || p.tiktok || "",
          phone:        p.phone        || "",
          country_code: p.country_code || "",
          country_name: p.country_name || "",
          state_code:   p.state_code   || "",
          state_name:   p.state_name   || "",
          city:         p.city         || "",
        });
      })
      .catch((e) => setProfileMsg({msg: "Failed to load profile: " + e.message, ok: false}))
      .finally(() => setLoading(false));
  }, []);

  const flash = (setter, msg, ok, delay = 4000) => {
    setter({msg, ok});
    setTimeout(() => setter(null), delay);
  };

  const set = (k) => (e) => setForm((f) => ({...f, [k]: e.target.value}));

  const handleSaveProfile = async () => {
    console.log("FULL FORM:", JSON.stringify(form, null, 2));
    if (!phoneValid) {
      return flash(setProfileMsg, "Please enter a valid phone number before saving.", false, 5000);
    }
    setSaving(true);
    setProfileMsg(null);
    try {
      const payload = {
        // Personal
        first_name:   form.first_name,
        last_name:    form.last_name,
        email:        form.email,
        avatar_url:   form.avatar_url,
        // Brand
        name:         form.brand_name,
        brand_name:   form.brand_name,
        category:     form.category,
        description:  form.description,
        logo_url:     form.logo_url,
        banner_url:   form.banner_url,
        website:      form.website,
        phone:        form.phone,
        // Location
        country_code: form.country_code,
        country_name: form.country_name,
        state_code:   form.state_code,
        state_name:   form.state_name,
        city:         form.city,
        // Social — send both keys so the backend accepts whichever it expects
        instagram:    form.instagram,
        facebook:     form.facebook,
        twitter:      form.twitter,
        tik_tok:      form.tik_tok,   // ✅ matches DB column name
        tiktok:       form.tik_tok,   // ✅ also send as tiktok in case API uses that key
      };
      const updated = await updateBrandProfile(payload);
      if (updated) {
        setProfile(updated);
        setForm((prev) => ({
          ...prev,
          first_name:   updated.first_name   ?? prev.first_name,
          last_name:    updated.last_name     ?? prev.last_name,
          email:        updated.email         ?? prev.email,
          avatar_url:   updated.avatar_url    ?? prev.avatar_url,
          brand_name:   updated.brand_name    ?? updated.name ?? prev.brand_name,
          category:     updated.category      ?? prev.category,
          description:  updated.description   ?? prev.description,
          logo_url:     updated.logo_url       ?? prev.logo_url,
          banner_url:   updated.banner_url     ?? prev.banner_url,
          website:      updated.website        ?? prev.website,
          instagram:    updated.instagram      ?? prev.instagram,
          facebook:     updated.facebook       ?? prev.facebook,
          twitter:      updated.twitter        ?? prev.twitter,
          tik_tok:      updated.tik_tok  ?? updated.tiktok ?? prev.tik_tok,
          phone:        updated.phone          ?? prev.phone,
          country_code: updated.country_code   ?? prev.country_code,
          country_name: updated.country_name   ?? prev.country_name,
          state_code:   updated.state_code     ?? prev.state_code,
          state_name:   updated.state_name     ?? prev.state_name,
          city:         updated.city           ?? prev.city,
        }));
        onBrandUpdate?.(updated);
      }
      flash(setProfileMsg, "Profile updated successfully.", true);
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e?.message || e?.error || e?.detail || "Failed to update profile. Please try again.";
      flash(setProfileMsg, msg, false);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!pw.current || !pw.newPass || !pw.confirm)
      return flash(setPwMsg, "All fields are required.", false);
    if (pw.newPass !== pw.confirm) return flash(setPwMsg, "New passwords don't match.", false);
    if (pw.newPass.length < 8)
      return flash(setPwMsg, "New password must be at least 8 characters.", false);
    setSavingPw(true);
    try {
      const res = await fetch(`${BASE}/auth/change-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json", Authorization: `Bearer ${token()}`},
        body: JSON.stringify({current_password: pw.current, new_password: pw.newPass}),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Incorrect current password.");
      }
      setPw({current: "", newPass: "", confirm: ""});
      flash(setPwMsg, "Password updated successfully.", true);
    } catch (e) {
      flash(setPwMsg, e.message || "Failed to change password.", false);
    } finally {
      setSavingPw(false);
    }
  };

  const handleSaveSocial = async () => {
    setSocialMsg(null);
    setSavingSocial(true);
    try {
      const updated = await updateBrandProfile({
        instagram: form.instagram,
        facebook:  form.facebook,
        twitter:   form.twitter,
        tik_tok:   form.tik_tok,  // ✅ matches DB column
        tiktok:    form.tik_tok,  // ✅ also send as tiktok for API compatibility
      });
      if (updated) {
        setProfile(updated);
        // ✅ Update local form state with whatever key the API returns
        setForm((prev) => ({
          ...prev,
          instagram: updated.instagram ?? prev.instagram,
          facebook:  updated.facebook  ?? prev.facebook,
          twitter:   updated.twitter   ?? prev.twitter,
          tik_tok:   updated.tik_tok ?? updated.tiktok ?? prev.tik_tok,
        }));
        onBrandUpdate?.(updated);
      }
      flash(setSocialMsg, "Social handles updated successfully.", true);
    } catch (e) {
      const msg =
        typeof e === "string"
          ? e
          : e?.message || e?.error || e?.detail || "Failed to update social handles. Please try again.";
      flash(setSocialMsg, msg, false);
    } finally {
      setSavingSocial(false);
    }
  };

  if (loading)
    return (
      <div style={{display: "flex", flexDirection: "column", gap: 14}}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        {[180, 260, 140].map((h, i) => (
          <div key={i} style={{height: h, background: "#0d0d0d", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", animation: "pulse 1.4s infinite"}} />
        ))}
      </div>
    );

  const brandInitial = (form.brand_name[0] || "B").toUpperCase();

  return (
    <div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .bs-top-row{display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start;margin-bottom:16px;}
        .bs-name-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
        .bs-2col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:860px){.bs-top-row{grid-template-columns:1fr!important;}}
        .bs-steplabel{display:inline;}
        @media(max-width:520px){.bs-name-row,.bs-2col{grid-template-columns:1fr!important;}.bs-steplabel{display:none!important;}}
        select option { background: #111 !important; color: #fff !important; }
        select option:checked { background: #ef4444 !important; color: #fff !important; }
      `}</style>

      <div style={{marginBottom: 24}}>
        <h2 style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", color: "#fff", letterSpacing: "0.04em", margin: "0 0 4px"}}>
          SETTINGS
        </h2>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
          Manage your brand profile, security, and account settings.
        </p>
      </div>

      <div className="bs-top-row">
        {/* ── Brand Profile ── */}
        <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px"}}>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8}}>
            <span style={{width: 3, height: 14, background: "#ef4444", display: "inline-block", borderRadius: 2}} />
            Brand Profile
          </p>

          {profileMsg && <Toast msg={profileMsg.msg} ok={profileMsg.ok} />}

          {/* Personal Info */}
          <div style={{background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px", marginBottom: 16}}>
            <p style={{color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6}}>
              <span style={{width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-block"}} />
              Personal Info
            </p>
            <div style={{marginBottom: 14}}>
              <Label c="Profile Photo" />
              <div style={{display: "flex", gap: 14, alignItems: "center"}}>
                <div style={{width: 52, height: 52, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.2rem", color: "rgba(255,255,255,0.4)", border: "2px solid rgba(255,255,255,0.1)"}}>
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="avatar" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                  ) : (
                    ((form.first_name[0] || "U") + (form.last_name[0] || "")).toUpperCase()
                  )}
                </div>
                <ImageUpload
                  folder="avatars"
                  shape="circle"
                  label="Upload Photo"
                  preview={form.avatar_url}
                  onUpload={(url) => setForm((f) => ({...f, avatar_url: url}))}
                />
                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.6, margin: 0}}>
                  Your personal profile photo.<br />Shown in sidebar &amp; topbar.
                </p>
              </div>
            </div>
            <div className="bs-name-row">
              <div>
                <Label c="First Name" />
                <input value={form.first_name} onChange={set("first_name")} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <Label c="Last Name" />
                <input value={form.last_name} onChange={set("last_name")} style={inp} onFocus={onF} onBlur={onB} />
              </div>
            </div>
            <div>
              <Label c="Email Address" />
              <input type="email" value={form.email} onChange={set("email")} style={inp} onFocus={onF} onBlur={onB} />
            </div>
          </div>

          {/* Brand Info */}
          <div style={{background: "rgba(239,68,68,0.02)", border: "1px solid rgba(239,68,68,0.08)", borderRadius: 10, padding: "14px 16px", marginBottom: 16}}>
            <p style={{color: "rgba(239,68,68,0.4)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6}}>
              <span style={{width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block"}} />
              Brand Info
            </p>

            {/* Logo */}
            <div style={{marginBottom: 14}}>
              <Label c="Brand Logo" />
              <div style={{display: "flex", gap: 14, alignItems: "center"}}>
                <div style={{width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#ef4444,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", color: "#fff", border: "2px solid rgba(255,255,255,0.1)"}}>
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="logo" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                  ) : brandInitial}
                </div>
                <ImageUpload
                  folder="logos"
                  shape="square"
                  label="Upload Logo"
                  preview={form.logo_url}
                  onUpload={(url) => setForm((f) => ({...f, logo_url: url}))}
                />
                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.6, margin: 0}}>
                  Brand logo for your<br />storefront page.
                </p>
              </div>
            </div>

            {/* Banner */}
            <div style={{marginBottom: 14}}>
              <Label c="Brand Banner" />
              <div style={{marginBottom: 8, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", height: 80, position: "relative", display: "flex", alignItems: "center", justifyContent: "center"}}>
                {form.banner_url ? (
                  <img src={form.banner_url} alt="banner" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                ) : (
                  <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
                    No banner uploaded — storefront will show a gradient
                  </p>
                )}
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                <ImageUpload
                  folder="banners"
                  shape="square"
                  label="Upload Banner"
                  preview={form.banner_url}
                  onUpload={(url) => setForm((f) => ({...f, banner_url: url}))}
                />
                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.6, margin: 0}}>
                  Wide banner for your storefront header. Recommended: 1200×400px.
                </p>
              </div>
            </div>

            <div style={{marginBottom: 10}}>
              <Label c="Brand Name" />
              <input value={form.brand_name} onChange={set("brand_name")} style={inp} onFocus={onF} onBlur={onB} />
            </div>

            <div className="bs-2col" style={{marginBottom: 10}}>
              <div>
                <Label c="Category" />
                <select value={form.category} onChange={set("category")} style={{...inp, cursor: "pointer", appearance: "none", colorScheme: "dark"}}>
                  {CATEGORIES.map((c) => (
                    <option key={c} style={{background: "#1a1a1a", color: "#fff"}}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label c="Verification Status" />
                <div style={{...inp, display: "flex", alignItems: "center", gap: 8, cursor: "default", pointerEvents: "none", color: profile?.verification_status === "verified" ? "#22c55e" : profile?.verification_status === "rejected" ? "#ef4444" : "#f97316"}}>
                  <div style={{width: 7, height: 7, borderRadius: "50%", background: profile?.verification_status === "verified" ? "#22c55e" : profile?.verification_status === "rejected" ? "#ef4444" : "#f97316", flexShrink: 0}} />
                  <span style={{fontSize: 12, fontWeight: 700, textTransform: "capitalize"}}>
                    {profile?.verification_status || "Pending"}
                  </span>
                </div>
                {(!profile?.verification_status || profile.verification_status === "pending") && (
                  <div style={{marginTop: 8, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "9px 12px", display: "flex", gap: 8, alignItems: "flex-start"}}>
                    <svg width="13" height="13" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink: 0, marginTop: 1}}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p style={{color: "rgba(245,158,11,0.85)", fontSize: 11, margin: 0, lineHeight: 1.6}}>
                      Verification is reviewed by our team. Keep your profile complete to speed up approval.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div style={{background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 10, padding: "14px 16px", marginBottom: 14}}>
              <p style={{color: "rgba(99,102,241,0.7)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6}}>
                <svg width="10" height="10" fill="none" stroke="rgba(99,102,241,0.7)" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
                <span style={{color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 10}}>
                  {" "}— used for currency detection
                </span>
              </p>
              <div style={{marginBottom: 10}}>
                <Label c="Country" />
                <select
                  value={form.country_code}
                  onChange={(e) => {
                    const c = loaded ? Country.getCountryByCode(e.target.value) : null;
                    setForm((f) => ({...f, country_code: e.target.value, country_name: c?.name || "", state_code: "", state_name: "", city: ""}));
                  }}
                  style={{...inp, cursor: "pointer", appearance: "none", colorScheme: "dark", background: "#111"}}
                  onFocus={onF} onBlur={onB}>
                  <option value="" style={{background: "#111", color: "rgba(255,255,255,0.4)"}}>Select country…</option>
                  {(loaded ? Country.getAllCountries() : []).map((c) => (
                    <option key={c.isoCode} value={c.isoCode} style={{background: "#111", color: "#fff"}}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              {form.country_code && (
                <div style={{marginBottom: 10}}>
                  <Label c="State / Region" />
                  <select
                    value={form.state_code}
                    onChange={(e) => {
                      const s = loaded ? State.getStateByCodeAndCountry(e.target.value, form.country_code) : null;
                      setForm((f) => ({...f, state_code: e.target.value, state_name: s?.name || "", city: ""}));
                    }}
                    style={{...inp, cursor: "pointer", appearance: "none", colorScheme: "dark", background: "#111"}}
                    onFocus={onF} onBlur={onB}>
                    <option value="" style={{background: "#111", color: "rgba(255,255,255,0.4)"}}>Select state…</option>
                    {(loaded ? State.getStatesOfCountry(form.country_code) : []).map((s) => (
                      <option key={s.isoCode} value={s.isoCode} style={{background: "#111", color: "#fff"}}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.state_code && (
                <div>
                  <Label c="City (optional)" />
                  {(loaded ? City.getCitiesOfState(form.country_code, form.state_code) : []).length > 0 ? (
                    <select
                      value={form.city}
                      onChange={(e) => setForm((f) => ({...f, city: e.target.value}))}
                      style={{...inp, cursor: "pointer", appearance: "none", colorScheme: "dark", background: "#111"}}
                      onFocus={onF} onBlur={onB}>
                      <option value="" style={{background: "#111", color: "rgba(255,255,255,0.4)"}}>Select city…</option>
                      {(loaded ? City.getCitiesOfState(form.country_code, form.state_code) : []).map((c) => (
                        <option key={c.name} value={c.name} style={{background: "#111", color: "#fff"}}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input value={form.city} onChange={(e) => setForm((f) => ({...f, city: e.target.value}))} style={inp} placeholder="Type city name…" onFocus={onF} onBlur={onB} />
                  )}
                </div>
              )}
              {form.country_name && (
                <p style={{color: "rgba(99,102,241,0.5)", fontSize: 10, margin: "10px 0 0"}}>
                  📍 {[form.city, form.state_name, form.country_name].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            <div className="bs-2col" style={{marginBottom: 10}}>
              <div>
                <Label c="Contact Phone" />
                <PhoneInput
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({...f, phone: v}))}
                  onValidChange={(ok) => setPhoneValid(ok)}
                />
              </div>
              <div>
                <Label c="Website" />
                <input value={form.website} onChange={set("website")} style={inp} onFocus={onF} onBlur={onB} placeholder="https://…" />
              </div>
            </div>

            <div style={{marginBottom: 10}}>
              <Label c="Brand Description" />
              <textarea
                rows={3}
                value={form.description}
                onChange={set("description")}
                style={{...inp, resize: "vertical", lineHeight: 1.6}}
                onFocus={onF} onBlur={onB}
                placeholder="Tell buyers what your brand is about…"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            style={{background: saving ? "#7f1d1d" : "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", transition: "background 0.18s", display: "flex", alignItems: "center", gap: 8}}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#dc2626"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#ef4444"; }}>
            {saving && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* ── Right Column ── */}
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          {/* Change Password */}
          <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px"}}>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8}}>
              <span style={{width: 3, height: 14, background: "#6366f1", display: "inline-block", borderRadius: 2}} />
              Change Password
            </p>
            {pwMsg && <Toast msg={pwMsg.msg} ok={pwMsg.ok} />}
            <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 16}}>
              <div>
                <Label c="Current Password" />
                <input type="password" value={pw.current} onChange={(e) => setPw((p) => ({...p, current: e.target.value}))} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <Label c="New Password" />
                <input type="password" placeholder="Min. 8 characters" value={pw.newPass} onChange={(e) => setPw((p) => ({...p, newPass: e.target.value}))} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <Label c="Confirm New Password" />
                <input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({...p, confirm: e.target.value}))} style={inp} onFocus={onF} onBlur={onB} onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={savingPw}
              style={{width: "100%", background: savingPw ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)", color: savingPw ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "11px 24px", fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", cursor: savingPw ? "not-allowed" : "pointer", transition: "all 0.18s"}}
              onMouseEnter={(e) => { if (!savingPw) { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}>
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </div>

          {/* Social Media Handles */}
          <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px"}}>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8}}>
              <span style={{width: 3, height: 14, background: "#06b6d4", display: "inline-block", borderRadius: 2}} />
              Social Media Handles
            </p>
            {socialMsg && <Toast msg={socialMsg.msg} ok={socialMsg.ok} />}
            <div style={{display: "flex", flexDirection: "column", gap: 8}}>
              {[
                {
                  key: "instagram",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  ),
                  placeholder: "instagram",
                },
                {
                  key: "facebook",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                  ),
                  placeholder: "facebook",
                },
                {
                  key: "twitter",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                  placeholder: "twitter / X",
                },
                {
                  // ✅ FIX: key changed from "tiktok" to "tik_tok" to match form state and DB
                  key: "tik_tok",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                    </svg>
                  ),
                  placeholder: "tiktok",
                },
              ].map(({key, icon, placeholder}) => (
                <div key={key} style={{position: "relative"}}>
                  <span style={{position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 4}}>
                    {icon}
                    <span style={{color: "rgba(255,255,255,0.25)", fontSize: 12}}>@</span>
                  </span>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({...f, [key]: e.target.value.replace("@", "")}))}
                    style={{...inp, paddingLeft: 44}}
                    onFocus={onF}
                    onBlur={onB}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveSocial}
              disabled={savingSocial}
              style={{width: "100%", marginTop: 14, background: savingSocial ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.1)", color: savingSocial ? "rgba(6,182,212,0.4)" : "rgba(6,182,212,0.85)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 8, padding: "11px 24px", fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", cursor: savingSocial ? "not-allowed" : "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8}}
              onMouseEnter={(e) => { if (!savingSocial) { e.currentTarget.style.background = "rgba(6,182,212,0.18)"; e.currentTarget.style.color = "#06b6d4"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)"; }}}
              onMouseLeave={(e) => { if (!savingSocial) { e.currentTarget.style.background = "rgba(6,182,212,0.1)"; e.currentTarget.style.color = "rgba(6,182,212,0.85)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.25)"; }}}>
              {savingSocial && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                </svg>
              )}
              {savingSocial ? "Saving..." : "Save Social Handles"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Account Upgrade ── */}
      <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px", marginBottom: 16}}>
        <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14}}>
          <div>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 5px", display: "flex", alignItems: "center", gap: 8}}>
              <span style={{width: 3, height: 14, background: "#a855f7", display: "inline-block", borderRadius: 2}} />
              Account Upgrade
            </p>
            <h3 style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(1.2rem,2.5vw,1.6rem)", color: "#fff", letterSpacing: "0.04em", margin: "0 0 8px", lineHeight: 1}}>
              UPGRADE YOUR <span style={{color: "#ef4444"}}>PLAN</span>
            </h3>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0, lineHeight: 1.6, maxWidth: 520}}>
              Unlock more listings, advanced analytics, drop scheduling, and priority placement.
            </p>
          </div>
          <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
            {["Unlimited Listings", "Drop Scheduling", "Brand Analytics", "Priority Placement"].map((f) => (
              <span key={f} style={{background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 99}}>
                {f}
              </span>
            ))}
          </div>
        </div>
        <BrandUpgradeFlow />
      </div>

      {/* ── Danger Zone ── */}
      <div style={{background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "22px 24px"}}>
        <p style={{color: "rgba(239,68,68,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10}}>
          Danger Zone
        </p>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 16, lineHeight: 1.6}}>
          Once you delete your brand account, all your products, orders, analytics, and storefront
          data will be permanently removed. This cannot be undone.
        </p>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            style={{background: "transparent", border: "1px solid rgba(239,68,68,0.35)", color: "rgba(239,68,68,0.7)", fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", padding: "10px 20px", borderRadius: 8, cursor: "pointer", transition: "all 0.18s"}}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}>
            Delete Brand Account
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{opacity: 0, y: -6}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -6}}
              style={{background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "16px"}}>
              <p style={{color: "#ef4444", fontSize: 12, fontWeight: 700, margin: "0 0 12px"}}>
                Are you absolutely sure? This cannot be undone.
              </p>
              {deleteError && (
                <p style={{color: "#ef4444", fontSize: 11, marginBottom: 10, fontWeight: 600}}>{deleteError}</p>
              )}
              <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    setDeleteError("");
                    try {
                      await deleteBrandAccount();
                      localStorage.removeItem("blvck_token");
                      sessionStorage.removeItem("blvck_token");
                      window.location.href = "/";
                    } catch (e) {
                      setDeleteError(e.message || "Failed to delete account. Please try again.");
                      setDeleting(false);
                    }
                  }}
                  style={{background: deleting ? "#7f1d1d" : "#ef4444", color: "#fff", border: "none", borderRadius: 7, padding: "9px 18px", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", cursor: deleting ? "not-allowed" : "pointer", transition: "background 0.18s", display: "flex", alignItems: "center", gap: 7}}
                  onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "#dc2626"; }}
                  onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = deleting ? "#7f1d1d" : "#ef4444"; }}>
                  {deleting && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                    </svg>
                  )}
                  {deleting ? "Deleting..." : "Yes, Delete My Brand"}
                </button>
                <button
                  onClick={() => setShowDelete(false)}
                  style={{background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "9px 16px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.18s"}}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}