import { describe, expect, it } from 'vitest';
import {
  filterEstablishments,
  getControlledDispensationUnits,
  getEstablishmentTypeBadge,
  getPlantaoEstablishments,
  getVaccinationUnits,
} from '@/lib/establishmentsFilter';
import { gerarUrlRotaGoogleMaps } from '@/lib/geoEngine';
import { type Estabelecimento, EstabelecimentosFile } from '@/types/schema';

const FIXTURE_ESTABELECIMENTOS: readonly Estabelecimento[] = EstabelecimentosFile.parse([
  {
    id: 'estab-farmacia-teste-a',
    nome_fantasia: 'FARMACIA_TESTE_A',
    tipo: 'FARMACIA_POPULAR',
    bairro: 'BAIRRO_TESTE_1',
    endereco_completo: 'ENDERECO_FICTICIO_TESTE_A, 000',
    coordenadas: {
      lat: -15.6,
      lng: -56.1,
      auditado_manualmente: false,
    },
    atributos_operacionais: {
      credenciamento_pfpb_ativo: true,
      status_funcionamento: 'NORMAL',
    },
    __fixture: true,
  },
  {
    id: 'estab-ubs-teste-b',
    nome_fantasia: 'UBS_TESTE_B',
    tipo: 'UBS',
    bairro: 'BAIRRO_TESTE_2',
    endereco_completo: 'ENDERECO_FICTICIO_TESTE_B, 000',
    coordenadas: {
      lat: -15.55,
      lng: -56.05,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      dispensa_psicotropicos_sus: false,
      polo_vacinacao_municipal: true,
      status_funcionamento: 'NORMAL',
    },
    __fixture: true,
  },
  {
    id: 'estab-upa-teste-c',
    nome_fantasia: 'UPA_TESTE_C',
    tipo: 'UPA',
    bairro: 'BAIRRO_TESTE_1',
    endereco_completo: 'ENDERECO_FICTICIO_TESTE_C, 000',
    telefone: '(65) 0000-0001',
    coordenadas: {
      lat: -15.58,
      lng: -56.08,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      dispensa_psicotropicos_sus: false,
      polo_vacinacao_municipal: true,
      status_funcionamento: 'CONTINGENCIA_PARCIAL',
      mensagem_contingencia: 'CONTINGENCIA_TESTE: Atendimento reduzido.',
    },
    __fixture: true,
  },
  {
    id: 'estab-policlinica-teste-d',
    nome_fantasia: 'POLICLINICA_TESTE_D',
    tipo: 'POLICLINICA',
    bairro: 'BAIRRO_TESTE_3',
    endereco_completo: 'ENDERECO_FICTICIO_TESTE_D, 000',
    telefone: '(65) 0000-0002',
    coordenadas: {
      lat: -15.62,
      lng: -56.12,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      dispensa_psicotropicos_sus: true,
      polo_vacinacao_municipal: false,
      status_funcionamento: 'NORMAL',
    },
    __fixture: true,
  },
]);

describe('establishmentsFilter — filtragem de /unidades/ e /plantao/', () => {
  it('filtra estabelecimentos por tipo', () => {
    const farmacias = filterEstablishments(FIXTURE_ESTABELECIMENTOS, {
      tipo: 'FARMACIA_POPULAR',
    });
    expect(farmacias).toHaveLength(1);
    expect(farmacias[0]?.id).toBe('estab-farmacia-teste-a');

    const ubs = filterEstablishments(FIXTURE_ESTABELECIMENTOS, { tipo: 'UBS' });
    expect(ubs).toHaveLength(1);
    expect(ubs[0]?.id).toBe('estab-ubs-teste-b');
  });

  it('filtra estabelecimentos por bairro e por texto ignorando acentos e caixa', () => {
    const porBairro = filterEstablishments(FIXTURE_ESTABELECIMENTOS, {
      bairro: 'bairro_teste_2',
    });
    expect(porBairro).toHaveLength(1);
    expect(porBairro[0]?.id).toBe('estab-ubs-teste-b');

    const porTexto = filterEstablishments(FIXTURE_ESTABELECIMENTOS, {
      query: 'policlinica_teste_d',
    });
    expect(porTexto).toHaveLength(1);
    expect(porTexto[0]?.id).toBe('estab-policlinica-teste-d');
  });

  it('retorna unidades de plantão (UPA e POLICLINICA) ordenando contingências primeiro', () => {
    const plantao = getPlantaoEstablishments(FIXTURE_ESTABELECIMENTOS);
    expect(plantao.map((e) => e.id)).toEqual([
      'estab-upa-teste-c',
      'estab-policlinica-teste-d',
    ]);
  });

  it('retorna polos de vacinação municipal e dispensação de controlados SUS', () => {
    const vacinacao = getVaccinationUnits(FIXTURE_ESTABELECIMENTOS);
    expect(vacinacao.map((e) => e.id)).toEqual([
      'estab-ubs-teste-b',
      'estab-upa-teste-c',
    ]);

    const controlados = getControlledDispensationUnits(FIXTURE_ESTABELECIMENTOS);
    expect(controlados.map((e) => e.id)).toEqual([
      'estab-policlinica-teste-d',
    ]);
  });

  it('retorna badges acessíveis não dependentes apenas de cor ([FP], [UBS], [POL], [UPA])', () => {
    expect(getEstablishmentTypeBadge('FARMACIA_POPULAR').code).toBe('FP');
    expect(getEstablishmentTypeBadge('UBS').code).toBe('UBS');
    expect(getEstablishmentTypeBadge('POLICLINICA').code).toBe('POL');
    expect(getEstablishmentTypeBadge('UPA').code).toBe('UPA');
  });

  it('gera links de rota com modos transit e walking', () => {
    const urlTransit = gerarUrlRotaGoogleMaps({ lat: -15.6, lng: -56.09 }, 'transit');
    const urlWalking = gerarUrlRotaGoogleMaps({ lat: -15.6, lng: -56.09 }, 'walking');
    expect(urlTransit).toContain('travelmode=transit');
    expect(urlWalking).toContain('travelmode=walking');
  });
});
