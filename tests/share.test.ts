import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SEARCH_SESSION,
  SEARCH_SESSION_STORAGE_KEY,
  clearSearchSession,
  loadSearchSession,
  parseSearchSession,
  saveSearchSession,
} from '@/lib/searchSession';
import {
  buildMedicationDetailPath,
  gerarDadosCompartilhamentoMedicamento,
} from '@/lib/share';
import type { Medicamento } from '@/types/schema';

const FIXTURE_MED: Medicamento = {
  slug: 'medicamento-teste-a',
  principio_ativo: 'MEDICAMENTO_TESTE_A',
  nomes_comerciais: ['COMERCIAL_TESTE_A1'],
  termos_populares: ['pressão'],
  apresentacoes: [
    {
      id_apresentacao: 'ap-teste-a-1',
      descricao_dosagem: '50 mg comprimido',
      status_remume_cuiaba: 'PADRONIZADO_REMUME',
      local_dispensacao_sus: 'UBS',
      farmacia_popular_gratuito: true,
      requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
    },
  ],
  __fixture: true,
};

function createFakeSessionStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => {
      store.set(key, val);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    dump: () => Object.fromEntries(store.entries()),
  };
}

describe('Compartilhamento seguro e sessão efêmera de busca (share.ts e searchSession.ts)', () => {
  it('gera link de detalhe do medicamento com trailing slash e sem query string', () => {
    expect(buildMedicationDetailPath('medicamento-teste-a')).toBe('/medicamento/medicamento-teste-a/');

    const payload = gerarDadosCompartilhamentoMedicamento({
      medicamento: FIXTURE_MED,
      origin: 'https://ondepego.org',
    });

    expect(payload.url).toBe('https://ondepego.org/medicamento/medicamento-teste-a/');
    expect(payload.url.includes('?')).toBe(false);
    expect(payload.text).toContain('MEDICAMENTO_TESTE_A');
    expect(payload.text).toContain('50 mg comprimido');
    expect(payload.whatsappUrl.startsWith('https://wa.me/?text=')).toBe(true);
  });

  it('salva e restaura apenas lastQuery e scrollY no sessionStorage da aba', () => {
    const fakeSession = createFakeSessionStorage();

    expect(loadSearchSession(fakeSession)).toEqual(DEFAULT_SEARCH_SESSION);

    saveSearchSession({ lastQuery: 'metformina 850', scrollY: 342.8 }, fakeSession);
    expect(fakeSession.dump()[SEARCH_SESSION_STORAGE_KEY]).toBeDefined();

    const restored = loadSearchSession(fakeSession);
    expect(restored).toEqual({
      lastQuery: 'metformina 850',
      scrollY: 343,
    });

    clearSearchSession(fakeSession);
    expect(loadSearchSession(fakeSession)).toEqual(DEFAULT_SEARCH_SESSION);
  });

  it('faz fallback seguro para DEFAULT_SEARCH_SESSION se o JSON da sessão for inválido', () => {
    expect(parseSearchSession(null)).toEqual(DEFAULT_SEARCH_SESSION);
    expect(parseSearchSession('{invalido')).toEqual(DEFAULT_SEARCH_SESSION);
    expect(parseSearchSession(JSON.stringify({ lastQuery: 123, scrollY: -50 }))).toEqual(
      DEFAULT_SEARCH_SESSION,
    );
  });
});
