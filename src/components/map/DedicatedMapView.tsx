'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  addProtocol,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol, PMTiles } from 'pmtiles';
import { useAccessibility } from '@/components/layout/AccessibilityProvider';
import { MapPinSvg, renderMapPinSvgHtml } from '@/components/map/MapPin';
import { OfflineMapDownload } from '@/components/map/OfflineMapDownload';
import { Icon } from '@/components/ui/Icon';
import { getVisibleLandmarks } from '@/lib/cuiabaLandmarks';
import {
  type EstablishmentFilterType,
  filterEstablishments,
  getEstablishmentTypeBadge,
} from '@/lib/establishmentsFilter';
import {
  type LatLng,
  calcularDistanciaKm,
  formatarDistancia,
  gerarUrlRotaGoogleMaps,
  hasValidMapCoordinates,
  listarBairrosUnicos,
  ordenarEstabelecimentosPorBairro,
  ordenarListaComOuSemDistancia,
} from '@/lib/geoEngine';
import { NORMATIVE_TEXTS } from '@/lib/healthCopy';
import { clusterEstablishments } from '@/lib/mapClusters';
import {
  CUIABA_VG_BOUNDS,
  CUIABA_VG_CENTER,
  DEFAULT_PMTILES_ARCHIVE_PATH,
  buildLocalMapStyle,
  checkWebGLSupport,
  getPmtilesFullUrl,
  projectCoordToSchematicPercent,
  registerPmtilesProtocol,
} from '@/lib/pmtilesProtocol';
import type { Estabelecimento, MetaDados } from '@/types/schema';

export interface DedicatedMapViewProps {
  estabelecimentos: readonly Estabelecimento[];
  meta?: MetaDados;
  pmtilesArchivePath?: string;
}

type MapRenderMode = 'checking' | 'webgl_pmtiles' | 'schematic_fallback';
type GpsStatus = 'idle' | 'loading' | 'granted' | 'denied_or_error';
type BottomSheetState = 'collapsed' | 'half' | 'full';

const FILTER_PILLS: Array<{ type: EstablishmentFilterType; label: string }> = [
  { type: 'TODOS', label: 'Todos' },
  { type: 'FARMACIA_POPULAR', label: 'Farmácia Popular' },
  { type: 'UPA', label: 'UPAs 24h' },
  { type: 'POLICLINICA', label: 'Policlínicas' },
  { type: 'UBS', label: 'Postos UBS' },
];

