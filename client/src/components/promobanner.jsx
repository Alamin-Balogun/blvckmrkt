import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";

export default function PromoBanner() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/8 overflow-hidden rounded-2xl">
          {/* ── Left: Promo Content ── */}
          <div className="bg-[#0d0d0d] flex flex-col justify-center px-10 md:px-14 py-14 relative overflow-hidden">
            {/* Big faded % background text */}
            <span
              className="absolute -left-4 top-1/2 -translate-y-1/2 text-white/[0.03] font-black leading-none pointer-events-none select-none"
              style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "16rem"}}>
              10%
            </span>

            {/* Tag */}
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase">
                Exclusive Offer
              </span>
            </div>

            {/* Headline */}
            <h2
              className="text-white font-black leading-none mb-4"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.6rem, 5vw, 4.2rem)",
                letterSpacing: "0.04em",
              }}>
              YOUR FIRST ORDER
              <br />
              <span className="text-red-500">10% OFF.</span>
            </h2>

            {/* Body */}
            <p className="text-white/45 text-[13px] leading-relaxed tracking-wide max-w-sm mb-3">
              Subscribe to the BLVCKMRKT newsletter and unlock your exclusive 10% discount on your
              first order. Be first to know about new drops, verified sellers, and limited releases.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-7">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-white/20 text-[9px] tracking-[0.3em] uppercase font-bold">
                Subscribe & Save
              </span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -10}}
                  transition={{duration: 0.3}}
                  className="flex flex-col sm:flex-row gap-3">
                  <div
                    className={`relative flex-1 border transition-all duration-300 ${
                      focused ? "border-red-500/70" : "border-white/15"
                    }`}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      placeholder="your@email.com"
                      className="w-full bg-transparent text-white text-[12px] tracking-[0.1em] placeholder-white/20 px-4 py-3.5 outline-none"
                    />
                    {/* animated left border glow */}
                    <span
                      className={`absolute left-0 top-0 h-full w-[2px] bg-red-500 transition-all duration-300 ${
                        focused ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="group relative overflow-hidden bg-white text-black text-[11px] font-black tracking-[0.25em] uppercase px-7 py-3.5 flex items-center justify-center gap-2 flex-shrink-0 hover:text-white transition-colors duration-200">
                    <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                    <span className="relative">GET 10% OFF</span>
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
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{opacity: 0, scale: 0.95}}
                  animate={{opacity: 1, scale: 1}}
                  transition={{duration: 0.4}}
                  className="border border-red-500/40 bg-red-500/5 px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
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
                  </div>
                  <div>
                    <p className="text-white font-bold text-[12px] tracking-wide">
                      You're in. Check your inbox.
                    </p>
                    <p className="text-white/40 text-[11px] mt-0.5">
                      Your 10% discount code is on its way.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fine print */}
            <p className="text-white/20 text-[9px] tracking-[0.12em] uppercase mt-4 leading-relaxed">
              No spam. Unsubscribe anytime. Offer valid for first-time subscribers only.
            </p>

            {/* Perks row */}
            <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/8">
              {["Free Shipping", "Verified Sellers", "Exclusive Drops"].map((perk) => (
                <div key={perk} className="flex items-center gap-1.5">
                  <svg
                    className="w-3 h-3 text-red-500 flex-shrink-0"
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
                  <span className="text-white/35 text-[9px] tracking-[0.15em] uppercase font-bold whitespace-nowrap">
                    {perk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Promo Image ── */}
          <div className="relative overflow-hidden min-h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=80"
              alt="Promo"
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{filter: "grayscale(20%)"}}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Floating discount badge */}
            <div className="absolute top-8 right-8">
              <div className="relative">
                <div className="w-24 h-24 bg-red-500 rounded-full flex flex-col items-center justify-center shadow-2xl shadow-red-500/30">
                  <span
                    className="text-white font-black leading-none"
                    style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem"}}>
                    10%
                  </span>
                  <span
                    className="text-white/80 font-black leading-none"
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "0.65rem",
                      letterSpacing: "0.15em",
                    }}>
                    OFF
                  </span>
                </div>
                {/* Orbit ring */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-red-500/30 scale-125 animate-ping"
                  style={{animationDuration: "2.5s"}}
                />
              </div>
            </div>

            {/* Bottom text overlay */}
            <div className="absolute bottom-8 left-8 right-8">
              <p
                className="text-white font-black leading-tight"
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.6rem",
                  letterSpacing: "0.06em",
                }}>
                COME AND ENJOY
                <br />
                <span className="text-red-500">THE BLVCKMRKT SALE</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
