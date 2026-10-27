'use client';

import React, { useId } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';

export interface SearchBarProps {
  /** Se true, navega para `/buscar/` ao submeter o formulário (padrão na tela inicial) */
  navigateOnSubmit?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({ navigateOnSubmit = false, autoFocus = false }: SearchBarProps) {
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

  return (
    <form
      role="search"
      aria-label="Buscar medicamento"
      onSubmit={handleSubmit}
      className="space-y-2"
    >
      <label
        htmlFor={inputId}
        className="block font-display text-xl font-bold text-[var(--c-text)]"
      >
        Digite o nome do remédio ou princípio ativo
      </label>
      <p id={hintId} className="text-base text-[var(--c-text-2)]">
        Exemplos: losartana, metformina 850, pressão, diabetes
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex flex-1 items-center">
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
            placeholder="Ex.: losartana 50mg"
            className="min-h-[56px] w-full rounded-[var(--r-search)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] py-3 pl-4 pr-14 text-xl font-bold text-[var(--c-text)] placeholder:font-normal placeholder:text-[var(--c-text-2)]"
          />

          {query.length > 0 && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Limpar texto da busca"
              className="absolute right-2 inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] font-bold text-[var(--c-text)] hover:border-[var(--c-border)]"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex min-h-[56px] shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-6 py-3 font-display text-xl font-extrabold text-white active:translate-y-px"
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span>Buscar remédio</span>
        </button>
      </div>
    </form>
  );
}
