import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  listBrandOrders,
  listMyOrders,
  updateBrandOrderStatus,
} from "../dashboard/dashboard_components/api";
import {usePlatformSettings} from "../dashboard/dashboard_components/platformsettingscontext";

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
  unpaid: {label: "Unpaid", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
  paid: {label: "Paid", color: "#22c55e", bg: "rgba(34,197,94,0.12)"},
};

const ORDER_STATUSES = ["processing", "shipped", "delivered"];

const fmtDate = (str) => {
  if (!str) return "";
  try {
    return new Date(str).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return str;
  }
};

function StatusBadge({status}) {
  const s = STATUS_MAP[status] || {label: status, color: "#fff", bg: "rgba(255,255,255,0.07)"};
  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: s.color,
        background: s.bg,
        padding: "2px 8px",
        borderRadius: 99,
      }}>
      {s.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 12,
        animation: "pulse 1.5s infinite",
      }}>
      <div style={{height: 60, background: "rgba(255,255,255,0.06)", borderRadius: 8}} />
    </div>
  );
}

function EmptyState({filter, mode}) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px dashed rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: "52px 24px",
        textAlign: "center",
      }}>
      <svg
        width="40"
        height="40"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        style={{marginBottom: 14, display: "block", margin: "0 auto 14px"}}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p style={{color: "rgba(255,255,255,0.25)", fontSize: 13, margin: 0}}>
        {filter
          ? "No orders with this status."
          : mode === "incoming"
            ? "No incoming orders yet. Orders will appear here when buyers purchase your products."
            : "You haven't placed any orders yet."}
      </p>
    </div>
  );
}

// ── Reusable contact info tile ────────────────────────────────────────────────
function ContactTile({label, value, href}) {
  const content = (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 8,
        padding: "10px 12px",
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
        {label}
      </p>
      <p
        style={{
          color: href ? "#ef4444" : "rgba(255,255,255,0.6)",
          fontSize: 11,
          margin: 0,
          wordBreak: "break-all",
          textDecoration: href ? "none" : undefined,
        }}>
        {value}
      </p>
    </div>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={{textDecoration: "none"}}>
        {content}
      </a>
    );
  }
  return content;
}

// ── Buyer contact panel (used in IncomingOrders) ──────────────────────────────
// Expects order to have: buyer_email, buyer_phone (from buyers table), contact_phone (from orders table)
function BuyerContactPanel({order}) {
  const hasAny =
    order.buyer_email ||
    order.buyer_phone ||
    order.contact_phone ||
    order.contact_email;

  if (!hasAny) return null;

  // Deduplicate the two phone numbers — only show both if they differ
  const phone1 = order.buyer_phone || null;
  const phone2 = order.contact_phone || order.contact_email_phone || null;
  const showBothPhones = phone1 && phone2 && phone1 !== phone2;

  return (
    <div
      style={{
        marginTop: 16,
        background: "rgba(59,130,246,0.05)",
        border: "1px solid rgba(59,130,246,0.18)",
        borderRadius: 10,
        padding: "14px 16px",
      }}>
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
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Buyer Contact
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
        }}>
        {/* Email from users table */}
        {(order.buyer_email || order.contact_email) && (
          <ContactTile
            label="Email"
            value={order.buyer_email || order.contact_email}
            href={`mailto:${order.buyer_email || order.contact_email}`}
          />
        )}

        {/* Phone from buyers table */}
        {phone1 && (
          <ContactTile
            label={showBothPhones ? "Phone (profile)" : "Phone"}
            value={phone1}
            href={`tel:${phone1}`}
          />
        )}

        {/* Phone from orders table — only show if different */}
        {showBothPhones && (
          <ContactTile
            label="Phone (order)"
            value={phone2}
            href={`tel:${phone2}`}
          />
        )}

        {/* If only order phone exists (no buyer profile phone) */}
        {!phone1 && phone2 && (
          <ContactTile
            label="Phone"
            value={phone2}
            href={`tel:${phone2}`}
          />
        )}
      </div>

      {/* Call-to-action hint when two different numbers */}
      {showBothPhones && (
        <p style={{
          color: "rgba(255,255,255,0.18)",
          fontSize: 10,
          margin: "10px 0 0",
          fontStyle: "italic",
        }}>
          Two numbers available — try either if the first doesn't go through.
        </p>
      )}
    </div>
  );
}

