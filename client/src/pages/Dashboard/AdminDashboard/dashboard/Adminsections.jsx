import {useState, useEffect} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {
  getProducts,
  getProduct,
  getBrands,
  createProduct,
  updateProduct,
  deleteProduct,
  getDrops,
  getDrop,
  createDrop,
  updateDrop,
  deleteDrop,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getReviews,
  getReview,
  deleteReview,
  flagReview,
  addReviewComment,
  deleteReviewComment,
  getUsers,
  getNotifications,
  sendNotification,
  deleteNotification,
  getSubscriptions,
  updateSubscription,
  listSitePages,
  getSitePage,
  updateSitePage,
  getNewsletterSubscribers,
  deleteNewsletterSubscriber,
  updateNewsletterSubscriber,
  getSubscriptionPlans,
  getAdminSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getNewsletters,
  createNewsletter,
  updateNewsletter,
  sendNewsletter,
  deleteNewsletter,
} from "./dashboard_components/api";
import {AdminTable, Badge, SearchBar, ConfirmModal, Icon, StatCard} from "./Components";
import ImageUpload from "../../../../components/ImageUpload";

// ── Date formatting helper ────────────────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return "—";
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Invalid date";
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Relative time for recent dates
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Absolute date for older items
  const options = { 
    month: 'short', 
    day: 'numeric', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  };
  
  return date.toLocaleDateString('en-US', options);
}

// ── Shared inline form modal ──────────────────────────────────────────────────
function FormModal({title, fields, values, onChange, onSave, onClose, saving}) {
  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
        initial={{opacity: 0, scale: 0.94, y: 16}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.94, y: 16}}
        transition={{type: "spring", stiffness: 300, damping: 28}}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}>
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <h3 style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Icon name="x" size={11} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        <div style={{padding: "16px 24px 22px", display: "flex", flexDirection: "column", gap: 12}}>
          {fields.map((f) => (
            <div key={f.key}>
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
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  value={values[f.key] || ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 13,
                    padding: "10px 13px",
                    borderRadius: 9,
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              ) : f.type === "select" ? (
                <select
                  value={values[f.key] || ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 13,
                    padding: "10px 13px",
                    borderRadius: 9,
                    outline: "none",
                    fontFamily: "inherit",
                  }}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type || "text"}
                  value={values[f.key] || ""}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 13,
                    padding: "10px 13px",
                    borderRadius: 9,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              )}
            </div>
          ))}
          <div style={{display: "flex", gap: 10, marginTop: 4}}>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                flex: 1,
                background: saving ? "#7f1d1d" : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "12px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.18s",
              }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "12px 20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
const PRODUCT_STATUS_COLOR = {
  active: "#22c55e",
  draft: "#f59e0b",
  archived: "#6b7280",
};

