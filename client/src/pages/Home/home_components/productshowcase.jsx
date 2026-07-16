import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useCurrency } from "../../../components/currencycontext";
import { useShopContent } from "../../Shop/shop_components/shopcontentcontext";
import { useCartWishlist, getToken } from "../../../components/cartcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

const BADGE_STYLES = {
  HOT:     "bg-red-500 text-white",
  NEW:     "bg-white text-black",
  LIMITED: "bg-yellow-400 text-black",
  SALE:    "bg-red-500 text-white",
};

function getBadge(p) {
  if (p.compare_price && Number(p.compare_price) > Number(p.price)) return "SALE";
  const tags = (p.tags || "").toLowerCase();
  if (tags.includes("hot"))     return "HOT";
  if (tags.includes("limited")) return "LIMITED";
  const isNew =
    !p.tags && Date.now() - new Date(p.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  if (isNew) return "NEW";
  return null;
}

const FEATURED_PER_PAGE = 6;
const LATEST_PER_PAGE   = 6; // 5 pages × 6 = 30 products

export default function ProductShowcase() {
  // ── CMS ────────────────────────────────────────────────────────────────────
  const sectionTag  = useShopContent("showcase_section_tag",   "✦ Fresh Off The Rack");
  const titleWhite  = useShopContent("showcase_title_white",   "LATEST");
  const titleRed    = useShopContent("showcase_title_red",     "PRODUCTS");
  const viewAllText = useShopContent("showcase_view_all_text", "VIEW ALL PRODUCTS");
  const viewAllLink = useShopContent("showcase_view_all_link", "/shop");

  // ── Currency ───────────────────────────────────────────────────────────────
  const { fmtMoney, baseCurrency } = useCurrency();

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = useNavigate();

  // ── Cart / Wishlist (shared context — same as ProductGrid) ─────────────────
  const {
    cartIds,
    cartItems,
    wishlistIds,
    addToCart:          ctxAddToCart,
    removeFromCart:     ctxRemoveFromCart,
    addToWishlist:      ctxAddToWishlist,
    removeFromWishlist: ctxRemoveWishlist,
  } = useCartWishlist();

  const cart     = cartIds;
  const wishlist = wishlistIds;

  const [addedId,       setAddedId]       = useState(null);
  const [loadingCartId, setLoadingCartId] = useState(null);
  const [loadingWishId, setLoadingWishId] = useState(null);
  const [sizeModal,     setSizeModal]     = useState(null);
  const [quickAddWish,  setQuickAddWish]  = useState(false);

  // ── Showcase data ──────────────────────────────────────────────────────────
  const [allFeatured, setAllFeatured] = useState([]);
  const [allLatest,   setAllLatest]   = useState([]);
  const [activeTab,   setActiveTab]   = useState("featured");
  const [page,        setPage]        = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/shop/showcase`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => {
        const data = json?.data ?? json;
        setAllFeatured(Array.isArray(data?.featured) ? data.featured : []);
        setAllLatest(Array.isArray(data?.latest)     ? data.latest   : []);
      })
      .catch((e) => { console.error("[ProductShowcase]", e); setError("Failed to load products."); })
      .finally(() => setLoading(false));
  }, []);

  const activeList = activeTab === "featured" ? allFeatured : allLatest;
  const perPage    = activeTab === "featured" ? FEATURED_PER_PAGE : LATEST_PER_PAGE;
  const totalPages = Math.ceil(activeList.length / perPage);
  const visible    = activeList.slice(page * perPage, page * perPage + perPage);

  const handleTab = useCallback((tab) => { setActiveTab(tab); setPage(0); }, []);

  const primaryImage = (product) => {
    const imgs = product.images || [];
    const pos0 = imgs.find((i) => i.position === 0);
    return (pos0 || imgs[0])?.url ||
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80";
  };

  // ── Wishlist toggle ────────────────────────────────────────────────────────
  const toggleWishlist = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) { navigate("/login"); return; }
    if (loadingWishId === productId) return;
    setLoadingWishId(productId);
    if (wishlist.includes(productId)) {
      await ctxRemoveWishlist(productId);
    } else {
      await ctxAddToWishlist(productId);
    }
    setLoadingWishId(null);
  };

  // ── Cart icon (top-right of card) ─────────────────────────────────────────
  const handleCartIcon = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) { navigate("/login"); return; }
    if (cart.includes(product.id)) {
      doRemoveFromCart(product.id);
      return;
    }
    const sizes = product.sizes ?? [];
    if (sizes.length > 0) { setSizeModal(product); return; }
    doAddToCart(product.id, null);
  };

  // ── Quick Add (bottom overlay) ────────────────────────────────────────────
  const handleQuickAdd = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) { navigate("/login"); return; }
    const sizes = product.sizes ?? [];
    if (sizes.length > 0) { setSizeModal(product); return; }
    doAddToCart(product.id, null);
  };

  const doAddToCart = async (productId, sizeId) => {
    if (!getToken()) { navigate("/login"); return; }
    setLoadingCartId(productId);
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 1500);
    await ctxAddToCart(productId, sizeId);
    setLoadingCartId(null);
    setSizeModal(null);
    if (quickAddWish) {
      if (!wishlist.includes(productId)) await ctxAddToWishlist(productId);
      setQuickAddWish(false);
    }
  };

  const doRemoveFromCart = async (productId) => {
    if (!getToken()) return;
    const cartItem = cartItems.find((i) => (i.product_id ?? i.id) === productId);
    if (!cartItem) return;
    setLoadingCartId(productId);
    await ctxRemoveFromCart(cartItem.id, productId);
    setLoadingCartId(null);
  };

  return (
    <>
      <section className="bg-black px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">

          {/* ── Header row ────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-2">
                {sectionTag}
              </span>
              <h2
                className="text-white font-black leading-none"
                style={{
                  fontFamily:    "'Bebas Neue', sans-serif",
                  fontSize:      "clamp(2.4rem, 5vw, 4rem)",
                  letterSpacing: "0.04em",
                }}>
                {titleWhite}
                <br />
                <span className="text-red-500">{titleRed}</span>
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Featured / Latest tabs */}
              <div className="flex items-center gap-1 border border-white/10 p-1">
                {["featured", "latest"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTab(tab)}
                    className={`relative text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 ${
                      activeTab === tab ? "text-black" : "text-white/40 hover:text-white"
                    }`}>
                    {activeTab === tab && (
                      <motion.span
                        layoutId="showcase-tab-pill"
                        className="absolute inset-0 bg-white"
                        style={{ borderRadius: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">
                      {tab === "featured" ? "Featured" : "Latest"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Page arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-9 h-9 bg-white flex items-center justify-center text-black hover:bg-red-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── Loading skeleton ──────────────────────────────────────────── */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-black flex flex-col overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-white/5" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-2.5 w-1/3 bg-white/10 rounded" />
                    <div className="h-4 w-2/3 bg-white/10 rounded" />
                    <div className="h-2 w-full bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <span className="text-white/30 text-sm">{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="text-red-500 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-colors">
                Retry
              </button>
            </div>
          )}

          {/* ── Empty ─────────────────────────────────────────────────────── */}
          {!loading && !error && activeList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="text-white/20 text-[11px] tracking-[0.3em] uppercase">
                No {activeTab} products yet
              </span>
            </div>
          )}

          {/* ── Product grid ──────────────────────────────────────────────── */}
          {!loading && !error && visible.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + page}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8">
                {visible.map((product, i) => {
                  const badge     = getBadge(product);
                  const imgUrl    = primaryImage(product);
                  const isSoldOut = product.available === false;
                  const inCart    = cart.includes(product.id);
                  const inWish    = wishlist.includes(product.id);
                  const isAdded   = addedId === product.id;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      className="group bg-black flex flex-col overflow-hidden">

                      {/* Image */}
                      <div className="relative overflow-hidden aspect-[4/3] bg-[#111]">
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className={`w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 ${
                            isSoldOut ? "opacity-40" : ""
                          }`}
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

                        {/* Sold out overlay */}
                        {isSoldOut && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/80 text-white/60 text-[9px] font-black tracking-[0.3em] uppercase px-4 py-2 border border-white/10">
                              Sold Out
                            </span>
                          </div>
                        )}

                        {/* Badge */}
                        {badge && !isSoldOut && (
                          <span className={`absolute top-3 left-3 text-[9px] font-black tracking-[0.25em] uppercase px-2.5 py-1 ${BADGE_STYLES[badge]}`}>
                            {badge}
                          </span>
                        )}

                        {/* Top-right icons: cart + wishlist */}
                        {!isSoldOut && (
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                            {/* Cart */}
                            <button
                              onClick={(e) => handleCartIcon(product, e)}
                              disabled={loadingCartId === product.id}
                              className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200"
                              style={{
                                background: isAdded ? "#22c55e" : inCart ? "#ef4444" : "rgba(0,0,0,0.65)",
                                opacity: loadingCartId === product.id ? 0.6 : 1,
                              }}>
                              {isAdded ? (
                                <svg width="12" height="12" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              )}
                            </button>

                            {/* Wishlist */}
                            <button
                              onClick={(e) => toggleWishlist(product.id, e)}
                              disabled={loadingWishId === product.id}
                              className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200"
                              style={{
                                background: inWish ? "#ef4444" : "rgba(0,0,0,0.65)",
                                opacity: loadingWishId === product.id ? 0.6 : undefined,
                              }}>
                              <svg
                                width="12" height="12"
                                fill={inWish ? "white" : "none"}
                                stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* Quick add slide-up */}
                        {!isSoldOut && (
                          <div
                            onClick={(e) => handleQuickAdd(product, e)}
                            className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out bg-black/80 backdrop-blur-sm flex items-center justify-center py-3 cursor-pointer">
                            <span className="text-white text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Quick Add
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-5 flex flex-col flex-1 border-t border-white/8">
                        <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase mb-1.5">
                          {product.brand_name || "—"}
                        </span>
                        <h3
                          className="text-white font-black text-[1.05rem] leading-tight mb-2 group-hover:text-red-500 transition-colors duration-300"
                          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>
                          {product.name}
                        </h3>
                        <p className="text-white/35 text-[11px] leading-relaxed tracking-wide flex-1 mb-5 line-clamp-2">
                          {product.description || ""}
                        </p>

                        {/* Price + CTA */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            {/* Price — red */}
                            <span
                              className="font-black text-xl"
                              style={{
                                fontFamily:    "'Bebas Neue', sans-serif",
                                letterSpacing: "0.05em",
                                color:         "#ef4444",
                              }}>
                              {fmtMoney(product.price, baseCurrency)}
                            </span>
                            {/* Slashed compare price — dim white */}
                            {Number(product.compare_price) > Number(product.price) && (
                              <span className="text-white/30 text-sm line-through">
                                {fmtMoney(product.compare_price, baseCurrency)}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/shop/${product.slug || product.id}`}
                            className="group/btn relative overflow-hidden bg-[#1a1a1a] text-black text-[10px] font-black tracking-[0.25em] uppercase px-5 py-2.5 flex items-center gap-2 hover:text-white transition-colors duration-200">
                            <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" />
                            <span className="relative">VIEW</span>
                            <svg className="relative w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── Dot pagination ────────────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`transition-all duration-300 rounded-none ${
                    i === page
                      ? "w-8 h-[3px] bg-red-500"
                      : "w-2 h-[3px] bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
              <span className="text-white/20 text-[10px] tracking-widest ml-4 uppercase">
                {page + 1} / {totalPages}
              </span>
            </div>
          )}

          {/* ── View all ──────────────────────────────────────────────────── */}
          <div className="flex justify-center mt-12">
            <Link
              to={viewAllLink}
              className="group relative overflow-hidden border border-white/20 text-[11px] font-bold tracking-[0.3em] uppercase px-10 py-4 text-white/60 hover:text-white transition-colors duration-300 flex items-center gap-3">
              <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-400 ease-out" />
              <span className="relative">{viewAllText}</span>
              <svg className="relative w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>
      </section>

      {/* ── Size Picker Modal (identical to ProductGrid) ─────────────────────── */}
      {sizeModal && (
        <div
          onClick={() => { setSizeModal(null); setQuickAddWish(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 16px",
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12, padding: "28px 24px", width: "100%", maxWidth: 360,
            }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 6 }}>
              Select Size
            </p>
            <p style={{ color: "#fff", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: "0.05em", marginBottom: 20 }}>
              {sizeModal.name}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {(sizeModal.sizes ?? []).map((s) => {
                const sizeId    = s.id ?? null;
                const sizeLabel = s.size ?? s.name ?? s;
                return (
                  <button
                    key={sizeId ?? sizeLabel}
                    onClick={() => doAddToCart(sizeModal.id, sizeId)}
                    style={{
                      padding: "8px 16px", border: "1px solid rgba(255,255,255,0.18)",
                      background: "none", color: "#fff", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
                      borderRadius: 4, transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}>
                    {sizeLabel}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setSizeModal(null); setQuickAddWish(false); }}
              style={{
                width: "100%", padding: "10px", background: "none",
                border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
                textTransform: "uppercase", cursor: "pointer", borderRadius: 4,
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}