import {useState, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL || "https://blvckmrktng.com/api";

function getToken() {
  return localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
}

export default function ReceiptUpload({onUpload, onRemove}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null); // {name, url, size}
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    
    // Allow images and PDFs
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Invalid type — use JPG, PNG or PDF.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Too large — max 5MB.");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("receipt", file); // ✅ Field name "receipt" for backend

      const res = await fetch(`${API_BASE}/upload/receipt`, {
        method: "POST",
        headers: {Authorization: `Bearer ${getToken()}`},
        body: form,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 404
            ? "Receipt upload endpoint not found"
            : res.status === 500
              ? "Server error — check configuration"
              : "Server returned an unexpected response",
        );
      }

      if (!res.ok) throw new Error(data.message || "Upload failed");
      
      const receiptData = {
        name: file.name,
        url: data.url || data.data?.url,
        size: file.size,
      };
      
      setReceipt(receiptData);
      onUpload && onUpload(receiptData.url);
    } catch (err) {
      setError(err.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setReceipt(null);
    onRemove && onRemove();
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 12}}>
      <div
        onClick={() => !uploading && !receipt && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!receipt) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!receipt) handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          position: "relative",
          cursor: uploading ? "wait" : receipt ? "default" : "pointer",
          border: `2px dashed ${
            dragOver ? "#ef4444" : receipt ? "#22c55e" : "rgba(255,255,255,0.15)"
          }`,
          borderRadius: 12,
          padding: "32px 24px",
          background: receipt
            ? "rgba(34,197,94,0.05)"
            : dragOver
              ? "rgba(239,68,68,0.05)"
              : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}>
        {uploading ? (
          <>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              style={{animation: "receipt-spin 0.8s linear infinite"}}>
              <path
                strokeLinecap="round"
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              />
            </svg>
            <span
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}>
              Uploading Receipt...
            </span>
          </>
        ) : receipt ? (
          <>
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div style={{textAlign: "center"}}>
              <p
                style={{
                  color: "#22c55e",
                  fontSize: 12,
                  fontWeight: 700,
                  margin: "0 0 4px",
                }}>
                {receipt.name}
              </p>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
                {(receipt.size / 1024).toFixed(1)} KB — Receipt uploaded successfully
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              style={{
                marginTop: 8,
                padding: "6px 16px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 6,
                color: "#ef4444",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              }}>
              Remove & Upload New
            </button>
          </>
        ) : (
          <>
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1.6"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div style={{textAlign: "center"}}>
              <p
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 12,
                  fontWeight: 700,
                  margin: "0 0 4px",
                }}>
                Click or drag to upload receipt
              </p>
              <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0}}>
                PNG, JPG, PDF — max 5MB
              </p>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{opacity: 0, height: 0}}
            animate={{opacity: 1, height: "auto"}}
            exit={{opacity: 0, height: 0}}
            style={{
              color: "#ef4444",
              fontSize: 10,
              fontWeight: 700,
              margin: 0,
              padding: "8px 12px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8,
            }}>
            ⚠️ {error}
          </motion.p>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        style={{display: "none"}}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      <style>{`@keyframes receipt-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}