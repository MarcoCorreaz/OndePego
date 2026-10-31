'use client';

import React, { useId, useMemo, useRef, useState } from 'react';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { LazyEstablishmentMap } from '@/components/map/LazyEstablishmentMap';
import { OfflineMapDownload } from '@/components/map/OfflineMapDownload';
import { EstablishmentContactActions } from '@/components/ui/EstablishmentContactActions';
import { Icon } from '@/components/ui/Icon';
import {
  type EstablishmentFilterType,
  filterEstablishments,
  getEstablishmentTypeBadge,
} from '@/lib/establishmentsFilter';
import {
  type LatLng,
  formatarDistancia,
  gerarUrlRotaGoogleMaps,
  hasValidMapCoordinates,
  listarBairrosUnicos,
  ordenarEstabelecimentosPorBairro,
  ordenarListaComOuSemDistancia,
} from '@/lib/geoEngine';
import { NORMATIVE_TEXTS, formatIsoDatePTBR } from '@/lib/healthCopy';
import type { Estabelecimento, MetaDados } from '@/types/schema';

export interface UnidadesExplorerProps {
  estabelecimentos: readonly Estabelecimento[];
  meta: MetaDados;
}

const FILTER_TABS: Array<{ value: EstablishmentFilterType; label: string }> = [
  { value: 'TODOS', label: 'Todos os tipos' },
  { value: 'FARMACIA_POPULAR', label: 'Farmácias Credenciadas' },
  { value: 'UBS', label: 'Postos de saúde (UBS)' },
  { value: 'POLICLINICA', label: 'Policlínicas' },
  { value: 'UPA', label: 'UPAs 24h' },
];

type GpsStatus = 'idle' | 'loading' | 'granted' | 'denied_or_error';
type ViewMode = 'mapa' | 'lista';

