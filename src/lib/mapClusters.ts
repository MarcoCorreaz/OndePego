import { type LatLng, calcularDistanciaKm, hasValidMapCoordinates } from '@/lib/geoEngine';
import type { Estabelecimento } from '@/types/schema';

export interface MapClusterPoint {
  type: 'cluster';
  id: string;
  center: LatLng;
  items: Estabelecimento[];
  count: number;
  bairroPredominante: string;
  countsByType: Record<string, number>;
}

export interface MapSinglePoint {
  type: 'single';
  id: string;
  item: Estabelecimento;
}

export type MapMarkerItem = MapClusterPoint | MapSinglePoint;

export interface ClusterOptions {
  clusterRadiusKm?: number;
  zoomThreshold?: number;
}

export const CLUSTER_ZOOM_THRESHOLD = 13.5;

/**
 * Calcula o raio de agrupamento em km com base no nível de zoom atual.
 * Em zoom 12 (visão geral de Cuiabá), agrupa pontos a ~1.2 km.
 * Em zoom 13, agrupa a ~0.6 km.
 */
export function getClusterRadiusForZoom(zoom: number): number {
  if (zoom >= CLUSTER_ZOOM_THRESHOLD) return 0;
  return Math.max(0.3, 1.2 * Math.pow(2, 12 - zoom));
}

/**
 * Encontra o bairro mais frequente entre uma lista de estabelecimentos.
 */
function findPredominantNeighborhood(items: readonly Estabelecimento[]): string {
  if (items.length === 0) return 'Cuiabá';
  const counts: Record<string, number> = {};
  for (const item of items) {
    const bairro = item.bairro?.trim() || 'Cuiabá';
    counts[bairro] = (counts[bairro] || 0) + 1;
  }
  let topBairro = 'Cuiabá';
  let maxCount = -1;
  for (const [bairro, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      topBairro = bairro;
    }
  }
  return topBairro;
}

/**
 * Agrupa estabelecimentos próximos de forma determinística quando zoom < 13.5.
 * Quando zoom >= 13.5, retorna 100% dos estabelecimentos como pinos individuais com pontinha.
 */
export function clusterEstablishments(
  items: readonly Estabelecimento[],
  zoom: number,
  options?: ClusterOptions,
): MapMarkerItem[] {
  const threshold = options?.zoomThreshold ?? CLUSTER_ZOOM_THRESHOLD;

  const validItems = items.filter((item) => hasValidMapCoordinates(item));

  // Em zoom alto, nunca agrupar
  if (zoom >= threshold) {
    return validItems.map((item) => ({
      type: 'single',
      id: item.id,
      item,
    }));
  }

  const radiusKm = options?.clusterRadiusKm ?? getClusterRadiusForZoom(zoom);

  interface CandidateCluster {
    items: Estabelecimento[];
    center: LatLng;
  }

  const candidates: CandidateCluster[] = [];

  for (const item of validItems) {
    let closestCandidate: CandidateCluster | null = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const cand of candidates) {
      const dist = calcularDistanciaKm(cand.center, item.coordenadas);
      if (dist <= radiusKm && dist < minDistance) {
        minDistance = dist;
        closestCandidate = cand;
      }
    }

    if (closestCandidate) {
      const prevCount = closestCandidate.items.length;
      closestCandidate.items.push(item);
      // Recalcula o centróide ponderado
      closestCandidate.center = {
        lat:
          (closestCandidate.center.lat * prevCount + item.coordenadas.lat) /
          (prevCount + 1),
        lng:
          (closestCandidate.center.lng * prevCount + item.coordenadas.lng) /
          (prevCount + 1),
      };
    } else {
      candidates.push({
        items: [item],
        center: { ...item.coordenadas },
      });
    }
  }

  const result: MapMarkerItem[] = [];

  for (const cand of candidates) {
    if (cand.items.length === 1) {
      const single = cand.items[0];
      if (single) {
        result.push({
          type: 'single',
          id: single.id,
          item: single,
        });
      }
    } else {
      const countsByType: Record<string, number> = {};
      for (const item of cand.items) {
        countsByType[item.tipo] = (countsByType[item.tipo] || 0) + 1;
      }

      const clusterId = `cluster-${cand.items
        .map((i) => i.id)
        .sort()
        .join('_')}`;

      result.push({
        type: 'cluster',
        id: clusterId,
        center: {
          lat: Math.round(cand.center.lat * 100000) / 100000,
          lng: Math.round(cand.center.lng * 100000) / 100000,
        },
        items: cand.items,
        count: cand.items.length,
        bairroPredominante: findPredominantNeighborhood(cand.items),
        countsByType,
      });
    }
  }

  return result;
}
