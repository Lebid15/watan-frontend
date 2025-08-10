'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface CurrencyRow {
  id?: string;
  code: string;          // مثل USD, TRY, EUR, SYP
  rate?: number;         // القيمة مقابل 1 USD (إن وُجد)
  value?: number;        // بديل محتمَل
  price?: number;        // بديل محتمَل
}

interface ProfileWithCurrency {
  id: string;
  email: string;
  walletCurrency?: string; // قد تكون غير موجودة، نتعامل مع ذلك
}

const FILES_BASE = API_BASE_URL.replace(/\/api$/, '');
const fileUrl = (u?: string | null) => (!u ? '' : u.startsWith('/uploads') ? `${FILES_BASE}${u}` : u);

function valueOf(c: CurrencyRow): number {
  const n = Number(c.rate ?? c.value ?? c.price ?? 0);
  return isFinite(n) && n > 0 ? n : 0;
}

export default function DepositCreatePage() {
  const { methodId } = useParams<{ methodId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyRow[]>([]);
  const [profile, setProfile] = useState<ProfileWithCurrency | null>(null);

  const [amount, setAmount] = useState<string>('');            // المبلغ المُرسل
  const [fromCurrency, setFromCurrency] = useState<string>(''); // العملة المُرسلة
  const [note, setNote] = useState<string>('');                // ملاحظة اختيارية

  // خريطة: code -> rate مقابل 1 USD
  const currencyMap = useMemo(() => {
    const m: Record<string, number> = {};
    currencies.forEach((c) => (m[c.code] = valueOf(c)));
    return m;
  }, [currencies]);

  // إن لم يأتِ walletCurrency من البروفايل، نختار SYP إن وُجدت، وإلا أول عملة.
  const walletCurrency = useMemo(() => {
    const fromProfile = profile?.walletCurrency?.toUpperCase().trim();
    if (fromProfile && currencyMap[fromProfile]) return fromProfile;
    if (currencyMap['SYP']) return 'SYP';
    return currencies[0]?.code || '';
  }, [profile, currencyMap, currencies]);

  // السعر المستخدم للتحويل: amount × (rate[WALLET] / rate[FROM])
  const rateUsed = useMemo(() => {
    const rFrom = currencyMap[fromCurrency];
    const rTo = currencyMap[walletCurrency];
    if (!rFrom || !rTo) return 0;
    return rTo / rFrom;
  }, [currencyMap, fromCurrency, walletCurrency]);

  const convertedAmount = useMemo(() => {
    const a = Number(amount);
    if (!a || !rateUsed) return 0;
    return a * rateUsed;
  }, [amount, rateUsed]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');

      // 1) الوسائل الفعّالة ثم اختر الوسيلة المطلوبة
      const methodsRes = await api.get<PaymentMethod[]>(API_ROUTES.payments.methods.active);
      const allMethods = Array.isArray(methodsRes.data) ? methodsRes.data : [];
      const current = allMethods.find((m) => m.id === methodId) || null;
      setMethod(current);

      // 2) بروفايل المستخدم
      const profRes = await api.get<ProfileWithCurrency>(API_ROUTES.users.profileWithCurrency);
      setProfile(profRes.data || null);

      // 3) العملات
      const currRes = await api.get<CurrencyRow[]>(API_ROUTES.currencies.base);
      const list = Array.isArray(currRes.data) ? currRes.data : [];
      setCurrencies(list);

      // افتراضيًا اختر USD إن وُجد، وإلا أول عملة متاحة
      const defaultFrom =
        list.find((c) => c.code === 'USD')?.code ||
        list[0]?.code ||
        '';
      setFromCurrency(defaultFrom);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'تعذّر التحميل.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methodId]);

  const submitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (!method) throw new Error('لم يتم العثور على وسيلة الدفع المحددة.');
      const a = Number(amount);
      if (!a || a <= 0) throw new Error('يرجى إدخال مبلغ صحيح.');

      // نرسل فقط الحقول المطلوبة — الخدمة في الباك إند تحسب السعر والناتج بنفسها
      await api.post(API_ROUTES.payments.deposits.create, {
        methodId: method.id,
        originalAmount: a,
        originalCurrency: fromCurrency,
        walletCurrency,
        note: note || undefined,
      });

      alert('تم إرسال طلب الإيداع بنجاح! سيقوم فريقنا بمراجعته.');
      router.push('/wallet'); // وجهة مناسبة بعد الإرسال
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'تعذّر إرسال الطلب.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="min-h-screen p-2 max-w-2xl mx-auto">
      <button onClick={() => history.back()} className="text-sm text-yellow-300 hover:underline mb-3">
        ← رجوع
      </button>
      <h1 className="text-lg text-[var(--text-main)] font-bold mb-1">إنشاء طلب إيداع</h1>
      <p className="text-[var(--text-secondary)] mb-2">اختر المبلغ وعملة التحويل.</p>

      {loading ? (
        <div>جارِ التحميل...</div>
      ) : !method ? (
        <div className="text-red-600">لم يتم العثور على وسيلة الدفع.</div>
      ) : (
        <>
          <div className="bg-[var(--bg-orders)] rounded-xl shadow p-1">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {method.logoUrl ? (
                <img
                  src={fileUrl(method.logoUrl)}
                  alt={method.name}
                  className="w-12 h-12 object-contain bg-[var(--bg-orders)] rounded"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-[var(--bg-section)] grid place-items-center text-[var(--text-main)]">
                  —
                </div>
              )}
              <div>
                <div className="font-semibold">{method.name}</div>
                {method.note && <div className="text-xs text-[var(--text-main)]">{method.note}</div>}
              </div>
            </div>
          </div>

          {error && <div className="mb-3 text-red-600">{error}</div>}

          <form onSubmit={submitDeposit} className="bg-[var(--bg-main)] rounded-xl shadow p-4 space-y-4">
            {/* المبلغ + العملة على سطر واحد */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 font-medium">المبلغ</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2 bg-[var(--bg-main)]"
                  placeholder="مثال: 100"
                />
              </div>
              <div className="w-24">
                <label className="block mb-1 font-medium">العملة</label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full border rounded px-2 py-2 bg-[var(--bg-main)]"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* عملة المحفظة + سعر الصرف بجانب بعض */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 font-medium">عملة محفظتك</label>
                <input
                  value={walletCurrency}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-[var(--bg-main)]"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">سعر الصرف</label>
                <input
                  value={rateUsed ? Number(rateUsed).toFixed(2) : ''}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-[var(--bg-main)]"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium">القيمة التي ستُضاف لمحفظتك</label>
              <input
                value={convertedAmount ? Number(convertedAmount).toFixed(2) : ''}
                readOnly
                className="w-full border rounded px-3 py-2 bg-[var(--bg-section)]"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">ملاحظة (اختياري)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-[var(--bg-main)]"
                placeholder="مثال: رقم الحوالة / تفاصيل إضافية"
              />
            </div>

            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--btn-primary-bg)] text-white rounded hover:bg-[var(--btn-primary-hover-bg)]"
              >
                طلب
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
