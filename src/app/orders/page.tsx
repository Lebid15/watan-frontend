// src/app/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
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

  // Fallbacks إن لم يأتِ display من السيرفر
  priceUSD?: number;
  unitPriceUSD?: number;

  // الأفضل أن يوفّره الباك محسوبًا بعملة المستخدم
  display?: OrderDisplay;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter);

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

            {(() => {
              const view = resolvePriceView(selectedOrder);
              const totalNum = Number(view.total) || 0;
              return (
                <div className="space-y-2">
                  <p><span className="text-text-secondary">رقم الطلب:</span> {selectedOrder.id}</p>
                  <p><span className="text-text-secondary">اسم المنتج:</span> {selectedOrder.product.name}</p>
                  <p><span className="text-text-secondary">الباقة:</span> {selectedOrder.package.name}</p>
                  <p><span className="text-text-secondary">المعرف:</span> {selectedOrder.userIdentifier || '—'}</p>
                  <p>
                    <span className="text-text-secondary">السعر:</span>{' '}
                    <span className="text-text-primary">
                      {currencySymbol(view.currencyCode)} {formatGroupsDots(totalNum)}
                    </span>
                  </p>
                  <p>
                    <span className="text-text-secondary">الحالة:</span>{' '}
                    <span className={getStatusColor(selectedOrder.status)}>{getStatusText(selectedOrder.status)}</span>
                  </p>
                  <p>
                    <span className="text-text-secondary">التاريخ:</span>{' '}
                    {new Date(selectedOrder.createdAt).toLocaleString('en-US')}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
