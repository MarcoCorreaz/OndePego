'use client';

import React, { useId, useMemo, useState } from 'react';
import { LazyEstablishmentMap } from '@/components/map/LazyEstablishmentMap';
import { OfflineMapDownload } from '@/components/map/OfflineMapDownload';
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
  const [activeTab, setActiveTab] = useState<ActiveChannelTab>('FARMACIA_POPULAR');
  const [bairroSelecionado, setBairroSelecionado] = useState<string>('');
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');

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
    <section
      aria-labelledby="credenciadas-heading"
      className="space-y-4 rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-4 sm:p-5"
    >
      <header className="space-y-3 border-b-2 border-[var(--c-border-subtle)] pb-4">
        <h2
          id="credenciadas-heading"
          className="font-display text-2xl font-extrabold text-[var(--c-text)] sm:text-3xl"
        >
          Onde buscar em Cuiabá
        </h2>

        {/* Abas acessíveis (>= 48px) alternando entre Drogarias Credenciadas e Unidades Públicas SUS */}
        <div
          role="tablist"
          aria-label="Escolher entre drogarias credenciadas e unidades públicas do SUS"
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'FARMACIA_POPULAR'}
            onClick={() => handleSelectTab('FARMACIA_POPULAR')}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border-2 px-4 py-2.5 text-left font-display text-lg font-bold transition-colors active:translate-y-px ${
              activeTab === 'FARMACIA_POPULAR'
                ? 'border-[var(--c-free)] bg-[var(--c-free)] text-white'
                : 'border-[var(--c-border)] bg-[var(--c-bg-soft)] text-[var(--c-text)] hover:bg-[var(--c-free-tint)]'
            }`}
          >
            <span aria-hidden="true">{activeTab === 'FARMACIA_POPULAR' ? '●' : '○'}</span>
            <span>
              Drogarias Credenciadas (Farmácia Popular) ({farmaciasCredenciadas.length})
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'UNIDADES_SUS'}
            onClick={() => handleSelectTab('UNIDADES_SUS')}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border-2 px-4 py-2.5 text-left font-display text-lg font-bold transition-colors active:translate-y-px ${
              activeTab === 'UNIDADES_SUS'
                ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white'
                : 'border-[var(--c-border)] bg-[var(--c-bg-soft)] text-[var(--c-text)] hover:bg-[var(--c-brand-tint)]'
            }`}
          >
            <span aria-hidden="true">{activeTab === 'UNIDADES_SUS' ? '●' : '○'}</span>
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
            className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-3 text-base font-bold text-[var(--c-text)]"
          >
            <p>{NORMATIVE_TEXTS.via2.PINO_E_CARTAO_FARMACIA}</p>
          </div>
        ) : (
          <div
            role="note"
            className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-3 text-base font-bold text-[var(--c-text)]"
          >
            <p>{NORMATIVE_TEXTS.via1.PADRONIZADO_REMUME.texto}</p>
          </div>
        )}
      </header>

      {/* Controles: GPS sob demanda + Alternativa obrigatória por Bairro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-end">
          <button
            type="button"
            onClick={handleRequestGps}
            disabled={gpsStatus === 'loading'}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2.5 font-display text-lg font-bold text-white disabled:opacity-60 active:translate-y-px"
          >
            <span aria-hidden="true">📍</span>
            <span>
              {gpsStatus === 'loading'
                ? 'Localizando...'
                : gpsStatus === 'granted'
                  ? '✓ Ordenado perto de mim (atualizar)'
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
            className="mt-1 min-h-[48px] w-full rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-2 text-base font-bold text-[var(--c-text)]"
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
          className={`rounded-[var(--r-plate)] border-2 p-3 text-base font-bold ${
            gpsStatus === 'denied_or_error'
              ? 'border-[var(--c-border)] bg-[var(--c-attn)] text-[var(--c-text)]'
              : 'border-[var(--c-free)] bg-[var(--c-free-tint)] text-[var(--c-free)]'
          }`}
        >
          {gpsMessage}
        </div>
      )}

      {/* Mapa Dividido sob demanda (apenas estabelecimentos com coordenada válida aparecem como pino) */}
      <div data-testid="map-slot" className="space-y-3">
        <OfflineMapDownload />
        {mapSlot ?? (
          <LazyEstablishmentMap
            estabelecimentos={listaExibida
              .map((item) => item.estabelecimento)
              .filter((e) => hasValidMapCoordinates(e))}
            userCoords={userCoords}
            defaultOpen={false}
            toggleButtonLabelOpen={
              activeTab === 'FARMACIA_POPULAR'
                ? 'Ver farmácias credenciadas no mapa'
                : 'Ver unidades públicas no mapa'
            }
            toggleButtonLabelClose="Ocultar mapa"
          />
        )}
      </div>

      {/* Lista acessível de estabelecimentos */}
      <div aria-live="polite" className="space-y-3">
        <p className="text-base font-bold text-[var(--c-text-2)]">
          Mostrando {listaExibida.length}{' '}
          {activeTab === 'FARMACIA_POPULAR'
            ? 'farmácia(s) credenciada(s)'
            : 'unidade(s) pública(s) compatível(is)'}
          {bairroSelecionado ? ` no bairro ${bairroSelecionado}` : ''}:
        </p>

        {listaExibida.length === 0 ? (
          <div className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-4">
            <p className="font-display text-lg font-bold text-[var(--c-text)]">
              {activeTab === 'UNIDADES_SUS' &&
              apresentacaoAtiva &&
              apresentacaoAtiva.status_remume_cuiaba !== 'PADRONIZADO_REMUME'
                ? 'Esta apresentação não consta na lista municipal (REMUME Cuiabá). Confira a aba de Drogarias Credenciadas (Farmácia Popular).'
                : 'Nenhum local encontrado para este filtro.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {listaExibida.map(({ estabelecimento, distanciaKm }) => {
              const badge = getEstablishmentTypeBadge(estabelecimento.tipo);
              const statusOp = estabelecimento.atributos_operacionais.status_funcionamento;
              const temCoordenadaValida = hasValidMapCoordinates(estabelecimento);

              return (
                <li
                  key={estabelecimento.id}
                  className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl font-extrabold text-[var(--c-text)]">
                        {estabelecimento.nome_fantasia}
                      </h3>
                      <p className="text-base font-bold text-[var(--c-brand)]">
                        Bairro: {estabelecimento.bairro}
                        {distanciaKm !== null && ` • Aprox. ${formatarDistancia(distanciaKm)}`}
                      </p>
                    </div>

                    {badge.isPharmacy ? (
                      <span className="inline-flex items-center rounded border-2 border-[var(--c-free)] bg-[var(--c-free-tint)] px-2.5 py-0.5 text-sm font-bold text-[var(--c-free)]">
                        ✓ Credenciada ao Farmácia Popular
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded border-2 border-[var(--c-brand)] bg-[var(--c-brand-tint)] px-2.5 py-0.5 text-sm font-bold text-[var(--c-brand)]">
                        [{badge.code}] {badge.fullLabel}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-base text-[var(--c-text)]">
                    <strong>Endereço:</strong> {estabelecimento.endereco_completo}
                  </p>

                  {estabelecimento.telefone && (
                    <p className="mt-1 text-base text-[var(--c-text)]">
                      <strong>Telefone:</strong> {estabelecimento.telefone}
                    </p>
                  )}

                  {statusOp !== 'NORMAL' && (
                    <p className="mt-2 rounded border-2 border-[var(--c-border)] bg-[var(--c-attn)] px-3 py-1.5 text-base font-bold text-[var(--c-text)]">
                      ⚠ Atenção ({statusOp}):{' '}
                      {estabelecimento.atributos_operacionais.mensagem_contingencia ??
                        'Confirme o atendimento antes de se deslocar.'}
                    </p>
                  )}

                  <div className="mt-3 space-y-2 border-t border-[var(--c-border-subtle)] pt-3">
                    {!temCoordenadaValida ? (
                      <p className="rounded border-2 border-[var(--c-border-subtle)] bg-[var(--c-bg)] px-3 py-2 text-base font-bold text-[var(--c-text-2)]">
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
                          <a
                            href={gerarUrlRotaGoogleMaps(estabelecimento.coordenadas)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Ver rota no mapa para ${estabelecimento.nome_fantasia}`}
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white"
                          >
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

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[var(--c-border-subtle)] pt-3 text-base text-[var(--c-text-2)]">
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
  );
}
