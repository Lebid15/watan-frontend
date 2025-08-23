// src/app/layout.tsx
'use client';

import '../styles/globals.css';
import { usePathname } from 'next/navigation';
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
