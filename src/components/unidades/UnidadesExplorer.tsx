'use client';

import React, { useId, useMemo, useState } from 'react';
import { LazyEstablishmentMap } from '@/components/map/LazyEstablishmentMap';
import { OfflineMapDownload } from '@/components/map/OfflineMapDownload';
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
  { value: 'TODOS', label: 'Todos' },
  { value: 'FARMACIA_POPULAR', label: 'Farmácias Populares' },
  { value: 'UBS', label: 'Postos de saúde (UBS)' },
  { value: 'POLICLINICA', label: 'Policlínicas' },
  { value: 'UPA', label: 'UPAs 24h' },
];

type GpsStatus = 'idle' | 'loading' | 'granted' | 'denied_or_error';

export function UnidadesExplorer({ estabelecimentos, meta }: UnidadesExplorerProps) {
  const bairroSelectId = useId();
  const textSearchId = useId();

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

  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('denied_or_error');
      setGpsMessage(
        'Seu aparelho não informou o GPS. Escolha o bairro no seletor ao lado para ver os locais perto de você.',
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

  return (
    <div className="space-y-6">
      {/* Painel de Filtros: Tipo + GPS/Bairro + Busca Textual */}
      <section
        aria-label="Filtros de unidades e farmácias"
        className="space-y-4 rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-4 sm:p-5"
      >
        <div>
          <p className="font-display text-lg font-bold text-[var(--c-text)]">
            Filtrar por tipo de atendimento:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const selected = tipoFiltro === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTipoFiltro(tab.value)}
                  className={`inline-flex min-h-[48px] items-center gap-1.5 rounded-[var(--r-chip)] border-2 px-4 py-2 text-base font-bold transition-colors active:translate-y-px ${
                    selected
                      ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white'
                      : 'border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text)] hover:bg-[var(--c-brand-tint)]'
                  }`}
                >
                  <span aria-hidden="true">{selected ? '●' : '○'}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t-2 border-[var(--c-border-subtle)] pt-4 sm:grid-cols-3">
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
                    ? '✓ Perto de mim (ativo)'
                    : 'Perto de mim (usar GPS)'}
              </span>
            </button>
          </div>

          <div>
            <label
              htmlFor={bairroSelectId}
              className="block font-display text-lg font-bold text-[var(--c-text)]"
            >
              Escolher bairro (sem GPS):
            </label>
            <select
              id={bairroSelectId}
              value={bairroFiltro}
              onChange={(e) => setBairroFiltro(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-2 text-base font-bold text-[var(--c-text)]"
            >
              <option value="">Todos os bairros</option>
              {bairrosDisponiveis.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={textSearchId}
              className="block font-display text-lg font-bold text-[var(--c-text)]"
            >
              Buscar por nome ou rua:
            </label>
            <input
              id={textSearchId}
              type="search"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Ex.: centro, farmácia..."
              className="mt-1 min-h-[48px] w-full rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-3 py-2 text-base font-bold text-[var(--c-text)]"
            />
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
      </section>

      {/* Mapa sob demanda (MapLibre + PMTiles / Esquemático local) */}
      <section aria-label="Visualização no mapa" className="space-y-3">
        <OfflineMapDownload />
        <LazyEstablishmentMap
          estabelecimentos={listaOrdenada
            .map((item) => item.estabelecimento)
            .filter((e) => hasValidMapCoordinates(e))}
          userCoords={userCoords}
          defaultOpen={false}
          toggleButtonLabelOpen="Abrir mapa das unidades e farmácias"
          toggleButtonLabelClose="Ocultar mapa"
        />
      </section>

      {/* Lista completa acessível (sempre presente como alternativa completa ao mapa) */}
      <section aria-label="Lista de unidades e farmácias" className="space-y-4">
        <div role="status" aria-live="polite" className="font-display text-xl font-bold">
          Mostrando {listaOrdenada.length} local(is) encontrado(s):
        </div>

        {listaOrdenada.length === 0 ? (
          <div className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-5">
            <p className="font-display text-xl font-bold text-[var(--c-text)]">
              Nenhuma unidade encontrada com esses filtros.
            </p>
            <button
              type="button"
              onClick={() => {
                setTipoFiltro('TODOS');
                setBairroFiltro('');
                setBuscaTexto('');
              }}
              className="mt-3 inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2 font-bold text-[var(--c-text)]"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {listaOrdenada.map(({ estabelecimento, distanciaKm }) => {
              const badge = getEstablishmentTypeBadge(estabelecimento.tipo);
              const statusOp = estabelecimento.atributos_operacionais.status_funcionamento;
              const temCoordenadaValida = hasValidMapCoordinates(estabelecimento);

              return (
                <li
                  key={estabelecimento.id}
                  className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block rounded border-2 px-2.5 py-0.5 font-display text-sm font-extrabold ${
                          badge.isPharmacy
                            ? 'border-[var(--c-free)] bg-[var(--c-free-tint)] text-[var(--c-free)]'
                            : 'border-[var(--c-brand)] bg-[var(--c-brand-tint)] text-[var(--c-brand)]'
                        }`}
                      >
                        [{badge.code}] {badge.fullLabel}
                      </span>
                      <h2 className="mt-1 font-display text-2xl font-extrabold text-[var(--c-text)]">
                        {estabelecimento.nome_fantasia}
                      </h2>
                      <p className="text-base font-bold text-[var(--c-brand)]">
                        Bairro: {estabelecimento.bairro}
                        {distanciaKm !== null && ` • Aprox. ${formatarDistancia(distanciaKm)}`}
                      </p>
                    </div>
                  </div>

                  {/* Regra inviolável #4: toda farmácia credenciada exibe o texto normativo do pino */}
                  {estabelecimento.tipo === 'FARMACIA_POPULAR' && (
                    <p className="mt-2 rounded border-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] px-3 py-2 text-base font-bold text-[var(--c-text)]">
                      {NORMATIVE_TEXTS.via2.PINO_E_CARTAO_FARMACIA}
                    </p>
                  )}

                  <p className="mt-2 text-base text-[var(--c-text)]">
                    <strong>Endereço:</strong> {estabelecimento.endereco_completo}
                  </p>

                  {estabelecimento.telefone && (
                    <p className="mt-1 text-base text-[var(--c-text)]">
                      <strong>Telefone:</strong> {estabelecimento.telefone}
                    </p>
                  )}

                  {statusOp !== 'NORMAL' && (
                    <p className="mt-2 rounded border-2 border-[var(--c-border)] bg-[var(--c-attn)] px-3 py-2 text-base font-bold text-[var(--c-text)]">
                      ⚠ Atenção ({statusOp}):{' '}
                      {estabelecimento.atributos_operacionais.mensagem_contingencia ??
                        'Confirme o funcionamento antes de sair de casa.'}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 border-t-2 border-[var(--c-border-subtle)] pt-3">
                    {!temCoordenadaValida ? (
                      <p className="rounded border-2 border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] px-3 py-2 text-base font-bold text-[var(--c-text-2)]">
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
                            href={gerarUrlRotaGoogleMaps(estabelecimento.coordenadas, 'transit')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white"
                          >
                            Ver rota para {estabelecimento.nome_fantasia}
                          </a>

                          <a
                            href={gerarUrlRotaGoogleMaps(estabelecimento.coordenadas, 'walking')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] px-4 py-2 font-display text-lg font-bold text-[var(--c-text)]"
                          >
                            Ver rota a pé
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
      </section>

      <footer className="border-t-2 border-[var(--c-border-subtle)] pt-4 text-base text-[var(--c-text-2)]">
        Fontes oficiais: Painel InfoMS — Farmácia Popular ({formatIsoDatePTBR(meta.data_infoms)}) •
        Rede Municipal SMS Cuiabá ({formatIsoDatePTBR(meta.data_remume)})
      </footer>
    </div>
  );
}
