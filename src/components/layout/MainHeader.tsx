// src/components/layout/MainHeader.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import api, { API_ROUTES } from '@/utils/api';

interface UserProfile {
  id: string;
  balance: string;
  email?: string;
}

export default function MainHeader() {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<string>('0.00');
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    router.push('/login');
  };

  // جلب رصيد المستخدم
  useEffect(() => {
    const fetchBalance = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await api.get<UserProfile>(API_ROUTES.users.profile, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.balance) {
          setBalance(parseFloat(res.data.balance).toFixed(2));
        }
      } catch (err) {
        console.error('فشل في جلب الرصيد', err);
      }
    };
    fetchBalance();
  }, []);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full bg-[#0B0E13] text-white px-6 py-3 flex justify-between items-center shadow-md z-50">
      {/* اليسار: رصيد المحفظة + زر الحساب ملتصقان */}
      <div className="flex items-center space-x-1">
        <span className="!bg-white text-green-800 text-[13px] font-bold px-3 py-0.5 rounded-full shadow ml-3">
          $ {balance}
        </span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center hover:text-yellow-300"
          >
            <FaUserCircle className="text-3xl" />
          </button>
          {open && (
            <div className="absolute right-full top-full mr-2 mt-2 w-48 bg-white text-black rounded-lg shadow-lg z-[9999]">
              <button
                className="block w-full px-4 py-2 text-right hover:bg-gray-100"
                onClick={() => router.push('/user')}
              >
                الملف الشخصي
              </button>
              <button
                className="block w-full px-4 py-2 text-right hover:bg-gray-100"
                onClick={() => router.push('/user/favorites')}
              >
                المفضلة
              </button>
              <button
                className="block w-full px-4 py-2 text-right hover:bg-gray-100"
                onClick={() => router.push('/user/security')}
              >
                الحماية
              </button>
              <button
                className="block w-full px-4 py-2 text-right text-red-600 hover:bg-gray-100"
                onClick={logout}
              >
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>

      {/* اليمين: اسم المشروع */}
      <div className="text-xl font-semibold">
        Kadro Store
      </div>
    </header>
  );
}
