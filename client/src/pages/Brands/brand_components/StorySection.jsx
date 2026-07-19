import {useRef, useState} from "react";
import {motion} from "framer-motion";
import ScrambleText from "./ScrambleText";
import GlitchTransition from "./GlitchTransition";
import ScrollCue from "./ScrollCue";
import GarmentViewer from "./GarmentViewer";

const TINTS = [
  "linear-gradient(160deg, rgba(239,68,68,0.16), #0a0a0a 65%)",
  "linear-gradient(160deg, rgba(51,65,85,0.35), #0a0a0a 65%)",
];

const VIEWER_WIDTH = "min(58vw, 340px)";

export default function StorySection({garment, headline, index}) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const tint = TINTS[index % TINTS.length];

  return (
    <div ref={ref} style={{
      position: "relative", minHeight: "100dvh", background: tint,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", padding: "80px 24px",
    }}>
      <div style={{position: "relative", width: VIEWER_WIDTH}}>
        <GarmentViewer angles={garment} active={active} size="100%" />
        <div style={{position: "absolute", top: 0, left: 0, right: 0, aspectRatio: "2/3"}}>
          <GlitchTransition image={garment.front} active={active} />
        </div>
      </div>

      <motion.p
        onViewportEnter={() => setActive(true)}
        viewport={{once: true, amount: 0.5}}
        style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.6rem, 5vw, 2.8rem)",
          color: "#fff", textAlign: "center", letterSpacing: "0.03em", maxWidth: 560,
          padding: "0 20px", textShadow: "0 4px 24px rgba(0,0,0,0.8)",
        }}>
        <ScrambleText text={headline} active={active} />
      </motion.p>

      <ScrollCue />
    </div>
  );
}
