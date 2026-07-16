import {useState, useEffect} from "react";
import {useBlogContent} from "./blogcontentcontext";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";
const PER_PAGE = 6;

// ── Category colour helper ────────────────────────────────────────────────────
// Uses colours from the DB category object; falls back to neutral grey.
function catStyle(category) {
  if (!category) return {bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.15)"};
  return {
    bg:     category.bg_color     || "rgba(255,255,255,0.08)",
    color:  category.color        || "rgba(255,255,255,0.5)",
    border: category.border_color || "rgba(255,255,255,0.15)",
  };
}

// ── Relative-time for comments ────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────
function FeaturedSkeleton() {
  return (
    <div className="blog-featured" style={{marginBottom: 64}}>
      <div className="blog-feat-img" style={{background: "rgba(255,255,255,0.04)", animation: "pulse 1.4s infinite"}} />
      <div className="blog-feat-body" style={{display: "flex", flexDirection: "column", gap: 16}}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{height: i === 1 ? 32 : 14, background: "rgba(255,255,255,0.06)", borderRadius: 6, width: i === 1 ? "70%" : "90%", animation: "pulse 1.4s infinite"}} />
        ))}
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="blog-grid">
      {Array.from({length: PER_PAGE}).map((_, i) => (
        <div key={i} className="blog-card" style={{animation: "pulse 1.4s infinite"}}>
          <div style={{aspectRatio: "16/10", background: "rgba(255,255,255,0.05)"}} />
          <div style={{padding: 20, display: "flex", flexDirection: "column", gap: 10}}>
            <div style={{height: 10, width: "40%", background: "rgba(255,255,255,0.05)", borderRadius: 4}} />
            <div style={{height: 18, width: "80%", background: "rgba(255,255,255,0.05)", borderRadius: 4}} />
            <div style={{height: 10, width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 4}} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BlogGrid() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [featured,   setFeatured]   = useState(null);
  const [posts,      setPosts]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCatSlug,  setActiveCatSlug]  = useState("");
  const [page,           setPage]           = useState(1);
  const [search,         setSearch]         = useState("");

  // ── CMS fields ────────────────────────────────────────────────────────────
  const featuredLabel    = useBlogContent("featured_label",    "✦ Featured Post");
  const readArticleText  = useBlogContent("read_article_text", "Read Article");
  const searchPlaceholder = useBlogContent("search_placeholder", "Search posts...");
  const readMoreText     = useBlogContent("read_more_text",    "Read");
  const emptyMsg         = useBlogContent("empty_msg",         "No posts found.");
  const clearFiltersText = useBlogContent("clear_filters_text","Clear filters");

  // ── Fetch categories once ─────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/blog/categories`)
      .then((r) => r.json())
      .then((json) => {
        const list = json?.data?.categories ?? [];
        setCategories(list);
      })
      .catch(() => {});
  }, []);

  // ── Fetch posts whenever filters change ───────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({page, limit: PER_PAGE});
    if (activeCatSlug) params.set("category", activeCatSlug);
    if (search)        params.set("search",   search);

    fetch(`${API_BASE}/api/blog/posts?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const data = json?.data ?? {};
        setPosts(data.posts    ?? []);
        setFeatured(data.featured ?? null);
        setTotal(data.total    ?? 0);
        setTotalPages(data.pages ?? 1);
      })
      .catch(() => { if (!cancelled) setError("Could not load posts."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, activeCatSlug, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCat = (name, slug) => {
    setActiveCategory(name);
    setActiveCatSlug(slug);
    setPage(1);
  };

  const clearAll = () => {
    setActiveCategory("All");
    setActiveCatSlug("");
    setSearch("");
    setPage(1);
  };

  // Show featured only when no filter/search is active
  const showFeatured = featured && activeCategory === "All" && !search;

  return (
    <section
      style={{
        background: "#000",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "64px 48px",
      }}>
      <style>{`
        .blog-wrap { max-width: 1280px; margin: 0 auto; }

        /* Featured */
        .blog-featured { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; margin-bottom: 64px; }
        .blog-feat-img { position: relative; min-height: 420px; overflow: hidden; }
        .blog-feat-img img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(20%); transition: transform 0.7s; }
        .blog-featured:hover .blog-feat-img img { transform: scale(1.04); }
        .blog-feat-img-overlay { position: absolute; inset: 0; background: linear-gradient(to right, transparent 60%, #0d0d0d); }
        .blog-feat-body { background: #0d0d0d; display: flex; flex-direction: column; justify-content: center; padding: 48px; }

        /* Filters */
        .blog-filters { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
        .blog-cats { display: flex; gap: 8px; flex-wrap: wrap; }
        .blog-cat-btn { background: none; border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 900; letter-spacing: 0.22em; text-transform: uppercase; padding: 7px 16px; cursor: pointer; transition: all 0.2s; }
        .blog-cat-btn:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
        .blog-cat-btn.active { background: #ef4444; border-color: #ef4444; color: #fff; }
        .blog-search { position: relative; }
        .blog-search input { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 12px; padding: 9px 14px 9px 34px; outline: none; width: 220px; transition: border-color 0.2s; }
        .blog-search input:focus { border-color: rgba(239,68,68,0.6); }
        .blog-search input::placeholder { color: rgba(255,255,255,0.22); }
        .blog-search svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); }

        /* Grid */
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 900px) { .blog-grid { grid-template-columns: repeat(2, 1fr); } .blog-featured { grid-template-columns: 1fr; } .blog-feat-img { min-height: 280px; } }
        @media (max-width: 560px) { .blog-grid { grid-template-columns: 1fr; } }

        /* Card */
        .blog-card { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.3s, transform 0.3s; }
        .blog-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-4px); }
        .blog-card-img { position: relative; overflow: hidden; aspect-ratio: 16/10; }
        .blog-card-img img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(15%); transition: transform 0.7s; }
        .blog-card:hover .blog-card-img img { transform: scale(1.06); }
        .blog-card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.2); transition: background 0.4s; }
        .blog-card:hover .blog-card-overlay { background: rgba(0,0,0,0.08); }
        .blog-cat-pill { position: absolute; top: 12px; left: 12px; font-size: 8px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; padding: 3px 10px; border-radius: 99px; border: 1px solid; }
        .blog-card-body { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .blog-meta { display: flex; align-items: center; gap: 8px; }
        .blog-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.2); }
        .blog-meta-text { color: rgba(255,255,255,0.25); font-size: 10px; letter-spacing: 0.12em; }
        .blog-title { color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 0.05em; font-weight: 900; line-height: 1.25; text-decoration: none; display: block; transition: color 0.2s; }
        .blog-title:hover { color: #ef4444; }
        .blog-excerpt { color: rgba(255,255,255,0.35); font-size: 12px; line-height: 1.65; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .blog-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: auto; }
        .blog-author { display: flex; align-items: center; gap: 8px; }
        .blog-author img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; filter: grayscale(30%); }
        .blog-author-name { color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; }
        .blog-read-more { color: rgba(255,255,255,0.3); font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; text-decoration: none; display: flex; align-items: center; gap: 4px; transition: color 0.2s; }
        .blog-read-more:hover { color: #ef4444; }

        /* Pagination */
        .blog-pag { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 48px; }
        .blog-pag-btn { width: 36px; height: 36px; border: 1px solid rgba(255,255,255,0.15); background: none; color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .blog-pag-btn:hover { border-color: rgba(255,255,255,0.4); color: #fff; }
        .blog-pag-btn.active { background: #ef4444; border-color: #ef4444; color: #fff; }
        .blog-pag-btn:disabled { opacity: 0.2; cursor: not-allowed; }
        .blog-empty { grid-column: 1/-1; text-align: center; padding: 80px 0; color: rgba(255,255,255,0.2); font-size: 13px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>

      <div className="blog-wrap">

        {/* ── Featured Post ── */}
        {loading && !featured ? (
          <FeaturedSkeleton />
        ) : showFeatured ? (
          <div className="blog-featured">
            <div className="blog-feat-img">
              <img src={featured.cover_image || featured.image} alt={featured.title} />
              <div className="blog-feat-img-overlay" />
              <div style={{position: "absolute", top: 20, left: 20}}>
                {featured.category && (
                  <span style={{
                    fontSize: 8, fontWeight: 900, letterSpacing: "0.18em",
                    textTransform: "uppercase", padding: "3px 10px",
                    borderRadius: 99, border: `1px solid ${catStyle(featured.category).border}`,
                    background: catStyle(featured.category).bg,
                    color: catStyle(featured.category).color,
                  }}>
                    {featured.category.name}
                  </span>
                )}
              </div>
            </div>
            <div className="blog-feat-body">
              <span style={{color: "rgba(239,68,68,0.8)", fontSize: 9, fontWeight: 900,
                letterSpacing: "0.35em", textTransform: "uppercase", display: "block", marginBottom: 12}}>
                {featuredLabel}
              </span>
              <Link
                to={`/blog/${featured.slug}`}
                style={{color: "#fff", fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem",
                  letterSpacing: "0.04em", fontWeight: 900, lineHeight: 1.1, marginBottom: 16,
                  display: "block", textDecoration: "none", transition: "color 0.2s"}}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}>
                {featured.title}
              </Link>
              <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7, marginBottom: 20}}>
                {featured.excerpt}
              </p>

              {/* ── Comments preview ── */}
              {featured.comment_count > 0 && (
                <div style={{borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 18, marginBottom: 20}}>
                  <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 14}}>
                    <svg width="13" height="13" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span style={{color: "rgba(239,68,68,0.8)", fontSize: 9, fontWeight: 900,
                      letterSpacing: "0.3em", textTransform: "uppercase"}}>
                      {featured.comment_count} Comment{featured.comment_count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Latest 4 comments — fetched inside BlogPost page; here show count + link */}
                  <Link
                    to={`/blog/${featured.slug}#comments`}
                    style={{background: "none", border: "none", color: "rgba(239,68,68,0.7)",
                      fontSize: 9, fontWeight: 900, letterSpacing: "0.25em", textTransform: "uppercase",
                      cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5,
                      textDecoration: "none"}}>
                    View all {featured.comment_count} comments
                    <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}

              <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 28,
                paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)"}}>
                {featured.author?.avatar && (
                  <img src={featured.author.avatar} alt={featured.author.name}
                    style={{width: 32, height: 32, borderRadius: "50%", objectFit: "cover",
                      filter: "grayscale(30%)", border: "2px solid rgba(239,68,68,0.4)"}} />
                )}
                <div>
                  <p style={{color: "#fff", fontSize: 11, fontWeight: 700}}>{featured.author?.name || featured.author_name}</p>
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.12em"}}>
                    {featured.date} · {featured.read_time}
                  </p>
                </div>
              </div>
              <Link
                to={`/blog/${featured.slug}`}
                style={{display: "inline-flex", alignItems: "center", gap: 8, background: "#ef4444",
                  color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: "0.22em",
                  textTransform: "uppercase", padding: "12px 24px", textDecoration: "none",
                  transition: "background 0.2s"}}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
                {readArticleText}
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        ) : null}

        {/* ── Filters ── */}
        <div className="blog-filters">
          <div className="blog-cats">
            <button
              className={`blog-cat-btn ${activeCategory === "All" ? "active" : ""}`}
              onClick={() => handleCat("All", "")}>
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`blog-cat-btn ${activeCategory === cat.name ? "active" : ""}`}
                onClick={() => handleCat(cat.name, cat.slug)}>
                {cat.name}
              </button>
            ))}
          </div>
          <div className="blog-search">
            <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{color: "#ef4444", textAlign: "center", padding: "40px 0", fontSize: 12}}>{error}</p>
        )}

        {/* ── Cards ── */}
        {loading ? <GridSkeleton /> : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + page + search}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0}}
              transition={{duration: 0.25}}
              className="blog-grid">
              {posts.length > 0 ? (
                posts.map((post, i) => {
                  const cc = catStyle(post.category);
                  return (
                    <motion.div
                      key={post.id}
                      initial={{opacity: 0, y: 20}}
                      animate={{opacity: 1, y: 0}}
                      transition={{duration: 0.35, delay: i * 0.06}}
                      className="blog-card">
                      <div className="blog-card-img">
                        <img src={post.cover_image || post.image} alt={post.title} />
                        <div className="blog-card-overlay" />
                        <span className="blog-cat-pill"
                          style={{background: cc.bg, color: cc.color, borderColor: cc.border}}>
                          {post.category?.name || ""}
                        </span>
                      </div>
                      <div className="blog-card-body">
                        <div className="blog-meta">
                          <span className="blog-meta-text">{post.date}</span>
                          <span className="blog-meta-dot" />
                          <span className="blog-meta-text">{post.read_time}</span>
                        </div>
                        <Link to={`/blog/${post.slug}`} className="blog-title">{post.title}</Link>
                        <p className="blog-excerpt">{post.excerpt}</p>
                        <div className="blog-footer">
                          <div className="blog-author">
                            {post.author?.avatar && (
                              <img src={post.author.avatar} alt={post.author.name} />
                            )}
                            <span className="blog-author-name">{post.author?.name || post.author_name}</span>
                          </div>
                          <Link to={`/blog/${post.slug}`} className="blog-read-more">
                            {readMoreText}
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="blog-empty">
                  {emptyMsg}{" "}
                  <button
                    style={{background: "none", border: "none", color: "#ef4444", cursor: "pointer",
                      fontWeight: 700, fontSize: 11, letterSpacing: "0.2em"}}
                    onClick={clearAll}>
                    {clearFiltersText}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="blog-pag">
            <button className="blog-pag-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({length: totalPages}).map((_, i) => (
              <button key={i} className={`blog-pag-btn ${page === i + 1 ? "active" : ""}`} onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button className="blog-pag-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}