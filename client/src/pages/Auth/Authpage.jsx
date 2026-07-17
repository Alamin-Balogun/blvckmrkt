import {useState, useEffect, useRef} from "react";
import {motion, AnimatePresence, useAnimation} from "framer-motion";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../Auth/context/authcontext";

const API = "https://blvckmrktng.com/api";
const OTP_EXPIRY = 15 * 60;
const REDIRECT_DELAY = 5000;

// ── Helpers ───────────────────────────────────────────────────────────────────
const inp = (focused, name, hasError) => ({
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${hasError ? "#ef4444" : focused === name ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.1)"}`,
  color: "#fff",
  fontSize: 13,
  padding: "13px 16px",
  outline: "none",
  borderRadius: 8,
  letterSpacing: "0.04em",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
});

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function Checkbox({checked, onChange}) {
  return (
    <motion.div
      onClick={onChange}
      whileTap={{scale: 0.85}}
      style={{
        width: 16,
        height: 16,
        border: `1px solid ${checked ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
        borderRadius: 4,
        background: checked ? "#ef4444" : "transparent",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s",
      }}>
      <AnimatePresence>
        {checked && (
          <motion.svg
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0, opacity: 0}}
            transition={{duration: 0.15}}
            width="9"
            height="9"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ErrBanner({message}) {
  if (!message) return null;
  return (
    <motion.div
      initial={{opacity: 0, y: -8, height: 0}}
      animate={{opacity: 1, y: 0, height: "auto"}}
      exit={{opacity: 0, y: -8, height: 0}}
      transition={{duration: 0.22}}
      style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: 8,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        overflow: "hidden",
      }}>
      <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <span style={{color: "#ef4444", fontSize: 12, fontWeight: 600}}>{message}</span>
    </motion.div>
  );
}

function OkBanner({message}) {
  if (!message) return null;
  return (
    <motion.div
      initial={{opacity: 0, y: -8, height: 0}}
      animate={{opacity: 1, y: 0, height: "auto"}}
      exit={{opacity: 0, y: -8, height: 0}}
      transition={{duration: 0.22}}
      style={{
        background: "rgba(34,197,94,0.1)",
        border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: 8,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        overflow: "hidden",
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
      <span style={{color: "#22c55e", fontSize: 12, fontWeight: 600}}>{message}</span>
    </motion.div>
  );
}

function Field({children, error}) {
  return (
    <div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{opacity: 0, height: 0, marginTop: 0}}
            animate={{opacity: 1, height: "auto", marginTop: 4}}
            exit={{opacity: 0, height: 0, marginTop: 0}}
            style={{color: "#ef4444", fontSize: 10, margin: 0}}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmitBtn({loading, disabled, label, loadingLabel, onClick}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={!loading && !disabled ? {scale: 1.01} : {}}
      whileTap={!loading && !disabled ? {scale: 0.98} : {}}
      style={{
        width: "100%",
        background: disabled ? "#374151" : loading ? "#7f1d1d" : "#ef4444",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: 14,
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        cursor: loading || disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
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
          </svg>
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </motion.button>
  );
}

// ── OTP Countdown ─────────────────────────────────────────────────────────────
function OTPCountdown({resetKey, onExpire}) {
  const [secs, setSecs] = useState(OTP_EXPIRY);
  const ref = useRef(null);
  useEffect(() => {
    setSecs(OTP_EXPIRY);
    clearInterval(ref.current);
    ref.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(ref.current);
          onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [resetKey]);
  const pct = (secs / OTP_EXPIRY) * 100;
  const urgent = secs <= 120;
  const color = urgent ? "#ef4444" : secs <= 300 ? "#f97316" : "#22c55e";
  return (
    <div
      style={{
        background: urgent ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${urgent ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 14,
        transition: "all 0.4s",
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}>
        <span
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}>
          Code expires in
        </span>
        <span
          style={{
            fontFamily: "'Bebas Neue',monospace",
            fontSize: "1.1rem",
            color,
            letterSpacing: "0.08em",
            transition: "color 0.4s",
          }}>
          {fmtTime(secs)}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 3,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 99,
          overflow: "hidden",
        }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
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
            marginTop: 5,
            animation: "pulse 1s ease-in-out infinite",
          }}>
          ⚠ Expiring soon — enter the code now
        </p>
      )}
    </div>
  );
}

function OTPInput({value, onChange, hasError}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      placeholder="000000"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${hasError ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
        color: "#fff",
        outline: "none",
        borderRadius: 8,
        fontFamily: "'Bebas Neue',monospace",
        fontSize: "2rem",
        letterSpacing: "0.65em",
        textAlign: "center",
        padding: "14px 16px",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)")}
      onBlur={(e) => (e.target.style.borderColor = hasError ? "#ef4444" : "rgba(255,255,255,0.1)")}
    />
  );
}

function getStrength(p) {
  const c = {
    length: p.length >= 8,
    uppercase: /[A-Z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
    long: p.length >= 16,
  };
  const score = Object.values(c).filter(Boolean).length;
  return {
    score,
    label: ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][score] || "",
    color:
      ["rgba(255,255,255,0.1)", "#ef4444", "#f97316", "#eab308", "#22c55e", "#a855f7"][score] ||
      "rgba(255,255,255,0.1)",
    checks: c,
  };
}

function PasswordStrength({password}) {
  if (!password) return null;
  const {score, label, color, checks} = getStrength(password);
  const criteria = [
    {key: "length", text: "At least 8 characters", met: checks.length},
    {key: "upper", text: "At least 1 uppercase letter", met: checks.uppercase},
    {key: "number", text: "At least 1 number", met: checks.number},
    {key: "special", text: "At least 1 special character", met: checks.special},
    {key: "long", text: "High complexity (16+ chars)", met: checks.long, optional: true},
  ];
  return (
    <motion.div
      initial={{opacity: 0, y: -6}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.25}}
      style={{marginTop: -4}}>
      <div style={{display: "flex", gap: 4, marginBottom: 8}}>
        {Array.from({length: 5}).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 99,
              background: i < score ? color : "rgba(255,255,255,0.08)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      {label && (
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            color,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}>
          {label}
        </p>
      )}
      <div style={{display: "flex", flexDirection: "column", gap: 3}}>
        {criteria.map((c) => (
          <div key={c.key} style={{display: "flex", alignItems: "center", gap: 6}}>
            {c.met ? (
              <svg
                width="10"
                height="10"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg
                width="10"
                height="10"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2.5"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span
              style={{
                fontSize: 10,
                color: c.met
                  ? "#22c55e"
                  : c.optional
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.4)",
              }}>
              {c.text}
              {c.optional ? " (optional)" : ""}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const accountTypes = [
  {
    value: "user",
    label: "User Account",
    desc: "Shop, buy and build your wishlist",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    value: "brand",
    label: "Brand Account",
    desc: "List, sell and grow your brand",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
];

function AccountTypePicker({value, onChange}) {
  const [open, setOpen] = useState(false);
  const selected = accountTypes.find((a) => a.value === value) || accountTypes[0];
  return (
    <div style={{position: "relative"}}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 8,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}>
        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          <span style={{color: "#ef4444"}}>{selected.icon}</span>
          <div style={{textAlign: "left"}}>
            <p style={{color: "#fff", fontSize: 13, margin: 0}}>{selected.label}</p>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>{selected.desc}</p>
          </div>
        </div>
        <motion.svg
          animate={{rotate: open ? 180 : 0}}
          transition={{duration: 0.2}}
          width="14"
          height="14"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2.5"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{opacity: 0, y: -6, scaleY: 0.92}}
            animate={{opacity: 1, y: 0, scaleY: 1}}
            exit={{opacity: 0, y: -6, scaleY: 0.92}}
            transition={{duration: 0.18}}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              overflow: "hidden",
              zIndex: 50,
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              transformOrigin: "top",
            }}>
            {accountTypes.map((type, i) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  onChange(type.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: type.value === value ? "rgba(239,68,68,0.08)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderBottom:
                    i < accountTypes.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (type.value !== value)
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (type.value !== value) e.currentTarget.style.background = "transparent";
                }}>
                <span style={{color: type.value === value ? "#ef4444" : "rgba(255,255,255,0.4)"}}>
                  {type.icon}
                </span>
                <div style={{textAlign: "left"}}>
                  <p
                    style={{
                      color: type.value === value ? "#ef4444" : "#fff",
                      fontSize: 13,
                      margin: 0,
                      fontWeight: 600,
                    }}>
                    {type.label}
                  </p>
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
                    {type.desc}
                  </p>
                </div>
                {type.value === value && (
                  <svg
                    style={{marginLeft: "auto"}}
                    width="14"
                    height="14"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EyeBtn({show, onToggle}) {
  return (
    <button
      onClick={onToggle}
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
        {show ? (
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
  );
}

function SocialRow() {
  return (
    <>
      <div style={{display: "flex", alignItems: "center", gap: 12}}>
        <div style={{flex: 1, height: 1, background: "rgba(255,255,255,0.08)"}} />
        <span style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>or continue with</span>
        <div style={{flex: 1, height: 1, background: "rgba(255,255,255,0.08)"}} />
      </div>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
        {[
          {label: "Google", icon: <GoogleIcon />},
          {
            label: "Apple",
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            ),
          },
        ].map((s) => (
          <button
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: 11,
              cursor: "pointer",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ── FORM SCREENS ──────────────────────────────────────────────────────────────

const fieldVariants = {
  hidden: {opacity: 0, y: 16},
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {delay: i * 0.06, duration: 0.3, ease: "easeOut"},
  }),
};

function AnimatedField({children, index}) {
  return (
    <motion.div custom={index} variants={fieldVariants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}

function SignupForm({onVerifyNeeded, onSwitchToLogin}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    brandName: "",
  });
  const [accountType, setAccountType] = useState("user");
  const [focused, setFocused] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const isBrand = accountType === "brand";

  const handleSubmit = async () => {
    setError("");
    setFieldErrors({});
    if (!agree) {
      setError("You must agree to the Terms & Privacy Policy to continue.");
      return;
    }
    if (isBrand && !form.brandName.trim()) {
      setFieldErrors({brand_name: "Brand name is required"});
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/send-verification`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email: form.email, first_name: form.firstName}),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message?.includes("already exists"))
          setFieldErrors({email: "This email is already registered. Please sign in."});
        setError(data.message || "Something went wrong.");
        return;
      }
      onVerifyNeeded({
        email: form.email,
        firstName: form.firstName,
        formData: {
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
          account_type: accountType,
          ...(isBrand && {brand_name: form.brandName}),
        },
      });
    } catch {
      setError("Cannot reach the server. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="signup-form"
      initial={{opacity: 0, x: -40}}
      animate={{opacity: 1, x: 0}}
      exit={{opacity: 0, x: -40}}
      transition={{duration: 0.38, ease: [0.32, 0, 0.12, 1]}}
      style={{width: "100%", maxWidth: 400}}>
      <AnimatedField index={0}>
        <div style={{marginBottom: 26}} className="auth-header">
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}>
            Welcome to BLVCKMRKT
          </p>
          <h1
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "2.4rem",
              color: "#fff",
              letterSpacing: "0.05em",
              lineHeight: 1.1,
              marginBottom: 8,
            }}>
            CREATE YOUR <span style={{color: "#ef4444"}}>ACCOUNT</span>
          </h1>
          <p style={{color: "rgba(255,255,255,0.35)", fontSize: 12}}>
            Join thousands of buyers and verified sellers.
          </p>
        </div>
      </AnimatedField>
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        <AnimatePresence>{error && <ErrBanner message={error} />}</AnimatePresence>
        <AnimatedField index={1}>
          <AccountTypePicker
            value={accountType}
            onChange={(v) => {
              setAccountType(v);
              if (v !== "brand") setForm((f) => ({...f, brandName: ""}));
              setFieldErrors({});
            }}
          />
        </AnimatedField>
        <AnimatedField index={2}>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            <Field error={fieldErrors.first_name}>
              <input
                type="text"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
                onFocus={() => setFocused("fn")}
                onBlur={() => setFocused(null)}
                style={inp(focused, "fn", fieldErrors.first_name)}
              />
            </Field>
            <Field error={fieldErrors.last_name}>
              <input
                type="text"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
                onFocus={() => setFocused("ln")}
                onBlur={() => setFocused(null)}
                style={inp(focused, "ln", fieldErrors.last_name)}
              />
            </Field>
          </div>
        </AnimatedField>
        <AnimatePresence>
          {isBrand && (
            <motion.div
              key="bname"
              initial={{opacity: 0, height: 0}}
              animate={{opacity: 1, height: "auto"}}
              exit={{opacity: 0, height: 0}}
              transition={{duration: 0.22}}
              style={{overflow: "hidden"}}>
              <Field error={fieldErrors.brand_name}>
                <div style={{position: "relative"}}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#ef4444",
                      pointerEvents: "none",
                      display: "flex",
                    }}>
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Brand name (e.g. Corteiz, Palace)"
                    value={form.brandName}
                    onChange={(e) => setForm({...form, brandName: e.target.value})}
                    onFocus={() => setFocused("bn")}
                    onBlur={() => setFocused(null)}
                    style={{...inp(focused, "bn", fieldErrors.brand_name), paddingLeft: 38}}
                  />
                </div>
              </Field>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatedField index={3}>
          <Field error={fieldErrors.email}>
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              onFocus={() => setFocused("em")}
              onBlur={() => setFocused(null)}
              style={inp(focused, "em", fieldErrors.email)}
            />
          </Field>
        </AnimatedField>
        <AnimatedField index={4}>
          <Field error={fieldErrors.password}>
            <div style={{position: "relative"}}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Create a password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                onFocus={() => setFocused("pw")}
                onBlur={() => setFocused(null)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{...inp(focused, "pw", fieldErrors.password), paddingRight: 44}}
              />
              <EyeBtn show={showPass} onToggle={() => setShowPass(!showPass)} />
            </div>
          </Field>
        </AnimatedField>
        <PasswordStrength password={form.password} />
        <AnimatedField index={5}>
          <label style={{display: "flex", alignItems: "center", gap: 10, cursor: "pointer"}}>
            <Checkbox checked={agree} onChange={() => setAgree(!agree)} />
            <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>
              I agree to the{" "}
              <a href="/terms" style={{color: "#ef4444", textDecoration: "none"}}>
                Terms
              </a>{" "}
              &amp;{" "}
              <a href="/privacy" style={{color: "#ef4444", textDecoration: "none"}}>
                Privacy Policy
              </a>
            </span>
          </label>
        </AnimatedField>
        <AnimatedField index={6}>
          <SubmitBtn
            loading={loading}
            label="Continue →"
            loadingLabel="Sending Code..."
            onClick={handleSubmit}
          />
        </AnimatedField>
        {/* <AnimatedField index={7}>
          <SocialRow />
        </AnimatedField> */}
        <AnimatedField index={8}>
          <div
            className="auth-mobile-switch"
            style={{
              marginTop: 8,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}>
            <p style={{color: "rgba(255,255,255,0.38)", fontSize: 13, margin: "0 0 10px 0"}}>
              Already have an account?
            </p>
            <button
              onClick={onSwitchToLogin}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                borderRadius: 8,
                padding: "12px",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ef4444";
                e.currentTarget.style.borderColor = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              }}>
              Login to your account
            </button>
          </div>
        </AnimatedField>
      </div>
    </motion.div>
  );
}

