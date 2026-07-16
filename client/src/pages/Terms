import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "commitment",   num: "01", title: "Commitment to Buyer Confidence" },
  { id: "onboarding",   num: "02", title: "Brand Onboarding Process" },
  { id: "verification", num: "03", title: "Background Verification" },
  { id: "monitoring",   num: "04", title: "Ongoing Monitoring" },
  { id: "protection",   num: "05", title: "Buyer Protection Philosophy" },
  { id: "transparency", num: "06", title: "Transparency & Accountability" },
  { id: "limitations",  num: "07", title: "Limitations of Responsibility" },
  { id: "assurance",    num: "08", title: "Final Assurance" },
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

function StageCards({ stages }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", margin: "16px 0",
    }}>
      {stages.map((s, i) => (
        <div key={i} style={{ background: "#0d0d0d", padding: "20px 18px" }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem",
            color: "rgba(239,68,68,0.18)", lineHeight: 1, marginBottom: 10,
          }}>{String(i + 1).padStart(2, "0")}</div>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ef4444", marginBottom: 6 }}>{s.label}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.65 }}>{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

function TrustBadges({ badges }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" }}>
      {badges.map((b, i) => (
        <div key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", padding: "6px 12px",
        }}>
          <span style={{ color: "#ef4444", fontSize: 10 }}>✓</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AuthenticationTrustPage() {
  const [activeSection, setActiveSection] = useState("commitment");
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
        .at-para { font-family: 'DM Sans', sans-serif; font-weight: 300; color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.75; margin-bottom: 12px; }
        .at-toc-btn { display:flex; align-items:baseline; gap:8px; width:100%; background:none; border:none; cursor:pointer; text-align:left; padding:5px 0; font-family:'Space Mono',monospace; font-size:10px; line-height:1.5; transition:color 0.2s; }
        .at-toc-btn:hover { color: rgba(255,255,255,0.75) !important; }
        .at-toc::-webkit-scrollbar { width: 4px; }
        .at-toc::-webkit-scrollbar-track { background: transparent; }
        .at-toc::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.3); border-radius: 2px; }
        .at-toc::-webkit-scrollbar-thumb:hover { background: rgba(239,68,68,0.5); }
        @media (max-width: 1024px) { .at-toc { display: none !important; } }
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
          backgroundImage: `url("https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=80&fit=crop&crop=center")`,
          backgroundSize: "cover", backgroundPosition: "center 35%", filter: "grayscale(30%)",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(10,10,10,0.5) 0%, rgba(10,10,10,0.80) 55%, rgba(10,10,10,0.98) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.48) 65%, transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 0% 110%, rgba(239,68,68,0.14) 0%, transparent 55%)" }} />

        <span style={{
          position: "absolute", right: "-0.02em", top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(3rem,10vw,9rem)",
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.06)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
        }}>VERIFIED</span>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 720 }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.32em", color: "#ef4444", textTransform: "uppercase", marginBottom: 14 }}
          >// 005 — Policy</motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
            style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.8rem,8vw,6.5rem)", lineHeight: 0.9, letterSpacing: "0.03em", marginBottom: 24, textShadow: "0 4px 48px rgba(0,0,0,0.7)" }}
          >
            Authentication<br /><span style={{ color: "#ef4444" }}>&amp; Trust Policy</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.45 }}
            style={{ display: "flex", gap: 24, flexWrap: "wrap", fontFamily: "'Space Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}
          >
            <span>Effective Date: [Insert Date]</span>
            <span>Version: 1.0</span>
            <span>Applies to: All Sellers</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════ BODY: JS-sticky TOC + content ══════════ */}
      <div ref={wrapRef} style={{ display: "flex", maxWidth: 1280, margin: "0 auto", alignItems: "flex-start" }}>

        {/* ── JS-sticky TOC sidebar ── */}
        <nav
          ref={tocRef}
          className="at-toc"
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
              className="at-toc-btn"
              style={{ color: activeSection === s.id ? "#ef4444" : "rgba(255,255,255,0.25)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 9, flexShrink: 0 }}>{s.num}</span>
              {s.title}
            </button>
          ))}
        </nav>

        {/* ── Main content ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "clamp(2rem,4vw,4rem) clamp(1.5rem,4vw,5rem)", fontFamily: "'DM Sans', sans-serif" }}>

          <SectionBlock id="commitment" num="01" title="Commitment to Buyer Confidence">
            <p className="at-para">
              We recognize that trust is a critical component of any online marketplace. As such, we have established a rigorous authentication and vetting process to ensure that all brands operating on our platform meet a defined standard of credibility, reliability, and operational legitimacy.
            </p>
            <TrustBadges badges={[
              "Identity Verified", "Product Authentic", "Portfolio Reviewed", "Background Checked", "Continuously Monitored",
            ]} />
          </SectionBlock>

          <SectionBlock id="onboarding" num="02" title="Brand Onboarding Process">
            <p className="at-para">
              Before any brand is permitted to list products on the platform, they must undergo a structured onboarding procedure. This process is designed to confirm that each Seller is a genuine producer or authorized distributor of the items they offer.
            </p>
            <StageCards stages={[
              { label: "// Identity",     desc: "Full identity verification of the brand owner or representative" },
              { label: "// Presence",     desc: "Review of online or physical business presence and activity" },
              { label: "// Authenticity", desc: "Assessment of product authenticity, originality, and legitimacy" },
              { label: "// Portfolio",    desc: "Evaluation of prior work, samples, or product portfolio submitted" },
            ]} />
          </SectionBlock>

          <SectionBlock id="verification" num="03" title="Background Verification">
            <p className="at-para">
              We conduct detailed background checks on all prospective Sellers. Only brands that successfully pass these checks are allowed to operate on the platform. These checks may involve:
            </p>
            <RuleList items={[
              "Cross-referencing social media presence and activity",
              "Reviewing customer feedback or prior transaction history",
              "Verifying consistency between advertised products and actual output",
              "Assessing overall brand legitimacy within its niche",
            ]} />
            <Callout label="Standard">
              Only brands that successfully pass all background checks are granted access to list products on the BLVCKMRKT marketplace.
            </Callout>
          </SectionBlock>

          <SectionBlock id="monitoring" num="04" title="Ongoing Monitoring">
            <p className="at-para">
              Authentication is not a one-time process. Sellers are continuously monitored to ensure ongoing compliance with platform standards.
            </p>
            <RuleList items={[
              "Review of customer feedback and complaints on an ongoing basis",
              "Monitoring of fulfillment behavior and delivery reliability",
              "Periodic reassessment of product quality and representation accuracy",
            ]} />
            <Callout label="Enforcement">
              Failure to maintain standards may result in suspension or permanent removal from the platform without prior notice.
            </Callout>
          </SectionBlock>

          <SectionBlock id="protection" num="05" title="Buyer Protection Philosophy">
            <p className="at-para">
              Our platform is structured to minimize risk and create a secure environment for Buyers. While we do not manufacture or directly sell products, we act as a gatekeeper — ensuring that only credible brands gain access to the marketplace.
            </p>
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", padding: "24px", margin: "16px 0" }}>
              <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#ef4444", marginBottom: 12 }}>// Our Promise</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.8, margin: 0, fontStyle: "italic" }}>
                "Every brand on BLVCKMRKT has passed a deliberate, structured vetting process. We do not allow unverified sellers — your trust is the foundation of this marketplace."
              </p>
            </div>
          </SectionBlock>

          <SectionBlock id="transparency" num="06" title="Transparency & Accountability">
            <p className="at-para">
              We encourage transparency between Buyers and Sellers and promote clear communication at all stages of the transaction. Sellers are expected to provide:
            </p>
            <RuleList items={[
              "Accurate product descriptions with honest representation",
              "Realistic production and delivery timelines",
              "Clear communication regarding any delays or issues",
              "Genuine and unaltered product images",
            ]} />
          </SectionBlock>

          <SectionBlock id="limitations" num="07" title="Limitations of Responsibility">
            <p className="at-para">
              While we take extensive measures to verify and monitor Sellers, Buyers acknowledge that purchases are made from independent brands. As such, certain aspects of the transaction — particularly fulfillment and product-specific issues — remain under the Seller's control.
            </p>
            <Callout label="Important">
              Our vetting process significantly reduces but cannot entirely eliminate risk. We recommend Buyers review Seller profiles, product descriptions, and reach out with any questions before purchasing.
            </Callout>
          </SectionBlock>

          <SectionBlock id="assurance" num="08" title="Final Assurance">
            <p className="at-para">
              Through strict vetting, continuous monitoring, and structured accountability systems, we aim to provide a marketplace where Buyers can shop with confidence, knowing that every brand has undergone a thorough and deliberate selection process.
            </p>
            <Callout label="Agreement">
              By using our platform, you confirm that you have read, understood, and agreed to all policies outlined above.
            </Callout>
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Questions about brand verification?</p>
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
            { to: "/return",        label: "Returns",      active: false },
            { to: "/authentication", label: "Trust & Auth", active: true  },
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