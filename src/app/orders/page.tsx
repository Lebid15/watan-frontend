// src/app/orders/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import { formatGroupsDots } from '@/utils/format';

type OrderStatus = 'pending' | 'approved' | 'rejected';

interface OrderDisplay {
  currencyCode: string;  // عملة المستخدم (المجموعة)
  unitPrice: number;     // سعر الوحدة بعملة المستخدم
  totalPrice: number;    // السعر الإجمالي بعملة المستخدم
}

interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  product: { name: string };
  package: { name: string };
  userIdentifier?: string | null;
  extraField?: string | null;

  // Fallbacks إن لم يأتِ display من السيرفر
  priceUSD?: number;
  unitPriceUSD?: number;

  // الأفضل أن يوفّره الباك محسوبًا بعملة المستخدم
  display?: OrderDisplay;
}

interface OrderNote {
  by: 'admin' | 'system' | 'user';
  text: string;
  at: string; // ISO string
}

interface OrderDetails extends Order {
  manualNote?: string | null;
  notes?: OrderNote[] | null;
  externalStatus?: string | null;
  lastMessage?: string | null;
  providerMessage?: string | null;
}

interface PageInfo {
  nextCursor?: string | null;
  hasMore?: boolean;
}

interface CursorResponse {
  items: Order[];
  pageInfo?: PageInfo;
  meta?: any;
}

type OrdersPageResponse = Order[] | CursorResponse;

const PAGE_LIMIT = 20;

function currencySymbol(code?: string) {
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'TRY': return '₺';
    case 'EGP': return '£';
    case 'SAR': return '﷼';
    case 'AED': return 'د.إ';
    case 'SYP': return 'ل.س';
    default:    return code || '';
  }
}

/** يحسم ما سيُعرض للمستخدم (عملة/سعر إجمالي/سعر وحدة)
 * أولوية:
 * 1) display القادم من الباك (عملة المستخدم/المجموعة)
 * 2) priceUSD / unitPriceUSD (سقوط آمن بالدولار)
 */
function resolvePriceView(order: Order): {
  currencyCode: string;
  total: number;
  unit?: number;
} {
  if (order.display && typeof order.display.totalPrice === 'number') {
    return {
      currencyCode: order.display.currencyCode,
      total: Number(order.display.totalPrice) || 0,
      unit: typeof order.display.unitPrice === 'number' ? Number(order.display.unitPrice) : undefined,
    };
  }
  // Fallback: USD
  const totalUSD = Number(order.priceUSD ?? 0);
  const unitUSD  = order.unitPriceUSD != null ? Number(order.unitPriceUSD) : undefined;
  return { currencyCode: 'USD', total: totalUSD, unit: unitUSD };
}

