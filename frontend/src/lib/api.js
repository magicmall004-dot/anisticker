import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  timeout: 30_000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ani_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and reload
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("ani_token");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authLogin = (initData) =>
  api.post("/auth/telegram", { init_data: initData }).then((r) => r.data);

export const getMe = () => api.get("/users/me").then((r) => r.data);

// ── Categories ───────────────────────────────────────────────
export const getCategories = () => api.get("/categories/").then((r) => r.data);
export const createCategory = (data) => api.post("/categories/", data).then((r) => r.data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then((r) => r.data);

// ── Designs ──────────────────────────────────────────────────
export const getDesigns = (params) => api.get("/designs/", { params }).then((r) => r.data);
export const getDesign = (id) => api.get(`/designs/${id}`).then((r) => r.data);
export const createDesign = (data) => api.post("/designs/", data).then((r) => r.data);
export const updateDesign = (id, data) => api.put(`/designs/${id}`, data).then((r) => r.data);
export const deleteDesign = (id) => api.delete(`/designs/${id}`).then((r) => r.data);

// ── Payments ─────────────────────────────────────────────────
export const getPaymentMethods = () => api.get("/payments/").then((r) => r.data);
export const createPaymentMethod = (data) => api.post("/payments/", data).then((r) => r.data);
export const updatePaymentMethod = (id, data) => api.put(`/payments/${id}`, data).then((r) => r.data);
export const deletePaymentMethod = (id) => api.delete(`/payments/${id}`).then((r) => r.data);

// ── Orders ───────────────────────────────────────────────────
export const getOrders = (params) => api.get("/orders/", { params }).then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const createOrder = (data) => api.post("/orders/", data).then((r) => r.data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);

// ── Users ────────────────────────────────────────────────────
export const getUsers = () => api.get("/users/").then((r) => r.data);
export const setUserRole = (id, role) => api.patch(`/users/${id}/role`, { role }).then((r) => r.data);
export const setUserBan = (id, is_banned) => api.patch(`/users/${id}/ban`, { is_banned }).then((r) => r.data);

// ── Upload ───────────────────────────────────────────────────
export const uploadDesignFile = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/upload/design", fd).then((r) => r.data);
};
export const uploadPaymentLogo = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/upload/payment-logo", fd).then((r) => r.data);
};
export const uploadLogo = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/upload/logo", fd).then((r) => r.data);
};
export const uploadTransaction = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/upload/transaction", fd).then((r) => r.data);
};

export default api;
