import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {updateProfile, changePassword, deleteBuyerAccount} from "../dashboard/dashboard_components/api";
import ImageUpload from "../../../../components/ImageUpload";
import PhoneInput from "../../../../components/phoneinput"; // ← added

// ─── Shared input styles ──────────────────────────────────────────────────────
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
        <svg
          width="13"
          height="13"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          width="13"
          height="13"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span style={{color: ok ? "#22c55e" : "#ef4444", fontSize: 12, fontWeight: 600}}>{msg}</span>
    </div>
  );
}

// ─── Brand Plans ──────────────────────────────────────────────────────────────
const BRAND_PLANS = [
  {
    id: "starter",
    name: "STARTER",
    price: "$29",
    period: "/mo",
    color: "rgba(255,255,255,0.7)",
    accent: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.15)",
    badge: null,
    perks: [
      "Up to 20 active listings",
      "Basic sales analytics",
      "Standard storefront page",
      "Email support",
    ],
  },
  {
    id: "blvck",
    name: "BLVCK BRAND",
    price: "$79",
    period: "/mo",
    color: "#ef4444",
    accent: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.4)",
    badge: "Most Popular",
    perks: [
      "Unlimited listings",
      "Advanced analytics",
      "Featured storefront",
      "Drop scheduling",
      "Priority placement",
    ],
  },
  {
    id: "mrkt_pro",
    name: "MRKT PRO",
    price: "$149",
    period: "/mo",
    color: "#f59e0b",
    accent: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.4)",
    badge: "Full Power",
    perks: [
      "Everything in BLVCK Brand",
      "Custom brand URL",
      "Homepage feature slots",
      "Dedicated account manager",
      "Exclusive collabs",
    ],
  },
];

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

const BILLING_OPTIONS = [
  {id: "monthly", label: "Monthly Billing", sub: "Billed every month", discount: null},
  {id: "annual", label: "Annual Billing", sub: "Billed once per year", discount: "Save 20%"},
];

const PAYMENT_METHODS = [
  {id: "card", label: "Credit / Debit Card", icon: "💳"},
  {id: "paypal", label: "PayPal", icon: "🅿️"},
  {id: "transfer", label: "Bank Transfer", icon: "🏦"},
];

const UP_STEPS = ["Plan", "Brand Details", "Payment", "Review"];

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
function UErr({m}) {
  return m ? (
    <span style={{color: "#ef4444", fontSize: 10, fontWeight: 700, marginTop: 3, display: "block"}}>
      {m}
    </span>
  ) : null;
}

