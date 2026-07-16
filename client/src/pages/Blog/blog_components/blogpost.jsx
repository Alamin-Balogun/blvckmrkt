import {useState, useEffect, useRef} from "react";
import {useParams, Link} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

function getToken() {
  return localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
}

function catStyle(category) {
  if (!category) return {bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.15)"};
  return {
    bg:     category.bg_color     || "rgba(255,255,255,0.08)",
    color:  category.color        || "rgba(255,255,255,0.5)",
    border: category.border_color || "rgba(255,255,255,0.15)",
  };
}

export default function BlogPost() {
  const {slug} = useParams();
  const commentsRef = useRef(null);

  const [post,      setPost]      = useState(null);
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Comment form
  const [commentBody,    setCommentBody]    = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [commentError,   setCommentError]   = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);

  // ── Fetch post ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/blog/posts/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Post not found");
        return r.json();
      })
      .then((json) => {
        setPost(json?.data ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Fetch comments ──────────────────────────────────────────────────────────
  const fetchComments = () => {
    fetch(`${API_BASE}/api/blog/posts/${slug}/comments`)
      .then((r) => r.json())
      .then((json) => setComments(json?.data?.comments ?? []))
      .catch(() => {});
  };

  useEffect(() => { fetchComments(); }, [slug]);

  // ── Scroll to comments if #comments in URL ─────────────────────────────────
  useEffect(() => {
    if (window.location.hash === "#comments" && commentsRef.current) {
      setTimeout(() => commentsRef.current.scrollIntoView({behavior: "smooth"}), 400);
    }
  }, [post]);

  // ── Submit comment ──────────────────────────────────────────────────────────
  const handleComment = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setCommentError("You need to be logged in to comment.");
      return;
    }
    const body = commentBody.trim();
    if (body.length < 2) {
      setCommentError("Comment is too short.");
      return;
    }

    setSubmitting(true);
    setCommentError("");
    setCommentSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/user/blog/${slug}/comments`, {
        method: "POST",
        headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
        body: JSON.stringify({body}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to post comment");

      setCommentBody("");
      setCommentSuccess(true);
      fetchComments();
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (err) {
      setCommentError(err.message || "Failed to post comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{background: "#000", minHeight: "100vh"}}>
        <Navbar />
        <div style={{maxWidth: 800, margin: "0 auto", padding: "80px 24px"}}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{height: i === 1 ? 48 : 16, background: "rgba(255,255,255,0.06)",
              borderRadius: 6, marginBottom: 16, width: i % 2 === 0 ? "80%" : "100%",
              animation: "pulse 1.4s infinite"}} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{background: "#000", minHeight: "100vh"}}>
        <Navbar />
        <div style={{maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center"}}>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 14}}>
            {error || "Post not found."}
          </p>
          <Link to="/blog" style={{color: "#ef4444", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em",
            textTransform: "uppercase", textDecoration: "none", marginTop: 16, display: "inline-block"}}>
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const cc = catStyle(post.category);

  return (
    <div style={{background: "#000", minHeight: "100vh"}}>
      <Navbar />

      {/* ── Hero image ─────────────────────────────────────────────────────── */}
      {post.cover_image && (
        <div style={{position: "relative", width: "100%", height: 480, overflow: "hidden"}}>
          <img
            src={post.cover_image}
            alt={post.title}
            style={{width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(15%)"}}
          />
          <div style={{position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 30%, #000 100%)"}} />
        </div>
      )}

      <div style={{maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px"}}>

        {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
        <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 32}}>
          <Link to="/blog" style={{color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none",
            transition: "color 0.2s"}}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
            Blog
          </Link>
          <svg width="8" height="8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.1em"}}>
            {post.category?.name}
          </span>
        </div>

        {/* ── Category pill ────────────────────────────────────────────────── */}
        {post.category && (
          <span style={{
            display: "inline-block", fontSize: 8, fontWeight: 900, letterSpacing: "0.22em",
            textTransform: "uppercase", padding: "4px 12px", borderRadius: 99,
            border: `1px solid ${cc.border}`, background: cc.bg, color: cc.color, marginBottom: 20,
          }}>
            {post.category.name}
          </span>
        )}

        {/* ── Title ────────────────────────────────────────────────────────── */}
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          letterSpacing: "0.04em",
          color: "#fff",
          lineHeight: 1.1,
          margin: "0 0 20px",
        }}>
          {post.title}
        </h1>

        {/* ── Meta row ─────────────────────────────────────────────────────── */}
        <div style={{display: "flex", alignItems: "center", gap: 16, marginBottom: 40,
          paddingBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.08)"}}>
          {post.author?.avatar && (
            <img src={post.author.avatar} alt={post.author.name}
              style={{width: 36, height: 36, borderRadius: "50%", objectFit: "cover",
                filter: "grayscale(25%)", border: "2px solid rgba(239,68,68,0.4)"}} />
          )}
          <div>
            <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>
              {post.author?.name || post.author_name}
            </p>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.1em", margin: 0}}>
              {post.date} · {post.read_time}
            </p>
          </div>
          <div style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 6}}>
            <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
              {post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 15,
            lineHeight: 1.85,
            marginBottom: 64,
          }}
          dangerouslySetInnerHTML={{__html: post.body}}
        />

        {/* ── Comments section ──────────────────────────────────────────────── */}
        <div ref={commentsRef} id="comments" style={{borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 48}}>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.8rem", letterSpacing: "0.04em",
            color: "#fff", marginBottom: 32,
          }}>
            {comments.length} Comment{comments.length !== 1 ? "s" : ""}
          </h2>

          {/* Comment list */}
          <div style={{display: "flex", flexDirection: "column", gap: 16, marginBottom: 40}}>
            <AnimatePresence>
              {comments.map((cm) => (
                <motion.div
                  key={cm.id}
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.3}}
                  style={{display: "flex", gap: 12, alignItems: "flex-start"}}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(239,68,68,0.2)", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden",
                  }}>
                    {cm.user?.avatar ? (
                      <img src={cm.user.avatar} alt={cm.user.name}
                        style={{width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(25%)"}} />
                    ) : (
                      <span style={{color: "#ef4444", fontSize: 12, fontWeight: 700}}>
                        {(cm.user?.name || "U")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Bubble */}
                  <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10, padding: "10px 14px", flex: 1,
                  }}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6}}>
                      <span style={{color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em"}}>
                        {cm.user?.name || "User"}
                      </span>
                      <span style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                        {timeAgo(cm.created_at)}
                      </span>
                    </div>
                    <p style={{color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6, margin: 0}}>
                      {cm.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {comments.length === 0 && (
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", padding: "32px 0"}}>
                No comments yet — be the first to share your thoughts.
              </p>
            )}
          </div>

          {/* Comment form */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "28px 24px",
          }}>
            <h3 style={{color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", marginBottom: 16}}>
              Leave a Comment
            </h3>

            {!getToken() && (
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, marginBottom: 16}}>
                <Link to="/login" style={{color: "#ef4444", textDecoration: "none", fontWeight: 700}}>
                  Sign in
                </Link>{" "}
                to join the conversation.
              </p>
            )}

            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Share your thoughts..."
              disabled={!getToken() || submitting}
              rows={4}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, color: "#fff", fontSize: 13,
                padding: "12px 14px", outline: "none", resize: "vertical",
                fontFamily: "inherit", lineHeight: 1.6,
                transition: "border-color 0.2s",
                opacity: !getToken() ? 0.4 : 1,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />

            {commentError && (
              <p style={{color: "#ef4444", fontSize: 11, marginTop: 8}}>{commentError}</p>
            )}
            {commentSuccess && (
              <p style={{color: "#22c55e", fontSize: 11, marginTop: 8}}>✓ Comment posted!</p>
            )}

            <button
              onClick={handleComment}
              disabled={submitting || !getToken()}
              style={{
                marginTop: 12,
                background: submitting ? "#7f1d1d" : "#ef4444",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 24px", fontSize: 11, fontWeight: 900,
                letterSpacing: "0.2em", textTransform: "uppercase",
                cursor: submitting || !getToken() ? "not-allowed" : "pointer",
                opacity: !getToken() ? 0.4 : 1,
                transition: "background 0.2s",
              }}>
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </div>

      <Footer />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}