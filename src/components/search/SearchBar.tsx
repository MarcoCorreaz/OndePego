'use client';

import React, { useId } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { CloseIcon, SearchIcon } from '@/components/ui/Icons';

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
      className="space-y-2.5"
    >
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="block font-display text-xl font-bold text-[var(--c-text)] sm:text-2xl"
        >
          Digite o nome do remédio ou princípio ativo
        </label>
        <p id={hintId} className="text-base text-[var(--c-text-2)]">
          Exemplos: losartana, metformina 850, salbutamol. Você também pode usar o microfone do
          teclado do celular para ditar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="ui-search-shell relative flex flex-1 items-center">
          <span
            aria-hidden="true"
            className="pointer-events-none pl-4 text-[var(--c-brand)]"
          >
            <SearchIcon className="h-6 w-6" />
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
            placeholder="Ex.: losartana 50mg"
            className="min-h-[58px] w-full rounded-[var(--r-search)] bg-transparent py-3 pl-3 pr-14 text-xl font-bold text-[var(--c-text)] placeholder:font-normal placeholder:text-[var(--c-text-2)] focus:outline-none"
          />

          {query.length > 0 && (
            <button
              type="button"
              onClick={clearQuery}
              aria-label="Limpar texto da busca"
              className="absolute right-2 inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] font-bold text-[var(--c-text)] transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)]"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex min-h-[58px] shrink-0 items-center justify-center gap-2.5 rounded-[var(--r-search)] border border-[var(--c-brand)] bg-[var(--c-brand)] px-6 py-3 font-display text-xl font-extrabold text-white shadow-sm transition-all hover:opacity-95 active:translate-y-px"
        >
          <SearchIcon className="h-5 w-5" />
          <span>Buscar remédio</span>
        </button>
      </div>
    </form>
  );
}
