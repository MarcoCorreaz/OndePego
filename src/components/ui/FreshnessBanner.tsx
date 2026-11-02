import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { getFreshness } from '@/lib/freshness';
import { formatIsoDatePTBR, getStaleBannerCopy } from '@/lib/healthCopy';
import type { MetaDados } from '@/types/schema';

export interface FreshnessBannerProps {
  meta: MetaDados;
  now?: Date | string;
}

export function FreshnessBanner({ meta, now }: FreshnessBannerProps) {
  const freshness = getFreshness(meta, now);

  if (freshness.desatualizado) {
    return (
      <section
        aria-label="Aviso de atualização dos dados"
        role="status"
        className="min-h-[44px] border-b border-[var(--c-attn-border)] bg-[var(--c-attn)] px-4 py-2.5 text-[var(--c-text)]"
      >
        <div className="mx-auto flex max-w-4xl items-center gap-2.5">
          <Icon name="clock" className="h-5 w-5 shrink-0 text-[var(--c-text)]" />
          <div className="text-base font-bold leading-snug">
            <p>{getStaleBannerCopy(freshness.dataReferencia)}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Datas das fontes oficiais"
      className="border-b border-[var(--c-border-subtle)] bg-[var(--c-attn-tint)] px-3 text-[var(--c-text)]"
    >
      <div className="mx-auto flex max-w-4xl flex-nowrap items-center justify-between gap-x-2 text-xs sm:text-sm font-medium">
        <div className="flex min-h-[44px] min-w-0 items-center gap-1.5 overflow-hidden">
          <Icon name="clock" className="h-4 w-4 shrink-0 text-[var(--c-attn-ink)]" />
          <span className="truncate font-bold text-[var(--c-text)]">
            {meta.data_ultima_conferencia
              ? `Dados conferidos em ${formatIsoDatePTBR(meta.data_ultima_conferencia)}`
              : `Dados de ${formatIsoDatePTBR(meta.data_remume)}`}
          </span>
        </div>

        <details className="group shrink-0">
          <summary className="inline-flex h-[44px] cursor-pointer items-center gap-1 whitespace-nowrap font-bold text-[var(--c-brand)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-brand)]">
            <span>Ver detalhes</span>
            <Icon name="chev" className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <div className="pb-3 pt-1 text-xs leading-relaxed text-[var(--c-text-2)] sm:text-sm">
            <p>
              <strong className="text-[var(--c-text)]">Fontes oficiais verificadas:</strong>{' '}
              REMUME Cuiabá ({formatIsoDatePTBR(meta.data_remume)}) • Farmácia Popular (
              {formatIsoDatePTBR(meta.data_elenco_pfpb)}) • Credenciadas InfoMS (
              {formatIsoDatePTBR(meta.data_infoms)})
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
