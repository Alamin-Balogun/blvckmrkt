import {useState, useEffect, useRef} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {useAuth} from "../../../Auth/context/authcontext";
import ImageUpload from "../../../../components/ImageUpload";
import PhoneInput from "../../../../components/phoneinput";

import Sidebar from "./dashboard_components/sidebar";
import TopBar from "./dashboard_components/topbar";
import Overview from "./dashboard_components/overview";
import Orders from "./Orders";
import Messages from "./Messages";
import Wishlist from "./Wishlist";
import Shop from "./Shop";
import Addresses from "./Addresses";
import Notifications from "./Notifications";
import Settings from "./Settings";

import {
  getBuyerProfile,
  updateProfile,
  getNotifications,
  markOneRead,
  markBroadcastRead,
  markAllRead,
} from "../dashboard/dashboard_components/api";

const PAGE_TITLES = {
  overview: "Overview",
  orders: "My Orders",
  messages: "Messages",
  wishlist: "Wishlist",
  shop: "Shop",
  addresses: "Addresses",
  notifications: "Notifications",
  settings: "Settings",
};

function getMissingFields(profile) {
  if (!profile) return [];
  const missing = [];
  if (!profile.phone || profile.phone.trim() === "") missing.push("phone");
  if (!profile.avatar_url || profile.avatar_url.trim() === "") missing.push("avatar_url");
  return missing;
}

// ── Logout Confirmation Modal ─────────────────────────────────────────────────
function LogoutConfirmationModal({onConfirm, onCancel}) {
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
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
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
      }}>
      <motion.div
        initial={{opacity: 0, scale: 0.94, y: 20}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.94, y: 20}}
        transition={{type: "spring", stiffness: 280, damping: 28}}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}>
        {success ? (
          // Success State
          <div style={{padding: "40px 32px", textAlign: "center"}}>
            <motion.div
              initial={{scale: 0}}
              animate={{scale: 1}}
              transition={{type: "spring", stiffness: 300, damping: 22}}
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
              }}>
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "1.5rem",
                color: "#22c55e",
                letterSpacing: "0.06em",
                margin: "0 0 8px",
              }}>
              LOGGED OUT SUCCESSFULLY
            </p>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0}}>
              Redirecting you to homepage...
            </p>
          </div>
        ) : (
          // Confirmation State
          <>
            <div
              style={{
                height: 3,
                background: "linear-gradient(90deg,#ef4444,#ff6b6b,transparent)",
              }}
            />
            <div style={{padding: "32px 28px"}}>
              <div
                style={{
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
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "1.6rem",
                  color: "#fff",
                  letterSpacing: "0.06em",
                  textAlign: "center",
                  margin: "0 0 10px",
                }}>
                LOG OUT?
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  textAlign: "center",
                  margin: "0 0 24px",
                }}>
                Are you sure you want to log out of your buyer account?
              </p>
              <div style={{display: "flex", gap: 10}}>
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
                  }}>
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
                  }}>
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                          display: "inline-block",
                        }}
                      />
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

