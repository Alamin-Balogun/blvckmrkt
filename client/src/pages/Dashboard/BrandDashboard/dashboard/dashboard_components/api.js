// ─── BLVCKMRKT Brand API ──────────────────────────────────────────────────────
const BASE = "https://blvckmrktng.com/api";

function token() {
  return localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
}

async function req(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  let data = {};
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = {message: text || `HTTP ${res.status}`};
  }

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status} — ${path}`);
  }

  return data.data;
}

// ── Profile ───────────────────────────────────────────────────────────────────
export const getBrandProfile = () => req("GET", "/brand/profile");
export const updateBrandProfile = (body) => req("PUT", "/brand/profile", body);

// ── Overview ──────────────────────────────────────────────────────────────────
export const getBrandOverview = () => req("GET", "/brand/overview");

// ── Products ──────────────────────────────────────────────────────────────────
export const listBrandProducts = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return req("GET", `/brand/products${q ? "?" + q : ""}`);
};
export const getBrandProduct = (id) => req("GET", `/brand/products/${id}`);
export const createBrandProduct = (body) => req("POST", "/brand/products", body);
export const updateBrandProduct = (id, body) => req("PUT", `/brand/products/${id}`, body);
export const updateBrandProductStatus = (id, status) =>
  req("PATCH", `/brand/products/${id}/status`, {status});
export const deleteBrandProduct = (id) => req("DELETE", `/brand/products/${id}`);

// ── Orders ────────────────────────────────────────────────────────────────────
export const listBrandOrders = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return req("GET", `/brand/orders${q ? "?" + q : ""}`);
};
export const getBrandOrder = (id) => req("GET", `/brand/orders/${id}`);
export const updateBrandOrderStatus = (id, status) =>
  req("PATCH", `/brand/orders/${id}/status`, {status});

export const listMyOrders = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return req("GET", `/brand/my-orders${q ? "?" + q : ""}`);
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const getConversations = () => req("GET", "/brand/messages");
export const getThread = (buyerId) => req("GET", `/brand/messages/${buyerId}`);
export const sendMessage = (buyerId, body) => req("POST", `/brand/messages/${buyerId}`, {body});

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getBrandAnalytics = () => req("GET", "/brand/analytics");

// ── Public Shop ───────────────────────────────────────────────────────────────
export const getProducts = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return req("GET", `/shop/products${q ? "?" + q : ""}`);
};
export const getBrands = () => req("GET", "/shop/brands");

// ── Categories (public) ───────────────────────────────────────────────────────
export const listCategories = () => req("GET", "/shop/categories");

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const getWishlist = () => req("GET", "/brand/wishlist");
export const addToWishlist = (productId) => req("POST", "/brand/wishlist", {product_id: productId});
export const removeFromWishlist = (productId) => req("DELETE", `/brand/wishlist/${productId}`);

// ── Notifications ─────────────────────────────────────────────────────────────
// GET returns a merged array. Each item has:
//   kind: "personal" | "broadcast"
//   is_read: resolved from the correct table for that kind
export const getNotifications = () => req("GET", "/brand/notifications");

// Mark a personal notification read → sets is_read=true in the notifications table
export const markOneRead = (id) => req("POST", `/brand/notifications/${id}/read`);

// Mark a group broadcast read → inserts a row into notification_broadcast_reads
// This is the correct call when notif.kind === "broadcast"
export const markBroadcastRead = (id) => req("POST", `/brand/notifications/broadcasts/${id}/read`);

// Mark ALL read in one call — backend handles both personal rows and broadcast receipts
export const markAllRead = () => req("POST", "/brand/notifications/read-all");

// Delete a personal notification. Broadcasts are shared and cannot be deleted per-user.
export const deleteNotif = (id) => req("DELETE", `/brand/notifications/${id}`);

// ── Addresses ─────────────────────────────────────────────────────────────────
export const getAddresses = () => req("GET", "/brand/addresses");
export const createAddress = (body) => req("POST", "/brand/addresses", body);
export const updateAddress = (id, body) => req("PUT", `/brand/addresses/${id}`, body);
export const deleteAddress = (id) => req("DELETE", `/brand/addresses/${id}`);
export const setDefaultAddress = (id) => req("PATCH", `/brand/addresses/${id}/default`);

// ── Image upload ──────────────────────────────────────────────────────────────
export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`https://blvckmrktng.com/api/upload?folder=products`, {
    method: "POST",
    headers: {Authorization: `Bearer ${token()}`},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Upload failed");
  return data.data.url;
}

// ── Drops ─────────────────────────────────────────────────────────────────────
export const getBrandActiveDrop = () => req("GET", "/brand/drop");
export const addProductToDrop = (productId) =>
  req("POST", "/brand/drop/products", {product_id: productId});
export const removeProductFromDrop = (dropId, productId) =>
  req("DELETE", `/brand/drop/${dropId}/products/${productId}`);

// ── Shipping ──────────────────────────────────────────────────────────────────
export const getShippingZones = () => req("GET", "/brand/shipping/zones");
export const createShippingZone = (data) => req("POST", "/brand/shipping/zones", data);
export const updateShippingZone = (id, data) => req("PUT", `/brand/shipping/zones/${id}`, data);
export const deleteShippingZone = (id) => req("DELETE", `/brand/shipping/zones/${id}`);

export const createShippingMethod = (zoneId, data) =>
  req("POST", `/brand/shipping/zones/${zoneId}/methods`, data);
export const updateShippingMethod = (id, data) => req("PUT", `/brand/shipping/methods/${id}`, data);
export const deleteShippingMethod = (id) => req("DELETE", `/brand/shipping/methods/${id}`);
export const toggleShippingMethod = (id) => req("PATCH", `/brand/shipping/methods/${id}/toggle`);

// ── Local Shipping Rates ───────────────────────────────────────────────────────
export const getLocalShippingRates = () => req("GET", "/brand/shipping/local");
export const saveLocalShippingRate = (body) => req("POST", "/brand/shipping/local", body);
export const deleteLocalShippingRate = (id) => req("DELETE", `/brand/shipping/local/${id}`);

// ── Pickup Locations ──────────────────────────────────────────────────────────
export const getPickupLocations = () => req("GET", "/brand/pickup-locations");
export const savePickupLocation = (body) => req("POST", "/brand/pickup-locations", body);
export const updatePickupLocation = (id, body) => req("PUT", `/brand/pickup-locations/${id}`, body);
export const deletePickupLocation = (id) => req("DELETE", `/brand/pickup-locations/${id}`);

// ── Bank Account ──────────────────────────────────────────────────────────────
export const getBrandBankAccount = () => req("GET", "/brand/bank-account");
export const createBrandBankAccount = (body) => req("POST", "/brand/bank-account", body);
export const updateBrandBankAccount = (body) => req("PATCH", "/brand/bank-account", body);

export const getPlatformSettings = () => req("GET", "/brand/platform-settings");

// ── Delete own brand account (stored in audit log, restorable by admin) ───────
export async function deleteBrandAccount() {
  const t = localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
  const res = await fetch(`${BASE}/brand/delete-account`, {
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