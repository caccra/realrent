"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({
  nav,
  onNavigate,
}: {
  nav: { href: string; label: string }[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
              active ? "bg-white font-medium text-ivy-900" : "text-ivy-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
