// ─── BLVCKMRKT Brand Dashboard — shared constants (no JSX) ───────────────────

export const STATUS_MAP = {
  active: {label: "Active", color: "#22c55e", bg: "rgba(34,197,94,0.12)"},
  draft: {label: "Draft", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
  sold_out: {label: "Sold Out", color: "#ef4444", bg: "rgba(239,68,68,0.12)"},
  archived: {label: "Archived", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.07)"},
  pending: {label: "Pending", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
  processing: {label: "Processing", color: "#3b82f6", bg: "rgba(59,130,246,0.12)"},
  shipped: {label: "Shipped", color: "#a855f7", bg: "rgba(168,85,247,0.12)"},
  delivered: {label: "Delivered", color: "#22c55e", bg: "rgba(34,197,94,0.12)"},
  cancelled: {label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.12)"},
  refunded: {label: "Refunded", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
};

export const PAGE_TITLES = {
  overview: "Studio",
  products: "Products",
  orders: "Orders",
  analytics: "Analytics",
  settings: "Settings",
};

// Nav item IDs and labels only — icons live in Sidebar.jsx / TopBar.jsx
export const NAV_ITEMS = [
  {id: "overview", label: "Studio"},
  {id: "products", label: "Products"},
  {id: "orders", label: "Orders"},
  {id: "analytics", label: "Analytics"},
  {id: "settings", label: "Settings"},
];
