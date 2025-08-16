'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { API_ROUTES } from '@/utils/api';

type ProviderKind = 'barakat' | 'apstore' | 'znet';

type IntegrationRow = {
  id: string;
  name: string;
  provider: ProviderKind;
  baseUrl?: string;
  apiToken?: string;
  kod?: string;
  sifre?: string;
};

export default function AdminIntegrationsPage() {
  const router = useRouter();

  const [items, setItems] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [testing, setTesting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, number | null>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  // modal state
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    provider: ProviderKind;
    baseUrl: string;
    apiToken: string;
    kod: string;
    sifre: string;
  }>({
    name: '',
    provider: 'barakat',
    baseUrl: '',
    apiToken: '',
    kod: '',
    sifre: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<IntegrationRow[]>(
        API_ROUTES.admin.integrations.base
      );
      setItems(data || []);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || 'Failed to load integrations'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // جلب الرصيد لكل تكامل تلقائيًا بعد تحميل القائمة
  useEffect(() => {
    if (items.length > 0) {
      items.forEach((it) => handleRefreshBalance(it.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await api.post(API_ROUTES.admin.integrations.test(id));
    } catch {
      // تجاهل الخطأ هنا
    } finally {
      setTesting(null);
    }
  };

  const handleRefreshBalance = async (id: string) => {
    setRefreshing(id);
    try {
      const { data } = await api.post<{ balance: number }>(
        API_ROUTES.admin.integrations.refreshBalance(id)
      );
      setBalances((b) => ({ ...b, [id]: data?.balance ?? null }));
    } catch {
      setBalances((b) => ({ ...b, [id]: null }));
    } finally {
      setRefreshing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    setDeleting(id);
    try {
      await api.delete(API_ROUTES.admin.integrations.byId(id));
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      // تجاهل
    } finally {
      setDeleting(null);
    }
  };

  const goPackages = (id: string) => {
    router.push(`/admin/integrations/${id}`);
  };

  const goEdit = (id: string) => {
    router.push(`/admin/integrations/${id}/edit`);
  };

  // submit add integration
  const submitAdd = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        name: form.name.trim(),
        provider: form.provider,
        baseUrl: form.baseUrl || undefined,
      };

      if (form.provider === 'barakat' || form.provider === 'apstore') {
        payload.apiToken = form.apiToken || undefined;
      } else if (form.provider === 'znet') {
        payload.kod = form.kod || undefined;
        payload.sifre = form.sifre || undefined;
      }

      await api.post(API_ROUTES.admin.integrations.base, payload);
      setOpenAdd(false);
      setForm({
        name: '',
        provider: 'barakat',
        baseUrl: '',
        apiToken: '',
        kod: '',
        sifre: '',
      });
      await load();
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || 'Failed to create integration'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const placeholderForBaseUrl =
    form.provider === 'znet'
      ? 'http://bayi.siteadressinstead.com'
      : 'https://api.x-stor.net';

  return (
    <div className="p-4 md:p-6 text-text-primary">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">إعدادات API</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="btn btn-primary disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'جاري التحميل..' : 'تحميل'}
          </button>

          <button
            onClick={() => setOpenAdd(true)}
            className="btn btn-primary"
          >
            اضف API
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-md border border-danger/40 bg-danger/10 text-danger">
          {error}
        </div>
      )}

      <div className="overflow-auto border border-border rounded-lg bg-bg-surface">
        <table className="min-w-[800px] w-full text-sm table">
          <thead className="bg-bg-surface-alt">
            <tr>
              <th className="px-3 py-2 font-medium border border-border text-right">الإسم</th>
              <th className="px-3 py-2 font-medium border border-border text-right">النوع</th>
              <th className="px-3 py-2 font-medium border border-border text-right">الرابط</th>
              <th className="px-3 py-2 font-medium border border-border text-right">الرصيد</th>
              <th className="px-3 py-2 font-medium border border-border text-right">العمليات</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-text-secondary"
                >
                  لا يوجد جهات تم الربط معها بعد
                </td>
              </tr>
            )}

            {items.map((it) => (
              <tr
                key={it.id}
                className="border-t border-border bg-bg-surface hover:bg-primary/5"
              >
                <td className="border border-border px-3 py-2">{it.name}</td>
                <td className="border border-border px-3 py-2 uppercase">{it.provider}</td>
                <td className="border border-border px-3 py-2">{it.baseUrl || '—'}</td>
                <td className="border border-border px-3 py-2">
                  {balances[it.id] !== undefined
                    ? (balances[it.id] ?? '—')
                    : <span className="text-text-secondary">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleTest(it.id)}
                      disabled={testing === it.id}
                      className="btn btn-secondary disabled:opacity-50"
                    >
                      {testing === it.id ? 'يختبر..' : 'اختبار'}
                    </button>

                    <button
                      onClick={() => handleRefreshBalance(it.id)}
                      disabled={refreshing === it.id}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      {refreshing === it.id ? 'يتم التحديث..' : 'تحديث'}
                    </button>

                    <button
                      onClick={() => goPackages(it.id)}
                      className="btn bg-success text-text-inverse hover:brightness-110"
                    >
                      ربط
                    </button>

                    <button
                      onClick={() => goEdit(it.id)}
                      className="btn bg-warning text-text-inverse hover:brightness-110"
                    >
                      تعديل
                    </button>

                    <button
                      onClick={() => handleDelete(it.id)}
                      disabled={deleting === it.id}
                      className="btn bg-danger text-text-inverse hover:brightness-110 disabled:opacity-50"
                    >
                      {deleting === it.id ? 'يحذف..' : 'حذف'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-text-secondary">
                  يحمل...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal إضافة تكامل */}
      {openAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-bg-surface text-text-primary shadow-lg border border-border">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Integration</h2>
              <button
                onClick={() => setOpenAdd(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm mb-1">الاسم</label>
                <input
                  className="input w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="هذه الاسم خاص بك"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">اختر الجهة</label>
                <select
                  className="input w-full"
                  value={form.provider}
                  onChange={(e) =>
                    setForm({ ...form, provider: e.target.value as ProviderKind })
                  }
                >
                  <option value="barakat">barakat</option>
                  <option value="apstore">apstore</option>
                  <option value="znet">znet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">الرابط</label>
                <input
                  className="input w-full"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  placeholder={placeholderForBaseUrl}
                />
              </div>

              {(form.provider === 'barakat' || form.provider === 'apstore') && (
                <div>
                  <label className="block text-sm mb-1">API Token</label>
                  <input
                    className="input w-full"
                    value={form.apiToken}
                    onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
                    placeholder="ادخل التوكن"
                  />
                </div>
              )}

              {form.provider === 'znet' && (
                <>
                  <div>
                    <label className="block text-sm mb-1">رقم الجوال</label>
                    <input
                      className="input w-full"
                      value={form.kod}
                      onChange={(e) => setForm({ ...form, kod: e.target.value })}
                      placeholder="54421999998"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">كلمة السر</label>
                    <input
                      className="input w-full"
                      value={form.sifre}
                      onChange={(e) => setForm({ ...form, sifre: e.target.value })}
                      placeholder="*******"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2">
              <button
                onClick={() => setOpenAdd(false)}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
              <button
                onClick={submitAdd}
                disabled={submitting || !form.name.trim() || !form.baseUrl.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                {submitting ? 'يحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