export function UnidadesExplorer({ estabelecimentos, meta }: UnidadesExplorerProps) {
  const bairroSelectId = useId();
  const textSearchId = useId();
  const { effectiveReduceMotion } = useAccessibility();

  // WAI-ARIA tablist refs
  const tabMapaRef = useRef<HTMLButtonElement | null>(null);
  const tabListaRef = useRef<HTMLButtonElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('mapa');
  const [tipoFiltro, setTipoFiltro] = useState<EstablishmentFilterType>('TODOS');
  const [bairroFiltro, setBairroFiltro] = useState<string>('');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');

  const bairrosDisponiveis = useMemo(
    () => listarBairrosUnicos(estabelecimentos),
    [estabelecimentos],
  );

  const estabelecimentosFiltrados = useMemo(
    () =>
      filterEstablishments(estabelecimentos, {
        tipo: tipoFiltro,
        bairro: bairroFiltro,
        query: buscaTexto,
      }),
    [estabelecimentos, tipoFiltro, bairroFiltro, buscaTexto],
  );

  const listaOrdenada = useMemo(() => {
    const porBairro = ordenarEstabelecimentosPorBairro(estabelecimentosFiltrados);
    return ordenarListaComOuSemDistancia(porBairro, userCoords);
  }, [estabelecimentosFiltrados, userCoords]);

  // Contagem de filtros ativos
  const activeFiltersCount =
    (tipoFiltro !== 'TODOS' ? 1 : 0) +
    (bairroFiltro ? 1 : 0) +
    (buscaTexto ? 1 : 0) +
    (userCoords ? 1 : 0);

  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('denied_or_error');
      setGpsMessage(
        'Seu aparelho não informou o GPS. Escolha o bairro no seletor para ver os locais perto de você.',
      );
      return;
    }

    setGpsStatus('loading');
    setGpsMessage('Consultando sua posição apenas neste aparelho...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus('granted');
        setGpsMessage('Locais ordenados do mais próximo ao mais distante de você.');
      },
      () => {
        setGpsStatus('denied_or_error');
        setGpsMessage(
          'Permissão de GPS negada ou indisponível. Use o filtro por bairro logo abaixo.',
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  // Keyboard navigation for WAI-ARIA tablist (setas, Home, End)
  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (viewMode === 'mapa') {
        setViewMode('lista');
        tabListaRef.current?.focus();
      } else {
        setViewMode('mapa');
        tabMapaRef.current?.focus();
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (viewMode === 'lista') {
        setViewMode('mapa');
        tabMapaRef.current?.focus();
      } else {
        setViewMode('lista');
        tabListaRef.current?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setViewMode('mapa');
      tabMapaRef.current?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      setViewMode('lista');
      tabListaRef.current?.focus();
    }
  };

  const openFilterDialog = () => {
    dialogRef.current?.showModal();
  };

  const closeFilterDialog = () => {
    dialogRef.current?.close();
    filterTriggerRef.current?.focus();
  };

  return (
    <div className="space-y-4 text-[var(--c-text)]">
      {/* 1. MAPA COMO HERÓI NO TOPO */}
      <section
        id="secao-mapa-unidades"
        aria-label="Mapa das unidades e farmácias credenciadas"
        className="overflow-hidden rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xs"
      >
        <div className="w-full">
          <LazyEstablishmentMap
            estabelecimentos={listaOrdenada
              .map((item) => item.estabelecimento)
              .filter((e) => hasValidMapCoordinates(e))}
            userCoords={userCoords}
            defaultOpen={true}
            toggleButtonLabelOpen="Abrir mapa"
            toggleButtonLabelClose="Ocultar mapa"
          />
        </div>

        {/* 5. "Usar sem internet": linha recolhível com <details> no rodapé do mapa */}
        <details className="group border-t border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)]/60 px-4 py-2.5">
          <summary className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 font-display text-base font-bold text-[var(--c-brand)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-brand)]">
            <Icon name="download" className="h-4 w-4" />
            <span>Usar sem internet (baixar mapa offline)</span>
            <Icon name="chev" className="h-4 w-4 transition-transform group-open:rotate-90" />
          </summary>
          <div className="pb-3 pt-2">
            <OfflineMapDownload />
          </div>
        </details>
      </section>

      {/* 2. CONTROLE SEGMENTADO MAPA | LISTA (WAI-ARIA COMPLETO) + BOTÃO FILTROS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Controle segmentado com tablist WAI-ARIA */}
        <div
          role="tablist"
          aria-label="Modo de visualização"
          onKeyDown={handleTabKeyDown}
          className="inline-flex h-12 items-center rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg-soft)] p-1 shadow-2xs"
        >
          <button
            ref={tabMapaRef}
            id="tab-unidades-mapa"
            role="tab"
            type="button"
            aria-selected={viewMode === 'mapa'}
            aria-controls="panel-unidades-mapa"
            tabIndex={viewMode === 'mapa' ? 0 : -1}
            onClick={() => setViewMode('mapa')}
            className={`ui-pressable inline-flex h-10 items-center gap-2 rounded-[var(--r-button)] px-4 font-display text-base font-bold transition-all ${
              viewMode === 'mapa'
                ? 'border border-[var(--c-brand)]/20 bg-[var(--c-brand-tint)] text-[var(--c-brand)] shadow-xs'
                : 'text-[var(--c-text-2)] hover:text-[var(--c-text)]'
            }`}
          >
            <Icon name="map" className="h-4 w-4" />
            <span>Mapa</span>
          </button>

          <button
            ref={tabListaRef}
            id="tab-unidades-lista"
            role="tab"
            type="button"
            aria-selected={viewMode === 'lista'}
            aria-controls="panel-unidades-lista"
            tabIndex={viewMode === 'lista' ? 0 : -1}
            onClick={() => setViewMode('lista')}
            className={`ui-pressable inline-flex h-10 items-center gap-2 rounded-[var(--r-button)] px-4 font-display text-base font-bold transition-all ${
              viewMode === 'lista'
                ? 'border border-[var(--c-brand)]/20 bg-[var(--c-brand-tint)] text-[var(--c-brand)] shadow-xs'
                : 'text-[var(--c-text-2)] hover:text-[var(--c-text)]'
            }`}
          >
            <Icon name="list" className="h-4 w-4" />
            <span>Lista ({listaOrdenada.length})</span>
          </button>
        </div>

        {/* 3. BOTÃO "FILTROS (N)" QUE ABRE O BOTTOM SHEET */}
        <button
          ref={filterTriggerRef}
          type="button"
          onClick={openFilterDialog}
          aria-haspopup="dialog"
          aria-expanded={false}
          className={`ui-pressable inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border px-4 py-2 font-display text-base font-bold shadow-2xs transition-all active:scale-[0.98] ${
            activeFiltersCount > 0
              ? 'border-[var(--c-brand)] bg-[var(--c-brand-tint)] text-[var(--c-brand)]'
              : 'border-[var(--c-border-strong)] bg-[var(--c-surface)] text-[var(--c-text)] hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)]'
          }`}
        >
          <Icon name="filter" className="h-4 w-4" />
          <span>Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</span>
        </button>
      </div>

      {/* CHIPS REMOVÍVEIS DOS FILTROS ATIVOS */}
      {activeFiltersCount > 0 && (
        <div aria-label="Filtros aplicados" className="flex flex-wrap items-center gap-2">
          {tipoFiltro !== 'TODOS' && (
            <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] px-3 text-sm font-bold text-[var(--c-brand)]">
              <span>Tipo: {FILTER_TABS.find((t) => t.value === tipoFiltro)?.label}</span>
              <button
                type="button"
                onClick={() => setTipoFiltro('TODOS')}
                aria-label="Remover filtro de tipo"
                className="ml-1 rounded-full p-0.5 hover:bg-[var(--c-brand)] hover:text-white"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          {bairroFiltro && (
            <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] px-3 text-sm font-bold text-[var(--c-brand)]">
              <span>Bairro: {bairroFiltro}</span>
              <button
                type="button"
                onClick={() => setBairroFiltro('')}
                aria-label="Remover filtro de bairro"
                className="ml-1 rounded-full p-0.5 hover:bg-[var(--c-brand)] hover:text-white"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          {userCoords && (
            <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--c-free)]/25 bg-[var(--c-free-tint)] px-3 text-sm font-bold text-[var(--c-free-ink)]">
              <span>Perto de mim (GPS ativo)</span>
              <button
                type="button"
                onClick={() => {
                  setUserCoords(null);
                  setGpsStatus('idle');
                }}
                aria-label="Desativar ordenação por GPS"
                className="ml-1 rounded-full p-0.5 hover:bg-[var(--c-free)] hover:text-white"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          {buscaTexto && (
            <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--c-brand)]/25 bg-[var(--c-brand-tint)] px-3 text-sm font-bold text-[var(--c-brand)]">
              <span>Termo: &ldquo;{buscaTexto}&rdquo;</span>
              <button
                type="button"
                onClick={() => setBuscaTexto('')}
                aria-label="Limpar termo de busca"
                className="ml-1 rounded-full p-0.5 hover:bg-[var(--c-brand)] hover:text-white"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setTipoFiltro('TODOS');
              setBairroFiltro('');
              setBuscaTexto('');
              setUserCoords(null);
              setGpsStatus('idle');
            }}
            className="text-sm font-bold text-[var(--c-brand)] underline hover:no-underline"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* BOTTOM SHEET DE FILTROS VIA <dialog> NATIVO */}
      <dialog
        ref={dialogRef}
        onClose={closeFilterDialog}
        className="fixed inset-x-0 bottom-0 top-auto z-50 m-0 max-h-[85vh] w-full max-w-none overflow-y-auto rounded-t-[28px] border-t-2 border-[var(--c-border-strong)] bg-[var(--c-surface)] p-5 text-[var(--c-text)] shadow-2xl backdrop:bg-black/50"
      >
        <div className="mx-auto max-w-xl space-y-5">
          {/* Topo do bottom sheet */}
          <div className="flex items-center justify-between border-b border-[var(--c-border-subtle)] pb-3">
            <h2 className="font-display text-2xl font-black text-[var(--c-text)]">
              Filtrar unidades e farmácias
            </h2>
            <button
              type="button"
              onClick={closeFilterDialog}
              aria-label="Fechar filtros"
              className="ui-pressable inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] hover:bg-[var(--c-bg-soft)] active:scale-[0.98]"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          {/* Tipo de atendimento */}
          <div className="space-y-2">
            <label className="block font-display text-base font-bold text-[var(--c-text)]">
              Tipo de atendimento:
            </label>
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => {
                const selected = tipoFiltro === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setTipoFiltro(tab.value)}
                    className={`inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border px-4 py-2 text-base font-bold transition-all ${
                      selected
                        ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white shadow-xs'
                        : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] hover:border-[var(--c-brand)]'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Localização GPS */}
          <div className="space-y-2 border-t border-[var(--c-border-subtle)] pt-3">
            <label className="block font-display text-base font-bold text-[var(--c-text)]">
              Localização atual:
            </label>
            <button
              type="button"
              onClick={handleRequestGps}
              disabled={gpsStatus === 'loading'}
              className="ui-pressable inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2.5 font-display text-base font-bold text-white shadow-xs hover:opacity-95 disabled:opacity-60 active:scale-[0.98]"
            >
              <Icon name="pin" className="h-5 w-5" />
              <span>
                {gpsStatus === 'loading'
                  ? 'Localizando seu aparelho...'
                  : gpsStatus === 'granted'
                    ? 'Perto de mim (GPS ativo)'
                    : 'Perto de mim (usar GPS)'}
              </span>
            </button>
            {gpsMessage && (
              <p className="text-sm font-bold text-[var(--c-brand)]">{gpsMessage}</p>
            )}
          </div>

          {/* Bairro sem GPS */}
          <div className="space-y-2 border-t border-[var(--c-border-subtle)] pt-3">
            <label
              htmlFor={bairroSelectId}
              className="block font-display text-base font-bold text-[var(--c-text)]"
            >
              Escolher bairro em Cuiabá:
            </label>
            <select
              id={bairroSelectId}
              value={bairroFiltro}
              onChange={(e) => setBairroFiltro(e.target.value)}
              className="min-h-[48px] w-full rounded-[var(--r-button)] border border-[var(--c-border-strong)] bg-[var(--c-surface)] px-3 py-2 text-base font-bold text-[var(--c-text)] shadow-2xs"
            >
              <option value="">Todos os bairros</option>
              {bairrosDisponiveis.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Busca por nome ou rua */}
          <div className="space-y-2 border-t border-[var(--c-border-subtle)] pt-3">
            <label
              htmlFor={textSearchId}
              className="block font-display text-base font-bold text-[var(--c-text)]"
            >
              Buscar por nome ou rua:
            </label>
            <input
              id={textSearchId}
              type="search"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Ex.: centro, getúlio vargas..."
              className="min-h-[48px] w-full rounded-[var(--r-button)] border border-[var(--c-border-strong)] bg-[var(--c-surface)] px-3 py-2 text-base font-bold text-[var(--c-text)] shadow-2xs"
            />
          </div>

          {/* Botão Aplicar */}
          <div className="border-t border-[var(--c-border-subtle)] pt-4">
            <button
              type="button"
              onClick={closeFilterDialog}
              className="ui-pressable inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-attn)] px-6 py-3 font-display text-lg font-black text-[var(--c-text)] shadow-xs hover:brightness-105 active:scale-[0.98]"
            >
              <Icon name="check" className="h-5 w-5" />
              <span>Aplicar filtros ({listaOrdenada.length} resultados)</span>
            </button>
          </div>
        </div>
      </dialog>

      {/* 4. CONTEÚDO: TABPANELS MAPA E LISTA */}
      <div
        id="panel-unidades-mapa"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby="tab-unidades-mapa"
        hidden={viewMode !== 'mapa'}
        className="space-y-4"
      >
        <p className="text-base font-bold text-[var(--c-text-2)]">
          Mostrando {listaOrdenada.length} locais no mapa e na listagem de apoio:
        </p>

        {/* Listagem resumida de apoio abaixo do mapa herói */}
        <div className="space-y-3">
          {listaOrdenada.slice(0, 15).map((item) => {
            const est = item.estabelecimento;
            const temCoordenadas = hasValidMapCoordinates(est);
            const badge = getEstablishmentTypeBadge(est.tipo);

            return (
              <article
                key={est.id}
                className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--c-text)]">
                        <Icon name="cross" className="h-3.5 w-3.5 text-[var(--c-brand)]" />
                        <span>{badge.shortLabel}</span>
                      </span>
                      {item.distanciaKm !== null && (
                        <span className="font-sans text-sm font-extrabold text-[var(--c-brand)]">
                          {formatarDistancia(item.distanciaKm)} de você
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-black text-[var(--c-text)]">
                      {est.nome_fantasia}
                    </h3>
                    <p className="text-base text-[var(--c-text-2)]">
                      {est.bairro} — {est.endereco_completo}
                    </p>
                  </div>

                  {temCoordenadas && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('mapa');
                          const mapSec = document.getElementById('secao-mapa-unidades');
                          mapSec?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          window.dispatchEvent(
                            new CustomEvent('ondepego:focar-estabelecimento', {
                              detail: {
                                id: est.id,
                                lat: est.coordenadas.lat,
                                lng: est.coordenadas.lng,
                              },
                            }),
                          );
                        }}
                        className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--r-button)] border border-[var(--c-brand)]/30 bg-[var(--c-brand-tint)] px-3.5 py-2 font-display text-base font-bold text-[var(--c-brand)] hover:bg-[var(--c-brand)] hover:text-white active:scale-[0.98]"
                      >
                        <Icon name="pin" className="h-4 w-4" />
                        <span>Ver no mapa</span>
                      </button>

                      <a
                        href={gerarUrlRotaGoogleMaps(est.coordenadas, 'transit', {
                          nomeFantasia: est.nome_fantasia,
                          enderecoCompleto: est.endereco_completo,
                          bairro: est.bairro,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-base font-bold text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
                      >
                        <Icon name="pin" className="h-4 w-4" />
                        <span>Ver rota</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-3 border-t border-[var(--c-border-subtle)] pt-2.5">
                  <EstablishmentContactActions
                    telefone={est.telefone}
                    endereco={est.endereco_completo}
                    nomeFantasia={est.nome_fantasia}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div
        id="panel-unidades-lista"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby="tab-unidades-lista"
        hidden={viewMode !== 'lista'}
        className="space-y-4"
      >
        <p className="text-base font-bold text-[var(--c-text-2)]">
          Lista completa ({listaOrdenada.length} locais encontrados):
        </p>

        {listaOrdenada.length === 0 ? (
          <div className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-6 text-center">
            <Icon name="info" className="mx-auto h-8 w-8 text-[var(--c-attn-ink)]" />
            <h3 className="mt-2 font-display text-xl font-black text-[var(--c-text)]">
              Nenhuma unidade encontrada com esses filtros
            </h3>
            <p className="mt-1 text-base text-[var(--c-text-2)]">
              Tente selecionar outro bairro ou limpar o campo de busca.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listaOrdenada.map((item) => {
              const est = item.estabelecimento;
              const temCoordenadas = hasValidMapCoordinates(est);
              const badge = getEstablishmentTypeBadge(est.tipo);

              return (
                <article
                  key={est.id}
                  className="rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--c-text)]">
                          <Icon name="cross" className="h-3.5 w-3.5 text-[var(--c-brand)]" />
                          <span>{badge.shortLabel}</span>
                        </span>
                        {item.distanciaKm !== null && (
                          <span className="font-sans text-sm font-extrabold text-[var(--c-brand)]">
                            {formatarDistancia(item.distanciaKm)} de você
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-xl font-black text-[var(--c-text)] sm:text-2xl">
                        {est.nome_fantasia}
                      </h3>
                      <p className="text-base text-[var(--c-text-2)]">
                        <strong>Bairro:</strong> {est.bairro} • {est.endereco_completo}
                      </p>
                    </div>

                    {temCoordenadas && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setViewMode('mapa');
                            const mapSec = document.getElementById('secao-mapa-unidades');
                            mapSec?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            window.dispatchEvent(
                              new CustomEvent('ondepego:focar-estabelecimento', {
                                detail: {
                                  id: est.id,
                                  lat: est.coordenadas.lat,
                                  lng: est.coordenadas.lng,
                                },
                              }),
                            );
                          }}
                          className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--r-button)] border border-[var(--c-brand)]/30 bg-[var(--c-brand-tint)] px-3.5 py-2 font-display text-base font-bold text-[var(--c-brand)] hover:bg-[var(--c-brand)] hover:text-white active:scale-[0.98]"
                        >
                          <Icon name="pin" className="h-4 w-4" />
                          <span>Ver no mapa</span>
                        </button>

                        <a
                          href={gerarUrlRotaGoogleMaps(est.coordenadas, 'transit', {
                            nomeFantasia: est.nome_fantasia,
                            enderecoCompleto: est.endereco_completo,
                            bairro: est.bairro,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ui-pressable inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-base font-bold text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
                        >
                          <Icon name="pin" className="h-4 w-4" />
                          <span>Ver rota</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 border-t border-[var(--c-border-subtle)] pt-3">
                    <EstablishmentContactActions
                      telefone={est.telefone}
                      endereco={est.endereco_completo}
                      nomeFantasia={est.nome_fantasia}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <footer className="mt-6 border-t border-[var(--c-border-subtle)] pt-4 text-sm text-[var(--c-text-2)]">
        <p>
          Base de farmácias credenciadas e unidades municipais auditada em{' '}
          {formatIsoDatePTBR(meta.data_infoms)}.
        </p>
      </footer>
    </div>
  );
}
