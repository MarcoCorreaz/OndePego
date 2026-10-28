import { isPlaceholderCoordinate } from '@/lib/dataRules';
import {
  detectCsvDelimiter,
  isWithinCuiabaVgBbox,
  normalizeHeaderName,
  parseCoordinateNumber,
  splitCsvLine,
  stripUtf8Bom,
} from '@/lib/infomsCsv';
import { CUIABA_VG_CENTER } from '@/lib/pmtilesProtocol';
import { type Estabelecimento, EstabelecimentosFile } from '@/types/schema';

export interface ParsedUnidadeRow {
  id: string;
  nome_fantasia: string;
  tipo: 'UBS' | 'POLICLINICA' | 'UPA';
  bairro: string;
  endereco_completo: string;
  telefone?: string;
  dispensa_psicotropicos_sus: boolean;
  polo_vacinacao_municipal: boolean;
  status_funcionamento: 'NORMAL' | 'CONTINGENCIA_PARCIAL' | 'INTERDITADO';
  mensagem_contingencia?: string;
  lat?: number;
  lng?: number;
}

export interface MergeUnidadesResult {
  merged: Estabelecimento[];
  added: number;
  updated: number;
  preservedAuditedCoords: number;
  preservedPharmacies: number;
}

function parsePublicUnitType(raw: string): 'UBS' | 'POLICLINICA' | 'UPA' {
  const cleaned = raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (cleaned.includes('UPA') || cleaned.includes('PRONTO ATENDIMENTO')) {
    return 'UPA';
  }
  if (cleaned.includes('POLICLINICA') || cleaned === 'POL') {
    return 'POLICLINICA';
  }
  return 'UBS';
}

function parseStatusFuncionamento(
  raw: string,
): 'NORMAL' | 'CONTINGENCIA_PARCIAL' | 'INTERDITADO' {
  const cleaned = raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (cleaned.includes('INTERDITAD')) return 'INTERDITADO';
  if (cleaned.includes('CONTINGENCIA') || cleaned.includes('PARCIAL')) {
    return 'CONTINGENCIA_PARCIAL';
  }
  return 'NORMAL';
}

function parseBool(raw: string): boolean {
  const cleaned = raw.trim().toLowerCase();
  return ['true', 'sim', '1', 'yes', 's'].includes(cleaned);
}

function buildPublicUnitId(rawId: string, nome: string, fallbackIndex: number): string {
  const source = rawId.trim() || nome.trim() || `unidade-${fallbackIndex}`;
  return source
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseUnidadesCsv(csvText: string): ParsedUnidadeRow[] {
  const cleanText = stripUtf8Bom(csvText).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const delimiter = detectCsvDelimiter(lines[0]!);
  const headers = splitCsvLine(lines[0]!, delimiter).map(normalizeHeaderName);
  const findCol = (cands: string[]) => cands.map((c) => headers.indexOf(c)).find((i) => i !== -1) ?? -1;

  const idxId = findCol(['id', 'cnes', 'codigo_cnes', 'id_unidade']);
  const idxNome = findCol(['nome_fantasia', 'nome', 'unidade', 'no_fantasia']);
  const idxTipo = findCol(['tipo', 'tipo_unidade']);
  const idxBairro = findCol(['bairro', 'no_bairro']);
  const idxEndereco = findCol(['endereco_completo', 'endereco', 'logradouro']);
  const idxTelefone = findCol(['telefone', 'fone', 'nu_telefone']);
  const idxPsico = findCol([
    'dispensa_psicotropicos_sus',
    'psicotropicos',
    'portaria_344',
    'controlados',
  ]);
  const idxVacina = findCol(['polo_vacinacao_municipal', 'vacinacao', 'polo_vacina']);
  const idxStatus = findCol(['status_funcionamento', 'status']);
  const idxMensagem = findCol(['mensagem_contingencia', 'contingencia', 'observacao']);
  const idxLat = findCol(['lat', 'latitude', 'nu_latitude']);
  const idxLng = findCol(['lng', 'lon', 'longitude', 'nu_longitude']);

  const rows: ParsedUnidadeRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!, delimiter);
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '').trim() : '');

    const nome_fantasia = get(idxNome);
    const endereco_completo = get(idxEndereco);
    if (!nome_fantasia || !endereco_completo) continue;

    const id = buildPublicUnitId(get(idxId), nome_fantasia, i);
    const tipo = parsePublicUnitType(get(idxTipo));
    const bairro = get(idxBairro) || 'Centro';
    const telefone = get(idxTelefone);
    const dispensa_psicotropicos_sus = parseBool(get(idxPsico));
    const polo_vacinacao_municipal = parseBool(get(idxVacina));
    const status_funcionamento = parseStatusFuncionamento(get(idxStatus));
    const mensagem_contingencia = get(idxMensagem);
    const lat = parseCoordinateNumber(get(idxLat));
    const lng = parseCoordinateNumber(get(idxLng));

    rows.push({
      id,
      nome_fantasia,
      tipo,
      bairro,
      endereco_completo,
      ...(telefone ? { telefone } : {}),
      dispensa_psicotropicos_sus,
      polo_vacinacao_municipal,
      status_funcionamento,
      ...(mensagem_contingencia ? { mensagem_contingencia } : {}),
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
    });
  }

  return rows;
}

