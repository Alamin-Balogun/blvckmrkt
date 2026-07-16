import {useState, useRef} from "react";

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * ImageUpload
 *
 * Props:
 *  folder   — Cloudinary folder: "logos" | "banners" | "avatars"
 *  shape    — "circle" | "square"  (affects preview only)
 *  label    — button label text
 *  preview  — current URL (controlled)
 *  onUpload — (url: string) => void  called with secure_url on success
 */
export default function ImageUpload({folder = "uploads", shape = "square", label = "Upload Image", preview, onUpload}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [progress, setProgress]   = useState(0);
  const inputRef                  = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Basic validation
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, WEBP or GIF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError("Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env file.");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append("file",           file);
      fd.append("upload_preset",  UPLOAD_PRESET);
      fd.append("folder",         folder);         // e.g. "logos", "banners", "avatars"

      // Use XMLHttpRequest so we can track upload progress
      const url = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.secure_url) {
                resolve(data.secure_url);
              } else {
                reject(new Error(data.error?.message || "Upload failed — no URL returned."));
              }
            } catch {
              reject(new Error("Invalid response from Cloudinary."));
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error?.message || `Upload failed (HTTP ${xhr.status}).`));
            } catch {
              reject(new Error(`Upload failed (HTTP ${xhr.status}).`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error — check your connection."));
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
        xhr.send(fd);
      });

      onUpload?.(url);
      setProgress(100);
    } catch (e) {
      setError(e.message || "Upload failed.");
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{display: "inline-flex", flexDirection: "column", gap: 6, alignItems: "flex-start"}}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{display: "none"}}
        onChange={handleChange}
      />

      {/* Upload button */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          gap:            7,
          background:     uploading ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.04)",
          border:         `1px solid ${uploading ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.12)"}`,
          color:          uploading ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.5)",
          fontSize:       11,
          fontWeight:     700,
          letterSpacing:  "0.12em",
          textTransform:  "uppercase",
          padding:        "8px 14px",
          borderRadius:   7,
          cursor:         uploading ? "not-allowed" : "pointer",
          transition:     "all 0.18s",
          whiteSpace:     "nowrap",
          fontFamily:     "inherit",
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
            e.currentTarget.style.color       = "rgba(239,68,68,0.8)";
            e.currentTarget.style.background  = "rgba(239,68,68,0.06)";
          }
        }}
        onMouseLeave={(e) => {
          if (!uploading) {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.color       = "rgba(255,255,255,0.5)";
            e.currentTarget.style.background  = "rgba(255,255,255,0.04)";
          }
        }}>
        {uploading ? (
          <>
            {/* Spinner */}
            <svg
              width="11" height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{animation: "imgup-spin 0.75s linear infinite", flexShrink: 0}}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
            </svg>
            {progress < 100 ? `Uploading ${progress}%…` : "Processing…"}
          </>
        ) : (
          <>
            {/* Upload icon */}
            <svg
              width="11" height="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{flexShrink: 0}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {label}
          </>
        )}
      </button>

      {/* Progress bar — only while uploading */}
      {uploading && (
        <div style={{
          width:        "100%",
          height:       2,
          background:   "rgba(255,255,255,0.07)",
          borderRadius: 99,
          overflow:     "hidden",
        }}>
          <div style={{
            height:     "100%",
            width:      `${progress}%`,
            background: "#ef4444",
            borderRadius: 99,
            transition: "width 0.2s ease",
          }} />
        </div>
      )}

      {/* Success tick — briefly after upload */}
      {!uploading && preview && progress === 100 && (
        <span style={{
          color:         "#22c55e",
          fontSize:      10,
          fontWeight:    700,
          display:       "flex",
          alignItems:    "center",
          gap:           4,
          letterSpacing: "0.08em",
        }}>
          <svg width="10" height="10" fill="none" stroke="#22c55e" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Uploaded
        </span>
      )}

      {/* Error message */}
      {error && (
        <p style={{
          color:      "#ef4444",
          fontSize:   10,
          fontWeight: 600,
          margin:     0,
          maxWidth:   240,
          lineHeight: 1.5,
        }}>
          ⚠ {error}
        </p>
      )}

      {/* Keyframe for spinner */}
      <style>{`@keyframes imgup-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}