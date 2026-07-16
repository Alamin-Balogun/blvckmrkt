import {useState, useEffect, useCallback, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {getActivityFeed} from "../dashboard/dashboard_components/api";
import {Icon} from "./Components";

// ── Entity type config ────────────────────────────────────────────────────────
const ENTITY_CONFIG = {
  user: {color: "#3b82f6", label: "User", icon: "👤"},
  brand: {color: "#f59e0b", label: "Brand", icon: "🏷"},
  order: {color: "#22c55e", label: "Order", icon: "📦"},
  product: {color: "#06b6d4", label: "Product", icon: "🛍"},
  employee: {color: "#a855f7", label: "Employee", icon: "👷"},
  partner: {color: "#f97316", label: "Partner", icon: "🤝"},
  drop: {color: "#ef4444", label: "Drop", icon: "⚡"},
  review: {color: "#84cc16", label: "Review", icon: "⭐"},
};

const DEFAULT_COLOR = "#6b7280";

// ── Action → human readable message ─────────────────────────────────────────
function formatAction(action, entityType, meta) {
  // Try to parse meta for extra context
  let parsed = {};
  try {
    parsed = JSON.parse(meta || "{}");
  } catch (_) {}

  const name = parsed.display_id || parsed.email || parsed.company || parsed.brand_name || null;

  const nameStr = name ? ` · ${name}` : "";

  const MAP = {
    banned_user: `User banned${nameStr}`,
    unbanned_user: `User unbanned${nameStr}`,
    deleted_user: `User account deleted${nameStr}`,
    verified_user: `User account verified${nameStr}`,
    created_employee: `New employee added${nameStr}`,
    updated_employee: `Employee profile updated${nameStr}`,
    deleted_employee: `Employee removed${nameStr}`,
    suspended_employee: `Employee suspended${nameStr}`,
    reinstated_employee: `Employee reinstated${nameStr}`,
    created_partner: `New partner added${nameStr}`,
    updated_partner: `Partner record updated${nameStr}`,
    deleted_partner: `Partner removed${nameStr}`,
    approved_brand: `Brand approved${nameStr}`,
    suspended_brand: `Brand suspended${nameStr}`,
    deleted_brand: `Brand deleted${nameStr}`,
    updated_brand: `Brand profile updated${nameStr}`,
    created_drop: `New drop created${nameStr}`,
    updated_drop: `Drop updated${nameStr}`,
    deleted_drop: `Drop deleted${nameStr}`,
    created_product: `New product added${nameStr}`,
    updated_product: `Product updated${nameStr}`,
    deleted_product: `Product deleted${nameStr}`,
    updated_order: `Order status updated${nameStr}`,
    deleted_order: `Order deleted${nameStr}`,
    deleted_review: `Review removed${nameStr}`,
    flagged_review: `Review flagged${nameStr}`,
    sent_notification: `Notification broadcast sent`,
    updated_settings: `Platform settings updated`,
    updated_page: `Site page updated${nameStr}`,
  };

  // Fall back: humanise raw action string
  return MAP[action] || action.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// ── Relative time ─────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", {day: "numeric", month: "short"});
}

// ── Dot pulse indicator ───────────────────────────────────────────────────────
function Dot({color, pulse = false}) {
  return (
    <div style={{position: "relative", flexShrink: 0, width: 10, height: 10, marginTop: 3}}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}80`,
        }}
      />
      {pulse && (
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            animation: "pingOnce 1.2s ease-out forwards",
          }}
        />
      )}
    </div>
  );
}

// ── Single log row ────────────────────────────────────────────────────────────
function LogRow({log, i, isNew}) {
  const cfg = ENTITY_CONFIG[log.entity_type] || {color: DEFAULT_COLOR, icon: "•"};
  const time = timeAgo(log.created_at);

  return (
    <motion.div
      initial={{opacity: 0, x: -14, background: isNew ? "rgba(239,68,68,0.06)" : "transparent"}}
      animate={{opacity: 1, x: 0, background: "transparent"}}
      transition={{delay: i * 0.025, duration: 0.3}}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "13px 22px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      {/* Dot */}
      <Dot color={cfg.color} pulse={isNew} />

      {/* Content */}
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap"}}>
          <p style={{color: "rgba(255,255,255,0.78)", fontSize: 12.5, margin: 0, lineHeight: 1.45}}>
            {formatAction(log.action, log.entity_type, log.meta)}
          </p>
        </div>
        <div style={{display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap"}}>
          {log.admin_email && (
            <span style={{color: "rgba(255,255,255,0.22)", fontSize: 10}}>
              by{" "}
              <span style={{color: "rgba(255,255,255,0.4)", fontWeight: 600}}>
                {log.admin_email}
              </span>
            </span>
          )}
          {log.ip_address && (
            <span style={{color: "rgba(255,255,255,0.18)", fontSize: 10, fontFamily: "monospace"}}>
              {log.ip_address}
            </span>
          )}
          <span style={{color: "rgba(255,255,255,0.18)", fontSize: 10}}>{time}</span>
        </div>
      </div>

      {/* Entity badge */}
      <span
        style={{
          background: `${cfg.color}12`,
          color: cfg.color,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "3px 9px",
          borderRadius: 99,
          whiteSpace: "nowrap",
          flexShrink: 0,
          border: `1px solid ${cfg.color}25`,
        }}>
        {cfg.icon} {cfg.label}
      </span>
    </motion.div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <>
      {Array.from({length: 8}).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 14,
            padding: "14px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            opacity: 1 - i * 0.1,
          }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              marginTop: 3,
              flexShrink: 0,
              animation: "pulse 1.4s infinite",
            }}
          />
          <div style={{flex: 1}}>
            <div
              style={{
                height: 12,
                width: `${55 + (i % 3) * 15}%`,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 4,
                marginBottom: 8,
                animation: "pulse 1.4s infinite",
              }}
            />
            <div
              style={{
                height: 9,
                width: "30%",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
                animation: "pulse 1.4s infinite",
                animationDelay: "0.15s",
              }}
            />
          </div>
          <div
            style={{
              width: 52,
              height: 20,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 99,
              flexShrink: 0,
              animation: "pulse 1.4s infinite",
            }}
          />
        </div>
      ))}
    </>
  );
}

// ── Filter pill ───────────────────────────────────────────────────────────────
function Pill({label, active, color, onClick}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 13px",
        borderRadius: 99,
        border: `1px solid ${active ? color + "60" : "rgba(255,255,255,0.09)"}`,
        background: active ? color + "14" : "transparent",
        color: active ? color : "rgba(255,255,255,0.38)",
        fontSize: 10,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.15s",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}>
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25;

export default function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [entityFilter, setEntityFilter] = useState("");
  const [newIds, setNewIds] = useState(new Set());
  const [lastFetch, setLastFetch] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef = useRef(null);

  // ── Fetch page 1 (or on filter change) ──────────────────────────────────
  const fetchFresh = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const params = {limit: PAGE_SIZE, page: 1};
        if (entityFilter) params.entity_type = entityFilter;

        const data = await getActivityFeed(params);
        const incoming = data?.activity || data || [];
        const incomingTotal = data?.total ?? incoming.length;

        if (silent && logs.length > 0) {
          // Mark brand-new entries
          const existingIds = new Set(logs.map((l) => l.id));
          const fresh = incoming.filter((l) => !existingIds.has(l.id));
          if (fresh.length > 0) {
            setNewIds(new Set(fresh.map((l) => l.id)));
            setTimeout(() => setNewIds(new Set()), 4000);
          }
        }

        setLogs(incoming);
        setTotal(incomingTotal);
        setPage(1);
        setLastFetch(new Date());
      } catch (e) {
        console.error("Activity fetch error:", e);
      } finally {
        setLoading(false);
      }
    },
    [entityFilter, logs],
  );

  // ── Load more (pagination) ───────────────────────────────────────────────
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = {limit: PAGE_SIZE, page: nextPage};
      if (entityFilter) params.entity_type = entityFilter;

      const data = await getActivityFeed(params);
      const incoming = data?.activity || data || [];

      setLogs((prev) => [...prev, ...incoming]);
      setPage(nextPage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Initial load + filter change ─────────────────────────────────────────
  useEffect(() => {
    fetchFresh();
  }, [entityFilter]);

  // ── Auto-refresh every 30s ───────────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => fetchFresh(true), 30_000);
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, fetchFresh]);

  const hasMore = logs.length < total;

  const entityTypes = [
    "",
    "user",
    "brand",
    "order",
    "product",
    "employee",
    "partner",
    "drop",
    "review",
  ];

  return (
    <div>
      <style>{`
        @keyframes pingOnce {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}>
        {/* Entity filter pills */}
        <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
          {entityTypes.map((e) => {
            const cfg = e ? ENTITY_CONFIG[e] : null;
            return (
              <Pill
                key={e || "all"}
                label={e ? `${cfg?.icon} ${cfg?.label}` : "All"}
                active={entityFilter === e}
                color={cfg?.color || "#ef4444"}
                onClick={() => setEntityFilter(e)}
              />
            );
          })}
        </div>

        {/* Right controls */}
        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: autoRefresh ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${autoRefresh ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: autoRefresh ? "#22c55e" : "rgba(255,255,255,0.35)",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "0.06em",
            }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: autoRefresh ? "#22c55e" : "rgba(255,255,255,0.2)",
                animation: autoRefresh ? "pulse 2s infinite" : "none",
              }}
            />
            {autoRefresh ? "Live" : "Paused"}
          </button>

          {/* Manual refresh */}
          <button
            onClick={() => fetchFresh()}
            disabled={loading}
            style={{
              padding: "6px 13px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Log card ── */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: 0,
              }}>
              Activity Log
            </p>
            {!loading && (
              <span
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 99,
                }}>
                {total.toLocaleString()} events
              </span>
            )}
          </div>
          {lastFetch && (
            <span style={{color: "rgba(255,255,255,0.15)", fontSize: 10}}>
              Updated {timeAgo(lastFetch)}
            </span>
          )}
        </div>

        {/* Rows */}
        {loading ? (
          <Skeleton />
        ) : logs.length === 0 ? (
          <div style={{padding: "60px 22px", textAlign: "center"}}>
            <p style={{color: "rgba(255,255,255,0.12)", fontSize: 13, fontWeight: 600, margin: 0}}>
              No activity recorded yet
            </p>
            <p style={{color: "rgba(255,255,255,0.07)", fontSize: 11, margin: "6px 0 0"}}>
              Actions performed by admins will appear here
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {logs.map((log, i) => (
              <LogRow key={log.id || i} log={log} i={i} isNew={newIds.has(log.id)} />
            ))}
          </AnimatePresence>
        )}

        {/* Load more / footer */}
        {!loading && logs.length > 0 && (
          <div
            style={{
              padding: "14px 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
            <span style={{color: "rgba(255,255,255,0.2)", fontSize: 11}}>
              Showing {logs.length} of {total}
            </span>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  padding: "8px 18px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  opacity: loadingMore ? 0.6 : 1,
                }}>
                {loadingMore ? "Loading…" : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