function SignupVerifyScreen({email, firstName, formData, onBack, onVerified}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [resendKey, setResendKey] = useState(0);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = async () => {
    if (expired) {
      setError("Your code has expired. Request a new one.");
      return;
    }
    if (!code.match(/^\d{6}$/)) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({...formData, verification_code: code}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errors?.verification_code || data.message || "Invalid or expired code.");
        return;
      }
      onVerified(data);
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setExpired(false);
    setResent(false);
    setCode("");
    try {
      await fetch(`${API}/auth/send-verification`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, first_name: firstName}),
      });
      setResendKey((k) => k + 1);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch {
      setError("Could not resend — check your connection.");
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      key="signup-verify"
      initial={{opacity: 0, x: 40}}
      animate={{opacity: 1, x: 0}}
      exit={{opacity: 0, x: 40}}
      transition={{duration: 0.32}}
      style={{width: "100%", maxWidth: 400}}>
      <p
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
        Email Verification
      </p>
      <h1
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "2.2rem",
          color: "#fff",
          letterSpacing: "0.04em",
          lineHeight: 1,
          marginBottom: 10,
        }}>
        CHECK YOUR <span style={{color: "#ef4444"}}>INBOX</span>
      </h1>
      <p style={{color: "rgba(255,255,255,0.38)", fontSize: 12, lineHeight: 1.7, marginBottom: 16}}>
        We sent a 6-digit code to <strong style={{color: "#fff"}}>{email}</strong>. Enter it below
        to finish creating your account.
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.18)",
          borderRadius: 8,
          padding: "9px 14px",
          marginBottom: 16,
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
        <span style={{color: "rgba(255,255,255,0.45)", fontSize: 11}}>
          Code sent to <strong style={{color: "#fff"}}>{email}</strong>
        </span>
      </div>
      <OTPCountdown resetKey={resendKey} onExpire={() => setExpired(true)} />
      <div style={{display: "flex", flexDirection: "column", gap: 10}}>
        <AnimatePresence>{error && <ErrBanner message={error} />}</AnimatePresence>
        <AnimatePresence>
          {resent && <OkBanner message="New code sent! Check your inbox." />}
        </AnimatePresence>
        <div>
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
            6-Digit Verification Code
          </label>
          <OTPInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setError("");
            }}
            hasError={!!error}
          />
        </div>
        <SubmitBtn
          loading={loading}
          disabled={expired}
          label="Verify & Create Account →"
          loadingLabel="Verifying..."
          onClick={handleVerify}
        />
        <p style={{textAlign: "center", color: "rgba(255,255,255,0.28)", fontSize: 12}}>
          Didn't get it? Check spam, or{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 700,
              cursor: resending ? "not-allowed" : "pointer",
              padding: 0,
            }}>
            {resending ? "Sending…" : "send a new code"}
          </button>
        </p>
      </div>
    </motion.div>
  );
}

