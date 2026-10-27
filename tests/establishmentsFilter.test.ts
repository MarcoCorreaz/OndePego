import { describe, expect, it } from 'vitest';
import rawEstabelecimentos from '../data/estabelecimentos.json';
import {
  filterEstablishments,
  getControlledDispensationUnits,
  getEstablishmentTypeBadge,
  getPlantaoEstablishments,
  getVaccinationUnits,
} from '@/lib/establishmentsFilter';
import { gerarUrlRotaGoogleMaps } from '@/lib/geoEngine';
import { EstabelecimentosFile } from '@/types/schema';

const FIXTURE_ESTABELECIMENTOS = EstabelecimentosFile.parse(rawEstabelecimentos);

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
