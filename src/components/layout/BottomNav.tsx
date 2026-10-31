'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrescription } from '@/components/prescription/PrescriptionProvider';
import { Icon, type IconName } from '@/components/ui/Icon';

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  iconName: IconName;
  badge?: number;
}

export function BottomNav() {
  const pathname = usePathname() ?? '/';
  const { items } = usePrescription();
  const prescriptionCount = items.length;

  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Buscar',
      match: (p) => p === '/' || p.startsWith('/buscar') || p.startsWith('/medicamento'),
      iconName: 'search',
    },
    {
      href: '/mapa/',
      label: 'Mapa',
      match: (p) => p.startsWith('/mapa'),
      iconName: 'map',
    },
    {
      href: '/unidades/',
      label: 'Unidades',
      match: (p) => p.startsWith('/unidades'),
      iconName: 'pin',
    },
    {
      href: '/minha-receita/',
      label: 'Receita',
      match: (p) => p.startsWith('/minha-receita'),
      badge: prescriptionCount > 0 ? prescriptionCount : undefined,
      iconName: 'doc',
    },
    {
      href: '/plantao/',
      label: 'Plantão',
      match: (p) => p.startsWith('/plantao'),
      iconName: 'cross',
    },
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 h-[74px] border-t border-[var(--c-border)] bg-[var(--c-surface)]/90 backdrop-blur-md shadow-[var(--shadow-dock)]"
    >
      <ul className="mx-auto grid h-full max-w-2xl grid-cols-5 items-center gap-0.5 px-1 sm:gap-1.5 sm:px-3">
        {navItems.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="relative flex h-full items-center justify-center">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative z-10 flex h-[62px] w-full flex-col items-center justify-center gap-0.5 rounded-[var(--r-button)] px-0.5 transition-all active:scale-[0.98] ${
                  active
                    ? 'font-extrabold text-[var(--c-brand)]'
                    : 'font-bold text-[var(--c-text-2)] hover:bg-[var(--c-bg-soft)]/70 hover:text-[var(--c-text)]'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 rounded-[var(--r-button)] border border-[var(--c-brand)]/20 bg-[var(--c-brand-tint)] transition-all duration-200"
                  />
                )}
                <span className="relative flex items-center justify-center">
                  <Icon name={item.iconName} className="h-5 w-5 sm:h-6 sm:w-6" />
                  {item.badge !== undefined && (
                    <span
                      aria-label={`${item.badge} itens`}
                      className="absolute -right-2.5 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--c-brand)] px-1 text-[11px] font-black text-white"
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="text-xs sm:text-sm leading-tight tracking-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
