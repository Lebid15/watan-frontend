'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import api, { API_ROUTES, API_BASE_URL } from '@/utils/api';
import { useToast } from '@/context/ToastContext';

type OrderStatus = 'pending' | 'approved' | 'rejected';
type FilterMethod = '' | 'manual' | string;

/* ============== صور موحّدة (من منتجات) ============== */
const apiHost = API_ROUTES.products.base.replace(/\/api\/products\/?$/, '');

function getOrderImageSrc(o: any): string {
  const raw =
    pickImageField(o.package) ??
    pickImageField(o.product);
  return buildImageSrc(raw);  
}

function pickImageField(p?: any): string | null {
  if (!p) return null;
  return p.image ?? p.imageUrl ?? p.logoUrl ?? p.iconUrl ?? p.icon ?? null;
}

function buildImageSrc(raw?: string | null): string {
  if (!raw) return '/images/placeholder.png';
  const s = String(raw).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${apiHost}${s}`;
  return `${apiHost}/${s}`;
}

function getImageSrc(p?: any): string {
  return buildImageSrc(pickImageField(p));
}


type OrdersPageResponse = {
  items: any[];
  pageInfo: { nextCursor: string | null; hasMore: boolean };
  meta?: any;
};

/* ============== صور المنتجات ============== */
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="40">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="#9ca3af">no img</text>
    </svg>`
  );

function normalizeImageUrl(u?: string | null): string | null {
  if (!u) return null;
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
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

  // قيم السيرفر الأساسية (قد لا نستخدمها مباشرة في الجدول)
  costAmount?: number;
  manualCost?: number; 
  quantity?: number;
  sellPriceAmount?: number;
  price?: number;
  sellPriceCurrency?: string;
  costCurrency?: string;
  currencyCode?: string;

  // ما يعرضه الجدول
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
  method: FilterMethod; // '' | 'manual' | providerId
  from: string;
  to: string;
}

/* ============== أيقونة الحالة ============== */
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

/* ============== مودال ============== */
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
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="w-full h-[100vh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl bg-bg-surface text-text-primary border border-border rounded-none sm:rounded-xl shadow-lg flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title ?? 'التفاصيل'}</h3>
            <button onClick={onClose} className="text-text-secondary hover:opacity-80 rounded px-2 py-1" aria-label="اغلاق" title="إغلاق">✕</button>
          </div>
          <div className="p-4 overflow-y-auto">{children}</div>
          <div className="px-4 py-3 border-t border-border flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded bg-bg-surface-alt hover:opacity-90 border border-border">إغلاق</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============== الصفحة ============== */
