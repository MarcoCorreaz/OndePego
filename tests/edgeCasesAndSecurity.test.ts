import { describe, expect, it, vi } from 'vitest';
import {
  getSafeLocalStorage,
  getSafeSessionStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '@/lib/safeStorage';
import { loadPrefs, parsePrefs, savePrefs } from '@/lib/prefs';
import {
  clearPrescriptionSession,
  loadPrescriptionSession,
  parsePrescriptionSession,
  savePrescriptionSession,
} from '@/lib/prescriptionList';
import {
  clearSearchSession,
  loadSearchSession,
  parseSearchSession,
  saveSearchSession,
} from '@/lib/searchSession';
import { createMedicationSearchEngine } from '@/lib/searchEngine';
import type { Medicamento } from '@/types/schema';

const FIXTURE_CATALOGO: Medicamento[] = [
  {
    slug: 'losartana-potassica-fixture',
    principio_ativo: 'Losartana potássica',
    nomes_comerciais: ['Cozaar'],
    termos_populares: ['pressão alta'],
    apresentacoes: [
      {
        id_apresentacao: 'los-50',
        descricao_dosagem: '50 mg comprimido',
        status_remume_cuiaba: 'PADRONIZADO_REMUME',
        local_dispensacao_sus: 'UBS',
        farmacia_popular_gratuito: true,
        requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
      },
    ],
  },
];

describe('Estágio 1 — Blindagem de Casos Extremos e Segurança de Armazenamento', () => {
  describe('1. Web Storage: Blindagem contra SecurityError e QuotaExceededError', () => {
    it('Retorna null com segurança se Storage lançar SecurityError no getItem', () => {
      const mockBrokenStorage = {
        getItem: vi.fn(() => {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        }),
        setItem: vi.fn(() => {
          throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        }),
        removeItem: vi.fn(() => {
          throw new DOMException('SecurityError', 'SecurityError');
        }),
      } as unknown as Storage;

      expect(safeStorageGetItem(mockBrokenStorage, 'test')).toBeNull();
      expect(safeStorageSetItem(mockBrokenStorage, 'test', 'value')).toBe(false);
      expect(safeStorageRemoveItem(mockBrokenStorage, 'test')).toBe(false);
    });

    it('Lida com storage nulo ou undefined sem lançar exceção', () => {
      expect(safeStorageGetItem(null, 'test')).toBeNull();
      expect(safeStorageSetItem(null, 'test', 'val')).toBe(false);
      expect(safeStorageRemoveItem(null, 'test')).toBe(false);
    });

    it('loadPrefs recupera com elegância quando localStorage lança erro ou contém lixo', () => {
      const brokenStorage = {
        getItem: () => {
          throw new Error('Access denied');
        },
      } as unknown as Storage;

      const prefs = loadPrefs(brokenStorage);
      expect(prefs).toEqual({
        fontScale: 'normal',
        highContrast: false,
        reduceMotion: false,
      });

      // JSON corrompido
      expect(parsePrefs('{ broken json !!!')).toEqual({
        fontScale: 'normal',
        highContrast: false,
        reduceMotion: false,
      });

      expect(parsePrefs(null)).toEqual({
        fontScale: 'normal',
        highContrast: false,
        reduceMotion: false,
      });
    });

    it('savePrefs não falha se localStorage atingir cota', () => {
      const quotaStorage = {
        setItem: () => {
          throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        },
      } as unknown as Storage;

      expect(() => {
        savePrefs({ fontScale: 'xlarge', highContrast: true, reduceMotion: true }, quotaStorage);
      }).not.toThrow();
    });

    it('loadPrescriptionSession e savePrescriptionSession sobrevivem a sessionStorage quebrado', () => {
      const brokenStorage = {
        getItem: () => '{ invalid json ::::',
        setItem: () => {
          throw new Error('Quota');
        },
        removeItem: () => {
          throw new Error('Security');
        },
      } as unknown as Storage;

      expect(loadPrescriptionSession(brokenStorage)).toEqual({ items: [], checkedDocs: [] });

      expect(() => {
        savePrescriptionSession(
          { items: [{ slug: 'med-a', id_apresentacao: 'ap-1' }], checkedDocs: [] },
          brokenStorage,
        );
      }).not.toThrow();

      expect(clearPrescriptionSession(brokenStorage)).toEqual({ items: [], checkedDocs: [] });
    });

    it('loadSearchSession e saveSearchSession sobrevivem a sessionStorage corrompido', () => {
      const brokenStorage = {
        getItem: () => '{"lastQuery": "losartana", "scrollY": "NaN"}',
      } as unknown as Storage;

      const session = loadSearchSession(brokenStorage);
      expect(session.lastQuery).toBe('losartana');
      expect(session.scrollY).toBe(0); // NaN sanitizado para 0
    });
  });

  describe('2. Motor de busca: Estresse com strings anômalas, caracteres de controle e emojis', () => {
    const engine = createMedicationSearchEngine(FIXTURE_CATALOGO);

    it('Ignora com segurança strings gigantes de 500+ caracteres sem travar', () => {
      const massiveQuery = 'a'.repeat(600);
      const results = engine.search(massiveQuery);
      expect(results).toEqual([]);
    });

    it('Lida com caracteres especiais, regex e pontuação pura ("???", "///", "\\", "100%")', () => {
      expect(engine.search('???')).toEqual([]);
      expect(engine.search('///')).toEqual([]);
      expect(engine.search('\\\\\\')).toEqual([]);
      expect(engine.search('100%')).toEqual([]);
      expect(engine.search('[.*+?^${}()|[!]')).toEqual([]);
    });

    it('Lida com emojis e múltiplos espaços sem quebrar ("💊 🏥 ❤️   ")', () => {
      expect(engine.search('💊 🏥 ❤️')).toEqual([]);
      const results = engine.search('   💊   losartana   ');
      expect(results).toHaveLength(1);
      expect(results[0]?.item.slug).toBe('losartana-potassica-fixture');
    });

    it('Suporta query vazia ou apenas espaços sem erros', () => {
      expect(engine.search('')).toEqual([]);
      expect(engine.search('    ')).toEqual([]);
      expect(engine.search('\t\n')).toEqual([]);
    });
  });
});
