import { describe, expect, it } from 'vitest';
import rawMedicamentos from '../data/medicamentos.json';
import {
  clearSearchSession,
  DEFAULT_SEARCH_SESSION,
  loadSearchSession,
  parseSearchSession,
  resolveMatchState,
  saveSearchSession,
  SEARCH_SESSION_STORAGE_KEY,
} from '@/lib/searchSession';
import { MedicamentosFile } from '@/types/schema';

const FIXTURE_MEDICAMENTOS = MedicamentosFile.parse(rawMedicamentos);
const MED_A = FIXTURE_MEDICAMENTOS[0]!;
const MED_B = FIXTURE_MEDICAMENTOS[1]!;

describe('searchSession — resolveMatchState e persistência de sessão (ADR-09)', () => {
  it('retorna "exato" quando o slug consta em results com exato === true', () => {
    const results = [
      { item: MED_A, exato: true },
      { item: MED_B, exato: false },
    ];
    expect(resolveMatchState(results, MED_A.slug)).toBe('exato');
  });

  it('retorna "aproximado" quando o slug consta em results com exato === false', () => {
    const results = [
      { item: MED_A, exato: true },
      { item: MED_B, exato: false },
    ];
    expect(resolveMatchState(results, MED_B.slug)).toBe('aproximado');
  });

  it('normaliza slug com barra final (/), espaços e caixa alta antes de comparar', () => {
    const results = [
      { item: MED_A, exato: false },
      { item: MED_B, exato: true },
    ];
    expect(resolveMatchState(results, `${MED_A.slug}/`)).toBe('aproximado');
    expect(resolveMatchState(results, `  ${MED_B.slug.toUpperCase()}///  `)).toBe('exato');
  });

  it('retorna "desconhecido" quando o slug não está na lista results', () => {
    const results = [{ item: MED_A, exato: true }];
    expect(resolveMatchState(results, 'slug-inexistente-no-resultado')).toBe('desconhecido');
    expect(resolveMatchState(results, MED_B.slug)).toBe('desconhecido');
  });

  it('retorna "desconhecido" quando a lista results está vazia ou slug é vazio', () => {
    expect(resolveMatchState([], MED_A.slug)).toBe('desconhecido');
    expect(resolveMatchState([{ item: MED_A, exato: true }], '')).toBe('desconhecido');
    expect(resolveMatchState([{ item: MED_A, exato: true }], '   /  ')).toBe('desconhecido');
  });

  it('persiste apenas lastQuery e scrollY no sessionStorage simulado', () => {
    const store = new Map<string, string>();
    const fakeStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };

    expect(loadSearchSession(fakeStorage)).toEqual(DEFAULT_SEARCH_SESSION);

    saveSearchSession({ lastQuery: 'losartana', scrollY: 142.8 }, fakeStorage);
    const rawSaved = store.get(SEARCH_SESSION_STORAGE_KEY);
    expect(rawSaved).toBeDefined();
    expect(JSON.parse(rawSaved!)).toEqual({
      lastQuery: 'losartana',
      scrollY: 143,
    });

    expect(loadSearchSession(fakeStorage)).toEqual({
      lastQuery: 'losartana',
      scrollY: 143,
    });

    clearSearchSession(fakeStorage);
    expect(loadSearchSession(fakeStorage)).toEqual(DEFAULT_SEARCH_SESSION);
    expect(parseSearchSession('json-invalido')).toEqual(DEFAULT_SEARCH_SESSION);
  });
});
