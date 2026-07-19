import {useRef, useEffect, useState} from "react";
import {motion, useScroll, useTransform} from "framer-motion";
import ScrambleText from "./ScrambleText";
import GlitchTransition from "./GlitchTransition";
import ScrollCue from "./ScrollCue";

const TINTS = [
  "linear-gradient(160deg, rgba(239,68,68,0.16), #0a0a0a 65%)",
  "linear-gradient(160deg, rgba(51,65,85,0.35), #0a0a0a 65%)",
];

function useTiltAllowed() {
  const [allowed, setAllowed] = useState(true);
  useEffect(() => {
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setAllowed(!reduceQuery.matches && !mobileQuery.matches);
    update();
    reduceQuery.addEventListener("change", update);
    mobileQuery.addEventListener("change", update);
    return () => {
      reduceQuery.removeEventListener("change", update);
      mobileQuery.removeEventListener("change", update);
    };
  }, []);
  return allowed;
}

export default function StorySection({image, headline, index}) {
  const ref = useRef(null);
  const tiltAllowed = useTiltAllowed();
  const tiltDir = index % 2 === 0 ? 1 : -1;
  const [headlineActive, setHeadlineActive] = useState(false);

  const {scrollYProgress} = useScroll({target: ref, offset: ["start end", "end start"]});
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], tiltAllowed ? [tiltDir * -14, 0, tiltDir * 14] : [0, 0, 0]);
  const imgOpacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.35, 1, 1, 0.35]);

  const tint = TINTS[index % TINTS.length];

  return (
    <div ref={ref} style={{
      position: "relative", minHeight: "100dvh", background: tint,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", padding: "80px 24px",
    }}>
      <div style={{
        position: "relative", width: "min(70vw, 480px)", aspectRatio: "3/4",
        perspective: 1200,
      }}>
        <motion.div
          style={{
            width: "100%", height: "100%", borderRadius: 16, overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)", rotateY, opacity: imgOpacity,
          }}>
          <img src={image} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} />
          <GlitchTransition image={image} active={headlineActive} />
        </motion.div>
      </div>

      <motion.p
        onViewportEnter={() => setHeadlineActive(true)}
        viewport={{once: true, amount: 0.5}}
        style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(1.6rem, 5vw, 2.8rem)",
          color: "#fff", textAlign: "center", letterSpacing: "0.03em", maxWidth: 560,
          padding: "0 20px", textShadow: "0 4px 24px rgba(0,0,0,0.8)",
        }}>
        <ScrambleText text={headline} active={headlineActive} />
      </motion.p>

      <ScrollCue />
    </div>
  );
}
