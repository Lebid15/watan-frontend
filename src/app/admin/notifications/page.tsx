'use client';

import { useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [channel, setChannel] = useState<'in_app' | 'email' | 'sms'>('in_app');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const sendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      setStatus('❌ العنوان والنص مطلوبان');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const token = localStorage.getItem('token');
      await api.post(
        `${API_ROUTES.notifications.announce}`,
        { title, message, link: link || null, channel, priority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus('✅ تم إرسال الإشعار بنجاح');
      setTitle('');
      setMessage('');
      setLink('');
    } catch (err) {
      console.error('خطأ في إرسال الإشعار:', err);
      setStatus('❌ فشل في إرسال الإشعار');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">إرسال إشعار عام</h1>

      {status && (
        <div
          className={`mb-4 p-2 rounded ${
            status.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </div>
      )}

      <div className="mb-4">
        <label className="block font-medium mb-1">العنوان</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-[var(--bg-section)]"
          placeholder="اكتب عنوان الإشعار"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">النص</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded px-3 py-2 h-24 bg-[var(--bg-section)]"
          placeholder="اكتب نص الإشعار"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">الرابط (اختياري)</label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-[var(--bg-section)]"
          placeholder="مثال: /orders/123"
        />
      </div>

      <div className="mb-4 flex gap-4">
        <div>
          <label className="block font-medium mb-1">القناة</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
            className="border rounded px-3 py-2 bg-[var(--bg-section)]"
          >
            <option value="in_app">داخل التطبيق</option>
            <option value="email">بريد إلكتروني</option>
            <option value="sms">رسالة SMS</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">الأولوية</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="border rounded px-3 py-2 bg-[var(--bg-section)]"
          >
            <option value="low">منخفضة</option>
            <option value="normal">عادية</option>
            <option value="high">عالية</option>
          </select>
        </div>
      </div>

      <button
        onClick={sendAnnouncement}
        disabled={loading}
        className={`px-4 py-2 rounded text-[var(--btn-primary-text)]  ${
          loading ? 'bg-gray-400' : 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)]'
        }`}
      >
        {loading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
      </button>
    </div>
  );
}
