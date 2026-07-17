import {useState, useEffect, useRef} from "react";
import {getConversations, getThread, sendMessage} from "./dashboard_components/api";

function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function ConversationList({conversations, loading, activeBrandId, onSelect}) {
  if (loading) {
    return (
      <div style={{display: "flex", flexDirection: "column", gap: 8, padding: 12}}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{height: 56, background: "rgba(255,255,255,0.04)", borderRadius: 10, animation: "pulse 1.4s infinite"}} />
        ))}
      </div>
    );
  }
  if (conversations.length === 0) {
    return (
      <div style={{padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12}}>
        No conversations yet. Message a brand from their profile page to start one.
      </div>
    );
  }
  return (
    <div style={{display: "flex", flexDirection: "column"}}>
      {conversations.map((c) => (
        <div
          key={c.brand_id}
          onClick={() => onSelect(c.brand_id)}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer",
            background: activeBrandId === c.brand_id ? "rgba(239,68,68,0.06)" : "transparent",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
            background: "linear-gradient(135deg,#ef4444,#7f1d1d)", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 13, fontWeight: 800,
          }}>
            {c.avatar_url ? <img src={c.avatar_url} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}} /> : initials(c.name)}
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{display: "flex", justifyContent: "space-between", gap: 8}}>
              <span style={{color: "#fff", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{c.name}</span>
              {c.unread_count > 0 && (
                <span style={{background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 99, padding: "2px 6px", flexShrink: 0}}>
                  {c.unread_count}
                </span>
              )}
            </div>
            <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
              {c.last_sender === "buyer" ? "You: " : ""}{c.last_message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Thread({brandId, onBack}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = () => {
    setLoading(true);
    getThread(brandId).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [brandId]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: "smooth"});
  }, [data]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(brandId, draft.trim());
      setDraft("");
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
      <div style={{display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)"}}>
        <button onClick={onBack} style={{background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18, padding: 0}}>←</button>
        <span style={{color: "#fff", fontSize: 14, fontWeight: 800}}>{data?.brand_name || "..."}</span>
      </div>

      <div style={{flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10}}>
        {loading ? (
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center"}}>Loading...</p>
        ) : (
          (data?.messages || []).map((m) => (
            <div key={m.id} style={{alignSelf: m.sender_type === "buyer" ? "flex-end" : "flex-start", maxWidth: "75%"}}>
              <div style={{
                background: m.sender_type === "buyer" ? "#ef4444" : "rgba(255,255,255,0.06)",
                color: m.sender_type === "buyer" ? "#fff" : "rgba(255,255,255,0.8)",
                borderRadius: 12, padding: "9px 13px", fontSize: 12.5, lineHeight: 1.5,
              }}>
                {m.body}
              </div>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 9, margin: "3px 4px 0", textAlign: m.sender_type === "buyer" ? "right" : "left"}}>
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)"}}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          style={{
            flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 12.5, outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          style={{
            background: "#ef4444", border: "none", borderRadius: 8, padding: "0 18px",
            color: "#fff", fontSize: 12, fontWeight: 800, cursor: sending ? "not-allowed" : "pointer",
            opacity: sending || !draft.trim() ? 0.5 : 1,
          }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBrandId, setActiveBrandId] = useState(null);

  useEffect(() => {
    getConversations().then((d) => setConversations(Array.isArray(d) ? d : [])).catch(() => setConversations([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <h2 style={{fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(1.6rem,3vw,2.2rem)", color: "#fff", letterSpacing: "0.04em", margin: "0 0 16px"}}>
        MESSAGES
      </h2>
      <div style={{
        background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
        height: "min(600px, 70vh)", overflow: "hidden",
      }}>
        {activeBrandId ? (
          <Thread brandId={activeBrandId} onBack={() => setActiveBrandId(null)} />
        ) : (
          <div style={{height: "100%", overflowY: "auto"}}>
            <ConversationList
              conversations={conversations}
              loading={loading}
              activeBrandId={activeBrandId}
              onSelect={setActiveBrandId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
