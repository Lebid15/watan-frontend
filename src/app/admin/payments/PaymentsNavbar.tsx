'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PaymentsNavbar() {
  const pathname = usePathname();
  const links = [
    { name: 'وسائل الدفع', href: '/admin/payments/methods' },
    { name: 'طلبات الإيداع', href: '/admin/payments/deposits' },
  ];
  return (
    <div className="w-full bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2">
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                active ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {l.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
