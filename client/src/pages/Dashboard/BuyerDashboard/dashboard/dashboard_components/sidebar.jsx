import {Link} from "react-router-dom";
import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {useNavigate} from "react-router-dom";

export const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "My Orders",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
    id: "shop",
    label: "Shop",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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

// ── Confirmation Modal ────────────────────────────────────────────────────────
function UpgradeConfirmModal({ user, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.32, ease: [0.32, 0, 0.12, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 20,
            padding: "36px 32px",
            maxWidth: 440,
            width: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 180, height: 180, borderRadius: "50%",
            background: "rgba(239,68,68,0.08)", filter: "blur(40px)",
            pointerEvents: "none",
          }} />

          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          {/* Heading */}
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: "0.28em", color: "#ef4444",
            textTransform: "uppercase", marginBottom: 8,
          }}>
            // Account Upgrade
          </p>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            color: "#fff", letterSpacing: "0.04em",
            lineHeight: 1.05, marginBottom: 14,
          }}>
            Ready to sell on<br />
            <span style={{ color: "#ef4444" }}>BLVCKMRKT?</span>
          </h2>

          <p style={{
            color: "rgba(255,255,255,0.45)", fontSize: 13,
            lineHeight: 1.75, marginBottom: 20,
          }}>
            Hey <strong style={{ color: "#fff" }}>{user?.first_name}</strong> — you're about to
            switch from a <strong style={{ color: "#fff" }}>Buyer</strong> account to a{" "}
            <strong style={{ color: "#ef4444" }}>Brand</strong> account.
          </p>

          {/* What changes */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "14px 16px", marginBottom: 24,
          }}>
            <p style={{
              fontFamily: "'Space Mono', monospace", fontSize: 8,
              color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em",
              textTransform: "uppercase", marginBottom: 12,
            }}>
              // What changes
            </p>
            {[
              { icon: "✓", color: "#22c55e", text: "You'll get a brand storefront to list & sell" },
              { icon: "✓", color: "#22c55e", text: "Access to brand analytics and order management" },
              { icon: "✓", color: "#22c55e", text: "Your wishlist and order history are preserved" },
              { icon: "→", color: "#eab308", text: "A subscription plan is required to go live" },
              { icon: "→", color: "#eab308", text: "Your buyer profile will be converted to a brand" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "5px 0",
                borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <span style={{
                  color: item.color, fontSize: 10,
                  fontFamily: "'Space Mono', monospace",
                  flexShrink: 0, marginTop: 2,
                }}>
                  {item.icon}
                </span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.5 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1, padding: "13px 16px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10, color: "rgba(255,255,255,0.4)",
                fontSize: 11, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
            >
              Not Yet
            </motion.button>
            <motion.button
              onClick={onConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 2, padding: "13px 16px",
                background: "#ef4444",
                border: "none", borderRadius: 10,
                color: "#fff", fontSize: 11, fontWeight: 900,
                letterSpacing: "0.18em", textTransform: "uppercase",
                cursor: "pointer", transition: "background 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={e => (e.currentTarget.style.background = "#ef4444")}
            >
              Yes, Upgrade My Account →
            </motion.button>
          </div>

          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: 8,
            color: "rgba(255,255,255,0.15)", textAlign: "center",
            marginTop: 14, letterSpacing: "0.1em",
          }}>
            // You can always contact support if you change your mind
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar({ active, onNav, user, onLogout, unreadCount }) {
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgradeConfirm = () => {
    setShowUpgradeModal(false);
    // ✅ Go to brand upgrade form page
    navigate("/upgrade-to-brand");
  };

  return (
    <>
      {/* ── Confirmation Modal ── */}
      {showUpgradeModal && (
        <UpgradeConfirmModal
          user={user}
          onConfirm={handleUpgradeConfirm}
          onCancel={() => setShowUpgradeModal(false)}
        />
      )}

      <aside style={{
        width: 240, flexShrink: 0,
        background: "#0a0a0a",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        height: "100vh", overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 22px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Link to="/" style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem",
            color: "#fff", letterSpacing: "0.1em", textDecoration: "none",
          }}>
            BLVCK<span style={{ color: "#ef4444" }}>MRKT</span>
          </Link>
          <p style={{
            color: "rgba(255,255,255,0.25)", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 4,
          }}>
            Buyer Account
          </p>
        </div>

        {/* Avatar */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" style={{
                width: 38, height: 38, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
                border: "2px solid rgba(239,68,68,0.4)",
              }} />
            ) : (
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem",
                color: "#fff", flexShrink: 0,
              }}>
                {(user?.first_name?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{
                color: "#fff", fontSize: 13, fontWeight: 700, margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.first_name} {user?.last_name}
              </p>
              <p style={{
                color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, border: "none",
                cursor: "pointer", marginBottom: 2, transition: "all 0.18s",
                textAlign: "left",
                background: active === item.id ? "rgba(239,68,68,0.1)" : "transparent",
                color: active === item.id ? "#ef4444" : "rgba(255,255,255,0.45)",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (active !== item.id) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (active !== item.id) {
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
                  width: 16, height: 16, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {unreadCount}
                </span>
              )}
              {active === item.id && item.id !== "notifications" && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </nav>

        {/* ── Upgrade to Brand card ── */}
        <div style={{
          margin: "0 12px 12px", borderRadius: 14, overflow: "hidden",
          position: "relative",
          background: "linear-gradient(135deg,#111 0%,#1a0a0a 100%)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}>
          <div style={{
            position: "absolute", top: -20, right: -20,
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(239,68,68,0.12)", filter: "blur(20px)",
            pointerEvents: "none",
          }} />
          <div style={{ padding: "16px 16px 14px", position: "relative", zIndex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10,
            }}>
              <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p style={{ color: "#fff", fontSize: 12, fontWeight: 800, margin: "0 0 4px", letterSpacing: "0.02em" }}>
              Got a brand?
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, lineHeight: 1.5, margin: "0 0 12px" }}>
              List your products and reach thousands of streetwear buyers.
            </p>
            {/* ✅ Now a button that opens modal instead of a Link */}
            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                background: "#ef4444", color: "#fff", border: "none",
                borderRadius: 8, padding: "9px 12px", fontSize: 10,
                fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase",
                textAlign: "center", transition: "background 0.18s", cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={e => (e.currentTarget.style.background = "#ef4444")}
            >
              Upgrade Account →
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", color: "rgba(239,68,68,0.6)",
              fontSize: 12, fontWeight: 600, background: "none",
              border: "none", cursor: "pointer", borderRadius: 10, transition: "all 0.18s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(239,68,68,0.6)"; e.currentTarget.style.background = "transparent"; }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}