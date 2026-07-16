import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";

// ── Nav structure ─────────────────────────────────────────────────────────────
export const ADMIN_NAV = [
  {
    group: "Command",
    items: [
      {id: "overview", label: "Overview", icon: "grid"},
      {id: "activity", label: "Activity Feed", icon: "activity"},
      {id: "analytics", label: "Analytics", icon: "analytics"},
    ],
  },
  {
    group: "People",
    items: [
      {id: "users", label: "Users", icon: "users"},
      {id: "brands", label: "Brands", icon: "tag"},
      {id: "subscriptions", label: "Subscribers", icon: "mail"},
    ],
  },
{
  group: "Commerce",
  items: [
    {id: "products", label: "Products", icon: "box"},
    {id: "orders", label: "Orders", icon: "clipboard"},
    {id: "bankAccounts", label: "Bank Accounts", icon: "credit-card"}, // ← NEW
    {id: "drops", label: "Drops", icon: "zap"},
    {id: "categories", label: "Categories", icon: "layers"},
    {id: "reviews", label: "Reviews", icon: "star"},
  ],
},
  {
    group: "Delivery",
    items: [
      {id: "shipping", label: "Shipping", icon: "globe"},
      {id: "localShipping", label: "Local Shipping", icon: "map-pin"},
    ],
  },
  {
    group: "Site",
    items: [
      {id: "blog", label: "Blog", icon: "edit"},
      {id: "pages", label: "Site Pages", icon: "globe"},
      {id: "notifications", label: "Notifications", icon: "bell"},
      {id: "addresses", label: "Addresses", icon: "map-pin"},
    ],
  },
  {
    group: "System",
    items: [
      {id: "privileges", label: "Privileges", icon: "key"},
      {id: "auditlog", label: "Audit Log", icon: "shield"},
      {id: "settings", label: "Settings", icon: "settings"},
    ],
  },
];

function Icon({name, size = 16, color = "currentColor"}) {
  const s = {
    width: size,
    height: size,
    fill: "none",
    stroke: color,
    strokeWidth: "1.8",
    viewBox: "0 0 24 24",
  };
  const icons = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    activity: (
      <>
        <polyline
          points="22 12 18 12 15 21 9 3 6 12 2 12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    analytics: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
    users: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        />
        <circle cx="9" cy="7" r="4" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        />
      </>
    ),
    tag: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </>
    ),
    mail: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        />
        <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    box: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        />
        <polyline
          points="3.27 6.96 12 12.01 20.73 6.96"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" />
      </>
    ),
    "credit-card": (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </>
    ),
    clipboard: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </>
    ),
    edit: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
         />
      </>
    ),
    zap: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </>
    ),
    layers: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="2 17 12 22 22 17" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="2 12 12 17 22 12" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    star: (
      <>
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path
          strokeLinecap="round"
          d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
        />
      </>
    ),
    bell: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        />
      </>
    ),
    logout: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        />
      </>
    ),
    shield: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        />
      </>
    ),
    menu: (
      <>
        <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
        <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
        <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
      </>
    ),
    x: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
      </>
    ),
    "map-pin": (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    key: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
        />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        />
      </>
    ),
  };
  return <svg {...s}>{icons[name]}</svg>;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function AdminSidebar({active, onNav, onLogout, admin, onClose}) {
  return (
    <div
      style={{
        width: 230,
        height: "100vh",
        background: "#0a0a0a",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
      }}>
      {/* Logo + optional close button */}
      <div style={{padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
            <Icon name="shield" size={15} color="#fff" />
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <p
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: 900,
                margin: 0,
                letterSpacing: "0.05em",
              }}>
              BLVCKMRKT
            </p>
            <p
              style={{
                color: "#ef4444",
                fontSize: 9,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}>
              Admin Console
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close sidebar"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
              <Icon name="x" size={13} color="rgba(255,255,255,0.6)" />
            </button>
          )}
        </div>
      </div>

      {/* Nav groups */}
      <div style={{flex: 1, padding: "12px 10px", overflowY: "auto"}}>
        {ADMIN_NAV.map((group) => (
          <div key={group.group} style={{marginBottom: 18}}>
            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                padding: "0 10px",
                marginBottom: 4,
              }}>
              {group.group}
            </p>
            {group.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    marginBottom: 2,
                    transition: "all 0.15s",
                    background: isActive ? "rgba(239,68,68,0.12)" : "transparent",
                    color: isActive ? "#ef4444" : "rgba(255,255,255,0.45)",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                    }
                  }}>
                  <Icon name={item.icon} size={15} color="currentColor" />
                  <span style={{fontSize: 12, fontWeight: 600, letterSpacing: "0.02em"}}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "#ef4444",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Admin profile */}
      <div style={{padding: "12px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 10}}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              flexShrink: 0,
              background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 900,
              color: "#fff",
              fontFamily: "'Bebas Neue',sans-serif",
            }}>
            {admin?.first_name?.[0] || "A"}
          </div>
          <div style={{minWidth: 0}}>
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
              {admin?.first_name ? `${admin.first_name} ${admin.last_name || ""}`.trim() : "Admin"}
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
              {admin?.email || "admin@blvckmrkt.com"}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "rgba(239,68,68,0.5)",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(239,68,68,0.5)";
          }}>
          <Icon name="logout" size={13} color="currentColor" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
