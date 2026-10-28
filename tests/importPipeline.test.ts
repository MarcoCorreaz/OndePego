import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CredenciadasSection } from '@/components/medication/CredenciadasSection';
import {
  listPendingAuditEstablishments,
  markEstablishmentsAsAudited,
} from '@/lib/coordsAudit';
import { hasValidMapCoordinates, isPlaceholderCoordinate } from '@/lib/dataRules';
import { getPublicUnitsForMedication } from '@/lib/establishmentsFilter';
import {
  ordenarEstabelecimentosPorDistancia,
  ordenarListaComOuSemDistancia,
} from '@/lib/geoEngine';
import {
  InvalidLocalDispensacaoError,
  importAndMergeMedicamentos,
} from '@/lib/importMedicamentos';
import { mergeUnidadesPublicas, parseUnidadesCsv } from '@/lib/importUnidades';
import { mergeInfomsEstablishments, parseInfomsCsv } from '@/lib/infomsCsv';
import { CUIABA_VG_CENTER } from '@/lib/pmtilesProtocol';
import type { Estabelecimento, Medicamento, MetaDados } from '@/types/schema';
import { runImportMedicamentosCli } from '../scripts/import-medicamentos';

const FIXTURES_DIR = path.resolve(process.cwd(), 'tests/fixtures-import');

const remumeCsv = fs.readFileSync(path.join(FIXTURES_DIR, 'remume-sintetico.csv'), 'utf-8');
const elencoCsv = fs.readFileSync(path.join(FIXTURES_DIR, 'elenco-sintetico.csv'), 'utf-8');
const sinonimosCsv = fs.readFileSync(
  path.join(FIXTURES_DIR, 'sinonimos-sintetico.csv'),
  'utf-8',
);
const infomsCsv = fs.readFileSync(path.join(FIXTURES_DIR, 'infoms-sintetico.csv'), 'utf-8');
const unidadesCsv = fs.readFileSync(
  path.join(FIXTURES_DIR, 'unidades-sintetico.csv'),
  'utf-8',
);

const META_FIXTURE: MetaDados = {
  versao: '0.0.0-fixture',
  data_remume: '2026-01-10',
  data_elenco_pfpb: '2026-01-15',
  data_infoms: '2026-01-20',
  ultima_verificacao_ci: '2026-01-21',
  limite_dias_desatualizado: 45,
  flags: { estoque_oficial: false },
  __fixture: true,
};

