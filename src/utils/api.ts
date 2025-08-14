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
    profileWithCurrency: `${API_BASE_URL}/users/profile-with-currency`,
    byId: (id: string) => `${API_BASE_URL}/users/${id}`,
    withPriceGroup: `${API_BASE_URL}/users/with-price-group`,
    toggleActive: (id: string) => `${API_BASE_URL}/users/${id}/active`,
    addFunds: (id: string) => `${API_BASE_URL}/users/${id}/balance/add`,
    setPassword: (id: string) => `${API_BASE_URL}/users/${id}/password`,
    setOverdraft: (id: string) => `${API_BASE_URL}/users/${id}/overdraft`,
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

  currencies: {
    base: `${API_BASE_URL}/currencies`,
    create: `${API_BASE_URL}/currencies`,
    byId: (id: string) => `${API_BASE_URL}/currencies/${id}`,
    bulkUpdate: `${API_BASE_URL}/currencies/bulk-update`,
  },

  // طلبات المستخدم
  orders: {
    base: `${API_BASE_URL}/orders`,
    byId: (id: string) => `${API_BASE_URL}/orders/${id}`,
    mine: `${API_BASE_URL}/orders/mine`,
  },

  // طلبات الإدمن
  adminOrders: {
    base: `${API_BASE_URL}/admin/orders`,
    byId: (id: string) => `${API_BASE_URL}/admin/orders/${id}`,
    // فردي:
    //   PATCH /admin/orders/:id/status   { status, note? }
    //   POST  /admin/orders/:id/dispatch { providerId?, note? }
    //   POST  /admin/orders/:id/refresh
    //   GET   /admin/orders/:id/logs
    // جماعي:
    bulkManual: `${API_BASE_URL}/admin/orders/bulk/manual`,
    bulkDispatch: `${API_BASE_URL}/admin/orders/bulk/dispatch`,
    bulkApprove: `${API_BASE_URL}/admin/orders/bulk/approve`,
    bulkReject: `${API_BASE_URL}/admin/orders/bulk/reject`,
  },

  notifications: {
    my: `${API_BASE_URL}/notifications/my`,
    readAll: `${API_BASE_URL}/notifications/read-all`,
    readOne: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    announce: `${API_BASE_URL}/notifications/announce`,
  },

  admin: {
    upload: `${API_BASE_URL}/admin/upload`,

    paymentMethods: {
      base: `${API_BASE_URL}/admin/payment-methods`,
      upload: `${API_BASE_URL}/admin/upload`,
      byId: (id: string) => `${API_BASE_URL}/admin/payment-methods/${id}`,
    },

    deposits: {
      base: `${API_BASE_URL}/admin/deposits`,
      setStatus: (id: string) => `${API_BASE_URL}/admin/deposits/${id}/status`,
    },

    // ✅ تكاملات (Integrations)
    integrations: {
      base: `${API_BASE_URL}/admin/integrations`,
      byId: (id: string) => `${API_BASE_URL}/admin/integrations/${id}`,
      test: (id: string) => `${API_BASE_URL}/admin/integrations/${id}/test`,
      refreshBalance: (id: string) =>
        `${API_BASE_URL}/admin/integrations/${id}/refresh-balance`,
      // ⬅️ جديد: مسار جلب الرصيد (الذي استخدمته في الصفحة)
      balance: (id: string) => `${API_BASE_URL}/admin/integrations/${id}/balance`,
      packages: (id: string) =>
        `${API_BASE_URL}/admin/integrations/${id}/packages`,
      syncProducts: (id: string) =>
        `${API_BASE_URL}/admin/integrations/${id}/sync-products`,
      // صفحة توجيه الباقات
      routingAll: (q?: string) => {
        const base = `${API_BASE_URL}/admin/integrations/routing/all`;
        return q && q.trim() ? `${base}?q=${encodeURIComponent(q.trim())}` : base;
      },
      routingSet: `${API_BASE_URL}/admin/integrations/routing/set`,
      providerCost: `${API_BASE_URL}/admin/integrations/provider-cost`,
    },

    reports: {
      profits: `${API_BASE_URL}/admin/reports/profits`,
      users: `${API_BASE_URL}/admin/reports/users`,
      providers: `${API_BASE_URL}/admin/reports/providers`,
    },
  },

  payments: {
    methods: {
      active: `${API_BASE_URL}/payment-methods/active`,
    },
    deposits: {
      create: `${API_BASE_URL}/deposits`,
      mine: `${API_BASE_URL}/deposits/mine`,
    },
  },
};

// ✅ إنشاء نسخة axios موحدة
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ✅ إرسال التوكن تلقائيًا
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
