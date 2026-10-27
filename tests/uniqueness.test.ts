import { describe, expect, it } from 'vitest';
import {
  findDuplicatePresentations,
  findDuplicates,
} from '@/lib/dataRules';
import type { Estabelecimento, Medicamento } from '@/types/schema';

const baseMed: Medicamento = {
  slug: 'med-teste-1',
  principio_ativo: 'MEDICAMENTO_TESTE_1',
  nomes_comerciais: [],
  termos_populares: [],
  apresentacoes: [
    {
      id_apresentacao: 'ap-1',
      descricao_dosagem: 'DOSAGEM_TESTE_1',
      status_remume_cuiaba: 'PADRONIZADO_REMUME',
      local_dispensacao_sus: 'UBS',
      farmacia_popular_gratuito: false,
      requisito_farmacia_popular: 'NAO_DISPONIVEL',
    },
  ],
  __fixture: true,
};

const baseEstab: Estabelecimento = {
  id: 'estab-teste-1',
  nome_fantasia: 'UNIDADE_TESTE_1',
  tipo: 'UBS',
  bairro: 'BAIRRO_TESTE',
  endereco_completo: 'ENDERECO_TESTE',
  coordenadas: {
    lat: -15.6,
    lng: -56.1,
    auditado_manualmente: true,
  },
  atributos_operacionais: {
    status_funcionamento: 'NORMAL',
  },
  __fixture: true,
};

describe('Unicidade de slugs, ids e id_apresentacao', () => {
  it('não acusa duplicata quando todos os slugs e ids são únicos', () => {
    const meds: Medicamento[] = [baseMed, { ...baseMed, slug: 'med-teste-2' }];
    const estabs: Estabelecimento[] = [baseEstab, { ...baseEstab, id: 'estab-teste-2' }];

    expect(findDuplicates(meds, (m) => m.slug, 'slug')).toEqual([]);
    expect(findDuplicates(estabs, (e) => e.id, 'id')).toEqual([]);
    expect(findDuplicatePresentations(meds)).toEqual([]);
  });

  it('detecta slug duplicado em medicamentos', () => {
    const meds: Medicamento[] = [baseMed, { ...baseMed }];
    const dupes = findDuplicates(meds, (m) => m.slug, 'slug');

    expect(dupes).toHaveLength(1);
    expect(dupes[0]).toEqual({
      key: 'slug',
      value: 'med-teste-1',
      indices: [0, 1],
    });
  });

  it('detecta id duplicado em estabelecimentos', () => {
    const estabs: Estabelecimento[] = [baseEstab, { ...baseEstab }];
    const dupes = findDuplicates(estabs, (e) => e.id, 'id');

    expect(dupes).toHaveLength(1);
    expect(dupes[0]).toEqual({
      key: 'id',
      value: 'estab-teste-1',
      indices: [0, 1],
    });
  });

  it('detecta id_apresentacao duplicado dentro do mesmo medicamento', () => {
    const medComApresentacaoDuplicada: Medicamento = {
      ...baseMed,
      apresentacoes: [
        baseMed.apresentacoes[0]!,
        { ...baseMed.apresentacoes[0]!, descricao_dosagem: 'OUTRA_DOSAGEM_TESTE' },
      ],
    };

    const issues = findDuplicatePresentations([medComApresentacaoDuplicada]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      slug: 'med-teste-1',
      id_apresentacao: 'ap-1',
      indices: [0, 1],
    });
  });
});
