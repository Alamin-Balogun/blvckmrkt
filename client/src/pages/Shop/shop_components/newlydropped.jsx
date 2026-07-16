import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShopContent } from "./shopcontentcontext";
import { useCurrency } from "../../../components/currencycontext";
import { useCartWishlist, getToken } from "../../../components/cartcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

export default function NewlyDropped() {
  // ── CMS fields ───────────────────────────────────────────────────────────
  const sectionTag   = useShopContent("drops_section_tag",         "Fresh Off The Press");
  const titleWhite   = useShopContent("drops_section_title_white", "NEWLY");
  const titleRed     = useShopContent("drops_section_title_red",   "DROPPED");
  const viewAllText  = useShopContent("drops_view_all_text",       "View All Drops");
  const viewAllLink  = useShopContent("drops_view_all_link",       "/drops");
  const quickAddText = useShopContent("drops_quick_add_text",      "+ Quick Add");
  const viewText     = useShopContent("drops_view_text",           "View");

  // ── Currency ─────────────────────────────────────────────────────────────
  const { fmtMoney, baseCurrency } = useCurrency();

  // ── Cart & Wishlist — same context as ProductGrid ─────────────────────────
  const {
    cartIds,
    cartItems,
    wishlistIds,
    addToCart:          ctxAddToCart,
    removeFromCart:     ctxRemoveFromCart,
    removeFromWishlist: ctxRemoveWishlist,
    addToWishlist:      ctxAddToWishlist,
  } = useCartWishlist();
  const cart     = cartIds;
  const wishlist = wishlistIds;

  const navigate = useNavigate();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [addedId,       setAddedId]       = useState(null);
  const [loadingCartId, setLoadingCartId] = useState(null);
  const [loadingWishId, setLoadingWishId] = useState(null);
  const [sizeModal,     setSizeModal]     = useState(null); // product object | null
  const [quickAddWish,  setQuickAddWish]  = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const [dropItems, setDropItems] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/drops`)
      .then((r) => r.json())
      .then((json) => {
        const data  = json?.data ?? json;
        const drops = Array.isArray(data?.drops) ? data.drops : [];

        // Flatten all drops → products, keep only "live" status, cap at 4.
        // Normalise product_id → id so cart helpers (which key on .id) work the
        // same way they do in ProductGrid.
        const flat = [];
        for (const drop of drops) {
          for (const p of drop.products || []) {
            if (p.status === "live") {
              flat.push({
                ...p,
                id:       p.product_id,
                sizes:    p.sizes ?? [],
                dropName: drop.name,
              });
            }
          }
          if (flat.length >= 4) break;
        }
        setDropItems(flat.slice(0, 4));
      })
      .catch((e) => console.error("[NewlyDropped] fetch error:", e))
      .finally(() => setLoading(false));
  }, []);

  // ── Wishlist toggle — identical to ProductGrid ────────────────────────────
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

  // ── doAddToCart — identical to ProductGrid ────────────────────────────────
  const doAddToCart = async (productId, sizeId) => {
    if (!getToken()) { navigate("/login"); return; }
    setLoadingCartId(productId);
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 1500);
    await ctxAddToCart(productId, sizeId);
    setLoadingCartId(null);
    setSizeModal(null);

    // If Quick Add opened the size modal, also add to wishlist (mirrors ProductGrid)
    if (quickAddWish) {
      if (!wishlist.includes(productId)) {
        await ctxAddToWishlist(productId);
      }
      setQuickAddWish(false);
    }
  };

  // ── Quick Add — identical logic to ProductGrid's quick-add button ─────────
  const handleQuickAdd = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) { navigate("/login"); return; }

    const promises = [];

    // Add to wishlist immediately regardless of sizes
    if (!wishlist.includes(product.id)) {
      promises.push(ctxAddToWishlist(product.id));
    }

    // Add to cart
    if (!cart.includes(product.id)) {
      const productSizes = product.sizes ?? [];
      if (productSizes.length > 0) {
        setQuickAddWish(true);
        setSizeModal(product);
      } else {
        promises.push(doAddToCart(product.id, null));
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  // ── Relative time label ───────────────────────────────────────────────────
  const relativeTime = (endsAt) => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Ending soon";
    const h = Math.floor(diff / 3_600_000);
    if (h < 24) return `Ends in ${h}h`;
    return `Ends in ${Math.floor(h / 24)}d`;
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="bg-[#0a0a0a] border-t border-white/8 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#0d0d0d] border border-white/8 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/5" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-2 w-1/3 bg-white/10 rounded" />
                  <div className="h-4 w-2/3 bg-white/10 rounded" />
                  <div className="h-2 w-1/4 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Nothing to show — hide section entirely
  if (dropItems.length === 0) return null;

  return (
    <>
      <section className="bg-[#0a0a0a] border-t border-white/8 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-500 text-[10px] font-black tracking-[0.4em] uppercase">
                  {sectionTag}
                </span>
              </div>
              <h2
                className="text-white font-black leading-none"
                style={{
                  fontFamily:    "'Bebas Neue', sans-serif",
                  fontSize:      "clamp(2rem, 4vw, 3rem)",
                  letterSpacing: "0.04em",
                }}>
                {titleWhite} <span className="text-red-500">{titleRed}</span>
              </h2>
            </div>

            <Link
              to={viewAllLink}
              className="group hidden sm:flex items-center gap-2 text-white/35 hover:text-white text-[10px] font-black tracking-[0.25em] uppercase transition-colors duration-200">
              {viewAllText}
              <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* ── Cards ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dropItems.map((item, i) => {
              const timeLabel = relativeTime(item.ends_at);
              const isOnSale  = item.compare_price && Number(item.compare_price) > Number(item.price);
              const isWished  = wishlist.includes(item.id);
              const isAdded   = addedId === item.id;

              return (
                <motion.div
                  key={item.product_id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="group bg-[#0d0d0d] border border-white/8 hover:border-white/20 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1">

                  {/* Image area */}
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={item.primary_image || "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80"}
                      alt={item.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      style={{ filter: "grayscale(15%)" }}
                    />
                    <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors duration-500" />

                    {/* Status tag (top-left) */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white text-[9px] font-black tracking-[0.18em] uppercase">
                        {isOnSale ? "SALE" : "New Drop"}
                      </span>
                    </div>

                    {/* Wishlist icon (top-right) */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <button
                        onClick={(e) => toggleWishlist(item.id, e)}
                        disabled={loadingWishId === item.id}
                        className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200"
                        style={{ background: isWished ? "#ef4444" : "rgba(0,0,0,0.65)" }}>
                        <svg
                          width="12" height="12"
                          fill={isWished ? "white" : "none"}
                          stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Quick Add slide-up (bottom) */}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button
                        disabled={loadingCartId === item.id}
                        onClick={(e) => handleQuickAdd(item, e)}
                        className={`w-full !text-[10px] !font-black !rounded-none tracking-[0.22em] uppercase py-3 transition-colors duration-200 ${
                          isAdded
                            ? "bg-green-500 text-white"
                            : "bg-white text-black hover:bg-red-500 hover:text-white"
                        }`}>
                        {isAdded ? (
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" style={{ display: "inline" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : quickAddText}
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/28 text-[9px] font-bold tracking-[0.22em] uppercase">
                        {item.brand_name || "—"}
                      </span>
                      {timeLabel && (
                        <span className="text-white/20 text-[9px] tracking-wide">{timeLabel}</span>
                      )}
                    </div>

                    <Link
                      to={`/shop/${item.slug || item.product_id}`}
                      className="text-white font-black leading-tight mb-3 hover:text-red-500 transition-colors duration-200 line-clamp-1 block"
                      style={{
                        fontFamily:    "'Bebas Neue', sans-serif",
                        fontSize:      "1.05rem",
                        letterSpacing: "0.05em",
                      }}>
                      {item.name}
                    </Link>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-white font-black"
                          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem" }}>
                          {fmtMoney(item.price, baseCurrency)}
                        </span>
                        {isOnSale && (
                          <span className="text-white/30 text-sm line-through">
                            {fmtMoney(item.compare_price, baseCurrency)}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/shop/${item.slug || item.product_id}`}
                        className="text-white/35 hover:text-red-500 text-[10px] font-bold tracking-[0.18em] uppercase transition-colors duration-200 flex items-center gap-1">
                        {viewText}
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile view all */}
          <div className="flex justify-center mt-8 sm:hidden">
            <Link
              to={viewAllLink}
              className="group relative overflow-hidden border border-white/20 text-[11px] font-black tracking-[0.25em] uppercase px-8 py-3.5 text-white/50 hover:text-white transition-colors duration-300 flex items-center gap-2">
              <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative">{viewAllText}</span>
              <svg className="relative w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>
      </section>

      {/* ── Size Picker Modal — identical to ProductGrid ──────────────────── */}
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
            <p style={{
              color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 700,
              letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 6,
            }}>
              Select Size
            </p>
            <p style={{
              color: "#fff", fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.3rem", letterSpacing: "0.05em", marginBottom: 20,
            }}>
              {sizeModal.name}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {(sizeModal.sizes ?? []).map((s) => {
                const sizeId    = s.id    ?? null;
                const sizeLabel = s.size  ?? s.name ?? s;
                return (
                  <button
                    key={sizeId ?? sizeLabel}
                    onClick={() => doAddToCart(sizeModal.id, sizeId)}
                    style={{
                      padding: "8px 16px", border: "1px solid rgba(255,255,255,0.18)",
                      background: "none", color: "#fff", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      cursor: "pointer", borderRadius: 4, transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background  = "#ef4444";
                      e.currentTarget.style.borderColor = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background  = "none";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                    }}>
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