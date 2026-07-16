import {useState, useEffect, useCallback} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  getAnalyticsOverview,
  getAnalyticsWeekly,
  getAnalyticsRevenue,
  getAnalyticsUsers,
} from "./dashboard_components/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n, prefix = "") {
  if (n === null || n === undefined) return "—";
  return prefix + Number(n).toLocaleString();
}

function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {day: "numeric", month: "short"});
}

// ── Loading skeleton bar ──────────────────────────────────────────────────────
function SkeletonBars({count = 7}) {
  return (
    <div style={{display: "flex", alignItems: "flex-end", gap: 8, height: 110}}>
      {Array.from({length: count}).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            borderRadius: "4px 4px 0 0",
            height: `${30 + Math.random() * 60}%`,
            background: "rgba(255,255,255,0.05)",
            animation: "pulse 1.5s infinite",
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Empty / error state ───────────────────────────────────────────────────────
function EmptyChart({msg = "No data yet"}) {
  return (
    <div style={{height: 110, display: "flex", alignItems: "center", justifyContent: "center"}}>
      <span
        style={{
          color: "rgba(255,255,255,0.15)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
        {msg}
      </span>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({data, valueKey, labelKey = "day", color, height = 110, prefix = ""}) {
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div style={{display: "flex", alignItems: "flex-end", gap: 8, height}}>
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        const barH = Math.max(val > 0 ? 4 : 2, (val / max) * (height - 24));
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}>
            <span style={{color: "rgba(255,255,255,0.28)", fontSize: 8, whiteSpace: "nowrap"}}>
              {val > 0 ? `${prefix}${Number(val).toLocaleString()}` : ""}
            </span>
            <motion.div
              key={`${valueKey}-${i}-${val}`}
              initial={{height: 0}}
              animate={{height: barH}}
              transition={{delay: i * 0.04, duration: 0.38, ease: "easeOut"}}
              style={{
                width: "100%",
                background: val > 0 ? color : "rgba(255,255,255,0.06)",
                borderRadius: "4px 4px 0 0",
                boxShadow: val > 0 ? `0 0 8px ${color}35` : "none",
              }}
            />
            <span style={{color: "rgba(255,255,255,0.25)", fontSize: 9}}>
              {d[labelKey] || shortDate(d.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Chart summary row ─────────────────────────────────────────────────────────
function ChartSummary({data, valueKey, color, prefix = ""}) {
  const values = data.map((d) => d[valueKey] || 0);
  const total = values.reduce((s, v) => s + v, 0);
  const max = Math.max(...values, 0);
  const avg = data.length ? Math.round(total / data.length) : 0;
  const peakI = values.indexOf(max);
  const peak = data[peakI];
  return (
    <div style={{display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap"}}>
      {[
        ["Total", `${prefix}${Number(total).toLocaleString()}`],
        ["Daily Avg", `${prefix}${Number(avg).toLocaleString()}`],
        [
          "Peak",
          peak
            ? `${peak.day || shortDate(peak.date)} · ${prefix}${Number(max).toLocaleString()}`
            : "—",
        ],
      ].map(([k, v]) => (
        <div key={k}>
          <p
            style={{
              color: "rgba(255,255,255,0.22)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 3px",
            }}>
            {k}
          </p>
          <p style={{color, fontSize: 13, fontWeight: 800, margin: 0}}>{v}</p>
        </div>
      ))}
    </div>
  );
}

// ── Week navigator ────────────────────────────────────────────────────────────
function WeekNav({label, offset, onChange, loading}) {
  return (
    <div style={{display: "flex", alignItems: "center", gap: 8}}>
      {loading && (
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.1)",
            borderTopColor: "#ef4444",
            animation: "spin 0.7s linear infinite",
          }}
        />
      )}
      <button
        onClick={() => onChange(offset - 1)}
        disabled={loading}
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)",
          color: loading ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        ‹
      </button>
      <span
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 10,
          fontWeight: 700,
          minWidth: 100,
          textAlign: "center",
        }}>
        {label || "This Week"}
      </span>
      <button
        onClick={() => onChange(Math.min(offset + 1, 0))}
        disabled={loading || offset >= 0}
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)",
          color: loading || offset >= 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
          cursor: loading || offset >= 0 ? "not-allowed" : "pointer",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        ›
      </button>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({segments, size = 120}) {
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);
  const R = 40;
  const CX = 60;
  const CY = 60;
  const circ = 2 * Math.PI * R;
  let cum = 0;
  return (
    <div style={{display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap"}}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{flexShrink: 0}}>
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={14}
        />
        {total === 0 ? (
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={14}
          />
        ) : (
          segments.map((seg, i) => {
            const pct = (seg.value || 0) / total;
            const dash = pct * circ;
            const gap = circ - dash;
            const offset = circ - cum * circ;
            cum += pct;
            return dash > 0 ? (
              <circle
                key={i}
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={14}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{transform: "rotate(-90deg)", transformOrigin: "50% 50%"}}
              />
            ) : null;
          })
        )}
        <text
          x={CX}
          y={CY + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={11}
          fontWeight={800}>
          {total > 0 ? total.toLocaleString() : "0"}
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={7}>
          TOTAL
        </text>
      </svg>
      <div style={{display: "flex", flexDirection: "column", gap: 8}}>
        {segments.map((seg, i) => (
          <div key={i} style={{display: "flex", alignItems: "center", gap: 8}}>
            <div
              style={{width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0}}
            />
            <span style={{color: "rgba(255,255,255,0.45)", fontSize: 11}}>{seg.label}</span>
            <span
              style={{
                color: seg.color,
                fontSize: 11,
                fontWeight: 700,
                marginLeft: "auto",
                paddingLeft: 16,
              }}>
              {(seg.value || 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Period selector ───────────────────────────────────────────────────────────
function PeriodSelect({value, onChange}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.5)",
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 7,
        padding: "4px 8px",
        cursor: "pointer",
        fontFamily: "inherit",
        outline: "none",
      }}>
      <option value={7}>7 days</option>
      <option value={14}>14 days</option>
      <option value={30}>30 days</option>
      <option value={90}>90 days</option>
    </select>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({title, topRight, children}) {
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
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
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
          {title}
        </p>
        {topRight}
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [users, setUsers] = useState(null);

  const [weekOffset, setWeekOffset] = useState(0);
  const [revPeriod, setRevPeriod] = useState(30);
  const [userPeriod, setUserPeriod] = useState(30);

  const [loadWeek, setLoadWeek] = useState(false);
  const [loadRev, setLoadRev] = useState(false);
  const [loadUser, setLoadUser] = useState(false);

  // Initial overview load
  useEffect(() => {
    getAnalyticsOverview()
      .then(setOverview)
      .catch(() => setOverview({}));
  }, []);

  // Weekly chart — refetch on offset change
  useEffect(() => {
    setLoadWeek(true);
    getAnalyticsWeekly(weekOffset)
      .then(setWeekly)
      .catch(() => setWeekly({days: [], week_label: "This Week"}))
      .finally(() => setLoadWeek(false));
  }, [weekOffset]);

  // Revenue trend — refetch on period change
  useEffect(() => {
    setLoadRev(true);
    getAnalyticsRevenue(revPeriod)
      .then(setRevenue)
      .catch(() => setRevenue({days: []}))
      .finally(() => setLoadRev(false));
  }, [revPeriod]);

  // User signups — refetch on period change
  useEffect(() => {
    setLoadUser(true);
    getAnalyticsUsers(userPeriod)
      .then(setUsers)
      .catch(() => setUsers({days: []}))
      .finally(() => setLoadUser(false));
  }, [userPeriod]);

  const ov = overview || {};
  const weekDays = weekly?.days || [];
  const revDays = revenue?.days || [];
  const userDays = users?.days || [];
  const weekLabel = weekly?.week_label || "This Week";

  const userSegments = [
    {label: "Buyers", value: ov.buyers_count ?? 0, color: "#3b82f6"},
    {label: "Brands", value: ov.total_brands ?? 0, color: "#f59e0b"},
    {label: "Employees", value: ov.employees_count ?? 0, color: "#22c55e"},
    {label: "Partners", value: ov.partners_count ?? 0, color: "#a855f7"},
  ];

  const orderSegments = [
    {label: "Delivered", value: ov.delivered_orders ?? 0, color: "#22c55e"},
    {label: "Processing", value: ov.processing_orders ?? 0, color: "#3b82f6"},
    {label: "Pending", value: ov.pending_orders ?? 0, color: "#f59e0b"},
    {label: "Cancelled", value: ov.cancelled_orders ?? 0, color: "#ef4444"},
  ];

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 14}}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(max-width:640px){ .an-two { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── Weekly orders + revenue (share one week nav) ── */}
      <div className="an-two" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14}}>
        <Card
          title="Orders — by Day"
          topRight={
            <WeekNav
              label={weekLabel}
              offset={weekOffset}
              onChange={setWeekOffset}
              loading={loadWeek}
            />
          }>
          {loadWeek ? (
            <SkeletonBars />
          ) : weekDays.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <BarChart data={weekDays} valueKey="orders" color="#ef4444" />
              <ChartSummary data={weekDays} valueKey="orders" color="#ef4444" />
            </>
          )}
        </Card>

        <Card
          title="Revenue (₦) — by Day"
          topRight={
            <WeekNav
              label={weekLabel}
              offset={weekOffset}
              onChange={setWeekOffset}
              loading={loadWeek}
            />
          }>
          {loadWeek ? (
            <SkeletonBars />
          ) : weekDays.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <BarChart data={weekDays} valueKey="revenue" color="#22c55e" prefix="₦" />
              <ChartSummary data={weekDays} valueKey="revenue" color="#22c55e" prefix="₦" />
            </>
          )}
        </Card>
      </div>

      {/* ── New user signups by day (weekly) ── */}
      <Card
        title="New User Signups — by Day"
        topRight={
          <WeekNav
            label={weekLabel}
            offset={weekOffset}
            onChange={setWeekOffset}
            loading={loadWeek}
          />
        }>
        {loadWeek ? (
          <SkeletonBars />
        ) : weekDays.length === 0 ? (
          <EmptyChart />
        ) : (
          <>
            <BarChart data={weekDays} valueKey="users" color="#3b82f6" height={90} />
            <ChartSummary data={weekDays} valueKey="users" color="#3b82f6" />
          </>
        )}
      </Card>

      {/* ── Revenue trend (configurable period) ── */}
      <Card
        title="Revenue Trend"
        topRight={<PeriodSelect value={revPeriod} onChange={setRevPeriod} />}>
        {loadRev ? (
          <SkeletonBars count={revPeriod > 14 ? 14 : revPeriod} />
        ) : revDays.length === 0 ? (
          <EmptyChart />
        ) : (
          <>
            <BarChart
              data={revDays}
              valueKey="revenue"
              labelKey="date"
              color="#ef4444"
              height={110}
              prefix="₦"
            />
            <ChartSummary data={revDays} valueKey="revenue" color="#ef4444" prefix="₦" />
          </>
        )}
      </Card>

      {/* ── User growth trend (configurable period) ── */}
      <Card
        title="User Growth Trend"
        topRight={<PeriodSelect value={userPeriod} onChange={setUserPeriod} />}>
        {loadUser ? (
          <SkeletonBars count={userPeriod > 14 ? 14 : userPeriod} />
        ) : userDays.length === 0 ? (
          <EmptyChart />
        ) : (
          <>
            <BarChart
              data={userDays}
              valueKey="total"
              labelKey="date"
              color="#06b6d4"
              height={90}
            />
            <ChartSummary data={userDays} valueKey="total" color="#06b6d4" />
          </>
        )}
      </Card>

      {/* ── Donut breakdowns ── */}
      <div className="an-two" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14}}>
        <Card title="User Breakdown">
          <DonutChart segments={userSegments} />
        </Card>
        <Card title="Order Status Breakdown">
          <DonutChart segments={orderSegments} />
        </Card>
      </div>

      {/* ── Platform snapshot ── */}
      <Card title="Platform Snapshot">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 10,
          }}>
          {[
            {label: "Total Revenue", value: fmt(ov.total_revenue, "₦"), color: "#ef4444"},
            {label: "Total Orders", value: fmt(ov.total_orders), color: "#22c55e"},
            {label: "Total Users", value: fmt(ov.total_users), color: "#3b82f6"},
            {label: "Total Brands", value: fmt(ov.total_brands), color: "#f59e0b"},
            {label: "Active Drops", value: fmt(ov.active_drops), color: "#a855f7"},
            {label: "Pending Reviews", value: fmt(ov.pending_reviews), color: "#f97316"},
            {label: "Orders Today", value: fmt(ov.orders_today), color: "#84cc16"},
            {label: "New Users Today", value: fmt(ov.new_users_today), color: "#06b6d4"},
          ].map(({label, value, color}) => (
            <motion.div
              key={label}
              initial={{opacity: 0, y: 8}}
              animate={{opacity: 1, y: 0}}
              style={{
                background: `${color}08`,
                border: `1px solid ${color}20`,
                borderRadius: 10,
                padding: "12px 14px",
              }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.28)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  margin: "0 0 6px",
                }}>
                {label}
              </p>
              <p
                style={{
                  color,
                  fontSize: 22,
                  fontWeight: 900,
                  margin: 0,
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: "0.04em",
                }}>
                {overview === null ? "—" : value}
              </p>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
