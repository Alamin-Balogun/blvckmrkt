import {useState, useEffect} from "react";
import VaultUnlockModal from "../../../components/vaultunlockmodal";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

function LockedCard({product, onOpen}) {
  return (
    <div
      onClick={() => onOpen(product.id)}
      className="group relative cursor-pointer border border-white/12 hover:border-red-500/50 bg-[#0a0a0a] transition-all duration-300 aspect-[3/4] flex flex-col items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-40 group-hover:opacity-55 transition-opacity duration-300"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px)",
        }}
      />
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(239,68,68,0.7)"
        strokeWidth="1.5"
        className="mb-4 relative">
        <rect x="5" y="11" width="14" height="9" rx="1.5" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
      <div
        className="relative text-white/70 text-[11px] font-bold tracking-[0.25em] uppercase mb-1"
        style={{fontFamily: "'Space Mono', monospace"}}>
        Classified Item
      </div>
      <div
        className="relative text-red-500/70 text-[9.5px] font-bold tracking-[0.3em] uppercase"
        style={{fontFamily: "'Space Mono', monospace"}}>
        Access Required
      </div>
      <span className="relative mt-5 text-white/30 group-hover:text-white text-[9.5px] font-bold tracking-[0.2em] uppercase border border-white/15 group-hover:border-red-500 group-hover:bg-red-600 px-4 py-2 transition-all duration-200">
        Enter Code
      </span>
    </div>
  );
}

export default function TheVault() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/shop/products?is_vault=true&limit=8`)
      .then((r) => r.json())
      .then((json) => setItems(json?.data?.products ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="bg-black py-16 px-6 md:px-12 border-b border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <h3
            className="text-white font-black tracking-[0.08em] uppercase"
            style={{fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem"}}>
            🔒 The Vault
          </h3>
        </div>
        <p
          className="text-white/30 text-[11px] mb-8 max-w-md"
          style={{fontFamily: "'Space Mono', monospace"}}>
          Classified drops. Access is earned, not sold — you'll need a code.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({length: 4}).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-white/[0.03] border border-white/8 animate-pulse" />
              ))
            : items.map((p) => <LockedCard key={p.id} product={p} onOpen={setOpenId} />)}
        </div>
      </div>

      {openId && <VaultUnlockModal productId={openId} onClose={() => setOpenId(null)} />}
    </section>
  );
}
