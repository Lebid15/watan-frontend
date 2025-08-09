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
  // عملات عربية/إقليمية
  SYP: 'ل.س',
  SAR: 'ر.س',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  JOD: 'د.أ',
  LBP: 'ل.ل',
  DZD: 'د.ج',
  MAD: 'د.م',
  TND: 'د.ت',
  LYD: 'د.ل',
  IQD: 'د.ع',
  EGP: 'ج.م',
  // أخرى شائعة
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const arabicSymbol = (code?: string) => (code ? (AR_SYMBOLS[code] ?? code) : '');

const formatExample = (code: string) => {
  const symbol = arabicSymbol(code);
  // نعرض الرمز على "يسار" الرقم بما أنه عربي، باستثناء الرموز العالمية مثل $/€/£/₺ نتركها بعد الرقم أيضًا
  const rtlLike = ['SYP','SAR','AED','KWD','QAR','BHD','OMR','JOD','LBP','DZD','MAD','TND','LYD','IQD','EGP'];
  const n = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234.5);
  return rtlLike.includes(code) ? `${n} ${symbol}` : `${n} ${symbol}`;
};

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : ''), []);

  // ✅ جلب العملات
  const fetchCurrencies = async () => {
    try {
      const res = await axios.get<Currency[]>(API_ROUTES.currencies.base, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrencies(res.data.map(c => ({ ...c, rate: Number(c.rate) })));
      setLoading(false);
    } catch {
      setError('فشل في جلب العملات');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ تعديل السعر في الواجهة
  const handleChange = (id: string, newRateRaw: string) => {
    const parsed = parseFloat(newRateRaw);
    setCurrencies(prev =>
      prev.map(c => (c.id === id ? { ...c, rate: Number.isFinite(parsed) ? parsed : 0 } : c))
    );
  };

  // ✅ حفظ جميع التغييرات في طلب واحد
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        API_ROUTES.currencies.bulkUpdate,
        { currencies },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('تم حفظ التغييرات بنجاح');
    } catch {
      alert('فشل في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-4">جاري التحميل...</p>;
  if (error) return <p className="text-center mt-4 text-red-600">{error}</p>;

  return (
    <div className="bg-[var(--bg-main)] p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-100">إدارة العملات</h1>

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
            {currencies.map(currency => (
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

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
      </button>
    </div>
  );
}
