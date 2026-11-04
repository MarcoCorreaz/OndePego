'use client';

import React, { Suspense, useEffect } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { EmptySearchState } from '@/components/search/EmptySearchState';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { ShortcutChips } from '@/components/search/ShortcutChips';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import { usePagedList } from '@/lib/usePagedList';
import type { MetaDados } from '@/types/schema';

export interface BuscarClientProps {
  meta: MetaDados;
}

function BuscarContent() {
  const { query, results, scrollY, clearQuery } = useSearchSession();
  const { effectiveReduceMotion } = useAccessibility();
  const trimmedQuery = query.trim();
  const hasActiveQuery = trimmedQuery.replace(/\s+/g, '').length >= 2;
  const isOnlyApproximate =
    results.length > 0 && results.every((r) => !r.exato && !r.porAssunto);

  const {
    visibleItems,
    visibleCount,
    totalCount,
    hasMore,
    nextStepCount,
    showMore,
  } = usePagedList({
    items: results,
    initialLimit: 12,
    step: 12,
    storageKey: 'buscar_resultados',
    resetKey: trimmedQuery,
  });

  // Restaura o scroll apenas na montagem inicial (ex.: ao voltar da tela de um medicamento)
  const hasRestoredScrollRef = React.useRef(false);
  useEffect(() => {
    if (!hasRestoredScrollRef.current && scrollY > 0 && typeof window !== 'undefined') {
      hasRestoredScrollRef.current = true;
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    }
  }, [scrollY]);

  // Ao digitar uma busca ativa, rola suavemente para o topo para ver o primeiro resultado
  useEffect(() => {
    if (hasActiveQuery && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [hasActiveQuery]);

  return (
    <main
      id="conteudo-principal"
      className={`mx-auto max-w-4xl px-4 ${
        hasActiveQuery ? 'space-y-3 py-2 sm:py-6' : 'space-y-6 py-6 sm:py-8'
      }`}
    >
      {!hasActiveQuery ? (
        <>
          <header className="space-y-1.5">
            <h1 className="font-display text-3xl font-extrabold text-[var(--c-text)] sm:text-4xl">
              Buscar remédio
            </h1>
            <p className="text-base text-[var(--c-text-2)]">
              Confira sempre o princípio ativo e a dosagem na sua receita médica antes de escolher.
            </p>
          </header>

          <section
            aria-label="Formulário de busca"
            className="ui-card-elevated space-y-5 p-5 sm:p-6"
          >
            <SearchBar navigateOnSubmit={false} />
            <div className="border-t border-[var(--c-border-subtle)] pt-4">
              <ShortcutChips navigateOnSelect={false} />
            </div>
          </section>
        </>
      ) : (
        <section aria-label="Formulário de busca" className="pt-1">
          <SearchBar variant="compact" navigateOnSubmit={false} />
        </section>
      )}

      <section aria-label="Resultados da busca" className="space-y-4">
        <div role="status" aria-live="polite" className="font-display text-xl font-bold">
          {trimmedQuery.length === 0 ? (
            <p className="text-[var(--c-text-2)]">
              Digite o nome de um remédio acima ou escolha um dos exemplos para ver os resultados.
            </p>
          ) : trimmedQuery.replace(/\s+/g, '').length < 2 ? (
            <p className="text-[var(--c-text-2)]">
              Digite pelo menos 2 letras do nome do remédio para buscar.
            </p>
          ) : results.length > 0 ? (
            <p className="text-[var(--c-text)]">
              Encontramos {results.length === 1 ? '1 resultado' : `${results.length} resultados`} para &ldquo;{trimmedQuery}&rdquo;:
            </p>
          ) : null}
        </div>

        {isOnlyApproximate && (
          <div
            role="note"
            className="flex items-start gap-3 rounded-[var(--r-button)] border border-[var(--c-attn-border)] bg-[var(--c-attn)] p-4 text-[var(--c-text)]"
          >
            <p className="text-base font-bold leading-snug">
              Não encontramos &ldquo;{trimmedQuery}&rdquo; com esse nome exato no catálogo. Abaixo estão medicamentos com grafia parecida — confira com atenção o princípio ativo na sua receita e nunca substitua sem orientação médica ou farmacêutica.
            </p>
          </div>
        )}

        {trimmedQuery.replace(/\s+/g, '').length >= 2 && results.length === 0 && (
          <EmptySearchState query={trimmedQuery} onClear={clearQuery} />
        )}

        {results.length > 0 && (
          <LazyMotion features={domAnimation} strict>
            <MotionConfig reducedMotion={effectiveReduceMotion ? 'always' : 'user'}>
              <div className="space-y-4">
                {visibleItems.map((res, idx) => (
                  <m.div
                    key={res.item.slug}
                    initial={effectiveReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: effectiveReduceMotion ? 0 : 0.18,
                      delay: effectiveReduceMotion ? 0 : Math.min(idx * 0.03, 0.15),
                      ease: 'easeOut',
                    }}
                  >
                    <SearchResultCard resultado={res} />
                  </m.div>
                ))}

                {hasMore && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={showMore}
                      data-testid="search-results-show-more"
                      className="ui-pressable inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-5 py-3 font-display text-base font-bold text-[var(--c-brand)] shadow-2xs hover:bg-[var(--c-bg-soft)] sm:w-auto"
                    >
                      <span>
                        Mostrar mais {nextStepCount}{' '}
                        {nextStepCount === 1 ? 'resultado' : 'resultados'} (exibindo {visibleCount}{' '}
                        de {totalCount})
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </MotionConfig>
          </LazyMotion>
        )}
      </section>
    </main>
  );
}

export function BuscarClient({ meta }: BuscarClientProps) {
  return (
    <>
      <FreshnessBanner meta={meta} />
      <Suspense
        fallback={
          <main id="conteudo-principal" className="mx-auto max-w-4xl px-4 py-8">
            <p className="font-display text-xl font-bold">Carregando busca...</p>
          </main>
        }
      >
        <BuscarContent />
      </Suspense>
    </>
  );
}
