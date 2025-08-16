// src/app/notifications/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
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
  const date = d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

// مقارنة سطحية لمنع إعادة الرسم إن لم تتغير البيانات فعليًا
function sameList(a: Notification[], b: Notification[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x.id !== y.id || x.isRead !== y.isRead || x.title !== y.title || x.message !== y.message || x.link !== y.link || x.createdAt !== y.createdAt) {
      return false;
    }
  }
  return true;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');
  const fetchingRef = useRef(false); // لمنع السباقات

  const fetchNotifications = async () => {
    if (fetchingRef.current) return; // امنع تداخل الطلبات
    try {
      fetchingRef.current = true;
      setErrMsg('');
      if (notifications.length === 0) setLoading(true);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await api.get<Notification[]>(API_ROUTES.notifications.my, {
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(prev => (sameList(prev, list) ? prev : list));
    } catch (err: any) {
      console.error('فشل في جلب الإشعارات', err);
      const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء جلب الإشعارات';
      setErrMsg(Array.isArray(msg) ? msg.join(', ') : msg);
      setNotifications([]);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setErrMsg('');
      // تحديث متفائل
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await api.patch(API_ROUTES.notifications.readAll, {}, {
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      // مزامنة هادئة
      fetchNotifications();
    } catch (err: any) {
      console.error('فشل في تعليم الكل كمقروء', err);
      setErrMsg('فشل في تعليم الكل كمقروء');
      // إعادة جلب للتصحيح
      fetchNotifications();
    }
  };

  const markOneAsRead = async (id: string) => {
    try {
      setErrMsg('');
      // تحديث متفائل
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      await api.patch(API_ROUTES.notifications.readOne(id), {}, {
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      });
      // مزامنة هادئة
      fetchNotifications();
    } catch (err: any) {
      console.error('فشل في تعليم الإشعار كمقروء', err);
      setErrMsg('فشل في تعليم الإشعار كمقروء');
      fetchNotifications();
    }
  };

  useEffect(() => {
    fetchNotifications();

    // ✅ لا مؤقّتات دورية — لمنع الاهتزاز
    // بدلاً من ذلك: حدّث عند عودة التركيز أو ظهور التبويب
    const onFocus = () => fetchNotifications();
    const onVis = () => { if (document.visibilityState === 'visible') fetchNotifications(); };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="p-4 text-text-secondary">جارٍ التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-bg-base text-text-primary" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">الإشعارات</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            className="btn btn-secondary"
            title="تحديث"
          >
            تحديث
          </button>
          <button
            onClick={markAllAsRead}
            className="btn btn-primary hover:bg-primary-hover text-primary-contrast"
            title="تعليم الكل كمقروء"
          >
            تعليم الكل كمقروء
          </button>
        </div>
      </div>

      {errMsg && <div className="mb-4 text-danger text-sm">{errMsg}</div>}

      {notifications.length === 0 ? (
        <div className="text-text-secondary">لا توجد إشعارات</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const { date, time } = formatArabicDateTime(n.createdAt);
            const unread = !n.isRead;
            return (
              <div
                key={n.id}
                className={[
                  'card p-4 text-sm shadow cursor-pointer transition',
                  unread ? 'bg-warning/10 ring-1 ring-warning/30' : '',
                  'hover:bg-bg-surface-alt'
                ].join(' ')}
                onClick={() => {
                  if (unread) markOneAsRead(n.id);
                  if (n.link) window.location.assign(n.link);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className={`font-semibold ${unread ? 'text-text-primary' : 'text-text-primary'}`}>
                    {n.title || 'إشعار'}
                  </h2>
                  <div className="text-xs text-text-secondary text-left leading-tight">
                    <div>{date}</div>
                    <div className="opacity-80">{time}</div>
                  </div>
                </div>

                <p className="mt-2 leading-relaxed text-text-primary">{n.message}</p>

                {n.link && (
                  <div className="mt-2 text-xs text-link underline">
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
