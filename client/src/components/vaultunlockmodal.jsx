// components/vaultunlockmodal.jsx
//
// Shared "ENTER CODE" modal for The Vault — used both by the homepage Vault
// section (thevault.jsx) and the product detail page when it's hit directly
// on a locked Vault product. Calls POST /api/shop/vault/unlock; on success
// stores the unlock token in localStorage (so it survives across visits,
// unlike sessionStorage) and either navigates to the now-unlockable detail
// page (default) or hands the token back to the caller via onUnlocked, for
// callers that are already on the detail page and just need to re-fetch.
import {useState} from "react";
import {useNavigate} from "react-router-dom";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

export default function VaultUnlockModal({productId, onClose, onUnlocked}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/shop/vault/unlock`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({product_id: productId, code: code.trim()}),
      });
      const json = await res.json();
      if (!res.ok || !json?.data?.unlock_token) {
        setError(json?.message || "Incorrect access code");
        setLoading(false);
        return;
      }
      const {unlock_token, slug} = json.data;
      localStorage.setItem(`vault_token_${productId}`, unlock_token);
      if (onUnlocked) {
        onUnlocked({unlockToken: unlock_token, slug});
      } else {
        navigate(`/shop/${slug}?vault_token=${unlock_token}`);
      }
    } catch {
      setError("Something went wrong — try again");
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        zIndex: 10001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(239,68,68,0.35)",
          borderRadius: 12,
          padding: "28px 26px",
          maxWidth: 360,
          width: "100%",
          fontFamily: "'Space Mono', monospace",
        }}>
        <div style={{color: "#ef4444", fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", marginBottom: 10}}>
          🔒 ACCESS REQUIRED
        </div>
        <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.6, margin: "0 0 16px"}}>
          Enter the access code to unlock this classified item.
        </p>
        <input
          autoFocus
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ENTER CODE"
          autoComplete="off"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            color: "#fff",
            padding: "12px 14px",
            fontSize: 13,
            letterSpacing: "0.1em",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
        {error && (
          <div style={{color: "#ef4444", fontSize: 11, marginTop: 8, letterSpacing: "0.03em"}}>{error}</div>
        )}
        <div style={{display: "flex", gap: 10, marginTop: 18}}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.5)",
              padding: "11px",
              borderRadius: 6,
              fontSize: 11,
              letterSpacing: "0.15em",
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
            CANCEL
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              background: "#ef4444",
              border: "none",
              color: "#fff",
              padding: "11px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "inherit",
            }}>
            {loading ? "..." : "UNLOCK"}
          </button>
        </div>
      </form>
    </div>
  );
}
