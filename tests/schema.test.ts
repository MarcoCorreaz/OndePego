import { describe, expect, it } from 'vitest';
import {
  ApresentacaoMedicamento,
  EstabelecimentosFile,
  MedicamentoCatalogo,
  MedicamentosFile,
  Meta,
} from '@/types/schema';
import metaJson from '../data/meta.json';
import medicamentosJson from '../data/medicamentos.json';
import estabelecimentosJson from '../data/estabelecimentos.json';

describe('Schemas Zod (fonte única)', () => {
  it('valida data/meta.json, data/medicamentos.json e data/estabelecimentos.json de fixture', () => {
    expect(Meta.safeParse(metaJson).success).toBe(true);
    expect(MedicamentosFile.safeParse(medicamentosJson).success).toBe(true);
    expect(EstabelecimentosFile.safeParse(estabelecimentosJson).success).toBe(true);
  });

  it('permite omitir id_dcb e codigo_atc em MedicamentoCatalogo', () => {
    const parsed = MedicamentoCatalogo.safeParse({
      slug: 'med-sem-dcb',
      principio_ativo: 'MEDICAMENTO_TESTE_SEM_DCB',
      nomes_comerciais: [],
      termos_populares: [],
      apresentacoes: [
        {
          id_apresentacao: 'ap-1',
          descricao_dosagem: 'DOSAGEM_TESTE',
          status_remume_cuiaba: 'PADRONIZADO_REMUME',
          local_dispensacao_sus: 'UBS',
          farmacia_popular_gratuito: false,
          requisito_farmacia_popular: 'NAO_DISPONIVEL',
        },
      ],
      __fixture: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejeita item fora do Farmácia Popular com requisito diferente de NAO_DISPONIVEL', () => {
    const parsed = ApresentacaoMedicamento.safeParse({
      id_apresentacao: 'ap-invalida',
      descricao_dosagem: 'DOSAGEM_TESTE',
      status_remume_cuiaba: 'PADRONIZADO_REMUME',
      local_dispensacao_sus: 'UBS',
      farmacia_popular_gratuito: false,
      requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita medicamento sem apresentações ou com campos obrigatórios vazios', () => {
    const semApresentacao = MedicamentoCatalogo.safeParse({
      slug: 'med-vazio',
      principio_ativo: 'MEDICAMENTO_TESTE',
      nomes_comerciais: [],
      termos_populares: [],
      apresentacoes: [],
      __fixture: true,
    });
    expect(semApresentacao.success).toBe(false);

    const slugVazio = MedicamentoCatalogo.safeParse({
      slug: '',
      principio_ativo: 'MEDICAMENTO_TESTE',
      nomes_comerciais: [],
      termos_populares: [],
      apresentacoes: [
        {
          id_apresentacao: 'ap-1',
          descricao_dosagem: 'DOSAGEM_TESTE',
          status_remume_cuiaba: 'PADRONIZADO_REMUME',
          local_dispensacao_sus: 'UBS',
          farmacia_popular_gratuito: false,
          requisito_farmacia_popular: 'NAO_DISPONIVEL',
        },
      ],
      __fixture: true,
    });
    expect(slugVazio.success).toBe(false);
  });

  it('rejeita datas fora do formato ISO AAAA-MM-DD em Meta', () => {
    const parsed = Meta.safeParse({
      ...metaJson,
      data_remume: '10/01/2026',
    });
    expect(parsed.success).toBe(false);
  });
});
