import {Link} from "react-router-dom";

// ─── Brand definitions ───────────────────────────────────────────────────────
const brands = [
  {
    name: "Supreme",
    url: "https://www.supremenewyork.com",
    bg: "bg-[#ED1C24]",
    content: (
      <span
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 900,
          fontSize: "1.4rem",
          letterSpacing: "-0.01em",
          color: "#fff",
        }}>
        Supreme
      </span>
    ),
  },
  {
    name: "Off-White",
    url: "https://www.off---white.com",
    bg: "bg-white/[0.03]",
    content: (
      <div className="flex flex-col items-center gap-1">
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "0.95rem",
            letterSpacing: "0.22em",
            color: "#fff",
            fontWeight: 900,
          }}>
          OFF—WHITE
        </span>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.5)",
          }}>
          ™ C/O VIRGIL ABLOH
        </span>
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "rgba(255,255,255,0.25)",
            marginTop: "2px",
          }}
        />
      </div>
    ),
  },
  {
    name: "Palace",
    url: "https://www.palaceskateboards.com",
    bg: "bg-white/[0.03]",
    content: (
      <div className="flex flex-col items-center gap-1.5">
        {/* Tri-ferg triangle */}
        <svg viewBox="0 0 40 36" className="w-6 h-5" fill="white" opacity="0.85">
          <polygon points="20,0 40,36 0,36" />
          <polygon points="20,10 33,33 7,33" fill="#0a0a0a" />
          <polygon points="20,18 28,33 12,33" fill="white" />
        </svg>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1rem",
            letterSpacing: "0.3em",
            color: "#fff",
            fontWeight: 900,
          }}>
          PALACE
        </span>
      </div>
    ),
  },
  {
    name: "Stüssy",
    url: "https://www.stussy.com",
    bg: "bg-white/[0.03]",
    content: (
      <span
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 900,
          fontSize: "1.6rem",
          color: "#fff",
          letterSpacing: "-0.02em",
        }}>
        Stüssy
      </span>
    ),
  },
  {
    name: "BAPE",
    url: "https://www.bape.com",
    bg: "bg-white/[0.03]",
    content: (
      <div className="flex flex-col items-center gap-1">
        {/* Ape head silhouette */}
        <svg viewBox="0 0 40 36" className="w-7 h-6" fill="white" opacity="0.75">
          <ellipse cx="20" cy="14" rx="14" ry="12" />
          <ellipse cx="9" cy="8" rx="5" ry="6" />
          <ellipse cx="31" cy="8" rx="5" ry="6" />
          <ellipse cx="20" cy="22" rx="8" ry="6" fill="#0a0a0a" />
          <ellipse cx="20" cy="24" rx="7" ry="4" fill="white" opacity="0.5" />
          <circle cx="15" cy="13" r="2.5" fill="#0a0a0a" />
          <circle cx="25" cy="13" r="2.5" fill="#0a0a0a" />
        </svg>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.22em",
            color: "#fff",
            fontWeight: 900,
          }}>
          A BATHING APE®
        </span>
      </div>
    ),
  },
  {
    name: "Carhartt WIP",
    url: "https://www.carhartt-wip.com",
    bg: "bg-[#C8A951]",
    content: (
      <div className="flex flex-col items-center gap-0.5">
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.05rem",
            letterSpacing: "0.12em",
            color: "#1a1a1a",
            fontWeight: 900,
            lineHeight: 1,
          }}>
          CARHARTT
        </span>
        <div style={{width: "80%", height: "1.5px", background: "#1a1a1a", opacity: 0.5}} />
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "0.75rem",
            letterSpacing: "0.35em",
            color: "#1a1a1a",
            fontWeight: 900,
          }}>
          WORK IN PROGRESS
        </span>
      </div>
    ),
  },
  {
    name: "Stone Island",
    url: "https://www.stoneisland.com",
    bg: "bg-white/[0.03]",
    content: (
      <div className="flex flex-col items-center gap-1.5">
        {/* Compass rose */}
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
          <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <polygon points="16,3 18.5,13 16,11 13.5,13" fill="white" opacity="0.9" />
          <polygon points="16,29 13.5,19 16,21 18.5,19" fill="white" opacity="0.4" />
          <polygon points="3,16 13,13.5 11,16 13,18.5" fill="white" opacity="0.4" />
          <polygon points="29,16 19,18.5 21,16 19,13.5" fill="white" opacity="0.4" />
          <circle cx="16" cy="16" r="2" fill="white" />
        </svg>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "0.72rem",
            letterSpacing: "0.25em",
            color: "#fff",
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.3,
          }}>
          STONE{"\n"}ISLAND
        </span>
      </div>
    ),
  },
  {
    name: "Kith",
    url: "https://kith.com",
    bg: "bg-white/[0.03]",
    content: (
      <span
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "2rem",
          letterSpacing: "0.35em",
          color: "#fff",
          fontWeight: 900,
        }}>
        KITH
      </span>
    ),
  },
  {
    name: "Nike",
    url: "https://www.nike.com",
    bg: "bg-white/[0.03]",
    content: (
      /* Nike Swoosh SVG */
      <svg viewBox="0 0 120 45" className="w-24 h-9" fill="white" opacity="0.85">
        <path d="M12 35.4C6.6 37.3 2.2 37.4 0 35.1c-2.4-2.5 0.3-8.1 6.2-13.1L88.4 0 12 35.4zm4.4-2.7l60-22.8-50.3 19.1c-7.3 3-12 6.7-10.3 8.4 0.8 0.8 2.9 0.8 6 0.1l-5.4-4.8z" />
      </svg>
    ),
  },
  {
    name: "Adidas",
    url: "https://www.adidas.com",
    bg: "bg-white/[0.03]",
    content: (
      <div className="flex flex-col items-center gap-2">
        {/* Adidas trefoil-style mountain logo */}
        <svg viewBox="0 0 48 28" className="w-10 h-6" fill="white" opacity="0.85">
          <polygon points="24,0 48,28 0,28" />
          <rect x="0" y="22" width="48" height="3.5" fill="#0a0a0a" />
          <rect x="5" y="16" width="38" height="3.5" fill="#0a0a0a" />
        </svg>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "0.95rem",
            letterSpacing: "0.3em",
            color: "#fff",
            fontWeight: 900,
          }}>
          ADIDAS
        </span>
      </div>
    ),
  },
  {
    name: "New Balance",
    url: "https://www.newbalance.com",
    bg: "bg-white/[0.03]",
    content: (
      <div className="flex flex-col items-center gap-1">
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "2.4rem",
            color: "#fff",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
          N
        </span>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.28em",
            color: "rgba(255,255,255,0.45)",
            fontWeight: 700,
          }}>
          NEW BALANCE
        </span>
      </div>
    ),
  },
  {
    name: "Trapstar",
    url: "https://www.trapstarlondon.com",
    bg: "bg-white/[0.03]",
    content: (
      <div className="flex flex-col items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white" opacity="0.8">
          <path d="M12 2l2.6 8H22l-6.6 4.8 2.5 7.7L12 17.7l-5.9 4.8 2.5-7.7L2 10h7.4z" />
        </svg>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1rem",
            letterSpacing: "0.25em",
            color: "#fff",
            fontWeight: 900,
          }}>
          TRAPSTAR
        </span>
      </div>
    ),
  },
  {
    name: "Corteiz",
    url: "https://www.crtz.xyz",
    bg: "bg-white/[0.03]",
    content: (
      <div className="flex flex-col items-center gap-1.5">
        {/* Globe */}
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2c0 0-4 4-4 10s4 10 4 10M12 2c0 0 4 4 4 10s-4 10-4 10" />
          <path d="M2 12h20M4.5 7h15M4.5 17h15" />
        </svg>
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1rem",
            letterSpacing: "0.3em",
            color: "#fff",
            fontWeight: 900,
          }}>
          CORTEIZ
        </span>
      </div>
    ),
  },
  {
    name: "Represent",
    url: "https://representclo.com",
    bg: "bg-white/[0.03]",
    content: (
      <span
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "0.85rem",
          letterSpacing: "0.22em",
          color: "#fff",
          fontWeight: 900,
        }}>
        REPRESENT
      </span>
    ),
  },
];

