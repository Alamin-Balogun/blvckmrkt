import {useState, useEffect, useRef} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useHomeContent} from "./homecontentcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

const SCROLL_SPEED = 40; // px/second — lower = slower
const COPIES = 10;

// ─── Default fallback logo ────────────────────────────────────────────────────
function DefaultLogo({name}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        style={{
          width: "2.4rem",
          height: "2.4rem",
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1rem",
            letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.6)",
            fontWeight: 900,
          }}>
          {initials}
        </span>
      </div>
    </div>
  );
}

// ─── Single brand card — clicking goes to /shop?brand_id=X ───────────────────
function LogoCard({brand}) {
  const navigate = useNavigate();
  const isValidUrl =
    typeof brand.logo_url === "string" &&
    (brand.logo_url.startsWith("http://") || brand.logo_url.startsWith("https://"));

  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = isValidUrl && !imgFailed;

  const handleClick = (e) => {
    e.preventDefault();
    navigate(`/shop?brand_id=${brand.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="inline-flex flex-col items-center justify-center gap-3 px-5 flex-shrink-0 group cursor-pointer">
      <div className="relative w-36 h-20 border border-white/10 group-hover:border-red-500/70 transition-all duration-300 flex items-center justify-center overflow-hidden bg-white/[0.03] group-hover:brightness-125">
        <div className="opacity-45 group-hover:opacity-100 transition-opacity duration-300 w-full h-full">
          {showLogo ? (
            <img
              src={brand.logo_url}
              alt={brand.brand_name}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <DefaultLogo name={brand.brand_name} />
          )}
        </div>
        <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-red-500 group-hover:w-full transition-all duration-400 ease-out" />
        {brand.verification_status === "verified" && (
          <span
            className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center"
            title="Verified Brand">
            <svg
              className="w-2 h-2 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        )}
      </div>
      <span
        className="text-white/25 group-hover:text-white/75 font-bold tracking-[0.18em] uppercase transition-colors duration-300 whitespace-nowrap"
        style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem"}}>
        {brand.brand_name}
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="inline-flex flex-col items-center justify-center gap-3 px-5 flex-shrink-0">
      <div className="w-36 h-20 border border-white/8 bg-white/[0.03] animate-pulse" />
      <div className="h-2 w-16 bg-white/10 animate-pulse rounded" />
    </div>
  );
}

function extractBrandList(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.brands)) return json.brands;
  if (Array.isArray(json?.data?.brands)) return json.data.brands;
  if (json && typeof json === "object") {
    for (const val of Object.values(json)) {
      if (Array.isArray(val) && val.length > 0) return val;
    }
  }
  return [];
}

export default function BrandsMarquee() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [css, setCss] = useState("");
  const trackRef = useRef(null);

  const sectionTitle = useHomeContent("brands_section_title", "Top Brands");
  const viewAllText = useHomeContent("brands_view_all_text", "View All Brands");
  const viewAllLink = useHomeContent("brands_view_all_link", "/brands");

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch(`${API_BASE}/api/shop/brands`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
        setBrands(extractBrandList(json));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBrands();
  }, []);

  useEffect(() => {
    if (brands.length === 0) return;
    const measure = () => {
      const el = trackRef.current;
      if (!el || el.scrollWidth === 0) return;
      const oneSet = el.scrollWidth / COPIES;
      const duration = Math.round(oneSet / SCROLL_SPEED);
      setCss(
        `@keyframes bmq-loop { 0% { transform: translateX(0px); } 100% { transform: translateX(-${oneSet}px); } }`,
      );
      el.style.animation = `bmq-loop ${duration}s linear infinite`;
    };
    const t = setTimeout(measure, 150);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [brands]);

  const tiles = [];
  for (let i = 0; i < COPIES; i++) tiles.push(...brands);
  const skeletons = Array.from({length: 10});

  return (
    <section className="bg-[#0a0a0a] border-y border-white/10">
      {css && <style>{css}</style>}

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <h3
            className="text-white font-black tracking-[0.08em] uppercase"
            style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem"}}>
            {sectionTitle}
          </h3>
        </div>
        <Link
          to={viewAllLink}
          className="group flex items-center gap-2 text-white/35 hover:text-white text-[10px] font-bold tracking-[0.28em] uppercase transition-colors duration-200">
          {viewAllText}
          <svg
            className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="relative overflow-hidden pb-8">
        <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

        {loading && (
          <div className="flex w-max items-center">
            {skeletons.map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <span className="text-white/20 text-[11px] tracking-widest uppercase">
              Could not load brands
            </span>
            <span className="text-red-500/40 text-[10px] font-mono">{error}</span>
          </div>
        )}

        {!loading && !error && brands.length === 0 && (
          <div className="flex items-center justify-center py-4">
            <span className="text-white/20 text-[11px] tracking-widest uppercase">
              No brands available yet
            </span>
          </div>
        )}

        {!loading && !error && brands.length > 0 && (
          <div
            ref={trackRef}
            className="flex w-max items-center"
            onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
            onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}>
            {tiles.map((brand, i) => (
              <LogoCard key={`${brand.display_id ?? brand.id}-${i}`} brand={brand} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
