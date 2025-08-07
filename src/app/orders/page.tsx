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
  userIdentifier?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get<Order[]>(API_ROUTES.orders.base);
        setOrders(res.data || []);
      } catch {
        setError('فشل في جلب الطلبات');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'مقبول';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
      default:
        return 'قيد المراجعة';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-block w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mr-2">
            <span className="text-white text-[10px]">✔</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-block w-4 h-4 rounded-full bg-red-600 flex items-center justify-center mr-2">
            <span className="w-2 h-[2px] bg-black block"></span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-block w-4 h-4 rounded-full bg-yellow-400 mr-2"></span>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      case 'pending':
      default:
        return 'text-yellow-400';
    }
  };

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  if (loading) return <p className="text-center mt-4">Loading orders...</p>;
  if (error) return <p className="text-center text-red-600 mt-4">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4 text-right">📦 طلباتي</h1>

      {/* فلاتر */}
      <div className="-mx-2">
        <div className="flex gap-2 mb-4 flex-wrap justify-center px-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded text-xs ${filter === 'all' ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}>الكل</button>
          <button onClick={() => setFilter('approved')} className={`px-3 py-1 rounded text-xs ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`}>✅ المقبولة</button>
          <button onClick={() => setFilter('rejected')} className={`px-3 py-1 rounded text-xs ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>❌ المرفوضة</button>
          <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded text-xs ${filter === 'pending' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-white'}`}>⏳ قيد المراجعة</button>
        </div>
      </div>

      {/* الطلبات */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="relative bg-[#212427] text-white p-3 rounded-lg shadow text-xs flex justify-between items-center">
            <div className="text-right">
              <div className="text-gray-300 font-semibold">ID: {order.id.slice(0, 8)}...</div>
              <div className="font-bold">{order.package.name}</div>
            </div>

            <div className="flex flex-col items-center justify-center text-center max-w-[100px] break-words whitespace-normal">
              <div className="text-gray-400 break-words break-all whitespace-normal">
                {order.userIdentifier || '—'}
              </div>
              <div className="text-yellow-400 font-bold mt-1">{order.price} ₺</div>
            </div>

            <div className="text-left">
              <div className={`flex items-center ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span>{getStatusText(order.status)}</span>
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

            <button onClick={() => setSelectedOrder(order)} className="absolute top-2 left-2 text-blue-400 hover:text-blue-200 text-sm" title="عرض التفاصيل">📝</button>
          </div>
        ))}
      </div>

      {/* نافذة التفاصيل */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[#1f1f1f] text-white rounded-lg p-6 w-full max-w-md shadow-lg relative text-sm">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-2 left-2 text-gray-400 hover:text-red-500 text-lg">✖</button>
            <h2 className="text-xl mb-4 font-bold text-center">تفاصيل الطلب</h2>
            <div className="space-y-2">
              <p><span className="text-gray-400">رقم الطلب:</span> {selectedOrder.id}</p>
              <p><span className="text-gray-400">اسم المنتج:</span> {selectedOrder.product.name}</p>
              <p><span className="text-gray-400">الباقة:</span> {selectedOrder.package.name}</p>
              <p><span className="text-gray-400">Game ID:</span> {selectedOrder.userIdentifier || '—'}</p>
              <p><span className="text-gray-400">السعر:</span> {selectedOrder.price} ₺</p>
              <p><span className="text-gray-400">الحالة:</span> {getStatusText(selectedOrder.status)}</p>
              <p><span className="text-gray-400">التاريخ:</span> {new Date(selectedOrder.createdAt).toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
