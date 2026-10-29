'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  addProtocol,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { MapPinIcon, NavigationIcon, PhoneIcon } from '@/components/ui/Icons';
import { getEstablishmentTypeBadge } from '@/lib/establishmentsFilter';
import {
  type LatLng,
  calcularDistanciaKm,
  formatarDistancia,
  gerarUrlRotaGoogleMaps,
  hasValidMapCoordinates,
} from '@/lib/geoEngine';
import { NORMATIVE_TEXTS } from '@/lib/healthCopy';
import {
  CUIABA_VG_BOUNDS,
  CUIABA_VG_CENTER,
  DEFAULT_PMTILES_ARCHIVE_PATH,
  buildLocalMapStyle,
  checkWebGLSupport,
  projectCoordToSchematicPercent,
  registerPmtilesProtocol,
} from '@/lib/pmtilesProtocol';
import type { Estabelecimento } from '@/types/schema';

export interface EstablishmentMapProps {
  estabelecimentos: readonly Estabelecimento[];
  userCoords?: LatLng | null;
  pmtilesArchivePath?: string;
  initialSelectedId?: string;
}

type MapRenderMode = 'checking' | 'webgl_pmtiles' | 'schematic_fallback';

export default function EstablishmentMap({
  estabelecimentos,
  userCoords = null,
  pmtilesArchivePath = DEFAULT_PMTILES_ARCHIVE_PATH,
  initialSelectedId,
}: EstablishmentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const estabelecimentosNoMapa = useMemo(
    () => estabelecimentos.filter((e) => hasValidMapCoordinates(e)),
    [estabelecimentos],
  );

  const [renderMode, setRenderMode] = useState<MapRenderMode>('checking');
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedId ?? estabelecimentosNoMapa[0]?.id ?? '',
  );

  useEffect(() => {
    if (estabelecimentosNoMapa.length === 0) {
      setSelectedId('');
      return;
    }
    if (!estabelecimentosNoMapa.some((e) => e.id === selectedId)) {
      setSelectedId(estabelecimentosNoMapa[0]!.id);
    }
  }, [estabelecimentosNoMapa, selectedId]);

  const selectedEstablishment = useMemo(
    () =>
      estabelecimentosNoMapa.find((e) => e.id === selectedId) ??
      estabelecimentosNoMapa[0] ??
      null,
    [estabelecimentosNoMapa, selectedId],
  );

  useEffect(() => {
    let active = true;

    async function detectMapCapability() {
      if (!checkWebGLSupport()) {
        if (active) setRenderMode('schematic_fallback');
        return;
      }

      try {
        const res = await fetch(pmtilesArchivePath, {
          method: 'HEAD',
          cache: 'no-cache',
        });
        if (!active) return;

        const contentType = res.headers.get('content-type') ?? '';
        if (res.ok && !contentType.includes('text/html')) {
          setRenderMode('webgl_pmtiles');
        } else {
          setRenderMode('schematic_fallback');
        }
      } catch {
        if (active) setRenderMode('schematic_fallback');
      }
    }

    void detectMapCapability();

    return () => {
      active = false;
    };
  }, [pmtilesArchivePath]);

  useEffect(() => {
    if (renderMode !== 'webgl_pmtiles' || !mapContainerRef.current) {
      return;
    }

    try {
      const protocol = new Protocol();
      registerPmtilesProtocol({ addProtocol }, protocol);

      const styleSpec = buildLocalMapStyle(pmtilesArchivePath) as unknown as StyleSpecification;

      const map = new MapLibreMap({
        container: mapContainerRef.current,
        style: styleSpec,
        center: [CUIABA_VG_CENTER.lng, CUIABA_VG_CENTER.lat],
        zoom: 12,
        maxBounds: CUIABA_VG_BOUNDS,
        attributionControl: false,
        cooperativeGestures: true,
      });

      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

      map.on('error', () => {
        setRenderMode('schematic_fallback');
      });

      mapInstanceRef.current = map;

      return () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch {
      setRenderMode('schematic_fallback');
      return;
    }
  }, [renderMode, pmtilesArchivePath]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (renderMode !== 'webgl_pmtiles' || !map) {
      return;
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const est of estabelecimentosNoMapa) {
      const badge = getEstablishmentTypeBadge(est.tipo);
      const isSelected = est.id === selectedEstablishment?.id;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute(
        'aria-label',
        `${badge.fullLabel}: ${est.nome_fantasia} (${est.bairro})`,
      );
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.className = `inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border-2 px-2.5 py-1 font-display text-sm font-extrabold shadow-sm ${
        isSelected
          ? 'border-black bg-[var(--c-attn)] text-black ring-4 ring-black'
          : badge.isPharmacy
            ? 'border-white bg-[var(--c-free)] text-white'
            : 'border-white bg-[var(--c-brand)] text-white'
      }`;
      btn.textContent = badge.code;

      btn.addEventListener('click', () => {
        setSelectedId(est.id);
      });

      const marker = new Marker({ element: btn })
        .setLngLat([est.coordenadas.lng, est.coordenadas.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }

    if (selectedEstablishment) {
      map.panTo(
        [selectedEstablishment.coordenadas.lng, selectedEstablishment.coordenadas.lat],
        { duration: 220 },
      );
    }
  }, [renderMode, estabelecimentosNoMapa, selectedEstablishment]);

  const distanciaSelecionado = useMemo(() => {
    if (!userCoords || !selectedEstablishment) {
      return null;
    }
    return calcularDistanciaKm(userCoords, selectedEstablishment.coordenadas);
  }, [userCoords, selectedEstablishment]);

  return (
    <div className="space-y-4">
      {/* Quadro visual do mapa (WebGL PMTiles ou Mapa Esquemático Local) */}
      <div className="ui-card overflow-hidden">
        {/* Legenda clara com forma + sigla + cor (nunca só cor) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--c-border-subtle)] bg-[var(--c-surface)] px-4 py-2.5 text-sm font-bold text-[var(--c-text)]">
          <span>Toque em um pino para ver o endereço e traçar a rota:</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-[var(--r-chip)] bg-[var(--c-free)] px-2.5 py-0.5 text-white">
              [FP] Farmácia Popular
            </span>
            <span className="inline-flex items-center gap-1 rounded-[var(--r-chip)] bg-[var(--c-brand)] px-2.5 py-0.5 text-white">
              [UBS / POL / UPA] Rede Municipal
            </span>
          </div>
        </div>

        {renderMode === 'webgl_pmtiles' ? (
          <div
            ref={mapContainerRef}
            role="region"
            aria-label="Mapa de unidades de saúde e farmácias credenciadas em Cuiabá e Várzea Grande"
            className="h-[340px] w-full sm:h-[400px]"
          />
        ) : (
          <div
            role="region"
            aria-label="Mapa esquemático local de Cuiabá e Várzea Grande com pinos selecionáveis"
            className="relative h-[340px] w-full select-none overflow-hidden bg-[#E8EEF8] sm:h-[380px]"
          >
            {/* Grade esquemática de referência visual */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
                backgroundSize: '48px 48px',
              }}
            />

            {/* Faixa esquemática representando o Rio Cuiabá dividindo Cuiabá e Várzea Grande */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 top-1/2 h-4 -rotate-6 bg-[#93C5FD]/60"
            />

            <div className="pointer-events-none absolute left-3 top-2.5 rounded-[var(--r-chip)] border border-[var(--c-border)] bg-[var(--c-surface)]/95 px-3 py-1 text-xs font-bold text-[var(--c-text)] shadow-2xs">
              Recorte local Cuiabá / Várzea Grande (modo leve offline)
            </div>

            {/* Pinos clicáveis acessíveis (>= 48x48px) posicionados dentro da GEO_BBOX */}
            {estabelecimentosNoMapa.map((est) => {
              const pos = projectCoordToSchematicPercent(est.coordenadas);
              const badge = getEstablishmentTypeBadge(est.tipo);
              const isSelected = est.id === selectedEstablishment?.id;

              return (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setSelectedId(est.id)}
                  aria-pressed={isSelected}
                  aria-label={`Selecionar ${badge.fullLabel}: ${est.nome_fantasia} no bairro ${est.bairro}`}
                  style={{
                    left: `${pos.xPercent}%`,
                    top: `${pos.yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute inline-flex min-h-[48px] min-w-[48px] items-center justify-center gap-1 rounded-[var(--r-chip)] border-2 px-3 py-1 font-display text-sm font-extrabold shadow-sm transition-transform ${
                    isSelected
                      ? 'z-20 scale-110 border-black bg-[var(--c-attn)] text-black ring-4 ring-black'
                      : badge.isPharmacy
                        ? 'z-10 border-white bg-[var(--c-free)] text-white hover:scale-105'
                        : 'z-10 border-white bg-[var(--c-brand)] text-white hover:scale-105'
                  }`}
                >
                  <span>[{badge.code}]</span>
                  <span className="max-w-[120px] truncate">{est.nome_fantasia}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Atribuição obrigatória (DAS Seção 9 / busca-mapa-pmtiles) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)]/70 px-4 py-2 text-sm text-[var(--c-text-2)]">
          <span>Atribuição: © OpenStreetMap contributors • Basemap Protomaps (PMTiles local)</span>
          <span>A lista completa abaixo tem todas as informações do mapa.</span>
        </div>
      </div>

      {/* Ficha acessível do pino selecionado */}
      {selectedEstablishment && (
        <div
          role="region"
          aria-live="polite"
          aria-label={`Detalhes do pino selecionado: ${selectedEstablishment.nome_fantasia}`}
          className="ui-card-elevated p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="inline-block rounded-[var(--r-chip)] bg-[var(--c-bg-soft)] px-3 py-0.5 font-display text-sm font-bold text-[var(--c-text)]">
                Pino selecionado: [{getEstablishmentTypeBadge(selectedEstablishment.tipo).code}]{' '}
                {getEstablishmentTypeBadge(selectedEstablishment.tipo).fullLabel}
              </span>
              <h3 className="mt-1.5 font-display text-2xl font-extrabold text-[var(--c-text)]">
                {selectedEstablishment.nome_fantasia}
              </h3>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-base font-bold text-[var(--c-brand)]">
                <MapPinIcon className="h-4 w-4" />
                <span>
                  Bairro: {selectedEstablishment.bairro}
                  {distanciaSelecionado !== null &&
                    ` • Aprox. ${formatarDistancia(distanciaSelecionado)}`}
                </span>
              </p>
            </div>
          </div>

          {/* Regra inviolável #4: Pino de farmácia credenciada SEMPRE exibe o texto normativo literal */}
          {selectedEstablishment.tipo === 'FARMACIA_POPULAR' && (
            <p className="mt-3 rounded-[var(--r-button)] border border-[var(--c-free)]/25 bg-[var(--c-free-tint)] px-3.5 py-2.5 text-base font-bold text-[var(--c-text)]">
              {NORMATIVE_TEXTS.via2.PINO_E_CARTAO_FARMACIA}
            </p>
          )}

          <p className="mt-3 text-base text-[var(--c-text)]">
            <strong>Endereço:</strong> {selectedEstablishment.endereco_completo}
          </p>

          {selectedEstablishment.telefone && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-base text-[var(--c-text)]">
              <PhoneIcon className="h-4 w-4 text-[var(--c-brand)]" />
              <span>
                <strong>Telefone:</strong> {selectedEstablishment.telefone}
              </span>
            </p>
          )}

          <div className="mt-4 space-y-2 border-t border-[var(--c-border-subtle)] pt-3.5">
            {!selectedEstablishment.coordenadas.auditado_manualmente && (
              <p className="text-sm font-bold text-[var(--c-text-2)]">
                Localização aproximada. Confira o endereço.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <a
                href={gerarUrlRotaGoogleMaps(selectedEstablishment.coordenadas, 'transit')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-lg font-bold text-white shadow-xs transition-opacity hover:opacity-95"
              >
                <NavigationIcon className="h-4 w-4" />
                <span>Ver rota para {selectedEstablishment.nome_fantasia} (ônibus/carro)</span>
              </a>

              <a
                href={gerarUrlRotaGoogleMaps(selectedEstablishment.coordenadas, 'walking')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2 font-display text-lg font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]"
              >
                <span>Ver rota a pé</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
