import { describe, expect, it } from 'vitest';
import { getFreshness } from '@/lib/freshness';
import type { MetaDados } from '@/types/schema';

const baseMeta: MetaDados = {
  versao: '0.0.0-fixture',
  data_remume: '2026-01-10',
  data_elenco_pfpb: '2026-01-20',
  data_infoms: '2026-01-25',
  ultima_verificacao_ci: '2026-01-26',
  limite_dias_desatualizado: 45,
  flags: {
    estoque_oficial: false,
  },
  __fixture: true,
};

describe('Cálculo de frescor de dados (freshness)', () => {
  it('usa a data mais antiga entre as três fontes oficiais como referência', () => {
    const res = getFreshness(baseMeta, '2026-02-09');
    expect(res.dataReferencia).toBe('2026-01-10');
    expect(res.diasDesde).toBe(30);
    expect(res.desatualizado).toBe(false);
  });

  it('marca como não desatualizado exatamente no dia limite (N dias) e desatualizado em N+1', () => {
    // 2026-01-10 + 45 dias = 2026-02-24
    const noLimite = getFreshness(baseMeta, '2026-02-24');
    expect(noLimite.diasDesde).toBe(45);
    expect(noLimite.desatualizado).toBe(false);

    const aposLimite = getFreshness(baseMeta, '2026-02-25');
    expect(aposLimite.diasDesde).toBe(46);
    expect(aposLimite.desatualizado).toBe(true);
  });

  it('permite sobrescrever o limite de dias por parâmetro', () => {
    const res = getFreshness(baseMeta, '2026-01-25', 10);
    expect(res.diasDesde).toBe(15);
    expect(res.limiteDias).toBe(10);
    expect(res.desatualizado).toBe(true);
  });

  it('aceita instância de Date em UTC sem sofrer desvio de fuso local', () => {
    const dateNow = new Date(Date.UTC(2026, 0, 20, 23, 59, 59));
    const res = getFreshness(baseMeta, dateNow);
    expect(res.diasDesde).toBe(10);
    expect(res.desatualizado).toBe(false);
  });
});