export default function AdminOrdersPage() {
  const { show } = useToast();
  const [logos, setLogos] = useState<Record<string, string>>({});

  const productIdOf = (o: Order): string | null => {
    return (
      (o.product?.id ?? null) ||
      (o.productId ?? null) ||
      (o.package?.productId ?? null)
    ) ?? null;
  };

  const logoUrlOf = (o: Order): string | null => {
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

    const pid = productIdOf(o);
    if (pid && logos[pid]) {
      const u = normalizeImageUrl(logos[pid]);
      if (u) return u;
    }
    return null;
  };

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
          let data: ProductImagePayload | null = null;
          try {
            const res = await api.get<ProductImagePayload>(API_ROUTES.products.byId(pid));
            data = res.data ?? null;
          } catch {
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
          // تجاهل
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
    method: '',
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

  // 🔹 مؤشّر الباجينيشن
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // 🔹 تجهيز باراميترات الاستعلام
  const buildQueryParams = () => {
    const p: Record<string, any> = {};
    if (filters.q?.trim()) p.q = filters.q.trim();
    if (filters.status)     p.status = filters.status;
    if (filters.method)     p.method = filters.method;
    if (filters.from)       p.from = filters.from;
    if (filters.to)         p.to   = filters.to;
    p.limit = 25;
    return p;
  };

  // 🔧 يحوّل أي عنصر قادم من السيرفر إلى شكل Order الذي تعتمد عليه الواجهة
  function normalizeServerOrder(x: any): Order {
    // أداة صغيرة: ترجع أول قيمة موجودة من قائمة مفاتيح
    const firstOf = <T = any>(o: any, ...keys: string[]): T | undefined => {
      if (!o) return undefined;
      for (const k of keys) {
        const v = o?.[k];
        if (v !== undefined && v !== null) return v as T;
      }
      return undefined;
    };

    const userObj = x.user || x.account || null;
    const productObj = x.product || x.prod || null;
    const packageObj = x.package || x.pkg || null;

    // قيم TRY لو أرسلها الباك
    const costTRY   = firstOf<number>(x, 'costTRY', 'cost_try');
    const sellTRY   = firstOf<number>(x, 'sellTRY', 'sell_try');
    const profitTRY = firstOf<number>(x, 'profitTRY', 'profit_try');
    const currencyTRY =
      firstOf<string>(x, 'currencyTRY', 'currency_try') ??
      (costTRY != null || sellTRY != null || profitTRY != null ? 'TRY' : undefined);

    // سعر المبيع للمستخدم (قد يأتي من الباك)
    const sellPriceAmount = firstOf<number>(x, 'sellPriceAmount', 'sell_price_amount', 'price');
    const sellPriceCurrency = firstOf<string>(
      x,
      'sellPriceCurrency',
      'sell_price_currency',
      'currencyCode',
      'currency_code'
    );

    // معرّف وتواريخ
    const id = String(firstOf(x, 'id', 'orderId', 'order_id'));
    const createdRaw = firstOf<any>(x, 'createdAt', 'created_at');
    const createdAt =
      typeof createdRaw === 'string'
        ? createdRaw
        : createdRaw instanceof Date
        ? createdRaw.toISOString()
        : new Date().toISOString();

    // الحالة
    const rawStatus = (firstOf<string>(x, 'status', 'orderStatus') || '').toLowerCase();
    const status: OrderStatus =
      rawStatus === 'approved' ? 'approved' :
      rawStatus === 'rejected' ? 'rejected' :
      'pending';

    // المنتج
    const product =
      productObj
        ? {
            id: firstOf<string>(productObj, 'id') ?? undefined,
            name: firstOf<string>(productObj, 'name') ?? undefined,
            imageUrl:
              firstOf<string>(productObj, 'imageUrl', 'image', 'logoUrl', 'iconUrl', 'icon') ??
              null,
          }
        : undefined;

    // الباقة (لا ننشئ إلا إذا فيها id)
    let pkg: Order['package'] = undefined;
    if (packageObj) {
      const pkgId = firstOf<string>(packageObj, 'id');
      if (pkgId) {
        pkg = {
          id: pkgId,
          name: firstOf<string>(packageObj, 'name') ?? '',
          imageUrl:
            firstOf<string>(packageObj, 'imageUrl', 'image', 'logoUrl', 'iconUrl', 'icon') ??
            null,
          productId: firstOf<string>(packageObj, 'productId') ?? null,
        };
      }
    }

    // حقول زمنية أخرى
    const sentRaw = firstOf<any>(x, 'sentAt');
    const sentAt =
      sentRaw == null ? null :
      typeof sentRaw === 'string' ? sentRaw :
      sentRaw instanceof Date ? sentRaw.toISOString() : null;

    const completedRaw = firstOf<any>(x, 'completedAt');
    const completedAt =
      completedRaw == null ? null :
      typeof completedRaw === 'string' ? completedRaw :
      completedRaw instanceof Date ? completedRaw.toISOString() : null;

    const durationMs = firstOf<number>(x, 'durationMs') ?? null;

    // المستخدم
    const username: string | undefined =
      firstOf<string>(x, 'username') ?? firstOf<string>(userObj, 'username', 'name') ?? undefined;
    const userEmail: string | undefined =
      firstOf<string>(x, 'userEmail') ?? firstOf<string>(userObj, 'email') ?? undefined;

    return {
      id,
      orderNo: firstOf<number>(x, 'orderNo', 'order_no') ?? null,

      username,
      userEmail,

      product,
      package: pkg,

      fxLocked: !!firstOf<boolean>(x, 'fxLocked'),
      approvedLocalDate: firstOf<string>(x, 'approvedLocalDate') ?? undefined,

      costAmount:
        firstOf<number>(x, 'costAmount') != null ? Number(firstOf<number>(x, 'costAmount')) : undefined,
      manualCost:
        firstOf<number>(x, 'manualCost') != null ? Number(firstOf<number>(x, 'manualCost')) : undefined,

      sellPriceAmount: sellPriceAmount != null ? Number(sellPriceAmount) : undefined,
      price: sellPriceAmount != null ? Number(sellPriceAmount) : undefined,
      sellPriceCurrency: sellPriceCurrency ?? undefined,
      currencyCode: sellPriceCurrency ?? undefined,

      costTRY:   costTRY   != null ? Number(costTRY)   : undefined,
      sellTRY:   sellTRY   != null ? Number(sellTRY)   : undefined,
      profitTRY: profitTRY != null ? Number(profitTRY) : undefined,
      currencyTRY: currencyTRY ?? undefined,

      providerId: firstOf<string>(x, 'providerId') ?? null,
      providerName: firstOf<string>(x, 'providerName') ?? null,
      externalOrderId: firstOf<string>(x, 'externalOrderId') ?? null,

      status,
      userIdentifier: firstOf<string>(x, 'userIdentifier') ?? null,

      createdAt,
      sentAt,
      completedAt,
      durationMs,

      productId: firstOf<string>(x, 'productId') ?? undefined,
      quantity: firstOf<number>(x, 'quantity') ?? undefined,
    };
  }

  // 🔹 الصفحة الأولى (مع فلاتر)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErr('');
      setSelected(new Set());

      const url = API_ROUTES.adminOrders.base;
      const params = buildQueryParams();

      const { data } = await api.get<OrdersPageResponse>(url, { params });
      const rawList = Array.isArray(data?.items) ? data.items : [];
      const list: Order[] = rawList.map(normalizeServerOrder);

      setOrders(list);
      setNextCursor(data?.pageInfo?.nextCursor ?? null);

      if (list.length) await primeProductLogos(list);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'فشل في تحميل الطلبات');
      setOrders([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 تحميل إضافي (Load more)
  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      setLoadingMore(true);
      setErr('');

      const url = API_ROUTES.adminOrders.base;
      const params = { ...buildQueryParams(), cursor: nextCursor };

      const { data } = await api.get<OrdersPageResponse>(url, { params });
      const rawList = Array.isArray(data?.items) ? data.items : [];
      const more: Order[] = rawList.map(normalizeServerOrder);

      setOrders(prev => [...prev, ...more]);
      setNextCursor(data?.pageInfo?.nextCursor ?? null);

      if (more.length) await primeProductLogos(more);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'تعذّر تحميل المزيد');
    } finally {
      setLoadingMore(false);
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

  // 🔹 المزوّدون مرة واحدة
  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 تحميل الطلبات عند تغيّر الفلاتر
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.status, filters.method, filters.from, filters.to]);

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

  // 🔹 الآن لا نفلتر محليًا (السيرفر يفلتر)
  const filtered = orders;

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

  const { show: toast } = useToast();

  const bulkApprove = async () => {
    if (selected.size === 0) return toast('لم يتم تحديد أي طلبات');
    try {
      await api.post(bulkApproveUrl, { ids: [...selected], note: note || undefined });
      setOrders((prev) => prev.map((o) => (selected.has(o.id) ? { ...o, status: 'approved' } : o)));
      const n = selected.size;
      setSelected(new Set());
      setNote('');
      toast(`تمت الموافقة على ${n} طلب(ات) بنجاح`);
    } catch (e: any) {
      toast(e?.response?.data?.message || 'تعذر الموافقة');
    }
  };

  const bulkReject = async () => {
    if (selected.size === 0) return toast('لم يتم تحديد أي طلبات');
    try {
      await api.post(bulkRejectUrl, { ids: [...selected], note: note || undefined });
      setOrders((prev) => prev.map((o) => (selected.has(o.id) ? { ...o, status: 'rejected' } : o)));
      const n = selected.size;
      setSelected(new Set());
      setNote('');
      toast(`تم رفض ${n} طلب(ات)`);
    } catch (e: any) {
      toast(e?.response?.data?.message || 'تعذر الرفض');
    }
  };

  const bulkDispatch = async () => {
    if (selected.size === 0) return toast('لم يتم تحديد أي طلبات');
    if (!providerId) return toast('يرجى اختيار الجهة الخارجية أولاً');
    try {
      const { data }: { data: { results?: { success: boolean; message?: string }[]; message?: string; } } =
        await api.post(bulkDispatchUrl, { ids: [...selected], providerId, note: note || undefined });

      if (data?.results?.length) {
        const ok = data.results.filter((r: any) => r.success);
        const failed = data.results.filter((r: any) => !r.success);
        if (ok.length) toast(`تم إرسال ${ok.length} طلب(ات) بنجاح`);
        if (failed.length) toast(failed[0]?.message || 'فشل توجيه بعض الطلبات');
      } else if (data?.message) {
        toast(data.message);
      } else {
        toast('تم إرسال الطلبات إلى الجهة الخارجية');
      }

      setSelected(new Set());
      setNote('');
      setTimeout(fetchOrders, 700);
    } catch (e: any) {
      toast(e?.response?.data?.message || 'تعذر الإرسال للجهة الخارجية');
    }
  };

  const bulkManual = async () => {
    if (selected.size === 0) return toast('لم يتم تحديد أي طلبات');
    try {
      await api.post(bulkManualUrl, { ids: [...selected], note: note || undefined });
      setOrders((prev) =>
        prev.map((o) =>
          selected.has(o.id)
            ? { ...o, providerId: null, providerName: null, externalOrderId: null }
            : o
        )
      );
      const n = selected.size;
      setSelected(new Set());
      setNote('');
      toast(`تم تحويل ${n} طلب(ات) إلى Manual`);
    } catch (e: any) {
      toast(e?.response?.data?.message || 'تعذر تحويل الطلبات إلى Manual');
    }
  };

  const renderDuration = (o: Order) => {
    const start =
      (o.sentAt ? new Date(o.sentAt).getTime() : null) ??
      new Date(o.createdAt).getTime();

    if (o.durationMs != null) return fmtHMS(Math.max(0, Number(o.durationMs)));
    if (o.completedAt) {
      const end = new Date(o.completedAt).getTime();
      return fmtHMS(Math.max(0, end - start));
    }
    if (o.status === 'pending') return fmtHMS(Math.max(0, Date.now() - start));
    return fmtHMS(0);
  };

  const displayOrderNumber = (o: Order) => {
    if (o.orderNo != null) return String(o.orderNo);
    return o.id.slice(-6).toUpperCase();
  };

  const openDetails = (o: Order) => {
    setDetailOrder(o);
    setDetailOpen(true);
  };

  if (loading) return <div className="p-4 text-text-primary">جاري التحميل…</div>;
  if (err) return <div className="p-4 text-danger">{err}</div>;

  return (
    <div className="text-text-primary bg-bg-base p-4 min-h-screen">
      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <h1 className="font-bold mb-4">إدارة الطلبات</h1>

      {/* فلاتر */}
      <div className="flex flex-wrap items-end gap-2 p-2 rounded-lg border border-border mb-3 bg-bg-surface">
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-text-secondary">بحث عام</label>
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="اكتب رقم/مستخدم/باقة…"
            className="px-2 py-1 rounded border border-border bg-bg-input"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs mb-1 text-text-secondary">الحالة</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
            className="px-2 py-1 rounded border border-border bg-bg-input"
          >
            <option value="">الكل</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs mb-1 text-text-secondary">طريقة التنفيذ</label>
          <select
            value={filters.method}
            onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value as any }))}
            className="px-2 py-1 rounded border border-border bg-bg-input"
          >
            <option value="">الكل</option>
            <option value="manual">يدوي (Manual)</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs mb-1 text-text-secondary">من تاريخ</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="px-2 py-1 rounded border border-border bg-bg-input"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs mb-1 text-text-secondary">إلى تاريخ</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="px-2 py-1 rounded border border-border bg-bg-input"
          />
        </div>

        <button onClick={fetchOrders} className="px-3 py-2 text-sm rounded bg-primary text-primary-contrast hover:bg-primary-hover">
          تحديث
        </button>

        <button
          onClick={() => {
            setFilters({ q: '', status: '', method: '', from: '', to: '' });
            (typeof window !== 'undefined') && (document.activeElement as HTMLElement)?.blur?.();
            show('تمت إعادة التصفية');
          }}
          className="px-3 py-2 text-sm rounded bg-danger text-text-inverse hover:brightness-110"
        >
          مسح الفلتر
        </button>
      </div>

      {/* شريط الإجراءات الجماعية */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-20 mb-3 rounded-lg border border-border bg-bg-surface p-2 flex flex-wrap items-center gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظة (اختياري)"
            className="px-2 py-1 rounded border border-border bg-bg-input w-64"
          />

          <div className="flex items-center gap-2">
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="px-2 py-1 rounded border border-border bg-bg-input"
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
              className="px-3 py-2 text-sm rounded bg-warning text-text-inverse hover:brightness-110 disabled:opacity-50"
              title="إرسال الطلبات المحددة للجهة الخارجية"
            >
              إرسال
            </button>
          </div>

          <button
            onClick={bulkManual}
            className="px-3 py-2 text-sm rounded bg-bg-surface-alt border border-border hover:opacity-90"
            title="فصل الطلبات المحددة عن الجهة الخارجية (Manual)"
          >
            تحويل إلى يدوي
          </button>

          <button
            onClick={bulkApprove}
            className="px-3 py-2 text-sm rounded bg-success text-text-inverse hover:brightness-110"
            title="الموافقة على الطلبات المحددة"
          >
            موافقة
          </button>

          <button
            onClick={bulkReject}
            className="px-3 py-2 text-sm rounded bg-danger text-text-inverse hover:brightness-110"
            title="رفض الطلبات المحددة"
          >
            رفض
          </button>

          <span className="text-xs opacity-80">({selected.size} محدد)</span>
        </div>
      )}

      {/* الجدول */}
      <div className="overflow-auto rounded-lg border border-border">
        <table className="min-w-[1080px] w-full border-separate border-spacing-y-1 border-spacing-x-0 bg-bg-surface">
          <thead>
            <tr className="bg-bg-surface-alt sticky top-0 z-10">
              <th className="text-center border-b border border-border">
                <input type="checkbox" checked={allShownSelected} onChange={(e) => toggleSelectAll(e.target.checked)} />
              </th>

              <th className="text-sm text-center border-b border border-border">لوغو</th>

              <th className="p-2 text-center border-b border border-border">رقم الطلب</th>
              <th className="p-2 text-center border-b border border-border">المستخدم</th>
              <th className="p-2 text-center border-b border border-border">الباقة</th>
              <th className="p-2 text-center border-b border border-border">رقم اللاعب</th>
              <th className="p-2 text-center border-b border border-border">التكلفة</th>
              <th className="p-2 text-center border-b border border-border">السعر</th>
              <th className="p-2 text-center border-b border border-border">الربح</th>
              <th className="p-2 text-center border-b border border-border">الحالة</th>
              <th className="p-2 text-center border-b border border-border">API</th>
            </tr>
          </thead>
          <tbody className="bg-bg-surface">
            {filtered.map((o) => {
              const isExternal = !!(o.providerId && o.externalOrderId);
              const providerLabel = isExternal
                ? (providerNameOf(o.providerId, o.providerName) ?? '(مزود محذوف)')
                : 'Manual';

              // 👈 احسب رابط الصورة: جرّب الباقة ثم المنتج
              const logoSrc = buildImageSrc(
                (pickImageField(o.package) ?? pickImageField(o.product)) || null
              );

              return (
                <tr key={o.id} className="group">
                  <td className="bg-bg-surface p-1 text-center border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => toggleSelect(o.id)}
                    />
                  </td>

                  <td className="text-center bg-bg-surface border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    <img
                      src={logoSrc}
                      alt={o.product?.name || o.package?.name || 'logo'}
                      className="inline-block w-12 h-10 rounded object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).onerror = null;
                        e.currentTarget.src = '/images/placeholder.png';
                      }}
                    />
                  </td>

                  <td className="text-center bg-bg-surface p-1 font-medium border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {displayOrderNumber(o)}
                  </td>

                  <td className="text-center bg-bg-surface p-1 border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {o.username || o.userEmail || '-'}
                  </td>

                  <td className="text-center bg-bg-surface p-1 border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {o.package?.name ?? '-'}
                  </td>

                  <td className="text-center bg-bg-surface p-1 border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {o.userIdentifier ?? '-'}
                  </td>

                  <td className="text-center bg-bg-surface p-1 border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    <span className="text-accent">
                      {money(o.costTRY ?? o.costAmount, o.currencyTRY ?? o.costCurrency)}
                    </span>
                  </td>

                  <td className="text-center bg-bg-surface p-1 border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    {money(
                      o.sellTRY ?? o.sellPriceAmount ?? o.price,
                      o.currencyTRY ?? o.sellPriceCurrency
                    )}
                  </td>

                  <td
                    className={[
                      'text-center bg-bg-surface p-1 border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e',
                      (o.profitTRY ??
                        ((o.sellTRY ?? o.sellPriceAmount ?? o.price) as number) -
                          (o.costTRY ?? o.costAmount ?? 0)) > 0
                        ? 'text-success'
                        : (o.profitTRY ??
                            ((o.sellTRY ?? o.sellPriceAmount ?? o.price) as number) -
                              (o.costTRY ?? o.costAmount ?? 0)) < 0
                        ? 'text-danger'
                        : '',
                    ].join(' ')}
                  >
                    {money(
                      o.profitTRY ??
                        (Number(o.sellTRY ?? o.sellPriceAmount ?? o.price) || 0) -
                          (Number(o.costTRY ?? o.costAmount) || 0),
                      o.currencyTRY ?? (o.sellPriceCurrency || o.costCurrency)
                    )}
                  </td>

                  <td className="bg-bg-surface p-2 border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e">
                    <div className="flex items-center justify-center">
                      <StatusDot status={o.status} onClick={() => openDetails(o)} />
                    </div>
                  </td>

                  <td className="text-center p-1 border-y border-l border-border first:rounded-s-md last:rounded-e-md first:border-s last:border-e bg-transparent">
                    {isExternal ? (
                      <span>{providerLabel}</span>
                    ) : (
                      <span className="text-danger">{providerLabel}</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  className="bg-bg-surface p-6 text-center text-text-secondary border border-border rounded-md"
                  colSpan={11}
                >
                  لا توجد طلبات مطابقة للفلاتر الحالية.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* زر تحميل المزيد */}
      {nextCursor && (
        <div className="flex justify-center mt-3">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 rounded bg-bg-surface-alt border border-border hover:opacity-90 disabled:opacity-50"
          >
            {loadingMore ? 'جاري التحميل…' : 'تحميل المزيد'}
          </button>
        </div>
      )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-text-secondary">المعرف</div>
                <div className="font-mono break-all">{detailOrder.id}</div>
              </div>
              <div>
                <div className="text-text-secondary">رقم الطلب</div>
                <div className="font-medium">{displayOrderNumber(detailOrder)}</div>
              </div>

              <div>
                <div className="text-text-secondary">المستخدم</div>
                <div>{detailOrder.username || detailOrder.userEmail || '-'}</div>
              </div>
              <div>
                <div className="text-text-secondary">الباقة</div>
                <div>{detailOrder.package?.name ?? '-'}</div>
              </div>

              <div>
                <div className="text-text-secondary">رقم اللاعب</div>
                <div>{detailOrder.userIdentifier ?? '-'}</div>
              </div>
              <div>
                <div className="text-text-secondary">الحالة</div>
                <div className="capitalize">
                  {detailOrder.status === 'approved'
                    ? 'مقبول'
                    : detailOrder.status === 'rejected'
                    ? 'مرفوض'
                    : 'قيد المراجعة'}
                </div>
              </div>

              <div>
                <div className="text-text-secondary">التكلفة</div>
                <div>{money(detailOrder.costTRY ?? detailOrder.costAmount, detailOrder.currencyTRY ?? detailOrder.costCurrency)}</div>
              </div>
              <div>
                <div className="text-text-secondary">السعر</div>
                <div>{money(detailOrder.sellTRY ?? detailOrder.sellPriceAmount ?? detailOrder.price, detailOrder.currencyTRY ?? detailOrder.sellPriceCurrency)}</div>
              </div>

              <div>
                <div className="text-text-secondary">الربح</div>
                <div
                  className={
                    (detailOrder.profitTRY ?? ((Number(detailOrder.sellTRY ?? detailOrder.sellPriceAmount ?? detailOrder.price) || 0) - (Number(detailOrder.costTRY ?? detailOrder.costAmount) || 0))) > 0
                      ? 'text-success'
                      : (detailOrder.profitTRY ?? ((Number(detailOrder.sellTRY ?? detailOrder.sellPriceAmount ?? detailOrder.price) || 0) - (Number(detailOrder.costTRY ?? detailOrder.costAmount) || 0))) < 0
                      ? 'text-danger'
                      : ''
                  }
                >
                  {money(
                    detailOrder.profitTRY ?? (
                      (Number(detailOrder.sellTRY ?? detailOrder.sellPriceAmount ?? detailOrder.price) || 0) -
                      (Number(detailOrder.costTRY ?? detailOrder.costAmount) || 0)
                    ),
                    detailOrder.currencyTRY ?? detailOrder.sellPriceCurrency ?? detailOrder.costCurrency
                  )}
                </div>
              </div>

              <div>
                <div className="text-text-secondary">التنفيذ</div>
                <div>
                  <div className="text-text-secondary">رقم المزوّد الخارجي</div>
                  <div>{detailOrder.externalOrderId ?? '-'}</div>
                </div>

              </div>

              <div>
                <div className="text-text-secondary">تم الإرسال</div>
                <div>{detailOrder.sentAt ? new Date(detailOrder.sentAt).toLocaleString('en-GB') : '-'}</div>
              </div>
              <div>
                <div className="text-text-secondary">اكتمل</div>
                <div>{detailOrder.completedAt ? new Date(detailOrder.completedAt).toLocaleString('en-GB') : '-'}</div>
              </div>

              <div>
                <div className="text-text-secondary">المدة</div>
                <div>{renderDuration(detailOrder)}</div>
              </div>

              <div>
                <div className="text-text-secondary">تاريخ الإنشاء</div>
                <div>{new Date(detailOrder.createdAt).toLocaleString('en-GB')}</div>
              </div>
            </div>

            {detailOrder.status === 'approved' && detailOrder.fxLocked && (
              <div className="text-xs text-success">
                قيمة الصرف مجمّدة
                {detailOrder.approvedLocalDate ? ` منذ ${detailOrder.approvedLocalDate}` : ''}.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
