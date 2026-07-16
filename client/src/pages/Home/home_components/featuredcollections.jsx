import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

// Fisher-Yates shuffle — pick 6 random items from an array
function pickRandom(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Fallback image if a category has no image_url set
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80";

// Sub-label shown under the category name
function subLabel(cat) {
  if (cat.description && cat.description.trim()) return cat.description.trim();
  return "Explore the collection";
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ item, style, delay = 0, hero = false, featured = false, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      style={style}
      className="relative overflow-hidden rounded-xl md:rounded-2xl group cursor-pointer min-h-[200px]"
      onClick={onClick}>

      {/* Image */}
      <img
        src={item.image_url || FALLBACK_IMAGE}
        alt={item.name}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        style={{ filter: "grayscale(25%)" }}
        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent group-hover:from-black/90 transition-all duration-500" />

      {/* Red tint on hover */}
      <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/6 transition-all duration-500" />

      {/* Corner triangle */}
      <div className="absolute top-0 right-0 w-0 h-0 overflow-hidden group-hover:w-8 group-hover:h-8 md:group-hover:w-10 md:group-hover:h-10 transition-all duration-300">
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: "40px solid #ef4444",
            borderLeft: "40px solid transparent",
          }}
        />
      </div>

      {/* Text content */}
      <div className={`absolute inset-0 flex flex-col p-4 md:p-5 ${featured ? "justify-between" : "justify-end"}`}>
        {/* Featured badge top */}
        {featured && (
          <div className="self-start">
            <span className="bg-black/50 backdrop-blur-sm border border-white/10 text-red-500 text-[8px] md:text-[9px] font-black tracking-[0.3em] uppercase px-2 md:px-3 py-1 rounded-full">
              ✦ Featured
            </span>
          </div>
        )}

        <div>
          <h3
            className="text-white font-black leading-none group-hover:text-red-400 transition-colors duration-300 mb-1"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.05em",
            }}>
            <span className={`${hero ? "text-3xl sm:text-4xl md:text-[2.4rem]" : featured ? "text-2xl md:text-[2rem]" : "text-xl md:text-[1.6rem]"}`}>
              {item.name}
            </span>
          </h3>

          <p className="text-white/50 text-[9px] md:text-[10px] tracking-[0.12em] uppercase leading-relaxed group-hover:text-white/70 transition-colors duration-300 max-w-[200px] line-clamp-2">
            {subLabel(item)}
          </p>

          {/* Discover button */}
          {featured && (
            <div className="mt-3 md:mt-4">
              <span className="inline-flex items-center gap-1.5 md:gap-2 bg-white text-black text-[9px] md:text-[10px] font-black tracking-[0.25em] uppercase px-4 md:px-5 py-2 md:py-2.5 rounded-full group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                Discover
                <svg className="w-2 h-2 md:w-2.5 md:h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Skeleton card placeholder ─────────────────────────────────────────────────
function SkeletonCard({ style }) {
  return (
    <div
      style={style}
      className="relative overflow-hidden rounded-xl md:rounded-2xl bg-white/5 animate-pulse min-h-[200px]"
    />
  );
}

// Grid area names used by the bento layout
const GRID_AREAS = ["footwear", "jackets", "accessories", "headwear", "bags", "bottoms"];

export default function FeaturedCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/shop/categories`)
      .then((r) => r.json())
      .then((json) => {
        // ListCategories returns { data: [...] } or plain array
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.data?.categories)
              ? json.data.categories
              : [];

        // Pick 6 at random on every mount — fresh selection each page load
        setCollections(pickRandom(list, Math.min(6, list.length)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCategoryClick = (cat) => {
    navigate(`/shop?category_id=${cat.id}`);
  };

  // Desktop grid style
  const gridStyleDesktop = {
    display: "grid",
    gap: "12px",
    gridTemplateColumns: "1fr 1.3fr 1fr",
    gridTemplateRows: "260px 260px",
    gridTemplateAreas: `
      "footwear  jackets  accessories"
      "headwear  bags     bottoms"
    `,
  };

  // Tablet grid style
  const gridStyleTablet = {
    display: "grid",
    gap: "10px",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "repeat(3, 220px)",
    gridTemplateAreas: `
      "footwear  jackets"
      "jackets   accessories"
      "headwear  bags"
    `,
  };

  // Mobile grid style
  const gridStyleMobile = {
    display: "grid",
    gap: "8px",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto",
  };

  return (
    <section className="bg-black px-4 sm:px-6 md:px-12 py-12 md:py-20 border-t border-white/8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <span className="text-red-500 text-[9px] md:text-[10px] font-bold tracking-[0.4em] uppercase block mb-2 md:mb-3">
            ✦ Shop By Category
          </span>
          <h2
            className="text-white font-black leading-none mb-2 md:mb-3 text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "0.04em",
            }}>
            FEATURED <span className="text-red-500">COLLECTIONS</span>
          </h2>
          <p className="text-white/35 text-[10px] md:text-[11px] tracking-[0.15em] md:tracking-[0.2em] uppercase px-4">
            Dare to mix and match — level up your fit game
          </p>
        </div>

        {/* Bento Grid - Desktop (hidden on mobile/tablet) */}
        <div className="hidden lg:block">
          <div style={gridStyleDesktop}>
            {loading
              ? GRID_AREAS.map((area, idx) => (
                  <SkeletonCard
                    key={area}
                    style={{
                      gridArea: area,
                      ...(idx === 1 ? { gridRow: "1 / 3" } : {}),
                    }}
                  />
                ))
              : collections.map((item, idx) => (
                  <Card
                    key={item.id}
                    item={item}
                    style={{
                      gridArea: GRID_AREAS[idx],
                      ...(idx === 1 ? { gridRow: "1 / 3" } : {}),
                    }}
                    delay={idx * 0.08}
                    hero={idx === 1}
                    featured={idx === 3}
                    onClick={() => handleCategoryClick(item)}
                  />
                ))}
          </div>
        </div>

        {/* Bento Grid - Tablet (hidden on mobile and desktop) */}
        <div className="hidden sm:block lg:hidden">
          <div style={gridStyleTablet}>
            {loading
              ? GRID_AREAS.slice(0, 5).map((area, idx) => (
                  <SkeletonCard
                    key={area}
                    style={{
                      gridArea: area,
                      ...(idx === 1 ? { gridRow: "1 / 3" } : {}),
                    }}
                  />
                ))
              : collections.slice(0, 5).map((item, idx) => (
                  <Card
                    key={item.id}
                    item={item}
                    style={{
                      gridArea: GRID_AREAS[idx],
                      ...(idx === 1 ? { gridRow: "1 / 3" } : {}),
                    }}
                    delay={idx * 0.08}
                    hero={idx === 1}
                    featured={idx === 3}
                    onClick={() => handleCategoryClick(item)}
                  />
                ))}
          </div>
        </div>

        {/* Simple Grid - Mobile (stacked) */}
        <div className="block sm:hidden">
          <div style={gridStyleMobile}>
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <SkeletonCard
                    key={idx}
                    style={{ minHeight: idx === 0 ? "280px" : "200px" }}
                  />
                ))
              : collections.map((item, idx) => (
                  <Card
                    key={item.id}
                    item={item}
                    style={{ minHeight: idx === 0 ? "280px" : "200px" }}
                    delay={idx * 0.08}
                    hero={idx === 0}
                    featured={idx === 1}
                    onClick={() => handleCategoryClick(item)}
                  />
                ))}
          </div>
        </div>

        {/* View all */}
        <div className="flex justify-center mt-8 md:mt-10">
          <button
            onClick={() => navigate("/shop")}
            className="group relative overflow-hidden border border-white/20 text-[10px] md:text-[11px] font-bold tracking-[0.25em] md:tracking-[0.3em] uppercase px-6 md:px-10 py-3 md:py-4 text-white/60 hover:text-white transition-colors duration-300 flex items-center gap-2 md:gap-3">
            <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-400 ease-out" />
            <span className="relative whitespace-nowrap">SHOP ALL COLLECTIONS</span>
            <svg className="relative w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}