import {useState, useEffect, useRef} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {
  getAllBrandBankAccounts,
  getBrandBankAccountById,
  adminUpdateBrandBankAccount,
  deleteBrandBankAccount,
  verifyBankAccount,
  unverifyBankAccount,
} from "./dashboard_components/api";
import {AdminTable, Badge, SearchBar, ConfirmModal} from "./Components";

const VERIFICATION_STATUS = {
  verified: {color: "#22c55e", label: "Verified"},
  pending: {color: "#f59e0b", label: "Pending"},
  rejected: {color: "#ef4444", label: "Rejected"},
};

const ACCOUNT_TYPES = {
  savings: "Savings",
  current: "Current",
};

function fmtDate(iso, withTime = false) {
  if (!iso) return "—";
  const opts = {day: "numeric", month: "short", year: "numeric"};
  if (withTime) {
    opts.hour = "2-digit";
    opts.minute = "2-digit";
  }
  return new Date(iso).toLocaleDateString("en-GB", opts);
}

// ── Section Header ────────────────────────────────────────────────────────────
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

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({label, value, mono = false}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        gap: 12,
      }}>
      <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>{label}</span>
      <span
        style={{
          color: "rgba(255,255,255,0.8)",
          fontSize: 11,
          fontWeight: mono ? 700 : 600,
          fontFamily: mono ? "monospace" : "inherit",
          textAlign: "right",
          maxWidth: "65%",
          wordBreak: "break-word",
        }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── Account Detail Drawer ─────────────────────────────────────────────────────
function AccountDrawer({accountId, onClose, onUpdate, onDelete, onVerify, onUnverify}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifyConfirm, setVerifyConfirm] = useState(false);
  const [unverifyConfirm, setUnverifyConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBrandBankAccountById(accountId)
      .then((d) => {
        if (!cancelled) {
          setData(d);
setForm({
  bank_name: d.bank_name || "",
  paystack_bank_code: d.paystack_bank_code || "",        // ✅ Changed
  flutterwave_bank_code: d.flutterwave_bank_code || "",  // ✅ Changed
  account_number: d.account_number || "",
  account_name: d.account_name || "",
  account_type: d.account_type || "savings",
  currency: d.currency || "NGN",
  notes: d.notes || "",
});
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await onUpdate(accountId, form);
      const updated = await getBrandBankAccountById(accountId);
      setData(updated);
      setEditing(false);
      setSuccess("Bank account updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message || "Failed to update account");
    } finally {
      setSaving(false);
    }
  };

const handleVerify = async () => {
  setProcessing(true);
  setError("");
  setSuccess("");
  try {
    const result = await onVerify(accountId);
    const updated = await getBrandBankAccountById(accountId);
    setData(updated);
    
    // ✅ Check for warnings
    if (result?.warnings && result.warnings.length > 0) {
      setSuccess("✅ Verified! ⚠️ " + result.warnings.join(" | "));
      setTimeout(() => setSuccess(""), 5000); // Show longer for warnings
    } else {
      setSuccess("Bank account verified successfully!");
      setTimeout(() => setSuccess(""), 3000);
    }
  } catch (e) {
    setError(e.message || "Failed to verify account");
  } finally {
    setProcessing(false);
    setVerifyConfirm(false);
  }
};

  const handleUnverify = async () => {
    setProcessing(true);
    setError("");
    setSuccess("");
    try {
      await onUnverify(accountId);
      const updated = await getBrandBankAccountById(accountId);
      setData(updated);
      setSuccess("Bank account unverified successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message || "Failed to unverify account");
    } finally {
      setProcessing(false);
      setUnverifyConfirm(false);
    }
  };

  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 12,
    padding: "10px 12px",
    borderRadius: 8,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  return (
    <>
      <AnimatePresence>
        {/* ── Custom Verify Modal — full loading-state control ── */}
        {verifyConfirm && (
          <motion.div
            key="verify-backdrop"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
              zIndex: 1100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}>
            <motion.div
              key="verify-dialog"
              initial={{opacity: 0, scale: 0.95, y: 16}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.95, y: 16}}
              transition={{type: "spring", stiffness: 340, damping: 28}}
              style={{
                background: "#111",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16,
                padding: 28,
                maxWidth: 400,
                width: "100%",
                boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
              }}>
              {/* Icon + Title */}
              <div style={{display: "flex", alignItems: "center", gap: 14, marginBottom: 16}}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                  <svg width="20" height="20" fill="#22c55e" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: "0.01em",
                  }}>
                  Verify Bank Account
                </h3>
              </div>

              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: "0 0 8px",
                }}>
                Verify this bank account? The brand will be able to receive payouts once verified.
              </p>

              {/* Gateway note */}
              <div
                style={{
                  background: "rgba(139,92,246,0.07)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 24,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: 1.5,
                }}>
                This will create a Paystack recipient and mark the account ready for Flutterwave transfers.
              </div>

              {/* Buttons */}
              <div style={{display: "flex", gap: 10}}>
                <button
                  onClick={() => !processing && setVerifyConfirm(false)}
                  disabled={processing}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                    borderRadius: 9,
                    padding: "12px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: processing ? "not-allowed" : "pointer",
                    opacity: processing ? 0.4 : 1,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}>
                  Cancel
                </button>

                <button
                  onClick={handleVerify}
                  disabled={processing}
                  style={{
                    flex: 2,
                    background: processing ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.9)",
                    border: `1px solid ${processing ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.6)"}`,
                    color: processing ? "rgba(34,197,94,0.7)" : "#fff",
                    borderRadius: 9,
                    padding: "12px",
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: processing ? "not-allowed" : "pointer",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}>
                  {processing ? (
                    <>
                      <span
                        style={{
                          display: "inline-block",
                          width: 13,
                          height: 13,
                          border: "2px solid rgba(34,197,94,0.25)",
                          borderTop: "2px solid #22c55e",
                          borderRadius: "50%",
                          animation: "spin 0.75s linear infinite",
                          flexShrink: 0,
                        }}
                      />
                      Verifying Account...
                    </>
                  ) : (
                    "Verify Account"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {unverifyConfirm && (
          <ConfirmModal
            title="Unverify Bank Account"
            message="Unverify this bank account? Payouts will be blocked until re-verified."
            confirmLabel="Unverify"
            danger={true}
            onConfirm={handleUnverify}
            onCancel={() => setUnverifyConfirm(false)}
          />
        )}
      </AnimatePresence>

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
          alignItems: "flex-start",
          justifyContent: "flex-end",
        }}>
        <motion.div
          initial={{x: "100%"}}
          animate={{x: 0}}
          exit={{x: "100%"}}
          transition={{type: "spring", stiffness: 300, damping: 30}}
          style={{
            width: "min(600px,100vw)",
            height: "100vh",
            background: "#0f0f0f",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}>
          {/* Header */}
          <div
            style={{
              padding: "18px 22px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              position: "sticky",
              top: 0,
              background: "#0f0f0f",
              zIndex: 10,
            }}>
            {loading ? (
              <div
                style={{
                  height: 36,
                  width: 140,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 7,
                  animation: "pulse 1.4s infinite",
                }}
              />
            ) : (
              <div>
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    margin: "0 0 2px",
                  }}>
                  Bank Account
                </p>
                <p
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 900,
                    margin: 0,
                  }}>
                  {data?.brand_name || "Unknown Brand"}
                </p>
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              ✕
            </button>
          </div>

          {loading ? (
            <div style={{padding: 22, display: "flex", flexDirection: "column", gap: 10}}>
              {Array.from({length: 12}).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 28,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 6,
                    animation: "pulse 1.4s infinite",
                    animationDelay: `${i * 0.07}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{padding: "16px 22px 80px", flex: 1}}>
              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{opacity: 0, y: -10}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0}}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 16,
                      color: "#ef4444",
                      fontSize: 12,
                    }}>
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{opacity: 0, y: -10}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0}}
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 16,
                      color: "#22c55e",
                      fontSize: 12,
                    }}>
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verification Status */}
              <div
                style={{
                  background: data?.is_verified
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(249,115,22,0.1)",
                  border: `1px solid ${data?.is_verified ? "rgba(34,197,94,0.2)" : "rgba(249,115,22,0.2)"}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}>
                {data?.is_verified ? (
                  <svg width="18" height="18" fill="#22c55e" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="#f97316" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <div style={{flex: 1}}>
                  <p
                    style={{
                      color: data?.is_verified ? "#22c55e" : "#f97316",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      margin: "0 0 2px",
                    }}>
                    {data?.is_verified ? "Verified Account" : "Pending Verification"}
                  </p>
                  <p style={{color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0}}>
                    {data?.is_verified
                      ? `Verified on ${fmtDate(data.verified_at)}`
                      : "Account requires verification"}
                  </p>
                </div>
              </div>

              {/* Edit Mode */}
              {editing ? (
                <div
                  style={{
                    background: "#0d0d0d",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 18,
                  }}>
                  <SectionHeader style={{marginTop: 0}}>Edit Account Details</SectionHeader>

                  <div style={{display: "flex", flexDirection: "column", gap: 14}}>
{/* Bank Name */}
<div>
  <label
    style={{
      color: "rgba(255,255,255,0.5)",
      fontSize: 10,
      fontWeight: 700,
      display: "block",
      marginBottom: 6,
    }}>
    Bank Name
  </label>
  <input
    type="text"
    value={form.bank_name}
    onChange={(e) => setForm({...form, bank_name: e.target.value})}
    style={inp}
    onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
  />
</div>

{/* ✅ Paystack Bank Code */}
<div>
  <label
    style={{
      color: "rgba(255,255,255,0.5)",
      fontSize: 10,
      fontWeight: 700,
      display: "block",
      marginBottom: 6,
    }}>
    Paystack Bank Code <span style={{color: "#ef4444"}}>*</span>
  </label>
  <input
    type="text"
    required
    placeholder="e.g. 999992 for OPay"
    value={form.paystack_bank_code}
    onChange={(e) => setForm({...form, paystack_bank_code: e.target.value})}
    style={inp}
    onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
  />
  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, margin: "4px 0 0"}}>
    Used for Paystack transfers
  </p>
</div>

{/* ✅ Flutterwave Bank Code */}
<div>
  <label
    style={{
      color: "rgba(255,255,255,0.5)",
      fontSize: 10,
      fontWeight: 700,
      display: "block",
      marginBottom: 6,
    }}>
    Flutterwave Bank Code <span style={{color: "#ef4444"}}>*</span>
  </label>
  <input
    type="text"
    required
    placeholder="e.g. 305 for OPay"
    value={form.flutterwave_bank_code}
    onChange={(e) => setForm({...form, flutterwave_bank_code: e.target.value})}
    style={inp}
    onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
  />
  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, margin: "4px 0 0"}}>
    Used for Flutterwave transfers
  </p>
</div>
                    <div>
                      <label
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "block",
                          marginBottom: 6,
                        }}>
                        Bank Code
                      </label>
                      <input
                        type="text"
                        value={form.bank_code}
                        onChange={(e) => setForm({...form, bank_code: e.target.value})}
                        style={inp}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "block",
                          marginBottom: 6,
                        }}>
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={form.account_number}
                        onChange={(e) => setForm({...form, account_number: e.target.value})}
                        style={inp}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "block",
                          marginBottom: 6,
                        }}>
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={form.account_name}
                        onChange={(e) => setForm({...form, account_name: e.target.value})}
                        style={inp}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "block",
                          marginBottom: 6,
                        }}>
                        Account Type
                      </label>
                      <select
                        value={form.account_type}
                        onChange={(e) => setForm({...form, account_type: e.target.value})}
                        style={{...inp, cursor: "pointer"}}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}>
                        <option value="savings">Savings</option>
                        <option value="current">Current</option>
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "block",
                          marginBottom: 6,
                        }}>
                        Currency
                      </label>
                      <input
                        type="text"
                        value={form.currency}
                        onChange={(e) => setForm({...form, currency: e.target.value})}
                        style={inp}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: 10,
                          fontWeight: 700,
                          display: "block",
                          marginBottom: 6,
                        }}>
                        Admin Notes
                      </label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm({...form, notes: e.target.value})}
                        rows={3}
                        style={{...inp, resize: "vertical"}}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                        placeholder="Internal notes about this account..."
                      />
                    </div>
                  </div>

                  <div style={{display: "flex", gap: 10, marginTop: 16}}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        flex: 1,
                        background: saving ? "#7f1d1d" : "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "11px",
                        fontSize: 11,
                        fontWeight: 900,
                        cursor: saving ? "not-allowed" : "pointer",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
