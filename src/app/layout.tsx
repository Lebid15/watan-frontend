'use client';

import '../styles/globals.css';
import { usePathname } from 'next/navigation';
import MainHeader from '@/components/layout/MainHeader';
import BottomNav from '@/components/layout/BottomNav';
import { UserProvider } from '../context/UserContext';
import { ToastProvider } from '@/context/ToastContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeaderFooter =
    pathname === '/login' || pathname === '/register';

  // ✅ تحديد إذا كنا داخل صفحات الأدمن
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Watan Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#23313e" />
      </head>
      <body
        className={`font-sans min-h-screen relative text-[var(--text-main)] ${
          isAdmin ? 'admin-mode' : ''
        }`}
        suppressHydrationWarning
      >
        <div className="background"></div>
        <ToastProvider>
          <UserProvider>
            {/* ✅ إظهار الهيدر فقط إذا ليس أدمن وليس في صفحات إخفاء الهيدر */}
            {!hideHeaderFooter && !isAdmin && <MainHeader />}

            <main
              className={`${!hideHeaderFooter && !isAdmin ? 'pb-20 pt-20' : ''} relative z-0`}
            >
              {children}
            </main>

            {/* ✅ إخفاء الـBottomNav في الأدمن */}
            {!hideHeaderFooter && !isAdmin && <BottomNav />}
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
