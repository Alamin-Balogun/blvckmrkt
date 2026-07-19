import {useState} from "react";
import ScrollCue from "./ScrollCue";

export default function PersonalizationSection({brandName, image}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);

  if (!image) return null;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({title: `${brandName} — BLVCKMRKT`, url});
      } catch {
        // user dismissed the native share sheet — nothing to do
      }
      return;
    }
    navigator.clipboard?.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    });
  };

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", background: "#f5f5f3",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "80px 24px", textAlign: "center",
    }}>
      <div style={{position: "relative", width: "min(60vw, 380px)", marginBottom: 32}}>
        <img src={image} alt="" style={{width: "100%", display: "block", borderRadius: 16, boxShadow: "0 30px 60px rgba(0,0,0,0.15)"}} />
        <div
          onClick={() => setEditing(true)}
          style={{position: "absolute", left: "50%", bottom: "18%", transform: "translateX(-50%)", cursor: "text", minWidth: 180}}>
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => !name && setEditing(false)}
              placeholder="Your name"
              maxLength={24}
              style={{
                background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: 6, padding: "6px 12px", fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.1rem", textAlign: "center", color: "#111", outline: "none", width: "100%",
              }}
            />
          ) : (
            <span style={{
              display: "inline-block", background: "rgba(255,255,255,0.8)", border: "1px dashed rgba(0,0,0,0.25)",
              borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: name ? "none" : "uppercase", color: "#333", fontFamily: name ? "'Bebas Neue', sans-serif" : "inherit",
            }}>
              {name || "Click here and type your name"}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleShare}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, background: "#111", color: "#fff",
          fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase",
          padding: "12px 28px", border: "none", borderRadius: 8, cursor: "pointer",
        }}>
        {shared ? "Link Copied ✓" : "Share"}
      </button>

      <ScrollCue label={`Scroll down to shop ${brandName}`} dark={false} />
    </div>
  );
}