onClick={() => {
  setEditing(false);
  setForm({
    bank_name: data.bank_name || "",
    paystack_bank_code: data.paystack_bank_code || "",        // ✅ Changed
    flutterwave_bank_code: data.flutterwave_bank_code || "",  // ✅ Changed
    account_number: data.account_number || "",
    account_name: data.account_name || "",
    account_type: data.account_type || "savings",
    currency: data.currency || "NGN",
    notes: data.notes || "",
  });
}}
                      disabled={saving}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.6)",
                        borderRadius: 8,
                        padding: "11px 18px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: saving ? "not-allowed" : "pointer",
                      }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* View Mode - Brand Info */}
                  <SectionHeader style={{marginTop: 0}}>Brand Information</SectionHeader>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 18,
                    }}>
                    <InfoRow label="Brand Name" value={data?.brand_name} />
                    <InfoRow label="Brand Email" value={data?.brand_email} />
                    {data?.brand_phone && <InfoRow label="Phone" value={data.brand_phone} />}
                  </div>

{/* Bank Details */}
<SectionHeader>Bank Account Details</SectionHeader>
<div
  style={{
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 18,
  }}>
  <InfoRow label="Bank Name" value={data?.bank_name} />
  <InfoRow label="Paystack Bank Code" value={data?.paystack_bank_code} mono />
  <InfoRow label="Flutterwave Bank Code" value={data?.flutterwave_bank_code} mono />
  <InfoRow label="Account Number" value={data?.account_number} mono />
  <InfoRow label="Account Name" value={data?.account_name} />
  <InfoRow
    label="Account Type"
    value={ACCOUNT_TYPES[data?.account_type] || data?.account_type}
  />
  <InfoRow label="Currency" value={data?.currency} />
