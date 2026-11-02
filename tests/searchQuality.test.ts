import { describe, expect, it } from 'vitest';
import { createMedicationSearchEngine } from '@/lib/searchEngine';
import type { Medicamento } from '@/types/schema';
import catalogoJson from '../data/medicamentos.json';

const catalogo = catalogoJson as Medicamento[];

describe('Auditoria de Qualidade e Supressão de Ruído da Busca (37 Consultas)', () => {
  const engine = createMedicationSearchEngine(catalogo);

  it('retorna 0 resultados para termos aleatórios ou sem correspondência ("xyz", "qqq", "12345")', () => {
    expect(engine.search('xyz')).toEqual([]);
    expect(engine.search('qqq')).toEqual([]);
    expect(engine.search('12345')).toEqual([]);
  });

  it('retorna apenas Ácido Acetilsalicílico para "AAS" (exato), sem ruído de aproximados', () => {
    const results = engine.search('AAS');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.exato)).toBe(true);
    expect(results[0]?.item.slug).toBe('acido-acetilsalicilico');
    expect(results.some((r) => r.item.slug === 'amoxicilina')).toBe(false);
  });

  it('retorna apenas Omeprazol para "omeprazol" (exato), nunca propranolol ou beclometasona', () => {
    const results = engine.search('omeprazol');
    expect(results.length).toBe(1);
    expect(results[0]?.item.slug).toBe('omeprazol');
    expect(results[0]?.exato).toBe(true);
    expect(results.some((r) => r.item.slug === 'cloridrato-de-propranolol')).toBe(false);
    expect(results.some((r) => r.item.slug === 'dipropionato-de-beclometasona')).toBe(false);
  });

  it('retorna Sinvastatina por assunto para "colesterol", nunca medroxiprogesterona', () => {
    const results = engine.search('colesterol');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.item.slug).toBe('sinvastatina');
    expect(results[0]?.porAssunto).toBe(true);
    expect(results.some((r) => r.item.slug === 'acetato-de-medroxiprogesterona')).toBe(false);
  });

  it('retorna apenas Sinvastatina aproximada para "atorvastatina" (exato: false), sem falso match exato', () => {
    const results = engine.search('atorvastatina');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => !r.exato && !r.porAssunto)).toBe(true);
    expect(results[0]?.item.slug).toBe('sinvastatina');
    expect(results.some((r) => r.item.slug === 'amoxicilina')).toBe(false);
    expect(results.some((r) => r.item.slug === 'levotiroxina-sodica')).toBe(false);
  });

  it('avalia consultas canônicas ("dipirona", "losartana", "paracetamol", "glifage", "rivotril", "lozartana") com alta precisão', () => {
    // 1. Dipirona
    const dipirona = engine.search('dipirona');
    expect(dipirona[0]?.item.slug).toBe('dipirona-sodica');
    expect(dipirona[0]?.exato).toBe(true);
    expect(dipirona.every((r) => r.exato)).toBe(true);

    // 2. Losartana
    const losartana = engine.search('losartana');
    expect(losartana[0]?.item.slug).toBe('losartana-potassica');
    expect(losartana[0]?.exato).toBe(true);
    expect(losartana.every((r) => r.exato)).toBe(true);

    // 3. Paracetamol
    const paracetamol = engine.search('paracetamol');
    expect(paracetamol[0]?.item.slug).toBe('paracetamol');
    expect(paracetamol[0]?.exato).toBe(true);
    expect(paracetamol.every((r) => r.exato)).toBe(true);

    // 4. Glifage (nome comercial de Cloridrato de Metformina)
    const glifage = engine.search('glifage');
    expect(glifage[0]?.item.slug).toBe('cloridrato-de-metformina');
    expect(glifage[0]?.exato).toBe(true);
    expect(glifage.every((r) => r.exato)).toBe(true);

    // 5. Rivotril (nome comercial de Clonazepam)
    const rivotril = engine.search('rivotril');
    expect(rivotril[0]?.item.slug).toBe('clonazepam');
    expect(rivotril[0]?.exato).toBe(true);
    expect(rivotril.every((r) => r.exato)).toBe(true);

    // 6. Lozartana (equivalência fonética z -> s / precisão para Losartana potássica)
    const lozartana = engine.search('lozartana');
    expect(lozartana.length).toBeGreaterThan(0);
    expect(lozartana[0]?.item.slug).toBe('losartana-potassica');

    // 7. Amlodipina e Besilato de amlodipina (grafia comum para besilato-de-anlodipino)
    const amlodipina = engine.search('amlodipina');
    expect(amlodipina.length).toBeGreaterThan(0);
    expect(amlodipina[0]?.item.slug).toBe('besilato-de-anlodipino');
    expect(amlodipina[0]?.exato).toBe(true);

    const besilatoAmlodipina = engine.search('besilato de amlodipina');
    expect(besilatoAmlodipina.length).toBeGreaterThan(0);
    expect(besilatoAmlodipina[0]?.item.slug).toBe('besilato-de-anlodipino');
    expect(besilatoAmlodipina[0]?.exato).toBe(true);

    // 8. Simvastatina (grafia comum com "m" para sinvastatina)
    const simvastatina = engine.search('simvastatina');
    expect(simvastatina.length).toBeGreaterThan(0);
    expect(simvastatina[0]?.item.slug).toBe('sinvastatina');
    expect(simvastatina[0]?.exato).toBe(true);
  });
});
