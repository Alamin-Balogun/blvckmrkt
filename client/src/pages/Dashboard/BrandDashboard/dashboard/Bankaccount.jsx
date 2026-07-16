import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  getBrandBankAccount,
  createBrandBankAccount,
  updateBrandBankAccount,
} from "./dashboard_components/api";
import CurrencyInput from "../../../../components/currencyinput";
import BankInput, {BANKS} from "../../../../components/bankinput";

export default function BankAccount() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Track which bank was selected from the dropdown
  // If selectedBank has non-empty codes → code inputs are locked (disabled)
  const [selectedBank, setSelectedBank] = useState(null);

  const [form, setForm] = useState({
    bank_name: "",
    paystack_bank_code: "",
    flutterwave_bank_code: "",
    account_number: "",
    account_name: "",
    account_type: "savings",
    currency: "NGN",
  });

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBrandBankAccount();
      setAccount(data);
      const loaded = {
        bank_name: data.bank_name || "",
        paystack_bank_code: data.paystack_bank_code || "",
        flutterwave_bank_code: data.flutterwave_bank_code || "",
        account_number: data.account_number || "",
        account_name: data.account_name || "",
        account_type: data.account_type || "savings",
        currency: data.currency || "NGN",
      };
      setForm(loaded);
      // Try to restore the selectedBank from our list
      const match = BANKS.find((b) => b.name === data.bank_name);
      setSelectedBank(match || null);
    } catch (err) {
      if (!err.message.includes("not found")) {
        console.error(err);
      }
      setEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      if (account) {
        await updateBrandBankAccount(form);
        setSuccess("Bank account updated successfully!");
      } else {
        await createBrandBankAccount(form);
        setSuccess("Bank account created successfully!");
      }
      await loadAccount();
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save bank account");
    } finally {
      setSaving(false);
    }
  };

  // When a bank is picked from the dropdown
  const handleBankSelect = (bank) => {
    setSelectedBank(bank.name ? bank : null);
    setForm((prev) => ({
      ...prev,
      bank_name: bank.name,
      paystack_bank_code: bank.paystack_code || prev.paystack_bank_code,
      flutterwave_bank_code: bank.flutterwave_code || prev.flutterwave_bank_code,
    }));
  };

  // Whether the code fields are locked (bank has known codes)
  const codesLocked = !!(selectedBank && selectedBank.paystack_code !== "");

  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 13,
    padding: "11px 14px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  const inpDisabled = {
    ...inp,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.4)",
    cursor: "not-allowed",
  };

  const labelStyle = {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: 6,
  };

  const focus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
  const blur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)");

  if (loading) {
    return (
      <div style={{padding: 20, textAlign: "center"}}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(239,68,68,0.2)",
            borderTop: "3px solid #ef4444",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13}}>Loading bank account...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        select option { background: #111 !important; color: #fff !important; }
        select option:checked { background: #ef4444 !important; color: #fff !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{marginBottom: 24}}>
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(1.6rem,3vw,2.2rem)",
            color: "#fff",
            letterSpacing: "0.04em",
            margin: "0 0 8px",
          }}>
          BANK ACCOUNT
        </h2>
        <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0}}>
          Manage your payout account details. This is where you'll receive payments for your orders.
        </p>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
              color: "#ef4444",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
              color: "#22c55e",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!editing && account ? (
        /* ── View Mode ── */
        <motion.div
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            overflow: "hidden",
          }}>
          {/* Status Banner */}
          <div
            style={{
              background: account.is_verified ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
              borderBottom: `1px solid ${account.is_verified ? "rgba(34,197,94,0.2)" : "rgba(249,115,22,0.2)"}`,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            <div style={{display: "flex", alignItems: "center", gap: 10}}>
              {account.is_verified ? (
                <svg width="18" height="18" fill="#22c55e" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg width="18" height="18" fill="#f97316" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                <p
                  style={{
                    color: account.is_verified ? "#22c55e" : "#f97316",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    margin: "0 0 2px",
                  }}>
                  {account.is_verified ? "Verified Account" : "Pending Verification"}
                </p>
                <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0}}>
                  {account.is_verified
                    ? "Your account is ready to receive payouts"
                    : "Awaiting admin verification"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
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
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              }}>
              Edit Details
            </button>
          </div>

          {/* Account Details */}
          <div style={{padding: 24}}>
            <div style={{display: "grid", gap: 20}}>
              {/* Bank Info */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: "16px 18px",
                }}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}>
                  Bank Information
                </p>
                <div style={{display: "grid", gap: 12}}>
                  <div>
                    <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 4px"}}>
                      Bank Name
                    </p>
                    <p style={{color: "#fff", fontSize: 14, fontWeight: 700, margin: 0}}>
                      {account.bank_name}
                    </p>
                  </div>
                  <div>
                    <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 4px"}}>
                      Account Number
                    </p>
                    <p style={{color: "#fff", fontSize: 16, fontWeight: 900, fontFamily: "monospace", letterSpacing: "0.1em", margin: 0}}>
                      {account.account_number}
                    </p>
                  </div>
                  <div>
                    <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 4px"}}>
                      Account Name
                    </p>
                    <p style={{color: "#fff", fontSize: 14, fontWeight: 700, margin: 0}}>
                      {account.account_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}>
                  <p style={{color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 4px"}}>
                    Account Type
                  </p>
                  <p style={{color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "capitalize", margin: 0}}>
                    {account.account_type}
                  </p>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}>
                  <p style={{color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "0 0 4px"}}>
                    Currency
                  </p>
                  <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>
                    {account.currency}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              {account.verified_at && (
                <div
                  style={{
                    background: "rgba(34,197,94,0.05)",
                    border: "1px solid rgba(34,197,94,0.15)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                  }}>
                  ✓ Verified on{" "}
                  {new Date(account.verified_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        /* ── Edit/Create Mode ── */
        <motion.div
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            overflow: "hidden",
          }}>
          <div
            style={{
              background: "rgba(239,68,68,0.05)",
              borderBottom: "1px solid rgba(239,68,68,0.15)",
              padding: "16px 20px",
            }}>
            <h3 style={{color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 4px"}}>
              {account ? "Edit Bank Account" : "Add Bank Account"}
            </h3>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
              {account
                ? "Update your bank account details. Changes require admin verification."
                : "Add your bank account to receive payouts from orders."}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{padding: 24}}>
            <div style={{display: "flex", flexDirection: "column", gap: 16}}>

              {/* ── Bank Name — Searchable Dropdown ── */}
              <BankInput
                value={form.bank_name}
                onSelect={handleBankSelect}
                label={
                  <>
                    Bank Name <span style={{color: "#ef4444"}}>*</span>
                  </>
                }
              />

              {/* ── Paystack Bank Code ── */}
              <div>
                <label style={labelStyle}>
                  Paystack Bank Code <span style={{color: "#ef4444"}}>*</span>
                </label>
                <div style={{position: "relative"}}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 999992"
                    value={form.paystack_bank_code}
                    onChange={(e) =>
                      !codesLocked && setForm({...form, paystack_bank_code: e.target.value})
                    }
                    disabled={codesLocked}
                    style={codesLocked ? inpDisabled : inp}
                    onFocus={codesLocked ? undefined : focus}
                    onBlur={codesLocked ? undefined : blur}
                  />
                  {codesLocked && (
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 13,
                        color: "rgba(34,197,94,0.7)",
                      }}
                      title="Auto-filled from bank selection">
                      🔒
                    </span>
                  )}
                </div>
                {codesLocked ? (
                  <p style={{color: "rgba(34,197,94,0.6)", fontSize: 10, margin: "4px 0 0"}}>
                    ✓ Auto-filled from bank selection — change the bank above to edit
                  </p>
                ) : (
                  <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: "4px 0 0"}}>
                    Select a Nigerian bank above to auto-fill, or enter manually
                  </p>
                )}
              </div>

              {/* ── Flutterwave Bank Code ── */}
              <div>
                <label style={labelStyle}>
                  Flutterwave Bank Code <span style={{color: "#ef4444"}}>*</span>
                </label>
                <div style={{position: "relative"}}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 999992"
                    value={form.flutterwave_bank_code}
                    onChange={(e) =>
                      !codesLocked && setForm({...form, flutterwave_bank_code: e.target.value})
                    }
                    disabled={codesLocked}
                    style={codesLocked ? inpDisabled : inp}
                    onFocus={codesLocked ? undefined : focus}
                    onBlur={codesLocked ? undefined : blur}
                  />
                  {codesLocked && (
                    <span
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 13,
                        color: "rgba(34,197,94,0.7)",
                      }}
                      title="Auto-filled from bank selection">
                      🔒
                    </span>
                  )}
                </div>
                {codesLocked && (
                  <p style={{color: "rgba(34,197,94,0.6)", fontSize: 10, margin: "4px 0 0"}}>
                    ✓ Auto-filled from bank selection — change the bank above to edit
                  </p>
                )}
              </div>

              {/* ── Account Number ── */}
              <div>
                <label style={labelStyle}>
                  Account Number <span style={{color: "#ef4444"}}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="10-digit account number"
                  value={form.account_number}
                  onChange={(e) => setForm({...form, account_number: e.target.value})}
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                  maxLength={10}
                />
              </div>

              {/* ── Account Name ── */}
              <div>
                <label style={labelStyle}>
                  Account Name <span style={{color: "#ef4444"}}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name as it appears on your account"
                  value={form.account_name}
                  onChange={(e) => setForm({...form, account_name: e.target.value})}
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>

              {/* ── Account Type ── */}
              <div>
                <label style={labelStyle}>Account Type</label>
                <select
                  value={form.account_type}
                  onChange={(e) => setForm({...form, account_type: e.target.value})}
                  style={{
                    ...inp,
                    cursor: "pointer",
                    appearance: "none",
                    colorScheme: "dark",
                    background: "#111",
                  }}
                  onFocus={focus}
                  onBlur={blur}>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>

              {/* ── Currency ── */}
              <CurrencyInput
                value={form.currency}
                onChange={(currency) => setForm({...form, currency})}
                label={
                  <>
                    Currency <span style={{color: "#ef4444"}}>*</span>
                  </>
                }
              />

              {/* ── Action Buttons ── */}
              <div style={{display: "flex", gap: 12, marginTop: 8}}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    background: saving ? "#7f1d1d" : "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "13px",
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.currentTarget.style.background = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) e.currentTarget.style.background = "#ef4444";
                  }}>
                  {saving ? "Saving..." : account ? "Update Account" : "Add Account"}
                </button>
                {account && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      const match = BANKS.find((b) => b.name === account.bank_name);
                      setSelectedBank(match || null);
                      setForm({
                        bank_name: account.bank_name || "",
                        paystack_bank_code: account.paystack_bank_code || "",
                        flutterwave_bank_code: account.flutterwave_bank_code || "",
                        account_number: account.account_number || "",
                        account_name: account.account_name || "",
                        account_type: account.account_type || "savings",
                        currency: account.currency || "NGN",
                      });
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.6)",
                      borderRadius: 10,
                      padding: "13px 20px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* Info Box */}
      <div
        style={{
          background: "rgba(59,130,246,0.05)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 12,
          padding: "16px 18px",
          marginTop: 20,
        }}>
        <div style={{display: "flex", gap: 12}}>
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{flexShrink: 0, marginTop: 2}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p style={{color: "#3b82f6", fontSize: 12, fontWeight: 700, margin: "0 0 6px"}}>
              Important Information
            </p>
            <ul
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 11,
                lineHeight: 1.6,
                margin: 0,
                paddingLeft: 16,
              }}>
              <li>Your bank account will be verified by an admin before payouts can be sent</li>
              <li>Ensure all details match your actual bank account exactly</li>
              <li>Changes to your bank account require re-verification</li>
              <li>Nigerian banks have their codes auto-filled — other banks may require manual entry</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}