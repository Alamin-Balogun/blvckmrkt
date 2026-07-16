import {useState, useEffect} from "react";
import {motion} from "framer-motion";
import {getBrandOverview} from "./api";
import {usePlatformSettings, MaintenanceBanner} from "./platformsettingscontext";

const STATUS_MAP = {
  active: {label: "Active", color: "#22c55e", bg: "rgba(34,197,94,0.12)"},
  draft: {label: "Draft", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
  sold_out: {label: "Sold Out", color: "#ef4444", bg: "rgba(239,68,68,0.12)"},
  archived: {label: "Archived", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.07)"},
  pending: {label: "Pending", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
  processing: {label: "Processing", color: "#3b82f6", bg: "rgba(59,130,246,0.12)"},
  shipped: {label: "Shipped", color: "#a855f7", bg: "rgba(168,85,247,0.12)"},
  delivered: {label: "Delivered", color: "#22c55e", bg: "rgba(34,197,94,0.12)"},
  cancelled: {label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.12)"},
  refunded: {label: "Refunded", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
};

function timeAgo(str) {
  if (!str) return "";
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(str).toLocaleDateString("en-GB", {day: "numeric", month: "short"});
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function Skel({h = 14, w = "100%", r = 6, mb = 0}) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: r,
        marginBottom: mb,
        flexShrink: 0,
        background: "rgba(255,255,255,0.06)",
        animation: "pulse 1.5s infinite",
      }}
    />
  );
}

function Badge({status}) {
  const s = STATUS_MAP[status] || {
    color: "#fff",
    bg: "rgba(255,255,255,0.07)",
    label: status || "—",
  };
  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: s.color,
        background: s.bg,
        padding: "2px 7px",
        borderRadius: 99,
        flexShrink: 0,
      }}>
      {s.label}
    </span>
  );
}

