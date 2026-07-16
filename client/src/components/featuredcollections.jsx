import {motion} from "framer-motion";
import {Link} from "react-router-dom";

const collections = [
  {
    id: "footwear",
    label: "Footwear",
    sub: "Kicks that speak first",
    link: "/shop?category=footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  },
  {
    id: "jackets",
    label: "Jackets",
    sub: "Statement outerwear",
    link: "/shop?category=jackets",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    hero: true,
  },
  {
    id: "accessories",
    label: "Accessories",
    sub: "Finish the fit",
    link: "/shop?category=accessories",
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
  },
  {
    id: "headwear",
    label: "Headwear",
    sub: "Caps, beanies & bucket hats. Get 10% off new drops.",
    link: "/shop?category=headwear",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80",
    featured: true,
  },
  {
    id: "bags",
    label: "Bags",
    sub: "Carry the culture",
    link: "/shop?category=bags",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
  },
  {
    id: "bottoms",
    label: "Bottoms",
    sub: "Cargos, sweats & more",
    link: "/shop?category=bottoms",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
  },
];

function Card({item, style, delay = 0}) {
  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: "-40px"}}
      transition={{duration: 0.5, delay, ease: "easeOut"}}
      style={style}
      className="relative overflow-hidden rounded-2xl group">
      <Link to={item.link} className="block w-full h-full">
        {/* Image */}
        <img
          src={item.image}
          alt={item.label}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          style={{filter: "grayscale(25%)"}}
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent group-hover:from-black/90 transition-all duration-500" />

        {/* Red tint on hover */}
        <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/6 transition-all duration-500" />

        {/* Corner triangle */}
        <div
          className="absolute top-0 right-0 overflow-hidden"
          style={{
            width: 0,
            height: 0,
            borderTop: "0px solid #ef4444",
            borderLeft: "0px solid transparent",
            transition: "all 0.3s",
          }}></div>
        <div className="absolute top-0 right-0 w-0 h-0 overflow-hidden group-hover:w-10 group-hover:h-10 transition-all duration-300">
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "40px solid #ef4444",
              borderLeft: "40px solid transparent",
            }}
          />
        </div>

        {/* Text content */}
        <div
          className={`absolute inset-0 flex flex-col p-5 ${item.featured ? "justify-between" : "justify-end"}`}>
          {/* Featured badge top */}
          {item.featured && (
            <div className="self-start">
              <span className="bg-black/50 backdrop-blur-sm border border-white/10 text-red-500 text-[9px] font-black tracking-[0.3em] uppercase px-3 py-1 rounded-full">
                ✦ Featured
              </span>
            </div>
          )}

          <div>
            <h3
              className="text-white font-black leading-none group-hover:text-red-400 transition-colors duration-300 mb-1"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: item.hero ? "2.4rem" : item.featured ? "2rem" : "1.6rem",
                letterSpacing: "0.05em",
              }}>
              {item.label}
            </h3>

            <p className="text-white/50 text-[10px] tracking-[0.12em] uppercase leading-relaxed group-hover:text-white/70 transition-colors duration-300 max-w-[200px]">
              {item.sub}
            </p>

            {/* Featured discover button */}
            {item.featured && (
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 bg-white text-black text-[10px] font-black tracking-[0.25em] uppercase px-5 py-2.5 rounded-full group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                  Discover
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedCollections() {
  return (
    <section className="bg-black px-6 md:px-12 py-20 border-t border-white/8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-red-500 text-[10px] font-bold tracking-[0.4em] uppercase block mb-3">
            ✦ Shop By Category
          </span>
          <h2
            className="text-white font-black leading-none mb-3"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              letterSpacing: "0.04em",
            }}>
            FEATURED <span className="text-red-500">COLLECTIONS</span>
          </h2>
          <p className="text-white/35 text-[11px] tracking-[0.2em] uppercase">
            Dare to mix and match — level up your fit game
          </p>
        </div>

        {/* Bento Grid — matches reference exactly */}
        <div
          style={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "1fr 1.3fr 1fr",
            gridTemplateRows: "260px 260px",
            gridTemplateAreas: `
              "footwear  jackets  accessories"
              "headwear  bags     bottoms"
            `,
          }}>
          <Card item={collections[0]} style={{gridArea: "footwear"}} delay={0} />
          <Card
            item={collections[1]}
            style={{gridArea: "jackets", gridRow: "1 / 3"}}
            delay={0.08}
          />
          <Card item={collections[2]} style={{gridArea: "accessories"}} delay={0.12} />
          <Card item={collections[3]} style={{gridArea: "headwear"}} delay={0.16} />
          <Card item={collections[4]} style={{gridArea: "bags"}} delay={0.2} />
          <Card item={collections[5]} style={{gridArea: "bottoms"}} delay={0.24} />
        </div>

        {/* View all */}
        <div className="flex justify-center mt-10">
          <Link
            to="/shop"
            className="group relative overflow-hidden border border-white/20 text-[11px] font-bold tracking-[0.3em] uppercase px-10 py-4 text-white/60 hover:text-white transition-colors duration-300 flex items-center gap-3">
            <span className="absolute inset-0 bg-red-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-400 ease-out" />
            <span className="relative">SHOP ALL COLLECTIONS</span>
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
