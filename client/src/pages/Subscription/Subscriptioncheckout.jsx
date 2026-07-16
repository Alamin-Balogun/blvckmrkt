import {useState, useEffect, useRef, useMemo, useCallback} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Link, useNavigate, useLocation} from "react-router-dom";
import {useAuth} from "../Auth/context/authcontext";
import {useCurrency} from "../../components/currencycontext";
import logo from "../../assets/logo.png";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";
const STEPS = ["Billing", "Payment", "Confirm"];
const DASHBOARD_DELAY = 4500;

const paymentMethods = [
  {id: "card", label: "Credit / Debit Card", icon: "💳", description: "Powered by Paystack"},
  {id: "flutterwave", label: "Flutterwave", icon: "🦋", description: "Mobile Money, Bank & More"},
  {id: "transfer", label: "Bank Transfer", icon: "🏦", description: "Manual Transfer"},
];

// ── Load Paystack script manually ────────────────────────────────────────────
const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(window.PaystackPop); return; }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// ── Load Flutterwave script manually (matches CheckoutForm approach) ─────────
const loadFlutterwaveScript = () => {
  return new Promise((resolve, reject) => {
    console.log("🔄 Loading Flutterwave script (FRESH)...");

    // Always remove old script
    const oldScripts = document.querySelectorAll('script[src*="flutterwave.com"]');
    oldScripts.forEach((s) => { console.log("🗑️ Removing old Flutterwave script"); s.remove(); });

    delete window.FlutterwaveCheckout;

    setTimeout(() => {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;

      script.onload = () => {
        console.log("✅ Flutterwave script loaded");
        if (window.FlutterwaveCheckout) {
          console.log("✅ FlutterwaveCheckout available");
          resolve(window.FlutterwaveCheckout);
        } else {
          console.error("❌ Script loaded but FlutterwaveCheckout undefined");
          reject(new Error("FlutterwaveCheckout not available"));
        }
      };

      script.onerror = (err) => {
        console.error("❌ Flutterwave script failed to load", err);
        reject(new Error("Failed to load Flutterwave script"));
      };

      document.body.appendChild(script);
    }, 250);
  });
};

// ── Safe payment modal cleanup ────────────────────────────────────────────────
const closePaymentModal = () => {
  console.log("🧹 Cleaning up payment modals...");

  if (window.PaystackPop) {
    try {
      const handler = window.PaystackPop;
      if (handler && typeof handler.close === "function") handler.close();
    } catch (e) { console.warn("Paystack cleanup error:", e); }
  }

  try {
    const iframes = document.querySelectorAll(
      'iframe[src*="flutterwave"], iframe[src*="ravemodal"]'
    );
    iframes.forEach((iframe) => iframe.remove());

    const flwElements = document.querySelectorAll(
      '[class*="flutterwave-modal"], [class*="flw-modal"], [id*="flutterwave-modal"], [id*="flw-modal"]'
    );
    flwElements.forEach((el) => el.remove());

    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.height = "";
    document.documentElement.style.overflow = "";

    console.log("✅ Flutterwave modal closed safely");
  } catch (e) { console.warn("Flutterwave cleanup error:", e); }

  console.log("✅ Cleanup complete");
};

