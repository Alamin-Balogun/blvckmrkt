import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "overview",       num: "01", title: "Overview" },
  { id: "responsibility", num: "02", title: "Shipping Responsibility" },
  { id: "costs",          num: "03", title: "Shipping Costs" },
  { id: "timeframes",     num: "04", title: "Delivery Timeframes" },
  { id: "liability",      num: "05", title: "Liability & Risk" },
  { id: "support",        num: "06", title: "Customer Support" },
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

function InfoCards({ cards }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", margin: "16px 0",
    }}>
      {cards.map((card, i) => (
        <div key={i} style={{ background: "#0d0d0d", padding: "18px 16px" }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "#ef4444", marginBottom: 8 }}>{card.label}</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ShippingPolicyPage() {
  const [activeSection, setActiveSection] = useState("overview");
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
        .sp-para { font-family: 'DM Sans', sans-serif; font-weight: 300; color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.75; margin-bottom: 12px; }
        .sp-toc-btn { display:flex; align-items:baseline; gap:8px; width:100%; background:none; border:none; cursor:pointer; text-align:left; padding:5px 0; font-family:'Space Mono',monospace; font-size:10px; line-height:1.5; transition:color 0.2s; }
        .sp-toc-btn:hover { color: rgba(255,255,255,0.75) !important; }
        .sp-toc::-webkit-scrollbar { width: 4px; }
        .sp-toc::-webkit-scrollbar-track { background: transparent; }
        .sp-toc::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.3); border-radius: 2px; }
        .sp-toc::-webkit-scrollbar-thumb:hover { background: rgba(239,68,68,0.5); }
        @media (max-width: 1024px) { .sp-toc { display: none !important; } }
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
          backgroundImage: `url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80&fit=crop&crop=edges")`,
          backgroundSize: "cover", backgroundPosition: "center 40%", filter: "grayscale(30%)",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.82) 55%, rgba(10,10,10,0.98) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.45) 65%, transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 0% 110%, rgba(239,68,68,0.13) 0%, transparent 55%)" }} />

        <span style={{
          position: "absolute", right: "-0.02em", top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(4rem,14vw,12rem)",
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.06)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
        }}>SHIPPING</span>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 720 }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.32em", color: "#ef4444", textTransform: "uppercase", marginBottom: 14 }}
          >// 003 — Policy</motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
            style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(3rem,9vw,7rem)", lineHeight: 0.9, letterSpacing: "0.03em", marginBottom: 24, textShadow: "0 4px 48px rgba(0,0,0,0.7)" }}
          >
            Shipping<br /><span style={{ color: "#ef4444" }}>Policy</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.45 }}
            style={{ display: "flex", gap: 24, flexWrap: "wrap", fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}
          >
            <span>Effective Date: [Insert Date]</span>
            <span>Version: 1.0</span>
            <span>Applies to: All Orders</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════ BODY: JS-sticky TOC + content ══════════ */}
      <div ref={wrapRef} style={{ display: "flex", maxWidth: 1280, margin: "0 auto", alignItems: "flex-start" }}>

        {/* ── JS-sticky TOC sidebar ── */}
        <nav
          ref={tocRef}
          className="sp-toc"
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
              className="sp-toc-btn"
              style={{ color: activeSection === s.id ? "#ef4444" : "rgba(255,255,255,0.25)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 9, flexShrink: 0 }}>{s.num}</span>
              {s.title}
            </button>
          ))}
        </nav>

        {/* ── Main content ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "clamp(2rem,4vw,4rem) clamp(1.5rem,4vw,5rem)", fontFamily: "'DM Sans', sans-serif" }}>

          <SectionBlock id="overview" num="01" title="Overview">
            <p className="sp-para">
              This Shipping Policy governs the delivery of all products purchased through our platform. By placing an order, you acknowledge and agree to the terms outlined herein.
            </p>
            <Callout label="How It Works">
              Our platform operates as a marketplace that connects buyers with independent brands ("Sellers"). The responsibility for order fulfillment and delivery rests primarily with the respective Seller.
            </Callout>
          </SectionBlock>

          <SectionBlock id="responsibility" num="02" title="Shipping Responsibility">
            <p className="sp-para">
              All shipping, handling, and delivery logistics are managed directly by the Seller from whom the product is purchased. This includes but is not limited to:
            </p>
            <RuleList items={[
              "Packaging of items",
              "Selection of courier or delivery method",
              "Dispatch timelines",
              "Communication regarding delivery status",
            ]} />
            <Callout label="Platform Role">
              We do not directly handle or dispatch physical products. We facilitate the transaction and ensure that Sellers adhere to expected operational standards. When plans are made, all relevant information will be communicated accordingly.
            </Callout>
          </SectionBlock>

          <SectionBlock id="costs" num="03" title="Shipping Costs">
            <p className="sp-para">
              Shipping fees are determined by the Seller and are added to the total cost at checkout. These fees may vary depending on several factors:
            </p>
            <InfoCards cards={[
              { label: "// Location",        value: "Fees vary based on delivery destination" },
              { label: "// Size & Weight",   value: "Heavier or larger orders may incur higher fees" },
              { label: "// Delivery Method", value: "Express vs standard options carry different rates" },
            ]} />
            <Callout label="Buyer Responsibility">
              The Buyer is solely responsible for the payment of shipping fees unless otherwise explicitly stated by the Seller at checkout.
            </Callout>
          </SectionBlock>

          <SectionBlock id="timeframes" num="04" title="Delivery Timeframes">
            <p className="sp-para">
              Estimated delivery timelines are provided by Sellers and may vary based on location, order volume, and operational capacity.
            </p>
            <p className="sp-para">
              While Sellers are expected to meet their stated timelines, delays may occur due to unforeseen circumstances such as logistics disruptions or high demand periods. Blvckmrkt is not liable for Seller-caused delays but will work to facilitate resolution where possible.
            </p>
          </SectionBlock>

          <SectionBlock id="liability" num="05" title="Liability & Risk">
            <p className="sp-para">
              Once an order has been dispatched by the Seller, the risk of loss or damage transfers to the Buyer, subject to applicable consumer protection laws.
            </p>
            <Callout label="Seller Duty">
              Sellers are expected to provide reasonable support in resolving delivery issues, including providing tracking information and coordinating with couriers where applicable.
            </Callout>
          </SectionBlock>

          <SectionBlock id="support" num="06" title="Customer Support">
            <p className="sp-para">
              In the event of shipping-related issues, please follow this resolution path:
            </p>
            <StepList steps={[
              "Contact the Seller directly via the platform messaging system and provide your order details.",
              "Allow the Seller a reasonable timeframe to investigate and respond to your issue.",
              "If the issue remains unresolved after contact with the Seller, escalate to Blvckmrkt support.",
              "The platform will review the case and may intervene to facilitate a fair and timely resolution.",
            ]} />
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Shipping support enquiries</p>
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
            { to: "/shipping-policy",       label: "Shipping",     active: true  },
            { to: "/return",        label: "Returns",      active: false },
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