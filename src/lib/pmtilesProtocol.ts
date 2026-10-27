import { GEO_BBOX } from '@/types/schema';

export const DEFAULT_PMTILES_ARCHIVE_PATH = '/tiles/cuiaba-vg.pmtiles';

export const CUIABA_VG_CENTER = {
  lat: -15.601,
  lng: -56.097,
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
 * Constrói um objeto de estilo MapLibre GL (v8) 100% local a partir de um arquivo PMTiles.
 * Cumpre estritamente os ADRs 06 e 09:
 * - ZERO chamadas a `tile.openstreetmap.org`, `protomaps.github.io` ou CDNs externas.
 * - Sem `glyphs` ou `sprite` remotos: usa camadas geométricas vetoriais limpas
 *   e deixa os rótulos/marcadores das unidades para o HTML acessível com as fontes autohospedadas.
 */
export function buildLocalMapStyle(
  pmtilesArchivePath: string = DEFAULT_PMTILES_ARCHIVE_PATH,
): LocalVectorMapStyle {
  const cleanPath = pmtilesArchivePath.trim() || DEFAULT_PMTILES_ARCHIVE_PATH;
  const pmtilesUrl = cleanPath.startsWith('pmtiles://')
    ? cleanPath
    : `pmtiles://${cleanPath}`;

  return {
    version: 8,
    name: 'Onde Pego — Cuiabá e Várzea Grande (Local PMTiles)',
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
          'background-color': '#F3F6F9',
        },
      },
      {
        id: 'earth',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'earth',
        paint: {
          'fill-color': '#F3F6F9',
        },
      },
      {
        id: 'landuse-park',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'landuse',
        paint: {
          'fill-color': '#E6F4EA',
          'fill-opacity': 0.7,
        },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'water',
        paint: {
          'fill-color': '#C5DDF0',
        },
      },
      {
        id: 'buildings',
        type: 'fill',
        source: 'protomaps',
        'source-layer': 'buildings',
        paint: {
          'fill-color': '#E2E8F0',
          'fill-opacity': 0.8,
        },
      },
      {
        id: 'roads-minor',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        paint: {
          'line-color': '#CBD5E1',
          'line-width': 1.5,
        },
      },
      {
        id: 'roads-major',
        type: 'line',
        source: 'protomaps',
        'source-layer': 'roads',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 3,
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
