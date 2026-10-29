import { describe, expect, it } from 'vitest';
import { createMedicationSearchEngine, searchMedications } from '@/lib/searchEngine';
import type { Medicamento } from '@/types/schema';

const FIXTURE_CATALOG: Medicamento[] = [
  {
    slug: 'losartana-fixture',
    principio_ativo: 'Losartana Potássica',
    nomes_comerciais: ['Aradois', 'Corus'],
    termos_populares: ['losartana', 'remedio de pressao teste'],
    apresentacoes: [
      {
        id_apresentacao: 'ap-los-50',
        descricao_dosagem: '50 mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
      },
    ],
    __fixture: true,
  },
  {
    slug: 'lovastatina-fixture',
    principio_ativo: 'Lovastatina',
    nomes_comerciais: ['Mevacor Teste'],
    termos_populares: [],
    apresentacoes: [
      {
        id_apresentacao: 'ap-lov-20',
        descricao_dosagem: '20 mg comprimido',
        status_remume_cuiaba: 'NAO_CONSTA_REMUME',
        local_dispensacao_sus: 'NAO_APLICAVEL',
        farmacia_popular_gratuito: false,
        requisito_farmacia_popular: 'NAO_DISPONIVEL',
      },
    ],
    __fixture: true,
  },
  {
    slug: 'prednisona-fixture',
    principio_ativo: 'Prednisona',
    nomes_comerciais: ['Meticorten Teste'],
    termos_populares: [],
    apresentacoes: [
      {
        id_apresentacao: 'ap-pred-20',
        descricao_dosagem: '20 mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: false,
        requisito_farmacia_popular: 'NAO_DISPONIVEL',
      },
    ],
    __fixture: true,
  },
  {
    slug: 'prednisolona-fixture',
    principio_ativo: 'Fosfato Sódico de Prednisolona',
    nomes_comerciais: ['Prelone Teste'],
    termos_populares: ['prednisolona'],
    apresentacoes: [
      {
        id_apresentacao: 'ap-prednisolona-3',
        descricao_dosagem: '3 mg/mL solução oral',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: false,
        requisito_farmacia_popular: 'NAO_DISPONIVEL',
      },
    ],
    __fixture: true,
  },
  {
    slug: 'hidralazina-fixture',
    principio_ativo: 'Cloridrato de Hidralazina',
    nomes_comerciais: ['Apresolina Teste'],
    termos_populares: ['hidralazina'],
    apresentacoes: [
      {
        id_apresentacao: 'ap-hidra-25',
        descricao_dosagem: '25 mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: false,
        requisito_farmacia_popular: 'NAO_DISPONIVEL',
      },
    ],
    __fixture: true,
  },
  {
    slug: 'hidroxizina-fixture',
    principio_ativo: 'Dicloridrato de Hidroxizina',
    nomes_comerciais: ['Hixizine Teste'],
    termos_populares: ['hidroxizina'],
    apresentacoes: [
      {
        id_apresentacao: 'ap-hidrox-25',
        descricao_dosagem: '25 mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: false,
        requisito_farmacia_popular: 'NAO_DISPONIVEL',
      },
    ],
    __fixture: true,
  },
  {
    slug: 'metformina-fixture',
    principio_ativo: 'Cloridrato de Metformina',
    nomes_comerciais: ['Glifage Teste'],
    termos_populares: ['metformina', 'remedio para açúcar alto teste'],
    apresentacoes: [
      {
        id_apresentacao: 'ap-met-500',
        descricao_dosagem: '500 mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
      },
      {
        id_apresentacao: 'ap-met-850',
        descricao_dosagem: '850 mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
      },
    ],
    __fixture: true,
  },
];

