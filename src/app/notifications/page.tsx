'use client';

import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

interface Notification {
  id: string;
  title: string | null;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function formatArabicDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '-', time: '-' };

  // غيّر "ar-EG" إن رغبت (ar-SY / ar-SA ...)
  const date = d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date, time };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setErrMsg('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await api.get<Notification[]>(API_ROUTES.notifications.my, {
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error('فشل في جلب الإشعارات', err);
      const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء جلب الإشعارات';
      setErrMsg(Array.isArray(msg) ? msg.join(', ') : msg);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setErrMsg('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await api.patch(API_ROUTES.notifications.readAll, {}, {
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      await fetchNotifications();
    } catch (err: any) {
      console.error('فشل في تعليم الكل كمقروء', err);
      setErrMsg('فشل في تعليم الكل كمقروء');
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      setErrMsg('');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await api.patch(API_ROUTES.notifications.readOne(id), {}, {
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      await fetchNotifications();
    } catch (err: any) {
      console.error('فشل في تعليم الإشعار كمقروء', err);
      setErrMsg('فشل في تعليم الإشعار كمقروء');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // تحديث تلقائي خفيف بعد فتح الصفحة (اختياري)
    const t = setInterval(fetchNotifications, 15000);
    setTimeout(() => clearInterval(t), 2 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="p-4">جارٍ التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">الإشعارات</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded"
          >
            تحديث
          </button>
          <button
            onClick={markAllAsRead}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
          >
            تعليم الكل كمقروء
          </button>
        </div>
      </div>

      {errMsg && <div className="mb-4 text-red-600 text-sm">{errMsg}</div>}

      {notifications.length === 0 ? (
        <div className="text-gray-600">لا توجد إشعارات</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const { date, time } = formatArabicDateTime(n.createdAt);
            return (
              <div
                key={n.id}
                className={`p-4 text-sm rounded shadow cursor-pointer ${
                  n.isRead ? 'bg-gray-100 text-gray-900' : 'bg-yellow-200 text-gray-900'
                }`}
                onClick={() => {
                  if (!n.isRead) markOneAsRead(n.id);
                  if (n.link) window.location.href = n.link;
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold">{n.title || 'إشعار'}</h2>
                  <div className="text-xs text-gray-700 text-left leading-tight">
                    <div>{date}</div>
                    <div className="opacity-80">{time}</div>
                  </div>
                </div>
                <p className="mt-2 leading-relaxed">{n.message}</p>
                {n.link && (
                  <div className="mt-2 text-xs text-blue-700 underline">
                    اضغط لفتح التفاصيل
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
