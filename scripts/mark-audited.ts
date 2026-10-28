import fs from 'node:fs';
import path from 'node:path';
import { markEstablishmentsAsAudited } from '../src/lib/coordsAudit';
import { parseCoordinateNumber } from '../src/lib/infomsCsv';
import { EstabelecimentosFile } from '../src/types/schema';

export function parseMarkAuditedArgs(argv: readonly string[]): {
  ids: string[];
  lat?: number;
  lng?: number;
  filePath: string;
} {
  let idsRaw = '';
  let lat: number | undefined;
  let lng: number | undefined;
  let filePath = path.resolve(process.cwd(), 'data/estabelecimentos.json');

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--ids') {
      idsRaw = argv[i + 1] ?? '';
      i++;
    } else if (arg.startsWith('--ids=')) {
      idsRaw = arg.slice('--ids='.length);
    } else if (arg === '--lat') {
      lat = parseCoordinateNumber(argv[i + 1]);
      i++;
    } else if (arg.startsWith('--lat=')) {
      lat = parseCoordinateNumber(arg.slice('--lat='.length));
    } else if (arg === '--lng') {
      lng = parseCoordinateNumber(argv[i + 1]);
      i++;
    } else if (arg.startsWith('--lng=')) {
      lng = parseCoordinateNumber(arg.slice('--lng='.length));
    } else if (arg === '--file') {
      if (argv[i + 1]) {
        filePath = path.resolve(process.cwd(), argv[i + 1]!);
        i++;
      }
    } else if (arg.startsWith('--file=')) {
      filePath = path.resolve(process.cwd(), arg.slice('--file='.length));
    }
  }

  const ids = idsRaw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return {
    ids,
    ...(lat !== undefined ? { lat } : {}),
    ...(lng !== undefined ? { lng } : {}),
    filePath,
  };
}

export function runMarkAuditedCli(argv: readonly string[]): void {
  const { ids, lat, lng, filePath } = parseMarkAuditedArgs(argv);

  if (ids.length === 0) {
    console.error(
      'Uso: npm run mark:audited -- --ids id1,id2 [--lat -15.5989 --lng -56.0949] [--file data/estabelecimentos.json]',
    );
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  try {
    const existing = EstabelecimentosFile.parse(
      JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown,
    );

    const { updatedList, markedIds } = markEstablishmentsAsAudited(existing, {
      ids,
      lat,
      lng,
    });

    fs.writeFileSync(filePath, `${JSON.stringify(updatedList, null, 2)}\n`, 'utf-8');
    console.log(
      `Auditado(s) com sucesso (${markedIds.length}): ${markedIds.join(', ')} em ${filePath}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ERRO] ${message}`);
    process.exit(1);
  }
}

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  runMarkAuditedCli(process.argv.slice(2));
}
