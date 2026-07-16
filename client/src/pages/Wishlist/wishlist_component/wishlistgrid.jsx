import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link, useNavigate} from "react-router-dom";
import {useCartWishlist, getToken} from "../../../components/cartcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

function fmt(n) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

const sortOptions = ["Date Added", "Price: Low to High", "Price: High to Low", "Brand A–Z"];

export default function WishlistGrid() {
  const {wishlistItems, cartIds, refreshWishlist, removeFromWishlist, addToCart} =
    useCartWishlist();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const [sort, setSort] = useState("Date Added");
  const [sizeModal, setSizeModal] = useState(null); // product for size pick
  const navigate = useNavigate();

  // Load wishlist on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    refreshWishlist();
  }, []); // eslint-disable-line

  // Map wishlist items to display shape
  useEffect(() => {
    if (!Array.isArray(wishlistItems) || !wishlistItems.length) {
      setItems([]);
      setLoading(false);
      return;
    }
    // Go WishlistItemResponse:
    //   { id, product_id, created_at,
    //     product: { id, name, slug, price, compare_price, brand_name, primary_image, tags, sizes } }
    const mapped = wishlistItems.map((wi) => {
      const p = wi.product ?? {};
      return {
        wishlistId: wi.id,
        productId: wi.product_id,
        name: p.name ?? "Product",
        brand: p.brand_name ?? "",
        price: Number(p.price ?? 0),
        comparePrice: Number(p.compare_price ?? 0),
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        image: p.primary_image ?? "",
        slug: p.slug ?? wi.product_id,
        inStock: true, // product fetched by handler so it exists
        addedAt: wi.created_at ?? "",
        tags: p.tags ?? "",
      };
    });
    setItems(mapped);
    setLoading(false);
  }, [wishlistItems]);

  // Sort
  let sorted = [...items];
  if (sort === "Price: Low to High") sorted.sort((a, b) => a.price - b.price);
  if (sort === "Price: High to Low") sorted.sort((a, b) => b.price - a.price);
  if (sort === "Brand A–Z") sorted.sort((a, b) => a.brand.localeCompare(b.brand));

  const handleRemove = async (item) => {
    setItems((prev) => prev.filter((i) => i.productId !== item.productId));
    await removeFromWishlist(item.productId);
  };

  const handleAddToCart = (item) => {
    if (!item.inStock) return;
    if (item.sizes.length > 0) {
      setSizeModal(item);
      return;
    }
    doAddToCart(item.productId, null, item.wishlistId);
  };

  const doAddToCart = async (productId, sizeId, wishlistId) => {
    setSizeModal(null);
    setAddedId(productId);
    await addToCart(productId, sizeId);
    setTimeout(() => setAddedId(null), 1500);
  };

  const totalValue = items.reduce((s, i) => s + i.price, 0);

  if (loading) {
    return (
      <section style={{background: "#000", padding: "80px 48px", textAlign: "center"}}>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 13, letterSpacing: "0.2em"}}>
          LOADING WISHLIST...
        </p>
      </section>
    );
  }

  return (
    <section style={{background: "#000", padding: "56px 48px 80px"}}>
      <style>{`
        .wl-wrap { max-width: 1280px; margin: 0 auto; }
        .wl-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
        .wl-sort select { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 11px; padding: 8px 32px 8px 12px; outline: none; cursor: pointer; appearance: none; letter-spacing: 0.08em; border-radius: 4px; }
        .wl-stats { display: flex; gap: 24px; flex-wrap: wrap; padding: 16px 20px; background: #0d0d0d; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; margin-bottom: 28px; }
        .wl-stat  { display: flex; flex-direction: column; gap: 2px; }
        .wl-stat-val   { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; color: #fff; letter-spacing: 0.06em; }
        .wl-stat-label { color: rgba(255,255,255,0.28); font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
        .wl-stat-divider { width: 1px; background: rgba(255,255,255,0.08); align-self: stretch; }
        .wl-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1100px) { .wl-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 760px)  { .wl-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .wl-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px)  { section { padding: 32px 20px 60px !important; } }
        .wl-card { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.3s, transform 0.3s; position: relative; }
        .wl-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-3px); }
        .wl-img { position: relative; aspect-ratio: 1/1; overflow: hidden; }
        .wl-img img { width: 100%; height: 100%; object-fit: cover; object-position: top; filter: grayscale(15%); transition: transform 0.7s; }
        .wl-card:hover .wl-img img { transform: scale(1.06); }
        .wl-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); transition: background 0.4s; }
        .wl-card:hover .wl-img-overlay { background: rgba(0,0,0,0.04); }
        .wl-oos { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; }
        .wl-oos span { background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); font-size: 9px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; padding: 6px 14px; }
        .wl-remove-btn { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.65); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.2s; color: rgba(255,255,255,0.7); }
        .wl-card:hover .wl-remove-btn { opacity: 1; }
        .wl-remove-btn:hover { background: #ef4444; color: #fff; }
        .wl-body { padding: 14px; flex: 1; display: flex; flex-direction: column; }
        .wl-cart-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 9px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; padding: 9px 0; cursor: pointer; transition: all 0.2s; border-radius: 6px; }
        .wl-cart-btn:hover { background: #ef4444; border-color: #ef4444; color: #fff; }
        .wl-cart-btn.added { background: #22c55e; border-color: #22c55e; color: #fff; }
        .wl-cart-btn.in-cart { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
        .wl-empty { text-align: center; padding: 80px 0; }
      `}</style>

      <div className="wl-wrap">
        {/* Top bar */}
        <div className="wl-topbar">
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.6rem,3vw,2.2rem)",
              color: "#fff",
              letterSpacing: "0.06em",
            }}>
            MY WISHLIST <span style={{color: "#ef4444"}}>({items.length})</span>
          </h2>
          <div className="wl-sort" style={{display: "flex", alignItems: "center", gap: 8}}>
            <span
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}>
              Sort by
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {sortOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        {items.length > 0 && (
          <div className="wl-stats">
            <div className="wl-stat">
              <span className="wl-stat-val">{items.length}</span>
              <span className="wl-stat-label">Saved Items</span>
            </div>
            <div className="wl-stat-divider" />
            <div className="wl-stat">
              <span className="wl-stat-val">{fmt(totalValue)}</span>
              <span className="wl-stat-label">Total Value</span>
            </div>
            <div className="wl-stat-divider" />
            <div className="wl-stat">
              <span className="wl-stat-val">{items.filter((i) => i.inStock).length}</span>
              <span className="wl-stat-label">In Stock</span>
            </div>
          </div>
        )}

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {sorted.length > 0 ? (
            <motion.div className="wl-grid">
              {sorted.map((item, i) => (
                <motion.div
                  key={item.wishlistId ?? item.productId}
                  layout
                  initial={{opacity: 0, y: 20}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, scale: 0.9}}
                  transition={{duration: 0.35, delay: i * 0.04}}
                  className="wl-card">
                  {/* Image */}
                  <div className="wl-img">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "rgba(255,255,255,0.04)",
                        }}
                      />
                    )}
                    <div className="wl-img-overlay" />
                    {!item.inStock && (
                      <div className="wl-oos">
                        <span>Out of Stock</span>
                      </div>
                    )}
                    {/* Tag pill */}
                    {item.tags && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "rgba(0,0,0,0.7)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}>
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#ef4444",
                            display: "inline-block",
                          }}
                        />
                        <span
                          style={{
                            color: "#fff",
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                          }}>
                          {item.tags
                            .split(",")
                            .map((t) => t.trim())
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {/* Discount */}
                    {item.comparePrice > item.price && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 8,
                          left: 10,
                          display: "flex",
                          gap: 4,
                        }}>
                        <span
                          style={{
                            background: "rgba(0,0,0,0.7)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.8)",
                            fontSize: 8,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 999,
                          }}>
                          SAVE {fmt(item.comparePrice - item.price)}
                        </span>
                        <span
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: 8,
                            fontWeight: 900,
                            padding: "2px 7px",
                            borderRadius: 999,
                          }}>
                          SALE
                        </span>
                      </div>
                    )}
                    {/* Remove heart */}
                    <button className="wl-remove-btn" onClick={() => handleRemove(item)}>
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Body */}
                  <div className="wl-body">
                    <span
                      style={{
                        color: "rgba(255,255,255,0.3)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        marginBottom: 4,
                        display: "block",
                      }}>
                      {item.brand}
                    </span>
                    <Link
                      to={`/shop/${item.slug}`}
                      style={{
                        color: "#fff",
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "1rem",
                        letterSpacing: "0.05em",
                        textDecoration: "none",
                        lineHeight: 1.2,
                        marginBottom: 10,
                        display: "block",
                      }}>
                      {item.name}
                    </Link>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        marginBottom: 12,
                        marginTop: "auto",
                      }}>
                      <span
                        style={{
                          color: "#ef4444",
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: "1.2rem",
                        }}>
                        {fmt(item.price)}
                      </span>
                      {item.comparePrice > item.price && (
                        <span
                          style={{
                            color: "rgba(255,255,255,0.2)",
                            fontSize: 10,
                            textDecoration: "line-through",
                          }}>
                          {fmt(item.comparePrice)}
                        </span>
                      )}
                    </div>
                    <div style={{display: "flex", gap: 8}}>
                      {item.inStock ? (
                        <button
                          className={`wl-cart-btn ${addedId === item.productId ? "added" : cartIds.includes(item.productId) ? "in-cart" : ""}`}
                          onClick={() => handleAddToCart(item)}>
                          {addedId === item.productId
                            ? "✓ Added"
                            : cartIds.includes(item.productId)
                              ? "In Cart"
                              : "Add to Cart"}
                        </button>
                      ) : (
                        <span
                          style={{
                            color: "rgba(255,255,255,0.25)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                          }}>
                          Unavailable
                        </span>
                      )}
                      <Link
                        to={`/shop/${item.slug}`}
                        style={{
                          width: 34,
                          height: 34,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6,
                          color: "rgba(255,255,255,0.4)",
                          textDecoration: "none",
                          flexShrink: 0,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#ef4444";
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                          e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                        }}>
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              className="wl-empty">
              <p
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.8rem",
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}>
                Your wishlist is empty
              </p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, marginBottom: 24}}>
                Save items you love while browsing the shop.
              </p>
              <Link
                to="/shop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "12px 28px",
                  textDecoration: "none",
                }}>
                Explore the Shop →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Move all to cart */}
        {items.filter((i) => i.inStock).length > 0 && (
          <div
            style={{
              marginTop: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: 36,
            }}>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12}}>
              {items.filter((i) => i.inStock).length} item
              {items.filter((i) => i.inStock).length !== 1 ? "s" : ""} available
            </p>
            <button
              onClick={() => items.filter((i) => i.inStock).forEach((i) => handleAddToCart(i))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#ef4444",
                color: "#fff",
                border: "none",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                padding: "13px 28px",
                cursor: "pointer",
                borderRadius: 6,
              }}>
              Move All to Cart
            </button>
            <Link
              to="/shop"
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}>
              Continue Shopping →
            </Link>
          </div>
        )}
      </div>

      {/* Size picker modal */}
      {sizeModal && (
        <div
          onClick={() => setSizeModal(null)}
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
              {sizeModal.sizes.map((s) => {
                const sizeId = s.id ?? null;
                const sizeLabel = s.size ?? s.name ?? s;
                return (
                  <button
                    key={sizeId ?? sizeLabel}
                    onClick={() => doAddToCart(sizeModal.productId, sizeId)}
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
              onClick={() => setSizeModal(null)}
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
    </section>
  );
}
