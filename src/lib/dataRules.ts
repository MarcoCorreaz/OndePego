import { GEO_BBOX, type Estabelecimento, type Medicamento, type MetaDados } from '@/types/schema';

export const PLACEHOLDER_CENTER_COORDS = {
  lat: -15.6014,
  lng: -56.0979,
} as const;

/**
 * Detecta se um par `(lat, lng)` é igual à coordenada-placeholder de centro (`CUIABA_VG_CENTER`:
 * `-15.6014, -56.0979` ou `-15.601, -56.097`).
 */
export function isPlaceholderCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return true;
  }
  return (
    Math.abs(lat - PLACEHOLDER_CENTER_COORDS.lat) <= 0.0005 &&
    Math.abs(lng - PLACEHOLDER_CENTER_COORDS.lng) <= 0.001
  );
}

/**
 * Verifica se um estabelecimento possui coordenada geográfica real e válida para exibição
 * de pino no mapa, cálculo de distância Haversine e botão "Ver rota".
 * Retorna `false` quando `sem_localizacao === true`, fora da `GEO_BBOX` ou igual ao placeholder `CUIABA_VG_CENTER`.
 */
export function hasValidMapCoordinates(
  est:
    | {
        coordenadas?: {
          lat?: number | null;
          lng?: number | null;
          auditado_manualmente?: boolean;
          sem_localizacao?: boolean;
        } | null;
      }
    | null
    | undefined,
): boolean {
  if (!est || !est.coordenadas) {
    return false;
  }
  const { lat, lng, sem_localizacao } = est.coordenadas;
  if (sem_localizacao === true) {
    return false;
  }
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return false;
  }
  if (
    lat < GEO_BBOX.minLat ||
    lat > GEO_BBOX.maxLat ||
    lng < GEO_BBOX.minLng ||
    lng > GEO_BBOX.maxLng
  ) {
    return false;
  }
  if (isPlaceholderCoordinate(lat, lng)) {
    return false;
  }
  return true;
}

export interface DuplicateIssue {
  key: string;
  value: string;
  indices: number[];
}

export interface PresentationDuplicateIssue {
  slug: string;
  id_apresentacao: string;
  indices: number[];
}

export interface ReservedStatusIssue {
  slug: string;
  id_apresentacao: string;
  status: string;
}

export interface ValidationReport {
  errors: string[];
  warnings: string[];
}

export function findDuplicates<T>(items: readonly T[], selector: (item: T) => string, keyName: string): DuplicateIssue[] {
  const seen = new Map<string, number[]>();
  items.forEach((item, index) => {
    const val = selector(item);
    const list = seen.get(val);
    if (list) {
      list.push(index);
    } else {
      seen.set(val, [index]);
    }
  });

  const duplicates: DuplicateIssue[] = [];
  for (const [value, indices] of seen.entries()) {
    if (indices.length > 1) {
      duplicates.push({ key: keyName, value, indices });
    }
  }
  return duplicates;
}

export function findDuplicatePresentations(medicamentos: readonly Medicamento[]): PresentationDuplicateIssue[] {
  const issues: PresentationDuplicateIssue[] = [];
  for (const med of medicamentos) {
    const dupes = findDuplicates(med.apresentacoes, (a) => a.id_apresentacao, 'id_apresentacao');
    for (const d of dupes) {
      issues.push({
        slug: med.slug,
        id_apresentacao: d.value,
        indices: d.indices,
      });
    }
  }
  return issues;
}

export function findReservedStatus(
  medicamentos: readonly Medicamento[],
  meta: MetaDados,
): ReservedStatusIssue[] {
  if (meta.flags.estoque_oficial) {
    return [];
  }
  const issues: ReservedStatusIssue[] = [];
  for (const med of medicamentos) {
    for (const ap of med.apresentacoes) {
      if (ap.status_remume_cuiaba === 'ALERTA_ABASTECIMENTO') {
        issues.push({
          slug: med.slug,
          id_apresentacao: ap.id_apresentacao,
          status: ap.status_remume_cuiaba,
        });
      }
    }
  }
  return issues;
}

