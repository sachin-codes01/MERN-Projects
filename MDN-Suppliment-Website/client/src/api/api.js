const BASE_URL = import.meta.env.VITE_BASE_URL;

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}) — check that the API route exists`);
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  getMe: (token) => request("/auth/me", { token }),

  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProductBySlug: (slug) => request(`/products/${slug}`),
  addProductReview: (token, productId, payload) =>
    request(`/products/${productId}/reviews`, { method: "POST", body: payload, token }),

  getCart: (token) => request("/cart", { token }),
  addToCart: (token, payload) => request("/cart/items", { method: "POST", body: payload, token }),
  updateCartItem: (token, variantId, quantity) =>
    request(`/cart/items/${variantId}`, { method: "PUT", body: { quantity }, token }),
  removeCartItem: (token, variantId) =>
    request(`/cart/items/${variantId}`, { method: "DELETE", token }),

  applyCoupon: (token, code) =>
    request("/cart/coupon", { method: "POST", body: { code }, token }),
  removeCoupon: (token) =>
    request("/cart/coupon", { method: "DELETE", token }),

  placeOrder: (token, payload) => request("/orders", { method: "POST", body: payload, token }),
  getMyOrders: (token) => request("/orders", { token }),
  getOrderById: (token, id) => request(`/orders/${id}`, { token }),
  cancelOrder: (token, id, reason) =>
    request(`/orders/${id}/cancel`, { method: "PUT", body: { reason }, token }),

  getMyAddresses: (token) => request("/users/me/addresses", { token }),
  addAddress: (token, payload) =>
    request("/users/me/addresses", { method: "POST", body: payload, token }),
  updateAddress: (token, addressId, payload) =>
    request(`/users/me/addresses/${addressId}`, { method: "PUT", body: payload, token }),
  deleteAddress: (token, addressId) =>
    request(`/users/me/addresses/${addressId}`, { method: "DELETE", token }),

  /* ---------- ADMIN: CATEGORIES ---------- */
  adminGetCategories: (token) => request("/admin/categories", { token }),
  adminCreateCategory: (token, payload) =>
    request("/admin/categories", { method: "POST", body: payload, token }),
  adminUpdateCategory: (token, id, payload) =>
    request(`/admin/categories/${id}`, { method: "PUT", body: payload, token }),
  adminDeleteCategory: (token, id) =>
    request(`/admin/categories/${id}`, { method: "DELETE", token }),

  /* ---------- ADMIN: PRODUCTS ---------- */
  adminGetProducts: (token) => request("/admin/products", { token }),
  adminGetProduct: (token, id) => request(`/admin/products/${id}`, { token }),
  adminCreateProduct: (token, payload) =>
    request("/admin/products", { method: "POST", body: payload, token }),
  adminUpdateProduct: (token, id, payload) =>
    request(`/admin/products/${id}`, { method: "PUT", body: payload, token }),
  adminDeleteProduct: (token, id) =>
    request(`/admin/products/${id}`, { method: "DELETE", token }),

  /* ---------- ADMIN: COUPONS ---------- */
  adminGetCoupons: (token) => request("/admin/coupons", { token }),
  adminGetCoupon: (token, id) => request(`/admin/coupons/${id}`, { token }),
  adminCreateCoupon: (token, payload) =>
    request("/admin/coupons", { method: "POST", body: payload, token }),
  adminUpdateCoupon: (token, id, payload) =>
    request(`/admin/coupons/${id}`, { method: "PUT", body: payload, token }),
  adminDeleteCoupon: (token, id) =>
    request(`/admin/coupons/${id}`, { method: "DELETE", token }),

  /* ---------- ADMIN: ORDERS ---------- */
  adminGetOrders: (token, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/orders${qs ? `?${qs}` : ""}`, { token });
  },
  adminGetOrder: (token, id) => request(`/admin/orders/${id}`, { token }),
  adminUpdateOrderStatus: (token, id, payload) =>
    request(`/admin/orders/${id}/status`, { method: "PUT", body: payload, token }),

  /* ---------- ADMIN: USERS ---------- */
  adminGetUsers: (token) => request("/admin/users", { token }),
  adminGetUser: (token, id) => request(`/admin/users/${id}`, { token }),
  adminGetUserOrders: (token, id) => request(`/admin/users/${id}/orders`, { token }),
  adminBlockUser: (token, id) =>
    request(`/admin/users/${id}/block`, { method: "PUT", token }),
  adminUnblockUser: (token, id) =>
    request(`/admin/users/${id}/unblock`, { method: "PUT", token }),
};