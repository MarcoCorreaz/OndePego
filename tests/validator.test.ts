import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateBusinessRules } from '@/lib/dataRules';
import { EstabelecimentosFile, MedicamentosFile, Meta } from '@/types/schema';
import { validateDataFiles } from '../scripts/validate-schemas';
import metaJson from '../data/meta.json';
import medicamentosJson from '../data/medicamentos.json';
import estabelecimentosJson from '../data/estabelecimentos.json';

describe('Validador de contratos e regras de negócio', () => {
  const meta = Meta.parse(metaJson);
  const medicamentos = MedicamentosFile.parse(medicamentosJson);
  const estabelecimentos = EstabelecimentosFile.parse(estabelecimentosJson);

  it('aprova as fixtures fora de produção e emite aviso de farmácia não auditada', () => {
    const report = validateBusinessRules({
      meta,
      medicamentos,
      estabelecimentos,
      isProduction: false,
    });

    expect(report.errors).toEqual([]);
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.warnings[0]).toContain('auditado_manualmente=false');
  });

  it('rejeita fixtures quando NODE_ENV=production (isProduction=true)', () => {
    const report = validateBusinessRules({
      meta,
      medicamentos,
      estabelecimentos,
      isProduction: true,
    });

    expect(report.errors.length).toBeGreaterThanOrEqual(3);
    expect(report.errors.some((e) => e.includes('meta.json (__fixture: true)'))).toBe(true);
    expect(report.errors.some((e) => e.includes('medicamentos.json'))).toBe(true);
    expect(report.errors.some((e) => e.includes('estabelecimentos.json'))).toBe(true);
  });

  it('rejeita ALERTA_ABASTECIMENTO enquanto estoque_oficial for false e aceita quando true', () => {
    const medComAlerta = [
      {
        ...medicamentos[0]!,
        apresentacoes: [
          {
            ...medicamentos[0]!.apresentacoes[0]!,
            status_remume_cuiaba: 'ALERTA_ABASTECIMENTO' as const,
          },
        ],
      },
    ];

    const reportOff = validateBusinessRules({
      meta: { ...meta, flags: { estoque_oficial: false } },
      medicamentos: medComAlerta,
      estabelecimentos,
      isProduction: false,
    });
    expect(reportOff.errors.some((e) => e.includes('ALERTA_ABASTECIMENTO'))).toBe(true);

    const reportOn = validateBusinessRules({
      meta: { ...meta, flags: { estoque_oficial: true } },
      medicamentos: medComAlerta,
      estabelecimentos,
      isProduction: false,
    });
    expect(reportOn.errors).toEqual([]);
  });

  it('validateDataFiles falha se um campo de JSON for quebrado', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onde-pego-test-'));
    try {
      fs.writeFileSync(
        path.join(tmpDir, 'meta.json'),
        JSON.stringify({ ...metaJson, data_remume: 'DATA_QUEBRADA' }),
      );
      fs.writeFileSync(path.join(tmpDir, 'medicamentos.json'), JSON.stringify(medicamentosJson));
      fs.writeFileSync(
        path.join(tmpDir, 'estabelecimentos.json'),
        JSON.stringify(estabelecimentosJson),
      );

      const res = validateDataFiles({ dataDir: tmpDir, isProduction: false });
      expect(res.ok).toBe(false);
      expect(res.errors.some((e) => e.includes('meta.json › data_remume'))).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