// ── Profile Completion Popup ──────────────────────────────────────────────────
function ProfileCompletePopup({profile, onDone, onSkip}) {
  const missing = getMissingFields(profile);
  const needPhone = missing.includes("phone");
  const needAvatar = missing.includes("avatar_url");
  const [form, setForm] = useState({
    phone: profile?.phone || "",
    avatar_url: profile?.avatar_url || "",
  });
  const [saving, setSaving] = useState(false);

  const filledMissing = missing.filter((f) => form[f] && form[f].trim() !== "").length;
  const pct = missing.length === 0 ? 100 : Math.round((filledMissing / missing.length) * 100);
  const missingLabels = missing
    .map((f) => (f === "phone" ? "Phone Number" : "Profile Photo"))
    .join(" & ");

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        email: profile?.email,
        phone: form.phone,
        avatar_url: form.avatar_url,
      });
      onDone(updated);
    } catch (e) {
      onDone({...profile, phone: form.phone, avatar_url: form.avatar_url});
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
      <motion.div
        initial={{opacity: 0, scale: 0.94, y: 20}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.94, y: 20}}
        transition={{type: "spring", stiffness: 280, damping: 28}}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
        }}>
        <div
          style={{height: 3, background: "linear-gradient(90deg,#ef4444,#ff6b6b,transparent)"}}
        />
        <div
          style={{
            padding: "24px 28px 0",
            background: "linear-gradient(180deg,rgba(239,68,68,0.06) 0%,transparent 100%)",
          }}>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              lineHeight: 1.6,
              marginBottom: 16,
            }}>
            Your account is missing:{" "}
            <span style={{color: "rgba(255,255,255,0.75)", fontWeight: 600}}>{missingLabels}</span>.
          </p>
          <div style={{marginBottom: 20}}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: 5}}>
              <span
                style={{
                  color: "rgba(255,255,255,0.25)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}>
                Profile completion
              </span>
              <span style={{color: "#ef4444", fontSize: 10, fontWeight: 800}}>{pct}%</span>
            </div>
            <div
              style={{
                height: 4,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 99,
                overflow: "hidden",
              }}>
              <motion.div
                animate={{width: `${pct}%`}}
                transition={{duration: 0.4}}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg,#ef4444,#ff6b6b)",
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        </div>
        <div style={{padding: "0 28px 24px", display: "flex", flexDirection: "column", gap: 10}}>
          {needPhone && (
            <div>
              <label
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 5,
                }}>
                Phone Number
              </label>
              <PhoneInput value={form.phone} onChange={(val) => setForm({...form, phone: val})} />
            </div>
          )}
          {needAvatar && (
            <div>
              <label
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 5,
                }}>
                Profile Photo (optional)
              </label>
              <div style={{display: "flex", alignItems: "center", gap: 14}}>
                <ImageUpload
                  folder="avatars"
                  shape="circle"
                  label="Upload Photo"
                  preview={form.avatar_url}
                  onUpload={(url) => setForm({...form, avatar_url: url})}
                />
                <p
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    fontSize: 11,
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                  Click the circle to upload your profile photo. JPEG, PNG or WebP — max 5MB.
                </p>
              </div>
            </div>
          )}
          <div style={{display: "flex", gap: 10, marginTop: 6}}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                background: saving ? "#7f1d1d" : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "13px",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
              }}>
              {saving ? "Saving..." : "Save & Continue →"}
            </button>
            <button
              onClick={onSkip}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.35)",
                borderRadius: 9,
                padding: "13px 18px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Skip
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Access Restricted ─────────────────────────────────────────────────────────
function AccessRestricted({message, onLogout}) {
  return (
    <div
      style={{
        height: "100vh",
        background: "#070707",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        style={{
          maxWidth: 400,
          width: "100%",
          background: "#0f0f0f",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 20,
          padding: "36px 28px",
          textAlign: "center",
        }}>
        <p
          style={{
            color: "#ef4444",
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}>
          Access Denied
        </p>
        <h2
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: "1.9rem",
            color: "#fff",
            letterSpacing: "0.04em",
            lineHeight: 1.1,
            marginBottom: 14,
          }}>
          WRONG <span style={{color: "#ef4444"}}>DASHBOARD</span>
        </h2>
        <p
          style={{color: "rgba(255,255,255,0.4)", fontSize: 13, lineHeight: 1.7, marginBottom: 28}}>
          {message || "This dashboard is restricted to buyer accounts."}
        </p>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "13px",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}>
          Log Out &amp; Switch Account
        </button>
      </motion.div>
    </div>
  );
}