</div>

                  {/* Gateway Info */}
                  {(data?.paystack_recipient_code || data?.flutterwave_recipient_id) && (
                    <>
                      <SectionHeader>Payment Gateway Details</SectionHeader>
                      <div
                        style={{
                          background: "rgba(139,92,246,0.05)",
                          border: "1px solid rgba(139,92,246,0.15)",
                          borderRadius: 10,
                          padding: "14px 16px",
                          marginBottom: 18,
                        }}>
                        {data?.paystack_recipient_code && (
                          <InfoRow
                            label="Paystack Recipient"
                            value={data.paystack_recipient_code}
                            mono
                          />
                        )}
                        {data?.flutterwave_recipient_id && (
                          <InfoRow
                            label="Flutterwave Recipient"
                            value={data.flutterwave_recipient_id}
                            mono
                          />
                        )}
                      </div>
                    </>
                  )}

                  {/* Admin Notes */}
                  {data?.notes && (
                    <>
                      <SectionHeader>Admin Notes</SectionHeader>
                      <div
                        style={{
                          background: "rgba(59,130,246,0.05)",
                          border: "1px solid rgba(59,130,246,0.15)",
                          borderRadius: 10,
                          padding: "12px 14px",
                          marginBottom: 18,
                        }}>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: 11,
                            lineHeight: 1.6,
                            margin: 0,
                          }}>
                          {data.notes}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Metadata */}
                  <SectionHeader>Account Information</SectionHeader>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "14px 16px",
                      marginBottom: 18,
                    }}>
                    <InfoRow label="Status" value={data?.is_active ? "Active" : "Inactive"} />
                    <InfoRow
                      label="Verified"
                      value={data?.is_verified ? `Yes (${fmtDate(data.verified_at)})` : "No"}
                    />
                    <InfoRow label="Created" value={fmtDate(data?.created_at, true)} />
                    <InfoRow label="Last Updated" value={fmtDate(data?.updated_at, true)} />
                  </div>

                  {/* Action Buttons */}
                  <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        width: "100%",
                        padding: "11px 16px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#ef4444",
                        borderRadius: 9,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                        e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                        e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                      }}>
                      ✏️ Edit Account Details
                    </button>

