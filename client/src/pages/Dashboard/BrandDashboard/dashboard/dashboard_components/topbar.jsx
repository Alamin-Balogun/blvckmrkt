import {useState, useRef, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";  // ✅ Added
import logo from "../../../../../assets/logo.png";  // ✅ Added

const NAV_ITEMS = [
  {id: "overview", label: "Studio"},
  {id: "products", label: "Products"},
  {id: "orders", label: "Orders"},
  {id: "shipping", label: "Shipping"},
  {id: "local_shipping", label: "Local Shipping"},
  {id: "analytics", label: "Analytics"},
  {id: "shop", label: "Shop"},
  {id: "wishlist", label: "Wishlist"},
  {id: "addresses", label: "Addresses"},
  {id: "notifications", label: "Notifications"},
  {id: "bank_account", label: "Bank Account"},
  {id: "settings", label: "Settings"},
];

const ICONS = {
  overview: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  products: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  orders: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  shipping: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4l3 3v2h-7z" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),

  local_shipping: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3l4 4-4 4" />
      <circle cx="7" cy="17" r="2" />
    </svg>
  ),
  analytics: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  shop: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  wishlist: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
  addresses: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  notifications: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
    bank_account: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
  ),
  settings: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotifIcon({type}) {
  if (type === "drop")
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(239,68,68,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    );
  if (type === "order")
    return (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(59,130,246,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      </div>
    );
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "rgba(168,85,247,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
      <svg width="14" height="14" fill="none" stroke="#a855f7" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
}

function NotifDropdown({notifications, unread, onMarkAllRead, onGoTo, onGoToNotif}) {
  return (
    <motion.div
      initial={{opacity: 0, y: -8, scale: 0.96}}
      animate={{opacity: 1, y: 0, scale: 1}}
      exit={{opacity: 0, y: -8, scale: 0.96}}
      transition={{duration: 0.16}}
      style={{
        width: "min(330px, calc(100vw - 32px))",
        background: "#111",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        overflow: "hidden",
      }}>
      {/* Header */}
      <div
        style={{
          padding: "13px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        <div style={{display: "flex", alignItems: "center", gap: 8}}>
          <p style={{color: "#fff", fontSize: 13, fontWeight: 700, margin: 0}}>Notifications</p>
          {unread > 0 && (
            <span
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "#ef4444",
                fontSize: 9,
                fontWeight: 900,
                padding: "2px 7px",
                borderRadius: 99,
              }}>
              {unread} new
            </span>
          )}
        </div>
        {unread > 0 && (
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              onMarkAllRead();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(239,68,68,0.7)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: 0,
            }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Items */}
      <div>
        {notifications.length === 0 ? (
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 12,
              textAlign: "center",
              padding: "20px 16px",
              margin: 0,
            }}>
            No notifications yet.
          </p>
        ) : (
          notifications.slice(0, 4).map((n, i) => {
            const read = n.is_read ?? n.read;
            return (
              <div
                key={n.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onGoToNotif?.(n);
                }}
                style={{
                  padding: "11px 16px",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  borderBottom:
                    i < Math.min(notifications.length - 1, 3)
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                  background: read ? "transparent" : "rgba(239,68,68,0.04)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = read ? "transparent" : "rgba(239,68,68,0.04)")
                }>
                <NotifIcon type={n.type} />
                <div style={{flex: 1, minWidth: 0}}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}>
                    <p
                      style={{
                        color: read ? "rgba(255,255,255,0.6)" : "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                      {n.title}
                    </p>
                    {!read && (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#ef4444",
                          flexShrink: 0,
                          marginLeft: 6,
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 11,
                      margin: "0 0 2px",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                    {n.body}
                  </p>
                  <p style={{color: "rgba(255,255,255,0.18)", fontSize: 10, margin: 0}}>
                    {timeAgo(n.created_at) || n.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          onGoTo();
        }}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.03)",
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          color: "rgba(255,255,255,0.45)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textAlign: "center",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>
        View all notifications →
      </button>
    </motion.div>
  );
}

export default function TopBar({
  title,
  brand,
  onNav,
  onLogout,
  activeNav,
  notifications = [],
  onMarkAllRead,
  onGoToNotifications,
  onGoToNotification,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileHover, setProfileHover] = useState(false);

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const unread = notifications.filter((n) => !(n.is_read ?? n.read)).length;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const brandName = brand?.name || brand?.brand_name || "Your Brand";
  const brandInitial = brandName[0]?.toUpperCase() || "B";
  const avatarUrl = brand?.avatar_url || "";
  const userInitials =
    ((brand?.first_name?.[0] || "") + (brand?.last_name?.[0] || "")).toUpperCase() || brandInitial;

  const brandNav = NAV_ITEMS.filter((i) =>
    ["overview", "products", "orders", "shipping", "local_shipping", "analytics", "bank_account"].includes(i.id),
  );
  const buyerNav = NAV_ITEMS.filter((i) =>
    ["shop", "wishlist", "addresses", "notifications", "settings"].includes(i.id),
  );

  const handleNotifClick = () => {
    setNotifOpen(false);
    onGoToNotifications?.();
  };

  const handleNotifItemClick = (n) => {
    setNotifOpen(false);
    onGoToNotification?.(n);
  };

  const NavButton = ({item, onClick}) => {
    const isActive = activeNav === item.id;
    return (
      <button
        onClick={onClick}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 14px",
          borderRadius: 9,
          border: "none",
          cursor: "pointer",
          marginBottom: 2,
          transition: "all 0.15s",
          textAlign: "left",
          background: isActive ? "rgba(239,68,68,0.1)" : "transparent",
          color: isActive ? "#ef4444" : "rgba(255,255,255,0.55)",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#fff";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }
        }}>
        <span style={{flexShrink: 0}}>{ICONS[item.id]}</span>
        <span style={{fontSize: 13, fontWeight: 600, flex: 1, letterSpacing: "0.02em"}}>
          {item.label}
        </span>
        {item.id === "notifications" && unread > 0 && (
          <span
            style={{
              background: "#ef4444",
              color: "#fff",
              fontSize: 9,
              fontWeight: 900,
              minWidth: 16,
              height: 16,
              borderRadius: 99,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              flexShrink: 0,
            }}>
            {unread}
          </span>
        )}
        {isActive && item.id !== "notifications" && (
          <div
            style={{width: 4, height: 4, borderRadius: "50%", background: "#ef4444", flexShrink: 0}}
          />
        )}
      </button>
    );
  };

  const BellButtonIcon = () => (
    <button
      onClick={() => {
        setNotifOpen((o) => !o);
        setMenuOpen(false);
      }}
      style={{
        position: "relative",
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: notifOpen ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${notifOpen ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.18s",
      }}
      onMouseEnter={(e) => {
        if (!notifOpen) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        if (!notifOpen) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      }}>
      <svg
        width="16"
        height="16"
        fill="none"
        stroke={notifOpen ? "#ef4444" : "rgba(255,255,255,0.6)"}
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unread > 0 && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#ef4444",
            fontSize: 9,
            fontWeight: 900,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #070707",
          }}>
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );

  return (
    <>
      <style>{`
        .btb-desktop { display: flex; }
        .btb-mobile  { display: none; }
        @media (max-width: 768px) {
          .btb-desktop { display: none !important; }
          .btb-mobile  { display: flex !important; }
        }
      `}</style>

      {/* ── DESKTOP ───────────────────────────────── */}
      <div
        className="btb-desktop"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.28)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}>
            {dateStr}
          </p>
          <h1
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(1.5rem,2.4vw,2rem)",
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              margin: 0,
            }}>
            {title}
          </h1>
        </div>

        <div style={{display: "flex", alignItems: "center", gap: 12}}>
          <div ref={notifRef} style={{position: "relative"}}>
            <BellButtonIcon />
            <AnimatePresence>
              {notifOpen && (
                <div style={{position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 50}}>
                  <NotifDropdown
                    notifications={notifications}
                    unread={unread}
                    onMarkAllRead={() => {
                      onMarkAllRead?.();
                    }}
                    onGoTo={handleNotifClick}
                    onGoToNotif={handleNotifItemClick}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile + brand chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "6px 14px 6px 6px",
            }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                background: "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.5)",
                border: "2px solid rgba(255,255,255,0.1)",
              }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="profile"
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />
              ) : (
                userInitials
              )}
            </div>
            {brand?.logo_url && (
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6rem",
                  color: "#fff",
                  marginLeft: -14,
                  marginTop: 14,
                  border: "2px solid #0a0a0a",
                  position: "relative",
                  zIndex: 1,
                }}>
                <img
                  src={brand.logo_url}
                  alt={brandName}
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />
              </div>
            )}
            <div style={{minWidth: 0}}>
              <p
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  margin: 0,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 140,
                }}>
                {brand?.first_name
                  ? `${brand.first_name} ${brand.last_name || ""}`.trim()
                  : brandName}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 140,
                }}>
                {brandName}
              </p>
            </div>
          </div>
        </div>
      </div>

