import {
  detectCsvDelimiter,
  normalizeHeaderName,
  splitCsvLine,
  stripUtf8Bom,
} from '@/lib/infomsCsv';
import { normalizePTBR } from '@/lib/normalize';
import {
  type Apresentacao,
  type Medicamento,
  MedicamentosFile,
} from '@/types/schema';

export class InvalidLocalDispensacaoError extends Error {
  public readonly invalidLines: Array<{ line: number; rawValue: string; principioAtivo: string }>;

  constructor(invalidLines: Array<{ line: number; rawValue: string; principioAtivo: string }>) {
    const details = invalidLines
      .map((item) => `Linha ${item.line} (${item.principioAtivo}): valor inválido "${item.rawValue}"`)
      .join('; ');
    super(`Valores desconhecidos de local_dispensacao_sus na fonte REMUME: ${details}`);
    this.name = 'InvalidLocalDispensacaoError';
    this.invalidLines = invalidLines;
  }
}

export interface ImportMedicamentosOptions {
  remumeCsv: string;
  elencoCsv: string;
  sinonimosCsv?: string;
  existing?: readonly Medicamento[];
  prune?: boolean;
}

export interface ImportMedicamentosResult {
  merged: Medicamento[];
  added: number;
  updated: number;
  removed: number;
  pendingSynonymsSlugs: string[];
  pendingSynonymsMarkdown: string;
}

export function buildStableSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converte o valor bruto de `local_dispensacao_sus` do CSV da REMUME para o enum canônico.
 * Retorna `null` se o valor for desconhecido (disparando aborto obrigatório da importação).
 */
export function parseStrictLocalDispensacaoSus(
  raw: string,
): Apresentacao['local_dispensacao_sus'] | null {
  const cleaned = raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  switch (cleaned) {
    case 'UBS':
    case 'POSTO':
    case 'POSTO_DE_SAUDE':
    case 'UNIDADE_BASICA':
    case 'ATENCAO_BASICA':
      return 'UBS';
    case 'POLICLINICA_PORTARIA344':
    case 'POLICLINICA_PORTARIA_344':
    case 'PORTARIA_344':
    case 'PORTARIA344':
    case 'POLICLINICA':
    case 'CONTROLE_ESPECIAL':
    case 'PSICOTROPICOS':
      return 'POLICLINICA_PORTARIA344';
    case 'CEM_ESPECIALIDADES':
    case 'CEM':
    case 'CENTRO_DE_ESPECIALIDADES':
    case 'CENTRO_ESPECIALIDADES':
      return 'CEM_ESPECIALIDADES';
    case 'NAO_APLICAVEL':
    case 'NA':
      return 'NAO_APLICAVEL';
    default:
      return null;
  }
}

export function parseRequisitoFarmaciaPopular(
  rawRequisito: string,
  gratuito: boolean,
): Apresentacao['requisito_farmacia_popular'] {
  if (!gratuito) {
    return 'NAO_DISPONIVEL';
  }
  const cleaned = rawRequisito
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (cleaned === 'FRALDA_GERIATRICA' || cleaned.includes('FRALDA')) {
    return 'FRALDA_GERIATRICA';
  }
  if (cleaned === 'DIGNIDADE_MENSTRUAL' || cleaned.includes('ABSORVENTE')) {
    return 'DIGNIDADE_MENSTRUAL';
  }
  return 'PADRAO_RECEITA_DOCUMENTO';
}

function parseBooleanFlag(raw: string, defaultWhenEmpty: boolean): boolean {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return defaultWhenEmpty;
  if (['false', 'nao', 'não', '0', 'no', 'inativo', 'pago', 'copagamento'].includes(cleaned)) {
    return false;
  }
  return ['true', 'sim', '1', 'yes', 'gratuito', 'gratuita', 'ativo', 'ativa'].includes(cleaned);
}

