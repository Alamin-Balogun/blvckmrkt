import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";
import {useHomeContent} from "./homecontentcontext";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

const CATEGORY_COLORS = {
  Culture: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  Drops: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  "Style Guide": "text-blue-400 border-blue-400/30 bg-blue-400/10",
  Sellers: "text-green-400 border-green-400/30 bg-green-400/10",
  Authentication: "text-red-400 border-red-400/30 bg-red-400/10",
};

const PER_PAGE = 4;

export default function BlogSection() {
  const [page, setPage] = useState(0);
  const [posts, setPosts] = useState([]);

  const sectionTag   = useHomeContent("blog_section_tag",   "✦ From The Culture");
  const sectionTitle = useHomeContent("blog_section_title", "LATEST BLOG");
  const viewAllText  = useHomeContent("blog_view_all_text", "VIEW ALL POSTS");
  const viewAllLink  = useHomeContent("blog_view_all_link", "/blog");

  useEffect(() => {
    fetch(`${BASE}/blog/posts?limit=50`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((json) => {
        const raw = json?.data?.posts ?? json?.posts ?? [];
        const normalised = raw.map((p) => ({
          id:       p.id,
          category: p.category?.name ?? "",
          title:    p.title,
          excerpt:  p.excerpt,
          date:     p.date,
          readTime: p.read_time,
          image:    p.image ?? p.cover_image ?? "",
          slug:     p.slug,
        }));
        setPosts(normalised);
      })
      .catch(() => {});
  }, []);

  const titleParts = sectionTitle.split(" ");
  const redWord    = titleParts.pop();
  const mainTitle  = titleParts.join(" ");

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const visible    = posts.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <section className="bg-black border-t border-white/8 px-4 sm:px-6 md:px-12 py-14 md:py-20">
      {/* ↑ px-4 on mobile, steps up to sm and md */}
      <div className="max-w-7xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8 md:mb-10">
          {/* ↑ tighter gap/margin on mobile */}
          <div>
            <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-2">
              {sectionTag}
            </span>
            <h2
              className="text-white font-black leading-none"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2rem, 6vw, 4rem)",   // ↑ starts smaller on mobile
                letterSpacing: "0.04em",
              }}>
              {mainTitle} <span className="text-red-500">{redWord}</span>
            </h2>
          </div>

          {/* Pagination arrows */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* ↑ self-start keeps arrows left-aligned on mobile under the title */}
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white/20 text-[10px] tracking-widest">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-9 h-9 bg-white flex items-center justify-center text-black hover:bg-red-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -20}}
            transition={{duration: 0.35, ease: "easeOut"}}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* ↑ gap-3 on mobile, gap-4 on md+ */}
            {visible.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.4, delay: i * 0.07}}
                className="group flex flex-col bg-[#0d0d0d] border border-white/8 hover:border-white/20 rounded-xl overflow-hidden transition-all duration-300">

                {/* Thumbnail */}
                <Link
                  to={`/blog/${post.slug}`}
                  className="block overflow-hidden relative aspect-[16/10]">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{filter: "grayscale(20%)"}}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1 border rounded-full ${CATEGORY_COLORS[post.category] ?? "text-white/50 border-white/15 bg-white/5"}`}>
                      {post.category}
                    </span>
                  </div>
                </Link>

                {/* Card body */}
                <div className="flex flex-col flex-1 p-4 sm:p-5">
                  {/* ↑ p-4 on mobile, p-5 on sm+ */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/25 text-[9px] tracking-widest uppercase">
                      {post.date}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/15" />
                    <span className="text-white/25 text-[9px] tracking-widest uppercase">
                      {post.readTime}
                    </span>
                  </div>

                  <Link to={`/blog/${post.slug}`}>
                    <h3
                      className="text-white font-black leading-tight mb-2 group-hover:text-red-500 transition-colors duration-300 line-clamp-2"
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "clamp(1rem, 2.5vw, 1.1rem)",  // ↑ fluid
                        letterSpacing: "0.04em",
                      }}>
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-white/35 text-[11px] leading-relaxed tracking-wide flex-1 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="group/btn flex items-center gap-1.5 text-white/40 hover:text-red-500 text-[10px] font-black tracking-[0.2em] uppercase transition-colors duration-200">
                      Read More
                      <svg
                        className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-200"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <button className="text-white/20 hover:text-white transition-colors duration-200">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Dot pagination */}
        <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
          {/* ↑ tighter margin on mobile */}
          {Array.from({length: totalPages}).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`transition-all duration-300 h-[3px] rounded-none py-2.5 px-5 ${i === page ? "w-8 bg-red-500" : "w-2 bg-white/20 hover:bg-white/40"}`}
            />
          ))}
        </div>

        {/* View all */}
        <div className="flex justify-center mt-8 md:mt-10">
          {/* ↑ tighter margin on mobile */}
          <Link
            to={viewAllLink}
            className="group relative overflow-hidden border border-white/20 text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase px-7 sm:px-10 py-3.5 sm:py-4 text-white/60 hover:text-white transition-colors duration-300 flex items-center gap-3">
            {/* ↑ smaller text + padding on mobile */}
            <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-400 ease-out" />
            <span className="relative">{viewAllText}</span>
            <svg className="relative w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}