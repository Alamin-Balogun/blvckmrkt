import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "general",     num: "01", title: "General Policy" },
  { id: "eligibility", num: "02", title: "Refund Eligibility" },
  { id: "process",     num: "03", title: "Refund Request Process" },
  { id: "processing",  num: "04", title: "Refund Processing" },
  { id: "limitations", num: "05", title: "Limitations" },
  { id: "disputes",    num: "06", title: "Dispute Resolution" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionBlock({ id, num, title, children }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
      style={{ paddingBottom: 48, marginBottom: 48, borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.18em",
          color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          padding: "3px 8px", flexShrink: 0,
        }}>{num}</span>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.5rem,3vw,2.2rem)",
          letterSpacing: "0.04em", color: "#fff", margin: 0, lineHeight: 1,
        }}>{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function Callout({ label = "NOTE", children }) {
  return (
    <div style={{
      background: "rgba(239,68,68,0.06)", borderLeft: "2px solid #ef4444",
      padding: "12px 16px", margin: "14px 0", fontSize: 13, color: "rgba(255,255,255,0.7)",
    }}>
      <span style={{
        display: "block", fontFamily: "'Space Mono', monospace", fontSize: 8,
        letterSpacing: "0.2em", color: "#ef4444", marginBottom: 4, textTransform: "uppercase",
      }}>{label}</span>
      {children}
    </div>
  );
}

function RuleList({ items }) {
  return (
    <ul style={{ listStyle: "none", margin: "10px 0", padding: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: "flex", gap: 10, padding: "6px 0", fontSize: 13,
          color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          <span style={{ color: "#ef4444", fontFamily: "'Space Mono', monospace", fontSize: 10, flexShrink: 0, marginTop: 2 }}>—</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function StepList({ steps }) {
  return (
    <ol style={{ listStyle: "none", margin: "16px 0", padding: 0 }}>
      {steps.map((step, i) => (
        <li key={i} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem",
            color: "#ef4444", opacity: 0.5, flexShrink: 0, lineHeight: 1, marginTop: 2, minWidth: 28,
          }}>{String(i + 1).padStart(2, "0")}</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function EligibilityGrid({ items }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", margin: "16px 0",
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: "#0d0d0d", padding: "20px 18px" }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem",
            color: item.highlight ? "#ef4444" : "rgba(255,255,255,0.15)", lineHeight: 1, marginBottom: 8,
          }}>{item.value}</div>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ef4444", marginBottom: 6 }}>{item.label}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ReturnRefundPage() {
  const [activeSection, setActiveSection] = useState("general");
  const tocRef  = useRef(null);
  const wrapRef = useRef(null);

  // ── JS-based sticky: same pattern as Terms/Privacy ──
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

  // ── Active section tracker ──
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
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        .rr-para { font-family: 'DM Sans', sans-serif; font-weight: 300; color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.75; margin-bottom: 12px; }
        .rr-toc-btn { display:flex; align-items:baseline; gap:8px; width:100%; background:none; border:none; cursor:pointer; text-align:left; padding:5px 0; font-family:'Space Mono',monospace; font-size:10px; line-height:1.5; transition:color 0.2s; }
        .rr-toc-btn:hover { color: rgba(255,255,255,0.75) !important; }
        .rr-toc::-webkit-scrollbar { width: 4px; }
        .rr-toc::-webkit-scrollbar-track { background: transparent; }
        .rr-toc::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.3); border-radius: 2px; }
        .rr-toc::-webkit-scrollbar-thumb:hover { background: rgba(239,68,68,0.5); }
        @media (max-width: 1024px) { .rr-toc { display: none !important; } }
      `}</style>

      {/* ══════════ HERO ══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          position: "relative", minHeight: 440, display: "flex", alignItems: "flex-end",
          padding: "clamp(3rem,8vw,5rem) clamp(1.5rem,5vw,4rem) clamp(2.5rem,4vw,4rem)",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80&fit=crop&crop=center")`,
          backgroundSize: "cover", backgroundPosition: "center 30%", filter: "grayscale(35%)",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.80) 55%, rgba(10,10,10,0.98) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.45) 65%, transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 0% 110%, rgba(239,68,68,0.14) 0%, transparent 55%)" }} />

        <span style={{
          position: "absolute", right: "-0.02em", top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(3.5rem,12vw,10rem)",
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.06)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
        }}>RETURNS</span>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 720 }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.32em", color: "#ef4444", textTransform: "uppercase", marginBottom: 14 }}
          >// 004 — Policy</motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
            style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(3rem,9vw,7rem)", lineHeight: 0.9, letterSpacing: "0.03em", marginBottom: 24, textShadow: "0 4px 48px rgba(0,0,0,0.7)" }}
          >
            Returns &amp;<br /><span style={{ color: "#ef4444" }}>Refund Policy</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.45 }}
            style={{ display: "flex", gap: 24, flexWrap: "wrap", fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}
          >
            <span>Effective Date: [Insert Date]</span>
            <span>Version: 1.0</span>
            <span>12-Hour Refund Window</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════ BODY: JS-sticky TOC + content ══════════ */}
      <div ref={wrapRef} style={{ display: "flex", maxWidth: 1280, margin: "0 auto", alignItems: "flex-start" }}>

        {/* ── JS-sticky TOC sidebar ── */}
        <nav
          ref={tocRef}
          className="rr-toc"
          style={{
            width: 240,
            flexShrink: 0,
            alignSelf: "flex-start",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            padding: "32px 20px",
            paddingBottom: "60px",
          }}
        >
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.25em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
            marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>// Contents</p>

          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="rr-toc-btn"
              style={{ color: activeSection === s.id ? "#ef4444" : "rgba(255,255,255,0.25)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 9, flexShrink: 0 }}>{s.num}</span>
              {s.title}
            </button>
          ))}
        </nav>

        {/* ── Main content ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "clamp(2rem,4vw,4rem) clamp(1.5rem,4vw,5rem)", fontFamily: "'DM Sans', sans-serif" }}>

          <SectionBlock id="general" num="01" title="General Policy">
            <p className="rr-para">
              This Returns &amp; Refund Policy outlines the conditions under which Buyers may request refunds for purchases made on the platform.
            </p>
            <Callout label="Agreement">
              By completing a transaction, you agree to comply with the terms specified in this policy. All refund decisions are subject to review based on timing, product status, and the specific circumstances of the request.
            </Callout>
          </SectionBlock>

          <SectionBlock id="eligibility" num="02" title="Refund Eligibility">
            <p className="rr-para">A refund request may be considered valid under the following conditions:</p>
            <EligibilityGrid items={[
              { value: "12H",  label: "// Time Window",     highlight: true,  desc: "Request must be made within 12 hours of placing the order" },
              { value: "0%",   label: "// Production",      highlight: false, desc: "Production of the item must not have commenced" },
              { value: "✓",    label: "// Defective Items", highlight: false, desc: "Item delivered is defective, incorrect, or significantly different from description" },
            ]} />
            <p className="rr-para">Refund eligibility is determined based on a combination of timing, product status, and the specific circumstances surrounding the request.</p>
          </SectionBlock>

          <SectionBlock id="process" num="03" title="Refund Request Process">
            <p className="rr-para">When a Buyer submits a refund request, the following steps are taken:</p>
            <StepList steps={[
              "The Seller is immediately notified of the refund request via the platform.",
              "The Seller reviews the request in accordance with their production and fulfillment status.",
              "A determination is made regarding approval or denial of the refund based on eligibility criteria.",
              "The platform may review and mediate disputes where necessary to ensure fairness and compliance with this policy.",
            ]} />
          </SectionBlock>

          <SectionBlock id="processing" num="04" title="Refund Processing">
            <p className="rr-para">
              Approved refunds will be processed within a reasonable timeframe following the final decision.
            </p>
            <Callout label="Payment Method">
              The method of refund will typically mirror the original payment method used during checkout, unless otherwise agreed between the Buyer, Seller, and platform.
            </Callout>
          </SectionBlock>

          <SectionBlock id="limitations" num="05" title="Limitations">
            <p className="rr-para">Refunds may not be granted under the following circumstances:</p>
            <RuleList items={[
              "Requests made after the 12-hour window (unless exceptional conditions apply)",
              "Products that have already entered irreversible production stages",
              "Change of mind without valid justification after production has begun",
            ]} />
            <Callout label="Exceptions">
              Exceptional circumstances — such as a demonstrably defective product received after the refund window — may still be reviewed at the platform's discretion. Contact us with evidence to open a case.
            </Callout>
          </SectionBlock>

          <SectionBlock id="disputes" num="06" title="Dispute Resolution">
            <p className="rr-para">
              In cases of disagreement between Buyer and Seller, the platform reserves the right to investigate and issue a final decision based on available evidence and fairness principles.
            </p>
            <p className="rr-para">
              Both parties are expected to cooperate fully during any investigation, including providing order receipts, photos, or correspondence as evidence.
            </p>
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Open a refund dispute or enquiry</p>
              <a href="mailto:blvckmrkt.market@gmail.com"
                style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "#ef4444", textDecoration: "none", border: "1px solid rgba(239,68,68,0.4)", padding: "8px 16px", letterSpacing: "0.08em", whiteSpace: "nowrap" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#ef4444"; }}
              >blvckmrkt.market@gmail.com</a>
            </div>
          </SectionBlock>

        </main>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "24px clamp(1.5rem,5vw,4rem)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>© BLVCKMRKT — All rights reserved</span>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { to: "/terms",          label: "Terms",        active: false },
            { to: "/privacy",        label: "Privacy",      active: false },
            { to: "/shipping-policy",       label: "Shipping",     active: false },
            { to: "/return",        label: "Returns",      active: true  },
            { to: "/authentication", label: "Trust & Auth", active: false },
          ].map(({ to, label, active }) => (
            <Link key={to} to={to}
              style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: active ? "#ef4444" : "rgba(255,255,255,0.25)", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}
            >{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}