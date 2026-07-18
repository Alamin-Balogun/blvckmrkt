import {motion} from "framer-motion";

const ACCENT = "#ef4444";

function HeroImage({src, size, delay}) {
  if (!src) return <div style={{width: size, flexShrink: 0}} />;
  return (
    <motion.div
      initial={{opacity: 0, y: 40, scale: 0.92}}
      animate={{opacity: 1, y: 0, scale: 1}}
      transition={{duration: 0.9, delay, ease: [0.16, 1, 0.3, 1]}}
      style={{position: "relative", width: size, flexShrink: 0}}>
      <div style={{
        borderRadius: 14, overflow: "hidden", aspectRatio: "3/4",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)", background: "#111",
      }}>
        <img src={src} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </div>
      {/* Reflective floor */}
      <div style={{
        marginTop: 2, borderRadius: 14, overflow: "hidden", aspectRatio: "3/4",
        maxHeight: 60, transform: "scaleY(-1)", opacity: 0.15, filter: "blur(6px)",
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
      }}>
        <img src={src} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
      </div>
    </motion.div>
  );
}

export default function HeroIntro({brandName, leftImage, centerImage, rightImage}) {
  return (
    <div style={{
      position: "relative", minHeight: "100dvh", background: "#0a0a0a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden", padding: "220px 24px 60px",
    }}>
      {/* Light bar behind center image */}
      <motion.div
        initial={{opacity: 0, scaleY: 0.3}}
        animate={{opacity: 0.55, scaleY: 1}}
        transition={{duration: 1.2, ease: "easeOut"}}
        style={{
          position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)",
          width: 6, height: "55%", borderRadius: 99,
          background: `linear-gradient(to bottom, transparent, ${ACCENT}, transparent)`,
          filter: "blur(24px)", zIndex: 0,
        }} />

      <div style={{
        position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end",
        justifyContent: "center", gap: "clamp(8px, 2vw, 28px)", width: "100%", maxWidth: 900,
      }}>
        <HeroImage src={leftImage} size="clamp(80px, 20vw, 200px)" delay={0.15} />
        <div style={{width: "clamp(160px, 34vw, 340px)", flexShrink: 0, transform: "translateY(-16px)", zIndex: 2}}>
          <HeroImage src={centerImage} size="100%" delay={0} />
        </div>
        <HeroImage src={rightImage} size="clamp(80px, 20vw, 200px)" delay={0.3} />
      </div>

      <motion.div
        initial={{opacity: 0, y: 16}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.7, delay: 0.55}}
        style={{position: "relative", zIndex: 1, textAlign: "center", marginTop: 40}}>
        <p style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2rem, 6vw, 3.4rem)",
          color: "#fff", letterSpacing: "0.05em", margin: 0, lineHeight: 1,
        }}>
          {brandName}
        </p>
        <p style={{
          color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.25em", textTransform: "uppercase", marginTop: 12,
        }}>
          Scroll to explore
        </p>
      </motion.div>
    </div>
  );
}
