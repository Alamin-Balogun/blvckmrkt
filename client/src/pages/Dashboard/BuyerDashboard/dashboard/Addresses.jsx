import {useState, useEffect} from "react";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../dashboard/dashboard_components/api";

const BLANK = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postcode: "",
  country: "",
  is_default: false,
};

const inp = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  fontSize: 13,
  padding: "11px 13px",
  borderRadius: 9,
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};
const onF = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
const onB = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

function Label({children}) {
  return (
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
    </label>
  );
}

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | "add" | { edit: addr }
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    getAddresses()
      .then((data) => {
        setAddresses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setForm(BLANK);
    setMode("add");
    setError("");
  };
  const openEdit = (addr) => {
    setForm({
      label: addr.label,
      line1: addr.line1,
      line2: addr.line2 || "",
      city: addr.city,
      state: addr.state || "",
      postcode: addr.postcode || "",
      country: addr.country,
      is_default: addr.is_default,
    });
    setMode({edit: addr});
    setError("");
  };
  const closeForm = () => {
    setMode(null);
    setForm(BLANK);
  };

  const handleSave = async () => {
    if (!form.label || !form.line1 || !form.city || !form.country) {
      setError("Label, address, city and country are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (mode === "add") {
        const created = await createAddress(form);
        // If set as default, clear others
        setAddresses((prev) => {
          let next = form.is_default ? prev.map((a) => ({...a, is_default: false})) : [...prev];
          return [...next, created];
        });
      } else {
        const updated = await updateAddress(mode.edit.id, form);
        setAddresses((prev) => {
          let next = form.is_default ? prev.map((a) => ({...a, is_default: false})) : [...prev];
          return next.map((a) => (a.id === mode.edit.id ? updated : a));
        });
      }
      closeForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this address?")) return;
    setDeleting(id);
    try {
      await deleteAddress(id);
      setAddresses((prev) => {
        const next = prev.filter((a) => a.id !== id);
        // If deleted was default, promote first
        if (prev.find((a) => a.id === id)?.is_default && next.length > 0) next[0].is_default = true;
        return next;
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (addr) => {
    if (addr.is_default) return;
    try {
      await setDefaultAddress(addr.id);
      setAddresses((prev) => prev.map((a) => ({...a, is_default: a.id === addr.id})));
    } catch (e) {
      alert(e.message);
    }
  };

  const FormPanel = (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 20,
      }}>
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
        {mode === "add" ? "New Address" : "Edit Address"}
      </p>
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8,
            padding: "9px 14px",
            color: "#ef4444",
            fontSize: 12,
            marginBottom: 12,
          }}>
          {error}
        </div>
      )}
      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        <div>
          <Label>Label</Label>
          <input
            placeholder="Home, Work, Warehouse…"
            value={form.label}
            onChange={(e) => setForm({...form, label: e.target.value})}
            style={inp}
            onFocus={onF}
            onBlur={onB}
          />
        </div>
        <div>
          <Label>Address Line 1</Label>
          <input
            placeholder="123 Main St"
            value={form.line1}
            onChange={(e) => setForm({...form, line1: e.target.value})}
            style={inp}
            onFocus={onF}
            onBlur={onB}
          />
        </div>
        <div>
          <Label>
            Address Line 2{" "}
            <span
              style={{
                color: "rgba(255,255,255,0.2)",
                fontWeight: 400,
                textTransform: "none",
                letterSpacing: 0,
              }}>
              (optional)
            </span>
          </Label>
          <input
            placeholder="Apt 4B, Floor 2…"
            value={form.line2}
            onChange={(e) => setForm({...form, line2: e.target.value})}
            style={inp}
            onFocus={onF}
            onBlur={onB}
          />
        </div>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
          <div>
            <Label>City</Label>
            <input
              placeholder="London"
              value={form.city}
              onChange={(e) => setForm({...form, city: e.target.value})}
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>
          <div>
            <Label>State / Region</Label>
            <input
              placeholder="England"
              value={form.state}
              onChange={(e) => setForm({...form, state: e.target.value})}
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>
        </div>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
          <div>
            <Label>Postcode</Label>
            <input
              placeholder="W1D 1AB"
              value={form.postcode}
              onChange={(e) => setForm({...form, postcode: e.target.value})}
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>
          <div>
            <Label>Country</Label>
            <input
              placeholder="United Kingdom"
              value={form.country}
              onChange={(e) => setForm({...form, country: e.target.value})}
              style={inp}
              onFocus={onF}
              onBlur={onB}
            />
          </div>
        </div>
        {/* Default checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            cursor: "pointer",
            userSelect: "none",
          }}>
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm({...form, is_default: e.target.checked})}
            style={{width: 16, height: 16, accentColor: "#ef4444", cursor: "pointer"}}
          />
          <span style={{color: "rgba(255,255,255,0.5)", fontSize: 12}}>
            Set as default delivery address
          </span>
        </label>

        <div style={{display: "flex", gap: 10, marginTop: 4}}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "#7f1d1d" : "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "11px 22px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.18s",
              display: "flex",
              alignItems: "center",
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
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                style={{animation: "pulse 0.8s linear infinite"}}>
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
            {saving ? "Saving..." : "Save Address"}
          </button>
          <button
            onClick={closeForm}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "11px 22px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .addr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;}
        .addr-form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        @media(max-width:480px){.addr-form-row{grid-template-columns:1fr!important;}.addr-grid{grid-template-columns:1fr!important;}}`}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
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
            SAVED ADDRESSES
          </h2>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
            {loading
              ? "Loading..."
              : `${addresses.length} address${addresses.length !== 1 ? "es" : ""} saved`}
          </p>
        </div>
        {!mode && (
          <button
            onClick={openAdd}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "10px 20px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.18s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
            + Add Address
          </button>
        )}
      </div>

      {mode && FormPanel}

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: 14,
          }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 160,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                animation: "pulse 1.4s infinite",
              }}
            />
          ))}
        </div>
      ) : addresses.length === 0 && !mode ? (
        <div
          style={{
            background: "#0d0d0d",
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "60px 24px",
            textAlign: "center",
          }}>
          <svg
            width="40"
            height="40"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            style={{margin: "0 auto 14px", display: "block"}}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 13}}>No saved addresses yet.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: 14,
          }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                background: "#0d0d0d",
                border: `1px solid ${addr.is_default ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14,
                padding: "18px 20px",
                transition: "border-color 0.18s",
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}>
                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                  <span
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                      fontSize: 9,
                      fontWeight: 900,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 99,
                    }}>
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span
                      style={{
                        background: "rgba(34,197,94,0.1)",
                        color: "#22c55e",
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: 99,
                      }}>
                      Default
                    </span>
                  )}
                </div>
                <div style={{display: "flex", gap: 6}}>
                  <button
                    onClick={() => openEdit(addr)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.3)",
                      padding: 0,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr)}
                      title="Set as default"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(255,255,255,0.3)",
                        padding: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#22c55e")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                      <svg
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deleting === addr.id}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: deleting === addr.id ? "not-allowed" : "pointer",
                      color: "rgba(255,255,255,0.25)",
                      padding: 0,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
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
                  </button>
                </div>
              </div>
              <p style={{color: "#fff", fontSize: 13, fontWeight: 600, margin: "0 0 3px"}}>
                {addr.line1}
              </p>
              {addr.line2 && (
                <p style={{color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "0 0 3px"}}>
                  {addr.line2}
                </p>
              )}
              <p style={{color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0}}>
                {addr.city}
                {addr.state ? `, ${addr.state}` : ""}
                {addr.postcode ? ` ${addr.postcode}` : ""}
              </p>
              {addr.country && (
                <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "3px 0 0"}}>
                  {addr.country}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