function SignupSuccessScreen({user}) {
  return (
    <motion.div
      initial={{opacity: 0, scale: 0.96}}
      animate={{opacity: 1, scale: 1}}
      transition={{duration: 0.4}}
      style={{
        width: "100%",
        maxWidth: 400,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <div style={{position: "relative", marginBottom: 32}}>
        <motion.div
          animate={{scale: [1, 1.18, 1], opacity: [0.35, 0.08, 0.35]}}
          transition={{duration: 2.2, repeat: Infinity}}
          style={{
            position: "absolute",
            inset: -14,
            borderRadius: "50%",
            border: "1px solid #22c55e",
          }}
        />
        <motion.div
          animate={{scale: [1, 1.08, 1], opacity: [0.5, 0.15, 0.5]}}
          transition={{duration: 2.2, repeat: Infinity, delay: 0.4}}
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: "1px solid rgba(34,197,94,0.4)",
          }}
        />
        <motion.div
          initial={{scale: 0}}
          animate={{scale: 1}}
          transition={{type: "spring", stiffness: 260, damping: 20, delay: 0.15}}
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.12)",
            border: "2px solid rgba(34,197,94,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <svg
            width="40"
            height="40"
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
              transition={{duration: 0.6, delay: 0.35}}
            />
          </svg>
        </motion.div>
      </div>
      <motion.div
        initial={{opacity: 0, y: 16}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.4}}
        style={{width: "100%"}}>
        <p
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
          Account Created
        </p>
        <h1
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "2.6rem",
            color: "#fff",
            letterSpacing: "0.05em",
            lineHeight: 1,
            marginBottom: 14,
          }}>
          WELCOME TO <span style={{color: "#ef4444"}}>BLVCKMRKT</span>
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 13,
            lineHeight: 1.75,
            marginBottom: 28,
          }}>
          Your account is ready, <strong style={{color: "#fff"}}>{user?.first_name}</strong>.<br />
          {user?.account_type === "brand"
            ? "Now pick a plan and set your brand live."
            : "Taking you straight to your account."}
        </p>
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}>
            <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
              {user?.account_type === "brand"
                ? "Taking you to plans…"
                : "Taking you to your account…"}
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2.5"
              style={{animation: "spin 1s linear infinite"}}>
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                strokeLinecap="round"
              />
            </svg>
          </div>
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
              transition={{duration: REDIRECT_DELAY / 1000, ease: "linear"}}
              style={{
                height: "100%",
                background: "linear-gradient(90deg,#ef4444,#ff6b6b)",
                borderRadius: 99,
              }}
            />
          </div>
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
          {(user?.account_type === "brand"
            ? [
                "Choose a plan for your brand",
                "Set up your brand profile",
                "List products and start selling",
              ]
            : ["Browse verified streetwear drops", "Build your wishlist", "Checkout in seconds"]
          ).map((hint, i) => (
            <motion.div
              key={i}
              initial={{opacity: 0, x: -12}}
              animate={{opacity: 1, x: 0}}
              transition={{delay: 0.6 + i * 0.15}}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "10px 14px",
                textAlign: "left",
              }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ef4444",
                  flexShrink: 0,
                }}
              />
              <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>{hint}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

