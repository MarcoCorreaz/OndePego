'use client';

import React from 'react';
import Link from 'next/link';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { usePrescription } from '@/components/prescription/PrescriptionProvider';
import { PharmacyCrossIcon } from '@/components/ui/Icons';

export function AppHeader() {
  const { openPanel, isPanelOpen } = useAccessibility();
  const { items } = usePrescription();
  const itemCount = items.length;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--c-border)] bg-[var(--c-surface)]/90 text-[var(--c-text)] backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
        <Link
          href="/"
          className="group inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] px-2 py-1 font-display text-2xl font-extrabold tracking-tight text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg-soft)]"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--c-brand)] text-white shadow-xs transition-transform group-active:scale-95"
          >
            <PharmacyCrossIcon className="h-5 w-5" />
          </span>
          <span className="flex items-baseline gap-2">
            <span>Onde Pego</span>
            <span className="hidden rounded-[var(--r-chip)] bg-[var(--c-brand-tint)] px-2.5 py-0.5 font-body text-xs font-bold tracking-normal text-[var(--c-brand)] sm:inline-block">
              Cuiabá • MT
            </span>
          </span>
          <span className="sr-only"> — Início</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {itemCount > 0 && (
            <Link
              href="/minha-receita/"
              className="inline-flex min-h-[48px] items-center gap-1.5 rounded-[var(--r-button)] border border-[var(--c-brand)]/40 bg-[var(--c-brand-tint)] px-3 py-1.5 font-display text-base font-bold text-[var(--c-brand)] shadow-2xs transition-colors hover:bg-[var(--c-brand)] hover:text-white active:translate-y-px"
            >
              <span>Minha Receita</span>
              <span
                aria-label={`${itemCount} ${itemCount === 1 ? 'remédio guardado' : 'remédios guardados'}`}
                className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[var(--c-brand)] px-1.5 text-xs font-black text-white group-hover:bg-white group-hover:text-[var(--c-brand)]"
              >
                {itemCount}
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={openPanel}
            aria-expanded={isPanelOpen}
            aria-haspopup="dialog"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3.5 py-1.5 text-base font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)] active:translate-y-px"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-[var(--c-brand)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="4.5" r="2" />
              <path d="M4 9h16" />
              <path d="M12 9v5" />
              <path d="M9 20l3-6 3 6" />
            </svg>
            <span>Acessibilidade</span>
          </button>

          <Link
            href="/sobre/"
            className="inline-flex min-h-[48px] items-center rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3.5 py-1.5 text-base font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-bg-soft)] active:translate-y-px"
          >
            Sobre
          </Link>
        </div>
      </div>
    </header>
  );
}
