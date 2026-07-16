import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";

const testimonials = [
  {
    id: 1,
    name: "Jordan Mensah",
    location: "Lagos, NG",
    rating: 5,
    quote:
      "I've been hunting a Palace tri-ferg hoodie for months. Found it here in my size within 24 hours. Brands was verified, shipped same day. This platform is on another level.",
    tag: "Bought: Palace Hoodie",
    images: [
      "https://i.pinimg.com/736x/1b/27/84/1b27845534b95715a8219d2a545d29d4.jpg",
      "https://i.pinimg.com/736x/8f/7c/44/8f7c441a7d212d250d6233a1966e7e26.jpg",
    ],
    avatar:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80",
  },
  {
    id: 2,
    name: "Temi Adeyinka",
    location: "Abuja, NG",
    rating: 5,
    quote:
      "Listed my Supreme drop on a Friday, sold by Saturday morning. The brands dashboard is clean and the buyer was legit. BLVCKMRKT is the only platform I trust for this.",
    tag: "Sold: Supreme Box Logo Tee",
    images: [
      "https://i.pinimg.com/736x/df/d7/3b/dfd73bdbb7b580a74ffd0807c1d2212e.jpg",
      "https://i.pinimg.com/736x/32/de/2f/32de2f8db7c7dd8d70fa1033d604f61f.jpg",
    ],
    avatar:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
  },
  {
    id: 3,
    name: "Kofi Asante",
    location: "Accra, GH",
    rating: 4,
    quote:
      "Copped a pair of Ghost Runners I thought were sold out everywhere. Authentication was seamless, condition was exactly as described. Will never buy streetwear anywhere else.",
    tag: "Bought: Ghost Runner Sneakers",
    images: [
      "https://i.pinimg.com/736x/32/de/2f/32de2f8db7c7dd8d70fa1033d604f61f.jpg",
      "https://i.pinimg.com/736x/17/7e/d3/177ed3eb7ab0c779b50696a7347e453c.jpg",
    ],
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
  },
];

