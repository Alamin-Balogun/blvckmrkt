import {useState, useEffect} from "react";
import {useBrandsContent} from "./brandscontentcontext";
import {motion, AnimatePresence} from "framer-motion";
import {Link, useNavigate} from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

// ─── Fetch all brands from the public API ────────────────────────────────────
async function fetchBrands() {
  try {
    const res = await fetch(`${API_BASE}/api/brands`);
    if (!res.ok) return [];
    const json = await res.json();
    const list = json?.data?.brands ?? json?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function BrandInitials({name, size = "md"}) {
  const words = (name || "?").trim().split(/\s+/);
  const initials = words.length >= 2 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return (
    <span
      style={{
        fontFamily: "\'Bebas Neue\',sans-serif",
        fontSize: size === "lg" ? "2.2rem" : "1.3rem",
        letterSpacing: "0.08em",
        color: "#fff",
        fontWeight: 900,
        lineHeight: 1,
      }}>
      {initials.toUpperCase()}
    </span>
  );
}

function brandLocation(brand) {
  const parts = [];
  if (brand.city) parts.push(brand.city);
  if (brand.state_name) parts.push(brand.state_name);
  if (brand.country_name) parts.push(brand.country_name);
  return parts.length > 0 ? parts.join(", ") : "Location unknown";
}

// ─── Status badge — shown on pending brands ───────────────────────────────────
function StatusBadge({status}) {
  if (status === "verified") return null; // verified uses the shield badge in name row
  if (status !== "pending") return null; // only show for pending
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: "rgba(251,191,36,0.1)",
        border: "1px solid rgba(251,191,36,0.25)",
        color: "#fbbf24",
        fontSize: 7,
        fontWeight: 900,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 99,
      }}>
      <svg
        width="7"
        height="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Pending
    </span>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="brand-card" style={{pointerEvents: "none"}}>
      <div
        style={{
          height: 120,
          background: "rgba(255,255,255,0.06)",
          animation: "bpulse 1.4s infinite",
        }}
      />
      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
        }}>
        <div
          style={{
            width: 80,
            height: 60,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            animation: "bpulse 1.4s infinite",
          }}
        />
        <div
          style={{
            width: "60%",
            height: 14,
            borderRadius: 4,
            background: "rgba(255,255,255,0.06)",
            animation: "bpulse 1.4s infinite",
          }}
        />
        <div
          style={{
            width: "40%",
            height: 10,
            borderRadius: 4,
            background: "rgba(255,255,255,0.06)",
            animation: "bpulse 1.4s infinite",
          }}
        />
      </div>
    </div>
  );
}

// ─── Featured card (large, image-backed) ─────────────────────────────────────
function FeaturedCard({brand, i, shopBtnText, dropsAvailLabel}) {
  const location = brandLocation(brand);
  const hasLogo = !!brand.logo_url;
  const hasBanner = !!brand.banner_url;
  const navigate = useNavigate();
  const goToProfile = () => brand.slug && navigate(`/brands/${brand.slug}`);

  return (
    <motion.div
      initial={{opacity: 0, y: 24}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.45, delay: i * 0.09}}
      onClick={goToProfile}
      style={{cursor: brand.slug ? "pointer" : "default"}}
      className="brand-feat-card">
      {/* Background — banner if exists, otherwise dark gradient */}
      <div className="brand-feat-img">
        {hasBanner ? (
          <img src={brand.banner_url} alt={brand.brand_name} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #111 100%)",
            }}>
            {/* Dot grid pattern */}
            <svg
              width="100%"
              height="100%"
              style={{opacity: 0.07}}
              xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id={"feat-dots-" + brand.id}
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={"url(#feat-dots-" + brand.id + ")"} />
            </svg>
          </div>
        )}
      </div>
      <div className="brand-feat-grad" />

      <div className="brand-feat-body">
        {/* Logo box */}
        <div className="brand-feat-logo-box" style={{background: "#111"}}>
          {hasLogo ? (
            <img
              src={brand.logo_url}
              alt={brand.brand_name}
              style={{width: "100%", height: "100%", objectFit: "cover"}}
            />
          ) : (
            <BrandInitials name={brand.brand_name} size="lg" />
          )}
        </div>

        {/* Verification / pending badge */}
        {brand.verification_status === "verified" ? (
          <div className="brand-verified">
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
        ) : (
          <StatusBadge status={brand.verification_status} />
        )}

        <div className="brand-feat-name">{brand.brand_name}</div>
        <div className="brand-feat-tagline">{brand.category || "Fashion"}</div>
        <div className="brand-feat-row">
          <div className="brand-feat-meta">
            <span className="brand-feat-origin">{location}</span>
            <span className="brand-feat-count">
              {brand.product_count ?? 0} {dropsAvailLabel}
            </span>
          </div>
          <Link to={"/shop?brand_id=" + brand.id} className="brand-feat-cta" onClick={(e) => e.stopPropagation()}>
            {shopBtnText}
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
    </motion.div>
  );
}

