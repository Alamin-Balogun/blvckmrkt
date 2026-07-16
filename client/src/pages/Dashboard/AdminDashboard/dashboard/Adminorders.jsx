// admin/adminorders.jsx - COMPLETE FILE

import {useState, useEffect, useRef, useCallback} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {
  getOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  adminGetPayoutInfo,
  adminInitiatePayout,
  adminCompletePayout,
  adminCreateOrder,
  getUsers,
  getProducts,
  getAdminPickupLocations,
} from "../dashboard/dashboard_components/api";
import {AdminTable, Badge, SearchBar, ConfirmModal} from "./Components";

const STATUS_COLORS = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#06b6d4",
  delivered: "#22c55e",
  cancelled: "#ef4444",
  refunded: "#a855f7",
};

const PAYMENT_STATUS_COLORS = {
  paid: "#22c55e",
  unpaid: "#ef4444",
  pending: "#f59e0b",
  refunded: "#a855f7",
  failed: "#ef4444",
};

const ALL_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_STATUSES = ["paid", "unpaid", "pending", "refunded", "failed"];

function fmtDate(iso, withTime = false) {
  if (!iso) return "—";
  const opts = {day: "numeric", month: "short", year: "numeric"};
  if (withTime) {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
  }
  return new Date(iso).toLocaleDateString("en-GB", opts);
}

// ── Toast System ──────────────────────────────────────────────────────────────
function ToastContainer({toasts, onRemove}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}>
      <AnimatePresence>
        {toasts.map((t) => {
          const colors = {
            success: {bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", text: "#22c55e", icon: "✅"},
            error:   {bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  text: "#ef4444", icon: "❌"},
            info:    {bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#3b82f6", icon: "ℹ️"},
            warning: {bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)", text: "#f97316", icon: "⚠️"},
          }[t.type] || {bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)", text: "#fff", icon: "💬"};

          return (
            <motion.div
              key={t.id}
              initial={{opacity: 0, x: 60, scale: 0.95}}
              animate={{opacity: 1, x: 0, scale: 1}}
              exit={{opacity: 0, x: 60, scale: 0.95}}
              transition={{type: "spring", stiffness: 340, damping: 28}}
              style={{
                background: "#111",
                border: `1px solid ${colors.border}`,
                borderLeft: `3px solid ${colors.text}`,
                borderRadius: 10,
                padding: "12px 16px",
                maxWidth: 360,
                minWidth: 260,
                pointerEvents: "all",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                cursor: "pointer",
              }}
              onClick={() => onRemove(t.id)}>
              <div style={{display: "flex", alignItems: "flex-start", gap: 10}}>
                <span style={{fontSize: 14, flexShrink: 0, marginTop: 1}}>{colors.icon}</span>
                <div style={{flex: 1, minWidth: 0}}>
                  {t.title && (
                    <p style={{color: colors.text, fontSize: 12, fontWeight: 800, margin: "0 0 3px", letterSpacing: "0.02em"}}>
                      {t.title}
                    </p>
                  )}
                  <p style={{color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0, lineHeight: 1.5}}>
                    {t.message}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(t.id); }}
                  style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                    cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0,
                  }}>
                  ✕
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, title, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, {id, type, title, message}]);
    timers.current[id] = setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const toast = {
    success: (title, message, dur) => push("success", title, message, dur),
    error:   (title, message, dur) => push("error",   title, message, dur),
    info:    (title, message, dur) => push("info",    title, message, dur),
    warning: (title, message, dur) => push("warning", title, message, dur),
  };

  return {toasts, toast, removeToast: remove};
}

// ── Inline Confirm Modal (replaces window.confirm) ────────────────────────────
function InlineConfirm({title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel}) {
  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)", zIndex: 99998,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <motion.div
        initial={{scale: 0.9, opacity: 0, y: 16}}
        animate={{scale: 1, opacity: 1, y: 0}}
        exit={{scale: 0.9, opacity: 0, y: 16}}
        transition={{type: "spring", stiffness: 320, damping: 28}}
        style={{
          background: "#111", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: 24, maxWidth: 400, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}>
        <p style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: "0 0 8px"}}>{title}</p>
        <p style={{color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 22px", lineHeight: 1.5}}>{message}</p>
        <div style={{display: "flex", gap: 10}}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "11px 16px", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
              borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "11px 16px",
              background: danger ? "#ef4444" : "#22c55e",
              border: "none", color: "#fff", borderRadius: 9,
              fontSize: 12, fontWeight: 900, cursor: "pointer",
            }}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Section Header Component ──────────────────────────────────────────────────
function SectionHeader({children, style}) {
  return (
    <p
      style={{
        color: "rgba(255,255,255,0.2)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        margin: "14px 0 8px",
        ...style,
      }}>
      {children}
    </p>
  );
}

// ── Info Row Component ────────────────────────────────────────────────────────
function InfoRow({label, value}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
      <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>{label}</span>
      <span
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: 11,
          maxWidth: "60%",
          textAlign: "right",
          wordBreak: "break-all",
        }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── Payout Modal Component ────────────────────────────────────────────────────
