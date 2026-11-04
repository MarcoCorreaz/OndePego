import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INSTALL_PROMPT_STATE,
  INSTALL_PROMPT_STORAGE_KEY,
  dismissInstallPrompt,
  loadInstallPromptState,
  parseInstallPromptState,
  recordInstallPromptInteraction,
  recordInstallPromptVisit,
  resetInstallPromptState,
  shouldShowInstallBanner,
} from '@/lib/installPrompt';

function createFakeStorage() {
  const store = new Map<string, string>();
  return {
    store,
    storage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  };
}

describe('installPrompt — persistência em localStorage e regra de exibição do banner PWA (Bloco B2)', () => {
  it('1. Não exibe o banner na primeira visita sem interação do usuário', () => {
    const { storage } = createFakeStorage();

    expect(loadInstallPromptState(storage)).toEqual(DEFAULT_INSTALL_PROMPT_STATE);

    const firstVisit = recordInstallPromptVisit(storage);
    expect(firstVisit).toEqual({
      visitCount: 1,
      hasInteracted: false,
      dismissedAt: null,
    });

    // Mesmo com evento beforeinstallprompt disponível, não mostra na 1ª visita sem interação
    expect(shouldShowInstallBanner(firstVisit, true)).toBe(false);
    expect(shouldShowInstallBanner(firstVisit, false)).toBe(false);
  });

  it('2. Exibe o banner na segunda visita quando beforeinstallprompt está disponível e não foi dispensado', () => {
    const { storage } = createFakeStorage();

    recordInstallPromptVisit(storage);
    const secondVisit = recordInstallPromptVisit(storage);

    expect(secondVisit.visitCount).toBe(2);
    expect(shouldShowInstallBanner(secondVisit, true)).toBe(true);
    expect(shouldShowInstallBanner(secondVisit, false)).toBe(false);
  });

  it('3. Exibe o banner ainda na primeira visita após o usuário realizar uma interação', () => {
    const { storage } = createFakeStorage();

    recordInstallPromptVisit(storage);
    const afterInteraction = recordInstallPromptInteraction(storage);

    expect(afterInteraction).toEqual({
      visitCount: 1,
      hasInteracted: true,
      dismissedAt: null,
    });
    expect(shouldShowInstallBanner(afterInteraction, true)).toBe(true);
  });

  it('4. Persiste dismissedAt no localStorage e nunca mais exibe o banner após dispensa', () => {
    const { storage, store } = createFakeStorage();

    recordInstallPromptVisit(storage);
    recordInstallPromptVisit(storage);

    const dismissed = dismissInstallPrompt(1730000000000, storage);
    expect(dismissed.dismissedAt).toBe(1730000000000);
    expect(shouldShowInstallBanner(dismissed, true)).toBe(false);

    // Mesmo em novas visitas futuras, continua dispensado
    const thirdVisit = recordInstallPromptVisit(storage);
    expect(thirdVisit.dismissedAt).toBe(1730000000000);
    expect(shouldShowInstallBanner(thirdVisit, true)).toBe(false);

    expect(store.has(INSTALL_PROMPT_STORAGE_KEY)).toBe(true);
    resetInstallPromptState(storage);
    expect(loadInstallPromptState(storage)).toEqual(DEFAULT_INSTALL_PROMPT_STATE);
  });

  it('5. Trata JSON corrompido ou ausente com fallback seguro', () => {
    expect(parseInstallPromptState(null)).toEqual(DEFAULT_INSTALL_PROMPT_STATE);
    expect(parseInstallPromptState('{invalido')).toEqual(DEFAULT_INSTALL_PROMPT_STATE);
    expect(parseInstallPromptState(JSON.stringify({ visitCount: -5, dismissedAt: -1 }))).toEqual(
      DEFAULT_INSTALL_PROMPT_STATE,
    );
  });
});
