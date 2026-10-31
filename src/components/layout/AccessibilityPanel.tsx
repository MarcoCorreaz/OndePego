'use client';

import React, { useEffect, useRef } from 'react';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { CheckCircleIcon, CloseIcon, RadioDotIcon } from '@/components/ui/Icons';
import type { FontScale, ThemeMode } from '@/lib/prefs';

const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string; description: string }> = [
  { value: 'normal', label: 'Padrão (18px)', description: 'Tamanho grande padrão' },
  { value: 'large', label: 'Grande (21px)', description: 'Letra ampliada' },
  { value: 'xlarge', label: 'Extra grande (24px)', description: 'Máxima leitura' },
];

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; description: string }> = [
  { value: 'light', label: 'Tema Claro', description: 'Papel claro e iluminado' },
  { value: 'dark', label: 'Tema Escuro', description: 'Conforto visual noturno' },
  { value: 'system', label: 'Automático', description: 'Segue o sistema' },
];

export function AccessibilityPanel() {
  const {
    prefs,
    isPanelOpen,
    closePanel,
    setFontScale,
    setHighContrast,
    setReduceMotion,
    setTheme,
    resetPrefs,
  } = useAccessibility();

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isPanelOpen) {
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
      return;
    }

    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      previousActiveElementRef.current = document.activeElement;
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (firstElement && lastElement) {
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closePanel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-panel-title"
        className="ui-card-elevated max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[20px] border-t-4 border-t-[var(--c-brand)] bg-[var(--c-surface)] p-4 text-[var(--c-text)] transition-opacity duration-150 sm:rounded-[var(--r-plate)] sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--c-border-subtle)] pb-4">
          <h2 id="a11y-panel-title" className="font-display text-xl font-extrabold sm:text-2xl">
            Opções de leitura e acessibilidade
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closePanel}
            className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-4 font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)] active:translate-y-px"
          >
            <CloseIcon className="h-4 w-4" />
            <span>Fechar</span>
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <fieldset>
            <legend className="font-display text-xl font-bold text-[var(--c-text)]">
              Tamanho da letra
            </legend>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {FONT_SCALE_OPTIONS.map((option) => {
                const selected = prefs.fontScale === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFontScale(option.value)}
                    className={`flex min-h-[60px] flex-col items-start justify-center rounded-[var(--r-button)] border px-3.5 py-2.5 text-left transition-colors ${
                      selected
                        ? 'border-[var(--c-brand)] bg-[var(--c-brand-tint)] font-bold text-[var(--c-brand)] shadow-2xs'
                        : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 text-base font-bold">
                      <RadioDotIcon checked={selected} className="h-4 w-4" />
                      <span>{option.label}</span>
                    </span>
                    <span className="mt-0.5 text-sm text-[var(--c-text-2)]">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border-t border-[var(--c-border-subtle)] pt-4">
            <legend className="font-display text-xl font-bold text-[var(--c-text)]">
              Tema visual (modo de cor)
            </legend>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {THEME_OPTIONS.map((option) => {
                const selected = prefs.theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTheme(option.value)}
                    className={`flex min-h-[60px] flex-col items-start justify-center rounded-[var(--r-button)] border px-3.5 py-2.5 text-left transition-colors ${
                      selected
                        ? 'border-[var(--c-brand)] bg-[var(--c-brand-tint)] font-bold text-[var(--c-brand)] shadow-2xs'
                        : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 text-base font-bold">
                      <RadioDotIcon checked={selected} className="h-4 w-4" />
                      <span>{option.label}</span>
                    </span>
                    <span className="mt-0.5 text-sm text-[var(--c-text-2)]">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3.5 border-t border-[var(--c-border-subtle)] pt-4">
            <div className="flex flex-col items-start justify-between gap-3 rounded-[var(--r-button)] bg-[var(--c-bg)] p-3.5 sm:flex-row sm:items-center">
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
                className={`inline-flex min-h-[48px] w-full min-w-[130px] items-center justify-center gap-1.5 rounded-[var(--r-button)] border px-4 font-bold transition-colors sm:w-auto ${
                  prefs.highContrast
                    ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white'
                    : 'border-[var(--c-border-strong)] bg-[var(--c-surface)] text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
                }`}
              >
                {prefs.highContrast && <CheckCircleIcon className="h-4 w-4" />}
                <span>{prefs.highContrast ? 'Ativado' : 'Desativado'}</span>
              </button>
            </div>

            <div className="flex flex-col items-start justify-between gap-3 rounded-[var(--r-button)] bg-[var(--c-bg)] p-3.5 sm:flex-row sm:items-center">
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
                className={`inline-flex min-h-[48px] w-full min-w-[130px] items-center justify-center gap-1.5 rounded-[var(--r-button)] border px-4 font-bold transition-colors sm:w-auto ${
                  prefs.reduceMotion
                    ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white'
                    : 'border-[var(--c-border-strong)] bg-[var(--c-surface)] text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
                }`}
              >
                {prefs.reduceMotion && <CheckCircleIcon className="h-4 w-4" />}
                <span>{prefs.reduceMotion ? 'Ativado' : 'Desativado'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--c-border-subtle)] pt-4 sm:flex-row sm:items-center">
            <p className="text-sm text-[var(--c-text-2)]">
              Suas escolhas ficam salvas somente neste aparelho.
            </p>
            <button
              type="button"
              onClick={resetPrefs}
              className="min-h-[48px] w-full rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3.5 text-sm font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)] sm:w-auto"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
