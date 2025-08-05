'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_ROUTES } from '@/utils/api';

interface User {
  email: string;
  role: string;
  balance: string;
  fullName?: string;
  phoneNumber?: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    axios
      .get<User>(API_ROUTES.auth.profile, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const userData = res.data;
        setUser(userData);

        // ✅ التحقق من الدور
        if (userData.role !== 'admin') {
          router.push('/user/dashboard'); // صفحة المستخدم العادي لاحقًا
        }
      })
      .catch(() => {
        router.push('/login'); // لو فشل جلب البيانات يرجع لصفحة تسجيل الدخول
      });
  }, [router]);

  if (!user) return <p>جاري التحميل...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">لوحة تحكم المشرف</h1>
      <div className="space-y-2">
        <p>مرحباً، {user?.fullName || user?.email}</p>
        <p>الدور: {user?.role}</p>
        <p>الرصيد: {user?.balance}</p>
        {user?.phoneNumber && <p>رقم الهاتف: {user.phoneNumber}</p>}
      </div>
    </div>
  );
}
