'use client';

import React from 'react';
import Link from 'next/link';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';

export function AppHeader() {
  const { openPanel, isPanelOpen } = useAccessibility();

  return (
    <header className="border-b-2 border-[var(--c-border)] bg-[var(--c-brand)] text-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] px-2 py-1 font-display text-2xl font-extrabold tracking-tight text-white focus-visible:outline-white"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded bg-[var(--c-attn)] font-display text-lg font-extrabold text-[var(--c-text)]"
          >
            +
          </span>
          <span>Onde Pego</span>
          <span className="sr-only"> — Início</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPanel}
            aria-expanded={isPanelOpen}
            aria-haspopup="dialog"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border-2 border-white bg-white/10 px-3 py-1.5 text-base font-bold text-white hover:bg-white/20 focus-visible:outline-white active:translate-y-px"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
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
            className="inline-flex min-h-[48px] items-center rounded-[var(--r-button)] border-2 border-white/80 px-3 py-1.5 text-base font-bold text-white hover:bg-white/20 focus-visible:outline-white"
          >
            Sobre
          </Link>
        </div>
      </div>
    </header>
  );
}
