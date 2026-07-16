import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminSidebar, AdminTopBar, Icon } from "./Components";
import AdminLoginPage from "./Adminlogin";
import { getToken, clearToken, getMe } from "./dashboard_components/api";

// ✅ Lazy load every admin section
const AdminOverview      = lazy(() => import("./Adminoverview"));
const AdminActivity      = lazy(() => import("./Adminactivity"));
const AdminUsers         = lazy(() => import("./Adminusers"));
const AdminBrands        = lazy(() => import("./Adminbrands"));
const AdminOrders        = lazy(() => import("./Adminorders"));
const AdminBankAccounts  = lazy(() => import("./Adminbankaccounts"));
const AdminBlog          = lazy(() => import("./Adminblog"));
const AdminAddresses     = lazy(() => import("./Adminaddresses"));
const AdminPrivileges    = lazy(() => import("./Adminprivileges"));
const AdminAuditLog = lazy(() => import("./Adminauditlog"));
const AdminSettings      = lazy(() => import("./Adminsettings"));
const AdminAnalytics     = lazy(() => import("./Adminanalytics"));
const AdminShipping      = lazy(() => import("./Adminshipping"));
const AdminLocalShipping = lazy(() => import("./Adminlocalshipping"));

// ── Page metadata ─────────────────────────────────────────────────────────────
const PAGE_META = {
  overview:      { title: "Overview",        subtitle: "Platform at a glance" },
  activity:      { title: "Activity Feed",   subtitle: "Real-time platform events" },
  users:         { title: "Users",           subtitle: "Buyers, brands, employees & partners" },
  brands:        { title: "Brands",          subtitle: "Brand accounts & approvals" },
  subscriptions: { title: "Subscribers",     subtitle: "Email & " },
  products:      { title: "Products",        subtitle: "Full product catalogue" },
  bankaccounts:  { title: "Bank Accounts",   subtitle: "Manage brand payout accounts" },
  orders:        { title: "Orders",          subtitle: "All orders across the platform" },
  drops:         { title: "Drops",           subtitle: "Scheduled & live drops" },
  categories:    { title: "Categories",      subtitle: "Product taxonomy" },
  reviews:       { title: "Reviews",         subtitle: "Moderate & manage reviews" },
  blog:          { title: "Blog",            subtitle: "Posts, categories & comments" },
  pages:         { title: "Site Pages",      subtitle: "Home · About · Shop · Contact · Brands · Drops · Blog" },
  notifications: { title: "Notifications",   subtitle: "Broadcast to users" },
  addresses:     { title: "Addresses",       subtitle: "All user delivery addresses" },
  privileges:    { title: "Privileges",      subtitle: "Role defaults & individual user overrides" },
  auditlog:      { title: "Audit Log",       subtitle: "Deleted records archive" },
  settings:      { title: "Settings",        subtitle: "Platform-wide configuration" },
  analytics:     { title: "Analytics",       subtitle: "Charts, trends & weekly breakdowns" },
  shipping:      { title: "Shipping",        subtitle: "Shipping zones & delivery methods" },
  localshipping: { title: "Local Shipping",  subtitle: "City-level delivery rates & area pricing" },
};

// ── Section loading spinner ───────────────────────────────────────────────────
function SectionLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 300,
      gap: 12,
    }}>
      <div style={{
        width: 20,
        height: 20,
        border: "2px solid rgba(239,68,68,0.15)",
        borderTop: "2px solid #ef4444",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <span style={{
        fontFamily: "monospace",
        fontSize: 11,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: "0.2em",
      }}>
        LOADING...
      </span>
    </div>
  );
}

// ── Lazy loader for named exports from Adminsections ─────────────────────────
function AdminSectionsLazy({ name, ...props }) {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    import("./Adminsections").then((mod) => {
      setComponent(() => mod[name]);
    });
  }, [name]);

  if (!Component) return <SectionLoader />;
  return <Component {...props} />;
}

// ── Section renderer ──────────────────────────────────────────────────────────
function SectionContent({ section, onNav }) {
  return (
    <Suspense fallback={<SectionLoader />}>
      <SectionInner section={section} onNav={onNav} />
    </Suspense>
  );
}

function SectionInner({ section, onNav }) {
  switch (section) {
    case "overview":      return <AdminOverview onNav={onNav} />;
    case "activity":      return <AdminActivity />;
    case "users":         return <AdminUsers />;
    case "brands":        return <AdminBrands />;
    case "orders":        return <AdminOrders />;
    case "bankAccounts":  return <AdminBankAccounts />;
    case "blog":          return <AdminBlog />;
    case "addresses":     return <AdminAddresses />;
    case "privileges":    return <AdminPrivileges />;
    case "auditlog":      return <AdminAuditLog />;
    case "settings":      return <AdminSettings />;
    case "analytics":     return <AdminAnalytics />;
    case "shipping":      return <AdminShipping />;
    case "localShipping": return <AdminLocalShipping />;
    // Named exports from Adminsections
    case "subscriptions": return <AdminSectionsLazy name="AdminSubscriptions" />;
    case "products":      return <AdminSectionsLazy name="AdminProducts" />;
    case "drops":         return <AdminSectionsLazy name="AdminDrops" />;
    case "categories":    return <AdminSectionsLazy name="AdminCategories" />;
    case "reviews":       return <AdminSectionsLazy name="AdminReviews" />;
    case "notifications": return <AdminSectionsLazy name="AdminNotifications" />;
    case "pages":         return <AdminSectionsLazy name="AdminSitePages" />;
    default:              return <AdminOverview onNav={onNav} />;
  }
}

