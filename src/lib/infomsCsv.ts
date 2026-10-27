import { normalizePTBR } from '@/lib/normalize';
import { CUIABA_VG_CENTER } from '@/lib/pmtilesProtocol';
import { type Estabelecimento, GEO_BBOX } from '@/types/schema';

export interface InfomsParsedRow {
  id: string;
  uf: string;
  municipio: string;
  nome_fantasia: string;
  bairro: string;
  endereco_completo: string;
  telefone?: string;
  credenciamento_pfpb_ativo: boolean;
  lat?: number;
  lng?: number;
}

export interface MergeInfomsResult {
  merged: Estabelecimento[];
  added: number;
  updated: number;
  preservedAuditedCoords: number;
  skippedOutsideMunicipio: number;
}

/**
 * Remove o UTF-8 BOM (`\uFEFF`) do início do conteúdo CSV, comum em exportações do Qlik Sense / InfoMS.
 */
export function stripUtf8Bom(text: string): string {
  return text.startsWith('\uFEFF') ? text.slice(1) : text;
}

/**
 * Detecta automaticamente o delimitador (ponto-e-vírgula `;` ou vírgula `,`) a partir da primeira linha não vazia.
 */
export function detectCsvDelimiter(headerLine: string): ';' | ',' {
  let inQuotes = false;
  let semicolonCount = 0;
  let commaCount = 0;

  for (let i = 0; i < headerLine.length; i++) {
    const ch = headerLine[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (ch === ';') semicolonCount++;
      else if (ch === ',') commaCount++;
    }
  }

  return semicolonCount >= commaCount && semicolonCount > 0 ? ';' : ',';
}

/**
 * Divide uma linha CSV respeitando campos entre aspas duplas e escape `""`.
 */
export function splitCsvLine(line: string, delimiter: ';' | ','): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isWithinCuiabaVgBbox(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= GEO_BBOX.minLat &&
    lat <= GEO_BBOX.maxLat &&
    lng >= GEO_BBOX.minLng &&
    lng <= GEO_BBOX.maxLng
  );
}

function parseCoordinateNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(',', '.');
  if (!cleaned) return undefined;
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

function buildEstablishmentIdFromRaw(rawIdOrCnpj: string, fallbackIndex: number): string {
  const trimmed = rawIdOrCnpj.trim();
  if (!trimmed) {
    return `pfpb-cuiaba-${fallbackIndex}`;
  }
  // Se já for um ID textual explícito (ex.: estab-farmacia-teste-a), mantém em minúsculas
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 11) {
    return `pfpb-${digitsOnly}`;
  }
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Lê o texto CSV exportado do painel InfoMS (`SEIDIGI_DEMAS_PFPB_ENDERECOS`)
 * removendo UTF-8 BOM, detectando `;` ou `,` e mapeando as colunas relevantes.
 */