interface ParsedRemumeItem {
  principio_ativo: string;
  descricao_dosagem: string;
  local_dispensacao_sus: Apresentacao['local_dispensacao_sus'];
  nota_especifica_cuiaba?: string;
  id_dcb?: string;
  codigo_atc?: string;
}

interface ParsedElencoItem {
  principio_ativo: string;
  descricao_dosagem: string;
  farmacia_popular_gratuito: boolean;
  requisito_farmacia_popular: Apresentacao['requisito_farmacia_popular'];
  id_dcb?: string;
  codigo_atc?: string;
}

function parseRemumeCsv(csvText: string): ParsedRemumeItem[] {
  const cleanText = stripUtf8Bom(csvText).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const delimiter = detectCsvDelimiter(lines[0]!);
  const headers = splitCsvLine(lines[0]!, delimiter).map(normalizeHeaderName);
  const findCol = (cands: string[]) => cands.map((c) => headers.indexOf(c)).find((i) => i !== -1) ?? -1;

  const idxPrincipio = findCol([
    'principio_ativo',
    'denominacao_comum_brasileira',
    'dcb',
    'medicamento',
    'insumo',
  ]);
  const idxDosagem = findCol([
    'descricao_dosagem',
    'apresentacao',
    'concentracao',
    'dosagem',
    'forma_farmaceutica',
  ]);
  const idxLocal = findCol([
    'local_dispensacao_sus',
    'local_dispensacao',
    'rede_dispensacao',
    'local',
  ]);
  const idxNota = findCol(['nota_especifica_cuiaba', 'observacao', 'nota', 'restricao']);
  const idxDcb = findCol(['id_dcb', 'codigo_dcb']);
  const idxAtc = findCol(['codigo_atc', 'atc']);

  const invalidLines: Array<{ line: number; rawValue: string; principioAtivo: string }> = [];
  const items: ParsedRemumeItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!, delimiter);
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '').trim() : '');

    const principio_ativo = get(idxPrincipio);
    const descricao_dosagem = get(idxDosagem);
    if (!principio_ativo || !descricao_dosagem) continue;

    const rawLocal = get(idxLocal);
    const parsedLocal = parseStrictLocalDispensacaoSus(rawLocal);
    if (!parsedLocal) {
      invalidLines.push({
        line: i + 1,
        rawValue: rawLocal,
        principioAtivo: principio_ativo,
      });
      continue;
    }

    const nota = get(idxNota);
    const id_dcb = get(idxDcb);
    const codigo_atc = get(idxAtc);

    items.push({
      principio_ativo,
      descricao_dosagem,
      local_dispensacao_sus: parsedLocal,
      ...(nota ? { nota_especifica_cuiaba: nota } : {}),
      ...(id_dcb ? { id_dcb } : {}),
      ...(codigo_atc ? { codigo_atc } : {}),
    });
  }

  if (invalidLines.length > 0) {
    throw new InvalidLocalDispensacaoError(invalidLines);
  }

  return items;
}

function parseElencoCsv(csvText: string): ParsedElencoItem[] {
  const cleanText = stripUtf8Bom(csvText).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const delimiter = detectCsvDelimiter(lines[0]!);
  const headers = splitCsvLine(lines[0]!, delimiter).map(normalizeHeaderName);
  const findCol = (cands: string[]) => cands.map((c) => headers.indexOf(c)).find((i) => i !== -1) ?? -1;

  const idxPrincipio = findCol([
    'principio_ativo',
    'denominacao_comum_brasileira',
    'dcb',
    'medicamento',
    'insumo',
  ]);
  const idxDosagem = findCol([
    'descricao_dosagem',
    'apresentacao',
    'concentracao',
    'dosagem',
  ]);
  const idxGratuito = findCol(['farmacia_popular_gratuito', 'gratuito', 'elenco_gratuito']);
  const idxRequisito = findCol([
    'requisito_farmacia_popular',
    'requisito',
    'regra',
    'publico_alvo',
  ]);
  const idxDcb = findCol(['id_dcb', 'codigo_dcb']);
  const idxAtc = findCol(['codigo_atc', 'atc']);

  const items: ParsedElencoItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!, delimiter);
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '').trim() : '');

    const principio_ativo = get(idxPrincipio);
    const descricao_dosagem = get(idxDosagem);
    if (!principio_ativo || !descricao_dosagem) continue;

    const gratuito = parseBooleanFlag(get(idxGratuito), true);
    const requisito = parseRequisitoFarmaciaPopular(get(idxRequisito), gratuito);
    const id_dcb = get(idxDcb);
    const codigo_atc = get(idxAtc);

    items.push({
      principio_ativo,
      descricao_dosagem,
      farmacia_popular_gratuito: gratuito,
      requisito_farmacia_popular: requisito,
      ...(id_dcb ? { id_dcb } : {}),
      ...(codigo_atc ? { codigo_atc } : {}),
    });
  }

  return items;
}

