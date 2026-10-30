'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { Icon } from '@/components/ui/Icon';
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
    <article className="ui-card relative overflow-hidden rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6">
      {/* Barra lateral de cor: exato = --c-free, aproximado = --c-attn */}
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-2 ${
          exato ? 'bg-[var(--c-free)]' : 'bg-[var(--c-attn)]'
        }`}
      />

      <div className="pl-2">
        {/* Selo com ÍCONE + TEXTO */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {exato ? (
            <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-free)]/20 bg-[var(--c-free-tint)] px-3.5 py-0.5 text-base font-bold text-[var(--c-free-ink)]">
              <Icon name="check" className="h-4 w-4" />
              <span>Resultado exato</span>
            </span>
          ) : porAssunto ? (
            <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] px-3.5 py-0.5 text-base font-bold text-[var(--c-attn-ink)]">
              <Icon name="info" className="h-4 w-4" />
              <span>
                Encontrado por assunto — confira na sua receita o princípio ativo e a dosagem
              </span>
            </span>
          ) : (
            <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] px-3.5 py-0.5 text-base font-bold text-[var(--c-attn-ink)]">
              <Icon name="info" className="h-4 w-4" />
              <span>Resultado aproximado — confira princípio ativo e dosagem</span>
            </span>
          )}
        </div>

        {/* Nome do princípio ativo em destaque */}
        <h3 className="font-display text-2xl font-black text-[var(--c-text)] sm:text-3xl">
          {item.principio_ativo}
        </h3>

        {/* Dosagens sempre visíveis */}
        <p className="mt-1.5 text-base font-bold text-[var(--c-text)]">
          <strong>Dosagens cadastradas:</strong> {dosagensTexto}
        </p>

        {/* Nomes comerciais */}
        {item.nomes_comerciais.length > 0 && (
          <p className="mt-1 text-base text-[var(--c-text-2)]">
            <strong>Nomes comerciais:</strong> {item.nomes_comerciais.join(', ')}
          </p>
        )}

        {/* Status resumidos */}
        <div className="mt-4 flex flex-wrap gap-2.5 text-base">
          <span
            className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 font-bold ${
              temSus
                ? 'border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] text-[var(--c-brand)]'
                : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text-2)]'
            }`}
          >
            <Icon name={temSus ? 'check' : 'close'} className="h-4 w-4" />
            <span>
              {temSus
                ? 'Padronizado no SUS Cuiabá (consta na lista)'
                : 'Não consta na lista municipal'}
            </span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 font-bold ${
              temFarmaciaPopular
                ? 'border-[var(--c-free)]/25 bg-[var(--c-free-tint)] text-[var(--c-free-ink)]'
                : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text-2)]'
            }`}
          >
            <Icon name={temFarmaciaPopular ? 'check' : 'close'} className="h-4 w-4" />
            <span>
              {temFarmaciaPopular ? 'Gratuito no Farmácia Popular' : 'Fora do Farmácia Popular'}
            </span>
          </span>
        </div>

        {/* Ação */}
        <div className="mt-5 border-t border-[var(--c-border-subtle)] pt-4">
          <Link
            href={buildMedicationDetailPath(item.slug)}
            onClick={handleNavigate}
            className="ui-pressable inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-6 py-2.5 text-center font-display text-xl font-bold text-white shadow-xs transition-opacity hover:opacity-95 active:scale-[0.98] sm:w-auto"
          >
            <span>Ver onde retirar {item.principio_ativo}</span>
            <Icon name="chev" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