export function findFixtures(
  meta: MetaDados,
  medicamentos: readonly Medicamento[],
  estabelecimentos: readonly Estabelecimento[],
): string[] {
  const found: string[] = [];
  if (meta.__fixture === true) {
    found.push('meta.json (__fixture: true)');
  }
  for (const med of medicamentos) {
    if (med.__fixture === true) {
      found.push(`medicamentos.json › slug="${med.slug}" (__fixture: true)`);
    }
  }
  for (const est of estabelecimentos) {
    if (est.__fixture === true) {
      found.push(`estabelecimentos.json › id="${est.id}" (__fixture: true)`);
    }
  }
  return found;
}

export function findUnauditedPharmacies(estabelecimentos: readonly Estabelecimento[]): string[] {
  const issues: string[] = [];
  for (const est of estabelecimentos) {
    if (est.tipo !== 'FARMACIA_POPULAR') {
      continue;
    }

    const reasons: string[] = [];
    if (est.coordenadas.sem_localizacao === true) {
      reasons.push('sem_localizacao=true (coordenada ausente)');
    } else if (isPlaceholderCoordinate(est.coordenadas.lat, est.coordenadas.lng)) {
      reasons.push('coordenada igual ao placeholder CUIABA_VG_CENTER');
    } else if (!hasValidMapCoordinates(est)) {
      reasons.push('coordenada inválida');
    }

    if (!est.coordenadas.auditado_manualmente) {
      reasons.push('coordenada com auditado_manualmente=false');
    }

    if (reasons.length > 0) {
      issues.push(
        `estabelecimentos.json › id="${est.id}" (${est.nome_fantasia}): ${reasons.join('; ')}`,
      );
    }
  }
  return issues;
}

export function validateBusinessRules(params: {
  meta: MetaDados;
  medicamentos: readonly Medicamento[];
  estabelecimentos: readonly Estabelecimento[];
  isProduction: boolean;
}): ValidationReport {
  const { meta, medicamentos, estabelecimentos, isProduction } = params;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (medicamentos.length === 0) {
    errors.push('medicamentos.json: a lista de medicamentos não pode estar vazia (length === 0)');
  }

  if (estabelecimentos.length === 0) {
    errors.push(
      'estabelecimentos.json: a lista de estabelecimentos não pode estar vazia (length === 0)',
    );
  }

  const slugDupes = findDuplicates(medicamentos, (m) => m.slug, 'slug');
  for (const d of slugDupes) {
    errors.push(
      `medicamentos.json: slug duplicado "${d.value}" nos índices [${d.indices.join(', ')}]`,
    );
  }

  const presDupes = findDuplicatePresentations(medicamentos);
  for (const p of presDupes) {
    errors.push(
      `medicamentos.json › slug="${p.slug}": id_apresentacao duplicado "${p.id_apresentacao}" nos índices [${p.indices.join(', ')}]`,
    );
  }

  const idDupes = findDuplicates(estabelecimentos, (e) => e.id, 'id');
  for (const d of idDupes) {
    errors.push(
      `estabelecimentos.json: id duplicado "${d.value}" nos índices [${d.indices.join(', ')}]`,
    );
  }

  const reserved = findReservedStatus(medicamentos, meta);
  for (const r of reserved) {
    errors.push(
      `medicamentos.json › slug="${r.slug}" › apresentacao="${r.id_apresentacao}": status "${r.status}" rejeitado enquanto meta.flags.estoque_oficial for false`,
    );
  }

  const pharmacyCoordIssues = findUnauditedPharmacies(estabelecimentos);
  warnings.push(...pharmacyCoordIssues);

  if (isProduction) {
    if (meta.versao.trim().toLowerCase().endsWith('-fixture')) {
      errors.push(
        `MODO PRODUÇÃO (--prod / NODE_ENV=production): meta.json › versao="${meta.versao}" termina com "-fixture" e não é permitida em produção`,
      );
    }

    const fixtures = findFixtures(meta, medicamentos, estabelecimentos);
    for (const f of fixtures) {
      errors.push(`NODE_ENV=production: registro de fixture não permitido em produção: ${f}`);
    }

    for (const issue of pharmacyCoordIssues) {
      errors.push(
        `MODO PRODUÇÃO (--prod): farmácia credenciada sem coordenada válida ou não auditada: ${issue}`,
      );
    }
  }

  return { errors, warnings };
}
