import Fuse from 'fuse.js';
import type { Medicamento } from '@/types/schema';
import {
  extractNumericTokens,
  normalizePTBR,
  parseMedicationQuery,
  uniqueNormalizedKeys,
} from '@/lib/normalize';

export interface ResultadoBusca {
  item: Medicamento;
  exato: boolean;
  porAssunto?: boolean;
}

export interface SearchOptions {
  limit?: number;
}

interface IndexedMedicationDoc {
  item: Medicamento;
  /** Chaves normalizadas estritamente de `principio_ativo` e `nomes_comerciais` (elegíveis a match exato) */
  exactNameKeysSet: Set<string>;
  /** Chaves normalizadas de `termos_populares` (NUNCA geram `exato: true`; geram `porAssunto: true`) */
  topicKeysSet: Set<string>;
  /** Lista completa de chaves normalizadas para busca no Fuse.js */
  allSearchKeysList: string[];
  /** Conjunto de tokens numéricos exatos presentes nas apresentações do medicamento */
  dosageTokensSet: Set<string>;
  /** Chaves combinadas (nome + dosagem) para busca no Fuse.js quando a pessoa digita dosagem */
  combinedDosageKeys: string[];
}

export interface MedicationSearchEngine {
  search: (query: string, options?: SearchOptions) => ResultadoBusca[];
}

/**
 * Extrai o nome central da substância ativa do princípio ativo eliminando
 * sais e radicais usuais (ex.: "Cloridrato de Metformina" → "Metformina", "Losartana Potássica" → "Losartana").
 */
function extractCoreSubstanceName(principioAtivo: string): string {
  return principioAtivo
    .replace(
      /^(cloridrato|fosfato\s+s[oó]dico|dicloridrato|maleato|sulfato|succinato|brometo|dipropionato|besilato|acetato|valerato|enantato)\s+(?:de\s+)?/i,
      '',
    )
    .replace(/\s+(pot[aá]ssic[ao]|s[oó]dic[ao]|anidr[ao])$/i, '')
    .trim();
}

function buildIndexedDoc(item: Medicamento): IndexedMedicationDoc {
  const coreSubstance = extractCoreSubstanceName(item.principio_ativo);
  const slugClean = item.slug.replace(/-fixture$/, '').replace(/-/g, ' ');

  const exactRawNames = [
    item.principio_ativo,
    coreSubstance,
    slugClean,
    ...item.nomes_comerciais,
  ];

  const exactNameKeysSet = new Set<string>();

  for (const rawName of exactRawNames) {
    if (!rawName) continue;
    for (const key of uniqueNormalizedKeys(rawName)) {
      if (key.length > 0) {
        exactNameKeysSet.add(key);
      }
    }
  }

  const topicKeysSet = new Set<string>();
  for (const rawTopic of item.termos_populares) {
    for (const key of uniqueNormalizedKeys(rawTopic)) {
      // Regra inviolável: termos_populares NUNCA entram em exactNameKeysSet
      if (key.length > 0 && !exactNameKeysSet.has(key)) {
        topicKeysSet.add(key);
      }
    }
  }

  const dosageTokensSet = new Set<string>();
  for (const ap of item.apresentacoes) {
    for (const numToken of extractNumericTokens(ap.descricao_dosagem)) {
      dosageTokensSet.add(numToken);
    }
  }

  const allSearchKeysList = Array.from(new Set([...exactNameKeysSet, ...topicKeysSet]));
  const combinedDosageKeys: string[] = [];

  for (const nameKey of exactNameKeysSet) {
    for (const numToken of dosageTokensSet) {
      combinedDosageKeys.push(`${nameKey} ${numToken}`);
    }
  }

  return {
    item,
    exactNameKeysSet,
    topicKeysSet,
    allSearchKeysList,
    dosageTokensSet,
    combinedDosageKeys,
  };
}

/**
 * Avalia se um documento indexado corresponde de forma EXATA à consulta:
 * - Apenas `principio_ativo` e `nomes_comerciais` (e a substância química central) geram `exato: true`.
 * - `termos_populares` NUNCA entram no conjunto de match exato.
 * - Com dosagem na consulta (ex.: `"metformina 850"` ou `"metformina 850mg"`):
 *   o nome base normalizado é idêntico a `principio_ativo` ou `nomes_comerciais` E todos os
 *   tokens numéricos da consulta existem nas apresentações do item.
 */
function isExactMatch(
  doc: IndexedMedicationDoc,
  queryKeys: readonly string[],
  baseNameKeys: readonly string[],
  dosageNumbers: readonly string[],
): boolean {
  if (dosageNumbers.length === 0) {
    return queryKeys.some((qKey) => doc.exactNameKeysSet.has(qKey));
  }

  if (baseNameKeys.length === 0) {
    return false;
  }

  const baseNameMatchesExactly = baseNameKeys.some((bKey) => doc.exactNameKeysSet.has(bKey));
  if (!baseNameMatchesExactly) {
    return false;
  }

  return dosageNumbers.every((num) => doc.dosageTokensSet.has(num));
}

