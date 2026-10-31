'use client';

import React, { useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { LazyEstablishmentMap } from '@/components/map/LazyEstablishmentMap';
import { OfflineMapDownload } from '@/components/map/OfflineMapDownload';
import { EstablishmentContactActions } from '@/components/ui/EstablishmentContactActions';
import { Icon } from '@/components/ui/Icon';
import {
  AlertTriangleIcon,
  BuildingSusIcon,
  CheckCircleIcon,
  MapPinIcon,
  NavigationIcon,
  PharmacyCrossIcon,
  RadioDotIcon,
} from '@/components/ui/Icons';
import {
  getEstablishmentTypeBadge,
  getPublicUnitsForMedication,
} from '@/lib/establishmentsFilter';
import {
  type LatLng,
  formatarDistancia,
  gerarUrlRotaGoogleMaps,
  gerarUrlTransportePublicoOpcional,
  hasValidMapCoordinates,
  listarBairrosUnicos,
  ordenarEstabelecimentosPorBairro,
  ordenarListaComOuSemDistancia,
} from '@/lib/geoEngine';
import { NORMATIVE_TEXTS, formatIsoDatePTBR } from '@/lib/healthCopy';
import type { Apresentacao, Estabelecimento, MetaDados } from '@/types/schema';

export interface CredenciadasSectionProps {
  estabelecimentos: readonly Estabelecimento[];
  meta: MetaDados;
  /** Apresentação/dosagem ativa selecionada no card do medicamento */
  apresentacaoAtiva?: Apresentacao;
  /** Slot opcional para injetar o componente de mapa dividido (Tarefa 5) */
  mapSlot?: React.ReactNode;
}

type GpsStatus = 'idle' | 'loading' | 'granted' | 'denied_or_error';
type ActiveChannelTab = 'FARMACIA_POPULAR' | 'UNIDADES_SUS';

export function CredenciadasSection({
  estabelecimentos,
  meta,
  apresentacaoAtiva,
  mapSlot,
}: CredenciadasSectionProps) {
  const selectId = useId();
  const { effectiveReduceMotion } = useAccessibility();
  const [activeTab, setActiveTab] = useState<ActiveChannelTab>('FARMACIA_POPULAR');
  const [bairroSelecionado, setBairroSelecionado] = useState<string>('');
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');

  const tabFarmaciaRef = useRef<HTMLButtonElement | null>(null);
  const tabSusRef = useRef<HTMLButtonElement | null>(null);

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeTab === 'FARMACIA_POPULAR') {
        handleSelectTab('UNIDADES_SUS');
        tabSusRef.current?.focus();
      } else {
        handleSelectTab('FARMACIA_POPULAR');
        tabFarmaciaRef.current?.focus();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeTab === 'UNIDADES_SUS') {
        handleSelectTab('FARMACIA_POPULAR');
        tabFarmaciaRef.current?.focus();
      } else {
        handleSelectTab('UNIDADES_SUS');
        tabSusRef.current?.focus();
      }
    }
  };

  const farmaciasCredenciadas = useMemo(
    () =>
      estabelecimentos.filter(
        (e) =>
          e.tipo === 'FARMACIA_POPULAR' &&
          e.atributos_operacionais.credenciamento_pfpb_ativo !== false,
      ),
    [estabelecimentos],
  );

  const unidadesPublicasSus = useMemo(() => {
    if (apresentacaoAtiva) {
      return getPublicUnitsForMedication(apresentacaoAtiva, estabelecimentos);
    }
    return estabelecimentos
      .filter((e) => e.tipo === 'UBS' || e.tipo === 'POLICLINICA' || e.tipo === 'UPA')
      .sort((a, b) => a.nome_fantasia.localeCompare(b.nome_fantasia, 'pt-BR'));
  }, [apresentacaoAtiva, estabelecimentos]);

  const baseAtiva =
    activeTab === 'FARMACIA_POPULAR' ? farmaciasCredenciadas : unidadesPublicasSus;

  const bairrosDisponiveis = useMemo(
    () => listarBairrosUnicos(baseAtiva),
    [baseAtiva],
  );

  const listaExibida = useMemo(() => {
    const filtradasPorBairro = ordenarEstabelecimentosPorBairro(
      baseAtiva,
      bairroSelecionado || undefined,
    );

    return ordenarListaComOuSemDistancia(filtradasPorBairro, userCoords);
  }, [baseAtiva, bairroSelecionado, userCoords]);

  const handleSelectTab = (tab: ActiveChannelTab) => {
    setActiveTab(tab);
    setBairroSelecionado('');
  };

  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('denied_or_error');
      setGpsMessage(
        'Seu aparelho ou navegador não informou a localização. Escolha seu bairro na lista ao lado para ver os locais perto de você.',
      );
      return;
    }

    setGpsStatus('loading');
    setGpsMessage('Consultando localização no seu aparelho...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus('granted');
        setGpsMessage('Locais ordenados do mais próximo para o mais distante de você.');
      },
      () => {
        setGpsStatus('denied_or_error');
        setGpsMessage(
          'Não foi possível usar o GPS agora. Sem problema: escolha seu bairro logo abaixo para filtrar os locais.',
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={effectiveReduceMotion ? 'always' : 'user'}>
        <section
          aria-labelledby="credenciadas-heading"
          className="ui-card-elevated space-y-5 p-5 sm:p-7"
        >
          <header className="space-y-4 border-b border-[var(--c-border-subtle)] pb-5">
            <h2
              id="credenciadas-heading"
              className="font-display text-2xl font-extrabold text-[var(--c-text)] sm:text-3xl"
            >
              Onde buscar em Cuiabá
            </h2>

            {/* Abas acessíveis (>= 48px) com indicador deslizante layoutId e navegação por teclado */}
            <div
              role="tablist"
              aria-label="Escolher entre drogarias credenciadas e unidades públicas do SUS"
              onKeyDown={handleTabKeyDown}
              className="grid grid-cols-1 gap-2.5 rounded-[var(--r-plate)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-1.5 sm:grid-cols-2"
            >
              <button
                ref={tabFarmaciaRef}
                id="tab-farmacia-popular"
                type="button"
                role="tab"
                tabIndex={activeTab === 'FARMACIA_POPULAR' ? 0 : -1}
                aria-selected={activeTab === 'FARMACIA_POPULAR'}
                aria-controls="tabpanel-estabelecimentos"
                onClick={() => handleSelectTab('FARMACIA_POPULAR')}
                className={`relative z-10 inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-[var(--r-button)] px-4 py-2.5 text-left font-display text-lg font-bold transition-colors active:translate-y-px ${
                  activeTab === 'FARMACIA_POPULAR'
                    ? 'text-white shadow-xs'
                    : 'text-[var(--c-text)] hover:bg-[var(--c-free-tint)]/70'
                }`}
              >
                {activeTab === 'FARMACIA_POPULAR' && (
                  <m.span
                    layoutId="credenciadas-channel-tab-pill"
                    aria-hidden="true"
                    transition={{
                      duration: effectiveReduceMotion ? 0 : 0.22,
                      ease: 'easeOut',
                    }}
                    className="absolute inset-0 -z-10 rounded-[var(--r-button)] bg-[var(--c-free)]"
                  />
                )}
                <RadioDotIcon checked={activeTab === 'FARMACIA_POPULAR'} className="h-4 w-4" />
                <PharmacyCrossIcon className="h-4 w-4 shrink-0" />
                <span>
                  Drogarias Credenciadas (Farmácia Popular) ({farmaciasCredenciadas.length})
                </span>
              </button>

              <button
                ref={tabSusRef}
                id="tab-unidades-sus"
                type="button"
                role="tab"
                tabIndex={activeTab === 'UNIDADES_SUS' ? 0 : -1}
                aria-selected={activeTab === 'UNIDADES_SUS'}
                aria-controls="tabpanel-estabelecimentos"
                onClick={() => handleSelectTab('UNIDADES_SUS')}
                className={`relative z-10 inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-[var(--r-button)] px-4 py-2.5 text-left font-display text-lg font-bold transition-colors active:translate-y-px ${
                  activeTab === 'UNIDADES_SUS'
                    ? 'text-white shadow-xs'
                    : 'text-[var(--c-text)] hover:bg-[var(--c-brand-tint)]/70'
                }`}
              >
                {activeTab === 'UNIDADES_SUS' && (
                  <m.span
                    layoutId="credenciadas-channel-tab-pill"
                    aria-hidden="true"
                    transition={{
                      duration: effectiveReduceMotion ? 0 : 0.22,
                      ease: 'easeOut',
                    }}
                    className="absolute inset-0 -z-10 rounded-[var(--r-button)] bg-[var(--c-brand)]"
                  />
                )}
                <RadioDotIcon checked={activeTab === 'UNIDADES_SUS'} className="h-4 w-4" />
                <BuildingSusIcon className="h-4 w-4 shrink-0" />
                <span>
                  Unidades Públicas (SUS Cuiabá — Postos, Policlínicas e UPAs) (
                  {unidadesPublicasSus.length})
                </span>
              </button>
            </div>

            {/* Aviso obrigatório da Regra Inviolável #4 / DAS 6.3 */}
            {activeTab === 'FARMACIA_POPULAR' ? (
              <div
                role="note"
                className="flex items-start gap-2.5 rounded-[var(--r-button)] border border-[var(--c-free)]/25 bg-[var(--c-free-tint)] p-3.5 text-base font-bold text-[var(--c-text)]"
              >
                <PharmacyCrossIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--c-free)]" />
                <p>{NORMATIVE_TEXTS.via2.PINO_E_CARTAO_FARMACIA}</p>
              </div>
            ) : (
              <div
                role="note"
                className="flex items-start gap-2.5 rounded-[var(--r-button)] border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] p-3.5 text-base font-bold text-[var(--c-text)]"
              >
                <BuildingSusIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--c-brand)]" />
                <p>{NORMATIVE_TEXTS.via1.PADRONIZADO_REMUME.texto}</p>
              </div>
            )}
          </header>

          <div
            role="tabpanel"
            id="tabpanel-estabelecimentos"
            aria-labelledby={
              activeTab === 'FARMACIA_POPULAR' ? 'tab-farmacia-popular' : 'tab-unidades-sus'
            }
            tabIndex={0}
            className="space-y-5 focus:outline-hidden"
          >
            {/* Controles: GPS sob demanda + Alternativa obrigatória por Bairro */}
            <div className="grid grid-cols-1 gap-4 rounded-[var(--r-plate)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-4 sm:grid-cols-2">
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={handleRequestGps}
                disabled={gpsStatus === 'loading'}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2.5 font-display text-lg font-bold text-white shadow-xs transition-opacity hover:opacity-95 disabled:opacity-60 active:translate-y-px"
              >
                <MapPinIcon className="h-5 w-5" />
                <span>
                  {gpsStatus === 'loading'
                    ? 'Localizando...'
                    : gpsStatus === 'granted'
                      ? 'Ordenado perto de mim (atualizar)'
                      : 'Ordenar perto de mim (usar GPS)'}
                </span>
              </button>
            </div>

            <div>
              <label
                htmlFor={selectId}
                className="block font-display text-lg font-bold text-[var(--c-text)]"
              >
                Ou escolha o bairro (sem GPS):
              </label>
              <select
                id={selectId}
                value={bairroSelecionado}
                onChange={(e) => setBairroSelecionado(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-[var(--r-button)] border border-[var(--c-border-strong)] bg-[var(--c-surface)] px-3.5 py-2 text-base font-bold text-[var(--c-text)] shadow-2xs"
              >
                <option value="">Todos os bairros ({baseAtiva.length})</option>
                {bairrosDisponiveis.map((bairro) => (
                  <option key={bairro} value={bairro}>
                    {bairro}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {gpsMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-2.5 rounded-[var(--r-button)] border p-3.5 text-base font-bold ${
                gpsStatus === 'denied_or_error'
                  ? 'border-[var(--c-attn-border)] bg-[var(--c-attn)] text-[var(--c-text)]'
                  : 'border-[var(--c-free)]/30 bg-[var(--c-free-tint)] text-[var(--c-free)]'
              }`}
            >
              {gpsStatus === 'denied_or_error' ? (
                <AlertTriangleIcon className="h-5 w-5 shrink-0" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 shrink-0" />
              )}
              <span>{gpsMessage}</span>
            </div>
          )}

          {/* Acesso ao Mapa: Action Card para /mapa/ (sem scroll-trap) ou slot customizado */}
          <div id="secao-mapa-credenciadas" data-testid="map-slot" className="space-y-3">
            {mapSlot ?? (
              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--c-border)] bg-gradient-to-r from-[var(--c-brand-tint)] via-[var(--c-surface)] to-[var(--c-surface)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--c-brand)] text-white shadow-xs">
                    <Icon name="map" className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-black text-[var(--c-text)] sm:text-lg">
                      Ver no Mapa Interativo
                    </h3>
                    <p className="text-xs text-[var(--c-text-2)] sm:text-sm">
                      Navegue por todas as farmácias e unidades em tela cheia na aba dedicada de Mapa.
                    </p>
                  </div>
                </div>
                <Link
                  href="/mapa/"
                  className="ui-pressable inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--c-brand)] px-5 py-2.5 font-display text-sm font-bold text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
                >
                  <Icon name="map" className="h-4 w-4" />
                  <span>Abrir no Mapa</span>
                </Link>
              </div>
            )}
          </div>

          {/* Lista acessível de estabelecimentos */}
          <div className="space-y-3.5">
            <p role="status" aria-live="polite" className="text-base font-bold text-[var(--c-text-2)]">
              Mostrando {listaExibida.length}{' '}
              {activeTab === 'FARMACIA_POPULAR'
                ? 'farmácia(s) credenciada(s)'
                : 'unidade(s) pública(s) compatível(is)'}
              {bairroSelecionado ? ` no bairro ${bairroSelecionado}` : ''}:
            </p>

            {listaExibida.length === 0 ? (
              <div className="rounded-[var(--r-plate)] border border-[var(--c-border)] bg-[var(--c-bg)] p-5">
                <p className="font-display text-lg font-bold text-[var(--c-text)]">
                  {activeTab === 'UNIDADES_SUS' &&
                  apresentacaoAtiva &&
                  apresentacaoAtiva.status_remume_cuiaba !== 'PADRONIZADO_REMUME'
                    ? 'Esta apresentação não consta na lista municipal (REMUME Cuiabá). Confira a aba de Drogarias Credenciadas (Farmácia Popular).'
                    : 'Nenhum local encontrado para este filtro.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-3.5">
                {listaExibida.map(({ estabelecimento, distanciaKm }) => {
                  const badge = getEstablishmentTypeBadge(estabelecimento.tipo);
                  const statusOp = estabelecimento.atributos_operacionais.status_funcionamento;
                  const temCoordenadaValida = hasValidMapCoordinates(estabelecimento);

                  return (
                    <li
                      key={estabelecimento.id}
                      className="rounded-[var(--r-plate)] border border-[var(--c-border)] bg-[var(--c-bg)] p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2.5">
                        <div>
                          <h3 className="font-display text-xl font-extrabold text-[var(--c-text)] sm:text-2xl">
                            {estabelecimento.nome_fantasia}
                          </h3>
                          <p className="mt-0.5 inline-flex items-center gap-1.5 text-base font-bold text-[var(--c-brand)]">
                            <MapPinIcon className="h-4 w-4" />
                            <span>
                              Bairro: {estabelecimento.bairro}
                              {distanciaKm !== null &&
                                ` • Aprox. ${formatarDistancia(distanciaKm)}`}
                            </span>
                          </p>
                        </div>

                        {badge.isPharmacy ? (
                          <span className="inline-flex items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-free)]/25 bg-[var(--c-free-tint)] px-3 py-1 text-sm font-bold text-[var(--c-free)]">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Credenciada ao Farmácia Popular</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-[var(--r-chip)] border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] px-3 py-1 text-sm font-bold text-[var(--c-brand)]">
                            <BuildingSusIcon className="h-4 w-4" />
                            <span>
                              [{badge.code}] {badge.fullLabel}
                            </span>
                          </span>
                        )}
                      </div>

                      <p className="mt-2.5 text-base text-[var(--c-text)]">
                        <strong>Endereço:</strong> {estabelecimento.endereco_completo}
                      </p>

                      <div className="mt-2">
                        <EstablishmentContactActions
                          telefone={estabelecimento.telefone}
                          endereco={estabelecimento.endereco_completo}
                          nomeFantasia={estabelecimento.nome_fantasia}
                        />
                      </div>

                      {statusOp !== 'NORMAL' && (
                        <p className="mt-2.5 flex items-start gap-2 rounded-[var(--r-button)] border border-[var(--c-attn-border)] bg-[var(--c-attn)] px-3.5 py-2 text-base font-bold text-[var(--c-text)]">
                          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                          <span>
                            Atenção ({statusOp}):{' '}
                            {estabelecimento.atributos_operacionais.mensagem_contingencia ??
                              'Confirme o atendimento antes de se deslocar.'}
                          </span>
                        </p>
                      )}

                      <div className="mt-3.5 space-y-2 border-t border-[var(--c-border-subtle)] pt-3.5">
                        {!temCoordenadaValida ? (
                          <p className="rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3.5 py-2 text-base font-bold text-[var(--c-text-2)]">
                            Localização no mapa indisponível. Use o endereço.
                          </p>
                        ) : (
                          <>
                            {!estabelecimento.coordenadas.auditado_manualmente && (
                              <p className="text-sm font-bold text-[var(--c-text-2)]">
                                Localização aproximada. Confira o endereço.
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('ondepego_mapa_foco_id', estabelecimento.id);
                                    window.location.href = '/mapa/';
                                  }
                                }}
                                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-brand)]/30 bg-[var(--c-brand-tint)] px-4 py-2 font-display text-base font-bold text-[var(--c-brand)] transition-colors hover:bg-[var(--c-brand)] hover:text-white sm:w-auto"
                              >
                                <MapPinIcon className="h-4 w-4 shrink-0" />
                                <span>Ver no mapa</span>
                              </button>

                              <a
                                href={gerarUrlRotaGoogleMaps(estabelecimento.coordenadas, 'transit', {
                                  nomeFantasia: estabelecimento.nome_fantasia,
                                  enderecoCompleto: estabelecimento.endereco_completo,
                                  bairro: estabelecimento.bairro,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Ver rota no mapa para ${estabelecimento.nome_fantasia}`}
                                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 text-center font-display text-lg font-bold text-white shadow-xs transition-opacity hover:opacity-95 sm:w-auto"
                              >
                                <NavigationIcon className="h-4 w-4 shrink-0" />
                                <span>Ver rota para {estabelecimento.nome_fantasia}</span>
                              </a>
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--c-border-subtle)] pt-4 text-base text-[var(--c-text-2)]">
            <span>
              Fontes: Painel InfoMS ({formatIsoDatePTBR(meta.data_infoms)}) • Rede Municipal SMS
              Cuiabá ({formatIsoDatePTBR(meta.data_remume)})
            </span>
            <a
              href={gerarUrlTransportePublicoOpcional()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[var(--c-brand)] underline"
            >
              Consultar horários de ônibus (pontoos.com.br)
            </a>
          </footer>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
