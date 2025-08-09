'use client';

import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { ar } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string | null;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get<Notification[]>(`${API_ROUTES.notifications.my}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('فشل في جلب الإشعارات', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`${API_ROUTES.notifications.readAll}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error('فشل في تعليم الكل كمقروء', err);
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`${API_ROUTES.notifications.readOne(id)}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error('فشل في تعليم الإشعار كمقروء', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) return <div className="p-4">جارٍ التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">الإشعارات</h1>
        <button
          onClick={markAllAsRead}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          تعليم الكل كمقروء
        </button>
      </div>

      {notifications.length === 0 ? (
        <div>لا توجد إشعارات</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 text-sm text-[var(--text-main)] rounded shadow cursor-pointer ${
                n.isRead ? 'bg-gray-900' : 'bg-orange-500'
              }`}
              onClick={() => {
                if (!n.isRead) markOneAsRead(n.id);
                if (n.link) window.location.href = n.link;
              }}
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">{n.title || 'إشعار'}</h2>
                <span className="text-sm text-gray-200">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ar })}
                </span>
              </div>
              <p className="mt-1">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