export function AdminTopBar({title, subtitle, onMenuToggle}) {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 28,
        padding: "14px clamp(16px,3vw,28px)",
        margin: "0 calc(-1 * clamp(16px,3vw,28px)) 28px",
        background: "rgba(8,8,8,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}>
      <div style={{display: "flex", alignItems: "center", gap: 12}}>
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              padding: 4,
              display: "flex",
            }}>
            <Icon name="menu" size={20} color="currentColor" />
          </button>
        )}
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              margin: "0 0 2px",
            }}>
            {dateStr}
          </p>
          <h1
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(1.4rem,2.4vw,1.9rem)",
              color: "#fff",
              letterSpacing: "0.04em",
              lineHeight: 1,
              margin: 0,
            }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "3px 0 0"}}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 99,
          padding: "5px 12px 5px 8px",
        }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#ef4444",
            animation: "pulse 2s infinite",
          }}
        />
        <span
          style={{
            color: "#ef4444",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
          Admin
        </span>
      </div>
    </div>
  );
}

// ── Reusable Table ─────────────────────────────────────────────────────────────
export function AdminTable({
  columns,
  rows,
  onRowClick,
  emptyMsg = "No records found.",
  loading = false,
}) {
  return (
    <div style={{overflowX: "auto"}}>
      <table style={{width: "100%", borderCollapse: "collapse", fontSize: 12}}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  whiteSpace: "nowrap",
                }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}>
                    <div
                      style={{
                        height: 10,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 4,
                        width: "70%",
                        animation: "pulse 1.4s infinite",
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: "40px 14px",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 12,
                }}>
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: "12px 14px",
                      color: "rgba(255,255,255,0.7)",
                      verticalAlign: "middle",
                    }}>
                    {col.render ? col.render(row) : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
export function Badge({label, color = "#ef4444", bg}) {
  return (
    <span
      style={{
        background: bg || `${color}18`,
        color,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: "3px 9px",
        borderRadius: 99,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}>
      {label}
    </span>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
      <motion.div
        initial={{opacity: 0, scale: 0.94, y: 16}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.94, y: 16}}
        transition={{type: "spring", stiffness: 300, damping: 26}}
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#111",
          border: `1px solid ${danger ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 30px 60px rgba(0,0,0,0.8)",
        }}>
        <div
          style={{
            height: 3,
            background: danger
              ? "linear-gradient(90deg,#ef4444,transparent)"
              : "linear-gradient(90deg,#22c55e,transparent)",
          }}
        />
        <div style={{padding: "22px 24px"}}>
          <h3 style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: "0 0 8px"}}>{title}</h3>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              lineHeight: 1.6,
              margin: "0 0 20px",
            }}>
            {message}
          </p>
          <div style={{display: "flex", gap: 10}}>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                background: danger ? "#ef4444" : "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "11px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
              {confirmLabel}
            </button>
            <button
              onClick={onCancel}
              style={{
                padding: "11px 20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Search + Filter bar ───────────────────────────────────────────────────────
export function SearchBar({value, onChange, placeholder = "Search...", actions}) {
  return (
    <div
      style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap"}}>
      <div style={{position: "relative", flex: 1, minWidth: 200}}>
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}>
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            fontSize: 13,
            padding: "10px 14px 10px 36px",
            borderRadius: 9,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>
      {actions}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({label, value, sub, color = "#ef4444", icon}) {
  return (
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
          }}>
          {label}
        </p>
        {icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            {icon}
          </div>
        )}
      </div>
      <p
        style={{
          color: "#fff",
          fontSize: 26,
          fontWeight: 900,
          margin: "0 0 4px",
          fontFamily: "'Bebas Neue',sans-serif",
          letterSpacing: "0.02em",
        }}>
        {value ?? "—"}
      </p>
      {sub && <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0}}>{sub}</p>}
    </div>
  );
}

export {Icon};
