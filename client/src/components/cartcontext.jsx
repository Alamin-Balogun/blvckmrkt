import {createContext, useContext, useEffect, useState, useCallback} from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

// ── Token helper ──────────────────────────────────────────────────────────────
// Uses blvck_token (buyer/brand JWT) — NOT blvckmrkt_admin_token (admin only)
export function getToken() {
  return localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
}

// ── Response parsers matching actual Go handler shapes ────────────────────────
// Cart GET returns:   { data: { items: [...], total, count } }
function parseCartResponse(json) {
  const d = json?.data ?? json;
  if (Array.isArray(d?.items)) return d.items; // ← correct shape
  if (Array.isArray(d)) return d;
  return [];
}

// Wishlist GET returns: { data: [ { id, product_id, product: {...}, created_at } ] }
function parseWishlistResponse(json) {
  const d = json?.data ?? json;
  if (Array.isArray(d)) return d; // ← correct shape
  if (Array.isArray(d?.items)) return d.items;
  return [];
}

const CartWishlistContext = createContext({
  cartCount: 0,
  wishlistCount: 0,
  cartItems: [],
  wishlistItems: [],
  cartIds: [],
  wishlistIds: [],
  wishlistMap: {},
  refreshCart: () => {},
  refreshWishlist: () => {},
  addToCart: async () => {},
  removeFromCart: async () => {},
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
});

export function useCartWishlist() {
  return useContext(CartWishlistContext);
}

export function CartWishlistProvider({children}) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistMap, setWishlistMap] = useState({});

  // /api/user/ routes use only Auth() middleware — works for both buyer & brand
  const BASE = `${API_BASE}/api/user`;

  function headers() {
    const t = getToken();
    return {Authorization: `Bearer ${t}`, "Content-Type": "application/json"};
  }

  // ── Refresh cart ─────────────────────────────────────────────────────────────
  const refreshCart = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await fetch(`${BASE}/cart`, {headers: headers()});
      if (!res.ok) return;
      const json = await res.json();
      setCartItems(parseCartResponse(json));
    } catch (e) {
      console.warn("[Cart] refresh error:", e);
    }
  }, []); // eslint-disable-line

  // ── Refresh wishlist ──────────────────────────────────────────────────────────
  const refreshWishlist = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await fetch(`${BASE}/wishlist`, {headers: headers()});
      if (!res.ok) return;
      const json = await res.json();
      const items = parseWishlistResponse(json);
      setWishlistItems(items);
      const map = {};
      items.forEach((i) => {
        map[i.product_id ?? i.id] = i.id;
      });
      setWishlistMap(map);
    } catch (e) {
      console.warn("[Wishlist] refresh error:", e);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (getToken()) {
      refreshCart();
      refreshWishlist();
    }
  }, [refreshCart, refreshWishlist]);

  // ── Add to cart ───────────────────────────────────────────────────────────────
  // NOTE: Go handler only accepts products with status = "active"
  // Draft/archived products will return 404 "Product not found or unavailable"
  const addToCart = useCallback(
    async (productId, sizeId = null) => {
      if (!getToken()) return false;
      // Optimistic update
      setCartItems((prev) =>
        prev.some((i) => (i.product_id ?? i.id) === productId)
          ? prev
          : [...prev, {product_id: productId, id: `opt_${productId}`, quantity: 1}],
      );
      try {
        const body = {product_id: productId, quantity: 1};
        if (sizeId) body.product_size_id = sizeId;

        const res = await fetch(`${BASE}/cart`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(body),
        });
        const json = await res.json();

        if (!res.ok) {
          console.warn("[Cart] Add failed:", res.status, json?.message ?? json);
          // Revert optimistic
          setCartItems((prev) => prev.filter((i) => i.id !== `opt_${productId}`));
          return false;
        }
        refreshCart(); // sync real DB id
        return true;
      } catch (e) {
        console.warn("[Cart] Add error:", e);
        setCartItems((prev) => prev.filter((i) => i.id !== `opt_${productId}`));
        return false;
      }
    },
    [refreshCart],
  ); // eslint-disable-line

  // ── Remove from cart ──────────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (cartItemId, productId) => {
      if (!getToken()) return;
      setCartItems((prev) =>
        prev.filter((i) => i.id !== cartItemId && (i.product_id ?? i.id) !== productId),
      );
      try {
        await fetch(`${BASE}/cart/${cartItemId}`, {method: "DELETE", headers: headers()});
      } catch {
        refreshCart();
      }
    },
    [refreshCart],
  ); // eslint-disable-line

  // ── Add to wishlist ───────────────────────────────────────────────────────────
  const addToWishlist = useCallback(
    async (productId) => {
      if (!getToken()) return false;
      // Don't add optimistically if already in wishlist (server returns 409)
      if (wishlistItems.some((i) => (i.product_id ?? i.id) === productId)) return true;

      setWishlistItems((prev) => [...prev, {product_id: productId, id: `opt_${productId}`}]);
      try {
        const res = await fetch(`${BASE}/wishlist`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({product_id: productId}),
        });
        const json = await res.json();

        if (res.status === 409) {
          // Already in wishlist — that's fine, just refresh to get real data
          refreshWishlist();
          return true;
        }
        if (!res.ok) {
          console.warn("[Wishlist] Add failed:", res.status, json?.message ?? json);
          setWishlistItems((prev) => prev.filter((i) => i.id !== `opt_${productId}`));
          return false;
        }
        refreshWishlist();
        return true;
      } catch (e) {
        console.warn("[Wishlist] Add error:", e);
        setWishlistItems((prev) => prev.filter((i) => i.id !== `opt_${productId}`));
        return false;
      }
    },
    [wishlistItems, refreshWishlist],
  ); // eslint-disable-line

  // ── Remove from wishlist ──────────────────────────────────────────────────────
  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!getToken()) return;
      setWishlistItems((prev) => prev.filter((i) => (i.product_id ?? i.id) !== productId));
      try {
        await fetch(`${BASE}/wishlist/${productId}`, {method: "DELETE", headers: headers()});
      } catch {
        refreshWishlist();
      }
    },
    [refreshWishlist],
  ); // eslint-disable-line

  const cartIds = cartItems.map((i) => i.product_id ?? i.id);
  const wishlistIds = wishlistItems.map((i) => i.product_id ?? i.id);

  return (
    <CartWishlistContext.Provider
      value={{
        cartCount: cartItems.length,
        wishlistCount: wishlistItems.length,
        cartItems,
        wishlistItems,
        cartIds,
        wishlistIds,
        wishlistMap,
        refreshCart,
        refreshWishlist,
        addToCart,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
      }}>
      {children}
    </CartWishlistContext.Provider>
  );
}
