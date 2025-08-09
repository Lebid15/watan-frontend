'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '@/utils/api';

interface Currency {
  id: string;
  name: string;
  code: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // جلب العملات من الباك إند
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await axios.get<Currency[]>(API_ROUTES.currencies.base);
        setCurrencies(res.data);

        // اختيار الليرة السورية افتراضيًا إذا موجودة
        const syp = res.data.find((c) => c.code === 'SYP');
        if (syp) setCurrencyId(syp.id);
      } catch (err) {
        console.error('فشل في جلب العملات', err);
      }
    };
    fetchCurrencies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(API_ROUTES.users.register, {
        email,
        password,
        fullName,
        username,
        currencyId
      });
      alert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل التسجيل. قد يكون البريد مستخدمًا مسبقًا.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] flex justify-center">
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-white flex flex-col">
        
        {/* الهيدر */}
        <div className="relative h-64 sm:h-72">
          <img
            src="/pages/loginbg.svg"
            alt="Register Illustration"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,118,255,0.65) 0%, rgba(0,118,255,0.35) 55%, rgba(255,255,255,0) 100%), radial-gradient(60% 50% at 50% 0%, rgba(0,118,255,0.35) 0%, rgba(0,118,255,0) 70%)'
            }}
          />
          <svg
            className="absolute -bottom-1 left-0 w-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              d="M0,224L60,208C120,192,240,160,360,160C480,160,600,192,720,208C840,224,960,224,1080,202.7C1200,181,1320,139,1380,117.3L1440,96L1440,320L0,320Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* الفورم */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-900">
            إنشاء حساب جديد
          </h2>

          {error && <div className="mb-4 text-red-600 text-center">{error}</div>}

          {/* الاسم الكامل */}
          <label className="block mb-2 font-medium text-gray-800" htmlFor="fullName">
            الاسم الكامل
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
          />

          {/* اسم المستخدم */}
          <label className="block mb-2 font-medium text-gray-800" htmlFor="username">
            اسم المستخدم
          </label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
          />

          {/* البريد الإلكتروني */}
          <label className="block mb-2 font-medium text-gray-800" htmlFor="email">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
          />

          {/* كلمة المرور */}
          <label className="block mb-2 font-medium text-gray-800" htmlFor="password">
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
          />

          {/* اختيار العملة */}
          <label className="block mb-2 font-medium text-gray-800" htmlFor="currency">
            اختر العملة
          </label>
          <select
            id="currency"
            required
            value={currencyId}
            onChange={(e) => setCurrencyId(e.target.value)}
            className="w-full mb-6 px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
          >
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* زر التسجيل */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] py-2 rounded hover:bg-[var(--btn-primary-hover-bg)] transition disabled:opacity-50"
          >
            {loading ? 'جاري التسجيل...' : 'تسجيل'}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            لديك حساب؟{' '}
            <a href="/login" className="text-[var(--btn-primary-bg)] hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
