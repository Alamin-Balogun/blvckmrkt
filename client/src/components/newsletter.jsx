import {useState} from "react";
import {motion, AnimatePresence} from "framer-motion";

// ✅ Match the pattern used by other components (no /api in the base URL)
const API_BASE = import.meta.env.VITE_API_URL || "https://blvckmrktng.com";

async function subscribeToNewsletter(email, name, source) {
  // ✅ Add /api/ prefix like other components do
  const response = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email, name, source}),
  });

  // ✅ Handle non-JSON responses gracefully
  const contentType = response.headers.get("content-type");
  let data;
  
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    console.log("Invalid JSON response:", text);
    throw new Error("Server error: invalid response format");
  }
  
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Failed to subscribe");
  }

  return data?.data || data;
}

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      await subscribeToNewsletter(email.trim(), name.trim(), "footer");
      setSubmitted(true);
      setEmail("");
      setName("");
    } catch (err) {
      setError(err?.message || "Failed to subscribe. Please try again.");
      console.error("Newsletter subscription error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative bg-[#0d0d0d] border-t border-white/8 overflow-hidden">
      {/* Very subtle background image */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1600&q=80"
          alt=""
          className="w-full h-full object-cover object-center"
          style={{filter: "grayscale(70%)", opacity: 0.07}}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left — label + heading + sub */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-red-500 text-[10px] font-black tracking-[0.35em] uppercase">
              Newsletter
            </span>
          </div>
          <h3
            className="text-white font-black leading-none mb-1.5"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.65rem",
              letterSpacing: "0.05em",
            }}>
            SIGN UP &amp; STAY IN THE KNOW
          </h3>
          <p className="text-white/35 text-[11px] tracking-wide leading-relaxed">
            New drops, verified sellers &amp; exclusive deals — straight to your inbox. No spam.
          </p>
        </div>

        {/* Right — form */}
        <div className="w-full md:w-auto md:min-w-[420px] flex flex-col gap-2">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                exit={{opacity: 0}}
                transition={{duration: 0.2}}
                className={`relative border transition-all duration-300 ${
                  focused ? "border-red-500/70" : "border-white/12"
                } bg-white/[0.03] rounded-md`}>
                {/* Input */}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Enter your email address"
                  disabled={loading}
                  className="w-full bg-transparent text-white text-[12px] tracking-[0.06em] 
               placeholder-white/25 px-4 pr-36 py-4 outline-none disabled:opacity-50"
                />

                {/* Button INSIDE input */}
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2
               bg-[#1a1a1a] hover:bg-red-600
               disabled:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed
               text-white text-[10px] font-black tracking-[0.22em] uppercase
               px-6 py-2.5
               rounded-md
               transition-all duration-200
               shadow-lg shadow-red-500/20
               hover:shadow-red-500/40">
                  {loading ? "Subscribing..." : "Subscribe"}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{opacity: 0, y: 6}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.35}}
                className="flex items-center gap-3 border border-red-500/30 bg-red-500/8 px-5 py-3.5 rounded-md">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-[12px] font-bold">You're on the list!</p>
                  <p className="text-white/40 text-[10px] mt-0.5">
                    Expect heat in your inbox soon.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{opacity: 0, height: 0}}
              animate={{opacity: 1, height: "auto"}}
              exit={{opacity: 0, height: 0}}
              className="text-red-400 text-[10px] px-1 -mt-1">
              {error}
            </motion.div>
          )}

          <p className="text-white/20 text-[9px] tracking-[0.15em] uppercase pl-0.5">
            Join thousands of subscribers · Unsubscribe anytime
          </p>
        </div>
      </div>
    </section>
  );
}