describe('Motor de busca de medicamentos (searchEngine)', () => {
  const engine = createMedicationSearchEngine(FIXTURE_CATALOG);

  it('retorna exato: true quando a consulta normalizada é igual ao princípio ativo ou comercial', () => {
    const porPrincipio = engine.search('Lovastatina');
    expect(porPrincipio[0]?.item.slug).toBe('lovastatina-fixture');
    expect(porPrincipio[0]?.exato).toBe(true);

    const porComercial = engine.search('Aradois');
    expect(porComercial[0]?.item.slug).toBe('losartana-fixture');
    expect(porComercial[0]?.exato).toBe(true);

    // Equivalência fonética (z -> s) gera a mesma chave normalizada
    const porFonetica = engine.search('Lozartana');
    expect(porFonetica[0]?.item.slug).toBe('losartana-fixture');
    expect(porFonetica[0]?.exato).toBe(true);
  });

  it('classifica busca por termo popular/assunto como exato: false e porAssunto: true graças ao estado "assunto"', () => {
    const semCedilha = engine.search('remedio para acucar alto teste');
    expect(semCedilha[0]?.item.slug).toBe('metformina-fixture');
    expect(semCedilha[0]?.exato).toBe(false);
    expect(semCedilha[0]?.porAssunto).toBe(true);
  });

  it('retorna exato: false para buscas aproximadas (erro de digitação) e preserva princípio ativo e dosagem', () => {
    const aproximado = engine.search('losartna');
    expect(aproximado.length).toBeGreaterThan(0);
    expect(aproximado[0]?.item.slug).toBe('losartana-fixture');
    expect(aproximado[0]?.exato).toBe(false);
    expect(aproximado[0]?.item.principio_ativo).toBe('Losartana Potássica');
    expect(aproximado[0]?.item.apresentacoes[0]?.descricao_dosagem).toBe('50 mg comprimido');
  });

  it('NUNCA marca pares de nomes parecidos como exato: true quando se busca o outro', () => {
    const pairs: Array<[string, string, string]> = [
      ['losartana', 'losartana-fixture', 'lovastatina-fixture'],
      ['lovastatina', 'lovastatina-fixture', 'losartana-fixture'],
      ['prednisona', 'prednisona-fixture', 'prednisolona-fixture'],
      ['prednisolona', 'prednisolona-fixture', 'prednisona-fixture'],
      ['hidralazina', 'hidralazina-fixture', 'hidroxizina-fixture'],
      ['hidroxizina', 'hidroxizina-fixture', 'hidralazina-fixture'],
    ];

    for (const [query, expectedExactSlug, forbiddenExactSlug] of pairs) {
      const results = engine.search(query);
      expect(results[0]?.item.slug).toBe(expectedExactSlug);
      expect(results[0]?.exato).toBe(true);

      const similarHit = results.find((r) => r.item.slug === forbiddenExactSlug);
      if (similarHit) {
        expect(similarHit.exato).toBe(false);
      }
    }
  });

  it('aceita entrada com dosagem ("metformina 850" e "metformina 850mg") como exato: true quando a dosagem consta no item', () => {
    const res850 = engine.search('metformina 850');
    expect(res850[0]?.item.slug).toBe('metformina-fixture');
    expect(res850[0]?.exato).toBe(true);

    const res850mg = engine.search('metformina 850mg');
    expect(res850mg[0]?.item.slug).toBe('metformina-fixture');
    expect(res850mg[0]?.exato).toBe(true);
  });

  it('retorna o item com exato: false quando a dosagem não existe ou é apenas substring numérica ("metformina 50" vs 500/850)', () => {
    const res1000 = engine.search('metformina 1000');
    expect(res1000[0]?.item.slug).toBe('metformina-fixture');
    expect(res1000[0]?.exato).toBe(false);

    // "50" NÃO pode dar match como substring dentro de "500 mg" nem "850 mg"
    const res50 = engine.search('metformina 50');
    expect(res50[0]?.item.slug).toBe('metformina-fixture');
    expect(res50[0]?.exato).toBe(false);
  });

  it('retorna lista vazia para consultas em branco ou apenas pontuação', () => {
    expect(searchMedications(FIXTURE_CATALOG, '   ')).toEqual([]);
    expect(searchMedications(FIXTURE_CATALOG, '--- !!!')).toEqual([]);
  });
});
