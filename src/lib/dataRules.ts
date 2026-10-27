import type { Estabelecimento, Medicamento, MetaDados } from '@/types/schema';

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
  const warnings: string[] = [];
  for (const est of estabelecimentos) {
    if (est.tipo === 'FARMACIA_POPULAR' && !est.coordenadas.auditado_manualmente) {
      warnings.push(
        `estabelecimentos.json › id="${est.id}" (${est.nome_fantasia}): coordenada com auditado_manualmente=false`,
      );
    }
  }
  return warnings;
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

  if (isProduction) {
    const fixtures = findFixtures(meta, medicamentos, estabelecimentos);
    for (const f of fixtures) {
      errors.push(`NODE_ENV=production: registro de fixture não permitido em produção: ${f}`);
    }
  }

  warnings.push(...findUnauditedPharmacies(estabelecimentos));

  return { errors, warnings };
}
