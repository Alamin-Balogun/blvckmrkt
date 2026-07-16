import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";
import {useHomeContent} from "./homecontentcontext";
import {useCurrency} from "../../../components/currencycontext";

// ── Lucide icon map ───────────────────────────────────────────────────────────
import {
  User, Star, Store, Package, Zap, Crown, Shield, Gift, Gem, Rocket,
  ShoppingBag, Tag, TrendingUp, BarChart2, Layout, Globe, Layers, Box,
  Award, Bell, Bookmark, Briefcase, Camera, Check, Circle, Cpu,
  Database, DollarSign, Edit, Eye, Flag, Folder, Heart, Home,
  Image, Key, Link as LinkIcon, Lock, Mail, Map, MessageSquare,
  Monitor, Music, Phone, PieChart, Play, Plus, Printer, Radio,
  Search, Send, Settings, Share2, ShoppingCart, Sliders, Smile,
  Sparkles, Target, Truck, Unlock, Upload, Users, Video, Wifi,
  Wrench, Feather, Coffee, Hash,
} from "lucide-react";

export const ICON_MAP = {
  user: User, star: Star, store: Store, package: Package, zap: Zap,
  crown: Crown, shield: Shield, gift: Gift, gem: Gem, rocket: Rocket,
  shopping_bag: ShoppingBag, tag: Tag, trending_up: TrendingUp,
  bar_chart: BarChart2, layout: Layout, globe: Globe, layers: Layers,
  box: Box, award: Award, bell: Bell, bookmark: Bookmark,
  briefcase: Briefcase, camera: Camera, check: Check, circle: Circle,
  cpu: Cpu, database: Database, dollar: DollarSign, edit: Edit,
  eye: Eye, flag: Flag, folder: Folder, heart: Heart, home: Home,
  image: Image, key: Key, link: LinkIcon, lock: Lock, mail: Mail,
  map: Map, message: MessageSquare, monitor: Monitor, music: Music,
  phone: Phone, pie_chart: PieChart, play: Play, plus: Plus,
  printer: Printer, radio: Radio, search: Search, send: Send,
  settings: Settings, share: Share2, cart: ShoppingCart,
  sliders: Sliders, smile: Smile, sparkles: Sparkles, target: Target,
  truck: Truck, unlock: Unlock, upload: Upload, users: Users,
  video: Video, wifi: Wifi, wrench: Wrench, feather: Feather,
  coffee: Coffee, hash: Hash,
};

function PlanIcon({name, className = "w-6 h-6 sm:w-7 sm:h-7"}) {
  const Component = ICON_MAP[name] || User;
  return <Component className={className} strokeWidth={1.5} />;
}

