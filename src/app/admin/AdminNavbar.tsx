'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  name: string;
  href?: string;
  subItems?: { name: string; href: string }[];
}

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
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
      name: 'الإعدادات',
      subItems: [
        { name: 'الإشعارات', href: '/admin/notifications' },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const toggleDropdown = (itemName: string) => {
    setOpenDropdown((prev) => (prev === itemName ? null : itemName));
  };

  return (
    <nav className="bg-[var(--main-color)] shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* القائمة على الشاشات الكبيرة */}
          <div className="hidden md:flex space-x-4">
            {navItems.map((item) => {
              const isActive = item.href ? pathname.startsWith(item.href) : false;
              if (item.subItems) {
                return (
                  <div
                    key={item.name}
                    className="relative group"
                    onClick={() => toggleDropdown(item.name)}
                  >
                    <button
                      className={`px-3 py-2 rounded-md font-medium transition flex items-center gap-1 ${
                        openDropdown === item.name
                          ? 'bg-green-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20">
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
                        ? 'bg-green-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
            >
              تسجيل خروج
            </button>
          </div>

          {/* زر القائمة للموبايل */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-200 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* القائمة المنسدلة في الموبايل */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-800 shadow-md px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            if (item.subItems) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white flex items-center justify-between"
                  >
                    {item.name}
                    <svg
                      className={`w-4 h-4 transform transition-transform ${
                        openDropdown === item.name ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === item.name && (
                    <div className="pl-4">
                      {item.subItems.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className="block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href!}
                className="block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            تسجيل خروج
          </button>
        </div>
      )}
    </nav>
  );
}
