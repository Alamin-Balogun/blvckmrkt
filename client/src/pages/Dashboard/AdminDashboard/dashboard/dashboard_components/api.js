// ── BLVCKMRKT Admin API ───────────────────────────────────────────────────────
const BASE = (import.meta.env.VITE_ADMIN_API_URL ?? "") + "/api/admin";

// ── Token management ──────────────────────────────────────────────────────────
const TOKEN_KEY = "blvckmrkt_admin_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ── Core request helper ───────────────────────────────────────────────────────
async function req(method, path, body) {
  const token = getToken();
  const headers = {"Content-Type": "application/json"};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (!path.includes("/auth/")) {
      clearToken();
      window.location.reload();
    }
    throw new Error("Invalid credentials or session expired");
  }

  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;

  let json;
  try {
    json = JSON.parse(text);
  } catch (_) {
    if (!res.ok) throw new Error(text || "Request failed");
    return null;
  }

  if (!res.ok) throw new Error(json?.message || json?.error || "Request failed");

  return json?.data ?? json; // ✅ Returns full response including warnings
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function adminRequestOTP(email, password) {
  const data = await req("POST", "/auth/login", {email, password});
  return data?.admin_id ? data : (data?.data ?? data);
}

export async function adminVerifyOTP(adminId, code) {
  const data = await req("POST", "/auth/verify-otp", {admin_id: adminId, code});
  const token = data?.token ?? data?.data?.token;
  if (token) setToken(token);
  return data?.admin ?? data?.data?.admin ?? data;
}

export const adminLogout = () => clearToken();
export const getMe = () => req("GET", "/auth/me");

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getAdminStats = () => req("GET", "/stats");
export const getActivityFeed = (p = {}) => req("GET", `/activity?${new URLSearchParams(p)}`);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getAnalyticsOverview = () => req("GET", "/analytics/overview");
export const getAnalyticsWeekly = (offset = 0) => req("GET", `/analytics/weekly?offset=${offset}`);
export const getAnalyticsRevenue = (period = 30) =>
  req("GET", `/analytics/revenue?period=${period}`);
export const getAnalyticsUsers = (period = 30) => req("GET", `/analytics/users?period=${period}`);
export const getVisitAnalytics = (days = 30) => req("GET", `/analytics/visits?days=${days}`);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = (p = {}) => req("GET", `/users?${new URLSearchParams(p)}`);
export const getUser = (id) => req("GET", `/users/${id}`);
export const createUser = (d) => req("POST", "/users/create", d);
export const updateUser = (id, d) => req("PATCH", `/users/${id}`, d);
export const deleteUser = (id, permanent = false) =>
  req("DELETE", `/users/${id}`, {permanent});
export const banUser = (id) => req("POST", `/users/${id}/ban`);
export const unbanUser = (id) => req("POST", `/users/${id}/unban`);
export const verifyUser = (id) => req("POST", `/users/${id}/verify`);

// ── Buyers ────────────────────────────────────────────────────────────────────
export const updateBuyer = (id, d) => req("PATCH", `/buyers/${id}`, d);

// ── Brands ────────────────────────────────────────────────────────────────────
export const getBrands = (p = {}) => req("GET", `/brands?${new URLSearchParams(p)}`);
export const getBrand = (id) => req("GET", `/brands/${id}`);
export const updateBrand = (id, d) => req("PATCH", `/brands/${id}`, d);
export const deleteBrand = (id) => req("DELETE", `/brands/${id}`);
export const approveBrand = (id) => req("POST", `/brands/${id}/approve`);
export const suspendBrand = (id) => req("POST", `/brands/${id}/suspend`);
export const getBrandCommission = (id) => req("GET", `/brands/${id}/commission`);
export const setBrandCommission = (id, d) => req("PATCH", `/brands/${id}/commission`, d);
// Alias for backwards compatibility
export const updateBrandCommission = (id, d) => req("PATCH", `/brands/${id}/commission`, d);

