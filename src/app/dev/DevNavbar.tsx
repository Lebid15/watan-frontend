'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { href: '/dev', label: 'لوحة المطوّر' },
  { href: '/dev/providers', label: 'المزوّدون' },
  { href: '/dev/catalog', label: 'الكتالوج' },
  { href: '/dev/catalog-images', label: 'صور الكتالوج' },
  { href: '/dev/stats', label: 'الإحصائيات' },
];

export default function DevNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      // امسح أي تخزين محلي تستعمله للتوكن/الدور
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user'); // إن كنت تحفظ المستخدم كاملًا
      }

      // امسح كوكيز شائعة الأسماء (لو كنت تحفظها ككوكي)
      const expire = 'Max-Age=0; path=/';
      document.cookie = `access_token=; ${expire}`;
      document.cookie = `role=; ${expire}`;
      document.cookie = `refresh_token=; ${expire}`;

      // (اختياري) لو عندك API لتسجيل الخروج على السيرفر، نادِه هنا
      // await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });

      router.push('/login');
    } catch {
      router.push('/login');
    }
  }

  return (
    <nav className="w-full border-b backdrop-blur sticky top-0 z-20 bg-red-500 text-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <div className="text-xl font-bold">Developer Portal</div>

        <div className="flex gap-2 flex-1">
          {tabs.map((t) => {
            const active =
              pathname === t.href ||
              (t.href !== '/dev' && pathname?.startsWith(t.href));
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-full text-sm ${
                  active ? 'bg-red-900 text-white' : 'hover:bg-red-600'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* زر خروج */}
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-full text-sm bg-black/30 hover:bg-black/50"
          title="تسجيل خروج"
        >
          خروج
        </button>
      </div>
    </nav>
  );
}
