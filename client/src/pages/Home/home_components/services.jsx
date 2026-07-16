import {useState} from "react";
import {motion} from "framer-motion";
import {Link} from "react-router-dom";
import {useHomeContent} from "./homecontentcontext";

const SERVICE_ICONS = [
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 8h20l-2 14H8L6 8z" strokeLinejoin="round" />
    <path d="M11 8V6a5 5 0 0110 0v2" strokeLinecap="round" />
    <path d="M13 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="4" width="24" height="24" rx="2" />
    <path d="M16 10v12M10 16h12" strokeLinecap="round" />
  </svg>,
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 3L20 12H30L22 18L25 28L16 22L7 28L10 18L2 12H12Z" strokeLinejoin="round" />
  </svg>,
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <circle cx="16" cy="16" r="12" />
    <path d="M16 10v6l4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 4L4 10v8c0 6 5 10 12 12 7-2 12-6 12-12v-8L16 4z" strokeLinejoin="round" />
    <path d="M11 16l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
];

const SERVICE_LINKS = ["/shop", "/register", "/brands", "/drops", "/contact"];
const SERVICE_NUMS = ["01", "02", "03", "04", "05"];

export default function Services() {
  const [active, setActive] = useState(0);

  const sectionTag = useHomeContent("services_section_tag", "✦ What We Offer");
  const sectionTitle = useHomeContent("services_section_title", "OUR SERVICES");
  const sectionSubtitle = useHomeContent(
    "services_section_subtitle",
    "Everything you need — whether you're buying, selling, or building a brand",
  );

  const s1title = useHomeContent("service1_title", "Buy Authentic Gear");
  const s1desc = useHomeContent(
    "service1_desc",
    "Every product listed on BLVCKMRKT passes through our seller verification process. No counterfeits, no grey market pieces — just genuine streetwear from trusted sources. Shop with total confidence.",
  );
  const s1cta = useHomeContent("service1_cta", "Start Shopping");

  const s2title = useHomeContent("service2_title", "Sell Your Heat");
  const s2desc = useHomeContent(
    "service2_desc",
    "Got pieces collecting dust? List them on BLVCKMRKT and reach thousands of verified buyers. Our seller dashboard makes it easy to upload, price, and manage your listings — all in one place.",
  );
  const s2cta = useHomeContent("service2_cta", "Start Selling");

  const s3title = useHomeContent("service3_title", "Brand Verification");
  const s3desc = useHomeContent(
    "service3_desc",
    "Are you a streetwear brand looking to reach your audience directly? Apply for a verified brand profile, get a badge, and list your official drops with priority placement across the platform.",
  );
  const s3cta = useHomeContent("service3_cta", "Apply as Brand");

  const s4title = useHomeContent("service4_title", "Exclusive Drops");
  const s4desc = useHomeContent(
    "service4_desc",
    "BLVCKMRKT hosts time-limited drops from verified sellers and brands. Subscribe to get early access before items go public — the rarest pieces go first, and they don't come back.",
  );
  const s4cta = useHomeContent("service4_cta", "See Drops");

  const s5title = useHomeContent("service5_title", "Authentication Service");
  const s5desc = useHomeContent(
    "service5_desc",
    "Not sure if a piece is real? Submit it to our in-house authentication team. We check stitching, labels, tags, sole patterns and more — so you never overpay for a fake again.",
  );
  const s5cta = useHomeContent("service5_cta", "Get Authenticated");

  const services = [
    {
      id: 1,
      num: SERVICE_NUMS[0],
      title: s1title,
      desc: s1desc,
      cta: s1cta,
      link: SERVICE_LINKS[0],
      icon: SERVICE_ICONS[0],
    },
    {
      id: 2,
      num: SERVICE_NUMS[1],
      title: s2title,
      desc: s2desc,
      cta: s2cta,
      link: SERVICE_LINKS[1],
      icon: SERVICE_ICONS[1],
    },
    {
      id: 3,
      num: SERVICE_NUMS[2],
      title: s3title,
      desc: s3desc,
      cta: s3cta,
      link: SERVICE_LINKS[2],
      icon: SERVICE_ICONS[2],
    },
    {
      id: 4,
      num: SERVICE_NUMS[3],
      title: s4title,
      desc: s4desc,
      cta: s4cta,
      link: SERVICE_LINKS[3],
      icon: SERVICE_ICONS[3],
    },
    {
      id: 5,
      num: SERVICE_NUMS[4],
      title: s5title,
      desc: s5desc,
      cta: s5cta,
      link: SERVICE_LINKS[4],
      icon: SERVICE_ICONS[4],
    },
  ];

  // Split title — last word goes red
  const titleParts = sectionTitle.split(" ");
  const redWord = titleParts.pop();
  const mainTitle = titleParts.join(" ");

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-3">
            {sectionTag}
          </span>
          <h2
            className="text-white font-black leading-none mb-3"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            {mainTitle} <span className="text-red-500">{redWord}</span>
          </h2>
          <p className="text-white/35 text-[11px] tracking-[0.2em] uppercase">{sectionSubtitle}</p>
        </div>

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
                className={`relative rounded-2xl p-6 cursor-pointer border transition-all duration-500 flex flex-col min-h-[340px] overflow-hidden group ${isActive ? "bg-white text-black border-white shadow-2xl shadow-white/10 scale-[1.03]" : "bg-[#0d0d0d] text-white border-white/8 hover:border-white/25"}`}>
                {!isActive && (
                  <span className="absolute top-0 left-0 h-[2px] w-0 bg-red-500 group-hover:w-full transition-all duration-400 ease-out rounded-t-2xl" />
                )}
                <span
                  className={`font-black leading-none mb-auto block transition-colors duration-300 ${isActive ? "text-black/20" : "text-white/15"}`}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "2.8rem",
                    letterSpacing: "0.04em",
                    textAlign: "right",
                  }}>
                  {service.num}
                </span>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${isActive ? "bg-black text-white" : "bg-white/5 text-white/50 group-hover:text-red-500 group-hover:bg-red-500/10"}`}>
                  {service.icon}
                </div>
                <h3
                  className={`font-black leading-tight mb-3 transition-colors duration-300 ${isActive ? "text-black" : "text-white"}`}
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.45rem",
                    letterSpacing: "0.04em",
                  }}>
                  {service.title}
                </h3>
                <p
                  className={`text-[11px] leading-relaxed tracking-wide flex-1 transition-colors duration-300 ${isActive ? "text-black/60" : "text-white/35"}`}>
                  {service.desc}
                </p>
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

        <div className="flex items-center justify-center gap-2 mt-8">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 h-[3px] rounded-md py-2.5 px-5 ${i === active ? "w-8 bg-red-500" : "w-2 bg-white/20 hover:bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
