import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Icon} from "./Components";
// These duplicated a broken local req() with no Authorization header, so
// every call from this page 401'd against RequireAdmin() — the whole page
// was non-functional. The shared api.js already has correctly-authenticated
// versions of the exact same endpoints; use those instead.
import {
  getRolePrivileges,
  saveRolePrivileges,
  getUserPrivileges,
  saveUserPrivileges,
  getUsers,
} from "./api";

const searchUsers = (q) => getUsers({search: q, limit: 10});

// ── All privilege definitions ──────────────────────────────────────────────────
const PRIVILEGE_GROUPS = [
  {
    group: "Store & Shopping",
    key: "store",
    privileges: [
      {key: "can_browse_shop", label: "Browse shop", desc: "Access the shop and view products"},
      {key: "can_purchase", label: "Make purchases", desc: "Add to cart and complete orders"},
      {key: "can_use_wishlist", label: "Use wishlist", desc: "Save items to wishlist"},
      {key: "can_write_reviews", label: "Write reviews", desc: "Leave product reviews and ratings"},
      {key: "can_view_order_history", label: "View order history", desc: "Access past orders"},
      {key: "can_request_refund", label: "Request refunds", desc: "Submit refund requests"},
    ],
  },
  {
    group: "Drops",
    key: "drops",
    privileges: [
      {key: "can_view_drops", label: "View drops", desc: "See the drops page and listings"},
      {key: "can_join_drops", label: "Join drops", desc: "Participate and purchase from drops"},
      {key: "can_create_drops", label: "Create drops", desc: "Schedule and publish new drops"},
      {key: "can_manage_drops", label: "Manage drops", desc: "Edit and delete existing drops"},
    ],
  },
  {
    group: "Brand",
    key: "brand",
    privileges: [
      {key: "can_create_brand", label: "Create brand", desc: "Register a new brand account"},
      {key: "can_manage_brand", label: "Manage own brand", desc: "Edit brand profile and settings"},
      {key: "can_list_products", label: "List products", desc: "Create and publish products"},
      {
        key: "can_manage_products",
        label: "Manage own products",
        desc: "Edit and remove own products",
      },
      {
        key: "can_view_brand_analytics",
        label: "View brand analytics",
        desc: "Access sales and view metrics",
      },
      // ── Tiered brand privileges — off by default; grant per-brand via the
      // "Individual" tab as a status upgrade rather than a role-wide default.
      {
        key: "featured_placement",
        label: "Featured placement",
        desc: "Eligible for the homepage 'top brands' rail and featured sections",
      },
      {
        key: "exclusive_brand_badge",
        label: "Exclusive brand badge",
        desc: "Shown in the site's Exclusive Brands section with a badge on their profile",
      },
      {
        key: "custom_storefront_branding",
        label: "Custom storefront branding",
        desc: "Can customize brand page banner/theme beyond the standard template",
      },
      {
        key: "reduced_commission",
        label: "Reduced commission eligibility",
        desc: "Eligible for a lower commission rate (set the actual rate on the brand's Commission tab)",
      },
      {
        key: "priority_support",
        label: "Priority support",
        desc: "Flagged for faster response on support requests",
      },
    ],
  },
  {
    group: "Content",
    key: "content",
    privileges: [
      {key: "can_view_blog", label: "View blog", desc: "Read blog posts"},
      {key: "can_write_blog", label: "Write blog posts", desc: "Create and publish blog content"},
      {key: "can_manage_blog", label: "Manage blog", desc: "Edit and delete any blog post"},
      {
        key: "can_moderate_reviews",
        label: "Moderate reviews",
        desc: "Flag and delete user reviews",
      },
    ],
  },
  {
    group: "Users & Accounts",
    key: "users",
    privileges: [
      {key: "can_view_users", label: "View users", desc: "See the user list"},
      {key: "can_edit_users", label: "Edit users", desc: "Modify user profiles"},
      {key: "can_ban_users", label: "Ban/unban users", desc: "Restrict or restore user access"},
      {key: "can_delete_users", label: "Delete users", desc: "Permanently remove accounts"},
      {key: "can_verify_users", label: "Verify users", desc: "Mark accounts as verified"},
    ],
  },
  {
    group: "Orders & Commerce",
    key: "commerce",
    privileges: [
      {key: "can_view_all_orders", label: "View all orders", desc: "See orders across all users"},
      {key: "can_update_orders", label: "Update order status", desc: "Change order status"},
      {key: "can_delete_orders", label: "Delete orders", desc: "Remove orders from system"},
      {key: "can_issue_refunds", label: "Issue refunds", desc: "Process refund requests"},
    ],
  },
  {
    group: "Admin & System",
    key: "admin",
    privileges: [
      {key: "can_access_admin", label: "Access admin dashboard", desc: "Log into the admin panel"},
      {
        key: "can_manage_site_pages",
        label: "Edit site pages",
        desc: "Update Home, About, Shop etc.",
      },
      {
        key: "can_send_notifications",
        label: "Send notifications",
        desc: "Broadcast messages to users",
      },
      {
        key: "can_manage_privileges",
        label: "Manage privileges",
        desc: "Grant/revoke permissions (super-admin only)",
      },
      {
        key: "can_manage_categories",
        label: "Manage categories",
        desc: "Create/edit product categories",
      },
    ],
  },
];