describe('Pipeline de Importação Determinística e Tratamento Honesto de Coordenadas (Prompt 07)', () => {
  it('1. Casa REMUME × Elenco PFPB por princípio ativo + dosagem normalizados e gera slugs únicos e estáveis', () => {
    const res = importAndMergeMedicamentos({
      remumeCsv,
      elencoCsv,
      sinonimosCsv,
      existing: [],
      prune: true,
    });

    expect(res.merged).toHaveLength(3);

    const medX = res.merged.find((m) => m.slug === 'medicamento-sintetico-x')!;
    expect(medX).toBeDefined();
    expect(medX.apresentacoes).toHaveLength(2);

    // 50 mg consta tanto na REMUME quanto no Elenco PFPB gratuito
    const ap50 = medX.apresentacoes.find((a) => a.descricao_dosagem.includes('50 mg'))!;
    expect(ap50.status_remume_cuiaba).toBe('PADRONIZADO_REMUME');
    expect(ap50.local_dispensacao_sus).toBe('UBS');
    expect(ap50.farmacia_popular_gratuito).toBe(true);
    expect(ap50.requisito_farmacia_popular).toBe('PADRAO_RECEITA_DOCUMENTO');

    // 100 mg consta apenas na REMUME
    const ap100 = medX.apresentacoes.find((a) => a.descricao_dosagem.includes('100 mg'))!;
    expect(ap100.status_remume_cuiaba).toBe('PADRONIZADO_REMUME');
    expect(ap100.farmacia_popular_gratuito).toBe(false);
    expect(ap100.requisito_farmacia_popular).toBe('NAO_DISPONIVEL');

    // Item apenas do Elenco PFPB recebe NAO_CONSTA_REMUME e NAO_APLICAVEL
    const insumoElenco = res.merged.find((m) => m.slug === 'insumo-sintetico-elenco-pfpb')!;
    expect(insumoElenco.apresentacoes[0]?.status_remume_cuiaba).toBe('NAO_CONSTA_REMUME');
    expect(insumoElenco.apresentacoes[0]?.local_dispensacao_sus).toBe('NAO_APLICAVEL');
    expect(insumoElenco.apresentacoes[0]?.requisito_farmacia_popular).toBe('FRALDA_GERIATRICA');
  });

  it('2. Aborta imediatamente diante de local_dispensacao_sus desconhecido na fonte', () => {
    const brokenRemumeCsv = [
      'principio_ativo;descricao_dosagem;local_dispensacao_sus',
      'MEDICAMENTO_SINTETICO_QUEBRADO;10 mg comprimido;LOCAL_INVENTADO_XYZ',
    ].join('\n');

    expect(() =>
      importAndMergeMedicamentos({
        remumeCsv: brokenRemumeCsv,
        elencoCsv,
      }),
    ).toThrow(InvalidLocalDispensacaoError);
  });

  it('3. --dry-run (padrão) não altera arquivos em disco, enquanto --write grava catálogo e sinonimos-pendentes.md', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onde-pego-import-cli-'));
    try {
      const outJson = path.join(tmpDir, 'medicamentos.json');
      const pendingMd = path.join(tmpDir, 'sinonimos-pendentes.md');
      const initialContent = '[]\n';
      fs.writeFileSync(outJson, initialContent, 'utf-8');

      // Execução sem --write (--dry-run por padrão)
      runImportMedicamentosCli([
        '--remume',
        path.join(FIXTURES_DIR, 'remume-sintetico.csv'),
        '--elenco',
        path.join(FIXTURES_DIR, 'elenco-sintetico.csv'),
        '--output',
        outJson,
        '--pending-report',
        pendingMd,
      ]);

      expect(fs.readFileSync(outJson, 'utf-8')).toBe(initialContent);
      expect(fs.existsSync(pendingMd)).toBe(false);

      // Execução com --write
      runImportMedicamentosCli([
        '--remume',
        path.join(FIXTURES_DIR, 'remume-sintetico.csv'),
        '--elenco',
        path.join(FIXTURES_DIR, 'elenco-sintetico.csv'),
        '--sinonimos',
        path.join(FIXTURES_DIR, 'sinonimos-sintetico.csv'),
        '--output',
        outJson,
        '--pending-report',
        pendingMd,
        '--write',
      ]);

      const written = JSON.parse(fs.readFileSync(outJson, 'utf-8')) as Medicamento[];
      expect(written).toHaveLength(3);
      expect(fs.existsSync(pendingMd)).toBe(true);
      const mdContent = fs.readFileSync(pendingMd, 'utf-8');
      expect(mdContent).toContain('medicamento-sintetico-controlado-w');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('4. Respeita --prune e preserva sinônimos curados manualmente ao reimportar', () => {
    const existing: Medicamento[] = [
      {
        slug: 'medicamento-sintetico-x',
        principio_ativo: 'MEDICAMENTO_SINTETICO_X',
        nomes_comerciais: ['MARCA_MANUAL_CURADA'],
        termos_populares: ['TERMO_MANUAL_CURADO'],
        apresentacoes: [
          {
            id_apresentacao: 'ap-antiga',
            descricao_dosagem: '50 mg comprimido',
            status_remume_cuiaba: 'PADRONIZADO_REMUME',
            local_dispensacao_sus: 'UBS',
            farmacia_popular_gratuito: false,
            requisito_farmacia_popular: 'NAO_DISPONIVEL',
          },
        ],
        __fixture: true,
      },
      {
        slug: 'medicamento-antigo-fora-do-csv',
        principio_ativo: 'MEDICAMENTO_ANTIGO_FORA_DO_CSV',
        nomes_comerciais: ['MARCA_ANTIGA'],
        termos_populares: [],
        apresentacoes: [
          {
            id_apresentacao: 'ap-fora',
            descricao_dosagem: '10 mg',
            status_remume_cuiaba: 'PADRONIZADO_REMUME',
            local_dispensacao_sus: 'UBS',
            farmacia_popular_gratuito: false,
            requisito_farmacia_popular: 'NAO_DISPONIVEL',
          },
        ],
        __fixture: true,
      },
    ];

    // Sem --prune: mantém o medicamento antigo fora do CSV e preserva sinônimos manuais
    const semPrune = importAndMergeMedicamentos({
      remumeCsv,
      elencoCsv,
      sinonimosCsv,
      existing,
      prune: false,
    });
    expect(semPrune.merged.some((m) => m.slug === 'medicamento-antigo-fora-do-csv')).toBe(
      true,
    );
    const medX = semPrune.merged.find((m) => m.slug === 'medicamento-sintetico-x')!;
    expect(medX.nomes_comerciais).toEqual([
      'MARCA_MANUAL_CURADA',
      'MARCA_SINTETICA_X1',
      'MARCA_SINTETICA_X2',
    ]);
    expect(medX.termos_populares).toEqual([
      'TERMO_MANUAL_CURADO',
      'TERMO_SINTETICO_X1',
      'TERMO_SINTETICO_X2',
    ]);

    // Com --prune: remove o medicamento antigo que não está no CSV
    const comPrune = importAndMergeMedicamentos({
      remumeCsv,
      elencoCsv,
      sinonimosCsv,
      existing,
      prune: true,
    });
    expect(comPrune.removed).toBe(1);
    expect(comPrune.merged.some((m) => m.slug === 'medicamento-antigo-fora-do-csv')).toBe(
      false,
    );
  });

  it('5. Filtra --municipios (cuiaba vs cuiaba,varzea-grande) e marca farmácia sem coordenada como sem_localizacao: true', () => {
    const onlyCuiaba = parseInfomsCsv(infomsCsv, { municipios: 'cuiaba' });
    expect(onlyCuiaba.rows).toHaveLength(2);
    expect(onlyCuiaba.skippedOutsideMunicipio).toBe(2);

    const cuiabaAndVg = parseInfomsCsv(infomsCsv, {
      municipios: 'cuiaba,varzea-grande',
    });
    expect(cuiabaAndVg.rows).toHaveLength(3);
    expect(cuiabaAndVg.skippedOutsideMunicipio).toBe(1);

    const merged = mergeInfomsEstablishments([], cuiabaAndVg.rows, 1);
    const semCoord = merged.merged.find((e) =>
      e.nome_fantasia.includes('DROGARIA_SINTETICA_SEM_COORD_Y2'),
    )!;
    expect(semCoord.coordenadas.sem_localizacao).toBe(true);
    expect(hasValidMapCoordinates(semCoord)).toBe(false);
    expect(isPlaceholderCoordinate(CUIABA_VG_CENTER.lat, CUIABA_VG_CENTER.lng)).toBe(true);
  });

  it('6. Importa unidades públicas preservando FARMACIA_POPULAR e filtra getPublicUnitsForMedication (UBS vs POLICLINICA_PORTARIA344 vs fora da REMUME)', () => {
    const parsedInfoms = parseInfomsCsv(infomsCsv, { municipios: 'cuiaba' });
    const withPharmacies = mergeInfomsEstablishments([], parsedInfoms.rows, 0).merged;

    const parsedUnidades = parseUnidadesCsv(unidadesCsv);
    const mergedAll = mergeUnidadesPublicas(withPharmacies, parsedUnidades);

    expect(mergedAll.preservedPharmacies).toBe(2);
    expect(mergedAll.added).toBe(3);

    // Item básico padronizado na REMUME (UBS): retorna as 3 unidades públicas
    const unidadesBasicas = getPublicUnitsForMedication(
      { status_remume_cuiaba: 'PADRONIZADO_REMUME', local_dispensacao_sus: 'UBS' },
      mergedAll.merged,
    );
    expect(unidadesBasicas.map((u) => u.id)).toEqual([
      'policlinica-sintetica-z2',
      'ubs-sintetica-z1',
      'upa-sintetica-sem-coord-z3',
    ]);

    // Item controlado Portaria 344: retorna apenas unidades com dispensa_psicotropicos_sus === true
    const unidadesControlados = getPublicUnitsForMedication(
      {
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'POLICLINICA_PORTARIA344',
      },
      mergedAll.merged,
    );
    expect(unidadesControlados).toHaveLength(1);
    expect(unidadesControlados[0]?.id).toBe('policlinica-sintetica-z2');

    // Item fora da REMUME: retorna []
    const unidadesForaRemume = getPublicUnitsForMedication(
      { status_remume_cuiaba: 'NAO_CONSTA_REMUME', local_dispensacao_sus: 'NAO_APLICAVEL' },
      mergedAll.merged,
    );
    expect(unidadesForaRemume).toEqual([]);
  });

  it('7. Exclui estabelecimentos sem coordenada válida do Haversine, omite botão "Ver rota" na UI e audita coordenadas via markEstablishmentsAsAudited', () => {
    const parsedInfoms = parseInfomsCsv(infomsCsv, { municipios: 'cuiaba' });
    const estabs = mergeInfomsEstablishments([], parsedInfoms.rows, 0).merged;

    const userOrigin = { lat: -15.59, lng: -56.09 };
    // Apenas a drogaria com coordenada válida entra no Haversine
    const haversineList = ordenarEstabelecimentosPorDistancia(estabs, userOrigin);
    expect(haversineList).toHaveLength(1);
    expect(haversineList[0]?.estabelecimento.nome_fantasia).toBe('DROGARIA_SINTETICA_Y1');

    // Na lista completa, a drogaria sem coordenada aparece no final com distanciaKm: null
    const fullList = ordenarListaComOuSemDistancia(estabs, userOrigin);
    expect(fullList).toHaveLength(2);
    expect(fullList[1]?.distanciaKm).toBeNull();

    // Renderização SSR de CredenciadasSection verifica que o aviso de localização indisponível
    // e o aviso de localização aproximada são exibidos, e que o botão "Ver rota" é omitido para Y2
    const html = renderToStaticMarkup(
      React.createElement(CredenciadasSection, {
        estabelecimentos: estabs,
        meta: META_FIXTURE,
        mapSlot: React.createElement('div', null, 'MAP_SLOT_TEST'),
      }),
    );

    expect(html).toContain('Drogarias Credenciadas (Farmácia Popular)');
    expect(html).toContain(
      'Unidades Públicas (SUS Cuiabá — Postos, Policlínicas e UPAs)',
    );
    expect(html).toContain('Localização no mapa indisponível. Use o endereço.');
    expect(html).toContain('Localização aproximada. Confira o endereço.');
    expect(html).toContain('Ver rota para DROGARIA_SINTETICA_Y1');
    expect(html).not.toContain('Ver rota para DROGARIA_SINTETICA_SEM_COORD_Y2');

    // Utilitários de auditoria humana de coordenadas
    const pendingBefore = listPendingAuditEstablishments(estabs);
    expect(pendingBefore).toHaveLength(2);

    // Rejeita chamada em lote sem --ids
    expect(() => markEstablishmentsAsAudited(estabs, { ids: [] })).toThrow(
      /--ids é obrigatório/,
    );

    // Audita a drogaria sem coordenada informando --lat e --lng válidos
    const idSemCoord = estabs[1]!.id;
    const afterMark = markEstablishmentsAsAudited(estabs, {
      ids: [idSemCoord],
      lat: -15.5888,
      lng: -56.0888,
    });
    const newlyAudited = afterMark.updatedList.find((e) => e.id === idSemCoord)!;
    expect(newlyAudited.coordenadas.auditado_manualmente).toBe(true);
    expect(hasValidMapCoordinates(newlyAudited)).toBe(true);
  });
});
