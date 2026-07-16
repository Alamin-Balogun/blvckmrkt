import {motion} from "framer-motion";
import {useHomeContent} from "./homecontentcontext";

const ICONS = [
  // Shield with check
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path
      d="M20 4L36 12V20C36 28.8 29 36.8 20 39C11 36.8 4 28.8 4 20V12L20 4Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M13 20L18 25L28 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
  // Cart
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path d="M8 8H26L32 20H8V8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8 20V32H32V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="14" cy="36" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="26" cy="36" r="2.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>,
  // Clock
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M20 12V20L25 25"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 20H5M35 20H32M20 8V5M20 35V32"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>,
];

export default function PerksStrip() {
  const p1title = useHomeContent("perk1_title", "100% Authentic");
  const p1sub = useHomeContent("perk1_sub", "Every item verified before it hits the market.");
  const p2title = useHomeContent("perk2_title", "Free Shipping");
  const p2sub = useHomeContent("perk2_sub", "On all orders over ₦50,000. No code needed.");
  const p3title = useHomeContent("perk3_title", "Limited Drops");
  const p3sub = useHomeContent("perk3_sub", "Scarce by design. Exclusive by nature.");

  const perks = [
    {id: 1, icon: ICONS[0], title: p1title, sub: p1sub},
    {id: 2, icon: ICONS[1], title: p2title, sub: p2sub},
    {id: 3, icon: ICONS[2], title: p3title, sub: p3sub},
  ];

  return (
    <section className="bg-[#0a0a0a] border-y border-white/8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {perks.map((perk, i) => (
            <motion.div
              key={perk.id}
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: "-40px"}}
              transition={{duration: 0.5, delay: i * 0.1, ease: "easeOut"}}
              className={`group flex items-center gap-5 px-10 py-7 transition-colors duration-300 hover:bg-white/[0.03] ${i < perks.length - 1 ? "md:border-r border-white/8" : ""}`}>
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full border border-white/10 group-hover:border-red-500/50 flex items-center justify-center text-white/40 group-hover:text-red-500 transition-all duration-400 bg-white/[0.03]">
                  {perk.icon}
                </div>
                <div className="absolute inset-0 rounded-full bg-red-500/0 group-hover:bg-red-500/10 blur-md transition-all duration-500 scale-125" />
              </div>
              <div>
                <p
                  className="text-white font-bold text-[13px] tracking-[0.12em] uppercase mb-1 group-hover:text-red-500 transition-colors duration-300"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1rem",
                    letterSpacing: "0.08em",
                  }}>
                  {perk.title}
                </p>
                <p className="text-white/35 text-[11px] tracking-[0.06em] leading-relaxed group-hover:text-white/55 transition-colors duration-300">
                  {perk.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
