import {useState, useEffect} from "react";
import {Link} from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1)  return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {day: "numeric", month: "short"});
}

export default function BlogSidebar() {
  const [posts, setPosts]     = useState(null);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/blog/posts?limit=4`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error();
        const list = [...(json.data.featured ? [json.data.featured] : []), ...(json.data.posts || [])];
        setPosts(list.slice(0, 5));
      })
      .catch(() => setError(true));
  }, []);

  if (error || posts?.length === 0) return null;

  return (
    <div style={{
      background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18, padding: "22px 20px", overflow: "hidden", position: "relative",
    }}>
      <div style={{position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #ef4444, rgba(239,68,68,0.15))"}} />

      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18}}>
        <div>
          <span style={{color: "#ef4444", fontSize: 9.5, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase"}}>
            ✦ From The Blog
          </span>
          <h3 style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", letterSpacing: "0.03em",
            color: "#fff", margin: "4px 0 0",
          }}>
            Latest Headlines
          </h3>
        </div>
      </div>

      {posts === null && (
        <div style={{display: "flex", flexDirection: "column", gap: 14}}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{display: "flex", gap: 10}}>
              <div style={{width: 60, height: 46, borderRadius: 8, background: "rgba(255,255,255,0.05)", flexShrink: 0, animation: "pulse 1.4s infinite"}} />
              <div style={{flex: 1, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center"}}>
                <div style={{height: 9, width: "90%", background: "rgba(255,255,255,0.05)", borderRadius: 3, animation: "pulse 1.4s infinite"}} />
                <div style={{height: 9, width: "60%", background: "rgba(255,255,255,0.05)", borderRadius: 3, animation: "pulse 1.4s infinite"}} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{display: "flex", flexDirection: "column", gap: 4}}>
        {posts?.map((p, i) => (
          <Link
            key={p.id}
            to={`/blog/${p.slug}`}
            className="blog-sidebar-item"
            style={{
              display: "flex", gap: 12, alignItems: "center", textDecoration: "none",
              padding: "10px 6px", borderRadius: 10,
              borderBottom: i < posts.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
            <div style={{
              width: 58, height: 46, borderRadius: 8, flexShrink: 0, overflow: "hidden",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {p.cover_image && (
                <img src={p.cover_image} alt="" style={{width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(20%)"}} />
              )}
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <p className="blog-sidebar-title" style={{
                color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1.35, margin: 0,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                transition: "color 0.15s",
              }}>
                {p.title}
              </p>
              <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.04em"}}>
                {timeAgo(p.published_at || p.created_at)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Link to="/blog" style={{
        display: "block", textAlign: "center", marginTop: 16, paddingTop: 14,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.4)", fontSize: 10.5, fontWeight: 700,
        letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none",
      }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
        View All Posts →
      </Link>

      <style>{`
        .blog-sidebar-item:hover .blog-sidebar-title { color: #ef4444; }
      `}</style>
    </div>
  );
}
