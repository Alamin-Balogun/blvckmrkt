import {useState, useEffect, useCallback, useRef} from "react";
import {useShopContent} from "./shopcontentcontext";
import {motion, AnimatePresence} from "framer-motion";
import {Link, useSearchParams, useNavigate} from "react-router-dom";
import {useCartWishlist, getToken} from "../../../components/cartcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low"];
const PER_PAGE = 15;
const CAT_SHOW = 10;
const BRAND_SHOW = 10;
const PRICE_MIN = 0;
const PRICE_MAX = 200000;

// Derives what to show on a product card:
//   tags     — raw DB tags joined as one string: "smartphone, samsung, android"
//   isOnSale — whether compare_price > price
//   saving   — the ₦ discount amount
//   isNew    — no tags, no sale, added within 7 days
function getProductMeta(p) {
  const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
  const saving = isOnSale ? Number(p.compare_price) - Number(p.price) : null;

  // All DB tags joined into one comma-separated string
  const tags = p.tags
    ? p.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(", ")
    : "";

  const isNew =
    !tags && !isOnSale && Date.now() - new Date(p.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  return {tags, saving, isOnSale, isNew};
}

function fmt(n) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

export default function ProductGrid() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catCounts, setCatCounts] = useState({}); // { catId: count }
  const [brandCounts, setBrandCounts] = useState({}); // { brandId: count }
  const [countsReady, setCountsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0); // filtered result count
  const [totalPages, setTotalPages] = useState(1);
  const [quickAddWish, setQuickAddWish] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  const initBrandId    = Number(searchParams.get("brand_id")    || 0);
  const initCategoryId = Number(searchParams.get("category_id") || 0);
  const [activeCategory,   setActiveCategory]   = useState("All");
  const [activeCategoryId, setActiveCategoryId] = useState(initCategoryId || null);
  const [sortBy, setSortBy] = useState("Newest");
  const [page, setPage] = useState(1);
  const [priceMin, setPriceMin] = useState(PRICE_MIN);
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [selectedBrandIds, setSelectedBrandIds] = useState(initBrandId ? [initBrandId] : []);
  const [search, setSearch] = useState("");

  // ── Sidebar UI ────────────────────────────────────────────────────────────
  const [catSearch, setCatSearch] = useState("");
  const [catExpanded, setCatExpanded] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [brandExpanded, setBrandExpanded] = useState(false);

  // ── Card UI — powered by shared CartWishlistContext ─────────────────────
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
  const navigate = useNavigate();

  // Avoid setSearchParams causing render loops
  const setSearchParamsRef = useRef(setSearchParams);

  // ── Sticky sidebar via JS scroll — works even when a parent has overflow set ──
  const sidebarRef = useRef(null);
  const wrapRef = useRef(null);
  useEffect(() => {
    const NAVBAR_H = 88; // adjust if your navbar is taller/shorter
    const GAP = 16;

    const onScroll = () => {
      const sidebar = sidebarRef.current;
      const wrap = wrapRef.current;
      if (!sidebar || !wrap) return;

      const wrapRect = wrap.getBoundingClientRect();
      const sidebarH = sidebar.offsetHeight;
      const maxTop = wrap.offsetHeight - sidebarH; // can't go below wrap bottom
      const scrolledPast = -wrapRect.top + NAVBAR_H + GAP;
      const clampedTop = Math.min(Math.max(scrolledPast, 0), maxTop);

      sidebar.style.transform = `translateY(${clampedTop}px)`;
    };

    window.addEventListener("scroll", onScroll, {passive: true});
    onScroll(); // run once on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setSearchParamsRef.current = setSearchParams;
  }, [setSearchParams]);
  const updateUrl = useCallback((brandIds) => {
    if (brandIds.length === 1) setSearchParamsRef.current({brand_id: brandIds[0]}, {replace: true});
    else setSearchParamsRef.current({}, {replace: true});
  }, []);

  // ── Fetch brands — verified + active/trial only ─────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/shop/brands`)
      .then((r) => r.json())
      .then((json) => {
        // ListBrands returns { data: { brands: [] } }
        const list = json?.data?.brands ?? json?.data ?? (Array.isArray(json) ? json : []);
        setBrands(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // ── Fetch categories ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/shop/categories`)
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        setCategories(list);
      })
      .catch(() => {});
  }, []);

  // ── Resolve active category name when navigating from FeaturedCollections ────────
  // Once categories load, if initCategoryId is set, find its name so the
  // sidebar button highlights correctly.
  useEffect(() => {
    if (!initCategoryId || categories.length === 0) return;
    const match = categories.find((c) => c.id === initCategoryId);
    if (match) setActiveCategory(match.name);
  }, [categories, initCategoryId]);

  // ── Fetch counts (/api/shop/counts) ─────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/shop/counts`)
      .then((r) => {
        if (!r.ok) throw new Error("counts 404");
        return r.json();
      })
      .then((json) => {
        const data = json?.data ?? json;
        const cc = {};
        const bc = {};
        if (data?.categories) {
          Object.entries(data.categories).forEach(([k, v]) => {
            cc[Number(k)] = v;
          });
        }
        if (data?.brands) {
          Object.entries(data.brands).forEach(([k, v]) => {
            bc[Number(k)] = v;
          });
        }
        setCatCounts(cc);
        setBrandCounts(bc);
        setCountsReady(true);
      })
      .catch(() => setCountsReady(false));
  }, []);

  // ── Fetch filtered products ───────────────────────────────────────────────
  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", PER_PAGE);
    if (search) params.set("search", search);
    if (activeCategoryId) params.set("category_id", activeCategoryId);
    if (selectedBrandIds.length > 0) params.set("brand_ids", selectedBrandIds.join(","));
    if (priceMin > PRICE_MIN) params.set("min_price", priceMin);
    if (priceMax < PRICE_MAX) params.set("max_price", priceMax);
    if (sortBy === "Price: Low to High") params.set("sort", "price_asc");
    if (sortBy === "Price: High to Low") params.set("sort", "price_desc");

    fetch(`${API_BASE}/api/shop/products?${params}`)
      .then((r) => r.json())
      .then((json) => {
        const data = json?.data ?? json;
        const list = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data)
            ? data
            : [];
        setProducts(list);
        setTotal(data?.total ?? list.length);
        setTotalPages(data?.pages ?? Math.ceil((data?.total ?? list.length) / PER_PAGE));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [page, search, activeCategoryId, selectedBrandIds, priceMin, priceMax, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleBrand = (id) => {
    setSelectedBrandIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      updateUrl(next);
      return next;
    });
    setPage(1);
  };

  const handleCategory = (name, id) => {
    setActiveCategory(name);
    setActiveCategoryId(id ?? null);
    setPage(1);
  };

  // Cart & wishlist state managed by CartWishlistContext

  // ── Wishlist toggle ──────────────────────────────────────────────────────
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

  // ── Cart icon — toggle: add if not in cart, remove if already in cart ──────
  const addToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) {
      navigate("/login");
      return;
    }
    if (cart.includes(product.id)) {
      // Already in cart → remove it
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
    // Find the cart item id for this product
    const cartItem = cartItems.find((i) => (i.product_id ?? i.id) === productId);
    if (!cartItem) return;
    setLoadingCartId(productId);
    await ctxRemoveFromCart(cartItem.id, productId);
    setLoadingCartId(null);
  };

  const clearAll = () => {
    setActiveCategory("All");
    setActiveCategoryId(null);
    setSearch("");
    setPriceMin(PRICE_MIN);
    setPriceMax(PRICE_MAX);
    setSelectedBrandIds([]);
    setPage(1);
    updateUrl([]);
  };

  const hasFilters =
    activeCategory !== "All" ||
    search ||
    selectedBrandIds.length > 0 ||
    priceMin > PRICE_MIN ||
    priceMax < PRICE_MAX;

  // ── Sidebar filtered lists ────────────────────────────────────────────────
  // totalAll = true sum of all active products, never affected by active filters
  const totalAll = Object.values(catCounts).reduce((sum, n) => sum + n, 0);

  // Once counts load, only list categories that have ≥1 active product.
  // Before counts arrive, show all (so sidebar is never blank on first render).
  const filteredCats = categories.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(catSearch.toLowerCase());
    const hasProducts = countsReady ? (catCounts[c.id] ?? 0) > 0 : true;
    return matchesSearch && hasProducts;
  });
  const visibleCats = catExpanded ? filteredCats : filteredCats.slice(0, CAT_SHOW);
  const hiddenCatCount = Math.max(0, filteredCats.length - CAT_SHOW);

  const filteredBrands = brands.filter((b) =>
    b.brand_name.toLowerCase().includes(brandSearch.toLowerCase()),
  );
  const visibleBrands = brandExpanded ? filteredBrands : filteredBrands.slice(0, BRAND_SHOW);
  const hiddenBrandCount = Math.max(0, filteredBrands.length - BRAND_SHOW);

  // Price slider fill percentages
  const leftPct = ((priceMin - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const rightPct = ((priceMax - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const activeBrandName =
    selectedBrandIds.length > 0
      ? selectedBrandIds
          .map((id) => brands.find((b) => b.id === id)?.brand_name ?? "")
          .filter(Boolean)
          .join(", ")
      : "";

  // ── CMS ───────────────────────────────────────────────────────────────────
  const sectionTag = useShopContent("grid_section_tag", "✦ Fresh Off The Rack");
  const sectionTitle = useShopContent("grid_section_title", "BROWSE THE");
  const sectionTitleRed = useShopContent("grid_section_title_red", "CATALOGUE");
  const resultLabel = useShopContent("grid_result_label", "results");
  const searchPlaceholder = useShopContent("search_placeholder", "Search products or brands...");
  const emptyMsg = useShopContent("empty_state_msg", "No products match your filters.");
  const emptyCta = useShopContent("empty_state_cta", "Clear All Filters");

  return (
    <>
      <div
        style={{maxWidth: 1280, margin: "0 auto", padding: "100px 48px 48px", overflow: "visible"}}>
        <style>{`
        .pg-wrap    { display: flex; gap: 36px; align-items: flex-start; overflow: visible; }
        .pg-sidebar { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; }
        .pg-grid    { flex: 1; min-width: 0; }
        .pg-sb-section { padding: 20px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .pg-sb-section:first-child { padding-top: 0; }
        .pg-sb-title { color: #fff; font-weight: 700; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; margin: 0 0 14px 0; display: flex; justify-content: space-between; align-items: center; }
        .pg-sb-reset { background: none; border: none; color: rgba(239,68,68,0.7); font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; padding: 0; }
        .pg-sb-reset:hover { color: #ef4444; }
        .pg-sb-search { position: relative; margin-bottom: 10px; }
        .pg-sb-search input { width: 100%; background: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 11px; padding: 7px 10px 7px 30px; outline: none; box-sizing: border-box; transition: border-color 0.2s; }
        .pg-sb-search input:focus { border-color: rgba(239,68,68,0.5); }
        .pg-sb-search input::placeholder { color: rgba(255,255,255,0.2); }
        .pg-sb-search svg { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .pg-cat-btn { width: 100%; text-align: left; background: none; border: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; font-size: 12px; letter-spacing: 0.04em; color: rgba(255,255,255,0.4); transition: color 0.2s, background 0.2s; border-radius: 2px; }
        .pg-cat-btn:hover { color: #fff; background: rgba(255,255,255,0.04); }
        .pg-cat-btn.active { color: #fff; background: #ef4444; font-weight: 700; }
        .pg-cat-count { font-size: 10px; background: rgba(255,255,255,0.1); padding: 1px 7px; border-radius: 99px; color: rgba(255,255,255,0.6); min-width: 22px; text-align: center; }
        .pg-cat-btn.active .pg-cat-count { background: rgba(255,255,255,0.25); color: #fff; }
        .pg-show-more { background: none; border: none; color: #ef4444; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; padding: 8px 0 0; display: flex; align-items: center; gap: 4px; }
        .pg-show-more:hover { opacity: 0.75; }
        .pg-price-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 8px; }
        .pg-price-input { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 11px; font-weight: 700; width: 88px; padding: 7px 8px; outline: none; text-align: center; transition: border-color 0.2s; box-sizing: border-box; }
        .pg-price-input:focus { border-color: rgba(239,68,68,0.5); }
        .pg-price-sep { color: rgba(255,255,255,0.2); font-size: 12px; }
        .pg-range-wrap { position: relative; height: 24px; margin-bottom: 6px; }
        .pg-range-track { position: absolute; top: 50%; transform: translateY(-50%); left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; }
        .pg-range-fill  { position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: #ef4444; border-radius: 2px; }
        .pg-range { position: absolute; width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; top: 50%; transform: translateY(-50%); outline: none; }
        .pg-range::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #ef4444; border: 2px solid #0a0a0a; cursor: pointer; pointer-events: all; transition: transform 0.15s; }
        .pg-range::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .pg-price-labels { display: flex; justify-content: space-between; margin-top: 4px; }
        .pg-brand-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; cursor: pointer; }
        .pg-brand-cb { width: 14px; height: 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 2px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background 0.15s, border-color 0.15s; }
        .pg-brand-cb.checked { background: #ef4444; border-color: #ef4444; }
        .pg-brand-label { color: rgba(255,255,255,0.4); font-size: 12px; transition: color 0.2s; flex: 1; }
        .pg-brand-item:hover .pg-brand-label { color: #fff; }
        .pg-brand-count { color: rgba(255,255,255,0.25); font-size: 10px; background: rgba(255,255,255,0.06); padding: 1px 6px; border-radius: 99px; min-width: 18px; text-align: center; }
        .pg-clear-all { background: none; border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 9px; width: 100%; cursor: pointer; transition: all 0.2s; margin-top: 20px; }
        .pg-clear-all:hover { background: #ef4444; color: #fff; }
        .pg-filter-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #ef4444; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; margin-bottom: 16px; }
        .pg-filter-pill button { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0; font-size: 13px; line-height: 1; }
        .pg-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .pg-search { position: relative; }
        .pg-search input { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 12px; padding: 10px 14px 10px 36px; outline: none; width: 240px; transition: border-color 0.2s; }
        .pg-search input:focus { border-color: rgba(239,68,68,0.6); }
        .pg-search input::placeholder { color: rgba(255,255,255,0.22); }
        .pg-search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .pg-sort { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 11px; padding: 10px 14px; outline: none; cursor: pointer; }
        .pg-count { color: rgba(255,255,255,0.25); font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; }
        .pg-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 1024px) { .pg-sidebar { display: none; } .pg-cards { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 560px)  { .pg-cards { grid-template-columns: repeat(2, 1fr); gap: 10px; } .pg-card-body { padding: 10px 10px 12px; } .pg-name { font-size: 0.88rem; margin-bottom: 6px; } .pg-brand { font-size: 8px; margin-bottom: 3px; } .pg-price { font-size: 1.05rem; } .pg-original { font-size: 9px; } .pg-view { font-size: 9px; } .pg-sizes { gap: 3px; margin-bottom: 10px; } .pg-icon-btn { width: 26px; height: 26px; } }
        @media (max-width: 380px)  { .pg-cards { grid-template-columns: repeat(1, 1fr); } }
        .pg-card { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.3s, transform 0.3s; }
        .pg-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-3px); }
        .pg-card-img { position: relative; aspect-ratio: 3/3.5; overflow: hidden; }
        .pg-card-img img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform 0.7s; filter: grayscale(15%); }
        .pg-card:hover .pg-card-img img { transform: scale(1.06); }
        .pg-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); transition: background 0.4s; }
        .pg-card:hover .pg-overlay { background: rgba(0,0,0,0.05); }
        /* ── Product card badges ── */
        .pg-badge-area { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 4px; max-width: calc(100% - 52px); }
        /* Single tag pill — dark frosted, all tags in one pill */
        .pg-tag-pill   { display: inline-flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.70); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.85); font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .pg-tag-dot    { width: 5px; height: 5px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
        /* SAVE + SALE row — side by side */
        .pg-sale-row   { display: flex; align-items: center; gap: 4px; }
        .pg-save-badge { background: rgba(0,0,0,0.70); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.80); font-size: 8px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
        .pg-sale-badge { background: #ef4444; color: #fff; font-size: 8px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
        .pg-new-badge  { background: rgba(255,255,255,0.90); color: #000; font-size: 8px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
        .pg-icons { position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 6px; }
        .pg-icon-btn { width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s, background 0.2s, transform 0.2s; }
        .pg-card:hover .pg-icon-btn { opacity: 1; }
        .pg-icon-btn:hover { transform: scale(1.1); }
        .pg-icon-btn.cart { background: #ef4444; opacity: 1; }
        .pg-icon-btn.cart-added { background: #22c55e; opacity: 1; }
        .pg-icon-btn.wish-active { background: #ef4444; opacity: 1; }
        .pg-quick-add { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; color: #000; font-size: 10px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; padding: 11px; text-align: center; border: none; cursor: pointer; transform: translateY(100%); transition: transform 0.3s, background 0.2s, color 0.2s; }
        .pg-card:hover .pg-quick-add { transform: translateY(0); }
        .pg-quick-add:hover { background: #ef4444; color: #fff; }
        .pg-card-body { padding: 16px 16px 18px; flex: 1; display: flex; flex-direction: column; }
        .pg-brand  { color: rgba(255,255,255,0.28); font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 5px; }
        .pg-name   { color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 1.05rem; letter-spacing: 0.05em; font-weight: 900; line-height: 1.2; margin-bottom: 10px; text-decoration: none; display: block; transition: color 0.2s; }
        .pg-name:hover { color: #ef4444; }
        .pg-sizes  { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }
        .pg-size   { border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); font-size: 8px; font-weight: 700; padding: 2px 5px; }
        .pg-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
        .pg-price  { font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem; color: #fff; font-weight: 900; }
        .pg-original { font-size: 11px; color: rgba(255,255,255,0.22); text-decoration: line-through; margin-left: 6px; }
        .pg-view   { color: rgba(255,255,255,0.35); font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; display: flex; align-items: center; gap: 3px; transition: color 0.2s; }
        .pg-view:hover { color: #ef4444; }
        .pg-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 36px; }
        .pg-page-btn { width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.15); background: none; color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .pg-page-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        .pg-page-btn.active { background: #ef4444; border-color: #ef4444; color: #fff; }
        .pg-page-btn:disabled { opacity: 0.2; cursor: not-allowed; }
        .pg-empty { grid-column: 1/-1; text-align: center; padding: 80px 0; color: rgba(255,255,255,0.2); font-size: 13px; }
        .pg-skeleton { background: rgba(255,255,255,0.04); border-radius: 16px; aspect-ratio: 3/4.2; animation: pg-pulse 1.4s ease-in-out infinite; }
        @keyframes pg-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pg-mob-cats { display: none; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 20px; }
        @media (max-width: 1024px) { .pg-mob-cats { display: flex; } }
        .pg-mob-cat { flex-shrink: 0; font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; padding: 8px 16px; border: none; cursor: pointer; transition: all 0.2s; }
        .pg-mob-cat.active { background: #ef4444; color: #fff; }
        .pg-mob-cat:not(.active) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }
      `}</style>

        {/* Section header */}
        <div style={{marginBottom: 32}}>
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
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.2rem,4vw,3.2rem)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              margin: 0,
            }}>
            {sectionTitle} <span style={{color: "#ef4444"}}>{sectionTitleRed}</span>
          </h2>
        </div>

        {activeBrandName && (
          <div className="pg-filter-pill">
            <span>Filtering: {activeBrandName}</span>
            <button onClick={clearAll}>✕</button>
          </div>
        )}

        <div ref={wrapRef} className="pg-wrap">
          {/* ══════════ SIDEBAR ══════════ */}
          <aside
            ref={sidebarRef}
            className="pg-sidebar"
            style={{
              maxHeight: "calc(100vh - 108px)",
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              willChange: "transform",
            }}>
            {/* Categories */}
            <div className="pg-sb-section">
              <p className="pg-sb-title">Categories</p>
              <button
                onClick={() => handleCategory("All", null)}
                className={`pg-cat-btn ${activeCategory === "All" ? "active" : ""}`}>
                All
                <span className="pg-cat-count">{totalAll}</span>
              </button>

              {categories.length > CAT_SHOW && (
                <div className="pg-sb-search" style={{marginTop: 6}}>
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="2"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={catSearch}
                    onChange={(e) => {
                      setCatSearch(e.target.value);
                      setCatExpanded(true);
                    }}
                  />
                </div>
              )}

              {visibleCats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat.name, cat.id)}
                  className={`pg-cat-btn ${activeCategory === cat.name ? "active" : ""}`}>
                  {cat.name}
                  <span className="pg-cat-count">{catCounts[cat.id] ?? 0}</span>
                </button>
              ))}

              {hiddenCatCount > 0 && (
                <button className="pg-show-more" onClick={() => setCatExpanded((v) => !v)}>
                  {catExpanded ? (
                    <>
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>{" "}
                      Show less
                    </>
                  ) : (
                    <>
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>{" "}
                      Show {hiddenCatCount} more
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Filter by Price */}
            <div className="pg-sb-section">
              <p className="pg-sb-title">Filter by Price</p>
              <div className="pg-price-row">
                <input
                  type="number"
                  className="pg-price-input"
                  value={priceMin}
                  min={PRICE_MIN}
                  max={priceMax - 100}
                  onChange={(e) => {
                    setPriceMin(Math.min(Number(e.target.value), priceMax - 100));
                    setPage(1);
                  }}
                />
                <span className="pg-price-sep">—</span>
                <input
                  type="number"
                  className="pg-price-input"
                  value={priceMax}
                  min={priceMin + 100}
                  max={PRICE_MAX}
                  onChange={(e) => {
                    setPriceMax(Math.max(Number(e.target.value), priceMin + 100));
                    setPage(1);
                  }}
                />
              </div>
              <div className="pg-range-wrap">
                <div className="pg-range-track" />
                <div
                  className="pg-range-fill"
                  style={{left: `${leftPct}%`, right: `${100 - rightPct}%`}}
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={500}
                  value={priceMin}
                  onChange={(e) => {
                    setPriceMin(Math.min(Number(e.target.value), priceMax - 100));
                    setPage(1);
                  }}
                  className="pg-range"
                  style={{zIndex: 2}}
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={500}
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(Math.max(Number(e.target.value), priceMin + 100));
                    setPage(1);
                  }}
                  className="pg-range"
                  style={{zIndex: 3}}
                />
              </div>
              <div className="pg-price-labels">
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>₦0</span>
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>₦200k</span>
              </div>
            </div>

            {/* Brand */}
            <div className="pg-sb-section">
              <p className="pg-sb-title">
                Brand
                {selectedBrandIds.length > 0 && (
                  <button
                    className="pg-sb-reset"
                    onClick={() => {
                      setSelectedBrandIds([]);
                      updateUrl([]);
                      setPage(1);
                    }}>
                    Clear ({selectedBrandIds.length})
                  </button>
                )}
              </p>
              <div className="pg-sb-search">
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value);
                    setBrandExpanded(true);
                  }}
                />
              </div>

              {visibleBrands.map((brand) => {
                const isChecked = selectedBrandIds.includes(brand.id);
                return (
                  <div
                    key={brand.id}
                    className="pg-brand-item"
                    onClick={() => toggleBrand(brand.id)}>
                    <div className={`pg-brand-cb ${isChecked ? "checked" : ""}`}>
                      {isChecked && (
                        <svg
                          width="8"
                          height="8"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="pg-brand-label">{brand.brand_name}</span>
                    <span className="pg-brand-count">{brandCounts[brand.id] ?? 0}</span>
                  </div>
                );
              })}

              {hiddenBrandCount > 0 && (
                <button className="pg-show-more" onClick={() => setBrandExpanded((v) => !v)}>
                  {brandExpanded ? (
                    <>
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>{" "}
                      Show less
                    </>
                  ) : (
                    <>
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>{" "}
                      Show {hiddenBrandCount} more
                    </>
                  )}
                </button>
              )}
            </div>

            {hasFilters && (
              <button className="pg-clear-all" onClick={clearAll}>
                {emptyCta}
              </button>
            )}
          </aside>

          {/* ══════════ MAIN GRID ══════════ */}
          <div className="pg-grid">
            <div className="pg-mob-cats">
              <button
                onClick={() => handleCategory("All", null)}
                className={`pg-mob-cat ${activeCategory === "All" ? "active" : ""}`}>
                All
              </button>
              {filteredCats.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat.name, cat.id)}
                  className={`pg-mob-cat ${activeCategory === cat.name ? "active" : ""}`}>
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="pg-topbar">
              <div className="pg-search">
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                <span className="pg-count">
                  {total} {resultLabel}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="pg-sort">
                  {sortOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={[
                  activeCategory,
                  sortBy,
                  page,
                  search,
                  selectedBrandIds.join(),
                  priceMin,
                  priceMax,
                ].join("|")}
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0}}
                transition={{duration: 0.25}}
                className="pg-cards">
                {loading ? (
                  Array.from({length: PER_PAGE}).map((_, i) => (
                    <div key={i} className="pg-skeleton" />
                  ))
                ) : products.length > 0 ? (
                  products.map((p, i) => {
                    const {tags, saving, isOnSale, isNew} = getProductMeta(p);
                    const primaryImg = p.primary_image || p.images?.[0]?.url || "";
                    const sizes = p.sizes?.map((s) => s.size ?? s.name ?? s) ?? [];
                    return (
                      <motion.div
                        key={p.id}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.35, delay: i * 0.05}}
                        className="pg-card">
                        <div className="pg-card-img">
                          {primaryImg ? (
                            <img src={primaryImg} alt={p.name} />
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
                                  fontSize: 11,
                                  letterSpacing: "0.2em",
                                  textTransform: "uppercase",
                                }}>
                                No Image
                              </span>
                            </div>
                          )}
                          <div className="pg-overlay" />
                          {(tags || isOnSale || isNew) && (
                            <div className="pg-badge-area">
                              {/* All DB tags in ONE pill: "smartphone, samsung, android" */}
                              {tags && (
                                <span className="pg-tag-pill">
                                  <span className="pg-tag-dot" />
                                  {tags}
                                </span>
                              )}
                              {/* SAVE ₦X  SALE  — side by side */}
                              {isOnSale && (
                                <div className="pg-sale-row">
                                  <span className="pg-save-badge">SAVE {fmt(saving)}</span>
                                  <span className="pg-sale-badge">SALE</span>
                                </div>
                              )}
                              {isNew && <span className="pg-new-badge">NEW</span>}
                            </div>
                          )}
                          <div className="pg-icons">
                            <button
                              title={cart.includes(p.id) ? "Remove from cart" : "Add to cart"}
                              className={`pg-icon-btn ${addedId === p.id ? "cart-added" : cart.includes(p.id) ? "cart" : ""}`}
                              disabled={loadingCartId === p.id}
                              onClick={(e) => addToCart(p, e)}>
                              {addedId === p.id ? (
                                /* flash tick — just added */
                                <svg
                                  width="13"
                                  height="13"
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
                              ) : cart.includes(p.id) ? (
                                /* already in cart — show X to remove */
                                <svg
                                  width="13"
                                  height="13"
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
                                /* not in cart — show cart icon */
                                <svg
                                  width="13"
                                  height="13"
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
                            <button
                              className={`pg-icon-btn ${wishlist.includes(p.id) ? "wish-active" : ""}`}
                              disabled={loadingWishId === p.id}
                              onClick={(e) => toggleWishlist(p.id, e)}>
                              <svg
                                width="13"
                                height="13"
                                fill={wishlist.includes(p.id) ? "white" : "none"}
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
                          <button
                            className="pg-quick-add"
                            disabled={loadingCartId === p.id}
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!getToken()) {
                                navigate("/login");
                                return;
                              }

                              const promises = [];

                              // Add to wishlist immediately regardless of sizes
                              if (!wishlist.includes(p.id)) {
                                promises.push(ctxAddToWishlist(p.id));
                              }

                              // Add to cart
                              if (!cart.includes(p.id)) {
                                const productSizes = p.sizes ?? [];
                                if (productSizes.length > 0) {
                                  // Flag that we came from Quick Add, then open size modal
                                  setQuickAddWish(true);
                                  setSizeModal(p);
                                } else {
                                  promises.push(doAddToCart(p.id, null));
                                }
                              }

                              if (promises.length > 0) {
                                await Promise.all(promises);
                              }
                            }}>
                            + Quick Add
                          </button>
                        </div>
                        <div className="pg-card-body">
                          <span className="pg-brand">{p.brand_name}</span>
                          <Link to={`/shop/${p.slug || p.id}`} className="pg-name">
                            {p.name}
                          </Link>
                          <div className="pg-sizes">
                            {sizes.slice(0, 4).map((s) => (
                              <span key={s} className="pg-size">
                                {s}
                              </span>
                            ))}
                            {sizes.length > 4 && (
                              <span style={{color: "rgba(255,255,255,0.2)", fontSize: 8}}>
                                +{sizes.length - 4}
                              </span>
                            )}
                          </div>
                          <div className="pg-bottom">
                            <div style={{display: "flex", alignItems: "baseline", gap: 6}}>
                              <span className="pg-price" style={{color: "#ef4444"}}>
                                {fmt(p.price)}
                              </span>
                              {Number(p.compare_price) > Number(p.price) && (
                                <span className="pg-original">{fmt(p.compare_price)}</span>
                              )}
                            </div>
                            <Link to={`/shop/${p.slug || p.id}`} className="pg-view">
                              View
                              <svg
                                width="10"
                                height="10"
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
                  })
                ) : (
                  <div className="pg-empty">
                    {emptyMsg}
                    <button
                      style={{
                        display: "block",
                        margin: "12px auto 0",
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                      onClick={clearAll}>
                      {emptyCta}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="pg-pagination">
                <button
                  className="pg-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}>
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({length: totalPages}).map((_, i) => (
                  <button
                    key={i}
                    className={`pg-page-btn ${page === i + 1 ? "active" : ""}`}
                    onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}
                <button
                  className="pg-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}>
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Size Picker Modal ───────────────────────────────────────────── */}
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
              {(sizeModal.sizes ?? []).map((s) => {
                const sizeId = s.id ?? null;
                const sizeLabel = s.size ?? s.name ?? s;
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
