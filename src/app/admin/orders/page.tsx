'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import api, { API_ROUTES, API_BASE_URL } from '@/utils/api';
import { useToast } from '@/context/ToastContext';

type OrderStatus = 'pending' | 'approved' | 'rejected';

/* ============== صور المنتجات ============== */
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function normalizeImageUrl(u?: string | null): string | null {
  if (!u) return null;
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;            // رابط مطلق (Cloudinary/خارجي)
  if (s.startsWith('/')) return `${API_ORIGIN}${s}`; // يبدأ بـ "/"
  return `${API_ORIGIN}/${s}`;                       // مسار نسبي
}

type ProductImagePayload = {
  imageUrl?: string;
  logoUrl?: string;
  iconUrl?: string;
  icon?: string;
  image?: string;
};

interface ProductMini { id?: string; name?: string; imageUrl?: string | null; }
interface ProductPackage { id: string; name: string; imageUrl?: string | null; productId?: string | null; }
interface Provider { id: string; name: string; }

interface Order {
  id: string;
  orderNo?: number | null;
  username?: string;
  userEmail?: string;

  product?: ProductMini & {
    image?: string | null;
    logoUrl?: string | null;
    iconUrl?: string | null;
    icon?: string | null;
  };
  package?: ProductPackage & {
    image?: string | null;
    logoUrl?: string | null;
    iconUrl?: string | null;
    icon?: string | null;
  };

  fxLocked?: boolean;
  approvedLocalDate?: string;

  costAmount?: number;
  manualCost?: number;
  sellPriceAmount?: number;
  price?: number;
  sellPriceCurrency?: string;
  currencyCode?: string;

  costTRY?: number;
  sellTRY?: number;
  profitTRY?: number;
  currencyTRY?: string;

  providerId?: string | null;
  providerName?: string | null;
  externalOrderId?: string | null;

  status: OrderStatus;
  userIdentifier?: string | null;

  createdAt: string;
  sentAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;

  productId?: string | null;
}

interface Filters {
  q: string;
  status: '' | OrderStatus;
  providerMode: '' | 'manual' | 'external';
  from: string;
  to: string;
}