export default function SubscriptionCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {user} = useAuth();
  const {fmtMoney, convert, userCurrency, baseCurrency} = useCurrency();

  const plan = location.state?.plan ?? {
    id: "blvck",
    slug: "blvck",
    tier: "BLVCK",
    price: 12,
    displayPrice: 12,
    billing: "monthly",
    tagline: "For the real ones",
    isTrial: false,
  };

  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [errors, setErrors] = useState({});
  const [verifying, setVerifying] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [paymentStuck, setPaymentStuck] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [subRef, setSubRef] = useState("");
  const [isTransferPending, setIsTransferPending] = useState(false);

  const paymentTimeoutRef    = useRef(null);
  const flwCloseHandledRef   = useRef(false);   // ✅ NEW — prevents duplicate close
  const flutterwaveModalRef  = useRef(null);    // ✅ NEW — tracks modal instance

  const [billing, setBillingInfo] = useState({firstName: "", lastName: "", email: ""});
  const [payment, setPayment] = useState({
    method: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });
  const [receipt, setReceipt] = useState(null);
  const [receiptError, setReceiptError] = useState("");

  const isBrand  = user?.account_type === "brand";
  const dashLabel = isBrand ? "Brand Studio" : "My BLVCKMRKT";
  const token = localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";

  const orderTotal = plan.isTrial ? 0 : plan.displayPrice;

  // ── Environment check ─────────────────────────────────────────────────────
  useEffect(() => {
    console.log("🔧 SubscriptionCheckout Environment Variables Check:");
    console.log("API URL:", import.meta.env.VITE_API_URL);
    console.log("Paystack Key:", import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? "✅ Loaded" : "❌ Missing");
    console.log("Flutterwave Key:", import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ? "✅ Loaded" : "❌ Missing");
  }, []);

  // ── Detect stuck payments ─────────────────────────────────────────────────
  useEffect(() => {
    if (placing && !complete) {
      console.log("⏱️ Starting payment timeout...");
      paymentTimeoutRef.current = setTimeout(() => {
        console.warn("⚠️ PAYMENT TIMEOUT");
        flwCloseHandledRef.current = true;
        closePaymentModal();
        flutterwaveModalRef.current = null;
        setPaymentStuck(false);
        setPlacing(false);
        setOrderError(
          "⏱️ Payment window timed out. Click 'Activate Plan' again to retry. " +
          "If you were charged, do NOT pay again — contact blvckmrkt.market@gmail.com with your reference."
        );
      }, 10800000); // 3 hours

      return () => {
        if (paymentTimeoutRef.current) {
          console.log("🧹 Clearing payment timeout");
          clearTimeout(paymentTimeoutRef.current);
          paymentTimeoutRef.current = null;
        }
      };
    }
  }, [placing, complete]);

  // Reset stuck state on step change
  useEffect(() => {
    setPaymentStuck(false);
    setOrderError("");
  }, [step]);

  // ── Payment success handler ────────────────────────────────────────────────
  const handlePaymentSuccess = useCallback(async (paymentRef, gateway) => {
    console.log("🔄 Starting subscription payment success...", {paymentRef, gateway});

    setPlacing(true);
    setOrderError("");
    setPaymentStuck(false);

    if (paymentTimeoutRef.current) clearTimeout(paymentTimeoutRef.current);

    try {
      const body = {
        plan: plan.slug ?? String(plan.id),
        billing: plan.billing,
        payment: {method: gateway, reference: paymentRef},
      };

      console.log("📤 Activating subscription:", body);

      const res = await fetch(`${API_BASE}/api/subscription/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: JSON.stringify(body),
      });

      const responseText = await res.text();
      console.log("📥 Activation response:", responseText);

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned invalid response. Status: ${res.status}`);
      }

      if (!res.ok) throw new Error(json.error || json.message || `Server error: ${res.status}`);

      const ref = json?.data?.subscription?.reference || paymentRef;
      console.log("✅ Subscription activated:", ref);

      setSubRef(ref);
      setComplete(true);

      const dashboardPath = isBrand ? "/dashboard/brand" : "/dashboard/buyer";
      setTimeout(() => navigate(dashboardPath), DASHBOARD_DELAY);

    } catch (error) {
      console.error("❌ Subscription activation failed:", error);
      setOrderError(
        error.message ||
        "Failed to activate subscription. Payment was successful but activation failed. " +
        "Contact support with reference: " + paymentRef
      );
    } finally {
      setPlacing(false);
    }
  }, [plan.slug, plan.id, plan.billing, token, isBrand, navigate]);

  // ── Step 0: verify billing ─────────────────────────────────────────────────
  const verifyBilling = async () => {
    const e = {};
    if (!billing.firstName.trim()) e.firstName = "First name is required.";
    if (!billing.lastName.trim())  e.lastName  = "Last name is required.";
    if (!billing.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "A valid email is required.";
    if (Object.keys(e).length > 0) { setErrors(e); return false; }

    setVerifying(true);
    setErrors({});
    try {
      const res = await fetch(`${API_BASE}/api/subscription/verify-billing`, {
        method: "POST",
        headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          first_name: billing.firstName.trim(),
          last_name:  billing.lastName.trim(),
          email:      billing.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || {_general: data.message || "Details don't match our records."});
        return false;
      }
      return true;
    } catch {
      setErrors({_general: "Cannot reach the server. Please check your connection."});
      return false;
    } finally {
      setVerifying(false);
    }
  };

  // ── Step 1: validate payment ───────────────────────────────────────────────
  const validatePayment = () => {
    const e = {};
    if (payment.method === "card") {
      if (!payment.cardName.trim()) e.cardName = "Required";
      if (!payment.cardNumber.replace(/\s/g, "").match(/^\d{16}$/))
        e.cardNumber = "16-digit card number required";
      if (!payment.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = "MM/YY format";
      if (!payment.cvv.match(/^\d{3,4}$/)) e.cvv = "3–4 digits";
    }
    if (payment.method === "transfer" && !receipt)
      e.receipt = "Please upload your payment receipt to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (step === 0) {
      const ok = await verifyBilling();
      if (ok) setStep(1);
    } else if (step === 1) {
      if (validatePayment()) setStep(2);
    }
  };

  const back = () => { setStep((s) => Math.max(0, s - 1)); setErrors({}); };

  // ── Confirm: process payment & activate ───────────────────────────────────
  const confirm = async () => {
    if (!validatePayment()) return;

    console.log("🚀 Subscription payment initiated:", payment.method, orderTotal, userCurrency);

    // ── FREE TRIAL ────────────────────────────────────────────────────────────
    if (plan.isTrial || orderTotal === 0) {
      setPlacing(true);
      setOrderError("");
      try {
        const res = await fetch(`${API_BASE}/api/subscription/activate`, {
          method: "POST",
          headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
          body: JSON.stringify({plan: plan.slug ?? String(plan.id), billing: plan.billing}),
        });
        const data = await res.json();
        if (res.ok && data.data?.subscription?.reference) {
          setSubRef(data.data.subscription.reference);
        } else {
          console.error("Activation error:", data.message);
          setSubRef("SUB-PENDING");
        }
        setComplete(true);
        setTimeout(() => navigate(isBrand ? "/dashboard/brand" : "/dashboard/buyer"), DASHBOARD_DELAY);
      } catch (err) {
        console.error("Failed to activate trial:", err);
        setOrderError("Failed to activate trial. Please try again.");
      } finally {
        setPlacing(false);
      }
      return;
    }

    // ── PAYSTACK ──────────────────────────────────────────────────────────────
    if (payment.method === "card") {
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      console.log("💳 Initializing Paystack (manual)...");

      try {
        const PaystackPop = await loadPaystackScript();
        const handler = PaystackPop.setup({
          key:      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email:    billing.email,
          amount:   Math.round(orderTotal * 100),
          currency: "NGN",
          ref:      `BLVCK-SUB-${Date.now()}`,
          metadata: {
            custom_fields: [
              {display_name: "Customer Name", variable_name: "customer_name",
               value: `${billing.firstName} ${billing.lastName}`.trim()},
              {display_name: "Plan", variable_name: "plan", value: plan.tier},
            ],
          },
          callback: function(response) {
            console.log("✅ PAYSTACK SUCCESS!", response);
            handlePaymentSuccess(response.reference, "paystack");
          },
          onClose: function() {
            console.log("❌ PAYSTACK CLOSED!");
            if (paymentTimeoutRef.current) {
              clearTimeout(paymentTimeoutRef.current);
              paymentTimeoutRef.current = null;
            }
            setOrderError("Payment was cancelled. Please try again.");
            setPlacing(false);
            setPaymentStuck(false);
          },
        });
        handler.openIframe();
      } catch (error) {
        console.error("❌ Paystack failed:", error);
        setOrderError("Failed to initialize payment. Please try again.");
        setPlacing(false);
      }
      return;
    }

    // ── FLUTTERWAVE (manual script loader — same as CheckoutForm) ────────────
    if (payment.method === "flutterwave") {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🦋 FLUTTERWAVE SUBSCRIPTION PAYMENT");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      flwCloseHandledRef.current = false;

      console.log("📊 Payment Details:");
      console.log("  - Amount:",   orderTotal);
      console.log("  - Currency:", userCurrency);
      console.log("  - Email:",    billing.email);

      if (!billing.email || !billing.email.includes("@")) {
        setOrderError("Valid email required for payment");
        setPlacing(false);
        return;
      }
      if (orderTotal <= 0) {
        setOrderError("Invalid order amount");
        setPlacing(false);
        return;
      }

      const flwKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
      console.log("🔑 FLW key exists:", !!flwKey);

      if (!flwKey) {
        setOrderError("Payment gateway not configured. Contact support.");
        setPlacing(false);
        return;
      }

      try {
        console.log("📥 Loading Flutterwave script...");
        const FlutterwaveCheckout = await loadFlutterwaveScript();

        if (typeof FlutterwaveCheckout !== "function")
          throw new Error("FlutterwaveCheckout is not a function");

        const txRef = `BLVCK-SUB-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        const config = {
          public_key:       flwKey,
          tx_ref:           txRef,
          amount:           orderTotal,
          currency:         "NGN",
          payment_options:  "card,mobilemoney,ussd,banktransfer",
          customer: {
            email:        billing.email,
            phone_number: "+2348000000000",
            name:         `${billing.firstName} ${billing.lastName}`.trim() || "Guest",
          },
          customizations: {
            title:       "BLVCKMRKT Subscription",
            description: `${plan.tier} Plan — ${plan.billing}`,
            logo:        "https://blvckmrktng.com/logo.png",
          },

          callback: function(response) {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("✅ FLUTTERWAVE SUCCESS CALLBACK");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("Response:", response);

            flwCloseHandledRef.current = true;

            if (paymentTimeoutRef.current) {
              clearTimeout(paymentTimeoutRef.current);
              paymentTimeoutRef.current = null;
            }

            const ref = String(
              response?.transaction_id ||
              response?.flw_ref ||
              response?.tx_ref ||
              txRef
            );
            console.log("📝 Using reference:", ref);
            handlePaymentSuccess(ref, "flutterwave");
          },

          onclose: function() {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("❌ FLUTTERWAVE CLOSE CALLBACK");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("Already handled?", flwCloseHandledRef.current);

            if (flwCloseHandledRef.current) {
              console.log("Skipping — already handled by success or timeout");
              return;
            }

            flwCloseHandledRef.current = true;

            if (paymentTimeoutRef.current) {
              clearTimeout(paymentTimeoutRef.current);
              paymentTimeoutRef.current = null;
            }

            setTimeout(() => { closePaymentModal(); }, 1000);

            flutterwaveModalRef.current = null;
            setOrderError("Payment cancelled. Click 'Activate Plan' to try again.");
            setPlacing(false);
            setPaymentStuck(false);
          },
        };

        console.log("🚀 Calling FlutterwaveCheckout...");
        const modal = FlutterwaveCheckout(config);
        flutterwaveModalRef.current = modal;
        console.log("✅ FlutterwaveCheckout called, modal ref:", !!modal);

      } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ FLUTTERWAVE ERROR:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        setOrderError(`Payment failed: ${error.message}. Please try again or use another method.`);
        setPlacing(false);
        setPaymentStuck(false);
      }
      return;
    }

    // ── BANK TRANSFER ─────────────────────────────────────────────────────────
    if (payment.method === "transfer") {
      setPlacing(true);
      setOrderError("");
      setPaymentStuck(false);
      console.log("🏦 Processing bank transfer subscription...");

      try {
let receiptUrl = null;
if (receipt) {
  console.log("📄 Uploading receipt to Cloudinary...");
  const cloudName   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    setOrderError("Image upload is not configured. Contact support.");
    setPlacing(false);
    return;
  }
  try {
    const fd = new FormData();
    fd.append("file",           receipt);
    fd.append("upload_preset",  uploadPreset);
    fd.append("folder",         "receipts");
    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {method: "POST", body: fd}
    );
    const cloudJson = await cloudRes.json();
    if (cloudJson.secure_url) {
      receiptUrl = cloudJson.secure_url;
      console.log("✅ Receipt uploaded:", receiptUrl);
    } else {
      throw new Error(cloudJson.error?.message || "Upload failed — no URL returned.");
    }
  } catch (e) {
    console.error("❌ Receipt upload failed:", e);
    setOrderError("Receipt upload failed: " + e.message + ". Please try again.");
    setPlacing(false);
    return;
  }
}

        const body = {
          plan:    plan.slug ?? String(plan.id),
          billing: plan.billing,
          payment: {method: "transfer", receipt_url: receiptUrl},
        };

        console.log("📤 Sending transfer subscription request...");
        const res = await fetch(`${API_BASE}/api/subscription/activate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
          },
          body: JSON.stringify(body),
        });

        const responseText = await res.text();
        console.log("📥 Transfer subscription response:", responseText);

        const json = JSON.parse(responseText);
        if (!res.ok) throw new Error(json.error || "Failed to activate subscription");

// ✅ REPLACE WITH THESE
const ref = json?.data?.subscription?.reference || "SUB-PENDING";
setSubRef(ref);
setIsTransferPending(true); // flag as transfer pending
setComplete(true);

// NO auto-redirect for transfer — needs admin verification
console.log("✅ Transfer subscription recorded, pending verification.");

      } catch (error) {
        console.error("❌ Transfer subscription error:", error);
        setOrderError(error.message || "Failed to activate subscription. Please try again.");
      } finally {
        setPlacing(false);
      }
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const inp = (hasErr) => ({
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${hasErr ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
    color: "#fff", fontSize: 13, padding: "12px 14px", outline: "none",
    width: "100%", boxSizing: "border-box", borderRadius: 8,
    transition: "border-color 0.2s", fontFamily: "inherit",
  });
  const focus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.6)");
  const blur  = (err) => (e) =>
    (e.target.style.borderColor = err ? "#ef4444" : "rgba(255,255,255,0.1)");

  const formatCard   = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  const PlanBadge = () => (
    <div style={{
      background: plan.isTrial ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
      border: `1px solid ${plan.isTrial ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
      borderRadius: 12, padding: "14px 18px", marginBottom: 28,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <p style={{color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 4px"}}>Selected Plan</p>
        <p style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", color: "#fff", letterSpacing: "0.06em", margin: 0}}>
          {plan.tier}{" "}<span style={{color: "rgba(255,255,255,0.3)", fontSize: "0.85rem"}}>— {plan.tagline}</span>
        </p>
        {plan.isTrial && (
          <p style={{color: "#22c55e", fontSize: 10, margin: "4px 0 0", fontWeight: 700}}>
            🎁 First month free · then {fmtMoney(plan.price)}/mo
          </p>
        )}
      </div>
      <div style={{textAlign: "right"}}>
        <p style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.6rem", color: plan.isTrial ? "#22c55e" : "#ef4444", margin: "0 0 2px"}}>
          {plan.isTrial ? "FREE" : fmtMoney(plan.price)}
        </p>
        <p style={{color: "rgba(255,255,255,0.25)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0}}>
          {plan.isTrial ? "today" : `/${plan.billing === "annual" ? "mo · billed annually" : "month"}`}
        </p>
      </div>
    </div>
  );

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
if (complete)
  return (
    <div style={{minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px"}}>
      <motion.div initial={{opacity: 0, scale: 0.94}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.5}} style={{maxWidth: 540, width: "100%", textAlign: "center"}}>
        
        {/* Icon — green check for all, amber clock for transfer */}
        <div style={{position: "relative", marginBottom: 32, display: "inline-block"}}>
          <motion.div
            animate={{scale: [1, 1.18, 1], opacity: [0.35, 0.08, 0.35]}}
            transition={{duration: 2.2, repeat: Infinity}}
            style={{position: "absolute", inset: -14, borderRadius: "50%", border: `1px solid ${isTransferPending ? "#f59e0b" : "#22c55e"}`}}
          />
          <motion.div
            initial={{scale: 0}} animate={{scale: 1}}
            transition={{type: "spring", stiffness: 260, damping: 20, delay: 0.2}}
            style={{width: 88, height: 88, borderRadius: "50%", background: isTransferPending ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)", border: `2px solid ${isTransferPending ? "rgba(245,158,11,0.4)" : "rgba(34,197,94,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center"}}>
            {isTransferPending ? (
              <svg width="40" height="40" fill="none" stroke="#f59e0b" strokeWidth="2.5" viewBox="0 0 24 24">
                <motion.path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  initial={{pathLength: 0}} animate={{pathLength: 1}} transition={{duration: 0.8, delay: 0.4}} />
              </svg>
            ) : (
              <svg width="40" height="40" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
                <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                  initial={{pathLength: 0}} animate={{pathLength: 1}} transition={{duration: 0.6, delay: 0.4}} />
              </svg>
            )}
          </motion.div>
        </div>

        <motion.div initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} transition={{delay: 0.35}}>

          {isTransferPending ? (
            // ── TRANSFER PENDING SCREEN ──────────────────────────────────
            <>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 10}}>
                Payment Recorded
              </p>
              <h1 style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2rem,5vw,3.2rem)", color: "#fff", letterSpacing: "0.05em", lineHeight: 1, marginBottom: 16}}>
                WE'VE <span style={{color: "#f59e0b"}}>GOT YOUR TRANSFER</span>
              </h1>
              <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.8, marginBottom: 28}}>
                Your bank transfer details and receipt have been successfully submitted.<br />
                Our team will manually verify your payment — this typically takes <strong style={{color: "#fff"}}>24–72 hours</strong>, but may take up to <strong style={{color: "#fff"}}>7 business days</strong> in rare cases.
              </p>

              {/* Reference block */}
              <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 22px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase"}}>Submission Ref</span>
                <span style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.2rem", color: "#f59e0b", letterSpacing: "0.1em"}}>{subRef}</span>
              </div>

              {/* What happens next */}
              <div style={{background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "18px 20px", marginBottom: 24, textAlign: "left"}}>
                <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 14}}>What Happens Next</p>
                {[
                  {icon: "📋", title: "Receipt Under Review", desc: "Your uploaded receipt is queued for manual verification by our team."},
                  {icon: "✅", title: "Activation Notification", desc: `We'll send a confirmation to ${billing.email} once your plan is activated.`},
                  {icon: "⚠️", title: "Do NOT pay again", desc: "If you're charged or need urgent help, email blvckmrkt.market@gmail.com with your reference above."},
                ].map((item, i) => (
                  <div key={i} style={{display: "flex", gap: 12, marginBottom: i < 2 ? 14 : 0}}>
                    <span style={{fontSize: "1.1rem", flexShrink: 0, marginTop: 2}}>{item.icon}</span>
                    <div>
                      <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 2px"}}>{item.title}</p>
                      <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0, lineHeight: 1.6}}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA button — go to dashboard manually */}
              <button
                onClick={() => navigate(isBrand ? "/dashboard/brand" : "/dashboard/buyer")}
                style={{background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, padding: "13px 32px", fontSize: 11, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.2s"}}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d97706")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f59e0b")}>
                Go to {dashLabel} →
              </button>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 12}}>
                Your dashboard will reflect <strong style={{color: "rgba(255,255,255,0.4)"}}>pending</strong> status until verified
              </p>
            </>
          ) : (
            // ── NORMAL SUCCESS SCREEN (Paystack / Flutterwave) ───────────
            <>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 10}}>
                {plan.isTrial ? "Trial Activated" : "Subscription Active"}
              </p>
              <h1 style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2.4rem,6vw,3.6rem)", color: "#fff", letterSpacing: "0.05em", lineHeight: 1, marginBottom: 16}}>
                {isBrand ? <>YOU'RE <span style={{color: "#ef4444"}}>LIVE!</span></> : <>YOU'RE <span style={{color: "#ef4444"}}>BLVCKED IN!</span></>}
              </h1>
              <p style={{color: "rgba(255,255,255,0.38)", fontSize: 13, lineHeight: 1.7, marginBottom: 28}}>
                Your <strong style={{color: "#fff"}}>{plan.tier}</strong> plan is {plan.isTrial ? "active — first month free" : "now active"}.<br />
                Confirmation sent to <strong style={{color: "#fff"}}>{billing.email}</strong>.
              </p>

              <div style={{background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 22px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase"}}>Subscription Ref</span>
                <span style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.2rem", color: "#ef4444", letterSpacing: "0.1em"}}>{subRef}</span>
              </div>

              <div style={{background: isBrand ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${isBrand ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "16px 20px", textAlign: "left"}}>
                <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 8}}>
                  <div style={{width: 36, height: 36, borderRadius: 8, background: isBrand ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    {isBrand ? (
                      <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    ) : (
                      <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                  <div>
                    <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", margin: 0}}>Taking you to</p>
                    <p style={{color: "#fff", fontSize: 13, fontWeight: 700, margin: 0}}>{dashLabel}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" style={{marginLeft: "auto", animation: "spin 1s linear infinite"}}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                </div>
                <div style={{width: "100%", height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden"}}>
                  <motion.div initial={{width: "0%"}} animate={{width: "100%"}} transition={{duration: DASHBOARD_DELAY / 1000, ease: "linear"}}
                    style={{height: "100%", background: isBrand ? "linear-gradient(90deg,#ef4444,#ff6b6b)" : "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius: 99}} />
                </div>
              </div>
            </>
          )}
        </motion.div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </div>
  );

  // ── CHECKOUT FORM ──────────────────────────────────────────────────────────
  return (
    <div style={{background: "#000", paddingTop: 100, minHeight: "100vh", fontFamily: "system-ui,sans-serif", position: "relative", overflow: "hidden"}}>
      <img src={logo} alt="" style={{position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "clamp(300px, 40vw, 600px)", height: "auto", opacity: 0.015, pointerEvents: "none", userSelect: "none", zIndex: 0}} />

      <style>{`
        .sc-wrap { max-width: 720px; margin: 0 auto; padding: 0 32px 80px; position: relative; z-index: 1; }
        @media (max-width: 600px) { .sc-wrap { padding: 0 20px 60px; } }
        .sc-stepper { display: flex; align-items: center; margin-bottom: 36px; }
        .sc-step { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
        .sc-step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; flex-shrink: 0; transition: all 0.3s; }
        .sc-step-num.done    { background: #22c55e; color: #fff; }
        .sc-step-num.active  { background: #ef4444; color: #fff; }
        .sc-step-num.pending { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.3); }
        .sc-step-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; white-space: nowrap; }
        .sc-step-lbl.done    { color: #22c55e; }
        .sc-step-lbl.active  { color: #fff; }
        .sc-step-lbl.pending { color: rgba(255,255,255,0.2); }
        .sc-step-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); margin: 0 8px; min-width: 16px; transition: background 0.3s; }
        .sc-step-line.done { background: #22c55e; }
        @media (max-width: 420px) { .sc-step-lbl { display: none; } .sc-step-num { width: 32px; height: 32px; } }
        .sc-section-title { font-family: 'Bebas Neue',sans-serif; font-size: 1.3rem; color: #fff; letter-spacing: 0.08em; margin: 0 0 20px; display: flex; align-items: center; gap: 10px; }
        .sc-section-title::before { content: ''; width: 4px; height: 18px; background: #ef4444; display: block; flex-shrink: 0; }
        .sc-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .sc-row-1 { display: grid; grid-template-columns: 1fr;     gap: 12px; margin-bottom: 12px; }
        @media (max-width: 500px) { .sc-row { grid-template-columns: 1fr; } }
        .sc-field { display: flex; flex-direction: column; gap: 5px; }
        .sc-label { color: rgba(255,255,255,0.35); font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; }
        .sc-error { color: #ef4444; font-size: 10px; font-weight: 700; margin-top: 2px; }
        .sc-pay-tabs { display: flex; gap: 10px; margin-bottom: 20px; }
        .sc-pay-tab  { flex: 1; padding: 12px 8px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.02); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 5px; transition: all 0.2s; }
        .sc-pay-tab:hover { border-color: rgba(255,255,255,0.25); }
        .sc-pay-tab.active { border-color: #ef4444; background: rgba(239,68,68,0.07); }
        .sc-pay-tab-icon  { font-size: 18px; }
        .sc-pay-tab-label { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.4); text-align: center; }
        .sc-pay-tab.active .sc-pay-tab-label { color: #fff; }
        .sc-card-preview { background: linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden; }
        .sc-card-preview::before { content:''; position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:50%; background:rgba(239,68,68,0.08); }
        .sc-review-block { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 18px; margin-bottom: 14px; }
        .sc-review-title { color: rgba(255,255,255,0.28); font-size: 9px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .sc-review-edit  { color: #ef4444; font-size: 9px; font-weight: 700; background: none; border: none; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
        .sc-review-val   { color: rgba(255,255,255,0.65); font-size: 12px; line-height: 1.7; margin: 0; }
        .sc-btn-row  { display: flex; gap: 10px; margin-top: 24px; }
        .sc-btn-next { flex: 1; background: #ef4444; color: #fff; border: none; font-size: 11px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; padding: 15px 20px; cursor: pointer; border-radius: 8px; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .sc-btn-next:hover:not(:disabled) { background: #dc2626; }
        .sc-btn-next:disabled { opacity: 0.65; cursor: not-allowed; }
        .sc-btn-back { background: none; border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 15px 20px; cursor: pointer; border-radius: 8px; transition: all 0.2s; white-space: nowrap; }
        .sc-btn-back:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .sc-general-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes co-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className="sc-wrap">
        <div style={{marginBottom: 28}}>
          <button onClick={() => navigate("/subscribe")}
            style={{background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.28)", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: 0, transition: "color 0.2s"}}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}>
            ← Change Plan
          </button>
        </div>

        <h1 style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(2rem,4vw,2.8rem)", color: "#fff", letterSpacing: "0.06em", marginBottom: 28, lineHeight: 1}}>
          SECURE <span style={{color: "#ef4444"}}>SUBSCRIPTION</span>
        </h1>

        {/* Stepper */}
        <div className="sc-stepper">
          {STEPS.map((s, i) => (
            <div key={s} style={{display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none"}}>
              <div className="sc-step">
                <div className={`sc-step-num ${i < step ? "done" : i === step ? "active" : "pending"}`}>
                  {i < step ? (
                    <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (i + 1)}
                </div>
                <span className={`sc-step-lbl ${i < step ? "done" : i === step ? "active" : "pending"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`sc-step-line ${i < step ? "done" : ""}`} />}
            </div>
          ))}
        </div>

        <PlanBadge />

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}} transition={{duration: 0.28}}>

            {/* ── STEP 0: Billing Info ── */}
            {step === 0 && (
              <div>
                <p className="sc-section-title">Billing Information</p>
                {errors._general && (
                  <div className="sc-general-error">
                    <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink: 0, marginTop: 1}}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span style={{color: "#ef4444", fontSize: 12}}>{errors._general}</span>
                  </div>
                )}
                <div className="sc-row">
                  <div className="sc-field">
                    <label className="sc-label">First Name *</label>
                    <input style={inp(errors.firstName)} placeholder="John" value={billing.firstName}
                      onChange={(e) => setBillingInfo({...billing, firstName: e.target.value})} onFocus={focus} onBlur={blur(errors.firstName)} />
                    {errors.firstName && <span className="sc-error">{errors.firstName}</span>}
                  </div>
                  <div className="sc-field">
                    <label className="sc-label">Last Name *</label>
                    <input style={inp(errors.lastName)} placeholder="Doe" value={billing.lastName}
                      onChange={(e) => setBillingInfo({...billing, lastName: e.target.value})} onFocus={focus} onBlur={blur(errors.lastName)} />
                    {errors.lastName && <span className="sc-error">{errors.lastName}</span>}
                  </div>
                </div>
                <div className="sc-row-1">
                  <div className="sc-field">
                    <label className="sc-label">Email Address *</label>
                    <input style={inp(errors.email)} type="email" placeholder="you@example.com" value={billing.email}
                      onChange={(e) => setBillingInfo({...billing, email: e.target.value})} onFocus={focus} onBlur={blur(errors.email)} />
                    {errors.email && <span className="sc-error">{errors.email}</span>}
                  </div>
                </div>
                <p style={{color: "rgba(255,255,255,0.2)", fontSize: 11, lineHeight: 1.6, marginTop: 4}}>
                  {plan.isTrial
                    ? `No charge today. Your card will be billed ${fmtMoney(plan.price)}/mo starting next month.`
                    : "These details must match your registered account."}
                </p>
              </div>
            )}

            {/* ── STEP 1: Payment ── */}
            {step === 1 && (
              <div>
                <p className="sc-section-title">Payment Method</p>
                {plan.isTrial && (
                  <div style={{background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8}}>
                    <span style={{fontSize: "1rem"}}>🎁</span>
                    <span style={{color: "#22c55e", fontSize: 12}}>Your card won't be charged today — first month is completely free.</span>
                  </div>
                )}
                <div className="sc-pay-tabs">
                  {paymentMethods.map((m) => (
                    <div key={m.id} className={`sc-pay-tab ${payment.method === m.id ? "active" : ""}`}
                      onClick={() => setPayment({...payment, method: m.id})}>
                      <span className="sc-pay-tab-icon">{m.icon}</span>
                      <span className="sc-pay-tab-label">{m.label}</span>
                    </div>
                  ))}
                </div>

                {payment.method === "card" && (
                  <>
                    <div className="sc-card-preview">
                      <p style={{color: "rgba(255,255,255,0.2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20}}>Card Preview</p>
                      <p style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.25em", marginBottom: 14}}>
                        {payment.cardNumber || "•••• •••• •••• ••••"}
                      </p>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
                        <div>
                          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 2px"}}>Card Holder</p>
                          <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>{payment.cardName || "YOUR NAME"}</p>
                        </div>
                        <div style={{textAlign: "right"}}>
                          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 8, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 2px"}}>Expires</p>
                          <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>{payment.expiry || "MM/YY"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="sc-row-1">
                      <div className="sc-field">
                        <label className="sc-label">Name on Card *</label>
                        <input style={inp(errors.cardName)} placeholder="John Doe" value={payment.cardName}
                          onChange={(e) => setPayment({...payment, cardName: e.target.value})} onFocus={focus} onBlur={blur(errors.cardName)} />
                        {errors.cardName && <span className="sc-error">{errors.cardName}</span>}
                      </div>
                      <div className="sc-field">
                        <label className="sc-label">Card Number *</label>
                        <input style={inp(errors.cardNumber)} placeholder="1234 5678 9012 3456" value={payment.cardNumber}
                          onChange={(e) => setPayment({...payment, cardNumber: formatCard(e.target.value)})} onFocus={focus} onBlur={blur(errors.cardNumber)} />
                        {errors.cardNumber && <span className="sc-error">{errors.cardNumber}</span>}
                      </div>
                    </div>
                    <div className="sc-row">
                      <div className="sc-field">
                        <label className="sc-label">Expiry Date *</label>
                        <input style={inp(errors.expiry)} placeholder="MM/YY" value={payment.expiry}
                          onChange={(e) => setPayment({...payment, expiry: formatExpiry(e.target.value)})} onFocus={focus} onBlur={blur(errors.expiry)} />
                        {errors.expiry && <span className="sc-error">{errors.expiry}</span>}
                      </div>
                      <div className="sc-field">
                        <label className="sc-label">CVV *</label>
                        <input style={inp(errors.cvv)} placeholder="•••" type="password" maxLength={4} value={payment.cvv}
                          onChange={(e) => setPayment({...payment, cvv: e.target.value.replace(/\D/g, "").slice(0, 4)})} onFocus={focus} onBlur={blur(errors.cvv)} />
                        {errors.cvv && <span className="sc-error">{errors.cvv}</span>}
                      </div>
                    </div>
                    <div style={{marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8}}>
                      <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p style={{color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0, lineHeight: 1.5}}>Preview only - actual payment processed securely by Paystack</p>
                    </div>
                  </>
                )}

                {payment.method === "flutterwave" && (
                  <div style={{background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12, padding: "40px 24px", textAlign: "center"}}>
                    <p style={{fontSize: "2.5rem", marginBottom: 10}}>🦋</p>
                    <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 6}}>
                      You'll be redirected to <strong style={{color: "#fff"}}>Flutterwave</strong> for payment
                    </p>
                    <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11}}>Cards, Mobile Money, Bank Transfer & USSD</p>
                  </div>
                )}

                {payment.method === "transfer" && (
                  <div>
                    <div style={{background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "20px 22px", marginBottom: 20}}>
                      <p style={{color: "rgba(255,255,255,0.28)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 14}}>Transfer To This Account</p>
                      {[
                        {label: "Bank Name",       value: "Fidelity Bank Plc"},
                        {label: "Account Name",    value: "OLATOMIWA AYOMIDE SHITTU"},
                        {label: "Account Number",  value: "6174 0498 08"},
                        {label: "Amount",          value: plan.isTrial ? "FREE (first month)" : fmtMoney(plan.price) + "/mo"},
                        {label: "Reference",       value: `${billing.firstName} ${billing.lastName}`.trim() || "Your Full Name"},
                      ].map((r) => (
                        <div key={r.label} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
                          <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>{r.label}</span>
                          <span style={{color: "#fff", fontSize: 12, fontWeight: 700}}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="sc-label" style={{display: "block", marginBottom: 8}}>Upload Transfer Receipt *</label>
                      <div onClick={() => document.getElementById("sub-receipt").click()}
                        style={{border: `2px dashed ${errors.receipt ? "#ef4444" : receipt ? "#22c55e" : "rgba(255,255,255,0.15)"}`, borderRadius: 12, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: receipt ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)"}}>
                        {receipt ? (
                          <>
                            <div style={{width: 44, height: 44, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px"}}>
                              <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p style={{color: "#22c55e", fontSize: 12, fontWeight: 700, marginBottom: 4}}>{receipt.name}</p>
                            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>
                              ({(receipt.size / 1024).toFixed(1)} KB) —{" "}
                              <span style={{color: "#ef4444", cursor: "pointer", textDecoration: "underline"}} onClick={(e) => { e.stopPropagation(); setReceipt(null); }}>Remove</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" viewBox="0 0 24 24" style={{margin: "0 auto 12px"}}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p style={{color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 4}}>Click to upload receipt</p>
                            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>PNG, JPG, PDF — max 5MB</p>
                          </>
                        )}
                      </div>
                      <input id="sub-receipt" type="file" accept="image/png,image/jpeg,application/pdf" style={{display: "none"}}
                        onChange={(e) => {
                          const f = e.target.files[0];
                          if (f && f.size <= 5 * 1024 * 1024) { setReceipt(f); setErrors((p) => ({...p, receipt: null})); }
                          else setReceiptError("File too large — max 5MB");
                        }} />
                      {(errors.receipt || receiptError) && (
                        <p style={{color: "#ef4444", fontSize: 10, fontWeight: 700, marginTop: 6}}>{errors.receipt || receiptError}</p>
                      )}
                    </div>
                  </div>
                )}

                <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 14, textAlign: "center"}}>
                  🔒 Your payment information is encrypted and secure
                </p>
              </div>
            )}

            {/* ── STEP 2: Confirm ── */}
            {step === 2 && (
              <div>
                <p className="sc-section-title">Review & Confirm</p>

                {orderError && (
                  <div className="sc-general-error" style={{marginBottom: 16}}>
                    <svg width="14" height="14" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink: 0, marginTop: 1}}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span style={{color: "#ef4444", fontSize: 11}}>{orderError}</span>
                  </div>
                )}

                <div className="sc-review-block">
                  <div className="sc-review-title">
                    <span>Billing Details</span>
                    <button className="sc-review-edit" onClick={() => setStep(0)}>Edit</button>
                  </div>
                  <p className="sc-review-val">{billing.firstName} {billing.lastName}<br />{billing.email}</p>
                </div>

                <div className="sc-review-block">
                  <div className="sc-review-title">
                    <span>Payment</span>
                    <button className="sc-review-edit" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <p className="sc-review-val">
                    {payment.method === "card" ? (
                      `Card ending in ${payment.cardNumber.replace(/\s/g, "").slice(-4) || "••••"}`
                    ) : payment.method === "transfer" ? (
                      <>Bank Transfer {receipt && <span style={{color: "#22c55e"}}>✓ Receipt uploaded</span>}</>
                    ) : (
                      paymentMethods.find((m) => m.id === payment.method)?.label
                    )}
                  </p>
                </div>

                <div className="sc-review-block" style={{borderColor: plan.isTrial ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", background: plan.isTrial ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)"}}>
                  <div className="sc-review-title"><span>Charge Today</span></div>
                  <div style={{display: "flex", alignItems: "baseline", gap: 8}}>
                    <span style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "2rem", color: plan.isTrial ? "#22c55e" : "#ef4444"}}>
                      {plan.isTrial ? "FREE" : fmtMoney(plan.price)}
                    </span>
                    {plan.isTrial && (
                      <span style={{color: "rgba(255,255,255,0.3)", fontSize: 12}}>then {fmtMoney(plan.price)}/mo from next month</span>
                    )}
                    {!plan.isTrial && (
                      <span style={{color: "rgba(255,255,255,0.3)", fontSize: 12}}>
                        per month{plan.billing === "annual" ? ` · billed as ${fmtMoney(plan.price * 12)}/yr` : ""}
                      </span>
                    )}
                  </div>
                  <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 6, lineHeight: 1.6}}>
                    Your {plan.tier} plan renews automatically. Cancel anytime — no penalty.
                  </p>
                </div>

                <div style={{background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12}}>
                  <div style={{width: 36, height: 36, borderRadius: 8, background: isBrand ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    {isBrand ? (
                      <svg width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    ) : (
                      <svg width="15" height="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                  <div>
                    <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0}}>After activation you'll go to</p>
                    <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>{dashLabel}</p>
                  </div>
                </div>

                <p style={{color: "rgba(255,255,255,0.25)", fontSize: 11, lineHeight: 1.7, marginTop: 16}}>
                  By subscribing you agree to our{" "}
                  <Link to="/terms" style={{color: "#ef4444", textDecoration: "none"}}>Terms of Service</Link>{" "}
                  and{" "}
                  <Link to="/privacy" style={{color: "#ef4444", textDecoration: "none"}}>Privacy Policy</Link>.
                </p>
              </div>
            )}

            {/* Nav */}
            <div className="sc-btn-row">
              {step > 0 && <button className="sc-btn-back" onClick={back}>← Back</button>}
              {step < 2 ? (
                <button className="sc-btn-next" onClick={next} disabled={verifying}>
                  {verifying ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                      </svg>{" "}Verifying...
                    </>
                  ) : step === 1 ? "Review Subscription →" : "Continue →"}
                </button>
              ) : (
                <>
                  <button
                    className="sc-btn-next"
                    onClick={confirm}
                    disabled={placing && !paymentStuck}
                    style={{background: "#22c55e"}}
                    onMouseEnter={(e) => { if (!placing) e.currentTarget.style.background = "#16a34a"; }}
                    onMouseLeave={(e) => { if (!placing) e.currentTarget.style.background = "#22c55e"; }}>
                    {placing && !paymentStuck ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{animation: "spin 0.8s linear infinite"}}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                        </svg>{" "}Processing Payment...
                      </>
                    ) : paymentStuck ? "Retry Payment" : (
                      <>🔒 {plan.isTrial ? `Activate Free Trial — ${fmtMoney(0)} Today` : `Activate Plan — ${fmtMoney(plan.price)}/mo`}</>
                    )}
                  </button>

                  {placing && !paymentStuck && (
                    <p style={{width: "100%", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 12, animation: "co-pulse 1.4s infinite"}}>
                      Please complete payment in the popup window...
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flutterwave stable mount point */}
      <div id="flutterwave-mount" style={{position: "fixed", zIndex: 99999}} />
    </div>
  );
}