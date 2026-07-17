import {useEffect} from "react";
import {useLocation} from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";
const SESSION_KEY = "blvck_visit_session";

// A random ID kept in sessionStorage for the tab's lifetime — used only to
// approximate unique visitors per browser session, not tied to any account.
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Mounted once at the app root, inside the router. The frontend is a
// client-side-routed SPA, so a server request log only ever sees the initial
// index.html load — this fires a lightweight beacon on every route change
// instead, which is what actually approximates a "page view".
export default function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    fetch(`${API_BASE}/api/track/visit`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        path: location.pathname,
        referrer: document.referrer || "",
        session_id: getSessionId(),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [location.pathname]);

  return null;
}
