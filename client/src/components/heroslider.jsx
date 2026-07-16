import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";

const slides = [
  {
    id: 1,
    image: "https://i.pinimg.com/736x/17/67/bf/1767bfc4798153b84ad4ae4bf40f3043.jpg",
    tag: "NEW ARRIVALS",
    title: "DRESS\nDIFFERENT.",
    sub: "Exclusive streetwear drops from verified sellers.",
    cta: "SHOP NOW",
    ctaLink: "/shop",
  },
  {
    id: 2,
    image: "https://i.pinimg.com/736x/de/31/05/de31056bdc9015477d87166214dc34fe.jpg",
    tag: "TOP SELLERS",
    title: "WEAR YOUR\nCULTURE.",
    sub: "Connect with sellers pushing the culture forward.",
    cta: "EXPLORE",
    ctaLink: "/shop",
  },
  {
    id: 3,
    image: "https://i.pinimg.com/736x/d1/1d/3b/d11d3be9d125c89f3393b551e592b1c1.jpg",
    tag: "SELL WITH US",
    title: "GOT HEAT?\nSELL IT.",
    sub: "List your items and reach thousands of buyers.",
    cta: "START SELLING",
    ctaLink: "/sell",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index) => setCurrent(index);

  const slide = slides[current];

  return (
    // mt-[36px] offsets the fixed navbar height so content starts below it
    <div className="relative w-full h-[670px] overflow-hidden bg-black mt-[36px]">
      {/* Crossfade Background Images */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 1.2, ease: "easeInOut"}}
          className="absolute inset-0">
          <img src={slide.image} alt="" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Slide Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-20 px-8 md:px-20 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide.id}`}
            initial={{opacity: 0, y: 40}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            transition={{duration: 0.7, ease: "easeOut"}}>
            {/* Tag */}
            <motion.span
              className="inline-block text-red-500 text-[11px] font-bold tracking-[0.35em] uppercase mb-4 border border-red-500/40 px-3 py-1"
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: 0.2, duration: 0.5}}>
              {slide.tag}
            </motion.span>

            {/* Title */}
            <motion.h2
              className="text-white font-black leading-none mb-5"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(3.5rem, 8vw, 7rem)",
                lineHeight: "0.95",
                letterSpacing: "0.02em",
                whiteSpace: "pre-line",
              }}
              initial={{opacity: 0, y: 30}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.3, duration: 0.6}}>
              {slide.title}
            </motion.h2>

            {/* Sub */}
            <motion.p
              className="text-white/60 text-sm tracking-widest uppercase mb-7 max-w-md"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{delay: 0.5, duration: 0.6}}>
              {slide.sub}
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.6, duration: 0.5}}
              className="flex items-center gap-4">
              <Link
                to={slide.ctaLink}
                className="group relative bg-white text-black text-[12px] font-bold tracking-[0.25em] uppercase px-8 py-3.5 overflow-hidden transition-all duration-300 hover:text-white">
                <span className="absolute inset-0 bg-red-500 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10">{slide.cta}</span>
              </Link>
              <Link
                to="/shop"
                className="text-white/50 hover:text-white text-[11px] tracking-[0.2em] uppercase transition-colors duration-200 flex items-center gap-2">
                View All <span className="text-lg">→</span>
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators */}
        <div className="flex items-center gap-3 mt-10">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className="relative h-[2px] transition-all duration-500 overflow-hidden bg-white/20"
              style={{width: i === current ? "48px" : "20px"}}>
              {i === current && (
                <motion.span
                  className="absolute inset-0 bg-white origin-left"
                  initial={{scaleX: 0}}
                  animate={{scaleX: 1}}
                  transition={{duration: 5, ease: "linear"}}
                />
              )}
            </button>
          ))}
          <span className="text-white/30 text-[11px] tracking-widest ml-2">
            0{current + 1} / 0{slides.length}
          </span>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3 z-10">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent to-white/30" />
        <span
          className="text-white/30 text-[10px] tracking-[0.3em] uppercase"
          style={{writingMode: "vertical-rl"}}>
          Scroll
        </span>
      </div>
    </div>
  );
}
