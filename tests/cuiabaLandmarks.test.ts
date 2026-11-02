import { describe, expect, it } from 'vitest';
import { CUIABA_LANDMARKS, getVisibleLandmarks } from '@/lib/cuiabaLandmarks';
import { GEO_BBOX } from '@/types/schema';

describe('Rótulos Locais de Cuiabá e Várzea Grande (cuiabaLandmarks.ts)', () => {
  it('contém marcos fundamentais da Grande Cuiabá', () => {
    expect(CUIABA_LANDMARKS.length).toBeGreaterThanOrEqual(12);

    const nomes = CUIABA_LANDMARKS.map((m) => m.nome);
    expect(nomes).toContain('Centro');
    expect(nomes).toContain('Grande CPA');
    expect(nomes).toContain('Coxipó');
    expect(nomes).toContain('Pedra 90');
    expect(nomes).toContain('Morada do Ouro');
    expect(nomes).toContain('Av. do CPA');
  });

  it('todas as coordenadas estão dentro da bounding box oficial da Grande Cuiabá', () => {
    for (const landmark of CUIABA_LANDMARKS) {
      expect(landmark.coordenadas.lat).toBeGreaterThanOrEqual(GEO_BBOX.minLat);
      expect(landmark.coordenadas.lat).toBeLessThanOrEqual(GEO_BBOX.maxLat);
      expect(landmark.coordenadas.lng).toBeGreaterThanOrEqual(GEO_BBOX.minLng);
      expect(landmark.coordenadas.lng).toBeLessThanOrEqual(GEO_BBOX.maxLng);
    }
  });

  it('filtra corretamente por nível de zoom', () => {
    // Zoom muito afastado (zoom 9): nenhum rótulo exibido
    const zoom9 = getVisibleLandmarks(9);
    expect(zoom9).toHaveLength(0);

    // Zoom intermediário (zoom 11.5): macrorregiões visíveis
    const zoom115 = getVisibleLandmarks(11.5);
    expect(zoom115.length).toBeGreaterThan(0);
    const nomes115 = zoom115.map((l) => l.nome);
    expect(nomes115).toContain('Centro');
    expect(nomes115).toContain('Grande CPA');

    // Zoom próximo (zoom 13.5): bairros e avenidas visíveis
    const zoom135 = getVisibleLandmarks(13.5);
    const nomes135 = zoom135.map((l) => l.nome);
    expect(nomes135).toContain('Av. do CPA');
    expect(nomes135).toContain('Bosque da Saúde');
  });
});
