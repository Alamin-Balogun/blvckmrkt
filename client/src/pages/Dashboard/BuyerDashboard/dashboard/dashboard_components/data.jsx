// ─── Shared mock data & constants for Buyer Dashboard ────────────────────────
// Replace these with real API calls when the backend is ready.

export const mockOrders = [
  {
    id: "ORD-8821",
    date: "Feb 18, 2026",
    status: "delivered",
    total: 185,
    items: 1,
    img: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=120&q=80",
    name: "Alcatraz Hoodie",
    brand: "Corteiz",
  },
  {
    id: "ORD-8756",
    date: "Feb 10, 2026",
    status: "shipped",
    total: 480,
    items: 1,
    img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=120&q=80",
    name: "Box Logo Crewneck",
    brand: "Supreme",
  },
  {
    id: "ORD-8690",
    date: "Jan 29, 2026",
    status: "processing",
    total: 210,
    items: 2,
    img: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=120&q=80",
    name: "Tri-Ferg Hoodie",
    brand: "Palace",
  },
  {
    id: "ORD-8601",
    date: "Jan 12, 2026",
    status: "delivered",
    total: 540,
    items: 1,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80",
    name: "Jordan 4 Retro Thunder",
    brand: "Jordan",
  },
];

export const mockWishlist = [
  {
    id: 1,
    name: "Jordan 4 Retro Thunder",
    brand: "Jordan",
    price: 540,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80",
  },
  {
    id: 2,
    name: "Puffer Jacket",
    brand: "Corteiz",
    price: 320,
    img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&q=80",
  },
  {
    id: 3,
    name: "Palace Tri-Logo Tee",
    brand: "Palace",
    price: 95,
    img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&q=80",
  },
  {
    id: 4,
    name: "Dunk Low Panda",
    brand: "Nike",
    price: 180,
    img: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=200&q=80",
  },
];

export const mockProducts = [
  {
    id: 1,
    name: "Alcatraz Hoodie",
    brand: "Corteiz",
    price: 185,
    img: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=300&q=80",
    tag: "New Drop",
  },
  {
    id: 2,
    name: "Box Logo Crewneck",
    brand: "Supreme",
    price: 480,
    img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&q=80",
    tag: "Limited",
  },
  {
    id: 3,
    name: "Tri-Ferg Hoodie",
    brand: "Palace",
    price: 210,
    img: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=300&q=80",
    tag: null,
  },
  {
    id: 4,
    name: "Jordan 4 Retro Thunder",
    brand: "Jordan",
    price: 540,
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80",
    tag: "Hot",
  },
  {
    id: 5,
    name: "Industrial Belt",
    brand: "Off-White",
    price: 260,
    img: "https://images.unsplash.com/photo-1594938298603-c8148c4b4c7c?w=300&q=80",
    tag: "New Drop",
  },
  {
    id: 6,
    name: "Puffer Jacket",
    brand: "Corteiz",
    price: 320,
    img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80",
    tag: null,
  },
  {
    id: 7,
    name: "Dunk Low Panda",
    brand: "Nike",
    price: 180,
    img: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=300&q=80",
    tag: "Restock",
  },
  {
    id: 8,
    name: "Tri-Logo Tee",
    brand: "Palace",
    price: 95,
    img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300&q=80",
    tag: null,
  },
  {
    id: 9,
    name: "Cargo Pants",
    brand: "Supreme",
    price: 245,
    img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=300&q=80",
    tag: "Limited",
  },
  {
    id: 10,
    name: "Campus 00s",
    brand: "Adidas",
    price: 130,
    img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&q=80",
    tag: null,
  },
  {
    id: 11,
    name: "Fleece Half-Zip",
    brand: "Corteiz",
    price: 165,
    img: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=300&q=80",
    tag: "New Drop",
  },
  {
    id: 12,
    name: "Arch Logo Tee",
    brand: "Jordan",
    price: 75,
    img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=300&q=80",
    tag: null,
  },
];

export const mockNotifications = [
  {
    id: 1,
    type: "drop",
    read: false,
    time: "2 min ago",
    title: "New Corteiz Drop",
    body: "Alcatraz Hoodie just dropped — limited stock. Grab it before it sells out.",
  },
  {
    id: 2,
    type: "order",
    read: false,
    time: "1 hr ago",
    title: "Order Shipped",
    body: "ORD-8756 has been shipped and is on its way to you. Expected delivery in 3–5 days.",
  },
  {
    id: 3,
    type: "drop",
    read: false,
    time: "3 hrs ago",
    title: "Supreme Restock",
    body: "Box Logo Crewneck is back in select sizes. Limited quantities available.",
  },
  {
    id: 4,
    type: "news",
    read: true,
    time: "Yesterday",
    title: "Palace SS26 Preview",
    body: "Early lookbook images for the Palace Spring/Summer 2026 collection are now available.",
  },
  {
    id: 5,
    type: "order",
    read: true,
    time: "2 days ago",
    title: "Order Delivered",
    body: "ORD-8821 has been successfully delivered. Hope you love it!",
  },
  {
    id: 6,
    type: "news",
    read: true,
    time: "3 days ago",
    title: "New Brands Joining",
    body: "Off-White & A-Cold-Wall* are officially joining BLVCKMRKT this month.",
  },
  {
    id: 7,
    type: "drop",
    read: true,
    time: "4 days ago",
    title: "Nike x Jordan Collab",
    body: "Exclusive collab drop incoming. Set a reminder so you don't miss it.",
  },
  {
    id: 8,
    type: "news",
    read: true,
    time: "5 days ago",
    title: "Weekend Flash Sale",
    body: "Selected items from Corteiz and Palace are 20% off this weekend only.",
  },
];

export const spendData = [
  {month: "Sep", value: 120},
  {month: "Oct", value: 340},
  {month: "Nov", value: 210},
  {month: "Dec", value: 580},
  {month: "Jan", value: 750},
  {month: "Feb", value: 875},
];

export const STATUS_MAP = {
  delivered: {label: "Delivered", color: "#22c55e", bg: "rgba(34,197,94,0.12)"},
  shipped: {label: "Shipped", color: "#3b82f6", bg: "rgba(59,130,246,0.12)"},
  processing: {label: "Processing", color: "#f97316", bg: "rgba(249,115,22,0.12)"},
  cancelled: {label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.12)"},
};

export const BRANDS = [
  "All",
  "Corteiz",
  "Supreme",
  "Palace",
  "Jordan",
  "Off-White",
  "Nike",
  "Adidas",
];

export const NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "orders",
    label: "My Orders",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    id: "shop",
    label: "Shop",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];
