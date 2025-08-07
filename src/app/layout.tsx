// src/app/layout.tsx
import '../styles/globals.css';
import MainHeader from '@/components/layout/MainHeader';
import BottomNav from '@/components/layout/BottomNav';
import { UserProvider } from '../context/UserContext'; // ✅ هذا هو المطلوب

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>Watan Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className="font-sans min-h-screen relative text-gray-100"
        suppressHydrationWarning
      >
        <UserProvider>
          <MainHeader />
          <main className="pb-20 pt-20">{children}</main>
          <BottomNav />
        </UserProvider>
      </body>
    </html>
  );
}
