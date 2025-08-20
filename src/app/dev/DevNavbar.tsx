'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/dev', label: 'لوحة المطوّر' },
  { href: '/dev/providers', label: 'المزوّدون' },
  { href: '/dev/catalog', label: 'الكتالوج' },
  { href: '/dev/catalog-images', label: 'صور الكتالوج' }, // 👈 الإضافة الجديدة
];

export default function DevNavbar() {
  const pathname = usePathname();
  return (
    <nav className="w-full border-b backdrop-blur sticky top-0 z-20 bg-red-500 text-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <div className="text-xl font-bold">Developer Portal</div>
        <div className="flex gap-2">
          {tabs.map((t) => {
            const active = pathname === t.href || (t.href !== '/dev' && pathname?.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-full text-sm ${active ? 'bg-red-900 text-white' : 'hover:bg-red-600'}`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
