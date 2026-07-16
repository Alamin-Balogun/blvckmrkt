import {useState} from "react";
import {useDropsContent, useDrops} from "./dropscontentcontext";
import {motion, AnimatePresence} from "framer-motion";
import {Link, useNavigate} from "react-router-dom";
import {useCartWishlist, getToken} from "../../../components/cartcontext";

// ─── Status → badge mapping ──────────────────────────────────────────────────
const STATUS_BADGE = {
  live: {label: "LIVE", bg: "#22c55e", color: "#fff"},
  scheduled: {label: "COMING SOON", bg: "#f59e0b", color: "#000"},
};

function fmt(n) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

export default function DropsGrid() {
  const {drops, brands, loading, brandFilter, setBrandFilter} = useDrops();
  const navigate = useNavigate();

  // ── Shared cart/wishlist context (same as productgrid) ─────────────────────
  const {
    cartIds,
    cartItems,
    wishlistIds,
    addToCart: ctxAddToCart,
    removeFromCart: ctxRemoveFromCart,
    removeFromWishlist: ctxRemoveWishlist,
    addToWishlist: ctxAddToWishlist,
  } = useCartWishlist();
  const cart = cartIds;
  const wishlist = wishlistIds;

  const [addedId, setAddedId] = useState(null);
  const [loadingCartId, setLoadingCartId] = useState(null);
  const [loadingWishId, setLoadingWishId] = useState(null);
  const [sizeModal, setSizeModal] = useState(null);
  const [quickAddWish, setQuickAddWish] = useState(false);

  // ── CMS fields ─────────────────────────────────────────────────────────────
  const dropsCountLabel = useDropsContent("drops_count_label", "items");
  const viewAllText = useDropsContent("view_all_text", "View all");
  const quickAddText = useDropsContent("quick_add_text", "+ Quick Add");
  const viewText = useDropsContent("view_text", "View");
  const sectionTag = useDropsContent("grid_section_tag", "✦ Latest Drops");
  const sectionTitle = useDropsContent("grid_section_title", "EXPLORE THE");
  const sectionTitleRed = useDropsContent("grid_section_title_red", "LATEST DROPS");

  // ── Cart handlers (mirrors productgrid exactly) ────────────────────────────
  const addToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) {
      navigate("/login");
      return;
    }
    if (cart.includes(product.id)) {
      doRemoveFromCart(product.id);
      return;
    }
    const sizes = product.sizes ?? [];
    if (sizes.length > 0) {
      setSizeModal(product);
      return;
    }
    doAddToCart(product.id, null);
  };

  const doAddToCart = async (productId, sizeId) => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setLoadingCartId(productId);
    setAddedId(productId);
    setTimeout(() => setAddedId(null), 1500);
    await ctxAddToCart(productId, sizeId);
    setLoadingCartId(null);
    setSizeModal(null);

    // If Quick Add opened the size modal, also add to wishlist now
    if (quickAddWish) {
      if (!wishlist.includes(productId)) {
        await ctxAddToWishlist(productId);
      }
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

  // ── Wishlist toggle ────────────────────────────────────────────────────────
  const toggleWishlist = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) {
      navigate("/login");
      return;
    }
    if (loadingWishId === productId) return;
    setLoadingWishId(productId);
    if (wishlist.includes(productId)) {
      await ctxRemoveWishlist(productId);
    } else {
      await ctxAddToWishlist(productId);
    }
    setLoadingWishId(null);
  };

  // ── Quick Add (cart + wishlist simultaneously) ─────────────────────────────
  const handleQuickAdd = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) {
      navigate("/login");
      return;
    }

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

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <section style={{background: "#000", padding: "64px 48px"}}>
        {/* Section header */}
        <div style={{maxWidth: 1280, margin: "0 auto 40px"}}>
          <span
            style={{
              color: "#ef4444",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 6,
            }}>
            {sectionTag}
          </span>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              margin: 0,
            }}>
            {sectionTitle} <span style={{color: "#ef4444"}}>{sectionTitleRed}</span>
          </h1>
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 56,
          }}>
          <div style={{display: "flex", gap: 8}}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 100,
                  height: 36,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 99,
                  animation: "pulse 1.4s infinite",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>

          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "48px 36px 36px",
              }}>
              <div
                style={{
                  width: 200,
                  height: 28,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  marginBottom: 28,
                  animation: "pulse 1.4s infinite",
                }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 14,
                }}>
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 14,
                      overflow: "hidden",
                    }}>
                    <div
                      style={{
                        aspectRatio: "1/1",
                        background: "rgba(255,255,255,0.06)",
                        animation: "pulse 1.4s infinite",
                        animationDelay: `${j * 0.1}s`,
                      }}
                    />
                    <div style={{padding: 14, display: "flex", flexDirection: "column", gap: 8}}>
                      <div
                        style={{
                          height: 14,
                          width: "70%",
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 4,
                          animation: "pulse 1.4s infinite",
                        }}
                      />
                      <div
                        style={{
                          height: 20,
                          width: "40%",
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 4,
                          animation: "pulse 1.4s infinite",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </section>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!drops.length && !loading) {
    return (
      <section style={{background: "#000", padding: "64px 48px"}}>
        <div style={{maxWidth: 1280, margin: "0 auto"}}>
          {/* Section header */}
          <div style={{marginBottom: 40}}>
            <span
              style={{
                color: "#ef4444",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 6,
              }}>
              {sectionTag}
            </span>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "0.04em",
                lineHeight: 1,
                margin: 0,
              }}>
              {sectionTitle} <span style={{color: "#ef4444"}}>{sectionTitleRed}</span>
            </h1>
          </div>

          {brands.length > 0 && (
            <BrandFilter brands={brands} active={brandFilter} onChange={setBrandFilter} />
          )}

          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}>
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 15,
                fontWeight: 700,
                margin: 0,
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.08em",
              }}>
              {brandFilter ? "No drops from this brand right now" : "No drops available right now"}
            </p>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, margin: 0}}>
              Check back soon for new releases
            </p>
            {brandFilter && (
              <button
                onClick={() => setBrandFilter("")}
                style={{
                  marginTop: 8,
                  padding: "8px 20px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#ef4444",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                Show All Brands
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section style={{background: "#000", padding: "64px 48px"}}>
        <style>{`
          .drops-wrap { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 56px; }
          .brand-section { position: relative; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 40px 36px 36px; transition: border-color 0.3s; }
          .brand-section:hover { border-color: rgba(239,68,68,0.35); }
          .brand-legend { position: absolute; top: -1px; left: 28px; transform: translateY(-50%); display: flex; align-items: center; gap: 12px; background: #000; padding: 0 14px; }
          .brand-logo-wrap { width: 60px; height: 60px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); }
          .brand-name-wrap { display: flex; flex-direction: column; }
          .brand-name { color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: 0.1em; line-height: 1; font-weight: 900; }
          .brand-tagline { color: rgba(255,255,255,0.28); font-size: 8px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; }
          .brand-header { display: flex; align-items: center; justify-content: flex-end; margin-bottom: 24px; }
          .brand-view-all { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; text-decoration: none; transition: color 0.2s; }
          .brand-view-all:hover { color: #ef4444; }
          .brand-count-pill { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #ef4444; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 99px; letter-spacing: 0.12em; }
          .drops-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
          @media (max-width: 1024px) { .drops-cards { grid-template-columns: repeat(2,1fr); } }
          @media (max-width: 560px) { .drops-cards { grid-template-columns: 1fr; } }
          .drop-card { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.3s, transform 0.3s; }
          .drop-card:hover { border-color: rgba(255,255,255,0.18); transform: translateY(-3px); }
          .drop-img { position: relative; aspect-ratio: 1/1; overflow: hidden; }
          .drop-img img { width: 100%; height: 100%; object-fit: cover; object-position: top; filter: grayscale(15%); transition: transform 0.7s; }
          .drop-card:hover .drop-img img { transform: scale(1.07); }
          .drop-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.18); transition: background 0.4s; }
          .drop-card:hover .drop-overlay { background: rgba(0,0,0,0.06); }
          .drop-badge { position: absolute; bottom: 10px; left: 10px; font-size: 7px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; padding: 3px 7px; border-radius: 3px; }
          .drop-icons { position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 5px; }
          .drop-icon-btn { width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: all 0.2s; }
          .drop-icon-btn:hover { transform: scale(1.1); }
          .drop-cart-btn { background: rgba(0,0,0,0.65); opacity: 0; transition: opacity 0.2s, background 0.2s; }
          .drop-card:hover .drop-cart-btn { opacity: 1; }
          .drop-cart-btn.in-cart { background: #ef4444; opacity: 1; }
          .drop-cart-btn.added { background: #22c55e; opacity: 1; }
          .drop-wish-btn { background: rgba(0,0,0,0.6); opacity: 0; transition: opacity 0.2s, background 0.2s; }
          .drop-card:hover .drop-wish-btn { opacity: 1; }
          .drop-wish-btn.active { background: #ef4444; opacity: 1; }
          .drop-quick { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; color: #000; font-size: 9px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; padding: 9px; text-align: center; border: none; cursor: pointer; transform: translateY(100%); transition: transform 0.3s, background 0.2s, color 0.2s; }
          .drop-card:hover .drop-quick { transform: translateY(0); }
          .drop-quick:hover { background: #ef4444; color: #fff; }
          .drop-body { padding: 12px 14px 14px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
          .drop-name { color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 0.95rem; letter-spacing: 0.05em; font-weight: 900; line-height: 1.2; text-decoration: none; display: block; transition: color 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .drop-name:hover { color: #ef4444; }
          .drop-sizes { display: flex; flex-wrap: wrap; gap: 3px; }
          .drop-size { border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); font-size: 7px; font-weight: 700; padding: 1px 4px; }
          .drop-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
          .drop-price { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; color: #ef4444; font-weight: 900; }
          .drop-view { color: rgba(255,255,255,0.3); font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; display: flex; align-items: center; gap: 3px; transition: color 0.2s; }
          .drop-view:hover { color: #ef4444; }
          .drop-no-img { width: 100%; height: 100%; background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center; }
        `}</style>

        {/* Section header */}
        <div style={{maxWidth: 1280, margin: "0 auto 60px"}}>
          <span
            style={{
              color: "#ef4444",
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 6,
            }}>
            {sectionTag}
          </span>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              margin: 0,
            }}>
            {sectionTitle} <span style={{color: "#ef4444"}}>{sectionTitleRed}</span>
          </h1>
        </div>

        <div className="drops-wrap">
          {brands.length > 1 && (
            <BrandFilter brands={brands} active={brandFilter} onChange={setBrandFilter} />
          )}

          <AnimatePresence mode="wait">
            {drops.map((drop, bi) => (
              <motion.div
                key={drop.id}
                initial={{opacity: 0, y: 32}}
                whileInView={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -16}}
                viewport={{once: true, margin: "-60px"}}
                transition={{duration: 0.55, delay: bi * 0.08}}
                className="brand-section">
                {/* ── Legend ── */}
                <div className="brand-legend">
                  <div className="brand-logo-wrap">
                    {drop.brand?.logo_url ? (
                      <img
                        src={drop.brand.logo_url}
                        alt={drop.brand.brand_name}
                        style={{width: "100%", height: "100%", objectFit: "cover"}}
                      />
                    ) : (
                      <span
                        style={{
                          color: "#ef4444",
                          fontWeight: 900,
                          fontSize: "1.4rem",
                          fontFamily: "'Bebas Neue', sans-serif",
                        }}>
                        {(drop.brand?.brand_name || "D")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="brand-name-wrap">
                    <span className="brand-name">{drop.brand?.brand_name || "Unknown Brand"}</span>
                    <span className="brand-tagline">{drop.name}</span>
                  </div>
                </div>

                {/* ── Header right ── */}
                <div className="brand-header">
                  <div style={{display: "flex", alignItems: "center", gap: 12}}>
                    <span className="brand-count-pill">
                      {drop.product_count || 0} {dropsCountLabel}
                    </span>
                    <Link to={`/shop?brand_id=${drop.brand?.id || ""}`} className="brand-view-all">
                      {viewAllText}
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* ── Product grid ── */}
                <div className="drops-cards">
                  {(drop.products || []).map((item, i) => {
                    const badge = STATUS_BADGE[item.status];
                    const mainImage = item.images?.[0];
                    const isInCart = cart.includes(item.id);
                    const isWished = wishlist.includes(item.id);
                    const isAdded = addedId === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{opacity: 0, y: 16}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.35, delay: i * 0.04}}
                        className="drop-card">
                        {/* Image */}
                        <div className="drop-img">
                          {mainImage ? (
                            <img src={mainImage} alt={item.name} />
                          ) : (
                            <div className="drop-no-img">
                              <svg
                                width="28"
                                height="28"
                                fill="none"
                                stroke="rgba(255,255,255,0.12)"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                          <div className="drop-overlay" />

                          {badge && (
                            <span
                              className="drop-badge"
                              style={{background: badge.bg, color: badge.color}}>
                              {badge.label}
                            </span>
                          )}

                          <div className="drop-icons">
                            {/* Cart button */}
                            <button
                              title={isInCart ? "Remove from cart" : "Add to cart"}
                              className={`drop-icon-btn drop-cart-btn ${isAdded ? "added" : isInCart ? "in-cart" : ""}`}
                              disabled={loadingCartId === item.id}
                              onClick={(e) => addToCart(item, e)}>
                              {isAdded ? (
                                <svg
                                  width="11"
                                  height="11"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : isInCart ? (
                                <svg
                                  width="11"
                                  height="11"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  width="11"
                                  height="11"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                              )}
                            </button>

                            {/* Wishlist button */}
                            <button
                              className={`drop-icon-btn drop-wish-btn ${isWished ? "active" : ""}`}
                              disabled={loadingWishId === item.id}
                              onClick={(e) => toggleWishlist(item.id, e)}
                              title={isWished ? "Remove from wishlist" : "Add to wishlist"}>
                              <svg
                                width="11"
                                height="11"
                                fill={isWished ? "white" : "none"}
                                stroke="white"
                                strokeWidth="2"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Quick Add */}
                          <button
                            className="drop-quick"
                            disabled={loadingCartId === item.id}
                            onClick={(e) => handleQuickAdd(item, e)}>
                            {quickAddText}
                          </button>
                        </div>

                        {/* Body */}
                        <div className="drop-body">
                          <Link to={`/shop/${item.slug || item.id}`} className="drop-name">
                            {item.name}
                          </Link>
                          {item.sizes?.length > 0 && (
                            <div className="drop-sizes">
                              {item.sizes.slice(0, 4).map((s) => {
                                const label = typeof s === "string" ? s : (s.size ?? s.name ?? s);
                                return (
                                  <span key={label} className="drop-size">
                                    {label}
                                  </span>
                                );
                              })}
                              {item.sizes.length > 4 && (
                                <span style={{color: "rgba(255,255,255,0.18)", fontSize: 7}}>
                                  +{item.sizes.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="drop-bottom">
                            <span className="drop-price">{fmt(item.price)}</span>
                            <Link to={`/shop/${item.slug || item.id}`} className="drop-view">
                              {viewText}
                              <svg
                                width="9"
                                height="9"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Size Picker Modal (same as productgrid) ───────────────────────── */}
      {sizeModal && (
        <div
          onClick={() => {
            setSizeModal(null);
            setQuickAddWish(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: "28px 24px",
              width: "100%",
              maxWidth: 360,
            }}>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}>
              Select Size
            </p>
            <p
              style={{
                color: "#fff",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.3rem",
                letterSpacing: "0.05em",
                marginBottom: 20,
              }}>
              {sizeModal.name}
            </p>
            <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24}}>
              {(sizeModal.sizes ?? []).map((s) => {
                const sizeId = typeof s === "object" ? (s.id ?? null) : null;
                const sizeLabel =
                  typeof s === "object" ? (s.size ?? s.name ?? String(s)) : String(s);
                return (
                  <button
                    key={sizeId ?? sizeLabel}
                    onClick={() => doAddToCart(sizeModal.id, sizeId)}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "none",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      borderRadius: 4,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ef4444";
                      e.currentTarget.style.borderColor = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                    }}>
                    {sizeLabel}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                setSizeModal(null);
                setQuickAddWish(false);
              }}
              style={{
                width: "100%",
                padding: "10px",
                background: "none",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.4)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: 4,
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Brand filter bar ──────────────────────────────────────────────────────────
function BrandFilter({brands, active, onChange}) {
  return (
    <motion.div
      initial={{opacity: 0, y: -12}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.35}}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 8,
      }}>
      <span
        style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginRight: 4,
        }}>
        Filter
      </span>

      <button
        onClick={() => onChange("")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 16px",
          borderRadius: 99,
          fontSize: 11,
          fontWeight: 800,
          cursor: "pointer",
          border: `1px solid ${!active ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
          background: !active ? "rgba(239,68,68,0.1)" : "transparent",
          color: !active ? "#ef4444" : "rgba(255,255,255,0.4)",
          transition: "all 0.2s",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "'Bebas Neue', sans-serif",
        }}>
        All Brands
      </button>

      {brands.map((b) => {
        const isActive = active === b.slug;
        return (
          <button
            key={b.id}
            onClick={() => onChange(isActive ? "" : b.slug)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 14px 5px 5px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              border: `1px solid ${isActive ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: isActive ? "rgba(239,68,68,0.1)" : "transparent",
              color: isActive ? "#ef4444" : "rgba(255,255,255,0.4)",
              transition: "all 0.2s",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "'Bebas Neue', sans-serif",
            }}>
            {b.logo_url ? (
              <img
                src={b.logo_url}
                alt=""
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `1px solid ${isActive ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: isActive ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 900,
                  color: isActive ? "#ef4444" : "rgba(255,255,255,0.3)",
                  border: `1px solid ${isActive ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}>
                {(b.brand_name || "B")[0]}
              </div>
            )}
            {b.brand_name}
          </button>
        );
      })}
    </motion.div>
  );
}
