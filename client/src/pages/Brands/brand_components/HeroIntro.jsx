import {motion} from "framer-motion";
import GarmentViewer from "./GarmentViewer";

const ACCENT = "#ef4444";

export default function HeroIntro({brandName, garments}) {
  const middleIdx = Math.floor((garments.length - 1) / 2);

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", background: "#0a0a0a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden", padding: "220px 24px 60px",
    }}>
      {/* Light bar behind the elevated garment */}
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
        {garments.map((garment, i) => {
          const isMiddle = i === middleIdx;
          const size = isMiddle ? "clamp(160px, 34vw, 340px)" : "clamp(80px, 20vw, 200px)";
          const delay = Math.abs(i - middleIdx) * 0.15;
          return (
            <motion.div
              key={i}
              initial={{opacity: 0, y: 40, scale: 0.92}}
              animate={{opacity: 1, y: 0, scale: 1}}
              transition={{duration: 0.9, delay, ease: [0.16, 1, 0.3, 1]}}
              style={{transform: isMiddle ? "translateY(-16px)" : "none", zIndex: isMiddle ? 2 : 1, flexShrink: 0}}>
              <GarmentViewer angles={garment} size={size} />
            </motion.div>
          );
        })}
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
