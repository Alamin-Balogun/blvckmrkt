import {useEffect, useRef, useState} from "react";
import {Link, useLocation} from "react-router-dom";
import {motion} from "framer-motion";
import {useCartWishlist, getToken} from "../../components/cartcontext";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

const gatewayLabel = (g) =>
  ({flutterwave: "Flutterwave", paystack: "Paystack / Card"}[g] || g || "—");

// A copyable reference row — the customer needs something concrete to quote
// support with, whether this tab ends up showing success, a genuine
// failure, or "couldn't verify" (see the unknown state below).
function CopyRow({label, value, highlight}) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = () => {
    navigator.clipboard?.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
      <span style={{color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase"}}>
        {label}
      </span>
      <button
        type="button"
        onClick={copy}
        title="Copy"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: highlight ? "1.05rem" : "0.95rem",
          color: highlight ? "#ef4444" : "#fff",
          letterSpacing: "0.06em",
        }}>
        {value}
        <svg width="12" height="12" fill="none" stroke={copied ? "#22c55e" : "rgba(255,255,255,0.3)"} strokeWidth="2" viewBox="0 0 24 24">
          {copied ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          )}
        </svg>
      </button>
    </div>
  );
}

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
  const [state, setState] = useState("loading"); // loading | success | error | unknown
  const [orderRef, setOrderRef] = useState("");
  const [orderTotal, setOrderTotal] = useState(null);
  const [orderCurrency, setOrderCurrency] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [gateway, setGateway] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against React 18 StrictMode double-invoke
    ran.current = true;

    const params = new URLSearchParams(location.search);
    const gw =
      params.get("gateway") ||
      (params.get("tx_ref") ? "flutterwave" : params.get("reference") ? "paystack" : "");
    setGateway(gw);

    const finalize = async () => {
      const token = getToken();

      let endpoint, body, ref;
      if (gw === "flutterwave") {
        ref = params.get("tx_ref");
        if (!ref) {
          setState("error");
          setErrorMsg("Missing payment reference from Flutterwave.");
          return;
        }
        endpoint = "/api/user/payments/flutterwave/finalize";
        body = {
          tx_ref: ref,
          status: params.get("status") || "",
          transaction_id: params.get("transaction_id") || "",
        };
      } else if (gw === "paystack") {
        ref = params.get("reference") || params.get("trxref");
        if (!ref) {
          setState("error");
          setErrorMsg("Missing payment reference from Paystack.");
          return;
        }
        endpoint = "/api/user/payments/paystack/finalize";
        body = {reference: ref};
      } else {
        setState("error");
        setErrorMsg("Unrecognized payment gateway.");
        return;
      }
      setPaymentRef(ref);

      // No token in *this* tab doesn't mean the payment failed — the
      // original checkout tab has its own session and polls for completion
      // independently (see pendingTxRef in checkoutform.jsx), so the order
      // may already be confirmed there. We just can't verify it from here,
      // so say that plainly instead of implying something went wrong.
      if (!token) {
        setState("unknown");
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
        setOrderTotal(json?.data?.order?.total ?? null);
        setOrderCurrency(json?.data?.order?.currency ?? "");
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
            <div
              style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "6px 20px",
                marginBottom: 16,
                textAlign: "left",
              }}>
              <CopyRow label="Order Reference" value={orderRef} highlight />
              <CopyRow label="Payment Reference" value={paymentRef} />
              <CopyRow label="Payment Type" value={gatewayLabel(gateway)} />
              {orderTotal != null && (
                <CopyRow label="Amount Paid" value={`${orderCurrency} ${Number(orderTotal).toLocaleString()}`.trim()} />
              )}
            </div>
            <p style={{color: "rgba(255,255,255,0.28)", fontSize: 11, lineHeight: 1.6, marginBottom: 32, maxWidth: 420, marginLeft: "auto", marginRight: "auto"}}>
              Tap any line above to copy it. Save these details somewhere safe in case you ever need
              to contact support about this order.
            </p>
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
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1.7, marginBottom: 20}}>
              If you were charged, do NOT pay again — contact{" "}
              <a href="mailto:blvckmrkt.market@gmail.com" style={{color: "#ef4444"}}>
                blvckmrkt.market@gmail.com
              </a>{" "}
              with your payment reference and we'll confirm your order manually.
            </p>
            {(paymentRef || gateway) && (
              <div
                style={{
                  background: "#0d0d0d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "6px 20px",
                  marginBottom: 28,
                  textAlign: "left",
                }}>
                <CopyRow label="Payment Reference" value={paymentRef} highlight />
                <CopyRow label="Payment Type" value={gatewayLabel(gateway)} />
              </div>
            )}
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

        {state === "unknown" && (
          <>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(234,179,8,0.1)",
                border: "2px solid rgba(234,179,8,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 28px",
              }}>
              <svg width="32" height="32" fill="none" stroke="#eab308" strokeWidth="2.5" viewBox="0 0 24 24">
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
              CAN'T VERIFY FROM THIS TAB
            </h1>
            <p style={{color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.7, marginBottom: 10}}>
              This tab isn't signed in, so it can't confirm your order directly — but that doesn't
              mean anything went wrong. Your original checkout tab checks independently: if it
              already showed "You're All Set!", your order is confirmed and no action is needed.
            </p>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, lineHeight: 1.7, marginBottom: 20}}>
              If you're not sure, save the reference below and email{" "}
              <a href="mailto:blvckmrkt.market@gmail.com" style={{color: "#ef4444"}}>
                blvckmrkt.market@gmail.com
              </a>{" "}
              — we can look it up either way.
            </p>
            {(paymentRef || gateway) && (
              <div
                style={{
                  background: "#0d0d0d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "6px 20px",
                  marginBottom: 28,
                  textAlign: "left",
                }}>
                <CopyRow label="Payment Reference" value={paymentRef} highlight />
                <CopyRow label="Payment Type" value={gatewayLabel(gateway)} />
              </div>
            )}
            <Link
              to="/"
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
              Back to Home
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
