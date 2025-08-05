'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '@/utils/api';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    balance?: string | number;
    fullName?: string | null;
    phoneNumber?: string | null;
    priceGroupId?: string | null;   // ✅ الاسم النهائي من الباك
    priceGroupName?: string | null; // ✅ الاسم النهائي من الباك
  };
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 1️⃣ تسجيل الدخول
      const loginRes = await axios.post<LoginResponse>(
        API_ROUTES.auth.login,
        { email, password }
      );

      const { token, user } = loginRes.data;

      // 2️⃣ حفظ بيانات المستخدم والتوكن في LocalStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.priceGroupId) {
        localStorage.setItem('userPriceGroupId', user.priceGroupId);
      } else {
        localStorage.removeItem('userPriceGroupId');
      }

      // 3️⃣ التوجيه حسب الدور
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/'); // واجهة المستخدم العادي
      }

    } catch (err) {
      setError('فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md max-w-md w-full"
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
          className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full mb-6 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          تسجيل الدخول
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          ليس لديك حساب؟{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            أنشئ حساب جديد
          </a>
        </p>
      </form>
    </div>
  );
}
