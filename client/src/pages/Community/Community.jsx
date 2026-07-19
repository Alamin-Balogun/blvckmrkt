import {useState, useEffect, useCallback} from "react";
import {Link} from "react-router-dom";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import PageHeader from "../../components/pageheader";
import {useAuth} from "../Auth/context/authcontext";
import {CATEGORIES, categoryStyle, listPosts} from "./community_components/api";
import {PlusIcon} from "./community_components/icons";
import PostCard from "./community_components/PostCard";
import ComposerModal from "./community_components/ComposerModal";

const HERO_IMAGE = "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1600&q=80";

export default function Community() {
  const {user} = useAuth();

  const [category, setCategory] = useState("");
  const [sort, setSort]         = useState("newest");
  const [posts, setPosts]       = useState([]);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]       = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const fetchPosts = useCallback((pageNum, replace) => {
    (replace ? setLoading : setLoadingMore)(true);
    listPosts({category, sort, page: pageNum, limit: 10})
      .then((data) => {
        setPosts((prev) => (replace ? data.posts : [...prev, ...data.posts]));
        setPages(data.pages);
        setPage(pageNum);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load the community feed"))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [category, sort]);

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  const handleChanged = (updated, deletedId) => {
    if (deletedId) {
      setPosts((prev) => prev.filter((p) => p.id !== deletedId));
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? {...p, ...updated} : p)));
  };

  const handleNewPost = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setShowComposer(true);
  };

  return (
    <div style={{background: "#000", minHeight: "100vh"}}>
      <Navbar />
      <PageHeader title="Community" breadcrumb="Community" image={HERO_IMAGE} />

      {/* ── Intro strip ─────────────────────────────────────────────────────── */}
      <div style={{maxWidth: 760, margin: "0 auto", padding: "48px 24px 0", textAlign: "center"}}>
        <span style={eyebrowStyle}>✦ Brands &amp; Buyers, Together</span>
        <p style={{color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.7, maxWidth: 560, margin: "10px auto 0"}}>
          Drop a new design for feedback, show off a fit, or start a conversation —
          the floor is open to every brand and buyer on BLVCKMRKT.
        </p>
      </div>

      <div style={{maxWidth: 760, margin: "0 auto", padding: "36px 24px 110px"}}>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div style={toolbarStyle}>
          <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
            <FilterChip active={category === ""} onClick={() => setCategory("")}>All</FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)} colors={categoryStyle(c.value)}>
                {c.label}
              </FilterChip>
            ))}
          </div>

          <button onClick={handleNewPost} style={newPostBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
            <PlusIcon /> New Post
          </button>
        </div>

        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22}}>
          <div style={{display: "flex", gap: 2, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 3}}>
            <SortTab active={sort === "newest"} onClick={() => setSort("newest")}>Newest</SortTab>
            <SortTab active={sort === "top"} onClick={() => setSort("top")}>Most Liked</SortTab>
          </div>
        </div>

        {loading && (
          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 150, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 18, animation: "pulse 1.4s infinite",
              }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <p style={{color: "#ef4444", fontSize: 13, textAlign: "center", padding: "50px 0"}}>{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <div style={{textAlign: "center", padding: "70px 0", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 18}}>
            <p style={{color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 14}}>
              No posts yet in this topic — be the first to start the conversation.
            </p>
            {!user && (
              <p style={{color: "rgba(255,255,255,0.25)", fontSize: 12}}>
                <Link to="/login" style={{color: "#ef4444", textDecoration: "none", fontWeight: 700}}>Sign in</Link> to post.
              </p>
            )}
          </div>
        )}

        {!loading && posts.map((post) => (
          <PostCard key={post.id} post={post} onChanged={handleChanged} />
        ))}

        {!loading && page < pages && (
          <div style={{textAlign: "center", marginTop: 10}}>
            <button
              onClick={() => fetchPosts(page + 1, false)}
              disabled={loadingMore}
              style={loadMoreBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}>
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {showComposer && (
        <ComposerModal
          onClose={() => setShowComposer(false)}
          onCreated={(post) => {
            setPosts((prev) => [post, ...prev]);
            setShowComposer(false);
          }}
        />
      )}

      <Footer />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .community-menu-item:hover { background: rgba(255,255,255,0.06); }
      `}</style>
    </div>
  );
}

const eyebrowStyle = {
  display: "inline-block", color: "#ef4444", fontSize: 10.5, fontWeight: 900,
  letterSpacing: "0.22em", textTransform: "uppercase",
};

const toolbarStyle = {
  display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
  gap: 14, marginBottom: 18, paddingBottom: 22, borderBottom: "1px solid rgba(255,255,255,0.07)",
};

const newPostBtnStyle = {
  display: "flex", alignItems: "center", gap: 7,
  background: "#ef4444", color: "#fff", border: "none", borderRadius: 9,
  padding: "11px 20px", fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap",
  boxShadow: "0 6px 20px rgba(239,68,68,0.25)", transition: "background 0.2s",
};

const loadMoreBtnStyle = {
  background: "transparent", color: "rgba(255,255,255,0.6)",
  border: "1px solid rgba(255,255,255,0.15)", borderRadius: 9,
  padding: "11px 26px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", cursor: "pointer", transition: "border-color 0.2s",
};

function FilterChip({active, onClick, children, colors}) {
  const c = active && colors ? colors : null;
  return (
    <button onClick={onClick} style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      padding: "7px 15px", borderRadius: 99, cursor: "pointer",
      border: c ? `1px solid ${c.border}` : active ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)",
      background: c ? c.bg : active ? "rgba(239,68,68,0.15)" : "transparent",
      color: c ? c.color : active ? "#ef4444" : "rgba(255,255,255,0.5)",
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

function SortTab({active, onClick, children}) {
  return (
    <button onClick={onClick} style={{
      background: active ? "rgba(255,255,255,0.08)" : "transparent",
      border: "none", cursor: "pointer", borderRadius: 7,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "7px 14px",
      color: active ? "#fff" : "rgba(255,255,255,0.35)",
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}
