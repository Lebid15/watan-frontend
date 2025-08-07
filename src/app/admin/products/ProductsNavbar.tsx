// src/app/admin/products/ProductsNavbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ProductsNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'قائمة المنتجات', href: '/admin/products' },
    { name: 'مجموعات الأسعار', href: '/admin/products/price-groups' },
    { name: 'ربط المستخدمين بالأسعار', href: '/admin/products/price-groups/users' },
    { name: 'العملات', href: '/admin/products/currencies' },
    { name: 'إعدادات API', href: '/admin/products/api-settings' },
  ];

  const isActive = (href: string) => {
    // ✅ الحالة 1: مطابق تماماً
    if (pathname === href) return true;

    // ✅ الحالة 2: للرابط الأب لكن نتأكد ألا يكون هناك رابط أطول يطابقه بالضبط
    if (pathname.startsWith(href + '/') && 
        !navItems.some(item => item.href !== href && pathname === item.href)) {
      return true;
    }

    return false;
  };

  return (
    <div className="bg-[var(--main-color)] shadow mb-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-4 rtl:space-x-reverse">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive(item.href)
                  ? 'border-orange-400 text-orange-400'
                  : 'border-transparent text-orange-200 hover:text-orange-400 hover:border-orange-400'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
