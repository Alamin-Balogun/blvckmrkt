import {useState, useRef, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {NAV_ITEMS} from "./data";

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
  user,
  notifications = [],
  onMarkAllRead,
  onMarkOneRead,
  onGoToNotifications,
  onGoToNotification,
  onNav,
  onLogout,
  activeNav,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileHover, setProfileHover] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const unread = notifications.filter((n) => !(n.is_read ?? n.read)).length;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleGoToAll = () => {
    setNotifOpen(false);
    onGoToNotifications?.();
  };
  const handleNotifItemClick = (n) => {
    setNotifOpen(false);
    onGoToNotification?.(n);
  };
  const handleNavClick = (id) => {
    setMenuOpen(false);
    onNav(id);
  };

  return (
    <>
      <style>{`
        .tb-desktop { display: flex; }
        .tb-mobile  { display: none; }
        @media (max-width: 768px) {
          .tb-desktop { display: none !important; }
          .tb-mobile  { display: flex !important; }
        }
      `}</style>

      {/* ════════════ DESKTOP TopBar (≥769px) ════════════ */}
      {/* marginBottom/paddingBottom/borderBottom removed — sticky wrapper in buyer.jsx owns those */}
      <div className="tb-desktop" style={{alignItems: "center", justifyContent: "space-between"}}>
        {/* Left: date + page title */}
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

        {/* Right: bell + user chip */}
        <div style={{display: "flex", alignItems: "center", gap: 12}}>
          {/* Bell */}
          <div ref={notifRef} style={{position: "relative"}}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
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
            <AnimatePresence>
              {notifOpen && (
                <div style={{position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 50}}>
                  <NotifDropdown
                    notifications={notifications}
                    unread={unread}
                    onMarkAllRead={onMarkAllRead}
                    onGoTo={handleGoToAll}
                    onGoToNotif={handleNotifItemClick}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* User chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "8px 14px 8px 8px",
            }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "0.85rem",
                color: "#fff",
              }}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />
              ) : (
                (user?.first_name?.[0] || "U").toUpperCase()
              )}
            </div>
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
                {user?.first_name} {user?.last_name}
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
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════ MOBILE TopBar (≤768px) ════════════ */}
      <div
        className="tb-mobile"
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 40,
        }}>
        {/* Left: logo */}
        <span
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "1.25rem",
            color: "#fff",
            letterSpacing: "0.08em",
            lineHeight: 1,
            flexShrink: 0,
          }}>
          BLVCK<span style={{color: "#ef4444"}}>MRKT</span>
        </span>

        {/* Right: bell + burger + avatar */}
        <div style={{display: "flex", alignItems: "center", gap: 8, flexShrink: 0}}>
          {/* Bell */}
          <div ref={notifRef} style={{position: "relative"}}>
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
            <AnimatePresence>
              {notifOpen && (
                <div style={{position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 50}}>
                  <NotifDropdown
                    notifications={notifications}
                    unread={unread}
                    onMarkAllRead={onMarkAllRead}
                    onGoTo={handleGoToAll}
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
                    width: "min(280px, calc(100vw - 32px))",
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                    overflow: "hidden",
                    zIndex: 50,
                  }}>
                  <div style={{padding: "8px 8px 0"}}>
                    {NAV_ITEMS.map((item) => {
                      const isActive = activeNav === item.id;
                      const isNotif = item.id === "notifications";
                      const itemUnread = isNotif ? unread : 0;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
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
                          <span style={{flexShrink: 0}}>{item.icon}</span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              flex: 1,
                              letterSpacing: "0.02em",
                            }}>
                            {item.label}
                          </span>
                          {itemUnread > 0 && (
                            <span
                              style={{
                                background: "#ef4444",
                                color: "#fff",
                                fontSize: 9,
                                fontWeight: 900,
                                minWidth: 17,
                                height: 17,
                                borderRadius: 99,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 4px",
                                flexShrink: 0,
                              }}>
                              {itemUnread}
                            </span>
                          )}
                          {isActive && !isNotif && (
                            <div
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: "50%",
                                background: "#ef4444",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
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

          {/* Profile avatar */}
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
                background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "0.9rem",
                color: "#fff",
                cursor: "pointer",
                transition: "border-color 0.18s",
                flexShrink: 0,
              }}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="avatar"
                  style={{width: "100%", height: "100%", objectFit: "cover"}}
                />
              ) : (
                (user?.first_name?.[0] || "U").toUpperCase()
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
                    {user?.first_name} {user?.last_name}
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
                    {user?.email}
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
