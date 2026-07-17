// ─── BLVCKMRKT Buyer API ──────────────────────────────────────────────────────
const BASE = "https://blvckmrktng.com/api";

function token() {
  return localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
}

async function req(method, path, body) {
  const opts = {
    method,
    headers: {"Content-Type": "application/json", Authorization: `Bearer ${token()}`},
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data.data;
}

// ── Buyer Profile ─────────────────────────────────────────────────────────────
export const getBuyerProfile = () => req("GET", "/buyer/profile");
export const updateProfile = (body) => req("PUT", "/buyer/profile", body);
export const changePassword = (body) => req("POST", "/buyer/change-password", body);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const getMe = () => req("GET", "/auth/me");

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders = () => req("GET", "/buyer/orders");
export const getOrder = (id) => req("GET", `/buyer/orders/${id}`);
export const cancelOrder = (id) => req("POST", `/buyer/orders/${id}/cancel`);

// ── Messages ──────────────────────────────────────────────────────────────────
export const getConversations = () => req("GET", "/buyer/messages");
export const getThread = (brandId) => req("GET", `/buyer/messages/${brandId}`);
export const sendMessage = (brandId, body) => req("POST", `/buyer/messages/${brandId}`, {body});

// ── Addresses ─────────────────────────────────────────────────────────────────
export const getAddresses = () => req("GET", "/buyer/addresses");
export const createAddress = (body) => req("POST", "/buyer/addresses", body);
export const updateAddress = (id, b) => req("PUT", `/buyer/addresses/${id}`, b);
export const deleteAddress = (id) => req("DELETE", `/buyer/addresses/${id}`);
export const setDefaultAddress = (id) => req("PATCH", `/buyer/addresses/${id}/default`);

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const getWishlist = () => req("GET", "/user/wishlist");
export const addToWishlist = (pid) => req("POST", "/user/wishlist", {product_id: pid});
export const removeFromWishlist = (pid) => req("DELETE", `/user/wishlist/${pid}`);

// ── Cart ──────────────────────────────────────────────────────────────────────
export const getCart = () => req("GET", "/user/cart");
export const addToCart = (body) => req("POST", "/user/cart", body);
export const updateCartItem = (id, q) => req("PUT", `/user/cart/${id}`, {quantity: q});
export const removeFromCart = (id) => req("DELETE", `/user/cart/${id}`);
export const clearCart = () => req("DELETE", "/user/cart");

// ── Notifications ─────────────────────────────────────────────────────────────
// GET returns merged personal + broadcast notifications.
// Each item has kind: "personal" | "broadcast" and is_read resolved from the correct table.
export const getNotifications = () => req("GET", "/buyer/notifications");

// Mark a personal notification read → sets is_read=true in notifications table
export const markOneRead = (id) => req("POST", `/buyer/notifications/${id}/read`);

// Mark a group broadcast read → inserts into notification_broadcast_reads
// Call this when notif.kind === "broadcast"
export const markBroadcastRead = (id) => req("POST", `/buyer/notifications/broadcasts/${id}/read`);

// Mark ALL read in one call — backend handles personal + broadcasts together
export const markAllRead = () => req("POST", "/buyer/notifications/read-all");

// Delete a personal notification only — broadcasts cannot be deleted per-user
export const deleteNotif = (id) => req("DELETE", `/buyer/notifications/${id}`);

// ── Shop ──────────────────────────────────────────────────────────────────────
export const getProducts = (params) =>
  req("GET", "/shop/products" + (params ? "?" + new URLSearchParams(params) : ""));
export const getProduct = (id) => req("GET", `/shop/products/${id}`);
export const getBrands = () => req("GET", "/shop/brands");
export const getCategories = () => req("GET", "/shop/categories");

// ── Follows ───────────────────────────────────────────────────────────────────
export const getFollows = () => req("GET", "/buyer/follows");
export const followBrand = (bid) => req("POST", "/buyer/follows", {brand_id: bid});
export const unfollowBrand = (bid) => req("DELETE", `/buyer/follows/${bid}`);

// ── Upgrade to Brand ──────────────────────────────────────────────────────────
export const upgradeToBrand = (body) => req("POST", "/buyer/upgrade-to-brand", body);

// ── Delete own buyer account (stored in audit log, restorable by admin) ───────
export async function deleteBuyerAccount() {
  const BASE_URL = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";
  const t = localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
  const res = await fetch(`${BASE_URL}/api/buyer/delete-account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${t}`,
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json.message || json.error || "Failed to delete account");
  return json;
}