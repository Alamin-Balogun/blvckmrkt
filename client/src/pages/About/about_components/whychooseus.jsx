import {motion} from "framer-motion";
import {useAboutContent} from "./aboutcontentcontext";

const REASON_ICONS = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>,
];

export default function WhyChooseUs() {
  const headingLine1 = useAboutContent("why_heading_line1", "THE ONLY PLATFORM");
  const headingLine2 = useAboutContent("why_heading_line2", "BUILT FOR REAL ONES.");
  const subtitle = useAboutContent(
    "why_subtitle",
    "There are a hundred resale platforms out there. Only one was built specifically for streetwear culture — with authenticity, community, and the culture at its core.",
  );
  const phone = useAboutContent("why_phone", "+1 (800) 255-9638");

  // Last word of line 2 goes red
  const line2words = headingLine2.split(" ");
  const line2red = line2words.pop();
  const line2main = line2words.join(" ");

  const reasons = [
    {
      icon: REASON_ICONS[0],
      title: useAboutContent("why1_title", "Zero Fakes Guaranteed"),
      desc: useAboutContent(
        "why1_desc",
        "Every product is authenticated before listing. Our team checks stitching, tags, soles and serial numbers — so you never waste money on a fake.",
      ),
    },
    {
      icon: REASON_ICONS[1],
      title: useAboutContent("why2_title", "Exclusive Drop Access"),
      desc: useAboutContent(
        "why2_desc",
        "Subscribers get 24-hour early access to limited releases. The rarest pieces go to our community first — always.",
      ),
    },
    {
      icon: REASON_ICONS[2],
      title: useAboutContent("why3_title", "Verified Seller Network"),
      desc: useAboutContent(
        "why3_desc",
        "Every seller on BLVCKMRKT is manually verified. Real people, real pieces, real accountability — no anonymous listings.",
      ),
    },
    {
      icon: REASON_ICONS[3],
      title: useAboutContent("why4_title", "Fair Pricing, Low Fees"),
      desc: useAboutContent(
        "why4_desc",
        "We don't take a huge cut. Sellers keep more, buyers pay less. Our fee structure is transparent and designed to keep the culture alive.",
      ),
    },
  ];

  return (
    <section className="bg-[#0a0a0a] border-t border-white/8 px-6 md:px-12 py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{opacity: 0, x: -30}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true, margin: "-60px"}}
            transition={{duration: 0.6, ease: "easeOut"}}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase">
                Why Choose Us
              </span>
            </div>
            <h2
              className="text-white font-black leading-none mb-5"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.6rem, 5vw, 4rem)",
                letterSpacing: "0.04em",
              }}>
              {headingLine1}
              <br />
              {line2main} <span className="text-red-500">{line2red}</span>
            </h2>
            <p className="text-white/40 text-[13px] leading-relaxed tracking-wide max-w-md mb-10">
              {subtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {reasons.map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{opacity: 0, y: 16}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{duration: 0.4, delay: i * 0.08}}
                  className="group flex gap-4 p-4 border border-white/8 hover:border-red-500/40 bg-black/40 hover:bg-black/60 transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                    {r.icon}
                  </div>
                  <div>
                    <h4
                      className="text-white font-black leading-tight mb-1 group-hover:text-red-500 transition-colors duration-300"
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "1rem",
                        letterSpacing: "0.05em",
                      }}>
                      {r.title}
                    </h4>
                    <p className="text-white/35 text-[11px] leading-relaxed tracking-wide">
                      {r.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-6 border-t border-white/8">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full border-2 border-red-500/40 bg-gray-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
                </div>
                <div>
                  <p className="text-white text-[12px] font-bold tracking-wide">Olatomiwa Shittu</p>
                  <p className="text-white/35 text-[10px] tracking-[0.15em] uppercase">
                    Co-Founder
                  </p>
                </div>
              </div>
              <div className="h-px sm:h-8 w-full sm:w-px bg-white/8" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-red-500 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white/25 text-[9px] tracking-[0.2em] uppercase mb-0.5">
                    Call Us Now
                  </p>
                  <p className="text-white text-[12px] font-bold">{phone}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — image with floating cards */}
          <motion.div
            initial={{opacity: 0, x: 30}}
            whileInView={{opacity: 1, x: 0}}
            viewport={{once: true, margin: "-60px"}}
            transition={{duration: 0.6, ease: "easeOut", delay: 0.1}}
            className="relative h-[500px] hidden lg:block">
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <img
                src="https://i.pinimg.com/736x/a7/e8/be/a7e8be32920cfb24669560b5b09dc7a1.jpg"
                alt=""
                className="w-full h-full object-cover object-center"
                style={{filter: "grayscale(20%)"}}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
            </div>
            <motion.div
              initial={{opacity: 0, y: -16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.4}}
              className="absolute top-6 -left-6 bg-black border border-white/12 px-5 py-4 shadow-2xl z-10 min-w-[160px]">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-3.5 h-3.5 text-red-500"
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
                <span className="text-white/50 text-[9px] font-bold tracking-[0.2em] uppercase">
                  Authenticated
                </span>
              </div>
              <p
                className="text-white font-black"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.5rem",
                  letterSpacing: "0.04em",
                }}>
                100% Real
              </p>
              <p className="text-white/30 text-[9px] tracking-wide">Every. Single. Item.</p>
            </motion.div>
            <motion.div
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.5, delay: 0.5}}
              className="absolute bottom-6 -right-6 bg-red-500 px-5 py-4 shadow-2xl z-10 min-w-[180px]">
              <p className="text-white/80 text-[9px] font-bold tracking-[0.2em] uppercase mb-1">
                Happy Buyers
              </p>
              <p
                className="text-white font-black leading-none"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.8rem",
                  letterSpacing: "0.04em",
                }}>
                12,000+
              </p>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-2.5 h-2.5 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M12 2l2.6 8H22l-6.6 4.8 2.5 7.7L12 17.7l-5.9 4.8 2.5-7.7L2 10h7.4z" />
                  </svg>
                ))}
              </div>
            </motion.div>
            <div
              className="absolute -bottom-4 -left-4 w-24 h-24 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(239,68,68,0.8) 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
