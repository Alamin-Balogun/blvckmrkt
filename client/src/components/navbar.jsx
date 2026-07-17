import {useState, useEffect, useRef} from "react";
import {useCartWishlist} from "./cartcontext";
import {Link, useLocation} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import logo from "../assets/logo.png";

// ── CMS defaults — shown before/if API doesn't return values ─────────────────
const DEFAULT_MARQUEE_ITEMS = [
  "NEW DROPS",
  "FREE SHIPPING OVER ₦50,000",
  "SELLERS NOW ACCEPTED",
  "AUTHENTIC STREETWEAR ONLY",
  "NEW DROPS",
  "FREE SHIPPING OVER $200",
  "SELLERS NOW ACCEPTED",
];

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

const mainLinks = [
  {label: "Home", path: "/"},
  {label: "About Us", path: "/about"},
  {label: "Shop", path: "/shop"},
  {label: "Contact Us", path: "/contact"},
];

const moreLinks = [
  {label: "Brands", path: "/brands"},
  {label: "Drops", path: "/drops"},
  {label: "Blog", path: "/blog"},
];

const MARQUEE_HEIGHT = 36;

// ── Fetch home page CMS content (lightweight — only called once) ──────────────
async function fetchHomePageContent() {
  try {
    const res = await fetch(`${BASE}/pages/home`);
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.content ?? json?.content ?? {};
  } catch {
    return {};
  }
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const {cartCount, wishlistCount} = useCartWishlist();
  const [navTop, setNavTop] = useState(MARQUEE_HEIGHT);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const moreRef = useRef(null);

  // ── CMS state ─────────────────────────────────────────────────────────────
  const [showBar, setShowBar] = useState(true);
  const [marqueeItems, setMarqueeItems] = useState(DEFAULT_MARQUEE_ITEMS);

  useEffect(() => {
    fetchHomePageContent().then((content) => {
      // show_announcement toggle
      if (typeof content.show_announcement === "boolean") {
        setShowBar(content.show_announcement);
      }
      // Build marquee items from individual fields marquee_1 … marquee_7
      // Only override defaults for slots that have a non-empty value saved
      const keys = [
        "marquee_1",
        "marquee_2",
        "marquee_3",
        "marquee_4",
        "marquee_5",
        "marquee_6",
        "marquee_7",
      ];
      const fromCMS = keys
        .map((k, i) =>
          content[k] && content[k].trim() ? content[k].trim() : DEFAULT_MARQUEE_ITEMS[i],
        )
        .filter(Boolean);
      if (fromCMS.length > 0) setMarqueeItems(fromCMS);
    });
  }, []);

  // ── Scroll handler ────────────────────────────────────────────────────────
  useEffect(() => {
    const barHeight = showBar ? MARQUEE_HEIGHT : 0;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setNavTop(Math.max(0, barHeight - y));
    };
    setNavTop(Math.max(0, barHeight - window.scrollY));
    window.addEventListener("scroll", onScroll, {passive: true});
    return () => window.removeEventListener("scroll", onScroll);
  }, [showBar]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  const isMoreActive = moreLinks.some((l) => location.pathname.startsWith(l.path));

  return (
    <>
      {/* ── Marquee Top Bar ──────────────────────────────────────────────────── */}
      {showBar && (
        <div className="bg-white text-black overflow-hidden py-1.5">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="mx-8 text-[11px] font-bold tracking-[0.2em] uppercase">
                {item} <span className="mx-3 text-gray-400">✦</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Fixed Navbar ─────────────────────────────────────────────────────── */}
      <nav
        style={{top: navTop}}
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-black/95 backdrop-blur-md border-b border-white/10 py-8" : "bg-black py-8"
        }`}>
        <div className="max-w-350 mx-auto px-6 flex items-center justify-between">
          {/* Left Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {mainLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`relative text-[12px] tracking-[0.18em] uppercase font-medium transition-all duration-200 group ${isActive(link.path) ? "text-red-500" : "text-white/60 hover:text-white"}`}>
                {link.label}
                <span
                  className={`absolute -bottom-1 left-0 h-[1px] bg-red-500 transition-all duration-300 ${isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"}`}
                />
              </Link>
            ))}

            {/* More dropdown */}
            <div ref={moreRef} className="relative">
              <span
                onClick={() => setMoreOpen(!moreOpen)}
                className={`relative text-[12px] tracking-[0.18em] uppercase font-medium transition-all duration-200 cursor-pointer select-none flex items-center gap-1 ${isMoreActive ? "text-red-500" : "text-white/60 hover:text-white"}`}>
                More
                <motion.svg
                  animate={{rotate: moreOpen ? 180 : 0}}
                  transition={{duration: 0.2}}
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 mt-[1px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </motion.svg>
                {isMoreActive && (
                  <span className="absolute -bottom-1 left-0 h-[1px] w-full bg-red-500" />
                )}
              </span>

              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{opacity: 0, y: 8}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: 8}}
                    transition={{duration: 0.2}}
                    className="absolute top-8 left-0 bg-black border border-white/10 min-w-[140px] py-2 shadow-2xl">
                    {moreLinks.map((link) => (
                      <Link
                        key={link.label}
                        to={link.path}
                        className={`relative flex items-center px-4 py-2.5 text-[12px] tracking-[0.18em] uppercase font-medium transition-colors duration-150 group ${isActive(link.path) ? "text-red-500" : "text-white/60 hover:text-white"}`}>
                        {link.label}
                        <span
                          className={`absolute bottom-1.5 left-4 h-[1px] bg-red-500 transition-all duration-300 ${isActive(link.path) ? "w-[calc(100%-2rem)]" : "w-0 group-hover:w-[calc(100%-2rem)]"}`}
                        />
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Logo Center */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <motion.img
              src={logo}
              alt="BLVCKMRKT Logo"
              className="h-28 w-auto object-contain"
              whileHover={{y: -3, scale: 1.03}}
              whileTap={{scale: 0.97}}
              transition={{type: "spring", stiffness: 400, damping: 15}}
            />
          </Link>

          {/* Right Icons — desktop */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            {/* User/account icon moved to the front of the icon cluster */}
            <Link
              to="/signup"
              className={`relative transition-colors ${isActive("/signup") ? "text-red-500" : "text-white/60 hover:text-white"}`}>
              <motion.svg
                whileHover={{scale: 1.15}}
                whileTap={{scale: 0.9}}
                transition={{type: "spring", stiffness: 300}}
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </motion.svg>
            </Link>
            <Link
              to="/brands"
              className={`text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 ${isActive("/sell") ? "bg-red-500 text-white" : "bg-white text-black hover:bg-red-500 hover:text-white"}`}>
              BRANDS
            </Link>
            <Link
              to="/wishlist"
              className={`relative transition-colors ${isActive("/wishlist") ? "text-red-500" : "text-white/60 hover:text-white"}`}>
              <motion.svg
                whileHover={{scale: 1.15}}
                whileTap={{scale: 0.9}}
                transition={{type: "spring", stiffness: 300}}
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </motion.svg>
              <motion.span
                initial={{scale: 0}}
                animate={{scale: 1}}
                transition={{type: "spring", stiffness: 500, delay: 0.2}}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </motion.span>
            </Link>
            <Link
              to="/cart"
              className={`relative transition-colors ${isActive("/cart") ? "text-red-500" : "text-white/60 hover:text-white"}`}>
              <motion.svg
                whileHover={{scale: 1.15}}
                whileTap={{scale: 0.9}}
                transition={{type: "spring", stiffness: 300}}
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </motion.svg>
              <motion.span
                initial={{scale: 0}}
                animate={{scale: 1}}
                transition={{type: "spring", stiffness: 500, delay: 0.2}}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </motion.span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden ml-auto text-white z-50">
            <div
              className={`w-6 h-0.5 bg-white mb-1.5 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <div
              className={`w-6 h-0.5 bg-white mb-1.5 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
            />
            <div
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
            className="fixed inset-0 bg-black md:hidden"
            style={{zIndex: 9999}}>
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
                  backgroundSize: "32px 32px",
                }}
              />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
            <div className="relative h-full overflow-y-auto">
              <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-white/10 z-10">
                <div className="flex items-center justify-between px-6 py-5">
                  <Link to="/" onClick={() => setMenuOpen(false)}>
                    <img src={logo} alt="BLVCKMRKT" className="h-12 w-auto object-contain" />
                  </Link>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-200 rounded">
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-88px)]">
                <div className="flex flex-col items-center gap-3 mb-8">
                  <span className="text-red-500 text-[9px] font-bold tracking-[0.3em] uppercase mb-2">
                    ✦ Navigation
                  </span>
                  {[...mainLinks, ...moreLinks].map((link, i) => (
                    <motion.div
                      key={link.label}
                      initial={{opacity: 0, x: -20}}
                      animate={{opacity: 1, x: 0}}
                      transition={{duration: 0.3, delay: i * 0.05}}>
                      <Link
                        to={link.path}
                        onClick={() => setMenuOpen(false)}
                        className="group relative block">
                        {isActive(link.path) && (
                          <span className="absolute inset-0 bg-red-500/10 blur-xl" />
                        )}
                        <span
                          className={`relative block text-3xl sm:text-4xl font-black tracking-wider uppercase transition-all duration-200 ${isActive(link.path) ? "text-red-500" : "text-white/80 group-hover:text-white group-hover:translate-x-2"}`}
                          style={{fontFamily: "'Bebas Neue', sans-serif"}}>
                          {link.label}
                        </span>
                        <span
                          className={`block h-[2px] bg-red-500 transition-all duration-300 mt-1 ${isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"}`}
                        />
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.3, delay: 0.4}}>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="group relative inline-block overflow-hidden mt-4 mb-10">
                    <span className="absolute inset-0 bg-red-500 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300" />
                    <span className="relative block bg-white text-black group-hover:text-white text-xs font-bold tracking-[0.25em] uppercase px-10 py-3.5 border-2 border-white transition-colors duration-300">
                      SELL NOW
                    </span>
                  </Link>
                </motion.div>
                <div className="flex items-center gap-4 my-8 w-full max-w-[200px]">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="rgba(239,68,68,0.5)"
                    strokeWidth="2"
                    viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
                <motion.div
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.3, delay: 0.5}}
                  className="grid grid-cols-3 gap-6">
                  {[
                    {
                      to: "/signup",
                      label: "Account",
                      icon: (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      ),
                      badge: false,
                    },
                    {
                      to: "/wishlist",
                      label: "Wishlist",
                      icon: (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      ),
                      badge: true,
                    },
                    {
                      to: "/cart",
                      label: "Cart",
                      icon: (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      ),
                      badge: true,
                    },
                  ].map(({to, label, icon, badge}) => (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className="group flex flex-col items-center gap-3">
                      <div className="relative w-14 h-14 rounded-lg bg-white/5 border border-white/10 group-hover:border-red-500 group-hover:bg-red-500/10 flex items-center justify-center transition-all duration-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 text-white/60 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}>
                          {icon}
                        </svg>
                        {badge && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {label === "Wishlist"
                              ? wishlistCount > 9
                                ? "9+"
                                : wishlistCount
                              : cartCount > 9
                                ? "9+"
                                : cartCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 group-hover:text-white transition-colors">
                        {label}
                      </span>
                    </Link>
                  ))}
                </motion.div>
                <motion.p
                  initial={{opacity: 0}}
                  animate={{opacity: 1}}
                  transition={{duration: 0.3, delay: 0.6}}
                  className="text-white/20 text-[10px] tracking-[0.3em] uppercase mt-12">
                  ✦ Authentic Streetwear Only
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
