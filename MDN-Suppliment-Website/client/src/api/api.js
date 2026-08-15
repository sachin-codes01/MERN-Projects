import { readCache, writeCache, clearApiCache } from "../utils/apiCache";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// How long a cached public GET stays servable. Freshness is traded against
// round-trips per route, not globally:
//
//  - product detail is the shortest by far. It is the page someone reads
//    immediately before paying, so a stale price or an "in stock" on a
//    sold-out item is a real problem, not a cosmetic one.
//  - listings tolerate more. A new arrival showing up a few minutes late
//    on a category row costs nothing, and these are the heaviest and
//    most-repeated calls on the site.
const TTL = {
  productDetail: 2 * 60 * 1000,
  productList: 10 * 60 * 1000,
  default: 5 * 60 * 1000,
};

const ttlFor = (path) => {
  // `/products/<slug>` but not `/products` or `/products?...`
  if (/^\/products\/[^/?]+$/.test(path)) return TTL.productDetail;
  if (path.startsWith("/products")) return TTL.productList;
  return TTL.default;
};

// Only public, unauthenticated reads are cacheable.
//
// The `token` check is the important one and it is deliberately on the
// token rather than on the path: it keeps every personal response — cart,
// orders, addresses, profile — out of localStorage, where it would sit
// readable by any script on the origin and outlive a logout on a shared
// machine. Admin routes are all tokened too, so they are already excluded;
// the explicit path check just makes that non-accidental.
//
// Search suggestions are skipped on volume, not privacy: they fire per
// keystroke, so caching them would spend the whole storage budget on
// hundreds of near-duplicate prefixes.
const isCacheable = (path, method, token) =>
  method === "GET" &&
  !token &&
  !path.startsWith("/admin") &&
  !path.startsWith("/products/suggest");

// Session expired/invalid on the server (401) while we sent a token —
// force a clean logout instead of leaving the UI stuck on a broken
// session. Only fires when a token was actually sent, so a 401 on a
// public/unauthenticated call (e.g. a failed login attempt) doesn't
// wipe anything. Full reload to "/" so every bit of in-memory auth
// state (AuthContext, etc) resets from localStorage on the next mount.
function handleExpiredSession(token, status) {
  if (!token || status !== 401) return;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  if (window.location.pathname !== "/") window.location.href = "/";
}

// Access tokens expire after 15 minutes. Rather than hard-logging the user
// out at that point, trade the stored refresh token for a new access token
// once and let the original call transparently retry. Concurrent 401s
// share one in-flight refresh instead of each firing their own.
let refreshPromise = null;
async function refreshAccessToken() {
  const storedRefreshToken = localStorage.getItem("refreshToken");
  if (!storedRefreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.success || !data.accessToken) return null;
        localStorage.setItem("token", data.accessToken);
        // Lets AuthContext (which holds its own token state, set once at
        // login) pick up the rotated token without a full page reload.
        window.dispatchEvent(new CustomEvent("auth:token-refreshed", { detail: data.accessToken }));
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, { method = "GET", body, token, _retried = false } = {}) {
  const cacheable = isCacheable(path, method, token);

  // Cache-first, not stale-while-revalidate: `request` hands back a single
  // promise and every call site does one `setState` with it, so there is
  // no channel to push a late revalidation through without reworking all
  // of them. Within the TTL this returns without touching the network at
  // all — which is the entire point on a cold Render instance.
  if (cacheable) {
    const hit = readCache(path);
    if (hit) return hit;
  }

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) return request(path, { method, body, token: newToken, _retried: true });
  }

  handleExpiredSession(token, res.status);

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}) — check that the API route exists`);
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Something went wrong");
  }

  // Written only after the error checks above, so a 4xx/5xx body can never
  // be replayed to the next visitor as if it were a real response.
  if (cacheable) writeCache(path, data, ttlFor(path));

  // Any successful write invalidates the whole public cache. Not an
  // optimisation — without it, "mutate, then refetch to show the result"
  // silently reads back the pre-mutation copy. ProductDetail does exactly
  // that: it posts a review and immediately re-fetches the product, which
  // would have returned the cached body with the new review missing.
  // Blowing away all public entries is coarse, but the alternative is a
  // route-to-route dependency map, and the cost of being wrong here is a
  // visitor staring at a change they just made and not seeing it.
  if (method !== "GET") clearApiCache();

  return data;
}

// File upload ke liye alag helper — FormData bhejta hai, JSON nahi.
async function uploadFile(path, file, token, _retried = false) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (res.status === 401 && token && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) return uploadFile(path, file, newToken, true);
  }

  handleExpiredSession(token, res.status);

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}) — check that the API route exists`);
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Upload failed");
  }
  return data;
}