{/* ── MOBILE ────────────────────────────────── */}
<div
  className="btb-mobile"
  style={{
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    zIndex: 40,
  }}>
  {/* ✅ Increased logo size */}
  <Link to="/" style={{ textDecoration: "none", flexShrink: 0 }}>
    <img 
      src={logo} 
      alt="BLVCKMRKT" 
      style={{
        height: 80,  // ✅ Increased from 28 to 36
        width: "auto",
        display: "block",
      }}
    />
  </Link>

  <div style={{display: "flex", alignItems: "center", gap: 8, flexShrink: 0}}>
          <div ref={notifRef} style={{position: "relative"}}>
            <BellButtonIcon />
            <AnimatePresence>
              {notifOpen && (
                <div style={{position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 50}}>
                  <NotifDropdown
                    notifications={notifications}
                    unread={unread}
                    onMarkAllRead={() => {
                      onMarkAllRead?.();
                    }}
                    onGoTo={handleNotifClick}
                    onGoToNotif={handleNotifItemClick}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Burger */}
          <div ref={menuRef} style={{position: "relative"}}>
            <button
              onClick={() => {
                setMenuOpen((o) => !o);
                setNotifOpen(false);
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: menuOpen ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${menuOpen ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.18s",
                flexDirection: "column",
                gap: 4,
              }}>
              <span
                style={{
                  display: "block",
                  width: 14,
                  height: 1.5,
                  borderRadius: 2,
                  transition: "all 0.22s",
                  transformOrigin: "center",
                  background: menuOpen ? "#ef4444" : "rgba(255,255,255,0.7)",
                  transform: menuOpen ? "rotate(45deg) translate(0px,3px)" : "none",
                }}
              />
              <span
                style={{
                  display: "block",
                  width: 14,
                  height: 1.5,
                  borderRadius: 2,
                  transition: "all 0.22s",
                  background: "rgba(255,255,255,0.7)",
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: "block",
                  width: 14,
                  height: 1.5,
                  borderRadius: 2,
                  transition: "all 0.22s",
                  transformOrigin: "center",
                  background: menuOpen ? "#ef4444" : "rgba(255,255,255,0.7)",
                  transform: menuOpen ? "rotate(-45deg) translate(0px,-3px)" : "none",
                }}
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{opacity: 0, y: -8, scale: 0.97}}
                  animate={{opacity: 1, y: 0, scale: 1}}
                  exit={{opacity: 0, y: -8, scale: 0.97}}
                  transition={{duration: 0.18}}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: "min(300px, calc(100vw - 32px))",
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                    overflow: "hidden",
                    zIndex: 50,
                    maxHeight: "80vh",
                    overflowY: "auto",
                  }}>
                  <div style={{padding: "8px 8px 4px"}}>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        padding: "4px 14px 6px",
                      }}>
                      Brand Tools
                    </p>
                    {brandNav.map((item) => (
                      <NavButton
                        key={item.id}
                        item={item}
                        onClick={() => {
                          setMenuOpen(false);
                          onNav(item.id);
                        }}
                      />
                    ))}
                  </div>

                  <div style={{height: 1, background: "rgba(255,255,255,0.06)", margin: "0 8px"}} />

                  <div style={{padding: "4px 8px 0"}}>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        padding: "6px 14px 6px",
                      }}>
                      Shop & Account
                    </p>
                    {buyerNav.map((item) => (
                      <NavButton
                        key={item.id}
                        item={item}
                        onClick={() => {
                          setMenuOpen(false);
                          onNav(item.id);
                        }}
                      />
                    ))}
                  </div>

                  <div
                    style={{
                      padding: "6px 8px 8px",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      marginTop: 4,
                    }}>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 14px",
                        borderRadius: 9,
                        border: "none",
                        cursor: "pointer",
                        background: "transparent",
                        color: "rgba(239,68,68,0.6)",
                        fontSize: 13,
                        fontWeight: 600,
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                        e.currentTarget.style.background = "rgba(239,68,68,0.07)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(239,68,68,0.6)";
                        e.currentTarget.style.background = "transparent";
                      }}>
                      <svg
                        width="15"
                        height="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>

                  <div
                    style={{
                      padding: "12px 16px",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                    }}>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        margin: "0 0 3px",
                      }}>
                      {dateStr}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Bebas Neue',sans-serif",
                        fontSize: "1.1rem",
                        color: "rgba(255,255,255,0.5)",
                        letterSpacing: "0.06em",
                        margin: 0,
                      }}>
                      {title}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile avatar (mobile) */}
          <div
            style={{position: "relative"}}
            onMouseEnter={() => setProfileHover(true)}
            onMouseLeave={() => setProfileHover(false)}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                overflow: "hidden",
                border: `2px solid ${profileHover ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: "rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "border-color 0.18s",
                flexShrink: 0,
                position: "relative",
              }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="profile"
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />
              ) : (
                userInitials
              )}
              {brand?.logo_url && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -3,
                    right: -3,
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    overflow: "hidden",
                    border: "2px solid #070707",
                    background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
                  }}>
                  <img
                    src={brand.logo_url}
                    alt=""
                    style={{width: "100%", height: "100%", objectFit: "cover"}}
                  />
                </div>
              )}
            </div>
            <AnimatePresence>
              {profileHover && (
                <motion.div
                  initial={{opacity: 0, y: 4, scale: 0.96}}
                  animate={{opacity: 1, y: 0, scale: 1}}
                  exit={{opacity: 0, y: 4, scale: 0.96}}
                  transition={{duration: 0.14}}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
                    whiteSpace: "nowrap",
                    zIndex: 60,
                    pointerEvents: "none",
                  }}>
                  <div
                    style={{
                      position: "absolute",
                      top: -5,
                      right: 13,
                      width: 8,
                      height: 8,
                      background: "#111",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderBottom: "none",
                      borderRight: "none",
                      transform: "rotate(45deg)",
                    }}
                  />
                  <p
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      margin: "0 0 2px",
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                    {brand?.first_name
                      ? `${brand.first_name} ${brand.last_name || ""}`.trim()
                      : brandName}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 11,
                      margin: 0,
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                    {brandName}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}