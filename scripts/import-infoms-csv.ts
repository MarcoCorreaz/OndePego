import fs from 'node:fs';
import path from 'node:path';
import { mergeInfomsEstablishments, parseInfomsCsv } from '../src/lib/infomsCsv';
import { EstabelecimentosFile } from '../src/types/schema';

function parseCliArgs(argv: string[]): {
  inputPath: string | null;
  outputPath: string;
  dryRun: boolean;
} {
  let inputPath: string | null = null;
  let outputPath = path.resolve(process.cwd(), 'data/estabelecimentos.json');
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') {
      inputPath = argv[i + 1] ? path.resolve(process.cwd(), argv[i + 1]!) : null;
      i++;
    } else if (arg === '--output' || arg === '-o') {
      if (argv[i + 1]) {
        outputPath = path.resolve(process.cwd(), argv[i + 1]!);
        i++;
      }
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  return { inputPath, outputPath, dryRun };
}

function main(): void {
  const { inputPath, outputPath, dryRun } = parseCliArgs(process.argv.slice(2));

  if (!inputPath) {
    console.error(
      'Uso: npm run import:infoms -- --input <caminho-do-csv-infoms.csv> [--output data/estabelecimentos.json] [--dry-run]',
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
  const rawExistingJson = JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as unknown;
  const existing = EstabelecimentosFile.parse(rawExistingJson);

  const { rows, skippedOutsideMunicipio } = parseInfomsCsv(rawCsv);
  const result = mergeInfomsEstablishments(existing, rows, skippedOutsideMunicipio);

  // Valida o resultado final contra o contrato Zod antes de gravar
  const validatedMerged = EstabelecimentosFile.parse(result.merged);

  console.log('=== Relatório de Importação InfoMS (Farmácia Popular — Cuiabá) ===');
  console.log(`Linhas de Cuiabá lidas no CSV        : ${rows.length}`);
  console.log(`Ignoradas de outros municípios       : ${result.skippedOutsideMunicipio}`);
  console.log(`Novas farmácias adicionadas          : ${result.added}`);
  console.log(`Farmácias existentes atualizadas     : ${result.updated}`);
  console.log(`Coordenadas auditadas preservadas    : ${result.preservedAuditedCoords}`);
  console.log(`Total de estabelecimentos após merge : ${validatedMerged.length}`);

  if (dryRun) {
    console.log('[DRY-RUN] Nenhum arquivo foi modificado.');
    return;
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(validatedMerged, null, 2)}\n`, 'utf-8');
  console.log(`Arquivo atualizado com sucesso: ${outputPath}`);
}

main();
