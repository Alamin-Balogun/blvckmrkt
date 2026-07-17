import {useState, useEffect} from "react";
import {useParams, Link} from "react-router-dom";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

function fmt(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

const SOCIALS = [
  {key: "instagram", label: "Instagram", prefix: "https://instagram.com/", icon: "📸"},
  {key: "tiktok", label: "TikTok", prefix: "https://tiktok.com/@", icon: "🎵"},
  {key: "facebook", label: "Facebook", prefix: "https://facebook.com/", icon: "📘"},
  {key: "twitter", label: "Twitter", prefix: "https://twitter.com/", icon: "🐦"},
];

function BrandInitials({name}) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #ef4444, #7f1d1d)", color: "#fff",
        fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: "0.05em",
      }}>
      {initials}
    </div>
  );
}

export default function BrandProfile() {
  const {slug} = useParams();
  const [brand, setBrand] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setBrand(null);

    fetch(`${API_BASE}/api/brands/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((json) => {
        if (cancelled || !json) return;
        const b = json?.data ?? json;
        setBrand(b);
        return fetch(`${API_BASE}/api/shop/products?brand_id=${b.id}&limit=24`)
          .then((r) => r.json())
          .then((pj) => {
            if (cancelled) return;
            setProducts(pj?.data?.products ?? []);
          });
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div style={{background: "#0a0a0a", minHeight: "100vh"}}>
        <Navbar />
        <div style={{padding: "120px 24px", textAlign: "center", color: "rgba(255,255,255,0.3)"}}>
          Loading brand…
        </div>
      </div>
    );
  }

  if (notFound || !brand) {
    return (
      <div style={{background: "#0a0a0a", minHeight: "100vh"}}>
        <Navbar />
        <div style={{padding: "120px 24px", textAlign: "center"}}>
          <p style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "#fff", marginBottom: 12}}>
            Brand not found
          </p>
          <Link to="/brands" style={{color: "#ef4444", fontSize: 13}}>← Back to Brands</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{background: "#0a0a0a", minHeight: "100vh"}}>
      <Navbar />

      {/* Banner */}
      <div style={{position: "relative", height: "clamp(220px, 32vw, 380px)", overflow: "hidden", background: "#111"}}>
        {brand.banner_url ? (
          <img src={brand.banner_url} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
        ) : (
          <div style={{width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)"}} />
        )}
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), #0a0a0a)"}} />
      </div>

      {/* Header */}
      <div style={{maxWidth: 1100, margin: "-64px auto 0", padding: "0 24px", position: "relative", zIndex: 2}}>
        <div style={{display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 24}}>
          <div style={{
            width: 108, height: 108, borderRadius: 16, overflow: "hidden",
            border: "3px solid #0a0a0a", background: "#111", flexShrink: 0,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}>
            {brand.logo_url
              ? <img src={brand.logo_url} alt={brand.brand_name} style={{width: "100%", height: "100%", objectFit: "cover"}} />
              : <BrandInitials name={brand.brand_name} />}
          </div>

          <div style={{flex: 1, minWidth: 200, paddingBottom: 6}}>
            <div style={{display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap"}}>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                color: "#fff", letterSpacing: "0.04em", margin: 0,
              }}>
                {brand.brand_name}
              </h1>
              {brand.verification_status === "verified" && (
                <span title="Verified brand" style={{color: "#3b82f6", fontSize: "1.2rem"}}>✓</span>
              )}
              {brand.is_exclusive && (
                <span style={{
                  background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.35)",
                  color: "#eab308", fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
                  textTransform: "uppercase", padding: "3px 9px", borderRadius: 99,
                }}>
                  ★ Exclusive
                </span>
              )}
            </div>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "4px 0 0"}}>
              {[brand.category, [brand.city, brand.state_name, brand.country_name].filter(Boolean).join(", ")]
                .filter(Boolean).join(" · ")}
              {brand.product_count != null && ` · ${brand.product_count} product${brand.product_count !== 1 ? "s" : ""}`}
            </p>
          </div>

          <Link
            to={`/shop?brand_id=${brand.id}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 900,
              letterSpacing: "0.18em", textTransform: "uppercase", padding: "12px 24px",
              textDecoration: "none", borderRadius: 8, whiteSpace: "nowrap",
            }}>
            Shop {brand.brand_name} →
          </Link>
        </div>

        {brand.description && (
          <p style={{color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7, maxWidth: 720, marginBottom: 20}}>
            {brand.description}
          </p>
        )}

        {/* Socials */}
        <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 40}}>
          {brand.website && (
            <a href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`}
              target="_blank" rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px",
                color: "rgba(255,255,255,0.6)", fontSize: 11, textDecoration: "none",
              }}>
              🔗 Website
            </a>
          )}
          {SOCIALS.map(({key, label, prefix, icon}) =>
            brand[key] ? (
              <a key={key} href={`${prefix}${brand[key].replace(/^@/, "")}`} target="_blank" rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px",
                  color: "rgba(255,255,255,0.6)", fontSize: 11, textDecoration: "none",
                }}>
                {icon} {label}
              </a>
            ) : null
          )}
        </div>

        {/* Products */}
        <p style={{
          color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
          textTransform: "uppercase", marginBottom: 16,
        }}>
          From {brand.brand_name}
        </p>

        {products.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)", fontSize: 13,
          }}>
            No products listed yet.
          </div>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16, paddingBottom: 60,
          }}>
            {products.map((p) => (
              <Link key={p.id} to={`/shop/${p.slug}`} style={{textDecoration: "none"}}>
                <div style={{background: "#111", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{aspectRatio: "1", background: "#0a0a0a"}}>
                    {p.primary_image && (
                      <img src={p.primary_image} alt={p.name} style={{width: "100%", height: "100%", objectFit: "cover"}} />
                    )}
                  </div>
                  <div style={{padding: "12px 14px"}}>
                    <p style={{color: "#fff", fontSize: 12, fontWeight: 600, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                      {p.name}
                    </p>
                    <p style={{color: "#ef4444", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", margin: 0}}>
                      {fmt(p.price)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