function splitSynonymList(raw: string): string[] {
  if (!raw.trim()) return [];
  const sep = raw.includes('|') ? '|' : ',';
  return raw
    .split(sep)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseSinonimosCsv(
  csvText: string | undefined,
): Map<string, { nomes_comerciais: string[]; termos_populares: string[] }> {
  const result = new Map<string, { nomes_comerciais: string[]; termos_populares: string[] }>();
  if (!csvText || !csvText.trim()) return result;

  const cleanText = stripUtf8Bom(csvText).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return result;

  const delimiter = detectCsvDelimiter(lines[0]!);
  const headers = splitCsvLine(lines[0]!, delimiter).map(normalizeHeaderName);
  const findCol = (cands: string[]) => cands.map((c) => headers.indexOf(c)).find((i) => i !== -1) ?? -1;

  const idxKey = findCol(['principio_ativo', 'slug', 'medicamento', 'dcb']);
  const idxComerciais = findCol(['nomes_comerciais', 'referencia', 'marca']);
  const idxPopulares = findCol(['termos_populares', 'indicacao_popular', 'sinonimos_populares']);

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!, delimiter);
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? '').trim() : '');

    const rawKey = get(idxKey);
    if (!rawKey) continue;

    const normKey = normalizePTBR(rawKey.replace(/-/g, ' '));
    const slugKey = buildStableSlug(rawKey);
    const comerciais = splitSynonymList(get(idxComerciais));
    const populares = splitSynonymList(get(idxPopulares));

    const entry = { nomes_comerciais: comerciais, termos_populares: populares };
    result.set(normKey, entry);
    result.set(slugKey, entry);
  }

  return result;
}

function mergeUniqueStrings(a: readonly string[], b: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...a, ...b]) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(trimmed);
    }
  }
  return out;
}

export function buildPendingSynonymsMarkdown(meds: readonly Medicamento[]): {
  pendingSlugs: string[];
  markdown: string;
} {
  const pending = meds.filter(
    (m) => m.nomes_comerciais.length === 0 && m.termos_populares.length === 0,
  );
  const pendingSlugs = pending.map((m) => m.slug);

  const lines: string[] = [
    '# Sinônimos Pendentes de Curadoria (`docs/sinonimos-pendentes.md`)',
    '',
    'Estes medicamentos foram importados das fontes oficiais (REMUME Cuiabá / Elenco Farmácia Popular), mas ainda não possuem `nomes_comerciais` nem `termos_populares` cadastrados.',
    '',
  ];

  if (pending.length === 0) {
    lines.push('Nenhum medicamento pendente de sinônimos.');
  } else {
    lines.push('| Slug | Princípio Ativo | Apresentações |');
    lines.push('|---|---|---|');
    for (const m of pending) {
      const dosagens = m.apresentacoes.map((a) => a.descricao_dosagem).join('; ');
      lines.push(`| \`${m.slug}\` | ${m.principio_ativo} | ${dosagens} |`);
    }
  }

  return {
    pendingSlugs,
    markdown: `${lines.join('\n')}\n`,
  };
}

