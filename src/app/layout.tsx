// src/app/layout.tsx
'use client';

import '../styles/globals.css';
import { usePathname } from 'next/navigation';
import MainHeader from '@/components/layout/MainHeader';
import BottomNav from '@/components/layout/BottomNav';
import { UserProvider } from '../context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import ThemeFab from '@/components/ThemeFab'; // ✅ جديد

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeaderFooter = pathname === '/login' || pathname === '/register';
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <html lang="ar" dir="rtl" data-theme="dark1" suppressHydrationWarning>
      <head>
        <title>Watan Store</title>

        {/* ✅ المصدر الوحيد للـ viewport في كل المشروع */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* ثبّت الثيم قبل تحميل الستايلات لمنع وميض الأبيض/الأسود */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("theme")||"dark1";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark1");}})();',
          }}
        />
        {/* لون المتصفح مطابق للخلفية */}
        <meta name="theme-color" content="#0F1115" />
      </head>

      <body
        className={[
          'font-sans min-h-screen relative',
          'bg-bg-base',
          'text-text-primary',
          isAdmin ? 'admin-mode admin-mobile-boost' : '',
        ].join(' ')}
      >
        {/* الخلفية الزخرفية (إن لزم) */}
        <div className="background" />

        <ToastProvider>
          <UserProvider>
            {/* مبدّل الثيم العائم (يظهر في كل الصفحات ما عدا login/register) */}
            {!hideHeaderFooter && <ThemeFab />}

            {/* إظهار الهيدر والذيل خارج صفحات الأدمن وتسجيل الدخول/التسجيل */}
            {!hideHeaderFooter && !isAdmin && <MainHeader />}

            <main className={`${!hideHeaderFooter && !isAdmin ? 'pb-20 pt-20' : ''} relative z-0`}>
              {/* ✅ لا تغليف إضافي لصفحات الأدمن — يمنع القصّ على اليمين/اليسار */}
              {children}
            </main>

            {!hideHeaderFooter && !isAdmin && <BottomNav />}
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
