import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link} from "react-router-dom";
import {useHomeContent} from "./homecontentcontext";

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  // Pull each slide field from admin — fall back to hardcoded defaults
  const s1tag = useHomeContent("hero_slide1_tag", "NEW ARRIVALS");
  const s1title = useHomeContent("hero_slide1_title", "DRESS\nDIFFERENT.");
  const s1sub = useHomeContent(
    "hero_slide1_sub",
    "Exclusive streetwear drops from verified sellers.",
  );
  const s1cta = useHomeContent("hero_slide1_cta", "SHOP NOW");
  const s1link = useHomeContent("hero_slide1_link", "/shop");

  const s2tag = useHomeContent("hero_slide2_tag", "TOP SELLERS");
  const s2title = useHomeContent("hero_slide2_title", "WEAR YOUR\nCULTURE.");
  const s2sub = useHomeContent(
    "hero_slide2_sub",
    "Connect with sellers pushing the culture forward.",
  );
  const s2cta = useHomeContent("hero_slide2_cta", "EXPLORE");
  const s2link = useHomeContent("hero_slide2_link", "/shop");

  const s3tag = useHomeContent("hero_slide3_tag", "SELL WITH US");
  const s3title = useHomeContent("hero_slide3_title", "GOT HEAT?\nSELL IT.");
  const s3sub = useHomeContent("hero_slide3_sub", "List your items and reach thousands of buyers.");
  const s3cta = useHomeContent("hero_slide3_cta", "START SELLING");
  const s3link = useHomeContent("hero_slide3_link", "/register");

  const intervalMs = parseInt(useHomeContent("hero_slide_interval", "5000"), 10) || 5000;

  const slides = [
    {
      id: 1,
      image: "https://i.pinimg.com/736x/42/b2/77/42b27742067ae58a4f3dff884aad0269.jpg",
      tag: s1tag,
      title: s1title,
      sub: s1sub,
      cta: s1cta,
      ctaLink: s1link,
    },
    {
      id: 2,
      image: "https://i.pinimg.com/736x/de/31/05/de31056bdc9015477d87166214dc34fe.jpg",
      tag: s2tag,
      title: s2title,
      sub: s2sub,
      cta: s2cta,
      ctaLink: s2link,
    },
    {
      id: 3,
      image: "https://i.pinimg.com/736x/2a/f2/c9/2af2c943b0ccb402ddef72fb344ba631.jpg",
      tag: s3tag,
      title: s3title,
      sub: s3sub,
      cta: s3cta,
      ctaLink: s3link,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  const goTo = (index) => setCurrent(index);
  const slide = slides[current];

  return (
    <div className="relative w-full h-[670px] overflow-hidden bg-black mt-[36px]">
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

      <div className="relative z-10 h-full flex flex-col justify-end pb-20 px-8 md:px-20 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide.id}`}
            initial={{opacity: 0, y: 40}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            transition={{duration: 0.7, ease: "easeOut"}}>
            <motion.span
              className="inline-block text-red-500 text-[11px] font-bold tracking-[0.35em] uppercase mb-4 border border-red-500/40 px-3 py-1"
              initial={{opacity: 0, x: -20}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: 0.2, duration: 0.5}}>
              {slide.tag}
            </motion.span>

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

            <motion.p
              className="text-white/60 text-sm tracking-widest uppercase mb-7 max-w-md"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{delay: 0.5, duration: 0.6}}>
              {slide.sub}
            </motion.p>

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

        <div className="flex items-center gap-3 mt-10">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className="relative h-[2px] transition-all duration-500 overflow-hidden py-2.5 px-5 bg-white/20"
              style={{width: i === current ? "48px" : "20px"}}>
              {i === current && (
                <motion.span
                  className="absolute inset-0 bg-white origin-left py-2.5 px-5"
                  initial={{scaleX: 0}}
                  animate={{scaleX: 1}}
                  transition={{duration: intervalMs / 1000, ease: "linear"}}
                />
              )}
            </button>
          ))}
          <span className="text-white/30 text-[11px] tracking-widest ml-2">
            0{current + 1} / 0{slides.length}
          </span>
        </div>
      </div>

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
