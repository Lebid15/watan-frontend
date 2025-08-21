'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { API_BASE_URL } from '@/utils/api';

type SupervisorRow = {
  id: string;
  name: string;
  email: string;
  usersCount: number;
  approvedOrdersCount: number;
};

type SupervisorDetails = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  usersCount: number;
  approvedOrders: number;
  rejectedOrders: number;
  pendingOrders: number;
  totalProfit: number;
  balance: number;
};

export default function StatsDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<any>(null);

  // للـ Modal
  const [openDetailsFor, setOpenDetailsFor] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<SupervisorDetails | null>(null);

  const title = useMemo(() => {
    switch (id) {
      case 'supervisors':
        return 'إحصائيات المشرفين';
      case 'users':
        return 'إحصائيات المستخدمين';
      case 'orders':
        return 'إحصائيات الطلبات';
      default:
        return 'إحصائيات';
    }
  }, [id]);

  // تحميل بيانات القسم حسب id
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (id === 'supervisors') {
          const res = await api.get(`${API_BASE_URL}/admin/stats/supervisors`);
          if (!mounted) return;
          setList(res.data as SupervisorRow[]);
        } else if (id === 'users') {
          const res = await api.get(`${API_BASE_URL}/admin/stats/users`);
          if (!mounted) return;
          setList(res.data);
        } else if (id === 'orders') {
          const res = await api.get(`${API_BASE_URL}/admin/stats/orders`);
          if (!mounted) return;
          setList(res.data);
        } else {
          setList(null);
        }
      } catch (e) {
        setError('فشل في جلب البيانات');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  // فتح التفاصيل (مودال) لمشرف محدد
  async function handleOpenDetails(adminId: string) {
    try {
      setOpenDetailsFor(adminId);
      setDetailsLoading(true);
      setDetails(null);
      const res = await api.get(`${API_BASE_URL}/admin/stats/supervisors/${adminId}`);
      setDetails(res.data as SupervisorDetails);
    } catch {
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  // تغيير كلمة المرور (بشكل مبسّط عبر prompt)
  async function handleChangePassword(adminId: string) {
    const newPass = prompt('أدخل كلمة المرور الجديدة للمشرف:');
    if (!newPass) return;

    try {
      // ⚠️ عدّل هذا المسار ليتوافق مع باكك الفعلي لتغيير كلمة المرور
      // يوجد لديك dto باسم admin-set-password، غالبًا الراوت داخل user.controller
      // مثال محتمل:
      await api.post(`${API_BASE_URL}/user/admin/set-password`, {
        userId: adminId,
        password: newPass,
      });

      alert('تم تغيير كلمة المرور بنجاح ✅');
    } catch (e) {
      alert('فشل تغيير كلمة المرور ❌');
    }
  }

  function renderContent() {
    if (loading) return <p>⏳ جاري التحميل...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!list) return <p>⚠️ لا توجد بيانات</p>;

    if (id === 'supervisors') {
      const rows = list as SupervisorRow[];
      return (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded shadow">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="px-3 py-2 border text-right">المشرف</th>
                  <th className="px-3 py-2 border text-right">الإيميل</th>
                  <th className="px-3 py-2 border text-center">عدد المستخدمين</th>
                  <th className="px-3 py-2 border text-center">الطلبات المقبولة</th>
                  <th className="px-3 py-2 border text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 text-sm">
                    <td className="px-3 py-2 border">{r.name || '-'}</td>
                    <td className="px-3 py-2 border">{r.email}</td>
                    <td className="px-3 py-2 border text-center">{r.usersCount}</td>
                    <td className="px-3 py-2 border text-center">{r.approvedOrdersCount}</td>
                    <td className="px-3 py-2 border text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenDetails(r.id)}
                          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          تفاصيل
                        </button>
                        <button
                          onClick={() => handleChangePassword(r.id)}
                          className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600"
                        >
                          تغيير كلمة المرور
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-gray-500">
                      لا يوجد مشرفون حتى الآن.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal التفاصيل */}
          {openDetailsFor && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white w-full max-w-2xl rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">تفاصيل المشرف</h2>
                  <button
                    onClick={() => setOpenDetailsFor(null)}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    إغلاق
                  </button>
                </div>

                {detailsLoading && <p>⏳ جاري تحميل التفاصيل...</p>}
                {!detailsLoading && details && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500">الاسم:</span> {details.name}</div>
                      <div><span className="text-gray-500">الإيميل:</span> {details.email}</div>
                      <div><span className="text-gray-500">المستخدمون:</span> {details.usersCount}</div>
                      <div><span className="text-gray-500">الرصيد:</span> {details.balance}</div>
                      <div><span className="text-gray-500">تاريخ الإنشاء:</span> {new Date(details.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-semibold mb-2">الطلبات</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded bg-green-50 border">✅ المقبولة: <b>{details.approvedOrders}</b></div>
                        <div className="p-2 rounded bg-red-50 border">❌ المرفوضة: <b>{details.rejectedOrders}</b></div>
                        <div className="p-2 rounded bg-yellow-50 border">⏳ المعلّقة: <b>{details.pendingOrders}</b></div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-semibold mb-1">إجمالي الأرباح</h3>
                      <div className="p-2 rounded bg-blue-50 border">
                        💰 <b>{details.totalProfit}</b>
                      </div>
                    </div>
                  </div>
                )}

                {!detailsLoading && !details && (
                  <p className="text-red-600">تعذّر تحميل تفاصيل هذا المشرف.</p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    // باقي الأقسام: users / orders (نصوص مبدئية)
    if (id === 'users') {
      return (
        <div className="space-y-2 mt-4">
          <p>👥 العدد الكلي: {list.total}</p>
          <p>✅ نشطون: {list.active}</p>
          <p>🚫 غير نشطين: {list.inactive}</p>
        </div>
      );
    }

    if (id === 'orders') {
      return (
        <div className="space-y-2 mt-4">
          <p>📦 إجمالي الطلبات: {list.total}</p>
          <p>✅ المقبولة: {list.approved}</p>
          <p>❌ المرفوضة: {list.rejected}</p>
        </div>
      );
    }

    return <p>⚠️ لم يتم العثور على إحصائيات لهذا القسم.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{title}</h1>
      {renderContent()}
    </div>
  );
}
