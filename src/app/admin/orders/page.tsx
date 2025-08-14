'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import { useToast } from '@/context/ToastContext';

type OrderStatus = 'pending' | 'approved' | 'rejected';

interface ProductPackage { id: string; name: string; }
interface Provider { id: string; name: string; }

interface Order {
  id: string;
  orderNo?: number | null;
  username?: string;
  userEmail?: string;
  package?: ProductPackage;
  fxLocked?: boolean;
  approvedLocalDate?: string;

  // التكاليف/الأسعار:
  costAmount?: number;       // التكلفة الفعلية (خارجي)
  manualCost?: number;       // التكلفة اليدوية إن وفّرها الباك
  sellPriceAmount?: number;  // سعر البيع
  price?: number;            // fallback للسعر القديم
  sellPriceCurrency?: string;
  currencyCode?: string;

  // القيم المحوّلة لليرة التركية
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
}

interface Filters {
  q: string;
  status: '' | OrderStatus;
  providerMode: '' | 'manual' | 'external';
  from: string;
  to: string;
}

/** أيقونة الحالة فقط */
function StatusDot({ status }: { status: OrderStatus }) {
  if (status === 'approved') {
    return (
      <span title="مقبول" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600">
        <span className="text-white text-[12px] font-bold">✓</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span title="مرفوض" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600">
        <span className="block w-3 h-0.5 bg-black rounded-sm" />
      </span>
    );
  }
  return (
    <span title="قيد المراجعة" className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-yellow-500 relative">
      <span className="absolute inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
    </span>
  );
}

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