function StatCard({label, value, sub, accent, trend, loading, icon}) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: accent || "#ef4444",
          borderRadius: "2px 0 0 2px",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}>
        <p
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            margin: 0,
          }}>
          {label}
        </p>
        {icon && (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              flexShrink: 0,
              background: `${accent}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <>
          <Skel h={34} r={6} mb={6} />
          <Skel h={11} w="55%" r={4} />
        </>
      ) : (
        <>
          <p
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "2.2rem",
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              marginBottom: 4,
            }}>
            {value ?? "—"}
          </p>
          <div style={{display: "flex", alignItems: "center", gap: 6}}>
            {sub && <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0}}>{sub}</p>}
            {trend != null && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: trend >= 0 ? "#22c55e" : "#ef4444",
                  background: trend >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  padding: "1px 6px",
                  borderRadius: 99,
                }}>
                {trend >= 0 ? "↑" : "↓"} {Math.abs(Math.round(trend))}%
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SectionHead({title, accentColor = "#ef4444", action, onAction}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
      <div style={{display: "flex", alignItems: "center", gap: 8}}>
        <span
          style={{
            width: 3,
            height: 16,
            background: accentColor,
            display: "inline-block",
            borderRadius: 2,
          }}
        />
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "1.05rem",
            color: "#fff",
            letterSpacing: "0.08em",
            margin: 0,
          }}>
          {title}
        </h2>
      </div>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: accentColor,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
          {action} →
        </button>
      )}
    </div>
  );
}

export default function Overview({onNav}) {
  const {settings, fmtMoney} = usePlatformSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBrandOverview()
      .then((raw) => {
        if (raw && typeof raw === "object" && !Array.isArray(raw)) setData(raw);
        else setData({});
      })
      .catch((e) => setError(e?.message || "Failed to load overview."))
      .finally(() => setLoading(false));
  }, []);

  const stats =
    data && typeof data.stats === "object" && !Array.isArray(data.stats) ? data.stats : {};
  const orders = safeArray(data?.recent_orders);
  const top = safeArray(data?.top_products);
  const breakdown =
    data?.order_breakdown &&
    typeof data.order_breakdown === "object" &&
    !Array.isArray(data.order_breakdown)
      ? data.order_breakdown
      : {};

  const activeProds = stats.active_products ?? stats.product_count ?? "—";
  const pendingOrders = stats.pending_orders ?? "—";
  const convRate = stats.conversion_rate != null ? `${stats.conversion_rate}%` : "—";
  const totalRevenue = stats.total_revenue != null ? fmtMoney(stats.total_revenue) : "—";

  // Commission calculation
  const commissionRate = Number(settings.commission_rate ?? 10);
  const revenueThisMonth = Number(stats.revenue_this_month ?? 0);
  const netThisMonth = revenueThisMonth - (revenueThisMonth * commissionRate) / 100;

  // Low stock products
  const lowStockThreshold = Number(settings.low_stock_threshold ?? 5);
  const lowStockItems = top.filter((p) => {
    const stock = p.sizes?.reduce((s, sz) => s + (sz.stock ?? 0), 0) ?? p.stock ?? null;
    return stock !== null && stock <= lowStockThreshold && stock > 0;
  });

  const breakdownRows = [
    {key: "processing", ...STATUS_MAP.processing},
    {key: "shipped", ...STATUS_MAP.shipped},
    {key: "delivered", ...STATUS_MAP.delivered},
    {key: "pending", ...STATUS_MAP.pending},
    {key: "cancelled", ...STATUS_MAP.cancelled},
  ];
  const bTotal = breakdownRows.reduce((s, r) => s + (breakdown[r.key] || 0), 0) || 1;

  const quickActions = [
    {label: "Add New Product", nav: "products", color: "#ef4444"},
    {label: "View All Orders", nav: "orders", color: "#6366f1"},
    {label: "Analytics", nav: "analytics", color: "#f97316"},
    {label: "Browse Shop", nav: "shop", color: "#22c55e"},
    {label: "Addresses", nav: "addresses", color: "#a855f7"},
    {label: "Settings", nav: "settings", color: "#3b82f6"},
  ];

  return (
    <div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ov-2col { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .ov-3col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; }
        @media(max-width:860px){ .ov-3col { grid-template-columns:1fr 1fr !important; } }
        @media(max-width:600px){ .ov-2col,.ov-3col { grid-template-columns:1fr !important; } }
      `}</style>

      <MaintenanceBanner />

      {/* Purchases paused banner */}
      {settings.disable_purchases && (
        <div
          style={{
            background: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.2)",
            borderRadius: 10,
            padding: "11px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p style={{color: "#f97316", fontSize: 12, fontWeight: 700, margin: 0}}>
            Purchases are currently paused by the platform administrator. New orders cannot be
            placed.
          </p>
        </div>
      )}

      {/* Studio Header */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "28px 28px 24px",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
        }}>
        <div
          style={{
            position: "absolute",
            top: -70,
            right: -70,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(239,68,68,0.07),transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <p
          style={{
            color: "rgba(255,255,255,0.28)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(2rem,4vw,3rem)",
            color: "#fff",
            letterSpacing: "0.05em",
            lineHeight: 1,
            margin: "0 0 10px",
          }}>
          BRAND STUDIO
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 13,
            margin: "0 0 22px",
            lineHeight: 1.6,
            maxWidth: 500,
          }}>
          Your brand's performance at a glance — revenue, orders, top products and more.
        </p>
        <div style={{display: "flex", gap: 8, flexWrap: "wrap"}}>
          {quickActions.map((a) => (
            <button
              key={a.nav}
              onClick={() => onNav?.(a.nav)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.55)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "7px 14px",
                borderRadius: 99,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${a.color}18`;
                e.currentTarget.style.borderColor = `${a.color}50`;
                e.currentTarget.style.color = a.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 18,
            color: "#ef4444",
            fontSize: 13,
          }}>
          {error}
        </div>
      )}

      {/* Low stock warning */}
      {!loading && lowStockItems.length > 0 && (
        <div
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 10,
            padding: "11px 16px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
          <span style={{fontSize: 14}}>⚠️</span>
          <p style={{color: "#f59e0b", fontSize: 12, fontWeight: 700, margin: 0}}>
            {lowStockItems.length} product{lowStockItems.length > 1 ? "s" : ""} running low on stock
            (≤ {lowStockThreshold} units):{" "}
            <span style={{fontWeight: 400}}>
              {lowStockItems
                .slice(0, 3)
                .map((p) => p.name)
                .join(", ")}
              {lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : ""}
            </span>
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: 14,
          marginBottom: 20,
        }}>
        <StatCard
          loading={loading}
          label="Revenue (Month)"
          value={fmtMoney(stats.revenue_this_month)}
          trend={stats.revenue_trend}
          accent="#ef4444"
          sub="vs last month"
          icon={
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
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
          loading={loading}
          label="Orders (Month)"
          value={stats.orders_this_month ?? "—"}
          trend={stats.orders_trend}
          accent="#6366f1"
          sub="vs last month"
          icon={
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <StatCard
          loading={loading}
          label="Active Products"
          value={activeProds}
          accent="#22c55e"
          sub="in catalogue"
          icon={
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          }
        />
        <StatCard
          loading={loading}
          label="Net This Month"
          value={revenueThisMonth > 0 ? fmtMoney(netThisMonth) : "—"}
          accent="#f97316"
          sub={`After ${commissionRate}% commission`}
          icon={
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
      </div>

      {/* Middle Row */}
      <div className="ov-3col" style={{marginBottom: 20}}>
        {/* Quick Numbers */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
          <SectionHead title="Quick Numbers" accentColor="#a855f7" />
          <div style={{padding: "6px 20px 14px"}}>
            {loading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "9px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}>
                      <Skel h={11} w="45%" />
                      <Skel h={11} w="22%" />
                    </div>
                  ))
              : [
                  {l: "Total Revenue", v: totalRevenue, c: "#ef4444"},
                  {l: "Pending Orders", v: pendingOrders, c: "#f97316"},
                  {l: "Conversion Rate", v: convRate, c: "#22c55e"},
                  {l: "Total Orders", v: stats.total_orders ?? "—", c: "#6366f1"},
                  {
                    l: `Commission Rate`,
                    v: `${commissionRate}%`,
                    c: "#a855f7",
                  },
                ].map((row, i, arr) => (
                  <div
                    key={row.l}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderBottom:
                        i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}>
                    <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12}}>{row.l}</span>
                    <span
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "1rem",
                        color: row.c,
                        letterSpacing: "0.04em",
                      }}>
                      {row.v}
                    </span>
                  </div>
                ))}
          </div>
        </div>

        {/* Order Breakdown */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
          <SectionHead title="Order Breakdown" accentColor="#6366f1" />
          <div style={{padding: "10px 20px 16px"}}>
            {loading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} style={{marginBottom: 12}}>
                      <div
                        style={{display: "flex", justifyContent: "space-between", marginBottom: 5}}>
                        <Skel h={11} w="40%" />
                        <Skel h={11} w="14%" />
                      </div>
                      <Skel h={4} r={99} />
                    </div>
                  ))
              : breakdownRows.map((s) => {
                  const count = breakdown[s.key] || 0;
                  const pct = Math.round((count / bTotal) * 100);
                  return (
                    <div key={s.key} style={{marginBottom: 12}}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 5,
                        }}>
                        <div style={{display: "flex", alignItems: "center", gap: 6}}>
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: s.color,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>
                            {s.label}
                          </span>
                        </div>
                        <span style={{color: "#fff", fontSize: 11, fontWeight: 700}}>{count}</span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}>
                        <motion.div
                          initial={{width: 0}}
                          animate={{width: `${pct}%`}}
                          transition={{duration: 0.9, delay: 0.1}}
                          style={{height: "100%", background: s.color, borderRadius: 99}}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
          <SectionHead title="Quick Actions" accentColor="#22c55e" />
          <div style={{padding: "10px 16px 14px"}}>
            {quickActions.map((a) => (
              <button
                key={a.nav}
                onClick={() => onNav?.(a.nav)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  borderRadius: 9,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  marginBottom: 7,
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${a.color}12`;
                  e.currentTarget.style.borderColor = `${a.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}>
                <div style={{display: "flex", alignItems: "center", gap: 10}}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: a.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)"}}>
                    {a.label}
                  </span>
                </div>
                <span style={{color: a.color, fontSize: 12, opacity: 0.7}}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="ov-2col">
        {/* Recent Orders */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
          <SectionHead
            title="RECENT ORDERS"
            accentColor="#ef4444"
            action="View All"
            onAction={() => onNav?.("orders")}
          />
          {loading ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                  <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 7}}>
                    <Skel h={13} w="65%" />
                    <Skel h={11} w="45%" />
                  </div>
                  <Skel h={13} w={50} r={4} />
                </div>
              ))
          ) : orders.length === 0 ? (
            <div style={{padding: "44px 20px", textAlign: "center"}}>
              <p
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1.5rem",
                  color: "rgba(255,255,255,0.08)",
                  letterSpacing: "0.06em",
                  margin: "0 0 8px",
                }}>
                NO ORDERS YET
              </p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, margin: 0}}>
                Orders will appear here once buyers start purchasing.
              </p>
            </div>
          ) : (
            orders.slice(0, 7).map((o, i) => (
              <div
                key={o.order_id ?? i}
                style={{
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  cursor: "default",
                  borderBottom:
                    i < Math.min(orders.length, 7) - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{minWidth: 0, flex: 1}}>
                  <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 3}}>
                    <span
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "0.85rem",
                        color: "#fff",
                        letterSpacing: "0.06em",
                      }}>
                      {o.display_id || `#${o.order_id}`}
                    </span>
                    <Badge status={o.status} />
                  </div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      margin: "0 0 2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                    <strong style={{color: "rgba(255,255,255,0.7)"}}>
                      {o.buyer_name || "Buyer"}
                    </strong>
                    {o.item_name ? ` · ${o.item_name}` : ""}
                  </p>
                  <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
                    {timeAgo(o.created_at)}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: "1.1rem",
                    color: "#ef4444",
                    flexShrink: 0,
                  }}>
                  {fmtMoney(o.brand_total)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Top Products */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
          <SectionHead
            title="TOP PRODUCTS"
            accentColor="#22c55e"
            action="Manage"
            onAction={() => onNav?.("products")}
          />
          {loading ? (
            Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "13px 20px",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                  <Skel h={46} w={46} r={9} />
                  <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 7}}>
                    <Skel h={13} w="70%" />
                    <Skel h={11} w="40%" />
                  </div>
                </div>
              ))
          ) : top.length === 0 ? (
            <div style={{padding: "44px 20px", textAlign: "center"}}>
              <p
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1.5rem",
                  color: "rgba(255,255,255,0.08)",
                  letterSpacing: "0.06em",
                  margin: "0 0 8px",
                }}>
                NO PRODUCTS YET
              </p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, margin: "0 0 16px"}}>
                Add products to start tracking top performers.
              </p>
              <button
                onClick={() => onNav?.("products")}
                style={{
                  background: "#ef4444",
                  border: "none",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  padding: "9px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}>
                + Add Product
              </button>
            </div>
          ) : (
            top.slice(0, 7).map((p, i) => {
              // Low stock check for each product
              const stock = p.sizes?.reduce((s, sz) => s + (sz.stock ?? 0), 0) ?? p.stock ?? null;
              const isLowStock = stock !== null && stock <= lowStockThreshold && stock > 0;

              return (
                <div
                  key={p.product_id ?? i}
                  style={{
                    padding: "12px 20px",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    cursor: "default",
                    borderBottom:
                      i < Math.min(top.length, 7) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.015)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  {/* Rank */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        i === 0
                          ? "rgba(245,158,11,0.15)"
                          : i === 1
                            ? "rgba(148,163,184,0.1)"
                            : i === 2
                              ? "rgba(180,83,9,0.1)"
                              : "rgba(255,255,255,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        color:
                          i === 0
                            ? "#f59e0b"
                            : i === 1
                              ? "#94a3b8"
                              : i === 2
                                ? "#b45309"
                                : "rgba(255,255,255,0.2)",
                      }}>
                      {i + 1}
                    </span>
                  </div>

                  {/* Image */}
                  {p.primary_image ? (
                    <img
                      src={p.primary_image}
                      alt={p.name}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 9,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 9,
                        background: "rgba(255,255,255,0.06)",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Info */}
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 4}}>
                      <p
                        style={{
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                        {p.name}
                      </p>
                      {isLowStock && (
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#f59e0b",
                            background: "rgba(245,158,11,0.12)",
                            padding: "2px 6px",
                            borderRadius: 99,
                            flexShrink: 0,
                          }}>
                          Low Stock
                        </span>
                      )}
                    </div>
                    <div style={{display: "flex", alignItems: "center", gap: 8}}>
                      <span
                        style={{
                          fontFamily: "'Bebas Neue',sans-serif",
                          fontSize: "1rem",
                          color: "#ef4444",
                        }}>
                        {fmtMoney(p.price)}
                      </span>
                    </div>
                  </div>

                  {/* Sales */}
                  <div style={{textAlign: "right", flexShrink: 0}}>
                    <p
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "1.1rem",
                        color: "#22c55e",
                        margin: 0,
                        lineHeight: 1,
                      }}>
                      {p.total_sales ?? 0}
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        margin: "2px 0 0",
                      }}>
                      sold
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