const CREDS_KEY = "blvck_remembered";

function LoginForm({onSwitchToSignup, onForgotPassword, onLoginSuccess}) {
  const {login} = useAuth();
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(CREDS_KEY));
    } catch {
      return null;
    }
  })();
  const [form, setForm] = useState({email: "", password: ""});
  const [focused, setFocused] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (saved) {
      const t1 = setTimeout(() => setForm({email: saved.email || "", password: ""}), 120);
      const t2 = setTimeout(
        () => setForm({email: saved.email || "", password: saved.password || ""}),
        320,
      );
      const t3 = setTimeout(() => setRemember(true), 480);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, []);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email: form.email, password: form.password}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }
      if (remember)
        localStorage.setItem(
          CREDS_KEY,
          JSON.stringify({email: form.email, password: form.password}),
        );
      else localStorage.removeItem(CREDS_KEY);
      login(data.data.token, data.data.user, remember);
      onLoginSuccess(data.data.dashboard || "/");
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="login-form"
      initial={{opacity: 0, x: 40}}
      animate={{opacity: 1, x: 0}}
      exit={{opacity: 0, x: 40}}
      transition={{duration: 0.38, ease: [0.32, 0, 0.12, 1]}}
      style={{width: "100%", maxWidth: 400}}>
      <AnimatedField index={0}>
        <div style={{marginBottom: 26}} className="auth-header">
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}>
            Welcome back
          </p>
          <h1
            style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "2.4rem",
              color: "#fff",
              letterSpacing: "0.05em",
              lineHeight: 1.1,
              marginBottom: 8,
            }}>
            SIGN BACK <span style={{color: "#ef4444"}}>IN</span>
          </h1>
          <p style={{color: "rgba(255,255,255,0.35)", fontSize: 12}}>
            Access your orders, wishlist and seller dashboard.
          </p>
        </div>
      </AnimatedField>
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        <AnimatePresence>{error && <ErrBanner message={error} />}</AnimatePresence>
        <AnimatedField index={1}>
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            onFocus={() => setFocused("em")}
            onBlur={() => setFocused(null)}
            style={inp(focused, "em", false)}
          />
        </AnimatedField>
        <AnimatedField index={2}>
          <div style={{position: "relative"}}>
            <input
              type={showPass ? "text" : "password"}
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              onFocus={() => setFocused("pw")}
              onBlur={() => setFocused(null)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{...inp(focused, "pw", false), paddingRight: 44}}
            />
            <EyeBtn show={showPass} onToggle={() => setShowPass(!showPass)} />
          </div>
        </AnimatedField>

        {/* ── REMEMBER ME — sick animation ── */}
        <AnimatedField index={3}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
            <motion.label
              style={{display: "flex", alignItems: "center", gap: 8, cursor: "pointer"}}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.3, duration: 0.35, ease: [0.22, 1, 0.36, 1]}}>
              <Checkbox
                checked={remember}
                onChange={() => {
                  const next = !remember;
                  setRemember(next);
                  if (!next) localStorage.removeItem(CREDS_KEY);
                }}
              />
              <motion.span
                initial={{opacity: 0, x: -14, filter: "blur(6px)"}}
                animate={{opacity: 1, x: 0, filter: "blur(0px)"}}
                transition={{delay: 0.42, duration: 0.45, ease: [0.22, 1, 0.36, 1]}}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                }}>
                <motion.span
                  animate={
                    remember
                      ? {
                          color: "#ef4444",
                          textShadow: "0 0 12px rgba(239,68,68,0.55)",
                        }
                      : {
                          color: "rgba(255,255,255,0.4)",
                          textShadow: "0 0 0px rgba(239,68,68,0)",
                        }
                  }
                  transition={{duration: 0.28}}>
                  Remember me
                </motion.span>
                <AnimatePresence>
                  {remember && (
                    <motion.span
                      key="lock-badge"
                      initial={{opacity: 0, scale: 0, rotate: -45, x: -4}}
                      animate={{opacity: 1, scale: 1, rotate: 0, x: 0}}
                      exit={{opacity: 0, scale: 0, rotate: 45, x: -4}}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 22,
                      }}
                      style={{display: "inline-flex", alignItems: "center"}}>
                      <svg
                        width="11"
                        height="11"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2.2"
                        viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {remember && (
                    <motion.span
                      key="saved-pill"
                      initial={{opacity: 0, scale: 0.6, x: -6}}
                      animate={{opacity: 1, scale: 1, x: 0}}
                      exit={{opacity: 0, scale: 0.6, x: -6}}
                      transition={{
                        type: "spring",
                        stiffness: 460,
                        damping: 20,
                        delay: 0.08,
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        background: "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 99,
                        padding: "1px 6px",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: "#ef4444",
                        textTransform: "uppercase",
                      }}>
                      saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
            </motion.label>
            <button
              onClick={onForgotPassword}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}>
              Forgot password?
            </button>
          </div>
        </AnimatedField>

        <AnimatedField index={4}>
          <SubmitBtn
            loading={loading}
            label="Login →"
            loadingLabel="Signing In..."
            onClick={handleSubmit}
          />
        </AnimatedField>
        {/* <AnimatedField index={5}>
          <SocialRow />
        </AnimatedField> */}
        <AnimatedField index={6}>
          <div
            className="auth-mobile-switch"
            style={{
              marginTop: 8,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}>
            <p style={{color: "rgba(255,255,255,0.38)", fontSize: 13, margin: "0 0 10px 0"}}>
              Don't have an account yet?
            </p>
            <button
              onClick={onSwitchToSignup}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                borderRadius: 8,
                padding: "12px",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ef4444";
                e.currentTarget.style.borderColor = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              }}>
              Create an account
            </button>
          </div>
        </AnimatedField>
      </div>
    </motion.div>
  );
}

