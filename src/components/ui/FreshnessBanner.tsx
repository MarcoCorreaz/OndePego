import React from 'react';
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
        className="border-b-2 border-[var(--c-border)] bg-[var(--c-attn)] px-4 py-3 text-[var(--c-text)]"
      >
        <div className="mx-auto flex max-w-4xl items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-[var(--c-border)] bg-[var(--c-bg)] font-display text-lg font-extrabold text-[var(--c-text)]"
          >
            !
          </span>
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
      className="border-b border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] px-4 py-2 text-[var(--c-text)]"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1 text-base">
        <span>
          <strong>Fontes oficiais verificadas:</strong> REMUME Cuiabá (
          {formatIsoDatePTBR(meta.data_remume)}) • Farmácia Popular (
          {formatIsoDatePTBR(meta.data_elenco_pfpb)}) • Credenciadas InfoMS (
          {formatIsoDatePTBR(meta.data_infoms)})
        </span>
      </div>
    </section>
  );
}
