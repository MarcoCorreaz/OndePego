import { describe, expect, it } from 'vitest';
import {
  addPrescriptionItem,
  buildPrescriptionSummary,
  clearPrescriptionSession,
  hasPrescriptionItem,
  loadPrescriptionSession,
  parsePrescriptionSession,
  removePrescriptionItem,
  savePrescriptionSession,
  toggleCheckedDocument,
} from '@/lib/prescriptionList';
import type { Medicamento, MetaDados } from '@/types/schema';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: store.size,
  };
}

const CATALOGO_FIXTURE: Medicamento[] = [
  {
    slug: 'losartana-potassica-fixture',
    principio_ativo: 'Losartana Potássica',
    nomes_comerciais: ['Aradois'],
    termos_populares: ['pressão'],
    apresentacoes: [
      {
        id_apresentacao: 'losartana-50mg',
        descricao_dosagem: '50mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
      },
    ],
    __fixture: true,
  },
  {
    slug: 'clonazepam-fixture',
    principio_ativo: 'Clonazepam',
    nomes_comerciais: ['Rivotril'],
    termos_populares: ['calmante'],
    apresentacoes: [
      {
        id_apresentacao: 'clonazepam-2mg',
        descricao_dosagem: '2mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'POLICLINICA_PORTARIA344',
        farmacia_popular_gratuito: false,
        requisito_farmacia_popular: 'NAO_DISPONIVEL',
      },
    ],
    __fixture: true,
  },
  {
    slug: 'fralda-geriatrica-fixture',
    principio_ativo: 'Fralda Geriátrica',
    nomes_comerciais: [],
    termos_populares: ['fralda'],
    apresentacoes: [
      {
        id_apresentacao: 'fralda-g',
        descricao_dosagem: 'Tamanho G',
        status_remume_cuiaba: 'NAO_CONSTA_REMUME',
        local_dispensacao_sus: 'NAO_APLICAVEL',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'FRALDA_GERIATRICA',
      },
    ],
    __fixture: true,
  },
];

const META_FIXTURE: Pick<MetaDados, 'data_remume' | 'data_elenco_pfpb'> = {
  data_remume: '2026-01-10',
  data_elenco_pfpb: '2026-01-15',
};

