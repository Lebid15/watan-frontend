// src/app/admin/users/page.tsx (أو مسارك الحالي)
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api, { API_ROUTES } from '@/utils/api';
import { currencySymbol, formatMoney } from '@/utils/format';

interface UserRow {
  id: string;
  email: string;
  username?: string | null;
  role: string;
  balance: number | string | null;
  currency?: { id: string; code: string } | null;
  isActive?: boolean;
  fullName?: string | null;
  phoneNumber?: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // حالة نافذة الإضافة (+)
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupUser, setTopupUser] = useState<UserRow | null>(null);
  const [topupAmount, setTopupAmount] = useState<string>('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<UserRow[]>(API_ROUTES.users.base);
      setUsers(res.data);
      setError('');
    } catch {
      setError('فشل تحميل بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا المستخدم؟')) return;
    try {
      await api.delete(API_ROUTES.users.byId(id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert('فشل حذف المستخدم');
    }
  };

  const handleToggleActive = async (u: UserRow) => {
    try {
      const next = !(u.isActive ?? true);
      await api.patch(API_ROUTES.users.toggleActive(u.id), { isActive: next });
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: next } : x))
      );
    } catch {
      alert('تعذّر تغيير الحالة');
    }
  };

  // فتح مودال الإضافة — نجلب بيانات المستخدم محدثة (اسم، رصيد، عملة)
  const openTopup = async (u: UserRow) => {
    try {
      const { data } = await api.get<UserRow>(API_ROUTES.users.byId(u.id));
      setTopupUser({
        ...u,
        ...data, // يضمن username / balance / currency الأحدث
      });
    } catch {
      // لو فشل الجلب نستخدم بيانات الصف الحالية
      setTopupUser(u);
    }
    setTopupAmount('');
    setTopupOpen(true);
  };

  const confirmTopup = async () => {
    if (!topupUser) return;
    const amount = Number(topupAmount);
    if (!amount || isNaN(amount)) {
      alert('أدخل مبلغًا صحيحًا');
      return;
    }
    try {
      await api.patch(API_ROUTES.users.addFunds(topupUser.id), { amount });
      setTopupOpen(false);
      setTopupUser(null);
      setTopupAmount('');
      await loadUsers();
    } catch {
      alert('فشل إضافة الرصيد');
    }
  };

  const filtered = users.filter((u) => {
    const t = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(t) ||
      (u.username ?? '').toLowerCase().includes(t) ||
      (u.fullName ?? '').toLowerCase().includes(t) ||
      (u.phoneNumber ?? '').toLowerCase().includes(t)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">المستخدمون</h1>

      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="ابحث بالبريد / الاسم / الجوال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[var(--main-color)] border rounded p-2 w-80"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="bg-[var(--btnbg-color)] px-3 py-2 rounded hover:bg-[var(--btnbghover-color)]"
          >
            مسح
          </button>
        )}
      </div>

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {loading ? (
        <div>جارٍ التحميل...</div>
      ) : (
        <>
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-[var(--main-color)]">
                <th className="border p-2 text-right">اسم المستخدم</th>
                <th className="border p-2 text-right">البريد الإلكتروني</th>
                <th className="border p-2 text-right">الرصيد</th>
                {/* ❌ أزلنا عمود العملة */}
                <th className="border p-2 text-right">الحالة</th>
                <th className="border p-2 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const num = Number(u.balance);
                const code = u.currency?.code;
                const sym = currencySymbol(code || undefined);
                const balanceDisplay =
                  u.balance !== null && !isNaN(num)
                    ? // الرمز قبل أو بعد حسب نوعه
                      formatMoney(num, code, {
                        symbolBefore: sym === '$' || sym === '€',
                      })
                    : '-';
                const isActive = u.isActive ?? true;

                return (
                  <tr key={u.id} className="hover:bg-gray-600">
                    <td className="border p-2 text-right">{u.username ?? '-'}</td>
                    <td className="border p-2 text-right">{u.email}</td>

                    {/* ✅ الرصيد مع رمز العملة مباشرة */}
                    <td className="border p-2 text-right">{balanceDisplay}</td>

                    <td className="border p-2 text-right">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-1 py-0.5 text-sm rounded ${
                          isActive
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-500 hover:bg-gray-600'
                        } text-white`}
                      >
                        {isActive ? 'نشط' : 'غير نشط'}
                      </button>
                    </td>
                    <td className="border p-2 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => openTopup(u)}
                        className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
                        title="إضافة إلى الرصيد"
                      >
                        +
                      </button>
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        تعديل
                      </Link>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-gray-500 mt-4">لا توجد نتائج مطابقة</div>
          )}
        </>
      )}

      {/* نافذة إضافة رصيد */}
      {topupOpen && topupUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-main)] rounded p-5 w-full max-w-md">
            <h2 className="text-lg font-bold mb-3">إضافة رصيد للمستخدم</h2>

            {/* ✅ اسم المستخدم بدل الإيميل إن وُجد */}
            <div className="mb-2 text-sm text-gray-300">
              المستخدم:{' '}
              <span className="font-semibold">
                {topupUser.username?.trim() ? topupUser.username : topupUser.email}
              </span>
            </div>

            {/* ✅ عملة المستخدم بالرمز والكود */}
            <div className="mb-2 text-sm text-gray-300">
              عملة المستخدم:{' '}
              <span className="font-semibold">
                {currencySymbol(topupUser.currency?.code || undefined)}{' '}
                ({topupUser.currency?.code ?? '-'})
              </span>
            </div>

            {/* ✅ الرصيد السابق */}
            <div className="mb-4 text-sm text-gray-300">
              الرصيد السابق هو:{' '}
              <span className="font-semibold">
                {topupUser.balance !== null
                  ? formatMoney(Number(topupUser.balance), topupUser.currency?.code, {
                      symbolBefore:
                        currencySymbol(topupUser.currency?.code || undefined) === '$' ||
                        currencySymbol(topupUser.currency?.code || undefined) === '€',
                    })
                  : '-'}
              </span>
            </div>

            <div className="mb-4">
              <label className="block mb-1">المبلغ</label>
              <input
                type="number"
                step="0.0001"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full bg-[var(--bg-section)] border p-2 rounded text-black"
                placeholder={`مثال: 100 ${currencySymbol(topupUser.currency?.code || undefined)}`}
                inputMode="decimal"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setTopupOpen(false);
                  setTopupUser(null);
                  setTopupAmount('');
                }}
                className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
              >
                إلغاء
              </button>
              <button
                onClick={confirmTopup}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                تأكيد الإضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
