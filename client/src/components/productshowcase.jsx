import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ["Featured", "Latest"];

const BADGE_STYLES = {
  HOT: "bg-red-500 text-white",
  NEW: "bg-white text-black",
  LIMITED: "bg-yellow-400 text-black",
  "SOLD OUT": "bg-zinc-700 text-white/60",
};

const PER_PAGE = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive a display badge from the product's tags field (comma-separated string)
 * or from the available flag.
 * Priority: SOLD OUT > LIMITED > HOT > NEW > null
 */
function getBadge(product) {
  if (!product.available) return "SOLD OUT";
  if (!product.tags) return null;
  const tags = product.tags
    .toLowerCase()
    .split(",")
    .map((t) => t.trim());
  if (tags.includes("limited")) return "LIMITED";
  if (tags.includes("hot")) return "HOT";
  if (tags.includes("new")) return "NEW";
  return null;
}

/**
 * Format a numeric price as ₦X,XXX.
 * Falls back gracefully if price is 0 or undefined.
 */
function formatPrice(price) {
  if (!price && price !== 0) return "—";
  return "₦" + Number(price).toLocaleString("en-NG");
}

/**
 * Pick the primary image URL from the images array (position=0 wins).
 * Falls back to the first image, then to a placeholder.
 */
function primaryImage(images) {
  if (!images || images.length === 0)
    return "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80";
  const primary = images.find((img) => img.position === 0);
  return (primary || images[0]).url;
}

// ── Skeleton card (shown while loading) ──────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-black flex flex-col overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-zinc-900" />
      <div className="p-5 flex flex-col gap-3 border-t border-white/8">
        <div className="h-2.5 w-1/3 bg-zinc-800 rounded" />
        <div className="h-4 w-2/3 bg-zinc-800 rounded" />
        <div className="h-2.5 w-full bg-zinc-800 rounded" />
        <div className="h-2.5 w-4/5 bg-zinc-800 rounded" />
        <div className="flex justify-between mt-2">
          <div className="h-5 w-16 bg-zinc-800 rounded" />
          <div className="h-8 w-20 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({tab}) {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-24 gap-4">
      <span className="text-white/10 text-7xl font-black" style={{fontFamily: "'Bebas Neue', sans-serif"}}>
        —
      </span>
      <p className="text-white/25 text-[11px] tracking-[0.3em] uppercase">
        No {tab.toLowerCase()} products right now
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState("Featured");
  const [page, setPage] = useState(0);

  // API state
  const [data, setData] = useState({featured: [], latest: []});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch from /api/shop/showcase on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchShowcase() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shop/showcase");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData({
            featured: json.data?.featured ?? [],
            latest: json.data?.latest ?? [],
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchShowcase();
    return () => {
      cancelled = true;
    };
  }, []);

  // Active product list depends on selected tab
  const items = activeTab === "Featured" ? data.featured : data.latest;

  const totalPages = Math.ceil(items.length / PER_PAGE);
  const visible = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const handleTab = (tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  return (
    <section className="bg-black px-6 md:px-12 py-20">
      <div className="max-w-7xl mx-auto">
        {/* ── Header row ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-2">
              ✦ Fresh Off The Rack
            </span>
            <h2
              className="text-white font-black leading-none"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                letterSpacing: "0.04em",
              }}>
              LATEST
              <br />
              <span className="text-red-500">PRODUCTS</span>
            </h2>
          </div>

          {/* ── Tab pills ────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 border border-white/10 p-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTab(tab)}
                className={`relative text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200 ${
                  activeTab === tab ? "text-black" : "text-white/40 hover:text-white"
                }`}>
                {activeTab === tab && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-white"
                    style={{borderRadius: 0}}
                    transition={{type: "spring", stiffness: 400, damping: 35}}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          {/* ── Page arrows ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="w-9 h-9 bg-white flex items-center justify-center text-black hover:bg-red-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div className="border border-red-500/30 bg-red-500/5 text-red-400 text-[11px] tracking-wider px-5 py-3 mb-8">
            Could not load products — {error}
          </div>
        )}

        {/* ── Product grid ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + page + (loading ? "_loading" : "")}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            transition={{duration: 0.35, ease: "easeOut"}}
            className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8">

            {/* Loading skeletons */}
            {loading &&
              Array.from({length: PER_PAGE}).map((_, i) => <SkeletonCard key={i} />)}

            {/* Empty state */}
            {!loading && !error && items.length === 0 && (
              <EmptyState tab={activeTab} />
            )}

            {/* Real product cards */}
            {!loading &&
              visible.map((product, i) => {
                const badge = getBadge(product);
                const imgUrl = primaryImage(product.images);
                const soldOut = !product.available;

                return (
                  <motion.div
                    key={product.id}
                    initial={{opacity: 0, y: 24}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.4, delay: i * 0.08}}
                    className={`group bg-black flex flex-col overflow-hidden ${soldOut ? "opacity-60" : ""}`}>

                    {/* Image */}
                    <div className="relative overflow-hidden aspect-[4/3] bg-[#111]">
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* dark overlay */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

                      {/* Badge */}
                      {badge && (
                        <span
                          className={`absolute top-3 left-3 text-[9px] font-black tracking-[0.25em] uppercase px-2.5 py-1 ${BADGE_STYLES[badge]}`}>
                          {badge}
                        </span>
                      )}

                      {/* Quick-add overlay — hidden when sold out */}
                      {!soldOut && (
                        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out bg-black/80 backdrop-blur-sm flex items-center justify-center py-3">
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
                        style={{fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em"}}>
                        {product.name}
                      </h3>
                      <p className="text-white/35 text-[11px] leading-relaxed tracking-wide flex-1 mb-5">
                        {product.description}
                      </p>

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span
                            className="text-white font-black text-xl"
                            style={{fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em"}}>
                            {formatPrice(product.price)}
                          </span>
                          {product.compare_price > 0 && product.compare_price > product.price && (
                            <span className="text-white/25 text-sm line-through">
                              {formatPrice(product.compare_price)}
                            </span>
                          )}
                        </div>
                        <button
                          disabled={soldOut}
                          className="group/btn relative overflow-hidden bg-[#1a1a1a] text-[10px] font-black tracking-[0.25em] uppercase px-5 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white transition-colors duration-200">
                          <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" />
                          <span className="relative text-white">{soldOut ? "SOLD OUT" : "VIEW"}</span>
                          {!soldOut && (
                            <svg className="relative w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </motion.div>
        </AnimatePresence>

        {/* ── Dot pagination ────────────────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {Array.from({length: totalPages}).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`transition-all duration-300 rounded-none py-2.5 px-5 ${
                  i === page ? "w-8 h-[3px] bg-red-500" : "w-2 h-[3px] bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
            <span className="text-white/20 text-[10px] tracking-widest ml-4 uppercase">
              {page + 1} / {totalPages}
            </span>
          </div>
        )}

        {/* ── View all ──────────────────────────────────────────────────────── */}
        <div className="flex justify-center mt-12">
          <button className="group relative overflow-hidden border border-white/20 text-[11px] font-bold tracking-[0.3em] uppercase px-10 py-4 text-white/60 hover:text-white transition-colors duration-300 flex items-center gap-3">
            <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-400 ease-out" />
            <span className="relative">VIEW ALL PRODUCTS</span>
            <svg className="relative w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}