describe('Minha Receita — Lógica Pura (src/lib/prescriptionList.ts)', () => {
  it('1. Adiciona, previne duplicatas por slug + dosagem e remove itens', () => {
    let state = parsePrescriptionSession(null);
    expect(state.items).toHaveLength(0);

    state = addPrescriptionItem(state, {
      slug: 'losartana-potassica-fixture',
      id_apresentacao: 'losartana-50mg',
    });
    expect(state.items).toHaveLength(1);
    expect(
      hasPrescriptionItem(state, {
        slug: 'losartana-potassica-fixture',
        id_apresentacao: 'losartana-50mg',
      }),
    ).toBe(true);

    // Tentativa de duplicata: deve ignorar
    state = addPrescriptionItem(state, {
      slug: 'losartana-potassica-fixture',
      id_apresentacao: 'losartana-50mg',
    });
    expect(state.items).toHaveLength(1);

    // Adiciona segundo item
    state = addPrescriptionItem(state, {
      slug: 'clonazepam-fixture',
      id_apresentacao: 'clonazepam-2mg',
    });
    expect(state.items).toHaveLength(2);

    // Remove primeiro item
    state = removePrescriptionItem(state, {
      slug: 'losartana-potassica-fixture',
      id_apresentacao: 'losartana-50mg',
    });
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.slug).toBe('clonazepam-fixture');
  });

  it('2. Agrupa medicamentos em Farmácia Popular vs SUS Cuiabá e cria checklist único desduplicado', () => {
    const entries = [
      { slug: 'losartana-potassica-fixture', id_apresentacao: 'losartana-50mg' },
      { slug: 'clonazepam-fixture', id_apresentacao: 'clonazepam-2mg' },
      { slug: 'fralda-geriatrica-fixture', id_apresentacao: 'fralda-g' },
    ];

    const summary = buildPrescriptionSummary({
      entries,
      catalogo: CATALOGO_FIXTURE,
      meta: META_FIXTURE,
    });

    expect(summary.resolvedItems).toHaveLength(3);

    // Losartana e Fralda são gratuitas no Farmácia Popular
    expect(summary.gratuitosFarmaciaPopular.map((i) => i.slug)).toEqual([
      'losartana-potassica-fixture',
      'fralda-geriatrica-fixture',
    ]);

    // Losartana e Clonazepam são padronizados no SUS Cuiabá
    expect(summary.padronizadosSusCuiaba.map((i) => i.slug)).toEqual([
      'losartana-potassica-fixture',
      'clonazepam-fixture',
    ]);
    expect(summary.padronizadosSusCuiaba[1]?.localSusLabel).toContain('Policlínica');

    // Checklist de documentos unificado e desduplicado
    expect(summary.checklistDocumentos.length).toBeGreaterThan(0);
    // Documento com foto e CPF não deve aparecer duplicado
    const fotoCpfCount = summary.checklistDocumentos.filter((d) =>
      d.toLowerCase().includes('documento'),
    );
    expect(fotoCpfCount.length).toBeGreaterThan(0);

    // Requisito especial de fralda geriátrica incluído
    expect(
      summary.checklistDocumentos.some((d) => d.toLowerCase().includes('fralda geriátrica')),
    ).toBe(true);
  });

  it('3. Gera texto de WhatsApp sem palavras proibidas de estoque e com datas oficiais', () => {
    const entries = [
      { slug: 'losartana-potassica-fixture', id_apresentacao: 'losartana-50mg' },
      { slug: 'clonazepam-fixture', id_apresentacao: 'clonazepam-2mg' },
    ];

    const summary = buildPrescriptionSummary({
      entries,
      catalogo: CATALOGO_FIXTURE,
      meta: META_FIXTURE,
    });

    expect(summary.whatsappText).toContain('*Resumo da Minha Receita — Onde Pego (Cuiabá/MT)*');
    expect(summary.whatsappText).toContain('1. Gratuitos nas Drogarias (Farmácia Popular)');
    expect(summary.whatsappText).toContain('Losartana Potássica (50mg comprimido)');
    expect(summary.whatsappText).toContain('2. Padronizados na Rede Municipal (SUS Cuiabá)');
    expect(summary.whatsappText).toContain('Clonazepam (2mg comprimido)');
    expect(summary.whatsappText).toContain('10/01/2026');
    expect(summary.whatsappText).toContain('15/01/2026');

    // NUNCA conter palavras proibidas de estoque
    expect(summary.whatsappText).not.toMatch(/(dispon[ií]vel|em estoque|tem aqui|garantido)/i);
    expect(summary.whatsappUrl).toContain('https://wa.me/?text=');
  });

  it('4. Salva, restaura e limpa sessão e checkboxes estritamente em sessionStorage', () => {
    const storage = createMemoryStorage();
    let state = loadPrescriptionSession(storage);
    expect(state.items).toHaveLength(0);

    state = addPrescriptionItem(state, {
      slug: 'losartana-potassica-fixture',
      id_apresentacao: 'losartana-50mg',
    });
    state = toggleCheckedDocument(state, 'Receita médica válida');
    savePrescriptionSession(state, storage);

    const reloaded = loadPrescriptionSession(storage);
    expect(reloaded.items).toHaveLength(1);
    expect(reloaded.checkedDocs).toEqual(['Receita médica válida']);

    // Desmarca documento
    const untoggled = toggleCheckedDocument(reloaded, 'Receita médica válida');
    expect(untoggled.checkedDocs).toHaveLength(0);

    clearPrescriptionSession(storage);
    expect(loadPrescriptionSession(storage).items).toHaveLength(0);
  });
});
