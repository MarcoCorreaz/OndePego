'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { Icon } from '@/components/ui/Icon';

const BACK_CLASS =
  'ui-pressable inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-left font-display text-lg font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)] active:scale-[0.98]';

export function BackToSearchLink() {
  const router = useRouter();
  const { query, isHydrated } = useSearchSession();
  const hasActiveSearch = isHydrated && query.trim().length > 0;

  if (hasActiveSearch) {
    return (
      <button
        type="button"
        className={BACK_CLASS}
        onClick={() => {
          router.back();
        }}
      >
        <Icon name="back" className="h-5 w-5 shrink-0" />
        <span>Voltar aos resultados</span>
      </button>
    );
  }

  return (
    <Link href="/" className={BACK_CLASS}>
      <Icon name="back" className="h-5 w-5 shrink-0" />
      <span>Fazer uma busca no início</span>
    </Link>
  );
}
