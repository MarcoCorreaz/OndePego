import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CredenciadasSection } from '@/components/medication/CredenciadasSection';
import { getPublicUnitsForMedication } from '@/lib/establishmentsFilter';
import { getFreshness } from '@/lib/freshness';
import {
  gerarUrlRotaGoogleMaps,
  hasValidMapCoordinates,
  ordenarEstabelecimentosPorBairro,
  ordenarListaComOuSemDistancia,
} from '@/lib/geoEngine';
import {
  NORMATIVE_TEXTS,
  getStaleBannerCopy,
  getVia1Copy,
  getVia2Copy,
} from '@/lib/healthCopy';
import { CUIABA_VG_CENTER } from '@/lib/pmtilesProtocol';
import { buildPrecacheManifest } from '@/lib/precacheManifest';
import {
  DEFAULT_PREFS,
  applyPrefsToRootElement,
  loadPrefs,
  savePrefs,
  shouldReduceMotion,
} from '@/lib/prefs';
import { createMedicationSearchEngine } from '@/lib/searchEngine';
import {
  clearSearchSession,
  loadSearchSession,
  resolveMatchState,
  saveSearchSession,
} from '@/lib/searchSession';
import { buildMedicationDetailPath, gerarDadosCompartilhamentoMedicamento } from '@/lib/share';
import type { Estabelecimento, Medicamento, MetaDados } from '@/types/schema';

function createMemoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

const CATALOGO_JORNADAS_FIXTURE: Medicamento[] = [
  {
    __fixture: true,
    slug: 'cloridrato-de-metformina-fixture',
    principio_ativo: 'Cloridrato de Metformina (Fixture)',
    nomes_comerciais: ['Glifage Fixture'],
    termos_populares: ['diabetes', 'açúcar no sangue'],
    apresentacoes: [
      {
        id_apresentacao: 'metformina-500mg-fix',
        descricao_dosagem: '500mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
      },
      {
        id_apresentacao: 'metformina-850mg-fix',
        descricao_dosagem: '850mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
      },
    ],
  },
  {
    __fixture: true,
    slug: 'losartana-potassica-fixture',
    principio_ativo: 'Losartana Potássica (Fixture)',
    nomes_comerciais: ['Aradois Fixture'],
    termos_populares: ['pressão alta'],
    apresentacoes: [
      {
        id_apresentacao: 'losartana-50mg-fix',
        descricao_dosagem: '50mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
      },
    ],
  },
  {
    __fixture: true,
    slug: 'clonazepam-controlado-fixture',
    principio_ativo: 'Clonazepam Controlado (Fixture)',
    nomes_comerciais: ['Rivotril Fixture'],
    termos_populares: ['ansiedade', 'controlado'],
    apresentacoes: [
      {
        id_apresentacao: 'clonazepam-2mg-fix',
        descricao_dosagem: '2mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'POLICLINICA_PORTARIA344',
        farmacia_popular_gratuito: false,
        requisito_farmacia_popular: 'NAO_DISPONIVEL',
        nota_especifica_cuiaba: 'Dispensação mediante receita azul ou branca de controle especial.',
      },
    ],
  },
];

