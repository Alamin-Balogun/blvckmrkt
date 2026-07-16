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
      "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600&q=80",
    ],
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80",
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
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    ],
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
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
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80",
    ],
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
  },
];

function Stars({count}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({length: 5}).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "text-red-500" : "text-white/15"}`}
          viewBox="0 0 24 24"
          fill="currentColor">
          <path d="M12 2l2.6 8H22l-6.6 4.8 2.5 7.7L12 17.7l-5.9 4.8 2.5-7.7L2 10h7.4z" />
        </svg>
      ))}
      <span className="ml-1.5 text-white/30 text-[10px] tracking-widest">{count}.0</span>
    </div>
  );
}

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const current = testimonials[active];

  return (
    <section className="bg-black px-6 md:px-12 py-20 border-t border-white/8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-3">
            ✦ What They're Saying
          </span>
          <h2
            className="text-white font-black leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            SATISFIED CLIENTS
            <br />
            <span className="text-red-500">SPEAK.</span>
          </h2>
        </div>

        {/* Main card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{opacity: 0, y: 24}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -16}}
            transition={{duration: 0.45, ease: "easeOut"}}
            className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/8">
            {/* ── Left: Stacked images ── */}
            <div className="bg-[#0d0d0d] relative flex items-center justify-center p-10 md:p-14 min-h-[400px]">
              {/* Back image — smaller, top-left */}
              <div
                className="absolute rounded-2xl overflow-hidden"
                style={{top: "8%", left: "6%", width: "48%", aspectRatio: "4/3", zIndex: 1}}>
                <img
                  src={current.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{filter: "grayscale(70%)", opacity: 0.55}}
                />
                <div className="absolute inset-0 border border-white/10 rounded-2xl" />
              </div>

              {/* Front image — larger, shifted down */}
              <div
                className="absolute rounded-2xl overflow-hidden shadow-2xl"
                style={{bottom: "6%", right: "5%", width: "62%", aspectRatio: "4/3", zIndex: 2}}>
                <img
                  src={current.images[1]}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{filter: "grayscale(15%)"}}
                />
                <div className="absolute inset-0 border border-white/20 rounded-2xl" />
                {/* Red top-left pill accent */}
                <div className="absolute top-3 left-3 bg-red-500 px-2 py-0.5 rounded-full">
                  <span className="text-white text-[8px] font-black tracking-[0.2em] uppercase">
                    Verified
                  </span>
                </div>
              </div>

              {/* Tag badge */}
              <div className="absolute bottom-4 left-4 z-10 bg-black/80 backdrop-blur-sm border border-white/10 px-3 py-1.5">
                <span className="text-white/50 text-[9px] font-bold tracking-[0.25em] uppercase">
                  {current.tag}
                </span>
              </div>
            </div>

            {/* ── Right: Review ── */}
            <div className="bg-[#0d0d0d] flex flex-col justify-between p-8 md:p-10">
              {/* Top quote mark */}
              <div>
                <span
                  className="text-red-500/30 leading-none block mb-4"
                  style={{fontFamily: "Georgia, serif", fontSize: "5rem", lineHeight: 0.8}}>
                  "
                </span>

                {/* Avatar + name + stars */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-shrink-0">
                    <img
                      src={current.avatar}
                      alt={current.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10 grayscale"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0d0d0d] flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor">
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
                        fontSize: "1.1rem",
                        letterSpacing: "0.08em",
                      }}>
                      {current.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-2.5 h-2.5 text-white/30"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
                      </svg>
                      <span className="text-white/30 text-[10px] tracking-widest uppercase">
                        {current.location}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Stars count={current.rating} />
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-white/55 text-[13px] leading-relaxed tracking-wide italic border-l-2 border-red-500/40 pl-4">
                  "{current.quote}"
                </p>
              </div>

              {/* Bottom: nav dots + See More */}
              <div className="mt-8 flex items-center justify-between">
                {/* Dot nav */}
                <div className="flex items-center gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`transition-all duration-300 h-[3px] rounded-none ${
                        i === active ? "w-8 bg-red-500" : "w-2 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                {/* See More button */}
                <Link
                  to="/reviews"
                  className="group relative overflow-hidden bg-white text-black text-[10px] font-black tracking-[0.25em] uppercase px-6 py-3 flex items-center gap-2 hover:text-white transition-colors duration-200">
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

        {/* Arrow navigation */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setActive((p) => (p - 1 + testimonials.length) % testimonials.length)}
            className="w-10 h-10 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all duration-200">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => setActive((p) => (p + 1) % testimonials.length)}
            className="w-10 h-10 bg-white flex items-center justify-center text-black hover:bg-red-500 hover:text-white transition-all duration-200">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
