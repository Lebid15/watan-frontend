'use client';

import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

interface Order {
  id: string;
  status: string;
  price: string;
  createdAt: string;
  product: { name: string };
  package: { name: string };
  userIdentifier?: string; // ✅ لعرض Game ID
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get<Order[]>(API_ROUTES.orders.base);
        setOrders(res.data || []);
      } catch (err) {
        setError('فشل في جلب الطلبات');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100'; // أخضر فاتح
      case 'rejected':
        return 'bg-red-100'; // أحمر فاتح
      case 'pending':
      default:
        return 'bg-yellow-100'; // أصفر فاتح
    }
  };

  if (loading) return <p className="text-center mt-4">جاري تحميل الطلبات...</p>;
  if (error) return <p className="text-center text-red-600 mt-4">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-right">📦 طلباتي</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`${getStatusColor(
              order.status
            )} p-4 rounded-lg shadow flex flex-col sm:flex-row sm:justify-between sm:items-center`}
          >
            <div>
              <p className="font-bold">{order.product.name}</p>
              <p className="text-sm text-gray-500">{order.package.name}</p>

              {/* ✅ إظهار Game ID إذا كان موجود */}
              {order.userIdentifier && (
                <p className="text-sm text-blue-600">Game ID: {order.userIdentifier}</p>
              )}

              <p className="text-sm">الحالة: {order.status}</p>
              <p className="text-sm">
                التاريخ: {new Date(order.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 text-yellow-600 font-bold text-lg">
              {order.price}$
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