// ─── Single card ─────────────────────────────────────────────────────────────
function LogoCard({brand}) {
  return (
    <a
      href={brand.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-col items-center justify-center gap-3 px-5 flex-shrink-0 group">
      {/* Box */}
      <div
        className={`relative w-36 h-20 border border-white/10 group-hover:border-red-500/70 transition-all duration-300 flex items-center justify-center overflow-hidden ${brand.bg} group-hover:brightness-125`}>
        {/* Content fades up to full on hover */}
        <div className="opacity-45 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center w-full h-full px-3">
          {brand.content}
        </div>
        {/* Red sweep */}
        <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-red-500 group-hover:w-full transition-all duration-400 ease-out" />
      </div>

      {/* Label */}
      <span
        className="text-white/25 group-hover:text-white/75 font-bold tracking-[0.18em] uppercase transition-colors duration-300 whitespace-nowrap"
        style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.7rem"}}>
        {brand.name}
      </span>
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BrandsMarquee() {
  const loopedBrands = [...brands, ...brands];

  return (
    <section className="bg-[#0a0a0a] border-y border-white/10">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <h3
            className="text-white font-black tracking-[0.08em] uppercase"
            style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem"}}>
            Top Brands
          </h3>
        </div>

        <Link
          to="/brands"
          className="group flex items-center gap-2 text-white/35 hover:text-white text-[10px] font-bold tracking-[0.28em] uppercase transition-colors duration-200">
          View All Brands
          <svg
            className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Marquee */}
      <div className="relative overflow-hidden pb-8">
        <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

        <div
          className="flex w-max items-center"
          style={{animation: "scroll 50s linear infinite"}}
          onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
          onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}>
          {loopedBrands.map((brand, i) => (
            <LogoCard key={`${brand.name}-${i}`} brand={brand} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
