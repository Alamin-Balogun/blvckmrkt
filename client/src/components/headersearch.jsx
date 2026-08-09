// components/headersearch.jsx
//
// Live type-ahead search shared by the navbar's desktop and mobile search
// inputs. Debounces keystrokes, then queries products (GET /api/shop/products
// ?search=) and filters the already-public brand list (GET /api/shop/brands)
// client-side by name — mirrors how productgrid.jsx's own sidebar brand
// filter works, since there's no server-side brand search endpoint.
//
// Selecting a product jumps to the shop page with a `highlight` param that
// productgrid.jsx scroll-and-pulses onto; selecting a brand filters the shop
// page to that brand (productgrid.jsx already reads `brand_id` from the URL).
import {useState, useRef, useEffect, useCallback} from "react";
import {createPortal} from "react-dom";
import {useNavigate} from "react-router-dom";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

// Module-level cache — the verified brand list rarely changes within a
// session, so fetch it once regardless of how many times the user searches.
let brandsCache = null;
async function fetchAllBrands() {
  if (brandsCache) return brandsCache;
  try {
    const res = await fetch(`${BASE}/shop/brands`);
    if (!res.ok) return [];
    const json = await res.json();
    const list = json?.data?.brands ?? json?.data ?? [];
    brandsCache = Array.isArray(list) ? list : [];
    return brandsCache;
  } catch {
    return [];
  }
}

export default function HeaderSearch({
  value,
  onChange,
  inputClassName,
  inputStyle,
  placeholder = "Search products or brands...",
  autoFocus,
  onNavigate,
  onBlur,
}) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const [coords, setCoords] = useState({top: 0, left: 0, width: 0});
  const navigate = useNavigate();

  const syncCoords = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setCoords({top: r.bottom + 8, left: r.left, width: Math.max(r.width, 300)});
  }, []);

  useEffect(() => {
    if (!open) return;
    syncCoords();
    window.addEventListener("scroll", syncCoords, {passive: true, capture: true});
    window.addEventListener("resize", syncCoords, {passive: true});
    return () => {
      window.removeEventListener("scroll", syncCoords, {capture: true});
      window.removeEventListener("resize", syncCoords);
    };
  }, [open, syncCoords]);

  useEffect(() => {
    const q = (value || "").trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q) {
      setProducts([]);
      setBrands([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [prodJson, allBrands] = await Promise.all([
          fetch(`${BASE}/shop/products?search=${encodeURIComponent(q)}&limit=6`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          fetchAllBrands(),
        ]);
        const prodList = prodJson?.data?.products ?? [];
        setProducts(Array.isArray(prodList) ? prodList : []);
        const ql = q.toLowerCase();
        setBrands(
          (allBrands || [])
            .filter((b) => (b.brand_name || "").toLowerCase().includes(ql))
            .slice(0, 5),
        );
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const close = () => {
    setOpen(false);
    onChange("");
    onNavigate?.();
  };

  const goToProduct = (p) => {
    navigate(`/shop?search=${encodeURIComponent(p.name)}&highlight=${p.id}`);
    close();
  };

  const goToBrand = (b) => {
    navigate(`/shop?brand_id=${b.id}`);
    close();
  };

  const submitPlain = () => {
    const q = (value || "").trim();
    if (!q) return;
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    close();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (products[0]) goToProduct(products[0]);
      else if (brands[0]) goToBrand(brands[0]);
      else submitPlain();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasQuery = (value || "").trim().length > 0;
  const hasResults = products.length > 0 || brands.length > 0;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => hasQuery && setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
          onBlur?.();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
        style={inputStyle}
      />

      {open &&
        hasQuery &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              background: "#101010",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12,
              zIndex: 99999,
              boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(239,68,68,0.08)",
              maxHeight: 420,
              overflowY: "auto",
            }}>
            {loading && !hasResults && (
              <div style={{padding: 18, color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center"}}>
                Searching…
              </div>
            )}
            {!loading && !hasResults && (
              <div style={{padding: 18, color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center"}}>
                No matches
              </div>
            )}
            {products.length > 0 && (
              <div>
                <div
                  style={{
                    padding: "9px 14px 5px",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                  }}>
                  Products
                </div>
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goToProduct(p);
                    }}
                    style={resultRowStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <img
                      src={p.images?.[0]?.url}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        objectFit: "cover",
                        borderRadius: 6,
                        background: "#1a1a1a",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{minWidth: 0}}>
                      <div
                        style={{
                          color: "#fff",
                          fontSize: 12.5,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}>
                        {p.name}
                      </div>
                      <div style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>
                        ₦{Number(p.price || 0).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {brands.length > 0 && (
              <div>
                <div
                  style={{
                    padding: "9px 14px 5px",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                  }}>
                  Brands
                </div>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goToBrand(b);
                    }}
                    style={resultRowStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <img
                      src={b.logo_url}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        objectFit: "cover",
                        borderRadius: 99,
                        background: "#1a1a1a",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{color: "#fff", fontSize: 12.5, fontWeight: 600}}>{b.brand_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

const resultRowStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 14px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.1s",
};