// ── Brand contact panel (used in OutgoingOrders) ──────────────────────────────
// Expects order.brand (or order.brand_info) to carry: brand_name, phone, email,
// instagram, facebook, twitter, tik_tok, website
function BrandContactPanel({order}) {
  // Support both shapes the API might return
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
    {key: "instagram", label: "Instagram", prefix: "https://instagram.com/", icon: "📸"},
    {key: "tik_tok",   label: "TikTok",    prefix: "https://tiktok.com/@",   icon: "🎵"},
    {key: "facebook",  label: "Facebook",  prefix: "https://facebook.com/",  icon: "📘"},
    {key: "twitter",   label: "Twitter",   prefix: "https://twitter.com/",   icon: "🐦"},
  ];

  return (
    <div
      style={{
        marginTop: 16,
        background: "rgba(239,68,68,0.05)",
        border: "1px solid rgba(239,68,68,0.18)",
        borderRadius: 10,
        padding: "14px 16px",
      }}>
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
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        {brand.brand_name ? `${brand.brand_name} — Contact` : "Brand Contact"}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
        }}>
        {/* Email */}
        {brand.email && (
          <ContactTile
            label="Email"
            value={brand.email}
            href={`mailto:${brand.email}`}
          />
        )}

        {/* Phone */}
        {brand.phone && (
          <ContactTile
            label="Phone"
            value={brand.phone}
            href={`tel:${brand.phone}`}
          />
        )}

        {/* Website */}
        {brand.website && (
          <ContactTile
            label="Website"
            value={brand.website.replace(/^https?:\/\//, "")}
            href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`}
          />
        )}

        {/* Social links */}
        {socialLinks.map(({key, label, prefix, icon}) =>
          brand[key] ? (
            <ContactTile
              key={key}
              label={`${icon} ${label}`}
              value={`@${brand[key].replace(/^@/, "")}`}
              href={`${prefix}${brand[key].replace(/^@/, "")}`}
            />
          ) : null
        )}
      </div>
    </div>
  );
}

// ── Incoming orders (orders placed BY buyers FOR this brand's products) ───────
function IncomingOrders() {
  const {fmtMoney} = usePlatformSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState("");
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = (params = {}) => {
    setLoading(true);
    listBrandOrders(params)
      .then((res) => setOrders(res.orders || res || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    load(filter ? {status: filter} : {});
  }, [filter]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await updateBrandOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.order_id === orderId ? {...o, status} : o)));
      showToast(`Status updated to ${status}`);
    } catch (e) {
      showToast("Error: " + e.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 1000,
              background: "#111",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: "12px 18px",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter */}
      <div style={{display: "flex", justifyContent: "flex-end", marginBottom: 16}}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: 12,
            padding: "9px 14px",
            borderRadius: 8,
            cursor: "pointer",
            outline: "none",
            colorScheme: "dark",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} style={{background: "#1a1a1a", color: "#fff"}}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
          <option value="cancelled" style={{background: "#1a1a1a", color: "#fff"}}>
            Cancelled
          </option>
        </select>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#ef4444",
            fontSize: 13,
          }}>
          {error}
        </div>
      )}

      {loading ? (
        [1, 2, 3].map((i) => <SkeletonRow key={i} />)
      ) : orders.length === 0 ? (
        <EmptyState filter={filter} mode="incoming" />
      ) : (
        orders.map((order) => {
          const s = STATUS_MAP[order.status] || {
            label: order.status,
            color: "#fff",
            bg: "rgba(255,255,255,0.07)",
          };
          const isExpanded = expanded === order.order_id;
          const isUpdating = updating === order.order_id;
          return (
            <div
              key={order.order_id}
              style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                marginBottom: 12,
                overflow: "hidden",
              }}>
              <div
                style={{
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  cursor: "pointer",
                }}
                onClick={() => setExpanded(isExpanded ? null : order.order_id)}>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 4}}>
                    <span
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "1rem",
                        color: "#fff",
                        letterSpacing: "0.06em",
                      }}>
                      {order.display_id}
                    </span>
                    <StatusBadge status={order.status} />
                    {order.payout_status === "completed" && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: "0.15em",
                        textTransform: "uppercase", color: "#22c55e",
                        background: "rgba(34,197,94,0.12)", padding: "2px 8px",
                        borderRadius: 99, border: "1px solid rgba(34,197,94,0.25)",
                      }}>💸 Paid Out</span>
                    )}
                    {order.payout_status === "processing" && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: "0.15em",
                        textTransform: "uppercase", color: "#3b82f6",
                        background: "rgba(59,130,246,0.12)", padding: "2px 8px",
                        borderRadius: 99, border: "1px solid rgba(59,130,246,0.25)",
                      }}>⏳ Payout Processing</span>
                    )}
                    {order.payout_status === "pending" && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, letterSpacing: "0.15em",
                        textTransform: "uppercase", color: "#f59e0b",
                        background: "rgba(245,158,11,0.12)", padding: "2px 8px",
                        borderRadius: 99, border: "1px solid rgba(245,158,11,0.25)",
                      }}>🕐 Payout Pending</span>
                    )}
                  </div>
                  <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 2px"}}>
                    <strong style={{color: "rgba(255,255,255,0.7)"}}>{order.buyer_name}</strong>
                    {order.buyer_email && (
                      <span style={{color: "rgba(255,255,255,0.3)"}}> · {order.buyer_email}</span>
                    )}
                  </p>
                  <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0}}>
                    {fmtDate(order.created_at)}
                  </p>
                </div>
                <div style={{display: "flex", alignItems: "center", gap: 14, flexShrink: 0}}>
                  <span
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: "1.4rem",
                      color: "#ef4444",
                    }}>
                    {fmtMoney(order.brand_total)}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    style={{
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "none",
                    }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{height: 0, opacity: 0}}
                    animate={{height: "auto", opacity: 1}}
                    exit={{height: 0, opacity: 0}}
                    transition={{duration: 0.22}}
                    style={{overflow: "hidden"}}>
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        padding: "16px 22px 20px",
                      }}>
                      {/* Order items */}
                      {(order.items || []).map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 0",
                            borderBottom:
                              i < order.items?.length - 1
                                ? "1px solid rgba(255,255,255,0.04)"
                                : "none",
                          }}>
                          <div>
                            <p
                              style={{
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 600,
                                margin: "0 0 2px",
                              }}>
                              {item.product_name}
                            </p>
                            <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                              {item.size && `Size: ${item.size} · `}Qty: {item.quantity}
                            </p>
                          </div>
                          <span
                            style={{
                              fontFamily: "'Bebas Neue',sans-serif",
                              fontSize: "1rem",
                              color: "#ef4444",
                            }}>
                            {fmtMoney(item.total_price)}
                          </span>
                        </div>
                      ))}

                      {/* ── Delivery / Pickup Info ── */}
<div style={{
  marginBottom: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "14px 16px",
}}>
  <p style={{
    color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700,
    letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 10px",
  }}>
    {order.delivery_type === "pickup" ? "📍 Pickup Location" : "🚚 Delivery Destination"}
  </p>

  {order.delivery_type === "pickup" && order.pickup_info ? (
    <div>
      <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 3px"}}>{order.pickup_info.name}</p>
      <p style={{color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 2px"}}>
        {order.pickup_info.address}, {order.pickup_info.city}
        {order.pickup_info.state && `, ${order.pickup_info.state}`}
        {order.pickup_info.country && ` · ${order.pickup_info.country}`}
      </p>
      {order.pickup_info.phone && (
        <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 2px"}}>📞 {order.pickup_info.phone}</p>
      )}
      {order.pickup_info.instructions && (
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: "4px 0 0", fontStyle: "italic"}}>{order.pickup_info.instructions}</p>
      )}
    </div>
  ) : order.delivery_address ? (
    <div>
      <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 3px"}}>
        {[order.delivery_address.city, order.delivery_address.state, order.delivery_address.country].filter(Boolean).join(", ")}
      </p>
      {order.delivery_address.method_name && (
        <p style={{color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 2px"}}>
          via {order.delivery_address.method_name}
        </p>
      )}
      {order.delivery_address.min_days && order.delivery_address.max_days && (
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
          ⏱ Est. {order.delivery_address.min_days}–{order.delivery_address.max_days} days
        </p>
      )}
    </div>
  ) : (
    <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0}}>No delivery details available</p>
  )}
</div>

                      {/* ── Buyer Contact Panel ── */}
                      {/*
                        Backend should JOIN and return on each order:
                          buyer_email   → users.email  (via orders.user_id)
                          buyer_phone   → buyers.phone (via orders.user_id)
                          contact_phone → orders.contact_phone (already on order)
                      */}
                      <BuyerContactPanel order={order} />

                      {/* ── Payout Info Panel ── */}
                      {order.payout_status && (
                        <div style={{
                          marginTop: 16,
                          background: order.payout_status === "completed"
                            ? "rgba(34,197,94,0.06)"
                            : order.payout_status === "processing"
                            ? "rgba(59,130,246,0.06)"
                            : "rgba(245,158,11,0.06)",
                          border: `1px solid ${
                            order.payout_status === "completed"
                              ? "rgba(34,197,94,0.2)"
                              : order.payout_status === "processing"
                              ? "rgba(59,130,246,0.2)"
                              : "rgba(245,158,11,0.2)"
                          }`,
                          borderRadius: 10,
                          padding: "12px 16px",
                        }}>
                          <p style={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                          }}>
                            Payout from BLVCKMRKT
                          </p>
                          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12}}>
                            <div>
                              <p style={{
                                color: order.payout_status === "completed" ? "#22c55e"
                                  : order.payout_status === "processing" ? "#3b82f6" : "#f59e0b",
                                fontSize: 13,
                                fontWeight: 700,
                                margin: "0 0 3px",
                              }}>
                                {order.payout_status === "completed" && "✅ Payment received"}
                                {order.payout_status === "processing" && "⏳ Payment on the way"}
                                {order.payout_status === "pending" && "🕐 Payment queued"}
                                {order.payout_status === "failed" && "❌ Payment failed"}
                              </p>
                              {order.payout_ref && (
                                <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0, fontFamily: "monospace"}}>
                                  Ref: {order.payout_ref}
                                </p>
                              )}
                            </div>
                            {order.payout_amount > 0 && (
                              <span style={{
                                fontFamily: "'Bebas Neue',sans-serif",
                                fontSize: "1.3rem",
                                color: order.payout_status === "completed" ? "#22c55e"
                                  : order.payout_status === "processing" ? "#3b82f6" : "#f59e0b",
                                flexShrink: 0,
                              }}>
                                {fmtMoney(order.payout_amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── Update Status buttons ── */}
                      {order.status !== "delivered" && order.status !== "cancelled" && (
                        <div style={{marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap"}}>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.3)",
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.2em",
                              textTransform: "uppercase",
                              width: "100%",
                              margin: "0 0 8px",
                            }}>
                            Update Status:
                          </p>
                          {ORDER_STATUSES.filter((st) => st !== order.status).map((st) => {
                            const ss = STATUS_MAP[st];
                            return (
                              <button
                                key={st}
                                onClick={() => handleStatus(order.order_id, st)}
                                disabled={isUpdating}
                                style={{
                                  background: "transparent",
                                  border: `1px solid ${ss.color}40`,
                                  color: ss.color,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  letterSpacing: "0.1em",
                                  textTransform: "uppercase",
                                  padding: "7px 14px",
                                  borderRadius: 7,
                                  cursor: isUpdating ? "not-allowed" : "pointer",
                                  transition: "all 0.15s",
                                  opacity: isUpdating ? 0.5 : 1,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = ss.bg)}
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = "transparent")
                                }>
                                {isUpdating
                                  ? "Updating…"
                                  : `Mark ${st.charAt(0).toUpperCase() + st.slice(1)}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </>
  );
}

// ── Outgoing orders (orders the brand placed as a buyer) ──────────────────────
function OutgoingOrders() {
  const {fmtMoney} = usePlatformSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = (params = {}) => {
    setLoading(true);
    listMyOrders(params)
      .then((res) => setOrders(res.orders || res || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    load(filter ? {status: filter} : {});
  }, [filter]);

  return (
    <>
      {/* Filter */}
      <div style={{display: "flex", justifyContent: "flex-end", marginBottom: 16}}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: 12,
            padding: "9px 14px",
            borderRadius: 8,
            cursor: "pointer",
            outline: "none",
            colorScheme: "dark",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s} style={{background: "#1a1a1a", color: "#fff"}}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
          <option value="pending" style={{background: "#1a1a1a", color: "#fff"}}>Pending</option>
          <option value="cancelled" style={{background: "#1a1a1a", color: "#fff"}}>Cancelled</option>
          <option value="delivered" style={{background: "#1a1a1a", color: "#fff"}}>Delivered</option>
        </select>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#ef4444",
            fontSize: 13,
          }}>
          {error}
        </div>
      )}

      {loading ? (
        [1, 2, 3].map((i) => <SkeletonRow key={i} />)
      ) : orders.length === 0 ? (
        <EmptyState filter={filter} mode="outgoing" />
      ) : (
        orders.map((order) => {
          const isExpanded = expanded === order.id;
          const payStatus = STATUS_MAP[order.payment_status] || {
            label: order.payment_status,
            color: "rgba(255,255,255,0.4)",
            bg: "rgba(255,255,255,0.07)",
          };

          return (
            <div
              key={order.id}
              style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                marginBottom: 12,
                overflow: "hidden",
              }}>
              <div
                style={{
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  cursor: "pointer",
                }}
                onClick={() => setExpanded(isExpanded ? null : order.id)}>
                <div style={{flex: 1, minWidth: 0}}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 4,
                      flexWrap: "wrap",
                    }}>
                    <span
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "1rem",
                        color: "#fff",
                        letterSpacing: "0.06em",
                      }}>
                      {order.display_id}
                    </span>
                    <StatusBadge status={order.status} />
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: payStatus.color,
                        background: payStatus.bg,
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}>
                      {payStatus.label}
                    </span>
                  </div>
                  <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0}}>
                    {order.payment_method && (
                      <span style={{color: "rgba(255,255,255,0.35)", textTransform: "capitalize"}}>
                        {order.payment_method.replace("_", " ")} ·{" "}
                      </span>
                    )}
                    {fmtDate(order.created_at)}
                  </p>
                </div>
                <div style={{display: "flex", alignItems: "center", gap: 14, flexShrink: 0}}>
                  <div style={{textAlign: "right"}}>
                    <p
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "1.4rem",
                        color: "#ef4444",
                        margin: 0,
                        lineHeight: 1,
                      }}>
                      {fmtMoney(order.total)}
                    </p>
                    {order.shipping_fee > 0 && (
                      <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "2px 0 0"}}>
                        incl. {fmtMoney(order.shipping_fee)} shipping
                      </p>
                    )}
                  </div>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    style={{
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "none",
                    }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{height: 0, opacity: 0}}
                    animate={{height: "auto", opacity: 1}}
                    exit={{height: 0, opacity: 0}}
                    transition={{duration: 0.22}}
                    style={{overflow: "hidden"}}>
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        padding: "16px 22px 20px",
                      }}>
                      {/* Order items */}
                      {(order.items || order.order_items || []).map((item, i) => {
                        const items = order.items || order.order_items || [];
                        return (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "8px 0",
                              borderBottom:
                                i < items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            }}>
                            <div style={{display: "flex", alignItems: "center", gap: 10}}>
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.product_name}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 6,
                                    objectFit: "cover",
                                    flexShrink: 0,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                  }}
                                />
                              )}
                              <div>
                                <p
                                  style={{
                                    color: "#fff",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    margin: "0 0 2px",
                                  }}>
                                  {item.product_name}
                                </p>
                                <p
                                  style={{
                                    color: "rgba(255,255,255,0.35)",
                                    fontSize: 11,
                                    margin: 0,
                                  }}>
                                  {item.size && `Size: ${item.size} · `}Qty: {item.quantity}
                                  {item.brand_name && (
                                    <span style={{color: "rgba(255,255,255,0.2)"}}>
                                      {" · "}{item.brand_name}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span
                              style={{
                                fontFamily: "'Bebas Neue',sans-serif",
                                fontSize: "1rem",
                                color: "#ef4444",
                              }}>
                              {fmtMoney(item.total_price)}
                            </span>
                          </div>
                        );
                      })}

                      {/* ── Brand Contact Panel ── */}
                      {/*
                        Backend should JOIN and return on each order:
                          order.brand.brand_name  → brands.brand_name
                          order.brand.phone       → brands.phone
                          order.brand.email       → users.email (via brands.user_id)
                          order.brand.instagram   → brands.instagram
                          order.brand.facebook    → brands.facebook
                          order.brand.twitter     → brands.twitter
                          order.brand.tik_tok     → brands.tik_tok
                          order.brand.website     → brands.website
                      */}
                      <BrandContactPanel order={order} />

                      {/* Order meta */}
                      <div
                        style={{
                          marginTop: 16,
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                          gap: 10,
                        }}>
                        {order.contact_email && (
                          <div
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: 8,
                              padding: "10px 12px",
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
                              Your Email (used)
                            </p>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: 11,
                                margin: 0,
                                wordBreak: "break-all",
                              }}>
                              {order.contact_email}
                            </p>
                          </div>
                        )}
                        {order.contact_phone && (
                          <div
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: 8,
                              padding: "10px 12px",
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
                              Your Phone (used)
                            </p>
                            <p style={{color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0}}>
                              {order.contact_phone}
                            </p>
                          </div>
                        )}
                        {order.notes && (
                          <div
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: 8,
                              padding: "10px 12px",
                              gridColumn: "1/-1",
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
                              Notes
                            </p>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.6)",
                                fontSize: 11,
                                margin: 0,
                                lineHeight: 1.6,
                              }}>
                              {order.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </>
  );
}

