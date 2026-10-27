'use client';

import React, { Suspense, useEffect } from 'react';
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
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (scrollY > 0 && typeof window !== 'undefined') {
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    }
  }, [scrollY]);

  return (
    <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-extrabold text-[var(--c-text)]">
          Buscar remédio
        </h1>
        <p className="text-base text-[var(--c-text-2)]">
          Confira sempre o princípio ativo e a dosagem na sua receita médica antes de escolher.
        </p>
      </header>

      <section
        aria-label="Formulário de busca"
        className="space-y-4 rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-4 sm:p-5"
      >
        <SearchBar navigateOnSubmit={false} />
        <ShortcutChips navigateOnSelect={false} />
      </section>

      <section aria-label="Resultados da busca" className="space-y-4">
        <div role="status" aria-live="polite" className="font-display text-xl font-bold">
          {trimmedQuery.length === 0 ? (
            <p className="text-[var(--c-text-2)]">
              Digite o nome de um remédio acima ou escolha um dos atalhos para ver os resultados.
            </p>
          ) : results.length > 0 ? (
            <p className="text-[var(--c-text)]">
              Encontramos {results.length} resultado(s) para &ldquo;{trimmedQuery}&rdquo;:
            </p>
          ) : null}
        </div>

        {trimmedQuery.length > 0 && results.length === 0 && (
          <EmptySearchState query={trimmedQuery} onClear={clearQuery} />
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((res) => (
              <SearchResultCard key={res.item.slug} resultado={res} />
            ))}
          </div>
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
