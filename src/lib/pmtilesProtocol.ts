import { GEO_BBOX } from '@/types/schema';

/**
 * Fonte única do caminho do arquivo `.pmtiles` em todo o app (usado pelo estilo MapLibre,
 * pelo gerenciador de download offline `offlineMapManager` e pelo componente `OfflineMapDownload`).
 *
 * Para atualizar o recorte de mapa no futuro:
 * 1. Gere o novo arquivo com data no nome (ex.: `/tiles/cuiaba-vg-20261101.pmtiles`);
 * 2. Atualize esta constante `DEFAULT_PMTILES_ARCHIVE_PATH`;
 * 3. Remova o arquivo antigo de `public/tiles/` (veja `scripts/extract-tiles.md`).
 */
export const DEFAULT_PMTILES_ARCHIVE_PATH = '/tiles/cuiaba-vg.pmtiles';

export const CUIABA_VG_CENTER = {
  lat: -15.6014,
  lng: -56.0979,
} as const;

export const CUIABA_VG_BOUNDS: [[number, number], [number, number]] = [
  [GEO_BBOX.minLng, GEO_BBOX.minLat],
  [GEO_BBOX.maxLng, GEO_BBOX.maxLat],
];

export interface LocalVectorMapStyle {
  version: 8;
  name: string;
  sources: {
    protomaps: {
      type: 'vector';
      url: string;
      attribution: string;
    };
  };
  layers: Array<Record<string, unknown>>;
}

/**
 * Resolve o caminho relativo do arquivo `.pmtiles` para uma URL absoluta quando executado no navegador,
 * garantindo compatibilidade uniforme com o parser do protocolo PMTiles e workers.
 */
export function getPmtilesFullUrl(
  archivePath: string = DEFAULT_PMTILES_ARCHIVE_PATH,
): string {
  const cleanPath = archivePath.trim() || DEFAULT_PMTILES_ARCHIVE_PATH;
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  if (cleanPath.startsWith('pmtiles://')) {
    return cleanPath.replace(/^pmtiles:\/\//, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      return new URL(cleanPath, window.location.origin).href;
    } catch {
      return cleanPath;
    }
  }
  return cleanPath;
}

/**
 * Constrói um objeto de estilo MapLibre GL (v8) 100% local a partir de um arquivo PMTiles.
 * Cumpre estritamente os ADRs 06 e 09:
 * - ZERO chamadas a `tile.openstreetmap.org`, `protomaps.github.io` ou CDNs externas.
 * - Sem `glyphs` ou `sprite` remotos: usa camadas geométricas vetoriais limpas
 *   e deixa os rótulos/marcadores das unidades para o HTML acessível com as fontes autohospedadas.
 */
