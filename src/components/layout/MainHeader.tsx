'use client';

import { useState, useRef, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

export default function MainHeader() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { user, setUser, refreshUser } = useUser(); // ✅ أضفنا setUser

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userPriceGroupId');

    setUser(null); // ✅ حذف بيانات المستخدم من السياق
    router.push('/login');
  };

  // ✅ تحديث بيانات المستخدم عند تحميل الهيدر
  useEffect(() => {
    refreshUser();
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
    <header className="bg-[var(--bg-color)] fixed top-0 left-0 w-full text-white px-6 py-3 flex justify-between items-center shadow-md z-50">
      {/* اليسار: رصيد المحفظة + زر الحساب */}
      <div className="flex items-center space-x-1">
        <span className="!bg-white text-green-800 text-[13px] font-bold px-3 py-0.5 rounded-full shadow ml-3">
          ${user?.balance ?? '0.00'}
        </span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center hover:text-yellow-300"
          >
            <FaUserCircle className="text-3xl" />
          </button>
          {open && (
            <div className="absolute right-full top-full mr-2 mt-2 w-48 bg-[var(--main-color)] text-black rounded-lg border border-gray-400 text-gray-200 shadow-lg z-[9999]">
              <button
                className="block w-full px-4 py-2 text-right hover:bg-[var(--bg-color)]"
                onClick={() => router.push('/user')}
              >
                الملف الشخصي
              </button>
              <button
                className="block w-full px-4 py-2 text-right hover:bg-[var(--bg-color)]"
                onClick={() => router.push('/user/favorites')}
              >
                المفضلة
              </button>
              <button
                className="block w-full px-4 py-2 text-right hover:bg-[var(--bg-color)]"
                onClick={() => router.push('/user/security')}
              >
                الحماية
              </button>
              <button
                className="block w-full px-4 py-2 text-right hover:bg-[var(--bg-color)]"
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
