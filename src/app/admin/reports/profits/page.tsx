'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

type RangePreset = 'today' | 'this_month' | 'last_month' | 'last_6_months' | 'custom';

interface ProfitsResponse {
  filters: { range: RangePreset; start: string; end: string; userId: string | null; provider: string | null };
  counts: { total: number; approved: number; rejected: number };
  totalsTRY: { cost: number; sales: number };
  profit: { try: number; usd: number; rateTRY: number };
}

interface Option { value: string; label: string; }

export default function AdminReportsProfitsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfitsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [range, setRange] = useState<RangePreset>('today');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');

  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<Option[]>([]);
  const [userId, setUserId] = useState<string>('');            
  const [userLabel, setUserLabel] = useState<string>('');      
  const [openUsers, setOpenUsers] = useState(false);
  const usersRef = useRef<HTMLDivElement>(null);

  const [providers, setProviders] = useState<Option[]>([]);
  const [provider, setProvider] = useState<string>('');        
  const [providerLabel, setProviderLabel] = useState<string>(''); 
  const [openProviders, setOpenProviders] = useState(false);
  const providersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (openProviders && providersRef.current && !providersRef.current.contains(e.target as Node)) {
        setOpenProviders(false);
      }
      if (openUsers && usersRef.current && !usersRef.current.contains(e.target as Node)) {
        setOpenUsers(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openProviders, openUsers]);

  const canApply = useMemo(() => {
    if (range !== 'custom') return true;
    return Boolean(start && end);
  }, [range, start, end]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { range };
      if (range === 'custom' && start && end) { params.start = start; params.end = end; }
      if (userId) params.userId = userId;
      if (provider) params.provider = provider;
      const { data } = await api.get<ProfitsResponse>(API_ROUTES.admin.reports.profits, { params });
      setData(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    (async () => {
      try {
        const { data } = await api.get<{ id: string; label: string }[]>(API_ROUTES.admin.reports.providers);
        const opts: Option[] = (data || []).map(v => ({ value: v.id, label: v.label }));
        setProviders(opts);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get<{ id: string; label: string }[]>(API_ROUTES.admin.reports.users, {
          params: { q: userSearch, limit: 20 },
        });
        setUserOptions(data.map(x => ({ value: x.id, label: x.label })));
      } catch {
        setUserOptions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const presets: { key: RangePreset; label: string }[] = [
    { key: 'today', label: 'اليوم' },
    { key: 'this_month', label: 'هذا الشهر' },
    { key: 'last_month', label: 'الشهر الماضي' },
    { key: 'last_6_months', label: 'آخر 6 أشهر' },
    { key: 'custom', label: 'مخصص' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">تقارير الأرباح</h1>

      {/* فلاتر */}
      <div className="rounded-md border border-gray-700 p-3 bg-[var(--bg-main)]">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setRange(p.key)}
              className={`px-3 py-1.5 rounded-md text-sm transition
              ${range === p.key ? 'bg-green-900 text-white' : 'bg-gray-600 text-gray-200 hover:opacity-90'}`}
            >
              {p.label}
            </button>
          ))}

          {range === 'custom' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm">من:</label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className=" border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm">إلى:</label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className=" border rounded px-2 py-1 text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* فلاتر إضافية */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-3 mt-3">
          {/* المزوّد */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenProviders(v => !v)}
              className="w-full px-2 py-2 text-right text-sm bg-gray-200 hover:brightness-110 rounded border border-gray-700 flex items-center justify-between"
            >
              <span>المزوّد</span>
              <span className="opacity-70">
                {provider ? (providerLabel || providers.find(p => p.value === provider)?.label || provider) : 'الكل (بدون تصفية)'}
              </span>
            </button>

            {openProviders && (
              <div
                ref={providersRef}
                className="bg-gray-200 text-gray-800 absolute z-40 right-0 top-full mt-1 w-72 max-h-64 overflow-auto rounded-md border border-gray-700 shadow-lg"
              >
                <button
                  onClick={() => { setProvider(''); setProviderLabel(''); setOpenProviders(false); }}
                  className={`bg-gray-50 w-full text-right px-3 py-2 text-sm ${!provider ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                >
                  الكل (بدون تصفية)
                </button>
                {providers.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setProvider(opt.value); setProviderLabel(opt.label); setOpenProviders(false); }}
                    className={`w-full text-right px-3 py-2 text-sm ${provider === opt.value ? 'bg-green-300' : 'hover:bg-gray-300'}`}
                    title={opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* المستخدم */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenUsers(v => !v)}
              className="w-full px-2 py-2 text-right text-sm bg-gray-200 hover:brightness-110 rounded border border-gray-700 flex items-center justify-between"
            >
              <span>المستخدم</span>
              <span className="opacity-70">
                {userId ? (userLabel || userOptions.find(u => u.value === userId)?.label || userId) : 'الكل (بدون تصفية)'}
              </span>
            </button>

            {openUsers && (
              <div
                ref={usersRef}
                className="absolute z-40 right-0 top-full mt-1 w-[28rem] max-w-[90vw] rounded-md border border-gray-700 bg-[var(--main-color)] shadow-lg"
              >
                <div className="p-2 border-b border-gray-700">
                  <input
                    autoFocus
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الإيميل…"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="bg-gray-200 max-h-56 overflow-auto">
                  <button
                    onClick={() => { setUserId(''); setUserLabel(''); setOpenUsers(false); }}
                    className={`w-full text-right px-3 py-2 text-sm ${!userId ? 'bg-gray-100' : 'hover:bg-gray-700'}`}
                  >
                    الكل (بدون تصفية)
                  </button>
                  {userOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setUserId(opt.value); setUserLabel(opt.label); setOpenUsers(false); }}
                      className={`w-full text-right px-3 py-2 text-sm ${userId === opt.value ? 'bg-green-400' : 'hover:bg-gray-300'}`}
                      title={opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* زر تطبيق */}
          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading || !canApply}
              className={`w-full px-4 py-2 rounded-md text-white transition
              ${!canApply || loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}
            >
              {loading ? 'جاري التحميل…' : 'تطبيق'}
            </button>
          </div>
        </div>
      </div>

      {/* نتائج */}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-white border border-gray-700 p-4">
          <div className="text-sm text-gray-700 mb-1">إجمالي الطلبات</div>
          <div className="text-2xl font-bold">{data?.counts.total ?? 0}</div>
        </div>
        <div className="rounded-lg bg-green-100 border border-gray-700 p-4">
          <div className="text-sm text-gray-700 mb-1">المقبولة</div>
          <div className="text-2xl font-bold">{data?.counts.approved ?? 0}</div>
        </div>
        <div className="rounded-lg bg-red-100 border border-gray-700 p-4">
          <div className="text-sm text-gray-700 mb-1">المرفوضة</div>
          <div className="text-2xl font-bold">{data?.counts.rejected ?? 0}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-[var(--bg-section)] border border-gray-700 p-4">
          <div className="text-sm text-gray-300 mb-1">مجموع التكلفة (TRY)</div>
          <div className="text-2xl font-bold" dir="ltr">
            {Number(data?.totalsTRY.cost ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-section)] border border-gray-700 p-4">
          <div className="text-sm text-gray-300 mb-1">مجموع سعر البيع (TRY)</div>
          <div className="text-2xl font-bold" dir="ltr">
            {Number(data?.totalsTRY.sales ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded-lg bg-[var(--bg-section)] border border-gray-700 p-4">
          <div className="text-sm text-gray-300 mb-1">الربح النهائي</div>
          <div className="text-2xl font-bold" dir="ltr">
            {Number(data?.profit.try ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY
          </div>
          <div className="text-xs text-gray-400 mt-1" dir="ltr">
            (ما يقابله بالدولار: {Number(data?.profit.usd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
          </div>
          <div className="text-xs text-gray-400 mt-1">
            (المعدل الحالي: 1 USD = {data?.profit.rateTRY ?? '—'} TRY)
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        نطاق: {data?.filters.start} → {data?.filters.end}
        {data?.filters.userId ? <> • مستخدم: <span className="font-mono">{data.filters.userId}</span></> : null}
        {data?.filters.provider ? <> • مزوّد: <span className="font-mono">{data.filters.provider}</span></> : null}
      </div>
    </div>
  );
}