// ─── Regular brand card ───────────────────────────────────────────────────────
function BrandCard({brand, i, shopBtnText, dropsLabel}) {
  const location = brandLocation(brand);
  const hasBanner = !!brand.banner_url;
  const hasLogo = !!brand.logo_url;
  const navigate = useNavigate();
  const goToProfile = () => brand.slug && navigate(`/brands/${brand.slug}`);

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.35, delay: i * 0.04}}
      onClick={goToProfile}
      style={{cursor: brand.slug ? "pointer" : "default"}}
      className="brand-card">
      {hasBanner ? (
        <>
          <div className="brand-card-cover">
            <img src={brand.banner_url} alt={brand.brand_name} />
            <div className="brand-card-cover-grad" />
          </div>
          <div className="brand-card-logo-wrap">
            <div className="brand-card-logo-box">
              {hasLogo ? (
                <img
                  src={brand.logo_url}
                  alt={brand.brand_name}
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />
              ) : (
                <BrandInitials name={brand.brand_name} />
              )}
            </div>
          </div>
        </>
      ) : hasLogo ? (
        <div className="brand-card-logo-only">
          <img
            src={brand.logo_url}
            alt={brand.brand_name}
            style={{width: "100%", height: "100%", objectFit: "cover"}}
          />
          <div className="brand-card-cover-grad" />
        </div>
      ) : (
        <div className="brand-card-no-banner">
          <svg
            width="100%"
            height="100%"
            style={{position: "absolute", inset: 0, opacity: 0.06}}
            xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id={"dots-" + brand.id}
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={"url(#dots-" + brand.id + ")"} />
          </svg>
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}>
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9l1.5-6h15L21 9M3 9h18M3 9l2 12h14l2-12M9 21v-6h6v6"
              />
            </svg>
            <span
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.15)",
                textTransform: "uppercase",
              }}>
              No Image
            </span>
          </div>
        </div>
      )}

      <div className="brand-card-body">
        <div className="brand-card-name-row">
          <span className="brand-card-name">{brand.brand_name}</span>
          {brand.verification_status === "verified" && (
            <svg
              width="11"
              height="11"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          )}
        </div>
        {/* Pending badge under name */}
        <StatusBadge status={brand.verification_status} />
        <div
          className="brand-card-tag"
          style={{marginTop: brand.verification_status === "pending" ? 5 : 0}}>
          {brand.category || "Fashion"}
        </div>
        <div className="brand-card-footer">
          <div>
            <div className="brand-card-origin">{location}</div>
            <div className="brand-card-count">
              {brand.product_count ?? 0} {dropsLabel}
            </div>
          </div>
          <Link to={"/shop?brand_id=" + brand.id} className="brand-card-shop" onClick={(e) => e.stopPropagation()}>
            {shopBtnText}
            <svg
              width="9"
              height="9"
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
  );
}