/**
 * Une REMUME Cuiabá e Elenco PFPB por `principio_ativo` + `descricao_dosagem` normalizados (`normalizePTBR`),
 * preservando sinônimos curados manualmente e respeitando `--prune`.
 */
export function importAndMergeMedicamentos(
  options: ImportMedicamentosOptions,
): ImportMedicamentosResult {
  const { remumeCsv, elencoCsv, sinonimosCsv, existing = [], prune = false } = options;

  const remumeItems = parseRemumeCsv(remumeCsv);
  const elencoItems = parseElencoCsv(elencoCsv);
  const sinonimosMap = parseSinonimosCsv(sinonimosCsv);

  // Indexa existentes por princípio ativo normalizado e por slug
  const existingByNormPrincipio = new Map<string, Medicamento>();
  const existingBySlug = new Map<string, Medicamento>();
  for (const med of existing) {
    existingByNormPrincipio.set(normalizePTBR(med.principio_ativo), med);
    existingBySlug.set(med.slug, med);
  }

  interface MedGroupAccumulator {
    normPrincipio: string;
    principio_ativo: string;
    id_dcb?: string;
    codigo_atc?: string;
    presentationsByNormDosage: Map<
      string,
      {
        descricao_dosagem: string;
        remume?: ParsedRemumeItem;
        elenco?: ParsedElencoItem;
      }
    >;
  }

  const groups = new Map<string, MedGroupAccumulator>();

  const ensureGroup = (
    principio_ativo: string,
    id_dcb?: string,
    codigo_atc?: string,
  ): MedGroupAccumulator => {
    const normPrincipio = normalizePTBR(principio_ativo);
    let group = groups.get(normPrincipio);
    if (!group) {
      group = {
        normPrincipio,
        principio_ativo,
        ...(id_dcb ? { id_dcb } : {}),
        ...(codigo_atc ? { codigo_atc } : {}),
        presentationsByNormDosage: new Map(),
      };
      groups.set(normPrincipio, group);
    } else {
      if (!group.id_dcb && id_dcb) group.id_dcb = id_dcb;
      if (!group.codigo_atc && codigo_atc) group.codigo_atc = codigo_atc;
    }
    return group;
  };

  for (const r of remumeItems) {
    const group = ensureGroup(r.principio_ativo, r.id_dcb, r.codigo_atc);
    const normDosage = normalizePTBR(r.descricao_dosagem);
    const existingPres = group.presentationsByNormDosage.get(normDosage);
    if (existingPres) {
      existingPres.remume = r;
    } else {
      group.presentationsByNormDosage.set(normDosage, {
        descricao_dosagem: r.descricao_dosagem,
        remume: r,
      });
    }
  }

  for (const e of elencoItems) {
    const group = ensureGroup(e.principio_ativo, e.id_dcb, e.codigo_atc);
    const normDosage = normalizePTBR(e.descricao_dosagem);
    const existingPres = group.presentationsByNormDosage.get(normDosage);
    if (existingPres) {
      existingPres.elenco = e;
    } else {
      group.presentationsByNormDosage.set(normDosage, {
        descricao_dosagem: e.descricao_dosagem,
        elenco: e,
      });
    }
  }

  const usedSlugs = new Set<string>();
  const importedMeds: Medicamento[] = [];
  const touchedExistingSlugs = new Set<string>();
  let added = 0;
  let updated = 0;

  for (const group of groups.values()) {
    const matchedExisting = existingByNormPrincipio.get(group.normPrincipio);
    let baseSlug = matchedExisting?.slug || buildStableSlug(group.principio_ativo) || 'medicamento';
    let finalSlug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    usedSlugs.add(finalSlug);

    if (matchedExisting) {
      touchedExistingSlugs.add(matchedExisting.slug);
      updated++;
    } else {
      added++;
    }

    const csvSyn =
      sinonimosMap.get(group.normPrincipio) ?? sinonimosMap.get(finalSlug) ?? {
        nomes_comerciais: [],
        termos_populares: [],
      };

    const nomes_comerciais = mergeUniqueStrings(
      matchedExisting?.nomes_comerciais ?? [],
      csvSyn.nomes_comerciais,
    );
    const termos_populares = mergeUniqueStrings(
      matchedExisting?.termos_populares ?? [],
      csvSyn.termos_populares,
    );

    const usedPresIds = new Set<string>();
    const apresentacoes: Apresentacao[] = [];

    for (const presEntry of group.presentationsByNormDosage.values()) {
      const dosageSlug = buildStableSlug(presEntry.descricao_dosagem) || 'padrao';
      let id_apresentacao = `ap-${finalSlug}-${dosageSlug}`;
      let presSuffix = 2;
      while (usedPresIds.has(id_apresentacao)) {
        id_apresentacao = `ap-${finalSlug}-${dosageSlug}-${presSuffix}`;
        presSuffix++;
      }
      usedPresIds.add(id_apresentacao);

      const inRemume = Boolean(presEntry.remume);
      // Nunca gerar ALERTA_ABASTECIMENTO
      const status_remume_cuiaba: Apresentacao['status_remume_cuiaba'] = inRemume
        ? 'PADRONIZADO_REMUME'
        : 'NAO_CONSTA_REMUME';

      const local_dispensacao_sus: Apresentacao['local_dispensacao_sus'] = inRemume
        ? presEntry.remume!.local_dispensacao_sus
        : 'NAO_APLICAVEL';

      const farmacia_popular_gratuito = presEntry.elenco
        ? presEntry.elenco.farmacia_popular_gratuito
        : false;
      const requisito_farmacia_popular: Apresentacao['requisito_farmacia_popular'] =
        presEntry.elenco && farmacia_popular_gratuito
          ? presEntry.elenco.requisito_farmacia_popular
          : 'NAO_DISPONIVEL';

      apresentacoes.push({
        id_apresentacao,
        descricao_dosagem: presEntry.descricao_dosagem,
        status_remume_cuiaba,
        local_dispensacao_sus,
        ...(presEntry.remume?.nota_especifica_cuiaba
          ? { nota_especifica_cuiaba: presEntry.remume.nota_especifica_cuiaba }
          : {}),
        farmacia_popular_gratuito,
        requisito_farmacia_popular,
      });
    }

    const id_dcb = group.id_dcb ?? matchedExisting?.id_dcb;
    const codigo_atc = group.codigo_atc ?? matchedExisting?.codigo_atc;

    importedMeds.push({
      slug: finalSlug,
      ...(id_dcb ? { id_dcb } : {}),
      ...(codigo_atc ? { codigo_atc } : {}),
      principio_ativo: matchedExisting?.principio_ativo ?? group.principio_ativo,
      nomes_comerciais,
      termos_populares,
      apresentacoes,
    });
  }

  let removed = 0;
  const preservedExisting: Medicamento[] = [];

  for (const prev of existing) {
    if (!touchedExistingSlugs.has(prev.slug)) {
      if (prune) {
        removed++;
      } else {
        let keptSlug = prev.slug;
        let sfx = 2;
        while (usedSlugs.has(keptSlug)) {
          keptSlug = `${prev.slug}-${sfx}`;
          sfx++;
        }
        usedSlugs.add(keptSlug);
        preservedExisting.push({ ...prev, slug: keptSlug });
      }
    }
  }

  const merged = MedicamentosFile.parse([...preservedExisting, ...importedMeds]);
  const { pendingSlugs, markdown } = buildPendingSynonymsMarkdown(merged);

  return {
    merged,
    added,
    updated,
    removed,
    pendingSynonymsSlugs: pendingSlugs,
    pendingSynonymsMarkdown: markdown,
  };
}
