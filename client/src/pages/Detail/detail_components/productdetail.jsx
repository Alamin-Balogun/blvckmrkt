import {useState, useEffect, useCallback, useRef} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import {useCartWishlist, getToken} from "../../../components/cartcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

function fmt(n) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

// Details tab removed — we're already on the detail page
const tabs = ["Description", "Shipping", "Reviews"];

export default function ProductDetail() {
  const {id: slug} = useParams();
  const navigate = useNavigate();

  // ── API state ─────────────────────────────────────────────────────────────
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [related, setRelated] = useState([]);
  const [shipping, setShipping] = useState(null); // { zones, local, pickups }
  const [shippingLoading, setShippingLoading] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeImg, setActiveImg] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedSize, setSize] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState("Description");
  const [zoomOpen, setZoomOpen] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState("tops");
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingWish, setLoadingWish] = useState(false);
  const cycleRef = useRef(null);

  // ── Cart/Wishlist context ─────────────────────────────────────────────────
  const {
    cartIds,
    wishlistIds,
    addToCart: ctxAddToCart,
    removeFromWishlist: ctxRemoveWishlist,
    addToWishlist: ctxAddToWishlist,
  } = useCartWishlist();
  const isInCart = product ? cartIds.includes(product.id) : false;
  const isWished = product ? wishlistIds.includes(product.id) : false;

  // ── Fetch product ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(false);
    setActiveImg(0);
    setSize(null);
    setSelectedSizeId(null);
    setQty(1);
    setActiveTab("Description");
    setShipping(null);

    fetch(`${API_BASE}/api/shop/products/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((json) => {
        setProduct(json?.data ?? json);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  // ── Auto-cycle images (3s interval, pauses on hover) ─────────────────────
  useEffect(() => {
    if (!product) return;
    const imgs = buildImages(product);
    if (imgs.length < 2) return;

    const start = () => {
      cycleRef.current = setInterval(() => {
        if (!isHovering) {
          setActiveImg((i) => (i + 1) % imgs.length);
        }
      }, 3000);
    };

    start();
    return () => clearInterval(cycleRef.current);
  }, [product, isHovering]); // eslint-disable-line

  // ── Advance image on hover enter ──────────────────────────────────────────
  const handleImgHover = () => {
    setIsHovering(true);
    const imgs = buildImages(product);
    if (imgs.length > 1) {
      setActiveImg((i) => (i + 1) % imgs.length);
    }
  };

  // ── Fetch reviews ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "Reviews" || !product?.id) return;
    setReviewsLoading(true);
    fetch(`${API_BASE}/api/shop/products/${product.id}/reviews`)
      .then((r) => r.json())
      .then((json) => {
        const list = json?.data?.reviews ?? json?.data ?? (Array.isArray(json) ? json : []);
        setReviews(Array.isArray(list) ? list : []);
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [activeTab, product?.id]);

  // ── Fetch shipping when Shipping tab opened ───────────────────────────────
  useEffect(() => {
    if (activeTab !== "Shipping" || !product?.brand_id || shipping) return;
    setShippingLoading(true);
    fetch(`${API_BASE}/api/shop/brands/${product.brand_id}/shipping`)
      .then((r) => r.json())
      .then((json) => setShipping(json?.data ?? json))
      .catch(() => setShipping({zones: [], local: [], pickups: []}))
      .finally(() => setShippingLoading(false));
  }, [activeTab, product?.brand_id]); // eslint-disable-line

  // ── Fetch related ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!product) return;
    const params = new URLSearchParams();
    if (product.category_id) params.set("category_id", product.category_id);
    params.set("limit", 4);
    fetch(`${API_BASE}/api/shop/products?${params}`)
      .then((r) => r.json())
      .then((json) => {
        const data = json?.data ?? json;
        const list = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data)
            ? data
            : [];
        setRelated(list.filter((p) => p.id !== product.id).slice(0, 4));
      })
      .catch(() => setRelated([]));
  }, [product?.id, product?.category_id]); // eslint-disable-line

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!selectedSize && (product.sizes?.length ?? 0) > 0) return;
    if (buyDisabled) return;
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setLoadingCart(true);
    setAddedToCart(true);
    await ctxAddToCart(product.id, selectedSizeId);
    setLoadingCart(false);
    setTimeout(() => setAddedToCart(false), 2000);
  };

const handleBuyNow = () => {
  if (!selectedSize && (product.sizes?.length ?? 0) > 0) return;
  if (buyDisabled) return;
  // No login required — Buy Now supports guest checkout (bank transfer only,
  // see checkoutform.jsx). The cart itself still requires an account.
  // Navigate to checkout with just this product — Buy Now is single-item only.
  // The cart is not modified so existing cart items are unaffected.
  navigate("/checkout", {
    state: {
      source: "buyNow",
      product: {
        id: product.id,
        productId: product.id,
        name: product.name,
        brand: product.brand_name,
        brandId: product.brand_id,  // ✅ ADD THIS LINE
        size: selectedSize || "—",
        sizeId: selectedSizeId,
        price: Number(product.price),
        comparePrice: Number(product.compare_price ?? 0),
        qty: qty,
        image: product.primary_image || product.images?.[0]?.url || "",
        slug: product.slug,
      },
    },
  });
};

  const toggleWishlist = async () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setLoadingWish(true);
    if (isWished) {
      await ctxRemoveWishlist(product.id);
    } else {
      await ctxAddToWishlist(product.id);
    }
    setLoadingWish(false);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  function buildImages(p) {
    if (!p) return [];
    const imgs = (p.images ?? [])
      .map((img) => (typeof img === "string" ? img : img.url))
      .filter(Boolean);
    if (p.primary_image && !imgs.includes(p.primary_image)) imgs.unshift(p.primary_image);
    return imgs;
  }

  const images = buildImages(product);
  const sizes = product?.sizes ?? [];
  const hasSizes = sizes.length > 0;
  const needsSize = hasSizes && !selectedSize;

  // Out of stock: either the brand marked the whole product sold_out, or
  // every size row is at 0 stock. Products with no size rows at all aren't
  // stock-tracked, so they're never gated here.
  const selectedSizeStock = selectedSizeId != null
    ? sizes.find((s) => (typeof s === "object" ? s.id : null) === selectedSizeId)?.stock
    : null;
  const productSoldOut =
    product?.status === "sold_out" ||
    (hasSizes && sizes.every((s) => Number((typeof s === "object" ? s.stock : 0) ?? 0) <= 0));
  const selectedSizeSoldOut = selectedSizeId != null && Number(selectedSizeStock ?? 0) <= 0;
  const buyDisabled = productSoldOut || selectedSizeSoldOut;

  const isOnSale = product?.compare_price && Number(product.compare_price) > Number(product.price);
  const discount = isOnSale
    ? Math.round(
        ((Number(product.compare_price) - Number(product.price)) / Number(product.compare_price)) *
          100,
      )
    : null;

  const tags = product?.tags
    ? product.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{background: "#000", paddingTop: 120}}>
        <div style={{maxWidth: 1280, margin: "0 auto", padding: "0 48px 80px"}}>
          <div
            style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "start"}}>
            <div
              style={{
                aspectRatio: "3/4",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                animation: "pd-pulse 1.4s infinite",
              }}
            />
            <div style={{display: "flex", flexDirection: "column", gap: 20}}>
              {[120, 40, 200, 48, 48, 300].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: i === 2 ? 100 : i === 5 ? 200 : 24,
                    width: i < 2 ? `${w}px` : "100%",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 8,
                    animation: "pd-pulse 1.4s infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <style>{`@keyframes pd-pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        style={{
          minHeight: "60vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}>
        <p
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "3rem",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.1em",
          }}>
          PRODUCT NOT FOUND
        </p>
        <Link
          to="/shop"
          style={{
            color: "#ef4444",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}>
          ← Back to Shop
        </Link>
      </div>
    );
  }

  // Compute which shipping sections exist for the side-by-side layout
  const hasDeliveryOptions =
    shipping && (shipping.zones ?? []).some((z) => (z.methods ?? []).length > 0);
  const hasLocalRates = shipping && (shipping.local ?? []).length > 0;
  const hasPickups = shipping && (shipping.pickups ?? []).length > 0;
  // Left column: delivery options + local rates; Right column: pickups
  const hasLeftCol = hasDeliveryOptions || hasLocalRates;
  const hasRightCol = hasPickups;

  return (
    <div style={{background: "#000", paddingTop: 120}}>
      <style>{`
        .pd-wrap { max-width: 1280px; margin: 0 auto; padding: 0 48px 80px; }
        @media (max-width: 600px) { .pd-wrap { padding: 0 20px 60px; } }
        .pd-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 36px; flex-wrap: wrap; }
        .pd-breadcrumb a { color: rgba(255,255,255,0.28); font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; transition: color 0.2s; }
        .pd-breadcrumb a:hover { color: #fff; }
        .pd-breadcrumb span { color: rgba(255,255,255,0.15); font-size: 10px; }
        .pd-breadcrumb-current { color: rgba(255,255,255,0.5); font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
        .pd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
        @media (max-width: 900px) { .pd-grid { grid-template-columns: 1fr; gap: 32px; } }
        .pd-gallery { display: flex; gap: 12px; }
        @media (max-width: 600px) { .pd-gallery { flex-direction: column-reverse; } .pd-thumbs { flex-direction: row !important; overflow-x: auto; } }
        .pd-thumbs { display: flex; flex-direction: column; gap: 8px; }
        .pd-thumb { width: 72px; height: 72px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: border-color 0.2s; flex-shrink: 0; }
        .pd-thumb:hover { border-color: rgba(255,255,255,0.3); }
        .pd-thumb.active { border-color: #ef4444; }
        .pd-thumb img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(15%); }
        .pd-main-img { flex: 1; position: relative; border-radius: 14px; overflow: hidden; aspect-ratio: 3/4; cursor: zoom-in; }
        .pd-main-img img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(10%); transition: transform 0.6s; }
        .pd-main-img:hover img { transform: scale(1.04); }
        .pd-badge-overlay { position: absolute; top: 14px; left: 14px; display: flex; flex-direction: column; gap: 4px; }
        .pd-badge { font-size: 9px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; padding: 4px 10px; border-radius: 3px; }
        .pd-info { display: flex; flex-direction: column; gap: 20px; }
        .pd-brand-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .pd-brand-tag { color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; }
        .pd-verified { display: inline-flex; align-items: center; gap: 4px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #22c55e; font-size: 8px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; }
        .pd-tag-pill { display: inline-flex; align-items: center; gap: 5px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #ef4444; font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; }
        .pd-name { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2rem, 4vw, 3rem); color: #fff; letter-spacing: 0.04em; line-height: 1; margin: 0; }
        .pd-price-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
        .pd-price { font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem; color: #ef4444; letter-spacing: 0.04em; }
        .pd-original { font-size: 1.1rem; color: rgba(255,255,255,0.25); text-decoration: line-through; }
        .pd-discount { background: #22c55e; color: #fff; font-size: 9px; font-weight: 900; letter-spacing: 0.15em; padding: 3px 8px; border-radius: 3px; }
        .pd-meta { display: flex; gap: 12px; flex-wrap: wrap; }
        .pd-meta-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 5px 12px; display: flex; flex-direction: column; gap: 1px; }
        .pd-meta-key { color: rgba(255,255,255,0.25); font-size: 8px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }
        .pd-meta-val { color: #fff; font-size: 11px; font-weight: 700; }
        .pd-divider { height: 1px; background: rgba(255,255,255,0.07); }
        .pd-size-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .pd-size-label span { color: rgba(255,255,255,0.45); font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }
        .pd-size-guide { color: #ef4444; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
        .pd-sizes { display: flex; flex-wrap: wrap; gap: 8px; }
        .pd-size-btn { min-width: 48px; height: 40px; border: 1px solid rgba(255,255,255,0.12); background: none; color: rgba(255,255,255,0.45); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; cursor: pointer; transition: all 0.18s; padding: 0 12px; }
        .pd-size-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        .pd-size-btn.active { border-color: #ef4444; background: #ef4444; color: #fff; }
        .pd-size-error { color: #ef4444; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; }
        .pd-actions-row { display: flex; gap: 10px; align-items: stretch; }
        .pd-qty { display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; overflow: hidden; }
        .pd-qty-btn { width: 36px; height: 48px; background: none; border: none; color: rgba(255,255,255,0.5); font-size: 18px; cursor: pointer; transition: background 0.15s, color 0.15s; display: flex; align-items: center; justify-content: center; }
        .pd-qty-btn:hover { background: #ef4444; color: #fff; }
        .pd-qty-num { width: 36px; text-align: center; color: #fff; font-size: 13px; font-weight: 700; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1); height: 48px; line-height: 48px; background: rgba(255,255,255,0.03); }
        .pd-add-btn { flex: 1; background: #ef4444; color: #fff; border: none; font-size: 11px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; border-radius: 6px; height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .pd-add-btn:hover { background: #dc2626; }
        .pd-add-btn.success { background: #22c55e; }
        .pd-add-btn.in-cart { background: #16a34a; }
        .pd-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pd-buy-btn { width: 100%; background: #fff; color: #000; border: none; font-size: 11px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; cursor: pointer; transition: background 0.2s, transform 0.15s; border-radius: 6px; height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .pd-buy-btn:hover { background: #f0f0f0; transform: translateY(-1px); }
        .pd-buy-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
        .pd-wish-btn { width: 48px; height: 48px; border: 1px solid rgba(255,255,255,0.12); background: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .pd-wish-btn.active { border-color: #ef4444; background: rgba(239,68,68,0.1); }
        .pd-wish-btn:hover { border-color: #ef4444; }
        .pd-perks { display: flex; flex-direction: column; gap: 10px; }
        .pd-perk { display: flex; align-items: center; gap: 10px; }
        .pd-perk-icon { width: 28px; height: 28px; border-radius: 6px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pd-perk span { color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 0.04em; }
        .pd-perk strong { color: rgba(255,255,255,0.75); }
        .pd-tabs { max-width: 1280px; margin: 60px auto 0; padding: 0 48px; }
        @media (max-width: 600px) { .pd-tabs { padding: 0 20px; } }
        .pd-tab-nav { display: flex; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 28px; overflow-x: auto; }
        .pd-tab-btn { background: none; border: none; border-bottom: 2px solid transparent; color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; padding: 12px 20px; cursor: pointer; transition: all 0.2s; margin-bottom: -1px; white-space: nowrap; }
        .pd-tab-btn:hover { color: #fff; }
        .pd-tab-btn.active { color: #fff; border-bottom-color: #ef4444; }
        .pd-tab-body { color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.8; }
        .pd-tab-body ul { display: flex; flex-direction: column; gap: 8px; padding: 0; list-style: none; margin: 0; }
        .pd-tab-body li { display: flex; align-items: center; gap: 10px; }
        .pd-tab-body li::before { content: ''; width: 4px; height: 4px; background: #ef4444; border-radius: 50%; flex-shrink: 0; }
        /* Shipping tab styles */
        .pd-ship-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        @media (max-width: 768px) { .pd-ship-layout { grid-template-columns: 1fr; } }
        .pd-ship-layout.single-col { grid-template-columns: 1fr; max-width: 720px; }
        .pd-ship-zone { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 18px 20px; margin-bottom: 14px; }
        .pd-ship-zone:last-child { margin-bottom: 0; }
        .pd-ship-zone-name { color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .pd-ship-method { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.05); }
        .pd-ship-method:first-of-type { border-top: none; }
        .pd-ship-method-name { color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 600; }
        .pd-ship-method-desc { color: rgba(255,255,255,0.35); font-size: 10px; margin-top: 2px; }
        .pd-ship-method-price { color: #ef4444; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 0.04em; white-space: nowrap; }
        .pd-ship-free { color: #22c55e; font-size: 9px; font-weight: 700; letter-spacing: 0.15em; }
        .pd-pickup-card { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
        .pd-pickup-card:last-child { margin-bottom: 0; }
        .pd-ship-section-label { color: rgba(255,255,255,0.35); font-size: 9px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .pd-ship-section-label::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .pd-related { max-width: 1280px; margin: 60px auto 0; padding: 0 48px 80px; }
        @media (max-width: 600px) { .pd-related { padding: 0 20px 60px; } }
        .pd-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) { .pd-related-grid { grid-template-columns: repeat(2, 1fr); } }
        .pd-rel-card { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; transition: border-color 0.3s, transform 0.3s; }
        .pd-rel-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-3px); }
        .pd-rel-img { aspect-ratio: 1/1; overflow: hidden; }
        .pd-rel-img img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(15%); transition: transform 0.6s; }
        .pd-rel-card:hover .pd-rel-img img { transform: scale(1.05); }
        .pd-rel-body { padding: 12px 14px 14px; }
        .pd-zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 9999; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
        .pd-zoom-overlay img { max-width: 90vw; max-height: 90vh; object-fit: contain; }
        .pd-desc-text { color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.8; margin: 0; white-space: pre-line; }
        @keyframes pd-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pd-sg-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .pd-sg-modal { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; max-width: 560px; width: 100%; max-height: 85vh; overflow-y: auto; padding: 28px; }
        .pd-sg-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .pd-sg-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: 0.05em; color: #fff; margin: 0; }
        .pd-sg-close { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 13px; }
        .pd-sg-tabs { display: flex; gap: 8px; margin-bottom: 18px; }
        .pd-sg-tab { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; padding: 9px 0; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
        .pd-sg-tab.active { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.4); color: #ef4444; }
        .pd-sg-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .pd-sg-table th { text-align: left; color: rgba(255,255,255,0.3); font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 6px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .pd-sg-table td { color: rgba(255,255,255,0.65); padding: 8px 6px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pd-sg-note { color: rgba(255,255,255,0.3); font-size: 11px; line-height: 1.6; margin-top: 16px; }
      `}</style>

      <div className="pd-wrap">
        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/shop">Shop</Link>
          <span>›</span>
          {product.category_name && (
            <>
              <Link to="/shop">{product.category_name}</Link>
              <span>›</span>
            </>
          )}
          <span className="pd-breadcrumb-current">{product.name}</span>
        </div>

        <div className="pd-grid">
          {/* ── Gallery ── */}
          <motion.div
            initial={{opacity: 0, x: -20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.5}}
            className="pd-gallery">
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className={`pd-thumb ${activeImg === i ? "active" : ""}`}
                    onClick={() => setActiveImg(i)}>
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {/* Main image — auto-cycles, advances on hover */}
            <div
              className="pd-main-img"
              onClick={() => setZoomOpen(true)}
              onMouseEnter={handleImgHover}
              onMouseLeave={() => setIsHovering(false)}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={images[activeImg] || ""}
                  alt={product.name}
                  initial={{opacity: 0, scale: 1.03}}
                  animate={{opacity: 1, scale: 1}}
                  exit={{opacity: 0}}
                  transition={{duration: 0.3}}
                />
              </AnimatePresence>

              {/* Image counter dots */}
              {images.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 48,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 5,
                  }}>
                  {images.map((_, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImg(i);
                      }}
                      style={{
                        width: i === activeImg ? 16 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: i === activeImg ? "#ef4444" : "rgba(255,255,255,0.3)",
                        transition: "all 0.3s",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="pd-badge-overlay">
                {isOnSale && (
                  <span
                    className="pd-badge"
                    style={{background: "#22c55e", color: "#fff", marginBottom: 4}}>
                    SALE
                  </span>
                )}
                {tags.length > 0 && (
                  <span
                    className="pd-badge"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      color: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                    {tags[0]}
                  </span>
                )}
              </div>

              {images.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.1)",
                      fontSize: 14,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}>
                    No Image
                  </span>
                </div>
              )}

              {images.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    padding: "4px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}>
                  <svg
                    width="10"
                    height="10"
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="2"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zm-5-2v4m-2-2h4"
                    />
                  </svg>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                    }}>
                    ZOOM
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Info ── */}
          <motion.div
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.5, delay: 0.1}}
            className="pd-info">
            <div className="pd-brand-row">
              {product.brand_slug ? (
                <Link to={`/brands/${product.brand_slug}`} className="pd-brand-tag" style={{textDecoration: "none"}}>
                  {product.brand_name}
                </Link>
              ) : (
                <span className="pd-brand-tag">{product.brand_name}</span>
              )}
              <div className="pd-verified">
                <svg
                  width="8"
                  height="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </div>
              {tags.map((tag) => (
                <span key={tag} className="pd-tag-pill">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="pd-name">{product.name}</h1>

            <div className="pd-price-row">
              <span className="pd-price">{fmt(product.price)}</span>
              {isOnSale && (
                <>
                  <span className="pd-original">{fmt(product.compare_price)}</span>
                  <span className="pd-discount">−{discount}% OFF</span>
                </>
              )}
            </div>

            <div className="pd-meta">
              {product.category_name && (
                <div className="pd-meta-chip">
                  <span className="pd-meta-key">Category</span>
                  <span className="pd-meta-val">{product.category_name}</span>
                </div>
              )}
              {product.status && (
                <div className="pd-meta-chip">
                  <span className="pd-meta-key">Status</span>
                  <span className="pd-meta-val" style={{textTransform: "capitalize"}}>
                    {product.status}
                  </span>
                </div>
              )}
            </div>

            <div className="pd-divider" />

            {hasSizes && (
              <div>
                <div className="pd-size-label">
                  <span>
                    Select Size{" "}
                    {selectedSize && <span style={{color: "#ef4444"}}>— {selectedSize}</span>}
                  </span>
                  <button className="pd-size-guide" onClick={() => setShowSizeGuide(true)}>Size Guide</button>
                </div>
                <div className="pd-sizes">
                  {sizes.map((s) => {
                    const sizeLabel =
                      typeof s === "object" ? (s.size ?? s.name ?? String(s)) : String(s);
                    const sizeId = typeof s === "object" ? (s.id ?? null) : null;
                    const sizeGone = typeof s === "object" && Number(s.stock ?? 0) <= 0;
                    return (
                      <button
                        key={sizeId ?? sizeLabel}
                        disabled={sizeGone}
                        className={`pd-size-btn ${selectedSize === sizeLabel ? "active" : ""}`}
                        style={sizeGone ? {opacity: 0.35, textDecoration: "line-through", cursor: "not-allowed"} : undefined}
                        title={sizeGone ? "Out of stock" : undefined}
                        onClick={() => {
                          if (sizeGone) return;
                          setSize(sizeLabel);
                          setSelectedSizeId(sizeId);
                        }}>
                        {sizeLabel}
                      </button>
                    );
                  })}
                </div>
                {needsSize && (
                  <p className="pd-size-error" style={{marginTop: 8, fontSize: 10}}>
                    Please select a size to continue
                  </p>
                )}
              </div>
            )}

            <div className="pd-actions-row">
              <div className="pd-qty">
                <button className="pd-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <div className="pd-qty-num">{qty}</div>
                <button className="pd-qty-btn" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>

              {/* Add to Cart — green "In Cart" when already added */}
              <button
                className={`pd-add-btn ${addedToCart ? "success" : isInCart ? "in-cart" : ""}`}
                onClick={handleAddToCart}
                disabled={needsSize || loadingCart || buyDisabled}>
                {buyDisabled ? (
                  "Out of Stock"
                ) : addedToCart ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Added to Cart!
                  </>
                ) : isInCart ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    In Cart
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
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
                    Add to Cart
                  </>
                )}
              </button>

              <button
                className={`pd-wish-btn ${isWished ? "active" : ""}`}
                onClick={toggleWishlist}
                disabled={loadingWish}>
                <svg
                  width="18"
                  height="18"
                  fill={isWished ? "#ef4444" : "none"}
                  stroke={isWished ? "#ef4444" : "rgba(255,255,255,0.5)"}
                  strokeWidth="1.8"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>

            <button
              className="pd-buy-btn"
              onClick={handleBuyNow}
              disabled={needsSize || loadingCart || buyDisabled}>
              {buyDisabled ? (
                "Out of Stock"
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Buy Now
                </>
              )}
            </button>

            <div className="pd-divider" />

            <div className="pd-perks">
              {[
                {
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  ),
                  text: (
                    <>
                      <strong>100% Authentic</strong> — every item verified before dispatch
                    </>
                  ),
                },
                {
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  ),
                  text: (
                    <>
                      <strong>Free shipping</strong> on orders over ₦50,000
                    </>
                  ),
                },
                {
                  icon: (
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                  ),
                  text: (
                    <>
                      <strong>14-day returns</strong> — hassle-free
                    </>
                  ),
                },
              ].map((p, i) => (
                <div key={i} className="pd-perk">
                  <div className="pd-perk-icon">{p.icon}</div>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="pd-tabs">
        <div className="pd-tab-nav">
          {tabs.map((t) => (
            <button
              key={t}
              className={`pd-tab-btn ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0}}
            transition={{duration: 0.25}}
            className="pd-tab-body">
            {activeTab === "Description" && (
              <p className="pd-desc-text" style={{maxWidth: 720}}>
                {product.description || "No description available."}
              </p>
            )}

            {activeTab === "Shipping" && (
              <div>
                {shippingLoading ? (
                  <div className="pd-ship-layout">
                    <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: 120,
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 10,
                            animation: "pd-pulse 1.4s infinite",
                          }}
                        />
                      ))}
                    </div>
                    <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: 120,
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 10,
                            animation: "pd-pulse 1.4s infinite",
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : !shipping || (!hasDeliveryOptions && !hasLocalRates && !hasPickups) ? (
                  <p style={{color: "rgba(255,255,255,0.3)"}}>
                    No shipping information available for this product.
                  </p>
                ) : (
                  <div
                    className={`pd-ship-layout${hasLeftCol && hasRightCol ? "" : " single-col"}`}>
                    {/* ── Left Column: Delivery Options + Local Rates ── */}
                    {hasLeftCol && (
                      <div>
                        {/* Delivery Options (Zones) */}
                        {hasDeliveryOptions && (
                          <div style={{marginBottom: hasLocalRates ? 28 : 0}}>
                            <p className="pd-ship-section-label">
                              <svg
                                width="12"
                                height="12"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                                />
                              </svg>
                              Delivery Options
                            </p>
                            {(shipping.zones ?? []).map(
                              (zone) =>
                                (zone.methods ?? []).length > 0 && (
                                  <div key={zone.id} className="pd-ship-zone">
                                    <div className="pd-ship-zone-name">
                                      <svg
                                        width="10"
                                        height="10"
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                                        />
                                      </svg>
                                      {zone.name}
                                      {zone.locations?.length > 0 && (
                                        <span
                                          style={{
                                            color: "rgba(255,255,255,0.25)",
                                            fontSize: 9,
                                            fontWeight: 400,
                                            letterSpacing: "0.1em",
                                            textTransform: "none",
                                          }}>
                                          (
                                          {zone.locations
                                            .map((l) =>
                                              l.state ? `${l.country}, ${l.state}` : l.country,
                                            )
                                            .join(" · ")}
                                          )
                                        </span>
                                      )}
                                    </div>
                                    {zone.methods.map((method) => (
                                      <div key={method.id} className="pd-ship-method">
                                        <div>
                                          <div className="pd-ship-method-name">{method.name}</div>
                                          {method.description && (
                                            <div className="pd-ship-method-desc">
                                              {method.description}
                                            </div>
                                          )}
                                          {method.min_days && method.max_days && (
                                            <div className="pd-ship-method-desc">
                                              Est. {method.min_days}–{method.max_days} days
                                            </div>
                                          )}
                                          {method.free_above != null && (
                                            <div className="pd-ship-free">
                                              Free above {method.currency_symbol || ""}
                                              {Number(method.free_above).toLocaleString()}{" "}
                                              {method.currency || ""}
                                            </div>
                                          )}
                                        </div>
                                        <div className="pd-ship-method-price">
                                          {method.flat_rate > 0 ? (
                                            `${method.currency_symbol || ""}${Number(method.flat_rate).toLocaleString()}`
                                          ) : (
                                            <span
                                              style={{
                                                color: "#22c55e",
                                                fontSize: 10,
                                                fontWeight: 700,
                                              }}>
                                              FREE
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ),
                            )}
                          </div>
                        )}

                        {/* Local Rates */}
                        {hasLocalRates && (
                          <div>
                            <p className="pd-ship-section-label">
                              <svg
                                width="12"
                                height="12"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              Local Rates
                            </p>
                            {shipping.local.map((r) => (
                              <div key={r.id} className="pd-ship-zone">
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}>
                                  <div>
                                    <div
                                      style={{
                                        color: "rgba(255,255,255,0.8)",
                                        fontSize: 12,
                                        fontWeight: 600,
                                      }}>
                                      {r.state}, {r.country}
                                    </div>
                                    {r.city && (
                                      <div
                                        style={{
                                          color: "rgba(255,255,255,0.3)",
                                          fontSize: 10,
                                          marginTop: 2,
                                        }}>
                                        {r.city}
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      color: "#ef4444",
                                      fontFamily: "'Bebas Neue',sans-serif",
                                      fontSize: "1.1rem",
                                    }}>
                                    {r.currency_symbol}
                                    {Number(r.base_price).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Right Column: Pickup Locations ── */}
                    {hasRightCol && (
                      <div>
                        <p className="pd-ship-section-label">
                          <svg
                            width="12"
                            height="12"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          Pickup Locations
                        </p>
                        {shipping.pickups.map((p) => (
                          <div key={p.id} className="pd-pickup-card">
                            <div
                              style={{
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 700,
                                marginBottom: 4,
                              }}>
                              {p.name}
                            </div>
                            <div style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>
                              {p.address}, {p.city}
                              {p.state ? `, ${p.state}` : ""}, {p.country}
                            </div>
                            {p.phone && (
                              <div
                                style={{
                                  color: "rgba(255,255,255,0.35)",
                                  fontSize: 10,
                                  marginTop: 4,
                                }}>
                                📞 {p.phone}
                              </div>
                            )}
                            {p.instructions && (
                              <div
                                style={{
                                  color: "rgba(255,255,255,0.3)",
                                  fontSize: 10,
                                  marginTop: 4,
                                  fontStyle: "italic",
                                }}>
                                {p.instructions}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

{activeTab === "Reviews" && (
  <div style={{display: "flex", flexDirection: "column", gap: 20, maxWidth: 720}}>
    {reviewsLoading ? (
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 80,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              animation: "pd-pulse 1.4s infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    ) : reviews.length > 0 ? (
      reviews.map((r, idx) => (
        <div
          key={r.id ?? idx}
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: "16px 18px",
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}>
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 900,
                }}>
                {(r.user_name ?? r.name ?? "U")[0].toUpperCase()}
              </div>
              <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>
                {r.user_name ?? r.name ?? "User"}
              </span>
            </div>
            <span style={{color: "rgba(255,255,255,0.25)", fontSize: 10}}>
              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
            </span>
          </div>
          
          {/* ✅ Star Rating */}
          <div style={{display: "flex", gap: 2, marginBottom: 8}}>
            {Array.from({length: 5}).map((_, i) => (
              <span
                key={i}
                style={{
                  color: i < (r.rating ?? 5) ? "#facc15" : "rgba(255,255,255,0.1)",
                  fontSize: 12,
                }}>
                ★
              </span>
            ))}
          </div>

          {/* ✅ ADD THIS: Review Title */}
          {r.title && (
            <h4
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                margin: "0 0 8px 0",
                letterSpacing: "0.02em",
              }}>
              {r.title}
            </h4>
          )}

          {/* ✅ Review Body */}
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              lineHeight: 1.7,
              margin: 0,
            }}>
            {r.comment ?? r.body ?? r.text ?? ""}
          </p>
        </div>
      ))
    ) : (
      <div
        style={{
          textAlign: "center",
          padding: "40px 0",
          color: "rgba(255,255,255,0.2)",
        }}>
        <p style={{fontSize: 13, margin: "0 0 4px"}}>No reviews yet</p>
        <p style={{fontSize: 11}}>Be the first to review this product</p>
      </div>
    )}
  </div>
)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Related ── */}
      {related.length > 0 && (
        <div className="pd-related">
          <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 24}}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ef4444",
                display: "inline-block",
              }}
            />
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.6rem",
                color: "#fff",
                letterSpacing: "0.08em",
                margin: 0,
              }}>
              You May Also Like
            </h2>
          </div>
          <div className="pd-related-grid">
            {related.map((p, i) => {
              const relImg = p.primary_image || (p.images?.[0]?.url ?? p.images?.[0]) || "";
              return (
                <motion.div
                  key={p.id}
                  initial={{opacity: 0, y: 16}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.35, delay: i * 0.07}}
                  className="pd-rel-card">
                  <Link to={`/shop/${p.slug || p.id}`} style={{textDecoration: "none"}}>
                    <div className="pd-rel-img">
                      {relImg ? (
                        <img src={relImg} alt={p.name} />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "rgba(255,255,255,0.04)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <span
                            style={{
                              color: "rgba(255,255,255,0.1)",
                              fontSize: 10,
                              letterSpacing: "0.2em",
                              textTransform: "uppercase",
                            }}>
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="pd-rel-body">
                      <p
                        style={{
                          color: "rgba(255,255,255,0.28)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          margin: "0 0 4px",
                        }}>
                        {p.brand_name}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: "0.95rem",
                          color: "#fff",
                          letterSpacing: "0.05em",
                          margin: "0 0 8px",
                          lineHeight: 1.2,
                        }}>
                        {p.name}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}>
                        <span
                          style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: "1.1rem",
                            color: "#ef4444",
                          }}>
                          {fmt(p.price)}
                        </span>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                          }}>
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Zoom ── */}
      <AnimatePresence>
        {zoomOpen && images.length > 0 && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="pd-zoom-overlay"
            onClick={() => setZoomOpen(false)}>
            <motion.img
              initial={{scale: 0.9}}
              animate={{scale: 1}}
              exit={{scale: 0.9}}
              src={images[activeImg]}
              alt={product.name}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Size Guide ── */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="pd-sg-overlay"
            onClick={() => setShowSizeGuide(false)}>
            <motion.div
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 12}}
              className="pd-sg-modal"
              onClick={(e) => e.stopPropagation()}>
              <div className="pd-sg-head">
                <p className="pd-sg-title">Size Guide</p>
                <button className="pd-sg-close" onClick={() => setShowSizeGuide(false)}>✕</button>
              </div>

              <div className="pd-sg-tabs">
                {[
                  {key: "tops", label: "Tops"},
                  {key: "bottoms", label: "Bottoms"},
                  {key: "shoes", label: "Shoes"},
                ].map((t) => (
                  <button
                    key={t.key}
                    className={`pd-sg-tab ${sizeGuideTab === t.key ? "active" : ""}`}
                    onClick={() => setSizeGuideTab(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {sizeGuideTab === "tops" && (
                <table className="pd-sg-table">
                  <thead>
                    <tr><th>Size</th><th>Chest (in)</th><th>Chest (cm)</th><th>US</th><th>UK</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ["XS", "32–34", "81–86", "XS", "6–8"],
                      ["S", "35–37", "89–94", "S", "8–10"],
                      ["M", "38–40", "97–102", "M", "10–12"],
                      ["L", "41–43", "104–109", "L", "12–14"],
                      ["XL", "44–46", "112–117", "XL", "14–16"],
                      ["XXL", "47–49", "119–124", "XXL", "16–18"],
                    ].map((row) => (
                      <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              )}

              {sizeGuideTab === "bottoms" && (
                <table className="pd-sg-table">
                  <thead>
                    <tr><th>Size</th><th>Waist (in)</th><th>Waist (cm)</th><th>US</th><th>UK</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ["XS", "28–29", "71–74", "26", "6"],
                      ["S", "30–31", "76–79", "28", "8"],
                      ["M", "32–33", "81–84", "30", "10"],
                      ["L", "34–36", "86–91", "32", "12"],
                      ["XL", "37–39", "94–99", "34", "14"],
                      ["XXL", "40–42", "102–107", "36", "16"],
                    ].map((row) => (
                      <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              )}

              {sizeGuideTab === "shoes" && (
                <table className="pd-sg-table">
                  <thead>
                    <tr><th>US</th><th>UK</th><th>EU</th><th>CM</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ["6", "5.5", "39", "24"],
                      ["7", "6.5", "40", "25"],
                      ["8", "7.5", "41", "26"],
                      ["9", "8.5", "42.5", "27"],
                      ["10", "9.5", "44", "28"],
                      ["11", "10.5", "45", "29"],
                      ["12", "11.5", "46", "30"],
                    ].map((row) => (
                      <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              )}

              <p className="pd-sg-note">
                Sizing is a general guide and can vary slightly by brand and cut. If you're between
                sizes, or unsure, we recommend sizing up — check the product description for any
                brand-specific fit notes.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
