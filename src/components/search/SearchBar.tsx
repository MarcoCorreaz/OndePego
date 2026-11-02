'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { Icon } from '@/components/ui/Icon';

export interface SearchBarProps {
  /** Se true, navega para `/buscar/` ao submeter o formulário (padrão na tela inicial) */
  navigateOnSubmit?: boolean;
  autoFocus?: boolean;
  variant?: 'hero' | 'standard' | 'compact';
  /** Se false, desativa o autocomplete flutuante instantâneo */
  showInstantSuggestions?: boolean;
}

export function SearchBar({
  navigateOnSubmit = false,
  autoFocus = false,
  variant = 'standard',
  showInstantSuggestions,
}: SearchBarProps) {
  const { query, results, setQuery, clearQuery } = useSearchSession();
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const listboxId = useId();

  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  // No modo compacto (ex.: página de resultados /buscar/), desativa o autocomplete flutuante por padrão
  const enableSuggestions = showInstantSuggestions ?? !isCompact;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const trimmedQuery = query.trim();
  const suggestions = enableSuggestions && trimmedQuery.length >= 2 ? results.slice(0, 4) : [];

  // Abre o dropdown sempre que houver query >= 2 letras
  useEffect(() => {
    if (enableSuggestions && trimmedQuery.length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [trimmedQuery, enableSuggestions, suggestions.length]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsOpen(false);

    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      const selected = suggestions[highlightedIndex];
      if (selected) {
        router.push(`/medicamento/${selected.item.slug}/`);
        return;
      }
    }

    if (navigateOnSubmit) {
      // ADR-09: NUNCA colocar o termo digitado na URL (nem ?q=).
      router.push('/buscar/');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && trimmedQuery.length >= 2) {
        setIsOpen(true);
      }
      return;
    }

    const totalCount = suggestions.length + 1; // +1 para "Ver todos os resultados"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalCount) % totalCount);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[highlightedIndex];
        if (selected) {
          setIsOpen(false);
          router.push(`/medicamento/${selected.item.slug}/`);
        }
      } else if (highlightedIndex === suggestions.length) {
        e.preventDefault();
        setIsOpen(false);
        router.push('/buscar/');
      }
    }
  };

  return (
    <form
      role="search"
      aria-label="Buscar medicamento"
      onSubmit={handleSubmit}
      className={`relative w-full ${isCompact ? '' : 'space-y-2.5'}`}
    >
      <div className={isHero || isCompact ? 'sr-only' : 'space-y-1'}>
        <label
          htmlFor={inputId}
          className="block font-display text-xl font-bold text-[var(--c-text)] sm:text-2xl"
        >
          Digite o nome do remédio ou princípio ativo
        </label>
      </div>

      <div className={isCompact ? 'relative w-full' : 'flex flex-col gap-2.5 sm:flex-row sm:items-center'}>
        {/* Wrapper do Campo (56px no modo compacto ou 60px padrão) */}
        <div ref={wrapperRef} className="relative flex-1">
          <div
            className={`relative flex ${
              isCompact ? 'h-[56px]' : 'h-[60px]'
            } w-full items-center rounded-[var(--r-search)] shadow-xs transition-shadow ${
              isHero
                ? 'bg-white border-2 border-white focus-within:ring-4 focus-within:ring-[var(--c-attn)]/60 text-slate-900'
                : 'bg-[var(--c-surface)] border-2 border-[var(--c-border-strong)] focus-within:border-[var(--c-brand)] focus-within:ring-4 focus-within:ring-[var(--c-brand)]/15 text-[var(--c-text)]'
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
              onFocus={() => {
                if (enableSuggestions && trimmedQuery.length >= 2 && suggestions.length > 0) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={isOpen && suggestions.length > 0}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                highlightedIndex >= 0 && highlightedIndex < suggestions.length
                  ? `${listboxId}-option-${highlightedIndex}`
                  : undefined
              }
              aria-describedby={hintId}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus={autoFocus}
              maxLength={100}
              placeholder="Ex.: losartana 50mg"
              className={`h-full w-full rounded-[var(--r-search)] bg-transparent ${
                isCompact ? 'py-1 text-base sm:text-lg' : 'py-2 text-lg sm:text-xl'
              } pl-3 pr-20 font-bold ${
                isHero
                  ? 'text-slate-900 placeholder:font-normal placeholder:text-slate-500'
                  : 'text-[var(--c-text)] placeholder:font-normal placeholder:text-[var(--c-text-2)]'
              } focus:outline-none`}
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearQuery();
                    setIsOpen(false);
                  }}
                  aria-label="Limpar texto da busca"
                  className={`inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border font-bold transition-colors ${
                    isHero
                      ? 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)]'
                  }`}
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              )}
              {!isCompact && (
                <span
                  aria-hidden="true"
                  className="hidden rounded-[6px] border border-[var(--c-border)] bg-[var(--c-bg)] px-2 py-0.5 text-xs font-bold text-[var(--c-text-2)] md:inline-block"
                >
                  Enter ↵
                </span>
              )}
            </div>
          </div>

          {/* Dropdown Flutuante de Sugestões Instantâneas */}
          {isOpen && suggestions.length > 0 && (
            <div
              id={listboxId}
              role="listbox"
              aria-label="Sugestões de medicamentos"
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xl backdrop-blur-md"
            >
              <div className="p-1.5 space-y-1">
                {suggestions.map((res, idx) => {
                  const isSelected = highlightedIndex === idx;
                  const hasPfpb = res.item.apresentacoes.some((a) => a.farmacia_popular_gratuito);
                  const hasSus = res.item.apresentacoes.some(
                    (a) => a.status_remume_cuiaba === 'PADRONIZADO_REMUME',
                  );
                  const dosagensResumo = res.item.apresentacoes
                    .map((a) => a.descricao_dosagem)
                    .slice(0, 2)
                    .join(' • ');

                  return (
                    <Link
                      key={res.item.slug}
                      id={`${listboxId}-option-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      href={`/medicamento/${res.item.slug}/`}
                      onClick={() => setIsOpen(false)}
                      className={`flex min-h-[52px] flex-col gap-1.5 rounded-xl px-3.5 py-2.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                        isSelected
                          ? 'bg-[var(--c-brand-tint)] text-[var(--c-brand)]'
                          : 'text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="block font-display text-base font-black text-[var(--c-text)] sm:text-lg">
                          {res.item.principio_ativo}
                        </span>
                        <span className="block truncate text-xs text-[var(--c-text-2)] sm:text-sm">
                          {dosagensResumo}
                        </span>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        {hasPfpb && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                            Grátis Farmácia Popular
                          </span>
                        )}
                        {hasSus && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:text-blue-300">
                            Posto SUS
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Opção final: Ver todos os resultados */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/buscar/');
                }}
                className={`flex min-h-[48px] w-full items-center justify-between border-t border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] px-4 py-3 text-sm font-black text-[var(--c-brand)] transition-colors hover:bg-[var(--c-brand-tint)] ${
                  highlightedIndex === suggestions.length
                    ? 'bg-[var(--c-brand-tint)] ring-2 ring-inset ring-[var(--c-brand)]'
                    : ''
                }`}
              >
                <span>Ver todos os resultados para &ldquo;{trimmedQuery}&rdquo;</span>
                <span className="text-base font-bold" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Botão primário (oculto no modo compacto) */}
        {!isCompact && (
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
        )}
      </div>

      <p
        id={hintId}
        className={
          isCompact
            ? 'sr-only'
            : `text-base font-medium ${isHero ? 'text-white/90' : 'text-[var(--c-text-2)]'}`
        }
      >
        Exemplos: losartana, metformina 850
      </p>
    </form>
  );
}
