'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import type { ResultadoBusca } from '@/lib/searchEngine';
import { buildMedicationDetailPath } from '@/lib/share';

export interface SearchResultCardProps {
  resultado: ResultadoBusca;
}

export function SearchResultCard({ resultado }: SearchResultCardProps) {
  const { recordScrollY } = useSearchSession();
  const { item, exato } = resultado;

  const dosagensTexto = item.apresentacoes.map((a) => a.descricao_dosagem).join(' • ');
  const temSus = item.apresentacoes.some((a) => a.status_remume_cuiaba === 'PADRONIZADO_REMUME');
  const temFarmaciaPopular = item.apresentacoes.some((a) => a.farmacia_popular_gratuito);

  const handleNavigate = () => {
    if (typeof window !== 'undefined') {
      recordScrollY(window.scrollY);
    }
  };

  return (
    <article className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {exato ? (
          <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border-2 border-[var(--c-brand)] bg-[var(--c-brand-tint)] px-3 py-0.5 text-base font-bold text-[var(--c-brand)]">
            <span aria-hidden="true">✓</span>
            <span>Resultado exato</span>
          </span>
        ) : (
          <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border-2 border-[var(--c-border)] bg-[var(--c-attn)] px-3 py-0.5 text-base font-bold text-[var(--c-text)]">
            <span aria-hidden="true">⚠</span>
            <span>Resultado aproximado — confira princípio ativo e dosagem</span>
          </span>
        )}
      </div>

      <h3 className="font-display text-2xl font-extrabold text-[var(--c-text)]">
        {item.principio_ativo}
      </h3>

      <p className="mt-1 text-base font-bold text-[var(--c-text)]">
        <strong>Dosagens cadastradas:</strong> {dosagensTexto}
      </p>

      {item.nomes_comerciais.length > 0 && (
        <p className="mt-1 text-base text-[var(--c-text-2)]">
          <strong>Nomes comerciais:</strong> {item.nomes_comerciais.join(', ')}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-base">
        <span
          className={`inline-flex items-center gap-1.5 rounded border-2 px-2.5 py-1 font-bold ${
            temSus
              ? 'border-[var(--c-brand)] bg-[var(--c-brand-tint)] text-[var(--c-brand)]'
              : 'border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] text-[var(--c-text-2)]'
          }`}
        >
          <span aria-hidden="true">{temSus ? '✓' : '✕'}</span>
          <span>
            {temSus ? 'Padronizado no SUS Cuiabá (consta na lista)' : 'Não consta na lista municipal'}
          </span>
        </span>

        <span
          className={`inline-flex items-center gap-1.5 rounded border-2 px-2.5 py-1 font-bold ${
            temFarmaciaPopular
              ? 'border-[var(--c-free)] bg-[var(--c-free-tint)] text-[var(--c-free)]'
              : 'border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] text-[var(--c-text-2)]'
          }`}
        >
          <span aria-hidden="true">{temFarmaciaPopular ? '✓' : '✕'}</span>
          <span>
            {temFarmaciaPopular ? 'Gratuito no Farmácia Popular' : 'Fora do Farmácia Popular'}
          </span>
        </span>
      </div>

      <div className="mt-4 border-t-2 border-[var(--c-border-subtle)] pt-3">
        <Link
          href={buildMedicationDetailPath(item.slug)}
          onClick={handleNavigate}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2.5 text-center font-display text-xl font-bold text-white sm:w-auto"
        >
          Ver onde retirar {item.principio_ativo}
        </Link>
      </div>
    </article>
  );
}
