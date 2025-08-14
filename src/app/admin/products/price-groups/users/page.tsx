'use client';

import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

interface PriceGroup {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  priceGroupId?: string | null;
}

export default function LinkUsersPricesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<PriceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🟢 جلب المستخدمين مع ترتيب ثابت حسب البريد
  const fetchUsers = async (): Promise<User[]> => {
    const res = await api.get<any[]>(API_ROUTES.users.withPriceGroup);

    return res.data
      .map((u) => ({
        id: u.id,
        email: u.email,
        priceGroupId: u.priceGroup?.id ?? null,
      }))
      .sort((a, b) => a.email.localeCompare(b.email, 'ar'));
  };

  const fetchGroups = async (): Promise<PriceGroup[]> => {
    const res = await api.get<PriceGroup[]>(API_ROUTES.priceGroups.base);
    return res.data;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    Promise.all([fetchUsers(), fetchGroups()])
      .then(([usersData, groupsData]) => {
        setUsers(usersData);
        setGroups(groupsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('خطأ أثناء جلب البيانات:', err);

        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          setError('حدث خطأ أثناء تحميل البيانات.');
          setLoading(false);
        }
      });
  }, []);

  // ✅ تحديث المستخدم في مكانه دون كسر الترتيب
  const handleChangeGroup = async (userId: string, newGroupId: string | null) => {
    try {
      await api.patch(`/users/${userId}/price-group`, {
        priceGroupId: newGroupId,
      });

      setUsers((prevUsers) => {
        const updatedUsers = [...prevUsers];
        const idx = updatedUsers.findIndex((u) => u.id === userId);
        if (idx !== -1) {
          updatedUsers[idx] = { ...updatedUsers[idx], priceGroupId: newGroupId };
        }
        return updatedUsers;
      });
    } catch (err) {
      console.error('خطأ أثناء تحديث مجموعة السعر:', err);
      alert('فشل تحديث مجموعة السعر للمستخدم.');
    }
  };

  if (loading) return <div className="p-4">جاري التحميل...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">ربط المستخدمين بمجموعات الأسعار</h1>
      <table className="min-w-full border border-gray-400">
        <thead className="bg-[var(--bg-main)] text-right">
          <tr>
            <th className="border border-gray-400 p-2">المستخدم</th>
            <th className="border border-gray-400 p-2">مجموعة السعر</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border border-gray-400 p-2">{user.email}</td>
              <td className="border border-gray-400 p-2">
                <select
                  className="bg-gray-200 border border-gray-400 text-sm p-1"
                  value={user.priceGroupId || ''}
                  onChange={(e) =>
                    handleChangeGroup(user.id, e.target.value || null)
                  }
                >
                  <option value="">لا يوجد</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
