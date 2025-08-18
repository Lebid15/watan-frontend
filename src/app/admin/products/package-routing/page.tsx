'use client';

import { useEffect, useMemo, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';

const CODES_ID = '__CODES__';

type Provider = { id: string; name: string; type: string };
type CodeGroup = { id: string; name: string };

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
    providerType: 'manual' | 'external' | 'internal_codes';
    codeGroupId: string | null;
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
  const [codeGroups, setCodeGroups] = useState<CodeGroup[]>([]);
  const [rows, setRows] = useState<RoutingItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.get<{ providers: Provider[]; codeGroups: CodeGroup[]; items: RoutingItem[] }>(
        API_ROUTES.admin.integrations.routingAll(q),
      );
      setProviders(data.providers || []);
      setCodeGroups(data.codeGroups || []);
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
    if (allSelected) setSelected({});
    else {
      const obj: Record<string, boolean> = {};
      rows.forEach((r) => (obj[r.packageId] = true));
      setSelected(obj);
    }
  };

  const toggleOne = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  // خيارات نوع التوجيه: Manual + مزودين + قسم الأكواد
  const providerOptions = [
    { id: '', name: 'Manual', type: 'manual' as any },
    { id: CODES_ID, name: 'قسم الأكواد الرقمية', type: 'internal_codes' as any },
    ...providers,
  ];

