import {useState, useEffect, useCallback} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {
  getUsers,
  getUser,
  updateUser,
  updateBuyer,
  updateBrand,
  deleteUser,
  banUser,
  unbanUser,
  verifyUser,
  getEmployees,
  deleteEmployee,
  suspendEmployee,
  reinstateEmployee,
  getPartners,
  deletePartner,
  createUser,
} from "../dashboard/dashboard_components/api";
import {AdminTable, Badge, SearchBar, ConfirmModal, Icon} from "./Components";
import ImageUpload from "../../../../components/ImageUpload";

const ACCOUNT_LABEL = {user: "Buyer", brand: "Brand", banned: "Banned"};
const ACCOUNT_COLOR = {user: "#3b82f6", brand: "#f59e0b", banned: "#ef4444"};
function isBanned(u) {
  return u?.account_type === "banned";
}
function isVerified(u) {
  return u?.verification_status === "verified";
}
function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailRow({label, value}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "9px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
      <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 600, flexShrink: 0}}>
        {label}
      </span>
      <span
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 11,
          maxWidth: "58%",
          textAlign: "right",
          wordBreak: "break-all",
        }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function EditField({label, name, value, onChange, type = "text"}) {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 4}}>
      <label style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600}}>{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 7,
          padding: "8px 10px",
          color: "rgba(255,255,255,0.8)",
          fontSize: 11,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.4)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );
}

const actionBtn = (color, soft = false) => ({
  padding: "10px 14px",
  background: soft ? `${color}10` : `${color}15`,
  border: `1px solid ${color}30`,
  color,
  borderRadius: 9,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
});
const dangerBtn = {
  padding: "10px 14px",
  background: "rgba(239,68,68,0.05)",
  border: "1px solid rgba(239,68,68,0.15)",
  color: "rgba(239,68,68,0.6)",
  borderRadius: 9,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
};
const pageBtn = (disabled) => ({
  padding: "6px 14px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
  fontSize: 11,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
});

