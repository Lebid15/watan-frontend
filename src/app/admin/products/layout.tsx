'use client';

import ProductsNavbar from './ProductsNavbar';

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <ProductsNavbar />
      <div className="p-6">{children}</div>
    </div>
  );
}
