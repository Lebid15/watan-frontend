// src/app/layout.tsx
'use client';

import '../styles/globals.css';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { clearAuthArtifacts, hasAccessTokenCookie } from '@/utils/authCleanup';
import MainHeader from '@/components/layout/MainHeader';
import BottomNav from '@/components/layout/BottomNav';
import { UserProvider } from '../context/UserContext';
import { ToastProvider } from '@/context/ToastContext';
import ThemeFab from '@/components/ThemeFab';
import PasskeyPrompt from '@/components/auth/PasskeyPrompt';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeaderFooter = pathname === '/login' || pathname === '/register';
  const isBackoffice = pathname?.startsWith('/admin') || pathname?.startsWith('/dev'); // يشمل الأدمن والمطوّر

  // عند فتح /login نفصل أي بقايا توكن (تنظيف دفاعي لو خرج مستخدم في تبويب آخر أو لم تُنفّذ logout كاملة)
  useEffect(() => {
    if (pathname === '/login') {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      // لو لا يوجد كوكي access_token لكن التوكن موجود في localStorage نحذفه، أو نظف دائماً لحالة التزامن بين التبويبات
      if (token) {
        // لا نحتاج التوكن هنا بعد، تنظيف مع الحفاظ على الثيم
        clearAuthArtifacts({ keepTheme: true });
        // tslint:disable-next-line:no-console
        console.info('[AuthCleanup] purged leftover token on /login');
      } else if (!hasAccessTokenCookie()) {
        // لو لا يوجد أي توكن إطلاقاً تأكد فقط من إزالة role
        try { document.cookie = 'role=; Max-Age=0; path=/'; } catch {}
      }
    }
  }, [pathname]);

  return (
    <html lang="ar" dir="rtl" data-theme="dark1" suppressHydrationWarning>
      <head>
        <title>Watan Store</title>

        {/* المصدر الوحيد للـ viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* تثبيت الثيم قبل تحميل الستايلات لمنع الوميض */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var t = localStorage.getItem('theme');
                if (t === null) { t = 'dark1'; }
                if (t === '') {
                  document.documentElement.removeAttribute('data-theme');
                } else {
                  document.documentElement.setAttribute('data-theme', t);
                }
              } catch (e) {
                document.documentElement.removeAttribute('data-theme');
              }
            })();`,
          }}
        />

        {/* لون شريط المتصفح */}
        <meta name="theme-color" content="#0F1115" />
      </head>

      <body
        suppressHydrationWarning
        className={[
          'font-sans min-h-screen relative',
          'bg-bg-base',
          'text-text-primary',
          isBackoffice ? 'admin-mode admin-mobile-boost' : '',
        ].join(' ')}
      >
        {/* خلفية زخرفية إن لزم */}
        <div className="background" />

        <ToastProvider>
          <UserProvider>
            {/* مبدّل الثيم يظهر فقط خارج صفحات الدخول وخارج لوحات الخلفية */}
            {!hideHeaderFooter && !isBackoffice && <ThemeFab />}

            {/* الهيدر العام خارج لوحات الخلفية */}
            {!hideHeaderFooter && !isBackoffice && <MainHeader />}

            <main className={`${!hideHeaderFooter && !isBackoffice ? 'pb-20 pt-20' : ''} relative z-0`}>
              {/* بدون تغليف إضافي لصفحات الأدمن/المطوّر */}
              {children}
            </main>
            {!hideHeaderFooter && !isBackoffice && <PasskeyPrompt />}

            {/* الذيل العام خارج لوحات الخلفية */}
            {!hideHeaderFooter && !isBackoffice && <BottomNav />}
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
