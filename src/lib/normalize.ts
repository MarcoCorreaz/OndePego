export interface NormalizePTBROptions {
  /**
   * Define como o `ç` (após NFC e antes do NFD) é convertido:
   * - `'s'` (padrão): regra fonética (`ç` → `s`) antes de remover diacríticos.
   * - `'c'`: gera a variante para quem omite a cedilha no celular (`"acucar"` vs `"açúcar"`).
   */
  cedillaTo?: 's' | 'c';
}

export interface ParsedMedicationQuery {
  /** Consulta inteira normalizada com `normalizePTBR` */
  fullNormalized: string;
  /** Nome base normalizado sem tokens de dosagem/unidades */
  baseNameNormalized: string;
  /** Variantes normalizadas (`ç→s` e `ç→c`) do nome base */
  baseNameKeys: string[];
  /** Tokens numéricos de dosagem extraídos da consulta (ex.: `["850"]`, `["50"]`) */
  dosageNumbers: string[];
}

const DOSAGE_UNIT_TOKENS = new Set([
  'mg',
  'mcg',
  'ug',
  'g',
  'kg',
  'ml',
  'l',
  'ui',
  'u',
  'meq',
  'mmol',
  'gotas',
  'gts',
  'comp',
  'comprimido',
  'comprimidos',
  'caps',
  'capsula',
  'capsulas',
]);

/**
 * Normaliza texto em português brasileiro seguindo a ordem estrita da Seção 8 do DAS v1.2:
 * 1. minúsculas
 * 2. NFC (une `c` + cedilha decomposta `\u0327` em `ç`)
 * 3. `ç` → `s` (ou `c` quando `cedillaTo === 'c'`) ANTES do NFD
 * 4. NFD e remoção de diacríticos
 * 5. regras fonéticas: ph→f, y→i, ch→x, ss→s, z→s, c antes de e/i→s
 * 6. remover caracteres não alfanuméricos
 * 7. colapsar espaços
 */
export function normalizePTBR(input: string, options?: NormalizePTBROptions): string {
  const cedillaTarget = options?.cedillaTo ?? 's';

  return input
    .toLowerCase()
    .normalize('NFC')
    .replace(/ç/g, cedillaTarget)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]+/g, '')
    .replace(/ph/g, 'f')
    .replace(/y/g, 'i')
    .replace(/ch/g, 'x')
    .replace(/ss/g, 's')
    .replace(/z/g, 's')
    .replace(/c(?=[ei])/g, 's')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Retorna as chaves normalizadas únicas de um termo:
 * - variante com `ç` → `s`
 * - variante com `ç` → `c` (para quem digita sem cedilha no celular)
 */
export function uniqueNormalizedKeys(input: string): string[] {
  const primary = normalizePTBR(input, { cedillaTo: 's' });
  const withoutCedilla = normalizePTBR(input, { cedillaTo: 'c' });

  if (!primary && !withoutCedilla) {
    return [];
  }
  if (primary === withoutCedilla) {
    return [primary];
  }
  return [primary, withoutCedilla];
}

/**
 * Extrai todos os tokens numéricos inteiros ou decimais como strings normalizadas.
 * Usa fronteiras numéricas (`(?<!\d)\d+(?:[.,]\d+)?(?!\d)`) para que `50` nunca case
 * como substring de `500` ou `250`.
 */
export function extractNumericTokens(input: string): string[] {
  const matches = input.match(/(?<!\d)\d+(?:[.,]\d+)?(?!\d)/g);
  if (!matches) {
    return [];
  }
  const normalized = matches.map((token) => token.replace(',', '.'));
  return Array.from(new Set(normalized));
}

/**
 * Separa uma consulta de medicamento em nome base e tokens numéricos de dosagem.
 * Ex.: `"metformina 850mg"` → `baseNameNormalized: "metformina"`, `dosageNumbers: ["850"]`.
 */
export function parseMedicationQuery(query: string): ParsedMedicationQuery {
  const fullNormalized = normalizePTBR(query);
  if (!fullNormalized) {
    return {
      fullNormalized: '',
      baseNameNormalized: '',
      baseNameKeys: [],
      dosageNumbers: [],
    };
  }

  const dosageNumbers = extractNumericTokens(query);

  // Remove tokens numéricos (eventualmente colados a unidades como "850mg") do texto original
  const textWithoutNumbers = query.replace(
    /(?<!\d)\d+(?:[.,]\d+)?\s*(?:mg|mcg|ug|g|kg|ml|l|ui|u|meq|mmol|%)?(?![a-zA-Z0-9])/gi,
    ' ',
  );

  const filterUnitWords = (normalizedStr: string): string =>
    normalizedStr
      .split(' ')
      .filter((token) => token.length > 0 && !DOSAGE_UNIT_TOKENS.has(token))
      .join(' ')
      .trim();

  const basePrimary = filterUnitWords(normalizePTBR(textWithoutNumbers, { cedillaTo: 's' }));
  const baseWithoutCedilla = filterUnitWords(
    normalizePTBR(textWithoutNumbers, { cedillaTo: 'c' }),
  );

  const baseNameKeys = Array.from(
    new Set([basePrimary, baseWithoutCedilla].filter((k) => k.length > 0)),
  );

  return {
    fullNormalized,
    baseNameNormalized: basePrimary,
    baseNameKeys,
    dosageNumbers,
  };
}
