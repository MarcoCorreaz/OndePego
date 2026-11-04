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
 * Monta a query textual de destino para o Google Maps sem duplicar bairro nem o sufixo "Cuiabá - MT".
 */
export function buildDestinationQuery(
  destino: LatLng,
  estabelecimento?: EstabelecimentoDestinoInfo,
): string {
  const lat = Number(destino.lat);
  const lng = Number(destino.lng);

  const nome = estabelecimento?.nomeFantasia?.trim() ?? '';
  const endereco = estabelecimento?.enderecoCompleto?.trim() ?? '';
  const bairro = estabelecimento?.bairro?.trim() ?? '';

  if (!nome && !endereco) {
    return `${lat},${lng}`;
  }

  const parts: string[] = [];
  if (nome) {
    parts.push(nome);
  }
  if (endereco) {
    parts.push(endereco);
  }
  if (bairro && (!endereco || !normalizePTBR(endereco).includes(normalizePTBR(bairro)))) {
    parts.push(bairro);
  }

  const municipio = (estabelecimento?.municipio || 'Cuiabá').trim();
  const normalizedExisting = normalizePTBR(parts.join(' '));
  const normalizedMunicipio = normalizePTBR(municipio);
  const hasCityAlready =
    normalizedExisting.includes(normalizedMunicipio) ||
    normalizedExisting.includes('cuiaba') ||
    normalizedExisting.includes('varzea grande');

  if (!hasCityAlready) {
    parts.push(`${municipio} - MT`);
  }

  return parts.join(', ');
}

/**
 * Gera link universal de rota no Google Maps (sem necessidade de chave de API).
 * Por padrão (Opção A), não fixa `travelmode`, deixando o Google Maps escolher a melhor rota nativamente.
 * Se fornecidas informações de nome e endereço, direciona o Google Maps para o ponto comercial exato,
 * evitando marcações no centro de avenidas extensas e sem duplicar "Cuiabá - MT".
 */
export function gerarUrlRotaGoogleMaps(
  destino: LatLng,
  modoOuEstabelecimento?: GoogleMapsTravelMode | EstabelecimentoDestinoInfo,
  estabelecimentoOpcional?: EstabelecimentoDestinoInfo,
): string {
  const isModoString = typeof modoOuEstabelecimento === 'string';
  const modo: GoogleMapsTravelMode | undefined = isModoString
    ? modoOuEstabelecimento
    : undefined;
  const estabelecimento: EstabelecimentoDestinoInfo | undefined = isModoString
    ? estabelecimentoOpcional
    : modoOuEstabelecimento;

  const destinationQuery = buildDestinationQuery(destino, estabelecimento);
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
