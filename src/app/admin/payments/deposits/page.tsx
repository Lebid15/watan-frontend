'use client';

import { useEffect, useMemo, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

type DepositStatus = 'pending' | 'approved' | 'rejected';

interface DepositRow {
  id: string;
  user?: { id: string; email?: string; fullName?: string } | null;
  method?: { id: string; name: string; type: string } | null;

  originalAmount: number | string;
  originalCurrency: string;
  walletCurrency: string;
  rateUsed: number | string;
  convertedAmount: number | string;

  note?: string | null;
  status: DepositStatus;
  createdAt: string;
}

const statusTabs: { key: DepositStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'pending', label: 'قيد المراجعة' },
  { key: 'approved', label: 'مقبول' },
  { key: 'rejected', label: 'مرفوض' },
];

// ✅ تنسيق أرقام مختصر (بدون أصفار زائدة)
const fmt = (v: number | string | undefined | null, maxFrac = 2) => {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  });
};

export default function AdminDepositsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<DepositStatus | 'all'>('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return rows;
    return rows.filter((r) => r.status === activeTab);
  }, [rows, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get<DepositRow[]>(API_ROUTES.admin.deposits.base);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'تعذّر جلب الإيداعات';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const setStatus = async (row: DepositRow, status: DepositStatus) => {
    const verb = status === 'approved' ? 'قبول' : 'رفض';
    if (!confirm(`تأكيد ${verb} طلب الإيداع؟`)) return;
    try {
      await api.patch(API_ROUTES.admin.deposits.setStatus(row.id), { status });
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || `تعذّر ${verb} الإيداع`;
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-gray-50 rounded-xl shadow p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">طلبات الإيداع</h2>
          <div className="flex items-center gap-2">
            {statusTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1 rounded text-sm border ${
                  activeTab === t.key
                    ? 'bg-[var(--btn-primary-bg)] text-white border border-gray-400'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 border border-red-200 rounded p-2 bg-red-50">
            {error}
          </div>
        )}

        {loading ? (
          <div>جارِ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">لا توجد سجلات.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-right bg-[var(--bg-main)]">
                  <th className="border border-gray-400 px-3 py-2">المستخدم</th>
                  <th className="border border-gray-400 px-3 py-2">الوسيلة</th>
                  <th className="border border-gray-400 px-3 py-2">المبلغ الأصلي</th>
                  <th className="border border-gray-400 px-3 py-2">سعر الصرف</th>
                  <th className="border border-gray-400 px-3 py-2">المبلغ بعد التحويل</th>
                  <th className="border border-gray-400 px-3 py-2">الحالة</th>
                  <th className="border border-gray-400 px-3 py-2">التاريخ</th>
                  <th className="border border-gray-400 px-3 py-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const userLabel =
                    r.user?.fullName ||
                    r.user?.email ||
                    (r.user?.id ? `#${r.user.id.slice(0, 6)}` : '—');

                  const methodLabel = r.method?.name || '—';

                  const original = `${fmt(r.originalAmount)} ${r.originalCurrency}`;
                  const rate = fmt(r.rateUsed, 6); // سيقصّر تلقائيًا
                  const converted = `${fmt(r.convertedAmount)} ${r.walletCurrency}`;

                  return (
                    <tr key={r.id} className="border-b">
                      <td className="border border-gray-400 px-3 py-2">{userLabel}</td>
                      <td className="border border-gray-400 px-3 py-2">{methodLabel}</td>
                      <td className="border border-gray-400 px-3 py-2">{original}</td>
                      <td className="border border-gray-400 px-3 py-2">{rate}</td>
                      <td className="border border-gray-400 px-3 py-2">{converted}</td>
                      <td className="border border-gray-400 px-3 py-2">
                        <span
                          className={`inline-block w-4 h-4 rounded-full ${
                            r.status === 'approved'
                              ? 'bg-green-500'
                              : r.status === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-yellow-400'
                          }`}
                        />
                      </td>
                      <td className="border border-gray-400 px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="border border-gray-400 px-3 py-2">
                        {r.status === 'pending' ? (
                          <div className="flex gap-3">
                            <button onClick={() => setStatus(r, 'approved')} className="text-green-700 hover:underline">
                              قبول
                            </button>
                            <button onClick={() => setStatus(r, 'rejected')} className="text-red-700 hover:underline">
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
