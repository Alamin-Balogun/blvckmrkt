import {useEffect, useRef, useState} from "react";
import {Link} from "react-router-dom";
import ProductCard, {PRODUCT_CARD_CSS} from "../../../components/ProductCard";
import useProductCardActions from "../../../components/useProductCardActions";
import {useHomeContentRaw} from "./homecontentcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

function parseProductList(json) {
  const data = json?.data ?? json;
  return Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
}

function useProducts(query) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/api/shop/products?${query}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setProducts(parseProductList(json));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return {products, loading};
}

// One horizontal-scroll row of ProductCards, with prev/next arrows and a
// "View All" link into the vertical shop grid with the matching filter.
function ProductRow({title, query, viewAllHref, order}) {
  const {products, loading} = useProducts(query);
  const scrollerRef = useRef(null);
  const actions = useProductCardActions();

  // Admin-curated rows fetch by `ids=` (SQL IN doesn't preserve order), so
  // re-sort to match the order the admin picked them in.
  const ordered = order
    ? order.map((id) => products.find((p) => String(p.id) === String(id))).filter(Boolean)
    : products;

  if (!loading && ordered.length === 0) return null;

  const scrollByCards = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({left: dir * (el.clientWidth * 0.8), behavior: "smooth"});
  };

  return (
    <section className="bg-black px-6 md:px-12 py-12">
      <style>{PRODUCT_CARD_CSS}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <h2
            className="text-white font-black leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              letterSpacing: "0.04em",
            }}>
            {title}
          </h2>
          <div className="flex items-center gap-3">
            <Link
              to={viewAllHref}
              className="text-white/40 hover:text-white text-[10px] font-bold tracking-[0.25em] uppercase transition-colors">
              View All
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <button
                aria-label="Scroll left"
                onClick={() => scrollByCards(-1)}
                className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                aria-label="Scroll right"
                onClick={() => scrollByCards(1)}
                className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 4,
          }}>
          {(loading ? Array.from({length: 4}) : ordered).map((p, i) => (
            <div
              key={p?.id ?? i}
              style={{
                flex: "0 0 auto",
                width: "min(220px, 44vw)",
                scrollSnapAlign: "start",
              }}>
              {loading ? (
                <div className="pg-skeleton" style={{width: "100%"}} />
              ) : (
                <ProductCard
                  product={p}
                  inCart={actions.cartIds.includes(p.id)}
                  inWishlist={actions.wishlistIds.includes(p.id)}
                  justAdded={actions.addedId === p.id}
                  cartLoading={actions.loadingCartId === p.id}
                  wishLoading={actions.loadingWishId === p.id}
                  onAddToCart={actions.onAddToCart}
                  onToggleWishlist={actions.onToggleWishlist}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Homepage's product browsing area: a "New Products" row, a tag-driven
// "Black Market Exclusives" row, then one row per active category — all
// horizontal-scroll, all feeding into the vertical 2-column shop grid via
// "View All". Categories come from the same endpoint the shop sidebar and
// FeaturedCollections already use.
export default function ProductSections() {
  const [categories, setCategories] = useState([]);
  const {content} = useHomeContentRaw();

  const curatedIds = Array.isArray(content?.curated_products) ? content.curated_products : [];
  const curatedTitle = content?.curated_section_title || "Editor's Picks";

  useEffect(() => {
    fetch(`${API_BASE}/api/shop/categories`)
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.data?.categories)
              ? json.data.categories
              : [];
        setCategories(list);
      })
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      {curatedIds.length > 0 && (
        <ProductRow
          title={curatedTitle}
          query={`ids=${curatedIds.join(",")}&limit=${curatedIds.length}`}
          viewAllHref="/shop"
          order={curatedIds}
        />
      )}
      <ProductRow title="New Products" query="sort=newest&limit=12" viewAllHref="/shop" />
      <ProductRow
        title="Black Market Exclusives"
        query="tag=exclusive&limit=12"
        viewAllHref="/shop?search=exclusive"
      />
      {categories.map((cat) => (
        <ProductRow
          key={cat.id}
          title={cat.name}
          query={`category_id=${cat.id}&limit=12`}
          viewAllHref={`/shop?category_id=${cat.id}`}
        />
      ))}
    </>
  );
}
