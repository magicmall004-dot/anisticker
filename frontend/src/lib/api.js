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
export const getOrders   = (params) => api.get("/orders/", { params }).then((r) => r.data);
export const cancelOrder  = (id) => api.patch(`/orders/${id}/cancel`).then((r) => r.data);
export const getMyOrders = (params) => api.get("/orders/", { params: { ...params, mine:true } }).then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const createOrder = (data) => api.post("/orders/", data).then((r) => r.data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);

// ── Users ────────────────────────────────────────────────────
export const getUsers = () => api.get("/users/").then((r) => r.data);
export const setUserRole = (id, role) => api.patch(`/users/${id}/role`, { role }).then((r) => r.data);
export const setUserBan = (id, is_banned) => api.patch(`/users/${id}/ban`, { is_banned }).then((r) => r.data);

// ── Upload ───────────────────────────────────────────────────
export const uploadDesignFile = (file, designId = null) => {
  const fd = new FormData();
  fd.append("file", file);
  if (designId) fd.append("design_id", designId);
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

export const getAppSettings      = () => api.get("/settings/").then((r) => r.data);
export const updateAppSettings   = (data) => api.patch("/settings/", data).then((r) => r.data);
export const getMyBalance        = () => api.get("/balance/").then((r) => r.data);
export const getBalanceHistory   = () => api.get("/balance/history").then((r) => r.data);
export const requestTopup        = (data) => api.post("/balance/topup", data).then((r) => r.data);
export const getTopupRequests    = (status) => api.get("/balance/requests", { params:{status} }).then((r) => r.data);
export const actionTopupRequest  = (id, action) => api.patch(`/balance/requests/${id}`, { action }).then((r) => r.data);
export const adjustBalance       = (data) => api.post("/balance/adjust", data).then((r) => r.data);
export const getAllBalances       = () => api.get("/balance/users").then((r) => r.data);
export const checkMembership     = () => api.get("/membership/check").then((r) => r.data);
export const getActiveGiveaway   = () => api.get("/giveaway/active").then((r) => r.data);
export const getGiveawayDetail   = (id) => api.get(`/giveaway/${id}`).then((r) => r.data);
export const joinGiveaway        = (id) => api.post(`/giveaway/${id}/join`).then((r) => r.data);
export const getGiveaways        = () => api.get("/giveaway/").then((r) => r.data);
export const createGiveaway      = (data) => api.post("/giveaway/", data).then((r) => r.data);
export const drawGiveaway        = (id) => api.post(`/giveaway/${id}/draw`).then((r) => r.data);
export const deleteGiveaway      = (id) => api.delete(`/giveaway/${id}`).then((r) => r.data);
export const getMyVouchers       = () => api.get("/giveaway/vouchers/mine").then((r) => r.data);
export const createRedeemCode    = (data) => api.post("/redeem/", data).then((r) => r.data);
export const getRedeemCodes      = () => api.get("/redeem/").then((r) => r.data);
export const toggleRedeemCode    = (id) => api.patch(`/redeem/${id}/toggle`).then((r) => r.data);
export const deleteRedeemCode    = (id) => api.delete(`/redeem/${id}`).then((r) => r.data);
export const useRedeemCode       = (code) => api.post("/redeem/use", { code }).then((r) => r.data);

// Signed URL cache {path: {url, expires}}
const _urlCache = {};

export async function signUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  // Extract path from supabase URL
  const match = rawUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/(.+)/);
  if (!match) return rawUrl;
  const path = match[1];
  
  // Check cache
  const cached = _urlCache[path];
  if (cached && cached.expires > Date.now()) return cached.url;
  
  try {
    const res = await api.get("/storage/sign", { params: { path } });
    const url = res.data.url;
    _urlCache[path] = { url, expires: Date.now() + 3500000 }; // ~58 min
    return url;
  } catch(e) {
    return rawUrl; // fallback
  }
}

export default api;

// ── Fonts ──────────────────────────────────────────────────
export const getFontSets = () => api.get("/fonts/").then((r) => r.data);
export const createFontSet = (data) => api.post("/fonts/", data).then((r) => r.data);
export const deleteFontSet = (id) => api.delete(`/fonts/${id}`).then((r) => r.data);
export const getGlyphs = (fontSetId) => api.get(`/fonts/${fontSetId}/glyphs`).then((r) => r.data);
export const uploadGlyph = (fontSetId, character, file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("character", character);
  return api.post(`/fonts/${fontSetId}/glyphs`, fd).then((r) => r.data);
};
export const deleteGlyph = (fontSetId, character) => api.delete(`/fonts/${fontSetId}/glyphs/${encodeURIComponent(character)}`).then((r) => r.data);
export const uploadStartAsset = (fontSetId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/fonts/${fontSetId}/start`, fd).then((r) => r.data);
};
export const uploadEndAsset = (fontSetId, file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post(`/fonts/${fontSetId}/end`, fd).then((r) => r.data);
};
export const composeText = (fontSetId, text) => api.post(`/fonts/${fontSetId}/compose`, { text }).then((r) => r.data);

// ── Favorites ──────────────────────────────────────────────
export const getFavorites = () => api.get("/favorites/").then((r) => r.data);
export const addFavorite = (designId) => api.post(`/favorites/${designId}`).then((r) => r.data);
export const removeFavorite = (designId) => api.delete(`/favorites/${designId}`).then((r) => r.data);

export const uploadSettingFile = (key, file) => {
  const fd = new FormData();
  fd.append("key", key);
  fd.append("file", file);
  return api.post("/upload/setting", fd).then((r) => r.data);
};

export const getMyEmojiStatus = () => api.get("/users/me/emoji-status").then((r) => r.data);

export const syncEmojiNow = (designId) => api.post(`/designs/${designId}/sync-emoji`).then((r) => r.data);
export const confirmManualEmoji = (designId) => api.post(`/designs/${designId}/confirm-manual-emoji`).then((r) => r.data);
export const verifyEmojiLinks = () => api.post("/designs/verify-emoji-links").then((r) => r.data);
export const cleanupOrphanedEmoji = () => api.post("/designs/cleanup-orphaned-emoji").then((r) => r.data);
export const requestFileViaBot = (designId) => api.post(`/designs/${designId}/request-file-via-bot`).then((r) => r.data);

export const getEmojiPacks = () => api.get("/emoji-packs/").then((r) => r.data);
