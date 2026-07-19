const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

function getToken() {
  return localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token") || "";
}

async function request(method, path, body, auth = false) {
  const headers = {"Content-Type": "application/json"};
  if (auth) {
    const token = getToken();
    if (!token) throw new Error("You need to be logged in.");
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json.data;
}

export const isLoggedIn = () => !!getToken();

export const CATEGORIES = [
  {value: "general",         label: "General Discussion"},
  {value: "design_feedback", label: "Design Feedback"},
  {value: "showcase",        label: "Showcase"},
  {value: "question",        label: "Question"},
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || "General Discussion";
}

const CATEGORY_COLORS = {
  general:         {color: "rgba(255,255,255,0.65)", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.22)"},
  design_feedback: {color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)"},
  showcase:        {color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)"},
  question:        {color: "#38bdf8", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.35)"},
};

export function categoryStyle(value) {
  return CATEGORY_COLORS[value] || CATEGORY_COLORS.general;
}

// ── Public (optional auth) ────────────────────────────────────────────────────
export function listPosts({category = "", sort = "newest", page = 1, limit = 10} = {}) {
  const token = getToken();
  const params = new URLSearchParams({sort, page: String(page), limit: String(limit)});
  if (category) params.set("category", category);
  return fetch(`${API_BASE}/api/community/posts?${params}`, {
    headers: token ? {Authorization: `Bearer ${token}`} : {},
  })
    .then((r) => r.json())
    .then((json) => {
      if (!json.success) throw new Error(json.message || "Failed to load posts");
      return json.data;
    });
}

export function getPost(id) {
  const token = getToken();
  return fetch(`${API_BASE}/api/community/posts/${id}`, {
    headers: token ? {Authorization: `Bearer ${token}`} : {},
  })
    .then((r) => r.json())
    .then((json) => {
      if (!json.success) throw new Error(json.message || "Post not found");
      return json.data;
    });
}

export function listComments(postId) {
  return request("GET", `/community/posts/${postId}/comments`);
}

// ── Authenticated ──────────────────────────────────────────────────────────
export const createPost   = ({category, body, image_url}) => request("POST", "/user/community/posts", {category, body, image_url}, true);
export const updatePost   = (id, {category, body, image_url}) => request("PUT", `/user/community/posts/${id}`, {category, body, image_url}, true);
export const deletePost   = (id) => request("DELETE", `/user/community/posts/${id}`, undefined, true);
export const toggleLike   = (id) => request("POST", `/user/community/posts/${id}/like`, {}, true);
export const createComment = (postId, body) => request("POST", `/user/community/posts/${postId}/comments`, {body}, true);
export const deleteComment = (id) => request("DELETE", `/user/community/comments/${id}`, undefined, true);
export const reportPost    = (id, reason) => request("POST", `/user/community/posts/${id}/report`, {reason}, true);
export const reportComment = (id, reason) => request("POST", `/user/community/comments/${id}/report`, {reason}, true);
