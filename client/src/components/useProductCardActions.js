import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useCartWishlist, getToken} from "./cartcontext";

// Cart/wishlist add+remove wiring shared by every ProductCard consumer that
// isn't the main shop grid (which owns its own copy tied to its filter
// state). Mirrors the exact behavior in productgrid.jsx: removing from cart
// needs the cart item's own id (looked up by product id), wishlist removal
// takes the product id directly.
export default function useProductCardActions() {
  const navigate = useNavigate();
  const {
    cartIds,
    cartItems,
    wishlistIds,
    addToCart: ctxAddToCart,
    removeFromCart: ctxRemoveFromCart,
    addToWishlist: ctxAddToWishlist,
    removeFromWishlist: ctxRemoveWishlist,
  } = useCartWishlist();

  const [loadingCartId, setLoadingCartId] = useState(null);
  const [loadingWishId, setLoadingWishId] = useState(null);
  const [addedId, setAddedId] = useState(null);

  const onAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    // No login required — guests get a localStorage cart (see cartcontext.jsx).
    setLoadingCartId(product.id);
    if (cartIds.includes(product.id)) {
      const item = cartItems.find((i) => (i.product_id ?? i.id) === product.id);
      if (item) await ctxRemoveFromCart(item.id, product.id);
    } else {
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1500);
      await ctxAddToCart(product.id, null);
    }
    setLoadingCartId(null);
  };

  const onToggleWishlist = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setLoadingWishId(productId);
    if (wishlistIds.includes(productId)) {
      await ctxRemoveWishlist(productId);
    } else {
      await ctxAddToWishlist(productId);
    }
    setLoadingWishId(null);
  };

  return {cartIds, wishlistIds, loadingCartId, loadingWishId, addedId, onAddToCart, onToggleWishlist};
}
