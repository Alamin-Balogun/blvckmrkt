import {motion} from "framer-motion";
import {useAboutContent} from "./aboutcontentcontext";

const STEP_ICONS = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>,
];

export default function WorkingProcess() {
  const heading = useAboutContent("process_heading", "HOW BLVCKMRKT WORKS");
  const subtitle = useAboutContent(
    "process_subtitle",
    "Simple, safe, and built around trust. From signup to checkout — every step is designed to protect buyers and reward sellers.",
  );

  const steps = [
    {
      num: "01",
      icon: STEP_ICONS[0],
      title: useAboutContent("step1_title", "Create Your Account"),
      desc: useAboutContent(
        "step1_desc",
        "Sign up for free in under 2 minutes. Choose whether you're joining as a buyer, seller, or brand — and get verified straight away.",
      ),
    },
    {
      num: "02",
      icon: STEP_ICONS[1],
      title: useAboutContent("step2_title", "Browse or List"),
      desc: useAboutContent(
        "step2_desc",
        "Buyers explore thousands of verified streetwear pieces. Sellers upload their listings with photos, description, and price — live in minutes.",
      ),
    },
    {
      num: "03",
      icon: STEP_ICONS[2],
      title: useAboutContent("step3_title", "Authentication Check"),
      desc: useAboutContent(
        "step3_desc",
        "Every listing goes through our verification process. Our team confirms authenticity before the item is visible to buyers — zero compromise.",
      ),
    },
    {
      num: "04",
      icon: STEP_ICONS[3],
      title: useAboutContent("step4_title", "Buy or Get Paid"),
      desc: useAboutContent(
        "step4_desc",
        "Buyers checkout securely. Sellers get paid fast. Funds are released once the buyer confirms the item arrived — safe for both sides.",
      ),
    },
  ];

  const ctaHeading = useAboutContent("process_cta_heading", "READY TO GET STARTED?");
  const ctaSubtitle = useAboutContent(
    "process_cta_subtitle",
    "Join thousands of buyers and sellers already on the platform.",
  );
  const ctaBtnText = useAboutContent("process_cta_btn_text", "Join Now");
  const ctaBtnLink = useAboutContent("process_cta_btn_link", "/register");

  // Last word of heading goes red
  const words = heading.split(" ");
  const redWord = words.pop();
  const mainH = words.join(" ");

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-red-500/50" />
            <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase">
              Our Process
            </span>
            <div className="h-px w-10 bg-red-500/50" />
          </div>
          <h2
            className="text-white font-black leading-none mb-4"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            {mainH} <span className="text-red-500">{redWord}</span>
          </h2>
          <p className="text-white/35 text-[13px] tracking-wide max-w-lg mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-[52px] left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-white/8 z-0">
            <motion.div
              initial={{scaleX: 0}}
              whileInView={{scaleX: 1}}
              viewport={{once: true}}
              transition={{duration: 1.2, ease: "easeOut", delay: 0.3}}
              className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-500/30 origin-left"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{opacity: 0, y: 28}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, margin: "-40px"}}
                transition={{duration: 0.5, delay: i * 0.12}}
                className="group flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-[104px] h-[104px] rounded-full border border-white/10 group-hover:border-red-500/50 transition-all duration-500 flex items-center justify-center">
                    <div className="w-[76px] h-[76px] rounded-full bg-[#0d0d0d] border border-white/8 group-hover:bg-red-500/10 group-hover:border-red-500/30 flex items-center justify-center text-white/50 group-hover:text-red-500 transition-all duration-500">
                      {step.icon}
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 border-2 border-black flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">{i + 1}</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/0 group-hover:border-red-500/20 scale-110 group-hover:scale-125 transition-all duration-500" />
                </div>
                <h3
                  className="text-white font-black leading-tight mb-3 group-hover:text-red-500 transition-colors duration-300"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.15rem",
                    letterSpacing: "0.06em",
                  }}>
                  {step.title}
                </h3>
                <p className="text-white/35 text-[12px] leading-relaxed tracking-wide max-w-[200px] mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true}}
          transition={{duration: 0.5, delay: 0.5}}
          className="mt-16 border border-white/8 bg-[#0d0d0d] flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-6">
          <div>
            <p
              className="text-white font-black leading-none mb-1"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.4rem",
                letterSpacing: "0.06em",
              }}>
              {ctaHeading}
            </p>
            <p className="text-white/35 text-[12px] tracking-wide">{ctaSubtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href={ctaBtnLink}
              className="group relative overflow-hidden bg-white text-black text-[11px] font-black tracking-[0.25em] uppercase px-7 py-3.5 flex items-center gap-2 hover:text-white transition-colors duration-200">
              <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative">{ctaBtnText}</span>
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
            </a>
            <a
              href="/about"
              className="border border-white/20 text-white/50 hover:text-white hover:border-white/50 text-[11px] font-black tracking-[0.25em] uppercase px-7 py-3.5 transition-all duration-200">
              Learn More
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