const handleChangeProvider = async (
  pkgId: string,
  which: 'primary' | 'fallback',
  providerId: string, // '' = Manual, CODES_ID = الأكواد
) => {
  setMsg('');

  // الأكواد الرقمية
  if (providerId === CODES_ID) {
    setRows(arr =>
      arr.map(r =>
        r.packageId === pkgId
          ? {
              ...r,
              routing: {
                ...r.routing,
                providerType: 'internal_codes',
                mode: 'auto',
                primaryProviderId: null,
                fallbackProviderId: null,
              } as any,
            }
          : r
      )
    );

    try {
      await api.post(API_ROUTES.admin.integrations.routingSetType, {
        packageId: pkgId,
        providerType: 'internal_codes',
      });
      setMsg('تم التحويل إلى الأكواد الرقمية.');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'تعذر التحويل إلى الأكواد');
    }
    return;
  }

  // Manual
  if (!providerId) {
    setRows(arr =>
      arr.map(r =>
        r.packageId === pkgId
          ? {
              ...r,
              routing: {
                ...r.routing,
                providerType: 'manual',
                mode: 'manual',
                [`${which}ProviderId`]: null,
              } as any,
            }
          : r
      )
    );

    try {
      await api.post(API_ROUTES.admin.integrations.routingSetType, {
        packageId: pkgId,
        providerType: 'manual',
      });
      await api.post(API_ROUTES.admin.integrations.routingSet, {
        packageId: pkgId,
        which,
        providerId: null,
      });
      setMsg('تم الحفظ (وضع Manual).');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'تعذر الحفظ');
    }
    return;
  }

  // مزوّد خارجي
  setRows(arr =>
    arr.map(r =>
      r.packageId === pkgId
        ? {
            ...r,
            routing: {
              ...r.routing,
              providerType: 'external',
              mode: 'auto',
              [`${which}ProviderId`]: providerId,
            } as any,
          }
        : r
    )
  );

  try {
    await api.post(API_ROUTES.admin.integrations.routingSetType, {
      packageId: pkgId,
      providerType: 'external',
    });

    await api.post(API_ROUTES.admin.integrations.routingSet, {
      packageId: pkgId,
      which,
      providerId,
    });

    const res = await api.post<{ mapped?: boolean; cost?: { amount: number; currency: string }; message?: string }>(
      API_ROUTES.admin.integrations.providerCost,
      { packageId: pkgId, providerId },
    );
    const payload = res?.data;

    if (payload?.mapped) {
      setRows(arr =>
        arr.map(r => {
          if (r.packageId !== pkgId) return r;
          const nextProviders = r.providers.map(p =>
            p.providerId === providerId
              ? {
                  ...p,
                  costAmount: payload?.cost?.amount ?? p.costAmount,
                  costCurrency: payload?.cost?.currency ?? p.costCurrency,
                }
              : p
          );
          return { ...r, providers: nextProviders };
        })
      );
      setMsg('تم الحفظ وتحديث تكلفة المزوّد.');
    } else {
      setMsg(payload?.message || 'لا يوجد ربط لهذه الباقة مع هذا المزوّد.');
    }
  } catch (e: any) {
    setMsg(e?.response?.data?.message || e?.message || 'تعذر الحفظ');
  }
};

  // حفظ مجموعة الأكواد
  const handleChangeCodeGroup = async (pkgId: string, codeGroupId: string) => {
    // حدّث الواجهة
    setRows(arr => arr.map(r => r.packageId === pkgId ? ({
      ...r,
      routing: { ...r.routing, providerType: 'internal_codes', codeGroupId, mode: codeGroupId ? 'auto' : 'manual', primaryProviderId: null, fallbackProviderId: null }
    }) : r));

    setMsg('');
    try {
      await api.post(API_ROUTES.admin.integrations.routingSetCodeGroup, {
        packageId: pkgId,
        codeGroupId: codeGroupId || null,
      });
      setMsg(codeGroupId ? 'تم اختيار مجموعة الأكواد وتفعيل التوجيه الداخلي.' : 'تم إلغاء مجموعة الأكواد (عاد Manual).');
    } catch (e: any) {
      setMsg(e?.response?.data?.message || e?.message || 'تعذر حفظ مجموعة الأكواد');
    }
  };

  const applyFilter = async () => { await load(); };

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
          <button onClick={applyFilter} className="btn btn-secondary">بحث</button>
          <button onClick={load} disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'يحمل..' : 'تحديث'}
          </button>
        </div>
      </div>

      {msg && <div className="mb-3 card border border-border p-3">{msg}</div>}

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
              <th>التوجيه</th>
              <th>api 2 (اختياري)</th>
              <th>اسعار api</th>
              <th>مجموعة الأكواد</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-text-secondary">لا توجد باقات</td>
              </tr>
            )}

            {rows.map((r) => {
              const isCodes = r.routing.providerType === 'internal_codes';
              return (
                <tr key={r.packageId} className="hover:bg-primary/5">
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={!!selected[r.packageId]} onChange={() => toggleOne(r.packageId)} />
                  </td>

                  <td className="px-3 py-2">{r.productName}</td>
                  <td className="px-3 py-2">{r.packageName}</td>
                  <td className="px-3 py-2">{r.basePrice}</td>

                  {/* التوجيه الأساسي (Manual / External / Codes) */}
                  <td className="px-3 py-2">
                    <select
                      className="input w-full"
                      value={
                        r.routing.providerType === 'internal_codes'
                          ? CODES_ID
                          : (r.routing.primaryProviderId ?? '')
                      }
                      onChange={(e) => handleChangeProvider(r.packageId, 'primary', e.target.value)}
                    >
                      {providerOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* الاحتياطي — يظهر فقط في وضع external */}
                  <td className="px-3 py-2">
                    <select
                      className="input w-full"
                      disabled={r.routing.providerType !== 'external'}
                      value={r.routing.fallbackProviderId ?? ''}
                      onChange={(e) => handleChangeProvider(r.packageId, 'fallback', e.target.value)}
                    >
                      {providerOptions
                        .filter(p => p.type === 'external' || p.id === '')
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.name || 'Manual'}</option>
                        ))}
                    </select>
                  </td>

                  {/* تكاليف المزوّدين */}
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

                  {/* اختيار مجموعة الأكواد - يظهر فقط عند internal_codes */}
                  <td className="px-3 py-2">
                    <select
                      className="input w-full"
                      disabled={!isCodes}
                      value={r.routing.codeGroupId ?? ''}
                      onChange={(e) => handleChangeCodeGroup(r.packageId, e.target.value)}
                    >
                      <option value="">— اختر مجموعة —</option>
                      {codeGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {isCodes && !r.routing.codeGroupId && (
                      <div className="text-xs text-text-secondary mt-1">اختر مجموعة لتفعيل التوجيه الداخلي تلقائيًا.</div>
                    )}
                  </td>
                </tr>
              );
            })}

            {loading && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-text-secondary">يحمل..</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
