import fs from 'node:fs';
import path from 'node:path';
import {
  InvalidLocalDispensacaoError,
  importAndMergeMedicamentos,
} from '../src/lib/importMedicamentos';
import { IsoDate, MedicamentosFile, Meta } from '../src/types/schema';

export interface ImportMedicamentosCliArgs {
  remumePath: string | null;
  elencoPath: string | null;
  sinonimosPath: string | null;
  outputPath: string;
  metaPath: string;
  pendingReportPath: string;
  prune: boolean;
  dataRemume: string | null;
  dataElenco: string | null;
  write: boolean;
}

export function parseImportMedicamentosArgs(
  argv: readonly string[],
): ImportMedicamentosCliArgs {
  let remumePath: string | null = null;
  let elencoPath: string | null = null;
  let sinonimosPath: string | null = null;
  let outputPath = path.resolve(process.cwd(), 'data/medicamentos.json');
  let metaPath = path.resolve(process.cwd(), 'data/meta.json');
  let pendingReportPath = path.resolve(process.cwd(), 'docs/sinonimos-pendentes.md');
  let prune = false;
  let dataRemume: string | null = null;
  let dataElenco: string | null = null;
  let write = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--remume') {
      remumePath = argv[i + 1] ? path.resolve(process.cwd(), argv[i + 1]!) : null;
      i++;
    } else if (arg.startsWith('--remume=')) {
      remumePath = path.resolve(process.cwd(), arg.slice('--remume='.length));
    } else if (arg === '--elenco') {
      elencoPath = argv[i + 1] ? path.resolve(process.cwd(), argv[i + 1]!) : null;
      i++;
    } else if (arg.startsWith('--elenco=')) {
      elencoPath = path.resolve(process.cwd(), arg.slice('--elenco='.length));
    } else if (arg === '--sinonimos') {
      sinonimosPath = argv[i + 1] ? path.resolve(process.cwd(), argv[i + 1]!) : null;
      i++;
    } else if (arg.startsWith('--sinonimos=')) {
      sinonimosPath = path.resolve(process.cwd(), arg.slice('--sinonimos='.length));
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
    } else if (arg === '--pending-report') {
      if (argv[i + 1]) {
        pendingReportPath = path.resolve(process.cwd(), argv[i + 1]!);
        i++;
      }
    } else if (arg.startsWith('--pending-report=')) {
      pendingReportPath = path.resolve(process.cwd(), arg.slice('--pending-report='.length));
    } else if (arg === '--prune') {
      prune = true;
    } else if (arg === '--data-remume') {
      if (argv[i + 1]) {
        dataRemume = argv[i + 1]!;
        i++;
      }
    } else if (arg.startsWith('--data-remume=')) {
      dataRemume = arg.slice('--data-remume='.length);
    } else if (arg === '--data-elenco') {
      if (argv[i + 1]) {
        dataElenco = argv[i + 1]!;
        i++;
      }
    } else if (arg.startsWith('--data-elenco=')) {
      dataElenco = arg.slice('--data-elenco='.length);
    } else if (arg === '--write') {
      write = true;
    } else if (arg === '--dry-run') {
      write = false;
    }
  }

  return {
    remumePath,
    elencoPath,
    sinonimosPath,
    outputPath,
    metaPath,
    pendingReportPath,
    prune,
    dataRemume,
    dataElenco,
    write,
  };
}

export function runImportMedicamentosCli(argv: readonly string[]): void {
  const args = parseImportMedicamentosArgs(argv);

  if (!args.remumePath || !args.elencoPath) {
    console.error(
      'Uso: npm run import:medicamentos -- --remume <csv> --elenco <csv> [--sinonimos <csv>] [--prune] [--data-remume=AAAA-MM-DD] [--data-elenco=AAAA-MM-DD] [--dry-run | --write]',
    );
    process.exit(1);
  }

  if (!fs.existsSync(args.remumePath)) {
    console.error(`Arquivo REMUME não encontrado: ${args.remumePath}`);
    process.exit(1);
  }

  if (!fs.existsSync(args.elencoPath)) {
    console.error(`Arquivo Elenco PFPB não encontrado: ${args.elencoPath}`);
    process.exit(1);
  }

  if (args.sinonimosPath && !fs.existsSync(args.sinonimosPath)) {
    console.error(`Arquivo de sinônimos não encontrado: ${args.sinonimosPath}`);
    process.exit(1);
  }

  if (args.dataRemume !== null) {
    IsoDate.parse(args.dataRemume);
  }
  if (args.dataElenco !== null) {
    IsoDate.parse(args.dataElenco);
  }

  const remumeCsv = fs.readFileSync(args.remumePath, 'utf-8');
  const elencoCsv = fs.readFileSync(args.elencoPath, 'utf-8');
  const sinonimosCsv = args.sinonimosPath
    ? fs.readFileSync(args.sinonimosPath, 'utf-8')
    : undefined;

  const existing = fs.existsSync(args.outputPath)
    ? MedicamentosFile.parse(JSON.parse(fs.readFileSync(args.outputPath, 'utf-8')))
    : [];

  try {
    const result = importAndMergeMedicamentos({
      remumeCsv,
      elencoCsv,
      sinonimosCsv,
      existing,
      prune: args.prune,
    });

    console.log('=== Relatório de Importação de Medicamentos (REMUME × Elenco PFPB) ===');
    console.log(`Medicamentos adicionados           : ${result.added}`);
    console.log(`Medicamentos atualizados           : ${result.updated}`);
    console.log(`Medicamentos removidos (--prune)   : ${result.removed}`);
    console.log(`Total no catálogo após merge       : ${result.merged.length}`);
    console.log(`Itens sem sinônimos (pendentes)    : ${result.pendingSynonymsSlugs.length}`);

    if (!args.write) {
      console.log('[DRY-RUN] Modo padrão ativo. Nenhum arquivo foi modificado (use --write).');
      return;
    }

    fs.writeFileSync(args.outputPath, `${JSON.stringify(result.merged, null, 2)}\n`, 'utf-8');
    console.log(`Catálogo gravado em: ${args.outputPath}`);

    fs.mkdirSync(path.dirname(args.pendingReportPath), { recursive: true });
    fs.writeFileSync(args.pendingReportPath, result.pendingSynonymsMarkdown, 'utf-8');
    console.log(`Relatório de sinônimos pendentes gravado em: ${args.pendingReportPath}`);

    if ((args.dataRemume || args.dataElenco) && fs.existsSync(args.metaPath)) {
      const rawMeta = JSON.parse(fs.readFileSync(args.metaPath, 'utf-8')) as unknown;
      const parsedMeta = Meta.parse(rawMeta);
      const updatedMeta = Meta.parse({
        ...parsedMeta,
        ...(args.dataRemume ? { data_remume: args.dataRemume } : {}),
        ...(args.dataElenco ? { data_elenco_pfpb: args.dataElenco } : {}),
      });
      fs.writeFileSync(args.metaPath, `${JSON.stringify(updatedMeta, null, 2)}\n`, 'utf-8');
      console.log(`Datas de atualização gravadas em: ${args.metaPath}`);
    }
  } catch (err) {
    if (err instanceof InvalidLocalDispensacaoError) {
      console.error(`[ERRO FATAL] ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  runImportMedicamentosCli(process.argv.slice(2));
}