function isTopicMatch(
  doc: IndexedMedicationDoc,
  queryKeys: readonly string[],
  baseNameKeys: readonly string[],
): boolean {
  return (
    queryKeys.some((qKey) => doc.topicKeysSet.has(qKey)) ||
    (baseNameKeys.length > 0 && baseNameKeys.some((bKey) => doc.topicKeysSet.has(bKey)))
  );
}

/**
 * Cria uma instância reutilizável do motor de busca sobre o catálogo de medicamentos.
 * - Exige mínimo de 2 caracteres válidos na consulta antes de listar resultados.
 * - Nunca seleciona automaticamente resultados aproximados: retorna `{ item, exato, porAssunto }`.
 */
export function createMedicationSearchEngine(
  catalogo: readonly Medicamento[],
): MedicationSearchEngine {
  const docs = catalogo.map(buildIndexedDoc);

  const fuseByName = new Fuse(docs, {
    keys: ['allSearchKeysList'],
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const fuseWithDosage = new Fuse(docs, {
    keys: ['allSearchKeysList', 'combinedDosageKeys'],
    includeScore: true,
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  function search(query: string, options?: SearchOptions): ResultadoBusca[] {
    const sanitizedRaw = typeof query === 'string' ? query.slice(0, 100) : '';
    const queryKeys = uniqueNormalizedKeys(sanitizedRaw);
    if (queryKeys.length === 0) {
      return [];
    }

    // Exige mínimo de 2 caracteres alfanuméricos válidos antes de listar resultados
    const hasMinChars = queryKeys.some((k) => k.replace(/\s+/g, '').length >= 2);
    if (!hasMinChars) {
      return [];
    }

    const parsed = parseMedicationQuery(sanitizedRaw);
    const limit = options?.limit ?? 20;

    const candidateMap = new Map<string, { doc: IndexedMedicationDoc; bestScore: number }>();

    const registerCandidate = (doc: IndexedMedicationDoc, score: number): void => {
      const existing = candidateMap.get(doc.item.slug);
      if (!existing || score < existing.bestScore) {
        candidateMap.set(doc.item.slug, { doc, bestScore: score });
      }
    };

    for (const doc of docs) {
      const matchesExactName =
        queryKeys.some((qk) => doc.exactNameKeysSet.has(qk)) ||
        (parsed.baseNameKeys.length > 0 &&
          parsed.baseNameKeys.some((bk) => doc.exactNameKeysSet.has(bk)));

      const matchesTopic = isTopicMatch(doc, queryKeys, parsed.baseNameKeys);

      if (matchesExactName) {
        registerCandidate(doc, 0);
      } else if (matchesTopic) {
        registerCandidate(doc, 0.05);
      }
    }

    // 2. Busca aproximada via Fuse.js usando a mesma função normalizePTBR
    const searchTargets =
      parsed.dosageNumbers.length > 0 && parsed.baseNameKeys.length > 0
        ? Array.from(new Set([...parsed.baseNameKeys, normalizePTBR(query)]))
        : queryKeys;

    const fuseInstance = parsed.dosageNumbers.length > 0 ? fuseWithDosage : fuseByName;

    for (const target of searchTargets) {
      if (!target || target.replace(/\s+/g, '').length < 2) continue;
      const hits = fuseInstance.search(target);
      for (const hit of hits) {
        registerCandidate(hit.item, hit.score ?? 1);
      }
    }

    // 3. Classifica cada candidato com a regra estrita de `exato` vs `porAssunto` vs aproximado
    const evaluated = Array.from(candidateMap.values()).map(({ doc, bestScore }) => {
      const exato = isExactMatch(doc, queryKeys, parsed.baseNameKeys, parsed.dosageNumbers);
      const porAssunto = !exato && isTopicMatch(doc, queryKeys, parsed.baseNameKeys);
      return {
        item: doc.item,
        exato,
        porAssunto,
        bestScore,
      };
    });

    evaluated.sort((a, b) => {
      if (a.exato !== b.exato) {
        return a.exato ? -1 : 1;
      }
      if (Boolean(a.porAssunto) !== Boolean(b.porAssunto)) {
        return a.porAssunto ? -1 : 1;
      }
      return a.bestScore - b.bestScore;
    });

    return evaluated.slice(0, limit).map(({ item, exato, porAssunto }) => ({
      item,
      exato,
      ...(porAssunto ? { porAssunto: true } : {}),
    }));
  }

  return { search };
}

/**
 * Atalho funcional para buscar diretamente em uma lista de medicamentos.
 */
export function searchMedications(
  catalogo: readonly Medicamento[],
  query: string,
  options?: SearchOptions,
): ResultadoBusca[] {
  return createMedicationSearchEngine(catalogo).search(query, options);
}