function PayoutModal({orderId, onClose, onSuccess, toast}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [gateway, setGateway] = useState("paystack");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [inlineConfirm, setInlineConfirm] = useState(null);

  useEffect(() => {
    setLoading(true);
    adminGetPayoutInfo(orderId)
      .then((res) => {
        setData(res);
        if (res.suggested_gateway) setGateway(res.suggested_gateway);
        if (res.brands?.length === 1) setSelectedBrand(res.brands[0]);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Load Failed", "Failed to load payout info");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePayout = () => {
    if (!selectedBrand) {
      toast.warning("No Brand Selected", "Please select a brand to pay");
      return;
    }
    if (!selectedBrand.has_bank_account) {
      toast.error("No Bank Account", "This brand has not set up a bank account yet");
      return;
    }

    const isManual = gateway === "manual";
    setInlineConfirm({
      title: isManual ? "📝 Record Manual Transfer?" : "💸 Initiate Payout?",
      message: `${isManual ? "Record" : "Send"} ₦${Number(selectedBrand.amount).toLocaleString()} to ${selectedBrand.brand_name} via ${gateway === "manual" ? "manual transfer" : gateway}?`,
      confirmLabel: isManual ? "Record Transfer" : "Send Payout",
      danger: false,
    });
  };

  const executePayout = async () => {
    setInlineConfirm(null);
    setProcessing(true);
    const isManual = gateway === "manual";
    try {
      const result = await adminInitiatePayout(orderId, {
        brand_id: selectedBrand.brand_id,
        gateway,
        notes,
      });

      if (isManual) {
        toast.warning(
          "Transfer Recorded",
          `Ref: ${result.reference} — Complete the bank transfer manually, then mark as completed in Payouts.`,
          8000
        );
      } else {
        toast.success(
          "Payout Initiated",
          `₦${Number(selectedBrand.amount).toLocaleString()} sent to ${selectedBrand.brand_name} · Ref: ${result.reference}`,
          7000
        );
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error("Payout Failed", err.message || "Failed to initiate payout");
    } finally {
      setProcessing(false);
    }
  };

  const isManual = gateway === "manual";

  return (
    <>
      <AnimatePresence>
        {inlineConfirm && (
          <InlineConfirm
            title={inlineConfirm.title}
            message={inlineConfirm.message}
            confirmLabel={inlineConfirm.confirmLabel}
            danger={inlineConfirm.danger}
            onConfirm={executePayout}
            onCancel={() => setInlineConfirm(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(5px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}>
        <motion.div
          initial={{scale: 0.9, opacity: 0, y: 20}}
          animate={{scale: 1, opacity: 1, y: 0}}
          exit={{scale: 0.9, opacity: 0, y: 20}}
          transition={{type: "spring", stiffness: 300, damping: 30}}
          style={{
            background: "#0f0f0f",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            maxWidth: 600,
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          }}>
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              background: "#0f0f0f",
              zIndex: 10,
            }}>
            <div>
              <h3
                style={{
                  color: "#fff",
                  fontSize: 18,
                  margin: "0 0 4px",
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                }}>
                💰 Initiate Brand Payout
              </h3>
              <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
                Order {data?.display_id}
                {data?.payment_method && (
                  <span style={{
                    marginLeft: 8,
                    background: "rgba(59,130,246,0.15)",
                    color: "#3b82f6",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}>
                    Paid via {data.payment_method}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)", cursor: "pointer",
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              }}>
              ✕
            </button>
          </div>

          {loading ? (
            <div style={{padding: 60, textAlign: "center"}}>
              <div
                style={{
                  width: 40, height: 40,
                  border: "3px solid rgba(239,68,68,0.2)",
                  borderTop: "3px solid #ef4444",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13}}>Loading payout info...</p>
            </div>
          ) : (
            <div style={{padding: "24px"}}>
              {/* Order Summary */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginBottom: 20,
                }}>
                <p style={{
                  color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px",
                }}>
                  Order Summary
                </p>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 4}}>
                  <span style={{color: "rgba(255,255,255,0.5)", fontSize: 12}}>Subtotal</span>
                  <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>
                    ₦{Number(data?.subtotal || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: 4}}>
                  <span style={{color: "rgba(255,255,255,0.5)", fontSize: 12}}>Shipping</span>
                  <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>
                    ₦{Number(data?.shipping_fee || 0).toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  marginTop: 8, paddingTop: 8,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{color: "#22c55e", fontSize: 13, fontWeight: 700}}>Total</span>
                  <span style={{color: "#22c55e", fontSize: 15, fontWeight: 900, fontFamily: "monospace"}}>
                    ₦{Number(data?.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Brand Selection */}
              <p style={{
                color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700,
                letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px",
              }}>
                Select Brand to Pay {data?.brands?.length > 1 && `(${data.brands.length} brands)`}
              </p>

              <div style={{maxHeight: 300, overflowY: "auto", marginBottom: 20}}>
                {data?.brands?.map((brand) => (
                  <div
                    key={brand.brand_id}
                    onClick={() => brand.has_bank_account && setSelectedBrand(brand)}
                    style={{
                      background: selectedBrand?.brand_id === brand.brand_id
                        ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selectedBrand?.brand_id === brand.brand_id
                        ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 10,
                      cursor: brand.has_bank_account ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      opacity: brand.has_bank_account ? 1 : 0.6,
                    }}
                    onMouseEnter={(e) => {
                      if (brand.has_bank_account && selectedBrand?.brand_id !== brand.brand_id) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (brand.has_bank_account && selectedBrand?.brand_id !== brand.brand_id) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      }
                    }}>
                    <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                      <div style={{flex: 1}}>
                        <p style={{color: "#fff", fontSize: 13, fontWeight: 700, margin: "0 0 2px"}}>
                          {brand.brand_name}
                        </p>
                        <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                          {brand.brand_email}
                        </p>
                      </div>
                      <div style={{textAlign: "right"}}>
                        <p style={{color: "#ef4444", fontSize: 16, fontWeight: 900, margin: "0 0 2px", fontFamily: "monospace"}}>
                          ₦{Number(brand.amount || 0).toLocaleString()}
                        </p>
                        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
                          {brand.items?.length || 0} item{brand.items?.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {!brand.has_bank_account && (
                      <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 6, padding: "6px 10px", marginTop: 8,
                      }}>
                        <p style={{color: "#ef4444", fontSize: 10, margin: 0, fontWeight: 600}}>
                          ⚠️ No bank account on file - cannot process payout
                        </p>
                      </div>
                    )}

                    {brand.bank_account && (
                      <div style={{
                        background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)",
                        borderRadius: 6, padding: "8px 10px", marginTop: 8,
                      }}>
                        <p style={{
                          color: "rgba(255,255,255,0.4)", fontSize: 9, margin: "0 0 4px",
                          textTransform: "uppercase", letterSpacing: "0.1em",
                        }}>
                          {brand.bank_account.bank_name}
                        </p>
                        <p style={{color: "#22c55e", fontSize: 11, fontWeight: 700, margin: 0}}>
                          {brand.bank_account.account_number} - {brand.bank_account.account_name}
                        </p>
                        {!brand.bank_account.is_verified && (
                          <p style={{color: "#f59e0b", fontSize: 9, margin: "4px 0 0", fontWeight: 600}}>
                            ⚠ Not verified
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

{selectedBrand && selectedBrand.has_bank_account && (
  <>
    {/* Gateway Selection */}
    <p
      style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        margin: "20px 0 10px",
      }}>
      Payment Gateway
      {data?.suggested_gateway && (
        <span style={{
          marginLeft: 8,
          color: "#22c55e",
          fontSize: 8,
          fontWeight: 600,
          textTransform: "none",
          letterSpacing: "0.05em",
        }}>
          (✓ Auto-selected: buyer paid via {data.payment_method})
        </span>
      )}
    </p>
    <div style={{display: "flex", gap: 8, marginBottom: 16}}>
      {["paystack", "flutterwave", "manual"].map((g) => {
        const isActive = gateway === g;
        const isSuggested = data?.suggested_gateway === g;
        
        return (
          <button
            key={g}
            onClick={() => setGateway(g)}
            style={{
              flex: 1,
              padding: "10px 14px",
              position: "relative",
              background: isActive 
                ? "rgba(239,68,68,0.15)"  // ✅ Original red background
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                isActive 
                  ? "rgba(239,68,68,0.4)"  // ✅ Original red border
                  : isSuggested 
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(255,255,255,0.08)"
              }`,
              color: isActive ? "#ef4444" : "rgba(255,255,255,0.5)",  // ✅ Original red text
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "rgba(255,255,255,0.8)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }
            }}>
            {/* Suggested indicator badge */}
            {isSuggested && !isActive && (
              <span style={{
                position: "absolute",
                top: -6,
                right: -6,
                width: 12,
                height: 12,
                background: "#22c55e",
                borderRadius: "50%",
                border: "2px solid #0f0f0f",
                animation: "pulse-dot 2s ease-in-out infinite",
              }} />
            )}
            
            {isActive && "✓ "}
            {g === "manual" ? "Manual Transfer" : g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        );
      })}
    </div>

    {/* Suggested Gateway Info Banner */}
    {data?.suggested_gateway && (
      <div
        style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
        <span style={{fontSize: 16}}>💡</span>
        <p style={{color: "#22c55e", fontSize: 11, margin: 0, lineHeight: 1.4, flex: 1}}>
          <strong>Recommended:</strong> Customer paid via <strong>{data.payment_method}</strong>. 
          Using the same gateway ({data.suggested_gateway}) ensures faster reconciliation.
        </p>
      </div>
    )}

    {/* Manual transfer notice */}
    {isManual && (
      <div
        style={{
          background: "rgba(249,115,22,0.1)",
          border: "1px solid rgba(249,115,22,0.3)",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 16,
        }}>
        <p style={{color: "#f97316", fontSize: 11, margin: 0, lineHeight: 1.5}}>
          📝 <strong>Manual Transfer:</strong> This will record the payout intent. You must complete the bank transfer yourself and then mark it as completed in the Payouts section.
        </p>
      </div>
    )}

                  {/* Notes */}
                  <p style={{
                    color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px",
                  }}>
                    Admin Notes {isManual && "(Required for manual transfers)"}
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isManual
                      ? "e.g., Transfer completed via mobile banking on DD/MM/YYYY..."
                      : "Add any notes about this payout..."}
                    style={{
                      width: "100%", minHeight: isManual ? 80 : 60,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8, padding: "10px 12px", color: "#fff",
                      fontSize: 12, resize: "vertical", fontFamily: "inherit", outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />

                  {/* Action Buttons */}
                  <div style={{display: "flex", gap: 10, marginTop: 24}}>
                    <button
                      onClick={onClose}
                      disabled={processing}
                      style={{
                        flex: 1, padding: "12px 20px", background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                        borderRadius: 10, fontSize: 12, fontWeight: 700,
                        cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.5 : 1,
                        transition: "all 0.2s",
                      }}>
                      Cancel
                    </button>
                    <button
                      onClick={handlePayout}
                      disabled={processing}
                      style={{
                        flex: 2, padding: "12px 20px",
                        background: processing
                          ? isManual ? "rgba(249,115,22,0.3)" : "rgba(239,68,68,0.3)"
                          : isManual
                            ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                            : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        border: "none", color: "#fff", borderRadius: 10,
                        fontSize: 12, fontWeight: 900, cursor: processing ? "not-allowed" : "pointer",
                        letterSpacing: "0.05em", textTransform: "uppercase", transition: "all 0.2s",
                        boxShadow: processing ? "none" : isManual
                          ? "0 4px 15px rgba(249,115,22,0.3)"
                          : "0 4px 15px rgba(239,68,68,0.3)",
                      }}
                      onMouseEnter={(e) => {
                        if (!processing) {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = isManual
                            ? "0 6px 20px rgba(249,115,22,0.4)"
                            : "0 6px 20px rgba(239,68,68,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!processing) {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = isManual
                            ? "0 4px 15px rgba(249,115,22,0.3)"
                            : "0 4px 15px rgba(239,68,68,0.3)";
                        }
                      }}>
                      {processing
                        ? isManual ? "Recording..." : "Processing..."
                        : isManual
                          ? `📝 Record ₦${Number(selectedBrand.amount || 0).toLocaleString()} Transfer`
                          : `💸 Pay ₦${Number(selectedBrand.amount || 0).toLocaleString()}`}
                    </button>
                  </div>
                </>
              )}

              {!selectedBrand && data?.brands?.length > 0 && (
                <div style={{
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: 8, padding: "12px 14px", marginTop: 20, textAlign: "center",
                }}>
                  <p style={{color: "#3b82f6", fontSize: 11, margin: 0}}>
                    👆 Select a brand above to continue with payout
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
        `}</style>
      </motion.div>
    </>
  );
}

// ── Pay Brand Button — smart state-aware ──────────────────────────────────────
// Checks for existing payout status and renders the correct button state:
//   paid (no payout)       → 💰 Pay Brand (green, opens modal)
//   payout processing      → ✅ Mark as Complete (orange, completes it)
//   payout completed       → ✓ Paid Out (grey, disabled)
//   not paid               → nothing rendered
function PayBrandButton({order, onPayoutClick, onMarkComplete, toast}) {
  const [payoutStatus, setPayoutStatus] = useState(null); // null | "processing" | "completed"
  const [payoutId, setPayoutId] = useState(null);
  const [checkingPayout, setCheckingPayout] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [inlineConfirm, setInlineConfirm] = useState(false);

  useEffect(() => {
    if (order?.payment_status !== "paid") return;
    setCheckingPayout(true);
    adminGetPayoutInfo(order.id)
      .then((res) => {
        // Look through brands for a payout status
        if (res?.brands?.length > 0) {
          // We check the payout status from the order's payout records
          // The API doesn't return existing payout status in payout-info,
          // so we infer from the suggested_gateway field being present = at least one attempt.
          // The real status lives on the BrandPayout record; we'll detect it from
          // the fact that the admin panel loads payouts separately.
          // For the button logic we call getPayouts filtered by orderId instead.
        }
      })
      .catch(() => {})
      .finally(() => setCheckingPayout(false));
  }, [order?.id, order?.payment_status]);

  // Separate effect: poll for payout status for this specific order
  useEffect(() => {
    if (order?.payment_status !== "paid") return;
    // Import getPayouts inline since we need it here
    import("../dashboard/dashboard_components/api").then(({getPayouts}) => {
      getPayouts({order_id: order.id})
        .then((res) => {
          const payouts = res?.payouts || [];
          // Find most recent non-failed payout for this order
          const active = payouts.find(
            (p) => p.order_id === order.id && p.status !== "failed" && p.status !== "reversed"
          );
          if (active) {
            setPayoutStatus(active.status); // "pending" | "processing" | "completed"
            setPayoutId(active.id);
          }
        })
        .catch(() => {});
    });
  }, [order?.id, order?.payment_status]);

  const handleMarkComplete = async () => {
    setInlineConfirm(false);
    setCompleting(true);
    try {
      await adminCompletePayout(payoutId);
      setPayoutStatus("completed");
      toast.success("Payout Completed", "Manual payout marked as completed successfully");
      onMarkComplete?.();
    } catch (err) {
      toast.error("Failed", err.message || "Failed to mark payout as complete");
    } finally {
      setCompleting(false);
    }
  };

  if (order?.payment_status !== "paid") return null;

  // Completed state — disabled greyed button
  if (payoutStatus === "completed") {
    return (
      <div
        style={{
          width: "100%", padding: "12px 16px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, fontSize: 12, fontWeight: 700,
          color: "rgba(255,255,255,0.25)", marginBottom: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 8, letterSpacing: "0.05em", textTransform: "uppercase",
          cursor: "not-allowed",
        }}>
        <span style={{fontSize: 14}}>✓</span>
        Brand Paid Out
      </div>
    );
  }

  // Processing state — Mark as Complete button
  if (payoutStatus === "processing" || payoutStatus === "pending") {
    return (
      <>
        <AnimatePresence>
          {inlineConfirm && (
            <InlineConfirm
              title="Mark Payout as Complete?"
              message="Confirm that you have completed the manual bank transfer to this brand."
              confirmLabel="Mark Complete"
              onConfirm={handleMarkComplete}
              onCancel={() => setInlineConfirm(false)}
            />
          )}
        </AnimatePresence>

        <button
          onClick={() => setInlineConfirm(true)}
          disabled={completing}
          style={{
            width: "100%", padding: "12px 16px",
            background: completing
              ? "rgba(249,115,22,0.2)"
              : "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            border: "none", color: "#fff", borderRadius: 10,
            fontSize: 12, fontWeight: 900, cursor: completing ? "not-allowed" : "pointer",
            marginBottom: 18, letterSpacing: "0.05em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: completing ? "none" : "0 4px 15px rgba(249,115,22,0.3)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!completing) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(249,115,22,0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!completing) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(249,115,22,0.3)";
            }
          }}>
          <span style={{fontSize: 16}}>✅</span>
          {completing ? "Completing..." : "Mark as Complete"}
        </button>

        {/* Info strip showing a transfer is pending */}
        <div style={{
          background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
          borderRadius: 8, padding: "8px 12px", marginBottom: 18, marginTop: -10,
        }}>
          <p style={{color: "#f97316", fontSize: 10, margin: 0, fontWeight: 600}}>
            📝 Manual transfer recorded — click above once you've sent the money
          </p>
        </div>
      </>
    );
  }

  // Default — open payout modal
  return (
    <button
      onClick={() => onPayoutClick(order.id)}
      style={{
        width: "100%", padding: "12px 16px",
        background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        border: "none", color: "#fff", borderRadius: 10,
        fontSize: 12, fontWeight: 900, cursor: "pointer",
        marginBottom: 18, letterSpacing: "0.05em", textTransform: "uppercase",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: "0 4px 15px rgba(34,197,94,0.3)", transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(34,197,94,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 15px rgba(34,197,94,0.3)";
      }}>
      <span style={{fontSize: 16}}>💰</span>
      Pay Brand
    </button>
  );
}

// ── Order detail drawer ───────────────────────────────────────────────────────
function OrderDrawer({orderId, onClose, onStatusChange, onPaymentStatusChange, onDelete, onPayoutClick, toast}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    getOrder(orderId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId]);

  const order = data?.order || data;
  const buyer = {name: data?.buyer_name, email: data?.buyer_email};
  const address = data?.address;
  const items = order?.items || order?.Items || [];
  const deliveryDetails = data?.delivery_details;
  const paymentDetails = data?.payment_details;

  const handleStatus = async (status) => {
    setUpdating(true);
    await onStatusChange(orderId, status);
    setData((prev) => (prev ? {...prev, order: {...prev.order, status}} : prev));
    setUpdating(false);
  };

  const handlePayStatus = async (payment_status) => {
    setUpdating(true);
    await onPaymentStatusChange(orderId, payment_status);
    setData((prev) => (prev ? {...prev, order: {...prev.order, payment_status}} : prev));
    setUpdating(false);
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(3px)",
        zIndex: 999, display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(600px,100vw)", height: "100vh",
          background: "#0f0f0f", borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto", display: "flex", flexDirection: "column",
        }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, position: "sticky", top: 0, background: "#0f0f0f", zIndex: 10,
        }}>
          {loading ? (
            <div style={{height: 36, width: 140, background: "rgba(255,255,255,0.06)", borderRadius: 7, animation: "pulse 1.4s infinite"}} />
          ) : (
            <div>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 2px"}}>
                Order
              </p>
              <p style={{color: "#fff", fontSize: 15, fontWeight: 900, margin: 0, fontFamily: "monospace"}}>
                {order?.display_id || `#${orderId}`}
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{padding: 22, display: "flex", flexDirection: "column", gap: 10}}>
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} style={{
                height: 28, background: "rgba(255,255,255,0.04)", borderRadius: 6,
                animation: "pulse 1.4s infinite", animationDelay: `${i * 0.07}s`,
              }} />
            ))}
          </div>
        ) : (
          <div style={{padding: "16px 22px 80px", flex: 1}}>
            {/* Status badges */}
            <div style={{display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap"}}>
              <Badge label={order?.status || "pending"} color={STATUS_COLORS[order?.status] || "#fff"} />
              <Badge label={order?.payment_status || "unpaid"} color={PAYMENT_STATUS_COLORS[order?.payment_status] || "#6b7280"} />
              <Badge label={order?.delivery_type || "N/A"} color="#8b5cf6" />
            </div>

            {/* ── Smart Pay Brand Button ── */}
            <PayBrandButton
              order={order}
              onPayoutClick={(id) => { onClose(); onPayoutClick(id); }}
              onMarkComplete={() => {}}
              toast={toast}
            />

            {/* Financials */}
            <SectionHeader style={{marginTop: 0}}>Financials</SectionHeader>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18}}>
              {[
                {label: "Subtotal", val: `₦${Number(order?.subtotal || 0).toLocaleString()}`},
                {label: "Shipping", val: `₦${Number(order?.shipping_fee || 0).toLocaleString()}`},
                {label: "Total", val: `₦${Number(order?.total || 0).toLocaleString()}`, highlight: true},
              ].map(({label, val, highlight}) => (
                <div
                  key={label}
                  style={{
                    background: highlight ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${highlight ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 9,
                    padding: "10px 12px",
                  }}>
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, margin: "0 0 3px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase"}}>
                    {label}
                  </p>
                  <p style={{color: highlight ? "#22c55e" : "#fff", fontSize: 14, fontWeight: 900, margin: 0}}>
                    {val}
                  </p>
                </div>
              ))}
            </div>

            {/* Buyer */}
            <SectionHeader>Buyer Information</SectionHeader>
            <InfoRow label="Name" value={buyer.name} />
            <InfoRow label="Email" value={buyer.email || order?.contact_email} />
            <InfoRow label="Phone" value={order?.contact_phone} />

            {/* Delivery Address */}
            {address && (
              <>
                <SectionHeader>Delivery Address</SectionHeader>
                <InfoRow label="Street" value={address.street} />
                <InfoRow label="City" value={address.city} />
                <InfoRow label="State" value={address.state} />
                <InfoRow label="Country" value={address.country} />
                {address.postal_code && <InfoRow label="Postal Code" value={address.postal_code} />}
              </>
            )}

            {/* Delivery Details */}
            {deliveryDetails && (
              <>
                <SectionHeader>Delivery Details ({order?.delivery_type?.toUpperCase()})</SectionHeader>
                <div style={{background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 9, padding: "12px 14px", marginBottom: 8}}>
                  {order?.delivery_type === "pickup" && (
                    <>
                      <InfoRow label="Location Name" value={deliveryDetails.name} />
                      <InfoRow label="Address" value={deliveryDetails.address} />
                      <InfoRow label="City" value={deliveryDetails.city} />
                      <InfoRow label="State" value={deliveryDetails.state} />
                      <InfoRow label="Country" value={deliveryDetails.country} />
                      {deliveryDetails.phone && <InfoRow label="Phone" value={deliveryDetails.phone} />}
                      {deliveryDetails.instructions && <InfoRow label="Instructions" value={deliveryDetails.instructions} />}
                    </>
                  )}
                  {order?.delivery_type === "zone" && (
                    <>
                      <InfoRow label="Zone" value={deliveryDetails.zone_name} />
                      <InfoRow label="Country" value={deliveryDetails.location_country} />
                      {deliveryDetails.location_state && <InfoRow label="State" value={deliveryDetails.location_state} />}
                      <InfoRow label="Method" value={deliveryDetails.method_name} />
                      {deliveryDetails.method_description && <InfoRow label="Description" value={deliveryDetails.method_description} />}
                      <InfoRow label="Pricing Type" value={deliveryDetails.pricing_type} />
                      <InfoRow label="Rate" value={`${deliveryDetails.currency_symbol || "₦"}${Number(deliveryDetails.rate || 0).toLocaleString()}`} />
                      {(deliveryDetails.min_days || deliveryDetails.max_days) && (
                        <InfoRow label="Delivery Time" value={`${deliveryDetails.min_days || "?"}-${deliveryDetails.max_days || "?"} days`} />
                      )}
                    </>
                  )}
                  {order?.delivery_type === "local" && (
                    <>
                      <InfoRow label="Country" value={deliveryDetails.country} />
                      {deliveryDetails.state && <InfoRow label="State" value={deliveryDetails.state} />}
                      {deliveryDetails.city && <InfoRow label="City" value={deliveryDetails.city} />}
                      <InfoRow label="Base Price" value={`${deliveryDetails.currency_symbol || "₦"}${Number(deliveryDetails.base_price || 0).toLocaleString()}`} />
                    </>
                  )}
                </div>
              </>
            )}

            {/* Payment Details */}
            {paymentDetails && (
              <>
                <SectionHeader>Payment Details</SectionHeader>
                <div style={{background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 9, padding: "12px 14px", marginBottom: 8}}>
                  {(order?.payment_method === "transfer" || order?.payment_method === "manual_transfer") && (
                    <>
                      <InfoRow label="Reference" value={paymentDetails.reference} />
                      {paymentDetails.bank_name && <InfoRow label="Bank" value={paymentDetails.bank_name} />}
                      {paymentDetails.account_name && <InfoRow label="Account Name" value={paymentDetails.account_name} />}
                      {paymentDetails.transfer_date && <InfoRow label="Transfer Date" value={fmtDate(paymentDetails.transfer_date, true)} />}
                      {paymentDetails.verified_at && <InfoRow label="Verified At" value={fmtDate(paymentDetails.verified_at, true)} />}
                      {paymentDetails.notes && <InfoRow label="Notes" value={paymentDetails.notes} />}
                      {paymentDetails.receipt_url && (
                        <>
                          <div style={{marginTop: 12, marginBottom: 6}}>
                            <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>Payment Receipt</span>
                          </div>
                          <a href={paymentDetails.receipt_url} target="_blank" rel="noopener noreferrer"
                            style={{display: "block", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(34,197,94,0.2)", marginTop: 6}}>
                            <img
                              src={paymentDetails.receipt_url}
                              alt="Payment Receipt"
                              style={{width: "100%", height: "auto", maxHeight: 300, objectFit: "contain", background: "rgba(0,0,0,0.3)"}}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.innerHTML = `<div style="padding:12px;text-align:center;color:rgba(255,255,255,0.5);font-size:11px;">📄 View Receipt (Click to open)</div>`;
                              }}
                            />
                          </a>
                        </>
                      )}
                    </>
                  )}
                  {(order?.payment_method === "paystack" || order?.payment_method === "flutterwave") && (
                    <>
                      <InfoRow label="Gateway" value={paymentDetails.gateway?.toUpperCase()} />
                      <InfoRow label="Transaction ID" value={paymentDetails.transaction_id} />
                      <InfoRow label="Reference" value={paymentDetails.reference} />
                      <InfoRow label="Amount" value={`${paymentDetails.currency} ${Number(paymentDetails.amount || 0).toLocaleString()}`} />
                      <InfoRow label="Status" value={paymentDetails.status} />
                      {paymentDetails.channel && <InfoRow label="Channel" value={paymentDetails.channel} />}
                      {paymentDetails.card_type && <InfoRow label="Card" value={`${paymentDetails.card_type.toUpperCase()} **** ${paymentDetails.card_last4 || ""}`} />}
                      {paymentDetails.customer_email && <InfoRow label="Customer Email" value={paymentDetails.customer_email} />}
                      {paymentDetails.verified_at && <InfoRow label="Verified At" value={fmtDate(paymentDetails.verified_at, true)} />}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Order Items */}
            {items.length > 0 && (
              <>
                <SectionHeader>Items ({items.length})</SectionHeader>
                <div style={{display: "flex", flexDirection: "column", gap: 6, marginBottom: 16}}>
                  {items.map((item, i) => (
                    <div key={item.id || i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 9, padding: "10px 12px",
                    }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{width: 38, height: 38, objectFit: "cover", borderRadius: 6, flexShrink: 0}} />
                      ) : (
                        <div style={{
                          width: 38, height: 38, background: "rgba(239,68,68,0.1)", borderRadius: 6, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, color: "#ef4444", fontWeight: 900,
                        }}>IMG</div>
                      )}
                      <div style={{flex: 1, minWidth: 0}}>
                        <p style={{color: "#fff", fontSize: 11, fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                          {item.product_name || `Product #${item.product_id}`}
                        </p>
                        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
                          {item.size && `Size: ${item.size} · `}Qty: {item.quantity}
                        </p>
                      </div>
                      <div style={{textAlign: "right", flexShrink: 0}}>
                        <p style={{color: "#22c55e", fontSize: 11, fontWeight: 700, margin: 0}}>
                          ₦{Number(item.total_price || item.unit_price * item.quantity || 0).toLocaleString()}
                        </p>
                        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, margin: 0}}>
                          ₦{Number(item.unit_price || 0).toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            {order?.notes && (
              <>
                <SectionHeader>Notes</SectionHeader>
                <p style={{
                  color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.6,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, padding: "10px 12px", marginBottom: 16,
                }}>
                  {order.notes}
                </p>
              </>
            )}

            {/* Meta */}
            <SectionHeader>Order Information</SectionHeader>
            <InfoRow label="Payment Method" value={order?.payment_method} />
            <InfoRow label="Payment Ref" value={order?.payment_ref} />
            <InfoRow label="Currency" value={order?.currency} />
            <InfoRow label="Placed" value={fmtDate(order?.created_at, true)} />
            <InfoRow label="Last Updated" value={fmtDate(order?.updated_at, true)} />

            {/* Update order status */}
            <div style={{marginTop: 18}}>
              <SectionHeader style={{marginTop: 18}}>
                Order Status {updating && <span style={{color: "#f59e0b"}}>· saving...</span>}
              </SectionHeader>
              <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
                {ALL_STATUSES.map((s) => {
                  const active = order?.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatus(s)}
                      disabled={updating || active}
                      style={{
                        padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                        cursor: active ? "default" : "pointer", textTransform: "capitalize",
                        background: active ? `${STATUS_COLORS[s]}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? STATUS_COLORS[s] + "50" : "rgba(255,255,255,0.1)"}`,
                        color: active ? STATUS_COLORS[s] : "rgba(255,255,255,0.4)",
                        transition: "all 0.15s",
                      }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Update payment status */}
            <div style={{marginTop: 14}}>
              <SectionHeader>Payment Status</SectionHeader>
              <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
                {PAYMENT_STATUSES.map((s) => {
                  const active = order?.payment_status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handlePayStatus(s)}
                      disabled={updating || active}
                      style={{
                        padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                        cursor: active ? "default" : "pointer", textTransform: "capitalize",
                        background: active ? `${PAYMENT_STATUS_COLORS[s]}20` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? PAYMENT_STATUS_COLORS[s] + "50" : "rgba(255,255,255,0.1)"}`,
                        color: active ? PAYMENT_STATUS_COLORS[s] : "rgba(255,255,255,0.4)",
                        transition: "all 0.15s",
                      }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delete */}
            <div style={{marginTop: 16}}>
              <button
                onClick={() => onDelete(orderId)}
                style={{
                  padding: "10px 14px", background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.6)",
                  borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  width: "100%", textAlign: "left",
                }}>
                🗑 Delete Order
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Pay Brand Table Button — smart state-aware (for table rows) ───────────────
function TablePayButton({order, onPayoutClick, onMarkComplete, toast}) {
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [payoutId, setPayoutId] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [inlineConfirm, setInlineConfirm] = useState(false);

  useEffect(() => {
    if (order?.payment_status !== "paid") return;
    import("../dashboard/dashboard_components/api").then(({getPayouts}) => {
      getPayouts({order_id: order.id})
        .then((res) => {
          const payouts = res?.payouts || [];
          const active = payouts.find(
            (p) => p.order_id === order.id && p.status !== "failed" && p.status !== "reversed"
          );
          if (active) {
            setPayoutStatus(active.status);
            setPayoutId(active.id);
          }
        })
        .catch(() => {});
    });
  }, [order?.id, order?.payment_status]);

  const handleMarkComplete = async () => {
    setInlineConfirm(false);
    setCompleting(true);
    try {
      await adminCompletePayout(payoutId);
      setPayoutStatus("completed");
      toast.success("Payout Completed", "Manual payout marked as completed");
      onMarkComplete?.();
    } catch (err) {
      toast.error("Failed", err.message || "Could not complete payout");
    } finally {
      setCompleting(false);
    }
  };

  if (order?.payment_status !== "paid") {
    return (
      <button disabled style={{
        padding: "6px 12px", background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)",
        borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "not-allowed",
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        💰 Pay Brand
      </button>
    );
  }

  // Completed
  if (payoutStatus === "completed") {
    return (
      <button disabled style={{
        padding: "6px 12px", background: "rgba(34,197,94,0.06)",
        border: "1px solid rgba(34,197,94,0.15)", color: "rgba(34,197,94,0.4)",
        borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "not-allowed",
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        ✓ Paid Out
      </button>
    );
  }

  // Processing → Mark as Complete
  if (payoutStatus === "processing" || payoutStatus === "pending") {
    return (
      <>
        <AnimatePresence>
          {inlineConfirm && (
            <InlineConfirm
              title="Mark Payout as Complete?"
              message={`Confirm you've sent the manual transfer for order ${order.display_id || "#" + order.id}.`}
              confirmLabel="Mark Complete"
              onConfirm={handleMarkComplete}
              onCancel={() => setInlineConfirm(false)}
            />
          )}
        </AnimatePresence>
        <button
          onClick={(e) => { e.stopPropagation(); setInlineConfirm(true); }}
          disabled={completing}
          style={{
            padding: "6px 12px",
            background: completing ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.12)",
            border: "1px solid rgba(249,115,22,0.35)",
            color: completing ? "rgba(249,115,22,0.5)" : "#f97316",
            borderRadius: 6, fontSize: 10, fontWeight: 700,
            cursor: completing ? "not-allowed" : "pointer",
            textTransform: "uppercase", letterSpacing: "0.05em", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!completing) e.currentTarget.style.background = "rgba(249,115,22,0.2)";
          }}
          onMouseLeave={(e) => {
            if (!completing) e.currentTarget.style.background = "rgba(249,115,22,0.12)";
          }}>
          {completing ? "..." : "✅ Mark Complete"}
        </button>
      </>
    );
  }

  // Default → open modal
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onPayoutClick(order.id); }}
      style={{
        padding: "6px 12px", background: "rgba(34,197,94,0.1)",
        border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e",
        borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer",
        textTransform: "uppercase", letterSpacing: "0.05em", transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(34,197,94,0.15)";
        e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(34,197,94,0.1)";
        e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
      }}>
      💰 Pay Brand
    </button>
  );
}

// ── Create Order Modal ────────────────────────────────────────────────────────
// Lets an admin place an order on a buyer's behalf — e.g. to finish a purchase
// for a customer whose checkout failed or who ordered through support.
const fieldStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "9px 11px",
  color: "#fff",
  fontSize: 12,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

function FieldLabel({children}) {
  return (
    <label style={{display: "block", color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em"}}>
      {children}
    </label>
  );
}

function CreateOrderModal({onClose, onCreated, toast}) {
  const [submitting, setSubmitting] = useState(false);

  // Buyer search
  const [buyerQuery, setBuyerQuery] = useState("");
  const [buyerResults, setBuyerResults] = useState([]);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const [buyer, setBuyer] = useState(null);
  const buyerTimer = useRef(null);

  // Product search
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const productTimer = useRef(null);

  // Order items
  const [items, setItems] = useState([]); // {product_id, name, price, size, quantity, sizes}

  // Delivery
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const [delivery, setDelivery] = useState({
    first_name: "", last_name: "", address: "", apt: "", city: "", state: "", zip: "", country: "",
  });
  const [pickupLocations, setPickupLocations] = useState([]);
  const [pickupLocationId, setPickupLocationId] = useState("");

  // Contact / payment
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("manual_transfer");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (deliveryMode !== "pickup" || pickupLocations.length) return;
    getAdminPickupLocations().then((res) => setPickupLocations(res?.locations || res?.pickup_locations || res || []))
      .catch(() => {});
  }, [deliveryMode]);

  // Debounced buyer search
  useEffect(() => {
    clearTimeout(buyerTimer.current);
    if (!buyerQuery.trim()) { setBuyerResults([]); return; }
    buyerTimer.current = setTimeout(() => {
      setBuyerLoading(true);
      getUsers({search: buyerQuery.trim(), account_type: "user", limit: 8})
        .then((res) => setBuyerResults(res?.users || []))
        .catch(() => {})
        .finally(() => setBuyerLoading(false));
    }, 350);
    return () => clearTimeout(buyerTimer.current);
  }, [buyerQuery]);

  // Debounced product search
  useEffect(() => {
    clearTimeout(productTimer.current);
    if (!productQuery.trim()) { setProductResults([]); return; }
    productTimer.current = setTimeout(() => {
      setProductLoading(true);
      getProducts({search: productQuery.trim(), limit: 8})
        .then((res) => setProductResults(res?.products || []))
        .catch(() => {})
        .finally(() => setProductLoading(false));
    }, 350);
    return () => clearTimeout(productTimer.current);
  }, [productQuery]);

  const selectBuyer = (u) => {
    setBuyer(u);
    setBuyerQuery("");
    setBuyerResults([]);
    if (!contactEmail) setContactEmail(u.email || "");
  };

  const addProduct = (p) => {
    setItems((prev) => {
      if (prev.some((it) => it.product_id === p.id)) return prev;
      return [...prev, {
        product_id: p.id,
        name: p.name,
        price: p.price,
        sizes: p.sizes || [],
        size: p.sizes?.[0]?.size || "",
        quantity: 1,
      }];
    });
    setProductQuery("");
    setProductResults([]);
  };

  const updateItem = (productId, patch) => {
    setItems((prev) => prev.map((it) => (it.product_id === productId ? {...it, ...patch} : it)));
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((it) => it.product_id !== productId));
  };

  const subtotal = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);
  const total = subtotal + Number(shippingFee || 0);

  const canSubmit = buyer && items.length > 0 && contactEmail.trim() && contactPhone.trim() &&
    (deliveryMode === "pickup" ? !!pickupLocationId : (delivery.address.trim() && delivery.city.trim()));

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        user_id: buyer.id,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity) || 1,
          size: it.size || "",
          unit_price: Number(it.price) || 0,
        })),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        delivery_mode: deliveryMode,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        shipping_fee: Number(shippingFee) || 0,
        notes: notes.trim(),
      };
      if (deliveryMode === "pickup") {
        payload.pickup = {pickup_location_id: Number(pickupLocationId)};
      } else {
        payload.delivery = {...delivery};
      }

      const res = await adminCreateOrder(payload);
      toast.success("Order Created", `Order ${res?.order?.display_id || ""} created for ${buyer.first_name} ${buyer.last_name}`);
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error("Failed to Create Order", err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
      <motion.div
        initial={{scale: 0.9, opacity: 0, y: 20}} animate={{scale: 1, opacity: 1, y: 0}} exit={{scale: 0.9, opacity: 0, y: 20}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
          maxWidth: 640, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#0f0f0f", zIndex: 10,
        }}>
          <div>
            <h3 style={{color: "#fff", fontSize: 18, margin: "0 0 4px", fontWeight: 900}}>🧾 Create Order</h3>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
              Place an order for a buyer — useful when their checkout failed or they ordered via support.
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer",
            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        <div style={{padding: 24}}>
          {/* Buyer */}
          <FieldLabel>Buyer</FieldLabel>
          {buyer ? (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 8, padding: "10px 12px", marginBottom: 16,
            }}>
              <div>
                <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 2px"}}>{buyer.first_name} {buyer.last_name}</p>
                <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0}}>{buyer.email}</p>
              </div>
              <button onClick={() => setBuyer(null)} style={{
                background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 700,
              }}>Change</button>
            </div>
          ) : (
            <div style={{position: "relative", marginBottom: 16}}>
              <input
                value={buyerQuery}
                onChange={(e) => setBuyerQuery(e.target.value)}
                placeholder="Search buyer by name or email..."
                style={fieldStyle}
              />
              {(buyerLoading || buyerResults.length > 0) && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20,
                  background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  maxHeight: 220, overflowY: "auto",
                }}>
                  {buyerLoading && <p style={{padding: 10, color: "rgba(255,255,255,0.35)", fontSize: 11}}>Searching...</p>}
                  {!buyerLoading && buyerResults.map((u) => (
                    <div key={u.id} onClick={() => selectBuyer(u)} style={{
                      padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 2px"}}>{u.first_name} {u.last_name}</p>
                      <p style={{color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0}}>{u.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <FieldLabel>Items</FieldLabel>
          <div style={{position: "relative", marginBottom: 10}}>
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search product to add..."
              style={fieldStyle}
            />
            {(productLoading || productResults.length > 0) && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20,
                background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                maxHeight: 220, overflowY: "auto",
              }}>
                {productLoading && <p style={{padding: 10, color: "rgba(255,255,255,0.35)", fontSize: 11}}>Searching...</p>}
                {!productLoading && productResults.map((p) => (
                  <div key={p.id} onClick={() => addProduct(p)} style={{
                    padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)",
                    display: "flex", justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{color: "#fff", fontSize: 12}}>{p.name}</span>
                    <span style={{color: "#22c55e", fontSize: 11, fontWeight: 700}}>₦{Number(p.price || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div style={{display: "flex", flexDirection: "column", gap: 8, marginBottom: 16}}>
              {items.map((it) => (
                <div key={it.product_id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, padding: "8px 10px",
                }}>
                  <span style={{flex: 1, color: "#fff", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                    {it.name}
                  </span>
                  {it.sizes.length > 0 && (
                    <select value={it.size} onChange={(e) => updateItem(it.product_id, {size: e.target.value})}
                      style={{...fieldStyle, width: 80, padding: "6px 8px"}}>
                      {it.sizes.map((s) => <option key={s.id} value={s.size}>{s.size}</option>)}
                    </select>
                  )}
                  <input type="number" min={1} value={it.quantity}
                    onChange={(e) => updateItem(it.product_id, {quantity: Math.max(1, Number(e.target.value) || 1)})}
                    style={{...fieldStyle, width: 56, padding: "6px 8px", textAlign: "center"}} />
                  <span style={{color: "#22c55e", fontSize: 12, fontWeight: 700, width: 84, textAlign: "right"}}>
                    ₦{Number(it.price * it.quantity || 0).toLocaleString()}
                  </span>
                  <button onClick={() => removeItem(it.product_id)} style={{
                    background: "none", border: "none", color: "rgba(239,68,68,0.6)", cursor: "pointer", fontSize: 13,
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Contact */}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16}}>
            <div>
              <FieldLabel>Contact Email</FieldLabel>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <FieldLabel>Contact Phone</FieldLabel>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={fieldStyle} />
            </div>
          </div>

          {/* Delivery mode */}
          <FieldLabel>Delivery Mode</FieldLabel>
          <div style={{display: "flex", gap: 8, marginBottom: 12}}>
            {["delivery", "pickup"].map((m) => (
              <button key={m} onClick={() => setDeliveryMode(m)} style={{
                flex: 1, padding: "9px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                cursor: "pointer", background: deliveryMode === m ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${deliveryMode === m ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: deliveryMode === m ? "#ef4444" : "rgba(255,255,255,0.5)",
              }}>{m}</button>
            ))}
          </div>

          {deliveryMode === "pickup" ? (
            <div style={{marginBottom: 16}}>
              <FieldLabel>Pickup Location</FieldLabel>
              <select value={pickupLocationId} onChange={(e) => setPickupLocationId(e.target.value)} style={fieldStyle}>
                <option value="">Select a pickup location...</option>
                {pickupLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} — {loc.city}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16}}>
              <div><FieldLabel>First Name</FieldLabel><input value={delivery.first_name} onChange={(e) => setDelivery((d) => ({...d, first_name: e.target.value}))} style={fieldStyle} /></div>
              <div><FieldLabel>Last Name</FieldLabel><input value={delivery.last_name} onChange={(e) => setDelivery((d) => ({...d, last_name: e.target.value}))} style={fieldStyle} /></div>
              <div style={{gridColumn: "1 / -1"}}><FieldLabel>Address</FieldLabel><input value={delivery.address} onChange={(e) => setDelivery((d) => ({...d, address: e.target.value}))} style={fieldStyle} /></div>
              <div><FieldLabel>Apt / Unit</FieldLabel><input value={delivery.apt} onChange={(e) => setDelivery((d) => ({...d, apt: e.target.value}))} style={fieldStyle} /></div>
              <div><FieldLabel>City</FieldLabel><input value={delivery.city} onChange={(e) => setDelivery((d) => ({...d, city: e.target.value}))} style={fieldStyle} /></div>
              <div><FieldLabel>State</FieldLabel><input value={delivery.state} onChange={(e) => setDelivery((d) => ({...d, state: e.target.value}))} style={fieldStyle} /></div>
              <div><FieldLabel>Zip / Postal Code</FieldLabel><input value={delivery.zip} onChange={(e) => setDelivery((d) => ({...d, zip: e.target.value}))} style={fieldStyle} /></div>
              <div><FieldLabel>Country</FieldLabel><input value={delivery.country} onChange={(e) => setDelivery((d) => ({...d, country: e.target.value}))} style={fieldStyle} /></div>
            </div>
          )}

          {/* Payment */}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16}}>
            <div>
              <FieldLabel>Shipping Fee</FieldLabel>
              <input type="number" min={0} value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <FieldLabel>Payment Method</FieldLabel>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={fieldStyle}>
                <option value="manual_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="admin_created">Other</option>
              </select>
            </div>
            <div>
              <FieldLabel>Payment Status</FieldLabel>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={fieldStyle}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <FieldLabel>Admin Notes</FieldLabel>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for creating this order manually..."
            style={{...fieldStyle, minHeight: 60, resize: "vertical", marginBottom: 18}} />

          {/* Totals */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10, padding: "12px 14px", marginBottom: 20,
          }}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: 4}}>
              <span style={{color: "rgba(255,255,255,0.5)", fontSize: 12}}>Subtotal</span>
              <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>₦{subtotal.toLocaleString()}</span>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: 4}}>
              <span style={{color: "rgba(255,255,255,0.5)", fontSize: 12}}>Shipping</span>
              <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>₦{Number(shippingFee || 0).toLocaleString()}</span>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)"}}>
              <span style={{color: "#22c55e", fontSize: 13, fontWeight: 700}}>Total</span>
              <span style={{color: "#22c55e", fontSize: 15, fontWeight: 900, fontFamily: "monospace"}}>₦{total.toLocaleString()}</span>
            </div>
          </div>

          <div style={{display: "flex", gap: 10}}>
            <button onClick={onClose} disabled={submitting} style={{
              flex: 1, padding: "12px 20px", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
              borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
            }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
              flex: 2, padding: "12px 20px",
              background: (!canSubmit || submitting) ? "rgba(239,68,68,0.25)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              border: "none", color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 900,
              cursor: (!canSubmit || submitting) ? "not-allowed" : "pointer",
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              {submitting ? "Creating..." : "🧾 Create Order"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main AdminOrders page ─────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [payoutOrderId, setPayoutOrderId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fetchTick, setFetchTick] = useState(0);
  const searchTimer = useRef(null);
  const {toasts, toast, removeToast} = useToast();

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setFetchTick((t) => t + 1), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {limit: 25};
    if (statusFilter) params.status = statusFilter;
    if (search.trim()) params.search = search.trim();

    getOrders(params)
      .then((d) => {
        if (cancelled) return;
        setOrders(d?.orders || []);
        setTotal(d?.total ?? 0);
      })
      .catch((e) => { if (!cancelled) console.error(e); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [statusFilter, fetchTick]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? {...o, status} : o)));
    } catch (e) {
      toast.error("Update Failed", e.message || "Could not update order status");
    }
  };

  const handlePaymentStatusChange = async (id, payment_status) => {
    try {
      await updateOrderStatus(id, {payment_status});
      setOrders((prev) => prev.map((o) => (o.id === id ? {...o, payment_status} : o)));
    } catch (e) {
      toast.error("Update Failed", e.message || "Could not update payment status");
    }
  };

  const handleDelete = async () => {
    const id = confirm;
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Order Deleted", "The order has been permanently removed");
    } catch (e) {
      toast.error("Delete Failed", e.message || "Could not delete order");
    }
    setConfirm(null);
    setSelectedId(null);
  };

  const cols = [
    {
      key: "display_id",
      label: "Order ID",
      render: (o) => (
        <span style={{fontFamily: "monospace", color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700}}>
          {o.display_id || `#${o.id}`}
        </span>
      ),
    },
    {
      key: "buyer",
      label: "Buyer",
      render: (o) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>{o.buyer_name || "—"}</p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>{o.buyer_email || "—"}</p>
        </div>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (o) => (
        <div>
          <span style={{color: "#22c55e", fontWeight: 800, fontSize: 13}}>
            ₦{Number(o.total || 0).toLocaleString()}
          </span>
          <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0}}>
            {o.item_count || 0} item{o.item_count !== 1 ? "s" : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (o) => (
        <div style={{display: "flex", flexDirection: "column", gap: 4}}>
          <Badge label={o.status || "pending"} color={STATUS_COLORS[o.status] || "#fff"} />
          <Badge label={o.payment_status || "unpaid"} color={PAYMENT_STATUS_COLORS[o.payment_status] || "#6b7280"} />
        </div>
      ),
    },
    {
      key: "created",
      label: "Date",
      render: (o) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmtDate(o.created_at)}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (o) => (
        <TablePayButton
          order={o}
          onPayoutClick={setPayoutOrderId}
          onMarkComplete={() => setFetchTick((t) => t + 1)}
          toast={toast}
        />
      ),
    },
  ];

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>

      {/* Global Toast Renderer */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <AnimatePresence>
        {selectedId && (
          <OrderDrawer
            orderId={selectedId}
            onClose={() => setSelectedId(null)}
            onStatusChange={handleStatusChange}
            onPaymentStatusChange={handlePaymentStatusChange}
            onDelete={(id) => {
              setSelectedId(null);
              setConfirm(id);
            }}
            onPayoutClick={setPayoutOrderId}
            toast={toast}
          />
        )}
        {payoutOrderId && (
          <PayoutModal
            orderId={payoutOrderId}
            onClose={() => setPayoutOrderId(null)}
            onSuccess={() => {
              setFetchTick((t) => t + 1);
              setSelectedId(null);
            }}
            toast={toast}
          />
        )}
        {confirm && (
          <ConfirmModal
            title="Delete Order"
            message="Permanently delete this order and all its items? This cannot be undone."
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          />
        )}
        {showCreateModal && (
          <CreateOrderModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => setFetchTick((t) => t + 1)}
            toast={toast}
          />
        )}
      </AnimatePresence>

      <div style={{display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap"}}>
        {[{v: "", l: "All"}, ...ALL_STATUSES.map((s) => ({v: s, l: s}))].map(({v, l}) => (
          <button
            key={v}
            onClick={() => setStatusFilter(v)}
            style={{
              padding: "6px 14px", borderRadius: 99,
              border: `1px solid ${statusFilter === v ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: statusFilter === v ? "rgba(239,68,68,0.1)" : "transparent",
              color: statusFilter === v ? "#ef4444" : "rgba(255,255,255,0.45)",
              fontSize: 10, fontWeight: 700, cursor: "pointer",
              textTransform: "capitalize", transition: "all 0.15s",
            }}>
            {l || "All"}
          </button>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by order ID, buyer name or email..."
        actions={
          <>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "10px 16px", background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                border: "none", color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 800,
                cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 15px rgba(239,68,68,0.3)",
              }}>
              🧾 New Order
            </button>
            <button
              onClick={() => setFetchTick((t) => t + 1)}
              style={{
                padding: "10px 16px", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}>
              Refresh
            </button>
          </>
        }
      />

      <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden"}}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} order{total !== 1 ? "s" : ""}
            {statusFilter && ` · ${statusFilter}`}
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
            Click a row to view details
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={orders}
          loading={loading}
          onRowClick={(o) => setSelectedId(o.id)}
          emptyMsg="No orders found."
        />
      </div>
    </div>
  );
}
