import {motion} from "framer-motion";

// One-shot RGB-split "glitch" flash — plays once when `active` flips true,
// then decays to nothing, revealing the clean image already rendered
// underneath by the parent. Not scroll-scrubbed: a glitch effect scrubbed
// proportionally to scroll position looks janky and doesn't reverse cleanly
// on scroll-up, so it's a fixed ~280ms keyframe animation instead.
export default function GlitchTransition({image, active}) {
  if (!image) return null;
  return (
    <div style={{position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden"}}>
      <motion.img
        src={image}
        alt=""
        initial={{opacity: 0}}
        animate={active ? {opacity: [0, 0.9, 0.9, 0], x: [0, -8, -3, 0]} : {opacity: 0}}
        transition={{duration: 0.28, ease: "easeOut", times: [0, 0.15, 0.6, 1]}}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          mixBlendMode: "screen", filter: "saturate(4) hue-rotate(-40deg) brightness(1.3)",
        }}
      />
      <motion.img
        src={image}
        alt=""
        initial={{opacity: 0}}
        animate={active ? {opacity: [0, 0.9, 0.9, 0], x: [0, 8, 3, 0]} : {opacity: 0}}
        transition={{duration: 0.28, ease: "easeOut", times: [0, 0.15, 0.6, 1]}}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          mixBlendMode: "screen", filter: "saturate(4) hue-rotate(140deg) brightness(1.3)",
        }}
      />
    </div>
  );
}
