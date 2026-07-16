import {useState, useEffect, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../../Auth/context/authcontext";

const API = "https://blvckmrktng.com/api";
const OTP_EXPIRY = 15 * 60; // 15 minutes in seconds

const inp = (hasError) => ({
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${hasError ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
  color: "#fff",
  fontSize: 13,
  padding: "13px 16px",
  outline: "none",
  borderRadius: 8,
  letterSpacing: "0.04em",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
});

function getStrength(p) {
  const c = {
    length: p.length >= 8,
    uppercase: /[A-Z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
  const score = Object.values(c).filter(Boolean).length;
  return {
    score,
    label: ["", "Weak", "Fair", "Good", "Strong"][score] || "",
    color:
      ["rgba(255,255,255,0.1)", "#ef4444", "#f97316", "#eab308", "#22c55e"][score] ||
      "rgba(255,255,255,0.1)",
  };
}

// Formats seconds → "14:32"
function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Countdown component ────────────────────────────────────────────────────────
function Countdown({onExpire}) {
  const [secs, setSecs] = useState(OTP_EXPIRY);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const pct = (secs / OTP_EXPIRY) * 100;
  const urgent = secs <= 120; // red when ≤ 2 minutes left
  const barColor = urgent ? "#ef4444" : secs <= 300 ? "#f97316" : "#22c55e"; // red / orange / green

  return (
    <div
      style={{
        background: urgent ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${urgent ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 20,
        transition: "all 0.4s",
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}>
        <span
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}>
          Code expires in
        </span>
        <span
          style={{
            fontFamily: "'Bebas Neue', monospace",
            fontSize: "1.2rem",
            color: barColor,
            letterSpacing: "0.1em",
            transition: "color 0.4s",
          }}>
          {fmtTime(secs)}
        </span>
      </div>
      {/* Progress bar — drains left to right */}
      <div
        style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 99,
          overflow: "hidden",
        }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: barColor,
            borderRadius: 99,
            transition: "width 1s linear, background 0.4s",
          }}
        />
      </div>
      {urgent && (
        <p
          style={{
            color: "#ef4444",
            fontSize: 10,
            fontWeight: 700,
            marginTop: 6,
            animation: "pulse 1s ease-in-out infinite",
          }}>
          ⚠ Code expiring soon — enter it now or request a new one
        </p>
      )}
    </div>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const {login} = useAuth();

  const [step, setStep] = useState(0); // 0=email, 1=code+pass, 2=success
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState("");

  const strength = getStrength(newPass);

  const handleExpire = () => {
    setExpired(true);
    setError("Your reset code has expired. Please request a new one.");
  };

  // ── Step 0: send OTP ──────────────────────────────────────────────────────
  const handleSendCode = async () => {
    setError("");
    setFieldErrors({});
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setFieldErrors({email: "Please enter a valid email address."});
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      // Dev: backend returns code in response if email isn't configured yet
      if (data.data?.dev_otp) {
        console.log(
          `%c[DEV] OTP → ${data.data.dev_otp}`,
          "color:#ef4444;font-size:14px;font-weight:bold;",
        );
      }

      setExpired(false);
      setSuccess("Code sent! Check your inbox.");
      setTimeout(() => {
        setSuccess("");
        setStep(1);
      }, 1200);
    } catch {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend: go back to step 0, reset countdown key ────────────────────────
  const handleResend = () => {
    setStep(0);
    setCode("");
    setNewPass("");
    setError("");
    setFieldErrors({});
    setExpired(false);
  };

  // ── Step 1: verify OTP + reset password ──────────────────────────────────
  const handleReset = async () => {
    if (expired) {
      setError("Your code has expired. Please request a new one.");
      return;
    }
    setError("");
    setFieldErrors({});
    const e = {};
    if (!code.match(/^\d{6}$/)) e.code = "Please enter the 6-digit code.";
    if (newPass.length < 8) e.newPass = "Password must be at least 8 characters.";
    if (Object.keys(e).length) {
      setFieldErrors(e);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, code, new_password: newPass}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid or expired code.");
        return;
      }

      login(data.data.token, data.data.user);
      setStep(2);
      const dest =
        data.data.user?.account_type === "brand" ? "/dashboard/brand" : "/dashboard/buyer";
      setTimeout(() => navigate(dest), 3000);
    } catch {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "system-ui,sans-serif",
      }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      <Link
        to="/signup"
        style={{
          position: "fixed",
          top: 24,
          left: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "rgba(255,255,255,0.35)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          textDecoration: "none",
          zIndex: 200,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
        <svg
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to login
      </Link>

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: "48px 40px",
          boxSizing: "border-box",
        }}>
        <Link
          to="/"
          style={{
            display: "block",
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.4rem",
            color: "#fff",
            letterSpacing: "0.1em",
            textDecoration: "none",
            marginBottom: 36,
            textAlign: "center",
          }}>
          BLVCK<span style={{color: "#ef4444"}}>MRKT</span>
        </Link>

        <AnimatePresence mode="wait">
          {/* ── STEP 0: Enter Email ─────────────────────────────────────────── */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{opacity: 0, y: 16}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -16}}
              transition={{duration: 0.28}}>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}>
                Account Recovery
              </p>
              <h1
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "2rem",
                  color: "#fff",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  marginBottom: 10,
                }}>
                FORGOT YOUR <span style={{color: "#ef4444"}}>PASSWORD?</span>
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 12,
                  lineHeight: 1.7,
                  marginBottom: 28,
                }}>
                Enter the email address on your account. We'll send you a 6-digit code — it expires
                in 15 minutes.
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{opacity: 0, y: -6}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0}}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 16,
                    }}>
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      />
                    </svg>
                    <span style={{color: "#ef4444", fontSize: 12}}>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{marginBottom: 16}}>
                <label
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors({});
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = fieldErrors.email
                      ? "#ef4444"
                      : "rgba(255,255,255,0.1)")
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  style={inp(fieldErrors.email)}
                />
                {fieldErrors.email && (
                  <p style={{color: "#ef4444", fontSize: 10, marginTop: 4}}>{fieldErrors.email}</p>
                )}
              </div>

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{opacity: 0, y: -6}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0}}
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 14,
                    }}>
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{color: "#22c55e", fontSize: 12, fontWeight: 600}}>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleSendCode}
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading ? "#7f1d1d" : "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#ef4444";
                }}>
                {loading ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      style={{animation: "spin 0.8s linear infinite"}}>
                      <path
                        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                        strokeLinecap="round"
                      />
                    </svg>{" "}
                    Sending Code...
                  </>
                ) : (
                  "Send Reset Code →"
                )}
              </button>

              <p
                style={{
                  textAlign: "center",
                  marginTop: 20,
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 12,
                }}>
                Remember it?{" "}
                <Link
                  to="/auth"
                  style={{color: "#ef4444", textDecoration: "none", fontWeight: 700}}>
                  Sign In
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── STEP 1: Enter Code + New Password ──────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{opacity: 0, y: 16}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -16}}
              transition={{duration: 0.28}}>
              {/* Email badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  borderRadius: 8,
                  padding: "8px 14px",
                  marginBottom: 20,
                }}>
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>
                  Code sent to <strong style={{color: "#fff"}}>{email}</strong>
                </span>
                <button
                  onClick={handleResend}
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}>
                  Change
                </button>
              </div>

              {/* ── LIVE COUNTDOWN ── */}
              <Countdown key={email} onExpire={handleExpire} />

              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}>
                Check Your Email
              </p>
              <h1
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.9rem",
                  color: "#fff",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  marginBottom: 20,
                }}>
                ENTER CODE &amp; <span style={{color: "#ef4444"}}>NEW PASSWORD</span>
              </h1>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{opacity: 0, y: -6}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0}}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 16,
                    }}>
                    <svg
                      width="13"
                      height="13"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      style={{marginTop: 1, flexShrink: 0}}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      />
                    </svg>
                    <span style={{color: "#ef4444", fontSize: 12}}>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OTP digits input */}
              <div style={{marginBottom: 14}}>
                <label
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}>
                  6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setFieldErrors((f) => ({...f, code: null}));
                    setError("");
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = fieldErrors.code
                      ? "#ef4444"
                      : "rgba(255,255,255,0.1)")
                  }
                  style={{
                    ...inp(fieldErrors.code),
                    fontFamily: "'Bebas Neue', monospace",
                    fontSize: "1.8rem",
                    letterSpacing: "0.55em",
                    textAlign: "center",
                  }}
                />
                {fieldErrors.code && (
                  <p style={{color: "#ef4444", fontSize: 10, marginTop: 4}}>{fieldErrors.code}</p>
                )}
              </div>

              {/* New password */}
              <div style={{marginBottom: 8}}>
                <label
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}>
                  New Password
                </label>
                <div style={{position: "relative"}}>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Create a new password"
                    value={newPass}
                    onChange={(e) => {
                      setNewPass(e.target.value);
                      setFieldErrors((f) => ({...f, newPass: null}));
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
                    onBlur={(e) =>
                      (e.target.style.borderColor = fieldErrors.newPass
                        ? "#ef4444"
                        : "rgba(255,255,255,0.1)")
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    style={{...inp(fieldErrors.newPass), paddingRight: 44}}
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.3)",
                      padding: 0,
                    }}>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24">
                      {showPass ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      ) : (
                        <>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {fieldErrors.newPass && (
                  <p style={{color: "#ef4444", fontSize: 10, marginTop: 4}}>
                    {fieldErrors.newPass}
                  </p>
                )}
              </div>

              {/* Strength bar */}
              {newPass && (
                <div style={{marginBottom: 20}}>
                  <div style={{display: "flex", gap: 4, marginBottom: 4}}>
                    {Array.from({length: 4}).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 99,
                          background:
                            i < strength.score ? strength.color : "rgba(255,255,255,0.08)",
                          transition: "background 0.3s",
                        }}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: strength.color,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                      }}>
                      {strength.label}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleReset}
                disabled={loading || expired}
                style={{
                  width: "100%",
                  background: expired ? "#374151" : loading ? "#7f1d1d" : "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: loading || expired ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
                onMouseEnter={(e) => {
                  if (!loading && !expired) e.currentTarget.style.background = "#16a34a";
                }}
                onMouseLeave={(e) => {
                  if (!loading && !expired) e.currentTarget.style.background = "#22c55e";
                }}>
                {loading ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      style={{animation: "spin 0.8s linear infinite"}}>
                      <path
                        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                        strokeLinecap="round"
                      />
                    </svg>{" "}
                    Updating Password...
                  </>
                ) : expired ? (
                  "Code Expired — Request New Code"
                ) : (
                  "Reset Password →"
                )}
              </button>

              <p style={{textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 11}}>
                Didn't get the code?{" "}
                <button
                  onClick={handleResend}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}>
                  Send again
                </button>
              </p>
            </motion.div>
          )}

          {/* ── STEP 2: Success ──────────────────────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{opacity: 0, scale: 0.95}}
              animate={{opacity: 1, scale: 1}}
              transition={{duration: 0.4}}
              style={{textAlign: "center"}}>
              <div style={{position: "relative", marginBottom: 28, display: "inline-block"}}>
                <motion.div
                  animate={{scale: [1, 1.18, 1], opacity: [0.35, 0.08, 0.35]}}
                  transition={{duration: 2.2, repeat: Infinity}}
                  style={{
                    position: "absolute",
                    inset: -12,
                    borderRadius: "50%",
                    border: "1px solid #22c55e",
                  }}
                />
                <motion.div
                  initial={{scale: 0}}
                  animate={{scale: 1}}
                  transition={{type: "spring", stiffness: 260, damping: 20}}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background: "rgba(34,197,94,0.1)",
                    border: "2px solid rgba(34,197,94,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <svg
                    width="34"
                    height="34"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24">
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                      initial={{pathLength: 0}}
                      animate={{pathLength: 1}}
                      transition={{duration: 0.6, delay: 0.2}}
                    />
                  </svg>
                </motion.div>
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}>
                Password Updated
              </p>
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "2rem",
                  color: "#fff",
                  letterSpacing: "0.04em",
                  marginBottom: 10,
                }}>
                YOU'RE <span style={{color: "#22c55e"}}>BACK IN!</span>
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 12,
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}>
                Password updated. Taking you to your dashboard…
              </p>
              <div
                style={{
                  width: "100%",
                  height: 3,
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: 99,
                  overflow: "hidden",
                }}>
                <motion.div
                  initial={{width: "0%"}}
                  animate={{width: "100%"}}
                  transition={{duration: 3, ease: "linear"}}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg,#22c55e,#4ade80)",
                    borderRadius: 99,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
