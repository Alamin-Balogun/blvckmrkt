import {useState, useEffect, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  getNotifications,
  markOneRead,
  markBroadcastRead,
  markAllRead,
  deleteNotif,
} from "./dashboard_components/api";

const TYPE_CONFIG = {
  drop: {
    label: "Drop",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  order: {
    label: "Order",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
  },
  news: {
    label: "News",
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
    icon: (
      <svg width="16" height="16" fill="none" stroke="#a855f7" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  system: {
    label: "System",
    color: "rgba(255,255,255,0.5)",
    bg: "rgba(255,255,255,0.07)",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
};

const TABS = ["All", "Drops", "Orders", "News", "System"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFull(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Skeleton() {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "16px 20px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          flexShrink: 0,
          animation: "pulse 1.4s infinite",
        }}
      />
      <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 6}}>
        <div
          style={{
            height: 10,
            width: "40%",
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
            animation: "pulse 1.4s infinite",
          }}
        />
        <div
          style={{
            height: 13,
            width: "80%",
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
            animation: "pulse 1.4s infinite",
          }}
        />
        <div
          style={{
            height: 11,
            width: "60%",
            background: "rgba(255,255,255,0.07)",
            borderRadius: 4,
            animation: "pulse 1.4s infinite",
          }}
        />
      </div>
    </div>
  );
}

function NotifDetailModal({notif, onClose, onMarkRead, onDelete}) {
  if (!notif) return null;
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.news;
  const read = notif.is_read;
  const isBroadcast = notif.kind === "broadcast";

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(3px)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
      <motion.div
        initial={{opacity: 0, scale: 0.95, y: 16}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.95, y: 16}}
        transition={{type: "spring", stiffness: 300, damping: 28}}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#111",
          border: `1px solid ${read ? "rgba(255,255,255,0.1)" : "rgba(239,68,68,0.2)"}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}>
        <div style={{height: 3, background: `linear-gradient(90deg, ${cfg.color}, transparent)`}} />

        <div
          style={{
            padding: "20px 22px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: cfg.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
            {cfg.icon}
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 5,
                flexWrap: "wrap",
              }}>
              <span
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "3px 9px",
                  borderRadius: 99,
                }}>
                {cfg.label}
              </span>
              {/* Broadcast badge — shows the notification came from admin */}
              {isBroadcast && (
                <span
                  style={{
                    background: "rgba(168,85,247,0.1)",
                    color: "#a855f7",
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 99,
                  }}>
                  Broadcast
                </span>
              )}
              {!read && (
                <span
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    color: "#ef4444",
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    borderRadius: 99,
                  }}>
                  Unread
                </span>
              )}
            </div>
            <h3 style={{color: "#fff", fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.3}}>
              {notif.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{padding: "20px 22px"}}>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "16px 18px",
              marginBottom: 18,
            }}>
            <p
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: "0 0 10px",
              }}>
              Message
            </p>
            <p style={{color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0, lineHeight: 1.7}}>
              {notif.body}
            </p>
          </div>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18}}>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: "12px 14px",
              }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 5px",
                }}>
                Received
              </p>
              <p style={{color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0, lineHeight: 1.5}}>
                {formatFull(notif.created_at)}
              </p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                padding: "12px 14px",
              }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 5px",
                }}>
                Status
              </p>
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: read ? "#22c55e" : "#ef4444",
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    color: read ? "#22c55e" : "#ef4444",
                    fontSize: 11,
                    fontWeight: 700,
                    margin: 0,
                  }}>
                  {read ? "Read" : "Unread"}
                </p>
              </div>
            </div>
          </div>

          <div style={{display: "flex", gap: 10}}>
            {!read && (
              <button
                onClick={() => {
                  onMarkRead(notif);
                  onClose();
                }}
                style={{
                  flex: 1,
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  color: "#22c55e",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "11px 16px",
                  borderRadius: 9,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}>
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Mark as Read
              </button>
            )}
            {/* Only personal notifications can be deleted — broadcasts are shared */}
            {!isBroadcast && (
              <button
                onClick={() => {
                  onDelete(notif.id);
                  onClose();
                }}
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "rgba(239,68,68,0.7)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "11px 16px",
                  borderRadius: 9,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "11px 16px",
                borderRadius: 9,
                cursor: "pointer",
              }}>
              Close
            </button>
          </div>
        </div>

        <div style={{padding: "10px 22px 16px", borderTop: "1px solid rgba(255,255,255,0.05)"}}>
          <p
            style={{color: "rgba(255,255,255,0.15)", fontSize: 10, margin: 0, textAlign: "center"}}>
            Press{" "}
            <kbd
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "1px 5px",
                fontSize: 9,
              }}>
              Esc
            </kbd>{" "}
            to close
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Notifications({
  autoOpenId = null,
  onNotificationsUpdate,
  notifications: propNotifs,
}) {
  const [notifs, setNotifs] = useState(propNotifs ?? []);
  const [loading, setLoading] = useState(!propNotifs);
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("All");
  const lastAutoOpenId = useRef(null);

  useEffect(() => {
    if (propNotifs !== undefined) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getNotifications()
      .then((data) => setNotifs(data?.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (propNotifs === undefined) return;
    setNotifs(propNotifs);
    setLoading(false);
    setSelected((prev) => {
      if (!prev) return prev;
      return propNotifs.find((n) => n.id === prev.id) ?? prev;
    });
  }, [propNotifs]);

  useEffect(() => {
    if (!autoOpenId) {
      if (lastAutoOpenId.current !== null) {
        lastAutoOpenId.current = null;
        setSelected(null);
      }
      return;
    }
    if (loading || notifs.length === 0) return;
    if (autoOpenId !== lastAutoOpenId.current) {
      lastAutoOpenId.current = autoOpenId;
      const target = notifs.find((n) => n.id === autoOpenId);
      if (target) setSelected(target);
    }
  }, [autoOpenId, loading, notifs]);

  const commit = (updated) => {
    setNotifs(updated);
    onNotificationsUpdate?.(updated);
  };

  // ── KEY FIX: route mark-read to the correct endpoint based on kind ────────
  const handleMarkOne = async (notif) => {
    const updated = notifs.map((n) => (n.id === notif.id ? {...n, is_read: true} : n));
    commit(updated);
    try {
      if (notif.kind === "broadcast") {
        await markBroadcastRead(notif.id);
      } else {
        await markOneRead(notif.id);
      }
    } catch (e) {
      console.error("mark read failed:", e);
      commit(notifs); // rollback
    }
  };

  const handleMarkAll = async () => {
    const updated = notifs.map((n) => ({...n, is_read: true}));
    commit(updated);
    try {
      await markAllRead(); // backend handles both personal + broadcast in one call
    } catch (e) {
      console.error("markAllRead failed:", e);
      commit(notifs);
    }
  };

  // Only personal notifications can be deleted
  const handleDelete = async (id) => {
    const notif = notifs.find((n) => n.id === id);
    if (notif?.kind === "broadcast") return; // broadcasts cannot be deleted per-user
    setDeleting(id);
    try {
      await deleteNotif(id);
      commit(notifs.filter((n) => n.id !== id));
    } catch (e) {
      console.error("deleteNotif failed:", e);
    } finally {
      setDeleting(null);
    }
  };

  const byType = (t) => {
    if (t === "All") return notifs;
    const map = {Drops: "drop", Orders: "order", News: "news", System: "system"};
    return notifs.filter((n) => n.type === map[t]);
  };

  const filtered = byType(tab);
  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <AnimatePresence>
        {selected && (
          <NotifDetailModal
            notif={selected}
            onClose={() => setSelected(null)}
            onMarkRead={(notif) => {
              handleMarkOne(notif);
              setSelected((prev) => (prev ? {...prev, is_read: true} : prev));
            }}
            onDelete={(id) => {
              handleDelete(id);
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
        }}>
        <div>
          <h2
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(1.6rem,3vw,2.2rem)",
              color: "#fff",
              letterSpacing: "0.04em",
              margin: "0 0 4px",
            }}>
            NOTIFICATIONS
          </h2>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
            {loading ? (
              "Loading..."
            ) : (
              <>
                {unread > 0 && (
                  <>
                    <span style={{color: "#ef4444", fontWeight: 700}}>{unread} unread</span> ·{" "}
                  </>
                )}
                {notifs.length} total ·{" "}
                <span style={{color: "rgba(255,255,255,0.2)"}}>
                  Double-click any message for full details
                </span>
              </>
            )}
          </p>
        </div>
        {unread > 0 && !loading && (
          <button
            onClick={handleMarkAll}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "9px 18px",
              borderRadius: 9,
              cursor: "pointer",
              flexShrink: 0,
            }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap"}}>
        {TABS.map((t) => {
          const count = byType(t).length;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                border: `1px solid ${active ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: active ? "rgba(239,68,68,0.1)" : "transparent",
                color: active ? "#ef4444" : "rgba(255,255,255,0.45)",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
              {t}
              <span
                style={{
                  background: active ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                  color: active ? "#ef4444" : "rgba(255,255,255,0.3)",
                  fontSize: 9,
                  fontWeight: 900,
                  padding: "1px 6px",
                  borderRadius: 99,
                }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "#0d0d0d",
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: "60px 24px",
            textAlign: "center",
          }}>
          <p style={{color: "rgba(255,255,255,0.25)", fontSize: 13}}>
            No {tab.toLowerCase()} notifications.
          </p>
        </div>
      ) : (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          <AnimatePresence>
            {filtered.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.news;
              const read = n.is_read;
              const isBroadcast = n.kind === "broadcast";
              return (
                <motion.div
                  key={n.id}
                  initial={{opacity: 0, y: 8}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, x: -20}}
                  onDoubleClick={() => setSelected(n)}
                  style={{
                    background: read ? "#0d0d0d" : "rgba(239,68,68,0.04)",
                    border: `1px solid ${read ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.15)"}`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    cursor: "default",
                    position: "relative",
                  }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: cfg.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                    {cfg.icon}
                  </div>

                  <div style={{flex: 1, minWidth: 0}}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 5,
                        flexWrap: "wrap",
                      }}>
                      <span
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          fontSize: 9,
                          fontWeight: 900,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}>
                        {cfg.label}
                      </span>
                      {/* Broadcast pill so user knows this came from admin */}
                      {isBroadcast && (
                        <span
                          style={{
                            background: "rgba(168,85,247,0.08)",
                            color: "#a855f7",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            padding: "2px 7px",
                            borderRadius: 99,
                          }}>
                          Broadcast
                        </span>
                      )}
                      <span style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                        {timeAgo(n.created_at)}
                      </span>
                      {!read && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#ef4444",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        color: read ? "rgba(255,255,255,0.7)" : "#fff",
                        fontSize: 13,
                        fontWeight: 700,
                        margin: "0 0 5px",
                      }}>
                      {n.title}
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 12,
                        margin: 0,
                        lineHeight: 1.6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}>
                      {n.body}
                    </p>
                    <p style={{color: "rgba(255,255,255,0.13)", fontSize: 9, margin: "6px 0 0"}}>
                      Double-click to view full message
                    </p>
                  </div>

                  <div style={{display: "flex", flexDirection: "column", gap: 6, flexShrink: 0}}>
                    {!read && (
                      <button
                        onClick={() => handleMarkOne(n)}
                        style={{
                          background: "none",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.35)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "6px 10px",
                          borderRadius: 7,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}>
                        Mark read
                      </button>
                    )}
                    {/* Delete only available for personal notifications */}
                    {!isBroadcast && (
                      <button
                        onClick={() => handleDelete(n.id)}
                        disabled={deleting === n.id}
                        style={{
                          background: "none",
                          border: "1px solid rgba(239,68,68,0.15)",
                          color: "rgba(239,68,68,0.4)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "6px 10px",
                          borderRadius: 7,
                          cursor: deleting === n.id ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                        }}>
                        {deleting === n.id ? "..." : "Delete"}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
