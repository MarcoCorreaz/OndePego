import type { MetaDados } from '@/types/schema';

const MS_PER_DAY = 86_400_000;

export interface FreshnessResult {
  desatualizado: boolean;
  dataReferencia: string;
  diasDesde: number;
  limiteDias: number;
}

export function parseIsoDateUTC(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Data inválida (esperado AAAA-MM-DD): ${isoDate}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcMs = Date.UTC(year, month - 1, day);
  const check = new Date(utcMs);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error(`Data calendário inexistente: ${isoDate}`);
  }
  return utcMs;
}

function toUtcMidnightMs(now: Date | string): number {
  if (typeof now === 'string') {
    return parseIsoDateUTC(now);
  }
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Calcula em tempo de execução se o conjunto de dados está desatualizado (DAS seção 6.4).
 * Considera a data mais antiga entre `data_remume`, `data_elenco_pfpb` e `data_infoms`.
 */
export function getFreshness(
  meta: MetaDados,
  now: Date | string = new Date(),
  limiteDiasOverride?: number,
): FreshnessResult {
  const limiteDias = limiteDiasOverride ?? meta.limite_dias_desatualizado;
  if (!Number.isInteger(limiteDias) || limiteDias <= 0) {
    throw new Error(`Limite de dias inválido: ${limiteDias}`);
  }

  const fontes = [meta.data_remume, meta.data_elenco_pfpb, meta.data_infoms];
  let oldestDateStr = fontes[0]!;
  let oldestMs = parseIsoDateUTC(oldestDateStr);

  for (const dataStr of fontes.slice(1)) {
    const ms = parseIsoDateUTC(dataStr);
    if (ms < oldestMs) {
      oldestMs = ms;
      oldestDateStr = dataStr;
    }
  }

  const nowMs = toUtcMidnightMs(now);
  const diasDesde = Math.floor((nowMs - oldestMs) / MS_PER_DAY);

  return {
    desatualizado: diasDesde > limiteDias,
    dataReferencia: oldestDateStr,
    diasDesde,
    limiteDias,
  };
}
