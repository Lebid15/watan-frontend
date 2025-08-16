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
  { key: 'all',      label: 'الكل' },
  { key: 'pending',  label: 'قيد المراجعة' },
  { key: 'approved', label: 'مقبول' },
  { key: 'rejected', label: 'مرفوض' },
];

// تنسيق مختصر للأرقام
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
    <div className="bg-bg-base text-text-primary p-6 min-h-screen">
      <section className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">طلبات الإيداع</h2>

          {/* أزرار الفلاتر بنفس أسلوب الثيم */}
          <div className="flex items-center gap-2">
            {statusTabs.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1 rounded text-sm border transition
                    ${isActive
                      ? 'bg-primary text-primary-contrast border-border'
                      : 'bg-bg-surface-alt text-text-primary border-border hover:opacity-90'
                    }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-3 text-sm text-danger border border-danger/30 rounded p-2 bg-danger/10">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-text-secondary">جارِ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-text-secondary">لا توجد سجلات.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm bg-bg-surface">
              <thead>
                {/* هيدر الجدول بخلفية الهيدر المعتمدة */}
                <tr className="bg-bg-surface-alt text-center">
                  <th className="border border-border px-3 py-2">المستخدم</th>
                  <th className="border border-border px-3 py-2">الوسيلة</th>
                  <th className="border border-border px-3 py-2">المبلغ الأصلي</th>
                  <th className="border border-border px-3 py-2">سعر الصرف</th>
                  <th className="border border-border px-3 py-2">المبلغ بعد التحويل</th>
                  <th className="border border-border px-3 py-2">الحالة</th>
                  <th className="border border-border px-3 py-2">التاريخ</th>
                  <th className="border border-border px-3 py-2">إجراءات</th>
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
                  const rate = fmt(r.rateUsed, 6);
                  const converted = `${fmt(r.convertedAmount)} ${r.walletCurrency}`;

                  return (
                    <tr key={r.id} className="text-center hover:bg-bg-surface-alt">
                      <td className="border border-border px-3 py-2">{userLabel}</td>
                      <td className="border border-border px-3 py-2">{methodLabel}</td>
                      <td className="border border-border px-3 py-2">{original}</td>
                      <td className="border border-border px-3 py-2">{rate}</td>
                      <td className="border border-border px-3 py-2">{converted}</td>
                      <td className="border border-border px-3 py-2">
                        <span
                          className={`inline-block w-4 h-4 rounded-full
                            ${r.status === 'approved'
                              ? 'bg-success'
                              : r.status === 'rejected'
                              ? 'bg-danger'
                              : 'bg-warning'}`}
                        />
                      </td>
                      <td className="border border-border px-3 py-2">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {r.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setStatus(r, 'approved')}
                              className="px-3 py-1 rounded bg-success text-text-inverse hover:brightness-110"
                            >
                              قبول
                            </button>
                            <button
                              onClick={() => setStatus(r, 'rejected')}
                              className="px-3 py-1 rounded bg-danger text-text-inverse hover:brightness-110"
                            >
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span className="text-text-secondary">—</span>
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
