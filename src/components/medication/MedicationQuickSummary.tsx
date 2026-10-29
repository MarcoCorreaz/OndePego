import React from 'react';
import {
  BuildingSusIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  MapPinIcon,
  PharmacyCrossIcon,
  XCircleIcon,
} from '@/components/ui/Icons';
import {
  type Via1ResolvedCopy,
  type Via2ResolvedCopy,
  formatIsoDatePTBR,
} from '@/lib/healthCopy';

export interface MedicationQuickSummaryProps {
  via1: Via1ResolvedCopy;
  via2: Via2ResolvedCopy;
  dataRemume: string;
  dataElenco: string;
  dosagemSelecionada: string;
}

const LINK_CLASS =
  'inline-flex min-h-[48px] items-center rounded-[var(--r-button)] px-1 text-base font-bold text-[var(--c-brand)] underline underline-offset-2';

/**
 * Bloco de Resumo Rápido de 3 Segundos exibido logo abaixo do seletor de dosagem.
 * Mostra lado a lado os títulos oficiais curtos das duas vias e botões âncora diretos
 * para "O que levar ↓" e "Ver unidades no mapa ↓".
 */
export function MedicationQuickSummary({
  via1,
  via2,
  dataRemume,
  dataElenco,
  dosagemSelecionada,
}: MedicationQuickSummaryProps) {
  const hasDocuments =
    via1.documentosParaLevar.length > 0 || via2.documentosParaLevar.length > 0;
  const primaryDocTarget = via1.documentosParaLevar.length > 0 ? '#via1-secao' : '#via2-secao';

  return (
    <section
      aria-labelledby="resumo-rapido-heading"
      className="ui-card-elevated space-y-4 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="resumo-rapido-heading"
          className="font-display text-xl font-extrabold text-[var(--c-text)]"
        >
          Resumo em 3 segundos ({dosagemSelecionada})
        </h3>
        <span className="text-sm text-[var(--c-text-2)]">
          Fontes: {formatIsoDatePTBR(dataRemume)} (SUS) • {formatIsoDatePTBR(dataElenco)} (PFPB)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          className={`rounded-[var(--r-button)] border p-4 ${
            via1.padronizado
              ? 'border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)]'
              : 'border-[var(--c-border)] bg-[var(--c-bg)]'
          }`}
        >
          <p className="flex items-center gap-2 font-display text-base font-bold text-[var(--c-text-2)]">
            <BuildingSusIcon className="h-5 w-5 shrink-0 text-[var(--c-brand)]" />
            <span>
              {via1.padronizado ? 'SUS Cuiabá: Consta na lista' : 'SUS Cuiabá: Não consta'}
            </span>
          </p>
          <p className="mt-1.5 flex items-start gap-2 font-display text-xl font-extrabold leading-snug text-[var(--c-text)]">
            {via1.padronizado ? (
              <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-[var(--c-brand)]" />
            ) : (
              <XCircleIcon className="mt-1 h-5 w-5 shrink-0 text-[var(--c-text-2)]" />
            )}
            <span>{via1.titulo}</span>
          </p>
          {via1.documentosParaLevar.length > 0 && (
            <div className="mt-2">
              <a href="#via1-secao" className={LINK_CLASS}>
                Ver o que levar no posto
              </a>
            </div>
          )}
        </div>

        <div
          className={`rounded-[var(--r-button)] border p-4 ${
            via2.gratuito
              ? 'border-[var(--c-free)]/25 bg-[var(--c-free-tint)]'
              : 'border-[var(--c-border)] bg-[var(--c-bg)]'
          }`}
        >
          <p className="flex items-center gap-2 font-display text-base font-bold text-[var(--c-text-2)]">
            <PharmacyCrossIcon className="h-5 w-5 shrink-0 text-[var(--c-free)]" />
            <span>
              {via2.gratuito
                ? 'Farmácia Popular: Gratuito'
                : 'Farmácia Popular: Não faz parte'}
            </span>
          </p>
          <p className="mt-1.5 flex items-start gap-2 font-display text-xl font-extrabold leading-snug text-[var(--c-text)]">
            {via2.gratuito ? (
              <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-[var(--c-free)]" />
            ) : (
              <XCircleIcon className="mt-1 h-5 w-5 shrink-0 text-[var(--c-text-2)]" />
            )}
            <span>{via2.titulo}</span>
          </p>
          {via2.documentosParaLevar.length > 0 && (
            <div className="mt-2">
              <a href="#via2-secao" className={LINK_CLASS}>
                Ver o que levar na farmácia
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        {hasDocuments && (
          <a
            href={primaryDocTarget}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2 font-display text-base font-bold text-[var(--c-text)] transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)]"
          >
            <DocumentCheckIcon className="h-4 w-4 text-[var(--c-brand)]" />
            <span>O que levar ↓</span>
          </a>
        )}

        <a
          href="#credenciadas-heading"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-brand)] bg-[var(--c-brand)] px-4 py-2 font-display text-base font-bold text-white shadow-xs transition-opacity hover:opacity-95"
        >
          <MapPinIcon className="h-4 w-4" />
          <span>Ver unidades no mapa ↓</span>
        </a>
      </div>
    </section>
  );
}
