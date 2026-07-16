import {motion} from "framer-motion";
import {Link} from "react-router-dom";

const cards = [
  {
    id: 1,
    tag: "01 — DROPS",
    title: "EXCLUSIVE\nRELEASES",
    body: "Limited-edition pieces you won't find anywhere else. Every drop is verified, scarce, and gone fast.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M24 4L44 16V32L24 44L4 32V16L24 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M24 4V44M4 16L44 16M4 32L44 32" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
        <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.9"/>
      </svg>
    ),
    accent: "#ef4444",
    link: "/drops",
    cta: "SEE DROPS",
  },
  {
    id: 2,
    tag: "02 — BRANDS",
    title: "VERIFIED\nHEAT ONLY",
    body: "Every item listed passes through our brand verification. No fakes. No games. Just authentic streetwear.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M24 6L28.5 18H42L31.5 25.5L36 37.5L24 30L12 37.5L16.5 25.5L6 18H19.5L24 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M18 24L22 28L30 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    accent: "#ef4444",
    link: "/brands",
    cta: "MEET BRANDS",
  },
  {
    id: 3,
    tag: "03 — CULTURE",
    title: "WEAR THE\nSTREETS",
    body: "Streetwear isn't fashion — it's identity. Find pieces that speak before you do, from brands born in the culture.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M12 8H36L42 20H6L12 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 20V40H42V20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M20 28C20 25.8 21.8 24 24 24C26.2 24 28 25.8 28 28V40H20V28Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 8L6 20M34 8L42 20" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
      </svg>
    ),
    accent: "#ef4444",
    link: "/shop",
    cta: "SHOP NOW",
  },
];

export default function FeatureCards() {
  return (
    <section className="bg-black px-6 md:px-12 py-20">
      {/* Section header */}
      <div className="max-w-7xl mx-auto mb-12 flex items-end justify-between">
        <div>
          <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-2">
            ✦ Why BLVCKMRKT
          </span>
          <h2
            className="text-white font-black leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            BUILT FOR THE
            <br />
            <span className="text-red-500">CULTURE.</span>
          </h2>
        </div>
        <div className="hidden md:block w-[1px] h-16 bg-white/10" />
        <p className="hidden md:block text-white/40 text-xs tracking-widest uppercase max-w-[200px] text-right leading-relaxed">
          Everything you need. Nothing you don't.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{opacity: 0, y: 40}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: "-60px"}}
            transition={{duration: 0.6, delay: i * 0.12, ease: "easeOut"}}
            className="group relative bg-black overflow-hidden">

            {/* Hover fill layer */}
            <div className="absolute inset-0 bg-[#0d0d0d] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />

            {/* Red corner accent */}
            <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[32px] border-r-[32px] border-t-red-500 border-r-transparent group-hover:border-t-white transition-colors duration-500" />
            </div>

            {/* Card content */}
            <div className="relative z-10 p-8 md:p-10 flex flex-col h-full min-h-[380px]">
              {/* Top row: icon + tag */}
              <div className="flex items-start gap-5 mb-8">
                {/* Icon box */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 text-red-500 group-hover:text-white transition-colors duration-300">
                    {card.icon}
                  </div>
                  {/* icon glow */}
                  <div className="absolute inset-0 blur-xl bg-red-500/20 group-hover:bg-red-500/10 transition-all duration-500 scale-150" />
                </div>

                {/* Tag */}
                <div className="pt-1">
                  <span className="text-white/20 group-hover:text-white/40 text-[10px] font-bold tracking-[0.35em] uppercase transition-colors duration-300 block">
                    {card.tag}
                  </span>
                  <div className="mt-2 w-8 h-[1px] bg-red-500/50 group-hover:w-16 transition-all duration-500" />
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-white font-black leading-none mb-4 group-hover:text-white transition-colors duration-300"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(2rem, 3.5vw, 2.6rem)",
                  letterSpacing: "0.04em",
                  whiteSpace: "pre-line",
                }}>
                {card.title}
              </h3>

              {/* Body */}
              <p className="text-white/40 group-hover:text-white/60 text-[13px] leading-relaxed tracking-wide transition-colors duration-300 flex-1">
                {card.body}
              </p>

              {/* Bottom: CTA button */}
              <div className="mt-8">
                <Link
                  to={card.link}
                  className="group/btn relative inline-flex items-center gap-3 overflow-hidden border border-white/20 group-hover:border-red-500 px-6 py-3.5 transition-colors duration-500">
                  {/* Button fill */}
                  <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" />
                  <span className="relative text-[11px] font-bold tracking-[0.3em] uppercase text-white/60 group-hover/btn:text-white transition-colors duration-200">
                    {card.cta}
                  </span>
                  <span className="relative flex items-center">
                    <svg
                      className="w-3.5 h-3.5 text-white/30 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

            {/* Bottom border line that animates in */}
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-red-500 group-hover:w-full transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]" />
          </motion.div>
        ))}
      </div>

      {/* Bottom strip */}
      <div className="max-w-7xl mx-auto mt-px bg-white/5 px-10 py-4 flex items-center justify-between">
        <span className="text-white/20 text-[10px] tracking-[0.35em] uppercase font-bold">
          BLVCKMRKT © 2025
        </span>
        <div className="flex items-center gap-6">
          {["Authentic", "Verified", "Exclusive"].map((word) => (
            <span key={word} className="text-white/20 text-[10px] tracking-[0.25em] uppercase">
              ✦ {word}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}