import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {AnimatePresence, motion} from "framer-motion";
import {useAuth} from "../pages/Auth/context/authcontext";

const SESSION_FLAG = "blvck_signup_prompt_shown";

// Nudges anonymous visitors to sign up — once per browser session (not
// every reload, not permanently dismissed), per the confirmed product
// decision. Mounted once at the app root, same level as ScrollToTop.
export default function SignupPrompt() {
  const {user, loading} = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [loading, user]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_FLAG, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={dismiss}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}>
          <motion.div
            initial={{opacity: 0, y: 20, scale: 0.96}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 20, scale: 0.96}}
            transition={{duration: 0.25}}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d0d0d",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              maxWidth: 380,
              width: "100%",
              padding: "32px 28px",
              position: "relative",
              textAlign: "center",
            }}>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}>
              ✕
            </button>
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.8rem",
                color: "#fff",
                letterSpacing: "0.04em",
                margin: "0 0 10px",
              }}>
              JOIN THE <span style={{color: "#ef4444"}}>BLVCKMRKT</span>
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}>
              Sign up to track orders, save your wishlist, and get first access to new drops.
            </p>
            <Link
              to="/signup"
              onClick={dismiss}
              style={{
                display: "block",
                background: "#ef4444",
                color: "#fff",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "14px",
                borderRadius: 8,
                textDecoration: "none",
                marginBottom: 10,
              }}>
              Sign Up
            </Link>
            <button
              onClick={dismiss}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 6,
              }}>
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
