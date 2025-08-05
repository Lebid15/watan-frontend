'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '../../../../utils/api'; // ✅ استدعاء الروابط الموحدة

interface User {
  id: string;
  email: string;
  role: string;
  balance: string | number | null;
  phoneNumber?: string;
  fullName?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get<User>(API_ROUTES.users.byId(id), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch {
        setError('فشل تحميل بيانات المستخدم');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(API_ROUTES.users.byId(id), user, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('تم حفظ التعديلات بنجاح');
      router.push('/admin/users');
    } catch {
      alert('فشل حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">جاري التحميل...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!user) return <div className="p-4 text-red-600">المستخدم غير موجود</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">تعديل بيانات المستخدم</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-1">البريد الإلكتروني</label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">الاسم الكامل</label>
        <input
          type="text"
          value={user.fullName || ''}
          onChange={(e) => setUser({ ...user, fullName: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">رقم الجوال</label>
        <input
          type="text"
          value={user.phoneNumber || ''}
          onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">الرصيد</label>
        <input
          type="number"
          step="0.01"
          value={user.balance || 0}
          onChange={(e) =>
            setUser({ ...user, balance: e.target.value ? parseFloat(e.target.value) : 0 })
          }
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">الدور</label>
        <select
          value={user.role}
          onChange={(e) => setUser({ ...user, role: e.target.value })}
          className="w-full border p-2 rounded"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button
          onClick={() => router.back()}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          رجوع
        </button>
      </div>
    </div>
  );
}
