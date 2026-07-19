import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import ImageUpload from "../../../components/ImageUpload";
import {CATEGORIES, createPost} from "./api";

export default function ComposerModal({onClose, onCreated}) {
  const [category, setCategory] = useState("general");
  const [body, setBody]         = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");

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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
        <motion.div
          initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 20}}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18, padding: "28px 26px", width: "100%", maxWidth: 520,
            maxHeight: "88vh", overflowY: "auto",
          }}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: "0.04em",
            color: "#fff", margin: "0 0 18px",
          }}>
            New Community Post
          </h2>

          <label style={labelStyle}>Topic</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <label style={labelStyle}>What's on your mind?</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share a new design, ask for feedback, or start a discussion about streetwear..."
            rows={6}
            maxLength={3000}
            style={textareaStyle}
          />
          <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10.5, textAlign: "right", margin: "4px 0 0"}}>
            {body.length}/3000
          </p>

          <div style={{marginTop: 14}}>
            <label style={labelStyle}>Image (optional — leave blank if you'd rather not reveal it yet)</label>
            <ImageUpload folder="community" label="Attach Image" preview={imageUrl} onUpload={setImageUrl} />
            {imageUrl && (
              <button onClick={() => setImageUrl("")} style={{...ghostBtnStyle, marginTop: 8}}>
                Remove Image
              </button>
            )}
          </div>

          {error && <p style={{color: "#ef4444", fontSize: 12, marginTop: 12}}>{error}</p>}

          <div style={{display: "flex", gap: 10, marginTop: 22}}>
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
  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, marginTop: 14,
};

const selectStyle = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff",
  fontSize: 13, padding: "10px 12px", outline: "none",
};

const textareaStyle = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff",
  fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical",
  fontFamily: "inherit", lineHeight: 1.6,
};

const primaryBtnStyle = {
  background: "#ef4444", color: "#fff", border: "none", borderRadius: 8,
  padding: "11px 22px", fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer",
};

const ghostBtnStyle = {
  background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, padding: "11px 22px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer",
};
