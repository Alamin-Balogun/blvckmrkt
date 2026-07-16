import {Link} from "react-router-dom";
import logo from "../../../../../assets/logo.png";  // ✅ Import your logo

const NAV_ITEMS = [
  {
    id: "overview",
    label: "Studio",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  // ... rest of NAV_ITEMS stays the same
  {
    id: "products",
    label: "Products",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "Orders",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: "shipping",
    label: "Shipping",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4l3 3v2h-7z" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    id: "local_shipping",
    label: "Local Shipping",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 3l4 4-4 4" />
        <circle cx="7" cy="17" r="2" />
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "shop",
    label: "Shop",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: "bank_account",
    label: "Bank Account",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function Sidebar({ active, onNav, onLogout, brand, unreadCount = 0 }) {
  const brandName   = brand?.brand_name || brand?.name || "Your Brand";
  const firstName   = brand?.first_name || "";
  const lastName    = brand?.last_name  || "";
  const fullName    = [firstName, lastName].filter(Boolean).join(" ") || brandName;
  const brandEmail  = brand?.email || brand?.brand_email || "";
  const avatarUrl   = brand?.avatar_url || "";
  const logoUrl     = brand?.logo_url   || "";
  const nameInitial = brandName[0]?.toUpperCase() || "B";
  const userInitials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || nameInitial;

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: "#0a0a0a",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
    }}>

{/* ── Logo ── */}
<div style={{ padding: "22px 22px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
  <Link to="/" style={{
    display: "block",
    textDecoration: "none",
  }}>
    {/* ✅ Reduced logo size */}
    <img 
      src={logo} 
      alt="BLVCKMRKT" 
      style={{
        width: "100%",
        maxWidth: 80,  // ✅ Reduced from 140 to 100
        height: "auto",
        display: "block",
      }}
    />
  </Link>
  <p style={{
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    marginTop: 8,
  }}>
    Brand Account
  </p>
</div>

      {/* ── User profile + Brand identity ── */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="profile"
              style={{
                width: 36, height: 36, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.12)",
              }}
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.9rem",
              color: "#fff", flexShrink: 0,
            }}>
              {userInitials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{
              color: "#fff", fontSize: 12, fontWeight: 700, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {fullName}
            </p>
            <p style={{
              color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {brandEmail}
            </p>
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.12)",
          borderRadius: 8, padding: "7px 10px",
        }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="brand logo"
              style={{
                width: 22, height: 22, borderRadius: 4,
                objectFit: "cover", flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          ) : (
            <div style={{
              width: 22, height: 22, borderRadius: 4,
              background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.6rem",
              color: "#fff", flexShrink: 0,
            }}>
              {nameInitial}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{
              color: "rgba(255,255,255,0.25)", fontSize: 8, fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 1px",
            }}>
              Brand
            </p>
            <p style={{
              color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 700, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {brandName}
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, border: "none",
                cursor: "pointer", marginBottom: 2, transition: "all 0.18s",
                textAlign: "left",
                background: isActive ? "rgba(239,68,68,0.1)" : "transparent",
                color: isActive ? "#ef4444" : "rgba(255,255,255,0.45)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                }
              }}>
              {item.icon}
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", flex: 1 }}>
                {item.label}
              </span>
              {item.id === "notifications" && unreadCount > 0 && (
                <span style={{
                  background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 900,
                  minWidth: 16, height: 16, borderRadius: 99,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 4px", flexShrink: 0,
                }}>
                  {unreadCount}
                </span>
              )}
              {isActive && item.id !== "notifications" && (
                <div style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: "#ef4444", flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Sign Out ── */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", color: "rgba(239,68,68,0.6)",
            fontSize: 12, fontWeight: 600, background: "none",
            border: "none", cursor: "pointer", borderRadius: 10, transition: "all 0.18s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "rgba(239,68,68,0.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(239,68,68,0.6)";
            e.currentTarget.style.background = "transparent";
          }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}