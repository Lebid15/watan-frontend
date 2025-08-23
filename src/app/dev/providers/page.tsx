'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';

type ProviderKind = 'barakat' | 'apstore' | 'znet';

type Provider = {
  id: string;
  name: string;
  provider: ProviderKind;
  baseUrl?: string | null;
};

type ImportCatalogResp = {
  ok?: boolean;
  providerId?: string;
  createdProducts?: number;
  updatedProducts?: number;
  createdPackages?: number;
  updatedPackages?: number;
  total?: number;
};

type EnableProviderResp = {
  ok: boolean;
  providerId: string;
  productsTouched: number;
  createdPackages: number;
  skippedPackages: number;
  totalCatalogPackages: number;
};

// helper للتعامل مع {items:[]} أو array مباشرة
function extractItems<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as any).items)) {
    return (data as any).items as T[];
  }
  return [];
}

export default function ProvidersPage() {
  const [items, setItems] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // رسائل الصفحة
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // نافذة إضافة/تعديل مزوّد (ديناميكية حسب النوع)
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
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

  async function load() {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await api.get('/admin/providers/dev');
      const list: Provider[] = extractItems<Provider>(res.data);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    function attempt() {
      const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!t) {
        // إعادة المحاولة بعد زمن قصير لتفادي سباق الحفظ بعد تسجيل الدخول مباشرة
        setTimeout(() => { if (!cancelled) attempt(); }, 150);
        return;
      }
      load().catch((e) => console.warn('[ProvidersPage] load failed', e));
    }
    attempt();
    return () => { cancelled = true; };
  }, []);

  // فتح مودال إضافة
  function openCreate() {
    setIsEdit(false);
    setEditId(null);
    setForm({ name: '', provider: 'barakat', baseUrl: '', apiToken: '', kod: '', sifre: '' });
    setOpenModal(true);
  }

  // فتح مودال تعديل
  function openEdit(p: Provider) {
    setIsEdit(true);
    setEditId(p.id);
    setForm({
      name: p.name ?? '',
      provider: p.provider,
      baseUrl: p.baseUrl ?? '',
      apiToken: '',
      kod: '',
      sifre: '',
    });
    setOpenModal(true);
  }

  // إنشاء مزوّد مطوّر
  async function submitCreate() {
    setError('');
    setNotice('');
    try {
      const payload: any = {
        name: form.name.trim(),
        provider: form.provider,
        baseUrl: form.baseUrl.trim() || undefined,
      };

      if (form.provider === 'barakat' || form.provider === 'apstore') {
        payload.apiToken = form.apiToken.trim() || undefined;
      } else if (form.provider === 'znet') {
        payload.kod = form.kod.trim() || undefined;
        payload.sifre = form.sifre.trim() || undefined;
      }

      await api.post('/admin/providers/dev', payload);
      setNotice('✅ تم إضافة المزوّد');
      setOpenModal(false);
      await load();
    } catch (e: any) {
      setError(`⚠️ فشل الإضافة: ${e?.response?.data?.message || e.message}`);
    }
  }

  // تعديل مزوّد مطوّر
  async function submitEdit() {
    if (!editId) return;
    setError('');
    setNotice('');
    try {
      const payload: any = {
        name: form.name.trim() || undefined,
        baseUrl: form.baseUrl.trim() || undefined,
      };

      if (form.provider === 'barakat' || form.provider === 'apstore') {
        if (form.apiToken.trim()) payload.apiToken = form.apiToken.trim();
      } else if (form.provider === 'znet') {
        if (form.kod.trim()) payload.kod = form.kod.trim();
        if (form.sifre.trim()) payload.sifre = form.sifre.trim();
      }

      await api.patch(`/admin/providers/dev/${editId}`, payload);
      setNotice('✅ تم تحديث المزوّد');
      setOpenModal(false);
      await load();
    } catch (e: any) {
      setError(`⚠️ فشل التعديل: ${e?.response?.data?.message || e.message}`);
    }
  }

  // حذف مزوّد مطوّر
  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذا المزوّد؟')) return;
    setDeletingId(id);
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/providers/dev/${id}`);
      setNotice('🗑️ تم الحذف');
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(`⚠️ فشل الحذف: ${e?.response?.data?.message || e.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  // استيراد/تحديث الكتالوج
  async function handleImport(providerId: string) {
    setBusyId(providerId);
    setError('');
    setNotice('');
    try {
      const { data } = await api.post<ImportCatalogResp>(`/admin/providers/${providerId}/catalog-import`);
      setNotice(`تم الاستيراد: منتجات ${data.createdProducts ?? 0} / باقات ${data.createdPackages ?? 0}`);
    } catch (e: any) {
      setError(`فشل الاستيراد: ${e?.response?.data?.message || e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  // تفعيل الكتالوج للمتجر
  async function handleEnableAllForProvider(providerId: string) {
    setBusyId(providerId);
    setError('');
    setNotice('');
    try {
      const { data } = await api.post<EnableProviderResp>(`/admin/catalog/providers/${providerId}/enable-all`);
      setNotice(`✅ تفعيل: منتجات ${data.productsTouched} / باقات جديدة ${data.createdPackages} / متجاهلة ${data.skippedPackages}`);
    } catch (e: any) {
      setError(`⚠️ فشل التفعيل: ${e?.response?.data?.message || e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  // متطلبات الحقول حسب النوع
  const isBarakatOrAp = form.provider === 'barakat' || form.provider === 'apstore';
  const isZnet = form.provider === 'znet';

  const placeholderForBaseUrl =
    form.provider === 'znet'
      ? 'http://bayi.siteadressinstead.com'
      : 'https://api.x-stor.net';

  const canSaveCreate =
    form.name.trim().length > 1 &&
    (isBarakatOrAp ? form.apiToken.trim().length > 0 : true) &&
    (isZnet ? form.kod.trim().length > 0 && form.sifre.trim().length > 0 : true);

  const canSaveEdit = form.name.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* العنوان + زر إضافة */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">المزوّدون</h1>
        <button
          onClick={openCreate}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:opacity-90"
        >
          ➕ إضافة مزوّد
        </button>
      </div>

      {/* رسائل الصفحة */}
      {notice && (
        <div className="mb-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-green-800 shadow">
          ✅ {notice}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow">
          ⚠️ {error}
        </div>
      )}

      {/* الجدول */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="min-w-full text-sm ">
          <thead className="bg-zinc-200">
            <tr>
              <th className="border border-gray-400 text-start px-3 py-2">الاسم</th>
              <th className="border border-gray-400 text-start px-3 py-2">النوع</th>
              <th className="border border-gray-400 text-start px-3 py-2">Base URL</th>
              <th className="border border-gray-400 text-start px-3 py-2">عمليات الكتالوج</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="border border-gray-400 px-3 py-2 font-semibold">{p.name}</td>
                <td className="border border-gray-400 px-3 py-2 uppercase">{p.provider}</td>
                <td className="border border-gray-400 px-3 py-2 text-xs text-zinc-600">{p.baseUrl ?? '-'}</td>
                <td className="border border-gray-400 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImport(p.id)}
                      disabled={busyId === p.id}
                      className={`px-3 py-1.5 rounded-lg text-white ${busyId === p.id ? 'bg-zinc-400' : 'bg-gray-700  hover:opacity-90'}`}
                    >
                      {busyId === p.id ? '...' : 'استيراد/تحديث'}
                    </button>
                    <button
                      onClick={() => handleEnableAllForProvider(p.id)}
                      disabled={busyId === p.id}
                      className={`px-3 py-1.5 rounded-lg border bg-green-500 ${busyId === p.id ? 'bg-zinc-100 text-zinc-400' : 'hover:bg-green-300'}`}
                    >
                      {busyId === p.id ? '...' : 'تفعيل الكتالوج للمتجر'}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="px-3 py-1.5 rounded-lg border bg-orange-400 hover:bg-orange-300"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className={`px-3 py-1.5 rounded-lg border bg-red-700 text-white ${deletingId === p.id ? 'bg-gray-100 text-red-700' : 'hover:bg-red-600'}`}
                    >
                      {deletingId === p.id ? 'يحذف...' : 'حذف'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr><td className="px-3 py-4 text-zinc-500" colSpan={4}>لا توجد بيانات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {loading && <div className="text-sm text-zinc-600">جارٍ التحميل…</div>}

      {/* نافذة إضافة/تعديل مزوّد (ديناميكية حسب النوع) */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{isEdit ? 'تعديل مزوّد' : 'إضافة مزوّد جديد'}</h2>
              <button onClick={() => setOpenModal(false)} className="text-zinc-500 hover:text-zinc-800">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">الاسم</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="الاسم التعريفي لديك"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">الجهة</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value as ProviderKind })}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={isEdit} // تثبيت النوع أثناء التعديل
                >
                  <option value="barakat">barakat</option>
                  <option value="apstore">apstore</option>
                  <option value="znet">znet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Base URL (اختياري)</label>
                <input
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  placeholder={
                    form.provider === 'znet'
                      ? 'http://bayi.siteadressinstead.com'
                      : 'https://api.x-stor.net'
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {(form.provider === 'barakat' || form.provider === 'apstore') && (
                <div>
                  <label className="block text-sm mb-1">
                    API Token {isEdit && <span className="text-xs text-zinc-500">(اتركه فارغًا إن لم ترغب بتغييره)</span>}
                  </label>
                  <input
                    value={form.apiToken}
                    onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
                    placeholder="ادخل التوكن"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              )}

              {form.provider === 'znet' && (
                <>
                  <div>
                    <label className="block text-sm mb-1">
                      رقم الجوال {isEdit && <span className="text-xs text-zinc-500">(اتركه فارغًا إن لم ترغب بتغييره)</span>}
                    </label>
                    <input
                      value={form.kod}
                      onChange={(e) => setForm({ ...form, kod: e.target.value })}
                      placeholder="54421999998"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      كلمة السر {isEdit && <span className="text-xs text-zinc-500">(اتركها فارغة إن لم ترغب بتغييرها)</span>}
                    </label>
                    <input
                      value={form.sifre}
                      onChange={(e) => setForm({ ...form, sifre: e.target.value })}
                      placeholder="*******"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button onClick={() => setOpenModal(false)} className="px-3 py-1.5 border rounded-lg">
                إلغاء
              </button>
              {!isEdit ? (
                <button
                  onClick={submitCreate}
                  disabled={!canSaveCreate}
                  className={`px-3 py-1.5 rounded-lg text-white ${canSaveCreate ? 'bg-emerald-600 hover:opacity-90' : 'bg-zinc-400 cursor-not-allowed'}`}
                >
                  حفظ
                </button>
              ) : (
                <button
                  onClick={submitEdit}
                  disabled={!canSaveEdit}
                  className={`px-3 py-1.5 rounded-lg text-white ${canSaveEdit ? 'bg-black hover:opacity-90' : 'bg-zinc-400 cursor-not-allowed'}`}
                >
                  تحديث
                </button>
              )}
            </div>

            {!isEdit && (
              <div className="text-xs text-zinc-500 pt-2">
                ملاحظة: لـ <b>barakat/apstore</b> يلزم API Token، ولـ <b>znet</b> يلزم <code>kod</code> و<code>sifre</code>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
