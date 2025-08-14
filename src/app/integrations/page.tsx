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
      const { data } = await api.get<IntegrationRow[]>(API_ROUTES.admin.integrations.base);
      setItems(data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load integrations');
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
      setError(e?.response?.data?.message || e?.message || 'Failed to create integration');
    } finally {
      setSubmitting(false);
    }
  };

  const placeholderForBaseUrl =
    form.provider === 'znet'
      ? 'http://bayi.siteadressinstead.com'
      : 'https://api.x-stor.net';

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">إعدادات API</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 rounded-md bg-[var(--btn-primary-bg)] text-white hover:opacity-90"
            disabled={loading}
          >
            {loading ? 'جاري التحميل..' : 'تحميل'}
          </button>

          <button
            onClick={() => setOpenAdd(true)}
            className="px-3 py-2 rounded-md bg-[var(--btn-primary-bg)] text-white hover:opacity-90"
          >
            اضف API
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="overflow-auto border border-gray-400 rounded-lg">
        <table className="min-w-[800px] w-full text-sm">
          <thead className="bg-[var(--bg-main)]">
            <tr>
              <th className="px-3 border border-gray-400 py-2 font-medium">الإسم</th>
              <th className="px-3 border border-gray-400 py-2 font-medium">النوع</th>
              <th className="px-3 border border-gray-400 py-2 font-medium">الرابط</th>
              <th className="px-3 border border-gray-400 py-2 font-medium">الرصيد</th>
              <th className="px-3 border border-gray-400 py-2 font-medium">العمليات</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[var(--text-secondary)]">
                  لا يوجد جهات تم الربط معها بعد
                </td>
              </tr>
            )}

            {items.map((it) => (
              <tr key={it.id} className="border-t border-gray-400 bg-gray-50">
                <td className="border border-gray-400 px-3 py-2">{it.name}</td>
                <td className="border border-gray-400 px-3 py-2 uppercase">{it.provider}</td>
                <td className="border border-gray-400 px-3 py-2">{it.baseUrl || '—'}</td>
                <td className="border border-gray-400 px-3 py-2">
                  {balances[it.id] !== undefined
                    ? (balances[it.id] ?? '—')
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleTest(it.id)}
                      disabled={testing === it.id}
                      className="px-3 py-1.5 rounded-md bg-gray-500 text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {testing === it.id ? 'يختبر..' : 'اختبار'}
                    </button>
                    <button
                      onClick={() => handleRefreshBalance(it.id)}
                      disabled={refreshing === it.id}
                      className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {refreshing === it.id ? 'يتم التحديث..' : 'تحديث'}
                    </button>
                    <button
                      onClick={() => goPackages(it.id)}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:opacity-90"
                    >
                      ربط
                    </button>
                    <button
                      onClick={() => goEdit(it.id)}
                      className="px-3 py-1.5 rounded-md bg-yellow-700 text-white hover:opacity-90"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(it.id)}
                      disabled={deleting === it.id}
                      className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {deleting === it.id ? 'يحذف..' : 'حذف'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
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
          <div className="w-full max-w-lg rounded-xl bg-white text-gray-900 shadow-lg">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Integration</h2>
              <button onClick={() => setOpenAdd(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm mb-1">الاسم</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="هذه الاسم خاص بك"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">اختر الجهة</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as ProviderKind })}
                >
                  <option value="barakat">barakat</option>
                  <option value="apstore">apstore</option>
                  <option value="znet">znet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">الرابط</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  placeholder={placeholderForBaseUrl}
                />
              </div>

              {(form.provider === 'barakat' || form.provider === 'apstore') && (
                <div>
                  <label className="block text-sm mb-1">API Token</label>
                  <input
                    className="w-full border rounded-md px-3 py-2"
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
                      className="w-full border rounded-md px-3 py-2"
                      value={form.kod}
                      onChange={(e) => setForm({ ...form, kod: e.target.value })}
                      placeholder="54421999998"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">كلمة السر</label>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={form.sifre}
                      onChange={(e) => setForm({ ...form, sifre: e.target.value })}
                      placeholder="*******"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setOpenAdd(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                إلغاء
              </button>
              <button
                onClick={submitAdd}
                disabled={submitting || !form.name.trim() || !form.baseUrl.trim()}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:opacity-90 disabled:opacity-50"
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
