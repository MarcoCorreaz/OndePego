import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateBusinessRules } from '@/lib/dataRules';
import { EstabelecimentosFile, MedicamentosFile, Meta } from '@/types/schema';
import {
  isProductionValidationMode,
  validateDataFiles,
} from '../scripts/validate-schemas';
import metaJson from '../data/meta.json';
import medicamentosJson from '../data/medicamentos.json';
import estabelecimentosJson from '../data/estabelecimentos.json';

describe('Validador de contratos e regras de negócio', () => {
  const meta = Meta.parse(metaJson);
  const medicamentos = MedicamentosFile.parse(medicamentosJson);
  const estabelecimentos = EstabelecimentosFile.parse(estabelecimentosJson);

  it('detecta modo produção tanto por --prod em argv quanto por NODE_ENV=production', () => {
    expect(isProductionValidationMode(['node', 'script.ts', '--prod'], 'development')).toBe(true);
    expect(isProductionValidationMode(['node', 'script.ts'], 'production')).toBe(true);
    expect(isProductionValidationMode(['node', 'script.ts'], 'test')).toBe(false);
  });

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

  it('rejeita fixtures no modo --prod / NODE_ENV=production', () => {
    const res = validateDataFiles({ argv: ['node', 'validate-schemas.ts', '--prod'] });
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(4);
    expect(res.errors.some((e) => e.includes('termina com "-fixture"'))).toBe(true);
    expect(res.errors.some((e) => e.includes('meta.json (__fixture: true)'))).toBe(true);
    expect(res.errors.some((e) => e.includes('medicamentos.json'))).toBe(true);
    expect(res.errors.some((e) => e.includes('estabelecimentos.json'))).toBe(true);
  });

  it('rejeita meta.versao terminando em "-fixture" (case-insensitive) no modo --prod mesmo sem flags __fixture', () => {
    const cleanMeds = medicamentos.map(({ __fixture, ...rest }) => rest);
    const cleanEstabs = estabelecimentos.map(({ __fixture, ...rest }) => rest);
    const { __fixture: _ignoreMetaFixture, ...cleanMetaBase } = meta;

    const report = validateBusinessRules({
      meta: { ...cleanMetaBase, versao: '1.0.0-FIXTURE' },
      medicamentos: cleanMeds,
      estabelecimentos: cleanEstabs,
      isProduction: true,
    });

    expect(report.errors.some((e) => e.includes('termina com "-fixture"'))).toBe(true);
  });

  it('aprova no modo --prod quando não há fixtures, meta.versao não termina com -fixture e todas as farmácias estão auditadas', () => {
    const cleanMeds = medicamentos.map(({ __fixture, ...rest }) => rest);
    const cleanEstabs = estabelecimentos.map(({ __fixture, ...rest }) => ({
      ...rest,
      coordenadas: {
        ...rest.coordenadas,
        auditado_manualmente: true,
        sem_localizacao: false,
      },
    }));
    const { __fixture: _ignoreMetaFixture, ...cleanMetaBase } = meta;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onde-pego-prod-ok-'));
    try {
      fs.writeFileSync(
        path.join(tmpDir, 'meta.json'),
        JSON.stringify({ ...cleanMetaBase, versao: '1.0.0' }),
      );
      fs.writeFileSync(path.join(tmpDir, 'medicamentos.json'), JSON.stringify(cleanMeds));
      fs.writeFileSync(path.join(tmpDir, 'estabelecimentos.json'), JSON.stringify(cleanEstabs));

      const res = validateDataFiles({
        dataDir: tmpDir,
        argv: ['node', 'validate-schemas.ts', '--prod'],
      });
      expect(res.ok).toBe(true);
      expect(res.errors).toEqual([]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('rejeita no modo --prod qualquer FARMACIA_POPULAR com auditado_manualmente === false, coordenada placeholder CUIABA_VG_CENTER ou sem_localizacao === true', () => {
    const cleanMeds = medicamentos.map(({ __fixture, ...rest }) => rest);
    const { __fixture: _ignoreMetaFixture, ...cleanMetaBase } = meta;

    const reportNaoAuditada = validateBusinessRules({
      meta: { ...cleanMetaBase, versao: '1.0.0' },
      medicamentos: cleanMeds,
      estabelecimentos: [
        {
          id: 'pfpb-nao-auditada',
          nome_fantasia: 'DROGARIA_SINTETICA_NAO_AUDITADA',
          tipo: 'FARMACIA_POPULAR',
          bairro: 'Centro',
          endereco_completo: 'RUA SINTETICA, 10',
          coordenadas: { lat: -15.595, lng: -56.095, auditado_manualmente: false },
          atributos_operacionais: { credenciamento_pfpb_ativo: true, status_funcionamento: 'NORMAL' },
        },
      ],
      isProduction: true,
    });
    expect(reportNaoAuditada.errors.some((e) => e.includes('auditado_manualmente=false'))).toBe(
      true,
    );

    const reportPlaceholder = validateBusinessRules({
      meta: { ...cleanMetaBase, versao: '1.0.0' },
      medicamentos: cleanMeds,
      estabelecimentos: [
        {
          id: 'pfpb-placeholder',
          nome_fantasia: 'DROGARIA_SINTETICA_PLACEHOLDER',
          tipo: 'FARMACIA_POPULAR',
          bairro: 'Centro',
          endereco_completo: 'RUA SINTETICA, 20',
          coordenadas: { lat: -15.6014, lng: -56.0979, auditado_manualmente: true },
          atributos_operacionais: { credenciamento_pfpb_ativo: true, status_funcionamento: 'NORMAL' },
        },
      ],
      isProduction: true,
    });
    expect(reportPlaceholder.errors.some((e) => e.includes('CUIABA_VG_CENTER'))).toBe(true);

    const reportSemLocalizacao = validateBusinessRules({
      meta: { ...cleanMetaBase, versao: '1.0.0' },
      medicamentos: cleanMeds,
      estabelecimentos: [
        {
          id: 'pfpb-sem-coord',
          nome_fantasia: 'DROGARIA_SINTETICA_SEM_COORD',
          tipo: 'FARMACIA_POPULAR',
          bairro: 'Centro',
          endereco_completo: 'RUA SINTETICA, 30',
          coordenadas: {
            lat: -15.6014,
            lng: -56.0979,
            auditado_manualmente: false,
            sem_localizacao: true,
          },
          atributos_operacionais: { credenciamento_pfpb_ativo: true, status_funcionamento: 'NORMAL' },
        },
      ],
      isProduction: true,
    });
    expect(reportSemLocalizacao.errors.some((e) => e.includes('sem_localizacao=true'))).toBe(
      true,
    );
  });

  it('rejeita medicamentos.json ou estabelecimentos.json vazios (length === 0)', () => {
    const report = validateBusinessRules({
      meta: { ...meta, versao: '1.0.0', __fixture: undefined },
      medicamentos: [],
      estabelecimentos: [],
      isProduction: true,
    });

    expect(report.errors.some((e) => e.includes('medicamentos.json: a lista'))).toBe(true);
    expect(report.errors.some((e) => e.includes('estabelecimentos.json: a lista'))).toBe(true);
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
