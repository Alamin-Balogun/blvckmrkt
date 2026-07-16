import {useState, useEffect} from "react";
import {getOrders, cancelOrder} from "../dashboard/dashboard_components/api";

const STATUS_MAP = {
  pending: {label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.1)"},
  processing: {label: "Processing", color: "#3b82f6", bg: "rgba(59,130,246,0.1)"},
  shipped: {label: "Shipped", color: "#a855f7", bg: "rgba(168,85,247,0.1)"},
  delivered: {label: "Delivered", color: "#22c55e", bg: "rgba(34,197,94,0.1)"},
  cancelled: {label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)"},
  refunded: {label: "Refunded", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)"},
};

function Skeleton() {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}>
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 10,
          background: "rgba(255,255,255,0.07)",
          flexShrink: 0,
          animation: "pulse 1.4s infinite",
        }}
      />
      <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 6}}>
        <div
          style={{
            height: 13,
            width: "60%",
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
            animation: "pulse 1.4s infinite",
          }}
        />
        <div
          style={{
            height: 10,
            width: "40%",
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
            animation: "pulse 1.4s infinite",
          }}
        />
      </div>
      <div
        style={{
          width: 60,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "flex-end",
        }}>
        <div
          style={{
            height: 20,
            width: 50,
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
            animation: "pulse 1.4s infinite",
          }}
        />
        <div
          style={{
            height: 16,
            width: 60,
            background: "rgba(255,255,255,0.07)",
            borderRadius: 99,
            animation: "pulse 1.4s infinite",
          }}
        />
      </div>
    </div>
  );
}

