'use client';

import React, { useState } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { Icon } from '@/components/ui/Icon';
import { RadioDotIcon } from '@/components/ui/Icons';
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
          className="space-y-4 text-[var(--c-text)]"
        >
          {/* Topo do Detalhe: Selo + Princípio Ativo (Barlow 800) + Subtítulo Dosagem */}
          <header className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs sm:p-6">
            {matchState !== 'desconhecido' && (
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                {matchState === 'exato' ? (
                  <span className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-free)]/20 bg-[var(--c-free-tint)] px-3 py-0.5 text-sm sm:text-base font-bold text-[var(--c-free-ink)]">
                    <Icon name="check" className="h-4 w-4" />
                    <span>Resultado exato</span>
                  </span>
                ) : matchState === 'assunto' ? (
                  <span
                    role="status"
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] px-3 py-0.5 text-sm sm:text-base font-bold text-[var(--c-attn-ink)]"
                  >
                    <Icon name="info" className="h-4 w-4" />
                    <span>
                      Encontrado por assunto — confira na sua receita o princípio ativo e a dosagem
                    </span>
                  </span>
                ) : (
                  <span
                    role="status"
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] px-3 py-0.5 text-sm sm:text-base font-bold text-[var(--c-attn-ink)]"
                  >
                    <Icon name="info" className="h-4 w-4" />
                    <span>
                      Resultado aproximado — confira princípio ativo e dosagem com sua receita
                    </span>
                  </span>
                )}
              </div>
            )}

            <h1
              id={`med-title-${medicamento.slug}`}
              className="break-words font-display text-3xl font-black leading-tight text-[var(--c-text)] sm:text-4xl lg:text-[42px]"
            >
              {medicamento.principio_ativo}
            </h1>

            <p className="mt-1 font-sans text-base sm:text-lg font-bold text-[var(--c-brand)]">
              Dosagem: {apresentacaoAtiva.descricao_dosagem}
            </p>

            {medicamento.nomes_comerciais.length > 0 && (
              <p className="mt-1 text-sm text-[var(--c-text-2)]">
                <strong>Nomes comerciais conhecidos:</strong>{' '}
                {medicamento.nomes_comerciais.join(', ')}
              </p>
            )}

            {/* Seletor de dosagem quando houver 2+ apresentações */}
            {hasMultipleDosages && (
              <div className="mt-4 rounded-[var(--r-plate)] border border-[var(--c-attn-border)]/50 bg-[var(--c-attn-tint)] p-3">
                <p
                  id={`dosage-label-${medicamento.slug}`}
                  className="font-display text-base font-bold text-[var(--c-text)]"
                >
                  Escolha a dosagem igual à da sua receita:
                </p>
                <div
                  role="group"
                  aria-labelledby={`dosage-label-${medicamento.slug}`}
                  className="mt-2 flex flex-wrap gap-2"
                >
                  {medicamento.apresentacoes.map((ap) => {
                    const selected = ap.id_apresentacao === apresentacaoAtiva.id_apresentacao;
                    return (
                      <button
                        key={ap.id_apresentacao}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => handleSelectDosage(ap.id_apresentacao)}
                        className={`relative z-10 inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border px-3.5 py-1.5 text-base font-bold transition-all active:scale-[0.98] ${
                          selected
                            ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white shadow-xs'
                            : 'border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)]'
                        }`}
                      >
                        <RadioDotIcon checked={selected} className="h-4 w-4" />
                        <span>{ap.descricao_dosagem}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {actionSlot && <div className="mt-3">{actionSlot}</div>}
          </header>

          {/* Duas Placas de Sinalização (Via 1 SUS Cuiabá e Via 2 Farmácia Popular) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* PLACA 1 — Posto de saúde (SUS Cuiabá) */}
            <m.section
              id="via1-secao"
              aria-labelledby={`via1-heading-${medicamento.slug}`}
              initial={effectiveReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: effectiveReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
              className="flex flex-col justify-between overflow-hidden rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xs"
            >
              <div>
                {/* Cabeçalho compacto com numeral circular 1 */}
                <div
                  className={`flex h-12 items-center justify-between border-b border-[var(--c-border)] px-4 ${
                    via1.padronizado
                      ? 'bg-[var(--c-brand)] text-white'
                      : 'bg-[var(--c-bg-soft)] text-[var(--c-text)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-black ${
                        via1.padronizado
                          ? 'bg-white text-[var(--c-brand)]'
                          : 'border border-[var(--c-border-strong)] bg-[var(--c-surface)] text-[var(--c-text)]'
                      }`}
                    >
                      1
                    </span>
                    <span className="font-display text-base sm:text-lg font-bold tracking-tight">
                      Posto de saúde (SUS Cuiabá)
                    </span>
                  </div>
                  <Icon name="cross" className="h-5 w-5 opacity-90" />
                </div>

                <div className="space-y-3.5 p-4 sm:p-5">
                  {/* Linha de status com ícone check + título normativo */}
                  <h3
                    id={`via1-heading-${medicamento.slug}`}
                    className="flex items-start gap-2 font-display text-xl sm:text-2xl font-black leading-snug text-[var(--c-text)]"
                  >
                    <Icon
                      name={via1.padronizado ? 'check' : 'close'}
                      className={`mt-1 h-5 w-5 shrink-0 ${
                        via1.padronizado ? 'text-[var(--c-brand)]' : 'text-[var(--c-text-2)]'
                      }`}
                    />
                    <span>{via1.titulo}</span>
                  </h3>

                  {/* Texto normativo LITERAL e VISÍVEL a 17px */}
                  <p className="max-w-[65ch] text-[17px] leading-relaxed text-[var(--c-text)]">
                    {via1.texto}
                  </p>

                  {/* Medicamento de controle especial / psicotrópicos */}
                  {via1.controlado && via1.textoControlado && (
                    <div
                      role="note"
                      className="rounded-[var(--r-button)] border border-[var(--c-attn-border)] bg-[var(--c-attn-tint)] p-3.5 text-[var(--c-text)]"
                    >
                      <p className="flex items-start gap-2 font-bold text-base">
                        <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--c-attn-ink)]" />
                        <span>{via1.textoControlado}</span>
                      </p>
                      {controlledUnits.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm sm:text-base">
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
                    <p className="rounded-[var(--r-button)] border-l-4 border-[var(--c-brand)] bg-[var(--c-bg)] p-3 text-sm sm:text-base text-[var(--c-text)]">
                      <strong>Observação municipal:</strong> {via1.notaEspecificaCuiaba}
                    </p>
                  )}

                  {/* Caixa "O que levar" */}
                  {via1.documentosParaLevar.length > 0 && (
                    <div className="rounded-[var(--r-card)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-3.5 space-y-2">
                      <h4 className="flex items-center gap-2 font-display text-base font-bold text-[var(--c-text)]">
                        <Icon name="doc" className="h-4 w-4 text-[var(--c-brand)]" />
                        <span>O que levar na unidade de saúde:</span>
                      </h4>
                      <ol className="list-decimal space-y-1 pl-5 text-sm sm:text-base text-[var(--c-text)]">
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

              {/* Linha de fonte com ícone doc */}
              <footer className="flex items-center gap-2 border-t border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)]/60 px-4 py-2.5 text-sm text-[var(--c-text-2)]">
                <Icon name="doc" className="h-4 w-4 shrink-0 text-[var(--c-text-2)]" />
                <span>
                  Fonte: REMUME Cuiabá • Atualização verificada em{' '}
                  {formatIsoDatePTBR(meta.data_remume)}
                </span>
              </footer>
            </m.section>

            {/* PLACA 2 — Farmácia Popular (credenciadas) */}
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
              className="flex flex-col justify-between overflow-hidden rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xs"
            >
              <div>
                {/* Cabeçalho compacto com numeral circular 2 */}
                <div
                  className={`flex h-12 items-center justify-between border-b border-[var(--c-border)] px-4 ${
                    via2.gratuito
                      ? 'bg-[var(--c-free)] text-white'
                      : 'bg-[var(--c-bg-soft)] text-[var(--c-text)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-black ${
                        via2.gratuito
                          ? 'bg-white text-[var(--c-free)]'
                          : 'border border-[var(--c-border-strong)] bg-[var(--c-surface)] text-[var(--c-text)]'
                      }`}
                    >
                      2
                    </span>
                    <span className="font-display text-base sm:text-lg font-bold tracking-tight">
                      Farmácia Popular (credenciadas)
                    </span>
                  </div>
                  <Icon name="cross" className="h-5 w-5 opacity-90" />
                </div>

                <div className="space-y-3.5 p-4 sm:p-5">
                  {/* Linha de status com ícone check + título normativo */}
                  <h3
                    id={`via2-heading-${medicamento.slug}`}
                    className="flex items-start gap-2 font-display text-xl sm:text-2xl font-black leading-snug text-[var(--c-text)]"
                  >
                    <Icon
                      name={via2.gratuito ? 'check' : 'close'}
                      className={`mt-1 h-5 w-5 shrink-0 ${
                        via2.gratuito ? 'text-[var(--c-free)]' : 'text-[var(--c-text-2)]'
                      }`}
                    />
                    <span>{via2.titulo}</span>
                  </h3>

                  {/* Texto normativo LITERAL e VISÍVEL a 17px */}
                  <p className="max-w-[65ch] text-[17px] leading-relaxed text-[var(--c-text)]">
                    {via2.texto}
                  </p>

                  {/* Caixa "O que levar" */}
                  {via2.documentosParaLevar.length > 0 && (
                    <div className="rounded-[var(--r-card)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-3.5 space-y-2">
                      <h4 className="flex items-center gap-2 font-display text-base font-bold text-[var(--c-text)]">
                        <Icon name="doc" className="h-4 w-4 text-[var(--c-free)]" />
                        <span>O que levar na farmácia credenciada:</span>
                      </h4>
                      <ol className="list-decimal space-y-1 pl-5 text-sm sm:text-base text-[var(--c-text)]">
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

              {/* Linha de fonte com ícone doc */}
              <footer className="flex items-center gap-2 border-t border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)]/60 px-4 py-2.5 text-sm text-[var(--c-text-2)]">
                <Icon name="doc" className="h-4 w-4 shrink-0 text-[var(--c-text-2)]" />
                <span>
                  Fonte: Elenco Farmácia Popular (MS) • Atualização verificada em{' '}
                  {formatIsoDatePTBR(meta.data_elenco_pfpb)}
                </span>
              </footer>
            </m.section>
          </div>
        </article>
      </MotionConfig>
    </LazyMotion>
  );
}
