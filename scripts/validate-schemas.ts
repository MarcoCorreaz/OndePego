import fs from 'node:fs';
import path from 'node:path';
import type { z } from 'zod';
import {
  EstabelecimentosFile,
  MedicamentosFile,
  Meta,
} from '../src/types/schema';
import { validateBusinessRules } from '../src/lib/dataRules';

export interface ValidateFilesOptions {
  dataDir?: string;
  isProduction?: boolean;
}

export interface ValidateFilesResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function formatZodIssues(fileName: string, issues: readonly z.core.$ZodIssue[]): string[] {
  return issues.map((issue) => {
    const pathStr = issue.path.length > 0 ? issue.path.join(' › ') : '(raiz)';
    return `${fileName} › ${pathStr}: ${issue.message}`;
  });
}

function readJsonFile(filePath: string, fileName: string, errors: string[]): unknown {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as unknown;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`${fileName}: falha ao ler ou interpretar JSON (${message})`);
    return undefined;
  }
}

export function validateDataFiles(options: ValidateFilesOptions = {}): ValidateFilesResult {
  const dataDir = options.dataDir ?? path.resolve(process.cwd(), 'data');
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production';

  const errors: string[] = [];
  const warnings: string[] = [];

  const metaRaw = readJsonFile(path.join(dataDir, 'meta.json'), 'meta.json', errors);
  const medsRaw = readJsonFile(path.join(dataDir, 'medicamentos.json'), 'medicamentos.json', errors);
  const estabsRaw = readJsonFile(
    path.join(dataDir, 'estabelecimentos.json'),
    'estabelecimentos.json',
    errors,
  );

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  const metaParsed = Meta.safeParse(metaRaw);
  if (!metaParsed.success) {
    errors.push(...formatZodIssues('meta.json', metaParsed.error.issues));
  }

  const medsParsed = MedicamentosFile.safeParse(medsRaw);
  if (!medsParsed.success) {
    errors.push(...formatZodIssues('medicamentos.json', medsParsed.error.issues));
  }

  const estabsParsed = EstabelecimentosFile.safeParse(estabsRaw);
  if (!estabsParsed.success) {
    errors.push(...formatZodIssues('estabelecimentos.json', estabsParsed.error.issues));
  }

  if (!metaParsed.success || !medsParsed.success || !estabsParsed.success) {
    return { ok: false, errors, warnings };
  }

  const report = validateBusinessRules({
    meta: metaParsed.data,
    medicamentos: medsParsed.data,
    estabelecimentos: estabsParsed.data,
    isProduction,
  });

  errors.push(...report.errors);
  warnings.push(...report.warnings);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function main(): void {
  const result = validateDataFiles();

  for (const warning of result.warnings) {
    console.warn(`[AVISO] ${warning}`);
  }

  if (!result.ok) {
    console.error('Validação de dados falhou:');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('Validação de dados concluída com sucesso.');
}

const isDirectRun =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  main();
}