const ESTABELECIMENTOS_JORNADAS_FIXTURE: Estabelecimento[] = [
  {
    __fixture: true,
    id: 'farmacia-centro-auditada-fix',
    nome_fantasia: 'Drogaria Popular Centro Fixture',
    tipo: 'FARMACIA_POPULAR',
    bairro: 'Centro Norte',
    endereco_completo: 'Av. Getúlio Vargas, 100 - Centro Norte',
    telefone: '(65) 3000-0001',
    coordenadas: {
      lat: -15.596,
      lng: -56.096,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      dispensa_psicotropicos_sus: false,
      polo_vacinacao_municipal: false,
      status_funcionamento: 'NORMAL',
      credenciamento_pfpb_ativo: true,
    },
  },
  {
    __fixture: true,
    id: 'farmacia-cpa-sem-localizacao-fix',
    nome_fantasia: 'Drogaria Popular CPA Sem Pino Fixture',
    tipo: 'FARMACIA_POPULAR',
    bairro: 'CPA I',
    endereco_completo: 'Rua Pernambuco, s/n - CPA I',
    coordenadas: {
      lat: CUIABA_VG_CENTER.lat,
      lng: CUIABA_VG_CENTER.lng,
      auditado_manualmente: false,
      sem_localizacao: true,
    },
    atributos_operacionais: {
      dispensa_psicotropicos_sus: false,
      polo_vacinacao_municipal: false,
      status_funcionamento: 'NORMAL',
      credenciamento_pfpb_ativo: true,
    },
  },
  {
    __fixture: true,
    id: 'ubs-cpa-basica-fix',
    nome_fantasia: 'UBS CPA I Fixture',
    tipo: 'UBS',
    bairro: 'CPA I',
    endereco_completo: 'Av. Brasil, 200 - CPA I',
    coordenadas: {
      lat: -15.565,
      lng: -56.055,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      dispensa_psicotropicos_sus: false,
      polo_vacinacao_municipal: true,
      status_funcionamento: 'NORMAL',
    },
  },
  {
    __fixture: true,
    id: 'policlinica-verdade-controlados-fix',
    nome_fantasia: 'Policlínica do Verdão Controlados Fixture',
    tipo: 'POLICLINICA',
    bairro: 'Verdão',
    endereco_completo: 'Av. Agrícola Paes de Barros, s/n - Verdão',
    coordenadas: {
      lat: -15.602,
      lng: -56.112,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      dispensa_psicotropicos_sus: true,
      polo_vacinacao_municipal: true,
      status_funcionamento: 'NORMAL',
    },
  },
];

const META_JORNADAS_FIXTURE: MetaDados = {
  __fixture: true,
  versao: '0.1.0-fixture',
  data_remume: '2026-08-15',
  data_elenco_pfpb: '2026-08-31',
  data_infoms: '2026-09-01',
  ultima_verificacao_ci: '2026-10-28',
  limite_dias_desatualizado: 45,
  flags: {
    estoque_oficial: false,
  },
};

