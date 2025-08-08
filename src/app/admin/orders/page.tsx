'use client';

import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

interface ProductPackage {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface Order {
  id: string;
  userEmail: string;
  product: Product;
  package: ProductPackage;
  price: number; // ✅ السعر
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get<Order[]>(API_ROUTES.admin.orders);
      setOrders(res.data);
    } catch (err: any) {
      setError('فشل في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`${API_ROUTES.admin.orders}/${id}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
    } catch (err: any) {
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div className="p-4">جاري التحميل...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="bg-[var(--bg-main)] text-gray-100 p-4">
      <h1 className="text-xl font-bold mb-4">إدارة الطلبات</h1>
      <table className="w-full border border-gray-300">
        <thead className="bg-[var(--main-color)]">
          <tr>
            <th className="border p-2">رقم الطلب</th>
            <th className="border p-2">المستخدم</th>
            <th className="border p-2">المنتج</th>
            <th className="border p-2">الباقة</th>
            <th className="border p-2">السعر</th>
            <th className="border p-2">الحالة</th>
            <th className="border p-2">التاريخ</th>
            <th className="border p-2">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const rowClass =
              order.status === 'approved'
                ? 'bg-green-700'
                : order.status === 'rejected'
                ? 'bg-red-500'
                : 'bg-yellow-500';

            return (
              <tr key={order.id} className={rowClass}>

                <td className="border p-2">{order.id}</td>
                <td className="border p-2">{order.userEmail || '-'}</td>
                <td className="border p-2">{order.product?.name || '-'}</td>
                <td className="border p-2">{order.package?.name || '-'}</td>
                <td className="border p-2">{order.price ?? '-'}</td>
                <td className="border p-2">
                  {order.status === 'pending' && 'قيد الانتظار'}
                  {order.status === 'approved' && 'مقبول'}
                  {order.status === 'rejected' && 'مرفوض'}
                </td>
                <td className="border p-2">
                  {typeof window !== 'undefined'
                    ? new Date(order.createdAt).toLocaleDateString('ar-EG')
                    : new Date(order.createdAt).toISOString().split('T')[0]}
                </td>
                <td className="border p-2 space-x-2 space-x-reverse">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(order.id, 'approved')}
                        className="px-2 py-1 bg-green-500 text-white rounded"
                      >
                        قبول
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'rejected')}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        رفض
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
