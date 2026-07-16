import {useState, useEffect} from "react";
import {motion} from "framer-motion";
import {getAdminStats, getActivityFeed, getAnalyticsWeekly} from "./dashboard_components/api";
import {StatCard, Icon} from "./Components";

const MOCK_STATS = {
  total_users: 0,
  total_brands: 0,
  total_orders: 0,
  total_revenue: 0,
  active_drops: 0,
  pending_reviews: 0,
  new_users_today: 0,
  orders_today: 0,
};

const EMPTY_WEEK = [
  {label: "Mon", orders: 0, revenue: 0},
  {label: "Tue", orders: 0, revenue: 0},
  {label: "Wed", orders: 0, revenue: 0},
  {label: "Thu", orders: 0, revenue: 0},
  {label: "Fri", orders: 0, revenue: 0},
  {label: "Sat", orders: 0, revenue: 0},
  {label: "Sun", orders: 0, revenue: 0},
];

// ── activity type colours ─────────────────────────────────────────────────────
const TYPE_COLOR = {
  user: "#3b82f6",
  order: "#22c55e",
  brand: "#f59e0b",
  review: "#a855f7",
  drop: "#ef4444",
};

function MiniBarChart({data, valueKey, color = "#ef4444", formatTip}) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div style={{display: "flex", alignItems: "flex-end", gap: 6, height: 64}}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            height: "100%",
            justifyContent: "flex-end",
          }}
          title={formatTip?.(d[valueKey])}>
          <motion.div
            initial={{height: 0}}
            animate={{height: `${(d[valueKey] / max) * 80}%`}}
            transition={{delay: i * 0.05, duration: 0.4, ease: "easeOut"}}
            style={{
              width: "100%",
              background: color,
              borderRadius: "3px 3px 0 0",
              minHeight: 3,
              opacity: 0.8,
            }}
          />
          <span style={{color: "rgba(255,255,255,0.2)", fontSize: 8}}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityDot({type}) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: TYPE_COLOR[type] || "#fff",
        flexShrink: 0,
        marginTop: 4,
        boxShadow: `0 0 6px ${TYPE_COLOR[type] || "#fff"}60`,
      }}
    />
  );
}

function ActivityItem({item, i}) {
  return (
    <motion.div
      initial={{opacity: 0, x: -10}}
      animate={{opacity: 1, x: 0}}
      transition={{delay: i * 0.04}}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
      <ActivityDot type={item.type} />
      <div style={{flex: 1, minWidth: 0}}>
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            margin: "0 0 2px",
            lineHeight: 1.4,
          }}>
          {item.message}
        </p>
        <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>{item.time}</p>
      </div>
      <span
        style={{
          background: `${TYPE_COLOR[item.type] || "#fff"}15`,
          color: TYPE_COLOR[item.type] || "#fff",
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "2px 7px",
          borderRadius: 99,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
        {item.type}
      </span>
    </motion.div>
  );
}

