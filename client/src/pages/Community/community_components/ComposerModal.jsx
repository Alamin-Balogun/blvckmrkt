import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import ImageUpload from "../../../components/ImageUpload";
import {CATEGORIES, categoryStyle, createPost} from "./api";
import {CloseIcon, ImageIcon} from "./icons";

export default function ComposerModal({onClose, onCreated}) {
  const [category, setCategory] = useState("general");
  const [body, setBody]         = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const [focused, setFocused]   = useState(false);

  const submit = async () => {
    const trimmed = body.trim();
    if (trimmed.length < 2) {
      setError("Write a little more before posting.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const post = await createPost({category, body: trimmed, image_url: imageUrl});
      onCreated(post);
    } catch (err) {
      setError(err.message || "Failed to publish post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
        <motion.div
          initial={{opacity: 0, y: 20, scale: 0.98}} animate={{opacity: 1, y: 0, scale: 1}} exit={{opacity: 0, y: 20, scale: 0.98}}
          transition={{duration: 0.22}}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "30px 28px", width: "100%", maxWidth: 540,
            maxHeight: "88vh", overflowY: "auto",
            boxShadow: "0 24px 70px rgba(0,0,0,0.6)",
          }}>
          <div style={{position: "absolute", top: 0, left: 28, right: 28, height: 3, borderRadius: "0 0 3px 3px", background: "linear-gradient(90deg, #ef4444, rgba(239,68,68,0.2))"}} />

          <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22}}>
            <div>
              <h2 style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.7rem", letterSpacing: "0.04em",
                color: "#fff", margin: 0,
              }}>
                New Community Post
              </h2>
              <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11.5, margin: "4px 0 0"}}>
                Share it with every brand and buyer on BLVCKMRKT.
              </p>
            </div>
            <button onClick={onClose} style={closeBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <CloseIcon />
            </button>
          </div>

          <label style={labelStyle}>Topic</label>
          <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18}}>
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              const colors = categoryStyle(c.value);
              return (
                <button key={c.value} onClick={() => setCategory(c.value)} style={{
                  fontSize: 11, fontWeight: 700, padding: "8px 15px", borderRadius: 99, cursor: "pointer",
                  border: active ? `1px solid ${colors.border}` : "1px solid rgba(255,255,255,0.12)",
                  background: active ? colors.bg : "transparent",
                  color: active ? colors.color : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                }}>
                  {c.label}
                </button>
              );
            })}
          </div>

          <label style={labelStyle}>What's on your mind?</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Share a new design, ask for feedback, or start a discussion about streetwear..."
            rows={6}
            maxLength={3000}
            style={{...textareaStyle, borderColor: focused ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}}
          />
          <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10.5, textAlign: "right", margin: "4px 0 0"}}>
            {body.length}/3000
          </p>

          <div style={{marginTop: 16}}>
            <label style={labelStyle}>
              <span style={{display: "inline-flex", alignItems: "center", gap: 5}}>
                <ImageIcon size={12} /> Image (optional)
              </span>
            </label>
            <p style={{color: "rgba(255,255,255,0.28)", fontSize: 11, margin: "0 0 10px"}}>
              Leave this blank if you'd rather not reveal the design yet.
            </p>
            <ImageUpload folder="community" label="Attach Image" preview={imageUrl} onUpload={setImageUrl} />
            {imageUrl && (
              <button onClick={() => setImageUrl("")} style={{...ghostBtnStyle, marginTop: 10, padding: "8px 16px"}}>
                Remove Image
              </button>
            )}
          </div>

          {error && <p style={{color: "#ef4444", fontSize: 12, marginTop: 14}}>{error}</p>}

          <div style={{display: "flex", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)"}}>
            <button onClick={submit} disabled={busy} style={primaryBtnStyle}>
              {busy ? "Publishing..." : "Publish Post"}
            </button>
            <button onClick={onClose} style={ghostBtnStyle}>Cancel</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const labelStyle = {
  display: "block", color: "rgba(255,255,255,0.5)", fontSize: 10.5, fontWeight: 700,
  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8,
};

const closeBtnStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
  background: "transparent", border: "none", color: "rgba(255,255,255,0.5)",
  cursor: "pointer", transition: "background 0.15s",
};

const textareaStyle = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff",
  fontSize: 13.5, padding: "14px 16px", outline: "none", resize: "vertical",
  fontFamily: "inherit", lineHeight: 1.65, transition: "border-color 0.2s",
};

const primaryBtnStyle = {
  background: "#ef4444", color: "#fff", border: "none", borderRadius: 9,
  padding: "12px 24px", fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer",
  boxShadow: "0 6px 20px rgba(239,68,68,0.25)",
};

const ghostBtnStyle = {
  background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 9, padding: "12px 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer",
};
