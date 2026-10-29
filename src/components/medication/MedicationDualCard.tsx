'use client';

import React, { useState } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { MedicationQuickSummary } from '@/components/medication/MedicationQuickSummary';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import {
  AlertTriangleIcon,
  BuildingSusIcon,
  CheckCircleIcon,
  DocumentCheckIcon,
  PharmacyCrossIcon,
  RadioDotIcon,
  XCircleIcon,
} from '@/components/ui/Icons';
import {
  formatIsoDatePTBR,
  getVia1Copy,
  getVia2Copy,
} from '@/lib/healthCopy';
import { resolveMatchState } from '@/lib/matchState';
import type { Estabelecimento, Medicamento, MetaDados } from '@/types/schema';

export interface MedicationDualCardProps {
  medicamento: Medicamento;
  meta: MetaDados;
  selectedApresentacaoId?: string;
  onSelectApresentacao?: (idApresentacao: string) => void;
  controlledUnits?: readonly Estabelecimento[];
  actionSlot?: React.ReactNode;
}

export function MedicationDualCard({
  medicamento,
  meta,
  selectedApresentacaoId,
  onSelectApresentacao,
  controlledUnits = [],
  actionSlot,
}: MedicationDualCardProps) {
  const { effectiveReduceMotion } = useAccessibility();
  const { results, isHydrated } = useSearchSession();

  const matchState = isHydrated
    ? resolveMatchState(results, medicamento.slug)
    : 'desconhecido';

  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    medicamento.apresentacoes[0]?.id_apresentacao ?? '',
  );

  const activeId = selectedApresentacaoId || internalSelectedId;
  const apresentacaoAtiva =
    medicamento.apresentacoes.find((a) => a.id_apresentacao === activeId) ??
    medicamento.apresentacoes[0];

  if (!apresentacaoAtiva) {
    return null;
  }

  const hasMultipleDosages = medicamento.apresentacoes.length > 1;

  const handleSelectDosage = (id: string) => {
    setInternalSelectedId(id);
    onSelectApresentacao?.(id);
  };

  const via1 = getVia1Copy(apresentacaoAtiva);
  const via2 = getVia2Copy(apresentacaoAtiva);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={effectiveReduceMotion ? 'always' : 'user'}>
        <article
          aria-labelledby={`med-title-${medicamento.slug}`}
          className="space-y-6 text-[var(--c-text)]"
        >
          {/* Cabeçalho do Medicamento: Selo Exato/Assunto/Aproximado + Princípio Ativo + Seletor de Dosagem */}
          <header className="ui-card-elevated relative overflow-hidden p-5 sm:p-7">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--c-brand)] to-[var(--c-free)]"
            />

            {matchState !== 'desconhecido' && (
              <div className="mb-3.5 flex flex-wrap items-center gap-2">
                {matchState === 'exato' ? (
                  <span className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--r-chip)] border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] px-3.5 py-1 text-base font-bold text-[var(--c-brand)]">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Resultado exato</span>
                  </span>
                ) : matchState === 'assunto' ? (
                  <span
                    role="status"
                    className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--r-chip)] border border-[var(--c-brand)]/25 bg-[var(--c-bg)] px-3.5 py-1 text-base font-bold text-[var(--c-text)]"
                  >
                    <AlertTriangleIcon className="h-4 w-4 text-[var(--c-brand)]" />
                    <span>
                      Encontrado por assunto — confira na sua receita o princípio ativo e a dosagem
                    </span>
                  </span>
                ) : (
                  <span
                    role="status"
                    className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--r-chip)] border border-[var(--c-attn-border)] bg-[var(--c-attn)] px-3.5 py-1 text-base font-bold text-[var(--c-text)]"
                  >
                    <AlertTriangleIcon className="h-4 w-4" />
                    <span>
                      Resultado aproximado — confira princípio ativo e dosagem com sua receita
                    </span>
                  </span>
                )}
              </div>
            )}

            <h2
              id={`med-title-${medicamento.slug}`}
              className="break-words font-display text-2xl font-extrabold leading-tight text-[var(--c-text)] sm:text-4xl"
            >
              {medicamento.principio_ativo}
            </h2>

            <p className="mt-1.5 text-base font-bold text-[var(--c-brand)]">
              Princípio ativo • Dosagem selecionada: {apresentacaoAtiva.descricao_dosagem}
            </p>

            {medicamento.nomes_comerciais.length > 0 && (
              <p className="mt-1.5 text-base text-[var(--c-text-2)]">
                <strong>Nomes comerciais conhecidos:</strong>{' '}
                {medicamento.nomes_comerciais.join(', ')}
              </p>
            )}

            {/* Seletor de dosagem (id_apresentacao) com destaque visual quando houver 2+ apresentações */}
            <div
              className={`mt-5 rounded-[var(--r-plate)] border p-4 ${
                hasMultipleDosages
                  ? 'border-[var(--c-attn-border)] bg-[var(--c-attn-tint)]'
                  : 'border-[var(--c-border-subtle)] bg-[var(--c-bg)]'
              }`}
            >
              <p
                id={`dosage-label-${medicamento.slug}`}
                className="font-display text-lg font-bold text-[var(--c-text)]"
              >
                {hasMultipleDosages
                  ? 'Escolha abaixo a dosagem igual à da sua receita:'
                  : 'Apresentação e dosagem cadastrada:'}
              </p>
              <div
                role="group"
                aria-labelledby={`dosage-label-${medicamento.slug}`}
                className="mt-2.5 flex flex-wrap gap-2.5"
              >
                {medicamento.apresentacoes.map((ap) => {
                  const selected = ap.id_apresentacao === apresentacaoAtiva.id_apresentacao;
                  return (
                    <button
                      key={ap.id_apresentacao}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleSelectDosage(ap.id_apresentacao)}
                      className={`relative z-10 inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border px-4 py-2 text-base font-bold transition-colors active:translate-y-px ${
                        selected
                          ? 'border-[var(--c-brand)] text-white shadow-xs'
                          : 'border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)]'
                      }`}
                    >
                      {selected && (
                        <m.span
                          layoutId={`dosage-pill-${medicamento.slug}`}
                          aria-hidden="true"
                          transition={{
                            duration: effectiveReduceMotion ? 0 : 0.2,
                            ease: 'easeOut',
                          }}
                          className="absolute inset-0 -z-10 rounded-[var(--r-chip)] bg-[var(--c-brand)]"
                        />
                      )}
                      <RadioDotIcon checked={selected} className="h-4 w-4" />
                      <span>{ap.descricao_dosagem}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {actionSlot && <div className="mt-4">{actionSlot}</div>}
          </header>

          {/* Resumo Rápido de 3 Segundos */}
          <MedicationQuickSummary
            via1={via1}
            via2={via2}
            dataRemume={meta.data_remume}
            dataElenco={meta.data_elenco_pfpb}
            dosagemSelecionada={apresentacaoAtiva.descricao_dosagem}
          />

          {/* Card Duplo (Placas de Sinalização SUS Cuiabá e Farmácia Popular) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* PLACA 1 — NOS POSTOS, POLICLÍNICAS E UPAS (SUS CUIABÁ) */}
            <m.section
              id="via1-secao"
              aria-labelledby={`via1-heading-${medicamento.slug}`}
              initial={effectiveReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: effectiveReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
              className="ui-card-elevated flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div
                  className={`flex items-center justify-between gap-3 border-b border-[var(--c-border)] px-5 py-3.5 ${
                    via1.padronizado
                      ? 'bg-[var(--c-brand)] text-white'
                      : 'bg-[var(--c-bg-soft)] text-[var(--c-text)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] font-display text-lg font-extrabold ${
                        via1.padronizado
                          ? 'bg-white text-[var(--c-brand)]'
                          : 'border border-[var(--c-border-strong)] bg-[var(--c-surface)] text-[var(--c-text)]'
                      }`}
                    >
                      1
                    </span>
                    <span className="font-display text-lg font-bold tracking-tight">
                      Nos Postos, Policlínicas e UPAs (SUS Cuiabá)
                    </span>
                  </div>
                  <BuildingSusIcon className="h-5 w-5 opacity-90" />
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div>
                    <h3
                      id={`via1-heading-${medicamento.slug}`}
                      className="flex items-start gap-2 font-display text-2xl font-extrabold leading-snug text-[var(--c-text)]"
                    >
                      {via1.padronizado ? (
                        <CheckCircleIcon className="mt-1 h-6 w-6 shrink-0 text-[var(--c-brand)]" />
                      ) : (
                        <XCircleIcon className="mt-1 h-6 w-6 shrink-0 text-[var(--c-text-2)]" />
                      )}
                      <span>{via1.titulo}</span>
                    </h3>
                    {via1.explicacaoPadronizado && (
                      <p className="mt-2 inline-block rounded-[var(--r-chip)] border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] px-3 py-0.5 text-base font-bold text-[var(--c-brand)]">
                        {via1.explicacaoPadronizado}
                      </p>
                    )}
                  </div>

                  <p className="max-w-[65ch] text-base leading-relaxed text-[var(--c-text)]">
                    {via1.texto}
                  </p>

                  {via1.controlado && via1.textoControlado && (
                    <div
                      role="note"
                      className="rounded-[var(--r-button)] border border-[var(--c-attn-border)] bg-[var(--c-attn)] p-4 text-[var(--c-text)]"
                    >
                      <p className="flex items-start gap-2 font-bold">
                        <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>{via1.textoControlado}</span>
                      </p>
                      {controlledUnits.length > 0 && (
                        <ul className="mt-2.5 list-disc space-y-1 pl-6 text-base">
                          {controlledUnits.map((u) => (
                            <li key={u.id}>
                              <strong>{u.nome_fantasia}</strong> ({u.bairro}) —{' '}
                              {u.endereco_completo}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {via1.notaEspecificaCuiaba && (
                    <p className="rounded-[var(--r-button)] border-l-4 border-[var(--c-brand)] bg-[var(--c-bg)] p-3.5 text-base text-[var(--c-text)]">
                      <strong>Observação municipal:</strong> {via1.notaEspecificaCuiaba}
                    </p>
                  )}

                  {via1.documentosParaLevar.length > 0 && (
                    <div className="rounded-[var(--r-button)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
                      <h4 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--c-text)]">
                        <DocumentCheckIcon className="h-5 w-5 text-[var(--c-brand)]" />
                        <span>O que levar na unidade de saúde:</span>
                      </h4>
                      <ol className="mt-2.5 list-decimal space-y-1.5 pl-5 text-base text-[var(--c-text)]">
                        {via1.documentosParaLevar.map((docItem, idx) => (
                          <li key={idx} className="leading-snug">
                            {docItem}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <footer className="border-t border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)]/70 px-5 py-3 text-base text-[var(--c-text-2)]">
                Fonte: REMUME Cuiabá • Atualização verificada em{' '}
                {formatIsoDatePTBR(meta.data_remume)}
              </footer>
            </m.section>

            {/* PLACA 2 — NAS DROGARIAS CREDENCIADAS (FARMÁCIA POPULAR) */}
            <m.section
              id="via2-secao"
              aria-labelledby={`via2-heading-${medicamento.slug}`}
              initial={effectiveReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: effectiveReduceMotion ? 0 : 0.22,
                delay: effectiveReduceMotion ? 0 : 0.08,
                ease: 'easeOut',
              }}
              className="ui-card-elevated flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div
                  className={`flex items-center justify-between gap-3 border-b border-[var(--c-border)] px-5 py-3.5 ${
                    via2.gratuito
                      ? 'bg-[var(--c-free)] text-white'
                      : 'bg-[var(--c-bg-soft)] text-[var(--c-text)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] font-display text-lg font-extrabold ${
                        via2.gratuito
                          ? 'bg-white text-[var(--c-free)]'
                          : 'border border-[var(--c-border-strong)] bg-[var(--c-surface)] text-[var(--c-text)]'
                      }`}
                    >
                      2
                    </span>
                    <span className="font-display text-lg font-bold tracking-tight">
                      Nas Drogarias Credenciadas (Farmácia Popular)
                    </span>
                  </div>
                  <PharmacyCrossIcon className="h-5 w-5 opacity-90" />
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div>
                    <h3
                      id={`via2-heading-${medicamento.slug}`}
                      className="flex items-start gap-2 font-display text-2xl font-extrabold leading-snug text-[var(--c-text)]"
                    >
                      {via2.gratuito ? (
                        <CheckCircleIcon className="mt-1 h-6 w-6 shrink-0 text-[var(--c-free)]" />
                      ) : (
                        <XCircleIcon className="mt-1 h-6 w-6 shrink-0 text-[var(--c-text-2)]" />
                      )}
                      <span>{via2.titulo}</span>
                    </h3>
                    {via2.gratuito && (
                      <p className="mt-2 inline-block rounded-[var(--r-chip)] border border-[var(--c-free)]/25 bg-[var(--c-free-tint)] px-3 py-0.5 text-base font-bold text-[var(--c-free)]">
                        100% gratuito nas farmácias credenciadas
                      </p>
                    )}
                  </div>

                  <p className="max-w-[65ch] text-base leading-relaxed text-[var(--c-text)]">
                    {via2.texto}
                  </p>

                  {via2.documentosParaLevar.length > 0 && (
                    <div className="rounded-[var(--r-button)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4">
                      <h4 className="flex items-center gap-2 font-display text-lg font-bold text-[var(--c-text)]">
                        <DocumentCheckIcon className="h-5 w-5 text-[var(--c-free)]" />
                        <span>O que levar na farmácia credenciada:</span>
                      </h4>
                      <ol className="mt-2.5 list-decimal space-y-1.5 pl-5 text-base text-[var(--c-text)]">
                        {via2.documentosParaLevar.map((docItem, idx) => (
                          <li key={idx} className="leading-snug">
                            {docItem}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <footer className="border-t border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)]/70 px-5 py-3 text-base text-[var(--c-text-2)]">
                Fonte: Elenco Farmácia Popular (MS) • Atualização verificada em{' '}
                {formatIsoDatePTBR(meta.data_elenco_pfpb)}
              </footer>
            </m.section>
          </div>
        </article>
      </MotionConfig>
    </LazyMotion>
  );
}
