import {useEffect, useRef, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";
import SpinningLogo from "./SpinningLogo";

const SESSION_FLAG = "blvck_market_gate_shown";

// The access code is deliberately trivial to find — spelled out right above
// the input. This is a flavor gate (sets the "restricted market" tone
// before the site loads), not real security.
const ACCESS_CODE = "12345";

// Seconds each boot stage's progress bar takes to fill, once the correct
// code has been entered — nothing runs before that.
const STAGE_DURATION_MS = 3000;

// showWhileActive: whether the top-left status line appears (red) while its
// own bar is still loading, or only pops in (green) once done. init/connect/
// access build up progressively; encryption/market stay hidden until done.
const STAGES = [
  {
    key: "init",
    activeText: "INITIALIZING CONNECTION...",
    doneText: "CONNECTION ESTABLISHED.",
    barLabel: "Initializing connection",
    showWhileActive: true,
    animatedDots: true,
  },
  {
    key: "connect",
    activeText: "CONNECTING TO BLVCKMRKT NETWORK...",
    doneText: "CONNECTION ESTABLISHED.",
    barLabel: "Connecting to BLVCKMRKT network",
    showWhileActive: true,
    animatedDots: true,
  },
  {
    key: "access",
    activeText: "ACCESS POINT: UNKNOWN",
    doneText: null, // resolved live from `location` at render time
    barLabel: "Locating device",
    showWhileActive: true,
    animatedDots: false,
  },
  {
    key: "encryption",
    activeText: null,
    doneText: "ENCRYPTION: ACTIVE",
    barLabel: "Encrypting your account",
    showWhileActive: false,
    animatedDots: false,
  },
  {
    key: "market",
    activeText: null,
    doneText: "MARKET STATUS: OPEN",
    barLabel: "Getting market status",
    showWhileActive: false,
    animatedDots: false,
  },
];

export default function MarketGate() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("form"); // "form" | "booting" | "granted"
  const [stageIndex, setStageIndex] = useState(0);
  const [dotFrame, setDotFrame] = useState(0);
  const [code, setCode] = useState("");
  const [denied, setDenied] = useState(false);
  const [location, setLocation] = useState("DETECTING...");
  const inputRef = useRef(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    setOpen(true);
  }, []);

  // Live IP-based location for the ACCESS POINT stage — kicked off in the
  // background as soon as the gate opens so it's usually ready well before
  // the "Locating device" stage is reached. Falls back quietly on failure.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("https://ipapi.co/json/")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        const place = [data.region || data.city, data.country_name].filter(Boolean).join(", ");
        setLocation(place ? place.toUpperCase() : "LAGOS, NIGERIA");
      })
      .catch(() => {
        if (!cancelled) setLocation("LAGOS, NIGERIA");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open && phase === "form") {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open, phase]);

  // Sequences the 5 stages one at a time, only once phase === "booting"
  // (i.e. only after the correct code was submitted) — the gate never
  // starts loading on its own. Kept separate from the "granted → close"
  // effect below: setting phase here and starting a close-timer in the same
  // effect would have that timer immediately cancelled, since changing
  // `phase` re-triggers this effect and React cleans up the just-scheduled
  // timeout before the new run even starts.
  useEffect(() => {
    if (phase !== "booting") return;
    if (stageIndex >= STAGES.length) {
      setPhase("granted");
      return;
    }
    const t = setTimeout(() => setStageIndex((i) => i + 1), STAGE_DURATION_MS);
    return () => clearTimeout(t);
  }, [phase, stageIndex]);

  // Closes the gate shortly after "ACCESS GRANTED" is shown.
  useEffect(() => {
    if (phase !== "granted") return;
    const t = setTimeout(() => {
      sessionStorage.setItem(SESSION_FLAG, "1");
      setOpen(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [phase]);

  // Animated "." "." "." for whichever stage is currently loading — both
  // the top-left status line (when it ends in "...") and the progress-bar
  // caption below use this same cycling frame.
  useEffect(() => {
    if (phase !== "booting") return;
    const t = setInterval(() => setDotFrame((f) => (f + 1) % 3), 320);
    return () => clearInterval(t);
  }, [phase, stageIndex]);

  const stageDoneText = (stage) => (stage.key === "access" ? `ACCESS POINT: ${location}` : stage.doneText);
  const animatedDots = ".".repeat(dotFrame + 1);
  const stageActiveText = (stage) =>
    stage.animatedDots ? `${stage.activeText.replace(/\.+$/, "")}${animatedDots}` : stage.activeText;

  const enter = (e) => {
    e.preventDefault();
    if (code.trim().toUpperCase() !== ACCESS_CODE) {
      setDenied(true);
      setTimeout(() => setDenied(false), 500);
      return;
    }
    setDenied(false);
    setStageIndex(0);
    setPhase("booting");
  };

  const currentStage = STAGES[stageIndex];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.6}}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "#050000",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "5vh 18px",
            fontFamily: "'Space Mono', monospace",
            overflowY: "auto",
          }}>
          {/* Scanlines + faint dot-grid texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(239,68,68,0.03) 0px, rgba(239,68,68,0.03) 1px, transparent 1px, transparent 3px), radial-gradient(circle at 1.5px 1.5px, rgba(239,68,68,0.12) 1px, transparent 0)",
              backgroundSize: "auto, 26px 26px",
            }}
          />

          <motion.div
            initial={{opacity: 0, y: 12, scale: 0.98}}
            animate={{opacity: 1, y: 0, scale: 1}}
            transition={{duration: 0.5, delay: 0.1}}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 720,
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 10,
              padding: "22px 26px 26px",
              background: "rgba(10,0,0,0.6)",
              boxShadow: "0 0 60px rgba(239,68,68,0.08), inset 0 0 40px rgba(239,68,68,0.03)",
            }}>
            <motion.div animate={denied ? {x: [0, -8, 8, -6, 6, 0]} : {x: 0}} transition={{duration: 0.4}}>
              {/* Corner brackets */}
              {[
                {top: -1, left: -1, borderWidth: "2px 0 0 2px"},
                {top: -1, right: -1, borderWidth: "2px 2px 0 0"},
                {bottom: -1, left: -1, borderWidth: "0 0 2px 2px"},
                {bottom: -1, right: -1, borderWidth: "0 2px 2px 0"},
              ].map((pos, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    width: 18,
                    height: 18,
                    borderStyle: "solid",
                    borderColor: "#ef4444",
                    ...pos,
                  }}
                />
              ))}

              {/* Top bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                  color: "rgba(239,68,68,0.8)",
                }}>
                <span>BLVCKMRKT TERMINAL v1.0.0</span>
                <span style={{display: "flex", alignItems: "center", gap: 5}}>
                  <span
                    style={{width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block"}}
                  />
                  CONNECTION: SECURE
                </span>
              </div>
              <div style={{borderTop: "1px dashed rgba(239,68,68,0.3)", marginBottom: 14}} />

              {/* Status log — top-left, builds up as the boot sequence runs.
                  Empty/absent entirely until the code has been accepted. */}
              {phase !== "form" && (
                <div style={{textAlign: "left", margin: "0 0 14px", minHeight: 80}}>
                  {STAGES.map((stage, i) => {
                    const isDone = phase === "granted" || i < stageIndex;
                    const isActive = phase === "booting" && i === stageIndex;
                    if (!isDone && !isActive) return null; // not its turn yet
                    if (isActive && !stage.showWhileActive) return null; // hidden while loading
                    const text = isDone ? stageDoneText(stage) : stageActiveText(stage);
                    return (
                      <div
                        key={stage.key}
                        style={{
                          color: isDone ? "#4ade80" : "#ef4444",
                          fontSize: 11,
                          letterSpacing: "0.02em",
                          marginBottom: 4,
                          transition: "color 0.3s",
                        }}>
                        {"> "}
                        {text}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Wordmark */}
              <div style={{textAlign: "center", margin: "10px 0 14px"}}>
                <div style={{display: "flex", justifyContent: "center", marginBottom: -8}}>
                  <SpinningLogo color="red" size={110} />
                </div>
                <h1
                  style={{
                    fontFamily: "'Press Start 2P', 'Space Mono', monospace",
                    fontSize: "clamp(1.5rem, 6.5vw, 3rem)",
                    color: "#ef4444",
                    margin: 0,
                    lineHeight: 1.3,
                    textShadow: "0 0 18px rgba(239,68,68,0.55), 0 0 2px rgba(239,68,68,0.8)",
                    wordBreak: "break-word",
                  }}>
                  BLVCKMRKT<span style={{fontSize: "0.4em", verticalAlign: "super"}}>™</span>
                </h1>
                <div style={{width: 120, height: 2, background: "#ef4444", margin: "14px auto", opacity: 0.6}} />
                <p
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 11.5,
                    letterSpacing: "0.08em",
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                  THE UNDERGROUND MARKETPLACE
                  <br />
                  FOR NIGERIAN STREETWEAR
                </p>
              </div>

              {/* Form / booting / granted box */}
              <div
                style={{
                  border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: 8,
                  padding: "18px 20px",
                  textAlign: "center",
                }}>
                <AnimatePresence mode="wait">
                  {phase === "granted" ? (
                    <motion.div
                      key="granted"
                      initial={{opacity: 0, scale: 0.9}}
                      animate={{opacity: 1, scale: 1}}
                      transition={{duration: 0.3}}
                      style={{padding: "18px 0"}}>
                      <div
                        style={{
                          color: "#4ade80",
                          fontSize: 17,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textShadow: "0 0 16px rgba(74,222,128,0.6)",
                        }}>
                        ✅ ACCESS GRANTED
                      </div>
                      <p style={{color: "rgba(255,255,255,0.35)", fontSize: 10.5, letterSpacing: "0.1em", marginTop: 8}}>
                        WELCOME TO THE MARKET
                      </p>
                    </motion.div>
                  ) : phase === "booting" ? (
                    <motion.div
                      key="booting"
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      exit={{opacity: 0}}
                      style={{padding: "6px 0"}}>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 12,
                          letterSpacing: "0.08em",
                          margin: "0 0 14px",
                        }}>
                        {currentStage?.barLabel}
                        {animatedDots}
                      </p>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 99,
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.25)",
                          overflow: "hidden",
                        }}>
                        <motion.div
                          key={stageIndex}
                          initial={{width: "0%"}}
                          animate={{width: "100%"}}
                          transition={{duration: STAGE_DURATION_MS / 1000, ease: "linear"}}
                          style={{
                            height: "100%",
                            background: "linear-gradient(90deg,#ef4444,#ff6b6b)",
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <p
                        style={{
                          color: "rgba(239,68,68,0.4)",
                          fontSize: 9.5,
                          letterSpacing: "0.15em",
                          margin: "10px 0 0",
                        }}>
                        STAGE {stageIndex + 1} OF {STAGES.length}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          color: "#ef4444",
                          fontSize: 15,
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                        }}>
                        🔒 ENTER CODE
                      </div>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontSize: 10,
                          letterSpacing: "0.15em",
                          margin: "5px 0 14px",
                        }}>
                        AUTHORIZED ACCESS ONLY
                      </p>

                      <form onSubmit={enter}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: 6,
                            padding: "10px 14px",
                            background: "rgba(239,68,68,0.04)",
                          }}>
                          <span style={{color: "#ef4444", fontSize: 13}}>{">"}</span>
                          <input
                            ref={inputRef}
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="_ _ _ _ _ _ _ _ _"
                            autoComplete="off"
                            autoCapitalize="characters"
                            style={{
                              flex: 1,
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              color: "#fff",
                              fontFamily: "'Space Mono', monospace",
                              fontSize: 14,
                              letterSpacing: "0.3em",
                              textTransform: "uppercase",
                              minWidth: 0,
                            }}
                          />
                        </div>

                        <p
                          style={{
                            color: denied ? "#ef4444" : "rgba(239,68,68,0.45)",
                            fontSize: 10,
                            letterSpacing: "0.05em",
                            margin: "10px 0 16px",
                            minHeight: 14,
                          }}>
                          {denied
                            ? "ACCESS DENIED — TRY AGAIN"
                            : "Sure you want to enter BLVCKMRKT? Enter the code: 12345"}
                        </p>

                        <button
                          type="submit"
                          style={{
                            width: "100%",
                            background: "rgba(239,68,68,0.12)",
                            border: "1px solid #ef4444",
                            color: "#ef4444",
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            padding: "13px",
                            cursor: "pointer",
                            borderRadius: 4,
                            transition: "background 0.2s, color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#ef4444";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                            e.currentTarget.style.color = "#ef4444";
                          }}>
                          [ ENTER MARKET ]
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 10,
                  letterSpacing: "0.03em",
                  lineHeight: 1.7,
                  margin: "16px 0 4px",
                }}>
                RESTRICTED TERMINAL — VERIFIED ACCESS ONLY.
                <br />
                Your session is encrypted and secure.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 8,
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: "1px dashed rgba(239,68,68,0.2)",
                  color: "rgba(239,68,68,0.35)",
                  fontSize: 9,
                  letterSpacing: "0.05em",
                }}>
                <span>TERMINAL ID: BM-2025-NG</span>
                <span>ALL ACTIVITIES MONITORED</span>
                <span>© BLVCKMRKT {new Date().getFullYear()}</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
