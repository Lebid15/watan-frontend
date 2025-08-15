'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiHome, FiBox, FiList, FiUsers, FiSettings } from 'react-icons/fi';

interface NavItem {
  name: string;
  href?: string;
  subItems?: { name: string; href: string }[];
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => setOpenDropdown(null), [pathname]);

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

  const itemText = 'text-[19px] md:text-base font-medium';

  return (
    <div className='bg-[var(--toppage)]'>
      <nav className="py-1 mx-5">
      <div className="px-0">
        <div className="w-full flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex flex-wrap items-center gap-1 bg-[var(--adminnavbarbg)] text-white rounded-md px-2 md:px-3 py-1 w-max">
            {navItems.map((item) => {
              const isActive = item.href ? pathname.startsWith(item.href) : false;

              if (item.subItems) {
                const opened = openDropdown === item.name;
                return (
                  <div key={item.name} className="relative">
                    <button
                      onClick={() => setOpenDropdown(opened ? null : item.name)}
                      className={`${itemText} px-2 py-1 rounded-md transition flex items-center gap-1 whitespace-nowrap ${
                        opened ? 'bg-cyan-900 text-white' : 'hover:bg-cyan-700'
                      }`}
                    >
                      {item.name}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {opened && (
                      <div className="absolute end-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50">
                        {item.subItems.map((sub) => {
                          const subActive = pathname.startsWith(sub.href);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`block px-4 py-2 text-sm ${
                                subActive ? 'bg-green-100 text-green-900' : 'text-gray-700 hover:bg-gray-100'
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
              }

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`${itemText} px-2 py-1 rounded-md transition whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--adminnavbarbg-hover)] text-white'
                      : 'hover:bg-[var(--adminnavbarbg-hover)]'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* كبسولة الأيقونات (اختصارات) */}
          <div className="inline-flex items-center gap-1 bg-[var(--adminnavbarbg)] text-white rounded-md px-2 md:px-3 py-1 w-max">
            <Link href="/admin/dashboard" className="p-1 rounded hover:bg-[var(--adminnavbarbg-hover)]" title="لوحة التحكم">
              <FiHome size={18} />
            </Link>
            <Link href="/admin/products" className="p-1 rounded hover:bg-[var(--adminnavbarbg-hover)]" title="المنتجات">
              <FiBox size={18} />
            </Link>
            <Link href="/admin/orders" className="p-1 rounded hover:bg-[var(--adminnavbarbg-hover)]" title="الطلبات">
              <FiList size={18} />
            </Link>
            <Link href="/admin/users" className="p-1 rounded hover:bg-[var(--adminnavbarbg-hover)]" title="المستخدمون">
              <FiUsers size={18} />
            </Link>
            <Link href="/admin/notifications" className="p-1 rounded hover:bg-[var(--adminnavbarbg-hover)]" title="الإعدادات">
              <FiSettings size={18} />
            </Link>
          </div>
        </div>
      </div>
      </nav>
    </div>
  );
}
