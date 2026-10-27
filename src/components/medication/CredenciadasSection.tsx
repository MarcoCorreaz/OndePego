'use client';

import React, { useId, useMemo, useState } from 'react';
import { LazyEstablishmentMap } from '@/components/map/LazyEstablishmentMap';
import {
  type LatLng,
  formatarDistancia,
  gerarUrlRotaGoogleMaps,
  gerarUrlTransportePublicoOpcional,
  listarBairrosUnicos,
  ordenarEstabelecimentosPorBairro,
  ordenarEstabelecimentosPorDistancia,
} from '@/lib/geoEngine';
import { NORMATIVE_TEXTS, formatIsoDatePTBR } from '@/lib/healthCopy';
import type { Estabelecimento, MetaDados } from '@/types/schema';

export interface CredenciadasSectionProps {
  estabelecimentos: readonly Estabelecimento[];
  meta: MetaDados;
  /** Slot opcional para injetar o componente de mapa dividido (Tarefa 5) */
  mapSlot?: React.ReactNode;
}

type GpsStatus = 'idle' | 'loading' | 'granted' | 'denied_or_error';

export function CredenciadasSection({
  estabelecimentos,
  meta,
  mapSlot,
}: CredenciadasSectionProps) {
  const selectId = useId();
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

  const bairrosDisponiveis = useMemo(
    () => listarBairrosUnicos(farmaciasCredenciadas),
    [farmaciasCredenciadas],
  );

  const listaExibida = useMemo(() => {
    const filtradasPorBairro = ordenarEstabelecimentosPorBairro(
      farmaciasCredenciadas,
      bairroSelecionado || undefined,
    );

    if (userCoords) {
      return ordenarEstabelecimentosPorDistancia(filtradasPorBairro, userCoords);
    }

    return filtradasPorBairro.map((estabelecimento) => ({
      estabelecimento,
      distanciaKm: null as number | null,
    }));
  }, [farmaciasCredenciadas, bairroSelecionado, userCoords]);

  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('denied_or_error');
      setGpsMessage(
        'Seu aparelho ou navegador não informou a localização. Escolha seu bairro na lista ao lado para ver as farmácias perto de você.',
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
        setGpsMessage('Farmácias ordenadas da mais próxima para a mais distante de você.');
      },
      () => {
        setGpsStatus('denied_or_error');
        setGpsMessage(
          'Não foi possível usar o GPS agora. Sem problema: escolha seu bairro logo abaixo para filtrar as farmácias.',
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
      <header className="space-y-2 border-b-2 border-[var(--c-border-subtle)] pb-4">
        <h2
          id="credenciadas-heading"
          className="font-display text-2xl font-extrabold text-[var(--c-text)] sm:text-3xl"
        >
          Farmácias credenciadas ao Farmácia Popular em Cuiabá
        </h2>

        {/* Aviso obrigatório da Regra Inviolável #4 / DAS 6.3 */}
        <div
          role="note"
          className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-3 text-base font-bold text-[var(--c-text)]"
        >
          <p>{NORMATIVE_TEXTS.via2.PINO_E_CARTAO_FARMACIA}</p>
        </div>
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
            <option value="">Todos os bairros ({farmaciasCredenciadas.length})</option>
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

      {/* Mapa Dividido sob demanda (Tarefa 5 — MapLibre GL + PMTiles) */}
      <div data-testid="map-slot">
        {mapSlot ?? (
          <LazyEstablishmentMap
            estabelecimentos={listaExibida.map((item) => item.estabelecimento)}
            userCoords={userCoords}
            defaultOpen={false}
            toggleButtonLabelOpen="Ver farmácias credenciadas no mapa"
            toggleButtonLabelClose="Ocultar mapa das farmácias"
          />
        )}
      </div>

      {/* Lista acessível de farmácias credenciadas */}
      <div aria-live="polite" className="space-y-3">
        <p className="text-base font-bold text-[var(--c-text-2)]">
          Mostrando {listaExibida.length} farmácia(s) credenciada(s)
          {bairroSelecionado ? ` no bairro ${bairroSelecionado}` : ''}:
        </p>

        <ul className="space-y-3">
          {listaExibida.map(({ estabelecimento, distanciaKm }) => {
            const rotaUrl = gerarUrlRotaGoogleMaps(estabelecimento.coordenadas);
            const statusOp = estabelecimento.atributos_operacionais.status_funcionamento;

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

                  <span className="inline-flex items-center rounded border-2 border-[var(--c-free)] bg-[var(--c-free-tint)] px-2.5 py-0.5 text-sm font-bold text-[var(--c-free)]">
                    ✓ Credenciada ao Farmácia Popular
                  </span>
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

                <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--c-border-subtle)] pt-3">
                  <a
                    href={rotaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver rota no mapa para ${estabelecimento.nome_fantasia}`}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white"
                  >
                    <span>Ver rota para {estabelecimento.nome_fantasia}</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[var(--c-border-subtle)] pt-3 text-base text-[var(--c-text-2)]">
        <span>
          Fonte: Painel InfoMS (Ministério da Saúde) • Verificado em{' '}
          {formatIsoDatePTBR(meta.data_infoms)}
        </span>
        <a
          href={gerarUrlTransportePublicoOpcional()}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-bold text-[var(--c-brand)]"
        >
          Consultar horários de ônibus (pontoos.com.br)
        </a>
      </footer>
    </section>
  );
}
