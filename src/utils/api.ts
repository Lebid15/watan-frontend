// src/utils/api.ts
import axios from 'axios';

/* =========================
   إعدادات وبيئة التشغيل
   ========================= */

// عنوان الـ API (مثال محلي: http://localhost:3001/api)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// هل الـ API محلي؟
const isLocalhostApi = /^https?:\/\/localhost(?::\d+)?/i.test(
  API_BASE_URL.replace(/\/api\/?$/, '')
);

/** فلاغ للتحكم بطلب "تفاصيل الطلب":
 * - يقرأ من NEXT_PUBLIC_ORDERS_DETAILS_ENABLED
 * - إن لم يحدَّد، نعطلها تلقائيًا عندما يكون الـ API محليًا لتجنّب 404
 */
export const ORDERS_DETAILS_ENABLED = (() => {
  const v = process.env.NEXT_PUBLIC_ORDERS_DETAILS_ENABLED;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return !isLocalhostApi; // افتراضي: عطّل محليًا، فعِّل في الإنتاج
})();

/** قراءة بدائل مسارات (alts) من env:
 * NEXT_PUBLIC_ORDERS_ALTS يمكن أن تكون JSON Array أو قائمة مفصولة بفواصل
 * مثال: '["/api/orders/me"]' أو '/api/orders/me'
 */
function parseAltsEnv(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.map(String);
  } catch {
    // ليس JSON — اعتبره قائمة بفواصل
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const ORDERS_ALTS = parseAltsEnv('NEXT_PUBLIC_ORDERS_ALTS');

/* =========================
   تعريف المسارات
   ========================= */

export const API_ROUTES = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    profile: `${API_BASE_URL}/users/profile`,
    changePassword: `${API_BASE_URL}/auth/change-password`,
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

  /* ===== طلبات المستخدم ===== */
  orders: {
    base: `${API_BASE_URL}/orders`,
    mine: `${API_BASE_URL}/orders/me`,
    byId: (id: string) => `${API_BASE_URL}/orders/${id}`,
    /** يقرأه الكلاينت ليتخذ قرار جلب التفاصيل أو لا */
    detailsEnabled: ORDERS_DETAILS_ENABLED,
    /** بدائل لمسارات (مثلاً /orders/me) إن رغبت في التجربة */
    _alts: ORDERS_ALTS,
  },

  /* ===== طلبات الإدمن ===== */
  adminOrders: {
    base: `${API_BASE_URL}/admin/orders`,
    list: `${API_BASE_URL}/admin/orders`,
    byId: (id: string) => `${API_BASE_URL}/admin/orders/${id}`,
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
      list: (p?: Record<string, string | number | boolean>) => {
        const base = `${API_BASE_URL}/admin/deposits`;
        if (!p) return base;
        const qs = new URLSearchParams(
          Object.fromEntries(
            Object.entries(p).map(([k, v]) => [k, String(v)])
          )
        ).toString();
        return qs ? `${base}?${qs}` : base;
      },
    },

    integrations: {
      base: `${API_BASE_URL}/admin/integrations`,
      byId: (id: string) => `${API_BASE_URL}/admin/integrations/${id}`,
      test: (id: string) => `${API_BASE_URL}/admin/integrations/${id}/test`,
      refreshBalance: (id: string) =>
        `${API_BASE_URL}/admin/integrations/${id}/refresh-balance`,
      balance: (id: string) => `${API_BASE_URL}/admin/integrations/${id}/balance`,
      packages: (id: string) => `${API_BASE_URL}/admin/integrations/${id}/packages`,
      syncProducts: (id: string) =>
        `${API_BASE_URL}/admin/integrations/${id}/sync-products`,

      // تكاليف المزودين
      providerCost: `${API_BASE_URL}/admin/integrations/provider-cost`,

      // توجيه الحزم (مع دعم q اختياري)
      routingAll: (q?: string) => {
        const base = `${API_BASE_URL}/admin/integrations/routing/all`;
        const qq = q?.trim();
        return qq ? `${base}?q=${encodeURIComponent(qq)}` : base;
      },
      routingSet: `${API_BASE_URL}/admin/integrations/routing/set`,
      routingSetType: `${API_BASE_URL}/admin/integrations/routing/set-type`,
      routingSetCodeGroup: `${API_BASE_URL}/admin/integrations/routing/set-code-group`,
    },

    reports: {
      profits: `${API_BASE_URL}/admin/reports/profits`,
      users: `${API_BASE_URL}/admin/reports/users`,
      providers: `${API_BASE_URL}/admin/reports/providers`,
    },
  },

  /* ===== واجهة الإيداعات (المستخدم) ===== */
  payments: {
    methods: {
      active: `${API_BASE_URL}/payment-methods/active`,
    },
    deposits: {
      base: `${API_BASE_URL}/deposits`,    // GET قائمة/ POST إنشاء
      create: `${API_BASE_URL}/deposits`,  // POST /deposits
      mine: `${API_BASE_URL}/deposits/mine`,
    },
  },
};

/* =========================
   نسخة axios + Interceptors
   ========================= */

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// إرفاق التوكن
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

// التعامل مع 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
