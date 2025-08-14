'use client';

import { useEffect, useMemo, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

type Provider = { id: string; name: string; type: string };

type RoutingItem = {
  packageId: string;
  publicCode: string | null;
  productName: string;
  packageName: string;
  basePrice: number;
  routing: {
    mode: 'manual' | 'auto';
    primaryProviderId: string | null;
    fallbackProviderId: string | null;
  };
  // سنعرض التكاليف الحالية (للقراءة فقط)
  providers: Array<{
    providerId: string;
    providerName: string;
    costCurrency: string;
    costAmount: number;
  }>;
};

export default function PackagesRoutingPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [rows, setRows] = useState<RoutingItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState('');

  const [msg, setMsg] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.get<{ providers: Provider[]; items: RoutingItem[] }>(
        API_ROUTES.admin.integrations.routingAll(q),
      );
      setProviders(data.providers || []);
      setRows(data.items || []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'Failed to load routing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selected[r.packageId]),
    [rows, selected],
  );

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const obj: Record<string, boolean> = {};
      rows.forEach((r) => (obj[r.packageId] = true));
      setSelected(obj);
    }
  };

  const toggleOne = (id: string) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  // قائمة المزوّدين + manual
  const providerOptions = [{ id: '', name: 'Manual', type: 'manual' as any }, ...providers];

  // حفظ فوري عند تغيير الاختيار
  const handleChangeProvider = async (
    pkgId: string,
    which: 'primary' | 'fallback',
    providerId: string, // '' يعني Manual
  ) => {
    // تعديل فوري في الواجهة
    setRows((arr) =>
      arr.map((r) =>
        r.packageId === pkgId
          ? {
              ...r,
              routing: {
                ...r.routing,
                [`${which}ProviderId`]:
                  providerId && providerId.length > 0 ? providerId : null,
              } as any,
            }
          : r,
      ),
    );

    setMsg('');
    try {
      // 1) حفظ فوري للحقل
      await api.post(API_ROUTES.admin.integrations.routingSet, {
        packageId: pkgId,
        which,
        providerId: providerId || null,
      });

      // 2) إن اختير مزوّد (وليس Manual)، نحدّث التكلفة تلقائيًا
      if (providerId) {
        const res = await api.post<{ mapped?: boolean; cost?: { amount: number; currency: string }; message?: string }>(
          API_ROUTES.admin.integrations.providerCost,
          { packageId: pkgId, providerId },
        );
        const payload = res?.data;

        if (payload?.mapped) {
          // حدّث التكلفة داخل الصف (للمزوّد الذي تم اختياره)
          setRows((arr) =>
            arr.map((r) => {
              if (r.packageId !== pkgId) return r;
              const nextProviders = r.providers.map((p) =>
                p.providerId === providerId
                  ? {
                      ...p,
                      costAmount: payload?.cost?.amount ?? p.costAmount,
                      costCurrency: payload?.cost?.currency ?? p.costCurrency,
                    }
                  : p,
              );
              return { ...r, providers: nextProviders };
            }),
          );
          setMsg('تم الحفظ وتحديث تكلفة المزوّد.');
        } else {
          setMsg(payload?.message || 'لا يوجد ربط لهذه الباقة مع هذا المزوّد.');
        }
      } else {
        setMsg('تم الحفظ (وضع Manual).');
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'تعذر الحفظ');
    }
  };

  const applyFilter = async () => {
    await load();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">توجيه الباقات</h1>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث باسم المنتج/الباقة"
            className="px-3 py-2 rounded-md border border-gray-700 placeholder-gray-600"
          />
          <button
            onClick={applyFilter}
            className="px-3 py-2 rounded-md bg-gray-600 text-sm text-white border border-gray-700 hover:bg-gray-700"
          >
            بحث
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-md bg-blue-700 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'يحمل..' : 'تحديث'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-3 p-3 rounded-md bg-gray-50 border border-slate-700">
          {msg}
        </div>
      )}

      <div className="overflow-auto border border-gray-400 rounded-lg">
        <table className="min-w-[1100px] w-full text-sm text-right">
          <thead className="bg-[var(--tableheaders)]">
            <tr>
              <th className="px-3 py-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="border border-gray-400 px-3 py-2 text-center">المنتج</th>
              <th className="border border-gray-400 px-3 py-2 text-center">اسم الباقة</th>
              <th className="border border-gray-400 px-3 py-2 text-center">رأس المال</th>
              <th className="border border-gray-400 px-3 py-2 text-center">api 1</th>
              <th className="border border-gray-400 px-3 py-2 text-center">api 2</th>
              <th className="border border-gray-400 px-3 py-2 text-center">اسعار api</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-400">لا توجد باقات</td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.packageId} className="border-t border border-gray-400 bg-gray-50">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!selected[r.packageId]}
                    onChange={() => toggleOne(r.packageId)}
                  />
                </td>
                <td className="border border-gray-400 px-3 py-2">{r.productName}</td>
                <td className="border border-gray-400 px-3 py-2">{r.packageName}</td>
                <td className="border border-gray-400 px-3 py-2">{r.basePrice}</td>

                {/* الأساسي */}
                <td className="px-3 py-2">
                  <select
                    className="border border-gray-400 bg-gray-200 rounded-md px-2 py-1"
                    value={r.routing.primaryProviderId ?? ''}
                    onChange={(e) => handleChangeProvider(r.packageId, 'primary', e.target.value)}
                  >
                    {providerOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>

                {/* الاحتياطي */}
                <td className="border border-gray-400 px-3 py-2">
                  <select
                    className="border border-gray-400 bg-gray-200 rounded-md px-2 py-1"
                    value={r.routing.fallbackProviderId ?? ''}
                    onChange={(e) => handleChangeProvider(r.packageId, 'fallback', e.target.value)}
                  >
                    {providerOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>

                {/* تكاليف المزوّدين - للقراءة فقط */}
                <td className="border border-gray-400 px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {r.providers.map((p) => (
                      <span
                        key={p.providerId}
                        className="text-xs bg-green-100 border border-gray-400 rounded-md px-2 py-1"
                        title={`${p.providerName}`}
                      >
                        {p.providerName}: {p.costAmount} TL
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-400">يحمل..</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
