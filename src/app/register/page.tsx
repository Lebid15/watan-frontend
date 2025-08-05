'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '../../utils/api'; // ✅ استدعاء الروابط الموحدة

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(API_ROUTES.users.register, { email, password });

      alert('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.');
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل التسجيل. قد يكون البريد مستخدمًا مسبقًا.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md max-w-md w-full"
      >
        <h2 className="text-2xl mb-6 font-semibold text-center">
          إنشاء حساب جديد
        </h2>

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
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? 'جاري التسجيل...' : 'تسجيل'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          لديك حساب؟{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            تسجيل الدخول
          </a>
        </p>
      </form>
    </div>
  );
}
