import {useEffect, useRef, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {motion} from "framer-motion";
import {useCartWishlist, getToken} from "../../components/cartcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

// This is the page Flutterwave/Paystack redirect the customer's tab back to
// once they finish paying on the gateway's hosted checkout (opened in a new
// tab from the checkout page, tagged with ?gateway=flutterwave|paystack).
// It reads the gateway's own query params, asks our backend to verify the
// charge and build the real order, then shows the result. The original
// checkout tab also polls for completion independently (see the pendingTxRef
// effect in checkoutform.jsx), so the order still gets picked up there even
// if this tab is closed before the poll notices.
export default function PaymentCallback() {
  const location = useLocation();
  const {refreshCart} = useCartWishlist();
  const [state, setState] = useState("loading"); // loading | success | error
  const [orderRef, setOrderRef] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React 18 StrictMode double-invoke
    ran.current = true;

    const params = new URLSearchParams(location.search);
    const gateway =
      params.get("gateway") ||
      (params.get("tx_ref") ? "flutterwave" : params.get("reference") ? "paystack" : "");

    const finalize = async () => {
      const token = getToken();
      if (!token) {
        setState("error");
        setErrorMsg("You've been signed out. Please log in, then contact us with your payment reference if it was successful.");
        return;
      }

      let endpoint, body;
      if (gateway === "flutterwave") {
        const txRef = params.get("tx_ref");
        if (!txRef) {
          setState("error");
          setErrorMsg("Missing payment reference from Flutterwave.");
          return;
        }
        endpoint = "/api/user/payments/flutterwave/finalize";
        body = {
          tx_ref: txRef,
          status: params.get("status") || "",
          transaction_id: params.get("transaction_id") || "",
        };
      } else if (gateway === "paystack") {
        const reference = params.get("reference") || params.get("trxref");
        if (!reference) {
          setState("error");
          setErrorMsg("Missing payment reference from Paystack.");
          return;
        }
        endpoint = "/api/user/payments/paystack/finalize";
        body = {reference};
      } else {
        setState("error");
        setErrorMsg("Unrecognized payment gateway.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || json.message || "Payment could not be confirmed");
        }

        setOrderRef(json?.data?.order?.reference || json?.data?.order?.display_id || json?.data?.order_ref || "");
        setState("success");
        refreshCart().catch(() => {});
      } catch (err) {
        setState("error");
        setErrorMsg(err.message || "Payment could not be confirmed automatically.");
      }
    };

    finalize();
  }, [location.search, refreshCart]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
      }}>
      <motion.div
        initial={{opacity: 0, scale: 0.94}}
        animate={{opacity: 1, scale: 1}}
        transition={{duration: 0.5}}
        style={{maxWidth: 540, width: "100%", textAlign: "center"}}>
        {state === "loading" && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 28px",
                borderRadius: "50%",
                border: "2px solid rgba(239,68,68,0.15)",
                borderTop: "2px solid #ef4444",
                animation: "pc-spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes pc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
                color: "#fff",
                letterSpacing: "0.05em",
                marginBottom: 12,
              }}>
              CONFIRMING YOUR PAYMENT…
            </h1>
            <p style={{color: "rgba(255,255,255,0.38)", fontSize: 13}}>
              Please don't close this tab — this will only take a moment.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <motion.div
              initial={{scale: 0}}
              animate={{scale: 1}}
              transition={{type: "spring", stiffness: 260, damping: 20}}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.1)",
                border: "2px solid rgba(34,197,94,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 28px",
              }}>
              <svg width="36" height="36" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}>
              Payment Confirmed
            </p>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
                color: "#fff",
                letterSpacing: "0.05em",
                lineHeight: 1,
                marginBottom: 16,
              }}>
              YOU'RE <span style={{color: "#ef4444"}}>ALL SET!</span>
            </h1>
            <p style={{color: "rgba(255,255,255,0.38)", fontSize: 13, lineHeight: 1.7, marginBottom: 24}}>
              Your order has been placed and is being processed. You can close this tab and return to your checkout
              tab, or continue from here.
            </p>
            {orderRef && (
              <div
                style={{
                  background: "#0d0d0d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "16px 24px",
                  marginBottom: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase"}}>
                  Order Reference
                </span>
                <span style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", color: "#ef4444", letterSpacing: "0.1em"}}>
                  {orderRef}
                </span>
              </div>
            )}
            <div style={{display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap"}}>
              <Link
                to="/shop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "13px 28px",
                  textDecoration: "none",
                  borderRadius: 6,
                }}>
                Continue Shopping →
              </Link>
              <Link
                to="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  padding: "13px 28px",
                  textDecoration: "none",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}>
                Back to Home
              </Link>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: "2px solid rgba(239,68,68,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 28px",
              }}>
              <svg width="32" height="32" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
                color: "#fff",
                letterSpacing: "0.05em",
                marginBottom: 16,
              }}>
              WE COULDN'T CONFIRM THAT
            </h1>
            <p style={{color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.7, marginBottom: 10}}>
              {errorMsg}
            </p>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1.7, marginBottom: 28}}>
              If you were charged, do NOT pay again — contact{" "}
              <a href="mailto:blvckmrkt.market@gmail.com" style={{color: "#ef4444"}}>
                blvckmrkt.market@gmail.com
              </a>{" "}
              with your payment reference and we'll confirm your order manually.
            </p>
            <Link
              to="/checkout"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#ef4444",
                color: "#fff",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                padding: "13px 28px",
                textDecoration: "none",
                borderRadius: 6,
              }}>
              Back to Checkout
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
