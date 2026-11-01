import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CredenciadasSection } from '@/components/medication/CredenciadasSection';
import { MedicationQuickSummary } from '@/components/medication/MedicationQuickSummary';
import { findSelectedApresentacao, resolveInitialApresentacaoId } from '@/lib/dosageSelection';
import { getVia1Copy, getVia2Copy } from '@/lib/healthCopy';
import type { Apresentacao, Estabelecimento, Meta } from '@/types/schema';

const AP_UBS_PFPB: Apresentacao = {
  id_apresentacao: 'ap-fixture-1',
  descricao_dosagem: '50 mg comprimido (FIXTURE)',
  status_remume_cuiaba: 'PADRONIZADO_REMUME',
  local_dispensacao_sus: 'UBS',
  farmacia_popular_gratuito: true,
  requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
};

const AP_FORA: Apresentacao = {
  id_apresentacao: 'ap-fixture-2',
  descricao_dosagem: '100 mg comprimido (FIXTURE)',
  status_remume_cuiaba: 'NAO_CONSTA_REMUME',
  local_dispensacao_sus: 'NAO_APLICAVEL',
  farmacia_popular_gratuito: false,
  requisito_farmacia_popular: 'NAO_DISPONIVEL',
};

describe('Topo da página do remédio: dosagem sem pré-seleção silenciosa e resumo de 3 segundos', () => {
  it('1. Pré-seleciona somente quando existe uma única apresentação', () => {
    expect(resolveInitialApresentacaoId([AP_UBS_PFPB])).toBe('ap-fixture-1');
    expect(resolveInitialApresentacaoId([AP_UBS_PFPB, AP_FORA])).toBe('');
    expect(resolveInitialApresentacaoId([])).toBe('');
  });

  it('2. Sem escolha explícita, nenhuma apresentação é considerada ativa', () => {
    expect(findSelectedApresentacao([AP_UBS_PFPB, AP_FORA], '')).toBeUndefined();
    expect(findSelectedApresentacao([AP_UBS_PFPB, AP_FORA], 'ap-fixture-2')).toBe(AP_FORA);
    expect(findSelectedApresentacao([AP_UBS_PFPB, AP_FORA], 'id-inexistente')).toBeUndefined();
  });

  it('3. O resumo usa os títulos normativos literais, mostra as datas e nunca promete estoque', () => {
    const html = renderToStaticMarkup(
      React.createElement(MedicationQuickSummary, {
        via1: getVia1Copy(AP_UBS_PFPB),
        via2: getVia2Copy(AP_UBS_PFPB),
        dataRemume: '2026-01-10',
        dataElenco: '2026-01-15',
        dosagemSelecionada: AP_UBS_PFPB.descricao_dosagem,
      }),
    );

    expect(html).toContain('Consta na lista da Prefeitura (REMUME)');
    expect(html).toContain('Gratuito no Farmácia Popular');
    expect(html).toContain('10/01/2026');
    expect(html).toContain('15/01/2026');
    expect(html).toContain('href="#via1-secao"');
    expect(html).toContain('href="#via2-secao"');
    expect(html).not.toMatch(/em estoque|tem aqui|garantido|equivalente|pode trocar/i);
  });

  it('4. O resumo mostra "Não consta" e "Fora do Farmácia Popular" sem links de documentos', () => {
    const html = renderToStaticMarkup(
      React.createElement(MedicationQuickSummary, {
        via1: getVia1Copy(AP_FORA),
        via2: getVia2Copy(AP_FORA),
        dataRemume: '2026-01-10',
        dataElenco: '2026-01-15',
        dosagemSelecionada: AP_FORA.descricao_dosagem,
      }),
    );

    expect(html).toContain('Não consta na lista da Prefeitura');
    expect(html).toContain('Fora do Farmácia Popular');
    expect(html).not.toContain('href="#via1-secao"');
    expect(html).not.toContain('href="#via2-secao"');
  });

  it('5. CredenciadasSection exibe (0) na aba SUS quando apresentação é NAO_CONSTA_REMUME e não mostra aviso contraditório', () => {
    const meta: Meta = {
      data_remume: '2026-08-17',
      data_elenco: '2026-01-15',
      data_ultima_conferencia: '2026-10-30',
      total_medicamentos: 64,
      total_estabelecimentos: 48,
      versao_app: '0.1.0',
      fonte_remume_url: 'https://exemplo.gov.br',
      fonte_elenco_url: 'https://exemplo.gov.br',
    };

    const estabelecimentos: Estabelecimento[] = [
      {
        id: 'farmacia-1',
        tipo: 'FARMACIA_POPULAR',
        nome_fantasia: 'Drogaria Exemplo',
        razao_social: 'Drogaria Exemplo Ltda',
        cnpj: '00.000.000/0001-00',
        municipio: 'Cuiabá',
        uf: 'MT',
        bairro: 'Centro',
        logradouro: 'Rua das Flores',
        numero: '100',
        cep: '78000-000',
        telefone: '(65) 3000-0000',
        horario_funcionamento: 'Seg a Sex 08:00 às 18:00',
        coordenadas: { lat: -15.59, lng: -56.09, tipo_precisao: 'ROOFTOP' },
        atributos_operacionais: {
          dispensa_psicotropicos_sus: false,
          polo_vacinacao_municipal: false,
          status_funcionamento: 'NORMAL',
        },
        ativo: true,
        fontes_dados: ['INFOMS'],
        data_atualizacao: '2026-10-30',
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(CredenciadasSection, {
        estabelecimentos,
        meta,
        apresentacaoAtiva: AP_FORA, // status_remume_cuiaba: 'NAO_CONSTA_REMUME'
      }),
    );

    // O rótulo da aba SUS deve indicar (0) unidades
    expect(html).toContain('Unidades Públicas (SUS Cuiabá — Postos, Policlínicas e UPAs) (0)');
    // Não deve conter menção a 24 unidades nem texto contraditório
    expect(html).not.toContain('Unidades Públicas (SUS Cuiabá — Postos, Policlínicas e UPAs) (24)');
  });
});