export function DedicatedMapView({
  estabelecimentos,
  meta: _meta,
  pmtilesArchivePath = DEFAULT_PMTILES_ARCHIVE_PATH,
}: DedicatedMapViewProps) {
  const { isDark } = useAccessibility();
  const effectiveTheme = isDark ? 'dark' : 'light';

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const landmarksRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);

  const [renderMode, setRenderMode] = useState<MapRenderMode>('checking');
  const [activeFilter, setActiveFilter] = useState<EstablishmentFilterType>('TODOS');
  const [bairroFiltro, setBairroFiltro] = useState<string>('');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetState, setSheetState] = useState<BottomSheetState>('collapsed');
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);

  // Filtragem dos estabelecimentos válidos
  const estabelecimentosValidos = useMemo(
    () => estabelecimentos.filter((e) => hasValidMapCoordinates(e)),
    [estabelecimentos],
  );

  // Lista de bairros únicos para o seletor da gaveta
  const bairrosDisponiveis = useMemo(
    () => listarBairrosUnicos(estabelecimentosValidos),
    [estabelecimentosValidos],
  );

  // Filtragem por tipo, bairro e busca textual
  const estabelecimentosFiltrados = useMemo(
    () =>
      filterEstablishments(estabelecimentosValidos, {
        tipo: activeFilter,
        bairro: bairroFiltro,
        query: buscaTexto,
      }),
    [estabelecimentosValidos, activeFilter, bairroFiltro, buscaTexto],
  );

  // Lista ordenada para exibição na gaveta (por distância se GPS ativo, ou por bairro)
  const listaOrdenadaGaveta = useMemo(() => {
    const porBairro = ordenarEstabelecimentosPorBairro(estabelecimentosFiltrados);
    return ordenarListaComOuSemDistancia(porBairro, userCoords);
  }, [estabelecimentosFiltrados, userCoords]);

  // Estabelecimento selecionado atualmente para o Bottom Card
  const selectedEstablishment = useMemo(
    () => estabelecimentosValidos.find((e) => e.id === selectedId) ?? null,
    [estabelecimentosValidos, selectedId],
  );

  // Contagem por tipo para os chips superiores
  const countsByType = useMemo(() => {
    return {
      TODOS: estabelecimentosValidos.length,
      FARMACIA_POPULAR: estabelecimentosValidos.filter((e) => e.tipo === 'FARMACIA_POPULAR').length,
      UPA: estabelecimentosValidos.filter((e) => e.tipo === 'UPA').length,
      POLICLINICA: estabelecimentosValidos.filter((e) => e.tipo === 'POLICLINICA').length,
      UBS: estabelecimentosValidos.filter((e) => e.tipo === 'UBS').length,
    };
  }, [estabelecimentosValidos]);

  // Agrupamento dinâmico de pinos pelo zoom
  const clusteredItems = useMemo(
    () => clusterEstablishments(estabelecimentosFiltrados, currentZoom),
    [estabelecimentosFiltrados, currentZoom],
  );

  // Checagem de WebGL
  useEffect(() => {
    if (!checkWebGLSupport()) {
      setRenderMode('schematic_fallback');
      return;
    }
    setRenderMode('webgl_pmtiles');
  }, []);

  // Leitura inicial de foco do sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const pendingFocusId = sessionStorage.getItem('ondepego_mapa_foco_id');
      if (pendingFocusId) {
        const found = estabelecimentosValidos.find((e) => e.id === pendingFocusId);
        if (found) {
          setSelectedId(found.id);
          sessionStorage.removeItem('ondepego_mapa_foco_id');

          const map = mapInstanceRef.current;
          if (map) {
            map.flyTo({
              center: [found.coordenadas.lng, found.coordenadas.lat],
              zoom: 16,
              duration: 600,
              padding: { top: 90, bottom: 260, left: 24, right: 24 },
            });
          }
        }
      }
    } catch {
      // sessionStorage indisponível
    }
  }, [estabelecimentosValidos]);

  // Inicialização do MapLibre GL
  useEffect(() => {
    if (renderMode !== 'webgl_pmtiles' || !mapContainerRef.current) {
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const fullWorkerUrl = new URL('/maplibre-gl-worker.mjs', window.location.origin).href;
        setWorkerUrl(fullWorkerUrl);
      }

      const fullArchiveUrl = getPmtilesFullUrl(pmtilesArchivePath);
      const protocol = new Protocol();
      const pmtilesInstance = new PMTiles(fullArchiveUrl);
      protocol.add(pmtilesInstance);
      registerPmtilesProtocol({ addProtocol }, protocol);

      const styleSpec = buildLocalMapStyle(
        pmtilesArchivePath,
        effectiveTheme,
      ) as unknown as StyleSpecification;

      const initialCenter: [number, number] = selectedEstablishment
        ? [selectedEstablishment.coordenadas.lng, selectedEstablishment.coordenadas.lat]
        : [CUIABA_VG_CENTER.lng, CUIABA_VG_CENTER.lat];

      const initialZoom = selectedEstablishment ? 15 : 12;

      const map = new MapLibreMap({
        container: mapContainerRef.current,
        style: styleSpec,
        center: initialCenter,
        zoom: initialZoom,
        maxBounds: CUIABA_VG_BOUNDS,
        attributionControl: false,
        dragPan: true,
        touchZoomRotate: true,
        cooperativeGestures: false,
      });

      map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');

      if (typeof window !== 'undefined') {
        (window as any)._mapInstance = map;
      }

      map.on('load', () => {
        setCurrentZoom(map.getZoom());
      });

      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      map.on('moveend', () => {
        setCurrentZoom(map.getZoom());
      });

      map.on('error', (err: any) => {
        console.error('MAPLIBRE_ON_ERROR:', err?.error?.message || err?.message || err?.error || err);
        setRenderMode('schematic_fallback');
      });

      mapInstanceRef.current = map;

      return () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        landmarksRef.current.forEach((m) => m.remove());
        landmarksRef.current = [];
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
          userMarkerRef.current = null;
        }
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch {
      setRenderMode('schematic_fallback');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderMode, pmtilesArchivePath]);

  // Atualização do estilo do mapa quando o tema muda
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && renderMode === 'webgl_pmtiles') {
      try {
        const nextStyle = buildLocalMapStyle(
          pmtilesArchivePath,
          effectiveTheme,
        ) as unknown as StyleSpecification;
        map.setStyle(nextStyle);
      } catch {
        // Fallback silencioso
      }
    }
  }, [effectiveTheme, pmtilesArchivePath, renderMode]);

  // Atualização do marcador do usuário (GPS)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (renderMode !== 'webgl_pmtiles' || !map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userCoords) {
      const el = document.createElement('div');
      el.className = 'relative flex h-6 w-6 items-center justify-center';
      el.setAttribute('aria-label', 'Sua localização atual');
      el.innerHTML = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
      `;

      userMarkerRef.current = new Marker({ element: el })
        .setLngLat([userCoords.lng, userCoords.lat])
        .addTo(map);

      map.flyTo({
        center: [userCoords.lng, userCoords.lat],
        zoom: 14,
        duration: 500,
      });
    }
  }, [renderMode, userCoords]);

  // Renderização e atualização dos rótulos de bairros e eixos (0 KB de rede externa)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (renderMode !== 'webgl_pmtiles' || !map) return;

    landmarksRef.current.forEach((m) => m.remove());
    landmarksRef.current = [];

    const visibleLandmarks = getVisibleLandmarks(currentZoom);
    for (const landmark of visibleLandmarks) {
      const el = document.createElement('div');
      el.className = 'landmark-label-container';
      el.innerHTML = `
        <div class="landmark-label-visual text-[11px] font-black uppercase tracking-wider px-1.5 py-0.5 text-slate-700 dark:text-slate-200 [text-shadow:_0_1px_3px_rgb(255_255_255_/_90%),_0_0_8px_rgb(255_255_255_/_80%)] dark:[text-shadow:_0_1px_3px_rgb(15_23_42_/_90%),_0_0_8px_rgb(15_23_42_/_80%)]">
          ${landmark.nome}
        </div>
      `;

      const marker = new Marker({ element: el, anchor: 'center' })
        .setLngLat([landmark.coordenadas.lng, landmark.coordenadas.lat])
        .addTo(map);

      landmarksRef.current.push(marker);
    }
  }, [renderMode, currentZoom]);

  // Renderização e atualização dos marcadores e clusters
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (renderMode !== 'webgl_pmtiles' || !map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const markerItem of clusteredItems) {
      if (markerItem.type === 'single') {
        const est = markerItem.item;
        const badge = getEstablishmentTypeBadge(est.tipo);
        const isSelected = est.id === selectedEstablishment?.id;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', `${badge.fullLabel}: ${est.nome_fantasia} (${est.bairro})`);
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        btn.className = `map-pin-container ${isSelected ? 'map-pin-selected' : ''}`;
        btn.innerHTML = `<div class="map-pin-visual">${renderMapPinSvgHtml({
          code: badge.code,
          tipo: est.tipo,
          isSelected,
        })}</div>`;

        btn.addEventListener('click', () => {
          setSelectedId(est.id);
          setSheetState('collapsed');
          map.flyTo({
            center: [est.coordenadas.lng, est.coordenadas.lat],
            zoom: 15.5,
            duration: 400,
            padding: { top: 90, bottom: 260, left: 24, right: 24 },
          });
        });

        const marker = new Marker({ element: btn, anchor: 'bottom' })
          .setLngLat([est.coordenadas.lng, est.coordenadas.lat])
          .addTo(map);

        markersRef.current.push(marker);
      } else {
        // Cluster Point
        const cluster = markerItem;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute(
          'aria-label',
          `Agrupamento com ${cluster.count} unidades em ${cluster.bairroPredominante}. Toque para aproximar`,
        );
        btn.className = 'cluster-pin-container';
        btn.innerHTML = `
          <div class="cluster-pin-visual">
            <div class="cluster-badge">
              ${cluster.count}
            </div>
          </div>
        `;

        btn.addEventListener('click', () => {
          const nextZoom = Math.max(currentZoom + 2, 13.6);
          map.flyTo({
            center: [cluster.center.lng, cluster.center.lat],
            zoom: nextZoom,
            duration: 450,
            padding: { top: 90, bottom: 260, left: 24, right: 24 },
          });
        });

        const marker = new Marker({ element: btn, anchor: 'center' })
          .setLngLat([cluster.center.lng, cluster.center.lat])
          .addTo(map);

        markersRef.current.push(marker);
      }
    }
  }, [renderMode, clusteredItems, selectedEstablishment, currentZoom]);

  // Solicitar GPS
  const handleRequestGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('denied_or_error');
      return;
    }

    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsStatus('granted');
      },
      () => {
        setGpsStatus('denied_or_error');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const distanciaSelecionado = useMemo(() => {
    if (!userCoords || !selectedEstablishment) return null;
    return calcularDistanciaKm(userCoords, selectedEstablishment.coordenadas);
  }, [userCoords, selectedEstablishment]);

  // Foco no mapa ao clicar em "Ver no mapa" dentro da gaveta
  const handleFocusOnMap = (est: Estabelecimento) => {
    setSelectedId(est.id);
    setSheetState('collapsed');
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo({
        center: [est.coordenadas.lng, est.coordenadas.lat],
        zoom: 16,
        duration: 450,
        padding: { top: 90, bottom: 260, left: 24, right: 24 },
      });
    }
  };

  return (
    <div className="relative h-[calc(100dvh-64px-74px)] w-full overflow-hidden bg-[var(--c-bg)]">
      {/* 1. Barra Flutuante Superior: Filtros com backdrop blur */}
      <div className="absolute left-0 right-0 top-3 z-20 flex items-center gap-2 overflow-x-auto px-3 py-1 no-scrollbar">
        {FILTER_PILLS.map((pill) => {
          const isCurrent = activeFilter === pill.type;
          const count = countsByType[pill.type];
          return (
            <button
              key={pill.type}
              type="button"
              onClick={() => setActiveFilter(pill.type)}
              className={`ui-pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-xs backdrop-blur-md transition-all ${
                isCurrent
                  ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white shadow-sm'
                  : 'border-[var(--c-border)] bg-[var(--c-surface)]/85 text-[var(--c-text)] hover:bg-[var(--c-surface)]'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] font-black ${
                  isCurrent
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--c-bg-soft)] text-[var(--c-text-2)]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Botão GPS */}
        <button
          type="button"
          onClick={handleRequestGps}
          disabled={gpsStatus === 'loading'}
          aria-label="Perto de mim (GPS)"
          className={`ui-pressable inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-bold shadow-xs backdrop-blur-md transition-all ${
            gpsStatus === 'granted'
              ? 'border-[var(--c-free)] bg-[var(--c-free)] text-white'
              : 'border-[var(--c-border)] bg-[var(--c-surface)]/85 text-[var(--c-text)] hover:bg-[var(--c-surface)]'
          }`}
        >
          <Icon name="pin" className="h-3.5 w-3.5" />
          <span>
            {gpsStatus === 'loading'
              ? 'GPS...'
              : gpsStatus === 'granted'
                ? 'Perto'
                : 'Perto de mim'}
          </span>
        </button>

        {/* Botão Offline discreto */}
        <button
          type="button"
          onClick={() => setShowOfflineDialog(true)}
          aria-label="Baixar mapa offline"
          className="ui-pressable inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)]/85 px-2.5 text-xs font-bold text-[var(--c-text)] shadow-xs backdrop-blur-md hover:bg-[var(--c-surface)]"
        >
          <Icon name="download" className="h-3.5 w-3.5" />
          <span>Offline</span>
        </button>
      </div>

      {/* 2. Canvas do Mapa (WebGL PMTiles ou Fallback Esquemático) */}
      {renderMode === 'webgl_pmtiles' ? (
        <div
          ref={mapContainerRef}
          role="region"
          aria-label="Mapa interativo de Cuiabá e Várzea Grande"
          style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
          className="h-full w-full"
        />
      ) : (
        <div
          role="region"
          aria-label="Mapa esquemático local de Cuiabá e Várzea Grande"
          className="relative h-full w-full select-none overflow-hidden bg-[#E8EEF8]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-1/2 h-4 -rotate-6 bg-[#93C5FD]/60"
          />

          {estabelecimentosFiltrados.map((est) => {
            const pos = projectCoordToSchematicPercent(est.coordenadas);
            const badge = getEstablishmentTypeBadge(est.tipo);
            const isSelected = est.id === selectedEstablishment?.id;

            return (
              <button
                key={est.id}
                type="button"
                onClick={() => {
                  setSelectedId(est.id);
                  setSheetState('collapsed');
                }}
                aria-pressed={isSelected}
                aria-label={`Selecionar ${badge.fullLabel}: ${est.nome_fantasia}`}
                style={{
                  left: `${pos.xPercent}%`,
                  top: `${pos.yPercent}%`,
                }}
                className={`map-pin-container absolute -translate-x-1/2 -translate-y-full ${
                  isSelected ? 'map-pin-selected' : ''
                }`}
              >
                <div className="map-pin-visual">
                  <MapPinSvg
                    code={badge.code}
                    tipo={est.tipo}
                    isSelected={isSelected}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Rodapé discreto com atribuição */}
      <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-md bg-[var(--c-surface)]/80 px-2 py-0.5 text-[10px] text-[var(--c-text-2)] backdrop-blur-xs">
        © OpenStreetMap • Protomaps
      </div>

      {/* 4. Bottom Card deslizante ao selecionar um pino individual */}
      {selectedEstablishment && sheetState === 'collapsed' && (
        <div
          role="region"
          aria-live="polite"
          aria-label={`Detalhes de ${selectedEstablishment.nome_fantasia}`}
          className="absolute bottom-2 left-2 right-2 z-30 max-h-[50vh] overflow-y-auto rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/95 p-4 shadow-xl backdrop-blur-md transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black text-white ${
                    getEstablishmentTypeBadge(selectedEstablishment.tipo).isPharmacy
                      ? 'bg-[var(--c-free)]'
                      : 'bg-[var(--c-brand)]'
                  }`}
                >
                  [{getEstablishmentTypeBadge(selectedEstablishment.tipo).code}]{' '}
                  {getEstablishmentTypeBadge(selectedEstablishment.tipo).shortLabel}
                </span>

                {distanciaSelecionado !== null && (
                  <span className="text-xs font-bold text-[var(--c-brand)]">
                    Aprox. {formatarDistancia(distanciaSelecionado)} de você
                  </span>
                )}
              </div>

              <h2 className="font-display text-lg font-black text-[var(--c-text)]">
                {selectedEstablishment.nome_fantasia}
              </h2>
              <p className="text-xs text-[var(--c-text-2)]">
                <strong>Bairro:</strong> {selectedEstablishment.bairro} •{' '}
                {selectedEstablishment.endereco_completo}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Fechar detalhes"
              className="ui-pressable inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] text-[var(--c-text-2)] hover:text-[var(--c-text)]"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>

          {/* Regra inviolável #4: Pino de farmácia credenciada exibe texto normativo literal */}
          {selectedEstablishment.tipo === 'FARMACIA_POPULAR' && (
            <p className="mt-2.5 rounded-lg border border-[var(--c-free)]/20 bg-[var(--c-free-tint)] p-2 text-xs font-bold text-[var(--c-text)]">
              {NORMATIVE_TEXTS.via2.PINO_E_CARTAO_FARMACIA}
            </p>
          )}

          {/* Botões de Ação */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--c-border-subtle)] pt-2.5">
            {selectedEstablishment.telefone && (
              <a
                href={`tel:${selectedEstablishment.telefone.replace(/\D/g, '')}`}
                className="ui-pressable inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] px-3 text-xs font-bold text-[var(--c-text)] shadow-2xs hover:bg-[var(--c-bg-soft)]"
              >
                <Icon name="phone" className="h-3.5 w-3.5 text-[var(--c-brand)]" />
                <span>Ligar</span>
              </a>
            )}

            <a
              href={gerarUrlRotaGoogleMaps(selectedEstablishment.coordenadas, 'transit', {
                nomeFantasia: selectedEstablishment.nome_fantasia,
                enderecoCompleto: selectedEstablishment.endereco_completo,
                bairro: selectedEstablishment.bairro,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-pressable inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--c-brand)] px-4 text-xs font-bold text-white shadow-xs hover:opacity-95"
            >
              <Icon name="pin" className="h-3.5 w-3.5" />
              <span>Ver rota (Maps)</span>
            </a>
          </div>
        </div>
      )}

      {/* 5. Gaveta Deslizante (Bottom Sheet CSS Nativo com 3 Alturas: collapsed, half, full) */}
      {(!selectedEstablishment || sheetState !== 'collapsed') && (
        <aside
          aria-label="Lista de estabelecimentos no mapa"
          className={`absolute bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl border-t border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xl backdrop-blur-md transition-all duration-300 ease-out ${
            sheetState === 'collapsed'
              ? 'h-16 border-x'
              : sheetState === 'half'
                ? 'h-[50dvh]'
                : 'h-[85dvh]'
          }`}
        >
          {/* Alça visual de toque (Drag handle) */}
          <div
            className="cursor-pointer py-1.5"
            onClick={() => {
              if (sheetState === 'collapsed') setSheetState('half');
              else if (sheetState === 'half') setSheetState('full');
              else setSheetState('collapsed');
            }}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* Cabeçalho da Gaveta */}
          {sheetState === 'collapsed' ? (
            <div className="flex flex-1 items-center justify-between px-4 pb-2">
              <button
                type="button"
                onClick={() => setSheetState('half')}
                aria-label="Abrir lista de unidades"
                className="ui-pressable flex flex-1 items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <Icon name="list" className="h-5 w-5 text-[var(--c-brand)]" />
                  <span className="font-display text-sm font-bold text-[var(--c-text)]">
                    Ver lista de locais ({estabelecimentosFiltrados.length} encontrados)
                  </span>
                </div>
                <Icon
                  name="chev"
                  className="h-4 w-4 -rotate-90 text-[var(--c-text-2)] transition-transform"
                />
              </button>
            </div>
          ) : (
            <div className="flex flex-col border-b border-[var(--c-border-subtle)] px-4 pb-3">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Icon name="list" className="h-5 w-5 text-[var(--c-brand)]" />
                  <h2 className="font-display text-base font-bold text-[var(--c-text)]">
                    Locais encontrados ({estabelecimentosFiltrados.length})
                  </h2>
                </div>

                <div className="flex items-center gap-1">
                  {sheetState === 'half' ? (
                    <button
                      type="button"
                      onClick={() => setSheetState('full')}
                      aria-label="Expandir para tela cheia"
                      className="ui-pressable inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--c-bg-soft)] text-[var(--c-text-2)]"
                    >
                      <Icon name="chev" className="h-4 w-4 -rotate-90" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSheetState('half')}
                      aria-label="Reduzir para meia tela"
                      className="ui-pressable inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--c-bg-soft)] text-[var(--c-text-2)]"
                    >
                      <Icon name="chev" className="h-4 w-4 rotate-90" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSheetState('collapsed')}
                    aria-label="Recolher lista"
                    className="ui-pressable inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--c-bg-soft)] text-[var(--c-text-2)]"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filtros rápidos dentro da gaveta */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="search"
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  placeholder="Buscar por nome, bairro ou rua..."
                  aria-label="Buscar unidade por nome, bairro ou rua"
                  className="h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] px-3 text-xs font-medium text-[var(--c-text)] placeholder-[var(--c-text-2)] focus:border-[var(--c-brand)] focus:outline-hidden"
                />

                <select
                  value={bairroFiltro}
                  onChange={(e) => setBairroFiltro(e.target.value)}
                  aria-label="Filtrar unidades por bairro"
                  className="h-10 w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] px-3 text-xs font-bold text-[var(--c-text)] focus:border-[var(--c-brand)] focus:outline-hidden"
                >
                  <option value="">Todos os bairros ({bairrosDisponiveis.length})</option>
                  {bairrosDisponiveis.map((bairro) => (
                    <option key={bairro} value={bairro}>
                      {bairro}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Conteúdo com rolagem da lista quando expandida */}
          {sheetState !== 'collapsed' && (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {listaOrdenadaGaveta.length === 0 ? (
                <div className="py-8 text-center text-sm text-[var(--c-text-2)]">
                  Nenhum estabelecimento encontrado com os filtros atuais.
                </div>
              ) : (
                listaOrdenadaGaveta.map(({ estabelecimento: est, distanciaKm }) => {
                  const badge = getEstablishmentTypeBadge(est.tipo);
                  const isSelected = est.id === selectedEstablishment?.id;

                  return (
                    <article
                      key={est.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        isSelected
                          ? 'border-[var(--c-brand)] bg-[var(--c-brand)]/5'
                          : 'border-[var(--c-border)] bg-[var(--c-surface)]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black text-white ${
                            badge.isPharmacy ? 'bg-[var(--c-free)]' : 'bg-[var(--c-brand)]'
                          }`}
                        >
                          [{badge.code}] {badge.shortLabel}
                        </span>

                        {distanciaKm !== null && (
                          <span className="text-xs font-bold text-[var(--c-brand)]">
                            Aprox. {formatarDistancia(distanciaKm)}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 font-display text-sm font-bold text-[var(--c-text)]">
                        {est.nome_fantasia}
                      </h3>

                      <p className="mt-0.5 text-xs text-[var(--c-text-2)]">
                        <strong>Bairro:</strong> {est.bairro} • {est.endereco_completo}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[var(--c-border-subtle)] pt-2">
                        <button
                          type="button"
                          onClick={() => handleFocusOnMap(est)}
                          className="ui-pressable inline-flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--c-brand)] px-2.5 text-xs font-bold text-white shadow-2xs hover:opacity-95"
                        >
                          <Icon name="pin" className="h-3.5 w-3.5" />
                          <span>Ver no mapa</span>
                        </button>

                        {est.telefone && (
                          <a
                            href={`tel:${est.telefone.replace(/\D/g, '')}`}
                            className="ui-pressable inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 text-xs font-bold text-[var(--c-text)] shadow-2xs hover:bg-[var(--c-bg-soft)]"
                          >
                            <Icon name="phone" className="h-3.5 w-3.5 text-[var(--c-brand)]" />
                            <span>Ligar</span>
                          </a>
                        )}

                        <a
                          href={gerarUrlRotaGoogleMaps(est.coordenadas, 'transit', {
                            nomeFantasia: est.nome_fantasia,
                            enderecoCompleto: est.endereco_completo,
                            bairro: est.bairro,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ui-pressable inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 text-xs font-bold text-[var(--c-text)] shadow-2xs hover:bg-[var(--c-bg-soft)]"
                        >
                          <Icon name="pin" className="h-3.5 w-3.5" />
                          <span>Rota</span>
                        </a>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </aside>
      )}

      {/* 6. Modal / Dialog para download offline */}
      {showOfflineDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-display text-lg font-bold text-[var(--c-text)]">
                Mapa Offline de Cuiabá e VG
              </h3>
              <button
                type="button"
                onClick={() => setShowOfflineDialog(false)}
                aria-label="Fechar"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--c-text-2)] hover:bg-[var(--c-bg-soft)]"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-[var(--c-text-2)]">
              Baixe o mapa completo (aproximadamente 25 MB) para navegar pelas ruas e encontrar
              farmácias mesmo se você estiver sem internet no celular.
            </p>
            <OfflineMapDownload />
          </div>
        </div>
      )}
    </div>
  );
}
