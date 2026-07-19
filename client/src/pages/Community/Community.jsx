import {useState, useEffect, useCallback} from "react";
import {Link} from "react-router-dom";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import {useAuth} from "../Auth/context/authcontext";
import {CATEGORIES, listPosts} from "./community_components/api";
import PostCard from "./community_components/PostCard";
import ComposerModal from "./community_components/ComposerModal";

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

      {/* Hero */}
      <div style={{maxWidth: 900, margin: "0 auto", padding: "56px 24px 24px", textAlign: "center"}}>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.2rem, 6vw, 3.6rem)",
          letterSpacing: "0.04em", color: "#fff", margin: "0 0 12px",
        }}>
          Community
        </h1>
        <p style={{color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.6, maxWidth: 560, margin: "0 auto"}}>
          Where brands and buyers talk streetwear — drop a new design for feedback,
          show off a fit, or just start a conversation.
        </p>
      </div>

      <div style={{maxWidth: 720, margin: "0 auto", padding: "0 24px 100px"}}>

        {/* Controls */}
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
          gap: 12, marginBottom: 24,
        }}>
          <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
            <FilterChip active={category === ""} onClick={() => setCategory("")}>All</FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
                {c.label}
              </FilterChip>
            ))}
          </div>

          <button onClick={handleNewPost} style={{
            background: "#ef4444", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 20px", fontSize: 11, fontWeight: 900, letterSpacing: "0.1em",
            textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap",
          }}>
            + New Post
          </button>
        </div>

        <div style={{display: "flex", gap: 8, marginBottom: 20}}>
          <SortTab active={sort === "newest"} onClick={() => setSort("newest")}>Newest</SortTab>
          <SortTab active={sort === "top"} onClick={() => setSort("top")}>Most Liked</SortTab>
        </div>

        {loading && (
          <div style={{display: "flex", flexDirection: "column", gap: 14}}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: 140, background: "rgba(255,255,255,0.03)", borderRadius: 16,
                animation: "pulse 1.4s infinite",
              }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <p style={{color: "#ef4444", fontSize: 13, textAlign: "center", padding: "40px 0"}}>{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <div style={{textAlign: "center", padding: "60px 0"}}>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 16}}>
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
          <div style={{textAlign: "center", marginTop: 8}}>
            <button
              onClick={() => fetchPosts(page + 1, false)}
              disabled={loadingMore}
              style={{
                background: "transparent", color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
                padding: "10px 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", cursor: "pointer",
              }}>
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
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

function FilterChip({active, onClick, children}) {
  return (
    <button onClick={onClick} style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      padding: "7px 14px", borderRadius: 99, cursor: "pointer",
      border: active ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.12)",
      background: active ? "rgba(239,68,68,0.15)" : "transparent",
      color: active ? "#ef4444" : "rgba(255,255,255,0.5)",
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

function SortTab({active, onClick, children}) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: "none", cursor: "pointer",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "4px 0", marginRight: 4,
      color: active ? "#fff" : "rgba(255,255,255,0.3)",
      borderBottom: active ? "2px solid #ef4444" : "2px solid transparent",
    }}>
      {children}
    </button>
  );
}
