'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@/components/ui/Icons';
import type { ResultadoBusca } from '@/lib/searchEngine';
import { buildMedicationDetailPath } from '@/lib/share';

export interface SearchResultCardProps {
  resultado: ResultadoBusca;
}

export function SearchResultCard({ resultado }: SearchResultCardProps) {
  const { recordScrollY } = useSearchSession();
  const { item, exato, porAssunto } = resultado;

  const dosagensTexto = item.apresentacoes.map((a) => a.descricao_dosagem).join(' • ');
  const temSus = item.apresentacoes.some((a) => a.status_remume_cuiaba === 'PADRONIZADO_REMUME');
  const temFarmaciaPopular = item.apresentacoes.some((a) => a.farmacia_popular_gratuito);

  const handleNavigate = () => {
    if (typeof window !== 'undefined') {
      recordScrollY(window.scrollY);
    }
  };

  return (
    <article className="ui-card relative overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 ${
          temFarmaciaPopular
            ? 'bg-[var(--c-free)]'
            : temSus
              ? 'bg-[var(--c-brand)]'
              : 'bg-[var(--c-border-strong)]'
        }`}
      />

      <div className="pl-1.5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {exato ? (
            <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] px-3.5 py-0.5 text-base font-bold text-[var(--c-brand)]">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Resultado exato</span>
            </span>
          ) : porAssunto ? (
            <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-brand)]/25 bg-[var(--c-bg)] px-3.5 py-0.5 text-base font-bold text-[var(--c-text)]">
              <AlertTriangleIcon className="h-4 w-4 text-[var(--c-brand)]" />
              <span>
                Encontrado por assunto — confira na sua receita o princípio ativo e a dosagem
              </span>
            </span>
          ) : (
            <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-attn-border)] bg-[var(--c-attn)] px-3.5 py-0.5 text-base font-bold text-[var(--c-text)]">
              <AlertTriangleIcon className="h-4 w-4" />
              <span>Resultado aproximado — confira princípio ativo e dosagem</span>
            </span>
          )}
        </div>

        <h3 className="font-display text-2xl font-extrabold text-[var(--c-text)] sm:text-3xl">
          {item.principio_ativo}
        </h3>

        <p className="mt-1.5 text-base font-bold text-[var(--c-text)]">
          <strong>Dosagens cadastradas:</strong> {dosagensTexto}
        </p>

        {item.nomes_comerciais.length > 0 && (
          <p className="mt-1 text-base text-[var(--c-text-2)]">
            <strong>Nomes comerciais:</strong> {item.nomes_comerciais.join(', ')}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2.5 text-base">
          <span
            className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 font-bold ${
              temSus
                ? 'border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] text-[var(--c-brand)]'
                : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text-2)]'
            }`}
          >
            {temSus ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <XCircleIcon className="h-4 w-4" />
            )}
            <span>
              {temSus
                ? 'Padronizado no SUS Cuiabá (consta na lista)'
                : 'Não consta na lista municipal'}
            </span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 font-bold ${
              temFarmaciaPopular
                ? 'border-[var(--c-free)]/25 bg-[var(--c-free-tint)] text-[var(--c-free)]'
                : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text-2)]'
            }`}
          >
            {temFarmaciaPopular ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <XCircleIcon className="h-4 w-4" />
            )}
            <span>
              {temFarmaciaPopular ? 'Gratuito no Farmácia Popular' : 'Fora do Farmácia Popular'}
            </span>
          </span>
        </div>

        <div className="mt-5 border-t border-[var(--c-border-subtle)] pt-4">
          <Link
            href={buildMedicationDetailPath(item.slug)}
            onClick={handleNavigate}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-5 py-2.5 text-center font-display text-xl font-bold text-white shadow-xs transition-opacity hover:opacity-95 active:translate-y-px sm:w-auto"
          >
            <span>Ver onde retirar {item.principio_ativo}</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
