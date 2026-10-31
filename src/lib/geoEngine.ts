import { hasValidMapCoordinates } from '@/lib/dataRules';
import { normalizePTBR } from '@/lib/normalize';
import type { Estabelecimento } from '@/types/schema';

export { hasValidMapCoordinates };

const EARTH_RADIUS_KM = 6371;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface EstabelecimentoComDistancia {
  estabelecimento: Estabelecimento;
  distanciaKm: number;
}

export interface EstabelecimentoListavel {
  estabelecimento: Estabelecimento;
  distanciaKm: number | null;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcula a distância em quilômetros entre dois pontos geográficos
 * usando a Fórmula de Haversine (processada 100% no aparelho).
 */
export function calcularDistanciaKm(origem: LatLng, destino: LatLng): number {
  const dLat = toRadians(destino.lat - origem.lat);
  const dLng = toRadians(destino.lng - origem.lng);

  const lat1 = toRadians(origem.lat);
  const lat2 = toRadians(destino.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const a =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  const rawKm = EARTH_RADIUS_KM * c;

  return Math.round(rawKm * 100) / 100;
}

/**
 * Formata uma distância em km para exibição amigável em português brasileiro.
 */
export function formatarDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    const metros = Math.max(10, Math.round(distanciaKm * 1000));
    return `${metros} m`;
  }
  return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
}

/**
 * Ordena uma lista de estabelecimentos do mais próximo ao mais distante a partir de `origem`.
 * Estabelecimentos sem coordenada válida no mapa NUNCA entram no cálculo Haversine.
 */
export function ordenarEstabelecimentosPorDistancia(
  estabelecimentos: readonly Estabelecimento[],
  origem: LatLng,
): EstabelecimentoComDistancia[] {
  return estabelecimentos
    .filter((estabelecimento) => hasValidMapCoordinates(estabelecimento))
    .map((estabelecimento) => ({
      estabelecimento,
      distanciaKm: calcularDistanciaKm(origem, estabelecimento.coordenadas),
    }))
    .sort((a, b) => {
      if (a.distanciaKm !== b.distanciaKm) {
        return a.distanciaKm - b.distanciaKm;
      }
      return a.estabelecimento.nome_fantasia.localeCompare(
        b.estabelecimento.nome_fantasia,
        'pt-BR',
      );
    });
}

/**
 * Para exibição honesta na lista: quando `origem` (GPS) está ativa, ordena primeiro os estabelecimentos
 * com coordenada válida por distância Haversine e mantém ao final (com `distanciaKm: null`) os
 * estabelecimentos sem localização no mapa, para que continuem visíveis pelo endereço.
 */
export function ordenarListaComOuSemDistancia(
  estabelecimentos: readonly Estabelecimento[],
  origem: LatLng | null,
): EstabelecimentoListavel[] {
  if (!origem) {
    return estabelecimentos.map((estabelecimento) => ({
      estabelecimento,
      distanciaKm: null,
    }));
  }

  const comCoord = ordenarEstabelecimentosPorDistancia(estabelecimentos, origem);
  const semCoord = estabelecimentos
    .filter((e) => !hasValidMapCoordinates(e))
    .map((estabelecimento) => ({
      estabelecimento,
      distanciaKm: null,
    }));

  return [...comCoord, ...semCoord];
}

/**
 * Filtra (opcionalmente) por bairro e ordena os estabelecimentos por bairro e nome fantasia.
 */
export function ordenarEstabelecimentosPorBairro(
  estabelecimentos: readonly Estabelecimento[],
  bairroFiltro?: string,
): Estabelecimento[] {
  const normalizedFilter = bairroFiltro ? normalizePTBR(bairroFiltro) : '';

  const filtrados = normalizedFilter
    ? estabelecimentos.filter((e) => normalizePTBR(e.bairro) === normalizedFilter)
    : [...estabelecimentos];

  return filtrados.sort((a, b) => {
    const byBairro = a.bairro.localeCompare(b.bairro, 'pt-BR');
    if (byBairro !== 0) {
      return byBairro;
    }
    return a.nome_fantasia.localeCompare(b.nome_fantasia, 'pt-BR');
  });
}

/**
 * Retorna a lista de bairros únicos ordenada alfabeticamente (pt-BR).
 */
export function listarBairrosUnicos(estabelecimentos: readonly Estabelecimento[]): string[] {
  const bairros = new Set<string>();
  for (const est of estabelecimentos) {
    if (est.bairro.trim().length > 0) {
      bairros.add(est.bairro.trim());
    }
  }
  return Array.from(bairros).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export type GoogleMapsTravelMode = 'transit' | 'walking' | 'driving';

export interface EstabelecimentoDestinoInfo {
  nomeFantasia?: string;
  enderecoCompleto?: string;
  bairro?: string;
  municipio?: string;
}

/**
 * Gera link universal de rota no Google Maps (sem necessidade de chave de API).
 * Se fornecidas informações de nome e endereço, direciona o Google Maps para o ponto comercial exato,
 * evitando marcações no centro de avenidas extensas.
 */
export function gerarUrlRotaGoogleMaps(
  destino: LatLng,
  modo?: GoogleMapsTravelMode,
  estabelecimento?: EstabelecimentoDestinoInfo,
): string {
  const lat = Number(destino.lat);
  const lng = Number(destino.lng);

  let destinationQuery = `${lat},${lng}`;
  if (estabelecimento?.nomeFantasia || estabelecimento?.enderecoCompleto) {
    const parts: string[] = [];
    if (estabelecimento.nomeFantasia) {
      parts.push(estabelecimento.nomeFantasia);
    }
    if (estabelecimento.enderecoCompleto) {
      parts.push(estabelecimento.enderecoCompleto);
    }
    if (
      estabelecimento.bairro &&
      (!estabelecimento.enderecoCompleto ||
        !estabelecimento.enderecoCompleto.includes(estabelecimento.bairro))
    ) {
      parts.push(estabelecimento.bairro);
    }
    parts.push(`${estabelecimento.municipio || 'Cuiabá'} - MT`);
    destinationQuery = parts.join(', ');
  }

  const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationQuery)}`;
  if (!modo) {
    return base;
  }
  return `${base}&travelmode=${encodeURIComponent(modo)}`;
}

/**
 * Link complementar opcional para consulta de linhas de ônibus em Cuiabá (DAS Seção 2).
 */
export function gerarUrlTransportePublicoOpcional(): string {
  return 'https://pontoos.com.br';
}
