import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AdminTable, SearchBar, Icon } from "./Components";
import { getAuditLogs, restoreAuditLog } from "./dashboard_components/api";

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Drawer to view full JSON data
function AuditDrawer({ log, onClose, onRestored }) {
  if (!log) return null;
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState(null);

  const handleRestore = async () => {
    setRestoring(true);
    setRestoreMsg(null);
    try {
      await restoreAuditLog(log.id);
      setRestoreMsg({ok: true, text: "Record restored successfully!"});
      setTimeout(() => { onRestored?.(); onClose(); }, 1500);
    } catch (e) {
      setRestoreMsg({ok: false, text: e.message || "Restore failed."});
      setRestoring(false);
    }
  };

  let parsedData = {};
  try {
    parsedData = JSON.parse(log.record_data);
  } catch {
    parsedData = { error: "Could not parse JSON" };
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: "min(600px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: "0 0 4px",
              }}
            >
              Audit Log #{log.id}
            </p>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: 0 }}>
              {log.table_name} · Record #{log.record_id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="x" size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Metadata
            </p>
            <div
              style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <DetailRow label="Table" value={log.table_name} />
              <DetailRow label="Record ID" value={log.record_id} />
              <DetailRow label="Deleted By" value={log.deleted_by ? `Admin #${log.deleted_by}` : "—"} />
              <DetailRow label="Deleted At" value={fmt(log.deleted_at)} />
              <DetailRow label="IP Address" value={log.ip_address || "—"} />
              <DetailRow label="Can Restore" value={log.can_restore ? "Yes" : "No"} />
            </div>
          </div>

          {/* Restore action */}
          {log.can_restore && (
            <div style={{marginBottom: 24}}>
              {restoreMsg && (
                <div style={{
                  background: restoreMsg.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${restoreMsg.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  borderRadius: 8, padding: "10px 14px", marginBottom: 10,
                }}>
                  <p style={{color: restoreMsg.ok ? "#22c55e" : "#ef4444", fontSize: 12, margin: 0, fontWeight: 600}}>
                    {restoreMsg.text}
                  </p>
                </div>
              )}
              <button
                onClick={handleRestore}
                disabled={restoring}
                style={{
                  width: "100%", padding: "12px 16px",
                  background: restoring ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: 10, cursor: restoring ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => { if (!restoring) e.currentTarget.style.background = "rgba(34,197,94,0.18)"; }}
                onMouseLeave={(e) => { if (!restoring) e.currentTarget.style.background = "rgba(34,197,94,0.1)"; }}>
                {restoring ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"
                    style={{animation: "spin 0.8s linear infinite"}}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <div style={{textAlign: "left"}}>
                  <p style={{color: "#22c55e", fontSize: 12, fontWeight: 800, margin: "0 0 2px"}}>
                    {restoring ? "Restoring..." : "↩ Restore This Record"}
                  </p>
                  <p style={{color: "rgba(34,197,94,0.6)", fontSize: 10, margin: 0}}>
                    Re-inserts record back into the {log.table_name} table
                  </p>
                </div>
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Record Data (JSON)
            </p>
            <pre
              style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: 16,
                color: "#22c55e",
                fontSize: 11,
                fontFamily: "monospace",
                lineHeight: 1.6,
                overflowX: "auto",
                margin: 0,
              }}
            >
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "right" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params = { limit: 20, page };
    if (tableFilter) params.table_name = tableFilter;
    if (search.trim()) params.search = search.trim();

    getAuditLogs(params)
      .then((data) => {
        setLogs(data?.logs || data || []);
        setTotal(data?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tableFilter, search, page]);

  useEffect(() => {
    setPage(1);
  }, [tableFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const cols = [
    {
      key: "id",
      label: "ID",
      render: (l) => (
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "monospace" }}>
          #{l.id}
        </span>
      ),
    },
    {
      key: "table",
      label: "Table",
      render: (l) => (
        <span
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "3px 8px",
            borderRadius: 99,
          }}
        >
          {l.table_name}
        </span>
      ),
    },
    {
      key: "record_id",
      label: "Record ID",
      render: (l) => (
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>#{l.record_id}</span>
      ),
    },
    {
      key: "deleted_by",
      label: "Deleted By",
      render: (l) => (
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
          {l.deleted_by ? `Admin #${l.deleted_by}` : "—"}
        </span>
      ),
    },
    {
      key: "ip",
      label: "IP Address",
      render: (l) => (
        <span
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 10,
            fontFamily: "monospace",
          }}
        >
          {l.ip_address || "—"}
        </span>
      ),
    },
    {
      key: "deleted_at",
      label: "Deleted At",
      render: (l) => (
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{fmt(l.deleted_at)}</span>
      ),
    },
  ];

  return (
    <div>
      {selectedLog && (
        <AuditDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onRestored={() => { setSelectedLog(null); load(); }}
        />
      )}

      <div
        style={{
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Icon name="shield" size={18} color="#ef4444" />
        <div>
          <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 800, margin: 0 }}>
            Audit Log — Deleted Records Archive
          </p>
          <p style={{ color: "rgba(239,68,68,0.6)", fontSize: 11, margin: "2px 0 0" }}>
            All deleted records are archived here. Click a row to view full JSON data.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["", "users", "brands", "buyers", "products", "orders"].map((t) => (
          <button
            key={t}
            onClick={() => setTableFilter(t)}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              border: `1px solid ${
                tableFilter === t ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"
              }`,
              background: tableFilter === t ? "rgba(239,68,68,0.1)" : "transparent",
              color: tableFilter === t ? "#ef4444" : "rgba(255,255,255,0.45)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t || "All Tables"}
          </button>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by record ID or table..."
        actions={
          <button
            onClick={load}
            style={{
              padding: "10px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              borderRadius: 9,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        }
      />

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
            {total.toLocaleString()} archived records
          </p>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>
            Click a row to view full data
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={logs}
          loading={loading}
          onRowClick={(log) => setSelectedLog(log)}
          emptyMsg="No deleted records found."
        />
        {total > 20 && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
              Page {page} · {logs.length} of {total}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: page === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={logs.length < 20}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: logs.length < 20 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: logs.length < 20 ? "not-allowed" : "pointer",
                  opacity: logs.length < 20 ? 0.5 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}