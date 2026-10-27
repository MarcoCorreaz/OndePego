'use client';

import React, { useEffect, useRef } from 'react';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import type { FontScale } from '@/lib/prefs';

const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string; description: string }> = [
  { value: 'normal', label: 'Padrão (18px)', description: 'Tamanho grande padrão' },
  { value: 'large', label: 'Grande (21px)', description: 'Letra ampliada' },
  { value: 'xlarge', label: 'Extra grande (24px)', description: 'Máxima leitura' },
];

export function AccessibilityPanel() {
  const {
    prefs,
    isPanelOpen,
    closePanel,
    setFontScale,
    setHighContrast,
    setReduceMotion,
    resetPrefs,
  } = useAccessibility();

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPanelOpen, closePanel]);

  if (!isPanelOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closePanel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-panel-title"
        className="w-full max-w-lg border-t-4 border-[var(--c-brand)] bg-[var(--c-bg)] p-5 text-[var(--c-text)] transition-opacity duration-150 sm:rounded-[var(--r-plate)] sm:border-2 sm:border-[var(--c-border)]"
      >
        <div className="flex items-center justify-between gap-4 border-b-2 border-[var(--c-border-subtle)] pb-3">
          <h2 id="a11y-panel-title" className="font-display text-2xl font-bold">
            Opções de leitura e acessibilidade
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closePanel}
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] px-4 font-bold text-[var(--c-text)] active:translate-y-px"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 space-y-5">
          <fieldset>
            <legend className="font-display text-xl font-bold text-[var(--c-text)]">
              Tamanho da letra
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {FONT_SCALE_OPTIONS.map((option) => {
                const selected = prefs.fontScale === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFontScale(option.value)}
                    className={`flex min-h-[56px] flex-col items-start justify-center rounded-[var(--r-button)] border-2 px-3 py-2 text-left transition-colors ${
                      selected
                        ? 'border-[var(--c-brand)] bg-[var(--c-brand-tint)] font-bold text-[var(--c-brand)]'
                        : 'border-[var(--c-border-subtle)] bg-[var(--c-bg)] text-[var(--c-text)]'
                    }`}
                  >
                    <span className="text-base font-bold">
                      {selected ? '✓ ' : ''}
                      {option.label}
                    </span>
                    <span className="text-sm text-[var(--c-text-2)]">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 border-t-2 border-[var(--c-border-subtle)] pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p id="label-alto-contraste" className="font-display text-xl font-bold">
                  Alto contraste máximo
                </p>
                <p className="text-sm text-[var(--c-text-2)]">
                  Fundo branco puro, texto preto e bordas reforçadas.
                </p>
              </div>
              <button
                type="button"
                aria-labelledby="label-alto-contraste"
                aria-pressed={prefs.highContrast}
                onClick={() => setHighContrast(!prefs.highContrast)}
                className={`min-h-[48px] min-w-[120px] rounded-[var(--r-button)] border-2 px-4 font-bold ${
                  prefs.highContrast
                    ? 'border-[var(--c-border)] bg-[var(--c-brand)] text-white'
                    : 'border-[var(--c-border)] bg-[var(--c-bg-soft)] text-[var(--c-text)]'
                }`}
              >
                {prefs.highContrast ? '✓ Ativado' : 'Desativado'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[var(--c-border-subtle)] pt-3">
              <div>
                <p id="label-reduzir-movimento" className="font-display text-xl font-bold">
                  Reduzir animações
                </p>
                <p className="text-sm text-[var(--c-text-2)]">
                  Troca transições por mudanças diretas na tela.
                </p>
              </div>
              <button
                type="button"
                aria-labelledby="label-reduzir-movimento"
                aria-pressed={prefs.reduceMotion}
                onClick={() => setReduceMotion(!prefs.reduceMotion)}
                className={`min-h-[48px] min-w-[120px] rounded-[var(--r-button)] border-2 px-4 font-bold ${
                  prefs.reduceMotion
                    ? 'border-[var(--c-border)] bg-[var(--c-brand)] text-white'
                    : 'border-[var(--c-border)] bg-[var(--c-bg-soft)] text-[var(--c-text)]'
                }`}
              >
                {prefs.reduceMotion ? '✓ Ativado' : 'Desativado'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t-2 border-[var(--c-border-subtle)] pt-4">
            <p className="text-sm text-[var(--c-text-2)]">
              Suas escolhas ficam salvas somente neste aparelho.
            </p>
            <button
              type="button"
              onClick={resetPrefs}
              className="min-h-[48px] rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-3 text-sm font-bold text-[var(--c-text)]"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
