import {useEffect, useRef, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";

const STEP_PX = 45;
const PER_STEP_MS = 420;

// Orders the available angles into a spin sequence: front -> right -> back
// -> left, dropping whichever angles weren't uploaded. Front is always
// present (callers only render a garment once its front image exists).
function buildSequence(angles) {
  return [angles.front, angles.right, angles.back, angles.left].filter(Boolean);
}

// Renders one garment as a standalone figure — no bounding card, no
// box-shadow rectangle — with a soft drop-shadow and a blurred mirrored
// reflection underneath so it reads as something standing there, not a
// photo in a frame. Two modes:
//   interactive=false: static on `front`; plays a single front->...->front
//     spin once when `active` flips true (skipped under reduced-motion).
//   interactive=true: click-and-drag horizontally steps through the same
//     angle sequence, wrapping cyclically.
export default function GarmentViewer({angles, interactive = false, active = false, size = "100%"}) {
  const sequence = buildSequence(angles);
  const [frameIndex, setFrameIndex] = useState(0);
  const doneRef = useRef(false);
  const timerRef = useRef(null);
  const dragRef = useRef({startX: 0, startIndex: 0, dragging: false});
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (interactive || !active || doneRef.current || sequence.length <= 1) return;
    doneRef.current = true;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let i = 0;
    const tick = () => {
      i += 1;
      setFrameIndex(i % sequence.length);
      if (i < sequence.length) {
        timerRef.current = setTimeout(tick, PER_STEP_MS);
      }
    };
    timerRef.current = setTimeout(tick, PER_STEP_MS);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, interactive]);

  if (sequence.length === 0) return null;
  const current = sequence[frameIndex];

  const handlePointerDown = (e) => {
    if (!interactive || sequence.length <= 1) return;
    dragRef.current = {startX: e.clientX, startIndex: frameIndex, dragging: true};
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const delta = e.clientX - dragRef.current.startX;
    const steps = Math.trunc(delta / STEP_PX);
    const len = sequence.length;
    const next = ((dragRef.current.startIndex + steps) % len + len) % len;
    if (next !== frameIndex) setFrameIndex(next);
  };
  const endDrag = () => {
    dragRef.current.dragging = false;
    setDragging(false);
  };

  return (
    <div style={{width: size, display: "flex", flexDirection: "column", alignItems: "center"}}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          position: "relative", width: "100%", aspectRatio: "2/3",
          touchAction: interactive ? "none" : "auto",
          cursor: interactive ? (dragging ? "grabbing" : "grab") : "default",
        }}>
        <AnimatePresence initial={false}>
          <motion.img
            key={current}
            src={current}
            alt=""
            draggable={false}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.18, ease: "easeOut"}}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "contain", userSelect: "none", pointerEvents: "none",
              filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.55))",
            }}
          />
        </AnimatePresence>
      </div>

      {/* Blurred mirrored reflection — sells "standing figure" over "framed photo" */}
      <div style={{
        width: "84%", height: "16%", marginTop: 2, overflow: "hidden",
        transform: "scaleY(-1)", opacity: 0.14, filter: "blur(6px)",
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
        pointerEvents: "none",
      }}>
        <img src={current} alt="" style={{width: "100%", height: "100%", objectFit: "contain"}} />
      </div>

      {interactive && sequence.length > 1 && (
        <p style={{
          color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 8,
        }}>
          Drag to rotate
        </p>
      )}
    </div>
  );
}
