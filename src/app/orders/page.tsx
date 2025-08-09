// src/app/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import { formatGroupsDots } from '@/utils/format';

type OrderStatus = 'pending' | 'approved' | 'rejected';

interface OrderDisplay {
  currencyCode: string;   // SYP, TRY, USD ...
  unitPrice: number;      // سعر القطعة بعملة المستخدم
  totalPrice: number;     // الإجمالي بعملة المستخدم
}

interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  product: { name: string };
  package: { name: string };
  userIdentifier?: string | null;

  // حقول قديمة (اختيارية)
  priceUSD?: number;
  unitPriceUSD?: number;

  // الحقل المعتمد للعرض
  display: OrderDisplay;
}

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // ✅ نجلب طلبات المستخدم الحالي فقط
        const res = await api.get<Order[]>(API_ROUTES.orders.mine);
        setOrders(res.data || []);
      } catch {
        setError('فشل في جلب الطلبات');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusText = (status: OrderStatus) =>
    status === 'approved' ? 'مقبول' :
    status === 'rejected' ? 'مرفوض' : 'قيد المراجعة';

  const getStatusIcon = (status: OrderStatus) => {
    if (status === 'approved') {
      return (
        <span className="inline-block w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mr-2">
          <span className="text-white text-[10px]">✔</span>
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-block w-4 h-4 rounded-full bg-red-600 flex items-center justify-center mr-2">
          <span className="w-2 h-[2px] bg-black block"></span>
        </span>
      );
    }
    return <span className="inline-block w-4 h-4 rounded-full bg-yellow-400 mr-2"></span>;
  };

  const getStatusColor = (status: OrderStatus) =>
    status === 'approved' ? 'text-green-500' :
    status === 'rejected' ? 'text-red-500' : 'text-yellow-400';

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
  if (error)   return <p className="text-center text-red-600 mt-4">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4 text-right">📦 طلباتي</h1>

      {/* فلاتر */}
      <div className="-mx-2">
        <div className="flex gap-2 mb-4 flex-wrap justify-center px-2">
          <button onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded text-xs ${filter === 'all' ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
            الكل
          </button>
          <button onClick={() => setFilter('approved')}
            className={`px-3 py-2 rounded text-xs ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white'}`}>
            ✅ مقبول
          </button>
          <button onClick={() => setFilter('rejected')}
            className={`px-3 py-2 rounded text-xs ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
            ❌ مرفوض
          </button>
          <button onClick={() => setFilter('pending')}
            className={`px-3 py-2 rounded text-xs ${filter === 'pending' ? 'bg-yellow-500 text-black' : 'bg-gray-900 text-white'}`}>
            ⏳ انتظار
          </button>
        </div>
      </div>

      {/* الطلبات */}
      {filteredOrders.length === 0 ? (
        <div className="text-center text-gray-400">لا توجد طلبات بعد</div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const cur   = order.display?.currencyCode;
            const total = Number(order.display?.totalPrice ?? 0).toFixed(2);
            return (
              <div key={order.id}
                   className="relative bg-[var(--bg-orders)] text-[var(--text-orders)] p-3 rounded-lg shadow text-xs flex justify-between items-center">
                <div className="text-right">
                  <div className="text-gray-300">ID: {order.id.slice(0, 8)}...</div>
                  <div>{order.package.name}</div>
                </div>

                <div className="flex flex-col items-center justify-center text-center max-w-[120px] break-words whitespace-normal">
                  <div className="text-gray-400 break-words break-all whitespace-normal">
                    {order.userIdentifier || '—'}
                  </div>
                  <div className="text-yellow-400 mt-1">
                    {currencySymbol(cur)} {total}
                  </div>
                </div>

                <div className="text-left">
                  <div className={`flex items-center ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-4">{getStatusText(order.status)}</span>
                  </div>
                  <div className="text-gray-400 mt-1 text-[10px]">
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
                  className="absolute top-2 left-2 text-blue-400 hover:text-blue-200 text-sm"
                  title="عرض التفاصيل"
                >
                  📝
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة التفاصيل */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1f1f1f] text-white rounded-lg p-6 w-full max-w-md shadow-lg relative text-sm">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-2 left-2 text-gray-400 hover:text-red-500 text-lg"
            >
              ✖
            </button>
            <h2 className="text-xl mb-4 font-bold text-center">تفاصيل الطلب</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">رقم الطلب:</span> {selectedOrder.id}</p>
              <p><span className="text-gray-400">اسم المنتج:</span> {selectedOrder.product.name}</p>
              <p><span className="text-gray-400">الباقة:</span> {selectedOrder.package.name}</p>
              <p><span className="text-gray-400">المعرف:</span> {selectedOrder.userIdentifier || '—'}</p>
              <p>
                <span className="text-gray-100">السعر:</span>{' '}
                {currencySymbol(selectedOrder.display?.currencyCode)}{' '}
                {formatGroupsDots(Number(selectedOrder.display?.totalPrice ?? 0))}
              </p>
              <p><span className="text-gray-400">الحالة:</span> {getStatusText(selectedOrder.status)}</p>
              <p><span className="text-gray-400">التاريخ:</span> {new Date(selectedOrder.createdAt).toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
