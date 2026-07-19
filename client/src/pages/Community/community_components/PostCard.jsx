import {useState} from "react";
import {Link} from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import {useAuth} from "../../Auth/context/authcontext";
import {
  CATEGORIES, categoryLabel, isLoggedIn,
  toggleLike, updatePost, deletePost,
  listComments, createComment, deleteComment,
  reportPost, reportComment,
} from "./api";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
}

const btnBase = {
  display: "flex", alignItems: "center", gap: 6,
  background: "transparent", border: "none", cursor: "pointer",
  color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700,
  letterSpacing: "0.04em", padding: "6px 10px", borderRadius: 8,
  transition: "color 0.15s, background 0.15s",
};

export default function PostCard({post, onChanged}) {
  const {user} = useAuth();
  const isOwner = user && Number(user.id) === Number(post.user_id);

  const [liked, setLiked]           = useState(!!post.liked_by_me);
  const [likeCount, setLikeCount]   = useState(post.like_count);
  const [likeBusy, setLikeBusy]     = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState(null);
  const [commentBody, setCommentBody]   = useState("");
  const [commentBusy, setCommentBusy]   = useState(false);

  const [editing, setEditing]     = useState(false);
  const [editBody, setEditBody]   = useState(post.body);
  const [editCategory, setEditCategory] = useState(post.category);
  const [editBusy, setEditBusy]   = useState(false);

  const [menuOpen, setMenuOpen]   = useState(false);
  const [error, setError]         = useState("");

  const author = post.author || {};
  const brand  = author.brand;

  const handleLike = async () => {
    if (!isLoggedIn()) {
      setError("Sign in to like posts.");
      return;
    }
    if (likeBusy) return;
    setLikeBusy(true);
    const prevLiked = liked, prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    try {
      const res = await toggleLike(post.id);
      setLiked(res.liked_by_me);
      setLikeCount(res.like_count);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeBusy(false);
    }
  };

  const loadComments = async () => {
    setShowComments(true);
    if (comments !== null) return;
    try {
      const data = await listComments(post.id);
      setComments(data.comments);
    } catch {
      setComments([]);
    }
  };

  const submitComment = async () => {
    if (!isLoggedIn()) {
      setError("Sign in to comment.");
      return;
    }
    const body = commentBody.trim();
    if (body.length < 2) return;
    setCommentBusy(true);
    try {
      const newComment = await createComment(post.id, body);
      setComments((prev) => [...(prev || []), newComment]);
      setCommentBody("");
      onChanged?.({...post, comment_count: post.comment_count + 1});
    } catch (err) {
      setError(err.message || "Failed to post comment");
    } finally {
      setCommentBusy(false);
    }
  };

  const removeComment = async (id) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onChanged?.({...post, comment_count: Math.max(0, post.comment_count - 1)});
    } catch (err) {
      setError(err.message || "Failed to delete comment");
    }
  };

  const saveEdit = async () => {
    const body = editBody.trim();
    if (body.length < 2) return;
    setEditBusy(true);
    try {
      const updated = await updatePost(post.id, {category: editCategory, body});
      onChanged?.(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update post");
    } finally {
      setEditBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      await deletePost(post.id);
      onChanged?.(null, post.id);
    } catch (err) {
      setError(err.message || "Failed to delete post");
    }
  };

  const handleReport = async () => {
    setMenuOpen(false);
    if (!isLoggedIn()) {
      setError("Sign in to report posts.");
      return;
    }
    const reason = window.prompt("Why are you reporting this post? (optional)") ?? "";
    try {
      await reportPost(post.id, reason);
      window.alert("Thanks — this post has been flagged for review.");
    } catch (err) {
      setError(err.message || "Failed to report post");
    }
  };

  const handleReportComment = async (id) => {
    const reason = window.prompt("Why are you reporting this comment? (optional)") ?? "";
    try {
      await reportComment(id, reason);
      window.alert("Thanks — this comment has been flagged for review.");
    } catch (err) {
      setError(err.message || "Failed to report comment");
    }
  };

  return (
    <motion.div
      initial={{opacity: 0, y: 12}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.3}}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "20px 22px", marginBottom: 18,
      }}>

      {/* Header */}
      <div style={{display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14}}>
        <div style={{
          width: 42, height: 42, borderRadius: brand ? 10 : "50%", flexShrink: 0,
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(255,255,255,0.1)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {(brand?.logo_url || author.avatar) ? (
            <img src={brand?.logo_url || author.avatar} alt={author.name}
              style={{width: "100%", height: "100%", objectFit: "cover"}} />
          ) : (
            <span style={{color: "#ef4444", fontWeight: 700}}>{(author.name || "U")[0]?.toUpperCase()}</span>
          )}
        </div>

        <div style={{flex: 1, minWidth: 0}}>
          <div style={{display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"}}>
            {brand ? (
              <Link to={`/brands/${brand.slug}`} style={{color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none"}}>
                {brand.brand_name}
              </Link>
            ) : (
              <span style={{color: "#fff", fontSize: 13, fontWeight: 700}}>{author.name || "User"}</span>
            )}
            {brand && (
              <span style={{
                fontSize: 8, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
                padding: "2px 7px", borderRadius: 99, background: "rgba(239,68,68,0.15)",
                color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)",
              }}>
                Brand{brand.verified ? " ✓" : ""}
              </span>
            )}
          </div>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10.5, letterSpacing: "0.05em", margin: "2px 0 0"}}>
            {timeAgo(post.created_at)}
          </p>
        </div>

        <span style={{
          fontSize: 8, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
          padding: "4px 10px", borderRadius: 99, background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", whiteSpace: "nowrap",
        }}>
          {categoryLabel(post.category)}
        </span>

        {/* Menu */}
        <div style={{position: "relative"}}>
          <button onClick={() => setMenuOpen((v) => !v)} style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.4)",
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 6px",
          }}>⋯</button>
          {menuOpen && (
            <div style={{
              position: "absolute", right: 0, top: 26, zIndex: 10,
              background: "#111", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, overflow: "hidden", minWidth: 140,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}>
              {isOwner ? (
                <>
                  <button onClick={() => {setEditing(true); setMenuOpen(false);}} style={menuItemStyle}>Edit</button>
                  <button onClick={() => {setMenuOpen(false); handleDelete();}} style={{...menuItemStyle, color: "#ef4444"}}>Delete</button>
                </>
              ) : (
                <button onClick={handleReport} style={menuItemStyle}>Report</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body / Edit form */}
      {editing ? (
        <div style={{marginBottom: 12}}>
          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={selectStyle}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} style={textareaStyle} />
          <div style={{display: "flex", gap: 8, marginTop: 8}}>
            <button onClick={saveEdit} disabled={editBusy} style={primaryBtnStyle}>
              {editBusy ? "Saving..." : "Save"}
            </button>
            <button onClick={() => {setEditing(false); setEditBody(post.body); setEditCategory(post.category);}} style={ghostBtnStyle}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p style={{color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.65, margin: "0 0 14px", whiteSpace: "pre-wrap"}}>
          {post.body}
        </p>
      )}

      {post.image_url && !editing && (
        <img src={post.image_url} alt="" style={{
          width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 12, marginBottom: 14,
          border: "1px solid rgba(255,255,255,0.08)",
        }} />
      )}

      {error && <p style={{color: "#ef4444", fontSize: 11, marginBottom: 10}}>{error}</p>}

      {/* Actions */}
      <div style={{display: "flex", gap: 6, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10}}>
        <button onClick={handleLike} style={{...btnBase, color: liked ? "#ef4444" : btnBase.color}}>
          {liked ? "♥" : "♡"} {likeCount}
        </button>
        <button onClick={loadComments} style={btnBase}>
          💬 {post.comment_count}
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{height: 0, opacity: 0}} animate={{height: "auto", opacity: 1}} exit={{height: 0, opacity: 0}}
            style={{overflow: "hidden"}}>
            <div style={{marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)"}}>
              {comments === null && <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12}}>Loading comments...</p>}
              {comments?.length === 0 && (
                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 12}}>No comments yet — start the conversation.</p>
              )}
              <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 12}}>
                {comments?.map((cm) => (
                  <div key={cm.id} style={{display: "flex", gap: 8}}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                      {cm.author?.avatar ? (
                        <img src={cm.author.avatar} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
                      ) : (
                        <span style={{color: "#ef4444", fontSize: 11, fontWeight: 700}}>{(cm.author?.name || "U")[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{
                      flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10, padding: "8px 12px",
                    }}>
                      <div style={{display: "flex", justifyContent: "space-between", gap: 8}}>
                        <span style={{color: "#fff", fontSize: 11, fontWeight: 700}}>{cm.author?.name || "User"}</span>
                        <span style={{color: "rgba(255,255,255,0.2)", fontSize: 9.5}}>{timeAgo(cm.created_at)}</span>
                      </div>
                      <p style={{color: "rgba(255,255,255,0.6)", fontSize: 12.5, margin: "3px 0 0", lineHeight: 1.5}}>{cm.body}</p>
                      {user && (
                        <div style={{display: "flex", gap: 10, marginTop: 4}}>
                          {(Number(user.id) === Number(cm.user_id) || isOwner) && (
                            <button onClick={() => removeComment(cm.id)} style={tinyLinkStyle}>Delete</button>
                          )}
                          {Number(user.id) !== Number(cm.user_id) && (
                            <button onClick={() => handleReportComment(cm.id)} style={tinyLinkStyle}>Report</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isLoggedIn() ? (
                <div style={{display: "flex", gap: 8}}>
                  <input
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Add a comment..."
                    onKeyDown={(e) => e.key === "Enter" && submitComment()}
                    style={inputStyle}
                  />
                  <button onClick={submitComment} disabled={commentBusy} style={primaryBtnStyle}>Post</button>
                </div>
              ) : (
                <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12}}>
                  <Link to="/login" style={{color: "#ef4444", textDecoration: "none", fontWeight: 700}}>Sign in</Link> to join the conversation.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const menuItemStyle = {
  display: "block", width: "100%", textAlign: "left", background: "transparent",
  border: "none", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600,
  padding: "10px 14px", cursor: "pointer",
};

const selectStyle = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff",
  fontSize: 12, padding: "8px 10px", marginBottom: 8, outline: "none",
};

const textareaStyle = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff",
  fontSize: 13, padding: "10px 12px", outline: "none", resize: "vertical",
  fontFamily: "inherit", lineHeight: 1.6,
};

const inputStyle = {
  flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: 12.5, padding: "9px 12px", outline: "none",
};

const primaryBtnStyle = {
  background: "#ef4444", color: "#fff", border: "none", borderRadius: 8,
  padding: "9px 18px", fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap",
};

const ghostBtnStyle = {
  background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, padding: "9px 18px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer",
};

const tinyLinkStyle = {
  background: "transparent", border: "none", color: "rgba(255,255,255,0.3)",
  fontSize: 10.5, fontWeight: 700, cursor: "pointer", padding: 0,
};
