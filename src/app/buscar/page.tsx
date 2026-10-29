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
import type { MetaDados } from '@/types/schema';
import metaJson from '../../../data/meta.json';

const meta = metaJson as MetaDados;

function BuscarContent() {
  const { query, results, scrollY, clearQuery } = useSearchSession();
  const { effectiveReduceMotion } = useAccessibility();
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (scrollY > 0 && typeof window !== 'undefined') {
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    }
  }, [scrollY]);

  return (
    <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
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
              Encontramos {results.length} resultado(s) para &ldquo;{trimmedQuery}&rdquo;:
            </p>
          ) : null}
        </div>

        {trimmedQuery.replace(/\s+/g, '').length >= 2 && results.length === 0 && (
          <EmptySearchState query={trimmedQuery} onClear={clearQuery} />
        )}

        {results.length > 0 && (
          <LazyMotion features={domAnimation} strict>
            <MotionConfig reducedMotion={effectiveReduceMotion ? 'always' : 'user'}>
              <div className="space-y-4">
                {results.map((res, idx) => (
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
              </div>
            </MotionConfig>
          </LazyMotion>
        )}
      </section>
    </main>
  );
}

export default function BuscarPage() {
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