describe('Suíte de Jornada do Usuário Real — 5 Personas de Cuiabá (skill qa-usuario-real)', () => {
  it('Persona 1 (Idoso com receita manuscrita e baixa visão): ativa xlarge + alto contraste, busca com erro de digitação/dosagem ("metiformina 850", "losartna", "acucar"), vê alerta aproximado e lê "O que levar"', () => {
    const storage = createMemoryStorage();
    const prefsIdoso = {
      ...DEFAULT_PREFS,
      fontScale: 'xlarge' as const,
      highContrast: true,
      reduceMotion: true,
    };
    savePrefs(prefsIdoso, storage);
    const loadedPrefs = loadPrefs(storage);
    expect(loadedPrefs).toEqual(prefsIdoso);
    expect(shouldReduceMotion(loadedPrefs, false)).toBe(true);

    // Simula aplicação dos atributos de acessibilidade no <html>
    const attrs = new Map<string, string>();
    const fakeRoot = {
      setAttribute: (name: string, value: string) => attrs.set(name, value),
    };
    applyPrefsToRootElement(fakeRoot, loadedPrefs, false);
    expect(attrs.get('data-font-scale')).toBe('xlarge');
    expect(attrs.get('data-contrast')).toBe('high');
    expect(attrs.get('data-reduce-motion')).toBe('true');

    const engine = createMedicationSearchEngine(CATALOGO_JORNADAS_FIXTURE);

    // 1. Digita com erro ortográfico + dosagem acoplada: "metiformina 850"
    const buscaMetformina = engine.search('metiformina 850');
    expect(buscaMetformina.length).toBeGreaterThan(0);
    expect(buscaMetformina[0]!.item.slug).toBe('cloridrato-de-metformina-fixture');
    // Regra inviolável #2: resultado aproximado NUNCA é marcado como exato
    expect(buscaMetformina[0]!.exato).toBe(false);
    expect(
      resolveMatchState(buscaMetformina, 'cloridrato-de-metformina-fixture'),
    ).toBe('aproximado');

    // 2. Digita com erro ortográfico: "losartna"
    const buscaLosartana = engine.search('losartna');
    expect(buscaLosartana.length).toBeGreaterThan(0);
    expect(buscaLosartana[0]!.item.slug).toBe('losartana-potassica-fixture');
    expect(buscaLosartana[0]!.exato).toBe(false);

    // 3. Digita termo popular sem cedilha e sem acento: "acucar no sangue"
    const buscaAcucar = engine.search('acucar no sangue');
    expect(buscaAcucar.length).toBeGreaterThan(0);
    expect(buscaAcucar[0]!.item.slug).toBe('cloridrato-de-metformina-fixture');
    expect(buscaAcucar[0]!.exato).toBe(false);
    expect(buscaAcucar[0]!.porAssunto).toBe(true);
    expect(resolveMatchState(buscaAcucar, 'cloridrato-de-metformina-fixture')).toBe('assunto');

    // 4. Seleciona a dosagem 850mg na receita e lê Via 1, Via 2 e "O que levar"
    const apresentacao850 = buscaMetformina[0]!.item.apresentacoes.find(
      (a) => a.id_apresentacao === 'metformina-850mg-fix',
    )!;
    const via1 = getVia1Copy(apresentacao850);
    const via2 = getVia2Copy(apresentacao850);

    expect(via1.padronizado).toBe(true);
    expect(via1.titulo).toBe(NORMATIVE_TEXTS.via1.PADRONIZADO_REMUME.titulo);
    expect(via1.documentosParaLevar.length).toBeGreaterThanOrEqual(2);

    expect(via2.gratuito).toBe(true);
    expect(via2.titulo).toBe(NORMATIVE_TEXTS.via2.NO_ELENCO.titulo);
    expect(via2.documentosParaLevar.length).toBeGreaterThanOrEqual(2);
  });

  it('Persona 2 (Trabalhador sem GPS / Permissão negada): filtra por bairro sem GPS, vê unidade sem localização com aviso honesto (sem rota falsa) e traça rota na auditada', () => {
    const farmacias = ESTABELECIMENTOS_JORNADAS_FIXTURE.filter(
      (e) => e.tipo === 'FARMACIA_POPULAR',
    );

    // Filtra manualmente pelo bairro "CPA I" sem GPS (userCoords = null)
    const filtradasCpa = ordenarEstabelecimentosPorBairro(farmacias, 'CPA I');
    const listaSemGps = ordenarListaComOuSemDistancia(filtradasCpa, null);

    expect(listaSemGps).toHaveLength(1);
    expect(listaSemGps[0]!.estabelecimento.id).toBe('farmacia-cpa-sem-localizacao-fix');
    expect(listaSemGps[0]!.distanciaKm).toBeNull();
    expect(hasValidMapCoordinates(listaSemGps[0]!.estabelecimento)).toBe(false);

    // Filtra pelo bairro "Centro Norte" onde a farmácia tem coordenada auditada
    const filtradasCentro = ordenarEstabelecimentosPorBairro(farmacias, 'Centro Norte');
    expect(hasValidMapCoordinates(filtradasCentro[0]!)).toBe(true);
    expect(gerarUrlRotaGoogleMaps(filtradasCentro[0]!.coordenadas)).toContain(
      'https://www.google.com/maps/dir/?api=1&destination=-15.596%2C-56.096',
    );

    // Verifica na renderização estática que a farmácia sem localização exibe o aviso honesto e NÃO tem link de rota
    const html = renderToStaticMarkup(
      React.createElement(CredenciadasSection, {
        estabelecimentos: ESTABELECIMENTOS_JORNADAS_FIXTURE,
        meta: META_JORNADAS_FIXTURE,
        mapSlot: React.createElement('div', null, 'Mapa mock'),
      }),
    );

    expect(html).toContain('Localização no mapa indisponível. Use o endereço.');
    expect(html).toContain('Ver rota para Drogaria Popular Centro Fixture');
    expect(html).not.toContain('Ver rota para Drogaria Popular CPA Sem Pino Fixture');
  });

  it('Persona 3 (Caso Clínico de Medicamento Controlado — Portaria 344): recebe alerta de receita especial e filtra exclusivamente unidades com dispensa_psicotropicos_sus: true', () => {
    const engine = createMedicationSearchEngine(CATALOGO_JORNADAS_FIXTURE);
    const resultados = engine.search('rivotril fixture');

    expect(resultados.length).toBeGreaterThanOrEqual(1);
    expect(resultados[0]!.exato).toBe(true);
    expect(resultados[0]!.item.slug).toBe('clonazepam-controlado-fixture');
    const clonazepam = resultados[0]!.item;
    const apresentacao = clonazepam.apresentacoes[0]!;

    const via1 = getVia1Copy(apresentacao);
    const via2 = getVia2Copy(apresentacao);

    expect(via1.padronizado).toBe(true);
    expect(via1.controlado).toBe(true);
    expect(via1.textoControlado).toBe(NORMATIVE_TEXTS.via1.CONTROLADO_ADICIONAL);
    expect(via1.documentosParaLevar).toContain(
      'Receita de controle especial válida (em duas vias, dentro do prazo legal)',
    );
    expect(via2.gratuito).toBe(false);

    // Unidades públicas para este item controlado: APENAS Policlínica do Verdão (dispensa_psicotropicos_sus: true)
    const unidadesSusControlados = getPublicUnitsForMedication(
      apresentacao,
      ESTABELECIMENTOS_JORNADAS_FIXTURE,
    );
    expect(unidadesSusControlados).toHaveLength(1);
    expect(unidadesSusControlados[0]!.id).toBe('policlinica-verdade-controlados-fix');
    expect(unidadesSusControlados.some((u) => u.tipo === 'FARMACIA_POPULAR')).toBe(false);
  });

  it('Persona 4 (Navegação Mobile "Ir e Voltar" — ADR-09): preserva termo e rolagem em sessionStorage ao voltar do detalhe, sem jamais expor ?q= na URL', () => {
    const session = createMemoryStorage();
    const engine = createMedicationSearchEngine(CATALOGO_JORNADAS_FIXTURE);

    // 1. Usuário digita "pressao alta" e rola a lista até 420px
    const termoDigitado = 'pressao alta';
    const resultados = engine.search(termoDigitado);
    expect(resultados).toHaveLength(1);
    saveSearchSession({ lastQuery: termoDigitado, scrollY: 420 }, session);

    // 2. Navega para a página de detalhe: o caminho NUNCA contém query string (?q=)
    const detailPath = buildMedicationDetailPath(resultados[0]!.item.slug);
    expect(detailPath).toBe('/medicamento/losartana-potassica-fixture/');
    expect(detailPath).not.toContain('?');
    expect(detailPath).not.toContain('pressao');

    // 3. Aperta "Voltar para os resultados da busca" e restaura estado da sessão
    const estadoRestaurado = loadSearchSession(session);
    expect(estadoRestaurado.lastQuery).toBe('pressao alta');
    expect(estadoRestaurado.scrollY).toBe(420);

    const resultadosAoVoltar = engine.search(estadoRestaurado.lastQuery);
    expect(
      resolveMatchState(resultadosAoVoltar, 'losartana-potassica-fixture'),
    ).toBe('assunto');

    clearSearchSession(session);
    expect(loadSearchSession(session)).toEqual({ lastQuery: '', scrollY: 0 });
  });

  it('Persona 5 (Link Compartilhado no WhatsApp e Uso Offline): acesso direto não exibe selo falso de "Resultado exato", rota consta no pré-cache e avisa se dados estiverem antigos', () => {
    const med = CATALOGO_JORNADAS_FIXTURE[0]!;
    const sharePayload = gerarDadosCompartilhamentoMedicamento({
      medicamento: med,
      origin: 'https://ondepego.cuiaba.br',
    });

    expect(sharePayload.url).toBe(
      'https://ondepego.cuiaba.br/medicamento/cloridrato-de-metformina-fixture/',
    );
    expect(sharePayload.whatsappUrl).toContain('https://wa.me/?text=');

    // Acesso direto via link externo (sessão de busca vazia): matchState deve ser 'desconhecido'
    const matchStateAcessoDireto = resolveMatchState([], med.slug);
    expect(matchStateAcessoDireto).toBe('desconhecido');

    // Verifica que a rota do medicamento está incluída no manifesto de pré-cache offline
    const manifest = buildPrecacheManifest({
      medicamentos: CATALOGO_JORNADAS_FIXTURE,
      rawDataContents: [JSON.stringify(CATALOGO_JORNADAS_FIXTURE)],
    });
    expect(manifest.routes).toContain('/medicamento/cloridrato-de-metformina-fixture/');

    // Verifica que quando a pessoa abre o app offline meses depois (ex.: 120 dias após publicação), a faixa de atualização alerta honestamente
    const freshnessOffline = getFreshness(META_JORNADAS_FIXTURE, '2027-01-15');
    expect(freshnessOffline.desatualizado).toBe(true);
    expect(getStaleBannerCopy(freshnessOffline.dataReferencia)).toContain(
      'Os dados refletem a última publicação oficial verificada em 15/08/2026. Confirme na unidade ou na farmácia antes de sair de casa.',
    );
  });
});
