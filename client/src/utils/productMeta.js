// Derives what to show on a product card:
//   tags     — raw DB tags joined as one string: "smartphone, samsung, android"
//   isOnSale — whether compare_price > price
//   saving   — the ₦ discount amount
//   isNew    — no tags, no sale, added within 7 days
export function getProductMeta(p) {
  const isOnSale = p.compare_price && Number(p.compare_price) > Number(p.price);
  const saving = isOnSale ? Number(p.compare_price) - Number(p.price) : null;

  // All DB tags joined into one comma-separated string
  const tags = p.tags
    ? p.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(", ")
    : "";

  const isNew =
    !tags && !isOnSale && Date.now() - new Date(p.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  return {tags, saving, isOnSale, isNew};
}

export function fmt(n) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

// A product is out of stock once every size's stock is 0 — but only when
// sizes/stock are actually tracked for it (some products have no size rows
// at all, and those aren't stock-gated).
export function isOutOfStock(p) {
  if (p.status === "sold_out") return true;
  const sizes = p.sizes ?? [];
  if (sizes.length === 0) return false;
  return sizes.every((s) => Number(s.stock ?? 0) <= 0);
}