function Stars({count}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({length: 5}).map((_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
            i < count ? "text-red-500" : "text-white/15"
          }`}
          viewBox="0 0 24 24"
          fill="currentColor">
          <path d="M12 2l2.6 8H22l-6.6 4.8 2.5 7.7L12 17.7l-5.9 4.8 2.5-7.7L2 10h7.4z" />
        </svg>
      ))}
      <span className="ml-1.5 text-white/30 text-[10px] tracking-widest">
        {count}.0
      </span>
    </div>
  );
}

// ── Image Panel ──────────────────────────────────────────────
// Extracted so we can tune mobile layout separately
function ImagePanel({images, tag}) {
  return (
    <div className="bg-[#0d0d0d] relative flex items-center justify-center min-h-[260px] sm:min-h-[340px] md:min-h-[420px] overflow-hidden">
      {/* 
        On mobile: side-by-side thumbnails centred in the panel
        On md+:    the original overlapping absolute layout 
      */}

      {/* ── Mobile layout (flex row, hidden on md+) ── */}
      <div className="flex md:hidden items-end justify-center gap-3 w-full px-6 pt-6 pb-12">
        {/* Back / left image */}
        <div className="w-[44%] rounded-xl overflow-hidden flex-shrink-0 self-start mt-4">
          <img
            src={images[0]}
            alt=""
            className="w-full h-full object-cover"
            style={{
              aspectRatio: "4/3",
              filter: "grayscale(70%)",
              opacity: 0.55,
            }}
          />
          <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none" />
        </div>

        {/* Front / right image */}
        <div className="w-[52%] rounded-xl overflow-hidden flex-shrink-0 shadow-2xl relative">
          <img
            src={images[1]}
            alt=""
            className="w-full object-cover"
            style={{aspectRatio: "4/3", filter: "grayscale(15%)"}}
          />
          <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none" />
          <div className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded-full">
            <span className="text-white text-[7px] font-black tracking-[0.2em] uppercase">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* ── Desktop layout (absolute stacking, hidden on mobile) ── */}
      {/* Back image */}
      <div
        className="hidden md:block absolute rounded-2xl overflow-hidden"
        style={{
          top: "8%",
          left: "6%",
          width: "48%",
          aspectRatio: "4/3",
          zIndex: 1,
        }}>
        <img
          src={images[0]}
          alt=""
          className="w-full h-full object-cover"
          style={{filter: "grayscale(70%)", opacity: 0.55}}
        />
        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
      </div>

      {/* Front image */}
      <div
        className="hidden md:block absolute rounded-2xl overflow-hidden shadow-2xl"
        style={{
          bottom: "6%",
          right: "5%",
          width: "62%",
          aspectRatio: "4/3",
          zIndex: 2,
        }}>
        <img
          src={images[1]}
          alt=""
          className="w-full h-full object-cover"
          style={{filter: "grayscale(15%)"}}
        />
        <div className="absolute inset-0 border border-white/20 rounded-2xl" />
        <div className="absolute top-3 left-3 bg-red-500 px-2 py-0.5 rounded-full">
          <span className="text-white text-[8px] font-black tracking-[0.2em] uppercase">
            Verified
          </span>
        </div>
      </div>

      {/* Tag badge — sits at the bottom on both layouts */}
      <div className="absolute bottom-3 left-3 z-10 bg-black/80 backdrop-blur-sm border border-white/10 px-3 py-1.5">
        <span className="text-white/50 text-[9px] font-bold tracking-[0.25em] uppercase">
          {tag}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function Testimonials() {
  const [active, setActive] = useState(0);
  const current = testimonials[active];

  return (
    <section className="bg-black px-4 sm:px-6 md:px-12 py-14 sm:py-20 border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-3">
            ✦ What They're Saying
          </span>
          <h2
            className="text-white font-black leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2rem, 6vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            SATISFIED CLIENTS
            <br />
            <span className="text-red-500">SPEAK.</span>
          </h2>
        </div>

        {/* ── Animated card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{opacity: 0, y: 24}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -16}}
            transition={{duration: 0.45, ease: "easeOut"}}
            // gap-px + bg creates the 1 px divider line between cols
            className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.08]">

            {/* Left — images */}
            <ImagePanel images={current.images} tag={current.tag} />

            {/* Right — review */}
            <div className="bg-[#0d0d0d] flex flex-col justify-between p-6 sm:p-8 md:p-10">

              {/* Opening quote mark */}
              <div>
                <span
                  className="text-red-500/30 block mb-3"
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "clamp(3rem, 8vw, 5rem)",
                    lineHeight: 0.8,
                  }}>
                  "
                </span>

                {/* Avatar + name + stars */}
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="relative flex-shrink-0">
                    <img
                      src={current.avatar}
                      alt={current.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-white/10 grayscale"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-[#0d0d0d] flex items-center justify-center">
                      <svg
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor">
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </span>
                  </div>

                  <div>
                    <p
                      className="text-white font-black tracking-wide leading-none mb-1"
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                        letterSpacing: "0.08em",
                      }}>
                      {current.name}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <svg
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white/30"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
                      </svg>
                      <span className="text-white/30 text-[9px] sm:text-[10px] tracking-widest uppercase">
                        {current.location}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Stars count={current.rating} />
                    </div>
                  </div>
                </div>

                {/* Quote body */}
                <p className="text-white/55 text-[12px] sm:text-[13px] leading-relaxed tracking-wide italic border-l-2 border-red-500/40 pl-3 sm:pl-4">
                  "{current.quote}"
                </p>
              </div>

              {/* Bottom: dots + CTA */}
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-between gap-4">
                {/* Dot nav */}
                <div className="flex items-center gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      aria-label={`Go to testimonial ${i + 1}`}
                      className={`transition-all duration-300 h-[3px] rounded-none ${
                        i === active
                          ? "w-8 bg-red-500"
                          : "w-2 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                {/* See More */}
                <Link
                  to="/reviews"
                  className="group relative overflow-hidden bg-white text-black text-[10px] font-black tracking-[0.25em] uppercase px-5 py-2.5 sm:px-6 sm:py-3 flex items-center gap-2 hover:text-white transition-colors duration-200">
                  <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  <span className="relative">SEE MORE</span>
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
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Arrow navigation ── */}
        <div className="flex justify-end gap-2 mt-3 sm:mt-4">
          <button
            aria-label="Previous testimonial"
            onClick={() =>
              setActive((p) => (p - 1 + testimonials.length) % testimonials.length)
            }
            className="w-9 h-9 sm:w-10 sm:h-10 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all duration-200">
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            aria-label="Next testimonial"
            onClick={() => setActive((p) => (p + 1) % testimonials.length)}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-white flex items-center justify-center text-black hover:bg-red-500 hover:text-white transition-all duration-200">
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
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
          </button>
        </div>

      </div>
    </section>
  );
}