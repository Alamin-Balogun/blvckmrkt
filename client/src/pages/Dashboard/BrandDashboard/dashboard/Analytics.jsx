import {useState, useEffect} from "react";
import {motion} from "framer-motion";
import {getBrandAnalytics} from "./dashboard_components/api";
import {usePlatformSettings} from "./dashboard_components/platformsettingscontext";

function StatCard({label, value, sub, accent, trend}) {
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
          width: 4,
          height: "100%",
          background: accent || "#ef4444",
          borderRadius: "2px 0 0 2px",
        }}
      />
      <p
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "2.2rem",
          color: "#fff",
          letterSpacing: "0.04em",
          lineHeight: 1,
          marginBottom: 4,
        }}>
        {value}
      </p>
      <div style={{display: "flex", alignItems: "center", gap: 6}}>
        {sub && <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0}}>{sub}</p>}
        {trend != null && (
          <span style={{fontSize: 10, fontWeight: 700, color: trend >= 0 ? "#22c55e" : "#ef4444"}}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(Math.round(trend))}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function Analytics() {
  const {fmtMoney} = usePlatformSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    getBrandAnalytics()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {};
  const monthly = data?.monthly || [];
  const topProds = data?.top_products || [];

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue || 0), 1);

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom: 28}}>
        <p
          style={{
            color: "rgba(255,255,255,0.28)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            marginBottom: 3,
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
            fontSize: "clamp(1.6rem,3vw,2.4rem)",
            color: "#fff",
            letterSpacing: "0.04em",
            lineHeight: 1,
            margin: 0,
          }}>
          ANALYTICS
        </h1>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            color: "#ef4444",
            fontSize: 13,
          }}>
          {error}
        </div>
      )}

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 14,
          marginBottom: 28,
        }}>
        <StatCard
          label="Total Revenue"
          value={loading ? "—" : fmtMoney(summary.total_revenue)}
          accent="#ef4444"
          sub="All time"
        />
        <StatCard
          label="Units Sold"
          value={loading ? "—" : (summary.total_units_sold ?? "—")}
          accent="#6366f1"
          sub="All time"
        />
        <StatCard
          label="Total Orders"
          value={loading ? "—" : (summary.total_orders ?? "—")}
          accent="#22c55e"
          sub="All time"
        />
        <StatCard
          label="Revenue (Month)"
          value={loading ? "—" : fmtMoney(summary.revenue_this_month)}
          accent="#f97316"
          sub="vs last month"
          trend={summary.revenue_trend}
        />
      </div>

      {/* Revenue bar chart */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "22px 24px",
          marginBottom: 24,
        }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
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
            Monthly Revenue (Last 12 Months)
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
            Hover bars for details
          </p>
        </div>

        {loading ? (
          <div
            style={{
              height: 120,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              animation: "pulse 1.5s infinite",
            }}
          />
        ) : monthly.length === 0 ? (
          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 13,
              textAlign: "center",
              padding: "24px 0",
              margin: 0,
            }}>
            No revenue data yet.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 160,
              position: "relative",
            }}>
            {monthly.map((m, i) => {
              const h = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
              const isCurrent = i === monthly.length - 1;
              const isHovered = hoveredBar === i;

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                  }}>
                  {/* Tooltip — only renders when hovered */}
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% - 14px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        padding: "7px 11px",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        zIndex: 20,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                      }}>
                      <span style={{color: "rgba(255,255,255,0.4)", fontSize: 10}}>
                        {m.month}:{" "}
                      </span>
                      <strong style={{color: "#ef4444", fontSize: 11}}>
                        {fmtMoney(m.revenue)}
                      </strong>
                      <span
                        style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "0 5px"}}>
                        ·
                      </span>
                      <span style={{color: "#fff", fontSize: 10}}>{m.units} units</span>
                    </div>
                  )}

                  {/* Bar */}
                  <div style={{flex: 1, width: "100%", display: "flex", alignItems: "flex-end"}}>
                    <motion.div
                      initial={{height: 0}}
                      animate={{height: `${Math.max(h, 2)}%`}}
                      transition={{duration: 0.6, delay: i * 0.04, ease: "easeOut"}}
                      style={{
                        width: "100%",
                        borderRadius: "4px 4px 0 0",
                        background: isCurrent
                          ? "#ef4444"
                          : isHovered
                            ? "rgba(239,68,68,0.65)"
                            : "rgba(239,68,68,0.28)",
                        transition: "background 0.18s",
                      }}
                    />
                  </div>

                  {/* Month label */}
                  <span
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      transition: "color 0.18s",
                      color: isCurrent
                        ? "#ef4444"
                        : isHovered
                          ? "rgba(255,255,255,0.7)"
                          : "rgba(255,255,255,0.2)",
                    }}>
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top products by revenue */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          overflow: "hidden",
        }}>
        <div style={{padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
          <h3
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "1.1rem",
              color: "#fff",
              letterSpacing: "0.06em",
              margin: 0,
            }}>
            TOP PRODUCTS BY REVENUE
          </h3>
        </div>

        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.5fr 1fr 1fr 1fr",
            padding: "8px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
          {["Product", "Price", "Units", "Revenue"].map((h) => (
            <span
              key={h}
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}>
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 22px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.06)",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.06)",
                    animation: "pulse 1.5s infinite",
                  }}
                />
              </div>
            ))
        ) : topProds.length === 0 ? (
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 13,
              textAlign: "center",
              padding: "32px 20px",
              margin: 0,
            }}>
            No product data yet.
          </p>
        ) : (
          topProds.map((p, i) => (
            <div
              key={p.product_id}
              style={{
                display: "grid",
                gridTemplateColumns: "2.5fr 1fr 1fr 1fr",
                padding: "14px 22px",
                alignItems: "center",
                borderBottom: i < topProds.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                {p.primary_image ? (
                  <img
                    src={p.primary_image}
                    alt={p.name}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 7,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 7,
                      background: "rgba(255,255,255,0.06)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <p
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 180,
                  }}>
                  {p.name}
                </p>
              </div>
              <span
                style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", color: "#fff"}}>
                {fmtMoney(p.price)}
              </span>
              <span style={{color: "rgba(255,255,255,0.5)", fontSize: 12}}>{p.total_units}</span>
              <span style={{color: "#ef4444", fontSize: 12, fontWeight: 600}}>
                {fmtMoney(p.total_revenue)}
              </span>
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
