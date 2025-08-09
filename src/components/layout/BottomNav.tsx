// src/components/layout/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import api, { API_ROUTES } from '@/utils/api';
import {
  HiHome,
  HiShoppingCart,
  HiCreditCard,
  HiBell,
  HiMenu,
} from 'react-icons/hi';

interface NavItem {
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  key: string;
}

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const items: NavItem[] = [
    { key: 'home', href: '/', Icon: HiHome },
    { key: 'orders', href: '/orders', Icon: HiShoppingCart },
    { key: 'wallet', href: '/wallet', Icon: HiCreditCard },
    { key: 'notifications', href: '/notifications', Icon: HiBell },
    { key: 'menu', href: '/menu', Icon: HiMenu },
  ];

  // جلب عدد الإشعارات غير المقروءة
  const loadUnread = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return setUnreadCount(0);
      const res = await api.get<{ id: string; isRead: boolean }[]>(
        API_ROUTES.notifications.my,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const count = res.data.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0);
      setUnreadCount(count);
    } catch {
      // تجاهل الخطأ بصمت في النافبار
    }
  };

  // عند التحميل وتغيّر المسار
  useEffect(() => {
    // لو دخل المستخدم صفحة الإشعارات، أخفِ الشارة مباشرة (سلوك واجهة)
    if (pathname.startsWith('/notifications')) {
      setUnreadCount(0);
    } else {
      loadUnread();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className="bg-[var(--bg-main)] border-t border-gray-700 fixed bottom-0 w-full z-40">
      <ul className="flex justify-around">
        {items.map(({ href, Icon, key }) => {
          const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
          const showBadge = key === 'notifications' && unreadCount > 0 && !pathname.startsWith('/notifications');
          const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);

          return (
            <li key={href} className="flex-1 flex justify-center">
              <Link
                href={href}
                onClick={() => {
                  // إخفاء الشارة فور الضغط على زر الإشعارات (إحساس سريع)
                  if (key === 'notifications') setUnreadCount(0);
                }}
                className={`
                  relative flex items-center justify-center
                  h-16 w-16 transition-colors
                  ${isActive
                    ? 'bg-emerald-700 text-[#45F882] rounded-xl'
                    : 'text-gray-200 hover:bg-gray-600 hover:text-white rounded-xl'}
                `}
              >
                <Icon size={28} />
                {showBadge && (
                  <span
                    className="
                      absolute -top-1.5 -right-1.5
                      min-w-[20px] h-5 px-1
                      rounded-full bg-red-500
                      text-white text-xs font-bold
                      flex items-center justify-center
                      shadow
                    "
                    aria-label={`لديك ${unreadCount} إشعارات غير مقروءة`}
                  >
                    {badgeText}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
