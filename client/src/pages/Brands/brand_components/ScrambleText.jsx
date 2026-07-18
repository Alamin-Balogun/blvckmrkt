import {useEffect, useRef, useState} from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&*";
const DURATION = 700;

export default function ScrambleText({text, active, style}) {
  const [display, setDisplay] = useState("");
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active || doneRef.current) return;
    doneRef.current = true;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      frameRef.current = requestAnimationFrame(() => setDisplay(text));
      return () => frameRef.current && cancelAnimationFrame(frameRef.current);
    }

    startRef.current = null;

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / DURATION);
      const revealCount = Math.floor(progress * text.length);

      let out = "";
      for (let i = 0; i < text.length; i++) {
        out += i < revealCount || text[i] === " "
          ? text[i]
          : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      setDisplay(out);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => frameRef.current && cancelAnimationFrame(frameRef.current);
  }, [active, text]);

  return <span style={style}>{display || " "}</span>;
}
