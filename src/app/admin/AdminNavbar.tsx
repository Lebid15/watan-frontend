'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavItem {
  name: string;
  href?: string;
  subItems?: { name: string; href: string }[];
}

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const navItems: NavItem[] = [
    { name: 'لوحة التحكم', href: '/admin/dashboard' },
    { name: 'المنتجات', href: '/admin/products' },
    { name: 'الطلبات', href: '/admin/orders' },
    { name: 'المستخدمون', href: '/admin/users' },
    {
      name: 'الدفعات',
      subItems: [
        { name: 'وسائل الدفع', href: '/admin/payments/methods' },
        { name: 'طلبات الإيداع', href: '/admin/payments/deposits' },
      ],
    },
    {
      name: 'التقارير',
      subItems: [
        { name: 'الأرباح', href: '/admin/reports/profits' },
        { name: 'جرد رأس المال', href: '/admin/reports/capital' },
      ],
    },
    {
      name: 'الإعدادات',
      subItems: [{ name: 'الإشعارات', href: '/admin/notifications' }],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const toggleDropdown = (itemName: string) => {
    setOpenDropdown((prev) => (prev === itemName ? null : itemName));
  };

  // ⬅️ يغلق القائمة عند الانتقال لأي صفحة جديدة
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  return (
    <nav className="bg-cyan-600 shadow-md">
      <div className="px-4">
        <div className="flex justify-between h-12 items-center">
          {/* القائمة الكاملة دائمًا */}
          <div className="flex gap-4">
            {navItems.map((item) => {
              const isActive = item.href ? pathname.startsWith(item.href) : false;
              if (item.subItems) {
                return (
                  <div
                    key={item.name}
                    className="relative"
                    onClick={() => toggleDropdown(item.name)}
                  >
                    <button
                      className={`px-3 py-2 rounded-md font-medium transition flex items-center gap-1 ${
                        openDropdown === item.name
                          ? 'bg-cyan-900 text-white'
                          : 'text-gray-100 hover:bg-cyan-700 hover:text-white'
                      }`}
                    >
                      {item.name}
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openDropdown === item.name && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50">
                        {item.subItems.map((sub) => {
                          const subActive = pathname.startsWith(sub.href);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`block px-4 py-2 text-sm ${
                                subActive
                                  ? 'bg-green-100 text-green-900'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`px-3 py-2 rounded-md font-medium transition ${
                      isActive
                        ? 'bg-cyan-800 text-white'
                        : 'text-gray-200 hover:bg-cyan-700 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              }
            })}
          </div>

          {/* زر تسجيل خروج */}
          <div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
            >
              خروج
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
