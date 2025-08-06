// src/utils/api.ts
import axios from 'axios';

// ✅ العنوان الأساسي للـ API من متغير البيئة مع قيمة افتراضية محلية
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ✅ جميع مسارات الـ API
export const API_ROUTES = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    profile: `${API_BASE_URL}/users/profile`,
  },
  users: {
    base: `${API_BASE_URL}/users`,
    register: `${API_BASE_URL}/users/register`,
    profile: `${API_BASE_URL}/users/profile`,
    me: `${API_BASE_URL}/users/profile`,
    byId: (id: string) => `${API_BASE_URL}/users/${id}`,
    withPriceGroup: `${API_BASE_URL}/users/with-price-group`,
  },
  products: {
    base: `${API_BASE_URL}/products`,
    byId: (id: string) => `${API_BASE_URL}/products/${id}`,
    priceGroups: `${API_BASE_URL}/products/price-groups`,
  },
  priceGroups: {
    base: `${API_BASE_URL}/products/price-groups`,
    create: `${API_BASE_URL}/products/price-groups`,
    byId: (id: string) => `${API_BASE_URL}/products/price-groups/${id}`,
  },
  admin: {
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    users: `${API_BASE_URL}/admin/users`,
    orders: `${API_BASE_URL}/admin/orders`,
  },
  currencies: {
    base: `${API_BASE_URL}/currencies`,
    create: `${API_BASE_URL}/currencies`,
    byId: (id: string) => `${API_BASE_URL}/currencies/${id}`,
  },
  orders: {
    base: `${API_BASE_URL}/orders`,
    byId: (id: string) => `${API_BASE_URL}/orders/${id}`,
  },
};

// ✅ إنشاء نسخة axios موحدة مع baseURL من المتغير
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ إضافة Interceptor لإرسال التوكن تلقائيًا مع كل طلب
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
