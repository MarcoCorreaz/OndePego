'use client';

import React, { useState } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import {
  formatIsoDatePTBR,
  getVia1Copy,
  getVia2Copy,
} from '@/lib/healthCopy';
import type { Estabelecimento, Medicamento, MetaDados } from '@/types/schema';

export interface MedicationDualCardProps {
  medicamento: Medicamento;
  meta: MetaDados;
  exato: boolean;
  selectedApresentacaoId?: string;
  onSelectApresentacao?: (idApresentacao: string) => void;
  controlledUnits?: readonly Estabelecimento[];
}

export function MedicationDualCard({
  medicamento,
  meta,
  exato,
  selectedApresentacaoId,
  onSelectApresentacao,
  controlledUnits = [],
}: MedicationDualCardProps) {
  const { effectiveReduceMotion } = useAccessibility();

  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    medicamento.apresentacoes[0]?.id_apresentacao ?? '',
  );

  const activeId = selectedApresentacaoId ?? internalSelectedId;
  const apresentacaoAtiva =
    medicamento.apresentacoes.find((a) => a.id_apresentacao === activeId) ??
    medicamento.apresentacoes[0];

  if (!apresentacaoAtiva) {
    return null;
  }

  const handleSelectDosage = (id: string) => {
    setInternalSelectedId(id);
    onSelectApresentacao?.(id);
  };

  const via1 = getVia1Copy(apresentacaoAtiva);
  const via2 = getVia2Copy(apresentacaoAtiva);

  return (
    <article
      aria-labelledby={`med-title-${medicamento.slug}`}
      className="space-y-6 text-[var(--c-text)]"
    >
      {/* Cabeçalho do Medicamento: Selo Exato/Aproximado + Princípio Ativo + Dosagem */}
      <header className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {exato ? (
            <span className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--r-chip)] border-2 border-[var(--c-brand)] bg-[var(--c-brand-tint)] px-3 py-1 text-base font-bold text-[var(--c-brand)]">
              <span aria-hidden="true">✓</span>
              <span>Resultado exato</span>
            </span>
          ) : (
            <span
              role="status"
              className="inline-flex min-h-[36px] items-center gap-2 rounded-[var(--r-chip)] border-2 border-[var(--c-border)] bg-[var(--c-attn)] px-3 py-1 text-base font-bold text-[var(--c-text)]"
            >
              <span aria-hidden="true">⚠</span>
              <span>Resultado aproximado — confira princípio ativo e dosagem com sua receita</span>
            </span>
          )}
        </div>

        <h2
          id={`med-title-${medicamento.slug}`}
          className="font-display text-3xl font-extrabold leading-tight text-[var(--c-text)] sm:text-4xl"
        >
          {medicamento.principio_ativo}
        </h2>

        <p className="mt-1 text-base font-bold text-[var(--c-text-2)]">
          Princípio ativo • Dosagem selecionada: {apresentacaoAtiva.descricao_dosagem}
        </p>

        {medicamento.nomes_comerciais.length > 0 && (
          <p className="mt-2 text-base text-[var(--c-text-2)]">
            <strong>Nomes comerciais conhecidos:</strong> {medicamento.nomes_comerciais.join(', ')}
          </p>
        )}

        {/* Seletor de dosagem (id_apresentacao) — alvos de toque >= 48px */}
        <div className="mt-4 border-t-2 border-[var(--c-border-subtle)] pt-4">
          <p
            id={`dosage-label-${medicamento.slug}`}
            className="font-display text-lg font-bold text-[var(--c-text)]"
          >
            Escolha a apresentação e dosagem na sua receita:
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
                  className={`inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border-2 px-4 py-2 text-base font-bold transition-colors active:translate-y-px ${
                    selected
                      ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white'
                      : 'border-[var(--c-border)] bg-[var(--c-bg-soft)] text-[var(--c-text)] hover:bg-[var(--c-brand-tint)]'
                  }`}
                >
                  <span aria-hidden="true">{selected ? '●' : '○'}</span>
                  <span>{ap.descricao_dosagem}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Card Duplo (Placas de Sinalização Via 1 e Via 2) — único momento orquestrado */}
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion={effectiveReduceMotion ? 'always' : 'user'}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* PLACA VIA 1 — SUS CUIABÁ (REMUME) */}
        <m.section
          aria-labelledby={`via1-heading-${medicamento.slug}`}
          initial={effectiveReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: effectiveReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
          className="flex flex-col justify-between overflow-hidden rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)]"
        >
          <div>
            {/* Faixa Superior de Placa Via 1 */}
            <div
              className={`flex items-center justify-between gap-3 border-b-2 border-[var(--c-border)] px-4 py-3 ${
                via1.padronizado
                  ? 'bg-[var(--c-brand)] text-white'
                  : 'bg-[var(--c-bg-soft)] text-[var(--c-text)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 font-display text-lg font-extrabold ${
                    via1.padronizado
                      ? 'border-white bg-white text-[var(--c-brand)]'
                      : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)]'
                  }`}
                >
                  1
                </span>
                <span className="font-display text-lg font-bold">
                  Via 1 — Posto de saúde (SUS Cuiabá)
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <h3
                  id={`via1-heading-${medicamento.slug}`}
                  className="font-display text-2xl font-extrabold leading-snug text-[var(--c-text)]"
                >
                  {via1.padronizado ? '✓ ' : '✕ '}
                  {via1.titulo}
                </h3>
                {via1.explicacaoPadronizado && (
                  <p className="mt-1 inline-block rounded bg-[var(--c-brand-tint)] px-2.5 py-0.5 text-base font-bold text-[var(--c-brand)]">
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
                  className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-attn)] p-3.5 text-[var(--c-text)]"
                >
                  <p className="font-bold">
                    <span aria-hidden="true">⚠ </span>
                    {via1.textoControlado}
                  </p>
                  {controlledUnits.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-base">
                      {controlledUnits.map((u) => (
                        <li key={u.id}>
                          <strong>{u.nome_fantasia}</strong> ({u.bairro}) — {u.endereco_completo}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {via1.notaEspecificaCuiaba && (
                <p className="rounded border-l-4 border-[var(--c-brand)] bg-[var(--c-bg-soft)] p-3 text-base text-[var(--c-text)]">
                  <strong>Observação municipal:</strong> {via1.notaEspecificaCuiaba}
                </p>
              )}

              {via1.documentosParaLevar.length > 0 && (
                <div className="rounded-[var(--r-plate)] border-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] p-3.5">
                  <h4 className="font-display text-lg font-bold text-[var(--c-text)]">
                    O que levar na unidade de saúde:
                  </h4>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-base text-[var(--c-text)]">
                    {via1.documentosParaLevar.map((docItem, idx) => (
                      <li key={idx}>{docItem}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>

          <footer className="border-t-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] px-4 py-2.5 text-base text-[var(--c-text-2)]">
            Fonte: REMUME Cuiabá • Atualização verificada em {formatIsoDatePTBR(meta.data_remume)}
          </footer>
        </m.section>

        {/* PLACA VIA 2 — PROGRAMA FARMÁCIA POPULAR */}
        <m.section
          aria-labelledby={`via2-heading-${medicamento.slug}`}
          initial={effectiveReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: effectiveReduceMotion ? 0 : 0.22,
            delay: effectiveReduceMotion ? 0 : 0.08,
            ease: 'easeOut',
          }}
          className="flex flex-col justify-between overflow-hidden rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)]"
        >
          <div>
            {/* Faixa Superior de Placa Via 2 */}
            <div
              className={`flex items-center justify-between gap-3 border-b-2 border-[var(--c-border)] px-4 py-3 ${
                via2.gratuito
                  ? 'bg-[var(--c-free)] text-white'
                  : 'bg-[var(--c-bg-soft)] text-[var(--c-text)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 font-display text-lg font-extrabold ${
                    via2.gratuito
                      ? 'border-white bg-white text-[var(--c-free)]'
                      : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)]'
                  }`}
                >
                  2
                </span>
                <span className="font-display text-lg font-bold">
                  Via 2 — Farmácia Popular (credenciadas)
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <h3
                  id={`via2-heading-${medicamento.slug}`}
                  className="font-display text-2xl font-extrabold leading-snug text-[var(--c-text)]"
                >
                  {via2.gratuito ? '✓ ' : '✕ '}
                  {via2.titulo}
                </h3>
                {via2.gratuito && (
                  <p className="mt-1 inline-block rounded bg-[var(--c-free-tint)] px-2.5 py-0.5 text-base font-bold text-[var(--c-free)]">
                    100% gratuito nas farmácias credenciadas
                  </p>
                )}
              </div>

              <p className="max-w-[65ch] text-base leading-relaxed text-[var(--c-text)]">
                {via2.texto}
              </p>

              {via2.documentosParaLevar.length > 0 && (
                <div className="rounded-[var(--r-plate)] border-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] p-3.5">
                  <h4 className="font-display text-lg font-bold text-[var(--c-text)]">
                    O que levar na farmácia credenciada:
                  </h4>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-base text-[var(--c-text)]">
                    {via2.documentosParaLevar.map((docItem, idx) => (
                      <li key={idx}>{docItem}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>

          <footer className="border-t-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] px-4 py-2.5 text-base text-[var(--c-text-2)]">
            Fonte: Elenco Farmácia Popular (MS) • Atualização verificada em{' '}
            {formatIsoDatePTBR(meta.data_elenco_pfpb)}
          </footer>
        </m.section>
          </div>
        </MotionConfig>
      </LazyMotion>
    </article>
  );
}
