// ═══════════════════════════════════════════════════════════
// ZAAVO — API Service Layer
// src/services/api.js
// Centralized API call functions using the configured axios instance
// ═══════════════════════════════════════════════════════════

import { api } from '../store';

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register:      (data)  => api.post('/auth/register', data),
  login:         (data)  => api.post('/auth/login', data),
  google:        (data)  => api.post('/auth/google', data),
  me:            ()      => api.get('/auth/me'),
  verifyOTP:     (otp)   => api.post('/auth/verify-otp', { otp }),
  resendOTP:     ()      => api.post('/auth/resend-otp'),
  forgotPassword:(email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  refreshToken:  (token) => api.post('/auth/refresh-token', { refreshToken: token }),
  logout:        ()      => api.post('/auth/logout'),
};

// ─── User ─────────────────────────────────────────────────────
export const userAPI = {
  getProfile:      ()       => api.get('/users/profile'),
  updateProfile:   (data)   => api.put('/users/profile', data),
  addAddress:      (addr)   => api.post('/users/addresses', addr),
  deleteAddress:   (id)     => api.delete(`/users/addresses/${id}`),
  getWishlist:     ()       => api.get('/users/wishlist'),
  changePassword:  (data)   => api.post('/users/change-password', data),
};

// ─── Restaurants ──────────────────────────────────────────────
export const restaurantAPI = {
  getAll:      (params)  => api.get('/restaurants', { params }),
  getFeatured: ()        => api.get('/restaurants/featured'),
  getNearby:   (lat, lng, radius) => api.get('/restaurants/nearby', { params: { lat, lng, radius } }),
  getById:     (id)      => api.get(`/restaurants/${id}`),
  getMenu:     (id, params) => api.get(`/restaurants/${id}/menu`, { params }),
  create:      (data)    => api.post('/restaurants', data),
  update:      (id, data) => api.put(`/restaurants/${id}`, data),
  toggleOpen:  (id)      => api.patch(`/restaurants/${id}/toggle`),
};

// ─── Foods ────────────────────────────────────────────────────
export const foodAPI = {
  getAll:         (params) => api.get('/foods', { params }),
  getById:        (id)     => api.get(`/foods/${id}`),
  getCategories:  ()       => api.get('/foods/categories'),
  getFitnessMeals:(params) => api.get('/foods/fitness', { params }),
  create:         (data)   => api.post('/foods', data),
  update:         (id, d)  => api.put(`/foods/${id}`, d),
  toggleAvailability: (id, isAvailable) => api.patch(`/foods/${id}/availability`, { isAvailable }),
  delete:         (id)     => api.delete(`/foods/${id}`),
};

// ─── Cart / Coupon ────────────────────────────────────────────
export const couponAPI = {
  getAll:    ()         => api.get('/coupons'),
  validate:  (code, orderAmount) => api.post('/coupons/validate', { code, orderAmount }),
  create:    (data)     => api.post('/coupons', data),
};

// ─── Orders ───────────────────────────────────────────────────
export const orderAPI = {
  place:           (data)   => api.post('/orders', data),
  getMine:         (params) => api.get('/orders/my', { params }),
  getById:         (id)     => api.get(`/orders/${id}`),
  updateStatus:    (id, status, note) => api.patch(`/orders/${id}/status`, { status, note }),
  cancel:          (id, reason)       => api.patch(`/orders/${id}/cancel`, { reason }),
  getRestaurantOrders: (restaurantId, params) => api.get(`/orders/restaurant/${restaurantId}`, { params }),
};

// ─── Payments ─────────────────────────────────────────────────
export const paymentAPI = {
  createOrder:    (data)  => api.post('/payments/create-order', data),
  verify:         (data)  => api.post('/payments/verify', data),
  refund:         (data)  => api.post('/payments/refund', data),
  getHistory:     ()      => api.get('/payments/history'),
  addToWallet:    (amount)=> api.post('/payments/wallet/add', { amount }),
};

// ─── Reviews ──────────────────────────────────────────────────
export const reviewAPI = {
  create:         (data)  => api.post('/reviews', data),
  getRestaurantReviews: (id) => api.get(`/reviews/restaurant/${id}`),
};

// ─── Subscriptions ────────────────────────────────────────────
export const subscriptionAPI = {
  getPlans:    ()        => api.get('/subscriptions/plans'),
  getMine:     ()        => api.get('/subscriptions/my'),
  subscribe:   (plan, paymentId) => api.post('/subscriptions/subscribe', { plan, paymentId }),
  useMeal:     ()        => api.post('/subscriptions/use-meal'),
  cancel:      ()        => api.patch('/subscriptions/cancel'),
  pause:       ()        => api.patch('/subscriptions/pause'),
  renew:       ()        => api.post('/subscriptions/renew'),
  getHistory:  ()        => api.get('/subscriptions/history'),
};

// ─── Notifications ─────────────────────────────────────────────
export const notificationAPI = {
  getAll:         (params) => api.get('/notifications', { params }),
  markAllRead:    ()       => api.patch('/notifications/read-all'),
  markRead:       (id)     => api.patch(`/notifications/${id}/read`),
  delete:         (id)     => api.delete(`/notifications/${id}`),
  clearAll:       ()       => api.delete('/notifications'),
  registerToken:  (token)  => api.post('/notifications/register-token', { token }),
};

// ─── Delivery ──────────────────────────────────────────────────
export const deliveryAPI = {
  getDashboard: ()     => api.get('/delivery/dashboard'),
  register:     (data) => api.post('/delivery/register', data),
};

// ─── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:       () => api.get('/admin/dashboard'),
  getUsers:           (params) => api.get('/admin/users', { params }),
  approveRestaurant:  (id) => api.patch(`/admin/restaurants/${id}/approve`),
  getOrders:          (params) => api.get('/admin/orders', { params }),
  getRevenueAnalytics:() => api.get('/admin/analytics/revenue'),
  broadcast:          (data) => api.post('/admin/broadcast', data),
};

// ─── Generic search ────────────────────────────────────────────
export const searchAll = async (query) => {
  const [restaurants, foods] = await Promise.all([
    restaurantAPI.getAll({ search: query, limit: 5 }),
    foodAPI.getAll({ search: query, limit: 8 }),
  ]);
  return {
    restaurants: restaurants.data.data.restaurants || [],
    foods:       foods.data.data.foods || [],
  };
};