/** يبني قائمة مرشّحة لمسار تفاصيل الطلب */
function buildDetailsUrls(id: string): string[] {
  const baseOrders =
    (API_ROUTES as any)?.orders?.base ||
    ((API_ROUTES as any)?.orders?.mine
      ? String((API_ROUTES as any).orders.mine).replace(/\/me$/, '')
      : '/orders');
  const candidates = [
    `${baseOrders}/${id}`,
  ];
  // إن وُجدت بدائل في config
  if ((API_ROUTES.orders as any)._alts?.length) {
    for (const alt of (API_ROUTES.orders as any)._alts) {
      candidates.push(String(alt).replace(/\/me$/, `/${id}`));
    }
  }
  return candidates;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  // الاختيار + تفاصيله
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string>('');

  // pagination
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // ====== جلب الدُفعة الأولى ======
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      const candidates = [
        API_ROUTES.orders.mine,
        ...(API_ROUTES.orders as any)._alts ?? []
      ];

      let lastErr: any = null;
      for (const url of candidates) {
        try {
          const res = await api.get<OrdersPageResponse>(url, {
            params: { limit: PAGE_LIMIT },
          });

          if (Array.isArray(res.data)) {
            setOrders(res.data || []);
            setNextCursor(null);
            setHasMore(false);
          } else {
            const items = res.data.items ?? [];
            const page: PageInfo = res.data.pageInfo ?? {};
            setOrders(items);
            setNextCursor(page.nextCursor ?? null);
            setHasMore(Boolean(page.hasMore));
          }

          setLoading(false);
          return;
        } catch (e: any) {
          lastErr = e;
          const status = e?.response?.status;
          if (status !== 404) break;
        }
      }

      setLoading(false);
      setError('فشل في جلب الطلبات (قد يكون المسار تغيّر في الباك إند)');
      console.error('Orders fetch error:', lastErr);
    };

    fetchOrders();
  }, []);

  // ====== جلب تفاصيل الطلب عند فتح النافذة ======
  useEffect(() => {
    if (!selectedOrder) {
      setDetails(null);
      setDetailsError('');
      setDetailsLoading(false);
      return;
    }

    const run = async () => {
      setDetailsLoading(true);
      setDetailsError('');
      setDetails(null);

      const urls = buildDetailsUrls(selectedOrder.id);
      let lastErr: any = null;

      for (const u of urls) {
        try {
          const res = await api.get<OrderDetails>(u);
          setDetails(res.data);
          setDetailsLoading(false);
          return;
        } catch (e: any) {
          lastErr = e;
          const status = e?.response?.status;
          // لو فشل 404 جرّب مسارًا آخر
          if (status === 404) continue;
          break;
        }
      }

      setDetailsLoading(false);
      setDetailsError('تعذّر جلب تفاصيل الطلب.');
      console.error('Order details error:', lastErr);
    };

    run();
  }, [selectedOrder]);

  // ====== تحميل المزيد ======
  async function loadMore() {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      setError('');

      const candidates = [
        API_ROUTES.orders.mine,
        ...(API_ROUTES.orders as any)._alts ?? [],
      ];

      let lastErr: any = null;
      for (const url of candidates) {
        try {
          const res = await api.get<OrdersPageResponse>(url, {
            params: {
              limit: PAGE_LIMIT,
              cursor: nextCursor ?? undefined,
            },
          });

          if (Array.isArray(res.data)) {
            setHasMore(false);
            setLoadingMore(false);
            return;
          } else {
            const items = res.data.items ?? [];
            const page: PageInfo = res.data.pageInfo ?? {};
            setOrders((prev) => [...prev, ...items]);
            setNextCursor(page.nextCursor ?? null);
            setHasMore(Boolean(page.hasMore));
            setLoadingMore(false);
            return;
          }
        } catch (e: any) {
          lastErr = e;
          const status = e?.response?.status;
          if (status !== 404) break;
        }
      }

      setError('فشل في تحميل المزيد.');
    } finally {
      setLoadingMore(false);
    }
  }

  const getStatusText = (status: OrderStatus) =>
    status === 'approved' ? 'مقبول' :
    status === 'rejected' ? 'مرفوض' : 'قيد المراجعة';

  const getStatusIcon = (status: OrderStatus) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex w-4 h-4 rounded-full bg-success items-center justify-center">
          <span className="text-[10px] text-[rgb(var(--color-primary-contrast))]">✔</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex w-4 h-4 rounded-full bg-danger items-center justify-center">
          <span className="w-2 h-[2px] bg-[rgb(var(--color-primary-contrast))] block" />
        </span>
      );
    }
    return <span className="inline-block w-4 h-4 rounded-full bg-warning" />;
  };

  const getStatusColor = (status: OrderStatus) =>
    status === 'approved' ? 'text-success' :
    status === 'rejected' ? 'text-danger' : 'text-warning';

  const filteredOrders = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [filter, orders]
  );

  if (loading) return <p className="text-center mt-4 text-text-secondary">جاري التحميل...</p>;
  if (error)   return <p className="text-center text-danger mt-4">{error}</p>;

  return (
    <div className="p-4 bg-bg-base text-text-primary" dir="rtl">
      <h1 className="text-lg font-bold mb-4 text-right">📦 طلباتي</h1>

      {/* فلاتر */}
      <div className="mb-4">
        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={() => setFilter('all')}
            className={[
              'btn text-xs',
              filter === 'all'
                ? 'btn-primary hover:bg-primary-hover'
                : 'btn-secondary'
            ].join(' ')}
          >
            الكل
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={[
              'btn text-xs',
              filter === 'approved'
                ? 'bg-success text-[rgb(var(--color-primary-contrast))]'
                : 'btn-secondary'
            ].join(' ')}
          >
            ✅ مقبول
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={[
              'btn text-xs',
              filter === 'rejected'
                ? 'bg-danger text-[rgb(var(--color-primary-contrast))]'
                : 'btn-secondary'
            ].join(' ')}
          >
            ❌ مرفوض
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={[
              'btn text-xs',
              filter === 'pending'
                ? 'bg-warning text-[rgb(var(--color-primary-contrast))]'
                : 'btn-secondary'
            ].join(' ')}
          >
            ⏳ انتظار
          </button>
        </div>
      </div>

      {/* الطلبات */}
      {filteredOrders.length === 0 ? (
        <div className="text-center text-text-secondary">لا توجد طلبات بعد</div>
      ) : (
        <>
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const view = resolvePriceView(order);
              const totalText = Number(view.total).toFixed(2);

              return (
                <div
                  key={order.id}
                  className="relative card p-3 shadow text-xs flex justify-between items-center"
                >
                  <div className="text-right">
                    <div className="text-text-secondary">ID: {order.id.slice(0, 8)}...</div>
                    <div className="text-text-primary">{order.package.name}</div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center max-w-[140px] break-words whitespace-normal">
                    <div className="break-words break-all whitespace-normal text-text-primary">
                      {order.userIdentifier || '—'}
                    </div>

                    {/* 👇 الحقل الإضافي يظهر تحت رقم اللاعب */}
                    {order.extraField ? (
                      <div className="mt-1 text-[11px] text-text-secondary break-words break-all">
                        {order.extraField}
                      </div>
                    ) : null}

                    <div className="text-link mt-1 font-medium">
                      {currencySymbol(view.currencyCode)} {totalText}
                    </div>
                  </div>

                  <div className="text-left">
                    <div className={`flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="text-text-primary">{getStatusText(order.status)}</span>
                    </div>
                    <div className="text-text-secondary mt-1 text-[10px]">
                      {new Date(order.createdAt).toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="absolute top-2 left-2 text-link hover:opacity-80 text-sm"
                    title="عرض التفاصيل"
                  >
                    📝
                  </button>
                </div>
              );
            })}
          </div>

          {/* زر تحميل المزيد */}
          <div className="mt-4 flex items-center justify-center">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn btn-primary text-xs disabled:opacity-60"
              >
                {loadingMore ? 'جارِ التحميل…' : 'تحميل المزيد'}
              </button>
            ) : (
              <div className="py-2 text-xs text-text-secondary">لا يوجد المزيد</div>
            )}
          </div>
        </>
      )}

      {/* نافذة التفاصيل */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="card w-full max-w-md p-6 shadow relative text-sm">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-2 left-2 text-text-secondary hover:text-danger text-lg"
              title="إغلاق"
            >
              ✖
            </button>
            <h2 className="text-xl mb-4 font-bold text-center">تفاصيل الطلب</h2>

            {/* محتوى التفاصيل */}
            {detailsLoading ? (
              <div className="text-center py-6 text-text-secondary">جاري جلب التفاصيل…</div>
            ) : detailsError ? (
              <div className="text-center py-6 text-danger">{detailsError}</div>
            ) : (
              (() => {
                const base = details || (selectedOrder as OrderDetails);
                const view = resolvePriceView(base);
                const totalNum = Number(view.total) || 0;

                // نرتّب الملاحظات تنازليًا بالتاريخ
                const notesSorted = (base.notes || [])
                  .slice()
                  .filter(n => n.by !== 'admin' || !base.manualNote)
                  .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

                return (
                  <div className="space-y-3">
                    <p><span className="text-text-secondary">رقم الطلب:</span> {base.id}</p>
                    <p><span className="text-text-secondary">اسم المنتج:</span> {base.product.name}</p>
                    <p><span className="text-text-secondary">الباقة:</span> {base.package.name}</p>
                    <p><span className="text-text-secondary">المعرف:</span> {base.userIdentifier || '—'}</p>
                    {base.extraField ? (
                      <p>
                        <span className="text-text-secondary">معلومة إضافية:</span>{' '}
                        {base.extraField}
                      </p>
                    ) : null}

                    <p>
                      <span className="text-text-secondary">السعر:</span>{' '}
                      <span className="text-text-primary">
                        {currencySymbol(view.currencyCode)} {formatGroupsDots(totalNum)}
                      </span>
                    </p>
                    <p>
                      <span className="text-text-secondary">الحالة:</span>{' '}
                      <span className={getStatusColor(base.status)}>{getStatusText(base.status)}</span>
                    </p>
                    <p>
                      <span className="text-text-secondary">التاريخ:</span>{' '}
                      {new Date(base.createdAt).toLocaleString('en-US')}
                    </p>

                    {/* آخر رسالة من المزوّد (اختياري) */}
                    {((base as any).providerMessage ?? base.lastMessage) ? (
                      <p className="flex flex-col mt-2 bg-orange-900 px-2 py-1 rounded">
                        <span className="text-white mb-2">رسالة الملاحظة:</span>{' '}
                        <span className="text-white break-words">
                          {(base as any).providerMessage ?? base.lastMessage}
                        </span>
                      </p>
                    ) : null}


                    {/* ملاحظة الأدمن السريعة */}
                    {base.manualNote ? (
                      <div className="mt-3 p-2 rounded bg-[rgba(255,165,0,0.08)] border border-[rgba(255,165,0,0.25)]">
                        <div className="font-medium mb-2">📝 ملاحظة</div>
                        <div className="text-text-primary break-words whitespace-pre-wrap">
                          {base.manualNote}
                        </div>
                      </div>
                    ) : null}

                    {/* سجل الملاحظات */}
                    {/* <div className="mt-3">
                      <div className="font-medium mb-1">🗂️ الملاحظات</div>
                      {notesSorted.length === 0 ? (
                        <div className="text-text-secondary text-xs">لا توجد ملاحظات بعد</div>
                      ) : (
                        <ul className="space-y-2 max-h-56 overflow-auto pr-2">
                          {notesSorted.map((n, i) => (
                            <li key={i} className="p-2 rounded border border-border bg-bg-elevated">
                              <div className="flex items-center justify-between text-[11px] text-text-secondary">
                                <span>
                                  {n.by === 'admin' ? 'مشرف' : n.by === 'system' ? 'النظام' : 'المستخدم'}
                                </span>
                                <span>{new Date(n.at).toLocaleString('en-US')}</span>
                              </div>
                              <div className="mt-1 text-text-primary whitespace-pre-wrap break-words">
                                {n.text}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div> */}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
