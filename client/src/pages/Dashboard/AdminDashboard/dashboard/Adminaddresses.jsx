import {useState, useEffect, useRef} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {AdminTable, SearchBar, ConfirmModal} from "./Components";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getUsers,
} from "./dashboard_components/api";

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
  marginBottom: 12,
};
const onFocus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
const onBlur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

function norm(a) {
  if (!a) return null;
  return {
    ...a,
    is_default: a.is_default ?? a.IsDefault ?? false,
    user_name: a.user_name || a.UserName || `User #${a.user_id}`,
    user_email: a.user_email || a.UserEmail || "",
  };
}

// ── Create address modal ──────────────────────────────────────────────────────
const BLANK_FORM = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
  is_default: false,
};

function CreateAddressModal({onClose, onCreated}) {
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // User search
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // { id, name, email }
  const searchTimeout = useRef(null);

  const searchUsers = (q) => {
    setUserQuery(q);
    setSelectedUser(null);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) {
      setUserResults([]);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await getUsers({search: q, limit: 8});
        const list = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
        setUserResults(list);
      } catch (_) {
        setUserResults([]);
      }
      setSearching(false);
    }, 300);
  };

  const pickUser = (u) => {
    setSelectedUser({
      id: u.id,
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
      email: u.email,
    });
    setUserQuery("");
    setUserResults([]);
  };

  const Field = ({fieldKey, label, placeholder = ""}) => (
    <div style={{marginBottom: 12}}>
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
        {label}
      </label>
      <input
        type="text"
        value={form[fieldKey] || ""}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => ({...f, [fieldKey]: e.target.value}))}
        style={inp}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );

  const handleSave = async () => {
    if (!selectedUser) {
      setError("Please select a user first.");
      return;
    }
    if (!form.label || !form.line1 || !form.city || !form.country) {
      setError("Label, line 1, city and country are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createAddress({...form, user_id: selectedUser.id});
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create address.");
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
          maxWidth: 480,
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          overflow: "hidden",
          maxHeight: "92vh",
          overflowY: "auto",
        }}>
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />

        {/* Header */}
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>Create Address</p>
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
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{padding: "18px 22px"}}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 9,
                padding: "9px 13px",
                color: "#ef4444",
                fontSize: 12,
                marginBottom: 14,
              }}>
              {error}
            </div>
          )}

          {/* ── User search ───────────────────────────────────────────── */}
          <div style={{marginBottom: 16}}>
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
              User *
            </label>

            {/* Selected user chip */}
            {selectedUser ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 9,
                  padding: "10px 14px",
                }}>
                <div>
                  <p style={{color: "#fff", fontSize: 13, fontWeight: 700, margin: 0}}>
                    {selectedUser.name}
                  </p>
                  <p style={{color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "2px 0 0"}}>
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.3)",
                    padding: 0,
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  ×
                </button>
              </div>
            ) : (
              <div style={{position: "relative"}}>
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  placeholder="Search by name or email…"
                  style={{...inp, marginBottom: 0, paddingRight: searching ? 36 : 13}}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                {/* Spinner */}
                {searching && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2.5"
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      animation: "spin 0.8s linear infinite",
                    }}>
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {/* Dropdown results */}
                {userResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 9,
                      overflow: "hidden",
                      zIndex: 10,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                    }}>
                    {userResults.map((u) => {
                      const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—";
                      return (
                        <div
                          key={u.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickUser(u);
                          }}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>
                            {name}
                          </p>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.35)",
                              fontSize: 11,
                              margin: "1px 0 0",
                            }}>
                            {u.email}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* No results */}
                {!searching && userQuery.trim() && userResults.length === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 9,
                      padding: "12px 14px",
                      zIndex: 10,
                    }}>
                    <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
                      No users found for "{userQuery}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Address fields ────────────────────────────────────────── */}
          <Field fieldKey="label" label="Label *" placeholder="Home, Work, Warehouse…" />
          <Field fieldKey="line1" label="Address Line 1 *" placeholder="Street address" />
          <Field fieldKey="line2" label="Address Line 2" placeholder="Apt, suite, etc." />
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
            <Field fieldKey="city" label="City *" />
            <Field fieldKey="state" label="State" />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
            <Field fieldKey="postcode" label="Postcode" />
            <Field fieldKey="country" label="Country *" placeholder="Nigeria" />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              userSelect: "none",
              marginBottom: 16,
            }}>
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setForm({...form, is_default: e.target.checked})}
              style={{width: 15, height: 15, accentColor: "#ef4444", cursor: "pointer"}}
            />
            <span style={{color: "rgba(255,255,255,0.5)", fontSize: 12}}>
              Set as default for this user
            </span>
          </label>

          <div style={{display: "flex", gap: 10}}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                background: saving ? "#7f1d1d" : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "12px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.background = "#dc2626";
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.background = "#ef4444";
              }}>
              {saving ? "Creating…" : "Create Address"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "12px 18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Address edit drawer ───────────────────────────────────────────────────────
function AddressDrawer({addr, onClose, onSaved, onDelete}) {
  const [form, setForm] = useState({...addr});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const Field = ({k, label, placeholder = ""}) => (
    <div>
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
        {label}
      </label>
      <input
        type="text"
        value={form[k] || ""}
        onChange={(e) => setForm((f) => ({...f, [k]: e.target.value}))}
        placeholder={placeholder}
        style={inp}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateAddress(addr.id, {
        label: form.label,
        line1: form.line1,
        line2: form.line2 || "",
        city: form.city,
        state: form.state || "",
        postcode: form.postcode || "",
        country: form.country,
        is_default: form.is_default,
      });
      onSaved(norm(updated) || {...addr, ...form});
      onClose();
    } catch (e) {
      setError(e.message || "Save failed.");
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
          width: "min(460px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
              Edit Address
            </p>
            <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>#{addr.id}</p>
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
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2.5"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div
          style={{
            padding: "14px 22px",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}>
            Owner
          </p>
          <p style={{color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, margin: 0}}>
            {addr.user_name}
          </p>
          {addr.user_email && (
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0"}}>
              {addr.user_email}
            </p>
          )}
          {addr.is_default && (
            <span
              style={{
                display: "inline-block",
                marginTop: 8,
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "2px 9px",
                borderRadius: 99,
              }}>
              ★ Default address
            </span>
          )}
        </div>
        <div style={{padding: "18px 22px", flex: 1}}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 9,
                padding: "9px 13px",
                color: "#ef4444",
                fontSize: 12,
                marginBottom: 14,
              }}>
              {error}
            </div>
          )}
          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 14px",
            }}>
            Edit Fields
          </p>
          <Field k="label" label="Label" placeholder="e.g. Home, Office" />
          <Field k="line1" label="Address Line 1" placeholder="Street address" />
          <Field k="line2" label="Address Line 2" placeholder="Apt, suite, etc." />
          <Field k="city" label="City" />
          <Field k="state" label="State" />
          <Field k="postcode" label="Postcode" />
          <Field k="country" label="Country" />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              userSelect: "none",
              marginBottom: 16,
            }}>
            <input
              type="checkbox"
              checked={!!form.is_default}
              onChange={(e) => setForm((f) => ({...f, is_default: e.target.checked}))}
              style={{width: 15, height: 15, accentColor: "#ef4444", cursor: "pointer"}}
            />
            <span style={{color: "rgba(255,255,255,0.45)", fontSize: 12}}>
              Set as default for this user
            </span>
          </label>
          <div style={{display: "flex", gap: 10}}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                background: saving ? "#7f1d1d" : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "12px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.18s",
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.background = "#dc2626";
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.background = "#ef4444";
              }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "12px 18px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Cancel
            </button>
          </div>
          <button
            onClick={() => onDelete(addr.id)}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "10px 14px",
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "rgba(239,68,68,0.6)",
              borderRadius: 9,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.05)";
              e.currentTarget.style.color = "rgba(239,68,68,0.6)";
            }}>
            🗑 Delete Address
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({msg, isError});
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    setLoadErr("");
    getAddresses()
      .then((d) => {
        const arr = Array.isArray(d?.addresses) ? d.addresses : Array.isArray(d) ? d : [];
        setAddresses(arr.map(norm));
      })
      .catch((e) => setLoadErr(e.message || "Failed to load addresses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = addresses.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [a.user_name, a.user_email, a.city, a.state, a.line1, a.country]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  });

  const handleSaved = (updated) => {
    setAddresses((prev) =>
      prev.map((a) => {
        if (updated.is_default && a.user_id === updated.user_id && a.id !== updated.id)
          return {...a, is_default: false};
        return a.id === updated.id ? updated : a;
      }),
    );
    showToast("Address updated ✓");
  };

  const handleDelete = (id) => {
    setSelected(null);
    setConfirm(id);
  };

  const cols = [
    {
      key: "owner",
      label: "Owner",
      render: (a) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>{a.user_name}</p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>{a.user_email}</p>
        </div>
      ),
    },
    {
      key: "label",
      label: "Label",
      render: (a) =>
        a.label ? (
          <span
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 99,
              textTransform: "capitalize",
            }}>
            {a.label}
          </span>
        ) : (
          <span style={{color: "rgba(255,255,255,0.2)", fontSize: 11}}>—</span>
        ),
    },
    {
      key: "address",
      label: "Address",
      render: (a) => (
        <div>
          <p style={{color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "0 0 2px"}}>
            {a.line1 || "—"}
          </p>
          {a.line2 && (
            <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>{a.line2}</p>
          )}
          <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
            {[a.city, a.state, a.postcode].filter(Boolean).join(", ")}
          </p>
        </div>
      ),
    },
    {
      key: "country",
      label: "Country",
      render: (a) => (
        <span style={{color: "rgba(255,255,255,0.45)", fontSize: 11}}>{a.country || "—"}</span>
      ),
    },
    {
      key: "is_default",
      label: "Default",
      render: (a) =>
        a.is_default ? (
          <span
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontSize: 9,
              fontWeight: 800,
              padding: "3px 9px",
              borderRadius: 99,
            }}>
            ★ Default
          </span>
        ) : null,
    },
  ];

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AnimatePresence>
        {selected && (
          <AddressDrawer
            addr={selected}
            onClose={() => setSelected(null)}
            onSaved={handleSaved}
            onDelete={handleDelete}
          />
        )}
        {confirm && (
          <ConfirmModal
            title="Delete Address"
            message="Permanently delete this address? This cannot be undone."
            confirmLabel="Delete"
            danger
            onConfirm={async () => {
              try {
                await deleteAddress(confirm);
                setAddresses((prev) => prev.filter((a) => a.id !== confirm));
                showToast("Address deleted");
              } catch (e) {
                showToast(e.message, true);
              }
              setConfirm(null);
            }}
            onCancel={() => setConfirm(null)}
          />
        )}
        {showCreate && <CreateAddressModal onClose={() => setShowCreate(false)} onCreated={load} />}
      </AnimatePresence>

      {loadErr && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#ef4444",
            fontSize: 13,
          }}>
          {loadErr}
        </div>
      )}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, city, country…"
        actions={
          <div style={{display: "flex", gap: 8}}>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: "10px 16px",
                background: "#ef4444",
                border: "none",
                color: "#fff",
                borderRadius: 9,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
              <svg
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Address
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
            {filtered.length} address{filtered.length !== 1 ? "es" : ""}
            {search && ` matching "${search}"`}
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0}}>
            Click a row to edit
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={filtered}
          loading={loading}
          onRowClick={setSelected}
          emptyMsg="No addresses found."
        />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 20}}
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.isError ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "12px 24px",
              borderRadius: 99,
              boxShadow: `0 8px 30px ${toast.isError ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
