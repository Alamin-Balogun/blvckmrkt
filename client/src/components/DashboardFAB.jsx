import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/Auth/context/authcontext";

export default function DashboardFAB() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return null;

  const isDashboard = location.pathname.startsWith("/dashboard");

  const handleClick = () => {
    if (isDashboard) {
      navigate("/");
      return;
    }
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.account_type === "brand") {
      navigate("/dashboard/brand");
    } else {
      navigate("/dashboard/buyer");
    }
  };

  return (
    <button
      onClick={handleClick}
      title={isDashboard ? "Back to website" : user ? "Go to dashboard" : "Login"}
      style={{
        position: "fixed",
        top: 224, // clears the fixed navbar (marquee + nav bar) at its tallest, unscrolled state
        right: 28,
        zIndex: 9000,
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: isDashboard ? "#0d0d0d" : "#ef4444",
        border: `1px solid ${isDashboard ? "rgba(255,255,255,0.12)" : "rgba(239,68,68,0.4)"}`,
        boxShadow: isDashboard
          ? "0 4px 20px rgba(0,0,0,0.5)"
          : "0 4px 20px rgba(239,68,68,0.4)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = isDashboard
          ? "0 6px 28px rgba(0,0,0,0.6)"
          : "0 6px 28px rgba(239,68,68,0.55)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = isDashboard
          ? "0 4px 20px rgba(0,0,0,0.5)"
          : "0 4px 20px rgba(239,68,68,0.4)";
      }}>
      {isDashboard ? (
        // Back to website — globe icon
        <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
        </svg>
      ) : user ? (
        // Go to dashboard — grid icon
        <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ) : (
        // Login — person icon
        <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
    </button>
  );
}