// ── Brand Bank Accounts (Legacy - brand-specific routes) ─────────────────────
export const getBrandBankAccount = (brandId) => req("GET", `/brands/${brandId}/bank-account`);
export const verifyBrandBankAccount = (brandId) => req("POST", `/brands/${brandId}/verify-bank-account`);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = (p = {}) => req("GET", `/products?${new URLSearchParams(p)}`);
export const getProduct = (id) => req("GET", `/products/${id}`);
export const createProduct = (d) => req("POST", "/products", d);
export const updateProduct = (id, d) => req("PATCH", `/products/${id}`, d);
export const deleteProduct = (id) => req("DELETE", `/products/${id}`);

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders = (p = {}) => req("GET", `/orders?${new URLSearchParams(p)}`);
export const getOrder = (id) => req("GET", `/orders/${id}`);
export const adminCreateOrder = (d) => req("POST", "/orders", d);
export const updateOrderStatus = (id, s) =>
  req("PATCH", `/orders/${id}`, typeof s === "string" ? {status: s} : s);
export const deleteOrder = (id) => req("DELETE", `/orders/${id}`);
export const confirmPayment = (id) => req("POST", `/orders/${id}/confirm-payment`);
export const rejectPayment = (id, reason) =>
  req("POST", `/orders/${id}/reject-payment`, reason ? {reason} : {});

// ✅ Order Payout Management (NEW - grouped with orders)
export const adminGetPayoutInfo = (orderId) => req("GET", `/orders/${orderId}/payout-info`);
export const adminInitiatePayout = (orderId, data) => 
  req("POST", `/orders/${orderId}/initiate-payout`, data);

// ── Payouts (Global payout management) ───────────────────────────────────────
export const getPayouts = (p = {}) => req("GET", `/payouts?${new URLSearchParams(p)}`);
export const getPayout = (id) => req("GET", `/payouts/${id}`);
export const completePayout = (payoutId) => req("PATCH", `/payouts/${payoutId}/complete`);

// ✅ Aliases for consistency (some components may use these names)
export const adminListPayouts = (p = {}) => req("GET", `/payouts?${new URLSearchParams(p)}`);
export const adminGetPayout = (id) => req("GET", `/payouts/${id}`);
export const adminCompletePayout = (payoutId) => req("PATCH", `/payouts/${payoutId}/complete`);

// ── Drops ─────────────────────────────────────────────────────────────────────
export const getDrops = (p = {}) => req("GET", `/drops?${new URLSearchParams(p)}`);
export const getDrop = (id) => req("GET", `/drops/${id}`);
export const createDrop = (d) => req("POST", "/drops", d);
export const updateDrop = (id, d) => req("PATCH", `/drops/${id}`, d);
export const deleteDrop = (id) => req("DELETE", `/drops/${id}`);
export const addDropProduct = (id, productId) =>
  req("POST", `/drops/${id}/products`, {product_id: productId});
export const removeDropProduct = (id, productId) =>
  req("DELETE", `/drops/${id}/products/${productId}`);

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () => req("GET", "/categories");
export const createCategory = (d) => req("POST", "/categories", d);
export const updateCategory = (id, d) => req("PATCH", `/categories/${id}`, d);
export const deleteCategory = (id) => req("DELETE", `/categories/${id}`);

// ── Reviews ───────────────────────────────────────────────────────────────────
export const getReviews = (p = {}) => req("GET", `/reviews?${new URLSearchParams(p)}`);
export const getReview = (id) => req("GET", `/reviews/${id}`);
export const deleteReview = (id) => req("DELETE", `/reviews/${id}`);
export const flagReview = (id) => req("POST", `/reviews/${id}/flag`);
export const getReviewComments = (id) => req("GET", `/reviews/${id}/comments`);
export const addReviewComment = (id, body) => req("POST", `/reviews/${id}/comments`, {body});
export const deleteReviewComment = (reviewId, commentId) =>
  req("DELETE", `/reviews/${reviewId}/comments/${commentId}`);

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = (p = {}) => req("GET", `/notifications?${new URLSearchParams(p)}`);
export const sendNotification = (d) => req("POST", "/notifications", d);
export const deleteNotification = (id) => req("DELETE", `/notifications/${id}`);

