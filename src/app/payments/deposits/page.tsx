'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { API_ROUTES, API_BASE_URL } from '@/utils/api';

type PaymentMethodType = 'CASH_BOX' | 'BANK_ACCOUNT' | 'HAND_DELIVERY' | 'USDT' | 'MONEY_TRANSFER';

interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  logoUrl?: string | null;
  note?: string | null;
  isActive: boolean;
  config: Record<string, any>;
}

const FILES_BASE = API_BASE_URL.replace(/\/api$/, '');
const fileUrl = (u?: string | null) => (!u ? '' : u.startsWith('/uploads') ? `${FILES_BASE}${u}` : u);

export default function DepositMethodsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get<PaymentMethod[]>(API_ROUTES.payments.methods.active);
      setMethods(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'تعذر جلب وسائل الدفع.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="min-h-screen p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">إضافة رصيد</h1>
      <p className="text-[var(--text-main)] mb-6">اختر وسيلة الدفع المناسبة للمتابعة.</p>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {loading ? (
        <div>جارِ التحميل...</div>
      ) : methods.length === 0 ? (
        <div className="text-[var(--text-secondary)]">لا توجد وسائل دفع مفعّلة حالياً.</div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(`/payments/deposits/${m.id}`)}
              className="
                bg-[var(--bg-main)] text-[var(--text-main)]
                rounded-xl shadow hover:shadow-lg transition
                pb-2 text-sm
                flex flex-col items-center
              "
              aria-label={`اختيار وسيلة ${m.name}`}
            >
              <div className="w-full h-20 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.logoUrl ? (
                  <img
                    src={fileUrl(m.logoUrl)}
                    alt={m.name}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-100 grid place-items-center text-gray-400">—</div>
                )}
              </div>

              <div className="w-full text-center">
                <div className="leading-tight truncate">{m.name}</div>
                {m.note && (
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {m.note}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
