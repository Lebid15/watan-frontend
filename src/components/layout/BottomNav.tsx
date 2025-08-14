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
  HiX,
  HiCurrencyDollar,
  HiCog,
  HiPhone,
  HiLogout,
} from 'react-icons/hi';

interface NavItem {
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  key: string;
}

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const items: NavItem[] = [
    { key: 'home', href: '/', Icon: HiHome },
    { key: 'orders', href: '/orders', Icon: HiShoppingCart },
    { key: 'wallet', href: '/wallet', Icon: HiCreditCard },
    { key: 'notifications', href: '/notifications', Icon: HiBell },
    // نُبقي href = /menu كما هو، لكن سنمنع الانتقال عند الضغط ونفتح القائمة
    { key: 'menu', href: '/menu', Icon: HiMenu },
  ];

  // جلب عدد الإشعارات غير المقروءة
  const loadUnread = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return setUnreadCount(0);
      const res = await api.get<{ id: string; isRead: boolean }[]>(
        API_ROUTES.notifications.my
      );
      const count = res.data.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0);
      setUnreadCount(count);
    } catch {
      // تجاهل الخطأ بصمت في النافبار
    }
  };

  useEffect(() => {
    if (pathname.startsWith('/notifications')) {
      setUnreadCount(0);
    } else {
      loadUnread();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // عناصر القائمة (Bottom Sheet)
  const sheetItems = [
    {
      label: 'إضافة رصيد',
      href: '/payments/deposits',
      Icon: HiCurrencyDollar,
    },
    {
      label: 'الإعدادات',
      href: '/settings',
      Icon: HiCog,
    },
    {
      label: 'تواصل معنا',
      href: '/contact',
      Icon: HiPhone,
    },
    {
      label: 'تسجيل خروج',
      href: '/login',
      Icon: HiLogout,
      onClick: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userPriceGroupId');
        }
      },
    },
  ];

  return (
    <>
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
                  onClick={(e) => {
                    if (key === 'notifications') setUnreadCount(0);
                    if (key === 'menu') {
                      // نمنع الانتقال لمسار /menu ونفتح القائمة السفلية
                      e.preventDefault();
                      setMenuOpen(true);
                    }
                  }}
                  className={`
                    relative flex items-center justify-center
                    h-16 w-16 transition-colors
                    ${isActive
                      ? 'bg-emerald-700 text-[#45F882] rounded-xl'
                      : 'text-[var(--text-main)] hover:bg-gray-600 hover:text-white rounded-xl'}
                  `}
                  aria-label={key === 'menu' ? 'فتح القائمة' : undefined}
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

      {/* Bottom Sheet */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="قائمة الخيارات"
        >
          {/* خلفية معتمة */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setMenuOpen(false)}
          />

          {/* اللوحة السفلية */}
          <div
            className="
              absolute bottom-0 left-0 right-0
              bg-[var(--bg-section)] rounded-t-2xl shadow-2xl
              p-4 pb-6
            "
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[var(--text-main)] font-semibold">القائمة</h3>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded hover:bg-[var(--bg-main)]"
                aria-label="إغلاق"
              >
                <HiX size={22} />
              </button>
            </div>

            <ul className="divide-y">
              {sheetItems.map(({ label, href, Icon, onClick }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => {
                      if (onClick) onClick();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 py-3 hover:bg-[var(--bg-main)] rounded-md px-2"
                  >
                    <Icon size={22} className="text-[var(--text-main)]" />
                    <span className="text-[var(--text-main)]">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