// ── Subscriptions (individual brand subscriptions) ────────────────────────────
export const getSubscriptions = (p = {}) => req("GET", `/subscriptions?${new URLSearchParams(p)}`);
export const updateSubscription = (id, d) => req("PATCH", `/subscriptions/${id}`, d);

// ── Addresses ─────────────────────────────────────────────────────────────────
export const getAddresses = (p = {}) => req("GET", `/addresses?${new URLSearchParams(p)}`);
export const createAddress = (d) => req("POST", "/addresses", d);
export const updateAddress = (id, d) => req("PATCH", `/addresses/${id}`, d);
export const deleteAddress = (id) => req("DELETE", `/addresses/${id}`);

// ── Site pages ────────────────────────────────────────────────────────────────
export const listSitePages = () => req("GET", "/pages");
export const getSitePage = (slug) => req("GET", `/pages/${slug}`);
export const updateSitePage = (slug, d) => req("PATCH", `/pages/${slug}`, d);

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () => req("GET", "/settings");
export const saveSettings = (d) => req("PATCH", "/settings", d);

// ── Privileges ────────────────────────────────────────────────────────────────
export const getRolePrivileges = () => req("GET", "/privileges/roles");
export const saveRolePrivileges = (role, d) => req("PATCH", `/privileges/roles/${role}`, d);
export const getUserPrivileges = (id) => req("GET", `/privileges/users/${id}`);
export const saveUserPrivileges = (id, d) => req("PATCH", `/privileges/users/${id}`, d);

// ── Employees ─────────────────────────────────────────────────────────────────
export const getEmployees = (p = {}) => req("GET", `/employees?${new URLSearchParams(p)}`);
export const createEmployee = (d) => req("POST", "/employees", d);
export const getEmployee = (id) => req("GET", `/employees/${id}`);
export const updateEmployee = (id, d) => req("PATCH", `/employees/${id}`, d);
export const deleteEmployee = (id) => req("DELETE", `/employees/${id}`);
export const suspendEmployee = (id) => req("POST", `/employees/${id}/suspend`);
export const reinstateEmployee = (id) => req("POST", `/employees/${id}/reinstate`);
export const getEmployeeReferrals = (id) => req("GET", `/employees/${id}/referrals`);

// ── Newsletter subscribers ────────────────────────────────────────────────────
export const getNewsletterSubscribers = (p = {}) =>
  req("GET", `/newsletter?${new URLSearchParams(p)}`);
export const deleteNewsletterSubscriber = (id) => req("DELETE", `/newsletter/${id}`);
export const updateNewsletterSubscriber = (id, d) => req("PATCH", `/newsletter/${id}`, d);

// ── Partners ──────────────────────────────────────────────────────────────────
export const getPartners = (p = {}) => req("GET", `/partners?${new URLSearchParams(p)}`);
export const createPartner = (d) => req("POST", "/partners", d);
export const getPartner = (id) => req("GET", `/partners/${id}`);
export const updatePartner = (id, d) => req("PATCH", `/partners/${id}`, d);
export const deletePartner = (id) => req("DELETE", `/partners/${id}`);

// ── Subscription Plan Definitions ────────────────────────────────────────────
export const getSubscriptionPlans = () => req("GET", "/subscription-plans");
export const getAdminSubscriptionPlans = () => req("GET", "/subscription-plans");
export const getSubscriptionPlan = (id) => req("GET", `/subscription-plans/${id}`);
export const createSubscriptionPlan = (d) => req("POST", "/subscription-plans", d);
export const updateSubscriptionPlan = (id, d) => req("PUT", `/subscription-plans/${id}`, d);
export const deleteSubscriptionPlan = (id) => req("DELETE", `/subscription-plans/${id}`);

