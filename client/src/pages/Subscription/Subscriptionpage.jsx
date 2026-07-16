import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import {useCurrency} from "../../components/currencycontext";

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

function PlanIcon({name}) {
  const Component = ICON_MAP[name] || User;
  return <Component className="plan-icon" strokeWidth={1.5} />;
}

function getPlanTheme(plan, isTrial) {
  if (plan.is_popular) {
    return {
      border: "rgba(239,68,68,0.5)",
      iconBg: "rgba(239,68,68,0.15)",
      iconColor: "#ef4444",
      badgeBorder: "rgba(239,68,68,0.35)",
      badgeColor: "#ef4444",
      titleColor: "#ef4444",
      dividerBg: "rgba(239,68,68,0.15)",
      checkBg: "#ef4444",
      checkColor: "#fff",
      ctaBg: "#ef4444",
      ctaColor: "#fff",
      ctaHoverBg: "#dc2626",
      ctaBorder: "none",
    };
  }
  if (isTrial) {
    return {
      border: "rgba(34,197,94,0.3)",
      iconBg: "rgba(34,197,94,0.1)",
      iconColor: "#22c55e",
      badgeBorder: "rgba(34,197,94,0.3)",
      badgeColor: "#22c55e",
      titleColor: "#fff",
      dividerBg: "rgba(255,255,255,0.07)",
      checkBg: "rgba(255,255,255,0.12)",
      checkColor: "rgba(255,255,255,0.65)",
      ctaBg: "rgba(34,197,94,0.15)",
      ctaColor: "#22c55e",
      ctaHoverBg: "rgba(34,197,94,0.25)",
      ctaHoverColor: "#4ade80",
      ctaBorder: "1px solid rgba(34,197,94,0.3)",
    };
  }
  if (plan.plan_type === "brand") {
    return {
      border: "rgba(245,158,11,0.3)",
      iconBg: "rgba(245,158,11,0.1)",
      iconColor: "#f59e0b",
      badgeBorder: "rgba(245,158,11,0.3)",
      badgeColor: "#f59e0b",
      titleColor: "#f59e0b",
      dividerBg: "rgba(245,158,11,0.15)",
      checkBg: "rgba(245,158,11,0.25)",
      checkColor: "#fbbf24",
      ctaBg: "rgba(245,158,11,0.12)",
      ctaColor: "#fbbf24",
      ctaHoverBg: "rgba(245,158,11,0.2)",
      ctaHoverColor: "#fcd34d",
      ctaBorder: "1px solid rgba(245,158,11,0.25)",
    };
  }
  if (plan.plan_type === "buyer") {
    return {
      border: "rgba(59,130,246,0.25)",
      iconBg: "rgba(59,130,246,0.1)",
      iconColor: "#3b82f6",
      badgeBorder: "rgba(59,130,246,0.3)",
      badgeColor: "#3b82f6",
      titleColor: "#3b82f6",
      dividerBg: "rgba(59,130,246,0.15)",
      checkBg: "rgba(59,130,246,0.2)",
      checkColor: "#60a5fa",
      ctaBg: "rgba(59,130,246,0.12)",
      ctaColor: "#60a5fa",
      ctaHoverBg: "rgba(59,130,246,0.2)",
      ctaHoverColor: "#93c5fd",
      ctaBorder: "1px solid rgba(59,130,246,0.25)",
    };
  }
  return {
    border: "rgba(255,255,255,0.08)",
    iconBg: "rgba(255,255,255,0.05)",
    iconColor: "rgba(255,255,255,0.45)",
    badgeBorder: "rgba(255,255,255,0.1)",
    badgeColor: "rgba(255,255,255,0.3)",
    titleColor: "#fff",
    dividerBg: "rgba(255,255,255,0.07)",
    checkBg: "rgba(255,255,255,0.12)",
    checkColor: "rgba(255,255,255,0.65)",
    ctaBg: "rgba(255,255,255,0.06)",
    ctaColor: "rgba(255,255,255,0.55)",
    ctaHoverBg: "rgba(255,255,255,0.1)",
    ctaHoverColor: "#fff",
    ctaBorder: "1px solid rgba(255,255,255,0.1)",
  };
}

function positionPlans(plans) {
  if (plans.length !== 3) return plans;
  const popIdx = plans.findIndex((p) => p.is_popular);
  if (popIdx === 1 || popIdx === -1) return plans;
  const reordered = [...plans];
  const [popped] = reordered.splice(popIdx, 1);
  reordered.splice(1, 0, popped);
  return reordered;
}