// ── Root Orders component ─────────────────────────────────────────────────────
export default function Orders() {
  const {fmtMoney} = usePlatformSettings();
  const [tab, setTab] = useState("incoming");
  const [incomingCount, setIncomingCount] = useState(0);
  const [outgoingCount, setOutgoingCount] = useState(0);

  useEffect(() => {
  listBrandOrders({limit: 1}).then((res) => setIncomingCount(res.total ?? (res.orders?.length ?? 0))).catch(() => {});
  listMyOrders({limit: 1}).then((res) => setOutgoingCount(res.total ?? (res.orders?.length ?? 0))).catch(() => {});
}, []);

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>

      {/* Header */}
      <h2
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "clamp(1.6rem,3vw,2.2rem)",
          color: "#fff",
          letterSpacing: "0.04em",
          margin: "0 0 20px",
        }}>
        ORDERS
      </h2>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          paddingBottom: 0,
        }}>
{[
  {id: "incoming", label: "Incoming", count: incomingCount},
  {id: "outgoing", label: "My Orders", count: outgoingCount},
].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 20px 15px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? "#ef4444" : "transparent"}`,
              color: tab === t.id ? "#fff" : "rgba(255,255,255,0.35)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.18s",
              letterSpacing: "0.04em",
              marginBottom: -1,
            }}
            onMouseEnter={(e) => {
              if (tab !== t.id) e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
            onMouseLeave={(e) => {
              if (tab !== t.id) e.currentTarget.style.color = "rgba(255,255,255,0.35)";
            }}>
            {t.label}
<span style={{
  background: tab === t.id ? "#ef4444" : "rgba(255,255,255,0.08)",
  color: tab === t.id ? "#fff" : "rgba(255,255,255,0.3)",
  fontSize: 9, fontWeight: 900, padding: "3px 7px",
  borderRadius: 99, minWidth: 18, textAlign: "center",
  transition: "all 0.2s", marginLeft: 6,
}}>
  {t.count}
</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{opacity: 0, y: 6}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: -4}}
          transition={{duration: 0.18}}>
          {tab === "incoming" ? <IncomingOrders /> : <OutgoingOrders />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}