'use client';

import { useEffect, useRef, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import { useToast } from '@/context/ToastContext';

/** شكل استجابة الرفع من /admin/upload (Cloudinary وراء الكواليس) */
type UploadResponse = {
  url?: string;
  secure_url?: string;
  data?: {
    url?: string;
    secure_url?: string;
  };
};

type CatalogListItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  sourceProviderId?: string | null;
  externalProductId?: string | null;
  isActive: boolean;
  packagesCount?: number;
};

/** استخراج رابط الصورة من استجابة الرفع مع تضييق النوع */
function extractUploadUrl(r: UploadResponse | undefined): string {
  const u = r?.url ?? r?.secure_url ?? r?.data?.url ?? r?.data?.secure_url;
  if (!u) throw new Error('لم يتم استلام رابط الصورة من الرفع');
  return u;
}

export default function CatalogImagesPage() {
  const { show } = useToast();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<CatalogListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const url = API_ROUTES.admin.catalog.listProducts(true, q);
      // ✅ نحدد نوع الاستجابة حتى ما يشتكي TS على data.items
      const { data } = await api.get<{ items: CatalogListItem[] }>(url);
      setItems(data?.items ?? []);
    } catch (err: any) {
      show(err?.response?.data?.message || err?.message || 'فشل تحميل الكتالوج');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function onPickFileFor(id: string) {
    setTargetId(id);
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset
    if (!file || !targetId) return;

    setUpdatingId(targetId);
    try {
      // 1) رفع الصورة (multipart)
      const form = new FormData();
      form.append('file', file);
      const up = await api.post<UploadResponse>(API_ROUTES.admin.upload, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2) استخراج الرابط مع تضييق النوع
      const url = extractUploadUrl(up.data);

      // 3) تعيين الصورة على منتج الكتالوج + نشرها للمتجر إن كانت ناقصة
      await api.put(API_ROUTES.admin.catalog.setProductImage(targetId), {
        imageUrl: url,
        propagate: true,
      });

      // 4) تحديث الواجهة محليًا
      setItems((prev) => prev.map((it) => (it.id === targetId ? { ...it, imageUrl: url } : it)));
      show('تم تحديث صورة المنتج ✓');
    } catch (err: any) {
      show(err?.response?.data?.message || err?.message || 'فشل رفع/تحديث الصورة');
    } finally {
      setUpdatingId(null);
      setTargetId(null);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">إدارة صور الكتالوج</h1>
        <div className="flex items-center gap-2">
          <input
            className="input w-64"
            placeholder="ابحث بالاسم…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
          <button className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? 'يحمّل...' : 'بحث/تحديث'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border bg-white p-3 flex gap-3 items-center">
            <div className="h-14 w-14 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-xs text-zinc-500">
                {p.packagesCount != null ? `عدد الباقات: ${p.packagesCount}` : '—'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => onPickFileFor(p.id)}
                disabled={updatingId === p.id}
              >
                {updatingId === p.id ? 'يرفع...' : p.imageUrl ? 'تغيير الصورة' : 'رفع صورة'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !loading && (
        <div className="text-sm text-zinc-500 mt-6">لا توجد منتجات كتالوج مطابقة.</div>
      )}
    </div>
  );
}