// ── Root Dashboard ────────────────────────────────────────────────────────────
export default function BuyerDashboard() {
  const {user: authUser, logout} = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [notifs, setNotifs] = useState([]);
  const [showProfilePop, setShowProfilePop] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [openNotifId, setOpenNotifId] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // ✅ NEW
  const pollRef = useRef(null);

  useEffect(() => {
    getBuyerProfile()
      .then((profile) => {
        setCurrentUser(profile);
        if (getMissingFields(profile).length > 0) setTimeout(() => setShowProfilePop(true), 800);
      })
      .catch((err) => {
        if (err.message?.toLowerCase().includes("restricted")) setAccessError(err.message);
        else setCurrentUser(authUser);
      });
  }, []);

  const loadNotifs = () => {
    getNotifications()
      .then((data) => setNotifs(data?.notifications || []))
      .catch(() => {});
  };
  useEffect(() => {
    loadNotifs();
    pollRef.current = setInterval(loadNotifs, 60000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleMarkOneRead = async (notif) => {
    setNotifs((prev) => prev.map((n) => (n.id === notif.id ? {...n, is_read: true} : n)));
    try {
      if (notif.kind === "broadcast") {
        await markBroadcastRead(notif.id);
      } else {
        await markOneRead(notif.id);
      }
    } catch (e) {
      console.error(e);
      setNotifs((prev) => prev.map((n) => (n.id === notif.id ? {...n, is_read: false} : n)));
    }
  };

  const handleMarkAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({...n, is_read: true})));
    try {
      await markAllRead();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoToNotification = (notif) => {
    if (!notif.is_read) handleMarkOneRead(notif);
    setOpenNotifId(notif.id);
    goTo("notifications");
  };

  const goTo = (s) => setActiveSection(s);

  const handleProfileDone = (updatedProfile) => {
    setShowProfilePop(false);
    if (updatedProfile) setCurrentUser((prev) => ({...prev, ...updatedProfile}));
  };

  const handleUserUpdate = (updatedProfile) => {
    if (updatedProfile) setCurrentUser((prev) => ({...prev, ...updatedProfile}));
  };

  // ✅ NEW — Show logout confirmation modal
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  // ✅ NEW — Confirm logout (modal handles redirect)
  const handleLogoutConfirm = async () => {
    await logout();
  };

  // ✅ NEW — Cancel logout
  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const displayUser = currentUser || authUser;
  const unreadCount = notifs.filter((n) => !n.is_read).length;

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <Overview user={displayUser} onNav={goTo} />;
      case "orders":
        return <Orders />;
      case "messages":
        return <Messages />;
      case "wishlist":
        return <Wishlist />;
      case "shop":
        return <Shop />;
      case "addresses":
        return <Addresses />;
      case "settings":
        return <Settings user={displayUser} onUserUpdate={handleUserUpdate} />;
      case "notifications":
        return (
          <Notifications
            autoOpenId={openNotifId}
            onClearOpen={() => setOpenNotifId(null)}
            notifications={notifs}
            onNotificationsUpdate={(updated) => setNotifs(updated)}
          />
        );
      default:
        return <Overview user={displayUser} onNav={goTo} />;
    }
  };

  if (accessError) return <AccessRestricted message={accessError} onLogout={logout} />;

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "#070707",
        fontFamily: "system-ui,sans-serif",
        display: "flex",
      }}>
      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media(min-width:769px) { .dash-sidebar-desktop { display:block !important; } }
        @media(max-width:768px) { .dash-main { padding-left:0 !important; padding-right:0 !important; } }
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

      <AnimatePresence>
        {showProfilePop && displayUser && (
          <ProfileCompletePopup
            profile={displayUser}
            onDone={handleProfileDone}
            onSkip={() => setShowProfilePop(false)}
          />
        )}
      </AnimatePresence>

      <div style={{display: "none"}} className="dash-sidebar-desktop">
        <Sidebar
          active={activeSection}
          onNav={goTo}
          user={displayUser}
          onLogout={handleLogoutClick} // ✅ CHANGED
          unreadCount={unreadCount}
        />
      </div>

      <main
        className="dash-main"
        style={{flex: 1, minWidth: 0, height: "100vh", overflowY: "auto", padding: "0 0 60px"}}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "#070707",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "19.5px 32px",
          }}>
          <TopBar
            title={PAGE_TITLES[activeSection]}
            user={displayUser}
            notifications={notifs}
            onMarkAllRead={handleMarkAllRead}
            onMarkOneRead={handleMarkOneRead}
            onGoToNotifications={() => {
              setOpenNotifId(null);
              goTo("notifications");
            }}
            onGoToNotification={handleGoToNotification}
            onNav={goTo}
            onLogout={handleLogoutClick} // ✅ CHANGED
            activeNav={activeSection}
          />
        </div>

        <div style={{maxWidth: 1200, margin: "0 auto", padding: "28px 32px 0"}}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -6}}
              transition={{duration: 0.2}}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
