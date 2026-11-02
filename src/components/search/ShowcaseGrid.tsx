'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { navigateWithTransition } from '@/lib/viewTransition';

export interface ShowcaseMedication {
  slug: string;
  nome: string;
  detalhe: string;
  gratisPopular: boolean;
  postoSus: boolean;
}

export interface ShowcaseGridProps {
  items: readonly ShowcaseMedication[];
}

export function ShowcaseGrid({ items }: ShowcaseGridProps) {
  const router = useRouter();
  const { effectiveReduceMotion } = useAccessibility();

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigateWithTransition(router, `/medicamento/${slug}/`, effectiveReduceMotion);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={`/medicamento/${item.slug}/`}
          onClick={(e) => handleItemClick(e, item.slug)}
          className="ui-pressable group flex min-h-[56px] flex-col justify-between gap-2 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-3.5 shadow-2xs transition-all hover:border-[var(--c-brand)] hover:shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--c-brand)]"
        >
          <div>
            <span className="block font-display text-base font-black text-[var(--c-text)] group-hover:text-[var(--c-brand)]">
              {item.nome}
            </span>
            <span className="block text-xs text-[var(--c-text-2)]">
              {item.detalhe}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {item.gratisPopular && (
              <span className="inline-block rounded-full bg-[var(--c-free-tint)] px-2 py-0.5 text-[11px] font-bold text-[var(--c-free)]">
                Grátis Popular
              </span>
            )}
            {item.postoSus && (
              <span className="inline-block rounded-full bg-[var(--c-brand-tint)] px-2 py-0.5 text-[11px] font-bold text-[var(--c-brand)]">
                Posto SUS
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
