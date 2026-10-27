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
}

export interface SearchOptions {
  limit?: number;
}

interface IndexedMedicationDoc {
  item: Medicamento;
  /** Conjunto de chaves normalizadas (`ç→s` e `ç→c`) de principio_ativo, nomes_comerciais e termos_populares */
  nameKeysSet: Set<string>;
  /** Lista de chaves normalizadas para o Fuse.js */
  nameKeysList: string[];
  /** Conjunto de tokens numéricos exatos presentes nas apresentações do medicamento */
  dosageTokensSet: Set<string>;
  /** Chaves combinadas (nome + dosagem) para busca no Fuse.js quando a pessoa digita dosagem */
  combinedDosageKeys: string[];
}

export interface MedicationSearchEngine {
  search: (query: string, options?: SearchOptions) => ResultadoBusca[];
}

function buildIndexedDoc(item: Medicamento): IndexedMedicationDoc {
  const rawNames = [
    item.principio_ativo,
    ...item.nomes_comerciais,
    ...item.termos_populares,
  ];

  const nameKeysSet = new Set<string>();
  for (const rawName of rawNames) {
    for (const key of uniqueNormalizedKeys(rawName)) {
      if (key.length > 0) {
        nameKeysSet.add(key);
      }
    }
  }

  const dosageTokensSet = new Set<string>();
  for (const ap of item.apresentacoes) {
    for (const numToken of extractNumericTokens(ap.descricao_dosagem)) {
      dosageTokensSet.add(numToken);
    }
  }

  const nameKeysList = Array.from(nameKeysSet);
  const combinedDosageKeys: string[] = [];

  for (const nameKey of nameKeysList) {
    for (const numToken of dosageTokensSet) {
      combinedDosageKeys.push(`${nameKey} ${numToken}`);
    }
  }

  return {
    item,
    nameKeysSet,
    nameKeysList,
    dosageTokensSet,
    combinedDosageKeys,
  };
}

/**
 * Avalia se um documento indexado corresponde de forma EXATA à consulta (DAS Seção 8):
 * - Sem dosagem na consulta: alguma chave normalizada da consulta (`ç→s` ou `ç→c`)
 *   é idêntica a uma chave normalizada de nome do medicamento (`principio_ativo`,
 *   `nomes_comerciais` ou `termos_populares`).
 * - Com dosagem na consulta (ex.: `"metformina 850"` ou `"metformina 850mg"`):
 *   o nome base normalizado é idêntico a uma chave de nome do medicamento E todos os
 *   tokens numéricos da consulta existem como tokens numéricos exatos nas apresentações
 *   do item (fronteira de número: `"50"` NÃO casa com `"500"` nem `"250"`).
 */
function isExactMatch(
  doc: IndexedMedicationDoc,
  queryKeys: readonly string[],
  baseNameKeys: readonly string[],
  dosageNumbers: readonly string[],
): boolean {
  if (dosageNumbers.length === 0) {
    return queryKeys.some((qKey) => doc.nameKeysSet.has(qKey));
  }

  if (baseNameKeys.length === 0) {
    return false;
  }

  const baseNameMatchesExactly = baseNameKeys.some((bKey) => doc.nameKeysSet.has(bKey));
  if (!baseNameMatchesExactly) {
    return false;
  }

  return dosageNumbers.every((num) => doc.dosageTokensSet.has(num));
}

/**
 * Cria uma instância reutilizável do motor de busca sobre o catálogo de medicamentos.
 * Nunca seleciona automaticamente resultados aproximados: retorna `{ item, exato }`.
 */
export function createMedicationSearchEngine(
  catalogo: readonly Medicamento[],
): MedicationSearchEngine {
  const docs = catalogo.map(buildIndexedDoc);

  const fuseByName = new Fuse(docs, {
    keys: ['nameKeysList'],
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const fuseWithDosage = new Fuse(docs, {
    keys: ['nameKeysList', 'combinedDosageKeys'],
    includeScore: true,
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  function search(query: string, options?: SearchOptions): ResultadoBusca[] {
    const queryKeys = uniqueNormalizedKeys(query);
    if (queryKeys.length === 0) {
      return [];
    }

    const parsed = parseMedicationQuery(query);
    const limit = options?.limit ?? 20;

    // 1. Verifica correspondências de nome exato primeiro (garante que todo match exato
    // ou match de nome exato com dosagem divergente entre na lista antes da busca difusa)
    const candidateMap = new Map<string, { doc: IndexedMedicationDoc; bestScore: number }>();

    const registerCandidate = (doc: IndexedMedicationDoc, score: number): void => {
      const existing = candidateMap.get(doc.item.slug);
      if (!existing || score < existing.bestScore) {
        candidateMap.set(doc.item.slug, { doc, bestScore: score });
      }
    };

    for (const doc of docs) {
      const matchesWholeName = queryKeys.some((qk) => doc.nameKeysSet.has(qk));
      const matchesBaseName =
        parsed.baseNameKeys.length > 0 &&
        parsed.baseNameKeys.some((bk) => doc.nameKeysSet.has(bk));

      if (matchesWholeName || matchesBaseName) {
        registerCandidate(doc, 0);
      }
    }

    // 2. Busca aproximada via Fuse.js usando a mesma função normalizePTBR
    const searchTargets =
      parsed.dosageNumbers.length > 0 && parsed.baseNameKeys.length > 0
        ? Array.from(new Set([...parsed.baseNameKeys, normalizePTBR(query)]))
        : queryKeys;

    const fuseInstance = parsed.dosageNumbers.length > 0 ? fuseWithDosage : fuseByName;

    for (const target of searchTargets) {
      if (!target) continue;
      const hits = fuseInstance.search(target);
      for (const hit of hits) {
        registerCandidate(hit.item, hit.score ?? 1);
      }
    }

    // 3. Classifica cada candidato com a regra estrita de `exato` e ordena
    const evaluated = Array.from(candidateMap.values()).map(({ doc, bestScore }) => {
      const exato = isExactMatch(doc, queryKeys, parsed.baseNameKeys, parsed.dosageNumbers);
      return {
        item: doc.item,
        exato,
        bestScore,
      };
    });

    evaluated.sort((a, b) => {
      if (a.exato !== b.exato) {
        return a.exato ? -1 : 1;
      }
      return a.bestScore - b.bestScore;
    });

    return evaluated.slice(0, limit).map(({ item, exato }) => ({
      item,
      exato,
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
