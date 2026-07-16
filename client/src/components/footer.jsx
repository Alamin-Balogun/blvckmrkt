import {Link} from "react-router-dom";
import {motion} from "framer-motion";
import logo from "../assets/logo.png";

const quickLinks = [
  {label: "Shop All", to: "/shop"},
  {label: "New Arrivals", to: "/shop?filter=new"},
  {label: "Drops", to: "/drops"},
  {label: "Top Brands", to: "/brands"},
  {label: "Blog", to: "/blog"},
  {label: "About Us", to: "/about"},
];

const supportLinks = [
  {label: "Contact Us", to: "/contact"},
  {label: "FAQ", to: "/faq"},
  {label: "Shipping Policy", to: "/shipping-policy"},
  {label: "Returns", to: "/return"},
  {label: "Authentication", to: "/authentication"},
  {label: "Privacy Policy", to: "/privacy"},
  {label: "Terms of Service", to: "/terms"},
];

const socials = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/blvckmrkt.ng",
    d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    name: "X",
    href: "https://x.com/blvckmrkt_ng",
    d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@blvckmrkt.ng",
    d: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.16 8.16 0 004.77 1.52V7.12a4.85 4.85 0 01-1-.43z",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@blvckmrkt",
    d: "M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z",
  },
  {
     name: "Snapchat",
     href: "https://www.snapchat.com/add/blvckmrkt.ng",
     d: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.229-3.651.302-4.847C7.858 1.063 11.215.793 12.206.793z",
  },
];

const contactItems = [
  {
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    text: "blvckmrkt.market@gmail.com",
  },
  {
    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    text: "+234 906 582 8399",
  },
  {
    icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    text: "NIGERIA",
  },
];

function FooterHeading({children}) {
  return <p className="footer-heading">{children}</p>;
}

function FooterLink({to, children}) {
  return (
    <li>
      <Link to={to} className="footer-link">
        {children}
      </Link>
    </li>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <style>{`
        .site-footer {
          background: #0a0a0a;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 56px 48px 48px;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.3fr;
          gap: 48px;
        }
        .footer-heading {
          color: #fff;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin: 0 0 20px 0;
        }
        .footer-link {
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          text-decoration: none;
          transition: color 0.2s;
          line-height: 1.4;
        }
        .footer-link:hover { color: #fff; }
        .footer-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .footer-brand-desc {
          color: rgba(255,255,255,0.38);
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
          max-width: 230px;
        }
        .footer-socials {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }
        .footer-social-icon {
          color: rgba(255,255,255,0.35);
          transition: color 0.2s;
          line-height: 0;
        }
        .footer-social-icon:hover { color: #ef4444; }
        .footer-contact-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .footer-contact-text {
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          line-height: 1.4;
        }
        .footer-newsletter-label {
          color: rgba(255,255,255,0.35);
          font-size: 11px;
          margin: 0 0 10px 0;
        }
        .footer-newsletter-form {
          display: flex;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.03);
        }
        .footer-newsletter-input {
          flex: 1;
          background: transparent;
          color: #fff;
          font-size: 12px;
          padding: 11px 12px;
          outline: none;
          border: none;
          min-width: 0;
        }
        .footer-newsletter-input::placeholder { color: rgba(255,255,255,0.25); }
        .footer-newsletter-btn {
          background: #ef4444;
          border: none;
          padding: 11px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .footer-newsletter-btn:hover { background: #dc2626; }
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .footer-bottom-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 16px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .footer-copy {
          color: rgba(255,255,255,0.25);
          font-size: 11px;
          margin: 0;
        }
        .footer-bottom-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .footer-bottom-link {
          color: rgba(255,255,255,0.25);
          font-size: 11px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-bottom-link:hover { color: #fff; }
        .footer-divider {
          color: rgba(255,255,255,0.15);
          font-size: 11px;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .footer-inner {
            grid-template-columns: 1fr 1fr;
            gap: 36px;
            padding: 48px 32px 40px;
          }
          .footer-bottom-inner {
            padding: 16px 32px;
          }
        }

        @media (max-width: 640px) {
          .footer-inner {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 40px 20px 36px;
          }
          .footer-brand-desc {
            max-width: 100%;
          }
          .footer-bottom-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            padding: 16px 20px;
          }
          .footer-bottom-links {
            flex-wrap: wrap;
            gap: 12px;
          }
        }
      `}</style>

      {/* Main grid */}
      <div className="footer-inner">
        {/* Col 1 — Brand */}
        <div style={{display: "flex", flexDirection: "column", gap: 5}}>
          <Link to="/" style={{textDecoration: "none"}}>
            <motion.img
              src={logo}
              alt="BLVCKMRKT Logo"
              className="h-20 w-auto object-contain"
              whileHover={{
                y: -3,
                scale: 1.03,
              }}
              whileTap={{scale: 0.97}}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 15,
              }}
            />
          </Link>
          <p className="footer-brand-desc">
            The go-to marketplace for authentic streetwear. Buy and sell verified heat from top
            brands and sellers worldwide.
          </p>
          <div className="footer-socials">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon"
                title={s.name}>
                <svg width={18} height={18} fill="currentColor" viewBox="0 0 24 24">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Col 2 — Quick Links */}
        <div>
          <FooterHeading>Quick Links</FooterHeading>
          <ul className="footer-links-list">
            {quickLinks.map((l) => (
              <FooterLink key={l.label} to={l.to}>
                {l.label}
              </FooterLink>
            ))}
          </ul>
        </div>

        {/* Col 3 — Support */}
        <div>
          <FooterHeading>Support</FooterHeading>
          <ul className="footer-links-list">
            {supportLinks.map((l) => (
              <FooterLink key={l.label} to={l.to}>
                {l.label}
              </FooterLink>
            ))}
          </ul>
        </div>

        {/* Col 4 — Contact + Newsletter */}
        <div>
          <FooterHeading>Contact Us</FooterHeading>
          <div className="footer-contact-list">
            {contactItems.map((item, i) => (
              <div key={i} className="footer-contact-item">
                <svg
                  width={15}
                  height={15}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                  style={{flexShrink: 0, marginTop: 2}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="footer-contact-text">{item.text}</span>
              </div>
            ))}
          </div>

          <p className="footer-newsletter-label">Get exclusive deals in your inbox</p>
          <form className="footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your email" className="footer-newsletter-input" />
            <button type="submit" className="footer-newsletter-btn">
              <svg
                width={14}
                height={14}
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p className="footer-copy">© {year} BLVCKMRKT. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy" className="footer-bottom-link">
              Privacy Policy
            </Link>
            <span className="footer-divider">|</span>
            <Link to="/terms" className="footer-bottom-link">
              Terms of Service
            </Link>
            <span className="footer-divider">|</span>
            <Link to="/cookie-policy" className="footer-bottom-link">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