// ── User drawer ───────────────────────────────────────────────────────────────
function UserDrawer({userId, onClose, onAction}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const fetchUser = useCallback(() => {
    setLoading(true);
    getUser(userId)
      .then((d) => {
        setData(d);
        const u = d?.user || d;
        const extra = d?.extra || {};
        const phone = extra?.buyer?.phone || extra?.brand?.phone || "";
        setEditFields({
          first_name: u?.first_name || "",
          last_name: u?.last_name || "",
          email: u?.email || "",
          avatar_url: u?.avatar_url || "",
          phone,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const user = data?.user || data;
  const extra = data?.extra || {};
  const typeColor = ACCOUNT_COLOR[user?.account_type] || "#6b7280";
  const typeLabel = ACCOUNT_LABEL[user?.account_type] || user?.account_type || "—";
  const profileType = extra?.brand ? "brand" : extra?.buyer ? "buyer" : null;
  const profileId = extra?.brand?.id || extra?.buyer?.id || null;

  const onChange = (e) => setEditFields((p) => ({...p, [e.target.name]: e.target.value}));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateUser(user.id, {
        first_name: editFields.first_name,
        last_name: editFields.last_name,
        email: editFields.email,
        avatar_url: editFields.avatar_url,
      });
      if (editFields.phone !== undefined && profileId) {
        if (profileType === "buyer") await updateBuyer(profileId, {phone: editFields.phone});
        else if (profileType === "brand") await updateBrand(profileId, {phone: editFields.phone});
      }
      setEditMode(false);
      fetchUser();
    } catch (e) {
      setSaveError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

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
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(440px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          {loading ? (
            <div
              style={{
                height: 40,
                width: 160,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 8,
              }}
            />
          ) : (
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  style={{width: 44, height: 44, borderRadius: "50%", objectFit: "cover"}}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: "#fff",
                  }}>
                  {(user?.first_name?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div>
                <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>
                  {user?.first_name} {user?.last_name}
                </p>
                <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                  {user?.email}
                </p>
              </div>
            </div>
          )}
          <div style={{display: "flex", gap: 8}}>
            {!loading && (
              <button
                onClick={() => {
                  setEditMode((p) => !p);
                  setSaveError(null);
                }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: editMode ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${editMode ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: editMode ? "#ef4444" : "rgba(255,255,255,0.5)",
                }}>
                {editMode ? "✕" : "✎"}
              </button>
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <Icon name="x" size={12} color="rgba(255,255,255,0.5)" />
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{padding: 22, display: "flex", flexDirection: "column", gap: 10}}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{height: 32, background: "rgba(255,255,255,0.04)", borderRadius: 6}}
              />
            ))}
          </div>
        ) : (
          <div style={{padding: "18px 22px", flex: 1}}>
            <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18}}>
              <Badge label={typeLabel} color={typeColor} />
              {isVerified(user) && <Badge label="Verified" color="#22c55e" />}
              {isBanned(user) && <Badge label="Banned" color="#ef4444" />}
            </div>
            {editMode ? (
              <>
                <div style={{marginBottom: 14}}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 10,
                      fontWeight: 600,
                      margin: "0 0 6px",
                    }}>
                    Avatar
                  </p>
                  <ImageUpload
                    folder="avatars"
                    shape="circle"
                    label="Change Avatar"
                    preview={editFields.avatar_url}
                    onUpload={(url) => setEditFields((p) => ({...p, avatar_url: url}))}
                  />
                </div>
                <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                  <EditField
                    label="First Name"
                    name="first_name"
                    value={editFields.first_name}
                    onChange={onChange}
                  />
                  <EditField
                    label="Last Name"
                    name="last_name"
                    value={editFields.last_name}
                    onChange={onChange}
                  />
                  <EditField
                    label="Email"
                    name="email"
                    type="email"
                    value={editFields.email}
                    onChange={onChange}
                  />
                  {profileType && (
                    <EditField
                      label={`Phone (${profileType === "brand" ? "Brand" : "Buyer"})`}
                      name="phone"
                      type="tel"
                      value={editFields.phone}
                      onChange={onChange}
                    />
                  )}
                </div>
                {saveError && (
                  <p style={{color: "#ef4444", fontSize: 11, marginTop: 10}}>{saveError}</p>
                )}
                <div style={{display: "flex", gap: 8, marginTop: 16}}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: saving ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      color: saving ? "rgba(34,197,94,0.4)" : "#22c55e",
                      borderRadius: 9,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}>
                    {saving ? "Saving…" : "✓ Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setSaveError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.4)",
                      borderRadius: 9,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <DetailRow label="Display ID" value={user?.display_id} />
                <DetailRow
                  label="Phone"
                  value={extra?.buyer?.phone || extra?.brand?.phone || "—"}
                />
                <DetailRow label="Type" value={typeLabel} />
                <DetailRow label="Verified" value={isVerified(user) ? "Yes" : "No"} />
                <DetailRow label="Joined" value={fmt(user?.created_at)} />
                {extra?.brand && (
                  <>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        margin: "16px 0 4px",
                      }}>
                      Brand Profile
                    </p>
                    <DetailRow label="Brand Name" value={extra.brand.brand_name} />
                    <DetailRow label="Verification" value={extra.brand.verification_status} />
                    <DetailRow label="Subscription" value={extra.brand.subscription_status} />
                    <DetailRow label="Plan" value={extra.brand.subscription_plan} />
                  </>
                )}
                {extra?.buyer && (
                  <>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.2)",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        margin: "16px 0 4px",
                      }}>
                      Buyer Profile
                    </p>
                    <DetailRow label="Buyer ID" value={extra.buyer.display_id} />
                    <DetailRow label="Phone" value={extra.buyer.phone} />
                  </>
                )}
                <div style={{marginTop: 22, display: "flex", flexDirection: "column", gap: 8}}>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.2)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      margin: "0 0 4px",
                    }}>
                    Actions
                  </p>
                  {!isVerified(user) && user?.account_type === "brand" && (
                    <button
                      onClick={() => onAction("verify", user, fetchUser)}
                      style={actionBtn("#22c55e")}>
                      ✓ Verify Account
                    </button>
                  )}
                  {isBanned(user) ? (
                    <button
                      onClick={() => onAction("unban", user, fetchUser)}
                      style={actionBtn("#22c55e")}>
                      ↩ Unban User
                    </button>
                  ) : (
                    <button
                      onClick={() => onAction("ban", user, fetchUser)}
                      style={actionBtn("#ef4444", true)}>
                      🚫 Ban User
                    </button>
                  )}
                  <button onClick={() => onAction("delete", user, fetchUser)} style={dangerBtn}>
                    🗑 Delete Account
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Employee drawer ───────────────────────────────────────────────────────────
function EmployeeDrawer({emp, onClose, onAction}) {
  if (!emp) return null;
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
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(440px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
        }}>
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <div>
            <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>
              {emp.first_name} {emp.last_name}
            </p>
            <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>{emp.email}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Icon name="x" size={12} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        <div style={{padding: "18px 22px"}}>
          <div style={{display: "flex", gap: 8, marginBottom: 18}}>
            <Badge label={emp.role || "—"} color="#a855f7" />
            <Badge
              label={emp.status || "active"}
              color={emp.status === "active" ? "#22c55e" : "#ef4444"}
            />
          </div>
          <DetailRow label="Display ID" value={emp.display_id} />
          <DetailRow label="Role" value={emp.role} />
          <DetailRow label="Phone" value={emp.phone} />
          <DetailRow
            label="Commission"
            value={emp.commission_type ? `${emp.commission_rate}% (${emp.commission_type})` : "—"}
          />
          <DetailRow label="Referral Code" value={emp.referral_code || "—"} />
          <DetailRow label="Joined" value={fmt(emp.created_at)} />
          <div style={{marginTop: 22, display: "flex", flexDirection: "column", gap: 8}}>
            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 4px",
              }}>
              Actions
            </p>
            {emp.status === "suspended" ? (
              <button onClick={() => onAction("reinstate", emp)} style={actionBtn("#22c55e")}>
                ↩ Reinstate
              </button>
            ) : (
              <button
                onClick={() => onAction("suspend_emp", emp)}
                style={actionBtn("#f59e0b", true)}>
                ⏸ Suspend
              </button>
            )}
            <button onClick={() => onAction("delete_emp", emp)} style={dangerBtn}>
              🗑 Delete Employee
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Partner drawer ────────────────────────────────────────────────────────────
function PartnerDrawer({partner, onClose, onAction}) {
  if (!partner) return null;
  const sc = {
    prospect: "#f59e0b",
    negotiating: "#3b82f6",
    active: "#22c55e",
    inactive: "#6b7280",
    churned: "#ef4444",
  };
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
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(440px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
        }}>
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <div>
            <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>
              {partner.company_name}
            </p>
            <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
              {partner.contact_email}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Icon name="x" size={12} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        <div style={{padding: "18px 22px"}}>
          <div style={{display: "flex", gap: 8, marginBottom: 18}}>
            <Badge label={partner.type || "—"} color="#f97316" />
            <Badge label={partner.stage || "prospect"} color={sc[partner.stage] || "#6b7280"} />
          </div>
          <DetailRow
            label="Contact"
            value={`${partner.contact_first_name} ${partner.contact_last_name}`}
          />
          <DetailRow label="Phone" value={partner.contact_phone || "—"} />
          <DetailRow label="Country" value={partner.country || "—"} />
          <DetailRow label="Website" value={partner.website || "—"} />
          <DetailRow label="Added" value={fmt(partner.created_at)} />
          <div style={{marginTop: 22}}>
            <button onClick={() => onAction("delete_partner", partner)} style={dangerBtn}>
              🗑 Delete Partner
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Delete User Modal ─────────────────────────────────────────────────────────
function DeleteUserModal({user, onClose, onDeleted}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handle = async (permanent) => {
    setDeleting(true);
    setError("");
    try {
      await deleteUser(user.id, permanent);
      onDeleted();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to delete user.");
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(4px)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
      <motion.div
        initial={{opacity: 0, scale: 0.94, y: 16}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.94, y: 16}}
        transition={{type: "spring", stiffness: 280, damping: 28}}
        style={{
          width: "100%", maxWidth: 420,
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}>
        {/* Red top bar */}
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />

        <div style={{padding: "28px 28px 24px"}}>
          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <svg width="22" height="22" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <h2 style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.5rem",
            color: "#fff", letterSpacing: "0.06em", textAlign: "center",
            margin: "0 0 8px",
          }}>
            DELETE ACCOUNT
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center",
            lineHeight: 1.6, margin: "0 0 6px",
          }}>
            Delete <strong style={{color: "#fff"}}>{user?.first_name} {user?.last_name}</strong>?
          </p>
          <p style={{
            color: "rgba(255,255,255,0.28)", fontSize: 12, textAlign: "center",
            lineHeight: 1.6, margin: "0 0 24px",
          }}>
            Choose how to delete this account:
          </p>

          {/* Two options */}
          <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 20}}>
            {/* Temporary — CanRestore: true */}
            <button
              onClick={() => handle(false)}
              disabled={deleting}
              style={{
                width: "100%", padding: "14px 16px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10, cursor: deleting ? "not-allowed" : "pointer",
                textAlign: "left", transition: "all 0.18s",
              }}
              onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
              onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}>
              <p style={{color: "#ef4444", fontSize: 12, fontWeight: 800, margin: "0 0 3px"}}>
                🔄 Temporary Delete
              </p>
              <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                Account is deleted but can be restored from Audit Log
              </p>
            </button>

            {/* Permanent — CanRestore: false */}
            <button
              onClick={() => handle(true)}
              disabled={deleting}
              style={{
                width: "100%", padding: "14px 16px",
                background: "rgba(127,29,29,0.15)",
                border: "1px solid rgba(239,68,68,0.5)",
                borderRadius: 10, cursor: deleting ? "not-allowed" : "pointer",
                textAlign: "left", transition: "all 0.18s",
              }}
              onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "rgba(127,29,29,0.3)"; }}
              onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = "rgba(127,29,29,0.15)"; }}>
              <p style={{color: "#fca5a5", fontSize: 12, fontWeight: 800, margin: "0 0 3px"}}>
                🗑 Permanent Delete
              </p>
              <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                Account is permanently gone. Cannot be restored.
              </p>
            </button>
          </div>

          {error && (
            <p style={{color: "#ef4444", fontSize: 11, textAlign: "center", marginBottom: 12}}>
              {error}
            </p>
          )}

          {deleting && (
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", marginBottom: 12}}>
              Deleting account…
            </p>
          )}

          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              width: "100%", padding: "11px",
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)", borderRadius: 9,
              fontSize: 11, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#fff"; } }}
            onMouseLeave={(e) => { if (!deleting) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; } }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Create Account drawer (Buyer or Brand) ───────────────────────────────────
