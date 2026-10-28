import { hasValidMapCoordinates, isPlaceholderCoordinate } from '@/lib/dataRules';
import { isWithinCuiabaVgBbox } from '@/lib/infomsCsv';
import { type Estabelecimento, EstabelecimentosFile } from '@/types/schema';

export interface AuditCoordEntry {
  id: string;
  tipo: Estabelecimento['tipo'];
  nome_fantasia: string;
  bairro: string;
  endereco_completo: string;
  hasValidCoords: boolean;
  auditado_manualmente: boolean;
  googleMapsUrl: string;
}

export function listPendingAuditEstablishments(
  estabelecimentos: readonly Estabelecimento[],
): AuditCoordEntry[] {
  const entries: AuditCoordEntry[] = [];

  for (const est of estabelecimentos) {
    const validCoords = hasValidMapCoordinates(est);
    const isAudited = est.coordenadas.auditado_manualmente === true;

    if (validCoords && isAudited) {
      continue;
    }

    const googleMapsUrl = validCoords
      ? `https://www.google.com/maps?q=${est.coordenadas.lat},${est.coordenadas.lng}`
      : `https://www.google.com/maps?q=${encodeURIComponent(
          `${est.nome_fantasia}, ${est.endereco_completo}, ${est.bairro}, Cuiabá - MT`,
        )}`;

    entries.push({
      id: est.id,
      tipo: est.tipo,
      nome_fantasia: est.nome_fantasia,
      bairro: est.bairro,
      endereco_completo: est.endereco_completo,
      hasValidCoords: validCoords,
      auditado_manualmente: isAudited,
      googleMapsUrl,
    });
  }

  return entries;
}

export interface MarkAuditedOptions {
  ids: readonly string[];
  lat?: number;
  lng?: number;
}

export function markEstablishmentsAsAudited(
  existing: readonly Estabelecimento[],
  options: MarkAuditedOptions,
): {
  updatedList: Estabelecimento[];
  markedIds: string[];
} {
  const cleanIds = options.ids.map((id) => id.trim()).filter((id) => id.length > 0);
  if (cleanIds.length === 0) {
    throw new Error(
      'O parâmetro --ids é obrigatório. Nunca é permitido marcar estabelecimentos em lote sem informar --ids explícitos.',
    );
  }

  const hasCustomLatLng = options.lat !== undefined || options.lng !== undefined;
  if (hasCustomLatLng) {
    if (cleanIds.length !== 1) {
      throw new Error(
        'Os parâmetros --lat e --lng só podem ser usados quando exatamente 1 ID é informado em --ids.',
      );
    }
    if (
      options.lat === undefined ||
      options.lng === undefined ||
      !isWithinCuiabaVgBbox(options.lat, options.lng) ||
      isPlaceholderCoordinate(options.lat, options.lng)
    ) {
      throw new Error(
        'As coordenadas --lat e --lng informadas estão fora da GEO_BBOX ou são iguais ao placeholder CUIABA_VG_CENTER.',
      );
    }
  }

  const idSet = new Set(cleanIds);
  const foundIds = new Set<string>();

  const updatedList = existing.map((est) => {
    if (!idSet.has(est.id)) {
      return est;
    }

    foundIds.add(est.id);
    const nextLat = hasCustomLatLng ? options.lat! : est.coordenadas.lat;
    const nextLng = hasCustomLatLng ? options.lng! : est.coordenadas.lng;

    const candidate: Estabelecimento = {
      ...est,
      coordenadas: {
        lat: nextLat,
        lng: nextLng,
        auditado_manualmente: true,
      },
    };

    if (!hasValidMapCoordinates(candidate)) {
      throw new Error(
        `O estabelecimento "${est.id}" não possui coordenada válida no mapa. Informe --lat e --lng válidos ao auditar este ID.`,
      );
    }

    return candidate;
  });

  const missingIds = cleanIds.filter((id) => !foundIds.has(id));
  if (missingIds.length > 0) {
    throw new Error(`IDs não encontrados em estabelecimentos.json: ${missingIds.join(', ')}`);
  }

  return {
    updatedList: EstabelecimentosFile.parse(updatedList),
    markedIds: cleanIds,
  };
}