/* ============== أيقونة الحالة (كرة) ============== */
function StatusDot({
  status,
  onClick,
}: {
  status: 'pending' | 'approved' | 'rejected';
  onClick?: () => void;
}) {
  const styleMap: Record<typeof status, React.CSSProperties> = {
    approved: {
      background:
        'radial-gradient(circle at 35% 35%, #ffffff 0 5%, #9BE7A6 26% 55%, #22C55E 56% 100%)',
      boxShadow: 'inset 0 0 0 1px #6AAC5B, 0 0 0 1px #6AAC5B',
    },
    rejected: {
      background:
        'radial-gradient(circle at 35% 35%, #ffffff 0 5%, #F7A6A6 26% 55%, #EF4444 56% 100%)',
      boxShadow: 'inset 0 0 0 1px #C53333, 0 0 0 1px #C53333',
    },
    pending: {
      background:
        'radial-gradient(circle at 35% 35%, #ffffff 0 5%, #EAFF72 26% 55%, #FFF700 56% 100%)',
      boxShadow: 'inset 0 0 0 1px #D6FF6F, 0 0 0 1px #C7CB00',
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center w-5 h-5 rounded-full focus:outline-none"
      title={status === 'approved' ? 'مقبول' : status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
      style={styleMap[status]}
    />
  );
}

/* ============== أدوات مساعدة ============== */
function money(n?: number, c?: string) {
  if (n === undefined || n === null) return '-';
  return `${Number(n).toFixed(2)} ${c ?? ''}`.trim();
}

function fmtHMS(totalMs: number) {
  const ms = Math.max(0, totalMs);
  const sec = Math.floor(ms / 1000);
  const s = sec % 60;
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  if (h) return `${h}س ${m}د ${s}ث`;
  if (m) return `${m}د ${s}ث`;
  return `${s}ث`;
}

/* ============== مودال محسّن ============== */
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="w-full h-[100vh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl bg-white rounded-none sm:rounded-xl shadow-lg flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title ?? 'التفاصيل'}</h3>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 rounded px-2 py-1"
              aria-label="اغلاق"
              title="إغلاق"
            >
              ✕
            </button>
          </div>
          <div className="p-4 overflow-y-auto">{children}</div>
          <div className="px-4 py-3 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== الصفحة ============== */
export default function AdminOrdersPage() {
  const { show } = useToast();

  // كاش شعارات المنتجات (مفتاحه: productId فقط)
  const [logos, setLogos] = useState<Record<string, string>>({});
  // تتبع الصور التي فشلت لمنع "رقص" الـ placeholder
  const [failed, setFailed] = useState<Set<string>>(new Set());

  // استخراج productId حصريًا (تجنّب استخدام package.id)
  const productIdOf = (o: Order): string | null => {
    return (
      (o.product?.id ?? null) ||
      (o.productId ?? null) ||
      (o.package?.productId ?? null)
    ) ?? null;
  };

  // يحاول استخراج رابط الصورة مباشرة من كائن الطلب،
  // أو من الكاش باستخدام productId فقط.
  const logoUrlOf = (o: Order): string | null => {
    // 1) صور مباشرة مرافقة للطلب (ندعم عدة أسماء حقول)
    const directRaw =
      (o as any).product?.imageUrl ||
      (o as any).product?.image ||
      (o as any).product?.logoUrl ||
      (o as any).product?.iconUrl ||
      (o as any).product?.icon ||
      (o as any).package?.imageUrl ||
      (o as any).package?.image ||
      (o as any).package?.logoUrl ||
      (o as any).package?.iconUrl ||
      (o as any).package?.icon ||
      null;

    if (directRaw) {
      const u = normalizeImageUrl(directRaw);
      if (u) return u;
    }

    // 2) من الكاش بالاعتماد على productId فقط
    const pid = productIdOf(o);
    if (pid && logos[pid]) {
      const u = normalizeImageUrl(logos[pid]);
      if (u) return u;
    }
    return null;
  };

  // جلب صور المنتجات المفقودة للكاش بالاعتماد على productId
  const primeProductLogos = async (ordersList: Order[]) => {
    const ids = new Set<string>();
    for (const o of ordersList) {
      const hasDirectImage =
        (o as any).product?.imageUrl ||
        (o as any).product?.image ||
        (o as any).package?.imageUrl ||
        (o as any).package?.image;

      const pid = productIdOf(o);
      if (pid && !hasDirectImage && !logos[pid]) ids.add(pid);
    }
    if (ids.size === 0) return;

    const entries: [string, string][] = [];

    await Promise.all(
      [...ids].map(async (pid) => {
        try {
          // نحاول أولاً عبر تعريف الـ routes
          let data: ProductImagePayload | null = null;
          try {
            const res = await api.get<ProductImagePayload>(API_ROUTES.products.byId(pid));
            data = res.data ?? null;
          } catch {
            // احتياطي مباشر لو كان API_ROUTES ناقص
            const fallbackUrl = `${API_BASE_URL.replace(/\/$/, '')}/products/${pid}`;
            const res2 = await api.get<ProductImagePayload>(fallbackUrl);
            data = res2.data ?? null;
          }

          const raw =
            data?.imageUrl ||
            data?.logoUrl ||
            data?.iconUrl ||
            data?.icon ||
            data?.image ||
            '';
          const url = normalizeImageUrl(raw);
          if (url) entries.push([pid, url]);
        } catch {
          // تجاهل الخطأ الفردي
        }
      })
    );

    if (entries.length) {
      setLogos((prev) => {
        const next = { ...prev };
        for (const [id, url] of entries) next[id] = url!;
        return next;
      });
    }
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [filters, setFilters] = useState<Filters>({
    q: '',
    status: '',
    providerMode: '',
    from: '',
    to: '',
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [providerId, setProviderId] = useState<string>('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const [, forceTick] = useState(0);
  const tickRef = useRef<number | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get<Order[]>(
        `${API_ROUTES.adminOrders?.base ?? API_ROUTES.orders.base}`
      );
      const list = res.data || [];
      setOrders(list);
      await primeProductLogos(list);
    } catch (e: any) {
      setErr('فشل في تحميل الطلبات');
      show(e?.response?.data?.message || 'فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const url = API_ROUTES.admin.integrations.base;
      const res = await api.get<Provider[]>(url);
      setProviders(res.data || []);
    } catch (e: any) {
      show(e?.response?.data?.message || 'تعذّر تحميل قائمة المزوّدين');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProviders();
  }, []);

  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      forceTick((x) => x + 1);
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const providerNameOf = (provId?: string | null, fallback?: string | null) => {
    if (fallback) return fallback;
    if (!provId) return null;
    const p = providers.find((x) => x.id === provId);
    return p?.name ?? null;
  };

  const searchHay = (o: Order) => {
    const parts = [
      o.id,
      o.username ?? '',
      o.userEmail ?? '',
      o.package?.name ?? '',
      o.externalOrderId ?? '',
      o.orderNo != null ? String(o.orderNo) : '',
    ];
    return parts.join(' ').toLowerCase();
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = filters.q.trim().toLowerCase();
      if (q && !searchHay(o).includes(q)) return false;

      if (filters.status && o.status !== filters.status) return false;

      const isExternal = !!(o.providerId && o.externalOrderId);
      if (filters.providerMode === 'manual' && isExternal) return false;
      if (filters.providerMode === 'external' && !isExternal) return false;

      const ct = new Date(o.createdAt).getTime();
      if (filters.from) {
        const f = new Date(filters.from + 'T00:00:00').getTime();
        if (ct < f) return false;
      }
      if (filters.to) {
        const t = new Date(filters.to + 'T23:59:59').getTime();
        if (ct > t) return false;
      }
      return true;
    });
  }, [orders, filters, providers]);

  const shownIds = filtered.map((o) => o.id);
  const allShownSelected =
    shownIds.length > 0 && shownIds.every((id) => selected.has(id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleSelectAll = (checked: boolean) =>
    setSelected((prev) => {
      const s = new Set(prev);
      shownIds.forEach((id) => (checked ? s.add(id) : s.delete(id)));
      return s;
    });

  const { bulkApproveUrl, bulkRejectUrl, bulkDispatchUrl, bulkManualUrl } = {
    bulkApproveUrl: API_ROUTES.adminOrders.bulkApprove,
    bulkRejectUrl: API_ROUTES.adminOrders.bulkReject,
    bulkDispatchUrl: API_ROUTES.adminOrders.bulkDispatch,
    bulkManualUrl: API_ROUTES.adminOrders.bulkManual,
  };

  const bulkApprove = async () => {
    if (selected.size === 0) {
      show('لم يتم تحديد أي طلبات');
      return;
    }
    try {
      await api.post(bulkApproveUrl, {
        ids: [...selected],
        note: note || undefined,
      });
      setOrders((prev) =>
        prev.map((o) => (selected.has(o.id) ? { ...o, status: 'approved' } : o))
      );
      const n = selected.size;
      setSelected(new Set());
      setNote('');
      show(`تمت الموافقة على ${n} طلب(ات) بنجاح`);
    } catch (e: any) {
      show(e?.response?.data?.message || 'تعذر الموافقة');
    }
  };

  const bulkReject = async () => {
    if (selected.size === 0) {
      show('لم يتم تحديد أي طلبات');
      return;
    }
    try {
      await api.post(bulkRejectUrl, {
        ids: [...selected],
        note: note || undefined,
      });
      setOrders((prev) =>
        prev.map((o) => (selected.has(o.id) ? { ...o, status: 'rejected' } : o))
      );
      const n = selected.size;
      setSelected(new Set());
      setNote('');
      show(`تم رفض ${n} طلب(ات)`);
    } catch (e: any) {
      show(e?.response?.data?.message || 'تعذر الرفض');
    }
  };

  const bulkDispatch = async () => {
    if (selected.size === 0) {
      show('لم يتم تحديد أي طلبات');
      return;
    }
    if (!providerId) {
      show('يرجى اختيار الجهة الخارجية أولاً');
      return;
    }
    try {
      const {
        data,
      }: {
        data: {
          results?: { success: boolean; message?: string }[];
          message?: string;
        };
      } = await api.post(bulkDispatchUrl, {
        ids: [...selected],
        providerId,
        note: note || undefined,
      });

      if (data?.results?.length) {
        const ok = data.results.filter((r: any) => r.success);
        const failed = data.results.filter((r: any) => !r.success);
        if (ok.length) show(`تم إرسال ${ok.length} طلب(ات) بنجاح`);
        if (failed.length) show(failed[0]?.message || 'فشل توجيه بعض الطلبات');
      } else if (data?.message) {
        show(data.message);
      } else {
        show('تم إرسال الطلبات إلى الجهة الخارجية');
      }

      setSelected(new Set());
      setNote('');
      setTimeout(fetchOrders, 700);
    } catch (e: any) {
      show(e?.response?.data?.message || 'تعذر الإرسال للجهة الخارجية');
    }
  };

  const bulkManual = async () => {
    if (selected.size === 0) {
      show('لم يتم تحديد أي طلبات');
      return;
    }
    try {
      await api.post(bulkManualUrl, {
        ids: [...selected],
        note: note || undefined,
      });
      setOrders((prev) =>
        prev.map((o) =>
          selected.has(o.id)
            ? {
                ...o,
                providerId: null,
                providerName: null,
                externalOrderId: null,
              }
            : o
        )
      );
      const n = selected.size;
      setSelected(new Set());
      setNote('');
      show(`تم تحويل ${n} طلب(ات) إلى Manual`);
      } catch (e: any) {
        show(e?.response?.data?.message || 'تعذر تحويل الطلبات إلى Manual');
      }
  };

  const renderDuration = (o: Order) => {
    const start =
      (o.sentAt ? new Date(o.sentAt).getTime() : null) ??
      new Date(o.createdAt).getTime();

    if (o.durationMs != null) {
      return fmtHMS(Math.max(0, Number(o.durationMs)));
    }
    if (o.completedAt) {
      const end = new Date(o.completedAt).getTime();
      return fmtHMS(Math.max(0, end - start));
    }
    if (o.status === 'pending') {
      return fmtHMS(Math.max(0, Date.now() - start));
    }
    return fmtHMS(0);
  };

  const displayOrderNumber = (o: Order) => {
    if (o.externalOrderId && /^\d+$/.test(o.externalOrderId))
      return o.externalOrderId;
    if (o.orderNo != null) return String(o.orderNo);
    return o.id.slice(-6).toUpperCase();
  };

  const openDetails = (o: Order) => {
    setDetailOrder(o);
    setDetailOpen(true);
  };

  if (loading) return <div className="p-4">جاري التحميل…</div>;
  if (err) return <div className="p-4 text-red-500">{err}</div>;

  return (
    <div className="text-gray-950 bg-white p-4">
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <h1 className="text-xl font-bold mb-4">إدارة الطلبات</h1>

      {/* فلاتر */}
      <div className="flex flex-wrap items-end gap-1 p-1 rounded-lg border mb-3 bg-[var(--bg-main)]">
        <div className="flex flex-col">
          <label className="text-xs mb-1">بحث عام</label>
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="اكتب رقم/مستخدم/باقة…"
            className="px-2 py-1 rounded border"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1">الحالة</label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value as any }))
            }
            className="px-2 py-1 rounded border"
          >
            <option value="">الكل</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1">طريقة التنفيذ</label>
          <select
            value={filters.providerMode}
            onChange={(e) =>
              setFilters((f) => ({ ...f, providerMode: e.target.value as any }))
            }
            className="px-2 py-1 rounded border "
          >
            <option value="">الكل</option>
            <option value="manual">يدوي (Manual)</option>
            <option value="external">خارجي (API)</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1">من تاريخ</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="px-2 py-1 rounded border "
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1">إلى تاريخ</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="px-2 py-1 rounded border "
          />
        </div>
        <button
          onClick={fetchOrders}
          className="px-2 py-2 text-sm rounded bg-teal-700 text-white hover:opacity-90"
        >
          تحديث
        </button>
        <button
          onClick={() => {
            setFilters({
              q: '',
              status: '',
              providerMode: '',
              from: '',
              to: '',
            });
            (typeof window !== 'undefined') &&
              (document.activeElement as HTMLElement)?.blur?.();
            show('تمت إعادة التصفية');
          }}
          className="px-2 py-2 text-sm rounded bg-red-700 text-white hover:opacity-90"
        >
          مسح الفلتر
        </button>
      </div>

      {/* شريط الإجراءات الجماعية */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 mb-3 rounded-lg border bg-[var(--bg-main)] p-2 flex flex-wrap items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظة (اختياري)"
            className="px-2 py-1 rounded border border-gray-400 w-64"
          />

          <div className="flex items-center gap-2">
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="px-2 py-1 rounded border border-gray-400"
              title="اختر الجهة الخارجية"
            >
              <option value="">حدد الجهة الخارجية…</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              onClick={bulkDispatch}
              disabled={!providerId}
              className="px-3 py-2 text-sm rounded bg-yellow-700 text-white hover:opacity-90 disabled:opacity-50"
              title="إرسال الطلبات المحددة للجهة الخارجية"
            >
              إرسال
            </button>
          </div>

          <button
            onClick={bulkManual}
            className="px-3 py-2 text-sm rounded bg-slate-300 hover:opacity-90"
            title="فصل الطلبات المحددة عن الجهة الخارجية (Manual)"
          >
            تحويل إلى يدوي
          </button>

          <button
            onClick={bulkApprove}
            className="px-3 py-2 text-sm rounded bg-green-600 text-white hover:opacity-90"
            title="الموافقة على الطلبات المحددة"
          >
            موافقة
          </button>

          <button
            onClick={bulkReject}
            className="px-3 py-2 text-sm rounded bg-red-600 text-white hover:opacity-90"
            title="رفض الطلبات المحددة"
          >
            رفض
          </button>

          <span className="text-xs opacity-80">({selected.size} محدد)</span>
        </div>
      )}

      {/* الجدول */}
      <div className="overflow-auto rounded-lg border border-gray-400">
        <table className="bg-[#EAFFA0] min-w-[1080px] w-full border-separate border-spacing-y-1 border-spacing-x-0">
          <thead>
            <tr className="bg-[var(--tableheaders)] sticky top-0 z-10">
              <th className="text-center border-b border border-gray-400">
                <input
                  type="checkbox"
                  checked={allShownSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>

              <th className="text-sm text-center border-b border border-gray-400">
                لوغو
              </th>

              <th className="p-2 text-center border-b border border-gray-400">
                رقم الطلب
              </th>
              <th className="p-2 text-center border-b border border-gray-400">
                المستخدم
              </th>
              <th className="p-2 text-center border-b border border-gray-400">
                الباقة
              </th>
              <th className="p-2 text-center border-b border border-gray-400">
                رقم اللاعب
              </th>
              <th className="p-2 text-center border-b border border-gray-400">
                التكلفة
              </th>
              <th className="p-2 text-center border-b border border-gray-400">
                السعر
              </th>
              <th className="p-2 text-center border-b border border-gray-400">
                الربح
              </th>
              <th className="p-2 text-center border-b border border-gray-400">
                الحالة
              </th>
              <th className="p-2 text-center border-b border border-gray-400">
                API
              </th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {filtered.map((o) => {
              const isExternal = !!(o.providerId && o.externalOrderId);

              const candidate = logoUrlOf(o);
              const finalLogoSrc =
                !candidate || failed.has(o.id)
                  ? '/products/placeholder.png'
                  : candidate;

              return (
                <tr key={o.id} className="group">
                  <td className="bg-white p-1 text-center border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleSelect(o.id)}
                    />
                  </td>

                  {/* الشعار — دائمًا نرسم <img> مع onError إلى placeholder */}
                  <td className="text-center bg-white text-center border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    <img
                      src={finalLogoSrc}
                      alt={o.product?.name || o.package?.name || 'logo'}
                      className="inline-block w-12 h-10 rounded object-cover"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailed((prev) => {
                          if (prev.has(o.id)) return prev;
                          const next = new Set(prev);
                          next.add(o.id);
                          return next;
                        })
                      }
                    />
                  </td>

                  <td className="text-center bg-white p-1 font-medium border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {displayOrderNumber(o)}
                  </td>

                  <td className="text-center bg-white p-1 border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {o.username || o.userEmail || '-'}
                  </td>

                  <td className="text-center bg-white p-1 border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {o.package?.name ?? '-'}
                  </td>

                  <td className="text-center bg-white p-1 border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {o.userIdentifier ?? '-'}
                  </td>

                  <td className="text-center bg-white p-1 text-center border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    <span className="text-blue-600">
                      {money(o.costTRY, o.currencyTRY)}
                    </span>
                  </td>

                  <td className="text-center bg-white p-1 text-center border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {money(o.sellTRY, o.currencyTRY)}
                  </td>

                  <td
                    className={`text-center bg-white p-1 text-center border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e ${
                      o.profitTRY != null
                        ? o.profitTRY > 0
                          ? 'text-green-700'
                          : o.profitTRY < 0
                          ? 'text-red-500'
                          : ''
                        : ''
                    }`}
                  >
                    {o.profitTRY != null ? money(o.profitTRY, o.currencyTRY) : '-'}
                  </td>

                  <td className="bg-white p-2 border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    <div className="flex items-center justify-center">
                      <StatusDot status={o.status} onClick={() => openDetails(o)} />
                    </div>
                  </td>

                  <td className="text-center p-1 border-y border-l border-gray-400 first:rounded-s-md last:rounded-e-md first:border-s last:border-e bg-transparent">
                    {isExternal ? (
                      <span className="text-black">
                        {providerNameOf(o.providerId, o.providerName) ?? 'External'}
                      </span>
                    ) : (
                      <span className="text-red-600">Manual</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  className="bg-white p-6 text-center text-gray-400 border border-gray-400 rounded-md"
                  colSpan={11}
                >
                  لا توجد طلبات مطابقة للفلاتر الحالية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* مودال تفاصيل الطلب */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={
          detailOrder
            ? `تفاصيل الطلب #${displayOrderNumber(detailOrder)}`
            : 'تفاصيل الطلب'
        }
      >
        {detailOrder && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <div>
                <div className="text-gray-500">المعرف</div>
                <div className="font-mono break-all">{detailOrder.id}</div>
              </div>
              <div>
                <div className="text-gray-500">رقم الطلب</div>
                <div className="font-medium">
                  {displayOrderNumber(detailOrder)}
                </div>
              </div>

              <div>
                <div className="text-gray-500">المستخدم</div>
                <div>
                  {detailOrder.username || detailOrder.userEmail || '-'}
                </div>
              </div>
              <div>
                <div className="text-gray-500">الباقة</div>
                <div>{detailOrder.package?.name ?? '-'}</div>
              </div>

              <div>
                <div className="text-gray-500">رقم اللاعب</div>
                <div>{detailOrder.userIdentifier ?? '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">الحالة</div>
                <div className="capitalize">
                  {detailOrder.status === 'approved'
                    ? 'مقبول'
                    : detailOrder.status === 'rejected'
                    ? 'مرفوض'
                    : 'قيد المراجعة'}
                </div>
              </div>

              <div>
                <div className="text-gray-500">التكلفة (TRY)</div>
                <div>{money(detailOrder.costTRY, detailOrder.currencyTRY)}</div>
              </div>
              <div>
                <div className="text-gray-500">السعر (TRY)</div>
                <div>{money(detailOrder.sellTRY, detailOrder.currencyTRY)}</div>
              </div>

              <div>
                <div className="text-gray-500">الربح (TRY)</div>
                <div
                  className={
                    detailOrder.profitTRY != null
                      ? detailOrder.profitTRY > 0
                        ? 'text-green-700'
                        : detailOrder.profitTRY < 0
                        ? 'text-red-500'
                        : ''
                      : ''
                  }
                >
                  {detailOrder.profitTRY != null
                    ? money(detailOrder.profitTRY, detailOrder.currencyTRY)
                    : '-'}
                </div>
              </div>

              <div>
                <div className="text-gray-500">التنفيذ</div>
                <div>
                  {detailOrder.providerId && detailOrder.externalOrderId
                    ? `External: ${
                        providerNameOf(
                          detailOrder.providerId,
                          detailOrder.providerName
                        ) ?? ''
                      }`
                    : 'Manual'}
                </div>
              </div>

              <div>
                <div className="text-gray-500">تم الإرسال</div>
                <div>
                  {detailOrder.sentAt
                    ? new Date(detailOrder.sentAt).toLocaleString('en-GB')
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-gray-500">اكتمل</div>
                <div>
                  {detailOrder.completedAt
                    ? new Date(detailOrder.completedAt).toLocaleString('en-GB')
                    : '-'}
                </div>
              </div>

              <div>
                <div className="text-gray-500">المدة</div>
                <div>{renderDuration(detailOrder)}</div>
              </div>

              <div>
                <div className="text-gray-500">تاريخ الإنشاء</div>
                <div>
                  {new Date(detailOrder.createdAt).toLocaleString('en-GB')}
                </div>
              </div>
            </div>

            {detailOrder.status === 'approved' && detailOrder.fxLocked && (
              <div className="text-xs text-emerald-700">
                قيمة الصرف مجمّدة
                {detailOrder.approvedLocalDate
                  ? ` منذ ${detailOrder.approvedLocalDate}`
                  : ''}
                .
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
