// src/app/admin/layout.tsx
'use client';

import AdminNavbar from './AdminNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />
      <div className="p-8">{children}</div>
    </div>
  );
}
