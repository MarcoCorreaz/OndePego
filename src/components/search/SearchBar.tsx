'use client';

import React, { useId } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { Icon } from '@/components/ui/Icon';

export interface SearchBarProps {
  /** Se true, navega para `/buscar/` ao submeter o formulário (padrão na tela inicial) */
  navigateOnSubmit?: boolean;
  autoFocus?: boolean;
  variant?: 'hero' | 'standard';
}

export function SearchBar({
  navigateOnSubmit = false,
  autoFocus = false,
  variant = 'standard',
}: SearchBarProps) {
  const { query, setQuery, clearQuery } = useSearchSession();
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (navigateOnSubmit) {
      // ADR-09: NUNCA colocar o termo digitado na URL (nem ?q=).
      router.push('/buscar/');
    }
  };

  const isHero = variant === 'hero';

  return (
    <form
      role="search"
      aria-label="Buscar medicamento"
      onSubmit={handleSubmit}
      className="w-full space-y-2.5"
    >
      <div className={isHero ? 'sr-only' : 'space-y-1'}>
        <label
          htmlFor={inputId}
          className="block font-display text-xl font-bold text-[var(--c-text)] sm:text-2xl"
        >
          Digite o nome do remédio ou princípio ativo
        </label>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Campo de 60px com fundo branco */}
        <div
          className={`relative flex h-[60px] flex-1 items-center rounded-[var(--r-search)] bg-white shadow-xs transition-shadow ${
            isHero
              ? 'border-2 border-white focus-within:ring-4 focus-within:ring-[var(--c-attn)]/60'
              : 'border-2 border-[var(--c-border-strong)] focus-within:border-[var(--c-brand)] focus-within:ring-4 focus-within:ring-[var(--c-brand)]/15'
          }`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none pl-4 text-[var(--c-brand)]"
          >
            <Icon name="search" className="h-6 w-6" />
          </span>

          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-describedby={hintId}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus={autoFocus}
            maxLength={100}
            placeholder="Ex.: losartana 50mg"
            className="h-full w-full rounded-[var(--r-search)] bg-transparent py-2 pl-3 pr-20 text-lg sm:text-xl font-bold text-[var(--c-text)] placeholder:font-normal placeholder:text-[var(--c-text-2)] focus:outline-none"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {query.length > 0 && (
              <button
                type="button"
                onClick={clearQuery}
                aria-label="Limpar texto da busca"
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] font-bold text-[var(--c-text)] transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)]"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            )}
            <span
              aria-hidden="true"
              className="hidden rounded-[6px] border border-[var(--c-border)] bg-[var(--c-bg)] px-2 py-0.5 text-xs font-bold text-[var(--c-text-2)] md:inline-block"
            >
              Enter ↵
            </span>
          </div>
        </div>

        {/* Botão primário de 56px */}
        <button
          type="submit"
          className={`ui-pressable inline-flex h-14 min-h-[56px] shrink-0 items-center justify-center gap-2.5 rounded-[var(--r-search)] px-7 py-3 font-display text-xl font-black shadow-xs transition-all active:scale-[0.98] ${
            isHero
              ? 'border-2 border-[var(--c-attn)] bg-[var(--c-attn)] text-[var(--c-text)] hover:brightness-105'
              : 'border-2 border-[var(--c-brand)] bg-[var(--c-brand)] text-white hover:opacity-95'
          }`}
        >
          <Icon name="search" className="h-5 w-5" />
          <span>Buscar remédio</span>
        </button>
      </div>

      <p
        id={hintId}
        className={`text-base font-medium ${isHero ? 'text-white/90' : 'text-[var(--c-text-2)]'}`}
      >
        Exemplos: losartana, metformina 850
      </p>
    </form>
  );
}
