import {useState, useEffect} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {getToken} from "./dashboard_components/api";
import ImageUpload from "../../../../components/ImageUpload";

const BASE       = (import.meta.env.VITE_ADMIN_API_URL ?? "") + "/api/admin";
const UPLOAD_URL = (import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com") + "/api/admin/upload";

// ── API helpers ───────────────────────────────────────────────────────────────
async function blogReq(method, path, body) {
  const token = getToken();
  const headers = {"Content-Type": "application/json"};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!text) return null;
  const json = JSON.parse(text);
  if (!res.ok) throw new Error(json?.message || "Request failed");
  return json?.data ?? json;
}

// ── Shared input style ────────────────────────────────────────────────────────
const inp = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff", fontSize: 13, padding: "10px 13px",
  borderRadius: 9, outline: "none", fontFamily: "inherit",
};

// ── Label helper ──────────────────────────────────────────────────────────────
const FieldLabel = ({children}) => (
  <label style={{color:"rgba(255,255,255,0.35)", fontSize:9, fontWeight:700,
    letterSpacing:"0.18em", textTransform:"uppercase", display:"block", marginBottom:5}}>
    {children}
  </label>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({toast}) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 16}}
          style={{
            position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
            background: toast.isErr ? "#ef4444" : "#22c55e",
            color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "10px 22px", borderRadius: 99,
            boxShadow: `0 8px 28px ${toast.isErr ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
            zIndex: 9999, whiteSpace: "nowrap",
          }}>
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Blog Categories Tab
// ─────────────────────────────────────────────────────────────────────────────
function BlogCategoriesTab() {
  const [cats,    setCats]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({name:"", slug:"", color:"#a855f7", bg_color:"rgba(168,85,247,0.15)", border_color:"rgba(168,85,247,0.3)", sort_order:0});
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, isErr = false) => { setToast({msg, isErr}); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    setLoading(true);
    blogReq("GET", "/blog/categories")
      .then((d) => setCats(d?.categories ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({name:"", slug:"", color:"#a855f7", bg_color:"rgba(168,85,247,0.15)", border_color:"rgba(168,85,247,0.3)", sort_order:0});
    setModal({mode:"create"});
  };
  const openEdit = (cat) => {
    setForm({name: cat.name, slug: cat.slug, color: cat.color, bg_color: cat.bg_color, border_color: cat.border_color, sort_order: cat.sort_order});
    setModal({mode:"edit", cat});
  };

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) { showToast("Name and slug are required", true); return; }
    setSaving(true);
    try {
      if (modal.mode === "create") {
        await blogReq("POST", "/blog/categories", form);
        showToast("Category created");
      } else {
        await blogReq("PATCH", `/blog/categories/${modal.cat.id}`, form);
        showToast("Category updated");
      }
      setModal(null);
      load();
    } catch (err) { showToast(err.message, true); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    try {
      await blogReq("DELETE", `/blog/categories/${id}`);
      showToast("Category deleted");
      load();
    } catch (err) { showToast(err.message, true); }
    setConfirm(null);
  };

  return (
    <div>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20}}>
        <span style={{color:"rgba(255,255,255,0.5)", fontSize:12}}>
          {cats.length} categor{cats.length !== 1 ? "ies" : "y"}
        </span>
        <button onClick={openCreate} style={{background:"#ef4444", color:"#fff", border:"none", borderRadius:8,
          padding:"9px 18px", fontSize:11, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer"}}>
          + New Category
        </button>
      </div>

      {loading ? (
        <p style={{color:"rgba(255,255,255,0.3)", fontSize:12}}>Loading...</p>
      ) : (
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {cats.map((cat) => (
            <div key={cat.id} style={{display:"flex", alignItems:"center", justifyContent:"space-between",
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:10, padding:"12px 16px"}}>
              <div style={{display:"flex", alignItems:"center", gap:12}}>
                <span style={{
                  display:"inline-block", width:10, height:10, borderRadius:"50%",
                  background: cat.color,
                }} />
                <span style={{color:"#fff", fontSize:13, fontWeight:600}}>{cat.name}</span>
                <span style={{color:"rgba(255,255,255,0.3)", fontSize:11}}>/{cat.slug}</span>
              </div>
              <div style={{display:"flex", gap:8}}>
                <button onClick={() => openEdit(cat)} style={{background:"rgba(255,255,255,0.06)", border:"none",
                  borderRadius:6, color:"rgba(255,255,255,0.6)", fontSize:11, padding:"6px 12px", cursor:"pointer"}}>
                  Edit
                </button>
                <button onClick={() => setConfirm(cat.id)} style={{background:"rgba(239,68,68,0.1)", border:"none",
                  borderRadius:6, color:"#ef4444", fontSize:11, padding:"6px 12px", cursor:"pointer"}}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
            style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)",
              zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
            <motion.div initial={{scale:0.94, y:16}} animate={{scale:1, y:0}} exit={{scale:0.94, y:16}}
              style={{width:"100%", maxWidth:420, background:"#111", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:18, overflow:"hidden", boxShadow:"0 40px 80px rgba(0,0,0,0.8)"}}>
              <div style={{height:3, background:"linear-gradient(90deg,#ef4444,transparent)"}} />
              <div style={{padding:"20px 24px 22px", display:"flex", flexDirection:"column", gap:14}}>
                <h3 style={{color:"#fff", fontSize:14, fontWeight:800, margin:0}}>
                  {modal.mode === "create" ? "New Category" : "Edit Category"}
                </h3>
                {[
                  {label:"Name", key:"name"},
                  {label:"Slug", key:"slug"},
                  {label:"Colour (hex)", key:"color"},
                  {label:"Background colour (rgba)", key:"bg_color"},
                  {label:"Border colour (rgba)", key:"border_color"},
                ].map((f) => (
                  <div key={f.key}>
                    <FieldLabel>{f.label}</FieldLabel>
                    <input value={form[f.key] || ""} onChange={(e) => setForm((v) => ({...v, [f.key]: e.target.value}))} style={inp} />
                  </div>
                ))}
                <div style={{display:"flex", gap:10, marginTop:4}}>
                  <button onClick={save} disabled={saving}
                    style={{flex:1, background:saving?"#7f1d1d":"#ef4444", color:"#fff", border:"none",
                      borderRadius:9, padding:"12px", fontSize:12, fontWeight:800, letterSpacing:"0.14em",
                      textTransform:"uppercase", cursor:saving?"not-allowed":"pointer"}}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setModal(null)}
                    style={{padding:"12px 18px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                      color:"rgba(255,255,255,0.5)", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer"}}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {confirm && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9999,
          display:"flex", alignItems:"center", justifyContent:"center"}}>
          <div style={{background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14,
            padding:"28px 32px", maxWidth:360, width:"100%", textAlign:"center"}}>
            <p style={{color:"#fff", fontSize:14, fontWeight:700, marginBottom:8}}>Delete this category?</p>
            <p style={{color:"rgba(255,255,255,0.35)", fontSize:12, marginBottom:24}}>
              This won't delete posts — they'll just lose the category link.
            </p>
            <div style={{display:"flex", gap:10, justifyContent:"center"}}>
              <button onClick={() => del(confirm)} style={{background:"#ef4444", color:"#fff", border:"none",
                borderRadius:8, padding:"10px 24px", fontSize:12, fontWeight:800, cursor:"pointer"}}>
                Delete
              </button>
              <button onClick={() => setConfirm(null)} style={{background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)",
                border:"none", borderRadius:8, padding:"10px 24px", fontSize:12, cursor:"pointer"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Blog Posts Tab
// ─────────────────────────────────────────────────────────────────────────────
function BlogPostsTab() {
  const [posts,      setPosts]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState({});
  const [saving,     setSaving]     = useState(false);
  const [confirm,    setConfirm]    = useState(null);
  const [toast,      setToast]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewComments, setViewComments] = useState(null);
  const [comments,    setComments]    = useState([]);
  const [commLoading, setCommLoading] = useState(false);

  const showToast = (msg, isErr = false) => { setToast({msg, isErr}); setTimeout(() => setToast(null), 3000); };

  const EMPTY = {
    category_id: "", title: "", slug: "", excerpt: "", body: "",
    cover_image: "", author_name: "", author_avatar: "",
    read_time: "5 min read", is_featured: false, status: "draft",
  };

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({limit: 50});
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    blogReq("GET", `/blog/posts?${params}`)
      .then((d) => setPosts(d?.posts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter]);

  useEffect(() => {
    blogReq("GET", "/blog/categories")
      .then((d) => setCategories(d?.categories ?? []))
      .catch(() => {});
  }, []);

  const openCreate = () => { setForm(EMPTY); setModal({mode:"create"}); };
  const openEdit   = async (post) => {
    const d = await blogReq("GET", `/blog/posts/${post.id}`).catch(() => null);
    setForm({
      category_id: post.category_id ?? post.category?.id ?? "",
      title: post.title, slug: post.slug, excerpt: post.excerpt,
      body: d?.body ?? post.body ?? "",
      cover_image: post.cover_image ?? "", author_name: post.author_name ?? post.author?.name ?? "",
      author_avatar: post.author_avatar ?? post.author?.avatar ?? "",
      read_time: post.read_time ?? "5 min read",
      is_featured: post.is_featured ?? false, status: post.status ?? "draft",
    });
    setModal({mode:"edit", post});
  };

  const save = async () => {
    if (!form.title?.trim() || !form.excerpt?.trim() || !form.body?.trim()) {
      showToast("Title, excerpt and body are required", true); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        is_featured: Boolean(form.is_featured),
        sort_order: 0,
      };
      if (modal.mode === "create") {
        await blogReq("POST", "/blog/posts", payload);
        showToast("Post created");
      } else {
        await blogReq("PATCH", `/blog/posts/${modal.post.id}`, payload);
        showToast("Post updated");
      }
      setModal(null);
      load();
    } catch (err) { showToast(err.message, true); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    try {
      await blogReq("DELETE", `/blog/posts/${id}`);
      showToast("Post deleted");
      load();
    } catch (err) { showToast(err.message, true); }
    setConfirm(null);
  };

  const loadComments = (postId) => {
    setViewComments(postId);
    setCommLoading(true);
    blogReq("GET", `/blog/posts/${postId}/comments`)
      .then((d) => setComments(d?.comments ?? []))
      .catch(() => {})
      .finally(() => setCommLoading(false));
  };

  const deleteComment = async (postId, commentId) => {
    try {
      await blogReq("DELETE", `/blog/posts/${postId}/comments/${commentId}`);
      showToast("Comment deleted");
      loadComments(postId);
    } catch (err) { showToast(err.message, true); }
  };

  const statusColor = (s) => s === "published" ? "#22c55e" : "#f59e0b";

  return (
    <div>
      {/* Toolbar */}
      <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap"}}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts..."
          style={{...inp, width:200, padding:"8px 12px"}}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{...inp, width:130, padding:"8px 10px"}}>
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button onClick={openCreate} style={{marginLeft:"auto", background:"#ef4444", color:"#fff",
          border:"none", borderRadius:8, padding:"9px 18px", fontSize:11, fontWeight:800,
          letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer"}}>
          + New Post
        </button>
      </div>

      {loading ? (
        <p style={{color:"rgba(255,255,255,0.3)", fontSize:12}}>Loading...</p>
      ) : (
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {posts.map((post) => (
            <div key={post.id} style={{
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:12, padding:"14px 18px", display:"flex", alignItems:"center", gap:14,
            }}>
              {post.cover_image && (
                <img src={post.cover_image} alt="" style={{width:52, height:40, objectFit:"cover",
                  borderRadius:6, flexShrink:0, filter:"grayscale(20%)"}} />
              )}
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                  <span style={{color:statusColor(post.status), fontSize:9, fontWeight:800,
                    letterSpacing:"0.2em", textTransform:"uppercase"}}>
                    {post.status}
                  </span>
                  {post.is_featured && (
                    <span style={{background:"rgba(239,68,68,0.15)", color:"#ef4444", fontSize:8,
                      fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase",
                      padding:"2px 8px", borderRadius:99}}>
                      ✦ Featured
                    </span>
                  )}
                  <span style={{color:"rgba(255,255,255,0.2)", fontSize:10}}>
                    {post.category?.name || "—"}
                  </span>
                </div>
                <p style={{color:"#fff", fontSize:13, fontWeight:600, margin:0,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                  {post.title}
                </p>
                <p style={{color:"rgba(255,255,255,0.3)", fontSize:10, margin:0}}>
                  {post.date} · {post.read_time} · {post.comment_count ?? 0} comment{post.comment_count !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{display:"flex", gap:6, flexShrink:0}}>
                <button onClick={() => loadComments(post.id)}
                  style={{background:"rgba(255,255,255,0.05)", border:"none", borderRadius:6,
                    color:"rgba(255,255,255,0.5)", fontSize:10, padding:"6px 10px", cursor:"pointer"}}>
                  Comments
                </button>
                <button onClick={() => openEdit(post)}
                  style={{background:"rgba(255,255,255,0.06)", border:"none", borderRadius:6,
                    color:"rgba(255,255,255,0.6)", fontSize:10, padding:"6px 10px", cursor:"pointer"}}>
                  Edit
                </button>
                <button onClick={() => setConfirm(post.id)}
                  style={{background:"rgba(239,68,68,0.1)", border:"none", borderRadius:6,
                    color:"#ef4444", fontSize:10, padding:"6px 10px", cursor:"pointer"}}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p style={{color:"rgba(255,255,255,0.2)", fontSize:12, textAlign:"center", padding:"40px 0"}}>
              No posts yet.
            </p>
          )}
        </div>
      )}

      {/* ── Post form modal ── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
            style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(4px)",
              zIndex:9999, display:"flex", alignItems:"flex-start", justifyContent:"center",
              padding:"32px 20px", overflowY:"auto"}}>
            <motion.div initial={{scale:0.94, y:16}} animate={{scale:1, y:0}} exit={{scale:0.94, y:16}}
              style={{width:"100%", maxWidth:620, background:"#111", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:18, overflow:"hidden", boxShadow:"0 40px 80px rgba(0,0,0,0.9)", marginBottom:32}}>
              <div style={{height:3, background:"linear-gradient(90deg,#ef4444,transparent)"}} />
              <div style={{padding:"20px 24px", borderBottom:"1px solid rgba(255,255,255,0.06)",
                display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                <h3 style={{color:"#fff", fontSize:15, fontWeight:800, margin:0}}>
                  {modal.mode === "create" ? "New Blog Post" : "Edit Post"}
                </h3>
                <button onClick={() => setModal(null)} style={{background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.1)", borderRadius:"50%", width:28, height:28,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  color:"rgba(255,255,255,0.5)", fontSize:14}}>
                  ✕
                </button>
              </div>
              <div style={{padding:"18px 24px 24px", display:"flex", flexDirection:"column", gap:14}}>

                {/* Category */}
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <select value={form.category_id || ""} onChange={(e) => setForm((v) => ({...v, category_id: e.target.value}))} style={{...inp, background:"#1a1a1a"}}>
                    <option value="">— Select category —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <input value={form.title || ""} onChange={(e) => setForm((v) => ({...v, title: e.target.value}))} style={inp} placeholder="Post title..." />
                </div>

                {/* Slug */}
                <div>
                  <FieldLabel>
                    Slug <span style={{color:"rgba(255,255,255,0.2)", fontWeight:400, letterSpacing:0, textTransform:"none"}}>(leave blank to auto-generate)</span>
                  </FieldLabel>
                  <input value={form.slug || ""} onChange={(e) => setForm((v) => ({...v, slug: e.target.value}))} style={inp} placeholder="my-post-slug" />
                </div>

                {/* Excerpt */}
                <div>
                  <FieldLabel>Excerpt</FieldLabel>
                  <textarea value={form.excerpt || ""} onChange={(e) => setForm((v) => ({...v, excerpt: e.target.value}))} rows={3} style={{...inp, resize:"vertical", lineHeight:1.6}} placeholder="Short summary shown in card..." />
                </div>

                {/* Body */}
                <div>
                  <FieldLabel>
                    Body <span style={{color:"rgba(255,255,255,0.2)", fontWeight:400, letterSpacing:0, textTransform:"none"}}>(HTML supported)</span>
                  </FieldLabel>
                  <textarea value={form.body || ""} onChange={(e) => setForm((v) => ({...v, body: e.target.value}))} rows={10} style={{...inp, resize:"vertical", lineHeight:1.6, fontFamily:"monospace"}} placeholder="Full article content..." />
                </div>

                {/* ── Cover Image — upload widget ── */}
                <div>
                  <FieldLabel>Cover Image</FieldLabel>
                  <ImageUpload
                    shape="banner"
                    folder="blog"
                    label="Upload cover image"
                    preview={form.cover_image || ""}
                    uploadUrl={UPLOAD_URL}
                    authToken={getToken()}
                    onUpload={(url) => setForm((v) => ({...v, cover_image: url}))}
                  />
                </div>

                {/* Author */}
                <div style={{display:"grid", gridTemplateColumns:"auto 1fr", gap:16, alignItems:"start"}}>
                  {/* Avatar upload */}
                  <div>
                    <FieldLabel>Author Avatar</FieldLabel>
                    <ImageUpload
                      shape="circle"
                      folder="avatars"
                      label="Avatar"
                      preview={form.author_avatar || ""}
                      uploadUrl={UPLOAD_URL}
                      authToken={getToken()}
                      onUpload={(url) => setForm((v) => ({...v, author_avatar: url}))}
                    />
                  </div>
                  {/* Author name */}
                  <div>
                    <FieldLabel>Author Name</FieldLabel>
                    <input value={form.author_name || ""} onChange={(e) => setForm((v) => ({...v, author_name: e.target.value}))} style={inp} />
                  </div>
                </div>

                {/* Read time + status */}
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                  <div>
                    <FieldLabel>Read Time</FieldLabel>
                    <input value={form.read_time || ""} onChange={(e) => setForm((v) => ({...v, read_time: e.target.value}))} style={inp} placeholder="5 min read" />
                  </div>
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <select value={form.status || "draft"} onChange={(e) => setForm((v) => ({...v, status: e.target.value}))} style={{...inp, background:"#1a1a1a"}}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                {/* Featured toggle */}
                <div onClick={() => setForm((v) => ({...v, is_featured: !v.is_featured}))}
                  style={{display:"flex", alignItems:"center", justifyContent:"space-between",
                    background: form.is_featured ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                    border:`1px solid ${form.is_featured ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius:10, padding:"11px 14px", cursor:"pointer", userSelect:"none"}}>
                  <span style={{color: form.is_featured ? "#ef4444" : "rgba(255,255,255,0.4)", fontSize:12, fontWeight:700}}>
                    ✦ Featured Post (shown at top of blog page)
                  </span>
                  <div style={{width:40, height:22, borderRadius:99,
                    background: form.is_featured ? "#ef4444" : "rgba(255,255,255,0.1)", position:"relative", transition:"background 0.2s"}}>
                    <div style={{position:"absolute", top:3, left: form.is_featured ? 20 : 3, width:16, height:16,
                      borderRadius:"50%", background:"#fff", transition:"left 0.2s"}} />
                  </div>
                </div>

                <div style={{display:"flex", gap:10, marginTop:4}}>
                  <button onClick={save} disabled={saving}
                    style={{flex:1, background:saving?"#7f1d1d":"#ef4444", color:"#fff", border:"none",
                      borderRadius:9, padding:"12px", fontSize:12, fontWeight:800, letterSpacing:"0.14em",
                      textTransform:"uppercase", cursor:saving?"not-allowed":"pointer"}}>
                    {saving ? "Saving..." : modal.mode === "create" ? "Create Post" : "Save Changes"}
                  </button>
                  <button onClick={() => setModal(null)}
                    style={{padding:"12px 18px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                      color:"rgba(255,255,255,0.5)", borderRadius:9, fontSize:12, fontWeight:700, cursor:"pointer"}}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Comments modal ── */}
      <AnimatePresence>
        {viewComments !== null && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={(e) => { if (e.target === e.currentTarget) setViewComments(null); }}
            style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)",
              zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
            <motion.div initial={{scale:0.94, y:16}} animate={{scale:1, y:0}} exit={{scale:0.94, y:16}}
              style={{width:"100%", maxWidth:520, background:"#111", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:18, overflow:"hidden", maxHeight:"80vh", display:"flex", flexDirection:"column"}}>
              <div style={{height:3, background:"linear-gradient(90deg,#ef4444,transparent)"}} />
              <div style={{padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)",
                display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                <h3 style={{color:"#fff", fontSize:14, fontWeight:800, margin:0}}>
                  Comments ({comments.length})
                </h3>
                <button onClick={() => setViewComments(null)} style={{background:"none", border:"none",
                  color:"rgba(255,255,255,0.4)", fontSize:18, cursor:"pointer"}}>✕</button>
              </div>
              <div style={{overflowY:"auto", flex:1, padding:"14px 20px", display:"flex", flexDirection:"column", gap:10}}>
                {commLoading ? (
                  <p style={{color:"rgba(255,255,255,0.3)", fontSize:12}}>Loading...</p>
                ) : comments.length === 0 ? (
                  <p style={{color:"rgba(255,255,255,0.2)", fontSize:12}}>No comments yet.</p>
                ) : (
                  comments.map((cm) => (
                    <div key={cm.id} style={{display:"flex", gap:10, alignItems:"flex-start"}}>
                      <div style={{width:30, height:30, borderRadius:"50%", background:"rgba(239,68,68,0.15)",
                        border:"1px solid rgba(255,255,255,0.08)", flexShrink:0, display:"flex",
                        alignItems:"center", justifyContent:"center", overflow:"hidden"}}>
                        {cm.user?.avatar ? (
                          <img src={cm.user.avatar} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}} />
                        ) : (
                          <span style={{color:"#ef4444", fontSize:11, fontWeight:700}}>
                            {(cm.user?.name || "U")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
                        borderRadius:8, padding:"8px 12px"}}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <span style={{color:"#fff", fontSize:11, fontWeight:700}}>{cm.user?.name || "User"}</span>
                          <div style={{display:"flex", alignItems:"center", gap:8}}>
                            <span style={{color:"rgba(255,255,255,0.2)", fontSize:9}}>
                              {new Date(cm.created_at).toLocaleDateString()}
                            </span>
                            <button onClick={() => deleteComment(viewComments, cm.id)}
                              style={{background:"none", border:"none", color:"rgba(239,68,68,0.6)",
                                fontSize:10, cursor:"pointer", padding:0, fontWeight:700}}>
                              Delete
                            </button>
                          </div>
                        </div>
                        <p style={{color:"rgba(255,255,255,0.5)", fontSize:12, lineHeight:1.5, margin:0}}>
                          {cm.body}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {confirm && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9999,
          display:"flex", alignItems:"center", justifyContent:"center"}}>
          <div style={{background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14,
            padding:"28px 32px", maxWidth:360, width:"100%", textAlign:"center"}}>
            <p style={{color:"#fff", fontSize:14, fontWeight:700, marginBottom:8}}>Delete this post?</p>
            <p style={{color:"rgba(255,255,255,0.35)", fontSize:12, marginBottom:24}}>
              This will also delete all its comments. This cannot be undone.
            </p>
            <div style={{display:"flex", gap:10, justifyContent:"center"}}>
              <button onClick={() => del(confirm)} style={{background:"#ef4444", color:"#fff", border:"none",
                borderRadius:8, padding:"10px 24px", fontSize:12, fontWeight:800, cursor:"pointer"}}>
                Delete
              </button>
              <button onClick={() => setConfirm(null)} style={{background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.5)",
                border:"none", borderRadius:8, padding:"10px 24px", fontSize:12, cursor:"pointer"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AdminBlog export
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminBlog() {
  const [tab, setTab] = useState("posts");

  const tabStyle = (id) => ({
    background: tab === id ? "#ef4444" : "none",
    border: `1px solid ${tab === id ? "#ef4444" : "rgba(255,255,255,0.12)"}`,
    color: tab === id ? "#fff" : "rgba(255,255,255,0.4)",
    fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase",
    padding: "7px 16px", cursor: "pointer", transition: "all 0.2s",
  });

  return (
    <div>
      <div style={{display:"flex", gap:8, marginBottom:24}}>
        <button onClick={() => setTab("posts")} style={tabStyle("posts")}>Posts</button>
        <button onClick={() => setTab("categories")} style={tabStyle("categories")}>Categories</button>
      </div>

      {tab === "posts"      && <BlogPostsTab />}
      {tab === "categories" && <BlogCategoriesTab />}
    </div>
  );
}