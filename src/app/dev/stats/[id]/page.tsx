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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function StatsDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // قوائم للأقسام الأخرى
  const [list, setList] = useState<any>(null);

  // تفاصيل المشرف
  const [supervisor, setSupervisor] = useState<SupervisorDetails | null>(null);
  const isUuid = UUID_RE.test(id || '');
  const isSection = id === 'supervisors' || id === 'users' || id === 'orders';

  // فلاتر التاريخ
  const [from, setFrom] = useState<string>(''); // YYYY-MM-DD
  const [to, setTo] = useState<string>('');     // YYYY-MM-DD
  const [filterBusy, setFilterBusy] = useState(false);

  const title = useMemo(() => {
    if (id === 'supervisors') return 'إحصائيات المشرفين';
    if (id === 'users') return 'إحصائيات المستخدمين';
    if (id === 'orders') return 'إحصائيات الطلبات';
    if (isUuid) return 'تفاصيل المشرف';
    return 'إحصائيات';
  }, [id, isUuid]);

  function toIsoDayStart(dStr?: string) {
    if (!dStr) return undefined;
    const d = new Date(dStr + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  }
  function toIsoDayEnd(dStr?: string) {
    if (!dStr) return undefined;
    const d = new Date(dStr + 'T23:59:59.999');
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  }

  async function fetchSupervisorDetails() {
    setFilterBusy(true);
    try {
      const params: Record<string, string> = {};
      const f = toIsoDayStart(from);
      const t = toIsoDayEnd(to);
      if (f) params.from = f;
      if (t) params.to = t;

      const res = await api.get(`${API_BASE_URL}/admin/stats/supervisors/${id}`, { params });
      setSupervisor(res.data as SupervisorDetails);
    } finally {
      setFilterBusy(false);
    }
  }

  function applyPreset(days: number) {
    // من اليوم ناقص (days-1) إلى اليوم
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    const fmt = (d: Date) =>
      String(d.getFullYear()) +
      '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');

    setFrom(fmt(start));
    setTo(fmt(end));
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);
        setError(null);
        setList(null);
        setSupervisor(null);

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
        } else if (isUuid) {
          // تحميل أولي بدون فلاتر
          const res = await api.get(`${API_BASE_URL}/admin/stats/supervisors/${id}`);
          if (!mounted) return;
          setSupervisor(res.data as SupervisorDetails);
        } else {
          setList(null);
        }
      } catch (e) {
        setError('فشل في جلب البيانات');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => { mounted = false; };
  }, [id, isUuid]);

  if (loading) return <div className="p-6">⏳ جاري التحميل...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // === تفاصيل مشرف عندما المسار /dev/stats/<UUID> ===
  if (isUuid) {
    if (!supervisor) {
      return <div className="p-6">تعذّر تحميل التفاصيل.</div>;
    }
    const d = supervisor;

    return (
      <div className="p-6 space-y-4">
        <h1 className="text-xl font-bold">{title}</h1>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-800">الاسم:</span> {d.name || '-'}</div>
          <div><span className="text-gray-800">الإيميل:</span> {d.email}</div>
          <div><span className="text-gray-800">المستخدمون:</span> {d.usersCount}</div>
          <div><span className="text-gray-800">الرصيد:</span> {d.balance}</div>
          <div><span className="text-gray-800">تاريخ الإنشاء:</span> {new Date(d.createdAt).toLocaleString()}</div>
        </div>

        {/* ===== شريط فلاتر التاريخ ===== */}
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">من تاريخ</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>

            <button
              onClick={fetchSupervisorDetails}
              disabled={filterBusy}
              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-sm"
            >
              تطبيق الفلتر
            </button>

            <button
              onClick={() => { setFrom(''); setTo(''); fetchSupervisorDetails(); }}
              disabled={filterBusy}
              className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            >
              مسح الفلاتر
            </button>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-300">سريع:</span>
              <button
                onClick={() => { applyPreset(7); }}
                className="px-2 py-1 rounded border text-xs text-gray-200 hover:text-gray-800 hover:bg-white"
              >
                آخر 7 أيام
              </button>
              <button
                onClick={() => { applyPreset(30); }}
                className="px-2 py-1 rounded border text-xs text-gray-200 hover:text-gray-800 hover:bg-white"
              >
                آخر 30 يومًا
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">الطلبات</h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 rounded bg-green-50 border">✅ المقبولة: <b>{d.approvedOrders}</b></div>
            <div className="p-2 rounded bg-red-50 border">❌ المرفوضة: <b>{d.rejectedOrders}</b></div>
            <div className="p-2 rounded bg-yellow-50 border">⏳ المعلّقة: <b>{d.pendingOrders}</b></div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-1">إجمالي الأرباح</h3>
          <div className="p-2 rounded bg-blue-50 border text-sm">
            💰 <b>{d.totalProfit}</b>
          </div>
        </div>
      </div>
    );
  }

  // === أقسام الجداول الأخرى ===
  if (id === 'supervisors') {
    const rows = (list as SupervisorRow[]) || [];
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">{title}</h1>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="px-3 py-2 border text-right">المشرف</th>
                <th className="px-3 py-2 border text-right">الإيميل</th>
                <th className="px-3 py-2 border text-center">عدد المستخدمين</th>
                <th className="px-3 py-2 border text-center">الطلبات المقبولة</th>
                <th className="px-3 py-2 border text-center">تفاصيل</th>
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
                    <a
                      href={`/dev/stats/${r.id}`}
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 inline-block"
                    >
                      تفاصيل
                    </a>
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
      </div>
    );
  }

  if (id === 'users') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">{title}</h1>
        <div className="space-y-2">
          <p>👥 العدد الكلي: {list?.total}</p>
          <p>✅ نشطون: {list?.active}</p>
          <p>🚫 غير نشطين: {list?.inactive}</p>
        </div>
      </div>
    );
  }

  if (id === 'orders') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">{title}</h1>
        <div className="space-y-2">
          <p>📦 إجمالي الطلبات: {list?.total}</p>
          <p>✅ المقبولة: {list?.approved}</p>
          <p>❌ المرفوضة: {list?.rejected}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <p>⚠️ لم يتم العثور على هذا القسم.</p>
    </div>
  );
}
