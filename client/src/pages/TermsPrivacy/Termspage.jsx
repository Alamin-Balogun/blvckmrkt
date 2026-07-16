import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "intro",          num: "01", title: "Introduction" },
  { id: "platform",       num: "02", title: "Description of the Platform" },
  { id: "eligibility",    num: "03", title: "Eligibility" },
  { id: "accounts",       num: "04", title: "User Accounts" },
  { id: "guidelines",     num: "05", title: "Community Guidelines" },
  { id: "content",        num: "06", title: "Content Ownership & License" },
  { id: "ip",             num: "07", title: "Intellectual Property" },
  { id: "brands",         num: "08", title: "Brand Responsibilities" },
  { id: "liability",      num: "09", title: "No Marketplace Liability" },
  { id: "endorsement",    num: "10", title: "Disclaimer of Endorsement" },
  { id: "moderation",     num: "11", title: "Moderation & Enforcement" },
  { id: "privacy",        num: "12", title: "Privacy" },
  { id: "availability",   num: "13", title: "Service Availability" },
  { id: "limitation",     num: "14", title: "Limitation of Liability" },
  { id: "indemnification",num: "15", title: "Indemnification" },
  { id: "termination",    num: "16", title: "Termination" },
  { id: "disputes",       num: "17", title: "Dispute Resolution" },
  { id: "changes",        num: "18", title: "Changes to These Terms" },
  { id: "law",            num: "19", title: "Governing Law" },
  { id: "contact",        num: "20", title: "Contact" },
];

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