// ── Color schemes per plan type ───────────────────────────────────────────────
function getPlanTheme(plan) {
  if (plan.is_popular) {
    return {
      border:      "border-red-500/60",
      accentText:  "text-red-500",
      iconBg:      "bg-red-500/20",
      iconText:    "text-red-500",
      badgeBorder: "border-red-500/40",
      badgeText:   "text-red-500",
      divider:     "bg-red-500/20",
      dotBg:       "bg-red-500",
      dotText:     "text-white",
      cta:         "bg-red-500 text-white hover:bg-white hover:text-black",
      scale:       "md:scale-[1.03]",
      shadow:      "md:shadow-2xl md:shadow-red-500/10",
      popularBar:  true,
      showTypeBadge: false,
    };
  }
  if (plan.plan_type === "brand") {
    return {
      border:      "border-amber-500/30",
      accentText:  "text-amber-400",
      iconBg:      "bg-amber-500/10",
      iconText:    "text-amber-400",
      badgeBorder: "border-amber-500/25",
      badgeText:   "text-amber-400",
      divider:     "bg-amber-500/15",
      dotBg:       "bg-amber-500",
      dotText:     "text-black",
      cta:         "border border-amber-500/30 text-amber-400/70 hover:text-amber-400 hover:border-amber-500/60",
      scale:       "",
      shadow:      "",
      popularBar:  false,
      showTypeBadge: true,
    };
  }
  if (plan.plan_type === "buyer") {
    return {
      border:      "border-blue-500/25",
      accentText:  "text-blue-400",
      iconBg:      "bg-blue-500/10",
      iconText:    "text-blue-400",
      badgeBorder: "border-blue-500/20",
      badgeText:   "text-blue-400",
      divider:     "bg-blue-500/15",
      dotBg:       "bg-blue-500",
      dotText:     "text-white",
      cta:         "border border-white/20 text-white/60 hover:text-white hover:border-white/50",
      scale:       "",
      shadow:      "",
      popularBar:  false,
      showTypeBadge: true,
    };
  }
  return {
    border:      "border-white/10",
    accentText:  "text-white",
    iconBg:      "bg-white/5",
    iconText:    "text-white/50",
    badgeBorder: "border-white/10",
    badgeText:   "text-white/30",
    divider:     "bg-white/8",
    dotBg:       "bg-white/15",
    dotText:     "text-white/70",
    cta:         "border border-white/20 text-white/60 hover:text-white hover:border-white/50",
    scale:       "",
    shadow:      "",
    popularBar:  false,
    showTypeBadge: false,
  };
}

