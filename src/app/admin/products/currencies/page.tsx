'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_ROUTES } from '@/utils/api';

interface Currency {
  id: string;
  name: string;
  code: string;
  rate: number;
  isActive: boolean;
  isPrimary: boolean;
}

const AR_SYMBOLS: Record<string, string> = {
  SYP: 'ل.س', SAR: 'ر.س', AED: 'د.إ', KWD: 'د.ك', QAR: 'ر.ق', BHD: 'د.ب',
  OMR: 'ر.ع', JOD: 'د.أ', LBP: 'ل.ل', DZD: 'د.ج', MAD: 'د.م', TND: 'د.ت',
  LYD: 'د.ل', IQD: 'د.ع', EGP: 'ج.م', TRY: '₺', USD: '$', EUR: '€', GBP: '£',
};

// قائمة مرجعية للأسماء حتى نوحّد الإدخال عند الإضافة
const NAME_BY_CODE: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  TRY: 'Turkish Lira',
  EGP: 'Egyptian Pound',
  SAR: 'Saudi Riyal',
  AED: 'UAE Dirham',
  KWD: 'Kuwaiti Dinar',
  QAR: 'Qatari Riyal',
  BHD: 'Bahraini Dinar',
  OMR: 'Omani Rial',
  JOD: 'Jordanian Dinar',
  LBP: 'Lebanese Pound',
  DZD: 'Algerian Dinar',
  MAD: 'Moroccan Dirham',
  TND: 'Tunisian Dinar',
  LYD: 'Libyan Dinar',
  IQD: 'Iraqi Dinar',
  SYP: 'Syrian Pound',
};

const arabicSymbol = (code?: string) => (code ? (AR_SYMBOLS[code] ?? code) : '');

const formatExample = (code: string) => {
  const symbol = arabicSymbol(code);
  const n = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234.5);
  return `${n} ${symbol}`;
};

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // حالة المودال للإضافة
  const [addOpen, setAddOpen] = useState(false);
  const [addCode, setAddCode] = useState<string>('');
  const [addRate, setAddRate] = useState<string>('1');

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''),
    []
  );

  // جلب العملات
  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Currency[]>(API_ROUTES.currencies.base, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setCurrencies(res.data.map((c) => ({ ...c, rate: Number(c.rate) })));
      setError('');
    } catch {
      setError('فشل في جلب العملات');
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // الأكواد المتاحة للإضافة (غير الموجودة حاليًا)
  const existingCodes = new Set(currencies.map((c) => c.code));
  const selectableCodes = Object.keys(NAME_BY_CODE).filter((code) => !existingCodes.has(code));

  // تعديل السعر محليًا
  const handleChange = (id: string, newRateRaw: string) => {
    const parsed = parseFloat(newRateRaw);
    setCurrencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rate: Number.isFinite(parsed) ? parsed : 0 } : c))
    );
  };

  // حفظ جماعي
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        API_ROUTES.currencies.bulkUpdate,
        { currencies },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      alert('تم حفظ التغييرات بنجاح');
    } catch {
      alert('فشل في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  // فتح مودال إضافة
  const openAdd = () => {
    setAddCode(selectableCodes[0] ?? 'USD');
    setAddRate('1');
    setAddOpen(true);
  };

  // تأكيد الإضافة
  const confirmAdd = async () => {
    if (!addCode) return alert('اختر العملة');
    const rateNum = parseFloat(addRate);
    if (!Number.isFinite(rateNum) || rateNum <= 0) return alert('أدخل سعرًا صحيحًا (> 0)');

    const payload: any = {
      code: addCode,
      name: NAME_BY_CODE[addCode] || addCode,
      rate: rateNum,
      isActive: true,
      // لو عندك الحقل موجود في الـ Entity يدعمه:
      symbolAr: AR_SYMBOLS[addCode] ?? undefined,
    };

    try {
      await axios.post(API_ROUTES.currencies.base, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setAddOpen(false);
      await fetchCurrencies();
    } catch {
      alert('فشل في إضافة العملة');
    }
  };

  if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
  if (error) return <p className="text-center mt-4 text-red-600">{error}</p>;

  return (
    <div className="bg-[var(--bg-main)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-100">إدارة العملات</h1>

        {/* ✅ استبدال زر الحفظ العلوي بزر إضافة عملة جديدة */}
        <button
          onClick={openAdd}
          disabled={selectableCodes.length === 0}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition disabled:opacity-60"
          title={selectableCodes.length === 0 ? 'لا توجد عملات متاحة للإضافة' : 'إضافة عملة جديدة'}
        >
          إضافة عملة جديدة
        </button>
      </div>

      {/* جدول العملات */}
      {currencies.length === 0 ? (
        <div className="bg-[var(--main-color)] rounded p-6 text-center">
          <p className="mb-2">لا توجد عملات حالياً.</p>
          <p className="mb-4 text-sm opacity-80">استخدم زر “إضافة عملة جديدة” بالأعلى لبدء الإضافة.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 bg-[var(--bg-main)] text-sm">
              <thead>
                <tr className="bg-[var(--main-color)]">
                  <th className="border p-2 text-right">العملة</th>
                  <th className="border p-2 text-right">الكود</th>
                  <th className="border p-2 text-right">رمز العرض (عربي)</th>
                  <th className="border p-2 text-right">مثال عرض</th>
                  <th className="border p-2 text-right">سعر مقابل الدولار (1$ = ؟)</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--main-color)]">
                {currencies.map((currency) => (
                  <tr key={currency.id}>
                    <td className="border p-2">{currency.name}</td>
                    <td className="border p-2">{currency.code}</td>
                    <td className="border p-2 text-center">{arabicSymbol(currency.code)}</td>
                    <td className="border p-2 text-center">{formatExample(currency.code)}</td>
                    <td className="border p-2">
                      <input
                        id={`rate-${currency.id}`}
                        name={`rate-${currency.id}`}
                        type="number"
                        step="0.0001"
                        value={currency.rate}
                        onChange={(e) => handleChange(currency.id, e.target.value)}
                        className="bg-[var(--main-color)] border rounded px-2 py-1 w-36 text-center"
                        inputMode="decimal"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* زر الحفظ السفلي (يبقى) */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </>
      )}

      {/* مودال إضافة عملة */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
          <div className="bg-[var(--bg-main)] rounded-lg p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">إضافة عملة جديدة</h3>

            <label className="block mb-2">اختر العملة</label>
            <select
              value={addCode}
              onChange={(e) => setAddCode(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded bg-white text-black"
            >
              {selectableCodes.map((code) => (
                <option key={code} value={code}>
                  {NAME_BY_CODE[code] ?? code} ({code})
                </option>
              ))}
            </select>

            <label className="block mb-2">سعر مقابل الدولار (1$ = ؟)</label>
            <input
              type="number"
              step="0.0001"
              value={addRate}
              onChange={(e) => setAddRate(e.target.value)}
              className="w-full mb-6 px-3 py-2 border rounded bg-white text-black"
              placeholder="مثال: 3.7"
              inputMode="decimal"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
              >
                إلغاء
              </button>
              <button
                onClick={confirmAdd}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
