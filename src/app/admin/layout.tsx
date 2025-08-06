// src/app/admin/layout.tsx
'use client';

import AdminNavbar from './AdminNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <div className="p-8">{children}</div>
    </div>
  );
}
