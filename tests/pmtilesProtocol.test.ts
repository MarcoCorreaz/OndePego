import { describe, expect, it, vi } from 'vitest';
import {
  buildLocalMapStyle,
  CUIABA_VG_BOUNDS,
  CUIABA_VG_CENTER,
  DEFAULT_PMTILES_ARCHIVE_PATH,
  projectCoordToSchematicPercent,
  registerPmtilesProtocol,
} from '@/lib/pmtilesProtocol';
import { GEO_BBOX } from '@/types/schema';

describe('pmtilesProtocol — estilo vetorial local e registro PMTiles', () => {
  it('constrói estilo MapLibre v8 usando pmtiles:// e sem nenhuma URL externa', () => {
    const style = buildLocalMapStyle();
    expect(style.version).toBe(8);
    expect(style.sources.protomaps.type).toBe('vector');
    expect(style.sources.protomaps.url).toBe(`pmtiles://${DEFAULT_PMTILES_ARCHIVE_PATH}`);
    expect(style.sources.protomaps.attribution).toContain('OpenStreetMap contributors');

    const serialized = JSON.stringify(style);
    expect(serialized).not.toContain('http://');
    expect(serialized).not.toContain('https://');
    expect(serialized).not.toContain('tile.openstreetmap.org');
    expect(serialized).not.toContain('protomaps.github.io');
    expect(serialized).not.toContain('googleapis');
    expect(serialized).not.toContain('glyphs');
    expect(serialized).not.toContain('sprite');
  });

  it('aceita caminho customizado com ou sem prefixo pmtiles://', () => {
    const s1 = buildLocalMapStyle('/tiles/custom.pmtiles');
    expect(s1.sources.protomaps.url).toBe('pmtiles:///tiles/custom.pmtiles');

    const s2 = buildLocalMapStyle('pmtiles:///tiles/already-prefixed.pmtiles');
    expect(s2.sources.protomaps.url).toBe('pmtiles:///tiles/already-prefixed.pmtiles');
  });

  it('registra o protocolo pmtiles de forma idempotente', () => {
    const addProtocolSpy = vi.fn();
    const fakeProtocolInstance = {
      tile: vi.fn().mockResolvedValue({ data: new ArrayBuffer(0) }),
    };

    const first = registerPmtilesProtocol(
      { addProtocol: addProtocolSpy },
      fakeProtocolInstance,
      true,
    );
    const second = registerPmtilesProtocol(
      { addProtocol: addProtocolSpy },
      fakeProtocolInstance,
      false,
    );

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(addProtocolSpy).toHaveBeenCalledTimes(1);
    expect(addProtocolSpy).toHaveBeenCalledWith('pmtiles', expect.any(Function));
  });

  it('projeta coordenadas dentro da GEO_BBOX de Cuiabá/VG em porcentagens seguras (8% a 92%)', () => {
    const centerProj = projectCoordToSchematicPercent(CUIABA_VG_CENTER);
    expect(centerProj.xPercent).toBeGreaterThanOrEqual(8);
    expect(centerProj.xPercent).toBeLessThanOrEqual(92);
    expect(centerProj.yPercent).toBeGreaterThanOrEqual(8);
    expect(centerProj.yPercent).toBeLessThanOrEqual(92);

    const northWest = projectCoordToSchematicPercent({
      lat: GEO_BBOX.maxLat,
      lng: GEO_BBOX.minLng,
    });
    const southEast = projectCoordToSchematicPercent({
      lat: GEO_BBOX.minLat,
      lng: GEO_BBOX.maxLng,
    });

    expect(northWest.xPercent).toBe(8);
    expect(northWest.yPercent).toBe(8);
    expect(southEast.xPercent).toBe(92);
    expect(southEast.yPercent).toBe(92);
    expect(CUIABA_VG_BOUNDS).toEqual([
      [GEO_BBOX.minLng, GEO_BBOX.minLat],
      [GEO_BBOX.maxLng, GEO_BBOX.maxLat],
    ]);
  });
});
