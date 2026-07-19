import {motion} from "framer-motion";

export default function ScrollCue({label = "Scroll to explore", dark = true}) {
  const textColor = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)";
  const lineColor = dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.22)";

  return (
    <div style={{
      position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      pointerEvents: "none",
    }}>
      <motion.div
        animate={{y: [0, 6, 0]}}
        transition={{duration: 1.6, repeat: Infinity, ease: "easeInOut"}}
        style={{width: 4, height: 4, borderRadius: "50%", background: textColor}}
      />
      <div style={{width: 1, height: 22, background: lineColor}} />
      <span style={{
        color: textColor, fontSize: 10, fontWeight: 700,
        letterSpacing: "0.25em", textTransform: "uppercase", whiteSpace: "nowrap",
      }}>
        {label}
      </span>
    </div>
  );
}