function ForgotEmailScreen({onBack, onCodeSent}) {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
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
      onCodeSent({email, devOtp: data.data?.dev_otp});
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="forgot-email"
      initial={{opacity: 0, x: 40}}
      animate={{opacity: 1, x: 0}}
      exit={{opacity: 0, x: 40}}
      transition={{duration: 0.32}}
      style={{width: "100%", maxWidth: 400}}>
      <p
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
        Forgot Password
      </p>
      <h1
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "2.2rem",
          color: "#fff",
          letterSpacing: "0.04em",
          lineHeight: 1,
          marginBottom: 10,
        }}>
        RESET YOUR <span style={{color: "#ef4444"}}>PASSWORD</span>
      </h1>
      <p style={{color: "rgba(255,255,255,0.38)", fontSize: 12, lineHeight: 1.7, marginBottom: 22}}>
        Enter the email address linked to your account and we'll send you a 6-digit reset code.
      </p>
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        <AnimatePresence>{error && <ErrBanner message={error} />}</AnimatePresence>
        <div>
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
            placeholder="yourname@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            style={inp(focused ? "em" : null, "em", !!error)}
          />
        </div>
        <SubmitBtn
          loading={loading}
          label="Send Reset Code →"
          loadingLabel="Sending..."
          onClick={handleSend}
        />
        <p style={{textAlign: "center", color: "rgba(255,255,255,0.28)", fontSize: 12}}>
          Remembered it?{" "}
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
            }}>
            Back to login
          </button>
        </p>
      </div>
    </motion.div>
  );
}

