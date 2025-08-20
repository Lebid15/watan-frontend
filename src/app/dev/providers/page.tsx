'use client';

import { useEffect, useState } from 'react';
import api from '@/utils/api';
import { useToast } from '@/context/ToastContext';

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

type Provider = {
  id: string;
  name: string;
  provider: string; // 'znet' | 'barakat' | ...
  baseUrl?: string | null;
};

export default function ProvidersPage() {
  const [items, setItems] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { show } = useToast();

  async function load() {
    setLoading(true);
    try {
      // جرّب المسار الإداري أولاً ثم العام كاحتياط
      let res = await api.get('/admin/integrations');
      let data: any = res.data;
      if (!Array.isArray(data) && !data?.items) {
        res = await api.get('/integrations');
        data = res.data;
      }
      const list: Provider[] = Array.isArray(data) ? data : (data?.items ?? []);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // زر الاستيراد/التحديث (موجود عندك مسبقًا غالبًا)
  async function handleImport(providerId: string) {
    setBusyId(providerId);
    try {
      const { data } = await api.post<ImportCatalogResp>(`/admin/providers/${providerId}/catalog-import`);
      show(`تم الاستيراد: منتجات ${data.createdProducts ?? 0} / باقات ${data.createdPackages ?? 0}`);
    } catch (e: any) {
      show(`فشل الاستيراد: ${e?.response?.data?.message || e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  // ✅ زر تفعيل الكتالوج الكامل لهذا المزوّد
  async function handleEnableAllForProvider(providerId: string) {
    setBusyId(providerId);
    try {
      const { data } = await api.post<EnableProviderResp>(`/admin/catalog/providers/${providerId}/enable-all`);
      show(`✅ تفعيل المزوّد: منتجات ${data.productsTouched} / باقات جديدة ${data.createdPackages} / متجاهلة ${data.skippedPackages}`);
    } catch (e: any) {
      show(`⚠️ فشل التفعيل: ${e?.response?.data?.message || e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">المزوّدون</h1>
        {/* زر عام إن احتجت */}
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-start px-3 py-2">الاسم</th>
              <th className="text-start px-3 py-2">النوع</th>
              <th className="text-start px-3 py-2">Base URL</th>
              <th className="text-start px-3 py-2">عمليات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2 font-semibold">{p.name}</td>
                <td className="px-3 py-2">{p.provider}</td>
                <td className="px-3 py-2 text-xs text-zinc-600">{p.baseUrl ?? '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImport(p.id)}
                      disabled={busyId === p.id}
                      className={`px-3 py-1.5 rounded-lg text-white ${busyId === p.id ? 'bg-zinc-400' : 'bg-black hover:opacity-90'}`}
                    >
                      {busyId === p.id ? '...' : 'استيراد/تحديث الكتالوج'}
                    </button>
                    <button
                      onClick={() => handleEnableAllForProvider(p.id)}
                      disabled={busyId === p.id}
                      className={`px-3 py-1.5 rounded-lg border ${busyId === p.id ? 'bg-zinc-100 text-zinc-400' : 'hover:bg-zinc-50'}`}
                    >
                      {busyId === p.id ? '...' : 'تفعيل الكتالوج للمتجر'}
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
    </div>
  );
}
