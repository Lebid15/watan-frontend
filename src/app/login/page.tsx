'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '@/utils/api';
import { useUser } from '../../context/UserContext';

interface LoginTokenResponse {
  token: string;
}

interface UserResponse {
  id: string;
  email: string;
  role: string;
  balance?: string | number;
  fullName?: string | null;
  phoneNumber?: string | null;
  priceGroupId?: string | null;
  priceGroupName?: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 1️⃣ تسجيل الدخول (الحصول على التوكن)
      const loginRes = await axios.post<LoginTokenResponse>(
        API_ROUTES.auth.login,
        { email, password }
      );
      const { token } = loginRes.data;
      localStorage.setItem('token', token);

      // 2️⃣ جلب بيانات المستخدم
      const userRes = await axios.get<UserResponse>(
        API_ROUTES.users.profile,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = userRes.data;

      // 3️⃣ حفظ البيانات في localStorage و Context
      localStorage.setItem('user', JSON.stringify(user));
      setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        balance: String(user.balance ?? '0.00'),
        fullName: user.fullName ?? undefined,
        phoneNumber: user.phoneNumber ?? undefined,
        priceGroupId: user.priceGroupId ?? undefined,
        priceGroupName: user.priceGroupName ?? undefined,
      });

      if (user.priceGroupId) {
        localStorage.setItem('userPriceGroupId', user.priceGroupId);
      } else {
        localStorage.removeItem('userPriceGroupId');
      }

      // 4️⃣ التوجيه حسب الدور
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }

    } catch (err) {
      setError('فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded shadow-md max-w-md w-full"
      >
        <h2 className="text-2xl mb-6 font-semibold text-center">تسجيل الدخول</h2>

        {error && (
          <div className="mb-4 text-red-600 text-center">{error}</div>
        )}

        <label className="block mb-2 font-medium" htmlFor="email">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded bg-[var(--main-color)] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block mb-2 font-medium" htmlFor="password">
          كلمة المرور
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 border rounded bg-[var(--main-color)] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-gray-100 py-2 rounded hover:bg-blue-700 transition"
        >
          تسجيل الدخول
        </button>

        <p className="mt-4 text-center text-sm text-gray-300">
          ليس لديك حساب؟{' '}
          <a href="/register" className="text-blue-400 hover:underline">
            أنشئ حساب جديد
          </a>
        </p>
      </form>
    </div>
  );
}
