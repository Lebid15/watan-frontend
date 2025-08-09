'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api, { API_ROUTES } from '@/utils/api';

interface User {
  id: string;
  email: string;
  username?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  role: string;
  isActive?: boolean;
  overdraftLimit?: number | null;
}

const COUNTRY_CODES = [
  { code: '+1',  label: 'US/CA (+1)' },
  { code: '+90', label: 'TR (+90)' },
  { code: '+213', label: 'DZ (+213)' },
  { code: '+966', label: 'SA (+966)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+974', label: 'QA (+974)' },
  { code: '+965', label: 'KW (+965)' },
  { code: '+973', label: 'BH (+973)' },
  { code: '+968', label: 'OM (+968)' },
  { code: '+962', label: 'JO (+962)' },
  { code: '+964', label: 'IQ (+964)' },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // حقول خاصة
  const [newPassword, setNewPassword] = useState('');
  const [overdraft, setOverdraft] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<User>(API_ROUTES.users.byId(id));
        setUser(res.data);
        setOverdraft(
          res.data?.overdraftLimit != null ? String(res.data.overdraftLimit) : ''
        );
      } catch {
        setError('فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1) تحديث البيانات العامة
      await api.put(API_ROUTES.users.byId(id), {
        fullName: user.fullName ?? null,
        username: user.username ?? null,
        phoneNumber: user.phoneNumber ?? null,
        countryCode: user.countryCode ?? null,
        role: user.role,
        isActive: user.isActive,           // يتطلب دعم في الباك
      });

      // 2) تغيير كلمة السر (اختياري)
      if (newPassword.trim()) {
        await api.patch(API_ROUTES.users.setPassword(id), {
          password: newPassword.trim(),
        });
      }

      // 3) حد السالب (اختياري)
      if (overdraft.trim()) {
        const val = Number(overdraft);
        if (!isNaN(val)) {
          await api.patch(API_ROUTES.users.setOverdraft(id), {
            overdraftLimit: val,
          });
        }
      }

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

      {/* البريد (ثابت) */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">البريد الإلكتروني</label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full border p-2 rounded bg-[var(--bg-section)] cursor-not-allowed"
        />
      </div>

      {/* اسم المستخدم */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">اسم المستخدم</label>
        <input
          type="text"
          value={user.username ?? ''}
          onChange={(e) => setUser({ ...user, username: e.target.value })}
          className="w-full border p-2 rounded bg-[var(--bg-section)]"
        />
      </div>

      {/* الاسم الكامل */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">الاسم الكامل</label>
        <input
          type="text"
          value={user.fullName ?? ''}
          onChange={(e) => setUser({ ...user, fullName: e.target.value })}
          className="w-full border p-2 rounded bg-[var(--bg-section)]"
        />
      </div>

      {/* الهاتف مع رمز الدولة */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">رقم الجوال</label>
        <div className="flex gap-2">
          <select
            value={user.countryCode ?? ''}
            onChange={(e) => setUser({ ...user, countryCode: e.target.value })}
            className="border rounded p-2 bg-[var(--bg-section)]"
            style={{ minWidth: 120 }}
          >
            <option value="">رمز الدولة</option>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={user.phoneNumber ?? ''}
            onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
            className="flex-1 border rounded p-2 bg-[var(--bg-section)]"
          />
        </div>
      </div>

      {/* الدور */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">الدور</label>
        <select
          value={user.role}
          onChange={(e) => setUser({ ...user, role: e.target.value })}
          className="w-full border p-2 rounded bg-[var(--bg-section)]"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </div>

      {/* تفعيل/تعطيل */}
      <div className="mb-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={user.isActive ?? true}
            onChange={(e) => setUser({ ...user, isActive: e.target.checked })}
          />
          <span>الحساب فعّال</span>
        </label>
      </div>

      {/* تغيير كلمة السر (اختياري) */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">تغيير كلمة السر</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border p-2 rounded bg-[var(--bg-section)]"
          placeholder="اتركها فارغة إن لم ترغب بالتغيير"
        />
      </div>

      {/* حد السالب */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">حد السالب (overdraft)</label>
        <input
          type="number"
          step="0.01"
          value={overdraft}
          onChange={(e) => setOverdraft(e.target.value)}
          className="w-full border p-2 rounded bg-[var(--bg-section)]"
          placeholder="مثال: -30000"
        />
        <p className="text-xs text-gray-400 mt-1">
          يتيح للمستخدم إنشاء طلبات حتى لو كان رصيده 0 حتى يصل لهذا الحد السالب.
        </p>
      </div>

      {/* الأزرار */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-[var(--btn-primary-bg)] text-white px-4 py-2 rounded hover:bg-[var(--btn-primary-hover-bg)] disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
        <button
          onClick={() => router.back()}
          className="bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] px-4 py-2 rounded hover:bg-[var(--btn-secondary-hover-bg)]"
        >
          رجوع
        </button>
      </div>
    </div>
  );
}