// ── Brand Upgrade Checkout Flow ───────────────────────────────────────────────
function BrandUpgradeFlow() {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [plan, setPlan] = useState("blvck");
  const [billing, setBilling] = useState("monthly");
  const [brand, setBrand] = useState({
    name: "",
    category: "Streetwear",
    website: "",
    instagram: "",
    description: "",
  });
  const [payment, setPayment] = useState({
    method: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });

  const sel = BRAND_PLANS.find((p) => p.id === plan);
  const monthly = parseInt(sel?.price.replace("$", ""));
  const annual = Math.round(monthly * 12 * 0.8);
  const displayPx = billing === "monthly" ? `${sel?.price}/mo` : `$${annual}/yr`;

  const fmtCard = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const fmtExpiry = (v) => {
    const s = v.replace(/\D/g, "").slice(0, 4);
    return s.length >= 3 ? s.slice(0, 2) + "/" + s.slice(2) : s;
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!brand.name.trim()) e.name = "Brand name is required";
      if (!brand.description.trim()) e.description = "Tell us about your brand";
    }
    if (step === 2 && payment.method === "card") {
      if (!payment.cardName.trim()) e.cardName = "Required";
      if (!payment.cardNumber.replace(/\s/g, "").match(/^\d{16}$/))
        e.cardNumber = "Valid 16-digit number required";
      if (!payment.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = "MM/YY";
      if (!payment.cvv.match(/^\d{3,4}$/)) e.cvv = "3–4 digits";
    }
    if (step === 2 && payment.method === "transfer" && !receipt)
      e.receipt = "Please upload payment receipt";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep((s) => s + 1);
  };
  const handlePlace = async () => {
    if (!validate()) return;
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 1600));
    setPlacing(false);
    setDone(true);
  };

  if (done)
    return (
      <motion.div
        initial={{opacity: 0, y: 16}}
        animate={{opacity: 1, y: 0}}
        style={{
          background: "rgba(34,197,94,0.05)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 14,
          padding: "36px 28px",
          textAlign: "center",
        }}>
        <motion.div
          initial={{scale: 0}}
          animate={{scale: 1}}
          transition={{type: "spring", stiffness: 260, damping: 20, delay: 0.1}}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.1)",
            border: "2px solid rgba(34,197,94,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}>
          <svg
            width="28"
            height="28"
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
              transition={{duration: 0.5, delay: 0.3}}
            />
          </svg>
        </motion.div>
        <motion.div
          initial={{opacity: 0, y: 12}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.3}}>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}>
            Upgrade Successful
          </p>
          <h3
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(1.4rem,3vw,2rem)",
              color: "#fff",
              letterSpacing: "0.04em",
              margin: "0 0 10px",
              lineHeight: 1,
            }}>
            WELCOME TO <span style={{color: "#ef4444"}}>BLVCKMRKT</span> BRANDS
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              lineHeight: 1.7,
              margin: "0 auto 20px",
              maxWidth: 380,
            }}>
            Your brand account for <strong style={{color: "#fff"}}>{brand.name}</strong> is being
            set up. Confirmation sent to your email. Your buyer access stays fully active.
          </p>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "11px 20px",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}>
            <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>Reference</span>
            <span
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "1.1rem",
                color: "#ef4444",
                letterSpacing: "0.1em",
              }}>
              BRD-{Math.random().toString(36).slice(2, 8).toUpperCase()}
            </span>
          </div>
        </motion.div>
      </motion.div>
    );

  return (
    <div>
      {/* Stepper */}
      <div style={{display: "flex", alignItems: "center", marginBottom: 24}}>
        {UP_STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < UP_STEPS.length - 1 ? 1 : "none",
            }}>
            <div style={{display: "flex", alignItems: "center", gap: 7, flexShrink: 0}}>
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
                className="st-steplabel"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: i < step ? "#22c55e" : i === step ? "#fff" : "rgba(255,255,255,0.2)",
                }}>
                {s}
              </span>
            </div>
            {i < UP_STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  margin: "0 8px",
                  transition: "background 0.3s",
                  background: i < step ? "#22c55e" : "rgba(255,255,255,0.08)",
                }}
              />
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
          {/* STEP 0: Plan */}
          {step === 0 && (
            <div>
              <p
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1rem",
                  color: "#fff",
                  letterSpacing: "0.08em",
                  margin: "0 0 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                <span
                  style={{
                    width: 3,
                    height: 14,
                    background: "#ef4444",
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                Choose Your Brand Plan
              </p>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 16px"}}>
                Pick the plan that fits your brand — upgrade anytime.
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 18}}>
                {BRAND_PLANS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    style={{
                      background: plan === p.id ? p.accent : "rgba(255,255,255,0.02)",
                      border: `1px solid ${plan === p.id ? p.border : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 12,
                      padding: "14px 16px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (plan !== p.id) {
                        e.currentTarget.style.borderColor = p.border;
                        e.currentTarget.style.background = p.accent;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (plan !== p.id) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      }
                    }}>
                    {p.badge && (
                      <span
                        style={{
                          position: "absolute",
                          top: -10,
                          right: 14,
                          background: p.color,
                          color: p.id === "starter" ? "#fff" : "#000",
                          fontSize: 8,
                          fontWeight: 900,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "3px 9px",
                          borderRadius: 99,
                        }}>
                        {p.badge}
                      </span>
                    )}
                    <div style={{display: "flex", alignItems: "flex-start", gap: 12}}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          flexShrink: 0,
                          marginTop: 2,
                          border: `2px solid ${plan === p.id ? p.color : "rgba(255,255,255,0.2)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "border-color 0.2s",
                        }}>
                        {plan === p.id && (
                          <div
                            style={{width: 8, height: 8, borderRadius: "50%", background: p.color}}
                          />
                        )}
                      </div>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 8,
                            flexWrap: "wrap",
                            marginBottom: 6,
                          }}>
                          <span
                            style={{
                              color: plan === p.id ? p.color : "rgba(255,255,255,0.6)",
                              fontSize: 11,
                              fontWeight: 900,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                            }}>
                            {p.name}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Bebas Neue',sans-serif",
                              fontSize: "1.2rem",
                              color: plan === p.id ? "#fff" : "rgba(255,255,255,0.5)",
                            }}>
                            {p.price}
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontFamily: "system-ui",
                                color: "rgba(255,255,255,0.3)",
                              }}>
                              {p.period}
                            </span>
                          </span>
                        </div>
                        <div style={{display: "flex", flexWrap: "wrap", gap: "4px 14px"}}>
                          {p.perks.map((pk) => (
                            <span
                              key={pk}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                color: "rgba(255,255,255,0.4)",
                                fontSize: 11,
                              }}>
                              <svg
                                width="9"
                                height="9"
                                fill="none"
                                stroke={plan === p.id ? p.color : "rgba(255,255,255,0.2)"}
                                strokeWidth="2.5"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {pk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}>
                Billing Cycle
              </p>
              <div className="st-billingrow">
                {BILLING_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setBilling(opt.id)}
                    style={{
                      flex: 1,
                      padding: "11px 14px",
                      border: `1px solid ${billing === opt.id ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background:
                        billing === opt.id ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.02)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        flexShrink: 0,
                        border: `2px solid ${billing === opt.id ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      {billing === opt.id && (
                        <div
                          style={{width: 7, height: 7, borderRadius: "50%", background: "#ef4444"}}
                        />
                      )}
                    </div>
                    <div style={{flex: 1}}>
                      <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>
                        {opt.label}
                      </p>
                      <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>
                        {opt.sub}
                      </p>
                    </div>
                    {opt.discount && (
                      <span
                        style={{
                          background: "rgba(34,197,94,0.1)",
                          color: "#22c55e",
                          fontSize: 9,
                          fontWeight: 900,
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}>
                        {opt.discount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Brand Details */}
          {step === 1 && (
            <div>
              <p
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1rem",
                  color: "#fff",
                  letterSpacing: "0.08em",
                  margin: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                <span
                  style={{
                    width: 3,
                    height: 14,
                    background: "#ef4444",
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                Brand Details
              </p>
              <div style={{display: "grid", gap: 12}}>
                <div>
                  <ULabel c="Brand Name *" />
                  <input
                    style={uInp(!!errors.name)}
                    placeholder="e.g. Supreme, Palace, Corteiz"
                    value={brand.name}
                    onChange={(e) => setBrand({...brand, name: e.target.value})}
                    onFocus={uf}
                    onBlur={ub}
                  />
                  <UErr m={errors.name} />
                </div>
                <div
                  style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}
                  className="st-2col">
                  <div>
                    <ULabel c="Category" />
                    <select
                      value={brand.category}
                      onChange={(e) => setBrand({...brand, category: e.target.value})}
                      style={{...uInp(), cursor: "pointer", appearance: "none"}}>
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <ULabel c="Website" />
                    <input
                      style={uInp()}
                      placeholder="https://yourbrand.com"
                      value={brand.website}
                      onChange={(e) => setBrand({...brand, website: e.target.value})}
                      onFocus={uf}
                      onBlur={ub}
                    />
                  </div>
                </div>
                <div>
                  <ULabel c="Instagram Handle" />
                  <div style={{position: "relative"}}>
                    <span
                      style={{
                        position: "absolute",
                        left: 13,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "rgba(255,255,255,0.3)",
                        fontSize: 13,
                      }}>
                      @
                    </span>
                    <input
                      style={{...uInp(), paddingLeft: 28}}
                      placeholder="yourbrand"
                      value={brand.instagram}
                      onChange={(e) =>
                        setBrand({...brand, instagram: e.target.value.replace("@", "")})
                      }
                      onFocus={uf}
                      onBlur={ub}
                    />
                  </div>
                </div>
                <div>
                  <ULabel c="Brand Description *" />
                  <textarea
                    rows={3}
                    style={{...uInp(!!errors.description), resize: "vertical", lineHeight: 1.6}}
                    placeholder="Tell shoppers what your brand is about…"
                    value={brand.description}
                    onChange={(e) => setBrand({...brand, description: e.target.value})}
                    onFocus={uf}
                    onBlur={ub}
                  />
                  <UErr m={errors.description} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 2 && (
            <div>
              <p
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1rem",
                  color: "#fff",
                  letterSpacing: "0.08em",
                  margin: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                <span
                  style={{
                    width: 3,
                    height: 14,
                    background: "#ef4444",
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                Payment
              </p>
              <div style={{display: "flex", gap: 10, marginBottom: 18}}>
                {PAYMENT_METHODS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPayment({...payment, method: m.id})}
                    style={{
                      flex: 1,
                      padding: "11px 8px",
                      border: `1px solid ${payment.method === m.id ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 10,
                      background:
                        payment.method === m.id ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 5,
                      transition: "all 0.2s",
                    }}>
                    <span style={{fontSize: 18}}>{m.icon}</span>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: payment.method === m.id ? "#fff" : "rgba(255,255,255,0.4)",
                        textAlign: "center",
                      }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
              {payment.method === "card" && (
                <>
                  <div
                    style={{
                      background: "linear-gradient(135deg,#1a1a1a,#2a2a2a)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "16px 18px",
                      marginBottom: 16,
                      position: "relative",
                      overflow: "hidden",
                    }}>
                    <div
                      style={{
                        position: "absolute",
                        top: -30,
                        right: -30,
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        background: "rgba(239,68,68,0.07)",
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
                        fontSize: "1.1rem",
                        color: "rgba(255,255,255,0.7)",
                        letterSpacing: "0.22em",
                        margin: "0 0 12px",
                      }}>
                      {payment.cardNumber || "•••• •••• •••• ••••"}
                    </p>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                      <div>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 8,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            margin: "0 0 1px",
                          }}>
                          Holder
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
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            margin: "0 0 1px",
                          }}>
                          Expires
                        </p>
                        <p style={{color: "#fff", fontSize: 11, fontWeight: 700, margin: 0}}>
                          {payment.expiry || "MM/YY"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{display: "grid", gap: 12}}>
                    <div>
                      <ULabel c="Name on Card *" />
                      <input
                        style={uInp(!!errors.cardName)}
                        placeholder="John Doe"
                        value={payment.cardName}
                        onChange={(e) => setPayment({...payment, cardName: e.target.value})}
                        onFocus={uf}
                        onBlur={ub}
                      />
                      <UErr m={errors.cardName} />
                    </div>
                    <div>
                      <ULabel c="Card Number *" />
                      <input
                        style={uInp(!!errors.cardNumber)}
                        placeholder="1234 5678 9012 3456"
                        value={payment.cardNumber}
                        onChange={(e) =>
                          setPayment({...payment, cardNumber: fmtCard(e.target.value)})
                        }
                        onFocus={uf}
                        onBlur={ub}
                      />
                      <UErr m={errors.cardNumber} />
                    </div>
                    <div
                      style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}
                      className="st-2col">
                      <div>
                        <ULabel c="Expiry *" />
                        <input
                          style={uInp(!!errors.expiry)}
                          placeholder="MM/YY"
                          value={payment.expiry}
                          onChange={(e) =>
                            setPayment({...payment, expiry: fmtExpiry(e.target.value)})
                          }
                          onFocus={uf}
                          onBlur={ub}
                        />
                        <UErr m={errors.expiry} />
                      </div>
                      <div>
                        <ULabel c="CVV *" />
                        <input
                          type="password"
                          style={uInp(!!errors.cvv)}
                          placeholder="•••"
                          maxLength={4}
                          value={payment.cvv}
                          onChange={(e) =>
                            setPayment({
                              ...payment,
                              cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                            })
                          }
                          onFocus={uf}
                          onBlur={ub}
                        />
                        <UErr m={errors.cvv} />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {payment.method === "paypal" && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px dashed rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "36px 20px",
                    textAlign: "center",
                  }}>
                  <p style={{fontSize: "2.5rem", marginBottom: 12}}>🅿️</p>
                  <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7}}>
                    You'll be redirected to <strong style={{color: "#fff"}}>PayPal</strong> to
                    complete your subscription payment after confirming your upgrade.
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
                        marginBottom: 12,
                      }}>
                      Transfer To
                    </p>
                    {[
                      {l: "Bank", v: "First Bank of Nigeria"},
                      {l: "Account Name", v: "BLVCKMRKT Limited"},
                      {l: "Account No.", v: "3012 4567 89"},
                      {l: "Amount", v: displayPx},
                      {l: "Reference", v: `BRAND-${Date.now().toString().slice(-6)}`},
                    ].map((r) => (
                      <div
                        key={r.l}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "7px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}>
                        <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>{r.l}</span>
                        <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <ULabel c="Upload Receipt *" />
                  <div
                    onClick={() => document.getElementById("brand-receipt").click()}
                    style={{
                      border: `2px dashed ${errors.receipt ? "#ef4444" : receipt ? "#22c55e" : "rgba(255,255,255,0.15)"}`,
                      borderRadius: 12,
                      padding: "24px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: receipt ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)",
                    }}>
                    {receipt ? (
                      <>
                        <p
                          style={{
                            color: "#22c55e",
                            fontSize: 12,
                            fontWeight: 700,
                            margin: "0 0 4px",
                          }}>
                          {receipt.name}
                        </p>
                        <span
                          style={{
                            color: "#ef4444",
                            fontSize: 10,
                            textDecoration: "underline",
                            cursor: "pointer",
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
                            color: "rgba(255,255,255,0.45)",
                            fontSize: 12,
                            margin: "0 0 4px",
                          }}>
                          Click to upload receipt
                        </p>
                        <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
                          PNG, JPG, PDF — max 5MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="brand-receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    style={{display: "none"}}
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f && f.size <= 5 * 1024 * 1024) {
                        setReceipt(f);
                        setErrors((p) => ({...p, receipt: null}));
                      }
                    }}
                  />
                  <UErr m={errors.receipt} />
                </div>
              )}
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 10,
                  marginTop: 14,
                  textAlign: "center",
                }}>
                🔒 Payment is encrypted and secure
              </p>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div>
              <p
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1rem",
                  color: "#fff",
                  letterSpacing: "0.08em",
                  margin: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                <span
                  style={{
                    width: 3,
                    height: 14,
                    background: "#ef4444",
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />
                Review & Confirm
              </p>
              {[
                {
                  t: "Brand Plan",
                  s: 0,
                  v: (
                    <>
                      {sel?.name} — {displayPx}
                      {billing === "annual" && (
                        <span
                          style={{color: "#22c55e", fontSize: 10, marginLeft: 8, fontWeight: 700}}>
                          20% off
                        </span>
                      )}
                    </>
                  ),
                },
                {
                  t: "Brand Details",
                  s: 1,
                  v: (
                    <>
                      {brand.name}
                      <br />
                      <span style={{color: "rgba(255,255,255,0.35)"}}>
                        {brand.category}
                        {brand.website ? ` · ${brand.website}` : ""}
                      </span>
                      {brand.instagram && (
                        <>
                          <br />
                          <span style={{color: "rgba(255,255,255,0.35)"}}>@{brand.instagram}</span>
                        </>
                      )}
                      <br />
                      {brand.description.slice(0, 80)}
                      {brand.description.length > 80 ? "…" : ""}
                    </>
                  ),
                },
                {
                  t: "Payment",
                  s: 2,
                  v:
                    payment.method === "card"
                      ? `Card ending in ${payment.cardNumber.replace(/\s/g, "").slice(-4) || "••••"}`
                      : PAYMENT_METHODS.find((m) => m.id === payment.method)?.label,
                },
              ].map((b) => (
                <div
                  key={b.t}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginBottom: 10,
                  }}>
                  <div style={{display: "flex", justifyContent: "space-between", marginBottom: 6}}>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.28)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                      }}>
                      {b.t}
                    </span>
                    <button
                      onClick={() => setStep(b.s)}
                      style={{
                        color: "#ef4444",
                        fontSize: 9,
                        fontWeight: 700,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
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
                    {b.v}
                  </p>
                </div>
              ))}
              <div
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginTop: 4,
                }}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 5}}>
                  <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>Plan</span>
                  <span style={{color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700}}>
                    {sel?.name}
                  </span>
                </div>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                  <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>Billing</span>
                  <span style={{color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700}}>
                    {billing === "annual" ? "Annual (20% off)" : "Monthly"}
                  </span>
                </div>
                <div style={{height: 1, background: "rgba(255,255,255,0.07)", margin: "0 0 8px"}} />
                <div
                  style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1rem",
                      color: "#fff",
                      letterSpacing: "0.08em",
                    }}>
                    TOTAL
                  </span>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.4rem",
                      color: "#ef4444",
                    }}>
                    {displayPx}
                  </span>
                </div>
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 11,
                  margin: "12px 0 0",
                  lineHeight: 1.6,
                }}>
                By upgrading you agree to our brand terms of service. Your buyer account stays fully
                active alongside your new brand account.
              </p>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap"}}>
            {step > 0 && (
              <button
                onClick={() => {
                  setStep((s) => s - 1);
                  setErrors({});
                }}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "12px 20px",
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
                onClick={handleNext}
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
                  padding: "12px 20px",
                  cursor: "pointer",
                  borderRadius: 8,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
                {step === 2 ? "Review Upgrade →" : "Continue →"}
              </button>
            ) : (
              <button
                onClick={handlePlace}
                disabled={placing}
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
                  padding: "12px 20px",
                  cursor: placing ? "not-allowed" : "pointer",
                  borderRadius: 8,
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}>
                {placing && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    style={{animation: "spin 0.8s linear infinite"}}>
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {placing ? "Processing..." : `🔒 Upgrade to ${sel?.name} — ${displayPx}`}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────────
export default function Settings({user, onUserUpdate}) {
  const [profile, setProfile] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatarURL: user?.avatar_url || "",
  });

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      avatarURL: user.avatar_url || "",
    });
  }, [user?.id, user?.phone, user?.avatar_url, user?.email]);

  const [profileMsg, setProfileMsg] = useState(null);
  const [savingProf, setSavingProf] = useState(false);
  const [passwords, setPasswords] = useState({current: "", newPass: "", confirm: ""});
  const [pwMsg, setPwMsg] = useState(null);
  const [savingPw, setSavingPw] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleSaveProfile = async () => {
    console.log("FULL FORM:", JSON.stringify(form, null, 2));
    setSavingProf(true);
    setProfileMsg(null);
    try {
      const updated = await updateProfile({
        first_name: profile.firstName.trim(),
        last_name: profile.lastName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(), // already E.164 from PhoneInput
        avatar_url: profile.avatarURL.trim(),
      });
      setProfileMsg({msg: "Profile updated successfully.", ok: true});
      if (onUserUpdate) onUserUpdate(updated);
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (e) {
      setProfileMsg({msg: e.message || "Failed to update profile.", ok: false});
    } finally {
      setSavingProf(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      setPwMsg({msg: "All fields required.", ok: false});
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setPwMsg({msg: "New passwords don't match.", ok: false});
      return;
    }
    if (passwords.newPass.length < 8) {
      setPwMsg({msg: "New password must be at least 8 characters.", ok: false});
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({current_password: passwords.current, new_password: passwords.newPass});
      setPwMsg({msg: "Password updated successfully.", ok: true});
      setPasswords({current: "", newPass: "", confirm: ""});
      setTimeout(() => setPwMsg(null), 4000);
    } catch (e) {
      setPwMsg({msg: e.message || "Incorrect current password.", ok: false});
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .st-top-row{display:grid;grid-template-columns:1fr 340px;gap:16px;align-items:start;margin-bottom:16px;}
        .st-name-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
        .st-2col{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .st-billingrow{display:flex;gap:10px;margin-bottom:4px;}
        .st-steplabel{display:inline;}
        @media(max-width:860px){.st-top-row{grid-template-columns:1fr!important;}}
        @media(max-width:520px){
          .st-name-row,.st-2col{grid-template-columns:1fr!important;}
          .st-billingrow{flex-direction:column!important;}
          .st-steplabel{display:none!important;}
        }
      `}</style>

      <div style={{marginBottom: 24}}>
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(1.6rem,3vw,2.2rem)",
            color: "#fff",
            letterSpacing: "0.04em",
            margin: "0 0 4px",
          }}>
          SETTINGS
        </h2>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
          Manage your profile, security, and account type.
        </p>
      </div>

      {/* ── ROW 1: Profile (left) + Change Password (right) ─────────────────── */}
      <div className="st-top-row">
        {/* Profile card */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "22px 24px",
          }}>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}>
            Profile
          </p>
          {profileMsg && <Toast msg={profileMsg.msg} ok={profileMsg.ok} />}

          {/* Avatar */}
          <div style={{marginBottom: 14}}>
            <Label c="Profile Photo" />
            <div style={{display: "flex", gap: 14, alignItems: "center"}}>
              <ImageUpload
                folder="avatars"
                shape="circle"
                label="Upload Photo"
                preview={profile.avatarURL}
                onUpload={(url) => setProfile({...profile, avatarURL: url})}
              />
              <p
                style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.6, margin: 0}}>
                Click to upload a new photo.
                <br />
                JPEG, PNG or WebP — max 5MB.
              </p>
            </div>
          </div>

          {/* First / Last name */}
          <div className="st-name-row">
            <div>
              <Label c="First Name" />
              <input
                value={profile.firstName}
                onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
            <div>
              <Label c="Last Name" />
              <input
                value={profile.lastName}
                onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{marginBottom: 10}}>
            <Label c="Email Address" />
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>

          {/* ── Phone — replaced with PhoneInput ── */}
          <div style={{marginBottom: 20}}>
            <Label c="Phone Number" />
            <PhoneInput
              value={profile.phone}
              onChange={(val) => setProfile({...profile, phone: val})}
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProf}
            style={{
              background: savingProf ? "#7f1d1d" : "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "11px 24px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: savingProf ? "not-allowed" : "pointer",
              transition: "background 0.18s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!savingProf) e.currentTarget.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              if (!savingProf) e.currentTarget.style.background = "#ef4444";
            }}>
            {savingProf && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                style={{animation: "spin 0.8s linear infinite"}}>
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {savingProf ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Change Password card */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "22px 24px",
          }}>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}>
            Change Password
          </p>
          {pwMsg && <Toast msg={pwMsg.msg} ok={pwMsg.ok} />}
          <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 16}}>
            <div>
              <Label c="Current Password" />
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
            <div>
              <Label c="New Password" />
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={passwords.newPass}
                onChange={(e) => setPasswords({...passwords, newPass: e.target.value})}
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
            <div>
              <Label c="Confirm New Password" />
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                style={inp}
                onFocus={onF}
                onBlur={onB}
                onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
              />
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={savingPw}
            style={{
              width: "100%",
              background: savingPw ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
              color: savingPw ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "11px 24px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: savingPw ? "not-allowed" : "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              if (!savingPw) {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}>
            {savingPw ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      {/* ── ROW 2: Upgrade to Brand Account ──────────────────────────────────── */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "24px",
          marginBottom: 16,
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 14,
          }}>
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                margin: "0 0 5px",
              }}>
              Account Upgrade
            </p>
            <h3
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "clamp(1.2rem,2.5vw,1.6rem)",
                color: "#fff",
                letterSpacing: "0.04em",
                margin: "0 0 8px",
                lineHeight: 1,
              }}>
              BECOME A <span style={{color: "#ef4444"}}>BRAND</span>
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 12,
                margin: 0,
                lineHeight: 1.6,
                maxWidth: 520,
              }}>
              Already running a brand? Upgrade your account to get your own storefront, drop
              scheduling, and analytics — without creating a separate account. Your buyer access
              stays fully active.
            </p>
          </div>
          <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
            {["Own Storefront", "Drop Scheduling", "Brand Analytics", "Collab Access"].map((f) => (
              <span
                key={f}
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 99,
                }}>
                {f}
              </span>
            ))}
          </div>
        </div>
        <BrandUpgradeFlow />
      </div>

      {/* ── ROW 3: Danger Zone ───────────────────────────────────────────────── */}
      <div
        style={{
          background: "rgba(239,68,68,0.04)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 14,
          padding: "22px 24px",
        }}>
        <p
          style={{
            color: "rgba(239,68,68,0.6)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
          Danger Zone
        </p>
        <p
          style={{color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 16, lineHeight: 1.6}}>
          Once you delete your account, there is no going back. All your orders, addresses,
          wishlists, and data will be permanently removed.
        </p>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            style={{
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "rgba(239,68,68,0.7)",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(239,68,68,0.7)";
            }}>
            Delete Account
          </button>
        ) : (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10,
              padding: "16px",
            }}>
            <p style={{color: "#ef4444", fontSize: 12, fontWeight: 700, margin: "0 0 12px"}}>
              Are you absolutely sure? This cannot be undone.
            </p>
            {deleteError && (
              <p style={{color: "#ef4444", fontSize: 11, marginBottom: 10, fontWeight: 600}}>
                {deleteError}
              </p>
            )}
            <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
              <button
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError("");
                  try {
                    await deleteBuyerAccount();
                    localStorage.removeItem("blvck_token");
                    sessionStorage.removeItem("blvck_token");
                    window.location.href = "/";
                  } catch (e) {
                    setDeleteError(e.message || "Failed to delete account. Please try again.");
                    setDeleting(false);
                  }
                }}
                style={{
                  background: deleting ? "#7f1d1d" : "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 7,
                  padding: "9px 18px",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}>
                {deleting && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white"
                    strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                )}
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
              <button
                onClick={() => setShowDelete(false)}
                style={{
                  background: "transparent",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 7,
                  padding: "9px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
