// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePasskeys } from '@/hooks/usePasskeys';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import api, { API_ROUTES } from '@/utils/api';
import { useUser } from '../../context/UserContext';

interface LoginTokenResponse { token: string; }

interface UserResponse {
  id: string; email: string; role: string;
  balance?: string | number; fullName?: string | null;
  phoneNumber?: string | null; priceGroupId?: string | null; priceGroupName?: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useUser();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { authenticateWithPasskey, registerPasskey, loading: passkeyLoading } = usePasskeys();
  const { show } = useToast();
  const [showPasskeyActions, setShowPasskeyActions] = useState(true);

  // Track if subdomain present (now only for potential UX messaging; no tenantCode field shown anymore)
  useEffect(() => { /* keeping hook for future subdomain logic */ }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = { emailOrUsername: identifier, password, email: identifier, username: identifier };

      const loginRes = await api.post<LoginTokenResponse>(API_ROUTES.auth.login, payload, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });

      if (loginRes.status < 200 || loginRes.status >= 300 || !loginRes.data?.token) {
        const msg =
          (loginRes.data as any)?.message ||
          (loginRes.data as any)?.error ||
          `فشل تسجيل الدخول (HTTP ${loginRes.status})`;
        throw new Error(msg);
      }

      const { token } = loginRes.data as LoginTokenResponse;
      try { localStorage.setItem('token', token); } catch {}

      // جلب البروفايل
      const userRes = await api.get<UserResponse>(API_ROUTES.users.profile, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      });

      if (userRes.status < 200 || userRes.status >= 300) {
        throw new Error(`تعذر جلب الملف الشخصي (HTTP ${userRes.status})`);
      }

      const user = userRes.data;

      // تخزين مساعد
      try {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.priceGroupId) localStorage.setItem('userPriceGroupId', user.priceGroupId);
        else localStorage.removeItem('userPriceGroupId');
      } catch {}

      // كوكيز للميدلوير
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `access_token=${token}; Max-Age=${maxAge}; Path=/`;
      document.cookie = `role=${user.role}; Max-Age=${maxAge}; Path=/`;

      try { await refreshUser(); } catch {}

      // دعم ?next=
      let nextUrl: string | null = null;
      if (typeof window !== 'undefined') {
        const sp = new URLSearchParams(window.location.search);
        nextUrl = sp.get('next');
      }

      if (nextUrl) {
        router.push(nextUrl);
      } else {
        // ✅ توجيه مطوّر + مالك المنصة إلى /dev
        const role = (user.role ?? '').toString().toLowerCase();
        if (role === 'developer' || role === 'instance_owner') {
          router.push('/dev');
        } else if (['admin', 'supervisor', 'owner'].includes(role)) {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الدخول. تحقق من البيانات وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] flex justify-center">
      <div className="w-full max-w-md rounded-none sm:rounded-2xl shadow-2xl overflow-hidden bg-white flex flex-col">
        <div className="relative h-64 sm:h-72">
          <img
            src="/pages/loginbg.svg"
            alt="Login Illustration"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,118,255,0.65) 0%, rgba(0,118,255,0.35) 55%, rgba(255,255,255,0) 100%), radial-gradient(60% 50% at 50% 0%, rgba(0,118,255,0.35) 0%, rgba(0,118,255,0) 70%)'
            }}
          />
          <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path
              d="M0,224L60,208C120,192,240,160,360,160C480,160,600,192,720,208C840,224,960,224,1080,202.7C1200,181,1320,139,1380,117.3L1440,96L1440,320L0,320Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-900">تسجيل الدخول</h2>

          {error && <div className="mb-4 text-red-600 text-center">{error}</div>}

          <label className="block mb-2 font-medium text-gray-800" htmlFor="identifier">
            البريد الإلكتروني أو اسم المستخدم
          </label>
          <input
            id="identifier"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
            placeholder="example@mail.com أو user123"
            autoComplete="username"
          />

          <label className="block mb-2 font-medium text-gray-800" htmlFor="password">كلمة المرور</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading || passkeyLoading}
            className="w-full bg-sky-600 text-white py-2 rounded hover:brightness-110 transition disabled:opacity-60"
          >
            {(loading || passkeyLoading) ? '...' : 'تسجيل الدخول'}
          </button>

          {showPasskeyActions && typeof window !== 'undefined' && localStorage.getItem('token') && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await authenticateWithPasskey(); await refreshUser(); router.push('/');
                  } catch (e:any) { show(e?.message || 'فشل'); }
                }}
                className="w-full border border-sky-600 text-sky-700 py-2 rounded hover:bg-sky-50 transition disabled:opacity-60"
                disabled={passkeyLoading || loading}
              >
                {passkeyLoading ? '...' : 'تسجيل الدخول بـ Passkey'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!identifier) { show('اكتب بريدك أولاً'); return; }
                  try { await registerPasskey(`جهاز ${identifier}`); show('تم إنشاء Passkey'); } catch (e:any) { show(e?.message || 'خطأ'); }
                }}
                className="w-full border border-gray-400 text-gray-700 py-2 rounded hover:bg-gray-50 transition disabled:opacity-60"
                disabled={passkeyLoading || loading}
              >
                {passkeyLoading ? '...' : 'إضافة Passkey لهذا الحساب بعد تسجيل الدخول'}
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-600">
            ليس لديك حساب؟{' '}
            <a href="/register" className="text-blue-600 hover:underline">
              أنشئ حساب جديد
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
