'use client'; // ✅ لازم أول سطر

// src/app/layout.tsx
import '../styles/globals.css';
import { usePathname } from 'next/navigation';
import MainHeader from '@/components/layout/MainHeader';
import BottomNav from '@/components/layout/BottomNav';
import { UserProvider } from '../context/UserContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeaderFooter = pathname === '/login' || pathname === '/register';

  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Watan Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="theme-color"
          content={typeof window !== 'undefined'
            ? getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim()
            : '#23313e'}
        />

      </head>
      <body
        className="font-sans min-h-screen relative text-gray-100"
        suppressHydrationWarning
      >
        <UserProvider>
          {!hideHeaderFooter && <MainHeader />}
          <main className={`${!hideHeaderFooter ? 'pb-20 pt-20' : ''}`}>
            {children}
          </main>
          {!hideHeaderFooter && <BottomNav />}
        </UserProvider>
      </body>
    </html>
  );
}