export const api = {
  // ---------- AUTH (Google OAuth) ----------
  googleLogin: (credential) => request("/auth/google", { method: "POST", body: { credential } }),
  getMe: (token) => request("/auth/me", { token }),
  logout: (token) => request("/auth/logout", { method: "POST", token }),

  // ---------- PRODUCTS ----------
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  // Autocomplete feed for the navbar search box — a few ranked rows for
  // a partial term, not a full paginated listing.
  suggestProducts: (q, limit = 8) =>
    request(`/products/suggest?${new URLSearchParams({ q, limit }).toString()}`),
  getProductBySlug: (slug) => request(`/products/${slug}`),
  addProductReview: (token, productId, payload) =>
    request(`/products/${productId}/reviews`, { method: "POST", body: payload, token }),

  // ---------- CART ----------
  getCart: (token) => request("/cart", { token }),
  addToCart: (token, payload) => request("/cart/items", { method: "POST", body: payload, token }),
  updateCartItem: (token, itemId, quantity) =>
    request(`/cart/items/${itemId}`, { method: "PUT", body: { quantity }, token }),
  removeCartItem: (token, itemId) =>
    request(`/cart/items/${itemId}`, { method: "DELETE", token }),

  applyCoupon: (token, code) =>
    request("/cart/coupon", { method: "POST", body: { code }, token }),
  removeCoupon: (token) =>
    request("/cart/coupon", { method: "DELETE", token }),

  // ---------- ORDERS (Razorpay payment ke saath) ----------
  createRazorpayOrder: (token) =>
    request("/orders/create-razorpay-order", { method: "POST", token }),
  verifyPayment: (token, payload) =>
    request("/orders/verify-payment", { method: "POST", body: payload, token }),
  getMyOrders: (token) => request("/orders", { token }),
  getOrderById: (token, id) => request(`/orders/${id}`, { token }),
  cancelOrder: (token, id, reason) =>
    request(`/orders/${id}/cancel`, { method: "PUT", body: { reason }, token }),

  // ---------- USER ADDRESSES ----------
  getMyAddresses: (token) => request("/users/me/addresses", { token }),
  addAddress: (token, payload) =>
    request("/users/me/addresses", { method: "POST", body: payload, token }),
  updateAddress: (token, addressId, payload) =>
    request(`/users/me/addresses/${addressId}`, { method: "PUT", body: payload, token }),
  deleteAddress: (token, addressId) =>
    request(`/users/me/addresses/${addressId}`, { method: "DELETE", token }),

  // ---------- ADMIN: IMAGE UPLOAD (Cloudinary) ----------
  uploadImage: (token, file) => uploadFile("/admin/upload", file, token),

  // ---------- ADMIN: CATEGORIES ----------
  adminGetCategories: (token) => request("/admin/categories", { token }),
  adminCreateCategory: (token, payload) =>
    request("/admin/categories", { method: "POST", body: payload, token }),
  adminUpdateCategory: (token, id, payload) =>
    request(`/admin/categories/${id}`, { method: "PUT", body: payload, token }),
  adminDeleteCategory: (token, id) =>
    request(`/admin/categories/${id}`, { method: "DELETE", token }),

  // ---------- ADMIN: PRODUCTS ----------
  adminGetProducts: (token) => request("/admin/products", { token }),
  adminGetProduct: (token, id) => request(`/admin/products/${id}`, { token }),
  adminCreateProduct: (token, payload) =>
    request("/admin/products", { method: "POST", body: payload, token }),
  adminUpdateProduct: (token, id, payload) =>
    request(`/admin/products/${id}`, { method: "PUT", body: payload, token }),
  adminDeleteProduct: (token, id) =>
    request(`/admin/products/${id}`, { method: "DELETE", token }), // soft — sets isActive:false
  adminPermanentlyDeleteProduct: (token, id) =>
    request(`/admin/products/${id}/permanent`, { method: "DELETE", token }), // irreversible

  // ---------- ADMIN: COUPONS ----------
  adminGetCoupons: (token) => request("/admin/coupons", { token }),
  adminGetCoupon: (token, id) => request(`/admin/coupons/${id}`, { token }),
  adminCreateCoupon: (token, payload) =>
    request("/admin/coupons", { method: "POST", body: payload, token }),
  adminUpdateCoupon: (token, id, payload) =>
    request(`/admin/coupons/${id}`, { method: "PUT", body: payload, token }),
  adminDeleteCoupon: (token, id) =>
    request(`/admin/coupons/${id}`, { method: "DELETE", token }),

  // ---------- ADMIN: ORDERS ----------
  adminGetOrders: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/orders${qs ? `?${qs}` : ""}`, { token });
  },
  adminGetOrder: (token, id) => request(`/admin/orders/${id}`, { token }),
  adminUpdateOrderStatus: (token, id, payload) =>
    request(`/admin/orders/${id}/status`, { method: "PUT", body: payload, token }),

  // ---------- ADMIN: USERS ----------
  adminGetUsers: (token) => request("/admin/users", { token }),
  adminGetUser: (token, id) => request(`/admin/users/${id}`, { token }),
  adminGetUserOrders: (token, id) => request(`/admin/users/${id}/orders`, { token }),
  adminBlockUser: (token, id) =>
    request(`/admin/users/${id}/block`, { method: "PUT", token }),
  adminUnblockUser: (token, id) =>
    request(`/admin/users/${id}/unblock`, { method: "PUT", token }),

  // ---------- CONTACT / ENQUIRIES ----------
  createEnquiry: (token, payload) => request("/enquiries", { method: "POST", body: payload, token }),
  markEnquiryChannel: (token, id, channel) =>
    request(`/enquiries/${id}/channel`, { method: "PUT", body: { channel }, token }),
  adminGetEnquiries: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/enquiries${qs ? `?${qs}` : ""}`, { token });
  },
  adminUpdateEnquiryStatus: (token, id, status) =>
    request(`/admin/enquiries/${id}/status`, { method: "PUT", body: { status }, token }),

};