const ACCT_BLANK = {
  account_type: "user",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  brand_name: "",
  description: "",
  logo_url: "",
  website: "",
  instagram: "",
  facebook: "",
  twitter: "",
  tiktok: "",
  category: "",
  auto_verify: false,
};

function CreateAccountDrawer({onClose, onCreated}) {
  const [form, setForm] = useState(ACCT_BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isBrand = form.account_type === "brand";

  const set = (k) => (v) => setForm((f) => ({...f, [k]: v}));

  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 13,
    padding: "10px 13px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.18s",
  };
  const onF = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
  const onB = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");
  const Lbl = ({children, opt}) => (
    <label
      style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        display: "block",
        marginBottom: 5,
      }}>
      {children}
      {opt && (
        <span
          style={{
            color: "rgba(255,255,255,0.2)",
            fontWeight: 400,
            textTransform: "none",
            letterSpacing: 0,
            marginLeft: 4,
          }}>
          (optional)
        </span>
      )}
    </label>
  );

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isBrand && !form.brand_name.trim()) {
      setError("Brand name is required for brand accounts.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createUser(form);
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create account.");
    }
    setSaving(false);
  };

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
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
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
          width: "min(520px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg,#ef4444,transparent)",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: "0 0 3px",
              }}>
              Admin
            </p>
            <p style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>Create Account</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
            }}>
            ✕
          </button>
        </div>

        <div style={{padding: "20px 24px", flex: 1}}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 9,
                padding: "10px 14px",
                color: "#ef4444",
                fontSize: 12,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
              {error}
              <button
                onClick={() => setError("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 0,
                }}>
                ×
              </button>
            </div>
          )}

          {/* Account type selector */}
          <div style={{marginBottom: 20}}>
            <Lbl>Account Type</Lbl>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8}}>
              {[
                [
                  "user",
                  "Buyer",
                  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                ],
                [
                  "brand",
                  "Brand",
                  "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                ],
              ].map(([v, l, path]) => (
                <button
                  key={v}
                  onClick={() => set("account_type")(v)}
                  style={{
                    padding: "12px",
                    borderRadius: 9,
                    border: `1px solid ${form.account_type === v ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                    background:
                      form.account_type === v ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke={form.account_type === v ? "#ef4444" : "rgba(255,255,255,0.3)"}
                    strokeWidth="1.8"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                  </svg>
                  <span
                    style={{
                      color: form.account_type === v ? "#ef4444" : "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                    {l}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Personal info */}
          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}>
            Personal Info
          </p>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>
            <div>
              <Lbl>First Name</Lbl>
              <input
                value={form.first_name}
                onChange={(e) => set("first_name")(e.target.value)}
                placeholder="John"
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
            <div>
              <Lbl>Last Name</Lbl>
              <input
                value={form.last_name}
                onChange={(e) => set("last_name")(e.target.value)}
                placeholder="Doe"
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
          </div>
          <div style={{marginBottom: 12}}>
            <Lbl>Email</Lbl>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="user@example.com"
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>
          <div style={{marginBottom: isBrand ? 20 : 12}}>
            <Lbl>Password</Lbl>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="Min 8 characters"
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>

          {/* Buyer-only: phone */}
          {!isBrand && (
            <div style={{marginBottom: 4}}>
              <Lbl opt>Phone</Lbl>
              <input
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                placeholder="+234..."
                style={inp}
                onFocus={onF}
                onBlur={onB}
              />
            </div>
          )}

          {/* Brand-only fields */}
          {isBrand && (
            <>
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 12px",
                }}>
                Brand Info
              </p>
              <div style={{marginBottom: 12}}>
                <Lbl>Brand Name</Lbl>
                <input
                  value={form.brand_name}
                  onChange={(e) => set("brand_name")(e.target.value)}
                  placeholder="e.g. BLVCK Studios"
                  style={inp}
                  onFocus={onF}
                  onBlur={onB}
                />
              </div>
              <div style={{marginBottom: 12}}>
                <Lbl opt>Description</Lbl>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description")(e.target.value)}
                  placeholder="About this brand..."
                  rows={3}
                  style={{...inp, resize: "vertical", lineHeight: 1.6}}
                  onFocus={onF}
                  onBlur={onB}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 12,
                }}>
                <div>
                  <Lbl opt>Logo URL</Lbl>
                  <input
                    value={form.logo_url}
                    onChange={(e) => set("logo_url")(e.target.value)}
                    placeholder="https://..."
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                  />
                </div>
                <div>
                  <Lbl opt>Website</Lbl>
                  <input
                    value={form.website}
                    onChange={(e) => set("website")(e.target.value)}
                    placeholder="https://..."
                    style={inp}
                    onFocus={onF}
                    onBlur={onB}
                  />
                </div>
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 12px",
                }}>
                Social Media
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}>
                {[
                  ["instagram", "Instagram"],
                  ["twitter", "Twitter/X"],
                  ["tiktok", "TikTok"],
                  ["facebook", "Facebook"],
                ].map(([k, l]) => (
                  <div key={k}>
                    <Lbl opt>{l}</Lbl>
                    <div style={{position: "relative"}}>
                      <span
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "rgba(255,255,255,0.25)",
                          fontSize: 12,
                        }}>
                        @
                      </span>
                      <input
                        value={form[k]}
                        onChange={(e) => set(k)(e.target.value.replace("@", ""))}
                        placeholder={k}
                        style={{...inp, paddingLeft: 28}}
                        onFocus={onF}
                        onBlur={onB}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  userSelect: "none",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 9,
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                <input
                  type="checkbox"
                  checked={form.auto_verify}
                  onChange={(e) => set("auto_verify")(e.target.checked)}
                  style={{
                    width: 15,
                    height: 15,
                    accentColor: "#ef4444",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      fontWeight: 700,
                      margin: 0,
                    }}>
                    Auto-verify brand
                  </p>
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0"}}>
                    Set verification to "verified" immediately
                  </p>
                </div>
              </label>
            </>
          )}
        </div>

        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "#0f0f0f",
            flexShrink: 0,
            display: "flex",
            gap: 10,
          }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              background: saving ? "#7f1d1d" : "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "13px",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.background = "#dc2626";
            }}
            onMouseLeave={(e) => {
              if (!saving) e.currentTarget.style.background = "#ef4444";
            }}>
            {saving && (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                style={{animation: "spin 0.8s linear infinite"}}>
                <path
                  d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {saving ? "Creating…" : `Create ${isBrand ? "Brand" : "Buyer"} Account`}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "13px 20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}>
            Cancel
          </button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </motion.div>
    </motion.div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false); // ← Create Account modal
  const [deleteModal, setDeleteModal] = useState(null); // ← Delete user modal

  const load = useCallback(() => {
    setLoading(true);
    const p = {limit: 20, page};
    if (typeFilter) p.account_type = typeFilter;
    if (search.trim()) p.search = search.trim();
    getUsers(p)
      .then((d) => {
        setUsers(d?.users || d || []);
        setTotal(d?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [typeFilter, search, page]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, search]);
  useEffect(() => {
    load();
  }, [load]);

const handleAction = (type, user, refresh) => {
    if (type === "delete") {
      setDeleteModal({user, refresh}); // ✅ Route delete to its own modal
    } else {
      setConfirm({type, user, refresh});
    }
  };
  const handleConfirm = async () => {
    const {type, user, refresh} = confirm;
    try {
      if (type === "ban")    await banUser(user.id);
      if (type === "unban")  await unbanUser(user.id);
      if (type === "verify") await verifyUser(user.id);
      load();
      if (refresh) refresh();
    } catch (e) {
      console.error(e);
    }
    setConfirm(null);
  };

  const cols = [
    {
      key: "av",
      label: "",
      render: (u) =>
        u.avatar_url ? (
          <img
            src={u.avatar_url}
            alt=""
            style={{width: 30, height: 30, borderRadius: "50%", objectFit: "cover"}}
          />
        ) : (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 900,
              color: "#ef4444",
            }}>
            {(u.first_name?.[0] || "?").toUpperCase()}
          </div>
        ),
    },
    {
      key: "name",
      label: "Name",
      render: (u) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>
            {u.first_name} {u.last_name}
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              margin: 0,
              fontFamily: "monospace",
            }}>
            {u.display_id}
          </p>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (u) => <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>{u.email}</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (u) => (
        <Badge
          label={ACCOUNT_LABEL[u.account_type] || u.account_type}
          color={ACCOUNT_COLOR[u.account_type] || "#6b7280"}
        />
      ),
    },
    {
      key: "st",
      label: "Status",
      render: (u) => (
        <div style={{display: "flex", gap: 5}}>
          {isVerified(u) && <Badge label="Verified" color="#22c55e" />}
          {isBanned(u) && <Badge label="Banned" color="#ef4444" />}
        </div>
      ),
    },
    {
      key: "j",
      label: "Joined",
      render: (u) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmt(u.created_at)}</span>
      ),
    },
  ];

  const cc = {
    ban: {title: "Ban User", msg: `Ban ${confirm?.user?.first_name}?`, label: "Ban", danger: true},
    unban: {
      title: "Unban User",
      msg: `Unban ${confirm?.user?.first_name}?`,
      label: "Unban",
      danger: false,
    },
    verify: {
      title: "Verify",
      msg: `Verify ${confirm?.user?.first_name}?`,
      label: "Verify",
      danger: false,
    },
    delete: {
      title: "Delete",
      msg: `Delete ${confirm?.user?.first_name}?`,
      label: "Delete",
      danger: true,
    },
  };

  return (
    <>
      <AnimatePresence>
        {selectedId && (
          <UserDrawer
            userId={selectedId}
            onClose={() => setSelectedId(null)}
            onAction={handleAction}
          />
        )}
        {confirm && (
          <ConfirmModal
            title={cc[confirm.type]?.title}
            message={cc[confirm.type]?.msg}
            confirmLabel={cc[confirm.type]?.label}
            danger={cc[confirm.type]?.danger}
            onConfirm={handleConfirm}
            onCancel={() => setConfirm(null)}
          />
        )}
        {showCreate && (
          <CreateAccountDrawer onClose={() => setShowCreate(false)} onCreated={() => load()} />
        )}

        {deleteModal && (
          <DeleteUserModal
            user={deleteModal.user}
            onClose={() => setDeleteModal(null)}
            onDeleted={() => {
              setSelectedId(null);
              setDeleteModal(null);
              load();
              if (deleteModal.refresh) deleteModal.refresh();
            }}
          />
        )}
      </AnimatePresence>

      <div style={{display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap"}}>
        {[
          {value: "", label: "All"},
          {value: "user", label: "Buyers"},
          {value: "brand", label: "Brands"},
          {value: "banned", label: "Banned"},
        ].map(({value, label}) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              border: `1px solid ${typeFilter === value ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: typeFilter === value ? "rgba(239,68,68,0.1)" : "transparent",
              color: typeFilter === value ? "#ef4444" : "rgba(255,255,255,0.45)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            {label}
          </button>
        ))}
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name or email..."
        actions={
          <div style={{display: "flex", gap: 8}}>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: "10px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}>
              + New Account
            </button>
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
              }}>
              Refresh
            </button>
          </div>
        }
      />

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
            {total.toLocaleString()} users
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
            Click a row to view details
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={users}
          loading={loading}
          onRowClick={(u) => setSelectedId(u.id)}
          emptyMsg="No users found."
        />
        {total > 20 && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            <span style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>
              Page {page} · {users.length} of {total}
            </span>
            <div style={{display: "flex", gap: 8}}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={pageBtn(page === 1)}>
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={users.length < 20}
                style={pageBtn(users.length < 20)}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Employees tab ─────────────────────────────────────────────────────────────
function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = {limit: 50};
    if (statusFilter) p.status = statusFilter;
    if (search.trim()) p.search = search.trim();
    getEmployees(p)
      .then((d) => {
        setEmployees(d?.employees || d || []);
        setTotal(d?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = (type, emp) => {
    setSelected(null);
    setConfirm({type, emp});
  };
  const handleConfirm = async () => {
    const {type, emp} = confirm;
    try {
      if (type === "suspend_emp") await suspendEmployee(emp.id);
      if (type === "reinstate") await reinstateEmployee(emp.id);
      if (type === "delete_emp") await deleteEmployee(emp.id);
      load();
    } catch (e) {
      console.error(e);
    }
    setConfirm(null);
  };

  const cc = {
    suspend_emp: {
      title: "Suspend",
      msg: `Suspend ${confirm?.emp?.first_name}?`,
      label: "Suspend",
      danger: true,
    },
    reinstate: {
      title: "Reinstate",
      msg: `Reinstate ${confirm?.emp?.first_name}?`,
      label: "Reinstate",
      danger: false,
    },
    delete_emp: {
      title: "Delete",
      msg: `Delete ${confirm?.emp?.first_name}?`,
      label: "Delete",
      danger: true,
    },
  };

  const cols = [
    {
      key: "n",
      label: "Name",
      render: (e) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>
            {e.first_name} {e.last_name}
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              margin: 0,
              fontFamily: "monospace",
            }}>
            {e.display_id}
          </p>
        </div>
      ),
    },
    {
      key: "e",
      label: "Email",
      render: (e) => <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>{e.email}</span>,
    },
    {key: "r", label: "Role", render: (e) => <Badge label={e.role || "—"} color="#a855f7" />},
    {
      key: "s",
      label: "Status",
      render: (e) => (
        <Badge label={e.status || "active"} color={e.status === "active" ? "#22c55e" : "#ef4444"} />
      ),
    },
    {
      key: "j",
      label: "Joined",
      render: (e) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmt(e.created_at)}</span>
      ),
    },
  ];

  return (
    <>
      <AnimatePresence>
        {selected && (
          <EmployeeDrawer
            emp={selected}
            onClose={() => setSelected(null)}
            onAction={handleAction}
          />
        )}
        {confirm && (
          <ConfirmModal
            title={cc[confirm.type]?.title}
            message={cc[confirm.type]?.msg}
            confirmLabel={cc[confirm.type]?.label}
            danger={cc[confirm.type]?.danger}
            onConfirm={handleConfirm}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>
      <div style={{display: "flex", gap: 6, marginBottom: 14}}>
        {["", "active", "suspended"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              border: `1px solid ${statusFilter === s ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: statusFilter === s ? "rgba(239,68,68,0.1)" : "transparent",
              color: statusFilter === s ? "#ef4444" : "rgba(255,255,255,0.45)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
            }}>
            {s || "All"}
          </button>
        ))}
      </div>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search employees..."
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
            }}>
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
        }}>
        <div style={{padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} employees
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={employees}
          loading={loading}
          onRowClick={setSelected}
          emptyMsg="No employees found."
        />
      </div>
    </>
  );
}

// ── Partners tab ──────────────────────────────────────────────────────────────
function PartnersTab() {
  const [partners, setPartners] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = {limit: 50};
    if (stageFilter) p.stage = stageFilter;
    if (search.trim()) p.search = search.trim();
    getPartners(p)
      .then((d) => {
        setPartners(d?.partners || d || []);
        setTotal(d?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [stageFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = (type, partner) => {
    setSelected(null);
    setConfirm({type, partner});
  };
  const handleConfirm = async () => {
    try {
      if (confirm.type === "delete_partner") await deletePartner(confirm.partner.id);
      load();
    } catch (e) {
      console.error(e);
    }
    setConfirm(null);
  };

  const SC = {
    prospect: "#f59e0b",
    negotiating: "#3b82f6",
    active: "#22c55e",
    inactive: "#6b7280",
    churned: "#ef4444",
  };
  const cols = [
    {
      key: "c",
      label: "Company",
      render: (p) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>{p.company_name}</p>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              margin: 0,
              fontFamily: "monospace",
            }}>
            {p.display_id}
          </p>
        </div>
      ),
    },
    {
      key: "co",
      label: "Contact",
      render: (p) => (
        <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>{p.contact_email}</span>
      ),
    },
    {key: "t", label: "Type", render: (p) => <Badge label={p.type || "—"} color="#f97316" />},
    {
      key: "s",
      label: "Stage",
      render: (p) => <Badge label={p.stage || "prospect"} color={SC[p.stage] || "#6b7280"} />,
    },
    {
      key: "co2",
      label: "Country",
      render: (p) => (
        <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>{p.country || "—"}</span>
      ),
    },
    {
      key: "a",
      label: "Added",
      render: (p) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmt(p.created_at)}</span>
      ),
    },
  ];

  return (
    <>
      <AnimatePresence>
        {selected && (
          <PartnerDrawer
            partner={selected}
            onClose={() => setSelected(null)}
            onAction={handleAction}
          />
        )}
        {confirm && (
          <ConfirmModal
            title="Delete Partner"
            message={`Delete "${confirm?.partner?.company_name}"?`}
            confirmLabel="Delete"
            danger
            onConfirm={handleConfirm}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>
      <div style={{display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap"}}>
        {["", "prospect", "negotiating", "active", "inactive", "churned"].map((s) => (
          <button
            key={s}
            onClick={() => setStageFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              border: `1px solid ${stageFilter === s ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: stageFilter === s ? "rgba(239,68,68,0.1)" : "transparent",
              color: stageFilter === s ? "#ef4444" : "rgba(255,255,255,0.45)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
            }}>
            {s || "All"}
          </button>
        ))}
      </div>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search partners..."
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
            }}>
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
        }}>
        <div style={{padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} partners
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={partners}
          loading={loading}
          onRowClick={setSelected}
          emptyMsg="No partners found."
        />
      </div>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TABS = [
  {id: "users", label: "Users"},
  {id: "employees", label: "Employees"},
  {id: "partners", label: "Partners"},
];

export default function AdminUsers() {
  const [tab, setTab] = useState("users");
  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 18,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
        }}>
        {TABS.map(({id, label}) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "7px 20px",
              borderRadius: 7,
              background: tab === id ? "rgba(239,68,68,0.15)" : "transparent",
              border: tab === id ? "1px solid rgba(239,68,68,0.35)" : "1px solid transparent",
              color: tab === id ? "#ef4444" : "rgba(255,255,255,0.4)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{opacity: 0, y: 6}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0}}
          transition={{duration: 0.15}}>
          {tab === "users" && <UsersTab />}
          {tab === "employees" && <EmployeesTab />}
          {tab === "partners" && <PartnersTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
