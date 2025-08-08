'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Currency {
  id: string;
  name: string;
  code: string;
  rate: number;       // سعر الصرف مقابل الدولار
  isActive: boolean;  // هل العملة مفعلة
  isPrimary: boolean; // هل هي العملة الأساسية
}

// جدول رموز العملات
const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  TRY: '₺',
  SAR: '﷼',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'ب.د',
  OMR: 'ر.ع',
};

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // جلب قائمة العملات
  const fetchCurrencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Currency[]>('http://localhost:3001/api/currencies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // تحويل rate إلى رقم
      const formatted = res.data.map((c) => ({
        ...c,
        rate: Number(c.rate),
      }));
      setCurrencies(formatted);
      setLoading(false);
    } catch {
      setError('فشل في جلب العملات');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  // تحديث السعر في الواجهة
  const handleChange = (id: string, newRate: number) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rate: newRate } : c))
    );
  };

  // حفظ جميع التغييرات
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      for (const currency of currencies) {
        await axios.put(
          `http://localhost:3001/api/currencies/${currency.id}`,
          { rate: currency.rate },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
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
        <table className="min-w-full border border-gray-300 bg-white">
          <thead>
            <tr className="bg-[var(--main-color)]">
              <th className="border p-2">العملة</th>
              <th className="border p-2">الكود</th>
              <th className="border p-2">الرمز</th>
              <th className="border p-2">سعر مقابل الدولار</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--main-color)]">
            {currencies.map((currency) => (
              <tr key={currency.id}>
                <td className="border p-2">{currency.name}</td>
                <td className="border p-2">{currency.code}</td>
                <td className="border p-2 text-center">
                  {currencySymbols[currency.code] || currency.code}
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={currency.rate}
                    onChange={(e) =>
                      handleChange(currency.id, parseFloat(e.target.value))
                    }
                    className="bg-[var(--main-color)] border rounded px-2 py-1 w-28 text-center"
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