function trialLabel(trialDays) {
  if (!trialDays || trialDays <= 0) return null;
  if (trialDays >= 365) {
    const yrs = Math.round(trialDays / 365);
    return `${yrs} year${yrs > 1 ? "s" : ""} free`;
  }
  if (trialDays >= 30) {
    const mos = Math.round(trialDays / 30);
    return `${mos} month${mos > 1 ? "s" : ""} free`;
  }
  return `${trialDays} day${trialDays > 1 ? "s" : ""} free`;
}

export default function SubscriptionPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const searchParams       = new URLSearchParams(location.search);
  const fromUpgrade        = searchParams.get("fromUpgrade") === "true" || location.state?.fromUpgrade === true;
  const brandNameFromState = searchParams.get("brandName") 
    ? decodeURIComponent(searchParams.get("brandName")) 
    : (location.state?.brandName ?? "");

  const [billing, setBilling]   = useState("monthly");
  const [selecting, setSelecting] = useState(null);
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const {fmtMoney, baseCurrency} = useCurrency();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription-plans")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          const raw = json?.data?.plans || [];
          setPlans(raw);
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayPlans = positionPlans(plans);

  function displayPrice(plan) {
    const isFree = plan.monthly_price === 0 && plan.annual_price === 0;
    if (isFree) return { main: "FREE", sub: null, isTrial: false };

    const isTrial = plan.trial_days > 0;

    if (isTrial) {
      return {
        main: "FREE",
        sub: null,
        isTrial: true,
        strikethrough: fmtMoney(plan.monthly_price, baseCurrency),
      };
    }

    if (billing === "annual" && plan.annual_price > 0) {
      const perMonth = plan.annual_price / 12;
      return {
        main: fmtMoney(perMonth, baseCurrency),
        sub: `Billed annually — ${fmtMoney(plan.annual_price, baseCurrency)}/yr`,
        isTrial: false,
        strikethrough: null,
      };
    }

    return {
      main: fmtMoney(plan.monthly_price, baseCurrency),
      sub: null,
      isTrial: false,
      strikethrough: null,
    };
  }

  const handleSelect = (plan) => {
    setSelecting(plan.id);
    const price = billing === "monthly" ? plan.monthly_price : plan.annual_price;
    const isTrial = plan.trial_days > 0;
    const displayPriceValue = isTrial ? 0 : price;

    const planData = {
      id: plan.id,
      slug: plan.slug,
      tier: plan.name,
      price,
      displayPrice: displayPriceValue,
      billing,
      tagline: plan.tagline || plan.description,
      isTrial,
      trialNote: isTrial
        ? trialLabel(plan.trial_days) + ` · then ${fmtMoney(plan.monthly_price, baseCurrency)}/mo`
        : null,
    };

    setTimeout(() => {
      const brandName =
        brandNameFromState ||
        localStorage.getItem("brand_name") ||
        (() => {
          try {
            const u = JSON.parse(
              localStorage.getItem("user") ||
              sessionStorage.getItem("user") ||
              "{}"
            );
            return u?.brand_name || "";
          } catch {
            return "";
          }
        })();

      navigate("/brand-partnership-agreement", {
        state: {
          plan: planData,
          brandName,
          fromUpgrade,
        },
      });
    }, 350);
  };

  return (
    <div className="subscription-page">
      {/* Background */}
      <div className="bg-fixed">
        <div className="bg-grid" />
        <span className="bg-watermark">BLVCKMRKT</span>
        <div className="bg-glow" />
      </div>

      <div className="container">
        {/* Back button */}
        {fromUpgrade ? (
          <button
            onClick={() => navigate("/upgrade-to-brand")}
            className="back-btn"
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Brand Setup
          </button>
        ) : (
          <Link
            to="/"
            className="back-link"
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to site
          </Link>
        )}

        {/* Header */}
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5}}
          className="header">
          <span className="header-tag">
            {fromUpgrade ? "✦ Almost There — Pick Your Plan" : "✦ Your Account Is Ready"}
          </span>
          <h1 className="header-title">
            PICK YOUR <span style={{color: "#ef4444"}}>PLAN</span>
          </h1>
          <p className="header-subtitle">
            {fromUpgrade
              ? `Choose a plan for ${brandNameFromState || "your brand"}. You'll sign the partnership agreement next.`
              : "Unlock the full BLVCKMRKT experience. Upgrade or downgrade at any time."}
          </p>

          {/* Progress indicator */}
          {fromUpgrade && (
            <div className="progress-wrapper">
              {[
                { num: "01", label: "Brand Info", done: true },
                { num: "02", label: "Pick Plan",  done: false, active: true },
                { num: "03", label: "Agreement",  done: false },
                { num: "04", label: "Payment",    done: false },
              ].map((s, i) => (
                <div key={i} className="progress-item-wrapper">
                  <div className="progress-item" style={{opacity: s.done || s.active ? 1 : 0.35}}>
                    <span className="progress-num" style={{
                      color: s.done ? "#22c55e" : s.active ? "#ef4444" : "rgba(255,255,255,0.3)",
                      background: s.done ? "rgba(34,197,94,0.1)" : s.active ? "rgba(239,68,68,0.1)" : "transparent",
                      border: `1px solid ${s.done ? "rgba(34,197,94,0.3)" : s.active ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                    }}>
                      {s.done ? "✓" : s.num}
                    </span>
                    <span className="progress-label" style={{
                      color: s.done ? "#22c55e" : s.active ? "#fff" : "rgba(255,255,255,0.25)",
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && <div className="progress-line" style={{background: s.done ? "#22c55e" : "rgba(255,255,255,0.1)"}} />}
                </div>
              ))}
            </div>
          )}

          {/* Billing toggle */}
          <div className="billing-toggle">
            {["monthly", "annual"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className="billing-btn"
                style={{color: billing === b ? "#000" : "rgba(255,255,255,0.35)"}}>
                {billing === b && (
                  <motion.span
                    layoutId="sub-billing-bg"
                    className="billing-bg"
                    transition={{type: "spring", stiffness: 400, damping: 35}}
                  />
                )}
                {b}
              </button>
            ))}
            <div className="billing-badge">
              <span className="billing-badge-text">Save 25%</span>
            </div>
          </div>
        </motion.div>

        {/* Plans grid */}
        {loading ? (
          <div className="plans-grid">
            {Array.from({length: 3}).map((_, i) => (
              <div key={i} className="plan-skeleton">
                <div className="skeleton-content">
                  <div className="skeleton-icon" />
                  <div className="skeleton-line" style={{width: "40%"}} />
                  <div className="skeleton-line" style={{width: "60%"}} />
                  <div className="skeleton-line" style={{width: "50%", height: 40}} />
                  <div className="skeleton-divider" />
                  {Array.from({length: 5}).map((_, j) => (
                    <div key={j} className="skeleton-line" style={{width: `${70 + j * 4}%`}} />
                  ))}
                  <div className="skeleton-line" style={{height: 44, marginTop: 8}} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="plans-grid">
            {displayPlans.map((plan, i) => {
              const pricing    = displayPrice(plan);
              const isSelecting = selecting === plan.id;
              const features   = plan.features ? JSON.parse(plan.features) : [];
              const theme      = getPlanTheme(plan, pricing.isTrial);

              return (
                <motion.div
                  key={plan.id}
                  initial={{opacity: 0, y: 30}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.5, delay: i * 0.1}}
                  className={`plan-card ${plan.is_popular ? "plan-popular" : ""}`}
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: plan.is_popular ? "#0f0f0f" : "#0d0d0d",
                  }}>

                  {plan.is_popular && (
                    <div className="plan-banner popular-banner">
                      ✦ MOST POPULAR
                    </div>
                  )}
                  {pricing.isTrial && (
                    <div className="plan-banner trial-banner">
                      🎁 {trialLabel(plan.trial_days)?.toUpperCase()} TRIAL
                    </div>
                  )}

                  <div className="plan-content">
                    {/* Icon + tag */}
                    <div className="plan-header">
                      <div className="plan-icon-wrapper" style={{background: theme.iconBg, color: theme.iconColor}}>
                        <PlanIcon name={plan.icon_name} />
                      </div>
                      <span className="plan-tag" style={{
                        border: `1px solid ${theme.badgeBorder}`,
                        color: theme.badgeColor,
                      }}>
                        {plan.tag || (plan.plan_type === "brand" ? "For Sellers" : plan.plan_type === "buyer" ? "For Buyers" : "Try Free")}
                      </span>
                    </div>

                    <h3 className="plan-name" style={{color: theme.titleColor}}>
                      {plan.name}
                    </h3>
                    <p className="plan-tagline">
                      {plan.tagline || plan.description}
                    </p>

                    {/* Price */}
                    <div className="plan-price-wrapper">
                      <AnimatePresence mode="wait">
                        {pricing.isTrial ? (
                          <motion.div
                            key="trial-price"
                            initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -8}} transition={{duration: 0.2}}
                            className="trial-price">
                            <span className="trial-price-main">{pricing.main}</span>
                            {pricing.strikethrough && (
                              <span className="trial-price-strike">{pricing.strikethrough}</span>
                            )}
                          </motion.div>
                        ) : (
                          <motion.span
                            key={billing + plan.id}
                            initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -8}} transition={{duration: 0.2}}
                            className="plan-price">
                            {pricing.main}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!pricing.isTrial && plan.monthly_price > 0 && (
                        <span className="plan-price-suffix">/mo</span>
                      )}
                    </div>

                    {pricing.isTrial ? (
                      <p className="trial-note">
                        {trialLabel(plan.trial_days)} · then {fmtMoney(plan.monthly_price, baseCurrency)}/mo
                        {billing === "annual" && plan.annual_price > 0
                          ? ` (or ${fmtMoney(plan.annual_price, baseCurrency)}/mo billed annually)`
                          : ""}
                      </p>
                    ) : pricing.sub ? (
                      <p className="plan-sub">{pricing.sub}</p>
                    ) : (
                      <div style={{marginBottom: 20}} />
                    )}

                    <div className="plan-divider" style={{background: theme.dividerBg}} />

                    {/* Features */}
                    <ul className="plan-features">
                      {features.map((f, j) => (
                        <li key={j} className="feature-item">
                          <div className="feature-check" style={{
                            background: f.included ? theme.checkBg : "rgba(255,255,255,0.04)",
                          }}>
                            {f.included ? (
                              <svg width="10" height="10" fill="none" stroke={theme.checkColor} strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg width="8" height="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                          <span className={`feature-text ${f.included ? "" : "feature-disabled"}`}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <motion.button
                      onClick={() => handleSelect(plan)}
                      whileTap={{scale: 0.97}}
                      className="plan-cta"
                      style={{
                        border: theme.ctaBorder,
                        background: theme.ctaBg,
                        color: theme.ctaColor,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = theme.ctaHoverBg;
                        e.currentTarget.style.color = theme.ctaHoverColor || "#fff";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = theme.ctaBg;
                        e.currentTarget.style.color = theme.ctaColor;
                      }}>
                      {isSelecting && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" className="spinner">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                        </svg>
                      )}
                      {isSelecting ? "Loading..." : (plan.cta_text || "Get Started") + " →"}
                    </motion.button>

                    {pricing.isTrial && (
                      <p className="plan-footer trial-footer">
                        — No charge until next month —
                      </p>
                    )}
                    {plan.is_popular && (
                      <p className="plan-footer popular-footer">
                        — Limited time offer —
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Skip section */}
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{delay: 0.6}}
          className="skip-section">
          <p className="skip-text">
            {fromUpgrade
              ? "You can always pick a plan later from your brand dashboard."
              : "Not ready to commit? Explore first, upgrade later."}
          </p>
          <button
            onClick={() => navigate(fromUpgrade ? "/dashboard/brand" : "/")}
            className="skip-btn"
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}>
            {fromUpgrade ? "Skip for Now →" : "Explore BLVCKMRKT Free →"}
          </button>
          <p className="skip-note">
            You can upgrade anytime from your account
          </p>
        </motion.div>

        <p className="footer-note">
          All plans · SSL security · Cancel anytime · No hidden fees
        </p>
      </div>

      <style>{`
        .subscription-page {
          min-height: 100vh;
          background: #050505;
          font-family: system-ui, sans-serif;
          overflow-x: hidden;
        }

        .bg-fixed {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          opacity: 0.025;
          background-image: linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),
                            linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px);
          background-size: 60px 60px;
        }

        .bg-watermark {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
          font-family: 'Bebas Neue',sans-serif;
          font-size: clamp(8rem,22vw,20rem);
          color: rgba(255,255,255,0.016);
          font-weight: 900;
          white-space: nowrap;
          user-select: none;
        }

        .bg-glow {
          position: absolute;
          top: -10%;
          right: -5%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle,rgba(239,68,68,0.06) 0%,transparent 70%);
        }

        .container {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 80px;
        }

        .back-btn, .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          background: none;
          border: none;
          cursor: pointer;
          margin-bottom: 52px;
          transition: color 0.2s;
          padding: 0;
          text-decoration: none;
        }

        .header {
          text-align: center;
          margin-bottom: 52px;
        }

        .header-tag {
          color: #ef4444;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 12px;
        }

        .header-title {
          font-family: 'Bebas Neue',sans-serif;
          font-size: clamp(2.4rem,6vw,4.5rem);
          color: #fff;
          letter-spacing: 0.04em;
          line-height: 1;
          margin-bottom: 12px;
        }

        .header-subtitle {
          color: rgba(255,255,255,0.35);
          font-size: 13px;
          max-width: 440px;
          margin: 0 auto 32px;
          line-height: 1.7;
          padding: 0 16px;
        }

        .progress-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 32px;
          flex-wrap: wrap;
          padding: 0 16px;
        }

        .progress-item-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .progress-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .progress-num {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          padding: 2px 6px;
        }

        .progress-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .progress-line {
          width: 20px;
          height: 1px;
        }

        .billing-toggle {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(255,255,255,0.12);
          padding: 4px;
          position: relative;
          border-radius: 6px;
        }

        .billing-btn {
          position: relative;
          padding: 8px 22px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          background: transparent;
          transition: color 0.2s;
          z-index: 1;
        }

        .billing-bg {
          position: absolute;
          inset: 0;
          background: #fff;
          z-index: -1;
          border-radius: 3px;
        }

        .billing-badge {
          position: absolute;
          top: -10px;
          right: -2px;
          background: #ef4444;
          padding: 2px 7px;
          border-radius: 3px;
        }

        .billing-badge-text {
          color: #fff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 16px;
        }

        .plan-skeleton {
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: #0d0d0d;
          padding: 28px;
        }

        .skeleton-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skeleton-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
        }

        .skeleton-line {
          height: 20px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }

        .skeleton-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
        }

        .plan-card {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          overflow: hidden;
          transform: scale(1);
        }

        .plan-popular {
          transform: scale(1.03);
          box-shadow: 0 0 60px rgba(239,68,68,0.08);
        }

        .plan-banner {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          text-align: center;
          padding: 8px 0;
        }

        .popular-banner {
          background: #ef4444;
          color: #fff;
        }

        .trial-banner {
          background: rgba(34,197,94,0.15);
          border-bottom: 1px solid rgba(34,197,94,0.2);
          color: #22c55e;
          font-size: 9px;
          letter-spacing: 0.25em;
          padding: 7px 0;
        }

        .plan-content {
          padding: 28px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .plan-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 8px;
        }

        .plan-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .plan-icon {
          width: 28px;
          height: 28px;
        }

        .plan-tag {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 99px;
          white-space: nowrap;
        }

        .plan-name {
          font-family: 'Bebas Neue',sans-serif;
          font-size: 1.7rem;
          letter-spacing: 0.06em;
          margin: 0 0 4px;
          line-height: 1;
        }

        .plan-tagline {
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
        }

        .plan-price-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          margin-bottom: 4px;
        }

        .trial-price {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .trial-price-main {
          font-family: 'Bebas Neue',sans-serif;
          font-size: 3.2rem;
          color: #22c55e;
          line-height: 1;
        }

        .trial-price-strike {
          font-family: 'Bebas Neue',sans-serif;
          font-size: 1.4rem;
          color: rgba(255,255,255,0.2);
          line-height: 1;
          text-decoration: line-through;
        }

        .plan-price {
          font-family: 'Bebas Neue',sans-serif;
          font-size: 3.2rem;
          color: #fff;
          line-height: 1;
        }

        .plan-price-suffix {
          color: rgba(255,255,255,0.28);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .trial-note {
          color: #22c55e;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 20px;
          letter-spacing: 0.05em;
        }

        .plan-sub {
          color: rgba(255,255,255,0.25);
          font-size: 10px;
          margin-bottom: 20px;
        }

        .plan-divider {
          height: 1px;
          margin-bottom: 20px;
        }

        .plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .feature-check {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-text {
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          line-height: 1.4;
        }

        .feature-disabled {
          color: rgba(255,255,255,0.18);
          text-decoration: line-through;
        }

        .plan-cta {
          width: 100%;
          border-radius: 8px;
          padding: 14px 20px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .plan-footer {
          text-align: center;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-top: 10px;
        }

        .trial-footer {
          color: rgba(34,197,94,0.5);
        }

        .popular-footer {
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.2em;
        }

        .skip-section {
          text-align: center;
          margin-top: 48px;
          padding-top: 36px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .skip-text {
          color: rgba(255,255,255,0.2);
          font-size: 12px;
          margin-bottom: 14px;
        }

        .skip-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 12px 32px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .skip-note {
          color: rgba(255,255,255,0.1);
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-top: 10px;
        }

        .footer-note {
          text-align: center;
          color: rgba(255,255,255,0.1);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-top: 28px;
        }

        .spinner {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive styles */
        @media (max-width: 1024px) {
          .plans-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .plan-popular {
            transform: scale(1);
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 40px 16px 60px;
          }

          .back-btn, .back-link {
            font-size: 10px;
            margin-bottom: 32px;
          }

          .header {
            margin-bottom: 40px;
          }

          .header-tag {
            font-size: 9px;
            letter-spacing: 0.3em;
          }

          .header-title {
            font-size: clamp(2rem, 8vw, 3rem);
            margin-bottom: 10px;
          }

          .header-subtitle {
            font-size: 12px;
            margin-bottom: 24px;
          }

          .progress-wrapper {
            gap: 6px;
            margin-bottom: 24px;
          }

          .progress-num {
            font-size: 7px;
            padding: 2px 5px;
          }

          .progress-label {
            font-size: 8px;
          }

          .progress-line {
            width: 12px;
          }

          .billing-btn {
            padding: 7px 16px;
            font-size: 9px;
          }

          .billing-badge {
            top: -8px;
            padding: 2px 6px;
          }

          .billing-badge-text {
            font-size: 7px;
          }

          .plans-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .plan-skeleton,
          .plan-content {
            padding: 20px;
          }

          .plan-icon-wrapper {
            width: 40px;
            height: 40px;
          }

          .plan-icon {
            width: 24px;
            height: 24px;
          }

          .plan-tag {
            font-size: 8px;
            padding: 3px 10px;
          }

          .plan-name {
            font-size: 1.5rem;
          }

          .plan-tagline {
            font-size: 10px;
          }

          .trial-price-main,
          .plan-price {
            font-size: 2.5rem;
          }

          .trial-price-strike {
            font-size: 1.2rem;
          }

          .plan-price-suffix {
            font-size: 10px;
          }

          .trial-note,
          .plan-sub {
            font-size: 9px;
          }

          .plan-features {
            gap: 8px;
            margin-bottom: 20px;
          }

          .feature-check {
            width: 14px;
            height: 14px;
          }

          .feature-text {
            font-size: 11px;
          }

          .plan-cta {
            padding: 12px 18px;
            font-size: 10px;
          }

          .plan-banner {
            font-size: 8px;
            letter-spacing: 0.25em;
            padding: 7px 0;
          }

          .skip-section {
            margin-top: 36px;
            padding-top: 28px;
          }

          .skip-text {
            font-size: 11px;
          }

          .skip-btn {
            font-size: 10px;
            padding: 10px 24px;
          }

          .skip-note {
            font-size: 9px;
          }

          .footer-note {
            font-size: 9px;
            padding: 0 16px;
          }

          .bg-watermark {
            font-size: clamp(6rem, 18vw, 12rem);
          }

          .bg-glow {
            width: 300px;
            height: 300px;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 32px 12px 48px;
          }

          .header-title {
            font-size: clamp(1.8rem, 10vw, 2.5rem);
          }

          .progress-wrapper {
            flex-direction: column;
            gap: 12px;
          }

          .progress-item-wrapper:not(:last-child) .progress-line {
            display: none;
          }

          .progress-item-wrapper {
            width: 100%;
            max-width: 280px;
          }

          .progress-item {
            flex: 1;
          }

          .billing-toggle {
            padding: 3px;
          }

          .billing-btn {
            padding: 6px 12px;
            font-size: 8px;
            letter-spacing: 0.2em;
          }

          .plan-header {
            flex-direction: column;
            gap: 12px;
          }

          .plan-tag {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}