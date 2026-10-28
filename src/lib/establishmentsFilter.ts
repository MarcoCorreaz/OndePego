import { normalizePTBR } from '@/lib/normalize';
import type { Apresentacao, Estabelecimento } from '@/types/schema';

export type EstablishmentFilterType =
  | 'TODOS'
  | 'FARMACIA_POPULAR'
  | 'UBS'
  | 'POLICLINICA'
  | 'UPA';

export interface FilterEstablishmentsOptions {
  tipo?: EstablishmentFilterType;
  bairro?: string;
  query?: string;
}

export interface EstablishmentBadgeMeta {
  code: 'FP' | 'UBS' | 'POL' | 'UPA';
  shortLabel: string;
  fullLabel: string;
  isPharmacy: boolean;
}

export function getEstablishmentTypeBadge(
  tipo: Estabelecimento['tipo'],
): EstablishmentBadgeMeta {
  switch (tipo) {
    case 'FARMACIA_POPULAR':
      return {
        code: 'FP',
        shortLabel: 'Farmácia Popular',
        fullLabel: 'Farmácia credenciada ao Farmácia Popular',
        isPharmacy: true,
      };
    case 'UBS':
      return {
        code: 'UBS',
        shortLabel: 'Posto de saúde (UBS)',
        fullLabel: 'Unidade Básica de Saúde (Posto municipal)',
        isPharmacy: false,
      };
    case 'POLICLINICA':
      return {
        code: 'POL',
        shortLabel: 'Policlínica',
        fullLabel: 'Policlínica Municipal',
        isPharmacy: false,
      };
    case 'UPA':
      return {
        code: 'UPA',
        shortLabel: 'UPA 24h',
        fullLabel: 'Unidade de Pronto Atendimento (UPA 24h)',
        isPharmacy: false,
      };
  }
}

/**
 * Filtra estabelecimentos por tipo, bairro e termo de busca (nome fantasia, endereço ou bairro).
 */
export function filterEstablishments(
  estabelecimentos: readonly Estabelecimento[],
  options: FilterEstablishmentsOptions = {},
): Estabelecimento[] {
  const { tipo = 'TODOS', bairro = '', query = '' } = options;
  const normBairro = bairro ? normalizePTBR(bairro) : '';
  const normQuery = query ? normalizePTBR(query) : '';

  return estabelecimentos.filter((est) => {
    if (tipo !== 'TODOS' && est.tipo !== tipo) {
      return false;
    }

    if (
      est.tipo === 'FARMACIA_POPULAR' &&
      est.atributos_operacionais.credenciamento_pfpb_ativo === false
    ) {
      return false;
    }

    if (normBairro && normalizePTBR(est.bairro) !== normBairro) {
      return false;
    }

    if (normQuery) {
      const searchable = normalizePTBR(
        `${est.nome_fantasia} ${est.bairro} ${est.endereco_completo}`,
      );
      if (!searchable.includes(normQuery)) {
        return false;
      }
    }

    return true;
  });
}

const STATUS_PRIORITY: Record<
  Estabelecimento['atributos_operacionais']['status_funcionamento'],
  number
> = {
  INTERDITADO: 0,
  CONTINGENCIA_PARCIAL: 1,
  NORMAL: 2,
};

/**
 * Retorna as unidades de urgência e especialidades (`UPA` e `POLICLINICA`),
 * priorizando aquelas com alertas operacionais (`INTERDITADO` ou `CONTINGENCIA_PARCIAL`).
 */
export function getPlantaoEstablishments(
  estabelecimentos: readonly Estabelecimento[],
): Estabelecimento[] {
  return estabelecimentos
    .filter((e) => e.tipo === 'UPA' || e.tipo === 'POLICLINICA')
    .sort((a, b) => {
      const prioA = STATUS_PRIORITY[a.atributos_operacionais.status_funcionamento];
      const prioB = STATUS_PRIORITY[b.atributos_operacionais.status_funcionamento];
      if (prioA !== prioB) {
        return prioA - prioB;
      }
      return a.nome_fantasia.localeCompare(b.nome_fantasia, 'pt-BR');
    });
}

/**
 * Retorna os estabelecimentos marcados como polo municipal de vacinação.
 */
export function getVaccinationUnits(
  estabelecimentos: readonly Estabelecimento[],
): Estabelecimento[] {
  return estabelecimentos
    .filter((e) => e.atributos_operacionais.polo_vacinacao_municipal === true)
    .sort((a, b) => a.nome_fantasia.localeCompare(b.nome_fantasia, 'pt-BR'));
}

/**
 * Retorna as unidades municipais que dispensam psicotrópicos / controlados do SUS.
 */
export function getControlledDispensationUnits(
  estabelecimentos: readonly Estabelecimento[],
): Estabelecimento[] {
  return estabelecimentos
    .filter((e) => e.atributos_operacionais.dispensa_psicotropicos_sus === true)
    .sort((a, b) => a.nome_fantasia.localeCompare(b.nome_fantasia, 'pt-BR'));
}

/**
 * Retorna as unidades públicas municipais (`UBS`, `POLICLINICA`, `UPA`) onde a apresentação
 * da REMUME é dispensada:
 * - Se `status_remume_cuiaba !== 'PADRONIZADO_REMUME'` ou `local_dispensacao_sus === 'NAO_APLICAVEL'`, retorna `[]`.
 * - Se `local_dispensacao_sus === 'POLICLINICA_PORTARIA344'`, filtra apenas unidades públicas com `dispensa_psicotropicos_sus === true`.
 * - Caso contrário, retorna as unidades públicas da rede municipal (`UBS`, `POLICLINICA`, `UPA`).
 */
export function getPublicUnitsForMedication(
  apresentacao: Pick<Apresentacao, 'status_remume_cuiaba' | 'local_dispensacao_sus'>,
  estabelecimentos: readonly Estabelecimento[],
): Estabelecimento[] {
  if (
    apresentacao.status_remume_cuiaba !== 'PADRONIZADO_REMUME' ||
    apresentacao.local_dispensacao_sus === 'NAO_APLICAVEL'
  ) {
    return [];
  }

  const publicUnits = estabelecimentos.filter(
    (e) => e.tipo === 'UBS' || e.tipo === 'POLICLINICA' || e.tipo === 'UPA',
  );

  const filtered =
    apresentacao.local_dispensacao_sus === 'POLICLINICA_PORTARIA344'
      ? publicUnits.filter((e) => e.atributos_operacionais.dispensa_psicotropicos_sus === true)
      : publicUnits;

  return filtered.sort((a, b) => a.nome_fantasia.localeCompare(b.nome_fantasia, 'pt-BR'));
}