// ── Ensure popular plan is always in the middle slot ─────────────────────────
function positionPlans(plans) {
  if (plans.length !== 3) return plans;
  const popIdx = plans.findIndex((p) => p.is_popular);
  if (popIdx === 1 || popIdx === -1) return plans;
  const reordered = [...plans];
  const [popped] = reordered.splice(popIdx, 1);
  reordered.splice(1, 0, popped);
  return reordered;
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function PlanSkeleton() {
  return (
    <div className="rounded-xl md:rounded-2xl overflow-hidden border border-white/8 bg-[#0d0d0d] animate-pulse">
      <div className="p-5 sm:p-6 md:p-7 flex flex-col gap-3 md:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg md:rounded-xl bg-white/5" />
        <div className="h-4 md:h-5 w-1/3 bg-white/5 rounded" />
        <div className="h-3 w-2/3 bg-white/5 rounded" />
        <div className="h-8 md:h-10 w-1/2 bg-white/5 rounded" />
        <div className="h-px bg-white/5" />
        {Array.from({length: 5}).map((_, i) => (
          <div key={i} className="h-3 bg-white/5 rounded" style={{width: `${70 + i * 4}%`}} />
        ))}
        <div className="h-10 md:h-11 mt-2 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SubscriptionPlans() {
  const [billing, setBilling] = useState("monthly");
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);

  const {fmtMoney, baseCurrency} = useCurrency();

  // ── CMS text via homecontentcontext ────────────────────────────────────────
  const sectionTag      = useHomeContent("plans_section_tag",      "✦ Choose Your Plan");
  const sectionTitle    = useHomeContent("plans_section_title",    "SUBSCRIPTION MODEL");
  const sectionSubtitle = useHomeContent("plans_section_subtitle", "Flexible plans for buyers and sellers of all levels");
  const saveBadge       = useHomeContent("plans_save_badge",       "Save 25%");
  const footerNote      = useHomeContent("plans_footer_note",      "All plans include SSL security · Cancel anytime · No hidden fees");

  const titleParts = sectionTitle.split(" ");
  const redWord    = titleParts.pop();
  const mainTitle  = titleParts.join(" ");

  // ── Fetch plans from API ────────────────────────────────────────────────────
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";
    let cancelled = false;
    fetch(`${API_BASE}/api/subscription-plans`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          const raw = json?.data?.plans ?? json?.plans ?? [];
          setPlans(raw);
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayPlans = positionPlans(plans);

  // ── Trial label (e.g. "1 month free", "7 days free") ──────────────────────
  function trialLabel(plan) {
    const d = plan.trial_days;
    if (!d || d <= 0) return null;
    if (d >= 365) {
      const yrs = Math.round(d / 365);
      return `${yrs} year${yrs > 1 ? "s" : ""} free`;
    }
    if (d >= 30) {
      const mos = Math.round(d / 30);
      return `${mos} month${mos > 1 ? "s" : ""} free`;
    }
    return `${d} day${d > 1 ? "s" : ""} free`;
  }

  // ── Price display with currency conversion ─────────────────────────────────
  function displayPrice(plan) {
    const isFree = plan.monthly_price === 0 && plan.annual_price === 0;
    if (isFree) return { main: "FREE", sub: null };

    if (billing === "annual" && plan.annual_price > 0) {
      const perMonth = plan.annual_price / 12;
      return {
        main: fmtMoney(perMonth, baseCurrency),
        sub: `Billed annually — ${fmtMoney(plan.annual_price, baseCurrency)}/yr`,
      };
    }

    const effectiveAmount = plan.monthly_price > 0 ? plan.monthly_price : 0;
    return {
      main: fmtMoney(effectiveAmount, baseCurrency),
      sub: null,
    };
  }

  return (
    <section className="bg-black border-t border-white/8 px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-20 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Ghost watermark */}
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.02] font-black pointer-events-none select-none whitespace-nowrap hidden sm:block"
        style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(8rem, 20vw, 18rem)"}}>
        BLVCK
      </span>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ── Section header ─────────────────────────────────────────────────── */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <span className="text-red-500 text-[9px] sm:text-[10px] font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase block mb-2 sm:mb-3">
            {sectionTag}
          </span>
          <h2
            className="text-white font-black leading-none mb-3 sm:mb-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.04em",
            }}>
            {mainTitle} <span className="text-red-500">{redWord}</span>
          </h2>
          <p className="text-white/35 text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-6 sm:mb-8 px-4">
            {sectionSubtitle}
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center border border-white/15 p-1 relative">
            {["monthly", "annual"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-colors duration-200 ${
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
            <div className="absolute -top-2.5 sm:-top-3 right-0 bg-red-500 px-1.5 sm:px-2 py-0.5">
              <span className="text-white text-[7px] sm:text-[8px] font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                {saveBadge}
              </span>
            </div>
          </div>
        </div>

        {/* ── Plan cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {loading
            ? Array.from({length: 3}).map((_, i) => <PlanSkeleton key={i} />)
            : displayPlans.map((plan, i) => {
                const theme   = getPlanTheme(plan);
                const pricing = displayPrice(plan);
                const features = plan.features
                  ? JSON.parse(plan.features)
                  : [];

                return (
                  <motion.div
                    key={plan.id}
                    initial={{opacity: 0, y: 30}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true, margin: "-40px"}}
                    transition={{duration: 0.5, delay: i * 0.1}}
                    className={`relative flex flex-col rounded-xl md:rounded-2xl overflow-hidden border transition-all duration-300 bg-[#0d0d0d] ${theme.border} ${theme.scale} ${theme.shadow}`}>

                    {/* Popular banner */}
                    {theme.popularBar && (
                      <div className="bg-red-500 text-white text-[8px] sm:text-[9px] font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-center py-1.5 sm:py-2">
                        ✦ MOST POPULAR
                      </div>
                    )}

                    <div className="p-5 sm:p-6 md:p-7 flex flex-col flex-1">
                      {/* Icon + tag row */}
                      <div className="flex items-start justify-between mb-4 sm:mb-5">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg md:rounded-xl flex items-center justify-center ${theme.iconBg} ${theme.iconText}`}>
                          <PlanIcon name={plan.icon_name} />
                        </div>
                        {theme.showTypeBadge && (
                          <span
                            className={`text-[8px] sm:text-[9px] font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase px-2 sm:px-3 py-1 border rounded-full ${theme.badgeBorder} ${theme.badgeText}`}>
                            {plan.tag || (plan.plan_type === "brand" ? "For Sellers" : "For Buyers")}
                          </span>
                        )}
                      </div>

                      {/* Plan name */}
                      <h3
                        className={`font-black leading-none mb-1 ${theme.accentText} text-2xl sm:text-3xl md:text-[1.6rem]`}
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          letterSpacing: "0.06em",
                        }}>
                        {plan.name}
                      </h3>

                      {/* Tagline */}
                      <p className="text-white/35 text-[10px] sm:text-[11px] tracking-wide mb-4 sm:mb-5">
                        {plan.tagline || plan.description}
                      </p>

                      {/* Price */}
                      <div className="flex items-end gap-1 mb-1">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={billing + plan.id}
                            initial={{opacity: 0, y: 8}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -8}}
                            transition={{duration: 0.2}}
                            className="text-white font-black leading-none text-5xl sm:text-6xl md:text-[3.2rem]"
                            style={{fontFamily: "'Bebas Neue', sans-serif"}}>
                            {pricing.main}
                          </motion.span>
                        </AnimatePresence>
                        {plan.monthly_price > 0 && (
                          <span className="text-white/30 text-[10px] sm:text-[11px] tracking-widest uppercase mb-1.5 sm:mb-2">
                            /mo
                          </span>
                        )}
                      </div>
                      {pricing.sub && (
                        <p className="text-white/30 text-[9px] sm:text-[10px] tracking-wide mb-2">
                          {pricing.sub}
                        </p>
                      )}
                      {/* Free trial badge */}
                      {trialLabel(plan) && (
                        <div className="flex items-center gap-1.5 mb-4 sm:mb-5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                          <span className="text-green-400 text-[9px] sm:text-[10px] font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                            {trialLabel(plan)} then {plan.monthly_price > 0 ? pricing.main + "/mo" : "free"}
                          </span>
                        </div>
                      )}
                      {!trialLabel(plan) && !pricing.sub && <div className="mb-4 sm:mb-5" />}

                      {/* Divider */}
                      <div className={`h-px mb-4 sm:mb-5 ${theme.divider}`} />

                      {/* Features */}
                      <ul className="flex flex-col gap-2.5 sm:gap-3 flex-1 mb-5 sm:mb-6 md:mb-7">
                        {features.map((f, j) => (
                          <li key={j} className="flex items-center gap-2.5 sm:gap-3">
                            <div
                              className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center ${
                                f.included
                                  ? plan.is_popular
                                    ? "bg-red-500"
                                    : plan.plan_type === "brand"
                                      ? "bg-amber-500/30"
                                      : plan.plan_type === "buyer"
                                        ? "bg-blue-500/20"
                                        : "bg-white/15"
                                  : "bg-white/5"
                              }`}>
                              {f.included ? (
                                <svg
                                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${
                                    plan.is_popular ? "text-white"
                                    : plan.plan_type === "brand" ? "text-amber-400"
                                    : plan.plan_type === "buyer" ? "text-blue-400"
                                    : "text-white/70"
                                  }`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-[11px] sm:text-[12px] leading-snug tracking-wide ${
                                f.included ? "text-white/70" : "text-white/20 line-through"
                              }`}>
                              {f.text}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA button */}
                      <Link
                        to={plan.cta_link || (plan.plan_type === "brand" ? "/register?plan=" + plan.slug : "/register")}
                        className={`group relative overflow-hidden flex items-center justify-center gap-2 py-3 sm:py-3.5 text-[10px] sm:text-[11px] font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-all duration-300 ${theme.cta}`}>
                        {!plan.is_popular && (
                          <span className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                        )}
                        <span className="relative">{plan.cta_text || "Get Started"}</span>
                        <svg
                          className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-1 transition-transform duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      {plan.is_popular && (
                        <p className="text-center text-white/25 text-[8px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-2.5 sm:mt-3">
                          — Limited time offer —
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-8 sm:mt-10 px-4">
          {footerNote}
        </p>
      </div>
    </section>
  );
}