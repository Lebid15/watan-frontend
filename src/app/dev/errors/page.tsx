'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import api, { API_ROUTES } from '@/utils/api';

type ErrorLog = {
  id: string; source: string; level: string; status: string; message: string; path?: string | null;
  userId?: string | null; tenantId?: string | null; occurrenceCount: number; lastOccurredAt?: string; createdAt: string;
};

type Paged<T> = { items: T[]; total?: number; skip?: number; take?: number } | T[] | any;

function extractItems<T>(data: Paged<T>): T[] { if (Array.isArray(data)) return data as T[]; if (data && typeof data==='object' && Array.isArray((data as any).items)) return (data as any).items as T[]; return []; }

function ErrorsInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const q = sp.get('q') || '';
  const level = sp.get('level') || '';
  const status = sp.get('status') || '';
  const source = sp.get('source') || '';
  const page = parseInt(sp.get('page') || '1');
  const take = 30;
  const skip = (page - 1) * take;

  const setParam = useCallback((k: string, v: string) => {
    const params = new URLSearchParams(sp?.toString() || '');
    if (v) params.set(k, v); else params.delete(k);
    if (k !== 'page') params.set('page', '1'); // reset pagination on filter change
    router.replace(pathname + '?' + params.toString());
  }, [sp, router, pathname]);

  const setPage = (p: number) => { const params = new URLSearchParams(sp?.toString() || ''); params.set('page', String(p)); router.replace(pathname + '?' + params.toString()); }; 

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (level) params.set('level', level);
      if (status) params.set('status', status);
      if (source) params.set('source', source);
      params.set('skip', String(skip)); params.set('take', String(take));
      const res = await api.get('/dev/errors?' + params.toString());
      const data = res.data;
      const list = extractItems<ErrorLog>(data);
      setItems(list);
      setTotal((data as any).total ?? list.length);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'فشل التحميل');
    } finally { setLoading(false); }
  }, [q, level, status, source, skip, take]);

  useEffect(() => { load(); }, [load]);

  const resolveOne = async (id: string) => {
    if (!confirm('وضع هذا الخطأ كـ "محلول"؟')) return;
    setResolvingId(id);
    try {
      await api.post(API_ROUTES.dev.errors.resolve(id));
      // حدّث محلياً بدون إعادة التحميل الكامل لتحسين التجربة
      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'resolved' } : it));
    } catch (e: any) {
      alert(e?.response?.data?.message || e.message || 'فشل تحديث الحالة');
    } finally { setResolvingId(null); }
  };

  const deleteOne = async (id: string) => {
    if (!confirm('حذف هذا السجل نهائياً؟ لا يمكن التراجع.')) return;
    setDeletingId(id);
    try {
      await api.delete(API_ROUTES.dev.errors.delete(id));
      setItems(prev => prev.filter(it => it.id !== id));
      setTotal(t => t > 0 ? t - 1 : 0);
      // إن أصبحت الصفحة فارغة ولديك صفحات سابقة، ارجع خطوة
      if (items.length === 1 && page > 1) setPage(page - 1);
    } catch (e:any) {
      alert(e?.response?.data?.message || e.message || 'فشل الحذف');
    } finally { setDeletingId(null); }
  };

  const openDetails = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(API_ROUTES.dev.errors.byId(id));
      setDetail(res.data);
    } catch (e:any) {
      setDetail({ _error: e?.response?.data?.message || e.message || 'فشل جلب التفاصيل' });
    } finally { setDetailLoading(false); }
  };

  const closeDetails = () => { setDetailId(null); setDetail(null); };

  const pages = useMemo(() => Math.max(1, Math.ceil(total / take)), [total, take]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">مراقبة الأخطاء</h1>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-xs">بحث</label>
          <input defaultValue={q} onBlur={(e)=>setParam('q', e.target.value)} placeholder="رسالة" className="border px-2 py-1 rounded text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs">المستوى</label>
          <select value={level} onChange={e=>setParam('level', e.target.value)} className="border px-2 py-1 rounded text-sm">
            <option value="">الكل</option>
            <option value="error">error</option>
            <option value="warn">warn</option>
            <option value="info">info</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs">الحالة</label>
          <select value={status} onChange={e=>setParam('status', e.target.value)} className="border px-2 py-1 rounded text-sm">
            <option value="">الكل</option>
            <option value="open">open</option>
            <option value="resolved">resolved</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs">المصدر</label>
          <select value={source} onChange={e=>setParam('source', e.target.value)} className="border px-2 py-1 rounded text-sm">
            <option value="">الكل</option>
            <option value="backend">backend</option>
            <option value="frontend">frontend</option>
          </select>
        </div>
        <button onClick={()=>load()} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">تحديث</button>
      </div>

      {loading && <div className="text-sm text-gray-500">جاري التحميل...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && items.length === 0 && <div className="text-sm text-gray-500">لا توجد أخطاء مطابقة.</div>}

      {items.length > 0 && (
        <div className="overflow-auto border rounded bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 text-start">الوقت</th>
                <th className="p-2 text-start">المستوى</th>
                <th className="p-2 text-start">الحالة</th>
                <th className="p-2 text-start">الرسالة</th>
                <th className="p-2 text-start">المسار / الرابط</th>
                <th className="p-2 text-start">المصدر</th>
                <th className="p-2 text-start">المستخدم</th>
                <th className="p-2 text-start">المستأجر</th>
                <th className="p-2 text-start">عدد</th>
                <th className="p-2 text-start">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {items.map(er => (
                <tr key={er.id} className="border-t align-top hover:bg-gray-50">
                  <td className="p-2 whitespace-nowrap">{new Date(er.lastOccurredAt || er.createdAt).toLocaleString()}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${er.level==='error'?'bg-red-600 text-white':er.level==='warn'?'bg-yellow-500 text-black':'bg-gray-300'}`}>{er.level}</span></td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${er.status==='open'?'bg-rose-100 text-rose-700':'bg-emerald-100 text-emerald-700'}`}>{er.status}</span></td>
                  <td className="p-2 max-w-xs break-words">{er.message}</td>
                  <td className="p-2 max-w-xs break-all text-[11px] text-gray-600">{er.path || '-'}</td>
                  <td className="p-2 text-xs">{er.source}</td>
                  <td className="p-2 text-xs">{er.userId?.slice(0,8) || '-'}</td>
                  <td className="p-2 text-xs">{er.tenantId?.slice(0,8) || '-'}</td>
                  <td className="p-2 text-xs">{er.occurrenceCount}</td>
                  <td className="p-2 text-xs space-x-1 rtl:space-x-reverse flex flex-wrap gap-1">
                    <button
                      onClick={()=>openDetails(er.id)}
                      className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] hover:bg-blue-700"
                    >تفاصيل</button>
                    {er.status === 'open' ? (
                      <button
                        onClick={()=>resolveOne(er.id)}
                        disabled={!!resolvingId}
                        className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] disabled:opacity-50"
                      >{resolvingId===er.id? '...':'حل'}</button>
                    ) : (
                      <span className="text-green-600 text-[11px] px-2 py-0.5">✓</span>
                    )}
                    <button
                      onClick={()=>deleteOne(er.id)}
                      disabled={!!deletingId}
                      className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] disabled:opacity-50"
                    >{deletingId===er.id? '...':'حذف'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex gap-2 items-center text-sm">
          <button disabled={page<=1} onClick={()=>setPage(page-1)} className="px-2 py-1 border rounded disabled:opacity-40">السابق</button>
          <div>{page} / {pages}</div>
          <button disabled={page>=pages} onClick={()=>setPage(page+1)} className="px-2 py-1 border rounded disabled:opacity-40">التالي</button>
        </div>
      )}

      {detailId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={closeDetails}>
          <div onClick={e=>e.stopPropagation()} className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded shadow-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">تفاصيل الخطأ</h2>
              <button onClick={closeDetails} className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">إغلاق</button>
            </div>
            {detailLoading && <div className="text-sm text-gray-500">تحميل...</div>}
            {!detailLoading && detail && detail._error && <div className="text-sm text-red-600">{detail._error}</div>}
            {!detailLoading && detail && !detail._error && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-semibold">المعرف:</span> {detail.id}</div>
                  <div><span className="font-semibold">المصدر:</span> {detail.source}</div>
                  <div><span className="font-semibold">المستوى:</span> {detail.level}</div>
                  <div><span className="font-semibold">الحالة:</span> {detail.status}</div>
                  <div><span className="font-semibold">عدد التكرار:</span> {detail.occurrenceCount}</div>
                  <div><span className="font-semibold">المستخدم:</span> {detail.userId || '-'}</div>
                  <div><span className="font-semibold">المستأجر:</span> {detail.tenantId || '-'}</div>
                  <div><span className="font-semibold">أُنشئ:</span> {new Date(detail.createdAt).toLocaleString()}</div>
                  <div><span className="font-semibold">آخر تكرار:</span> {new Date(detail.lastOccurredAt || detail.createdAt).toLocaleString()}</div>
                  {detail.resolvedAt && <div><span className="font-semibold">وقت الحل:</span> {new Date(detail.resolvedAt).toLocaleString()}</div>}
                </div>
                {detail.path && <div><span className="font-semibold">المسار:</span> <span className="break-all">{detail.path}</span></div>}
                {detail.message && <div><span className="font-semibold">الرسالة:</span> {detail.message}</div>}
                {detail.stack && (
                  <div>
                    <div className="font-semibold mb-1">Stack:</div>
                    <pre className="whitespace-pre-wrap bg-gray-800 text-green-200 p-2 rounded max-h-72 overflow-auto text-[11px]" dir="ltr">{detail.stack}</pre>
                  </div>
                )}
                {detail.context && (
                  <div>
                    <div className="font-semibold mb-1">Context:</div>
                    <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-60 overflow-auto text-[11px]" dir="ltr">{JSON.stringify(detail.context, null, 2)}</pre>
                  </div>
                )}
                {detail.userAgent && (
                  <div><span className="font-semibold">User-Agent:</span> <span className="break-all">{detail.userAgent}</span></div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ErrorsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-500">...</div>}>
      <ErrorsInner />
    </Suspense>
  );
}
