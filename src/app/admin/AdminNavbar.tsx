'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiHome, FiBox, FiList, FiUsers, FiSettings } from 'react-icons/fi';
import ThemeSwitcher from '@/components/theme/ThemeSwitcher';

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

  const itemText = 'text-[15px] md:text-sm font-medium';

  return (
    <div className="bg-bg-surface-alt border-b border-border">
      <nav className="py-2 admin-container">
        <div className="w-full flex items-center justify-between gap-2 flex-wrap">

          {/* شريط الروابط الرئيسي */}
          <div className="inline-flex flex-wrap items-center gap-1 bg-bg-surface text-text-primary border border-border rounded-md px-2 md:px-3 py-1 w-max">
            {navItems.map((item) => {
              const isActive = item.href ? pathname.startsWith(item.href) : false;

              if (item.subItems) {
                const opened = openDropdown === item.name;
                return (
                  <div key={item.name} className="relative">
                    <button
                      onClick={() => setOpenDropdown(opened ? null : item.name)}
                      className={[
                        itemText,
                        'px-2 py-1 rounded-md transition flex items-center gap-1 whitespace-nowrap',
                        opened
                          ? 'bg-primary/15 text-text-primary ring-1 ring-primary/40'
                          : 'hover:bg-primary/10',
                      ].join(' ')}
                    >
                      {item.name}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {opened && (
                      <div
                        className="absolute end-0 mt-2 w-56 bg-bg-surface text-text-primary border border-border rounded-md shadow-lg z-50 overflow-hidden"
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {item.subItems.map((sub) => {
                          const subActive = pathname.startsWith(sub.href);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={[
                                'block px-4 py-2 text-sm transition',
                                subActive
                                  ? 'bg-primary/20 text-text-primary'
                                  : 'hover:bg-primary/10 text-text-primary',
                              ].join(' ')}
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
                  className={[
                    itemText,
                    'px-2 py-1 rounded-md transition whitespace-nowrap',
                    isActive
                      ? 'bg-primary/20 text-text-primary ring-1 ring-primary/40'
                      : 'hover:bg-primary/10',
                  ].join(' ')}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* كبسولة الأيقونات + مبدّل الثيم */}
          <div className="inline-flex items-center gap-2">
            {/* كبسولة الأيقونات (اختصارات) */}
            <div className="inline-flex items-center gap-1 bg-bg-surface text-text-primary border border-border rounded-md px-2 md:px-3 py-1 w-max">
              <Link href="/admin/dashboard" className="p-1 rounded hover:bg-primary/10" title="لوحة التحكم">
                <FiHome size={18} />
              </Link>
              <Link href="/admin/products" className="p-1 rounded hover:bg-primary/10" title="المنتجات">
                <FiBox size={18} />
              </Link>
              <Link href="/admin/orders" className="p-1 rounded hover:bg-primary/10" title="الطلبات">
                <FiList size={18} />
              </Link>
              <Link href="/admin/users" className="p-1 rounded hover:bg-primary/10" title="المستخدمون">
                <FiUsers size={18} />
              </Link>
              <Link href="/admin/notifications" className="p-1 rounded hover:bg-primary/10" title="الإعدادات">
                <FiSettings size={18} />
              </Link>
            </div>

            {/* مبدّل الثيمات */}
            <div className="hidden sm:block bg-bg-surface border border-border rounded-md px-2 py-1">
              <ThemeSwitcher />
            </div>
          </div>

        </div>
      </nav>
    </div>
  );
}
