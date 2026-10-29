'use client';

import React from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { usePrescription } from '@/components/prescription/PrescriptionProvider';

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: React.ReactNode;
  badge?: number;
}

export function BottomNav() {
  const pathname = usePathname() ?? '/';
  const { effectiveReduceMotion } = useAccessibility();
  const { items } = usePrescription();
  const prescriptionCount = items.length;

  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Buscar',
      match: (p) => p === '/' || p.startsWith('/buscar') || p.startsWith('/medicamento'),
      icon: (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      ),
    },
    {
      href: '/minha-receita/',
      label: 'Receita',
      match: (p) => p.startsWith('/minha-receita'),
      badge: prescriptionCount > 0 ? prescriptionCount : undefined,
      icon: (
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
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
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
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
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      ),
    },
  ];

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={effectiveReduceMotion ? 'always' : 'user'}>
        <nav
          aria-label="Navegação principal"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-surface)]/92 shadow-[var(--shadow-dock)] backdrop-blur-md"
        >
          <ul className="mx-auto grid max-w-2xl grid-cols-4 gap-1 px-2 py-1.5 sm:gap-2 sm:px-3">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative z-10 flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[var(--r-button)] px-2 py-1.5 text-center transition-colors ${
                      active
                        ? 'font-bold text-[var(--c-brand)]'
                        : 'font-bold text-[var(--c-text-2)] hover:bg-[var(--c-bg-soft)]/70 hover:text-[var(--c-text)]'
                    }`}
                  >
                    {active && (
                      <m.span
                        layoutId="bottom-nav-active-pill"
                        aria-hidden="true"
                        transition={{ duration: effectiveReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                        className="absolute inset-0 -z-10 rounded-[var(--r-button)] border border-[var(--c-brand)]/20 bg-[var(--c-brand-tint)]"
                      />
                    )}
                    <span className="relative flex items-center justify-center">
                      {item.icon}
                      {item.badge !== undefined && (
                        <span
                          aria-label={`${item.badge} itens`}
                          className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--c-brand)] px-1 text-[10px] font-black text-white"
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
      </MotionConfig>
    </LazyMotion>
  );
}
