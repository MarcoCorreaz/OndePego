import { describe, expect, it } from 'vitest';
import {
  A11Y_PREFS_STORAGE_KEY,
  DEFAULT_PREFS,
  applyPrefsToRootElement,
  loadPrefs,
  parsePrefs,
  savePrefs,
  shouldApplyDarkTheme,
  shouldReduceMotion,
} from '@/lib/prefs';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    dump: () => Object.fromEntries(map.entries()),
  };
}

describe('Preferências de acessibilidade (src/lib/prefs.ts)', () => {
  it('retorna DEFAULT_PREFS quando o armazenamento está vazio ou inválido', () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs('')).toEqual(DEFAULT_PREFS);
    expect(parsePrefs('{json-invalido')).toEqual(DEFAULT_PREFS);
    expect(parsePrefs(JSON.stringify({ fontScale: 'gigante', highContrast: 'sim' }))).toEqual(
      DEFAULT_PREFS,
    );
  });

  it('salva e carrega apenas preferências válidas na chave local onde_pego_a11y_prefs_v1', () => {
    const storage = createMemoryStorage();
    const custom = {
      fontScale: 'xlarge' as const,
      highContrast: true,
      reduceMotion: true,
      theme: 'dark' as const,
    };

    savePrefs(custom, storage);
    expect(storage.dump()[A11Y_PREFS_STORAGE_KEY]).toBeDefined();

    const loaded = loadPrefs(storage);
    expect(loaded).toEqual(custom);
  });

  it('determina tema escuro respeitando preferência explícita ou do sistema', () => {
    expect(
      shouldApplyDarkTheme({ fontScale: 'normal', highContrast: false, reduceMotion: false, theme: 'dark' }, false),
    ).toBe(true);

    expect(
      shouldApplyDarkTheme({ fontScale: 'normal', highContrast: false, reduceMotion: false, theme: 'light' }, true),
    ).toBe(false);

    expect(
      shouldApplyDarkTheme({ fontScale: 'normal', highContrast: false, reduceMotion: false, theme: 'system' }, true),
    ).toBe(true);

    expect(
      shouldApplyDarkTheme({ fontScale: 'normal', highContrast: false, reduceMotion: false, theme: 'system' }, false),
    ).toBe(false);
  });

  it('respeita tanto prefers-reduced-motion do sistema quanto o controle próprio do app', () => {
    expect(
      shouldReduceMotion({ fontScale: 'normal', highContrast: false, reduceMotion: false, theme: 'system' }, false),
    ).toBe(false);

    expect(
      shouldReduceMotion({ fontScale: 'normal', highContrast: false, reduceMotion: true, theme: 'system' }, false),
    ).toBe(true);

    expect(
      shouldReduceMotion({ fontScale: 'normal', highContrast: false, reduceMotion: false, theme: 'system' }, true),
    ).toBe(true);
  });

  it('aplica data-font-scale, data-contrast, data-reduce-motion e data-theme no elemento raiz', () => {
    const attrs = new Map<string, string>();
    const fakeRoot = {
      setAttribute: (name: string, value: string) => {
        attrs.set(name, value);
      },
    };

    applyPrefsToRootElement(
      fakeRoot,
      { fontScale: 'large', highContrast: true, reduceMotion: false, theme: 'dark' },
      true,
      false,
    );

    expect(attrs.get('data-font-scale')).toBe('large');
    expect(attrs.get('data-contrast')).toBe('high');
    expect(attrs.get('data-reduce-motion')).toBe('true');
    expect(attrs.get('data-theme')).toBe('dark');
  });
});