// ── Logout Confirmation Modal ─────────────────────────────────────────────────
function LogoutConfirmationModal({ onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (e) {
      console.error("Logout error:", e);
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}
      >
        {success ? (
          <div style={{ padding: "40px 32px", textAlign: "center" }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.1)",
                border: "2px solid rgba(34,197,94,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg width="32" height="32" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "1.5rem",
              color: "#22c55e",
              letterSpacing: "0.06em",
              margin: "0 0 8px",
            }}>
              LOGGED OUT SUCCESSFULLY
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>
              Redirecting you to homepage...
            </p>
          </div>
        ) : (
          <>
            <div style={{ height: 3, background: "linear-gradient(90deg,#ef4444,#ff6b6b,transparent)" }} />
            <div style={{ padding: "32px 28px" }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: "2px solid rgba(239,68,68,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </div>
              <h2 style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "1.6rem",
                color: "#fff",
                letterSpacing: "0.06em",
                textAlign: "center",
                margin: "0 0 10px",
              }}>
                LOG OUT?
              </h2>
              <p style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                lineHeight: 1.6,
                textAlign: "center",
                margin: "0 0 24px",
              }}>
                Are you sure you want to log out of the admin console?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onCancel}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.5)",
                    borderRadius: 10,
                    padding: "13px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                      e.currentTarget.style.color = "#fff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                  }}
                >
                  Stay
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: loading ? "#7f1d1d" : "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "13px",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.18s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.background = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.background = "#ef4444";
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 12,
                        height: 12,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }} />
                      Logging out...
                    </>
                  ) : (
                    "Log Out"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Root Admin shell ──────────────────────────────────────────────────────────
export default function Admin() {
  const [section, setSection]               = useState("overview");
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [isMobile, setIsMobile]             = useState(false);
  const [admin, setAdmin]                   = useState(null);
  const [authChecked, setAuthChecked]       = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // On mount — verify existing token or prompt login
  useEffect(() => {
    if (getToken()) {
      getMe()
        .then((user) => {
          setAdmin(user);
          setAuthChecked(true);
        })
        .catch(() => {
          clearToken();
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleLogoutClick   = () => setShowLogoutModal(true);
  const handleLogoutConfirm = async () => { clearToken(); setAdmin(null); };
  const handleLogoutCancel  = () => setShowLogoutModal(false);

  const handleNav = (id) => {
    setSection(id);
    setSidebarOpen(false);
  };

  if (!authChecked) return null;
  if (!admin) return <AdminLoginPage onLogin={(user) => setAdmin(user)} />;

  const meta = PAGE_META[section] || PAGE_META.overview;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #080808; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to { transform: rotate(360deg); } }
        input, textarea, select { color-scheme: dark; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      {/* ✅ Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <LogoutConfirmationModal
            onConfirm={handleLogoutConfirm}
            onCancel={handleLogoutCancel}
          />
        )}
      </AnimatePresence>

      <div style={{
        display: "flex",
        height: "100vh",
        background: "#080808",
        overflow: "hidden",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}>
        {/* Desktop sidebar */}
        {!isMobile && (
          <AdminSidebar
            active={section}
            onNav={handleNav}
            onLogout={handleLogoutClick}
            admin={admin}
          />
        )}

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(3px)",
                zIndex: 200,
              }}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <AdminSidebar
                  active={section}
                  onNav={handleNav}
                  onLogout={handleLogoutClick}
                  admin={admin}
                  onClose={() => setSidebarOpen(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content area */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          marginBottom: "50px",
        }}>
          {/* Red accent top bar */}
          <div style={{
            height: 2,
            background: "linear-gradient(90deg,#ef4444,#7f1d1d 60%,transparent)",
            flexShrink: 0,
          }} />

          <div style={{
            flex: 1,
            overflowY: "auto",
            paddingInline: "clamp(16px,3vw,28px)",
            paddingBottom: "clamp(16px,3vw,28px)",
          }}>
            <AdminTopBar
              title={meta.title}
              subtitle={meta.subtitle}
              onMenuToggle={isMobile ? () => setSidebarOpen(true) : undefined}
            />

            {/* Section with animated transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <SectionContent section={section} onNav={handleNav} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}