function TwoCol({ allowed, prohibited }) {
  return (
    <div className="terms-twocol" style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", margin: "16px 0",
    }}>
      {[
        { label: "// You May",      color: "#22c55e", icon: "✓", items: allowed },
        { label: "// You Must Not", color: "#ef4444", icon: "✕", items: prohibited },
      ].map((col, i) => (
        <div key={i} style={{ background: "#0d0d0d", padding: "16px 18px" }}>
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.22em",
            textTransform: "uppercase", color: col.color, marginBottom: 10, paddingBottom: 10,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>{col.label}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {col.items.map((item, j) => (
              <li key={j} style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.5)", padding: "4px 0" }}>
                <span style={{ color: col.color, flexShrink: 0 }}>{col.icon}</span>{item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ContactBlock({ label, email }) {
  return (
    <div style={{
      background: "#111", border: "1px solid rgba(255,255,255,0.08)",
      padding: "20px 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 16,
    }}>
      <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{label}</p>
      <a
        href={`mailto:${email}`}
        style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#ef4444",
          textDecoration: "none", border: "1px solid rgba(239,68,68,0.4)",
          padding: "8px 16px", letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#ef4444"; }}
      >{email}</a>
    </div>
  );
}

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("intro");
  const tocRef  = useRef(null);
  const wrapRef = useRef(null);

  // ── JS-based sticky: works regardless of any parent overflow settings ──
  useEffect(() => {
    const GAP = 32; // distance from top of viewport when stuck
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
    handler(); // Initial call
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100; // Offset for fixed header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        .legal-para { font-family: 'DM Sans', sans-serif; font-weight: 300; color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.75; margin-bottom: 12px; }
        .toc-btn { display:flex; align-items:baseline; gap:8px; width:100%; background:none; border:none; cursor:pointer; text-align:left; padding:5px 0; font-family:'Space Mono',monospace; font-size:10px; line-height:1.5; transition:color 0.2s; }
        .toc-btn:hover { color: rgba(255,255,255,0.75) !important; }
        
        /* Hide scrollbar for TOC */
        .terms-toc::-webkit-scrollbar { width: 4px; }
        .terms-toc::-webkit-scrollbar-track { background: transparent; }
        .terms-toc::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.3); border-radius: 2px; }
        .terms-toc::-webkit-scrollbar-thumb:hover { background: rgba(239,68,68,0.5); }
        
        @media (max-width: 1024px) { 
          .terms-toc { display: none !important; }
          .terms-content-wrapper { padding-left: 0 !important; }
        }
        @media (max-width: 640px)  { .terms-twocol { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ══════════ HERO ══════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        style={{
          position: "relative",
          minHeight: 440,
          display: "flex",
          alignItems: "flex-end",
          padding: "clamp(3rem,8vw,5rem) clamp(1.5rem,5vw,4rem) clamp(2.5rem,4vw,4rem)",
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=80&fit=crop&crop=edges")`,
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
          filter: "grayscale(30%)",
        }} />

        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(160deg, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.82) 60%, rgba(10,10,10,0.98) 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.4) 65%, transparent 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 0% 110%, rgba(239,68,68,0.14) 0%, transparent 55%)",
        }} />

        <span style={{
          position: "absolute", right: "-0.02em", top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(5rem,16vw,14rem)",
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.06)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
        }}>TERMS</span>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 720 }}>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              letterSpacing: "0.32em", color: "#ef4444",
              textTransform: "uppercase", marginBottom: 14,
            }}
          >// 001 — Legal</motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(3rem,9vw,7rem)",
              lineHeight: 0.9, letterSpacing: "0.03em",
              marginBottom: 24,
              textShadow: "0 4px 48px rgba(0,0,0,0.7)",
            }}
          >
            Terms of Use<br />
            <span style={{ color: "#ef4444" }}>&amp; Community Guidelines</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            style={{
              display: "flex", gap: 24, flexWrap: "wrap",
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em",
            }}
          >
            <span>Effective Date: [Insert Date]</span>
            <span>Version: 1.0</span>
            <span>Jurisdiction: Federal Republic of Nigeria</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════ CONTENT WRAPPER ══════════ */}
      <div ref={wrapRef} style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "flex-start" }}>

          {/* ── JS-sticky TOC sidebar ── */}
            <nav
              ref={tocRef}
              className="terms-toc"
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
                  className="toc-btn"
                  style={{ color: activeSection === s.id ? "#ef4444" : "rgba(255,255,255,0.25)" }}
                >
                  <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 9, flexShrink: 0 }}>{s.num}</span>
                  {s.title}
                </button>
              ))}
            </nav>

          {/* ── Main content ── */}
          <main className="terms-content-wrapper" style={{
            flex: 1, minWidth: 0,
            padding: "clamp(2rem,4vw,4rem) clamp(1.5rem,4vw,5rem)",
            fontFamily: "'DM Sans', sans-serif",
          }}>

            <SectionBlock id="intro" num="01" title="Introduction">
              <p className="legal-para">Welcome to Blvckmrkt. These Terms of Use and Community Guidelines govern your access to and use of our website and services.</p>
              <Callout label="Important">By accessing or using Blvckmrkt, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.</Callout>
            </SectionBlock>

            <SectionBlock id="platform" num="02" title="Description of the Platform">
              <p className="legal-para">Blvckmrkt is a digital platform that allows users and brands to:</p>
              <RuleList items={["Showcase fashion and lifestyle products","Discover and interact with emerging brands","Upload and display fashion content"]} />
              <Callout label="Clarification">Blvckmrkt is not a seller — we serve as a marketplace to facilitate discovery and purchase within a buyer-to-brand relationship. We do not directly sell products. We reserve the right to modify, suspend, or discontinue any part of the Platform at any time.</Callout>
            </SectionBlock>

            <SectionBlock id="eligibility" num="03" title="Eligibility">
              <p className="legal-para">By using the Platform, you confirm that:</p>
              <RuleList items={["You are at least 13 years old","You have the legal capacity to enter into this agreement","All information you provide is accurate and up to date"]} />
            </SectionBlock>

            <SectionBlock id="accounts" num="04" title="User Accounts">
              <p className="legal-para">To access certain features, you will be required to create an account. You agree to:</p>
              <RuleList items={["Provide accurate and complete information","Maintain the confidentiality of your login credentials","Be responsible for all activities under your account"]} />
              <p className="legal-para" style={{ marginTop: 12 }}>We reserve the right to suspend or terminate accounts at our discretion.</p>
            </SectionBlock>

            <SectionBlock id="guidelines" num="05" title="Community Guidelines (Acceptable Use)">
              <p className="legal-para">Blvckmrkt promotes creativity, authenticity, and respectful interaction.</p>
              <TwoCol
                allowed={["Share original and lawful content","Promote your brand or products honestly","Engage respectfully with other users"]}
                prohibited={["Post hate speech, harassment, or abusive content","Upload stolen, plagiarized, or unauthorized material","Impersonate any person or brand","Engage in scams, fraud, or misleading promotions","Spam or disrupt the platform","Attempt to hack, exploit, or interfere with the Platform"]}
              />
              <p className="legal-para">We reserve the right to remove content and take action against violations.</p>
            </SectionBlock>

            <SectionBlock id="content" num="06" title="Content Ownership & License">
              <p className="legal-para">You retain ownership of the content you upload. By posting content, you grant Blvckmrkt a non-exclusive, worldwide, royalty-free license to:</p>
              <RuleList items={["Use, display, reproduce, and distribute your content","Promote the Platform using your content"]} />
              <p className="legal-para" style={{ marginTop: 12 }}>We may remove content that violates these Terms or is deemed inappropriate.</p>
            </SectionBlock>

            <SectionBlock id="ip" num="07" title="Intellectual Property & Takedown Policy">
              <p className="legal-para">Blvckmrkt respects intellectual property rights. If you believe your copyright, trademark, or other rights have been violated, contact us and include:</p>
              <RuleList items={["Proof of ownership","Description of the alleged infringement","Link or location of the content"]} />
              <p className="legal-para" style={{ marginTop: 12 }}>We reserve the right to remove disputed content and take appropriate action.</p>
              <ContactBlock label="Submit IP takedown requests to:" email="blvckmrkt.market@gmail.com" />
            </SectionBlock>

            <SectionBlock id="brands" num="08" title="Brand Responsibilities">
              <p className="legal-para">If you are a brand using Blvckmrkt:</p>
              <RuleList items={["You are responsible for the accuracy of your listings","You must own or have rights to all uploaded content","You must not mislead users about products, pricing, or availability"]} />
              <p className="legal-para" style={{ marginTop: 12 }}>We reserve the right to remove brands that violate these Terms.</p>
            </SectionBlock>

            <SectionBlock id="liability" num="09" title="No Marketplace Liability">
              <p className="legal-para">Blvckmrkt is not a party to any transaction between users and brands. We do not:</p>
              <RuleList items={["Guarantee product quality, safety, or legality","Verify all brand claims"]} />
              <Callout label="Note">Any transaction or interaction is strictly between the user and the brand. You assume full responsibility for such dealings.</Callout>
            </SectionBlock>

            <SectionBlock id="endorsement" num="10" title="Disclaimer of Endorsement">
              <p className="legal-para">The presence of any brand, product, or content on Blvckmrkt does not constitute endorsement, recommendation, or verification by us.</p>
            </SectionBlock>

            <SectionBlock id="moderation" num="11" title="Moderation & Enforcement">
              <p className="legal-para">We reserve the right to:</p>
              <RuleList items={["Monitor content and activity","Remove content without prior notice","Suspend or terminate accounts"]} />
              <p className="legal-para" style={{ marginTop: 12 }}>All enforcement decisions are made at our sole discretion.</p>
            </SectionBlock>

            <SectionBlock id="privacy" num="12" title="Privacy">
              <p className="legal-para">Your use of the Platform is also governed by our Privacy Policy, which explains how we collect, use, and protect your data.</p>
              <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.08)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginTop:16, flexWrap:"wrap" }}>
                <p style={{ margin:0, fontSize:13, color:"rgba(255,255,255,0.45)" }}>Read the full Privacy Policy</p>
                <Link to="/privacy" style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"#ef4444", textDecoration:"none", border:"1px solid rgba(239,68,68,0.4)", padding:"8px 16px", letterSpacing:"0.08em" }}>View Privacy Policy →</Link>
              </div>
            </SectionBlock>

            <SectionBlock id="availability" num="13" title="Service Availability">
              <p className="legal-para">Blvckmrkt is provided on an "as is" and "as available" basis. We do not guarantee:</p>
              <RuleList items={["Uninterrupted or error-free operation","That the Platform will always be secure or available"]} />
            </SectionBlock>

            <SectionBlock id="limitation" num="14" title="Limitation of Liability">
              <p className="legal-para">To the fullest extent permitted by law, Blvckmrkt shall not be liable for:</p>
              <RuleList items={["User-generated content","Losses resulting from interactions between users and brands","Any indirect, incidental, or consequential damages"]} />
              <Callout label="Disclaimer">Use of the Platform is at your own risk.</Callout>
            </SectionBlock>

            <SectionBlock id="indemnification" num="15" title="Indemnification">
              <p className="legal-para">You agree to indemnify and hold harmless Blvckmrkt, its owners, and affiliates from any claims, damages, liabilities, and legal costs arising from:</p>
              <RuleList items={["Your use of the Platform","Your violation of these Terms","Your infringement of any third-party rights"]} />
            </SectionBlock>

            <SectionBlock id="termination" num="16" title="Termination">
              <p className="legal-para">We may suspend or terminate your access at any time, without notice, if you violate these Terms. You may stop using the Platform at any time.</p>
            </SectionBlock>

            <SectionBlock id="disputes" num="17" title="Dispute Resolution">
              <p className="legal-para">Before initiating any legal action, you agree to first contact us to attempt to resolve the dispute informally.</p>
            </SectionBlock>

            <SectionBlock id="changes" num="18" title="Changes to These Terms">
              <p className="legal-para">We reserve the right to update these Terms at any time. Continued use of the Platform after changes means you accept the updated Terms.</p>
            </SectionBlock>

            <SectionBlock id="law" num="19" title="Governing Law">
              <p className="legal-para">These Terms shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria.</p>
            </SectionBlock>

            <SectionBlock id="contact" num="20" title="Contact">
              <p className="legal-para">For questions, complaints, or reports, reach out to us directly. We aim to respond within 72 hours.</p>
              <ContactBlock label="General inquiries & legal matters" email="blvckmrkt.market@gmail.com" />
              <Callout label="Agreement">By using BLVCKMRKT, you acknowledge that you have read, understood, and agreed to these Terms.</Callout>
            </SectionBlock>

          </main>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", padding:"24px clamp(1.5rem,5vw,4rem)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>© BLVCKMRKT — All rights reserved</span>
        <div style={{ display:"flex", gap:24 }}>
          {[{ to:"/terms", label:"Terms of Use", active:true }, { to:"/privacy", label:"Privacy Policy", active:false }, { to:"/", label:"Home", active:false }].map(({ to, label, active }) => (
            <Link key={to} to={to} style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color: active ? "#ef4444" : "rgba(255,255,255,0.25)", textDecoration:"none", letterSpacing:"0.1em", textTransform:"uppercase", transition:"color 0.2s" }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.color="#ef4444"; }}
              onMouseLeave={e => { if(!active) e.currentTarget.style.color="rgba(255,255,255,0.25)"; }}
            >{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}