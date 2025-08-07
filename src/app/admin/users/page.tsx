'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { API_ROUTES } from '../../../utils/api'; // ✅ استدعاء الروابط الموحدة

interface User {
  id: string;
  email: string;
  role: string;
  balance: string | number | null;
  phoneNumber?: string;
  fullName?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>(''); // 🔹 للبحث

  // 🔹 تحميل المستخدمين
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('لم يتم تسجيل الدخول');
          return;
        }
        const res = await axios.get<User[]>(API_ROUTES.users.base, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch {
        setError('فشل تحميل بيانات المستخدمين');
      }
    };

    fetchUsers();
  }, []);

  // 🔹 حذف مستخدم
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('هل تريد حذف هذا المستخدم؟');
    if (!confirmDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(API_ROUTES.users.byId(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert('فشل حذف المستخدم');
    }
  };

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  // 🔹 فلترة حسب البحث
  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(term) ||
      (user.phoneNumber && user.phoneNumber.toLowerCase().includes(term)) ||
      (user.fullName && user.fullName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">قائمة المستخدمين</h1>

      {/* 🔹 مربع البحث */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="ابحث عن مستخدم..."
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

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-[var(--main-color)]">
            <th className="border p-2 text-right">البريد الإلكتروني</th>
            <th className="border p-2 text-right">الدور</th>
            <th className="border p-2 text-right">الرصيد</th>
            <th className="border p-2 text-right">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const num = Number(user.balance);
            const balanceDisplay =
              !isNaN(num) && user.balance !== null ? num.toFixed(2) : '-';

            return (
              <tr key={user.id} className="hover:bg-gray-600">
                <td className="border p-2 text-right">{user.email}</td>
                <td className="border p-2 text-right">{user.role}</td>
                <td className="border p-2 text-right">{balanceDisplay}</td>
                <td className="border p-2 text-right flex gap-2 justify-end">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    تعديل
                  </Link>
                  <button
                    onClick={() => handleDelete(user.id)}
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

      {filteredUsers.length === 0 && (
        <div className="text-gray-500 mt-4">لا توجد نتائج مطابقة</div>
      )}
    </div>
  );
}
