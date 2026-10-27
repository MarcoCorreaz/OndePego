'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Buscar',
    match: (p) => p === '/' || p.startsWith('/buscar') || p.startsWith('/medicamento'),
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    href: '/unidades/',
    label: 'Unidades',
    match: (p) => p.startsWith('/unidades'),
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    href: '/plantao/',
    label: 'Plantão',
    match: (p) => p.startsWith('/plantao'),
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? '/';

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[var(--c-border)] bg-[var(--c-bg)]"
    >
      <ul className="mx-auto grid max-w-4xl grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 border-t-4 px-2 py-1.5 text-center transition-colors ${
                  active
                    ? 'border-[var(--c-brand)] bg-[var(--c-brand-tint)] font-bold text-[var(--c-brand)]'
                    : 'border-transparent text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
                }`}
              >
                {item.icon}
                <span className="text-base leading-tight">
                  {active ? `• ${item.label}` : item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
