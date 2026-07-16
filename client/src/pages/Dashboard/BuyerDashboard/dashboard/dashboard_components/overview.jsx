import {useState, useEffect} from "react";
import {getOrders, getWishlist, getFollows, getProducts} from "./api";
import { useCurrency } from "../../../../../components/currencycontext";

const STATUS_MAP = {
  pending: {label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)"},
  processing: {label: "Processing", color: "#3b82f6", bg: "rgba(59,130,246,0.1)"},
  shipped: {label: "Shipped", color: "#a855f7", bg: "rgba(168,85,247,0.1)"},
  delivered: {label: "Delivered", color: "#22c55e", bg: "rgba(34,197,94,0.1)"},
  cancelled: {label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)"},
  refunded: {label: "Refunded", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)"},
};

function buildSpendChart(orders) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString("default", {month: "short"}),
      month: d.getMonth(),
      year: d.getFullYear(),
      value: 0,
    });
  }
  orders.forEach((o) => {
    const d = new Date(o.created_at);
    const b = months.find((m) => m.month === d.getMonth() && m.year === d.getFullYear());
    if (b) b.value += o.total || 0;
  });
  const W = 400,
    H = 120,
    pad = {t: 10, r: 10, b: 24, l: 36};
  const vals = months.map((m) => m.value);
  const maxV = Math.max(...vals, 1);
  const pts = months.map((m, i) => {
    const x = pad.l + (i / (months.length - 1)) * (W - pad.l - pad.r);
    const y = pad.t + (1 - m.value / maxV) * (H - pad.t - pad.b);
    return [x, y];
  });
  const line = pts
    .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1))
    .join(" ");
  const area =
    line +
    ` L${pts[pts.length - 1][0].toFixed(1)},${H - pad.b} L${pts[0][0].toFixed(1)},${H - pad.b} Z`;
  return {months, maxV, pts, line, area};
}

