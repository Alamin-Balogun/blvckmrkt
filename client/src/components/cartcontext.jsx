import {createContext, useContext, useEffect, useState, useCallback} from "react";
import {useAuth} from "../pages/Auth/context/authcontext";

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

// ── Guest cart (localStorage) ─────────────────────────────────────────────────
// Anonymous shoppers get a real cart too — items live in localStorage as
// {product_id, product_size_id, quantity} until either checkout (guest
// order — see /api/guest/orders) or login, at which point it's merged into
// the real server-side cart and cleared (see the merge effect below).
const GUEST_CART_KEY = "blvck_guest_cart";

function loadGuestCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveGuestCart(entries) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
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
  updateCartQuantity: async () => {},
  clearCart: async () => {},
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
  const {token} = useAuth();

  // /api/user/ routes use only Auth() middleware — works for both buyer & brand
  const BASE = `${API_BASE}/api/user`;

  function headers() {
    const t = getToken();
    return {Authorization: `Bearer ${t}`, "Content-Type": "application/json"};
  }

  // ── Guest cart hydration ─────────────────────────────────────────────────────
  // The guest cart only stores product_id/size/qty — fetch the live product
  // data (price, image, stock, brand) in one batch call so it renders the
  // same as a real cart item everywhere (Cart page, checkout, navbar count).
  const hydrateGuestCart = useCallback(async () => {
    const entries = loadGuestCart();
    if (entries.length === 0) {
      setCartItems([]);
      return;
    }
    try {
      const ids = entries.map((e) => e.product_id).join(",");
      const res = await fetch(`${API_BASE}/api/shop/products?ids=${ids}&limit=${entries.length}`);
      const json = await res.json();
      const products = json?.data?.products ?? [];
      const byId = {};
      products.forEach((p) => { byId[p.id] = p; });

      const items = entries
        .map((e) => {
          const p = byId[e.product_id];
          if (!p) return null; // product deleted/deactivated since it was added
          const size = (p.sizes || []).find((s) => s.id === e.product_size_id);
          return {
            id: `guest_${e.product_id}_${e.product_size_id || 0}`,
            product_id: e.product_id,
            product_size_id: e.product_size_id || null,
            selected_size: size?.size ?? null,
            quantity: e.quantity,
            product: p,
          };
        })
        .filter(Boolean);
      setCartItems(items);
    } catch (e) {
      console.warn("[GuestCart] hydrate error:", e);
    }
  }, []);

  // ── Refresh cart ─────────────────────────────────────────────────────────────
  const refreshCart = useCallback(async () => {
    if (!getToken()) {
      await hydrateGuestCart();
      return;
    }
    try {
      const res = await fetch(`${BASE}/cart`, {headers: headers()});
      if (!res.ok) return;
      const json = await res.json();
      setCartItems(parseCartResponse(json));
    } catch (e) {
      console.warn("[Cart] refresh error:", e);
    }
  }, [hydrateGuestCart]); // eslint-disable-line

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
    refreshCart();
    if (getToken()) refreshWishlist();
  }, [refreshCart, refreshWishlist]);

  // ── Merge guest cart into the real cart on login ────────────────────────────
  // Fires whenever a valid session token appears (login/signup, no reload
  // needed since AuthProvider's `login()` just updates React state). Whatever
  // was sitting in the guest cart gets pushed to the server one item at a
  // time (the endpoint already merges quantities for matching product+size),
  // then the local copy is cleared so it doesn't get merged again.
  useEffect(() => {
    if (!token) return;
    const entries = loadGuestCart();
    if (entries.length === 0) return;

    (async () => {
      for (const e of entries) {
        try {
          await fetch(`${BASE}/cart`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({
              product_id: e.product_id,
              product_size_id: e.product_size_id || undefined,
              quantity: e.quantity,
            }),
          });
        } catch (err) {
          console.warn("[Cart] guest merge item failed:", err);
        }
      }
      saveGuestCart([]);
      refreshCart();
    })();
  }, [token]); // eslint-disable-line

  // ── Add to cart ───────────────────────────────────────────────────────────────
  // NOTE: Go handler only accepts products with status = "active"
  // Draft/archived products will return 404 "Product not found or unavailable"
  const addToCart = useCallback(
    async (productId, sizeId = null) => {
      if (!getToken()) {
        const entries = loadGuestCart();
        const existing = entries.find(
          (e) => e.product_id === productId && (e.product_size_id || null) === (sizeId || null),
        );
        if (existing) existing.quantity += 1;
        else entries.push({product_id: productId, product_size_id: sizeId || null, quantity: 1});
        saveGuestCart(entries);
        await hydrateGuestCart();
        return true;
      }
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
    [refreshCart, hydrateGuestCart],
  ); // eslint-disable-line

  // ── Remove from cart ──────────────────────────────────────────────────────────
  const removeFromCart = useCallback(
    async (cartItemId, productId) => {
      if (!getToken()) {
        const entries = loadGuestCart().filter(
          (e) => `guest_${e.product_id}_${e.product_size_id || 0}` !== cartItemId,
        );
        saveGuestCart(entries);
        setCartItems((prev) =>
          prev.filter((i) => i.id !== cartItemId && (i.product_id ?? i.id) !== productId),
        );
        return;
      }
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

  // ── Update cart item quantity ────────────────────────────────────────────────
  const updateCartQuantity = useCallback(
    async (cartItemId, productId, newQty) => {
      if (!getToken()) {
        const entries = loadGuestCart();
        const entry = entries.find(
          (e) => `guest_${e.product_id}_${e.product_size_id || 0}` === cartItemId,
        );
        if (!entry) return {ok: false, message: "Item not found"};
        entry.quantity = newQty;
        saveGuestCart(entries);
        await hydrateGuestCart();
        return {ok: true};
      }
      try {
        const res = await fetch(`${BASE}/cart/${cartItemId}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({quantity: newQty}),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return {ok: false, message: json.message || "Couldn't update quantity — not enough stock."};
        refreshCart();
        return {ok: true};
      } catch {
        return {ok: false, message: "Couldn't update quantity. Please try again."};
      }
    },
    [refreshCart, hydrateGuestCart],
  ); // eslint-disable-line

  // ── Clear cart ────────────────────────────────────────────────────────────────
  const clearCart = useCallback(async () => {
    if (!getToken()) {
      saveGuestCart([]);
      setCartItems([]);
      return;
    }
    // The server already deletes the authenticated cart rows as part of
    // order creation — this just syncs local state to match.
    setCartItems([]);
  }, []);

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
        updateCartQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
      }}>
      {children}
    </CartWishlistContext.Provider>
  );
}