{data?.is_verified ? (
  <button
    onClick={() => setUnverifyConfirm(true)}
    disabled={processing}
    style={{
      width: "100%",
      padding: "11px 16px",
      background: "rgba(249,115,22,0.1)",
      border: "1px solid rgba(249,115,22,0.3)",
      color: "#f97316",
      borderRadius: 9,
      fontSize: 11,
      fontWeight: 700,
      cursor: processing ? "not-allowed" : "pointer",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      transition: "all 0.2s",
      opacity: processing ? 0.5 : 1,
    }}
    onMouseEnter={(e) => {
      if (!processing) {
        e.currentTarget.style.background = "rgba(249,115,22,0.15)";
        e.currentTarget.style.borderColor = "rgba(249,115,22,0.5)";
      }
    }}
    onMouseLeave={(e) => {
      if (!processing) {
        e.currentTarget.style.background = "rgba(249,115,22,0.1)";
        e.currentTarget.style.borderColor = "rgba(249,115,22,0.3)";
      }
    }}>
    {processing ? "Processing..." : "❌ Unverify Account"}
  </button>
) : (
  <button
    onClick={() => setVerifyConfirm(true)}
    disabled={processing}
    style={{
      width: "100%",
      padding: "11px 16px",
      background: processing ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.1)",  // ✅ Dimmed when processing
      border: "1px solid rgba(34,197,94,0.3)",
      color: processing ? "rgba(34,197,94,0.5)" : "#22c55e",  // ✅ Faded color when processing
      borderRadius: 9,
      fontSize: 11,
      fontWeight: 700,
      cursor: processing ? "not-allowed" : "pointer",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      transition: "all 0.2s",
      opacity: processing ? 0.6 : 1,  // ✅ Opacity change
      position: "relative",  // ✅ For spinner
    }}
    onMouseEnter={(e) => {
      if (!processing) {
        e.currentTarget.style.background = "rgba(34,197,94,0.15)";
        e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)";
      }
    }}
    onMouseLeave={(e) => {
      if (!processing) {
        e.currentTarget.style.background = "rgba(34,197,94,0.1)";
        e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
      }
    }}>
    {/* ✅ Add spinner when processing */}
    {processing && (
      <span
        style={{
          display: "inline-block",
          width: 12,
          height: 12,
          border: "2px solid rgba(34,197,94,0.3)",
          borderTop: "2px solid #22c55e",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginRight: 8,
        }}
      />
    )}
    {processing ? "Verifying Account..." : "✅ Verify Account"}
  </button>
)}
                    <button
                      onClick={() => onDelete(accountId)}
                      style={{
                        width: "100%",
                        padding: "11px 16px",
                        background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        color: "rgba(239,68,68,0.6)",
                        borderRadius: 9,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.05)";
                        e.currentTarget.style.color = "rgba(239,68,68,0.6)";
                      }}>
                      🗑️ Delete Account
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>