export default function AdminOrdersPage() {
  const { show } = useToast();

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

  const [, forceTick] = useState(0);
  const tickRef = useRef<number | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get<Order[]>(
        `${API_ROUTES.adminOrders?.base ?? API_ROUTES.orders.base}`
      );
      setOrders(res.data || []);
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
  const allShownSelected = shownIds.length > 0 && shownIds.every((id) => selected.has(id));
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

  // ——— عمليات جماعية ———
  const bulkApprove = async () => {
    if (selected.size === 0) {
      show('لم يتم تحديد أي طلبات');
      return;
    }
    try {
      await api.post(API_ROUTES.adminOrders.bulkApprove, {
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
      await api.post(API_ROUTES.adminOrders.bulkReject, {
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
      const { data }: { data: { results?: { success: boolean; message?: string }[]; message?: string } } =
        await api.post(API_ROUTES.adminOrders.bulkDispatch, {
        ids: [...selected],
        providerId,
        note: note || undefined,
      });

      // لو رجعت نتائج تفصيلية من الخادم
      if (data?.results?.length) {
        const ok = data.results.filter((r: any) => r.success);
        const failed = data.results.filter((r: any) => !r.success);
        if (ok.length) show(`تم إرسال ${ok.length} طلب(ات) بنجاح`);
        if (failed.length) {
          const msg = failed[0]?.message || 'فشل توجيه بعض الطلبات';
          show(msg);
        }
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
      await api.post(API_ROUTES.adminOrders.bulkManual, {
        ids: [...selected],
        note: note || undefined,
      });
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
      show(`تم تحويل ${n} طلب(ات) إلى Manual`);
    } catch (e: any) {
      show(e?.response?.data?.message || 'تعذر تحويل الطلبات إلى Manual');
    }
  };

  const renderDuration = (o: Order) => {
    const sentAt = o.sentAt ? new Date(o.sentAt).getTime() : null;
    const completedAt = o.completedAt ? new Date(o.completedAt).getTime() : null;
    if (!sentAt) return '-';
    if (completedAt) {
      const ms =
        o.durationMs != null ? Number(o.durationMs) : Math.max(0, completedAt - sentAt);
      return fmtHMS(ms);
    }
    return fmtHMS(Date.now() - sentAt);
  };

  const displayOrderNumber = (o: Order) => {
    if (o.externalOrderId && /^\d+$/.test(o.externalOrderId)) return o.externalOrderId;
    if (o.orderNo != null) return String(o.orderNo);
    return o.id.slice(-6).toUpperCase();
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
      <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg border  mb-3 bg-[var(--bg-main)]">
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
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
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
            onChange={(e) => setFilters((f) => ({ ...f, providerMode: e.target.value as any }))}
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
        <button onClick={fetchOrders} className="px-2 py-2 text-sm rounded bg-teal-700 text-white hover:opacity-90">تحديث</button>
        <button
          onClick={() => {
            setFilters({ q: '', status: '', providerMode: '', from: '', to: '' });
            show('تمت إعادة التصفية');
          }}
          className="px-2 py-2 text-sm rounded bg-red-700 text-white hover:opacity-90"
        >مسح الفلتر</button>
      </div>

      {/* شريط الإجراءات الجماعية */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 mb-3 rounded-lg border bg-[var(--bg-main)]">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="كتابة ملاحظة"
            className="px-2 py-1 rounded border w-72"
          />
          <button
            onClick={bulkManual}
            className="px-3 py-2 text-sm rounded bg-slate-300 hover:opacity-90"
            title="فصل الطلبات المحددة عن الجهة الخارجية (Manual)"
          >تحويل إلى يدوي</button>
          <div className="flex items-center gap-2">
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="px-2 py-1 rounded border"
            >
              <option value="">حدد الجهة الخارجية…</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={bulkDispatch}
              className="px-3 py-2 text-sm text-white ml-5 rounded bg-yellow-700 hover:opacity-90 disabled:opacity-50"
              disabled={!providerId}
            >إرسال</button>
          </div>
          <button onClick={bulkApprove} className="px-3 py-2 rounded text-sm text-white bg-green-600 hover:opacity-90">موافقة</button>
          <button onClick={bulkReject} className="px-3 py-2 rounded text-sm text-white bg-red-600 hover:opacity-90">رفض</button>
          <span className="text-xs opacity-80">({selected.size} محدد)</span>
        </div>
      )}

      {/* الجدول */}
      <div className="overflow-auto rounded-lg border">
        <table className="min-w-[1080px] w-full text-sm">
          <thead className="">
            <tr>
              <th className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={allShownSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th className="border p-2">رقم الطلب</th>
              <th className="border p-2">المستخدم</th>
              <th className="border p-2">الباقة</th>
              <th className="border p-2">رقم اللاعب</th>
              <th className="border p-2">التكلفة</th>
              <th className="border p-2">السعر</th>
              <th className="border p-2">الربح</th>
              <th className="border p-2">الحالة</th>
              <th className="border p-2">API</th>
              <th className="border p-2">الزمن</th>
              <th className="border p-2">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const currency = o.sellPriceCurrency ?? o.currencyCode ?? '';
              const isExternal = !!(o.providerId && o.externalOrderId);
              const cost = isExternal ? (o.costAmount ?? undefined) : (o.manualCost ?? undefined);
              const sell = o.sellPriceAmount ?? o.price ?? undefined;
              const profit = (sell ?? 0) - (cost ?? 0);
              const provName = providerNameOf(o.providerId, o.providerName);

              return (
              <tr
                key={o.id}
                className=""
              >
                <td className="border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggleSelect(o.id)}
                  />
                </td>

                <td className="border p-2 font-medium">{displayOrderNumber(o)}</td>
                <td className="border p-2">{o.username || o.userEmail || '-'}</td>
                <td className="border p-2">{o.package?.name ?? '-'}</td>
                <td className="border p-2">{o.userIdentifier ?? '-'}</td>

                <td className="border p-2 text-center">{money(o.costTRY, o.currencyTRY)}</td>
                <td className="border p-2 text-center">{money(o.sellTRY, o.currencyTRY)}</td>
                <td
                  className={`border p-2 text-center ${
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
                {/* الحالة + شارة "مجمّد" عند الحاجة */}
                <td className="border p-2">
                  <div className="flex items-center gap-2">
                    <StatusDot status={o.status} />
                    {o.status === 'approved' && o.fxLocked && (
                      <span
                        title={o.approvedLocalDate ? `مجمّد منذ ${o.approvedLocalDate}` : 'قيمة الصرف مجمّدة'}
                        // className="px-2 py-0.5 rounded bg-emerald-700 text-white text-xs"
                      >
                        {/* مجمّد */}
                      </span>
                    )}
                  </div>
                </td>

                <td className="border p-2">
                  {isExternal ? (
                    <span className="px-2 py-0.5 rounded text-xs">
                      {provName || 'External'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-600 text-white text-xs">
                      Manual
                    </span>
                  )}
                </td>

                <td className="border p-2 text-center">{renderDuration(o)}</td>
                <td className="border p-2">
                  {typeof window !== 'undefined'
                    ? new Date(o.createdAt).toLocaleString('en-GB')
                    : new Date(o.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                </td>
              </tr>

              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan={12}>
                  لا توجد طلبات مطابقة للفلاتر الحالية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
