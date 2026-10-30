'use client';

import React, { useId, useMemo } from 'react';
import Link from 'next/link';
import { usePrescription } from '@/components/prescription/PrescriptionProvider';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import { Icon } from '@/components/ui/Icon';
import { buildPrescriptionSummary } from '@/lib/prescriptionList';
import type { Medicamento, MetaDados } from '@/types/schema';
import medicamentosJson from '../../../data/medicamentos.json';
import metaJson from '../../../data/meta.json';

const catalogo = medicamentosJson as Medicamento[];
const meta = metaJson as MetaDados;

export default function MinhaReceitaPage() {
  const { items, checkedDocs, toggleDoc, removeItem, clearAll, isHydrated } = usePrescription();
  const summary = useMemo(
    () => buildPrescriptionSummary({ entries: items, catalogo, meta }),
    [items],
  );

  return (
    <>
      <FreshnessBanner meta={meta} />
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        <nav aria-label="Navegação da receita">
          <Link
            href="/"
            className="ui-pressable inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 font-display text-lg font-bold text-[var(--c-text)] shadow-2xs hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)] active:scale-[0.98]"
          >
            <Icon name="back" className="h-5 w-5" />
            <span>Fazer uma busca no início</span>
          </Link>
        </nav>

        <header className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-black text-[var(--c-text)] sm:text-4xl">
              Minha Receita ({isHydrated ? items.length : 0} item/itens)
            </h1>
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="ui-pressable inline-flex min-h-[48px] items-center gap-1.5 rounded-[var(--r-button)] border border-[var(--c-alert)]/30 bg-[var(--c-alert-tint)] px-3.5 py-2 font-display text-base font-bold text-[var(--c-alert)] hover:bg-[var(--c-alert)] hover:text-white active:scale-[0.98]"
              >
                <Icon name="close" className="h-4 w-4" />
                <span>Limpar receita</span>
              </button>
            )}
          </div>
          <p className="max-w-[65ch] text-base text-[var(--c-text-2)]">
            Consolide todos os remédios da sua receita para ver onde retirar cada um, conferir a lista
            única de documentos e enviar o resumo pronto no WhatsApp da família.
          </p>
        </header>

        {!isHydrated || items.length === 0 ? (
          <section className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-6 text-center shadow-2xs sm:p-8">
            <Icon name="doc" className="mx-auto h-12 w-12 text-[var(--c-text-2)] opacity-70" />
            <h2 className="mt-3 font-display text-2xl font-black text-[var(--c-text)]">
              Sua receita está vazia
            </h2>
            <p className="mx-auto mt-2 max-w-[50ch] text-base text-[var(--c-text-2)]">
              Pesquise os remédios da sua receita e toque no botão &ldquo;＋ Adicionar à Minha
              Receita&rdquo; na página de cada um.
            </p>
            <div className="mt-5">
              <Link
                href="/buscar/"
                className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-6 py-2.5 font-display text-lg font-bold text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
              >
                <Icon name="search" className="h-5 w-5" />
                <span>Buscar remédios agora</span>
              </Link>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            {/* Bloco 1 — Gratuitos nas Drogarias (Farmácia Popular) */}
            <section
              aria-labelledby="bloco-fp-heading"
              className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--c-border-subtle)] pb-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--c-free-tint)] text-[var(--c-free-ink)]">
                  <Icon name="cross" className="h-5 w-5" />
                </span>
                <h2
                  id="bloco-fp-heading"
                  className="font-display text-2xl font-black text-[var(--c-text)]"
                >
                  1. Gratuitos nas Drogarias (Farmácia Popular) ({summary.gratuitosFarmaciaPopular.length})
                </h2>
              </div>

              {summary.gratuitosFarmaciaPopular.length === 0 ? (
                <p className="text-base text-[var(--c-text-2)]">
                  Nenhum dos remédios adicionados faz parte do elenco gratuito do Farmácia Popular.
                </p>
              ) : (
                <ul className="space-y-3">
                  {summary.gratuitosFarmaciaPopular.map((item) => (
                    <li
                      key={`fp-${item.slug}-${item.id_apresentacao}`}
                      className="flex flex-wrap items-center justify-between gap-2.5 rounded-[var(--r-button)] border border-[var(--c-free)]/25 bg-[var(--c-free-tint)]/60 p-3.5"
                    >
                      <div>
                        <Link
                          href={`/medicamento/${item.slug}/`}
                          className="font-display text-xl font-black text-[var(--c-text)] underline hover:text-[var(--c-brand)]"
                        >
                          {item.principio_ativo}
                        </Link>
                        <p className="text-base font-bold text-[var(--c-free-ink)]">
                          Dosagem: {item.descricao_dosagem}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeItem({ slug: item.slug, id_apresentacao: item.id_apresentacao })
                        }
                        aria-label={`Remover ${item.principio_ativo} da receita`}
                        className="ui-pressable inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] text-[var(--c-text-2)] hover:bg-[var(--c-surface)] hover:text-[var(--c-alert)] active:scale-[0.98]"
                      >
                        <Icon name="close" className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Bloco 2 — Padronizados na Rede Municipal (SUS Cuiabá) */}
            <section
              aria-labelledby="bloco-sus-heading"
              className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--c-border-subtle)] pb-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--c-brand-tint)] text-[var(--c-brand)]">
                  <Icon name="cross" className="h-5 w-5" />
                </span>
                <h2
                  id="bloco-sus-heading"
                  className="font-display text-2xl font-black text-[var(--c-text)]"
                >
                  2. Padronizados na Rede Municipal (SUS Cuiabá) ({summary.padronizadosSusCuiaba.length})
                </h2>
              </div>

              {summary.padronizadosSusCuiaba.length === 0 ? (
                <p className="text-base text-[var(--c-text-2)]">
                  Nenhum dos remédios adicionados consta na lista básica municipal de Cuiabá (REMUME).
                </p>
              ) : (
                <ul className="space-y-3">
                  {summary.padronizadosSusCuiaba.map((item) => (
                    <li
                      key={`sus-${item.slug}-${item.id_apresentacao}`}
                      className="flex flex-wrap items-center justify-between gap-2.5 rounded-[var(--r-button)] border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)]/60 p-3.5"
                    >
                      <div>
                        <Link
                          href={`/medicamento/${item.slug}/`}
                          className="font-display text-xl font-black text-[var(--c-text)] underline hover:text-[var(--c-brand)]"
                        >
                          {item.principio_ativo}
                        </Link>
                        <p className="text-base font-bold text-[var(--c-brand)]">
                          Dosagem: {item.descricao_dosagem}
                        </p>
                        <p className="text-sm text-[var(--c-text-2)]">Local: {item.localSusLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeItem({ slug: item.slug, id_apresentacao: item.id_apresentacao })
                        }
                        aria-label={`Remover ${item.principio_ativo} da receita`}
                        className="ui-pressable inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] text-[var(--c-text-2)] hover:bg-[var(--c-surface)] hover:text-[var(--c-alert)] active:scale-[0.98]"
                      >
                        <Icon name="close" className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Bloco 3 — Não constam nas listas gratuitas consultadas */}
            {summary.naoConstamNasListas.length > 0 && (
              <section
                aria-labelledby="bloco-outros-heading"
                className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6 space-y-4"
              >
                <div className="flex items-center gap-2.5 border-b border-[var(--c-border-subtle)] pb-3">
                  <Icon name="close" className="h-5 w-5 text-[var(--c-text-2)]" />
                  <h2
                    id="bloco-outros-heading"
                    className="font-display text-xl font-black text-[var(--c-text)]"
                  >
                    3. Não constam nas listas gratuitas consultadas ({summary.naoConstamNasListas.length})
                  </h2>
                </div>
                <ul className="space-y-3">
                  {summary.naoConstamNasListas.map((item) => (
                    <li
                      key={`fora-${item.slug}-${item.id_apresentacao}`}
                      className="flex flex-wrap items-center justify-between gap-2.5 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] p-3.5"
                    >
                      <div>
                        <p className="font-display text-xl font-black text-[var(--c-text)]">
                          {item.principio_ativo}
                        </p>
                        <p className="text-base text-[var(--c-text-2)]">
                          Dosagem: {item.descricao_dosagem}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeItem({ slug: item.slug, id_apresentacao: item.id_apresentacao })
                        }
                        aria-label={`Remover ${item.principio_ativo} da receita`}
                        className="ui-pressable inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] text-[var(--c-text-2)] hover:bg-[var(--c-surface)] hover:text-[var(--c-alert)] active:scale-[0.98]"
                      >
                        <Icon name="close" className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Checklist Único Desduplicado ("O que separar antes de sair de casa") */}
            {summary.checklistDocumentos.length > 0 && (() => {
              const totalDocs = summary.checklistDocumentos.length;
              const checkedCount = summary.checklistDocumentos.filter((d) => checkedDocs.includes(d)).length;
              const progressPercent = totalDocs > 0 ? Math.round((checkedCount / totalDocs) * 100) : 0;
              const allChecked = totalDocs > 0 && checkedCount === totalDocs;

              return (
                <section
                  aria-labelledby="checklist-heading"
                  className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--c-border-subtle)] pb-3">
                    <div className="flex items-center gap-2.5">
                      <Icon name="doc" className="h-5 w-5 text-[var(--c-brand)]" />
                      <h2
                        id="checklist-heading"
                        className="font-display text-2xl font-black text-[var(--c-text)]"
                      >
                        O que separar antes de sair (Checklist)
                      </h2>
                    </div>
                    <span className="rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-1 text-sm font-bold text-[var(--c-brand)]">
                      {checkedCount} de {totalDocs} separados ({progressPercent}%)
                    </span>
                  </div>

                  {/* Barra de progresso visual de alta precisão */}
                  <div
                    role="progressbar"
                    aria-valuenow={checkedCount}
                    aria-valuemin={0}
                    aria-valuemax={totalDocs}
                    aria-label="Progresso de documentos separados"
                    className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--c-bg-soft)]"
                  >
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="h-full rounded-full bg-[var(--c-free)] transition-all duration-300 ease-out"
                    />
                  </div>

                  {allChecked && (
                    <div
                      role="status"
                      className="flex items-center gap-2.5 rounded-[var(--r-button)] border border-[var(--c-free)]/30 bg-[var(--c-free-tint)] p-3.5 text-base font-bold text-[var(--c-free-ink)]"
                    >
                      <Icon name="check" className="h-5 w-5 shrink-0" />
                      <span>Tudo pronto na bolsa! Você já separou todos os documentos necessários para a retirada.</span>
                    </div>
                  )}

                  <p className="text-base text-[var(--c-text-2)]">
                    Toque com o dedo para marcar o que você já colocou na bolsa antes de ir:
                  </p>

                  <ul className="space-y-2.5">
                    {summary.checklistDocumentos.map((docText, idx) => {
                      const isChecked = checkedDocs.includes(docText);
                      const checkId = `doc-check-${idx}`;
                      return (
                        <li key={docText}>
                          <label
                            htmlFor={checkId}
                            className={`ui-pressable flex min-h-[52px] cursor-pointer items-center gap-3.5 rounded-[var(--r-button)] border p-3.5 font-bold transition-all ${
                              isChecked
                                ? 'border-[var(--c-free)]/35 bg-[var(--c-free-tint)] text-[var(--c-free-ink)] shadow-2xs'
                                : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
                            }`}
                          >
                            <input
                              id={checkId}
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDoc(docText)}
                              className="h-6 w-6 rounded border-2 border-[var(--c-border-strong)] accent-[var(--c-free)]"
                            />
                            <span className={isChecked ? 'line-through opacity-85' : ''}>{docText}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })()}

            {/* Botão Enviar Resumo no WhatsApp */}
            <section
              aria-label="Compartilhamento da receita"
              className="flex flex-col justify-between gap-4 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:flex-row sm:items-center sm:p-6"
            >
              <div>
                <h2 className="font-display text-xl font-black text-[var(--c-text)]">
                  Enviar resumo da receita para a família
                </h2>
                <p className="text-sm text-[var(--c-text-2)]">
                  Gera uma mensagem pronta no WhatsApp com a lista de remédios, locais e documentos.
                </p>
              </div>
              <a
                href={summary.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-free)] px-6 py-2.5 font-display text-lg font-bold text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
              >
                <Icon name="share" className="h-5 w-5" />
                <span>Enviar no WhatsApp</span>
              </a>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
