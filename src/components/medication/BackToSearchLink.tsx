'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { Icon } from '@/components/ui/Icon';
import { navigateWithTransition } from '@/lib/viewTransition';

const BACK_CLASS =
  'ui-pressable inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-left font-display text-lg font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)] active:scale-[0.98]';

export function BackToSearchLink() {
  const router = useRouter();
  const { effectiveReduceMotion } = useAccessibility();
  const { query, isHydrated } = useSearchSession();
  const hasActiveSearch = isHydrated && query.trim().length > 0;

  const handleBack = () => {
    if (
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function' &&
      !effectiveReduceMotion &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      document.startViewTransition(() => {
        router.back();
      });
    } else {
      router.back();
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigateWithTransition(router, '/', effectiveReduceMotion);
  };

  if (hasActiveSearch) {
    return (
      <button
        type="button"
        className={BACK_CLASS}
        onClick={handleBack}
      >
        <Icon name="back" className="h-5 w-5 shrink-0" />
        <span>Voltar aos resultados</span>
      </button>
    );
  }

  return (
    <Link href="/" onClick={handleHomeClick} className={BACK_CLASS}>
      <Icon name="back" className="h-5 w-5 shrink-0" />
      <span>Fazer uma busca no início</span>
    </Link>
  );
}