function ForgotVerifyScreen({email, devOtp, onBack, onReset}) {
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [resendKey, setResendKey] = useState(0);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (devOtp)
      console.log(
        `%c[DEV] Reset OTP → ${devOtp}`,
        "color:#ef4444;font-size:14px;font-weight:bold;",
      );
  }, [devOtp]);

  const handleReset = async () => {
    if (expired) {
      setError("Your code has expired. Request a new one.");
      return;
    }
    if (!code.match(/^\d{6}$/)) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    if (pass.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, code, new_password: pass}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid or expired code.");
        return;
      }
      onReset(data);
    } catch {
      setError("Cannot reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setExpired(false);
    setResent(false);
    setCode("");
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email}),
      });
      setResendKey((k) => k + 1);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch {
      setError("Could not resend.");
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      key="forgot-verify"
      initial={{opacity: 0, x: 40}}
      animate={{opacity: 1, x: 0}}
      exit={{opacity: 0, x: 40}}
      transition={{duration: 0.32}}
      style={{width: "100%", maxWidth: 400}}>
      <p
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
        Reset Password
      </p>
      <h1
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "2.2rem",
          color: "#fff",
          letterSpacing: "0.04em",
          lineHeight: 1,
          marginBottom: 10,
        }}>
        CHECK YOUR <span style={{color: "#ef4444"}}>INBOX</span>
      </h1>
      <p style={{color: "rgba(255,255,255,0.38)", fontSize: 12, lineHeight: 1.7, marginBottom: 14}}>
        We sent a reset code to <strong style={{color: "#fff"}}>{email}</strong>. Enter it below
        with your new password.
      </p>
      <OTPCountdown resetKey={resendKey} onExpire={() => setExpired(true)} />
      <div style={{display: "flex", flexDirection: "column", gap: 12}}>
        <AnimatePresence>{error && <ErrBanner message={error} />}</AnimatePresence>
        <AnimatePresence>
          {resent && <OkBanner message="New code sent! Check your inbox." />}
        </AnimatePresence>
        <div>
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
            6-Digit Reset Code
          </label>
          <OTPInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setError("");
            }}
            hasError={!!error}
          />
        </div>
        <div>
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
              placeholder="New password (min. 8 characters)"
              value={pass}
              onChange={(e) => {
                setPass(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleReset()}
              style={{...inp(false, null, false), paddingRight: 44}}
            />
            <EyeBtn show={showPass} onToggle={() => setShowPass(!showPass)} />
          </div>
          <div style={{marginTop: 8}}>
            <PasswordStrength password={pass} />
          </div>
        </div>
        <SubmitBtn
          loading={loading}
          disabled={expired}
          label="Reset Password →"
          loadingLabel="Resetting..."
          onClick={handleReset}
        />
        <p style={{textAlign: "center", color: "rgba(255,255,255,0.28)", fontSize: 12}}>
          Didn't get it? Check spam, or{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 700,
              cursor: resending ? "not-allowed" : "pointer",
              padding: 0,
            }}>
            {resending ? "Sending…" : "send a new code"}
          </button>
        </p>
      </div>
    </motion.div>
  );
}

