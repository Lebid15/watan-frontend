// src/components/layout/BottomNav.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-t border-gray-200 p-2 flex justify-around text-sm fixed bottom-0 w-full z-40">
      <Link href="/" className={pathname === '/' ? 'text-blue-600 font-bold' : ''}>🏠 الرئيسية</Link>
      <Link href="/orders" className={pathname.startsWith('/orders') ? 'text-blue-600 font-bold' : ''}>📦 طلباتي</Link>
      <Link href="/wallet" className={pathname.startsWith('/wallet') ? 'text-blue-600 font-bold' : ''}>💰 محفظتي</Link>
      <Link href="/notifications" className={pathname.startsWith('/notifications') ? 'text-blue-600 font-bold' : ''}>🔔 التنبيهات</Link>
      <Link href="/menu" className={pathname.startsWith('/menu') ? 'text-blue-600 font-bold' : ''}>☰ المزيد</Link>
    </nav>
  );
}
