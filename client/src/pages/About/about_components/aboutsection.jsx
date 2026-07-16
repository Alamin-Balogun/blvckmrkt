import {motion} from "framer-motion";
import {Link} from "react-router-dom";
import {useAboutContent} from "./aboutcontentcontext";

const HIGHLIGHT_ICONS = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>,
];

export default function AboutSection() {
  // ── Intro ─────────────────────────────────────────────────────────────────
  const introLine1 = useAboutContent("intro_heading", "WE'RE THE MARKETPLACE");
  const introLine2 = useAboutContent("intro_heading_red", "BUILT FOR THE STREETS.");
  const introBody1 = useAboutContent(
    "intro_body1",
    "BLVCKMRKT was built for one reason — to give streetwear culture a home. A place where buyers can find authentic pieces, sellers can reach real audiences, and brands can connect directly with the community that fuels them.",
  );
  const introBody2 = useAboutContent(
    "intro_body2",
    "No middlemen, no fakes, no noise. Just verified heat, trusted sellers, and a community that actually lives the culture.",
  );
  const introCta = useAboutContent("intro_cta_text", "Shop Now");
  const introLink = useAboutContent("intro_cta_link", "/shop");

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    {
      value: useAboutContent("stat1_value", "12K+"),
      label: useAboutContent("stat1_label", "Verified Buyers"),
    },
    {
      value: useAboutContent("stat2_value", "3.4K+"),
      label: useAboutContent("stat2_label", "Active Sellers"),
    },
    {
      value: useAboutContent("stat3_value", "98%"),
      label: useAboutContent("stat3_label", "Authentic Products"),
    },
    {
      value: useAboutContent("stat4_value", "50+"),
      label: useAboutContent("stat4_label", "Top Brands"),
    },
  ];

  // ── Highlight cards ───────────────────────────────────────────────────────
  const highlights = [
    {
      icon: HIGHLIGHT_ICONS[0],
      title: useAboutContent("hl1_title", "100% Verified Products"),
      desc: useAboutContent(
        "hl1_desc",
        "Every listing passes authentication before going live. No fakes, no grey market. Just genuine heat.",
      ),
    },
    {
      icon: HIGHLIGHT_ICONS[1],
      title: useAboutContent("hl2_title", "Community of Sellers"),
      desc: useAboutContent(
        "hl2_desc",
        "From solo resellers to established brands — our verified seller network is built on trust and transparency.",
      ),
    },
    {
      icon: HIGHLIGHT_ICONS[2],
      title: useAboutContent("hl3_title", "Exclusive Drop Access"),
      desc: useAboutContent(
        "hl3_desc",
        "Be first in line. Subscribers get early access to limited releases before they hit the open market.",
      ),
    },
  ];

  // ── Mission ───────────────────────────────────────────────────────────────
  const missionLine1 = useAboutContent("mission_heading_line1", "MAKING AUTHENTIC");
  const missionLine2 = useAboutContent("mission_heading_line2", "STREETWEAR ACCESSIBLE");
  const missionLine3 = useAboutContent("mission_heading_line3", "TO EVERYONE.");
  const missionBody1 = useAboutContent(
    "mission_body1",
    "The resale market is broken. Fakes flood every platform, prices are inflated, and real buyers get burned. BLVCKMRKT exists to fix that — by creating a space where authenticity is the only standard.",
  );
  const missionBody2 = useAboutContent(
    "mission_body2",
    "Whether you're a brand wanting to reach your audience directly, a seller turning passion into income, or a buyer hunting for that piece you can't find anywhere else — BLVCKMRKT is built for you.",
  );

  const missionStats = [
    {
      v: useAboutContent("mission_stat1_value", "2023"),
      l: useAboutContent("mission_stat1_label", "Founded"),
    },
    {
      v: useAboutContent("mission_stat2_value", "3 Continents"),
      l: useAboutContent("mission_stat2_label", "Reach"),
    },
    {
      v: useAboutContent("mission_stat3_value", "Zero Fakes"),
      l: useAboutContent("mission_stat3_label", "Policy"),
    },
  ];

  // Mission line 2 — last word goes red (e.g. "STREETWEAR ACCESSIBLE" → "ACCESSIBLE" is red)
  const line2Words = missionLine2.split(" ");
  const line2Red = line2Words.pop();
  const line2Main = line2Words.join(" ");

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* ── Row 1: Intro ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{opacity: 0, x: -30}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true, margin: "-60px"}}
            transition={{duration: 0.6, ease: "easeOut"}}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase">
                About Us
              </span>
            </div>
            <h2
              className="text-white font-black leading-none mb-5"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.6rem, 5vw, 4.2rem)",
                letterSpacing: "0.04em",
              }}>
              {introLine1}
              <br />
              <span className="text-red-500">{introLine2}</span>
            </h2>
            <p className="text-white/45 text-[13px] leading-relaxed tracking-wide mb-6 max-w-lg">
              {introBody1}
            </p>
            <p className="text-white/35 text-[13px] leading-relaxed tracking-wide mb-8 max-w-lg">
              {introBody2}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-white/10 mb-8">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex flex-col items-center justify-center py-5 px-3 text-center ${i < stats.length - 1 ? "border-r border-white/10" : ""}`}>
                  <span
                    className="text-red-500 font-black leading-none mb-1"
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.8rem",
                      letterSpacing: "0.04em",
                    }}>
                    {s.value}
                  </span>
                  <span className="text-white/35 text-[9px] font-bold tracking-[0.18em] uppercase leading-tight">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link
                to={introLink}
                className="group relative overflow-hidden bg-white text-black text-[11px] font-black tracking-[0.25em] uppercase px-7 py-3.5 flex items-center gap-2 hover:text-white transition-colors duration-200">
                <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative">{introCta}</span>
                <svg
                  className="relative w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                to="/contact"
                className="text-white/40 hover:text-white text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 flex items-center gap-2">
                Contact Us
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </motion.div>

          {/* Right stacked images */}
          <motion.div
            initial={{opacity: 0, x: 30}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true, margin: "-60px"}}
            transition={{duration: 0.6, ease: "easeOut", delay: 0.1}}
            className="relative h-[420px] hidden lg:block">
            <div className="absolute top-0 right-0 w-[65%] h-[58%] rounded-2xl overflow-hidden border border-white/10">
              <img
                src="https://i.pinimg.com/736x/1d/88/30/1d883085ed089592bc96490b42c7089a.jpg"
                alt=""
                className="w-full h-full object-cover"
                style={{filter: "grayscale(20%)"}}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="absolute bottom-0 left-0 w-[70%] h-[62%] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
              <img
                src="https://i.pinimg.com/736x/df/d7/3b/dfd73bdbb7b580a74ffd0807c1d2212e.jpg"
                alt=""
                className="w-full h-full object-cover"
                style={{filter: "grayscale(10%)"}}
              />
              <div className="absolute inset-0 bg-black/15" />
            </div>
            <div className="absolute bottom-[28%] right-[2%] bg-black border border-white/15 px-5 py-4 shadow-2xl z-10 min-w-[140px]">
              <p
                className="text-red-500 font-black leading-none"
                style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem"}}>
                5★
              </p>
              <p className="text-white/50 text-[10px] tracking-[0.15em] uppercase mt-1">
                Avg. Seller Rating
              </p>
            </div>
            <div className="absolute top-[10%] left-[2%] bg-red-500 px-3 py-2 shadow-xl z-10 flex items-center gap-2">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-white text-[9px] font-black tracking-[0.25em] uppercase">
                Verified Platform
              </span>
            </div>
            <div
              className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(239,68,68,0.8) 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            />
          </motion.div>
        </div>

        {/* ── Row 2: 3 Highlight cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8 mb-24">
          {highlights.map((h, i) => (
            <motion.div
              key={h.title}
              initial={{opacity: 0, y: 24}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: "-40px"}}
              transition={{duration: 0.5, delay: i * 0.1}}
              className="group bg-black hover:bg-[#0d0d0d] transition-colors duration-300 p-8 flex gap-5">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                {h.icon}
              </div>
              <div>
                <h4
                  className="text-white font-black mb-2 group-hover:text-red-500 transition-colors duration-300"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.1rem",
                    letterSpacing: "0.06em",
                  }}>
                  {h.title}
                </h4>
                <p className="text-white/40 text-[12px] leading-relaxed tracking-wide">{h.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Row 3: Mission ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{opacity: 0, x: -30}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true, margin: "-60px"}}
            transition={{duration: 0.6}}
            className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden aspect-[3/4]">
              <img
                src="https://i.pinimg.com/736x/32/de/2f/32de2f8db7c7dd8d70fa1033d604f61f.jpg"
                alt=""
                className="w-full h-full object-cover"
                style={{filter: "grayscale(15%)"}}
              />
            </div>
            <div className="rounded-2xl overflow-hidden aspect-[3/4] mt-10">
              <img
                src="https://i.pinimg.com/736x/3d/d5/37/3dd537343a803f41a40c47d022956042.jpg"
                alt=""
                className="w-full h-full object-cover"
                style={{filter: "grayscale(15%)"}}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{opacity: 0, x: 30}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true, margin: "-60px"}}
            transition={{duration: 0.6, delay: 0.1}}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase">
                Our Mission
              </span>
            </div>
            <h2
              className="text-white font-black leading-none mb-5"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                letterSpacing: "0.04em",
              }}>
              {missionLine1}
              <br />
              {line2Main} <span className="text-red-500">{line2Red}</span>
              <br />
              {missionLine3}
            </h2>
            <p className="text-white/45 text-[13px] leading-relaxed tracking-wide mb-5">
              {missionBody1}
            </p>
            <p className="text-white/35 text-[13px] leading-relaxed tracking-wide mb-8">
              {missionBody2}
            </p>

            <div className="flex items-center gap-8">
              {missionStats.map((s) => (
                <div key={s.l}>
                  <p
                    className="text-white font-black leading-none"
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.4rem",
                      letterSpacing: "0.04em",
                    }}>
                    {s.v}
                  </p>
                  <p className="text-white/30 text-[9px] font-bold tracking-[0.2em] uppercase mt-0.5">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