function ForgotSuccessScreen({onBackToLogin}) {
  useEffect(() => {
    const t = setTimeout(onBackToLogin, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      key="forgot-success"
      initial={{opacity: 0, scale: 0.96}}
      animate={{opacity: 1, scale: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.4}}
      style={{
        width: "100%",
        maxWidth: 400,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
      <div style={{position: "relative", marginBottom: 28}}>
        <motion.div
          animate={{scale: [1, 1.18, 1], opacity: [0.35, 0.08, 0.35]}}
          transition={{duration: 2.2, repeat: Infinity}}
          style={{
            position: "absolute",
            inset: -14,
            borderRadius: "50%",
            border: "1px solid #22c55e",
          }}
        />
        <motion.div
          initial={{scale: 0}}
          animate={{scale: 1}}
          transition={{type: "spring", stiffness: 260, damping: 20, delay: 0.1}}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.12)",
            border: "2px solid rgba(34,197,94,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <svg
            width="36"
            height="36"
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
              transition={{duration: 0.6, delay: 0.3}}
            />
          </svg>
        </motion.div>
      </div>
      <p
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}>
        All Done
      </p>
      <h1
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "2.4rem",
          color: "#fff",
          letterSpacing: "0.04em",
          lineHeight: 1,
          marginBottom: 12,
        }}>
        PASSWORD <span style={{color: "#ef4444"}}>RESET!</span>
      </h1>
      <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7, marginBottom: 28}}>
        Your password has been updated successfully.
        <br />
        Taking you back to login in a moment…
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
          transition={{duration: 4, ease: "linear"}}
          style={{
            height: "100%",
            background: "linear-gradient(90deg,#ef4444,#ff6b6b)",
            borderRadius: 99,
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Image panels ───────────────────────────────────────────────────────────────

function ImagePanelContent({onSwitchLabel, onSwitch, tagline, title, accent, desc}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 44,
        zIndex: 2,
      }}>
      <span
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "1.5rem",
          color: "#fff",
          letterSpacing: "0.1em",
        }}>
        BLVCK<span style={{color: "#ef4444"}}>MRKT</span>
      </span>
      <div>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
          {tagline}
        </p>
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "clamp(2rem,3.2vw,2.8rem)",
            color: "#fff",
            letterSpacing: "0.04em",
            lineHeight: 1.05,
            marginBottom: 14,
          }}
          dangerouslySetInnerHTML={{__html: title}}
        />
        <p style={{color: "rgba(255,255,255,0.38)", fontSize: 12, lineHeight: 1.7, maxWidth: 256}}>
          {desc}
        </p>
      </div>
      <div
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: "20px 24px",
        }}>
        <p style={{color: "rgba(255,255,255,0.52)", fontSize: 13, marginBottom: 14}}>
          {onSwitchLabel}
        </p>
        <button
          onClick={onSwitch}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff",
            borderRadius: 8,
            padding: "12px",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.22s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ef4444";
            e.currentTarget.style.borderColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
          }}>
          {onSwitchLabel.toLowerCase().includes("don't")
            ? "Create an account"
            : "Login to your account"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — Panel swap animation
// ─────────────────────────────────────────────────────────────────────────────
export default function AuthPage({defaultMode = "signup"}) {
  const navigate = useNavigate();
  const {login} = useAuth();
  const [mode, setMode] = useState(defaultMode);
  const [screen, setScreen] = useState(mode === "signup" ? "signup-form" : "login-form");
  const [signupPending, setSignupPending] = useState(null);
  const [newUser, setNewUser] = useState(null);
  const [resetPending, setResetPending] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  const isSignup = mode === "signup";

  const switchToLogin = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setMode("login");
      setScreen("login-form");
      setTransitioning(false);
    }, 420);
  };

  const switchToSignup = () => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setMode("signup");
      setScreen("signup-form");
      setTransitioning(false);
    }, 420);
  };

  const SWAP_DURATION = 0.55;
  const SWAP_EASE = [0.76, 0, 0.24, 1];

  return (
    <div className="auth-root">
      <style>{`
        .auth-root { min-height:100vh; background:#050505; display:flex; align-items:center; justify-content:center; padding:20px; font-family:system-ui,sans-serif; }
        .auth-wrap { width:100%; max-width:980px; min-height:620px; background:#0d0d0d; border:1px solid rgba(255,255,255,0.08); border-radius:24px; overflow:hidden; display:flex; position:relative; }
        .auth-content-side { flex:1; display:flex; align-items:center; justify-content:center; padding:52px 48px; box-sizing:border-box; background:#0d0d0d; min-width:0; overflow:hidden; }
        .auth-image-side   { flex:1; position:relative; min-width:0; overflow:hidden; }
        .auth-mobile-switch { display:none; }
        @media (min-width:681px) { .auth-mobile-switch { display:none !important; } }
        @media (max-width:680px) {
          .auth-root { padding:12px; align-items:flex-start; padding-top:60px; }
          .auth-wrap { 
            min-height:auto; 
            height:auto; 
            max-height:none;
            border-radius:16px; 
            overflow-y:visible !important; 
          }
          .auth-image-side { display:none !important; }
          .auth-content-side { 
            width:100% !important; 
            left:0 !important; 
            position:relative !important; 
            top:auto !important; 
            bottom:auto !important; 
            height:auto !important; 
            padding:32px 20px 32px; 
            overflow:visible !important; 
          }
          .auth-mobile-switch { display:block !important; }
          .auth-header h1 { 
            fontSize: 1.8rem !important; 
            lineHeight: 1.15 !important;
          }
        }
        @media (max-width:380px) {
          .auth-content-side { padding:24px 16px 24px !important; }
          .auth-header h1 { fontSize: 1.6rem !important; }
        }
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.5;} }
      `}</style>

      {/* Back button */}
      <AnimatePresence mode="wait">
        {(screen === "signup-form" || screen === "login-form") && (
          <motion.div
            key="back-site"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.18}}
            style={{position: "fixed", top: 24, left: 24, zIndex: 200}}>
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
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
              Back to site
            </Link>
          </motion.div>
        )}
        {screen === "signup-verify" && (
          <motion.div
            key="back-signup"
            initial={{opacity: 0, x: -8}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -8}}
            transition={{duration: 0.22}}
            style={{position: "fixed", top: 24, left: 24, zIndex: 200}}>
            <button
              onClick={() => setScreen("signup-form")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
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
              Back to signup
            </button>
          </motion.div>
        )}
        {screen === "forgot-email" && (
          <motion.div
            key="back-login"
            initial={{opacity: 0, x: -8}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -8}}
            transition={{duration: 0.22}}
            style={{position: "fixed", top: 24, left: 24, zIndex: 200}}>
            <button
              onClick={() => setScreen("login-form")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
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
            </button>
          </motion.div>
        )}
        {screen === "forgot-verify" && (
          <motion.div
            key="back-forgot"
            initial={{opacity: 0, x: -8}}
            animate={{opacity: 1, x: 0}}
            exit={{opacity: 0, x: -8}}
            transition={{duration: 0.22}}
            style={{position: "fixed", top: 24, left: 24, zIndex: 200}}>
            <button
              onClick={() => setScreen("forgot-email")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
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
              Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="auth-wrap">
        {/* ── IMAGE PANEL ── */}
        <motion.div
          className="auth-image-side"
          style={{position: "absolute", top: 0, bottom: 0, width: "50%", overflow: "hidden"}}
          animate={{
            left: isSignup ? "50%" : "0%",
          }}
          transition={{duration: SWAP_DURATION, ease: SWAP_EASE}}>
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignup ? "signup-img" : "login-img"}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.4}}
              style={{position: "absolute", inset: 0}}>
              <img
                src={
                  isSignup
                    ? "https://i.pinimg.com/736x/bf/62/99/bf6299a7aa722e9ff9b4f6132310fdde.jpg"
                    : "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=900&q=80"
                }
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "grayscale(15%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom,rgba(0,0,0,0.22) 0%,rgba(0,0,0,0.82) 100%)",
                }}
              />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isSignup ? (
              <motion.div
                key="signup-panel-text"
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -12}}
                transition={{duration: 0.32, delay: 0.18}}
                style={{position: "absolute", inset: 0, zIndex: 3}}>
                <ImagePanelContent
                  tagline="Join the community"
                  title={
                    "AUTHENTIC<br/>STREETWEAR<br/><span style='color:#ef4444'>STARTS HERE.</span>"
                  }
                  desc="Buy verified pieces, sell your heat, discover brands you actually care about."
                  onSwitchLabel="Already have an account?"
                  onSwitch={switchToLogin}
                />
              </motion.div>
            ) : (
              <motion.div
                key="login-panel-text"
                initial={{opacity: 0, y: 12}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -12}}
                transition={{duration: 0.32, delay: 0.18}}
                style={{position: "absolute", inset: 0, zIndex: 3}}>
                <ImagePanelContent
                  tagline="Welcome back"
                  title={"THE CULTURE<br/>MISSED<br/><span style='color:#ef4444'>YOU.</span>"}
                  desc="Your orders, wishlist, and seller dashboard are waiting. Let's get back to it."
                  onSwitchLabel="Don't have an account yet?"
                  onSwitch={switchToSignup}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── FORM PANEL ── */}
        <motion.div
          className="auth-content-side"
          style={{position: "absolute", top: 0, bottom: 0, width: "50%", overflow: "hidden"}}
          animate={{
            left: isSignup ? "0%" : "50%",
          }}
          transition={{duration: SWAP_DURATION, ease: SWAP_EASE}}>
          <AnimatePresence mode="wait">
            {screen === "signup-form" && (
              <SignupForm
                key="signup-form"
                onSwitchToLogin={switchToLogin}
                onVerifyNeeded={(payload) => {
                  setSignupPending(payload);
                  setScreen("signup-verify");
                }}
              />
            )}
            {screen === "signup-verify" && signupPending && (
              <SignupVerifyScreen
                key="signup-verify"
                email={signupPending.email}
                firstName={signupPending.firstName}
                formData={signupPending.formData}
                onBack={() => setScreen("signup-form")}
onVerified={(data) => {
  login(data.data.token, data.data.user);
  setNewUser(data.data.user);
  setScreen("signup-success");

  // ✅ Save brand name to localStorage right after signup
  if (data.data.user?.account_type === "brand" && data.data.brand_name) {
    localStorage.setItem("brand_name", data.data.brand_name);
  }

  const dest =
    data.data.user?.account_type === "brand" ? "/brand-partnership-agreement" : "/dashboard/buyer";
  setTimeout(() => navigate(dest), REDIRECT_DELAY);
}}
              />
            )}
            {screen === "signup-success" && (
              <SignupSuccessScreen key="signup-success" user={newUser} />
            )}
            {screen === "login-form" && (
              <LoginForm
                key="login-form"
                onSwitchToSignup={switchToSignup}
                onForgotPassword={() => setScreen("forgot-email")}
                onLoginSuccess={(dest) => navigate(dest)}
              />
            )}
            {screen === "forgot-email" && (
              <ForgotEmailScreen
                key="forgot-email"
                onBack={() => setScreen("login-form")}
                onCodeSent={(payload) => {
                  setResetPending(payload);
                  setScreen("forgot-verify");
                }}
              />
            )}
            {screen === "forgot-verify" && resetPending && (
              <ForgotVerifyScreen
                key="forgot-verify"
                email={resetPending.email}
                devOtp={resetPending.devOtp}
                onBack={() => setScreen("forgot-email")}
                onReset={(data) => {
                  login(data.data.token, data.data.user);
                  setScreen("forgot-success");
                }}
              />
            )}
            {screen === "forgot-success" && (
              <ForgotSuccessScreen
                key="forgot-success"
                onBackToLogin={() => setScreen("login-form")}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