// ─── Main BrandsPage ──────────────────────────────────────────────────────────
export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const searchPlaceholder = useBrandsContent("search_placeholder", "Search brands...");
  const featuredLabel = useBrandsContent("featured_label", "\u2726 Featured Brands");
  const allBrandsLabel = useBrandsContent("all_brands_label", "All Brands");
  const emptyMsg = useBrandsContent("empty_msg", "No brands found.");
  const clearFiltersText = useBrandsContent("clear_filters_text", "Clear Filters");
  const shopBtnText = useBrandsContent("shop_btn_text", "Shop");
  const dropsLabel = useBrandsContent("drops_label", "products");
  const dropsAvailLabel = useBrandsContent("drops_avail_label", "products available");

  useEffect(() => {
    fetchBrands().then((data) => {
      // Show brands where:
      //   verification_status is "verified" or "pending"  AND
      //   subscription_status is "active" or "trial"
      const visible = data.filter(
        (b) =>
          (b.verification_status === "verified" || b.verification_status === "pending") &&
          (b.subscription_status === "active" || b.subscription_status === "trial"),
      );
      setBrands(visible);
      setLoading(false);
    });
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(brands.map((b) => b.category).filter(Boolean))).sort(),
  ];

  const filtered = brands.filter((b) => {
    const matchCat = activeCategory === "All" || b.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (b.brand_name || "").toLowerCase().includes(q) ||
      (b.category || "").toLowerCase().includes(q) ||
      brandLocation(b).toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Featured = admin-controlled (active subscription, non-none plan).
  // The section renders now so the UI is ready; admin wires the backend later.
  const featured = filtered.filter(
    (b) =>
      b.subscription_status === "active" &&
      b.subscription_plan &&
      b.subscription_plan !== "none" &&
      b.subscription_plan !== "",
  );
  const rest = filtered.filter(
    (b) =>
      !(
        b.subscription_status === "active" &&
        b.subscription_plan &&
        b.subscription_plan !== "none" &&
        b.subscription_plan !== ""
      ),
  );

  return (
    <section
      style={{
        background: "#000",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "64px 48px",
      }}>
      <style>{`
        @keyframes bpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .brands-wrap { max-width: 1280px; margin: 0 auto; }

        .brands-topbar { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:48px; }
        .brands-cats { display:flex; gap:8px; flex-wrap:wrap; }
        .brands-cat-btn { background:none; border:1px solid rgba(255,255,255,0.12); color:rgba(255,255,255,0.4); font-size:10px; font-weight:900; letter-spacing:0.22em; text-transform:uppercase; padding:7px 16px; cursor:pointer; transition:all 0.2s; }
        .brands-cat-btn:hover { color:#fff; border-color:rgba(255,255,255,0.3); }
        .brands-cat-btn.active { background:#ef4444; border-color:#ef4444; color:#fff; }
        .brands-search { position:relative; }
        .brands-search input { background:#0d0d0d; border:1px solid rgba(255,255,255,0.1); color:#fff; font-size:12px; padding:9px 14px 9px 34px; outline:none; width:220px; transition:border-color 0.2s; }
        .brands-search input:focus { border-color:rgba(239,68,68,0.6); }
        .brands-search input::placeholder { color:rgba(255,255,255,0.22); }
        .brands-search svg { position:absolute; left:10px; top:50%; transform:translateY(-50%); }

        .brands-divider { display:flex; align-items:center; gap:16px; margin-bottom:28px; }
        .brands-divider-line { flex:1; height:1px; background:rgba(255,255,255,0.08); }
        .brands-divider-label { color:rgba(255,255,255,0.25); font-size:9px; font-weight:900; letter-spacing:0.3em; text-transform:uppercase; white-space:nowrap; }

        /* ── Featured grid ── */
        .brands-featured { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:56px; }
        @media(max-width:900px){.brands-featured{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:560px){.brands-featured{grid-template-columns:1fr;}}

        .brand-feat-card { position:relative; border-radius:20px; overflow:hidden; height:340px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; transition:border-color 0.3s; }
        .brand-feat-card:hover { border-color:rgba(239,68,68,0.45); }
        .brand-feat-img { position:absolute; inset:0; }
        .brand-feat-img img { width:100%; height:100%; object-fit:cover; filter:grayscale(25%); transition:transform 0.7s,filter 0.4s; }
        .brand-feat-card:hover .brand-feat-img img { transform:scale(1.05); filter:grayscale(5%); }
        .brand-feat-grad { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.96) 0%,rgba(0,0,0,0.4) 55%,rgba(0,0,0,0.12) 100%); }
        .brand-feat-body { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:flex-end; padding:28px; }
        .brand-feat-logo-box { width:90px; height:70px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; margin-bottom:14px; overflow:hidden; }
        .brand-verified { display:inline-flex; align-items:center; gap:4px; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); color:#22c55e; font-size:8px; font-weight:900; letter-spacing:0.14em; text-transform:uppercase; padding:2px 8px; border-radius:99px; margin-bottom:8px; width:fit-content; }
        .brand-feat-name { color:#fff; font-family:\'Bebas Neue\',sans-serif; font-size:2.4rem; letter-spacing:0.06em; font-weight:900; line-height:1; margin-bottom:3px; }
        .brand-feat-tagline { color:rgba(255,255,255,0.38); font-size:10px; letter-spacing:0.15em; text-transform:uppercase; margin-bottom:16px; }
        .brand-feat-row { display:flex; align-items:center; justify-content:space-between; }
        .brand-feat-meta { display:flex; flex-direction:column; gap:2px; }
        .brand-feat-origin { color:rgba(255,255,255,0.3); font-size:10px; }
        .brand-feat-count { color:#ef4444; font-size:9px; font-weight:900; letter-spacing:0.1em; }
        .brand-feat-cta { display:inline-flex; align-items:center; gap:6px; background:#ef4444; color:#fff; font-size:10px; font-weight:900; letter-spacing:0.2em; text-transform:uppercase; padding:10px 18px; text-decoration:none; opacity:0; transform:translateY(6px); transition:opacity 0.3s,transform 0.3s,background 0.2s; }
        .brand-feat-card:hover .brand-feat-cta { opacity:1; transform:translateY(0); }
        .brand-feat-cta:hover { background:#dc2626; }

        /* ── Regular grid ── */
        .brands-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        @media(max-width:1024px){.brands-grid{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:700px){.brands-grid{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:420px){.brands-grid{grid-template-columns:1fr;}}

        .brand-card { background:#0d0d0d; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden; transition:border-color 0.3s,transform 0.3s; display:flex; flex-direction:column; }
        .brand-card:hover { border-color:rgba(239,68,68,0.35); transform:translateY(-3px); }
        .brand-card-cover { position:relative; height:120px; overflow:hidden; }
        .brand-card-cover img { width:100%; height:100%; object-fit:cover; filter:grayscale(30%); transition:transform 0.6s,filter 0.4s; }
        .brand-card:hover .brand-card-cover img { transform:scale(1.06); filter:grayscale(5%); }
        .brand-card-cover-grad { position:absolute; inset:0; background:linear-gradient(to bottom,transparent 30%,#0d0d0d 100%); }
        .brand-card-logo-wrap { display:flex; justify-content:center; margin-top:-28px; margin-bottom:12px; position:relative; z-index:2; }
        .brand-card-logo-box { width:80px; height:60px; border-radius:10px; border:2px solid #0d0d0d; box-shadow:0 0 0 1px rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; overflow:hidden; background:#111; }
        .brand-card-logo-only { position:relative; height:120px; overflow:hidden; border-bottom:1px solid rgba(255,255,255,0.06); }
        .brand-card-no-banner { position:relative; height:120px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#0f0f0f 0%,#161616 100%); border-bottom:1px solid rgba(255,255,255,0.06); overflow:hidden; }
        .brand-card-body { padding:12px 16px 16px; text-align:center; flex:1; display:flex; flex-direction:column; align-items:center; }
        .brand-card-name-row { display:flex; align-items:center; gap:5px; margin-bottom:4px; }
        .brand-card-name { color:#fff; font-family:\'Bebas Neue\',sans-serif; font-size:1.1rem; letter-spacing:0.06em; font-weight:900; line-height:1; }
        .brand-card-tag { color:rgba(255,255,255,0.28); font-size:9px; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:12px; }
        .brand-card-footer { display:flex; align-items:center; justify-content:space-between; width:100%; padding-top:10px; border-top:1px solid rgba(255,255,255,0.07); margin-top:auto; }
        .brand-card-origin { color:rgba(255,255,255,0.22); font-size:9px; }
        .brand-card-count { color:#ef4444; font-size:9px; font-weight:900; }
        .brand-card-shop { display:flex; align-items:center; gap:4px; color:rgba(255,255,255,0.28); font-size:9px; font-weight:900; letter-spacing:0.18em; text-transform:uppercase; text-decoration:none; opacity:0; transform:translateX(-4px); transition:opacity 0.2s,transform 0.2s,color 0.2s; }
        .brand-card:hover .brand-card-shop { opacity:1; transform:translateX(0); color:#ef4444; }

        .brands-empty { text-align:center; padding:80px 0; color:rgba(255,255,255,0.2); font-size:13px; grid-column:1/-1; }
        @media(max-width:640px){ section { padding:40px 20px !important; } }
      `}</style>

      <div className="brands-wrap">
        {/* Section heading */}
        <h1
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            color: "#fff",
            letterSpacing: "0.06em",
            margin: "0 0 6px",
            lineHeight: 1,
          }}>
          Browse by Category
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 12,
            margin: "0 0 28px",
            letterSpacing: "0.04em",
          }}>
          Filter brands by what they make
        </p>

        {/* Top bar — category pills + search */}
        <div className="brands-topbar">
          <div className="brands-cats">
            {categories.map((c) => (
              <button
                key={c}
                className={"brands-cat-btn" + (activeCategory === c ? " active" : "")}
                onClick={() => setActiveCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="brands-search">
            <svg
              width="13"
              height="13"
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="brands-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + search}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0}}
              transition={{duration: 0.25}}>
              {/* ── Featured Brands (admin-controlled — shows when brands have active subscription) ── */}
              {featured.length > 0 && (
                <>
                  <div className="brands-divider">
                    <div className="brands-divider-line" />
                    <span className="brands-divider-label">{featuredLabel}</span>
                    <div className="brands-divider-line" />
                  </div>
                  <div className="brands-featured">
                    {featured.map((brand, i) => (
                      <FeaturedCard
                        key={brand.id}
                        brand={brand}
                        i={i}
                        shopBtnText={shopBtnText}
                        dropsAvailLabel={dropsAvailLabel}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* ── All Brands ── */}
              {rest.length > 0 && (
                <>
                  <div className="brands-divider">
                    <div className="brands-divider-line" />
                    <span className="brands-divider-label">
                      {allBrandsLabel} ({rest.length})
                    </span>
                    <div className="brands-divider-line" />
                  </div>
                  <div className="brands-grid">
                    {rest.map((brand, i) => (
                      <BrandCard
                        key={brand.id}
                        brand={brand}
                        i={i}
                        shopBtnText={shopBtnText}
                        dropsLabel={dropsLabel}
                      />
                    ))}
                  </div>
                </>
              )}

              {filtered.length === 0 && (
                <div className="brands-empty">
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
                    onClick={() => {
                      setActiveCategory("All");
                      setSearch("");
                    }}>
                    {clearFiltersText}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
