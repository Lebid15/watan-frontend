'use client';

import { useEffect, useMemo, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import { API_BASE_URL } from '@/utils/api';

const FILES_BASE = API_BASE_URL.replace(/\/api\/?$/, ""); // تأكد حذف /api من النهاية

function fileUrl(u?: string | null) {
  if (!u) return "";
  const s = String(u).trim();
  // روابط مطلقة أو معاينات محلية
  if (/^https?:\/\//i.test(s) || /^blob:/i.test(s) || /^data:/i.test(s)) return s;
  // مسار يبدأ بشرطة "/"
  if (s.startsWith("/")) return `${FILES_BASE}${s}`;
  // مسار نسبي بدون "/"
  return `${FILES_BASE}/${s}`;
}

type PaymentMethodType = 'CASH_BOX' | 'BANK_ACCOUNT' | 'HAND_DELIVERY' | 'USDT' | 'MONEY_TRANSFER';

interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  logoUrl?: string | null;
  note?: string | null;
  isActive: boolean;
  config: Record<string, any>;
  createdAt?: string;
}

const typeOptions: { value: PaymentMethodType; label: string }[] = [
  { value: 'CASH_BOX', label: 'صندوق اعتماد' },
  { value: 'BANK_ACCOUNT', label: 'حساب بنكي' },
  { value: 'HAND_DELIVERY', label: 'تسليم باليد' },
  { value: 'USDT', label: 'USDT' },
  { value: 'MONEY_TRANSFER', label: 'حوالات مالية' },
];

export default function AdminPaymentMethodsPage() {
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState('');

  // form state (create)
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethodType>('CASH_BOX');
  const [isActive, setIsActive] = useState(true);
  const [note, setNote] = useState('');
  const [config, setConfig] = useState<Record<string, string>>({});

  // logo upload (create)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<PaymentMethod | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<PaymentMethodType>('CASH_BOX');
  const [editActive, setEditActive] = useState(true);
  const [editNote, setEditNote] = useState('');
  const [editConfig, setEditConfig] = useState<Record<string, string>>({});
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string>('');

  // dynamic fields (create)
  const configFields = useMemo(() => {
    switch (type) {
      case 'CASH_BOX': return [{ key: 'boxName', label: 'اسم الصندوق' }, { key: 'note', label: 'ملاحظة' }];
      case 'BANK_ACCOUNT': return [{ key: 'bankName', label: 'اسم البنك' }, { key: 'accountHolder', label: 'اسم حامل البطاقة الكامل' }, { key: 'iban', label: 'IBAN' }, { key: 'note', label: 'ملاحظة' }];
      case 'HAND_DELIVERY': return [{ key: 'delegateName', label: 'اسم المندوب' }, { key: 'note', label: 'ملاحظة' }];
      case 'USDT': return [{ key: 'addressOrIban', label: 'عنوان المحفظة / IBAN' }, { key: 'network', label: 'الشبكة (TRC20/ ERC20)' }, { key: 'note', label: 'ملاحظة' }];
      case 'MONEY_TRANSFER': return [{ key: 'recipientName', label: 'اسم المستلم' }, { key: 'destination', label: 'الوجهة' }, { key: 'officeName', label: 'اسم المكتب' }, { key: 'note', label: 'ملاحظة' }];
      default: return [];
    }
  }, [type]);

  // dynamic fields (edit)
  const editConfigFields = useMemo(() => {
    switch (editType) {
      case 'CASH_BOX': return [{ key: 'boxName', label: 'اسم الصندوق' }, { key: 'note', label: 'ملاحظة' }];
      case 'BANK_ACCOUNT': return [{ key: 'bankName', label: 'اسم البنك' }, { key: 'accountHolder', label: 'اسم حامل البطاقة الكامل' }, { key: 'iban', label: 'IBAN' }, { key: 'note', label: 'ملاحظة' }];
      case 'HAND_DELIVERY': return [{ key: 'delegateName', label: 'اسم المندوب' }, { key: 'note', label: 'ملاحظة' }];
      case 'USDT': return [{ key: 'addressOrIban', label: 'عنوان المحفظة / IBAN' }, { key: 'network', label: 'الشبكة (TRC20/ ERC20)' }, { key: 'note', label: 'ملاحظة' }];
      case 'MONEY_TRANSFER': return [{ key: 'recipientName', label: 'اسم المستلم' }, { key: 'destination', label: 'الوجهة' }, { key: 'officeName', label: 'اسم المكتب' }, { key: 'note', label: 'ملاحظة' }];
      default: return [];
    }
  }, [editType]);

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const { data } = await api.get<PaymentMethod[]>(API_ROUTES.admin.paymentMethods.base);
      setMethods(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError('فشل جلب وسائل الدفع');
      setMethods([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // upload logo helper (create/edit)
  async function uploadLogo(file: File | null): Promise<string | undefined> {
    if (!file) return undefined;
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post<{ url: string }>(API_ROUTES.admin.upload, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.url;
  }

  // CREATE
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const uploadedUrl = await uploadLogo(logoFile);
      const payload = { name, type, logoUrl: uploadedUrl || undefined, note: note || undefined, isActive, config };
      await api.post(API_ROUTES.admin.paymentMethods.base, payload);
      // reset
      setName(''); setNote(''); setIsActive(true); setConfig({});
      setLogoFile(null); setLogoPreview('');
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'خطأ غير معروف';
      setError(`فشل إنشاء وسيلة دفع جديدة: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    }
  };

  // TOGGLE ACTIVE
  const toggleActive = async (m: PaymentMethod) => {
    try {
      await api.patch<PaymentMethod>(API_ROUTES.admin.paymentMethods.byId(m.id), { isActive: !m.isActive });
      await fetchData();
    } catch {
      setError('تعذر تغيير حالة الوسيلة');
    }
  };

  // OPEN EDIT
  const openEdit = (m: PaymentMethod) => {
    setEditItem(m);
    setEditName(m.name);
    setEditType(m.type);
    setEditActive(m.isActive);
    setEditNote(m.note || '');
    // تحويل config لأي record<string,string>
    const obj: Record<string, string> = {};
    Object.entries(m.config || {}).forEach(([k, v]) => obj[k] = String(v ?? ''));
    setEditConfig(obj);
    setEditLogoFile(null);
    setEditLogoPreview(m.logoUrl || '');
    setEditOpen(true);
  };

  // SAVE EDIT
  const saveEdit = async () => {
    if (!editItem) return;
    try {
      setError('');
      let uploadedUrl: string | undefined;
      if (editLogoFile) {
        uploadedUrl = await uploadLogo(editLogoFile);
      }
      await api.patch(API_ROUTES.admin.paymentMethods.byId(editItem.id), {
        name: editName,
        type: editType,
        isActive: editActive,
        note: editNote || undefined,
        config: editConfig,
        ...(uploadedUrl ? { logoUrl: uploadedUrl } : {}), // حدّث الرابط فقط لو مرفوع جديد
      });
      setEditOpen(false);
      setEditItem(null);
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'خطأ غير معروف';
      setError(`فشل تعديل الوسيلة: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    }
  };

  // DELETE
  const deleteItem = async (m: PaymentMethod) => {
    const ok = confirm(`هل أنت متأكد من حذف "${m.name}"؟ لا يمكن التراجع.`);
    if (!ok) return;
    try {
      await api.delete(API_ROUTES.admin.paymentMethods.byId(m.id));
      await fetchData();
    } catch {
      setError('تعذر حذف الوسيلة');
    }
  };

  return (
    <div className="space-y-8">
      {/* CREATE */}
      <section className="bg-gray-50 rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">إضافة وسيلة دفع</h2>
        {error && <div className="mb-3 text-red-600">{error}</div>}

        <form onSubmit={submitCreate} className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">الاسم الظاهر</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full border border-gray-400 rounded px-3 py-2 " placeholder="مثال: حساب بنكي زراعات" />
          </div>

          <div>
            <label className="block mb-1 font-medium">النوع</label>
            <select value={type} onChange={e => setType(e.target.value as PaymentMethodType)} className="w-full border border-gray-400 rounded px-3 py-2">
              {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">شعار الوسيلة (اختياري)</label>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setLogoFile(f);
              setLogoPreview(f ? URL.createObjectURL(f) : '');
            }} className="w-full border border-gray-400 rounded px-3 py-2" />
            {logoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="معاينة الشعار" className="mt-2 w-20 h-20 object-contain border rounded bg-white" />
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">ملاحظة عامة (اختياري)</label>
            <input value={note} onChange={e => setNote(e.target.value)} className="w-full border border-gray-400 rounded px-3 py-2" placeholder="سيُعرض للمستخدمين" />
          </div>

          <div className="flex items-center gap-2">
            <input id="isActive" type="checkbox" checked={isActive} onChange={() => setIsActive(!isActive)} />
            <label htmlFor="isActive" className="font-medium">مفعّل</label>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold mb-2">حقول خاصة بنوع الوسيلة</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {configFields.map(f => (
                <div key={f.key}>
                  <label className="block mb-1 text-sm">{f.label}</label>
                  <input value={config[f.key] || ''} onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full border border-gray-400 rounded px-3 py-2" />
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="px-4 py-2 bg-[var(--btn-primary-bg)] text-white rounded hover:bg-[var(--btn-primary-hover-bg)]">
              حفظ الوسيلة
            </button>
          </div>
        </form>
      </section>

      {/* TABLE */}
      <section className="rounded-xl shadow p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">الوسائل الحالية</h2>
        {loading ? (
          <div>جارِ التحميل...</div>
        ) : methods.length === 0 ? (
          <div className="text-gray-600">لا توجد وسائل بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[var(--tableheaders)] text-right">
                  <th className="border border-gray-400 px-3 py-2">اللوغو</th>
                  <th className="border border-gray-400 px-3 py-2">الاسم</th>
                  <th className="border border-gray-400 px-3 py-2">النوع</th>
                  {/* <th className="px-3 py-2">ملاحظات</th> */}
                  <th className="border border-gray-400 px-3 py-2">الحالة</th>
                  <th className="border border-gray-400 px-3 py-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {methods.map(m => (
                  <tr key={m.id} className="border-b">
                        <td className="border border-gray-400 px-3 py-2">
                        {m.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={fileUrl(m.logoUrl)}
                              alt={m.name}
                              className="w-10 h-10 object-contain bg-white rounded"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/products/placeholder.png"; }}
                            />
                        ) : (
                            <span className="text-gray-400">—</span>
                        )}
                        </td>
                    <td className="border border-gray-400 px-3 py-2">{m.name}</td>
                    <td className="border border-gray-400 px-3 py-2">{typeOptions.find(t => t.value === m.type)?.label || m.type}</td>
                    {/* <td className="px-3 py-2">{m.note || '—'}</td> */}
                    <td className="border border-gray-400 px-3 py-2 text-center">
                      <span
                        className={`inline-block w-4 h-4 rounded-full ${
                          m.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      ></span>
                    </td>
                    <td className="border border-gray-400 px-3 py-3 flex gap-3">
                      <button onClick={() => toggleActive(m)} className="bg-yellow-300 hover:brightness-110 p-1 rounded-lg">
                        {m.isActive ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button onClick={() => openEdit(m)} className="bg-[var(--btn-primary-bg)] hover:brightness-110 text-[var(--btn-primary-text)] rounded p-1">تعديل</button>
                      <button onClick={() => deleteItem(m)} className="bg-red-700 text-white hover:bg-red-500 p-1 rounded">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* EDIT MODAL */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditOpen(false)} />
          <div className="relative bg-[var(--bg-main)] rounded-xl shadow-xl w-full max-w-2xl p-5">
            <h3 className="text-lg font-semibold mb-4">تعديل الوسيلة</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">الاسم الظاهر</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full border rounded px-3 py-2 border border-gray-400" />
              </div>

              <div>
                <label className="block mb-1 font-medium">النوع</label>
                <select value={editType} onChange={e => setEditType(e.target.value as PaymentMethodType)} className="w-full border rounded px-3 py-2 border border-gray-400">
                  {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">شعار الوسيلة</label>
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setEditLogoFile(f);
                  setEditLogoPreview(f ? URL.createObjectURL(f) : (editItem?.logoUrl || ''));
                }} className="w-full border rounded px-3 py-2 border border-gray-400 bg-white" />
                {editLogoPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(editLogoPreview)} alt="preview" className="mt-2 w-20 h-20 object-contain border rounded bg-[var(--bg-main)]" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input id="editActive" type="checkbox" checked={editActive} onChange={() => setEditActive(!editActive)} />
                <label htmlFor="editActive" className="font-medium">مفعّل</label>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">ملاحظة عامة</label>
                <input value={editNote} onChange={e => setEditNote(e.target.value)} className="w-full border rounded px-3 py-2 bg-[var(--bg-main)]" />
              </div>

              <div className="md:col-span-2">
                <h4 className="font-semibold mb-2">حقول خاصة بالنوع</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {editConfigFields.map(f => (
                    <div key={f.key}>
                      <label className="block mb-1 text-sm">{f.label}</label>
                      <input value={editConfig[f.key] || ''} onChange={e => setEditConfig(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full border rounded px-3 py-2 border border-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setEditOpen(false)} className="bg-gray-500 hover:brightness-110 text-white px-4 py-2 rounded border">إلغاء</button>
              <button onClick={saveEdit} className="px-4 py-2 rounded text-white bg-[var(--btn-primary-bg)] hover:brightness-110">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
