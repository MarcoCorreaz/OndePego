import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildPrecacheManifest,
  computeDataVersionHash,
  FIXED_PRECACHE_ROUTES,
} from '@/lib/precacheManifest';
import { MedicamentosFile } from '@/types/schema';
import { generatePrecacheManifestFile } from '../scripts/generate-precache';
import rawMedicamentos from '../data/medicamentos.json';

describe('precacheManifest — geração determinística de rotas com barra final', () => {
  const medicamentos = MedicamentosFile.parse(rawMedicamentos);

  it('produz rotas com barra final (/) incluindo /mapa/ e hash SHA-256 de 8 caracteres', () => {
    const manifest = buildPrecacheManifest({
      medicamentos,
      rawDataContents: ['{"v":1}', JSON.stringify(rawMedicamentos), '[]'],
    });

    expect(manifest.version).toMatch(/^[a-f0-9]{8}$/);
    expect(manifest.routes).toHaveLength(medicamentos.length + FIXED_PRECACHE_ROUTES.length);

    for (const fixed of FIXED_PRECACHE_ROUTES) {
      expect(manifest.routes).toContain(fixed);
    }

    for (const med of medicamentos) {
      expect(manifest.routes).toContain(`/medicamento/${med.slug}/`);
    }

    for (const route of manifest.routes) {
      expect(route.startsWith('/')).toBe(true);
      expect(route.endsWith('/')).toBe(true);
    }
  });

  it('gera version determinístico que muda quando qualquer dado de entrada muda', () => {
    const h1 = computeDataVersionHash(['a', 'b', 'c']);
    const h2 = computeDataVersionHash(['a', 'b', 'c']);
    const h3 = computeDataVersionHash(['a', 'b', 'd']);

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).toHaveLength(8);
  });

  it('generatePrecacheManifestFile grava o manifesto JSON com todas as rotas dos medicamentos de data/medicamentos.json', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onde-pego-precache-'));
    try {
      const outPath = path.join(tmpDir, 'precache-manifest.json');
      const generated = generatePrecacheManifestFile({ outputFile: outPath });

      expect(fs.existsSync(outPath)).toBe(true);
      const parsedFromDisk = JSON.parse(fs.readFileSync(outPath, 'utf-8')) as {
        version: string;
        routes: string[];
      };

      expect(parsedFromDisk).toEqual(generated);
      expect(parsedFromDisk.routes).toHaveLength(medicamentos.length + FIXED_PRECACHE_ROUTES.length);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
