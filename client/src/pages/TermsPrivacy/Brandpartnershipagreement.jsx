import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "authenticity",    num: "01", title: "Product Authenticity & Listing" },
  { id: "fulfillment",     num: "02", title: "Order Fulfillment & Delivery" },
  { id: "delays",          num: "03", title: "Delivery Delays & Communication" },
  { id: "compensation",    num: "04", title: "Fulfillment Period & Compensation" },
  { id: "escrow",          num: "05", title: "Payment Handling & Escrow" },
  { id: "subscription",    num: "06", title: "Monthly Subscription" },
  { id: "platform-fee",    num: "07", title: "Platform Fee & Investment" },
  { id: "responsibilities",num: "08", title: "Brand Responsibilities" },
  { id: "enforcement",     num: "09", title: "Enforcement & Compliance" },
  { id: "amendments",      num: "10", title: "Amendments" },
  { id: "acknowledgment",  num: "11", title: "Agreement Acknowledgment" },
];

function SectionBlock({ id, num, title, children, isRead, onRead }) {
  const ref = useRef(null);
  useEffect(() => {
    if (isRead) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && entry.intersectionRatio >= 0.6) onRead(id); },
      { threshold: 0.6 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [id, isRead, onRead]);

  return (
    <motion.div
      ref={ref} id={id}
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45 }}
      style={{ paddingBottom: 48, marginBottom: 48, borderBottom: "1px solid rgba(255,255,255,0.07)", position: "relative" }}
    >
      <AnimatePresence>
        {isRead && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            style={{ position: "absolute", top: 2, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
        )}
      </AnimatePresence>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.18em", color: isRead ? "#22c55e" : "#ef4444", background: isRead ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${isRead ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`, padding: "3px 8px", flexShrink: 0, transition: "all 0.3s" }}>{num}</span>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "0.04em", color: "#fff", margin: 0, lineHeight: 1 }}>{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function Callout({ label = "NOTE", color = "red", children }) {
  const c = color === "green" ? "#22c55e" : color === "yellow" ? "#eab308" : "#ef4444";
  return (
    <div style={{ background: `rgba(${color === "green" ? "34,197,94" : color === "yellow" ? "234,179,8" : "239,68,68"},0.06)`, borderLeft: `2px solid ${c}`, padding: "12px 16px", margin: "14px 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
      <span style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.2em", color: c, marginBottom: 4, textTransform: "uppercase" }}>{label}</span>
      {children}
    </div>
  );
}

function RuleList({ items }) {
  return (
    <ul style={{ listStyle: "none", margin: "10px 0", padding: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, padding: "7px 0", fontSize: 13, color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ color: "#ef4444", fontFamily: "'Space Mono', monospace", fontSize: 10, flexShrink: 0, marginTop: 2 }}>—</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function StatCards({ cards }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", margin: "16px 0" }}>
      {cards.map((card, i) => (
        <div key={i} style={{ background: "#0d0d0d", padding: "18px 16px" }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "#ef4444", marginBottom: 8 }}>{card.label}</p>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: "#fff", margin: "0 0 4px", letterSpacing: "0.04em" }}>{card.value}</p>
          {card.sub && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ── TOKEN KEY — must match authcontext.jsx ────────────────────────────────────
const TOKEN_KEY = "blvck_token";

// ── Signing Terminal ──────────────────────────────────────────────────────────
function SigningTerminal({ readCount, total, onSigned, registeredBrandName, userToken }) {
  const [brandName, setBrandName]     = useState("");
  const [confirmWord, setConfirmWord] = useState("");
  const [phase, setPhase]             = useState("idle");
  const [lines, setLines]             = useState([]);
  const [apiError, setApiError]       = useState("");
  const termRef = useRef(null);
  const allRead = readCount >= total;

  const nameMatch = brandName.trim().toLowerCase() === registeredBrandName.trim().toLowerCase();
  const canSign   = nameMatch && confirmWord.trim().toUpperCase() === "PARTNER";

  const addLine = (text, delay = 0) => {
    setTimeout(() => {
      setLines(prev => [...prev, { text, id: Date.now() + Math.random() }]);
      if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
    }, delay);
  };

  const handleSign = async () => {
    if (!canSign) return;
    setApiError("");
    setPhase("signing");
    setLines([]);

    addLine("> Initiating partnership agreement protocol...", 0);
    addLine(`> Brand identity confirmed: ${brandName.toUpperCase()}`, 600);
    addLine("> Verifying agreement conditions...", 1200);
    addLine("> All 11 clauses reviewed ✓", 1800);
    addLine("> Escrow policy acknowledged ✓", 2200);
    addLine("> Platform fee structure accepted ✓", 2600);
    addLine("> Subscription terms confirmed ✓", 3000);
    addLine(`> Binding agreement with ${brandName.toUpperCase()}...`, 3600);

    try {
      // ✅ Always read fresh from storage using the correct key
      const token =
        userToken ||
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        "";

      console.log("[partnership] signing with token:", token ? "found ✓" : "MISSING ✗");

      if (!token) {
        setLines([]);
        addLine("> ⚠ You are not logged in.", 0);
        addLine("> Please log in and try again.", 300);
        setApiError("You are not logged in. Please log in and try again.");
        setPhase("idle");
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/brand/partnership/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brand_name: brandName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLines([]);
        addLine("> ⚠ Agreement verification failed.", 0);
        addLine(`> Error: ${data.message || "Unknown error"}`, 300);
        addLine("> Please check your brand name and try again.", 600);
        setApiError(data.message || "Agreement could not be processed.");
        setPhase("idle");
        return;
      }

      addLine("", 4000);
      addLine("████████████████████████ 100%", 4200);
      addLine("", 4600);
      addLine("✦ PARTNERSHIP AGREEMENT RECORDED ✦", 4800);
      addLine(`✦ ${brandName.toUpperCase()} — SCREENING IN PROGRESS ✦`, 5200);
      addLine("> Confirmation email sent to your inbox ✓", 5600);
      addLine("> Our team will review your brand within 2–5 business days.", 6000);

      setTimeout(() => {
        setPhase("signed");
        onSigned(brandName.trim());
      }, 6200);

    } catch (err) {
      setLines([]);
      addLine("> ⚠ Network error — please check your connection.", 0);
      addLine("> Agreement was not recorded. Please try again.", 400);
      setApiError("Network error. Please try again.");
      setPhase("idle");
    }
  };

  return (
    <div style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden", marginTop: 40 }}>
      {/* Terminal header */}
      <div style={{ background: "#111", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", marginLeft: 8, letterSpacing: "0.1em" }}>
          blvckmrkt://partnership/sign
        </span>
      </div>

      {/* Terminal body */}
      <div ref={termRef} style={{ padding: "24px", minHeight: 180, maxHeight: 300, overflowY: "auto", fontFamily: "'Space Mono', monospace", fontSize: 12, lineHeight: 1.8, scrollbarWidth: "none" }}>
        {phase === "idle" && (
          <>
            <p style={{ color: "#22c55e", margin: "0 0 4px" }}>
              {"> "}<span style={{ color: "rgba(255,255,255,0.4)" }}>
                {allRead ? "All clauses reviewed. Ready to sign." : `Reading progress: ${readCount}/${total} clauses reviewed.`}
              </span>
            </p>
            {!allRead && (
              <p style={{ color: "rgba(255,255,255,0.25)", margin: 0 }}>
                {"> "}Scroll through all sections to unlock the signing terminal.
              </p>
            )}
            {allRead && (
              <>
                <p style={{ color: "rgba(255,255,255,0.25)", margin: "0 0 4px" }}>
                  {"> "}Type your registered brand name exactly as it appears, then type PARTNER to execute.
                </p>
                <p style={{ color: "rgba(239,68,68,0.6)", margin: 0, fontSize: 11 }}>
                  {"> "}Your registered brand name: <strong style={{ color: "#ef4444" }}>{registeredBrandName}</strong>
                </p>
              </>
            )}
            {apiError && (
              <p style={{ color: "#ef4444", margin: "8px 0 0", fontSize: 11 }}>
                {"> "}⚠ {apiError}
              </p>
            )}
          </>
        )}
        {(phase === "signing" || phase === "signed") && lines.map((line) => (
          <motion.p key={line.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ margin: "0 0 2px", color: line.text.includes("✦") ? "#ef4444" : line.text.includes("✓") ? "#22c55e" : line.text.includes("████") ? "#ef4444" : line.text.includes("⚠") ? "#eab308" : "rgba(255,255,255,0.5)", fontWeight: line.text.includes("✦") ? 700 : 400, letterSpacing: line.text.includes("✦") ? "0.15em" : "normal" }}>
            {line.text}
          </motion.p>
        ))}
      </div>

      {/* Input area */}
      <AnimatePresence>
        {allRead && phase === "idle" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Brand name input */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#ef4444", flexShrink: 0, paddingTop: 8 }}>
                  brand_name =
                </span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <input
                    value={brandName}
                    onChange={e => { setBrandName(e.target.value); setApiError(""); }}
                    placeholder={`Type "${registeredBrandName}" exactly...`}
                    style={{
                      background: "transparent", border: "none",
                      borderBottom: `1px solid ${
                        brandName.length === 0
                          ? "rgba(255,255,255,0.15)"
                          : nameMatch
                            ? "rgba(34,197,94,0.6)"
                            : "rgba(239,68,68,0.4)"
                      }`,
                      color: nameMatch ? "#22c55e" : "#fff",
                      fontFamily: "'Space Mono', monospace", fontSize: 13,
                      outline: "none", padding: "6px 0", letterSpacing: "0.05em",
                      transition: "border-color 0.2s, color 0.2s",
                    }}
                  />
                  {brandName.length > 0 && !nameMatch && (
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(239,68,68,0.7)", letterSpacing: "0.1em" }}>
                      // expected: {registeredBrandName}
                    </span>
                  )}
                  {brandName.length > 0 && nameMatch && (
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(34,197,94,0.8)", letterSpacing: "0.1em" }}>
                      // ✓ brand name confirmed
                    </span>
                  )}
                </div>
              </div>

              {/* Confirm word input */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#ef4444", flexShrink: 0 }}>confirm =</span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <input
                    value={confirmWord}
                    onChange={e => setConfirmWord(e.target.value)}
                    placeholder='Type "PARTNER" to execute...'
                    style={{
                      background: "transparent", border: "none",
                      borderBottom: `1px solid ${
                        confirmWord.length === 0
                          ? "rgba(255,255,255,0.15)"
                          : confirmWord.toUpperCase() === "PARTNER"
                            ? "rgba(34,197,94,0.6)"
                            : "rgba(239,68,68,0.4)"
                      }`,
                      color: confirmWord.toUpperCase() === "PARTNER" ? "#22c55e" : "#fff",
                      fontFamily: "'Space Mono', monospace", fontSize: 13,
                      outline: "none", padding: "6px 0", letterSpacing: "0.25em", textTransform: "uppercase",
                      transition: "border-color 0.2s, color 0.2s",
                    }}
                  />
                  {confirmWord.length > 0 && confirmWord.toUpperCase() !== "PARTNER" && (
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(239,68,68,0.6)", letterSpacing: "0.1em" }}>
                      // expected: PARTNER
                    </span>
                  )}
                </div>
              </div>

              {/* Execute button */}
              <motion.button
                onClick={handleSign}
                disabled={!canSign}
                whileHover={canSign ? { scale: 1.02 } : {}}
                whileTap={canSign ? { scale: 0.98 } : {}}
                style={{
                  marginTop: 8,
                  background: canSign ? "#ef4444" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${canSign ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
                  color: canSign ? "#fff" : "rgba(255,255,255,0.2)",
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: "0.2em",
                  padding: "14px 32px",
                  cursor: canSign ? "pointer" : "not-allowed",
                  transition: "all 0.25s", alignSelf: "flex-start",
                }}
              >
                Execute Partnership Agreement →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signing in progress */}
      {phase === "signing" && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ width: 14, height: 14, border: "2px solid rgba(239,68,68,0.2)", borderTop: "2px solid #ef4444", borderRadius: "50%" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
            Processing agreement...
          </span>
        </div>
      )}
    </div>
  );
}

// ── Agreement Sealed ──────────────────────────────────────────────────────────
// ── Agreement Sealed ──────────────────────────────────────────────────────────
function AgreementSealed({ brandName, onProceed, planData }) {
  const navigate = useNavigate();

  // ✅ Add debug log to confirm what planData contains
  useEffect(() => {
    console.log("[AgreementSealed] planData received:", planData);
  }, [planData]);

const handleReservePlan = () => {
    if (planData) {
      navigate("/subscribe/checkout", { state: { plan: planData } });
    } else {
      navigate("/subscribe/checkout");
    }
  };

  const handleBackHome = () => {
    console.log("[AgreementSealed] Back to home clicked");
    navigate("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ marginTop: 48, background: "linear-gradient(135deg, rgba(234,179,8,0.05) 0%, rgba(0,0,0,0) 60%)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 4, padding: "48px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(rgba(234,179,8,1) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,1) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(234,179,8,0.08)", border: "2px solid rgba(234,179,8,0.35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 32 }}>
        🔍
      </motion.div>

      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: "#eab308", marginBottom: 12, textTransform: "uppercase" }}>
        // Agreement Recorded — Screening In Progress
      </motion.p>

      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 6vw, 4rem)", letterSpacing: "0.04em", color: "#fff", lineHeight: 0.95, marginBottom: 20 }}>
        AGREEMENT SIGNED.<br />
        <span style={{ color: "#eab308" }}>VERIFICATION</span><br />
        UNDERWAY.
      </motion.h2>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 520, margin: "0 auto 16px", lineHeight: 1.8 }}>
        Your partnership agreement for <strong style={{ color: "#fff" }}>{brandName.toUpperCase()}</strong> has been recorded.
        The <strong style={{ color: "#fff" }}>BLVCKMRKT team</strong> will now screen your brand to verify
        it is legitimate and meets our marketplace standards.
        This typically takes <strong style={{ color: "#fff" }}>2–5 business days</strong>.
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
        style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
        {["Brand Authenticity", "Product Legitimacy", "Fulfilment Capability"].map((item) => (
          <span key={item} style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(234,179,8,0.8)", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)", padding: "5px 12px", letterSpacing: "0.08em" }}>
            — {item}
          </span>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05 }}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)", padding: "6px 14px", marginBottom: 32 }}>
        <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(34,197,94,0.75)", letterSpacing: "0.12em" }}>
          Confirmation email sent to your inbox
        </span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
        style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>

        {/* ✅ Reserve Your Plan */}
        <motion.button
          onClick={handleReservePlan}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: "0.18em",
            background: "#ef4444", color: "#fff", padding: "14px 32px",
            border: "none", cursor: "pointer", transition: "background 0.2s"
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
          onMouseLeave={e => (e.currentTarget.style.background = "#ef4444")}
        >
          Reserve Your Plan →
        </motion.button>

        {/* ✅ Back to Home */}
        <motion.button
          onClick={handleBackHome}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: "0.18em",
            background: "transparent", color: "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.12)", padding: "14px 32px",
            cursor: "pointer", transition: "color 0.2s, border-color 0.2s"
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
        >
          Back to Home
        </motion.button>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.18)", marginTop: 20, letterSpacing: "0.1em" }}>
        // You'll receive a final approval email once screening is complete
      </motion.p>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BrandPartnershipAgreement() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const planData           = location.state?.plan ?? null;
  const brandNameFromState = location.state?.brandName ?? "";

  // ✅ Read token immediately using the correct key from authcontext
  const [userToken, setUserToken] = useState(
    () =>
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      ""
  );
  const [registeredBrandName, setRegisteredBrandName] = useState(brandNameFromState);

  const [activeSection, setActiveSection] = useState("authenticity");
  const [readSections, setReadSections]   = useState(new Set());
  const [signedBrand, setSignedBrand]     = useState(null);
  const tocRef  = useRef(null);
  const wrapRef = useRef(null);

  const markRead  = (id) => setReadSections(prev => new Set([...prev, id]));
  const readCount = readSections.size;

  // ── Guard: if already signed, skip straight to checkout ──────────────────
  useEffect(() => {
    if (!userToken || !planData) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/brand/profile`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const alreadySigned =
          data?.data?.partnership_signed ||
          data?.data?.brand?.partnership_signed ||
          false;

        if (alreadySigned) {
          navigate("/subscribe/checkout", { state: { plan: planData } });
        }
      })
      .catch(() => {});
  }, [userToken]);

  // ── Fetch registered brand name ───────────────────────────────────────────
  useEffect(() => {
    try {
      // Priority 1: from navigation state
      if (brandNameFromState) {
        setRegisteredBrandName(brandNameFromState);
        return;
      }

      // Priority 2: dedicated localStorage key
      const savedBrandName = localStorage.getItem("brand_name") || "";
      if (savedBrandName) {
        setRegisteredBrandName(savedBrandName);
        return;
      }

      // Priority 3: stored user object
      const raw  = localStorage.getItem("user") || sessionStorage.getItem("user") || "{}";
      const user = JSON.parse(raw);
      if (user?.brand_name) {
        setRegisteredBrandName(user.brand_name);
        return;
      }

      // Priority 4: fetch from API using correct token key
      const token =
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        "";

      if (token) {
        fetch(`${import.meta.env.VITE_API_URL}/api/brand/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.json())
          .then(data => {
            const name =
              data?.data?.brand_name ||
              data?.data?.brand?.brand_name ||
              data?.brand_name ||
              "";
            if (name) {
              setRegisteredBrandName(name);
              localStorage.setItem("brand_name", name);
            }
          })
          .catch(() => {});
      }
    } catch {
      // fail silently
    }
  }, []);

  const handleProceedToCheckout = () => {
    if (planData) navigate("/subscribe/checkout", { state: { plan: planData } });
    else navigate("/subscribe");
  };

  // ── JS-sticky TOC ─────────────────────────────────────────────────────────
  useEffect(() => {
    const GAP = 32;
    const onScroll = () => {
      const toc  = tocRef.current;
      const wrap = wrapRef.current;
      if (!toc || !wrap) return;
      const scrolledPast = -wrap.getBoundingClientRect().top + GAP;
      const maxTop       = wrap.offsetHeight - toc.offsetHeight;
      toc.style.transform = `translateY(${Math.min(Math.max(scrolledPast, 0), maxTop)}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Active section tracker ────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.getBoundingClientRect().top <= 140) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 100, behavior: "smooth" });
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.2)} }
        .bp-para { font-family:'DM Sans',sans-serif; font-weight:300; color:rgba(255,255,255,0.55); font-size:13.5px; line-height:1.75; margin-bottom:12px; }
        .bp-toc-btn { display:flex; align-items:baseline; gap:8px; width:100%; background:none; border:none; cursor:pointer; text-align:left; padding:5px 0; font-family:'Space Mono',monospace; font-size:10px; line-height:1.5; transition:color 0.2s; }
        .bp-toc-btn:hover { color:rgba(255,255,255,0.75) !important; }
        .bp-toc::-webkit-scrollbar { display:none; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:#0a0a0a; } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); }
        @media (max-width:768px) { .bp-toc{display:none !important} .bp-main{padding:2rem 1.5rem !important} .hero-pad{padding:100px 1.5rem 70px !important} }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: "88vh" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=80&fit=crop&crop=center")`, backgroundSize: "cover", backgroundPosition: "center center", filter: "grayscale(15%) brightness(0.75) contrast(1.05)", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(5,5,5,0.48) 0%,rgba(5,5,5,0.38) 35%,rgba(5,5,5,0.58) 65%,rgba(5,5,5,0.97) 88%,rgba(10,10,10,1) 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg,rgba(239,68,68,0.28) 0%,rgba(239,68,68,0.12) 40%,rgba(239,68,68,0.04) 65%,transparent 80%)", zIndex: 2 }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(239,68,68,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(239,68,68,0.1) 1px,transparent 1px)", backgroundSize: "60px 60px", zIndex: 3, pointerEvents: "none" }} />
        <motion.div animate={{ scale:[1,1.18,1], opacity:[0.3,0.48,0.3] }} transition={{ duration:7, repeat:Infinity, ease:"easeInOut" }} style={{ position:"absolute", top:"-5%", left:"-5%", width:"clamp(300px,38vw,550px)", height:"clamp(300px,38vw,550px)", borderRadius:"50%", background:"radial-gradient(circle,rgba(239,68,68,0.35) 0%,transparent 70%)", filter:"blur(65px)", zIndex:4, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:"10%", right:"-1%", fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(5rem,14vw,13rem)", color:"rgba(255,255,255,0.16)", letterSpacing:"0.05em", whiteSpace:"nowrap", userSelect:"none", pointerEvents:"none", lineHeight:1, zIndex:5, textShadow:"0 0 80px rgba(239,68,68,0.3)" }}>PARTNERSHIP</div>
        <motion.div initial={{ x:"-100%" }} animate={{ x:"300%" }} transition={{ duration:2.5, delay:0.3, ease:"easeInOut" }} style={{ position:"absolute", inset:0, width:"25%", background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)", pointerEvents:"none", zIndex:6 }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:160, background:"linear-gradient(to bottom,transparent,#0a0a0a)", zIndex:7, pointerEvents:"none" }} />

        <motion.div className="hero-pad" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.7 }} style={{ position:"relative", zIndex:10, padding:"130px clamp(1.5rem,5vw,6rem) 120px", maxWidth:760 }}>
          <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5, delay:0.2 }} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:"#ef4444", animation:"pulse 2s infinite", boxShadow:"0 0 12px rgba(239,68,68,0.8)" }} />
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.28em", color:"rgba(255,255,255,0.7)", textTransform:"uppercase", background:"rgba(0,0,0,0.45)", padding:"3px 10px" }}>Confidential — Brand Partner Document</span>
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.3 }} style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(3.5rem,9vw,8rem)", lineHeight:0.88, letterSpacing:"0.02em", marginBottom:28, textShadow:"0 2px 20px rgba(0,0,0,1),0 4px 40px rgba(0,0,0,0.9)" }}>
            Brand<br />
            <span style={{ color:"#ef4444", textShadow:"0 0 40px rgba(239,68,68,0.7),0 2px 20px rgba(0,0,0,1)" }}>Partnership</span><br />
            Agreement
          </motion.h1>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5, delay:0.5 }} style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:36 }}>
            {["// Effective: 2025","// Version: 1.0","// Parties: Blvckmrkt + Partner Brand"].map(tag => (
              <span key={tag} style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.65)", letterSpacing:"0.1em", background:"rgba(0,0,0,0.55)", border:"1px solid rgba(255,255,255,0.12)", padding:"4px 10px" }}>{tag}</span>
            ))}
          </motion.div>

          <motion.div initial={{ width:0 }} animate={{ width:"clamp(160px,25vw,320px)" }} transition={{ duration:0.9, delay:0.55 }} style={{ height:1, background:"linear-gradient(90deg,#ef4444,rgba(239,68,68,0))", marginBottom:36 }} />

          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.65 }} style={{ maxWidth:420, background:"rgba(0,0,0,0.58)", backdropFilter:"blur(14px)", border:"1px solid rgba(255,255,255,0.1)", padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:"0.18em" }}>// READING PROGRESS</span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, fontWeight:700, color:readCount===SECTIONS.length?"#22c55e":"#ef4444", textShadow:readCount===SECTIONS.length?"0 0 10px rgba(34,197,94,0.6)":"0 0 10px rgba(239,68,68,0.6)" }}>{readCount}/{SECTIONS.length} clauses</span>
            </div>
            <div style={{ height:3, background:"rgba(255,255,255,0.1)", borderRadius:2, overflow:"hidden", marginBottom:10 }}>
              <motion.div animate={{ width:`${(readCount/SECTIONS.length)*100}%` }} transition={{ duration:0.4 }} style={{ height:"100%", borderRadius:2, background:readCount===SECTIONS.length?"linear-gradient(90deg,#22c55e,#16a34a)":"linear-gradient(90deg,#ef4444,#f87171)", boxShadow:readCount===SECTIONS.length?"0 0 10px rgba(34,197,94,0.7)":"0 0 10px rgba(239,68,68,0.7)" }} />
            </div>
            <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:10 }}>
              {SECTIONS.map(s => (
                <motion.div key={s.id} title={s.title} animate={{ background:readSections.has(s.id)?"#22c55e":"rgba(255,255,255,0.15)", boxShadow:readSections.has(s.id)?"0 0 6px rgba(34,197,94,0.5)":"none" }} transition={{ duration:0.3 }} style={{ width:22, height:4, borderRadius:2 }} />
              ))}
            </div>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.3)", margin:0, letterSpacing:"0.1em" }}>
              {readCount===0 && "Scroll through all clauses to unlock signing"}
              {readCount>0 && readCount<SECTIONS.length && `${Math.round((readCount/SECTIONS.length)*100)}% reviewed — keep reading...`}
              {readCount===SECTIONS.length && <span style={{ color:"#22c55e" }}>✓ All clauses reviewed — ready to sign</span>}
            </p>
          </motion.div>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.1 }} style={{ display:"flex", alignItems:"center", gap:10, marginTop:40, fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.45)", letterSpacing:"0.14em" }}>
            <motion.div animate={{ y:[0,5,0] }} transition={{ duration:1.6, repeat:Infinity, ease:"easeInOut" }}>
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="5" stroke="rgba(239,68,68,0.6)" strokeWidth="1.2"/>
                <motion.rect x="5" y="3" width="2" height="3" rx="1" fill="#ef4444" animate={{ y:[0,2,0] }} transition={{ duration:1.6, repeat:Infinity, ease:"easeInOut" }} />
                <path d="M4 14l2 2 2-2" stroke="rgba(239,68,68,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </motion.div>
            Scroll to review all clauses
          </motion.div>
        </motion.div>
      </div>

      {/* ── Body ── */}
      <div ref={wrapRef} style={{ display:"flex", maxWidth:1340, margin:"0 auto", alignItems:"flex-start" }}>

        {/* TOC */}
        <nav ref={tocRef} className="bp-toc" style={{ width:260, flexShrink:0, alignSelf:"flex-start", maxHeight:"calc(100vh - 120px)", overflowY:"auto", scrollbarWidth:"none", borderRight:"1px solid rgba(255,255,255,0.07)", padding:"32px 20px 60px" }}>
          <p style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", marginBottom:16, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>// Contents</p>
          {SECTIONS.map(s => {
            const read = readSections.has(s.id);
            const active = activeSection === s.id;
            return (
              <button key={s.id} onClick={() => scrollTo(s.id)} className="bp-toc-btn" style={{ color:active?"#ef4444":read?"rgba(34,197,94,0.7)":"rgba(255,255,255,0.22)" }}>
                <span style={{ color:"rgba(255,255,255,0.1)", fontSize:9, flexShrink:0 }}>{s.num}</span>
                {s.title}
                {read && !active && <span style={{ marginLeft:"auto", fontSize:8, color:"#22c55e" }}>✓</span>}
              </button>
            );
          })}
          <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"rgba(255,255,255,0.2)", letterSpacing:"0.15em", marginBottom:8 }}>// READ</p>
            <div style={{ height:2, background:"rgba(255,255,255,0.06)" }}>
              <div style={{ height:"100%", width:`${(readCount/SECTIONS.length)*100}%`, background:readCount===SECTIONS.length?"#22c55e":"#ef4444", transition:"width 0.4s,background 0.4s" }} />
            </div>
            <p style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:readCount===SECTIONS.length?"#22c55e":"rgba(255,255,255,0.25)", marginTop:6 }}>
              {readCount===SECTIONS.length ? "All clauses reviewed ✓" : `${readCount} of ${SECTIONS.length}`}
            </p>
          </div>
        </nav>

        {/* Main */}
        <main className="bp-main" style={{ flex:1, minWidth:0, padding:"clamp(2rem,4vw,4rem) clamp(1.5rem,4vw,5rem)", fontFamily:"'DM Sans',sans-serif" }}>

          <Callout label="Before You Begin" color="yellow">
            This document governs the relationship between <strong style={{ color:"#fff" }}>Blvckmrkt</strong> ("the Platform") and you ("the Brand"). Scroll through each clause carefully — your reading progress is tracked. You must review all 11 clauses before you can execute the agreement.
          </Callout>

          <SectionBlock id="authenticity" num="01" title="Product Authenticity & Listing Requirements" isRead={readSections.has("authenticity")} onRead={markRead}>
            <p className="bp-para">The integrity of the BLVCKMRKT marketplace depends entirely on the authenticity of what gets listed on it. We do not tolerate misrepresentation in any form.</p>
            <RuleList items={["Only products currently available for sale may be listed on the platform.","Listings must accurately represent the product in quality, condition, and appearance.","Misleading imagery, inflated quality claims, or deceptive descriptions are strictly prohibited.","Any form of fraud or deceptive listing practice will result in immediate suspension or permanent termination."]} />
            <Callout label="Zero Tolerance">We have a zero-tolerance policy on counterfeit or misrepresented goods. The platform's trust is its most valuable asset — protect it.</Callout>
          </SectionBlock>

          <SectionBlock id="fulfillment" num="02" title="Order Fulfillment & Delivery Standards" isRead={readSections.has("fulfillment")} onRead={markRead}>
            <p className="bp-para">You are solely responsible for the timely processing and delivery of all orders placed through your storefront on BLVCKMRKT. This is non-negotiable.</p>
            <RuleList items={["Orders must be dispatched as quickly as reasonably possible after purchase confirmation.","You must clearly specify which locations you can deliver to and keep this information up to date.","A reliable, functional delivery system must be maintained for the duration of your partnership.","Until platform-wide logistics are established, brands manage their own delivery operations."]} />
          </SectionBlock>

          <SectionBlock id="delays" num="03" title="Delivery Delays & Communication" isRead={readSections.has("delays")} onRead={markRead}>
            <p className="bp-para">Delays happen — but silence does not. Customers must always be informed. Leaving a buyer in the dark is considered a serious breach of partnership standards.</p>
            <RuleList items={["In the event of any delay, the Brand must promptly inform the customer with a clear explanation.","An updated and realistic delivery timeline must be communicated at the time of notification.","Customers must never be left without communication regarding the status of their order.","Repeated unexplained delays may be grounds for suspension."]} />
            <Callout label="Communication Standard" color="yellow">Proactive communication is always better than reactive damage control. Keep your buyers informed — they chose to trust your brand.</Callout>
          </SectionBlock>

          <SectionBlock id="compensation" num="04" title="Maximum Fulfillment Period & Compensation" isRead={readSections.has("compensation")} onRead={markRead}>
            <StatCards cards={[{label:"// Max Fulfillment",value:"14",sub:"days from purchase"},{label:"// Status",value:"Advisory",sub:"not mandatory"},{label:"// Resolution",value:"Brand-led",sub:"case by case"}]} />
            <p className="bp-para">If a product takes longer than <strong style={{ color:"#fff" }}>14 days (2 weeks)</strong> to be delivered, the Brand is advised to provide appropriate compensation to the buyer where reasonable.</p>
            <Callout label="Advisory — Not Compulsory" color="yellow">Compensation is strongly advised but not legally enforced — some customers may simply be impatient. Use your judgement.</Callout>
          </SectionBlock>

          <SectionBlock id="escrow" num="05" title="Payment Handling & Escrow Policy" isRead={readSections.has("escrow")} onRead={markRead}>
            <p className="bp-para">To protect both buyers and the integrity of the marketplace, BLVCKMRKT holds customer payments in escrow until delivery is confirmed.</p>
            <RuleList items={["All customer payments are held by Blvckmrkt until delivery is confirmed by the buyer.","This protects buyers from fraudulent fulfillment and holds brands accountable.","Brands that require partial upfront payment for production or logistics may negotiate alternative payment structures with BLVCKMRKT on a case-by-case basis.","Flexibility may be granted at the platform's discretion based on track record and trust level."]} />
            <Callout label="Escrow Protects Everyone">This system is not about distrust — it's about building a marketplace where buyers feel safe spending money on brands they've never purchased from before.</Callout>
          </SectionBlock>

          <SectionBlock id="subscription" num="06" title="Monthly Subscription" isRead={readSections.has("subscription")} onRead={markRead}>
            <StatCards cards={[{label:"// Monthly Fee",value:"₦35K",sub:"per month"},{label:"// Billing",value:"Manual",sub:"no auto-charge"},{label:"// Cancellation",value:"Anytime",sub:"after monthly sub"}]} />
            <p className="bp-para">To maintain an active storefront on BLVCKMRKT, brands are charged a subscription fee of <strong style={{ color:"#fff" }}>₦35,000 per month</strong>.</p>
            <RuleList items={["Subscription billing is manual — we do not support automatic or unreminded recurring charges.","Subscription can be cancelled at any time following the end of the current billing month.","Brands will be notified in advance of any changes to the subscription price.","Non-payment will result in temporary deactivation of the brand storefront."]} />
          </SectionBlock>

          <SectionBlock id="platform-fee" num="07" title="Platform Fee & Investment Policy" isRead={readSections.has("platform-fee")} onRead={markRead}>
            <StatCards cards={[{label:"// Standard Fee",value:"12%",sub:"per sale"},{label:"// Model",value:"Growth",sub:"reinvestment focused"},{label:"// Negotiable",value:"Yes",sub:"case by case"}]} />
            <p className="bp-para">BLVCKMRKT operates a unique, growth-focused revenue model. Rather than extracting profit, we reinvest platform fees directly back into driving sales for the brands on the platform.</p>
            <RuleList items={["A standard 12% platform fee applies to each sale made through the platform.","Instead of collecting this as direct profit, BLVCKMRKT may reinvest it as customer discounts, promotional subsidies, or marketing support for the Brand.","The 12% rate is negotiable and may vary based on brand category, volume, or strategic terms.","Exceptions may apply at the platform's discretion."]} />
            <Callout label="The Growth Philosophy" color="green">Our fee model is designed to grow your brand's presence, not just take a cut. When you win, the platform wins.</Callout>
          </SectionBlock>

          <SectionBlock id="responsibilities" num="08" title="Brand Responsibilities" isRead={readSections.has("responsibilities")} onRead={markRead}>
            <p className="bp-para">As a BLVCKMRKT partner, you represent not just your brand but the platform's reputation. The following responsibilities are non-negotiable commitments:</p>
            <RuleList items={["Maintain honest, accurate, and timely communication with customers at all times.","Deliver products within agreed timelines and proactively notify buyers of any changes.","Provide and maintain a functional, reliable delivery system throughout your partnership.","Uphold the reputation and integrity of the BLVCKMRKT platform in all customer interactions.","Resolve customer disputes fairly and in good faith, escalating to BLVCKMRKT where necessary."]} />
          </SectionBlock>

          <SectionBlock id="enforcement" num="09" title="Enforcement & Compliance" isRead={readSections.has("enforcement")} onRead={markRead}>
            <p className="bp-para">Non-compliance with the terms of this agreement will be taken seriously. The platform reserves the right to act swiftly to protect buyers and the marketplace.</p>
            <RuleList items={["Temporary suspension — for minor or first-time violations pending review.","Permanent removal — for repeated breaches, fraud, or gross misconduct.","Withholding of payments — where active disputes or fraud investigations are in progress.","All enforcement actions will be communicated to the Brand with a clear explanation."]} />
            <Callout label="Fair Process">We are not trigger-happy — enforcement follows a fair review process. However, buyer protection is our highest priority and will always take precedence.</Callout>
          </SectionBlock>

          <SectionBlock id="amendments" num="10" title="Amendments" isRead={readSections.has("amendments")} onRead={markRead}>
            <p className="bp-para">BLVCKMRKT is a growing platform and its policies will evolve alongside it. The platform reserves the right to modify these terms as circumstances change.</p>
            <RuleList items={["BLVCKMRKT reserves the right to modify these terms as the platform evolves.","Brands will be notified of any significant updates in advance.","Continued operation on the platform following an amendment constitutes acceptance of the updated terms.","For material changes, Brands will be given a reasonable window to review before the amendment takes effect."]} />
          </SectionBlock>

          <SectionBlock id="acknowledgment" num="11" title="Agreement Acknowledgment" isRead={readSections.has("acknowledgment")} onRead={markRead}>
            <p className="bp-para">By executing this agreement below, you confirm that you have read, understood, and agreed to all terms outlined in this document.</p>
            <div style={{ background:"#0d0d0d", border:"1px solid rgba(255,255,255,0.08)", padding:"20px 24px", marginBottom:20 }}>
              <p style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.15em", marginBottom:12 }}>// AGREEMENT TERMS</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.7, margin:0, fontStyle:"italic" }}>"By partnering with Blvckmrkt and listing products on the Platform, the Brand confirms that it has read, understood, and agreed to all terms outlined in this Agreement."</p>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center", fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.25)", letterSpacing:"0.1em" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444", flexShrink:0 }} />
              Building trust, driving growth, and connecting brands to buyers.
            </div>
          </SectionBlock>

          {/* ── Signing terminal or sealed screen ── */}
// In BrandPartnershipAgreement — where SigningTerminal renders
{!signedBrand ? (
  <SigningTerminal
    readCount={readCount}
    total={SECTIONS.length}
    onSigned={(name) => {
      console.log("[Page] onSigned called with:", name, "planData:", planData); // ✅ debug
      setSignedBrand(name);
    }}
    registeredBrandName={registeredBrandName}
    userToken={userToken}
  />
) : (
  <AgreementSealed
    brandName={signedBrand}
    planData={planData} 
    onProceed={handleProceedToCheckout}
  />
)}

          <div style={{ height:80 }} />
        </main>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", padding:"24px clamp(1.5rem,5vw,4rem)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>© BLVCKMRKT — All rights reserved</span>
        <div style={{ display:"flex", gap:24 }}>
          {[{to:"/terms",label:"Terms"},{to:"/privacy",label:"Privacy"},{to:"/shipping-policy",label:"Shipping"},{to:"/returns",label:"Returns"},{to:"/authentication",label:"Trust & Auth"}].map(({to,label}) => (
            <Link key={to} to={to} style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.25)", textDecoration:"none", letterSpacing:"0.1em", textTransform:"uppercase", transition:"color 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.color="#ef4444"}} onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.25)"}}>{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}