export function buildLocalMapStyle(
  pmtilesArchivePath: string = DEFAULT_PMTILES_ARCHIVE_PATH,
  theme: 'light' | 'dark' = 'light',
): LocalVectorMapStyle {
  const fullUrl = getPmtilesFullUrl(pmtilesArchivePath);
  const pmtilesUrl = `pmtiles://${fullUrl}`;
  const isDark = theme === 'dark';

  return {
    version: 8,
    name: `Onde Pego — Cuiabá e Várzea Grande (Local PMTiles ${theme})`,
    sources: {
      protomaps: {
        type: 'vector',
        url: pmtilesUrl,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': isDark ? '#0B111E' : '#F3F6F9',
        },
      },
      {
        id: 'earth',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'earth',
        paint: {
          'fill-color': isDark ? '#0F172A' : '#F8FAFC',
        },
      },
      {
        id: 'landuse-park',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'landuse',
        filter: [
          'in',
          'kind',
          'park',
          'forest',
          'grass',
          'wood',
          'scrub',
          'garden',
          'recreation_ground',
          'wetland',
          'meadow',
          'pitch',
        ],
        paint: {
          'fill-color': isDark ? '#062E22' : '#D6E8D5',
          'fill-opacity': isDark ? 0.8 : 0.75,
        },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'water',
        paint: {
          'fill-color': isDark ? '#1E3A5F' : '#93C5FD',
          'fill-opacity': 0.95,
        },
      },
      {
        id: 'water-line',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'water',
        paint: {
          'line-color': isDark ? '#2563EB' : '#60A5FA',
          'line-width': 1.5,
        },
      },
      {
        id: 'buildings',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'buildings',
        minzoom: 13,
        paint: {
          'fill-color': isDark ? '#1E293B' : '#E2E8F0',
          'fill-opacity': 0.75,
        },
      },
      {
        id: 'boundaries',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'boundaries',
        paint: {
          'line-color': isDark ? '#334155' : '#CBD5E1',
          'line-width': 1,
          'line-dasharray': [3, 2],
        },
      },
      {
        id: 'roads-casing',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        filter: ['in', 'kind', 'highway', 'major_road'],
        paint: {
          'line-color': isDark ? '#1E293B' : '#CBD5E1',
          'line-width': 4.5,
        },
      },
      {
        id: 'roads-minor',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        filter: ['in', 'kind', 'minor_road', 'other', 'service', 'path'],
        paint: {
          'line-color': isDark ? '#334155' : '#FFFFFF',
          'line-width': 1.5,
        },
      },
      {
        id: 'roads-medium',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        filter: ['in', 'kind', 'medium_road'],
        paint: {
          'line-color': isDark ? '#475569' : '#FFFFFF',
          'line-width': 2.5,
        },
      },
      {
        id: 'roads-major',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        filter: ['in', 'kind', 'major_road', 'highway'],
        paint: {
          'line-color': isDark ? '#64748B' : '#FEEBC8',
          'line-width': 3.5,
        },
      },
    ],
  };
}

let isPmtilesRegistered = false;

export type PmtilesTileLoader = (
  params: { url: string },
  abortController: AbortController,
) => Promise<{ data: ArrayBuffer }>;

export interface MapLibreAddProtocolTarget {
  addProtocol: (customProtocol: string, loadFn: PmtilesTileLoader) => void;
}

export interface PmtilesProtocolInstance {
  tile: PmtilesTileLoader;
}

/**
 * Registra o protocolo `pmtiles://` no MapLibre GL de maneira idempotente.
 */
export function registerPmtilesProtocol(
  maplibreTarget: MapLibreAddProtocolTarget,
  protocolInstance: PmtilesProtocolInstance,
  forceResetForTests = false,
): boolean {
  if (forceResetForTests) {
    isPmtilesRegistered = false;
  }
  if (isPmtilesRegistered) {
    return false;
  }
  maplibreTarget.addProtocol('pmtiles', protocolInstance.tile.bind(protocolInstance));
  isPmtilesRegistered = true;
  return true;
}

/**
 * Converte uma coordenada `(lat, lng)` dentro da `GEO_BBOX` em porcentagens `(x%, y%)`
 * para o mapa esquemático local de fallback (quando o `.pmtiles` não está presente ou sem WebGL).
 */
export function projectCoordToSchematicPercent(coord: { lat: number; lng: number }): {
  xPercent: number;
  yPercent: number;
} {
  const lngSpan = GEO_BBOX.maxLng - GEO_BBOX.minLng;
  const latSpan = GEO_BBOX.maxLat - GEO_BBOX.minLat;

  const rawX = ((coord.lng - GEO_BBOX.minLng) / lngSpan) * 100;
  // Latitude maior fica mais ao norte (topo -> menor yPercent)
  const rawY = ((GEO_BBOX.maxLat - coord.lat) / latSpan) * 100;

  const clamp = (val: number) => Math.min(92, Math.max(8, Math.round(val * 10) / 10));
  return {
    xPercent: clamp(rawX),
    yPercent: clamp(rawY),
  };
}

/**
 * Verifica no navegador se há suporte funcional a WebGL.
 */
export function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}