// Default privileges per role
const ROLE_DEFAULTS = {
  buyer: {
    can_browse_shop: true,
    can_purchase: true,
    can_use_wishlist: true,
    can_write_reviews: true,
    can_view_order_history: true,
    can_request_refund: true,
    can_view_drops: true,
    can_join_drops: true,
    can_view_blog: true,
  },
  brand: {
    can_browse_shop: true,
    can_purchase: true,
    can_use_wishlist: true,
    can_write_reviews: true,
    can_view_order_history: true,
    can_request_refund: true,
    can_view_drops: true,
    can_join_drops: true,
    can_create_drops: true,
    can_manage_drops: true,
    can_view_blog: true,
    can_create_brand: true,
    can_manage_brand: true,
    can_list_products: true,
    can_manage_products: true,
    can_view_brand_analytics: true,
  },
  employee: {
    can_browse_shop: true,
    can_view_drops: true,
    can_view_blog: true,
    can_view_users: true,
    can_edit_users: true,
    can_moderate_reviews: true,
    can_view_all_orders: true,
    can_update_orders: true,
    can_access_admin: true,
    can_manage_categories: true,
  },
  partner: {
    can_browse_shop: true,
    can_view_drops: true,
    can_view_blog: true,
    can_view_all_orders: true,
    can_update_orders: true,
  },
  admin: Object.fromEntries(
    PRIVILEGE_GROUPS.flatMap((g) => g.privileges.map((p) => [p.key, true])),
  ),
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({value, onChange, disabled}) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 99,
        background: value ? "#ef4444" : "rgba(255,255,255,0.1)",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
        border: `1px solid ${value ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
        opacity: disabled ? 0.4 : 1,
      }}>
      <motion.div
        animate={{x: value ? 20 : 2}}
        transition={{type: "spring", stiffness: 500, damping: 30}}
        style={{
          position: "absolute",
          top: 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}

// ── Privilege group card ──────────────────────────────────────────────────────
function PrivilegeGroup({group, privileges, values, onChange, overrides}) {
  const allOn = privileges.every((p) => values[p.key]);
  const someOn = privileges.some((p) => values[p.key]);

  const toggleAll = () => {
    const next = !allOn;
    privileges.forEach((p) => onChange(p.key, next));
  };

  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
      }}>
      {/* Group header */}
      <div
        style={{
          padding: "13px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        <div style={{display: "flex", alignItems: "center", gap: 10}}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: allOn ? "#ef4444" : someOn ? "#f59e0b" : "rgba(255,255,255,0.1)",
            }}
          />
          <p style={{color: "#fff", fontSize: 12, fontWeight: 800, margin: 0}}>{group}</p>
          <span style={{color: "rgba(255,255,255,0.25)", fontSize: 10}}>
            {privileges.filter((p) => values[p.key]).length}/{privileges.length}
          </span>
        </div>
        <button
          onClick={toggleAll}
          style={{
            padding: "4px 12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.45)",
            borderRadius: 99,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}>
          {allOn ? "Disable All" : "Enable All"}
        </button>
      </div>

      {/* Privilege rows */}
      {privileges.map((priv) => {
        const isOverride = overrides && overrides[priv.key] !== undefined;
        return (
          <div
            key={priv.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "11px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <Toggle value={!!values[priv.key]} onChange={(v) => onChange(priv.key, v)} />
            <div style={{flex: 1}}>
              <div style={{display: "flex", alignItems: "center", gap: 8}}>
                <p
                  style={{
                    color: values[priv.key] ? "#fff" : "rgba(255,255,255,0.4)",
                    fontSize: 12,
                    fontWeight: 700,
                    margin: 0,
                    transition: "color 0.15s",
                  }}>
                  {priv.label}
                </p>
                {isOverride && (
                  <span
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      color: "#ef4444",
                      fontSize: 8,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "2px 7px",
                      borderRadius: 99,
                    }}>
                    Override
                  </span>
                )}
              </div>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "2px 0 0"}}>
                {priv.desc}
              </p>
            </div>
            <span style={{fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.12)"}}>
              {priv.key}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Role tab privileges ───────────────────────────────────────────────────────
function RolePrivileges() {
  const ROLES = ["buyer", "brand", "employee", "partner", "admin"];
  const ROLE_COLORS = {
    buyer: "#3b82f6",
    brand: "#f59e0b",
    employee: "#22c55e",
    partner: "#a855f7",
    admin: "#ef4444",
  };

  const [activeRole, setActiveRole] = useState("buyer");
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getRolePrivileges()
      .then((d) => setValues(d?.[activeRole] || ROLE_DEFAULTS[activeRole] || {}))
      .catch(() => setValues(ROLE_DEFAULTS[activeRole] || {}));
  }, [activeRole]);

  const handleChange = (key, val) => setValues((v) => ({...v, [key]: val}));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRolePrivileges(activeRole, values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleReset = () => setValues(ROLE_DEFAULTS[activeRole] || {});

  const color = ROLE_COLORS[activeRole];

  return (
    <div>
      {/* Role tabs */}
      <div style={{display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap"}}>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRole(r)}
            style={{
              padding: "8px 18px",
              borderRadius: 99,
              border: `1px solid ${activeRole === r ? ROLE_COLORS[r] + "60" : "rgba(255,255,255,0.1)"}`,
              background: activeRole === r ? `${ROLE_COLORS[r]}15` : "transparent",
              color: activeRole === r ? ROLE_COLORS[r] : "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.15s",
            }}>
            {r}
          </button>
        ))}
      </div>

      {/* Description */}
      <div
        style={{
          background: `${color}0a`,
          border: `1px solid ${color}20`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 18,
        }}>
        <p style={{color: `${color}cc`, fontSize: 12, fontWeight: 700, margin: "0 0 3px"}}>
          {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Role — Default Privileges
        </p>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>
          These apply to all {activeRole}s. Individual users can have overrides set in the
          "Individual" tab.
          {activeRole === "admin" && " ⚠️ Admin privileges are critical — change with care."}
        </p>
      </div>

      {/* Privilege groups */}
      {PRIVILEGE_GROUPS.map((g) => (
        <PrivilegeGroup
          key={g.key}
          group={g.group}
          privileges={g.privileges}
          values={values}
          onChange={handleChange}
        />
      ))}

      {/* Save bar */}
      <div style={{display: "flex", gap: 10, marginTop: 6, position: "sticky", bottom: 20}}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 28px",
            background: saved ? "#22c55e" : saving ? "#7f1d1d" : "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "background 0.2s",
          }}>
          {saved
            ? "✓ Saved!"
            : saving
              ? "Saving..."
              : `Save ${activeRole.charAt(0).toUpperCase() + activeRole.slice(1)} Privileges`}
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "12px 20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}>
          Reset to Default
        </button>
      </div>
    </div>
  );
}

// ── Individual user privileges ────────────────────────────────────────────────
function IndividualPrivileges() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [baseRole, setBaseRole] = useState("buyer");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const d = await searchUsers(query);
      setResults(d?.users || d || []);
    } catch (e) {
      console.error(e);
      setResults([]);
    }
    setSearching(false);
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    // API returns account_type ("user"/"brand"), not "role" — and this UI's
    // role keys call the buyer account type "buyer", not "user". Reading the
    // nonexistent .role field always fell back to "buyer", so selecting a
    // brand account silently diffed its overrides against buyer defaults.
    setBaseRole(user.account_type === "brand" ? "brand" : "buyer");
    setResults([]);
    setQuery(user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email);
    try {
      const d = await getUserPrivileges(user.id);
      setOverrides(d?.overrides || {});
    } catch (e) {
      setOverrides({});
    }
  };

  const handleChange = (key, val) => {
    const roleDefault = ROLE_DEFAULTS[baseRole]?.[key];
    if (val === roleDefault || (val === false && !roleDefault)) {
      // Same as role default — remove override
      setOverrides((o) => {
        const n = {...o};
        delete n[key];
        return n;
      });
    } else {
      setOverrides((o) => ({...o, [key]: val}));
    }
  };

  // Merged view: role defaults + individual overrides
  const effectiveValues = {...(ROLE_DEFAULTS[baseRole] || {}), ...overrides};

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await saveUserPrivileges(selectedUser.id, {overrides});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleClearOverrides = () => setOverrides({});

  const overrideCount = Object.keys(overrides).length;

  return (
    <div>
      {/* User search */}
      <div style={{marginBottom: 20}}>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "0 0 10px"}}>
          Search for a specific user to view and override their privileges individually.
        </p>
        <div style={{display: "flex", gap: 10, position: "relative"}}>
          <div style={{position: "relative", flex: 1}}>
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name or email..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 13,
                padding: "10px 14px 10px 36px",
                borderRadius: 9,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {/* Autocomplete dropdown */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{opacity: 0, y: -6}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: -6}}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    overflow: "hidden",
                    zIndex: 100,
                    boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                  }}>
                  {results.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 2px"}}>
                        {u.first_name} {u.last_name}
                      </p>
                      <p style={{color: "rgba(255,255,255,0.35)", fontSize: 10, margin: 0}}>
                        {u.email} · {u.account_type}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              padding: "10px 20px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
            {searching ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Selected user info */}
      {selectedUser && (
        <motion.div initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}}>
          {/* User card */}
          <div
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}>
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#ef4444,#7f1d1d)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: 900,
                  color: "#fff",
                  flexShrink: 0,
                }}>
                {selectedUser.first_name?.[0] || selectedUser.email?.[0] || "?"}
              </div>
              <div>
                <p style={{color: "#fff", fontSize: 13, fontWeight: 800, margin: 0}}>
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
                <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0}}>
                  {selectedUser.email}
                </p>
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 10}}>
              {overrideCount > 0 && (
                <span
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: 99,
                  }}>
                  {overrideCount} override{overrideCount !== 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={handleClearOverrides}
                style={{
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.4)",
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}>
                Clear Overrides
              </button>
            </div>
          </div>

          {/* Legend */}
          <div style={{display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap"}}>
            {[
              {dot: "rgba(255,255,255,0.15)", label: "Role default (no override)"},
              {dot: "#ef4444", label: "Override active"},
            ].map(({dot, label}) => (
              <div key={label} style={{display: "flex", alignItems: "center", gap: 6}}>
                <div style={{width: 8, height: 8, borderRadius: "50%", background: dot}} />
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>{label}</span>
              </div>
            ))}
          </div>

          {/* Privilege groups */}
          {PRIVILEGE_GROUPS.map((g) => (
            <PrivilegeGroup
              key={g.key}
              group={g.group}
              privileges={g.privileges}
              values={effectiveValues}
              onChange={handleChange}
              overrides={overrides}
            />
          ))}

          {/* Save bar */}
          <div style={{display: "flex", gap: 10, marginTop: 6}}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "12px 28px",
                background: saved ? "#22c55e" : saving ? "#7f1d1d" : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}>
              {saved ? "✓ Saved!" : saving ? "Saving..." : "Save User Overrides"}
            </button>
            <button
              onClick={handleClearOverrides}
              style={{
                padding: "12px 20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Reset to Role Default
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!selectedUser && (
        <div style={{textAlign: "center", padding: "50px 20px"}}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}>
            <Icon name="users" size={22} color="rgba(239,68,68,0.5)" />
          </div>
          <p
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 13,
              fontWeight: 600,
              margin: "0 0 6px",
            }}>
            No user selected
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, margin: 0}}>
            Search above to find a user and set individual privilege overrides
          </p>
        </div>
      )}
    </div>
  );
}

// ── Root Privileges page ──────────────────────────────────────────────────────
export default function AdminPrivileges() {
  const [tab, setTab] = useState("roles");

  return (
    <div>
      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
        }}>
        {[
          {id: "roles", label: "By Role", desc: "Set defaults for all users of a role"},
          {
            id: "individual",
            label: "By Individual",
            desc: "Override privileges for a specific user",
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.desc}
            style={{
              padding: "9px 20px",
              borderRadius: 9,
              border: "none",
              background: tab === t.id ? "#ef4444" : "transparent",
              color: tab === t.id ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{opacity: 0, y: 8}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0}}
          transition={{duration: 0.15}}>
          {tab === "roles" ? <RolePrivileges /> : <IndividualPrivileges />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