/**
 * Mescla unidades públicas municipais (`UBS`, `POLICLINICA`, `UPA`) importadas do CSV da SMS Cuiabá
 * com `data/estabelecimentos.json`, preservando:
 * - Todos os estabelecimentos `FARMACIA_POPULAR`;
 * - Todas as coordenadas com `auditado_manualmente: true`.
 */
export function mergeUnidadesPublicas(
  existing: readonly Estabelecimento[],
  csvRows: readonly ParsedUnidadeRow[],
): MergeUnidadesResult {
  const byId = new Map<string, Estabelecimento>();
  const orderedIds: string[] = [];
  let preservedPharmacies = 0;

  for (const est of existing) {
    if (est.tipo === 'FARMACIA_POPULAR') {
      preservedPharmacies++;
    }
    byId.set(est.id, {
      ...est,
      coordenadas: { ...est.coordenadas },
      atributos_operacionais: { ...est.atributos_operacionais },
    });
    orderedIds.push(est.id);
  }

  let added = 0;
  let updated = 0;
  let preservedAuditedCoords = 0;

  for (const row of csvRows) {
    const current = byId.get(row.id);
    const hasValidCsvCoords =
      row.lat !== undefined &&
      row.lng !== undefined &&
      isWithinCuiabaVgBbox(row.lat, row.lng) &&
      !isPlaceholderCoordinate(row.lat, row.lng);

    if (current) {
      const isAudited = current.coordenadas.auditado_manualmente === true;
      if (isAudited) {
        preservedAuditedCoords++;
      }

      const nextCoords = isAudited
        ? {
            lat: current.coordenadas.lat,
            lng: current.coordenadas.lng,
            auditado_manualmente: true,
          }
        : hasValidCsvCoords
          ? {
              lat: row.lat!,
              lng: row.lng!,
              auditado_manualmente: false,
            }
          : { ...current.coordenadas };

      const updatedEst: Estabelecimento = {
        ...current,
        nome_fantasia: row.nome_fantasia,
        tipo: row.tipo,
        bairro: row.bairro,
        endereco_completo: row.endereco_completo,
        ...(row.telefone ? { telefone: row.telefone } : {}),
        coordenadas: nextCoords,
        atributos_operacionais: {
          ...current.atributos_operacionais,
          dispensa_psicotropicos_sus: row.dispensa_psicotropicos_sus,
          polo_vacinacao_municipal: row.polo_vacinacao_municipal,
          status_funcionamento: row.status_funcionamento,
          ...(row.mensagem_contingencia
            ? { mensagem_contingencia: row.mensagem_contingencia }
            : {}),
        },
      };

      byId.set(row.id, updatedEst);
      updated++;
    } else {
      const initialCoords = hasValidCsvCoords
        ? {
            lat: row.lat!,
            lng: row.lng!,
            auditado_manualmente: false,
          }
        : {
            lat: CUIABA_VG_CENTER.lat,
            lng: CUIABA_VG_CENTER.lng,
            auditado_manualmente: false,
            sem_localizacao: true,
          };

      const newEst: Estabelecimento = {
        id: row.id,
        nome_fantasia: row.nome_fantasia,
        tipo: row.tipo,
        bairro: row.bairro,
        endereco_completo: row.endereco_completo,
        ...(row.telefone ? { telefone: row.telefone } : {}),
        coordenadas: initialCoords,
        atributos_operacionais: {
          dispensa_psicotropicos_sus: row.dispensa_psicotropicos_sus,
          polo_vacinacao_municipal: row.polo_vacinacao_municipal,
          status_funcionamento: row.status_funcionamento,
          ...(row.mensagem_contingencia
            ? { mensagem_contingencia: row.mensagem_contingencia }
            : {}),
        },
      };

      byId.set(row.id, newEst);
      orderedIds.push(row.id);
      added++;
    }
  }

  const merged = EstabelecimentosFile.parse(orderedIds.map((id) => byId.get(id)!));

  return {
    merged,
    added,
    updated,
    preservedAuditedCoords,
    preservedPharmacies,
  };
}
