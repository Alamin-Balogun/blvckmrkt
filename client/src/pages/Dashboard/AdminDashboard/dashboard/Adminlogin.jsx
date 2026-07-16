import {useState, useEffect} from "react";
import {adminRequestOTP, adminVerifyOTP} from "./dashboard_components/api";

// ── OTP countdown ─────────────────────────────────────────────────────────────
function Countdown({totalSeconds, onExpire}) {
  const [left, setLeft] = useState(totalSeconds);

  useEffect(() => {
    setLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (left <= 0) {
      onExpire?.();
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const pct = (left / totalSeconds) * 100;
  const color = left > 120 ? "#22c55e" : left > 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{marginBottom: 20}}>
      <div
        style={{
          height: 3,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 99,
          overflow: "hidden",
          marginBottom: 10,
        }}>
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            background: color,
            width: `${pct}%`,
            transition: "width 1s linear, background 0.5s",
          }}
        />
      </div>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
        <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>
          Code expires in{" "}
          <strong style={{color, fontFamily: "monospace"}}>
            {mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`}
          </strong>
        </span>
        {left === 0 && (
          <span
            style={{
              color: "#ef4444",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>
            Expired
          </span>
        )}
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const INPUT = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

function Label({text}) {
  return (
    <label
      style={{
        color: "rgba(255,255,255,0.4)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        display: "block",
        marginBottom: 6,
      }}>
      {text}
    </label>
  );
}

function ErrorBox({msg}) {
  return (
    <div
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 8,
        padding: "10px 14px",
        color: "#ef4444",
        fontSize: 12,
        fontWeight: 600,
      }}>
      {msg}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminLoginPage({onLogin}) {
  // step: "credentials" | "otp"
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpSecs, setOtpSecs] = useState(900);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const handleCredentials = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await adminRequestOTP(email, password);
      // data = { admin_id, otp_sent, expires_in }
      setAdminId(data.admin_id);
      const raw = data.expires_in || "15 minutes";
      const match = raw.match(/(\d+)/);
      setOtpSecs((match ? parseInt(match[1], 10) : 15) * 60);
      setExpired(false);
      setOtp("");
      setStep("otp"); // ← move to step 2, do NOT call onLogin yet
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP → this is where onLogin fires ─────────────────────
  const handleVerify = async () => {
    if (expired) {
      setError("Code expired — request a new one");
      return;
    }
    if (otp.length < 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const admin = await adminVerifyOTP(adminId, otp);
      // Token is saved inside adminVerifyOTP — now safe to enter dashboard
      onLogin?.(admin);
    } catch (e) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") step === "credentials" ? handleCredentials() : handleVerify();
  };
  const backToStep1 = () => {
    setStep("credentials");
    setError("");
    setOtp("");
    setExpired(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "Inter, system-ui, sans-serif",
      }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;900&display=swap');
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .adm-input:focus  { border-color: rgba(239,68,68,0.5) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .adm-input::placeholder { color: rgba(255,255,255,0.2); }
        .otp-input:focus  { border-color: rgba(239,68,68,0.5) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
        .otp-input::placeholder { color: rgba(255,255,255,0.15); }
        .adm-btn { width:100%; padding:13px; border-radius:10px; border:none; background:#ef4444; color:#fff; font-size:16px; font-weight:900; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:background 0.15s,transform 0.1s; font-family:'Bebas Neue',sans-serif; }
        .adm-btn:hover:not(:disabled)  { background:#dc2626; transform:translateY(-1px); }
        .adm-btn:active:not(:disabled) { transform:translateY(0); }
        .adm-btn:disabled              { opacity:0.45; cursor:not-allowed; }
        .ghost { background:none; border:none; color:rgba(255,255,255,0.25); font-size:11px; font-weight:700; cursor:pointer; padding:4px 0; letter-spacing:0.1em; text-transform:uppercase; font-family:inherit; transition:color 0.15s; }
        .ghost:hover { color:rgba(255,255,255,0.55); }
        .back  { background:none; border:none; color:rgba(255,255,255,0.3); font-size:11px; font-weight:700; cursor:pointer; padding:0; letter-spacing:0.1em; text-transform:uppercase; font-family:inherit; transition:color 0.15s; }
        .back:hover { color:rgba(255,255,255,0.6); }
      `}</style>

      <div style={{width: "100%", maxWidth: 400}}>
        {/* Logo */}
        <div style={{textAlign: "center", marginBottom: 36}}>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.4rem,8vw,3.2rem)",
              color: "#fff",
              letterSpacing: "0.08em",
              margin: "0 0 4px",
            }}>
            BLVCK<span style={{color: "#ef4444"}}>MRKT</span>
          </h1>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 99,
              padding: "4px 12px",
            }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ef4444",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                color: "#ef4444",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}>
              Admin Portal
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            animation: "fadeUp 0.3s ease",
          }}>
          {/* ── STEP 1: Credentials ── */}
          {step === "credentials" && (
            <>
              <h2
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1.5rem",
                  color: "#fff",
                  letterSpacing: "0.06em",
                  margin: "0 0 6px",
                }}>
                Sign In
              </h2>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 28px"}}>
                Authorised personnel only
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: 14}}>
                <div>
                  <Label text="Email Address" />
                  <input
                    className="adm-input"
                    style={INPUT}
                    type="email"
                    placeholder="admin@blvckmrkt.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKey}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label text="Password" />
                  <input
                    className="adm-input"
                    style={INPUT}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKey}
                    autoComplete="current-password"
                  />
                </div>
                {error && <ErrorBox msg={error} />}
                <button className="adm-btn" onClick={handleCredentials} disabled={loading}>
                  {loading ? "Checking…" : "Continue →"}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Verify OTP ── */}
          {step === "otp" && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}>
                <h2
                  style={{
                    fontFamily: "'Bebas Neue',sans-serif",
                    fontSize: "1.5rem",
                    color: "#fff",
                    letterSpacing: "0.06em",
                    margin: 0,
                  }}>
                  Verify
                </h2>
                <button className="back" onClick={backToStep1}>
                  ← Back
                </button>
              </div>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: "0 0 2px"}}>
                A 6-digit code was sent to
              </p>
              <p
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  fontWeight: 700,
                  margin: "0 0 20px",
                  wordBreak: "break-all",
                }}>
                {email}
              </p>

              <Countdown totalSeconds={otpSecs} onExpire={() => setExpired(true)} />

              <div style={{display: "flex", flexDirection: "column", gap: 14}}>
                <div>
                  <Label text="Verification Code" />
                  <input
                    className="otp-input"
                    style={{
                      ...INPUT,
                      textAlign: "center",
                      fontSize: 28,
                      fontWeight: 900,
                      letterSpacing: "0.5em",
                      paddingLeft: "1em",
                      fontFamily: "'Bebas Neue', monospace",
                      border: `1px solid ${expired ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.1)"}`,
                      color: expired ? "rgba(255,255,255,0.25)" : "#fff",
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={handleKey}
                    autoFocus
                    disabled={expired}
                  />
                </div>
                {error && <ErrorBox msg={error} />}
                <button
                  className="adm-btn"
                  onClick={handleVerify}
                  disabled={loading || otp.length < 6 || expired}>
                  {loading ? "Verifying…" : "Verify & Sign In"}
                </button>
                <button className="ghost" onClick={backToStep1}>
                  {expired ? "↩ Request new code" : "Resend code"}
                </button>
              </div>
            </>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.15)",
            fontSize: 11,
            marginTop: 20,
          }}>
          BLVCKMRKT Admin · Restricted Access
        </p>
      </div>
    </div>
  );
}
