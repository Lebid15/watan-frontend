// src/app/layout.tsx
import '../styles/globals.css';
import MainHeader from '@/components/layout/MainHeader';
import BottomNav from '@/components/layout/BottomNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Watan Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body 
        className="bg-gray-100 font-sans min-h-screen relative"
        suppressHydrationWarning
      >
        <MainHeader />
        <main className="pb-20 pt-20">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
