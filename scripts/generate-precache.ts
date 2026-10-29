import fs from 'node:fs';
import path from 'node:path';
import { buildPrecacheManifest, type PrecacheManifest } from '../src/lib/precacheManifest';
import { MedicamentosFile } from '../src/types/schema';

function walkDirSync(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirSync(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function scanStaticAssets(projectRoot: string = process.cwd()): string[] {
  const assets: string[] = [];

  // 1. Chunks do Next.js em out/_next/static ou .next/static
  const candidateDirs = [
    path.join(projectRoot, 'out/_next/static'),
    path.join(projectRoot, '.next/static'),
  ];

  for (const staticDir of candidateDirs) {
    if (fs.existsSync(staticDir)) {
      const files = walkDirSync(staticDir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.js' || ext === '.css' || ext === '.woff2') {
          const rel = path.relative(staticDir, file).replace(/\\/g, '/');
          assets.push(`/_next/static/${rel}`);
        }
      }
      break; // Usa o primeiro diretório disponível
    }
  }

  return Array.from(new Set(assets)).sort();
}

export function generatePrecacheManifestFile(options?: {
  dataDir?: string;
  outputFile?: string;
  projectRoot?: string;
}): PrecacheManifest {
  const projectRoot = options?.projectRoot ?? process.cwd();
  const dataDir = options?.dataDir ?? path.resolve(projectRoot, 'data');
  const outputFile =
    options?.outputFile ?? path.resolve(projectRoot, 'public/precache-manifest.json');

  const metaRaw = fs.readFileSync(path.join(dataDir, 'meta.json'), 'utf-8');
  const medsRaw = fs.readFileSync(path.join(dataDir, 'medicamentos.json'), 'utf-8');
  const estabsRaw = fs.readFileSync(path.join(dataDir, 'estabelecimentos.json'), 'utf-8');

  const staticAssets = scanStaticAssets(projectRoot);
  const medicamentos = MedicamentosFile.parse(JSON.parse(medsRaw));

  const manifest = buildPrecacheManifest({
    medicamentos,
    rawDataContents: [metaRaw, medsRaw, estabsRaw],
    staticAssets,
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
