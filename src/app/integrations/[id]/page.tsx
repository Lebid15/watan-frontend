'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api, { API_ROUTES } from '@/utils/api';

/* =======================
   عناصر مساعدة مع بحث
   ======================= */

type SimpleOption = { id: string; name: string };
type ProductLite = { id: string; name: string; isActive?: boolean };

function useClickAway<T extends HTMLElement>(onAway: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onAway();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onAway]);
  return ref;
}

/** ComboBox: زر يفتح قائمة فيها input للبحث + عناصر. يسمح بإدخال حرّ */
function SearchableCombo({
  value,
  onChange,
  placeholder,
  options,
  buttonClass,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: string[];
  buttonClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useClickAway<HTMLDivElement>(() => setOpen(false));

  const filtered = useMemo(() => {
    const uniq = Array.from(new Set(options)).filter(Boolean);
    if (!q) return uniq.slice(0, 200);
    return uniq.filter((s) => s.toLowerCase().includes(q.toLowerCase())).slice(0, 200);
  }, [q, options]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass ?? 'px-3 py-1.5 rounded-md border bg-[var(--bg-section)]'}
        title={value || placeholder}
      >
        {value || placeholder || 'Select'}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-64 rounded-md border bg-white shadow-lg text-gray-900">
          <div className="p-2 border-b">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث…"
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                  opt === value ? 'bg-gray-50 font-medium' : ''
                }`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                  setQ('');
                }}
              >
                {opt}
              </button>
            ))}
            {/* اختيار حر */}
            {q && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t"
                onClick={() => {
                  onChange(q);
                  setOpen(false);
                  setQ('');
                }}
              >
                Use: “{q}”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Select بقائمة مع بحث في الأعلى (لباقات المزود) */
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string) => void;
  options: SimpleOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useClickAway<HTMLDivElement>(() => setOpen(false));

  const filtered = useMemo(() => {
    if (!q) return options;
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(q.toLowerCase()) ||
        String(o.id).toLowerCase().includes(q.toLowerCase())
    );
  }, [q, options]);

  const selected = value ? options.find((o) => String(o.id) === String(value)) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border rounded-md px-2 py-1 w-72 bg-[var(--bg-section)] text-left truncate"
        title={selected ? `${selected.name} (${selected.id})` : placeholder}
      >
        {selected ? `${selected.name} (${selected.id})` : placeholder || 'Select…'}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[22rem] rounded-md border bg-white shadow-lg text-gray-900">
          <div className="p-2 border-b">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن الباقة…"
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="max-h-72 overflow-auto">
            <button
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                !value ? 'bg-gray-50 font-medium' : ''
              }`}
              onClick={() => {
                onChange('');
                setOpen(false);
                setQ('');
              }}
            >
              — إختر باقة  —
            </button>

            {filtered.map((o) => (
              <button
                key={String(o.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                  String(o.id) === String(value) ? 'bg-gray-50 font-medium' : ''
                }`}
                onClick={() => {
                  onChange(String(o.id));
                  setOpen(false);
                  setQ('');
                }}
                title={`${o.name} (${o.id})`}
              >
                {o.name} <span className="text-gray-500">({o.id})</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =======================
   الصفحة الأصلية
   ======================= */

type ProviderPkg = { id: string; name: string };
type Row = {
  our_package_id: string;
  our_package_name: string;
  our_base_price: number;
  provider_price: number | null;
  current_mapping: string | null;
  provider_packages: ProviderPkg[];
};
type ApiInfo = { id: string; name: string; type: string; balance: number };
type IntegrationConfigRow = {
  id: string;
  name: string;
  provider: 'barakat' | 'apstore' | 'znet';
  baseUrl?: string;
  apiToken?: string;
  kod?: string;
  sifre?: string;
};

export default function IntegrationMappingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null);
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfigRow | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [msg, setMsg] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  const [product, setProduct] = useState<string>(searchParams.get('product') || '');
  const [productOptions, setProductOptions] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const mappedCount = useMemo(
    () => rows.filter((r) => r.current_mapping && String(r.current_mapping).length > 0).length,
    [rows]
  );

  // جلب أسماء المنتجات من الـ backend
  const loadProductOptions = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get<ProductLite[]>(API_ROUTES.products.base);
      const names = (Array.isArray(data) ? data : [])
        .filter((p) => p?.isActive !== false)
        .map((p) => p.name)
        .filter(Boolean);
      setProductOptions(Array.from(new Set(names)));
      // لو لا يوجد قيمة حالية، عيّن أول عنصر
      if (!product && names.length) setProduct(names[0]);
    } catch (e) {
      // تجاهل الخطأ — سيتم الاعتماد على fallback المحلي إن لزم
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProductOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fallback محلي لو فشل جلب المنتجات
  const productSuggestions = useMemo(() => {
    if (productOptions.length) return productOptions;
    const names = rows.map((r) => r.our_package_name?.split(' ')?.[0] || '').filter(Boolean);
    return Array.from(new Set(names));
  }, [productOptions, rows]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const { data } = await api.get<{ api: ApiInfo; packages: Row[] }>(
        `${API_ROUTES.admin.integrations.packages(String(id))}${
          product ? `?product=${encodeURIComponent(product)}` : ''
        }`
      );
      setApiInfo(data.api);
      setRows(data.packages || []);

      const listRes = await api.get<IntegrationConfigRow[]>(API_ROUTES.admin.integrations.base);
      const found = (listRes.data || []).find((x) => x.id === String(id)) || null;
      setIntegrationConfig(found);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load mapping');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const applyFilter = async () => {
    const qp = new URLSearchParams(searchParams.toString());
    if (product) qp.set('product', product);
    else qp.delete('product');
    router.replace(`/admin/integrations/${id}?${qp.toString()}`);
    await load();
  };

  const updateRowMapping = (ourId: string, providerId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.our_package_id === ourId ? { ...r, current_mapping: providerId } : r))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const payload = rows
        .filter((r) => r.current_mapping && String(r.current_mapping).length > 0)
        .map((r) => ({
          our_package_id: r.our_package_id,
          provider_package_id: String(r.current_mapping),
        }));
      await api.post(API_ROUTES.admin.integrations.packages(String(id)), payload);
      setMsg('Mappings saved successfully.');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  const syncProviderProducts = async () => {
    if (!id) return;
    setSyncing(true);
    setError('');
    setMsg('');
    try {
      await api.post(API_ROUTES.admin.integrations.syncProducts(String(id)));
      setMsg('Provider products synced. Reloading…');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to sync provider products');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold">ربط الباقات</h1>
        </div>

        <div className="flex flex-col gap-2">
          {apiInfo && (
            <div className="text-sm bg-gray-500 border rounded-md px-3 py-2">
              <div>
                <span className="font-medium">الجهة:</span> {apiInfo.name} ({apiInfo.type})
              </div>
              <div>
                <span className="font-medium">الرصيد:</span> {apiInfo.balance}
              </div>
            </div>
          )}
          {integrationConfig && (
            <div className="text-xs bg-gray-500 border rounded-md px-3 py-2">
              <div className="truncate">
                <span className="font-medium">الرابط:</span>&nbsp;
                <span className="font-mono">{integrationConfig.baseUrl || '—'}</span>
              </div>
              <div className="truncate">
                <span className="font-medium">التوكن:</span>&nbsp;
                <span className="font-mono">{integrationConfig.apiToken || '—'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className='flex flex-wrap items-center gap-2 ml-4 border bg-yellow-800 p-2'>
          <span className="text-sm mr-1">اختر منتجاً:</span>
          <div className="relative inline-block">
            <SearchableCombo
              value={product}
              onChange={setProduct}
              placeholder={loadingProducts ? 'المنتجات احضار…' : 'إختر منتجا'}
              options={productSuggestions}
              buttonClass="px-3 py-1.5 rounded-md text-sm border bg-[var(--bg-section)] pr-8" // pr-8 لترك مساحة للسهم
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              ▼
            </span>
          </div>
          <button
            onClick={applyFilter}
            className="px-3 py-1.5 rounded-md bg-[var(--bg-section)] text-white hover:opacity-90"
            disabled={loading}
          >
            تأكيد
          </button>
        </div>

        <button
          onClick={load}
          className="px-3 py-1.5 rounded-md bg-red-900 hover:bg-gray-600"
          disabled={loading}
        >
          تحديث
        </button>
        <button
          onClick={syncProviderProducts}
          className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:opacity-90 disabled:opacity-50"
          disabled={syncing || loading}
          title="Sync provider packages"
        >
          {syncing ? 'جاري التحديث…' : 'تحديث باقات الطرف الاخر لدينا'}
        </button>
        <div className="ml-auto text-sm">
          <span className="font-medium">تم ربط {mappedCount}</span> من أصل {rows.length} 
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-3 p-3 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          {msg}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-visible">
        <table className="w-full text-sm">
          <thead className="bg-gray-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">الباقات</th>
              <th className="text-left px-3 py-2 font-medium">رأس المال</th>
              <th className="text-left px-3 py-2 font-medium">سعر الطرف الاخر</th>
              <th className="text-left px-3 py-2 font-medium">Diff</th>
              <th className="text-left px-3 py-2 font-medium">Provider Package</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  لا يوجد باقات لعرضها
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  يحمل...
                </td>
              </tr>
            )}

            {rows.map((r) => {
              const diff = r.provider_price == null ? null : r.provider_price - r.our_base_price;
              const diffClass =
                diff == null
                  ? 'text-gray-500'
                  : diff < 0
                  ? 'text-emerald-600'
                  : diff > 0
                  ? 'text-yellow-500'
                  : 'text-gray-700';

              return (
                <tr key={r.our_package_id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.our_package_name}</div>
                    <div className="text-xs text-gray-500">{r.our_package_id}</div>
                  </td>
                  <td className="px-3 py-2">{r.our_base_price}</td>
                  <td className="px-3 py-2">{r.provider_price ?? '—'}</td>
                  <td className={`px-3 py-2 ${diffClass}`}>
                    {diff == null ? '—' : diff.toFixed(3)}
                  </td>
                  <td className="px-3 py-2">
                    <SearchableSelect
                      value={r.current_mapping}
                      onChange={(v) => updateRowMapping(r.our_package_id, v)}
                      options={r.provider_packages.map((pp) => ({
                        id: String(pp.id),
                        name: pp.name,
                      }))}
                      placeholder="— إختر باقة للربط —"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={saveAll}
          disabled={saving || loading}
          className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'يتم الحفظ…' : 'حفظ'}
        </button>
        <button
          onClick={() => router.push('/admin/products/api-settings')}
          className="px-4 py-2 rounded-md bg-gray-400 hover:bg-gray-200"
        >
          رجوع
        </button>
      </div>
    </div>
  );
}
