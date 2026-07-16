import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SECTIONS = [
  { id: "intro",         num: "01", title: "Introduction" },
  { id: "collect",       num: "02", title: "Information We Collect" },
  { id: "use",           num: "03", title: "How We Use It" },
  { id: "share",         num: "04", title: "How We Share It" },
  { id: "visibility",    num: "05", title: "Content & Visibility" },
  { id: "retention",     num: "06", title: "Data Retention" },
  { id: "security",      num: "07", title: "Data Security" },
  { id: "rights",        num: "08", title: "Your Rights" },
  { id: "cookies",       num: "09", title: "Cookies & Tracking" },
  { id: "thirdparty",    num: "10", title: "Third-Party Links" },
  { id: "children",      num: "11", title: "Children's Privacy" },
  { id: "international", num: "12", title: "International Users" },
  { id: "changes",       num: "13", title: "Changes to This Policy" },
  { id: "contact",       num: "14", title: "Contact" },
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

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("intro");
  const tocRef  = useRef(null);
  const wrapRef = useRef(null);

  // ── JS-based sticky: works regardless of any parent overflow settings ──
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
    handler(); // set active on mount
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        .priv-para { font-family: 'DM Sans', sans-serif; font-weight: 300; color: rgba(255,255,255,0.55); font-size: 13.5px; line-height: 1.75; margin-bottom: 12px; }
        .toc-btn-p { display:flex; align-items:baseline; gap:8px; width:100%; background:none; border:none; cursor:pointer; text-align:left; padding:5px 0; font-family:'Space Mono',monospace; font-size:10px; line-height:1.5; transition:color 0.2s; }
        .toc-btn-p:hover { color: rgba(255,255,255,0.75) !important; }
        @media (max-width: 1024px) { .priv-toc { display: none !important; } }
        @media (max-width: 640px)  { .priv-datagrid, .priv-rightsgrid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ══════════ HERO — data privacy / digital / lock theme image ══════════ */}
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
        {/* BG image — digital security / privacy / data lock */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1600&q=80&fit=crop&crop=edges")`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          filter: "grayscale(25%)",
        }} />

        {/* Layered dark overlays */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(160deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.80) 55%, rgba(10,10,10,0.98) 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.4) 65%, transparent 100%)",
        }} />
        {/* Red ambient glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 0% 110%, rgba(239,68,68,0.13) 0%, transparent 55%)",
        }} />

        {/* Ghost watermark */}
        <span style={{
          position: "absolute", right: "-0.02em", top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(4rem,13vw,11rem)",
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.06)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
        }}>PRIVACY</span>

        {/* Hero text */}
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
          >// 002 — Legal</motion.p>

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
            Privacy<br />
            <span style={{ color: "#ef4444" }}>Policy</span>
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
            <span>Contact: blvckmrkt.market@gmail.com</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ══════════ BODY: JS-sticky TOC + content ══════════ */}
      <div ref={wrapRef} style={{ display: "flex", maxWidth: 1280, margin: "0 auto", alignItems: "flex-start" }}>

        {/* ── JS-sticky TOC sidebar ── */}
        <nav
          ref={tocRef}
          className="priv-toc"
          style={{
            width: 240,
            flexShrink: 0,
            alignSelf: "flex-start",
            maxHeight: "calc(100vh - 88px)",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            borderRight: "1px solid rgba(255,255,255,0.07)",
            padding: "32px 20px",
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
              className="toc-btn-p"
              style={{ color: activeSection === s.id ? "#ef4444" : "rgba(255,255,255,0.25)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 9, flexShrink: 0 }}>{s.num}</span>
              {s.title}
            </button>
          ))}
        </nav>

        {/* ── Main content ── */}
        <main style={{
          flex: 1, minWidth: 0,
          padding: "clamp(2rem,4vw,4rem) clamp(1.5rem,4vw,5rem)",
          fontFamily: "'DM Sans', sans-serif",
        }}>

          <SectionBlock id="intro" num="01" title="Introduction">
            <p className="priv-para">Blvckmrkt respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website and services.</p>
            <Callout label="Agreement">By using Blvckmrkt, you agree to the practices described in this Policy.</Callout>
          </SectionBlock>

          <SectionBlock id="collect" num="02" title="Information We Collect">
            <p className="priv-para">We collect the following types of information:</p>
            <div
              className="priv-datagrid"
              style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.07)", margin:"16px 0" }}
            >
              {[
                { label: "// Personal Info", items: ["Name, username, or brand name", "Email address", "Profile details", "Content you upload (images, descriptions, posts)"] },
                { label: "// Brand Info",    items: ["Product details and images", "Business-related information you choose to provide"] },
              ].map((col, i) => (
                <div key={i} style={{ background:"#0d0d0d", padding:"16px 18px" }}>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:"0.22em", textTransform:"uppercase", color:"#ef4444", marginBottom:10, paddingBottom:10, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>{col.label}</p>
                  <ul style={{ listStyle:"none", padding:0, margin:0 }}>
                    {col.items.map((item, j) => (
                      <li key={j} style={{ display:"flex", gap:8, fontSize:12, color:"rgba(255,255,255,0.5)", padding:"4px 0" }}>
                        <span style={{ color:"#ef4444", flexShrink:0 }}>·</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionBlock>

          <SectionBlock id="use" num="03" title="How We Use Your Information">
            <p className="priv-para">We use your information to:</p>
            <RuleList items={["Operate and improve the Platform","Create and manage your account","Display your content to other users","Communicate with you (updates, support, notices)","Monitor and enforce our Terms","Detect fraud, abuse, or security issues"]} />
          </SectionBlock>

          <SectionBlock id="share" num="04" title="How We Share Information">
            <Callout label="Our Commitment">We do not sell your personal data.</Callout>
            <p className="priv-para" style={{ marginTop:12 }}>We may share your information:</p>
            <RuleList items={["With other users (e.g., your profile, uploaded content)","With service providers who help operate the Platform","If required by law or legal process","To protect our rights, users, or the public"]} />
          </SectionBlock>

          <SectionBlock id="visibility" num="05" title="User Content & Visibility">
            <p className="priv-para">Any content you upload — such as brand images and posts — may be publicly visible on the Platform. You are responsible for what you choose to share.</p>
          </SectionBlock>

          <SectionBlock id="retention" num="06" title="Data Retention">
            <p className="priv-para">We retain your information:</p>
            <RuleList items={["For as long as your account is active","As necessary to comply with legal obligations","To resolve disputes and enforce our agreements"]} />
            <p className="priv-para" style={{ marginTop:12 }}>We may delete or anonymize data when it is no longer needed.</p>
          </SectionBlock>

          <SectionBlock id="security" num="07" title="Data Security">
            <p className="priv-para">We take reasonable measures to protect your information from:</p>
            <RuleList items={["Unauthorized access","Loss or misuse","Alteration or disclosure"]} />
            <Callout label="Disclaimer">No system is completely secure. Use the Platform at your own risk.</Callout>
          </SectionBlock>

          <SectionBlock id="rights" num="08" title="Your Rights">
            <p className="priv-para">Depending on applicable laws, you may have the right to:</p>
            <div
              className="priv-rightsgrid"
              style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.07)", margin:"16px 0" }}
            >
              {[
                { num:"[01]", text:"Access your personal data" },
                { num:"[02]", text:"Request correction of inaccurate data" },
                { num:"[03]", text:"Request deletion of your data" },
                { num:"[04]", text:"Object to certain uses of your data" },
              ].map((r, i) => (
                <div key={i} style={{ background:"#0d0d0d", padding:"14px 16px", display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:"rgba(255,255,255,0.5)" }}>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#ef4444", flexShrink:0, marginTop:2 }}>{r.num}</span>
                  {r.text}
                </div>
              ))}
            </div>
            <ContactBlock label="To exercise these rights, contact us at:" email="blvckmrkt.market@gmail.com" />
          </SectionBlock>

          <SectionBlock id="cookies" num="09" title="Cookies & Tracking">
            <p className="priv-para">We may use cookies and similar technologies to:</p>
            <RuleList items={["Improve user experience","Analyze usage and performance","Remember preferences"]} />
            <p className="priv-para" style={{ marginTop:12 }}>You can control cookies through your browser settings.</p>
          </SectionBlock>

          <SectionBlock id="thirdparty" num="10" title="Third-Party Links">
            <p className="priv-para">Blvckmrkt may contain links to third-party websites. We are not responsible for their privacy practices. Use them at your own discretion.</p>
          </SectionBlock>

          <SectionBlock id="children" num="11" title="Children's Privacy">
            <p className="priv-para">Blvckmrkt is not intended for children under 13. We do not knowingly collect personal data from children under this age. If we become aware of such data, we will delete it promptly.</p>
          </SectionBlock>

          <SectionBlock id="international" num="12" title="International Users">
            <p className="priv-para">By using the Platform, you consent to your data being processed in accordance with this Policy, regardless of your location.</p>
          </SectionBlock>

          <SectionBlock id="changes" num="13" title="Changes to This Policy">
            <p className="priv-para">We may update this Privacy Policy at any time. Continued use of the Platform after changes means you accept the updated Policy.</p>
          </SectionBlock>

          <SectionBlock id="contact" num="14" title="Contact">
            <p className="priv-para">If you have questions or concerns about this Privacy Policy, reach out to us directly. We aim to respond within 72 hours.</p>
            <ContactBlock label="Privacy enquiries" email="blvckmrkt.market@gmail.com" />
            <Callout label="Acknowledgement">By using Blvckmrkt, you acknowledge that you have read and understood this Privacy Policy.</Callout>
          </SectionBlock>

        </main>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", padding:"24px clamp(1.5rem,5vw,4rem)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:"0.1em" }}>© BLVCKMRKT — All rights reserved</span>
        <div style={{ display:"flex", gap:24 }}>
          {[{ to:"/terms", label:"Terms of Use", active:false }, { to:"/privacy", label:"Privacy Policy", active:true }, { to:"/", label:"Home", active:false }].map(({ to, label, active }) => (
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