// ── Product detail drawer ─────────────────────────────────────────────────────
function ProductDrawer({productId, onClose, onEdit, onDelete}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImgIdx(0);
    getProduct(productId)
      .then((d) => {
        if (!cancelled) setData(d?.product || d);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const p = data;
  const images = p?.images || p?.Images || [];
  const sizes = p?.sizes || p?.Sizes || [];
  const totalStock = sizes.reduce((sum, s) => sum + (s.stock || 0), 0);

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(3px)",
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(500px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          {loading ? (
            <div
              style={{
                height: 36,
                width: 160,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 7,
                animation: "pulse 1.4s infinite",
              }}
            />
          ) : (
            <div>
              <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>{p?.name}</p>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>
                {p?.brand_name || `Brand #${p?.brand_id}`}
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
            }}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{padding: 22, display: "flex", flexDirection: "column", gap: 10}}>
            {Array.from({length: 6}).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 32,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  animation: "pulse 1.4s infinite",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{padding: "18px 22px", flex: 1}}>
            {images.length > 0 && (
              <div style={{marginBottom: 18}}>
                <img
                  src={images[imgIdx]?.url}
                  alt=""
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginBottom: 8,
                  }}
                />
                {images.length > 1 && (
                  <div style={{display: "flex", gap: 6, overflowX: "auto"}}>
                    {images.map((img, i) => (
                      <img
                        key={img.id}
                        src={img.url}
                        alt=""
                        onClick={() => setImgIdx(i)}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: 6,
                          cursor: "pointer",
                          border: `2px solid ${imgIdx === i ? "#ef4444" : "transparent"}`,
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap"}}>
              <Badge
                label={p?.status || "draft"}
                color={PRODUCT_STATUS_COLOR[p?.status] || "#6b7280"}
              />
              {p?.is_featured && <Badge label="★ Featured" color="#f59e0b" />}
              {p?.in_drop && (
                <span
                  title={p.drop_name ? `In drop: ${p.drop_name}` : "In a drop"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(168,85,247,0.15)",
                    border: "1px solid rgba(168,85,247,0.35)",
                    color: "#c084fc",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "3px 9px",
                    borderRadius: 99,
                  }}>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#a855f7",
                      boxShadow: "0 0 6px #a855f7",
                    }}
                  />
                  {p.drop_name ? `DROP · ${p.drop_name}` : "IN DROP"}
                </span>
              )}
            </div>

            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 4px",
              }}>
              Pricing
            </p>
            <div style={{display: "flex", gap: 16, marginBottom: 16}}>
              <div>
                <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, margin: "0 0 2px"}}>
                  PRICE
                </p>
                <p style={{color: "#22c55e", fontSize: 18, fontWeight: 900, margin: 0}}>
                  ₦{Number(p?.price || 0).toLocaleString()}
                </p>
              </div>
              {p?.compare_price > 0 && (
                <div>
                  <p style={{color: "rgba(255,255,255,0.3)", fontSize: 9, margin: "0 0 2px"}}>
                    COMPARE AT
                  </p>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: 18,
                      fontWeight: 900,
                      margin: 0,
                      textDecoration: "line-through",
                    }}>
                    ₦{Number(p.compare_price).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {sizes.length > 0 && (
              <>
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "0 0 8px",
                  }}>
                  Sizes & Stock · {totalStock} total
                </p>
                <div style={{display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16}}>
                  {sizes.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: "6px 12px",
                        textAlign: "center",
                      }}>
                      <p style={{color: "#fff", fontSize: 12, fontWeight: 700, margin: 0}}>
                        {s.size}
                      </p>
                      <p
                        style={{
                          color: s.stock === 0 ? "#ef4444" : "#22c55e",
                          fontSize: 10,
                          margin: 0,
                        }}>
                        {s.stock} in stock
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {p?.description && (
              <>
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "0 0 6px",
                  }}>
                  Description
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}>
                  {p.description}
                </p>
              </>
            )}

            {p?.tags && (
              <>
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "0 0 6px",
                  }}>
                  Tags
                </p>
                <div style={{display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16}}>
                  {p.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.4)",
                          fontSize: 10,
                          padding: "3px 9px",
                          borderRadius: 99,
                        }}>
                        {tag}
                      </span>
                    ))}
                </div>
              </>
            )}

            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 4px",
              }}>
              Info
            </p>
            {[
              ["Slug", p?.slug],
              ["Brand ID", p?.brand_id],
              ["Category ID", p?.category_id || "—"],
              [
                "Created",
                p?.created_at
                  ? new Date(p.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              ],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>{label}</span>
                <span
                  style={{color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "monospace"}}>
                  {val ?? "—"}
                </span>
              </div>
            ))}

            <div style={{marginTop: 20, display: "flex", flexDirection: "column", gap: 8}}>
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                }}>
                Actions
              </p>
              <button
                onClick={() => onEdit(p)}
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.7)",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}>
                ✏️ Edit Product
              </button>
              <button
                onClick={() => onDelete(p)}
                style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "rgba(239,68,68,0.6)",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}>
                🗑 Delete Product
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Product create/edit modal ─────────────────────────────────────────────────
function ProductModal({mode, data, onChange, onSave, onClose, saving, brands, categories}) {
  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 13,
    padding: "10px 13px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
  };
  const sel = {...inp, background: "#1a1a1a"};
  const lbl = {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 5,
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
        initial={{opacity: 0, scale: 0.94, y: 16}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.94}}
        transition={{type: "spring", stiffness: 300, damping: 28}}
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          overflow: "hidden",
          maxHeight: "90vh",
          overflowY: "auto",
        }}>
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />
        <div
          style={{
            padding: "20px 24px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <h3 style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
            {mode === "create" ? "New Product" : "Edit Product"}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
            }}>
            ✕
          </button>
        </div>
        <div style={{padding: "16px 24px 22px", display: "flex", flexDirection: "column", gap: 12}}>
          <div>
            <label style={lbl}>Brand *</label>
            <select
              value={data.brand_id || ""}
              onChange={(e) => onChange("brand_id", Number(e.target.value))}
              style={sel}>
              <option value="">Select a brand...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Product Name *</label>
            <input
              type="text"
              value={data.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Oversized Tee"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea
              value={data.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              rows={3}
              style={{...inp, resize: "vertical"}}
            />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            <div>
              <label style={lbl}>Price (₦) *</label>
              <input
                type="number"
                value={data.price || ""}
                onChange={(e) => onChange("price", parseFloat(e.target.value) || 0)}
                placeholder="0"
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Compare Price (₦)</label>
              <input
                type="number"
                value={data.compare_price || ""}
                onChange={(e) => onChange("compare_price", parseFloat(e.target.value) || 0)}
                placeholder="0"
                style={inp}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select
              value={data.category_id || ""}
              onChange={(e) =>
                onChange("category_id", e.target.value ? Number(e.target.value) : null)
              }
              style={sel}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Tags (comma-separated)</label>
            <input
              type="text"
              value={data.tags || ""}
              onChange={(e) => onChange("tags", e.target.value)}
              placeholder="e.g. streetwear, tee, oversized"
              style={inp}
            />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            <div>
              <label style={lbl}>Status</label>
              <select
                value={data.status || "draft"}
                onChange={(e) => onChange("status", e.target.value)}
                style={sel}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Featured</label>
              <select
                value={data.is_featured ? "true" : "false"}
                onChange={(e) => onChange("is_featured", e.target.value === "true")}
                style={sel}>
                <option value="false">No</option>
                <option value="true">Yes — Feature this</option>
              </select>
            </div>
          </div>
          {/* Product Images Upload */}
          <div>
            <label style={lbl}>Product Images</label>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "0 0 8px"}}>
              Upload up to 4 images. First image becomes the primary/cover image.
            </p>
            <div style={{display: "flex", gap: 10, flexWrap: "wrap"}}>
              {[0, 1, 2, 3].map((pos) => {
                const existing = (data.images || []).find((img) => img.position === pos);
                return (
                  <div key={pos} style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 4}}>
                    <ImageUpload
                      folder="products"
                      shape="square"
                      label={pos === 0 ? "Primary" : `Image ${pos + 1}`}
                      preview={existing?.url || ""}
                      onUpload={(url) => {
                        const imgs = [...(data.images || [])].filter((i) => i.position !== pos);
                        imgs.push({url, position: pos});
                        imgs.sort((a, b) => a.position - b.position);
                        onChange("images", imgs);
                      }}
                    />
                    <span style={{color: "rgba(255,255,255,0.25)", fontSize: 9, letterSpacing: "0.1em"}}>
                      {pos === 0 ? "PRIMARY" : `#${pos + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{display: "flex", gap: 10, marginTop: 4}}>
            <button
              onClick={onSave}
              disabled={saving || !data.brand_id || !data.name || !data.price}
              style={{
                flex: 1,
                background: saving
                  ? "#7f1d1d"
                  : !data.brand_id || !data.name || !data.price
                    ? "rgba(239,68,68,0.3)"
                    : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "12px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}>
              {saving ? "Saving..." : mode === "create" ? "Create Product" : "Save Changes"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "12px 20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getBrands({limit: 200})
      .then((d) => setBrands(d?.brands || []))
      .catch(console.error);
    getCategories()
      .then((d) => setCategories(d?.categories || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = {limit: 25};
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    getProducts(params)
      .then((d) => {
        if (!cancelled) {
          setProducts(d?.products || []);
          setTotal(d?.total ?? 0);
        }
      })
      .catch((e) => {
        if (!cancelled) console.error(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, refreshKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.mode === "create") await createProduct(modal.data);
      else await updateProduct(modal.data.id, modal.data);
      setModal(null);
      setRefreshKey((k) => k + 1); // re-trigger fetch
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const id = confirm?.id;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      console.error(e);
    }
    setConfirm(null);
    setSelectedId(null);
  };

  const openEdit = (p) => {
    setSelectedId(null);
    setModal({
      mode: "edit",
      data: {
        id: p.id,
        brand_id: p.brand_id,
        name: p.name,
        description: p.description || "",
        price: p.price,
        compare_price: p.compare_price || 0,
        category_id: p.category_id || null,
        tags: p.tags || "",
        is_featured: p.is_featured || false,
        status: p.status || "draft",
      },
    });
  };

  const cols = [
    {
      key: "img",
      label: "",
      render: (p) => {
        const img = (p.images || p.Images || [])[0]?.url;
        const ring = p.in_drop ? "0 0 0 2px #a855f7" : "none";
        return img ? (
          <img
            src={img}
            alt=""
            style={{width: 38, height: 38, borderRadius: 7, objectFit: "cover", boxShadow: ring}}
          />
        ) : (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 7,
              background: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.65rem",
              color: "#ef4444",
              fontWeight: 900,
              boxShadow: ring,
            }}>
            IMG
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Product",
      render: (p) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>{p.name}</p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
            {p.brand_name || `Brand #${p.brand_id}`}
          </p>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (p) => (
        <div>
          <span style={{color: "#22c55e", fontWeight: 700, fontSize: 12}}>
            ₦{Number(p.price).toLocaleString()}
          </span>
          {p.compare_price > 0 && (
            <span
              style={{
                color: "#6b7280",
                fontSize: 10,
                marginLeft: 5,
                textDecoration: "line-through",
              }}>
              ₦{Number(p.compare_price).toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (p) => {
        const sizes = p.sizes || p.Sizes || [];
        const tot = sizes.reduce((s, sz) => s + (sz.stock || 0), 0);
        return sizes.length === 0 ? (
          <span style={{color: "rgba(255,255,255,0.2)", fontSize: 11}}>—</span>
        ) : (
          <span
            style={{
              color: tot === 0 ? "#ef4444" : tot < 5 ? "#f59e0b" : "#22c55e",
              fontWeight: 700,
              fontSize: 12,
            }}>
            {tot}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <div style={{display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center"}}>
          <Badge label={p.status || "draft"} color={PRODUCT_STATUS_COLOR[p.status] || "#6b7280"} />
          {p.is_featured && <Badge label="★ Featured" color="#f59e0b" />}
          {p.in_drop && (
            <span
              title={p.drop_name ? `In drop: ${p.drop_name}` : "In a drop"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                background: "rgba(168,85,247,0.15)",
                border: "1px solid rgba(168,85,247,0.35)",
                color: "#c084fc",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "2px 7px",
                borderRadius: 99,
              }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#a855f7",
                  flexShrink: 0,
                  boxShadow: "0 0 5px #a855f7",
                }}
              />
              DROP
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (p) => (
        <div style={{display: "flex", gap: 6}} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEdit(p)}
            style={{
              padding: "5px 10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Edit
          </button>
          <button
            onClick={() => setConfirm(p)}
            style={{
              padding: "5px 10px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "rgba(239,68,68,0.6)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AnimatePresence>
        {selectedId && (
          <ProductDrawer
            productId={selectedId}
            onClose={() => setSelectedId(null)}
            onEdit={openEdit}
            onDelete={(p) => {
              setSelectedId(null);
              setConfirm(p);
            }}
          />
        )}
        {modal && (
          <ProductModal
            mode={modal.mode}
            data={modal.data}
            onChange={(k, v) => setModal((m) => ({...m, data: {...m.data, [k]: v}}))}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
            brands={brands}
            categories={categories}
          />
        )}
        {confirm && (
          <ConfirmModal
            title="Delete Product"
            message={`Permanently delete "${confirm.name}"? This cannot be undone.`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      <div style={{marginBottom: 12}}>
        <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
          {[
            {v: "", l: "All"},
            {v: "active", l: "Active"},
            {v: "draft", l: "Draft"},
            {v: "archived", l: "Archived"},
          ].map(({v, l}) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${statusFilter === v ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: statusFilter === v ? "rgba(239,68,68,0.1)" : "transparent",
                color: statusFilter === v ? "#ef4444" : "rgba(255,255,255,0.4)",
                transition: "all 0.15s",
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by product name..."
        actions={
          <button
            onClick={() => setModal({mode: "create", data: {status: "draft", is_featured: false}})}
            style={{
              padding: "10px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              borderRadius: 9,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
            + New Product
          </button>
        }
      />

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} product{total !== 1 ? "s" : ""}
            {statusFilter && ` · ${statusFilter}`}
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
            Click a row to view details
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={products}
          loading={loading}
          onRowClick={(p) => setSelectedId(p.id)}
          emptyMsg="No products found."
        />
      </div>
    </div>
  );
}

// ── DROPS ─────────────────────────────────────────────────────────────────────
const DROP_STATUS_COLOR = {
  scheduled: "#3b82f6",
  live: "#22c55e",
  ended: "#6b7280",
};

function fmtDateTime(iso) {
  if (!iso || iso.startsWith("0000")) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return (
    d.toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"}) +
    " " +
    d.toLocaleTimeString("en-GB", {hour: "2-digit", minute: "2-digit"})
  );
}

// ── Drop detail drawer ────────────────────────────────────────────────────────
function DropDrawer({dropId, onClose, onEdit, onDelete}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDrop(dropId)
      .then((resp) => {
        if (!cancelled) setData(resp);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dropId]);

  // Backend returns { drop, brand, products }
  const d = data?.drop || data;
  const brand = data?.brand;
  const products = data?.products || [];

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(3px)",
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(480px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          {loading ? (
            <div
              style={{
                height: 36,
                width: 160,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 7,
                animation: "pulse 1.4s infinite",
              }}
            />
          ) : (
            <div>
              <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>{d?.name}</p>
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>/{d?.slug}</p>
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
            }}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{padding: 22, display: "flex", flexDirection: "column", gap: 10}}>
            {Array.from({length: 6}).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 32,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  animation: "pulse 1.4s infinite",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{padding: "18px 22px", flex: 1}}>
            <div style={{display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap"}}>
              <Badge label={brand?.name || `Brand #${d?.brand_id}`} color="#a855f7" />
              <Badge
                label={`${products.length} product${products.length !== 1 ? "s" : ""}`}
                color="#3b82f6"
              />
            </div>

            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 4px",
              }}>
              Schedule
            </p>
            {[
              ["Drop At", fmtDateTime(d?.drop_at)],
              ["Ends At", fmtDateTime(d?.ends_at)],
              ["Created", fmtDateTime(d?.created_at)],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>{label}</span>
                <span style={{color: "rgba(255,255,255,0.6)", fontSize: 11}}>{val}</span>
              </div>
            ))}

            {products.length === 0 ? (
              <div
                style={{
                  marginTop: 16,
                  padding: "18px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  textAlign: "center",
                }}>
                <p style={{color: "rgba(255,255,255,0.2)", fontSize: 12, margin: 0}}>
                  No products in this drop yet
                </p>
                <p style={{color: "rgba(255,255,255,0.12)", fontSize: 10, marginTop: 4}}>
                  The brand hasn't added any products to this drop
                </p>
              </div>
            ) : (
              <>
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "16px 0 10px",
                  }}>
                  Products in Drop · {products.length}
                </p>
                <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                  {products.map((p, i) => {
                    const productImg =
                      (p.Images || p.images || [])[0]?.url || (p.Product?.Images || [])[0]?.url;
                    const productName =
                      p.name || p.Name || p.Product?.Name || `Product #${p.product_id}`;
                    const productPrice = p.Price || p.Product?.Price;
                    const sizes = p.Sizes || p.sizes || p.Product?.Sizes || [];
                    const totalStock = sizes.reduce((s, sz) => s + (sz.stock || sz.Stock || 0), 0);
                    const dpStatus = p.status || (p.Status ? String(p.Status) : "scheduled");
                    return (
                      <div
                        key={p.id || i}
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 10,
                          padding: "10px 12px",
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}>
                        {/* Thumbnail */}
                        {productImg ? (
                          <img
                            src={productImg}
                            alt=""
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 7,
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 7,
                              background: "rgba(239,68,68,0.08)",
                              border: "1px solid rgba(239,68,68,0.12)",
                              flexShrink: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.55rem",
                              color: "#ef4444",
                              fontWeight: 900,
                            }}>
                            IMG
                          </div>
                        )}
                        {/* Info */}
                        <div style={{flex: 1, minWidth: 0}}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 3,
                            }}>
                            <p
                              style={{
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 700,
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                              {productName}
                            </p>
                            <Badge
                              label={dpStatus}
                              color={DROP_STATUS_COLOR[dpStatus] || "#3b82f6"}
                            />
                          </div>
                          <div style={{display: "flex", gap: 10, alignItems: "center"}}>
                            {productPrice && (
                              <span style={{color: "#22c55e", fontSize: 11, fontWeight: 700}}>
                                ₦{Number(productPrice).toLocaleString()}
                              </span>
                            )}
                            {sizes.length > 0 && (
                              <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>
                                {sizes.map((s) => s.size || s.Size).join(", ")}
                              </span>
                            )}
                            {totalStock > 0 && (
                              <span
                                style={{
                                  color: totalStock < 5 ? "#f59e0b" : "rgba(255,255,255,0.25)",
                                  fontSize: 10,
                                }}>
                                {totalStock} in stock
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Drop product meta */}
                        <div style={{textAlign: "right", flexShrink: 0}}>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.2)",
                              fontSize: 9,
                              margin: "0 0 2px",
                            }}>
                            Added
                          </p>
                          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 9, margin: 0}}>
                            {p.created_at
                              ? new Date(p.created_at).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "—"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{marginTop: 20, display: "flex", flexDirection: "column", gap: 8}}>
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                }}>
                Actions
              </p>
              <button
                onClick={() => onEdit(d)}
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.7)",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}>
                ✏️ Edit Drop
              </button>
              <button
                onClick={() => onDelete(d)}
                style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "rgba(239,68,68,0.6)",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}>
                🗑 Delete Drop
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Drop create/edit modal ────────────────────────────────────────────────────
function DropModal({mode, data, onChange, onSave, onClose, saving, brands}) {
  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 13,
    padding: "10px 13px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
  };
  const sel = {...inp, background: "#1a1a1a"};
  const lbl = {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 5,
  };

  // Convert ISO string to datetime-local value
  const toLocal = (iso) => {
    if (!iso || iso.startsWith("0000")) return "";
    try {
      return new Date(iso).toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
        initial={{opacity: 0, scale: 0.94, y: 16}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.94}}
        transition={{type: "spring", stiffness: 300, damping: 28}}
        style={{
          width: "100%",
          maxWidth: 500,
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          overflow: "hidden",
          maxHeight: "90vh",
          overflowY: "auto",
        }}>
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />
        <div
          style={{
            padding: "20px 24px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <h3 style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
            {mode === "create" ? "New Drop" : "Edit Drop"}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
            }}>
            ✕
          </button>
        </div>
        <div style={{padding: "16px 24px 22px", display: "flex", flexDirection: "column", gap: 12}}>
          {/* Brand */}
          <div>
            <label style={lbl}>Brand *</label>
            <select
              value={data.brand_id || ""}
              onChange={(e) => onChange("brand_id", Number(e.target.value))}
              style={sel}>
              <option value="">Select a brand...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label style={lbl}>Drop Name *</label>
            <input
              type="text"
              value={data.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Summer Collection Drop"
              style={inp}
            />
          </div>

          {/* Dates */}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            <div>
              <label style={lbl}>Drop At *</label>
              <input
                type="datetime-local"
                value={toLocal(data.drop_at)}
                onChange={(e) =>
                  onChange("drop_at", e.target.value ? new Date(e.target.value).toISOString() : "")
                }
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Ends At</label>
              <input
                type="datetime-local"
                value={toLocal(data.ends_at)}
                onChange={(e) =>
                  onChange(
                    "ends_at",
                    e.target.value ? new Date(e.target.value).toISOString() : null,
                  )
                }
                style={inp}
              />
            </div>
          </div>

          <div style={{display: "flex", gap: 10, marginTop: 4}}>
            <button
              onClick={onSave}
              disabled={saving || !data.brand_id || !data.name || !data.drop_at}
              style={{
                flex: 1,
                background: saving
                  ? "#7f1d1d"
                  : !data.brand_id || !data.name || !data.drop_at
                    ? "rgba(239,68,68,0.3)"
                    : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "12px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}>
              {saving ? "Saving..." : mode === "create" ? "Create Drop" : "Save Changes"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "12px 20px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AdminDrops() {
  const [drops, setDrops] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fetchTick, setFetchTick] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [brands, setBrands] = useState([]);

  // Fetch brands once for the dropdown
  useEffect(() => {
    getBrands({limit: 200})
      .then((d) => setBrands(d?.brands || []))
      .catch(console.error);
  }, []);

  // Fetch drops — reruns on search, statusFilter, or fetchTick
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = {limit: 25};
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    getDrops(params)
      .then((d) => {
        if (!cancelled) {
          setDrops(d?.drops || []);
          setTotal(d?.total ?? 0);
        }
      })
      .catch((e) => {
        if (!cancelled) console.error(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, fetchTick]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.mode === "create") await createDrop(modal.data);
      else await updateDrop(modal.data.id, modal.data);
      setModal(null);
      setFetchTick((t) => t + 1);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const id = confirm?.id;
    try {
      await deleteDrop(id);
      setDrops((prev) => prev.filter((d) => d.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      console.error(e);
    }
    setConfirm(null);
    setSelectedId(null);
  };

  const openEdit = (d) => {
    setSelectedId(null);
    setModal({
      mode: "edit",
      data: {
        id: d.id,
        brand_id: d.brand_id,
        name: d.name,
        drop_at: d.drop_at || "",
        ends_at: d.ends_at || null,
      },
    });
  };

  const cols = [
    {
      key: "cover",
      label: "",
      render: (d) => (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 7,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.55rem",
            color: "#ef4444",
            fontWeight: 900,
            letterSpacing: "0.05em",
          }}>
          DROP
        </div>
      ),
    },
    {
      key: "name",
      label: "Drop",
      render: (d) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>{d.name}</p>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              margin: 0,
              fontFamily: "monospace",
            }}>
            /{d.slug}
          </p>
        </div>
      ),
    },
    {
      key: "drop_at",
      label: "Drop Date",
      render: (d) => (
        <span style={{color: "rgba(255,255,255,0.5)", fontSize: 11}}>{fmtDateTime(d.drop_at)}</span>
      ),
    },
    {
      key: "ends_at",
      label: "Ends",
      render: (d) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>
          {fmtDateTime(d.ends_at)}
        </span>
      ),
    },
    {
      key: "brand",
      label: "Brand",
      render: (d) => (
        <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11}}>
          {d.brand_name || `Brand #${d.brand_id}`}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (d) => (
        <div style={{display: "flex", gap: 6}} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEdit(d)}
            style={{
              padding: "5px 10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Edit
          </button>
          <button
            onClick={() => setConfirm(d)}
            style={{
              padding: "5px 10px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "rgba(239,68,68,0.6)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AnimatePresence>
        {selectedId && (
          <DropDrawer
            dropId={selectedId}
            onClose={() => setSelectedId(null)}
            onEdit={openEdit}
            onDelete={(d) => {
              setSelectedId(null);
              setConfirm(d);
            }}
          />
        )}
        {modal && (
          <DropModal
            mode={modal.mode}
            data={modal.data}
            onChange={(k, v) => setModal((m) => ({...m, data: {...m.data, [k]: v}}))}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
            brands={brands}
          />
        )}
        {confirm && (
          <ConfirmModal
            title="Delete Drop"
            message={`Permanently delete "${confirm.name}"? All associated drop products will also be removed.`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Status filter pills */}
      <div style={{marginBottom: 12}}>
        <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
          {[
            {v: "", l: "All"},
            {v: "scheduled", l: "Scheduled"},
            {v: "live", l: "Live"},
            {v: "ended", l: "Ended"},
          ].map(({v, l}) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${statusFilter === v ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: statusFilter === v ? "rgba(239,68,68,0.1)" : "transparent",
                color: statusFilter === v ? "#ef4444" : "rgba(255,255,255,0.4)",
                transition: "all 0.15s",
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search drops by name..."
        actions={
          <button
            onClick={() => setModal({mode: "create", data: {status: "scheduled"}})}
            style={{
              padding: "10px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              borderRadius: 9,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
            + New Drop
          </button>
        }
      />

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} drop{total !== 1 ? "s" : ""}
            {statusFilter && ` · ${statusFilter}`}
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
            Click a row to view details
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={drops}
          loading={loading}
          onRowClick={(d) => setSelectedId(d.id)}
          emptyMsg="No drops found."
        />
      </div>
    </div>
  );
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────
// ── slugify helper (client side) ─────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-");
}

// ── Category form modal ───────────────────────────────────────────────────────
function CategoryModal({mode, data, onChange, onSave, onClose, saving}) {
  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 13,
    padding: "10px 13px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
  };
  const lbl = {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 5,
  };
  const onFocus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
  const onBlur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)");

  const handleNameChange = (e) => {
    const name = e.target.value;
    onChange("name", name);
    // Auto-generate slug only when creating or when slug hasn't been manually edited
    if (mode === "create" || !data._slugTouched) {
      onChange("slug", slugify(name));
    }
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
        initial={{opacity: 0, scale: 0.94, y: 16}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.94, y: 16}}
        transition={{type: "spring", stiffness: 300, damping: 28}}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}>
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <h3 style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
            {mode === "create" ? "New Category" : `Edit — ${data.name}`}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Icon name="x" size={11} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        <div style={{padding: "16px 24px 22px", display: "flex", flexDirection: "column", gap: 14}}>
          {/* Name */}
          <div>
            <label style={lbl}>Category Name *</label>
            <input
              value={data.name || ""}
              onChange={handleNameChange}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="e.g. T-Shirts"
              style={inp}
            />
          </div>

          {/* Slug */}
          <div>
            <label style={lbl}>Slug *</label>
            <input
              value={data.slug || ""}
              onChange={(e) => {
                onChange("slug", e.target.value);
                onChange("_slugTouched", true);
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="e.g. t-shirts"
              style={{...inp, fontFamily: "monospace", color: "#a78bfa"}}
            />
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "4px 0 0"}}>
              Auto-generated from name. Used in URLs.
            </p>
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Description</label>
            <textarea
              value={data.description || ""}
              onChange={(e) => onChange("description", e.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              rows={3}
              placeholder="Briefly describe what belongs in this category..."
              style={{...inp, resize: "vertical", lineHeight: 1.6}}
            />
          </div>

          {/* Sort Order */}
          <div>
            <label style={lbl}>Sort Order</label>
            <input
              type="number"
              min="0"
              value={data.sort_order ?? 0}
              onChange={(e) => onChange("sort_order", parseInt(e.target.value) || 0)}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder="0"
              style={{...inp, width: 120}}
            />
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "4px 0 0"}}>
              Lower numbers appear first. Default is 0.
            </p>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label style={lbl}>Cover Image</label>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "0 0 8px"}}>
              Shown on the Featured Collections section of the homepage.
            </p>
            <ImageUpload
              folder="categories"
              shape="banner"
              label="Upload Cover Image"
              preview={data.image_url || ""}
              onUpload={(url) => onChange("image_url", url)}
            />
          </div>
        </div>

        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
          }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              background: "rgba(255,255,255,0.06)",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !data.name || !data.slug}
            style={{
              padding: "9px 22px",
              background: saving || !data.name || !data.slug ? "#7f1d1d" : "#ef4444",
              border: "none",
              color: "#fff",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.08em",
              cursor: saving || !data.name || !data.slug ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}>
            {saving ? "Saving…" : mode === "create" ? "Create Category" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg, isErr = false) => {
    setToast({msg, isErr});
    setTimeout(() => setToast(""), 3200);
  };

  const load = () => {
    setLoading(true);
    getCategories()
      .then((d) => {
        setCats(d?.categories || d || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };
  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const {_slugTouched, ...payload} = modal.data;
      if (modal.mode === "create") {
        await createCategory(payload);
        showToast("Category created ✓");
      } else {
        await updateCategory(payload.id, payload);
        showToast("Category updated ✓");
      }
      load();
      setModal(null);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(confirm.id);
      showToast("Category deleted");
      load();
    } catch (e) {
      setError(e.message);
    }
    setConfirm(null);
  };

  const cols = [
    {
      key: "order",
      label: "#",
      render: (c) => (
        <span
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
          }}>
          {c.sort_order ?? 0}
        </span>
      ),
    },
    {
      key: "name",
      label: "Category",
      render: (c) => (
        <div style={{display: "flex", alignItems: "center", gap: 12}}>
          {c.image_url ? (
            <img
              src={c.image_url}
              alt={c.name}
              style={{
                width: 40,
                height: 40,
                objectFit: "cover",
                borderRadius: 7,
                flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          ) : (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 7,
              background: "rgba(255,255,255,0.04)",
              border: "1px dashed rgba(255,255,255,0.1)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}>
              🖼
            </div>
          )}
          <div>
            <p style={{color: "#fff", fontWeight: 700, fontSize: 13, margin: "0 0 2px"}}>{c.name}</p>
            {c.description && (
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 220,
                }}>
                {c.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (c) => (
        <span
          style={{
            fontFamily: "monospace",
            color: "#a78bfa",
            fontSize: 11,
            background: "rgba(167,139,250,0.08)",
            padding: "2px 8px",
            borderRadius: 5,
          }}>
          /{c.slug}
        </span>
      ),
    },
    {
      key: "products",
      label: "Products",
      render: (c) => (
        <span style={{color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700}}>
          {c.product_count ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (c) => (
        <div style={{display: "flex", gap: 6}} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setModal({mode: "edit", data: {...c}})}
            style={{
              padding: "5px 10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Edit
          </button>
          <button
            onClick={() => setConfirm(c)}
            style={{
              padding: "5px 10px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "rgba(239,68,68,0.6)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AnimatePresence>
        {modal && (
          <CategoryModal
            mode={modal.mode}
            data={modal.data}
            onChange={(k, v) => setModal((m) => ({...m, data: {...m.data, [k]: v}}))}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
          />
        )}
        {confirm && (
          <ConfirmModal
            title="Delete Category"
            message={`Delete "${confirm.name}"?${confirm.product_count > 0 ? ` ${confirm.product_count} product${confirm.product_count !== 1 ? "s" : ""} will lose this category.` : " This cannot be undone."}`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10,
            padding: "10px 16px",
            marginBottom: 14,
            color: "#ef4444",
            fontSize: 12,
          }}>
          {error}
        </div>
      )}

      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
          {cats.length} categor{cats.length !== 1 ? "ies" : "y"}
        </p>
        <button
          onClick={() => setModal({mode: "create", data: {sort_order: 0}})}
          style={{
            padding: "10px 16px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            borderRadius: 9,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}>
          + New Category
        </button>
      </div>

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        <AdminTable
          columns={cols}
          rows={cats}
          loading={loading}
          emptyMsg="No categories yet. Create your first one."
        />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 16}}
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.isErr ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 99,
              boxShadow: `0 8px 28px ${toast.isErr ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BrandCommissionPanel({ brandId }) {
  const [data,    setData]    = useState(null);
  const [rate,    setRate]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  useEffect(() => {
    getBrandCommission(brandId).then((d) => {
      setData(d);
      setRate(d?.custom_rate != null ? String(d.custom_rate) : "");
    }).catch(() => {});
  }, [brandId]);

  const save = async () => {
    setSaving(true);
    try {
      const rateVal = rate.trim() === "" ? null : Number(rate);
      await setBrandCommission(brandId, { rate: rateVal });
      setToast("Commission updated");
      setTimeout(() => setToast(null), 3000);
    } catch (e) { setToast(e.message); }
    setSaving(false);
  };

  const clear = async () => {
    setRate("");
    setSaving(true);
    try {
      await setBrandCommission(brandId, { rate: null });
      setToast("Reverted to platform rate");
      setTimeout(() => setToast(null), 3000);
    } catch (e) { setToast(e.message); }
    setSaving(false);
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 20px", marginTop: 16 }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>
        Commission Rate
      </p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 14 }}>
        Platform default: <strong style={{ color: "#fff" }}>{data?.platform_rate ?? "—"}%</strong>
        {data?.custom_rate != null && (
          <> · Custom: <strong style={{ color: "#ef4444" }}>{data.custom_rate}%</strong></>
        )}
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="number" min="0" max="99" step="0.5"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder={`Default (${data?.platform_rate ?? "10"}%)`}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, padding: "9px 12px", borderRadius: 8, outline: "none", width: 140 }}
        />
        <button onClick={save} disabled={saving}
          style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
          {saving ? "Saving..." : "Set Rate"}
        </button>
        {data?.custom_rate != null && (
          <button onClick={clear} disabled={saving}
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 11, cursor: "pointer" }}>
            Use Default
          </button>
        )}
      </div>
      {toast && <p style={{ color: "#22c55e", fontSize: 11, marginTop: 8 }}>{toast}</p>}
    </div>
  );
}

// ── REVIEWS ──────────────────────────────────────────────────────────────────

function StarRow({rating, size = 13}) {
  return (
    <span style={{letterSpacing: 1}}>
      {Array.from({length: 5}).map((_, i) => (
        <span
          key={i}
          style={{color: i < rating ? "#f59e0b" : "rgba(255,255,255,0.12)", fontSize: size}}>
          ★
        </span>
      ))}
    </span>
  );
}

// ── Review detail drawer ──────────────────────────────────────────────────────
function ReviewDrawer({reviewId, onClose, onDelete, onFlagToggle}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    getReview(reviewId)
      .then((resp) => {
        setData(resp);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [reviewId]);

  const review = data?.review;
  const comments = data?.comments || [];

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await addReviewComment(reviewId, comment.trim());
      setComment("");
      load();
    } catch (e) {
      console.error(e);
    }
    setPosting(false);
  };

  const handleDeleteComment = async (commentId) => {
    setDeleting(commentId);
    try {
      await deleteReviewComment(reviewId, commentId);
      load();
    } catch (e) {
      console.error(e);
    }
    setDeleting(null);
  };

  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 12,
    padding: "9px 12px",
    borderRadius: 8,
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
  };

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(3px)",
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(520px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
          <div>
            <p style={{color: "#fff", fontSize: 14, fontWeight: 800, margin: 0}}>Review Detail</p>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>#{reviewId}</p>
          </div>
          <div style={{display: "flex", gap: 8}}>
            {review && (
              <>
                <button
                  onClick={() => onFlagToggle(review)}
                  title={review.flagged ? "Unflag" : "Flag"}
                  style={{
                    padding: "6px 12px",
                    background: review.flagged ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${review.flagged ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.1)"}`,
                    color: review.flagged ? "#f97316" : "rgba(255,255,255,0.4)",
                    borderRadius: 7,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}>
                  {review.flagged ? "🚩 Flagged" : "Flag"}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDelete(review);
                  }}
                  style={{
                    padding: "6px 12px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "rgba(239,68,68,0.6)",
                    borderRadius: 7,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}>
                  Delete
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                flexShrink: 0,
              }}>
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{padding: 22, display: "flex", flexDirection: "column", gap: 10}}>
            {Array.from({length: 5}).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 36,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 7,
                  animation: "pulse 1.4s infinite",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "18px 22px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}>
            {/* Star rating + flagged */}
            <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 14}}>
              <StarRow rating={review?.rating || 0} size={18} />
              <span style={{color: "rgba(255,255,255,0.3)", fontSize: 12}}>{review?.rating}/5</span>
              {review?.flagged && (
                <span
                  style={{
                    background: "rgba(249,115,22,0.12)",
                    border: "1px solid rgba(249,115,22,0.3)",
                    color: "#f97316",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}>
                  FLAGGED
                </span>
              )}
            </div>

            {/* Title */}
            {review?.title && (
              <p
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 800,
                  margin: "0 0 8px",
                  lineHeight: 1.4,
                }}>
                "{review.title}"
              </p>
            )}

            {/* Body */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 18,
              }}>
              <p
                style={{color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.7, margin: 0}}>
                {review?.body || (
                  <span style={{color: "rgba(255,255,255,0.2)", fontStyle: "italic"}}>
                    No body text
                  </span>
                )}
              </p>
            </div>

            {/* Meta grid */}
            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}>
              Details
            </p>
            {[
              ["Reviewer", review?.reviewer_name || "—"],
              ["Email", review?.reviewer_email || "—"],
              ["Product", review?.product_name || "—"],
              ["Brand", review?.brand_name || "—"],
              [
                "Reviewed",
                review?.created_at
                  ? new Date(review.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              ],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>{label}</span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 11,
                    maxWidth: 240,
                    textAlign: "right",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                  {val}
                </span>
              </div>
            ))}

            {/* ── Comments section ── */}
            <div style={{marginTop: 24}}>
              <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 14}}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: 0,
                  }}>
                  Admin Comments
                </p>
                {comments.length > 0 && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 99,
                    }}>
                    {comments.length}
                  </span>
                )}
              </div>

              {/* Existing comments */}
              {comments.length === 0 ? (
                <p
                  style={{
                    color: "rgba(255,255,255,0.18)",
                    fontSize: 12,
                    fontStyle: "italic",
                    marginBottom: 14,
                  }}>
                  No admin comments yet.
                </p>
              ) : (
                <div style={{display: "flex", flexDirection: "column", gap: 8, marginBottom: 14}}>
                  {comments.map((cm) => (
                    <div
                      key={cm.id}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 9,
                        padding: "10px 12px",
                      }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 5,
                        }}>
                        <div style={{display: "flex", alignItems: "center", gap: 8}}>
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "rgba(239,68,68,0.15)",
                              border: "1px solid rgba(239,68,68,0.25)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.5rem",
                              color: "#ef4444",
                              fontWeight: 900,
                              flexShrink: 0,
                            }}>
                            {(cm.admin_name || "A")[0].toUpperCase()}
                          </div>
                          <span
                            style={{color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700}}>
                            {cm.admin_name || "Admin"}
                          </span>
                          <span style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                            {new Date(cm.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(cm.id)}
                          disabled={deleting === cm.id}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(239,68,68,0.4)",
                            fontSize: 11,
                            padding: "1px 4px",
                            opacity: deleting === cm.id ? 0.4 : 1,
                          }}>
                          ✕
                        </button>
                      </div>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          fontSize: 12,
                          lineHeight: 1.6,
                          margin: 0,
                        }}>
                        {cm.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment */}
              <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Leave an admin note on this review..."
                  rows={3}
                  style={inp}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) handleAddComment();
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={posting || !comment.trim()}
                  style={{
                    alignSelf: "flex-end",
                    padding: "8px 18px",
                    background: posting || !comment.trim() ? "rgba(239,68,68,0.3)" : "#ef4444",
                    border: "none",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: posting || !comment.trim() ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}>
                  {posting ? "Posting…" : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg, isErr = false) => {
    setToast({msg, isErr});
    setTimeout(() => setToast(""), 3000);
  };

  const load = () => {
    setLoading(true);
    const p = {limit: 25};
    if (search.trim()) p.search = search.trim();
    if (ratingFilter) p.rating = ratingFilter;
    if (flaggedOnly) p.flagged = "true";
    getReviews(p)
      .then((d) => {
        setReviews(d?.reviews || []);
        setTotal(d?.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, ratingFilter, flaggedOnly]);

  const handleFlagToggle = async (r) => {
    try {
      const res = await flagReview(r.id);
      setReviews((prev) =>
        prev.map((x) => (x.id === r.id ? {...x, flagged: res?.flagged ?? !x.flagged} : x)),
      );
      showToast(res?.flagged ? "Review flagged" : "Review unflagged");
      if (selectedId === r.id) setSelectedId(null); // re-open to refresh
      setTimeout(() => setSelectedId(r.id), 50);
    } catch (e) {
      showToast(e.message, true);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReview(confirm.id);
      setReviews((prev) => prev.filter((r) => r.id !== confirm.id));
      setTotal((t) => Math.max(0, t - 1));
      showToast("Review deleted");
      if (selectedId === confirm.id) setSelectedId(null);
    } catch (e) {
      showToast(e.message, true);
    }
    setConfirm(null);
  };

  const cols = [
    {
      key: "reviewer",
      label: "Reviewer",
      render: (r) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: "0 0 2px"}}>
            {r.reviewer_name || "—"}
          </p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
            {r.reviewer_email || ""}
          </p>
        </div>
      ),
    },
    {
      key: "product",
      label: "Product",
      render: (r) => (
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 12,
              margin: "0 0 1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 160,
            }}>
            {r.product_name || "—"}
          </p>
          {r.brand_name && (
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>{r.brand_name}</p>
          )}
        </div>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (r) => (
        <div style={{display: "flex", alignItems: "center", gap: 6}}>
          <StarRow rating={r.rating || 0} size={11} />
          <span style={{color: "rgba(255,255,255,0.35)", fontSize: 10}}>{r.rating}/5</span>
        </div>
      ),
    },
    {
      key: "body",
      label: "Review",
      render: (r) => (
        <div>
          {r.title && (
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 11,
                fontWeight: 700,
                margin: "0 0 2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 200,
              }}>
              {r.title}
            </p>
          )}
          <p
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 10,
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 200,
            }}>
            {r.body || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "flags",
      label: "",
      render: (r) => (
        <div style={{display: "flex", gap: 5, alignItems: "center"}}>
          {r.flagged && <Badge label="🚩 Flagged" color="#f97316" />}
          {r.comment_count > 0 && (
            <span
              style={{
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.2)",
                color: "#60a5fa",
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 99,
              }}>
              💬 {r.comment_count}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div style={{display: "flex", gap: 6}} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleFlagToggle(r)}
            style={{
              padding: "5px 10px",
              background: r.flagged ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${r.flagged ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.1)"}`,
              color: r.flagged ? "#f97316" : "rgba(255,255,255,0.4)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            {r.flagged ? "Unflag" : "Flag"}
          </button>
          <button
            onClick={() => setConfirm(r)}
            style={{
              padding: "5px 10px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "rgba(239,68,68,0.6)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AnimatePresence>
        {selectedId && (
          <ReviewDrawer
            reviewId={selectedId}
            onClose={() => setSelectedId(null)}
            onDelete={(r) => {
              setSelectedId(null);
              setConfirm(r);
            }}
            onFlagToggle={handleFlagToggle}
          />
        )}
        {confirm && (
          <ConfirmModal
            title="Delete Review"
            message={`Permanently delete this review by ${confirm.reviewer_name || "this user"}?`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Filters */}
      <div
        style={{display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center"}}>
        {/* Rating filter */}
        <div style={{display: "flex", gap: 5}}>
          {["", "1", "2", "3", "4", "5"].map((v) => (
            <button
              key={v}
              onClick={() => setRatingFilter(v)}
              style={{
                padding: "5px 10px",
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${ratingFilter === v ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: ratingFilter === v ? "rgba(245,158,11,0.1)" : "transparent",
                color: ratingFilter === v ? "#f59e0b" : "rgba(255,255,255,0.4)",
                transition: "all 0.15s",
              }}>
              {v === "" ? "All Stars" : `${"★".repeat(Number(v))}`}
            </button>
          ))}
        </div>
        {/* Flagged toggle */}
        <button
          onClick={() => setFlaggedOnly((f) => !f)}
          style={{
            padding: "5px 12px",
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 700,
            cursor: "pointer",
            border: `1px solid ${flaggedOnly ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.1)"}`,
            background: flaggedOnly ? "rgba(249,115,22,0.1)" : "transparent",
            color: flaggedOnly ? "#f97316" : "rgba(255,255,255,0.4)",
            transition: "all 0.15s",
          }}>
          🚩 Flagged only
        </button>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by product, reviewer, email, or text..."
      />

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} review{total !== 1 ? "s" : ""}
            {flaggedOnly ? " · flagged" : ""}
            {ratingFilter ? ` · ${ratingFilter}★` : ""}
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
            Click a row to view & comment
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={reviews}
          loading={loading}
          onRowClick={(r) => setSelectedId(r.id)}
          emptyMsg="No reviews found."
        />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 16}}
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.isErr ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 99,
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export function AdminNotifications() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "news",
    target: "all",
    target_user_id: null,
  });
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const showToast = (msg, isErr = false) => {
    setToast({msg, isErr});
    setTimeout(() => setToast(""), 3000);
  };

  const load = () => {
    setLoading(true);
    getNotifications()
      .then((d) => {
        setBroadcasts(d?.notifications || []);
        setTotal(d?.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  // User search debounce
  useEffect(() => {
    if (form.target !== "user") return;
    if (!userSearch.trim()) {
      setUserResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearchLoading(true);
      getUsers({search: userSearch.trim(), limit: 8})
        .then((d) => {
          setUserResults(d?.users || []);
          setSearchLoading(false);
        })
        .catch(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch, form.target]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    if (form.target === "user" && !selectedUser) return;
    setSending(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        type: form.type,
        target: form.target,
        ...(form.target === "user" && selectedUser ? {target_user_id: selectedUser.id} : {}),
      };
      const res = await sendNotification(payload);
      showToast(`✓ Sent to ${res?.recipients ?? "?"} recipient${res?.recipients !== 1 ? "s" : ""}`);
      setForm({title: "", body: "", type: "news", target: "all", target_user_id: null});
      setSelectedUser(null);
      setUserSearch("");
      load();
    } catch (e) {
      showToast(e.message, true);
    }
    setSending(false);
  };

  const handleDelete = async () => {
    try {
      await deleteNotification(confirm.id);
      setBroadcasts((p) => p.filter((n) => n.id !== confirm.id));
      setTotal((t) => Math.max(0, t - 1));
      showToast("Broadcast deleted");
    } catch (e) {
      showToast(e.message, true);
    }
    setConfirm(null);
  };

  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 13,
    padding: "10px 13px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
  };
  const sel = {...inp, background: "#1a1a1a", cursor: "pointer", appearance: "none"};
  const lbl = {
    color: "rgba(255,255,255,0.3)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 5,
  };
  const onFocus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
  const onBlur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

  const TARGET_OPTIONS = [
    {value: "all", label: "Everyone", icon: "🌐", desc: "All active users"},
    {value: "buyers", label: "Buyers only", icon: "🛍", desc: "Users with buyer account"},
    {value: "brands", label: "Brands only", icon: "🏷", desc: "All brand accounts"},
    {value: "employees", label: "Employees only", icon: "👔", desc: "Active staff members"},
    {value: "partners", label: "Partners only", icon: "🤝", desc: "Active partner accounts"},
    {value: "user", label: "Specific person", icon: "🎯", desc: "One person by name or email"},
  ];

  const TYPE_COLORS = {news: "#a855f7", drop: "#ef4444", order: "#3b82f6", system: "#f59e0b"};

  const canSend = form.title.trim() && form.body.trim() && (form.target !== "user" || selectedUser);

  return (
    <div style={{display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start"}}>
      {/* ── Broadcast history ── */}
      <div>
        <AnimatePresence>
          {confirm && (
            <ConfirmModal
              title="Delete Broadcast"
              message={`Remove "${confirm.title}" from the broadcast log?`}
              confirmLabel="Delete"
              danger
              onConfirm={handleDelete}
              onCancel={() => setConfirm(null)}
            />
          )}
        </AnimatePresence>

        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
              {total.toLocaleString()} broadcast{total !== 1 ? "s" : ""} sent
            </p>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
              History of admin-sent notifications
            </p>
          </div>

          {loading ? (
            <div style={{padding: 16, display: "flex", flexDirection: "column", gap: 8}}>
              {Array.from({length: 5}).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 60,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 9,
                    animation: "pulse 1.4s infinite",
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          ) : broadcasts.length === 0 ? (
            <div style={{padding: "48px 20px", textAlign: "center"}}>
              <p style={{fontSize: "2rem", marginBottom: 8}}>🔔</p>
              <p style={{color: "rgba(255,255,255,0.2)", fontSize: 13}}>No broadcasts sent yet</p>
              <p style={{color: "rgba(255,255,255,0.12)", fontSize: 11}}>
                Use the form to send your first notification
              </p>
            </div>
          ) : (
            <div style={{display: "flex", flexDirection: "column"}}>
              {broadcasts.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "13px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}>
                  {/* Type dot */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: TYPE_COLORS[n.type] || "#6b7280",
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  {/* Content */}
                  <div style={{flex: 1, minWidth: 0}}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 3,
                        flexWrap: "wrap",
                      }}>
                      <span style={{color: "#fff", fontWeight: 700, fontSize: 13}}>{n.title}</span>
                      {/* Target badge */}
                      {(() => {
                        const opt = TARGET_OPTIONS.find((o) => o.value === n.target);
                        return (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 99,
                            }}>
                            {opt?.icon}{" "}
                            {n.target === "user"
                              ? n.target_user_name || "Specific User"
                              : opt?.label || n.target}
                          </span>
                        );
                      })()}
                      <Badge label={`${n.type}`} color={TYPE_COLORS[n.type] || "#6b7280"} />
                    </div>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 11,
                        margin: "0 0 4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                      {n.body}
                    </p>
                    <div style={{display: "flex", gap: 10, alignItems: "center"}}>
                      <span style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                      <span
                        style={{
                          color: n.recipients_count > 0 ? "#22c55e" : "rgba(255,255,255,0.2)",
                          fontSize: 10,
                          fontWeight: 700,
                        }}>
                        {n.recipients_count} recipient{n.recipients_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  {/* Delete */}
                  <button
                    onClick={() => setConfirm(n)}
                    style={{
                      flexShrink: 0,
                      padding: "4px 10px",
                      background: "rgba(239,68,68,0.07)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      color: "rgba(239,68,68,0.5)",
                      borderRadius: 7,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Send form ── */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          padding: "18px 20px",
          position: "sticky",
          top: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
        <div>
          <p style={{color: "#fff", fontSize: 13, fontWeight: 800, margin: "0 0 2px"}}>
            Send Notification
          </p>
          <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>
            Delivered to users' notification bell in real-time
          </p>
        </div>

        {/* Title */}
        <div>
          <label style={lbl}>Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({...f, title: e.target.value}))}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="e.g. New drop just landed 🔥"
            style={inp}
          />
        </div>

        {/* Body */}
        <div>
          <label style={lbl}>Message *</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({...f, body: e.target.value}))}
            onFocus={onFocus}
            onBlur={onBlur}
            rows={3}
            placeholder="What do you want to tell them?"
            style={{...inp, resize: "vertical", lineHeight: 1.6}}
          />
        </div>

        {/* Type */}
        <div>
          <label style={lbl}>Type</label>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6}}>
            {[
              ["news", "📰 News", "#a855f7"],
              ["drop", "⚡ Drop", "#ef4444"],
              ["order", "📦 Order", "#3b82f6"],
              ["system", "⚙️ System", "#f59e0b"],
            ].map(([v, l, c]) => (
              <button
                key={v}
                onClick={() => setForm((f) => ({...f, type: v}))}
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${form.type === v ? c + "66" : "rgba(255,255,255,0.08)"}`,
                  background: form.type === v ? c + "18" : "transparent",
                  color: form.type === v ? c : "rgba(255,255,255,0.35)",
                  transition: "all 0.15s",
                  textAlign: "left",
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div>
          <label style={lbl}>Send To</label>
          <div style={{display: "flex", flexDirection: "column", gap: 5}}>
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setForm((f) => ({...f, target: opt.value}));
                  setSelectedUser(null);
                  setUserSearch("");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 9,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${form.target === opt.value ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.07)"}`,
                  background:
                    form.target === opt.value ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.02)",
                  color: form.target === opt.value ? "#ef4444" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                <span>{opt.icon}</span>
                <div style={{flex: 1}}>
                  <span
                    style={{
                      color: form.target === opt.value ? "#ef4444" : "rgba(255,255,255,0.6)",
                    }}>
                    {opt.label}
                  </span>
                  <span style={{color: "rgba(255,255,255,0.2)", fontSize: 9, marginLeft: 6}}>
                    {opt.desc}
                  </span>
                </div>
                {form.target === opt.value && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#ef4444",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Specific user search — shown only when target = user */}
        {form.target === "user" && (
          <div style={{position: "relative"}}>
            <label style={lbl}>Search User</label>
            {selectedUser ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 9,
                  padding: "10px 13px",
                }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#ef4444",
                    flexShrink: 0,
                  }}>
                  {(selectedUser.first_name || selectedUser.email || "?")[0].toUpperCase()}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                  <p style={{color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0}}>
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setUserSearch("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(239,68,68,0.6)",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "0 4px",
                  }}>
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="Type name or email to search…"
                  style={inp}
                />
                {(userResults.length > 0 || searchLoading) && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 9,
                      marginTop: 4,
                      overflow: "hidden",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                    }}>
                    {searchLoading ? (
                      <div
                        style={{
                          padding: "10px 14px",
                          color: "rgba(255,255,255,0.3)",
                          fontSize: 11,
                        }}>
                        Searching…
                      </div>
                    ) : (
                      userResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setUserSearch("");
                            setUserResults([]);
                          }}
                          style={{
                            width: "100%",
                            padding: "9px 14px",
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.06)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 900,
                              color: "rgba(255,255,255,0.5)",
                              flexShrink: 0,
                            }}>
                            {(u.first_name || u.email || "?")[0].toUpperCase()}
                          </div>
                          <div style={{flex: 1, minWidth: 0}}>
                            <p style={{color: "#fff", fontWeight: 600, fontSize: 12, margin: 0}}>
                              {u.first_name} {u.last_name}
                            </p>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.35)",
                                fontSize: 10,
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                              {u.email} · {u.account_type}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Preview pill */}
        {form.title && (
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 9,
              padding: "10px 13px",
            }}>
            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                margin: "0 0 5px",
              }}>
              Preview
            </p>
            <div style={{display: "flex", gap: 8, alignItems: "flex-start"}}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: TYPE_COLORS[form.type] || "#6b7280",
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <div>
                <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: "0 0 2px"}}>
                  {form.title || "Title"}
                </p>
                {form.body && (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 11,
                      margin: 0,
                      lineHeight: 1.5,
                    }}>
                    {form.body}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !canSend}
          style={{
            padding: "12px",
            background: sending ? "#7f1d1d" : !canSend ? "rgba(239,68,68,0.2)" : "#ef4444",
            border: "none",
            color: !canSend && !sending ? "rgba(239,68,68,0.5)" : "#fff",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: sending || !canSend ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}>
          {sending ? "Sending…" : "Send Notification"}
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 16}}
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.isErr ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 99,
              boxShadow: `0 8px 28px ${toast.isErr ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// ── SUBSCRIPTIONS - Complete with all helpers ────────────────────────────────
const SUB_STATUS_COLOR = {
  active: "#22c55e",
  trial: "#a855f7",
  expired: "#f59e0b",
  cancelled: "#ef4444",
  none: "#6b7280",
};

const PLAN_COLOR = {
  blvck: "#ef4444",
  mrkt_pro: "#f59e0b",
  starter: "#3b82f6",
  none: "#6b7280",
};

function planColor(slug) {
  return PLAN_COLOR[slug] || "#a855f7";
}

// ── Helper functions for subscriptions ───────────────────────────────────────
function fmtSubDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtSubDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Section Header Component ──────────────────────────────────────────────────
function SubSectionHeader({children, style}) {
  return (
    <p
      style={{
        color: "rgba(255,255,255,0.2)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        margin: "14px 0 8px",
        ...style,
      }}>
      {children}
    </p>
  );
}

// ── Info Row Component ────────────────────────────────────────────────────────
function SubInfoRow({label, value}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
      <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>{label}</span>
      <span
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: 11,
          maxWidth: "60%",
          textAlign: "right",
          wordBreak: "break-all",
        }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ── Subscription Detail Drawer ────────────────────────────────────────────────
function SubscriptionDrawer({subscription: initialSub, onClose, onStatusChange}) {
  const [sub, setSub] = useState(initialSub);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await onStatusChange(sub.id, newStatus);
      setSub((prev) => ({...prev, status: newStatus}));
    } catch (e) {
      console.error(e);
    }
    setUpdating(false);
  };

  // Calculate days remaining for trial/active subscriptions
  const daysRemaining = sub?.period_end
    ? Math.ceil((new Date(sub.period_end) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const trialDaysLeft = sub?.trial_ends_at
    ? Math.ceil((new Date(sub.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(3px)",
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
      }}>
      <motion.div
        initial={{x: "100%"}}
        animate={{x: 0}}
        exit={{x: "100%"}}
        transition={{type: "spring", stiffness: 300, damping: 30}}
        style={{
          width: "min(600px,100vw)",
          height: "100vh",
          background: "#0f0f0f",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}>
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            position: "sticky",
            top: 0,
            background: "#0f0f0f",
            zIndex: 10,
          }}>
          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: "0 0 2px",
              }}>
              Subscription
            </p>
            <p
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: 900,
                margin: 0,
                fontFamily: "monospace",
              }}>
              {sub.reference}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            ✕
          </button>
        </div>

        <div style={{padding: "16px 22px 80px", flex: 1}}>
          {/* Status & Plan Badges */}
          <div style={{display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap"}}>
            <Badge label={sub.status || "none"} color={SUB_STATUS_COLOR[sub.status] || "#6b7280"} />
            <Badge
              label={sub.plan_name || sub.plan_slug || "none"}
              color={planColor(sub.plan_slug)}
            />
            <Badge label={sub.billing || "monthly"} color="#3b82f6" />
          </div>

          {/* Trial/Expiry Warning */}
          {sub.status === "trial" && trialDaysLeft !== null && (
            <div
              style={{
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.2)",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 16,
              }}>
              <p style={{color: "#a855f7", fontSize: 11, fontWeight: 700, margin: 0}}>
                🎁 Trial Period ·{" "}
                {trialDaysLeft > 0 ? `${trialDaysLeft} days left` : "Ending today"}
              </p>
              {sub.trial_ends_at && (
                <p style={{color: "rgba(168,85,247,0.6)", fontSize: 10, margin: "3px 0 0"}}>
                  Ends {fmtSubDateTime(sub.trial_ends_at)}
                </p>
              )}
            </div>
          )}

          {sub.status === "active" && daysRemaining !== null && daysRemaining <= 7 && (
            <div
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 16,
              }}>
              <p style={{color: "#f59e0b", fontSize: 11, fontWeight: 700, margin: 0}}>
                ⏰ Renewal Soon · {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
              </p>
              <p style={{color: "rgba(245,158,11,0.6)", fontSize: 10, margin: "3px 0 0"}}>
                Renews on {fmtSubDate(sub.period_end)}
              </p>
            </div>
          )}

          {/* Brand Information */}
          <SubSectionHeader style={{marginTop: 0}}>Brand Information</SubSectionHeader>
          <SubInfoRow label="Brand Name" value={sub.brand_name} />
          <SubInfoRow label="Brand ID" value={sub.brand_id} />
          <SubInfoRow label="Owner Email" value={sub.email} />
          <SubInfoRow label="User ID" value={sub.user_id} />

          {/* Plan Details */}
          <SubSectionHeader>Plan Details</SubSectionHeader>
          <div
            style={{
              background: `${planColor(sub.plan_slug)}08`,
              border: `1px solid ${planColor(sub.plan_slug)}20`,
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 8,
            }}>
            <SubInfoRow label="Plan Name" value={sub.plan_name} />
            <SubInfoRow label="Plan Slug" value={sub.plan_slug} />
            <SubInfoRow label="Billing Cycle" value={sub.billing} />
            <SubInfoRow
              label="Price Paid"
              value={
                sub.price_paid > 0 ? `₦${Number(sub.price_paid).toLocaleString()}` : "Free"
              }
            />
          </div>

          {/* Subscription Period */}
          <SubSectionHeader>Subscription Period</SubSectionHeader>
          <SubInfoRow label="Started" value={fmtSubDateTime(sub.period_start)} />
          <SubInfoRow label="Current Period Ends" value={fmtSubDateTime(sub.period_end)} />
          {sub.trial_ends_at && (
            <SubInfoRow label="Trial Ends" value={fmtSubDateTime(sub.trial_ends_at)} />
          )}
          {daysRemaining !== null && (
            <SubInfoRow
              label="Days Remaining"
              value={`${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`}
            />
          )}

          {/* Payment Details */}
          {(sub.payment_method || sub.payment_reference || sub.receipt_url) && (
            <>
              <SubSectionHeader>Payment Details</SubSectionHeader>
              <div
                style={{
                  background: "rgba(34,197,94,0.05)",
                  border: "1px solid rgba(34,197,94,0.15)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 8,
                }}>
                <SubInfoRow label="Method" value={sub.payment_method} />
                <SubInfoRow label="Reference" value={sub.payment_reference} />

                {/* Receipt Image */}
                {sub.receipt_url && (
                  <>
                    <div style={{marginTop: 12, marginBottom: 6}}>
                      <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
                        Payment Receipt
                      </span>
                    </div>
                    <a
                      href={sub.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid rgba(34,197,94,0.2)",
                        marginTop: 6,
                      }}>
                      <img
                        src={sub.receipt_url}
                        alt="Payment Receipt"
                        style={{
                          width: "100%",
                          height: "auto",
                          maxHeight: 300,
                          objectFit: "contain",
                          background: "rgba(0,0,0,0.3)",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `
                            <div style="padding: 12px; text-align: center; color: rgba(255,255,255,0.5); font-size: 11px;">
                              📄 View Receipt (Click to open)
                            </div>
                          `;
                        }}
                      />
                    </a>
                  </>
                )}
              </div>
            </>
          )}

          {/* Subscription History */}
          <SubSectionHeader>Subscription History</SubSectionHeader>
          <SubInfoRow label="Reference" value={sub.reference} />
          <SubInfoRow label="Subscription ID" value={sub.id} />
          <SubInfoRow label="Created" value={fmtSubDateTime(sub.created_at)} />
          <SubInfoRow label="Last Updated" value={fmtSubDateTime(sub.updated_at)} />

          {/* Update Status Section */}
          <div style={{marginTop: 20}}>
            <SubSectionHeader style={{marginTop: 18}}>
              Update Status {updating && <span style={{color: "#f59e0b"}}>· saving...</span>}
            </SubSectionHeader>
            <div style={{display: "flex", flexWrap: "wrap", gap: 6}}>
              {["active", "trial", "expired", "cancelled", "none"].map((s) => {
                const active = sub.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updating || active}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: active ? "default" : "pointer",
                      textTransform: "capitalize",
                      background: active
                        ? `${SUB_STATUS_COLOR[s]}20`
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? SUB_STATUS_COLOR[s] + "50" : "rgba(255,255,255,0.1)"}`,
                      color: active ? SUB_STATUS_COLOR[s] : "rgba(255,255,255,0.4)",
                      transition: "all 0.15s",
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "8px 0 0"}}>
              💡 Changing status will update the brand's subscription status
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{marginTop: 20}}>
            <SubSectionHeader>Quick Actions</SubSectionHeader>
            <div style={{display: "flex", flexDirection: "column", gap: 8}}>
              {sub.status === "active" && (
                <button
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={updating}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    color: "rgba(239,68,68,0.6)",
                    borderRadius: 9,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}>
                  🚫 Cancel Subscription
                </button>
              )}
              {sub.status === "cancelled" && (
                <button
                  onClick={() => handleStatusChange("active")}
                  disabled={updating}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(34,197,94,0.05)",
                    border: "1px solid rgba(34,197,94,0.15)",
                    color: "#22c55e",
                    borderRadius: 9,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}>
                  ✅ Reactivate Subscription
                </button>
              )}
              {sub.status === "trial" && (
                <button
                  onClick={() => handleStatusChange("active")}
                  disabled={updating}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(34,197,94,0.05)",
                    border: "1px solid rgba(34,197,94,0.15)",
                    color: "#22c55e",
                    borderRadius: 9,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}>
                  ⚡ Convert to Paid
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Plan Subscriptions Tab ───────────────────────────────────────────────────
function PlanSubscriptionsTab() {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = {limit: 30};
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    getSubscriptions(params)
      .then((d) => {
        if (cancelled) return;
        setSubs(d?.subscriptions || []);
        setTotal(d?.total ?? 0);
      })
      .catch((err) => {
        if (!cancelled) console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    setConfirm(null);
    setSelectedSub(null);
    try {
      await updateSubscription(id, {status});
      setSubs((prev) => prev.map((s) => (s.id === id ? {...s, status} : s)));
    } catch (e) {
      console.error(e);
    }
  };

  const STATUS_FILTERS = ["", "active", "trial", "expired", "cancelled"];

  const cols = [
    {
      key: "brand",
      label: "Brand",
      render: (s) => (
        <div>
          <p style={{color: "#fff", fontWeight: 700, fontSize: 12, margin: 0}}>
            {s.brand_name || `Brand #${s.brand_id}` || "—"}
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              margin: 0,
              fontFamily: "monospace",
            }}>
            {s.reference || `#${s.id}`}
          </p>
        </div>
      ),
    },
    {
      key: "email",
      label: "Owner",
      render: (s) => (
        <span style={{color: "rgba(255,255,255,0.45)", fontSize: 11}}>{s.email || "—"}</span>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (s) => (
        <div style={{display: "flex", flexDirection: "column", gap: 2}}>
          <Badge label={s.plan_name || s.plan_slug || "none"} color={planColor(s.plan_slug)} />
          {s.plan_slug && (
            <span style={{color: "rgba(255,255,255,0.2)", fontSize: 9, fontFamily: "monospace"}}>
              {s.plan_slug}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "billing",
      label: "Billing",
      render: (s) => (
        <span style={{color: "rgba(255,255,255,0.4)", fontSize: 11, textTransform: "capitalize"}}>
          {s.billing || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (s) => (
        <Badge label={s.status || "none"} color={SUB_STATUS_COLOR[s.status] || "#6b7280"} />
      ),
    },
    {
      key: "price",
      label: "Price Paid",
      render: (s) => (
        <div style={{display: "flex", flexDirection: "column", gap: 2}}>
          <span
            style={{
              color: s.price_paid > 0 ? "#22c55e" : "rgba(255,255,255,0.3)",
              fontWeight: 700,
            }}>
            {s.price_paid != null && s.price_paid > 0
              ? `₦${Number(s.price_paid).toLocaleString()}`
              : "Free"}
          </span>
          {s.payment_method && (
            <span
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: 9,
                textTransform: "capitalize",
              }}>
              {s.payment_method}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "started",
      label: "Started",
      render: (s) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>
          {fmtSubDate(s.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (s) => (
        <div style={{display: "flex", gap: 6}} onClick={(e) => e.stopPropagation()}>
          {s.status !== "cancelled" ? (
            <button
              onClick={() => setConfirm({id: s.id, newStatus: "cancelled", label: "Cancel"})}
              style={{
                padding: "5px 10px",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "rgba(239,68,68,0.6)",
                borderRadius: 7,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setConfirm({id: s.id, newStatus: "active", label: "Reactivate"})}
              style={{
                padding: "5px 10px",
                background: "rgba(34,197,94,0.07)",
                border: "1px solid rgba(34,197,94,0.15)",
                color: "#22c55e",
                borderRadius: 7,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Reactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <AnimatePresence>
        {selectedSub && (
          <SubscriptionDrawer
            subscription={selectedSub}
            onClose={() => setSelectedSub(null)}
            onStatusChange={handleUpdateStatus}
          />
        )}
        {confirm !== null && (
          <ConfirmModal
            title={`${confirm.label} Subscription`}
            message={`${confirm.label} this subscription? This will also update the brand's status.`}
            confirmLabel={confirm.label}
            danger={confirm.newStatus === "cancelled"}
            onConfirm={() => handleUpdateStatus(confirm.id, confirm.newStatus)}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      <div style={{marginBottom: 14}}>
        <p
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            margin: "0 0 7px",
          }}>
          Filter by Status
        </p>
        <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
          {STATUS_FILTERS.map((val) => (
            <button
              key={val || "all"}
              onClick={() => setStatusFilter(val)}
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${statusFilter === val ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: statusFilter === val ? "rgba(239,68,68,0.1)" : "transparent",
                color: statusFilter === val ? "#ef4444" : "rgba(255,255,255,0.4)",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}>
              {val || "All"}
            </button>
          ))}
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by brand name or email..."
      />

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} plan subscription{total !== 1 ? "s" : ""}
            {statusFilter && ` · ${statusFilter}`}
          </p>
          <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: 0}}>
            Click a row to view details
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={subs}
          loading={loading}
          onRowClick={(s) => setSelectedSub(s)}
          emptyMsg={
            statusFilter ? `No ${statusFilter} subscriptions found.` : "No subscriptions found."
          }
        />
      </div>
    </div>
  );
}

// ── Subscription Plans management tab ────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// PlansTab — replaces lines 4537-5047 in Adminsections.jsx
// Drop this entire function in, replacing the existing PlansTab.
// ────────────────────────────────────────────────────────────────────────────

// ── Curated Lucide icon list used in the icon picker ─────────────────────────
// These names must match exactly the keys in ICON_MAP inside subscriptionplans.jsx
const ICON_PICKER_LIST = [
  {name:"user",       label:"User",          path:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"},
  {name:"star",       label:"Star",          path:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"},
  {name:"store",      label:"Store",         path:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10"},
  {name:"package",    label:"Package",       path:"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"},
  {name:"zap",        label:"Zap",           path:"M13 2L3 14h9l-1 8 10-12h-9l1-8z"},
  {name:"crown",      label:"Crown",         path:"M2 20h20M5 20V9l7-7 7 7v11"},
  {name:"shield",     label:"Shield",        path:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"},
  {name:"gift",       label:"Gift",          path:"M20 12v10H4V12M2 7h20v5H2z M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"},
  {name:"gem",        label:"Gem",           path:"M6 3h12l4 6-10 13L2 9z M2 9h20"},
  {name:"rocket",     label:"Rocket",        path:"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"},
  {name:"shopping_bag",label:"Bag",          path:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0"},
  {name:"tag",        label:"Tag",           path:"M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01"},
  {name:"trending_up",label:"Trending",      path:"M23 6l-9.5 9.5-5-5L1 18"},
  {name:"bar_chart",  label:"Chart",         path:"M18 20V10 M12 20V4 M6 20v-6"},
  {name:"layout",     label:"Layout",        path:"M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M3 9h18 M9 21V9"},
  {name:"globe",      label:"Globe",         path:"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"},
  {name:"layers",     label:"Layers",        path:"M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5"},
  {name:"box",        label:"Box",           path:"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"},
  {name:"award",      label:"Award",         path:"M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.21 13.89L7 23l5-3 5 3-1.21-9.12"},
  {name:"briefcase",  label:"Briefcase",     path:"M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"},
  {name:"dollar",     label:"Dollar",        path:"M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"},
  {name:"key",        label:"Key",           path:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"},
  {name:"lock",       label:"Lock",          path:"M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4"},
  {name:"users",      label:"Users",         path:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"},
  {name:"truck",      label:"Truck",         path:"M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"},
  {name:"sparkles",   label:"Sparkles",      path:"M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z M19 1v4 M21 3h-4 M5 17v2 M6 18H4"},
  {name:"target",     label:"Target",        path:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"},
  {name:"pie_chart",  label:"Pie",           path:"M21.21 15.89A10 10 0 1 1 8 2.83 M22 12A10 10 0 0 0 12 2v10z"},
  {name:"cart",       label:"Cart",          path:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18"},
  {name:"settings",   label:"Settings",      path:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"},
  {name:"feather",    label:"Feather",       path:"M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z M16 8L2 22 M17.5 15H9"},
  {name:"coffee",     label:"Coffee",        path:"M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3"},
  {name:"heart",      label:"Heart",         path:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"},
];

// ── Inline SVG icon renderer for the admin picker ─────────────────────────────
function AdminIcon({path, size = 16, color = "currentColor"}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

// ── Icon picker overlay ───────────────────────────────────────────────────────
function IconPicker({value, onChange, onClose}) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? ICON_PICKER_LIST.filter((ic) =>
        ic.name.includes(search.toLowerCase()) ||
        ic.label.toLowerCase().includes(search.toLowerCase()))
    : ICON_PICKER_LIST;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
        zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
      <div style={{
        width: "100%", maxWidth: 480, background: "#111",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18,
        overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.9)", maxHeight: "80vh",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />
        <div style={{padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, alignItems: "center"}}>
          <input
            autoFocus
            placeholder="Search icons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff", fontSize: 13, padding: "8px 12px",
              borderRadius: 9, outline: "none", fontFamily: "inherit",
            }}
          />
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
          gap: 6, padding: 16, overflowY: "auto", maxHeight: 400,
        }}>
          {filtered.map((ic) => (
            <button
              key={ic.name}
              title={ic.label}
              onClick={() => { onChange(ic.name); onClose(); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 4, padding: "10px 4px",
                background: value === ic.name ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${value === ic.name ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (value !== ic.name) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (value !== ic.name) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }
              }}>
              <AdminIcon path={ic.path} size={18} color={value === ic.name ? "#ef4444" : "rgba(255,255,255,0.6)"} />
              <span style={{
                color: value === ic.name ? "#ef4444" : "rgba(255,255,255,0.3)",
                fontSize: 8, letterSpacing: "0.05em", textTransform: "uppercase",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: "100%", textAlign: "center",
              }}>{ic.label}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{gridColumn: "1/-1", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, padding: 24}}>
              No icons matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Type color dot ────────────────────────────────────────────────────────────
const TYPE_COLORS = { buyer: "#3b82f6", brand: "#f59e0b", none: "rgba(255,255,255,0.25)", "": "rgba(255,255,255,0.25)" };

// ── PlansTab ──────────────────────────────────────────────────────────────────
function PlansTab() {
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | {mode:"create"|"edit", plan?:{}}
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const showToast = (msg, isErr = false) => {
    setToast({msg, isErr});
    setTimeout(() => setToast(null), 3200);
  };

  const load = () => {
    setLoading(true);
    // Always call the admin endpoint so inactive / all plans are visible
    getAdminSubscriptionPlans()
      .then((d) => {
        // Backend returns { plans: [...], total: N }
        // req() unwraps utils.OK so d = { plans, total }
        const list = d?.plans ?? (Array.isArray(d) ? d : []);
        setPlans(list);
      })
      .catch((err) => {
        console.error("[PlansTab] load error:", err);
        setPlans([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const EMPTY_FORM = {
    name: "", slug: "", description: "",
    plan_type: "none", monthly_price: "", annual_price: "",
    features_raw: "", icon_name: "user",
    sort_order: 0, is_active: true,
    tagline: "", tag: "", cta_text: "", cta_link: "",
    trial_days: 0,
  };

  const openCreate = () => { setForm(EMPTY_FORM); setModal({mode: "create"}); };

  const openEdit = (plan) => {
    // Parse stored features JSON back to +/- textarea lines.
    // features may be a JSON string (from DB) or already an array (if server
    // pre-parsed it). Handle both.
    let featuresRaw = "";
    try {
      const raw = plan.features;
      const fs = Array.isArray(raw) ? raw : JSON.parse(raw || "[]");
      featuresRaw = fs.map((f) => (f.included ? "+" : "-") + f.text).join("\n");
    } catch {}
    setForm({
      name:          plan.name,
      slug:          plan.slug,
      description:   plan.description || "",
      plan_type:     plan.plan_type || "buyer",
      monthly_price: plan.monthly_price,
      annual_price:  plan.annual_price,
      features_raw:  featuresRaw,
      icon_name:     plan.icon_name || "user",
      sort_order:    plan.sort_order,
      is_active:     plan.is_active,
      tagline:       plan.tagline || "",
      tag:           plan.tag || "",
      cta_text:      plan.cta_text || "",
      cta_link:      plan.cta_link || "",
      trial_days:    plan.trial_days ?? 0,
    });
    setModal({mode: "edit", plan});
  };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.slug?.trim()) {
      showToast("Name and slug are required", true);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        monthly_price: parseFloat(form.monthly_price) || 0,
        annual_price:  parseFloat(form.annual_price)  || 0,
        sort_order:    parseInt(form.sort_order)       || 0,
      };
      if (modal.mode === "create") {
        await createSubscriptionPlan(payload);
        showToast("Plan created");
      } else {
        await updateSubscriptionPlan(modal.plan.id, payload);
        showToast("Plan updated");
      }
      setModal(null);
      load();
    } catch (e) {
      showToast(e?.message || "Failed to save plan", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = confirm?.id;
    setConfirm(null);
    try {
      await deleteSubscriptionPlan(id);
      showToast("Plan deleted");
      load();
    } catch (e) {
      showToast("Failed to delete plan", true);
    }
  };

  const fld = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", fontSize: 13, padding: "10px 13px",
    borderRadius: 9, outline: "none", fontFamily: "inherit",
  };
  const lbl = {
    color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700,
    letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 5,
  };
  const sel = {
    ...fld, background: "#1a1a1a",
  };

  // Find the icon path for the currently selected icon
  const selectedIcon = ICON_PICKER_LIST.find((ic) => ic.name === form.icon_name);

  return (
    <div>
      <AnimatePresence>
        {/* ── Delete confirmation ─────────────────────────────────────────────── */}
        {confirm && (
          <ConfirmModal
            title="Delete Plan"
            message={`Delete plan "${confirm.name}"? This won't affect existing subscriptions.`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          />
        )}

        {/* ── Create / Edit modal ─────────────────────────────────────────────── */}
        {modal && (
          <motion.div
            initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
            onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
              zIndex: 9999, display: "flex", alignItems: "center",
              justifyContent: "center", padding: 20,
            }}>

            {/* Icon picker (nested above modal) */}
            {showIconPicker && (
              <IconPicker
                value={form.icon_name}
                onChange={(name) => setForm((p) => ({...p, icon_name: name}))}
                onClose={() => setShowIconPicker(false)}
              />
            )}

            <motion.div
              initial={{opacity: 0, scale: 0.94, y: 16}}
              animate={{opacity: 1, scale: 1, y: 0}}
              exit={{opacity: 0, scale: 0.94}}
              transition={{type: "spring", stiffness: 300, damping: 28}}
              style={{
                width: "100%", maxWidth: 520, background: "#111",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18,
                overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
                maxHeight: "92vh", overflowY: "auto",
              }}>
              <div style={{height: 3, background: "linear-gradient(90deg,#ef4444,transparent)"}} />
              <div style={{
                padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <h3 style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
                  {modal.mode === "create" ? "Create Plan" : "Edit Plan"}
                </h3>
                <button onClick={() => setModal(null)} style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="x" size={11} color="rgba(255,255,255,0.5)" />
                </button>
              </div>

              <div style={{padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14}}>

                {/* ── Row: Name + Slug ──────────────────────────────────────────── */}
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                  <div>
                    <label style={lbl}>Plan Name *</label>
                    <input type="text" value={form.name ?? ""} placeholder="e.g. BLVCK"
                      onChange={(e) => setForm((p) => ({...p, name: e.target.value}))} style={fld} />
                  </div>
                  <div>
                    <label style={lbl}>Slug *</label>
                    <input type="text" value={form.slug ?? ""} placeholder="e.g. blvck"
                      onChange={(e) => setForm((p) => ({...p, slug: e.target.value}))} style={fld} />
                  </div>
                </div>

                {/* ── Plan Type ─────────────────────────────────────────────────── */}
                <div>
                  <label style={lbl}>Plan Type</label>
                  <select value={form.plan_type || "none"}
                    onChange={(e) => setForm((p) => ({...p, plan_type: e.target.value}))} style={sel}>
                    <option value="none">— None (neutral styling, no badge)</option>
                    <option value="buyer">🛍 Buyer (blue accent)</option>
                    <option value="brand">🏷 Brand / Seller (amber accent)</option>
                  </select>
                </div>

                {/* ── Icon picker ───────────────────────────────────────────────── */}
                <div>
                  <label style={lbl}>Icon</label>
                  <div style={{display: "flex", alignItems: "center", gap: 10}}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {selectedIcon
                        ? <AdminIcon path={selectedIcon.path} size={20} color="rgba(255,255,255,0.7)" />
                        : <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>?</span>
                      }
                    </div>
                    <div style={{flex: 1}}>
                      <input type="text" value={form.icon_name || ""} placeholder="icon name"
                        onChange={(e) => setForm((p) => ({...p, icon_name: e.target.value}))}
                        style={{...fld, marginBottom: 0}} />
                    </div>
                    <button
                      onClick={() => setShowIconPicker(true)}
                      style={{
                        padding: "10px 14px", background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
                        borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}>
                      Browse
                    </button>
                  </div>
                </div>

                {/* ── Prices ────────────────────────────────────────────────────── */}
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                  <div>
                    <label style={lbl}>Monthly Price</label>
                    <input type="number" step="0.01" value={form.monthly_price ?? ""} placeholder="0.00"
                      onChange={(e) => setForm((p) => ({...p, monthly_price: e.target.value}))} style={fld} />
                  </div>
                  <div>
                    <label style={lbl}>Annual Price (per mo)</label>
                    <input type="number" step="0.01" value={form.annual_price ?? ""} placeholder="0.00"
                      onChange={(e) => setForm((p) => ({...p, annual_price: e.target.value}))} style={fld} />
                  </div>
                </div>

                {/* ── Free Trial Period ────────────────────────────────────────────── */}
                <div>
                  <label style={lbl}>Free Trial Period</label>
                  <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginBottom: 6, lineHeight: 1.5}}>
                    First N days are free before paid billing starts. 0 = no trial.
                    Common: 7 (1 week) · 30 (1 month) · 90 (3 months) · 365 (1 year)
                  </p>
                  <div style={{display: "flex", alignItems: "center", gap: 10}}>
                    <input
                      type="number" min="0" max="365" step="1"
                      value={form.trial_days ?? 0}
                      onChange={(e) => setForm((p) => ({...p, trial_days: parseInt(e.target.value) || 0}))}
                      style={{...fld, width: 100}} />
                    <span style={{color: "rgba(255,255,255,0.3)", fontSize: 12}}>days</span>
                    {(form.trial_days > 0) && (
                      <span style={{
                        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                        color: "#22c55e", fontSize: 10, fontWeight: 700, padding: "3px 10px",
                        borderRadius: 99, letterSpacing: "0.1em",
                      }}>
                        {form.trial_days >= 365
                          ? `${Math.round(form.trial_days/365)} year${Math.round(form.trial_days/365)>1?"s":""} free`
                          : form.trial_days >= 30
                            ? `${Math.round(form.trial_days/30)} month${Math.round(form.trial_days/30)>1?"s":""} free`
                            : `${form.trial_days} day${form.trial_days>1?"s":""} free`}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Tagline + Tag ─────────────────────────────────────────────── */}
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                  <div>
                    <label style={lbl}>Tagline</label>
                    <input type="text" value={form.tagline ?? ""} placeholder="For the real ones"
                      onChange={(e) => setForm((p) => ({...p, tagline: e.target.value}))} style={fld} />
                  </div>
                  <div>
                    <label style={lbl}>Badge Label</label>
                    <input type="text" value={form.tag ?? ""} placeholder="Most Popular"
                      onChange={(e) => setForm((p) => ({...p, tag: e.target.value}))} style={fld} />
                  </div>
                </div>

                {/* ── CTA ───────────────────────────────────────────────────────── */}
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                  <div>
                    <label style={lbl}>CTA Text</label>
                    <input type="text" value={form.cta_text ?? ""} placeholder="Get Started"
                      onChange={(e) => setForm((p) => ({...p, cta_text: e.target.value}))} style={fld} />
                  </div>
                  <div>
                    <label style={lbl}>CTA Link</label>
                    <input type="text" value={form.cta_link ?? ""} placeholder="/register"
                      onChange={(e) => setForm((p) => ({...p, cta_link: e.target.value}))} style={fld} />
                  </div>
                </div>

                {/* ── Description ───────────────────────────────────────────────── */}
                <div>
                  <label style={lbl}>Description</label>
                  <textarea value={form.description ?? ""} rows={2} placeholder="Short description"
                    onChange={(e) => setForm((p) => ({...p, description: e.target.value}))}
                    style={{...fld, resize: "vertical", lineHeight: 1.6}} />
                </div>

                {/* ── Features ──────────────────────────────────────────────────── */}
                <div>
                  <label style={lbl}>Features</label>
                  <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, marginBottom: 6, lineHeight: 1.5}}>
                    One feature per line. Prefix with <code style={{color: "#22c55e"}}>+</code> for included, <code style={{color: "#ef4444"}}>-</code> for excluded (shows as strikethrough).
                  </p>
                  <textarea
                    value={form.features_raw ?? ""}
                    rows={7}
                    placeholder={"+Browse all verified listings\n+Wishlist up to 10 items\n-Early drop access\n-Exclusive discounts"}
                    onChange={(e) => setForm((p) => ({...p, features_raw: e.target.value}))}
                    style={{...fld, resize: "vertical", lineHeight: 1.7, fontFamily: "monospace", fontSize: 12}}
                  />
                </div>

                {/* ── Sort Order ────────────────────────────────────────────────── */}
                <div>
                  <label style={lbl}>Sort Order</label>
                  <input type="number" value={form.sort_order ?? 0} placeholder="0"
                    onChange={(e) => setForm((p) => ({...p, sort_order: e.target.value}))} style={fld} />
                </div>

                {/* ── Is Active toggle ──────────────────────────────────────────── */}
                <div>
                  <label style={lbl}>Status</label>
                  <div
                    onClick={() => setForm((p) => ({...p, is_active: !p.is_active}))}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: form.is_active ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${form.is_active ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 10, padding: "11px 14px", cursor: "pointer", transition: "all 0.2s",
                    }}>
                    <span style={{color: form.is_active ? "#22c55e" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700}}>
                      {form.is_active ? "Active" : "Inactive"}
                    </span>
                    <div style={{
                      width: 40, height: 22, borderRadius: 99,
                      background: form.is_active ? "#22c55e" : "rgba(255,255,255,0.1)",
                      position: "relative", transition: "background 0.2s",
                    }}>
                      <div style={{
                        position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%",
                        left: form.is_active ? 20 : 3, background: "#fff",
                        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                      }} />
                    </div>
                  </div>
                </div>

                {/* ── Save / Cancel ─────────────────────────────────────────────── */}
                <div style={{display: "flex", gap: 10, marginTop: 4}}>
                  <button onClick={handleSave} disabled={saving} style={{
                    flex: 1, background: saving ? "#7f1d1d" : "#ef4444",
                    color: "#fff", border: "none", borderRadius: 9, padding: "12px",
                    fontSize: 12, fontWeight: 800, letterSpacing: "0.14em",
                    textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer",
                  }}>
                    {saving ? "Saving..." : modal.mode === "create" ? "Create Plan" : "Update Plan"}
                  </button>
                  <button onClick={() => setModal(null)} style={{
                    padding: "12px 20px", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                    borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header row ─────────────────────────────────────────────────────────── */}
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
        <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0}}>
          {plans.length} plan{plans.length !== 1 ? "s" : ""}
          {plans.some((p) => p.is_popular) && (
            <span style={{color: "#ef4444", marginLeft: 8, fontSize: 10}}>
              ✦ {plans.find((p) => p.is_popular)?.name} is most popular
            </span>
          )}
        </p>
        <button onClick={openCreate} style={{
          padding: "10px 16px", background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444",
          borderRadius: 9, fontSize: 11, fontWeight: 700,
          cursor: "pointer", whiteSpace: "nowrap",
        }}>
          + New Plan
        </button>
      </div>

      {/* ── Type legend ────────────────────────────────────────────────────────── */}
      <div style={{display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap"}}>
        {[
          {label: "Buyer plan",       color: "#3b82f6"},
          {label: "Brand / Seller",   color: "#f59e0b"},
          {label: "Most popular",     color: "#ef4444"},
        ].map((l) => (
          <div key={l.label} style={{display: "flex", alignItems: "center", gap: 5}}>
            <div style={{width: 8, height: 8, borderRadius: "50%", background: l.color}} />
            <span style={{color: "rgba(255,255,255,0.3)", fontSize: 10}}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Plan list ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              height: 80, background: "rgba(255,255,255,0.04)", borderRadius: 12,
              animation: "pulse 1.4s infinite", animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div style={{textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.2)", fontSize: 13}}>
          No plans yet. Create your first plan.
        </div>
      ) : (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          {plans.map((plan) => {
            const color = plan.is_popular
              ? "#ef4444"
              : plan.plan_type === "brand"
              ? "#f59e0b"
              : plan.plan_type === "buyer"
              ? "#3b82f6"
              : "rgba(255,255,255,0.25)"; // none → neutral
            const icon = ICON_PICKER_LIST.find((ic) => ic.name === plan.icon_name);
const features = (() => {
  try {
    if (Array.isArray(plan.features)) return plan.features;
    const parsed = JSON.parse(plan.features || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
})();

            return (
              <div key={plan.id} style={{
                background: "#0d0d0d",
                border: `1px solid ${plan.is_popular ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12, padding: "14px 18px",
                display: "flex", alignItems: "flex-start", gap: 14,
              }}>
                {/* Icon bubble */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `${color}18`,
                  border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {icon
                    ? <AdminIcon path={icon.path} size={18} color={color} />
                    : <div style={{width: 8, height: 8, borderRadius: "50%", background: color}} />
                  }
                </div>

                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap"}}>
                    <span style={{color: "#fff", fontWeight: 800, fontSize: 13}}>{plan.name}</span>
                    <span style={{color: "rgba(255,255,255,0.25)", fontSize: 10, fontFamily: "monospace"}}>{plan.slug}</span>
                    {plan.plan_type !== "none" && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
                        textTransform: "uppercase", padding: "2px 7px",
                        borderRadius: 99, border: `1px solid ${color}30`, color: color,
                      }}>
                        {plan.plan_type === "brand" ? "Brand" : "Buyer"}
                      </span>
                    )}
                    {plan.is_popular && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: "0.15em",
                        textTransform: "uppercase", padding: "2px 7px",
                        borderRadius: 99, background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444",
                      }}>✦ Most Popular</span>
                    )}
                    {!plan.is_active && <Badge label="Inactive" color="#6b7280" />}
                  </div>

                  <p style={{color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "0 0 6px"}}>
                    {plan.tagline || plan.description || "—"}
                  </p>

                  <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6, alignItems: "center"}}>
                    <span style={{color: "#22c55e", fontSize: 11, fontWeight: 700}}>
                      {plan.monthly_price === 0 && plan.annual_price === 0
                        ? "Free"
                        : `₦${Number(plan.monthly_price).toLocaleString()}/mo`}
                    </span>
                    {plan.annual_price > 0 && (
                      <span style={{color: "rgba(255,255,255,0.3)", fontSize: 11}}>
                        ₦{Number(plan.annual_price).toLocaleString()}/mo annual
                      </span>
                    )}
                    {plan.trial_days > 0 && (
                      <span style={{
                        background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                        color: "#22c55e", fontSize: 9, fontWeight: 800,
                        padding: "2px 8px", borderRadius: 99, letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}>
                        {plan.trial_days >= 365
                          ? `${Math.round(plan.trial_days/365)}yr free trial`
                          : plan.trial_days >= 30
                            ? `${Math.round(plan.trial_days/30)}mo free trial`
                            : `${plan.trial_days}d free trial`}
                      </span>
                    )}
                    {plan.usage_count > 0 && (
                      <span style={{color: color, fontSize: 11}}>
                        {plan.usage_count} subscriber{plan.usage_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Feature pills */}
                  {features.length > 0 && (
                    <div style={{display: "flex", gap: 4, flexWrap: "wrap"}}>
                      {features.slice(0, 5).map((f, j) => (
                        <span key={j} style={{
                          background: f.included ? "rgba(255,255,255,0.05)" : "rgba(239,68,68,0.05)",
                          color: f.included ? "rgba(255,255,255,0.4)" : "rgba(239,68,68,0.4)",
                          fontSize: 9, padding: "2px 7px", borderRadius: 99,
                          textDecoration: f.included ? "none" : "line-through",
                        }}>
                          {f.text}
                        </span>
                      ))}
                      {features.length > 5 && (
                        <span style={{color: "rgba(255,255,255,0.2)", fontSize: 9}}>
                          +{features.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{display: "flex", gap: 6, flexShrink: 0}}>
                  <button onClick={() => openEdit(plan)} style={{
                    padding: "6px 12px", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                    borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer",
                  }}>Edit</button>
                  <button onClick={() => setConfirm({id: plan.id, name: plan.name})} style={{
                    padding: "6px 12px", background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.15)", color: "rgba(239,68,68,0.6)",
                    borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer",
                  }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 16}}
            style={{
              position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
              background: toast.isErr ? "#ef4444" : "#22c55e",
              color: "#fff", fontSize: 11, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "10px 22px", borderRadius: 99,
              boxShadow: `0 8px 28px ${toast.isErr ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
              zIndex: 9999, whiteSpace: "nowrap",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Newsletter Subscribers tab ────────────────────────────────────────────────
function NewsletterTab() {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [unsubCount, setUnsubCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = {limit: 50};
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    getNewsletterSubscribers(params)
      .then((d) => {
        if (cancelled) return;
        setSubs(d?.subscribers || []);
        setTotal(d?.total ?? 0);
        setActiveCount(d?.active_count ?? 0);
        setUnsubCount(d?.unsub_count ?? 0);
      })
      .catch((err) => {
        if (!cancelled) console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter]);

  const handleDelete = async () => {
    const id = confirm?.id;
    setConfirm(null);
    try {
      await deleteNewsletterSubscriber(id);
      setSubs((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      setActiveCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (sub) => {
    const newStatus = sub.status === "active" ? "unsubscribed" : "active";
    try {
      await updateNewsletterSubscriber(sub.id, {status: newStatus});
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? {...s, status: newStatus} : s)));
      if (newStatus === "unsubscribed") {
        setActiveCount((c) => Math.max(0, c - 1));
        setUnsubCount((c) => c + 1);
      } else {
        setActiveCount((c) => c + 1);
        setUnsubCount((c) => Math.max(0, c - 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cols = [
    {
      key: "email",
      label: "Email",
      render: (s) => (
        <div>
          <p style={{color: "#fff", fontWeight: 600, fontSize: 12, margin: 0}}>{s.email}</p>
          {s.name && (
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>{s.name}</p>
          )}
        </div>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (s) => (
        <span
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.5)",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 99,
            textTransform: "capitalize",
            letterSpacing: "0.06em",
          }}>
          {s.source || "website"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (s) => (
        <Badge label={s.status || "active"} color={s.status === "active" ? "#22c55e" : "#6b7280"} />
      ),
    },
    {
      key: "joined",
      label: "Subscribed",
      render: (s) => (
        <span style={{color: "rgba(255,255,255,0.35)", fontSize: 11}}>{fmtDate(s.created_at)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (s) => (
        <div style={{display: "flex", gap: 6}} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleToggleStatus(s)}
            style={{
              padding: "5px 10px",
              background: s.status === "active" ? "rgba(107,114,128,0.1)" : "rgba(34,197,94,0.08)",
              border: `1px solid ${s.status === "active" ? "rgba(107,114,128,0.2)" : "rgba(34,197,94,0.2)"}`,
              color: s.status === "active" ? "rgba(255,255,255,0.4)" : "#22c55e",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            {s.status === "active" ? "Unsub" : "Reactivate"}
          </button>
          <button
            onClick={() => setConfirm({id: s.id, email: s.email})}
            style={{
              padding: "5px 10px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "rgba(239,68,68,0.6)",
              borderRadius: 7,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            title="Delete Subscriber"
            message={`Permanently remove ${confirm?.email} from the newsletter list?`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      <div
        style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16}}>
        {[
          {label: "Total", value: total, color: "#3b82f6"},
          {label: "Active", value: activeCount, color: "#22c55e"},
          {label: "Unsubscribed", value: unsubCount, color: "#6b7280"},
        ].map(({label, value, color}) => (
          <div
            key={label}
            style={{
              background: `${color}08`,
              border: `1px solid ${color}20`,
              borderRadius: 10,
              padding: "12px 16px",
            }}>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                margin: "0 0 4px",
              }}>
              {label}
            </p>
            <p
              style={{
                color,
                fontSize: 22,
                fontWeight: 900,
                margin: 0,
                fontFamily: "'Bebas Neue', sans-serif",
              }}>
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div style={{display: "flex", gap: 6, marginBottom: 12}}>
        {["", "active", "unsubscribed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${statusFilter === s ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              background: statusFilter === s ? "rgba(239,68,68,0.1)" : "transparent",
              color: statusFilter === s ? "#ef4444" : "rgba(255,255,255,0.4)",
              textTransform: "capitalize",
            }}>
            {s || "All"}
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by email or name..." />

      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        <div style={{padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
          <p style={{color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0}}>
            {total.toLocaleString()} subscribers
          </p>
        </div>
        <AdminTable
          columns={cols}
          rows={subs}
          loading={loading}
          emptyMsg="No newsletter subscribers yet."
        />
      </div>
    </>
  );
}

// ── Newsletter campaigns tab ──────────────────────────────────────────────────
const NL_STATUS_COLOR = {
  draft: "#f59e0b",
  scheduled: "#3b82f6",
  sending: "#a855f7",
  sent: "#22c55e",
  failed: "#ef4444",
};

function NewsletterCampaignsTab() {
  const [newsletters, setNewsletters] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState("list"); // "list" | "compose"
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    subject: "",
    preview_text: "",
    body_html: "",
    audience: "active",
  });
  const [saving, setSaving] = useState(false);
  const [sendConfirm, setSendConfirm] = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, isErr = false) => {
    setToast({msg, isErr});
    setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    setLoading(true);
    const params = {limit: 30};
    if (statusFilter) params.status = statusFilter;
    getNewsletters(params)
      .then((d) => {
        setNewsletters(d?.newsletters || []);
        setTotal(d?.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const openCompose = (nl = null) => {
    if (nl) {
      setForm({
        subject: nl.subject,
        preview_text: nl.preview_text || "",
        body_html: nl.body_html,
        audience: nl.audience || "active",
      });
      setEditing(nl);
    } else {
      setForm({subject: "", preview_text: "", body_html: "", audience: "active"});
      setEditing(null);
    }
    setView("compose");
  };

  const handleSaveDraft = async () => {
    if (!form.subject.trim() || !form.body_html.trim()) {
      showToast("Subject and body are required", true);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateNewsletter(editing.id, form);
        showToast("Draft updated");
      } else {
        await createNewsletter(form);
        showToast("Draft saved");
      }
      setView("list");
      load();
    } catch (e) {
      showToast(e?.message || "Failed to save draft", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    const id = sendConfirm?.id;
    setSendConfirm(null);
    try {
      const res = await sendNewsletter(id);
      showToast(`Sent to ${res?.sent_count ?? "?"} recipients`);
      load();
    } catch (e) {
      showToast(e?.message || "Send failed", true);
    }
  };

  const handleDelete = async () => {
    const id = delConfirm?.id;
    setDelConfirm(null);
    try {
      await deleteNewsletter(id);
      showToast("Newsletter deleted");
      load();
    } catch (e) {
      showToast("Failed to delete", true);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 13,
    padding: "11px 14px",
    borderRadius: 10,
    outline: "none",
    fontFamily: "inherit",
  };
  const lbl = {
    color: "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 5,
  };
  const onFocus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
  const onBlur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

  // ── Compose view ────────────────────────────────────────────────────────────
  if (view === "compose") {
    return (
      <div>
        <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 20}}>
          <button
            onClick={() => setView("list")}
            style={{
              padding: "7px 14px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            ← Back
          </button>
          <div>
            <p style={{color: "#fff", fontWeight: 800, fontSize: 14, margin: 0}}>
              {editing ? "Edit Draft" : "Compose Newsletter"}
            </p>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>
              Save as draft first, then send when ready
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "22px 24px",
          }}>
          <div>
            <label style={lbl}>Subject Line *</label>
            <input
              type="text"
              value={form.subject}
              placeholder="Your email subject…"
              onChange={(e) => setForm((p) => ({...p, subject: e.target.value}))}
              onFocus={onFocus}
              onBlur={onBlur}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={lbl}>
              Preview Text{" "}
              <span
                style={{
                  color: "rgba(255,255,255,0.2)",
                  textTransform: "none",
                  letterSpacing: 0,
                  fontWeight: 400,
                }}>
                — shown below subject in inbox
              </span>
            </label>
            <input
              type="text"
              value={form.preview_text}
              placeholder="One-liner teaser for inbox preview…"
              onChange={(e) => setForm((p) => ({...p, preview_text: e.target.value}))}
              onFocus={onFocus}
              onBlur={onBlur}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={lbl}>Audience</label>
            <select
              value={form.audience}
              onChange={(e) => setForm((p) => ({...p, audience: e.target.value}))}
              onFocus={onFocus}
              onBlur={onBlur}
              style={{...inputStyle, background: "#161616"}}>
              <option value="active">Active subscribers only</option>
              <option value="all">All subscribers</option>
              <option value="unsubscribed">Unsubscribed (re-engagement)</option>
            </select>
          </div>

          <div>
            <label style={lbl}>Email Body (HTML) *</label>
            <textarea
              value={form.body_html}
              placeholder={"<h1>Hello!</h1>\n<p>Your message here…</p>"}
              onChange={(e) => setForm((p) => ({...p, body_html: e.target.value}))}
              onFocus={onFocus}
              onBlur={onBlur}
              rows={16}
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: 1.6,
                fontFamily: "monospace",
                fontSize: 12,
              }}
            />
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 10, margin: "4px 0 0"}}>
              Paste HTML directly. Use inline styles for best email client compatibility.
            </p>
          </div>

          <div style={{display: "flex", gap: 10, paddingTop: 4}}>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                flex: 1,
                padding: "12px",
                background: saving ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: saving ? "rgba(255,255,255,0.3)" : "#fff",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: saving ? "not-allowed" : "pointer",
              }}>
              {saving ? "Saving…" : "Save Draft"}
            </button>
            {editing && editing.status !== "sent" && (
              <button
                onClick={() => setSendConfirm({id: editing.id, subject: editing.subject})}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#ef4444",
                  border: "none",
                  color: "#fff",
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}>
                Send Now →
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {sendConfirm && (
            <ConfirmModal
              title="Send Newsletter"
              message={`Send "${sendConfirm.subject}" to your ${form.audience === "active" ? "active" : form.audience} subscribers? This cannot be undone.`}
              confirmLabel="Send Now"
              danger={false}
              onConfirm={handleSend}
              onCancel={() => setSendConfirm(null)}
            />
          )}
          {toast && (
            <motion.div
              initial={{opacity: 0, y: 16}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 16}}
              style={{
                position: "fixed",
                bottom: 28,
                left: "50%",
                transform: "translateX(-50%)",
                background: toast.isErr ? "#ef4444" : "#22c55e",
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "10px 22px",
                borderRadius: 99,
                boxShadow: `0 8px 28px ${toast.isErr ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
                zIndex: 9999,
                whiteSpace: "nowrap",
              }}>
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div>
      <AnimatePresence>
        {delConfirm && (
          <ConfirmModal
            title="Delete Newsletter"
            message={`Delete "${delConfirm.subject}"? This is permanent.`}
            confirmLabel="Delete"
            danger
            onConfirm={handleDelete}
            onCancel={() => setDelConfirm(null)}
          />
        )}
        {sendConfirm && (
          <ConfirmModal
            title="Send Newsletter"
            message={`Send "${sendConfirm.subject}" to subscribers? This cannot be undone.`}
            confirmLabel="Send Now"
            danger={false}
            onConfirm={handleSend}
            onCancel={() => setSendConfirm(null)}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
          flexWrap: "wrap",
        }}>
        <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
          {["", "draft", "sent", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 13px",
                borderRadius: 99,
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                border: `1px solid ${statusFilter === s ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: statusFilter === s ? "rgba(239,68,68,0.1)" : "transparent",
                color: statusFilter === s ? "#ef4444" : "rgba(255,255,255,0.4)",
                textTransform: "capitalize",
              }}>
              {s || "All"}
            </button>
          ))}
        </div>
        <button
          onClick={() => openCompose()}
          style={{
            padding: "10px 16px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            borderRadius: 9,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
          + Compose
        </button>
      </div>

      {loading ? (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 80,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                animation: "pulse 1.4s infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      ) : newsletters.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 20px",
            color: "rgba(255,255,255,0.2)",
            fontSize: 13,
          }}>
          No newsletters yet.{" "}
          <span
            onClick={() => openCompose()}
            style={{color: "#ef4444", cursor: "pointer", fontWeight: 700}}>
            Compose one →
          </span>
        </div>
      ) : (
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          {newsletters.map((nl) => (
            <div
              key={nl.id}
              style={{
                background: "#0d0d0d",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 3}}>
                  <Badge label={nl.status} color={NL_STATUS_COLOR[nl.status] || "#6b7280"} />
                  <span
                    style={{
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 10,
                      textTransform: "capitalize",
                    }}>
                    {nl.audience}
                  </span>
                </div>
                <p
                  style={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    margin: "0 0 2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                  {nl.subject}
                </p>
                {nl.preview_text && (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: 11,
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                    {nl.preview_text}
                  </p>
                )}
                <div style={{marginTop: 5}}>
                  {nl.sent_at ? (
                    <span style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                      Sent {fmtDate(nl.sent_at)} · {nl.sent_count} recipients
                    </span>
                  ) : (
                    <span style={{color: "rgba(255,255,255,0.2)", fontSize: 10}}>
                      Created {fmtDate(nl.created_at)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{display: "flex", gap: 6, flexShrink: 0}}>
                {nl.status !== "sent" && (
                  <>
                    <button
                      onClick={() => openCompose(nl)}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.6)",
                        borderRadius: 7,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}>
                      Edit
                    </button>
                    <button
                      onClick={() => setSendConfirm({id: nl.id, subject: nl.subject})}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#ef4444",
                        borderRadius: 7,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}>
                      Send
                    </button>
                    <button
                      onClick={() => setDelConfirm({id: nl.id, subject: nl.subject})}
                      style={{
                        padding: "6px 10px",
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.25)",
                        borderRadius: 7,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}>
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 16}}
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.isErr ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 99,
              boxShadow: `0 8px 28px ${toast.isErr ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Root AdminSubscriptions shell ─────────────────────────────────────────────
export function AdminSubscriptions() {
  // Brand billing subscriptions (Plan Definitions / Subscriptions tabs) were
  // removed along with the subscription feature — this now only manages
  // email newsletter campaigns/subscribers, which are unrelated.
  const [tab, setTab] = useState("campaigns");
  const TABS = [
    {id: "campaigns", label: "Newsletters"},
    {id: "subscribers", label: "Subscribers"},
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 18,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          flexWrap: "wrap",
        }}>
        {TABS.map(({id, label}) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "7px 20px",
              borderRadius: 7,
              background: tab === id ? "rgba(239,68,68,0.15)" : "transparent",
              border: tab === id ? "1px solid rgba(239,68,68,0.35)" : "1px solid transparent",
              color: tab === id ? "#ef4444" : "rgba(255,255,255,0.4)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{opacity: 0, y: 6}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0}}
          transition={{duration: 0.15}}>
          {tab === "campaigns" && <NewsletterCampaignsTab />}
          {tab === "subscribers" && <NewsletterTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── SITE PAGES ────────────────────────────────────────────────────────────────
// ── Page field schemas ───────────────────────────────────────────────────────
// Each page has predefined fields so the editor knows exactly what to show.
const SITE_PAGES = [
  // ── HOME ────────────────────────────────────────────────────────────────────
  {
    slug: "home",
    label: "Home",
    desc: "HeroSlider · PerksStrip · FeatureCards · BrandsMarquee · ProductShowcase · Testimonials · FeaturedCollections · PromoBanner · SubscriptionPlans · BlogSection · Services",
    icon: "🏠",
    fields: [
      // ── HeroSlider ─────────────────────────────────────────────────────────
      {
        key: "_hero",
        label: "── Hero Slider ──────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "show_announcement", label: "Show Announcement Bar", type: "toggle", default: false},
      // ── Marquee Items ──────────────────────────────────────────────────────
      {
        key: "_marquee",
        label: "── Announcement Bar Items ───────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "marquee_1",
        label: "Item 1",
        type: "text",
        placeholder: "NEW DROPS",
        hint: "Scrolling text item shown in the top announcement bar",
      },
      {key: "marquee_2", label: "Item 2", type: "text", placeholder: "FREE SHIPPING OVER ₦50,000"},
      {key: "marquee_3", label: "Item 3", type: "text", placeholder: "SELLERS NOW ACCEPTED"},
      {key: "marquee_4", label: "Item 4", type: "text", placeholder: "AUTHENTIC STREETWEAR ONLY"},
      {key: "marquee_5", label: "Item 5", type: "text", placeholder: "NEW DROPS"},
      {key: "marquee_6", label: "Item 6", type: "text", placeholder: "FREE SHIPPING OVER $200"},
      {key: "marquee_7", label: "Item 7", type: "text", placeholder: "SELLERS NOW ACCEPTED"},
      {
        key: "hero_slide_interval",
        label: "Slide Auto-play (ms)",
        type: "text",
        placeholder: "5000",
      },
      {key: "hero_slide1_tag", label: "Slide 1 — Tag", type: "text", placeholder: "NEW ARRIVALS"},
      {
        key: "hero_slide1_title",
        label: "Slide 1 — Title",
        type: "textarea",
        placeholder: "DRESS\nDIFFERENT.",
      },
      {
        key: "hero_slide1_sub",
        label: "Slide 1 — Subtitle",
        type: "text",
        placeholder: "Exclusive streetwear drops from verified sellers.",
      },
      {key: "hero_slide1_cta", label: "Slide 1 — CTA Text", type: "text", placeholder: "SHOP NOW"},
      {key: "hero_slide1_link", label: "Slide 1 — CTA Link", type: "text", placeholder: "/shop"},
      {key: "hero_slide2_tag", label: "Slide 2 — Tag", type: "text", placeholder: "TOP SELLERS"},
      {
        key: "hero_slide2_title",
        label: "Slide 2 — Title",
        type: "textarea",
        placeholder: "WEAR YOUR\nCULTURE.",
      },
      {
        key: "hero_slide2_sub",
        label: "Slide 2 — Subtitle",
        type: "text",
        placeholder: "Connect with sellers pushing the culture forward.",
      },
      {key: "hero_slide2_cta", label: "Slide 2 — CTA Text", type: "text", placeholder: "EXPLORE"},
      {key: "hero_slide2_link", label: "Slide 2 — CTA Link", type: "text", placeholder: "/shop"},
      {key: "hero_slide3_tag", label: "Slide 3 — Tag", type: "text", placeholder: "SELL WITH US"},
      {
        key: "hero_slide3_title",
        label: "Slide 3 — Title",
        type: "textarea",
        placeholder: "GOT HEAT?\nSELL IT.",
      },
      {
        key: "hero_slide3_sub",
        label: "Slide 3 — Subtitle",
        type: "text",
        placeholder: "List your items and reach thousands of buyers.",
      },
      {
        key: "hero_slide3_cta",
        label: "Slide 3 — CTA Text",
        type: "text",
        placeholder: "START SELLING",
      },
      {key: "hero_slide3_link", label: "Slide 3 — CTA Link", type: "text", placeholder: "/sell"},
      // ── PerksStrip ─────────────────────────────────────────────────────────
      {
        key: "_perks",
        label: "── Perks Strip ─────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "perk1_title", label: "Perk 1 — Title", type: "text", placeholder: "100% Authentic"},
      {
        key: "perk1_sub",
        label: "Perk 1 — Sub",
        type: "text",
        placeholder: "Every item verified before it hits the market.",
      },
      {key: "perk2_title", label: "Perk 2 — Title", type: "text", placeholder: "Free Shipping"},
      {
        key: "perk2_sub",
        label: "Perk 2 — Sub",
        type: "text",
        placeholder: "On all orders over ₦50,000. No code needed.",
      },
      {key: "perk3_title", label: "Perk 3 — Title", type: "text", placeholder: "Limited Drops"},
      {
        key: "perk3_sub",
        label: "Perk 3 — Sub",
        type: "text",
        placeholder: "Scarce by design. Exclusive by nature.",
      },
      // ── FeatureCards ───────────────────────────────────────────────────────
      {
        key: "_features",
        label: "── Feature Cards ───────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "features_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "✦ Why BLVCKMRKT",
      },
      {
        key: "features_section_title",
        label: "Section Title",
        type: "text",
        placeholder: "BUILT FOR THE CULTURE.",
      },
      {
        key: "features_section_subtitle",
        label: "Section Subtitle",
        type: "text",
        placeholder: "Everything you need. Nothing you don't.",
      },
      {key: "feature1_tag", label: "Card 1 — Tag", type: "text", placeholder: "01 — DROPS"},
      {
        key: "feature1_title",
        label: "Card 1 — Title",
        type: "textarea",
        placeholder: "EXCLUSIVE\nRELEASES",
      },
      {
        key: "feature1_body",
        label: "Card 1 — Body",
        type: "textarea",
        placeholder: "Limited-edition pieces you won't find anywhere else.",
      },
      {key: "feature1_cta", label: "Card 1 — CTA", type: "text", placeholder: "SEE DROPS"},
      {key: "feature1_link", label: "Card 1 — Link", type: "text", placeholder: "/drops"},
      {key: "feature2_tag", label: "Card 2 — Tag", type: "text", placeholder: "02 — BRANDS"},
      {
        key: "feature2_title",
        label: "Card 2 — Title",
        type: "textarea",
        placeholder: "VERIFIED\nHEAT ONLY",
      },
      {
        key: "feature2_body",
        label: "Card 2 — Body",
        type: "textarea",
        placeholder: "Every item listed passes through our brand verification.",
      },
      {key: "feature2_cta", label: "Card 2 — CTA", type: "text", placeholder: "MEET BRANDS"},
      {key: "feature2_link", label: "Card 2 — Link", type: "text", placeholder: "/brands"},
      {key: "feature3_tag", label: "Card 3 — Tag", type: "text", placeholder: "03 — CULTURE"},
      {
        key: "feature3_title",
        label: "Card 3 — Title",
        type: "textarea",
        placeholder: "WEAR THE\nSTREETS",
      },
      {
        key: "feature3_body",
        label: "Card 3 — Body",
        type: "textarea",
        placeholder: "Streetwear isn't fashion — it's identity.",
      },
      {key: "feature3_cta", label: "Card 3 — CTA", type: "text", placeholder: "SHOP NOW"},
      {key: "feature3_link", label: "Card 3 — Link", type: "text", placeholder: "/shop"},
      // ── BrandsMarquee ──────────────────────────────────────────────────────
      {
        key: "_brands_marquee",
        label: "── Brands Marquee ──────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "brands_section_title",
        label: "Section Title",
        type: "text",
        placeholder: "Top Brands",
      },
      {
        key: "brands_view_all_text",
        label: "View All Link Text",
        type: "text",
        placeholder: "View All Brands",
      },
      {
        key: "brands_view_all_link",
        label: "View All Link URL",
        type: "text",
        placeholder: "/brands",
      },
      // ── ProductShowcase ────────────────────────────────────────────────────
      {
        key: "_products",
        label: "── Product Showcase ────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "products_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "✦ Fresh Off The Rack",
      },
      {
        key: "products_section_title",
        label: "Section Title",
        type: "text",
        placeholder: "LATEST DROPS",
      },
      {
        key: "products_section_subtitle",
        label: "Section Subtitle",
        type: "text",
        placeholder: "New heat, verified sellers, ready to ship.",
      },
      {
        key: "products_view_all_text",
        label: "View All Button",
        type: "text",
        placeholder: "VIEW ALL PRODUCTS",
      },
      // ── FeaturedCollections ────────────────────────────────────────────────
      {
        key: "_collections",
        label: "── Featured Collections ─────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "collections_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "✦ Shop By Category",
      },
      {
        key: "collections_section_title",
        label: "Section Title",
        type: "text",
        placeholder: "FEATURED COLLECTIONS",
      },
      {
        key: "collections_section_subtitle",
        label: "Section Subtitle",
        type: "text",
        placeholder: "Dare to mix and match — level up your fit game",
      },
      {
        key: "collections_view_all_text",
        label: "View All Button",
        type: "text",
        placeholder: "SHOP ALL COLLECTIONS",
      },
      // ── PromoBanner ────────────────────────────────────────────────────────
      {
        key: "_promo",
        label: "── Promo Banner ─────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "promo_tag", label: "Promo Tag", type: "text", placeholder: "Exclusive Offer"},
      {
        key: "promo_headline",
        label: "Headline",
        type: "textarea",
        placeholder: "YOUR FIRST ORDER\n10% OFF.",
      },
      {
        key: "promo_body",
        label: "Body Text",
        type: "textarea",
        placeholder:
          "Subscribe to the BLVCKMRKT newsletter and unlock your exclusive 10% discount.",
      },
      {key: "promo_cta", label: "CTA Button Text", type: "text", placeholder: "GET 10% OFF"},
      {
        key: "promo_fine_print",
        label: "Fine Print",
        type: "text",
        placeholder: "No spam. Unsubscribe anytime. Offer valid for first-time subscribers only.",
      },
      {
        key: "promo_image_overlay",
        label: "Image Overlay Text",
        type: "textarea",
        placeholder: "COME AND ENJOY\nTHE BLVCKMRKT SALE",
      },
      {key: "promo_discount_pct", label: "Discount % (badge)", type: "text", placeholder: "10%"},
      // ── SubscriptionPlans ──────────────────────────────────────────────────
      {
        key: "_plans",
        label: "── Subscription Plans ──────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "plans_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "✦ Choose Your Plan",
      },
      {
        key: "plans_section_title",
        label: "Section Title",
        type: "text",
        placeholder: "SUBSCRIPTION MODEL",
      },
      {
        key: "plans_section_subtitle",
        label: "Section Subtitle",
        type: "text",
        placeholder: "Flexible plans for buyers and sellers of all levels",
      },
      {key: "plans_save_badge", label: "Annual Save Badge", type: "text", placeholder: "Save 25%"},
      {
        key: "plans_footer_note",
        label: "Footer Note",
        type: "text",
        placeholder: "All plans include SSL security · Cancel anytime · No hidden fees",
      },
      {
        key: "plans_starter_tagline",
        label: "Starter — Tagline",
        type: "text",
        placeholder: "Start exploring the culture",
      },
      {
        key: "plans_starter_cta",
        label: "Starter — CTA",
        type: "text",
        placeholder: "Get Started Free",
      },
      {
        key: "plans_blvck_tagline",
        label: "BLVCK — Tagline",
        type: "text",
        placeholder: "For the real ones",
      },
      {key: "plans_blvck_cta", label: "BLVCK — CTA", type: "text", placeholder: "Go BLVCK"},
      {
        key: "plans_mrkt_tagline",
        label: "MRKT PRO — Tagline",
        type: "text",
        placeholder: "Sell without limits",
      },
      {key: "plans_mrkt_cta", label: "MRKT PRO — CTA", type: "text", placeholder: "Start Selling"},
      // ── BlogSection ────────────────────────────────────────────────────────
      {
        key: "_blog",
        label: "── Blog Section ────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "blog_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "✦ From The Culture",
      },
      {key: "blog_section_title", label: "Section Title", type: "text", placeholder: "LATEST BLOG"},
      {
        key: "blog_view_all_text",
        label: "View All Button",
        type: "text",
        placeholder: "VIEW ALL POSTS",
      },
      {key: "blog_view_all_link", label: "View All Link URL", type: "text", placeholder: "/blog"},
      // ── Services ───────────────────────────────────────────────────────────
      {
        key: "_services",
        label: "── Services ─────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "services_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "✦ What We Offer",
      },
      {
        key: "services_section_title",
        label: "Section Title",
        type: "text",
        placeholder: "OUR SERVICES",
      },
      {
        key: "services_section_subtitle",
        label: "Section Subtitle",
        type: "text",
        placeholder: "Everything you need — whether you're buying, selling, or building a brand",
      },
      {
        key: "service1_title",
        label: "Service 1 — Title",
        type: "text",
        placeholder: "Buy Authentic Gear",
      },
      {
        key: "service1_desc",
        label: "Service 1 — Desc",
        type: "textarea",
        placeholder:
          "Every product listed on BLVCKMRKT passes through our seller verification process.",
      },
      {key: "service1_cta", label: "Service 1 — CTA", type: "text", placeholder: "Start Shopping"},
      {
        key: "service2_title",
        label: "Service 2 — Title",
        type: "text",
        placeholder: "Sell Your Heat",
      },
      {
        key: "service2_desc",
        label: "Service 2 — Desc",
        type: "textarea",
        placeholder:
          "Got pieces collecting dust? List them on BLVCKMRKT and reach thousands of verified buyers.",
      },
      {key: "service2_cta", label: "Service 2 — CTA", type: "text", placeholder: "Start Selling"},
      {
        key: "service3_title",
        label: "Service 3 — Title",
        type: "text",
        placeholder: "Brand Verification",
      },
      {
        key: "service3_desc",
        label: "Service 3 — Desc",
        type: "textarea",
        placeholder:
          "Apply for a verified brand profile, get a badge, and list your official drops.",
      },
      {key: "service3_cta", label: "Service 3 — CTA", type: "text", placeholder: "Apply as Brand"},
      {
        key: "service4_title",
        label: "Service 4 — Title",
        type: "text",
        placeholder: "Exclusive Drops",
      },
      {
        key: "service4_desc",
        label: "Service 4 — Desc",
        type: "textarea",
        placeholder: "BLVCKMRKT hosts time-limited drops from verified sellers and brands.",
      },
      {key: "service4_cta", label: "Service 4 — CTA", type: "text", placeholder: "See Drops"},
      {
        key: "service5_title",
        label: "Service 5 — Title",
        type: "text",
        placeholder: "Authentication Service",
      },
      {
        key: "service5_desc",
        label: "Service 5 — Desc",
        type: "textarea",
        placeholder:
          "Submit it to our in-house authentication team. We check stitching, labels, tags, sole patterns and more.",
      },
      {
        key: "service5_cta",
        label: "Service 5 — CTA",
        type: "text",
        placeholder: "Get Authenticated",
      },
      // ── Testimonials ───────────────────────────────────────────────────────
      {
        key: "_testimonials",
        label: "── Testimonials ─────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "testimonials_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "✦ What They're Saying",
      },
      {
        key: "testimonials_section_title",
        label: "Section Title",
        type: "text",
        placeholder: "SATISFIED CLIENTS SPEAK.",
      },
    ],
  },

  // ── ABOUT ───────────────────────────────────────────────────────────────────
  {
    slug: "about",
    label: "About",
    desc: "Page Header · AboutSection · TeamSection · WhyChooseUs · WorkingProcess",
    icon: "👥",
    fields: [
      // ── Page Header ────────────────────────────────────────────────────────
      {
        key: "_header",
        label: "── Page Header ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "page_title",
        label: "Page Title",
        type: "text",
        placeholder: "About Us",
        hint: "The large text shown in the page header banner at the top",
      },
      {
        key: "page_header_image",
        label: "Header Background Image URL",
        type: "text",
        placeholder: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1600&q=80",
        hint: "Full URL to the banner background image",
      },

      // ── About Section — Intro ──────────────────────────────────────────────
      {
        key: "_about_intro",
        label: "── About Section — Intro Text ───────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "intro_heading",
        label: "Intro Heading (line 1)",
        type: "text",
        placeholder: "WE'RE THE MARKETPLACE",
        hint: "First line of the big heading — shown in white",
      },
      {
        key: "intro_heading_red",
        label: "Intro Heading (line 2 — red)",
        type: "text",
        placeholder: "BUILT FOR THE STREETS.",
        hint: "Second line of the big heading — shown in red",
      },
      {
        key: "intro_body1",
        label: "Body Paragraph 1",
        type: "textarea",
        placeholder:
          "BLVCKMRKT was built for one reason — to give streetwear culture a home. A place where buyers can find authentic pieces, sellers can reach real audiences, and brands can connect directly with the community that fuels them.",
        hint: "First paragraph below the heading (slightly brighter text)",
      },
      {
        key: "intro_body2",
        label: "Body Paragraph 2",
        type: "textarea",
        placeholder:
          "No middlemen, no fakes, no noise. Just verified heat, trusted sellers, and a community that actually lives the culture.",
        hint: "Second paragraph (slightly dimmer text)",
      },
      {key: "intro_cta_text", label: "Primary Button Text", type: "text", placeholder: "Shop Now"},
      {key: "intro_cta_link", label: "Primary Button Link", type: "text", placeholder: "/shop"},

      // ── About Section — Stats row ──────────────────────────────────────────
      {
        key: "_about_stats",
        label: "── About Section — Stats Row ────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "stat1_value", label: "Stat 1 — Number / Value", type: "text", placeholder: "12K+"},
      {key: "stat1_label", label: "Stat 1 — Label", type: "text", placeholder: "Verified Buyers"},
      {key: "stat2_value", label: "Stat 2 — Number / Value", type: "text", placeholder: "3.4K+"},
      {key: "stat2_label", label: "Stat 2 — Label", type: "text", placeholder: "Active Sellers"},
      {key: "stat3_value", label: "Stat 3 — Number / Value", type: "text", placeholder: "98%"},
      {
        key: "stat3_label",
        label: "Stat 3 — Label",
        type: "text",
        placeholder: "Authentic Products",
      },
      {key: "stat4_value", label: "Stat 4 — Number / Value", type: "text", placeholder: "50+"},
      {key: "stat4_label", label: "Stat 4 — Label", type: "text", placeholder: "Top Brands"},

      // ── About Section — 3 Highlight Cards ─────────────────────────────────
      {
        key: "_about_highlights",
        label: "── About Section — 3 Highlight Cards ───────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "hl1_title",
        label: "Card 1 — Title",
        type: "text",
        placeholder: "100% Verified Products",
      },
      {
        key: "hl1_desc",
        label: "Card 1 — Description",
        type: "textarea",
        placeholder:
          "Every listing passes authentication before going live. No fakes, no grey market. Just genuine heat.",
      },
      {
        key: "hl2_title",
        label: "Card 2 — Title",
        type: "text",
        placeholder: "Community of Sellers",
      },
      {
        key: "hl2_desc",
        label: "Card 2 — Description",
        type: "textarea",
        placeholder:
          "From solo resellers to established brands — our verified seller network is built on trust and transparency.",
      },
      {
        key: "hl3_title",
        label: "Card 3 — Title",
        type: "text",
        placeholder: "Exclusive Drop Access",
      },
      {
        key: "hl3_desc",
        label: "Card 3 — Description",
        type: "textarea",
        placeholder:
          "Be first in line. Subscribers get early access to limited releases before they hit the open market.",
      },

      // ── About Section — Mission block ─────────────────────────────────────
      {
        key: "_about_mission",
        label: "── About Section — Our Mission Block ───────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "mission_heading_line1",
        label: "Mission Heading — Line 1",
        type: "text",
        placeholder: "MAKING AUTHENTIC",
      },
      {
        key: "mission_heading_line2",
        label: "Mission Heading — Line 2",
        type: "text",
        placeholder: "STREETWEAR ACCESSIBLE",
        hint: "Middle line — the red word is pulled from it automatically (last word goes red)",
      },
      {
        key: "mission_heading_line3",
        label: "Mission Heading — Line 3",
        type: "text",
        placeholder: "TO EVERYONE.",
      },
      {
        key: "mission_body1",
        label: "Mission Body Paragraph 1",
        type: "textarea",
        placeholder:
          "The resale market is broken. Fakes flood every platform, prices are inflated, and real buyers get burned. BLVCKMRKT exists to fix that — by creating a space where authenticity is the only standard.",
      },
      {
        key: "mission_body2",
        label: "Mission Body Paragraph 2",
        type: "textarea",
        placeholder:
          "Whether you're a brand wanting to reach your audience directly, a seller turning passion into income, or a buyer hunting for that piece you can't find anywhere else — BLVCKMRKT is built for you.",
      },
      {key: "mission_stat1_value", label: "Mini Stat 1 — Value", type: "text", placeholder: "2023"},
      {
        key: "mission_stat1_label",
        label: "Mini Stat 1 — Label",
        type: "text",
        placeholder: "Founded",
      },
      {
        key: "mission_stat2_value",
        label: "Mini Stat 2 — Value",
        type: "text",
        placeholder: "3 Continents",
      },
      {
        key: "mission_stat2_label",
        label: "Mini Stat 2 — Label",
        type: "text",
        placeholder: "Reach",
      },
      {
        key: "mission_stat3_value",
        label: "Mini Stat 3 — Value",
        type: "text",
        placeholder: "Zero Fakes",
      },
      {
        key: "mission_stat3_label",
        label: "Mini Stat 3 — Label",
        type: "text",
        placeholder: "Policy",
      },

      // ── Team Section ───────────────────────────────────────────────────────
      {
        key: "_team",
        label: "── Team Section ─────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "team_heading_line1",
        label: "Team Heading — Line 1 (white)",
        type: "text",
        placeholder: "THE PEOPLE BEHIND",
      },
      {
        key: "team_heading_line2",
        label: "Team Heading — Line 2 (red)",
        type: "text",
        placeholder: "BLVCKMRKT",
      },
      {
        key: "team_subtitle",
        label: "Team Subtitle / Description",
        type: "textarea",
        placeholder:
          "A crew of streetwear heads, tech builders, and culture advocates — united by one mission: making authentic streetwear accessible to everyone.",
      },

      // ── Why Choose Us ──────────────────────────────────────────────────────
      {
        key: "_why",
        label: "── Why Choose Us Section ────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "why_heading_line1",
        label: "Why Heading — Line 1 (white)",
        type: "text",
        placeholder: "THE ONLY PLATFORM",
      },
      {
        key: "why_heading_line2",
        label: "Why Heading — Line 2 (white + red last word)",
        type: "text",
        placeholder: "BUILT FOR REAL ONES.",
        hint: "Last word of this line automatically turns red",
      },
      {
        key: "why_subtitle",
        label: "Subtitle / Intro paragraph",
        type: "textarea",
        placeholder:
          "There are a hundred resale platforms out there. Only one was built specifically for streetwear culture — with authenticity, community, and the culture at its core.",
      },
      {
        key: "why_phone",
        label: "Contact Phone Number",
        type: "text",
        placeholder: "+1 (800) 255-9638",
        hint: "Shown in the 'Call Us Now' strip at the bottom of this section",
      },
      {
        key: "why1_title",
        label: "Reason 1 — Title",
        type: "text",
        placeholder: "Zero Fakes Guaranteed",
      },
      {
        key: "why1_desc",
        label: "Reason 1 — Description",
        type: "textarea",
        placeholder:
          "Every product is authenticated before listing. Our team checks stitching, tags, soles and serial numbers — so you never waste money on a fake.",
      },
      {
        key: "why2_title",
        label: "Reason 2 — Title",
        type: "text",
        placeholder: "Exclusive Drop Access",
      },
      {
        key: "why2_desc",
        label: "Reason 2 — Description",
        type: "textarea",
        placeholder:
          "Subscribers get 24-hour early access to limited releases. The rarest pieces go to our community first — always.",
      },
      {
        key: "why3_title",
        label: "Reason 3 — Title",
        type: "text",
        placeholder: "Verified Seller Network",
      },
      {
        key: "why3_desc",
        label: "Reason 3 — Description",
        type: "textarea",
        placeholder:
          "Every seller on BLVCKMRKT is manually verified. Real people, real pieces, real accountability — no anonymous listings.",
      },
      {
        key: "why4_title",
        label: "Reason 4 — Title",
        type: "text",
        placeholder: "Fair Pricing, Low Fees",
      },
      {
        key: "why4_desc",
        label: "Reason 4 — Description",
        type: "textarea",
        placeholder:
          "We don't take a huge cut. Sellers keep more, buyers pay less. Our fee structure is transparent and designed to keep the culture alive.",
      },

      // ── Working Process ────────────────────────────────────────────────────
      {
        key: "_process",
        label: "── Working Process Section ──────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "process_heading",
        label: "Section Heading",
        type: "text",
        placeholder: "HOW BLVCKMRKT WORKS",
        hint: "Last word automatically turns red",
      },
      {
        key: "process_subtitle",
        label: "Section Subtitle",
        type: "textarea",
        placeholder:
          "Simple, safe, and built around trust. From signup to checkout — every step is designed to protect buyers and reward sellers.",
      },
      {
        key: "step1_title",
        label: "Step 1 — Title",
        type: "text",
        placeholder: "Create Your Account",
      },
      {
        key: "step1_desc",
        label: "Step 1 — Description",
        type: "textarea",
        placeholder:
          "Sign up for free in under 2 minutes. Choose whether you're joining as a buyer, seller, or brand — and get verified straight away.",
      },
      {key: "step2_title", label: "Step 2 — Title", type: "text", placeholder: "Browse or List"},
      {
        key: "step2_desc",
        label: "Step 2 — Description",
        type: "textarea",
        placeholder:
          "Buyers explore thousands of verified streetwear pieces. Sellers upload their listings with photos, description, and price — live in minutes.",
      },
      {
        key: "step3_title",
        label: "Step 3 — Title",
        type: "text",
        placeholder: "Authentication Check",
      },
      {
        key: "step3_desc",
        label: "Step 3 — Description",
        type: "textarea",
        placeholder:
          "Every listing goes through our verification process. Our team confirms authenticity before the item is visible to buyers — zero compromise.",
      },
      {key: "step4_title", label: "Step 4 — Title", type: "text", placeholder: "Buy or Get Paid"},
      {
        key: "step4_desc",
        label: "Step 4 — Description",
        type: "textarea",
        placeholder:
          "Buyers checkout securely. Sellers get paid fast. Funds are released once the buyer confirms the item arrived — safe for both sides.",
      },

      // ── Working Process — Bottom CTA Strip ────────────────────────────────
      {
        key: "_process_cta",
        label: "── Working Process — Bottom CTA Strip ─────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "process_cta_heading",
        label: "CTA Heading",
        type: "text",
        placeholder: "READY TO GET STARTED?",
      },
      {
        key: "process_cta_subtitle",
        label: "CTA Subtitle",
        type: "text",
        placeholder: "Join thousands of buyers and sellers already on the platform.",
      },
      {key: "process_cta_btn_text", label: "Button Text", type: "text", placeholder: "Join Now"},
      {key: "process_cta_btn_link", label: "Button Link", type: "text", placeholder: "/register"},
    ],
  },

  // ── SHOP ────────────────────────────────────────────────────────────────────
  {
    slug: "shop",
    label: "Shop",
    desc: "ProductGrid · NewlyDropped — headers, labels, empty states, toggles",
    icon: "🛍",
    fields: [
      // ── Page Header ──────────────────────────────────────────────────────
      {
        key: "_shop_header",
        label: "── Page Header ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "page_title",
        label: "Page Title",
        type: "text",
        placeholder: "Shop",
        hint: "Shown in the large banner at the top of the shop page",
      },
      {
        key: "page_header_image",
        label: "Header Background Image",
        type: "text",
        placeholder: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
      },

      // ── ProductGrid — Section header ─────────────────────────────────────
      {
        key: "_grid_header",
        label: "── Product Grid — Section Header ───────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "grid_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "✦ Fresh Off The Rack",
      },
      {
        key: "grid_section_title",
        label: "Section Title (white part)",
        type: "text",
        placeholder: "BROWSE THE",
        hint: "First part of heading — shown in white",
      },
      {
        key: "grid_section_title_red",
        label: "Section Title (red part)",
        type: "text",
        placeholder: "CATALOGUE",
        hint: "Second part of heading — shown in red",
      },
      {
        key: "grid_result_label",
        label: "Results Count Label",
        type: "text",
        placeholder: "products",
        hint: "e.g. 'products' shows as '12 products found'",
      },

      // ── ProductGrid — Filters & Search ──────────────────────────────────
      {
        key: "_grid_filters",
        label: "── Product Grid — Filters & Search ────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "filters_enabled", label: "Show Filter Sidebar", type: "toggle", default: true},
      {key: "search_enabled", label: "Show Search Bar", type: "toggle", default: true},
      {
        key: "search_placeholder",
        label: "Search Placeholder",
        type: "text",
        placeholder: "Search products, brands...",
      },
      {key: "sort_enabled", label: "Show Sort Dropdown", type: "toggle", default: true},

      // ── ProductGrid — Empty state ────────────────────────────────────────
      {
        key: "_grid_empty",
        label: "── Product Grid — Empty State ─────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "empty_state_msg",
        label: "Empty State Message",
        type: "text",
        placeholder: "No products match your filters.",
      },
      {
        key: "empty_state_cta",
        label: "Empty State Button",
        type: "text",
        placeholder: "Clear All Filters",
      },

      // ── NewlyDropped — Section header ────────────────────────────────────
      {
        key: "_drops_header",
        label: "── Newly Dropped — Section Header ─────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "drops_section_tag",
        label: "Section Tag",
        type: "text",
        placeholder: "Fresh Off The Press",
      },
      {
        key: "drops_section_title_white",
        label: "Title — White word",
        type: "text",
        placeholder: "NEWLY",
        hint: "First word — shown in white",
      },
      {
        key: "drops_section_title_red",
        label: "Title — Red word",
        type: "text",
        placeholder: "DROPPED",
        hint: "Second word — shown in red",
      },
      {
        key: "drops_view_all_text",
        label: "View All Link Text",
        type: "text",
        placeholder: "View All Drops",
      },
      {key: "drops_view_all_link", label: "View All Link URL", type: "text", placeholder: "/drops"},

      // ── NewlyDropped — Card labels ───────────────────────────────────────
      {
        key: "_drops_cards",
        label: "── Newly Dropped — Card Labels ────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "drops_quick_add_text",
        label: "Quick Add Button Text",
        type: "text",
        placeholder: "+ Quick Add",
      },
      {key: "drops_view_text", label: "View Product Link", type: "text", placeholder: "View"},
    ],
  },

  // ── CONTACT ─────────────────────────────────────────────────────────────────
  {
    slug: "contact",
    label: "Contact",
    desc: "ContactInfo · ContactForm · ContactMap — all text, links, hours",
    icon: "📬",
    fields: [
      // ── Page Header ────────────────────────────────────────────────────────
      {
        key: "_contact_header",
        label: "── Page Header ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "page_title", label: "Page Title", type: "text", placeholder: "Contact Us"},
      {
        key: "page_header_image",
        label: "Header Background Image",
        type: "text",
        placeholder: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1600&q=80",
      },

      // ── Contact Details (shared across all 3 components) ──────────────────
      {
        key: "_contact_details",
        label: "── Contact Details ──────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "email", label: "Primary Email", type: "text", placeholder: "hello@blvckmrkt.com"},
      {key: "email2", label: "Secondary Email", type: "text", placeholder: "support@blvckmrkt.com"},
      {key: "phone", label: "Primary Phone", type: "text", placeholder: "+234 801 234 5678"},
      {key: "phone2", label: "Secondary Phone", type: "text", placeholder: "+1 (800) 255-9638"},
      {
        key: "address",
        label: "Office Address",
        type: "textarea",
        placeholder: "14 Broad Street, Lagos Island, Lagos, Nigeria",
      },
      {
        key: "phone_hours",
        label: "Phone Hours Label",
        type: "text",
        placeholder: "Mon–Fri, 9am–6pm",
      },
      {
        key: "email_reply",
        label: "Email Reply Label",
        type: "text",
        placeholder: "We reply within 24hrs",
      },
      {
        key: "maps_url",
        label: "Google Maps Link",
        type: "text",
        placeholder: "https://maps.google.com",
      },

      // ── Social Links ───────────────────────────────────────────────────────
      {
        key: "_contact_socials",
        label: "── Social Links ─────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "instagram",
        label: "Instagram URL",
        type: "text",
        placeholder: "https://instagram.com/blvckmrkt",
      },
      {
        key: "twitter",
        label: "Twitter/X URL",
        type: "text",
        placeholder: "https://x.com/blvckmrkt",
      },
      {
        key: "tiktok",
        label: "TikTok URL",
        type: "text",
        placeholder: "https://tiktok.com/@blvckmrkt",
      },
      {
        key: "facebook",
        label: "Facebook URL",
        type: "text",
        placeholder: "https://facebook.com/blvckmrkt",
      },

      // ── Form Section ───────────────────────────────────────────────────────
      {
        key: "_contact_form",
        label: "── Contact Form Section ───────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "form_section_tag", label: "Section Tag", type: "text", placeholder: "Get In Touch"},
      {
        key: "form_title",
        label: "Heading (white)",
        type: "text",
        placeholder: "WE'RE ALWAYS\nREADY TO",
        hint: "Use \n to split the heading across two lines",
      },
      {key: "form_title_red", label: "Heading (red)", type: "text", placeholder: "HELP."},
      {
        key: "form_subtitle",
        label: "Subtitle Text",
        type: "textarea",
        placeholder: "Whether you have a question about a product...",
      },
      {key: "submit_btn_text", label: "Submit Button", type: "text", placeholder: "Send Message"},
      {key: "success_title", label: "Success Title", type: "text", placeholder: "MESSAGE SENT!"},
      {
        key: "success_msg",
        label: "Success Message",
        type: "textarea",
        placeholder: "We've received your message and will get back to you within 24 hours.",
      },
      {
        key: "send_another_text",
        label: "Send Another Button",
        type: "text",
        placeholder: "Send Another",
      },

      // ── Working Hours ──────────────────────────────────────────────────────
      {
        key: "_contact_hours",
        label: "── Working Hours ─────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "hours1_day", label: "Row 1 — Day", type: "text", placeholder: "Mon – Fri"},
      {key: "hours1_time", label: "Row 1 — Hours", type: "text", placeholder: "9:00am – 6:00pm"},
      {key: "hours2_day", label: "Row 2 — Day", type: "text", placeholder: "Saturday"},
      {key: "hours2_time", label: "Row 2 — Hours", type: "text", placeholder: "10:00am – 3:00pm"},
      {key: "hours3_day", label: "Row 3 — Day", type: "text", placeholder: "Sunday"},
      {
        key: "hours3_time",
        label: "Row 3 — Hours",
        type: "text",
        placeholder: "Closed",
        hint: "Set to 'Closed' to display in red",
      },

      // ── Map Section ────────────────────────────────────────────────────────
      {
        key: "_contact_map",
        label: "── Map Section ──────────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "map_section_tag", label: "Map Section Tag", type: "text", placeholder: "Find Us"},
      {key: "map_heading", label: "Map Heading", type: "text", placeholder: "OUR LOCATION"},
      {
        key: "map_embed_url",
        label: "Google Maps Embed URL",
        type: "textarea",
        placeholder: "https://www.google.com/maps/embed?pb=...",
        hint: "Get this from Google Maps → Share → Embed a map → copy the src URL only",
      },
    ],
  },

  // ── BRANDS ──────────────────────────────────────────────────────────────────
  {
    slug: "brands",
    label: "Brands",
    desc: "Brands directory page — header, filter labels, empty state",
    icon: "🏷",
    fields: [
      // ── Page Header ────────────────────────────────────────────────────────
      {
        key: "_brands_header",
        label: "── Page Header ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "page_title", label: "Page Title", type: "text", placeholder: "Brands"},
      {
        key: "page_header_image",
        label: "Header Background Image",
        type: "text",
        placeholder: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80",
      },

      // ── Grid Labels ────────────────────────────────────────────────────────
      {
        key: "_brands_labels",
        label: "── Grid Labels ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "search_placeholder",
        label: "Search Placeholder",
        type: "text",
        placeholder: "Search brands...",
      },
      {
        key: "featured_label",
        label: "Featured Section Label",
        type: "text",
        placeholder: "✦ Featured Brands",
      },
      {
        key: "all_brands_label",
        label: "All Brands Label",
        type: "text",
        placeholder: "All Brands",
        hint: "Shows as 'All Brands (12)' — the count is added automatically",
      },
      {key: "shop_btn_text", label: "Shop Button Text", type: "text", placeholder: "Shop"},
      {
        key: "drops_avail_label",
        label: "Drops Available Label",
        type: "text",
        placeholder: "drops available",
        hint: "Shows on featured cards: '8 drops available'",
      },
      {
        key: "drops_label",
        label: "Drops Count Label",
        type: "text",
        placeholder: "drops",
        hint: "Shows on regular cards: '8 drops'",
      },

      // ── Empty State ────────────────────────────────────────────────────────
      {
        key: "_brands_empty",
        label: "── Empty State ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "empty_msg",
        label: "Empty State Message",
        type: "text",
        placeholder: "No brands found.",
      },
      {
        key: "clear_filters_text",
        label: "Clear Filters Button",
        type: "text",
        placeholder: "Clear Filters",
      },
    ],
  },

  // ── DROPS ───────────────────────────────────────────────────────────────────
  {
    slug: "drops",
    label: "Drops",
    desc: "Drops listing page — header, card labels",
    icon: "⚡",
    fields: [
      // ── Page Header ────────────────────────────────────────────────────────
      {
        key: "_drops_header",
        label: "── Page Header ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "page_title", label: "Page Title", type: "text", placeholder: "Drops"},
      {
        key: "page_header_image",
        label: "Header Background Image",
        type: "text",
        placeholder: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80",
      },

      // ── Card Labels ────────────────────────────────────────────────────────
      {
        key: "_drops_labels",
        label: "── Card & Section Labels ───────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "drops_count_label",
        label: "Drops Count Label",
        type: "text",
        placeholder: "drops",
        hint: "Shows in the red pill: '8 drops'",
      },
      {key: "view_all_text", label: "View All Link Text", type: "text", placeholder: "View all"},
      {key: "quick_add_text", label: "Quick Add Button", type: "text", placeholder: "+ Quick Add"},
      {key: "view_text", label: "View Product Link", type: "text", placeholder: "View"},
    ],
  },

  // ── BLOG ────────────────────────────────────────────────────────────────────
  {
    slug: "blog",
    label: "Blog",
    desc: "Blog page — header, featured label, card labels, empty state",
    icon: "✍️",
    fields: [
      // ── Page Header ────────────────────────────────────────────────────────
      {
        key: "_blog_header",
        label: "── Page Header ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {key: "page_title", label: "Page Title", type: "text", placeholder: "Blog"},
      {
        key: "page_header_image",
        label: "Header Background Image",
        type: "text",
        placeholder: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80",
      },

      // ── Labels ─────────────────────────────────────────────────────────────
      {
        key: "_blog_labels",
        label: "── Labels ────────────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "featured_label",
        label: "Featured Post Label",
        type: "text",
        placeholder: "✦ Featured Post",
      },
      {
        key: "read_article_text",
        label: "Read Article Button",
        type: "text",
        placeholder: "Read Article",
        hint: "Button shown on the large featured post card",
      },
      {
        key: "search_placeholder",
        label: "Search Placeholder",
        type: "text",
        placeholder: "Search posts...",
      },
      {
        key: "read_more_text",
        label: "Read More Link",
        type: "text",
        placeholder: "Read",
        hint: "Link shown on each blog card",
      },

      // ── Empty State ────────────────────────────────────────────────────────
      {
        key: "_blog_empty",
        label: "── Empty State ──────────────────────────────────────────",
        type: "text",
        placeholder: "",
      },
      {
        key: "empty_msg",
        label: "Empty State Message",
        type: "text",
        placeholder: "No posts found.",
      },
      {
        key: "clear_filters_text",
        label: "Clear Filters Button",
        type: "text",
        placeholder: "Clear filters",
      },
    ],
  },
];

// ── Merge page default fields into content ─────────────────────────────────
function seedDefaults(fields, content) {
  const out = {};
  fields.forEach((f) => {
    if (f.key.startsWith("_")) return; // divider fields — skip
    if (f.type === "toggle") {
      out[f.key] = typeof content[f.key] === "boolean" ? content[f.key] : (f.default ?? false);
    } else {
      out[f.key] = content[f.key] ?? "";
    }
  });
  return out;
}

export function AdminSitePages() {
  const [activePage, setActivePage] = useState("home");
  const [content, setContent] = useState({});
  const [original, setOriginal] = useState({});
  const [pageMeta, setPageMeta] = useState({}); // slug → {updated_at}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const showToast = (msg, isErr = false) => {
    setToast({msg, isErr});
    setTimeout(() => setToast(""), 2800);
  };

  // Load all page metadata (last-saved times) once
  useEffect(() => {
    listSitePages()
      .then((d) => {
        const map = {};
        (d?.pages || []).forEach((p) => {
          map[p.slug] = p;
        });
        setPageMeta(map);
      })
      .catch(() => {});
  }, []);

  // Load content for active page
  useEffect(() => {
    setLoading(true);
    setError("");
    const schema = SITE_PAGES.find((p) => p.slug === activePage);
    getSitePage(activePage)
      .then((d) => {
        const raw = d?.content || {};
        const seeded = schema ? seedDefaults(schema.fields, raw) : raw;
        setContent(seeded);
        setOriginal(seeded);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [activePage]);

  const isDirty = JSON.stringify(content) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateSitePage(activePage, content);
      setOriginal(content);
      setPageMeta((m) => ({
        ...m,
        [activePage]: {...m[activePage], updated_at: new Date().toISOString()},
      }));
      showToast("Page saved ✓");
    } catch (e) {
      setError(e.message);
      showToast(e.message, true);
    }
    setSaving(false);
  };

  const currentSchema = SITE_PAGES.find((p) => p.slug === activePage);
  const inp = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 13,
    padding: "10px 13px",
    borderRadius: 9,
    outline: "none",
    fontFamily: "inherit",
  };
  const onFocus = (e) => (e.target.style.borderColor = "rgba(239,68,68,0.5)");
  const onBlur = (e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

  return (
    <div style={{display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, alignItems: "start"}}>
      {/* ── Page list sidebar ── */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        {SITE_PAGES.map((page) => {
          const meta = pageMeta[page.slug];
          const isActive = activePage === page.slug;
          return (
            <button
              key={page.slug}
              onClick={() => setActivePage(page.slug)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: isActive ? "rgba(239,68,68,0.1)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}>
              <div style={{display: "flex", alignItems: "center", gap: 8}}>
                <span style={{fontSize: 14}}>{page.icon}</span>
                <div style={{flex: 1, minWidth: 0}}>
                  <p
                    style={{
                      color: isActive ? "#ef4444" : "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      fontWeight: 700,
                      margin: 0,
                    }}>
                    {page.label}
                  </p>
                  {meta?.updated_at && (
                    <p style={{color: "rgba(255,255,255,0.2)", fontSize: 9, margin: 0}}>
                      {new Date(meta.updated_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
                {isActive && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#ef4444",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Editor panel ── */}
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14,
          overflow: "hidden",
        }}>
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}>
          <div>
            <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 2}}>
              <span style={{fontSize: 18}}>{currentSchema?.icon}</span>
              <h3 style={{color: "#fff", fontSize: 15, fontWeight: 800, margin: 0}}>
                {currentSchema?.label} Page
              </h3>
              {isDirty && (
                <span
                  style={{
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    color: "#f59e0b",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}>
                  UNSAVED
                </span>
              )}
            </div>
            <p style={{color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0}}>
              {currentSchema?.desc}
            </p>
            {pageMeta[activePage]?.updated_at && (
              <p style={{color: "rgba(255,255,255,0.18)", fontSize: 10, margin: "4px 0 0"}}>
                Last saved:{" "}
                {new Date(pageMeta[activePage].updated_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <div style={{display: "flex", gap: 8, flexShrink: 0}}>
            <button
              onClick={() => {
                setContent(original);
              }}
              disabled={!isDirty}
              style={{
                padding: "8px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: isDirty ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                cursor: isDirty ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}>
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              style={{
                padding: "8px 18px",
                background: saving ? "#7f1d1d" : !isDirty ? "rgba(239,68,68,0.2)" : "#ef4444",
                border: "none",
                color: !isDirty ? "rgba(239,68,68,0.4)" : "#fff",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                cursor: saving || !isDirty ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div style={{padding: "20px 22px"}}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 9,
                padding: "10px 14px",
                marginBottom: 16,
                color: "#ef4444",
                fontSize: 12,
              }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{display: "flex", flexDirection: "column", gap: 12}}>
              {Array.from({length: 5}).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: i % 3 === 2 ? 72 : 40,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 8,
                    animation: "pulse 1.4s infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{display: "flex", flexDirection: "column", gap: 16}}>
              {(currentSchema?.fields || []).map((field) => (
                <div key={field.key}>
                  {field.key.startsWith("_") ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 8,
                        marginBottom: -4,
                      }}>
                      <div style={{height: 1, flex: 1, background: "rgba(255,255,255,0.06)"}} />
                      <span
                        style={{
                          color: "rgba(239,68,68,0.5)",
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}>
                        {field.label
                          .replace(/^[─\s]+/, "")
                          .replace(/[─\s]+$/, "")
                          .trim()}
                      </span>
                      <div style={{height: 1, flex: 1, background: "rgba(255,255,255,0.06)"}} />
                    </div>
                  ) : (
                    <>
                      <label
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: field.hint ? 3 : 5,
                        }}>
                        {field.label}
                      </label>
                      {field.hint && (
                        <p
                          style={{
                            color: "rgba(255,255,255,0.2)",
                            fontSize: 10,
                            marginBottom: 6,
                            lineHeight: 1.4,
                            fontStyle: "italic",
                          }}>
                          {field.hint}
                        </p>
                      )}

                      {field.type === "toggle" ? (
                        <div
                          onClick={() => setContent((c) => ({...c, [field.key]: !c[field.key]}))}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: content[field.key]
                              ? "rgba(34,197,94,0.06)"
                              : "rgba(255,255,255,0.02)",
                            border: `1px solid ${content[field.key] ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 10,
                            padding: "11px 14px",
                            cursor: "pointer",
                            userSelect: "none",
                            transition: "all 0.2s",
                          }}>
                          <span
                            style={{
                              color: content[field.key] ? "#22c55e" : "rgba(255,255,255,0.4)",
                              fontSize: 12,
                              fontWeight: 700,
                            }}>
                            {content[field.key] ? "Enabled" : "Disabled"}
                          </span>
                          <div
                            style={{
                              width: 40,
                              height: 22,
                              borderRadius: 99,
                              background: content[field.key] ? "#22c55e" : "rgba(255,255,255,0.1)",
                              position: "relative",
                              transition: "background 0.2s",
                              flexShrink: 0,
                            }}>
                            <div
                              style={{
                                position: "absolute",
                                top: 3,
                                left: content[field.key] ? 20 : 3,
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: "#fff",
                                transition: "left 0.2s",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                              }}
                            />
                          </div>
                        </div>
                      ) : field.type === "textarea" ? (
                        <textarea
                          value={content[field.key] || ""}
                          onChange={(e) => setContent((c) => ({...c, [field.key]: e.target.value}))}
                          onFocus={onFocus}
                          onBlur={onBlur}
                          rows={3}
                          placeholder={field.placeholder || ""}
                          style={{...inp, resize: "vertical", lineHeight: 1.6}}
                        />
                      ) : (
                        <input
                          type="text"
                          value={content[field.key] || ""}
                          onChange={(e) => setContent((c) => ({...c, [field.key]: e.target.value}))}
                          onFocus={onFocus}
                          onBlur={onBlur}
                          placeholder={field.placeholder || ""}
                          style={inp}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{opacity: 0, y: 16}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 16}}
            style={{
              position: "fixed",
              bottom: 28,
              left: "50%",
              transform: "translateX(-50%)",
              background: toast.isErr ? "#ef4444" : "#22c55e",
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 99,
              boxShadow: `0 8px 28px ${toast.isErr ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
