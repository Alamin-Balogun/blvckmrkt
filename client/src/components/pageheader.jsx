import {Link} from "react-router-dom";

/**
 * Reusable page header banner
 *
 * Props:
 *  - title      : string  — big heading e.g. "About Us"
 *  - breadcrumb : string  — page name shown after "Home →" e.g. "About Us"
 *  - image      : string  — background image URL
 */
export default function PageHeader({title, breadcrumb, image}) {
  return (
    // Responsive height: 300px (mobile), 400px (md and above)
    <div className="relative w-full overflow-hidden mt-[36px] h-[300px] md:h-[400px]">
      {/* Background image */}
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{filter: "grayscale(30%)"}}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Red gradient from left */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-950/50 via-black/20 to-transparent" />

      {/* Bottom fade to black */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-12 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Page title */}
        <h1
          className="text-white font-black leading-none mb-3"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(2.8rem, 6vw, 5rem)",
            letterSpacing: "0.05em",
          }}>
          {title}
        </h1>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="relative group text-white/50 hover:text-white text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200">
            Home
            <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-red-500 transition-all duration-300 group-hover:w-full" />
          </Link>

          <svg
            className="w-3 h-3 text-red-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>

          <span className="text-red-500 text-[11px] font-bold tracking-[0.2em] uppercase">
            {breadcrumb}
          </span>
        </div>
      </div>

      {/* Decorative bottom red line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-red-500/50 to-transparent" />
    </div>
  );
}