// ── Brand contact panel ───────────────────────────────────────────────────────
// Expects order.brand (or order.brand_info) with:
//   brand_name, phone, email, instagram, facebook, twitter, tik_tok, website
function BrandContactPanel({order}) {
  const brand = order.brand || order.brand_info || {};

  const hasAny =
    brand.phone ||
    brand.email ||
    brand.instagram ||
    brand.facebook ||
    brand.twitter ||
    brand.tik_tok ||
    brand.website;

  if (!hasAny && !brand.brand_name) return null;

  const socialLinks = [
    {key: "instagram", label: "Instagram", prefix: "https://instagram.com/",  icon: "📸"},
    {key: "tik_tok",   label: "TikTok",    prefix: "https://tiktok.com/@",    icon: "🎵"},
    {key: "facebook",  label: "Facebook",  prefix: "https://facebook.com/",   icon: "📘"},
    {key: "twitter",   label: "Twitter",   prefix: "https://twitter.com/",    icon: "🐦"},
  ];

  return (
    <div
      style={{
        marginTop: 4,
        background: "rgba(239,68,68,0.05)",
        border: "1px solid rgba(239,68,68,0.18)",
        borderRadius: 10,
        padding: "14px 16px",
      }}>
      {/* Section header */}
      <p
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          margin: "0 0 12px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
        <svg
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        {brand.brand_name ? `${brand.brand_name} — Contact` : "Brand Contact"}
      </p>

      {/* Contact tiles grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 8,
        }}>
        {/* Email */}
        {brand.email && (
          <a
            href={`mailto:${brand.email}`}
            style={{textDecoration: "none"}}
            target="_blank"
            rel="noreferrer">
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                padding: "9px 11px",
              }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 3px",
                }}>
                Email
              </p>
              <p
                style={{
                  color: "#ef4444",
                  fontSize: 11,
                  margin: 0,
                  wordBreak: "break-all",
                }}>
                {brand.email}
              </p>
            </div>
          </a>
        )}

        {/* Phone */}
        {brand.phone && (
          <a href={`tel:${brand.phone}`} style={{textDecoration: "none"}}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                padding: "9px 11px",
              }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 3px",
                }}>
                Phone
              </p>
              <p style={{color: "#ef4444", fontSize: 11, margin: 0}}>
                {brand.phone}
              </p>
            </div>
          </a>
        )}

        {/* Website */}
        {brand.website && (
          <a
            href={
              brand.website.startsWith("http") ? brand.website : `https://${brand.website}`
            }
            target="_blank"
            rel="noreferrer"
            style={{textDecoration: "none"}}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                padding: "9px 11px",
              }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 3px",
                }}>
                Website
              </p>
              <p
                style={{
                  color: "#ef4444",
                  fontSize: 11,
                  margin: 0,
                  wordBreak: "break-all",
                }}>
                {brand.website.replace(/^https?:\/\//, "")}
              </p>
            </div>
          </a>
        )}

        {/* Social links */}
        {socialLinks.map(({key, label, prefix, icon}) =>
          brand[key] ? (
            <a
              key={key}
              href={`${prefix}${brand[key].replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              style={{textDecoration: "none"}}>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 8,
                  padding: "9px 11px",
                }}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "0 0 3px",
                  }}>
                  {icon} {label}
                </p>
                <p style={{color: "#ef4444", fontSize: 11, margin: 0}}>
                  @{brand[key].replace(/^@/, "")}
                </p>
              </div>
            </a>
          ) : null
        )}
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    getOrders()
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const handleCancel = async (id) => {
    if (!confirm("Cancel this order?")) return;
    setCancelling(id);
    try {
      await cancelOrder(id);
      setOrders((prev) => prev.map((o) => (o.id === id ? {...o, status: "cancelled"} : o)));
    } catch (e) {
      alert(e.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .ord-items-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;}
        .ord-meta{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;}
        @media(max-width:500px){
          .ord-items-grid{grid-template-columns:1fr!important;}
        }
      `}</style>
      <div style={{marginBottom: 20}}>
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(1.6rem,3vw,2.2rem)",
            color: "#fff",
            letterSpacing: "0.04em",
            margin: "0 0 4px",
          }}>
          MY ORDERS
        </h2>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
          {loading
            ? "Loading..."
            : `${orders.length} order${orders.length !== 1 ? "s" : ""} placed`}
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#ef4444",
            fontSize: 12,
            marginBottom: 16,
          }}>
          {error}
        </div>
      )}

      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} />)
        ) : orders.length === 0 ? (
          <div
            style={{
              background: "#0d0d0d",
              border: "1px dashed rgba(255,255,255,0.12)",
              borderRadius: 16,
              padding: "60px 24px",
              textAlign: "center",
            }}>
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              style={{margin: "0 auto 14px", display: "block"}}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 13}}>
              No orders yet. Start browsing the shop.
            </p>
          </div>
        ) : (
          orders.map((o) => {
            const s = STATUS_MAP[o.status] || STATUS_MAP.pending;
            const isExpanded = expanded === o.id;
            const canCancel = o.status === "pending" || o.status === "processing";
            return (
              <div
                key={o.id}
                style={{
                  background: "#0d0d0d",
                  border: `1px solid ${isExpanded ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "border-color 0.18s",
                }}>
                {/* Main row */}
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                  }}
                  onClick={() => setExpanded(isExpanded ? null : o.id)}>
                  <img
                    src={o.items?.[0]?.image_url || "https://placehold.co/58x58/111/444?text=?"}
                    alt={o.items?.[0]?.product_name}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 10,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{flex: 1, minWidth: 0}}>
                    <p
                      style={{
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        margin: "0 0 3px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                      {o.items?.[0]?.product_name || "Order"}
                      {o.items?.length > 1 ? ` +${o.items.length - 1} more` : ""}
                    </p>
                    <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "0 0 2px"}}>
                      {o.display_id}
                    </p>
                    <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
                      {o.created_at} · {o.items?.length} item{o.items?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div style={{textAlign: "right", flexShrink: 0}}>
                    <p
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "1.4rem",
                        color: "#fff",
                        letterSpacing: "0.04em",
                        margin: "0 0 6px",
                      }}>
                      ${o.total}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: s.color,
                        background: s.bg,
                        padding: "4px 10px",
                        borderRadius: 99,
                      }}>
                      {s.label}
                    </span>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    style={{
                      flexShrink: 0,
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "none",
                    }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      padding: "14px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}>
                    {/* Order items */}
                    {o.items?.map((item) => (
                      <div key={item.id} style={{display: "flex", alignItems: "center", gap: 12}}>
                        <img
                          src={item.image_url || "https://placehold.co/40x40/111/444?text=?"}
                          alt={item.product_name}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 7,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{flex: 1, minWidth: 0}}>
                          <p
                            style={{
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 600,
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                            {item.product_name}
                          </p>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.3)",
                              fontSize: 10,
                              margin: "2px 0 0",
                            }}>
                            {item.size ? `Size: ${item.size} · ` : ""}Qty: {item.quantity}
                            {item.brand_name && (
                              <span style={{color: "rgba(255,255,255,0.2)"}}>
                                {" · "}{item.brand_name}
                              </span>
                            )}
                          </p>
                        </div>
                        <p
                          style={{
                            color: "#ef4444",
                            fontFamily: "'Bebas Neue',sans-serif",
                            fontSize: "1rem",
                            margin: 0,
                            flexShrink: 0,
                          }}>
                          ${item.total_price}
                        </p>
                      </div>
                    ))}

                    {/* Order totals */}
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: 12,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          alignItems: "flex-end",
                          minWidth: 160,
                        }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                          }}>
                          <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>
                            Subtotal
                          </span>
                          <span style={{color: "rgba(255,255,255,0.6)", fontSize: 11}}>
                            ${o.subtotal}
                          </span>
                        </div>
                        {o.shipping_fee > 0 && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              width: "100%",
                            }}>
                            <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>
                              Shipping
                            </span>
                            <span style={{color: "rgba(255,255,255,0.6)", fontSize: 11}}>
                              ${o.shipping_fee}
                            </span>
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                          }}>
                          <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>Total</span>
                          <span
                            style={{
                              color: "#ef4444",
                              fontFamily: "'Bebas Neue',sans-serif",
                              fontSize: "1.1rem",
                            }}>
                            ${o.total}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Brand Contact Panel ── */}
                    {/*
                      Backend (getOrders) should JOIN and return on each order:
                        order.brand.brand_name  → brands.brand_name
                        order.brand.phone       → brands.phone
                        order.brand.email       → users.email (via brands.user_id)
                        order.brand.instagram   → brands.instagram
                        order.brand.facebook    → brands.facebook
                        order.brand.twitter     → brands.twitter
                        order.brand.tik_tok     → brands.tik_tok
                        order.brand.website     → brands.website

                      If an order has items from multiple brands, loop per-item instead
                      and use item.brand for each BrandContactPanel.
                    */}
                    <BrandContactPanel order={o} />

                    {/* Delivery address */}
                    {o.address && (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderRadius: 8,
                          padding: "10px 14px",
                        }}>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.25)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            margin: "0 0 4px",
                          }}>
                          Delivery To
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 11,
                            margin: 0,
                            lineHeight: 1.6,
                          }}>
                          {o.address.line1}
                          {o.address.line2 ? `, ${o.address.line2}` : ""}, {o.address.city}
                          {o.address.state ? `, ${o.address.state}` : ""} {o.address.postcode},{" "}
                          {o.address.country}
                        </p>
                      </div>
                    )}

                    {/* Cancel button */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(o.id)}
                        disabled={cancelling === o.id}
                        style={{
                          alignSelf: "flex-start",
                          background: "transparent",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "rgba(239,68,68,0.7)",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          padding: "8px 16px",
                          borderRadius: 7,
                          cursor: cancelling === o.id ? "not-allowed" : "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (cancelling !== o.id) {
                            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                            e.currentTarget.style.color = "#ef4444";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "rgba(239,68,68,0.7)";
                        }}>
                        {cancelling === o.id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}