<style>{`
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`}</style>
      </motion.div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminBankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [fetchTick, setFetchTick] = useState(0);
  const searchTimer = useRef(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setFetchTick((t) => t + 1), 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = {limit: 50};
    if (statusFilter === "verified") params.verified = "true";
    if (statusFilter === "pending") params.verified = "false";
    if (search.trim()) params.search = search.trim();

    getAllBrandBankAccounts(params)
      .then((d) => {
        if (cancelled) return;
        setAccounts(Array.isArray(d?.accounts) ? d.accounts : Array.isArray(d) ? d : []);
        setTotal(d?.total ?? (d?.accounts?.length || 0));
      })
      .catch((e) => {
        if (!cancelled) console.error(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [statusFilter, fetchTick]);

  const handleUpdate = async (id, data) => {
    await adminUpdateBrandBankAccount(id, data);
    setFetchTick((t) => t + 1);
  };

const handleVerify = async (id) => {
    const result = await verifyBankAccount(id);  // ✅ capture result
    setFetchTick((t) => t + 1);
    return result;  // ✅ return it so the drawer can read warnings
};

  const handleUnverify = async (id) => {
    await unverifyBankAccount(id);
    setFetchTick((t) => t + 1);
  };

  const handleDelete = async () => {
    const id = confirm;
    try {
      await deleteBrandBankAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      alert(e.message || "Failed to delete account");
    }
    setConfirm(null);
    setSelectedId(null);
  };

  const cols = [
    {
      key: "brand",
      label: "Brand",
      render: (a) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>
            {a.brand_name || "—"}
          </p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
            {a.brand_email || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "bank",
      label: "Bank Details",
      render: (a) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 11, margin: "0 0 2px"}}>
            {a.bank_name || "—"}
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 10,
              margin: 0,
              fontFamily: "monospace",
            }}>
            {a.account_number || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "account_name",
      label: "Account Name",
      render: (a) => (
        <span style={{color: "rgba(255,255,255,0.7)", fontSize: 11}}>
          {a.account_name || "—"}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (a) => (
        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 11,
            textTransform: "capitalize",
          }}>
          {ACCOUNT_TYPES[a.account_type] || a.account_type || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (a) => (
        <div style={{display: "flex", flexDirection: "column", gap: 4}}>
          <Badge
            label={a.is_verified ? "Verified" : "Pending"}
            color={a.is_verified ? "#22c55e" : "#f59e0b"}
          />
          {!a.is_active && <Badge label="Inactive" color="#6b7280" />}
        </div>
      ),
    },
    {
      key: "created",
      label: "Created",
      render: (a) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>
          {fmtDate(a.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AnimatePresence>
        {selectedId && (
          <AccountDrawer
            accountId={selectedId}
            onClose={() => setSelectedId(null)}
            onUpdate={handleUpdate}
            onVerify={handleVerify}
            onUnverify={handleUnverify}
            onDelete={(id) => {
              setSelectedId(null);
              setConfirm(id);
            }}
          />
        )}
        {confirm && (
          <ConfirmModal
            title="Delete Bank Account"
            message="Permanently delete this bank account? This cannot be undone and may affect pending payouts."
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Filter Pills */}
      <div style={{display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap"}}>
        {[
          {v: "", l: "All"},
          {v: "verified", l: "Verified"},
          {v: "pending", l: "Pending"},
        ].map(({v, l}) => (
          <button
            key={v}
            onClick={() => setStatusFilter(v)}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              border: `1px solid ${statusFilter === v ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: statusFilter === v ? "rgba(239,68,68,0.1)" : "transparent",
              color: statusFilter === v ? "#ef4444" : "rgba(255,255,255,0.45)",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.15s",
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by brand name, email, account number..."
        actions={
          <button
            onClick={() => setFetchTick((t) => t + 1)}
            style={{
              padding: "10px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              borderRadius: 9,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
            Refresh
          </button>
        }
      />

      {/* Stats Bar */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          padding: "12px 18px",
          marginBottom: 18,
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
        }}>
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 4px",
            }}>
            Total Accounts
          </p>
          <p style={{color: "#fff", fontSize: 18, fontWeight: 900, margin: 0}}>
            {total.toLocaleString()}
          </p>
        </div>
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 4px",
            }}>
            Verified
          </p>
          <p style={{color: "#22c55e", fontSize: 18, fontWeight: 900, margin: 0}}>
            {accounts.filter((a) => a.is_verified).length}
          </p>
        </div>
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: "0 0 4px",
            }}>
            Pending
          </p>
          <p style={{color: "#f59e0b", fontSize: 18, fontWeight: 900, margin: 0}}>
            {accounts.filter((a) => !a.is_verified).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            {statusFilter && ` · ${statusFilter}`}
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
            Click a row to view details
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={accounts}
          loading={loading}
          onRowClick={(a) => setSelectedId(a.id)}
          emptyMsg="No bank accounts found."
        />
      </div>
    </div>
  );
}
