import {Link, useNavigate} from "react-router-dom";
import {getProductMeta, fmt, isOutOfStock} from "../utils/productMeta";

// Shared "grid card" used on the Shop page, the homepage product sections,
// and the product detail page's "You May Also Like" row — one visual/
// behavioral source of truth instead of three hand-rolled copies.
//
// Callback contract matches what productgrid.jsx already had: the parent
// owns e.preventDefault()/e.stopPropagation() inside onAddToCart/
// onToggleWishlist/onQuickAdd, so clicking the card image (which navigates
// to the detail page) never fires when an action button is clicked.
export default function ProductCard({
  product: p,
  inCart,
  inWishlist,
  justAdded,
  cartLoading,
  wishLoading,
  onAddToCart,
  onToggleWishlist,
  onQuickAdd,
}) {
  const navigate = useNavigate();
  const {tags, saving, isOnSale, isNew} = getProductMeta(p);
  const outOfStock = isOutOfStock(p);
  const primaryImg = p.primary_image || p.images?.[0]?.url || "";
  const sizes = p.sizes?.map((s) => s.size ?? s.name ?? s) ?? [];
  const href = `/shop/${p.slug || p.id}`;

  return (
    <div className="pg-card">
      <div className="pg-card-img" style={{cursor: "pointer"}} onClick={() => navigate(href)}>
        {primaryImg ? (
          <img
            src={primaryImg}
            alt={p.name}
            style={outOfStock ? {filter: "grayscale(70%)", opacity: 0.55} : undefined}
          />
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
        {(outOfStock || tags || isOnSale || isNew) && (
          <div className="pg-badge-area">
            {outOfStock && (
              <span
                style={{
                  background: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "4px 9px",
                  borderRadius: 999,
                  width: "fit-content",
                }}>
                Sold Out
              </span>
            )}
            {tags && (
              <span className="pg-tag-pill">
                <span className="pg-tag-dot" />
                {tags}
              </span>
            )}
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
            title={outOfStock ? "Sold out" : inCart ? "Remove from cart" : "Add to cart"}
            className={`pg-icon-btn ${justAdded ? "cart-added" : inCart ? "cart" : ""}`}
            disabled={cartLoading || outOfStock}
            style={outOfStock ? {opacity: 0.35, cursor: "not-allowed"} : undefined}
            onClick={(e) => onAddToCart(p, e)}>
            {justAdded ? (
              <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : inCart ? (
              <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            )}
          </button>
          <button
            className={`pg-icon-btn ${inWishlist ? "wish-active" : ""}`}
            disabled={wishLoading}
            onClick={(e) => onToggleWishlist(p.id, e)}>
            <svg
              width="13"
              height="13"
              fill={inWishlist ? "white" : "none"}
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
        {onQuickAdd && (
          <button
            className="pg-quick-add"
            disabled={cartLoading || outOfStock}
            style={outOfStock ? {opacity: 0.4, cursor: "not-allowed"} : undefined}
            onClick={(e) => onQuickAdd(p, e)}>
            + Quick Add
          </button>
        )}
      </div>
      <div className="pg-card-body">
        <span className="pg-brand">{p.brand_name}</span>
        <Link to={href} className="pg-name">
          {p.name}
        </Link>
        <div className="pg-sizes">
          {sizes.slice(0, 4).map((s) => (
            <span key={s} className="pg-size">
              {s}
            </span>
          ))}
          {sizes.length > 4 && (
            <span style={{color: "rgba(255,255,255,0.2)", fontSize: 8}}>+{sizes.length - 4}</span>
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
          <Link to={href} className="pg-view">
            View
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Rendered once per page (not per card) alongside the page's own <style>
// block — every ProductCard on that page shares these rules.
export const PRODUCT_CARD_CSS = `
  .pg-card { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.3s, transform 0.3s; }
  .pg-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-3px); }
  .pg-card-img { position: relative; aspect-ratio: 3/3.5; overflow: hidden; }
  .pg-card-img img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform 0.7s; filter: grayscale(15%); }
  .pg-card:hover .pg-card-img img { transform: scale(1.06); }
  .pg-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); transition: background 0.4s; }
  .pg-card:hover .pg-overlay { background: rgba(0,0,0,0.05); }
  .pg-badge-area { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 4px; max-width: calc(100% - 52px); }
  .pg-tag-pill   { display: inline-flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.70); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.85); font-size: 8px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .pg-tag-dot    { width: 5px; height: 5px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
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
  @media (max-width: 560px) {
    .pg-card-body { padding: 10px 10px 12px; }
    .pg-name { font-size: 0.88rem; margin-bottom: 6px; }
    .pg-brand { font-size: 8px; margin-bottom: 3px; }
    .pg-price { font-size: 1.05rem; }
    .pg-original { font-size: 9px; }
    .pg-view { font-size: 9px; }
    .pg-sizes { gap: 3px; margin-bottom: 10px; }
    .pg-icon-btn { width: 26px; height: 26px; }
  }
`;
