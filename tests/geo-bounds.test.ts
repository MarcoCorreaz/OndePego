import { describe, expect, it } from 'vitest';
import { Coordenadas, GEO_BBOX } from '@/types/schema';

describe('Limites geográficos de Cuiabá / Várzea Grande (GEO_BBOX)', () => {
  it('aceita ponto central e os quatro limites exatos da caixa', () => {
    const validPoints = [
      { lat: -15.6, lng: -56.1, auditado_manualmente: true },
      { lat: GEO_BBOX.minLat, lng: GEO_BBOX.minLng, auditado_manualmente: true },
      { lat: GEO_BBOX.maxLat, lng: GEO_BBOX.maxLng, auditado_manualmente: false },
    ];

    for (const pt of validPoints) {
      expect(Coordenadas.safeParse(pt).success).toBe(true);
    }
  });

  it('rejeita latitude abaixo de minLat ou acima de maxLat', () => {
    expect(
      Coordenadas.safeParse({
        lat: GEO_BBOX.minLat - 0.001,
        lng: -56.1,
        auditado_manualmente: true,
      }).success,
    ).toBe(false);

    expect(
      Coordenadas.safeParse({
        lat: GEO_BBOX.maxLat + 0.001,
        lng: -56.1,
        auditado_manualmente: true,
      }).success,
    ).toBe(false);
  });

  it('rejeita longitude abaixo de minLng ou acima de maxLng', () => {
    expect(
      Coordenadas.safeParse({
        lat: -15.6,
        lng: GEO_BBOX.minLng - 0.001,
        auditado_manualmente: true,
      }).success,
    ).toBe(false);

    expect(
      Coordenadas.safeParse({
        lat: -15.6,
        lng: GEO_BBOX.maxLng + 0.001,
        auditado_manualmente: true,
      }).success,
    ).toBe(false);
  });

  it('rejeita coordenadas com lat/lng invertidos', () => {
    expect(
      Coordenadas.safeParse({
        lat: -56.1,
        lng: -15.6,
        auditado_manualmente: true,
      }).success,
    ).toBe(false);
  });
});
