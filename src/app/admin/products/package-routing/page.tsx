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
    <div className="p-4 md:p-6 text-text-primary">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">توجيه الباقات</h1>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث باسم المنتج/الباقة"
            className="input placeholder:text-text-secondary/70 w-56"
          />
          <button
            onClick={applyFilter}
            className="btn btn-secondary"
          >
            بحث
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="btn btn-primary disabled:opacity-50"
          >
            {loading ? 'يحمل..' : 'تحديث'}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-3 card border border-border p-3">
          {msg}
        </div>
      )}

      <div className="table-wrap">
        <table className="table text-right">
          <thead>
            <tr>
              <th className="w-10 text-center">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th>المنتج</th>
              <th>اسم الباقة</th>
              <th>رأس المال</th>
              <th>api 1</th>
              <th>api 2</th>
              <th>اسعار api</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-text-secondary">لا توجد باقات</td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.packageId} className="hover:bg-primary/5">
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={!!selected[r.packageId]}
                    onChange={() => toggleOne(r.packageId)}
                  />
                </td>

                <td className="px-3 py-2">{r.productName}</td>
                <td className="px-3 py-2">{r.packageName}</td>
                <td className="px-3 py-2">{r.basePrice}</td>

                {/* الأساسي */}
                <td className="px-3 py-2">
                  <select
                    className="input w-full"
                    value={r.routing.primaryProviderId ?? ''}
                    onChange={(e) => handleChangeProvider(r.packageId, 'primary', e.target.value)}
                  >
                    {providerOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>

                {/* الاحتياطي */}
                <td className="px-3 py-2">
                  <select
                    className="input w-full"
                    value={r.routing.fallbackProviderId ?? ''}
                    onChange={(e) => handleChangeProvider(r.packageId, 'fallback', e.target.value)}
                  >
                    {providerOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>

                {/* تكاليف المزوّدين - للقراءة فقط */}
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {r.providers.map((p) => (
                      <span
                        key={p.providerId}
                        className="text-xs rounded-md px-2 py-1 bg-success/15 text-success border border-success/30"
                        title={p.providerName}
                      >
                        {p.providerName}: {p.costAmount} {p.costCurrency || 'TL'}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-text-secondary">يحمل..</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
