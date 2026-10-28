import fs from 'node:fs';
import path from 'node:path';
import { mergeInfomsEstablishments, parseInfomsCsv } from '../src/lib/infomsCsv';
import { EstabelecimentosFile, IsoDate, Meta } from '../src/types/schema';

export interface ImportInfomsCliOptions {
  inputPath: string | null;
  outputPath: string;
  metaPath: string;
  municipios: string;
  dataInfoms: string | null;
  write: boolean;
}

export function parseInfomsCliArgs(argv: readonly string[]): ImportInfomsCliOptions {
  let inputPath: string | null = null;
  let outputPath = path.resolve(process.cwd(), 'data/estabelecimentos.json');
  let metaPath = path.resolve(process.cwd(), 'data/meta.json');
  let municipios = 'cuiaba';
  let dataInfoms: string | null = null;
  let write = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--input' || arg === '-i') {
      inputPath = argv[i + 1] ? path.resolve(process.cwd(), argv[i + 1]!) : null;
      i++;
    } else if (arg.startsWith('--input=')) {
      inputPath = path.resolve(process.cwd(), arg.slice('--input='.length));
    } else if (arg === '--output' || arg === '-o') {
      if (argv[i + 1]) {
        outputPath = path.resolve(process.cwd(), argv[i + 1]!);
        i++;
      }
    } else if (arg.startsWith('--output=')) {
      outputPath = path.resolve(process.cwd(), arg.slice('--output='.length));
    } else if (arg === '--meta') {
      if (argv[i + 1]) {
        metaPath = path.resolve(process.cwd(), argv[i + 1]!);
        i++;
      }
    } else if (arg.startsWith('--meta=')) {
      metaPath = path.resolve(process.cwd(), arg.slice('--meta='.length));
    } else if (arg === '--municipios') {
      if (argv[i + 1]) {
        municipios = argv[i + 1]!;
        i++;
      }
    } else if (arg.startsWith('--municipios=')) {
      municipios = arg.slice('--municipios='.length);
    } else if (arg === '--data-infoms') {
      if (argv[i + 1]) {
        dataInfoms = argv[i + 1]!;
        i++;
      }
    } else if (arg.startsWith('--data-infoms=')) {
      dataInfoms = arg.slice('--data-infoms='.length);
    } else if (arg === '--write') {
      write = true;
    } else if (arg === '--dry-run') {
      write = false;
    }
  }

  return { inputPath, outputPath, metaPath, municipios, dataInfoms, write };
}

export function runInfomsCli(argv: readonly string[]): void {
  const { inputPath, outputPath, metaPath, municipios, dataInfoms, write } =
    parseInfomsCliArgs(argv);

  if (!inputPath) {
    console.error(
      'Uso: npm run import:infoms -- --input <caminho.csv> [--municipios cuiaba,varzea-grande] [--data-infoms=AAAA-MM-DD] [--output data/estabelecimentos.json] [--dry-run | --write]',
    );
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Arquivo CSV não encontrado: ${inputPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputPath)) {
    console.error(`Arquivo JSON de destino não encontrado: ${outputPath}`);
    process.exit(1);
  }

  if (dataInfoms !== null) {
    IsoDate.parse(dataInfoms);
  }

  const rawCsv = fs.readFileSync(inputPath, 'utf-8');
  const rawExistingJson = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as unknown;
  const existing = EstabelecimentosFile.parse(rawExistingJson);

  const { rows, skippedOutsideMunicipio } = parseInfomsCsv(rawCsv, { municipios });
  const result = mergeInfomsEstablishments(existing, rows, skippedOutsideMunicipio);

  // Valida o resultado final contra o contrato Zod antes de gravar
  const validatedMerged = EstabelecimentosFile.parse(result.merged);

  console.log('=== Relatório de Importação InfoMS (Farmácia Popular) ===');
  console.log(`Municípios filtrados                 : ${municipios}`);
  console.log(`Linhas aceitas no CSV                : ${rows.length}`);
  console.log(`Ignoradas de outros municípios       : ${result.skippedOutsideMunicipio}`);
  console.log(`Novas farmácias adicionadas          : ${result.added}`);
  console.log(`Farmácias existentes atualizadas     : ${result.updated}`);
  console.log(`Coordenadas auditadas preservadas    : ${result.preservedAuditedCoords}`);
  console.log(`Total de estabelecimentos após merge : ${validatedMerged.length}`);

  if (!write) {
    console.log('[DRY-RUN] Modo padrão ativo. Use --write para gravar no disco.');
    return;
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(validatedMerged, null, 2)}\n`, 'utf-8');
  console.log(`Arquivo atualizado com sucesso: ${outputPath}`);

  if (dataInfoms && fs.existsSync(metaPath)) {
    const rawMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as unknown;
    const parsedMeta = Meta.parse(rawMeta);
    const updatedMeta = Meta.parse({
      ...parsedMeta,
      data_infoms: dataInfoms,
    });
    fs.writeFileSync(metaPath, `${JSON.stringify(updatedMeta, null, 2)}\n`, 'utf-8');
    console.log(`Data InfoMS atualizada em meta.json: ${dataInfoms}`);
  }
}

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  runInfomsCli(process.argv.slice(2));
}
