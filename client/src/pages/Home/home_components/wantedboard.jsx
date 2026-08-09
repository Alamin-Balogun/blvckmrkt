import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";
const MAX_SHOWN = 12;

function extractBrandList(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data?.brands)) return json.data.brands;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.brands)) return json.brands;
  return [];
}

function PosterCard({brand}) {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);
  const isValidUrl =
    typeof brand.logo_url === "string" &&
    (brand.logo_url.startsWith("http://") || brand.logo_url.startsWith("https://"));
  const showLogo = isValidUrl && !imgFailed;

  const goToSeller = () => {
    navigate(brand.slug ? `/brands/${brand.slug}` : `/shop?brand_id=${brand.id}`);
  };

  return (
    <div
      onClick={goToSeller}
      className="group relative cursor-pointer border border-white/12 bg-[#0d0d0d] hover:border-red-500/60 transition-all duration-300 p-5 flex flex-col items-center text-center"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)",
      }}>
      <span
        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black tracking-[0.3em] uppercase px-4 py-1"
        style={{fontFamily: "'Space Mono', monospace"}}>
        Wanted
      </span>

      <div className="mt-5 mb-4 w-24 h-24 rounded-full border-2 border-white/15 group-hover:border-red-500/60 overflow-hidden bg-white/5 flex items-center justify-center transition-colors duration-300">
        {showLogo ? (
          <img
            src={brand.logo_url}
            alt={brand.brand_name}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-300"
          />
        ) : (
          <span
            className="text-white/40 text-2xl font-black"
            style={{fontFamily: "'Bebas Neue', sans-serif"}}>
            {brand.brand_name?.[0]?.toUpperCase() ?? "?"}
          </span>
        )}
      </div>

      <h4
        className="text-white font-black uppercase tracking-[0.06em] mb-2"
        style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem"}}>
        @{brand.brand_name}
      </h4>

      <div
        className="text-white/35 text-[10.5px] leading-relaxed mb-1"
        style={{fontFamily: "'Space Mono', monospace"}}>
        KNOWN FOR: <span className="text-white/60">{brand.category || "Streetwear"}</span>
      </div>
      <div
        className="text-white/25 text-[10px] mb-5"
        style={{fontFamily: "'Space Mono', monospace"}}>
        LAST SEEN: LAGOS
      </div>

      <span className="mt-auto text-red-500 group-hover:text-white text-[10px] font-bold tracking-[0.25em] uppercase border border-red-500/40 group-hover:bg-red-600 group-hover:border-red-600 px-5 py-2 transition-all duration-200">
        View Seller
      </span>
    </div>
  );
}

function SkeletonPoster() {
  return (
    <div className="border border-white/8 bg-[#0d0d0d] p-5 flex flex-col items-center gap-3">
      <div className="w-24 h-24 rounded-full bg-white/5 animate-pulse" />
      <div className="h-4 w-24 bg-white/10 animate-pulse rounded" />
      <div className="h-2 w-32 bg-white/5 animate-pulse rounded" />
    </div>
  );
}

export default function WantedBoard() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/shop/brands`)
      .then((r) => r.json())
      .then((json) => setBrands(extractBrandList(json)))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = brands.slice(0, MAX_SHOWN);

  return (
    <section className="bg-black py-16 px-6 md:px-12 border-y border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <h3
              className="text-white font-black tracking-[0.08em] uppercase"
              style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem"}}>
              The Wanted Board
            </h3>
          </div>
          <a
            href="/brands"
            className="group flex items-center gap-2 text-white/35 hover:text-white text-[10px] font-bold tracking-[0.28em] uppercase transition-colors duration-200">
            View All Brands
            <svg
              className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {loading
            ? Array.from({length: 8}).map((_, i) => <SkeletonPoster key={i} />)
            : shown.length > 0
              ? shown.map((b) => <PosterCard key={b.id} brand={b} />)
              : (
                <div className="col-span-full text-center py-6 text-white/20 text-[11px] tracking-widest uppercase">
                  No brands available yet
                </div>
              )}
        </div>
      </div>
    </section>
  );
}
