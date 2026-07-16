import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";

const plans = [
  {
    id: "starter",
    tier: "Starter",
    tag: "For Buyers",
    monthly: 0,
    annual: 0,
    tagline: "Start exploring the culture",
    cta: "Get Started Free",
    ctaLink: "/register",
    popular: false,
    free: true,
    icon: (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-7 h-7"
        stroke="currentColor"
        strokeWidth="1.5">
        <circle cx="16" cy="12" r="5" />
        <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10" strokeLinecap="round" />
      </svg>
    ),
    features: [
      {text: "Browse all verified listings", included: true},
      {text: "Wishlist up to 10 items", included: true},
      {text: "Basic seller profiles", included: true},
      {text: "Standard shipping rates", included: true},
      {text: "Early drop access", included: false},
      {text: "Exclusive member discounts", included: false},
      {text: "Priority customer support", included: false},
    ],
  },
  {
    id: "blvck",
    tier: "BLVCK",
    tag: "Most Popular",
    monthly: 12,
    annual: 9,
    tagline: "For the real ones",
    cta: "Go BLVCK",
    ctaLink: "/register?plan=blvck",
    popular: true,
    free: false,
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
    features: [
      {text: "Everything in Starter", included: true},
      {text: "Unlimited wishlist", included: true},
      {text: "Early drop access (24hrs)", included: true},
      {text: "10% off first order", included: true},
      {text: "Exclusive member discounts", included: true},
      {text: "Priority customer support", included: true},
      {text: "Seller dashboard access", included: false},
    ],
  },
  {
    id: "mrkt",
    tier: "MRKT PRO",
    tag: "For Sellers",
    monthly: 29,
    annual: 22,
    tagline: "Sell without limits",
    cta: "Start Selling",
    ctaLink: "/register?plan=mrkt",
    popular: false,
    free: false,
    icon: (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-7 h-7"
        stroke="currentColor"
        strokeWidth="1.5">
        <rect x="3" y="8" width="26" height="18" rx="2" />
        <path d="M10 8V6a6 6 0 0112 0v2" strokeLinecap="round" />
        <path d="M16 17v-4M14 15h4" strokeLinecap="round" />
      </svg>
    ),
    features: [
      {text: "Everything in BLVCK", included: true},
      {text: "Unlimited product listings", included: true},
      {text: "Seller verification badge", included: true},
      {text: "Analytics dashboard", included: true},
      {text: "Featured listing boosts", included: true},
      {text: "0% platform fee (first month)", included: true},
      {text: "Dedicated account manager", included: true},
    ],
  },
];

