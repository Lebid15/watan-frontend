// src/components/layout/MainHeader.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { formatGroupsDots } from '@/utils/format';

function currencySymbol(code?: string) {
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'TRY': return '₺';
    case 'EGP': return '£';
    case 'SAR': return '﷼';
    case 'AED': return 'د.إ';
    default: return code || '';
  }
}

export default function MainHeader() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { user, setUser, refreshUser } = useUser();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userPriceGroupId');
    setUser(null);
    router.push('/login');
  };

  // تحديث بيانات المستخدم عند تحميل الهيدر
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const balanceNum = Number(user?.balance ?? 0);
  const balanceStr = isNaN(balanceNum) ? '0.00' : balanceNum.toFixed(2);
  const curr = user?.currencyCode || 'USD';
  const sym = currencySymbol(curr);

  return (
    <header className="bg-[var(--bg-main)] fixed top-0 left-0 w-full text-white px-6 py-3 flex justify-between items-center shadow-md z-50">
      {/* اليسار: رصيد المحفظة + زر الحساب */}
      <div className="flex items-center gap-2">
        <span
          className={`bg-white/90 text-[13px] font-bold px-3 py-0.5 rounded-full shadow ml-3 ${
            balanceNum >= 0 ? 'text-green-800' : 'text-red-600'
          }`}
        >
          {formatGroupsDots(Number(balanceStr))} {sym === 'SYP' ? 'ل.س' : sym}
        </span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center hover:text-yellow-300"
            aria-label="Account menu"
          >
            <FaUserCircle className="text-3xl" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-section)] text-[var(--text-main)] rounded-lg border border-gray-400 shadow-lg z-[9999] overflow-hidden">
              <button
                className="block w-full px-4 py-2 text-right hover:bg-[var(--bg-main)]"
                onClick={() => { setOpen(false); router.push('/user'); }}
              >
                الملف الشخصي
              </button>
              <button
                className="block w-full px-4 py-2 text-right hover:bg-[var(--bg-main)]"
                onClick={() => { setOpen(false); router.push('/user/favorites'); }}
              >
                المفضلة
              </button>
              <button
                className="block w-full px-4 py-2 text-right hover:bg-[var(--bg-main)]"
                onClick={() => { setOpen(false); router.push('/user/security'); }}
              >
                الحماية
              </button>
              <button
                className="block w-full px-4 py-2 text-right hover:bg-[var(--bg-main)]"
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