function Skeleton({h = 14, w = "100%", r = 6}) {
  return (
    <div
      style={{
        height: h,
        width: w,
        background: "rgba(255,255,255,0.07)",
        borderRadius: r,
        animation: "pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function StatCard({label, value, sub, accentRgb, icon, loading}) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <p
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
          }}>
          {label}
        </p>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `rgba(${accentRgb},0.1)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          {icon}
        </div>
      </div>
      <div>
        {loading ? (
          <Skeleton h={32} w={60} />
        ) : (
          <p
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "2rem",
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              margin: "0 0 4px",
            }}>
            {value}
          </p>
        )}
        <span style={{color: "rgba(255,255,255,0.25)", fontSize: 10}}>{sub}</span>
      </div>
    </div>
  );
}

export default function Overview({user, onNav}) {
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [follows, setFollows] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fmtMoney, loading: ratesLoading } = useCurrency();

  useEffect(() => {
    Promise.all([
      getOrders().catch(() => []),
      getWishlist().catch(() => []),
      getFollows().catch(() => ({brands: [], count: 0})),
      getProducts({limit: 8}).catch(() => ({products: []})),
    ]).then(([o, w, f, p]) => {
      setOrders(Array.isArray(o) ? o : []);
      setWishlist(Array.isArray(w) ? w : []);
      setFollows(f);
      setProducts(p?.products || []);
      setLoading(false);
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
  const {months, maxV, pts, line, area} = buildSpendChart(orders);
  const newProducts = products.filter((p) => p.tags);
  const followCount = follows?.count ?? follows?.brands?.length ?? 0;

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 18}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .ov-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .ov-mid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .ov-wishlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;}
        @media(max-width:780px){.ov-stats{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px){.ov-stats{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:700px){.ov-mid{grid-template-columns:1fr!important;}}
        @media(max-width:360px){.ov-stats{grid-template-columns:1fr!important;}}
      `}</style>

      <div>
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(1.4rem,2.2vw,1.9rem)",
            color: "#fff",
            letterSpacing: "0.04em",
            lineHeight: 1,
            margin: "0 0 5px",
          }}>
          {greeting},{" "}
          <span style={{color: "#ef4444"}}>{(user?.first_name || "BUYER").toUpperCase()}</span> 👋
        </h2>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
          Here's what's going on with your account today.
        </p>
      </div>

      <div className="ov-stats">
        <StatCard
          label="Total Orders"
          value={orders.length}
          sub="all time"
          accentRgb="239,68,68"
          loading={loading}
          icon={
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.8"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          }
        />
        <StatCard
          label="Total Spent"
          value={fmtMoney(totalSpent, "NGN")}
          sub="all time"
          accentRgb="59,130,246"
          loading={loading}
          icon={
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.8"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="Wishlist"
          value={wishlist.length}
          sub="saved items"
          accentRgb="168,85,247"
          loading={loading}
          icon={
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.8"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="Brands Followed"
          value={followCount}
          sub="following"
          accentRgb="34,197,94"
          loading={loading}
          icon={
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.8"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
        />
      </div>

      <div className="ov-mid">
        {/* Spend chart */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "18px 20px",
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}>
            <div>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 3px",
                }}>
                Spending Activity
              </p>
              {loading ? (
                <Skeleton h={28} w={80} />
              ) : (
                <p
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: "1.6rem",
                    color: "#fff",
                    letterSpacing: "0.04em",
                    margin: 0,
                  }}>
                  {fmtMoney(totalSpent, "NGN")}
                </p>
              )}
            </div>
            <span
              style={{
                background: "rgba(34,197,94,0.1)",
                color: "#22c55e",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 99,
              }}>
              Last 6 months
            </span>
          </div>
          {loading ? (
            <Skeleton h={120} />
          ) : (
            <svg viewBox="0 0 400 120" style={{width: "100%", height: 120, overflow: "visible"}}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((t) => {
                const y = 10 + t * (120 - 10 - 24);
                return (
                  <line
                    key={t}
                    x1="36"
                    y1={y}
                    x2="390"
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                );
              })}
              <path d={area} fill="url(#ag)" />
              <path
                d={line}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#ef4444"
                  stroke="#070707"
                  strokeWidth="2"
                />
              ))}
              {months.map((m, i) => {
                const x = 36 + (i / (months.length - 1)) * (400 - 36 - 10);
                return (
                  <text
                    key={i}
                    x={x}
                    y="118"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.25)"
                    fontSize="9"
                    fontFamily="system-ui">
                    {m.label}
                  </text>
                );
              })}
              <text
                x="32"
                y="14"
                textAnchor="end"
                fill="rgba(255,255,255,0.25)"
                fontSize="9"
                fontFamily="system-ui">
                {fmtMoney(maxV, "NGN")}
              </text>
            </svg>
          )}
        </div>

        {/* Recent Orders */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "18px 20px",
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: 0,
              }}>
              Recent Orders
            </p>
            <button
              onClick={() => onNav("orders")}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                cursor: "pointer",
                padding: 0,
                textTransform: "uppercase",
              }}>
              View all →
            </button>
          </div>
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} style={{display: "flex", gap: 10, marginBottom: 10}}>
                <Skeleton h={38} w={38} r={8} />
                <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 4}}>
                  <Skeleton h={12} w="70%" r={4} />
                  <Skeleton h={10} w="40%" r={4} />
                </div>
              </div>
            ))
          ) : orders.length === 0 ? (
            <p
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 12,
                textAlign: "center",
                padding: "20px 0",
              }}>
              No orders yet.
            </p>
          ) : (
            <div style={{display: "flex", flexDirection: "column", gap: 10}}>
              {orders.slice(0, 3).map((o) => {
                const s = STATUS_MAP[o.status] || STATUS_MAP.pending;
                const first = o.items?.[0];
                return (
                  <div key={o.id} style={{display: "flex", alignItems: "center", gap: 10}}>
                    <img
                      src={first?.image_url || "https://placehold.co/38x38/111/444?text=?"}
                      alt={first?.product_name}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{flex: 1, minWidth: 0}}>
                      <p
                        style={{
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                        {first?.product_name || "Order"}
                      </p>
                      <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "2px 0 0"}}>
                        {o.display_id} · {o.items?.length} item{o.items?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div style={{textAlign: "right", flexShrink: 0}}>
                      <p style={{color: "#fff", fontSize: 11, fontWeight: 700, margin: "0 0 3px"}}>
                        {fmtMoney(o.total, "NGN")}
                      </p>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: s.color,
                          background: s.bg,
                          padding: "2px 6px",
                          borderRadius: 99,
                        }}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Wishlist preview */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "18px 20px",
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}>
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 2px",
              }}>
              Wishlist Preview
            </p>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0}}>
              {wishlist.length} items saved
            </p>
          </div>
          <button
            onClick={() => onNav("wishlist")}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: "pointer",
              padding: 0,
              textTransform: "uppercase",
            }}>
            View all →
          </button>
        </div>
        {loading ? (
          <div style={{display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12}}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} h={180} r={12} />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 12,
              textAlign: "center",
              padding: "20px 0",
            }}>
            Your wishlist is empty.
          </p>
        ) : (
          <div style={{display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12}}>
            {wishlist.slice(0, 4).map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#111",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  transition: "border-color 0.18s,transform 0.18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(168,85,247,0.35)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                <img
                  src={item.product?.primary_image || "https://placehold.co/200x200/111/333?text=?"}
                  alt={item.product?.name}
                  style={{width: "100%", aspectRatio: "1", objectFit: "cover", display: "block"}}
                />
                <div style={{padding: "10px 12px"}}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      margin: "0 0 2px",
                    }}>
                    {item.product?.brand_name}
                  </p>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      margin: "0 0 4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                    {item.product?.name}
                  </p>
                  <p
                    style={{
                      color: "#a855f7",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1rem",
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}>
                    {fmtMoney(item.product?.price, "NGN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest drops */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "18px 20px",
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}>
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 2px",
              }}>
              Latest Drops
            </p>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0}}>
              Fresh in — don't sleep on these
            </p>
          </div>
          <button
            onClick={() => onNav("shop")}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: "pointer",
              padding: "7px 14px",
              borderRadius: 8,
              textTransform: "uppercase",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}>
            Browse shop →
          </button>
        </div>
        {loading ? (
          <div style={{display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12}}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} h={200} r={12} />
            ))}
          </div>
        ) : (
          <div style={{display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12}}>
            {(newProducts.length > 0 ? newProducts : products).slice(0, 4).map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#111",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  transition: "border-color 0.18s,transform 0.18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                <div style={{position: "relative"}}>
                  <img
                    src={p.primary_image || "https://placehold.co/200x200/111/333?text=?"}
                    alt={p.name}
                    style={{width: "100%", aspectRatio: "1", objectFit: "cover", display: "block"}}
                  />
                  {p.tags && (
                    <span
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "3px 7px",
                        borderRadius: 4,
                      }}>
                      {p.tags}
                    </span>
                  )}
                </div>
                <div style={{padding: "10px 12px"}}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      margin: "0 0 2px",
                    }}>
                    {p.brand_name}
                  </p>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      margin: "0 0 4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                    {p.name}
                  </p>
                  <p
                    style={{
                      color: "#ef4444",
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1rem",
                      letterSpacing: "0.04em",
                      margin: 0,
                    }}>
                    {fmtMoney(p.price, "NGN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
