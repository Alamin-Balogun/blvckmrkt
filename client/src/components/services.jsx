import {useState} from "react";
import {motion} from "framer-motion";
import {Link} from "react-router-dom";

const services = [
  {
    id: 1,
    num: "01",
    title: "Buy Authentic Gear",
    desc: "Every product listed on BLVCKMRKT passes through our seller verification process. No counterfeits, no grey market pieces — just genuine streetwear from trusted sources. Shop with total confidence.",
    link: "/shop",
    cta: "Start Shopping",
    icon: (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-7 h-7"
        stroke="currentColor"
        strokeWidth="1.5">
        <path d="M6 8h20l-2 14H8L6 8z" strokeLinejoin="round" />
        <path d="M11 8V6a5 5 0 0110 0v2" strokeLinecap="round" />
        <path d="M13 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 2,
    num: "02",
    title: "Sell Your Heat",
    desc: "Got pieces collecting dust? List them on BLVCKMRKT and reach thousands of verified buyers. Our seller dashboard makes it easy to upload, price, and manage your listings — all in one place.",
    link: "/sell",
    cta: "Start Selling",
    icon: (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-7 h-7"
        stroke="currentColor"
        strokeWidth="1.5">
        <rect x="4" y="4" width="24" height="24" rx="2" />
        <path d="M16 10v12M10 16h12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 3,
    num: "03",
    title: "Brand Verification",
    desc: "Are you a streetwear brand looking to reach your audience directly? Apply for a verified brand profile, get a badge, and list your official drops with priority placement across the platform.",
    link: "/sellers",
    cta: "Apply as Brand",
    icon: (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-7 h-7"
        stroke="currentColor"
        strokeWidth="1.5">
        <path d="M16 3L20 12H30L22 18L25 28L16 22L7 28L10 18L2 12H12Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 4,
    num: "04",
    title: "Exclusive Drops",
    desc: "BLVCKMRKT hosts time-limited drops from verified sellers and brands. Subscribe to get early access before items go public — the rarest pieces go first, and they don't come back.",
    link: "/drops",
    cta: "See Drops",
    icon: (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-7 h-7"
        stroke="currentColor"
        strokeWidth="1.5">
        <circle cx="16" cy="16" r="12" />
        <path d="M16 10v6l4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 5,
    num: "05",
    title: "Authentication Service",
    desc: "Not sure if a piece is real? Submit it to our in-house authentication team. We check stitching, labels, tags, sole patterns and more — so you never overpay for a fake again.",
    link: "/contact",
    cta: "Get Authenticated",
    icon: (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-7 h-7"
        stroke="currentColor"
        strokeWidth="1.5">
        <path d="M16 4L4 10v8c0 6 5 10 12 12 7-2 12-6 12-12v-8L16 4z" strokeLinejoin="round" />
        <path d="M11 16l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Services() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-3">
            ✦ What We Offer
          </span>
          <h2
            className="text-white font-black leading-none mb-3"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            OUR <span className="text-red-500">SERVICES</span>
          </h2>
          <p className="text-white/35 text-[11px] tracking-[0.2em] uppercase">
            Everything you need — whether you're buying, selling, or building a brand
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {services.map((service, i) => {
            const isActive = active === i;
            return (
              <motion.div
                key={service.id}
                initial={{opacity: 0, y: 24}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, margin: "-40px"}}
                transition={{duration: 0.5, delay: i * 0.08}}
                onClick={() => setActive(i)}
                className={`relative rounded-2xl p-6 cursor-pointer border transition-all duration-500 flex flex-col min-h-[340px] overflow-hidden group ${
                  isActive
                    ? "bg-white text-black border-white shadow-2xl shadow-white/10 scale-[1.03]"
                    : "bg-[#0d0d0d] text-white border-white/8 hover:border-white/25"
                }`}>
                {/* Red accent top bar on inactive hover */}
                {!isActive && (
                  <span className="absolute top-0 left-0 h-[2px] w-0 bg-red-500 group-hover:w-full transition-all duration-400 ease-out rounded-t-2xl" />
                )}

                {/* Number */}
                <span
                  className={`font-black leading-none mb-auto block transition-colors duration-300 ${
                    isActive ? "text-black/20" : "text-white/15"
                  }`}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "2.8rem",
                    letterSpacing: "0.04em",
                    textAlign: "right",
                  }}>
                  {service.num}
                </span>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-white/5 text-white/50 group-hover:text-red-500 group-hover:bg-red-500/10"
                  }`}>
                  {service.icon}
                </div>

                {/* Title */}
                <h3
                  className={`font-black leading-tight mb-3 transition-colors duration-300 ${
                    isActive ? "text-black" : "text-white group-hover:text-white"
                  }`}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.45rem",
                    letterSpacing: "0.04em",
                  }}>
                  {service.title}
                </h3>

                {/* Desc */}
                <p
                  className={`text-[11px] leading-relaxed tracking-wide flex-1 transition-colors duration-300 ${
                    isActive ? "text-black/60" : "text-white/35"
                  }`}>
                  {service.desc}
                </p>

                {/* CTA — only on active */}
                {isActive && (
                  <motion.div
                    initial={{opacity: 0, y: 8}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.3, delay: 0.1}}
                    className="mt-6">
                    <Link
                      to={service.link}
                      onClick={(e) => e.stopPropagation()}
                      className="group/btn inline-flex items-center gap-2 bg-black text-white text-[10px] font-black tracking-[0.25em] uppercase px-5 py-3 hover:bg-red-500 transition-colors duration-300">
                      {service.cta}
                      <svg
                        className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-200"
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
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom dot nav */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 h-[3px] rounded-none ${
                i === active ? "w-8 bg-red-500" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
