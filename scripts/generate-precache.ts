import fs from 'node:fs';
import path from 'node:path';
import { buildPrecacheManifest, type PrecacheManifest } from '../src/lib/precacheManifest';
import { MedicamentosFile } from '../src/types/schema';

export function generatePrecacheManifestFile(options?: {
  dataDir?: string;
  outputFile?: string;
}): PrecacheManifest {
  const dataDir = options?.dataDir ?? path.resolve(process.cwd(), 'data');
  const outputFile =
    options?.outputFile ?? path.resolve(process.cwd(), 'public/precache-manifest.json');

  const metaRaw = fs.readFileSync(path.join(dataDir, 'meta.json'), 'utf-8');
  const medsRaw = fs.readFileSync(path.join(dataDir, 'medicamentos.json'), 'utf-8');
  const estabsRaw = fs.readFileSync(path.join(dataDir, 'estabelecimentos.json'), 'utf-8');

  const medicamentos = MedicamentosFile.parse(JSON.parse(medsRaw));
  const manifest = buildPrecacheManifest({
    medicamentos,
    rawDataContents: [metaRaw, medsRaw, estabsRaw],
  });

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');

  return manifest;
}

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  const manifest = generatePrecacheManifestFile();
  console.log(
    `[precache] Gerado public/precache-manifest.json (version=${manifest.version}, routes=${manifest.routes.length})`,
  );
}
