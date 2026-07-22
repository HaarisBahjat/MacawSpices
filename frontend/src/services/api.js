import axios from 'axios';
import { supabase } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors gracefully with automatic session refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isCartEndpoint = url.startsWith('/cart');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isCartEndpoint) {
      originalRequest._retry = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          localStorage.setItem('sw_token', session.access_token);
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        console.error('Failed to auto-refresh session:', refreshErr);
      }

      localStorage.removeItem('sw_token');
      const isProtected = ['/orders', '/checkout', '/account', '/admin'].some((p) => url.startsWith(p));
      if (isProtected) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get('/products/categories'),
  addReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
};

export const blendAPI = {
  getAll: () => api.get('/blends'),
  getById: (id) => api.get(`/blends/${id}`),
  estimatePrice: (items) => api.post('/blends/price-estimate', { items }),
  save: (data) => api.post('/blends/save', data),
  getMine: () => api.get('/blends/user/mine'),
  unsave: (id) => api.delete(`/blends/save/${id}`),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (data) => api.put('/cart/update', data),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete('/cart/clear'),
};

export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  toggle: (productId) => api.post('/wishlist/toggle', { productId }),
  sync: (productIds) => api.post('/wishlist/sync', { productIds }),
  clear: () => api.delete('/wishlist/clear'),
};

export const orderAPI = {
  getMine: () => api.get('/orders/mine'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  cancel: (id) => api.delete(`/orders/${id}/cancel`),
  requestReturn: (id, data) => api.post(`/orders/${id}/return`, data),
};

export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};

export const authAPI = {
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  addAddress: (data) => api.post('/auth/addresses', data),
  deleteAddress: (id) => api.delete(`/auth/addresses/${id}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetOtp: (email, otp) => api.post('/auth/verify-reset-otp', { email, otp }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  googleAuthSync: (data) => api.post('/auth/google', data),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getProducts: () => api.get('/admin/products'),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status, trackingNumber, courierName) =>
    api.put(`/admin/orders/${id}/status`, { status, trackingNumber, courierName }),
  addTimelineEvent: (id, data) => api.post(`/admin/orders/${id}/timeline`, data),

  createBlend: (data) => api.post('/admin/blends', data),
  createCategory: (data) => api.post('/admin/categories', data),
};

export const shippingAPI = {
  simulateDispatch: (orderId) => api.post(`/shipping/simulate-dispatch/${orderId}`),
  trackOrder: (orderId) => api.get(`/shipping/track/${orderId}`),
  sendWebhookPayload: (payload) => api.post('/shipping/webhook', payload),
};

export default api;