// ── Newsletter campaigns ──────────────────────────────────────────────────────
export const getNewsletters = (p = {}) => req("GET", `/newsletters?${new URLSearchParams(p)}`);
export const createNewsletter = (d) => req("POST", "/newsletters", d);
export const updateNewsletter = (id, d) => req("PATCH", `/newsletters/${id}`, d);
export const sendNewsletter = (id) => req("POST", `/newsletters/${id}/send`);
export const deleteNewsletter = (id) => req("DELETE", `/newsletters/${id}`);

// ── Shipping Zones & Methods ──────────────────────────────────────────────────
export const getShippingZones = () => req("GET", "/shipping/zones");
export const createShippingZone = (d) => req("POST", "/shipping/zones", d);
export const updateShippingZone = (id, d) => req("PATCH", `/shipping/zones/${id}`, d);
export const deleteShippingZone = (id) => req("DELETE", `/shipping/zones/${id}`);
export const createShippingMethod = (zoneId, d) =>
  req("POST", `/shipping/zones/${zoneId}/methods`, d);
export const updateShippingMethod = (id, d) => req("PATCH", `/shipping/methods/${id}`, d);
export const deleteShippingMethod = (id) => req("DELETE", `/shipping/methods/${id}`);
export const toggleShippingMethod = (id) => req("POST", `/shipping/methods/${id}/toggle`);

// ── Local Shipping Rates ──────────────────────────────────────────────────────
export const getLocalShippingRates = (p = {}) =>
  req("GET", `/local-shipping?${new URLSearchParams(p)}`);
export const getLocalShippingRate = (id) => req("GET", `/local-shipping/${id}`);
export const createLocalShippingRate = (d) => req("POST", "/local-shipping", d);
export const updateLocalShippingRate = (id, d) => req("PATCH", `/local-shipping/${id}`, d);
export const deleteLocalShippingRate = (id) => req("DELETE", `/local-shipping/${id}`);

// ── Admin Pickup Locations ────────────────────────────────────────────────────
export const getAdminPickupLocations = (p = {}) =>
  req("GET", `/pickup-locations?${new URLSearchParams(p)}`);
export const createAdminPickupLocation = (d) => req("POST", "/pickup-locations", d);
export const updateAdminPickupLocation = (id, d) => req("PATCH", `/pickup-locations/${id}`, d);
export const deleteAdminPickupLocation = (id) => req("DELETE", `/pickup-locations/${id}`);

// ── Brand Bank Accounts (Admin - All accounts management) ────────────────────
export const getAllBrandBankAccounts = (p = {}) => 
  req("GET", `/bank-accounts?${new URLSearchParams(p)}`);
export const getBrandBankAccountById = (id) => req("GET", `/bank-accounts/${id}`);
export const adminUpdateBrandBankAccount = (id, d) => req("PATCH", `/bank-accounts/${id}`, d);
export const deleteBrandBankAccount = (id) => req("DELETE", `/bank-accounts/${id}`);
export const verifyBankAccount = (id) => req("POST", `/bank-accounts/${id}/verify`);
export const unverifyBankAccount = (id) => req("POST", `/bank-accounts/${id}/unverify`);

// ── Danger zone ───────────────────────────────────────────────────────────────
export const clearSessions = () => req("POST", "/danger/clear-sessions");
export const flushCache = () => req("POST", "/danger/flush-cache");
export const exportData = () =>
  fetch(`${BASE}/danger/export`, {
    method: "GET",
    headers: {Authorization: `Bearer ${getToken()}`},
  }).then(async (res) => {
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blvckmrkt-export.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // ── Audit Log ─────────────────────────────────────────────────────────────────
export const getAuditLogs = (p = {}) =>
  req("GET", `/audit-logs?${new URLSearchParams(p)}`);
export const restoreAuditLog = (id) =>
  req("POST", `/audit-logs/${id}/restore`);