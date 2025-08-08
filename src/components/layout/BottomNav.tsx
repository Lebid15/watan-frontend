// src/components/layout/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiHome,
  HiShoppingCart,
  HiCreditCard,
  HiBell,
  HiMenu,
} from "react-icons/hi";

interface NavItem {
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function BottomNav() {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/", Icon: HiHome },
    { href: "/orders", Icon: HiShoppingCart },
    { href: "/wallet", Icon: HiCreditCard },
    { href: "/notifications", Icon: HiBell },
    { href: "/menu", Icon: HiMenu },
  ];

  return (
    <nav className="bg-[var(--bg-main)] border-t border-gray-700 fixed bottom-0 w-full z-40">
      <ul className="flex justify-around">
        {items.map(({ href, Icon }) => {
          const isActive =
            href === "/"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1 flex justify-center">
              <Link
                href={href}
                className={`
                  flex items-center justify-center
                  h-16 w-16
                  transition-colors
                  ${isActive
                    ? "bg-emerald-700 text-[#45F882] rounded-xl"
                    : "text-gray-200 hover:bg-gray-600 hover:text-white rounded-xl"}
                `}
              >
                <Icon size={24}/>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