export function parseInfomsCsv(csvText: string): {
  rows: InfomsParsedRow[];
  skippedOutsideMunicipio: number;
} {
  const cleanText = stripUtf8Bom(csvText).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { rows: [], skippedOutsideMunicipio: 0 };
  }

  const headerLine = lines[0]!;
  const delimiter = detectCsvDelimiter(headerLine);
  const rawHeaders = splitCsvLine(headerLine, delimiter);
  const normHeaders = rawHeaders.map((h) =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, ''),
  );

  const findColIndex = (candidates: string[]): number => {
    for (const cand of candidates) {
      const idx = normHeaders.indexOf(cand);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxId = findColIndex([
    'id',
    'id_estabelecimento',
    'cnpj',
    'nu_cnpj',
    'cnpj_farmacia',
  ]);
  const idxUf = findColIndex(['uf', 'sg_uf', 'estado']);
  const idxMunicipio = findColIndex(['municipio', 'no_municipio', 'cidade']);
  const idxNome = findColIndex([
    'nome_fantasia',
    'no_fantasia',
    'farmacia',
    'estabelecimento',
    'razao_social',
    'no_razao_social',
  ]);
  const idxBairro = findColIndex(['bairro', 'no_bairro']);
  const idxEndereco = findColIndex([
    'endereco_completo',
    'endereco',
    'ds_endereco',
    'logradouro',
    'no_logradouro',
  ]);
  const idxTelefone = findColIndex(['telefone', 'nu_telefone', 'ddd_telefone', 'fone']);
  const idxSituacao = findColIndex([
    'situacao',
    'st_credenciamento',
    'status',
    'credenciamento_pfpb_ativo',
  ]);
  const idxLat = findColIndex(['lat', 'latitude', 'nu_latitude']);
  const idxLng = findColIndex(['lng', 'lon', 'longitude', 'nu_longitude']);

  const rows: InfomsParsedRow[] = [];
  let skippedOutsideMunicipio = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!, delimiter);
    const getCell = (idx: number): string => (idx >= 0 ? (cells[idx] ?? '').trim() : '');

    const uf = getCell(idxUf) || 'MT';
    const municipio = getCell(idxMunicipio) || 'Cuiabá';

    if (idxMunicipio >= 0 && normalizePTBR(municipio) !== 'cuiaba') {
      skippedOutsideMunicipio++;
      continue;
    }

    const nome_fantasia = getCell(idxNome);
    const endereco_completo = getCell(idxEndereco);
    if (!nome_fantasia || !endereco_completo) {
      continue;
    }

    const bairro = getCell(idxBairro) || 'Centro';
    const telefoneRaw = getCell(idxTelefone);
    const situacaoRaw = normalizePTBR(getCell(idxSituacao));
    const credenciamento_pfpb_ativo =
      situacaoRaw === '' ||
      situacaoRaw === 'true' ||
      situacaoRaw === 'ativo' ||
      situacaoRaw === 'ativa' ||
      situacaoRaw === 'credenciada' ||
      situacaoRaw === 'sim';

    const id = buildEstablishmentIdFromRaw(getCell(idxId) || nome_fantasia, i);
    const lat = parseCoordinateNumber(getCell(idxLat));
    const lng = parseCoordinateNumber(getCell(idxLng));

    rows.push({
      id,
      uf,
      municipio,
      nome_fantasia,
      bairro,
      endereco_completo,
      ...(telefoneRaw ? { telefone: telefoneRaw } : {}),
      credenciamento_pfpb_ativo,
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
    });
  }

  return { rows, skippedOutsideMunicipio };
}

/**
 * Mescla as linhas importadas do CSV do InfoMS com a lista existente de estabelecimentos.
 *
 * REGRA DE OURO (Seção 12 do DAS e skill `busca-dados-contratos`):
 * - Se o estabelecimento já existir e `coordenadas.auditado_manualmente === true`,
 *   as coordenadas (`lat`, `lng`) e o flag `auditado_manualmente: true` NUNCA são sobrescritos.
 * - Novos estabelecimentos entram com `auditado_manualmente: false`.
 */
export function mergeInfomsEstablishments(
  existing: readonly Estabelecimento[],
  csvRows: readonly InfomsParsedRow[],
  skippedOutsideMunicipio = 0,
): MergeInfomsResult {
  const byId = new Map<string, Estabelecimento>();
  const orderedIds: string[] = [];

  for (const est of existing) {
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
      isWithinCuiabaVgBbox(row.lat, row.lng);

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
        bairro: row.bairro,
        endereco_completo: row.endereco_completo,
        ...(row.telefone ? { telefone: row.telefone } : {}),
        coordenadas: nextCoords,
        atributos_operacionais: {
          ...current.atributos_operacionais,
          credenciamento_pfpb_ativo: row.credenciamento_pfpb_ativo,
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
          };

      const newEst: Estabelecimento = {
        id: row.id,
        nome_fantasia: row.nome_fantasia,
        tipo: 'FARMACIA_POPULAR',
        bairro: row.bairro,
        endereco_completo: row.endereco_completo,
        ...(row.telefone ? { telefone: row.telefone } : {}),
        coordenadas: initialCoords,
        atributos_operacionais: {
          credenciamento_pfpb_ativo: row.credenciamento_pfpb_ativo,
          status_funcionamento: 'NORMAL',
        },
      };

      byId.set(row.id, newEst);
      orderedIds.push(row.id);
      added++;
    }
  }

  const merged = orderedIds.map((id) => byId.get(id)!);

  return {
    merged,
    added,
    updated,
    preservedAuditedCoords,
    skippedOutsideMunicipio,
  };
}
