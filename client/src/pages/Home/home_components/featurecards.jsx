import {motion} from "framer-motion";
import {Link} from "react-router-dom";
import {useHomeContent} from "./homecontentcontext";

const ICONS = [
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path
      d="M24 4L44 16V32L24 44L4 32V16L24 4Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M24 4V44M4 16L44 16M4 32L44 32"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="3 3"
      opacity="0.4"
    />
    <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.9" />
  </svg>,
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path
      d="M24 6L28.5 18H42L31.5 25.5L36 37.5L24 30L12 37.5L16.5 25.5L6 18H19.5L24 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <path
      d="M18 24L22 28L30 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path
      d="M12 8H36L42 20H6L12 8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M6 20V40H42V20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path
      d="M20 28C20 25.8 21.8 24 24 24C26.2 24 28 25.8 28 28V40H20V28Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M14 8L6 20M34 8L42 20"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 2"
      opacity="0.5"
    />
  </svg>,
];

export default function FeatureCards() {
  const sectionTag = useHomeContent("features_section_tag", "✦ Why BLVCKMRKT");
  const sectionTitle = useHomeContent("features_section_title", "BUILT FOR THE CULTURE.");
  const sectionSubtitle = useHomeContent(
    "features_section_subtitle",
    "Everything you need. Nothing you don't.",
  );

  const c1tag = useHomeContent("feature1_tag", "01 — DROPS");
  const c1title = useHomeContent("feature1_title", "EXCLUSIVE\nRELEASES");
  const c1body = useHomeContent(
    "feature1_body",
    "Limited-edition pieces you won't find anywhere else. Every drop is verified, scarce, and gone fast.",
  );
  const c1cta = useHomeContent("feature1_cta", "SEE DROPS");
  const c1link = useHomeContent("feature1_link", "/drops");

  const c2tag = useHomeContent("feature2_tag", "02 — BRANDS");
  const c2title = useHomeContent("feature2_title", "VERIFIED\nHEAT ONLY");
  const c2body = useHomeContent(
    "feature2_body",
    "Every item listed passes through our brand verification. No fakes. No games. Just authentic streetwear.",
  );
  const c2cta = useHomeContent("feature2_cta", "MEET BRANDS");
  const c2link = useHomeContent("feature2_link", "/brands");

  const c3tag = useHomeContent("feature3_tag", "03 — CULTURE");
  const c3title = useHomeContent("feature3_title", "WEAR THE\nSTREETS");
  const c3body = useHomeContent(
    "feature3_body",
    "Streetwear isn't fashion — it's identity. Find pieces that speak before you do, from brands born in the culture.",
  );
  const c3cta = useHomeContent("feature3_cta", "SHOP NOW");
  const c3link = useHomeContent("feature3_link", "/shop");

  const cards = [
    {id: 1, tag: c1tag, title: c1title, body: c1body, cta: c1cta, link: c1link, icon: ICONS[0]},
    {id: 2, tag: c2tag, title: c2title, body: c2body, cta: c2cta, link: c2link, icon: ICONS[1]},
    {id: 3, tag: c3tag, title: c3title, body: c3body, cta: c3cta, link: c3link, icon: ICONS[2]},
  ];

  // Split title into main + red last word
  const titleParts = sectionTitle.split(" ");
  const redWord = titleParts.pop();
  const mainTitle = titleParts.join(" ");

  return (
    <section className="bg-black px-6 md:px-12 py-20">
      <div className="max-w-7xl mx-auto mb-12 flex items-end justify-between">
        <div>
          <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-2">
            {sectionTag}
          </span>
          <h2
            className="text-white font-black leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            {mainTitle}
            <br />
            <span className="text-red-500">{redWord}</span>
          </h2>
        </div>
        <div className="hidden md:block w-[1px] h-16 bg-white/10" />
        <p className="hidden md:block text-white/40 text-xs tracking-widest uppercase max-w-[200px] text-right leading-relaxed">
          {sectionSubtitle}
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{opacity: 0, y: 40}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: "-60px"}}
            transition={{duration: 0.6, delay: i * 0.12, ease: "easeOut"}}
            className="group relative bg-black overflow-hidden">
            <div className="absolute inset-0 bg-[#0d0d0d] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />
            <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[32px] border-r-[32px] border-t-red-500 border-r-transparent group-hover:border-t-white transition-colors duration-500" />
            </div>
            <div className="relative z-10 p-8 md:p-10 flex flex-col h-full min-h-[380px]">
              <div className="flex items-start gap-5 mb-8">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 text-red-500 group-hover:text-white transition-colors duration-300">
                    {card.icon}
                  </div>
                  <div className="absolute inset-0 blur-xl bg-red-500/20 group-hover:bg-red-500/10 transition-all duration-500 scale-150" />
                </div>
                <div className="pt-1">
                  <span className="text-white/20 group-hover:text-white/40 text-[10px] font-bold tracking-[0.35em] uppercase transition-colors duration-300 block">
                    {card.tag}
                  </span>
                  <div className="mt-2 w-8 h-[1px] bg-red-500/50 group-hover:w-16 transition-all duration-500" />
                </div>
              </div>
              <h3
                className="text-white font-black leading-none mb-4"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "clamp(2rem, 3.5vw, 2.6rem)",
                  letterSpacing: "0.04em",
                  whiteSpace: "pre-line",
                }}>
                {card.title}
              </h3>
              <p className="text-white/40 group-hover:text-white/60 text-[13px] leading-relaxed tracking-wide transition-colors duration-300 flex-1">
                {card.body}
              </p>
              <div className="mt-8">
                <Link
                  to={card.link}
                  className="group/btn relative inline-flex items-center gap-3 overflow-hidden border border-white/20 group-hover:border-red-500 px-6 py-3.5 transition-colors duration-500">
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-red-500 group-hover:w-full transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]" />
          </motion.div>
        ))}
      </div>

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
