'use client';

import React from 'react';
import Link from 'next/link';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { usePrescription } from '@/components/prescription/PrescriptionProvider';
import { BrandMark } from '@/components/ui/BrandMark';
import { Icon } from '@/components/ui/Icon';

export function AppHeader() {
  const { openPanel, isPanelOpen, isDark, toggleTheme } = useAccessibility();
  const { items } = usePrescription();
  const itemCount = items.length;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[var(--c-border)] bg-[var(--c-surface)]/90 backdrop-blur-md text-[var(--c-text)] shadow-xs">
      <div className="mx-auto flex h-full max-w-4xl items-center justify-between px-3 sm:px-4">
        {/* BrandMark à esquerda */}
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center rounded-[var(--r-button)] px-1 py-1 transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          <BrandMark />
          <span className="sr-only"> — Início</span>
        </Link>

        {/* Ações à direita */}
        <div className="flex items-center gap-2">
          {itemCount > 0 && (
            <Link
              href="/minha-receita/"
              className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--c-brand)]/30 bg-[var(--c-brand-tint)] px-3 text-sm font-bold text-[var(--c-brand)] transition-colors hover:bg-[var(--c-brand)] hover:text-white"
              title="Ver minha receita"
            >
              <Icon name="doc" className="h-4 w-4" />
              <span>Receita</span>
              <span
                aria-label={`${itemCount} ${itemCount === 1 ? 'remédio salvo' : 'remédios salvos'}`}
                className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--c-brand)] px-1 text-xs font-black text-white"
              >
                {itemCount}
              </span>
            </Link>
          )}

          {/* Botão rápido de alternar Tema Claro / Escuro (48x48px) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            className="ui-pressable inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--c-border-strong)] bg-[var(--c-bg)] text-[var(--c-text)] shadow-2xs transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)] active:scale-[0.98]"
          >
            <Icon name={isDark ? 'sun' : 'moon'} className="h-5 w-5 text-[var(--c-brand)]" />
          </button>

          {/* Botão circular de 48px com ícone a11y */}
          <button
            type="button"
            onClick={openPanel}
            aria-expanded={isPanelOpen}
            aria-haspopup="dialog"
            aria-label="Abrir opções de acessibilidade"
            title="Abrir opções de acessibilidade"
            className="ui-pressable inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--c-border-strong)] bg-[var(--c-bg)] text-[var(--c-text)] shadow-2xs transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)] active:scale-[0.98]"
          >
            <Icon name="a11y" className="h-6 w-6 text-[var(--c-brand)]" />
          </button>
        </div>
      </div>
    </header>
  );
}
