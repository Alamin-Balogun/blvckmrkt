import {useEffect, useRef, useState} from "react";
import {motion, AnimatePresence} from "framer-motion";

const SESSION_FLAG = "blvck_market_gate_shown";

// The access code is deliberately trivial to find — it's the wordmark
// printed right on the terminal itself. This is a flavor gate (sets the
// "restricted market" tone before the site loads), not real security — the
// hint is meant to be obvious enough that nobody actually gets stuck.
const ACCESS_CODE = "BLVCKMRKT";

const BOOT_LINES = [
  "INITIALIZING CONNECTION...",
  "CONNECTING TO BLVCKMRKT NETWORK...",
  "CONNECTION ESTABLISHED.",
  "ACCESS POINT: LAGOS, NIGERIA",
  "ENCRYPTION: ACTIVE",
  "MARKET STATUS: OPEN",
];

export default function MarketGate() {
  const [open, setOpen] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const [code, setCode] = useState("");
  const [denied, setDenied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (lineCount >= BOOT_LINES.length) return;
    const t = setTimeout(() => setLineCount((n) => n + 1), 320);
    return () => clearTimeout(t);
  }, [open, lineCount]);

  useEffect(() => {
    if (lineCount >= BOOT_LINES.length) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [lineCount]);

  const bootDone = lineCount >= BOOT_LINES.length;

  const enter = (e) => {
    e.preventDefault();
    if (code.trim().toUpperCase() !== ACCESS_CODE) {
      setDenied(true);
      setTimeout(() => setDenied(false), 500);
      return;
    }
    sessionStorage.setItem(SESSION_FLAG, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.4}}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "#050000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
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
            animate={denied ? {x: [0, -8, 8, -6, 6, 0]} : {x: 0}}
            transition={{duration: 0.4}}
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
                color: "rgba(239,68,68,0.8)",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}>
              <span>BLVCKMRKT TERMINAL v1.0.0</span>
              <span style={{display: "flex", alignItems: "center", gap: 5}}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#4ade80",
                    display: "inline-block",
                  }}
                />
                CONNECTION: SECURE
              </span>
            </div>
            <div style={{borderTop: "1px dashed rgba(239,68,68,0.3)", marginBottom: 14}} />

            {/* Boot log */}
            <div style={{minHeight: 118, marginBottom: 10}}>
              {BOOT_LINES.slice(0, lineCount).map((line, i) => (
                <div
                  key={line}
                  style={{
                    color: i >= 3 ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.6)",
                    fontSize: 11.5,
                    letterSpacing: "0.03em",
                    marginBottom: 4,
                  }}>
                  {"> "}
                  {line}
                </div>
              ))}
            </div>

            {/* Wordmark */}
            <div style={{textAlign: "center", margin: "18px 0 14px"}}>
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
              <div
                style={{
                  width: 120,
                  height: 2,
                  background: "#ef4444",
                  margin: "14px auto",
                  opacity: 0.6,
                }}
              />
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

            {/* Access form */}
            <AnimatePresence>
              {bootDone && (
                <motion.form
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.35}}
                  onSubmit={enter}
                  style={{
                    border: "1px solid rgba(239,68,68,0.35)",
                    borderRadius: 8,
                    padding: "18px 20px",
                    textAlign: "center",
                  }}>
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
                        letterSpacing: "0.35em",
                        textTransform: "uppercase",
                        minWidth: 0,
                      }}
                    />
                  </div>

                  <p
                    style={{
                      color: denied ? "#ef4444" : "rgba(239,68,68,0.45)",
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      margin: "10px 0 16px",
                      minHeight: 14,
                    }}>
                    {denied ? "ACCESS DENIED — TRY AGAIN" : "💡 TIP: it's the name printed on this terminal"}
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
                </motion.form>
              )}
            </AnimatePresence>

            {bootDone && (
              <p
                style={{
                  textAlign: "center",
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 10,
                  letterSpacing: "0.03em",
                  lineHeight: 1.7,
                  margin: "16px 0 4px",
                }}>
                WARNING: You are entering an unofficial market.
                <br />
                Proceed wisely.
              </p>
            )}

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
      )}
    </AnimatePresence>
  );
}