export default function AdminOverview({onNav}) {
  const [stats, setStats] = useState(MOCK_STATS);
  const [activity, setActivity] = useState([]);
  const [weekData, setWeekData] = useState(EMPTY_WEEK);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive breakpoint for the charts row
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    Promise.all([
      getAdminStats().catch(() => MOCK_STATS),
      getActivityFeed().catch(() => ({activity: []})),
      getAnalyticsWeekly(0).catch(() => null),
    ]).then(([s, a, w]) => {
      setStats({...MOCK_STATS, ...s});
      setActivity(a?.activity || []);
      if (w?.days) setWeekData(w.days);
      setLoading(false);
    });
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: stats.total_users?.toLocaleString(),
      sub: "All accounts",
      color: "#3b82f6",
      icon: <Icon name="users" size={15} color="#3b82f6" />,
      nav: "users",
    },
    {
      label: "Total Brands",
      value: stats.total_brands?.toLocaleString(),
      sub: "Registered brands",
      color: "#f59e0b",
      icon: <Icon name="tag" size={15} color="#f59e0b" />,
      nav: "brands",
    },
    {
      label: "Total Orders",
      value: stats.total_orders?.toLocaleString(),
      sub: "All time",
      color: "#22c55e",
      icon: <Icon name="clipboard" size={15} color="#22c55e" />,
      nav: "orders",
    },
    {
      label: "Revenue",
      value: `₦${(stats.total_revenue || 0).toLocaleString()}`,
      sub: "Gross",
      color: "#ef4444",
      icon: <Icon name="zap" size={15} color="#ef4444" />,
      nav: "orders",
    },
    {
      label: "Active Drops",
      value: stats.active_drops?.toLocaleString(),
      sub: "Live now",
      color: "#a855f7",
      icon: <Icon name="zap" size={15} color="#a855f7" />,
      nav: "drops",
    },
    {
      label: "Pending Reviews",
      value: stats.pending_reviews?.toLocaleString(),
      sub: "Need moderation",
      color: "#f97316",
      icon: <Icon name="star" size={15} color="#f97316" />,
      nav: "reviews",
    },
    {
      label: "New Users Today",
      value: stats.new_users_today?.toLocaleString(),
      sub: "Last 24h",
      color: "#06b6d4",
      icon: <Icon name="users" size={15} color="#06b6d4" />,
      nav: "users",
    },
    {
      label: "Orders Today",
      value: stats.orders_today?.toLocaleString(),
      sub: "Last 24h",
      color: "#84cc16",
      icon: <Icon name="clipboard" size={15} color="#84cc16" />,
      nav: "orders",
    },
  ];

  const cardStyle = {
    background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: "18px 20px",
  };

  const sectionLabel = {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    margin: "0 0 16px",
  };

  return (
    <div>
      {/* Stat grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: 12,
          marginBottom: 24,
        }}>
        {statCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: i * 0.05}}
            onClick={() => onNav?.(c.nav)}
            style={{cursor: "pointer"}}>
            <StatCard {...c} />
          </motion.div>
        ))}
      </div>

      {/* ── Charts row — stacks on mobile ── */}
      <div
        style={{
          display: "grid",
          // On small screens: 1 column. On larger: 2 columns side by side.
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 14,
          marginBottom: 24,
        }}>
        <div style={cardStyle}>
          <p style={sectionLabel}>Orders — This Week</p>
          <MiniBarChart
            data={weekData}
            valueKey="orders"
            color="#ef4444"
            formatTip={(v) => `${v} orders`}
          />
        </div>
        <div style={cardStyle}>
          <p style={sectionLabel}>Revenue (₦) — This Week</p>
          <MiniBarChart
            data={weekData}
            valueKey="revenue"
            color="#22c55e"
            formatTip={(v) => `₦${v.toLocaleString()}`}
          />
        </div>
      </div>

      {/* Quick actions + Recent Activity */}
      <div style={{display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 14}}>
        {/* Quick actions */}
        <div style={cardStyle}>
          <p style={{...sectionLabel, margin: "0 0 14px"}}>Quick Actions</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
              gap: 8,
            }}>
            {[
              {label: "Manage Users", nav: "users", color: "#3b82f6"},
              {label: "View Orders", nav: "orders", color: "#22c55e"},
              {label: "Manage Drops", nav: "drops", color: "#ef4444"},
              {label: "Approve Brands", nav: "brands", color: "#f59e0b"},
              {label: "Moderate Reviews", nav: "reviews", color: "#a855f7"},
              {label: "Send Notification", nav: "notifications", color: "#f97316"},
              {label: "Manage Products", nav: "products", color: "#06b6d4"},
              {label: "Analytics", nav: "analytics", color: "#84cc16"},
            ].map((a) => (
              <button
                key={a.nav}
                onClick={() => onNav?.(a.nav)}
                style={{
                  background: `${a.color}10`,
                  border: `1px solid ${a.color}30`,
                  color: a.color,
                  padding: "10px 12px",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all .15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${a.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${a.color}10`;
                }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity feed */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}>
            <p style={{...sectionLabel, margin: 0}}>Recent Activity</p>
            <div style={{display: "flex", alignItems: "center", gap: 5}}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                Live
              </span>
            </div>
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.18)",
              fontSize: 10,
              margin: "0 0 10px",
              lineHeight: 1.5,
            }}>
            Platform events — new users, orders, brand actions, and flagged reviews appear here in
            real time.
          </p>
          <div style={{maxHeight: 260, overflowY: "auto"}}>
            {activity.length === 0 ? (
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 8}}>
                No recent activity yet.
              </p>
            ) : (
              activity.slice(0, 15).map((item, i) => <ActivityItem key={i} item={item} i={i} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
