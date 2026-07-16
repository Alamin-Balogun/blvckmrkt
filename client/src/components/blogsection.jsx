import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";

const posts = [
  {
    id: 1,
    category: "Culture",
    title: "How Corteiz Changed the Game Without Spending a Dime on Ads",
    excerpt:
      "A deep dive into how one brand flipped guerrilla marketing into a cultural movement that had thousands running through London streets.",
    date: "Feb 14, 2025",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&q=80",
    slug: "corteiz-changed-the-game",
  },
  {
    id: 2,
    category: "Drops",
    title: "The 10 Most Hyped Streetwear Releases of 2025 So Far",
    excerpt:
      "From Palace collabs to Supreme's unexpected pivot — we break down the drops that broke the internet and sold out in seconds.",
    date: "Jan 29, 2025",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80",
    slug: "most-hyped-drops-2025",
  },
  {
    id: 3,
    category: "Style Guide",
    title: "How to Build a Streetwear Wardrobe on a Budget Without Faking It",
    excerpt:
      "You don't need to spend $500 to look authentic. Here's how to stack real pieces, thrift smart, and build a wardrobe with actual identity.",
    date: "Jan 18, 2025",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    slug: "streetwear-wardrobe-on-budget",
  },
  {
    id: 4,
    category: "Sellers",
    title: "From Side Hustle to Six Figures: Verified Sellers Share Their Stories",
    excerpt:
      "Three BLVCKMRKT sellers talk about how they turned a passion for authentic streetwear into real income — and what they wish they knew sooner.",
    date: "Jan 05, 2025",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    slug: "sellers-success-stories",
  },
  {
    id: 5,
    category: "Authentication",
    title: "Spot a Fake in 60 Seconds: The Ultimate Streetwear Authentication Guide",
    excerpt:
      "Stitching patterns, tag fonts, sole molds — our experts break down exactly what separates heat from trash before you spend a single naira.",
    date: "Dec 22, 2024",
    readTime: "9 min read",
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
    slug: "authentication-guide",
  },
  {
    id: 6,
    category: "Culture",
    title: "Lagos is the New London: Africa's Streetwear Scene is Here",
    excerpt:
      "How Nigerian designers and resellers are rewriting the global streetwear map — and why the world is finally paying attention.",
    date: "Dec 10, 2024",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    slug: "lagos-streetwear-scene",
  },
  {
    id: 7,
    category: "Style Guide",
    title: "Layering Season: How to Stack Fits Without Looking Lost",
    excerpt:
      "Master the art of layering with pieces that actually work together. From hoodies under cargos to puffers over longsleeves — done right.",
    date: "Nov 28, 2024",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
    slug: "layering-season-guide",
  },
  {
    id: 8,
    category: "Drops",
    title: "Sneaker Resale in 2025: Is the Bubble Finally Popping?",
    excerpt:
      "Prices are shifting. Some silhouettes are crashing. Others are surging. We analyse the data so you know what to hold and what to flip.",
    date: "Nov 15, 2024",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    slug: "sneaker-resale-2025",
  },
];

const CATEGORY_COLORS = {
  Culture: "text-purple-400  border-purple-400/30  bg-purple-400/10",
  Drops: "text-yellow-400  border-yellow-400/30  bg-yellow-400/10",
  "Style Guide": "text-blue-400    border-blue-400/30    bg-blue-400/10",
  Sellers: "text-green-400   border-green-400/30   bg-green-400/10",
  Authentication: "text-red-400     border-red-400/30     bg-red-400/10",
};

const PER_PAGE = 4;

export default function BlogSection() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(posts.length / PER_PAGE);
  const visible = posts.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <section className="bg-black border-t border-white/8 px-6 md:px-12 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-2">
              ✦ From The Culture
            </span>
            <h2
              className="text-white font-black leading-none"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                letterSpacing: "0.04em",
              }}>
              LATEST <span className="text-red-500">BLOG</span>
            </h2>
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{opacity: 0, x: 20}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -20}}
            transition={{duration: 0.35, ease: "easeOut"}}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visible.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.4, delay: i * 0.07}}
                className="group flex flex-col bg-[#0d0d0d] border border-white/8 hover:border-white/20 rounded-xl overflow-hidden transition-all duration-300">
                {/* Image */}
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

                  {/* Category pill */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[9px] font-black tracking-[0.2em] uppercase px-2.5 py-1 border rounded-full ${CATEGORY_COLORS[post.category] ?? "text-white/50 border-white/15 bg-white/5"}`}>
                      {post.category}
                    </span>
                  </div>
                </Link>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5">
                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/25 text-[9px] tracking-widest uppercase">
                      {post.date}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/15" />
                    <span className="text-white/25 text-[9px] tracking-widest uppercase">
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <Link to={`/blog/${post.slug}`}>
                    <h3
                      className="text-white font-black leading-tight mb-2 group-hover:text-red-500 transition-colors duration-300 line-clamp-2"
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "1.1rem",
                        letterSpacing: "0.04em",
                      }}>
                      {post.title}
                    </h3>
                  </Link>

                  {/* Excerpt */}
                  <p className="text-white/35 text-[11px] leading-relaxed tracking-wide flex-1 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="group/btn flex items-center gap-1.5 text-white/40 hover:text-red-500 text-[10px] font-black tracking-[0.2em] uppercase transition-colors duration-200">
                      Read More
                      <svg
                        className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform duration-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                    {/* Share icon */}
                    <button className="text-white/20 hover:text-white transition-colors duration-200">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
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
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({length: totalPages}).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`transition-all duration-300 h-[3px] rounded-none ${
                i === page ? "w-8 bg-red-500" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* View all */}
        <div className="flex justify-center mt-10">
          <Link
            to="/blog"
            className="group relative overflow-hidden border border-white/20 text-[11px] font-bold tracking-[0.3em] uppercase px-10 py-4 text-white/60 hover:text-white transition-colors duration-300 flex items-center gap-3">
            <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-400 ease-out" />
            <span className="relative">VIEW ALL POSTS</span>
            <svg
              className="relative w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