export default function SubscriptionPlans() {
  const [billing, setBilling] = useState("monthly");

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-20 relative overflow-hidden">
      {/* Background grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Big faded background text */}
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.02] font-black pointer-events-none select-none whitespace-nowrap"
        style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "18rem"}}>
        BLVCK
      </span>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-3">
            ✦ Choose Your Plan
          </span>
          <h2
            className="text-white font-black leading-none mb-4"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            SUBSCRIPTION <span className="text-red-500">MODEL</span>
          </h2>
          <p className="text-white/35 text-[11px] tracking-[0.2em] uppercase mb-8">
            Flexible plans for buyers and sellers of all levels
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center border border-white/15 p-1 relative">
            {["monthly", "annual"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative px-6 py-2 text-[10px] font-black tracking-[0.25em] uppercase transition-colors duration-200 ${
                  billing === b ? "text-black" : "text-white/40 hover:text-white"
                }`}>
                {billing === b && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 bg-white"
                    transition={{type: "spring", stiffness: 400, damping: 35}}
                  />
                )}
                <span className="relative z-10">{b}</span>
              </button>
            ))}
            {/* Save badge */}
            <div className="absolute -top-3 right-0 bg-red-500 px-2 py-0.5">
              <span className="text-white text-[8px] font-black tracking-[0.2em] uppercase">
                Save 25%
              </span>
            </div>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const price = billing === "monthly" ? plan.monthly : plan.annual;

            return (
              <motion.div
                key={plan.id}
                initial={{opacity: 0, y: 30}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, margin: "-40px"}}
                transition={{duration: 0.5, delay: i * 0.1}}
                className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 ${
                  plan.popular
                    ? "border-red-500/60 bg-[#0f0f0f] scale-[1.03] shadow-2xl shadow-red-500/10"
                    : "border-white/10 bg-[#0d0d0d] hover:border-white/25"
                }`}>
                {/* Popular ribbon */}
                {plan.popular && (
                  <div className="bg-red-500 text-white text-[9px] font-black tracking-[0.3em] uppercase text-center py-1.5">
                    ✦ MOST POPULAR
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  {/* Icon + tier tag */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.popular ? "bg-red-500/20 text-red-500" : "bg-white/5 text-white/50"
                      }`}>
                      {plan.icon}
                    </div>
                    <span
                      className={`text-[9px] font-black tracking-[0.25em] uppercase px-3 py-1 border rounded-full ${
                        plan.popular
                          ? "border-red-500/40 text-red-500"
                          : "border-white/10 text-white/30"
                      }`}>
                      {plan.tag}
                    </span>
                  </div>

                  {/* Plan name */}
                  <h3
                    className={`font-black leading-none mb-1 ${plan.popular ? "text-red-500" : "text-white"}`}
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.6rem",
                      letterSpacing: "0.06em",
                    }}>
                    {plan.tier}
                  </h3>
                  <p className="text-white/35 text-[11px] tracking-wide mb-5">{plan.tagline}</p>

                  {/* Price */}
                  <div className="flex items-end gap-1 mb-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={price}
                        initial={{opacity: 0, y: 8}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -8}}
                        transition={{duration: 0.2}}
                        className="text-white font-black leading-none"
                        style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "3.2rem"}}>
                        {plan.free ? "FREE" : `$${price}`}
                      </motion.span>
                    </AnimatePresence>
                    {!plan.free && (
                      <span className="text-white/30 text-[11px] tracking-widest uppercase mb-2">
                        /mo
                      </span>
                    )}
                  </div>

                  {billing === "annual" && !plan.free && (
                    <p className="text-white/30 text-[10px] tracking-wide mb-5">
                      Billed annually — ${plan.annual * 12}/yr
                    </p>
                  )}

                  {/* Divider */}
                  <div className={`h-px mb-5 ${plan.popular ? "bg-red-500/20" : "bg-white/8"}`} />

                  {/* Features */}
                  <ul className="flex flex-col gap-3 flex-1 mb-7">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                            f.included
                              ? plan.popular
                                ? "bg-red-500"
                                : "bg-white/15"
                              : "bg-white/5"
                          }`}>
                          {f.included ? (
                            <svg
                              className={`w-2.5 h-2.5 ${plan.popular ? "text-white" : "text-white/70"}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-2 h-2 text-white/15"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-[12px] leading-snug tracking-wide ${
                            f.included ? "text-white/70" : "text-white/20 line-through"
                          }`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    to={plan.ctaLink}
                    className={`group relative overflow-hidden flex items-center justify-center gap-2 py-3.5 text-[11px] font-black tracking-[0.25em] uppercase transition-all duration-300 ${
                      plan.popular
                        ? "bg-red-500 text-white hover:bg-white hover:text-black"
                        : "border border-white/20 text-white/60 hover:text-white hover:border-white/50"
                    }`}>
                    {!plan.popular && (
                      <span className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                    )}
                    <span className="relative">{plan.cta}</span>
                    <svg
                      className="relative w-3 h-3 group-hover:translate-x-1 transition-transform duration-200"
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

                  {/* Limited time note */}
                  {plan.popular && (
                    <p className="text-center text-white/25 text-[9px] tracking-[0.2em] uppercase mt-3">
                      — Limited time offer —
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="text-center text-white/20 text-[10px] tracking-[0.2em] uppercase mt-10">
          All plans include SSL security · Cancel anytime · No hidden fees
        </p>
      </div>
    </section>
  );
}
