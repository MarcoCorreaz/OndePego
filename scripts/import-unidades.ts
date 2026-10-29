import fs from 'node:fs';
import path from 'node:path';
import { mergeUnidadesPublicas, parseUnidadesCsv } from '../src/lib/importUnidades';
import { EstabelecimentosFile } from '../src/types/schema';

export interface ImportUnidadesCliArgs {
  inputPath: string | null;
  outputPath: string;
  write: boolean;
}

export function parseImportUnidadesArgs(argv: readonly string[]): ImportUnidadesCliArgs {
  let inputPath: string | null = null;
  let outputPath = path.resolve(process.cwd(), 'data/estabelecimentos.json');
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
    } else if (arg === '--write') {
      write = true;
    } else if (arg === '--dry-run') {
      write = false;
    }
  }

  if (!inputPath) {
    const defaultInput = path.resolve(process.cwd(), 'fontes/unidades.csv');
    if (fs.existsSync(defaultInput)) {
      inputPath = defaultInput;
    }
  }

  return { inputPath, outputPath, write };
}

export function runImportUnidadesCli(argv: readonly string[]): void {
  const { inputPath, outputPath, write } = parseImportUnidadesArgs(argv);

  if (!inputPath) {
    console.error(
      'Uso: npm run import:unidades -- --input <caminho.csv> [--output data/estabelecimentos.json] [--dry-run | --write]',
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

  const rawCsv = fs.readFileSync(inputPath, 'utf-8');
  const existing = EstabelecimentosFile.parse(
    JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as unknown,
  );

  const rows = parseUnidadesCsv(rawCsv);
  const result = mergeUnidadesPublicas(existing, rows);

  console.log('=== Relatório de Importação de Unidades Públicas (SMS Cuiabá) ===');
  console.log(`Unidades lidas no CSV                : ${rows.length}`);
  console.log(`Novas unidades adicionadas           : ${result.added}`);
  console.log(`Unidades existentes atualizadas      : ${result.updated}`);
  console.log(`Farmácias Populares preservadas      : ${result.preservedPharmacies}`);
  console.log(`Coordenadas auditadas preservadas    : ${result.preservedAuditedCoords}`);
  console.log(`Total de estabelecimentos após merge : ${result.merged.length}`);

  if (!write) {
    console.log('[DRY-RUN] Modo padrão ativo. Nenhum arquivo foi modificado (use --write).');
    return;
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(result.merged, null, 2)}\n`, 'utf-8');
  console.log(`Arquivo atualizado com sucesso: ${outputPath}`);
}

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  runImportUnidadesCli(process.argv.slice(2));
}
