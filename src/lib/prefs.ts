import {
  getSafeLocalStorage,
  safeStorageGetItem,
  safeStorageSetItem,
} from '@/lib/safeStorage';

export type FontScale = 'normal' | 'large' | 'xlarge';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AccessibilityPrefs {
  fontScale: FontScale;
  highContrast: boolean;
  reduceMotion: boolean;
  theme: ThemeMode;
}

export const A11Y_PREFS_STORAGE_KEY = 'onde_pego_a11y_prefs_v1';

export const DEFAULT_PREFS: AccessibilityPrefs = {
  fontScale: 'normal',
  highContrast: false,
  reduceMotion: false,
  theme: 'system',
};

const VALID_FONT_SCALES = new Set<FontScale>(['normal', 'large', 'xlarge']);
const VALID_THEMES = new Set<ThemeMode>(['light', 'dark', 'system']);

export function isValidFontScale(value: unknown): value is FontScale {
  return typeof value === 'string' && VALID_FONT_SCALES.has(value as FontScale);
}

export function isValidThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && VALID_THEMES.has(value as ThemeMode);
}

/**
 * Converte uma string JSON em `AccessibilityPrefs` de forma segura.
 * Nunca lança erro; retorna `DEFAULT_PREFS` para campos ausentes ou inválidos.
 */
export function parsePrefs(raw: string | null | undefined): AccessibilityPrefs {
  if (!raw) {
    return { ...DEFAULT_PREFS };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_PREFS };
    }

    return {
      fontScale: isValidFontScale(parsed.fontScale) ? parsed.fontScale : DEFAULT_PREFS.fontScale,
      highContrast:
        typeof parsed.highContrast === 'boolean'
          ? parsed.highContrast
          : DEFAULT_PREFS.highContrast,
      reduceMotion:
        typeof parsed.reduceMotion === 'boolean'
          ? parsed.reduceMotion
          : DEFAULT_PREFS.reduceMotion,
      theme: isValidThemeMode(parsed.theme) ? parsed.theme : DEFAULT_PREFS.theme,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function loadPrefs(
  storage?: Pick<Storage, 'getItem'> | null,
): AccessibilityPrefs {
  const targetStorage =
    storage !== undefined ? storage : getSafeLocalStorage();

  if (!targetStorage) {
    return { ...DEFAULT_PREFS };
  }

  const raw = safeStorageGetItem(targetStorage as Storage, A11Y_PREFS_STORAGE_KEY);
  return parsePrefs(raw);
}

export function savePrefs(
  prefs: AccessibilityPrefs,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const targetStorage =
    storage !== undefined ? storage : getSafeLocalStorage();

  if (!targetStorage) {
    return;
  }

  safeStorageSetItem(targetStorage as Storage, A11Y_PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * Retorna `true` se o usuário ativou "reduzir animações" no app OU se o sistema
 * operacional sinaliza `prefers-reduced-motion: reduce`.
 */
export function shouldReduceMotion(
  prefs: AccessibilityPrefs,
  systemPrefersReducedMotion = false,
): boolean {
  return Boolean(prefs.reduceMotion || systemPrefersReducedMotion);
}

/**
 * Determina se o modo escuro deve ser aplicado no documento com base na preferência
 * explícita do usuário ('dark'/'light') ou na preferência do sistema operacional ('system').
 */
export function shouldApplyDarkTheme(
  prefs: AccessibilityPrefs,
  systemPrefersDark = false,
): boolean {
  if (prefs.theme === 'dark') return true;
  if (prefs.theme === 'light') return false;
  return systemPrefersDark;
}

/**
 * Aplica os atributos de acessibilidade e tema no elemento raiz (`<html>`).
 */
export function applyPrefsToRootElement(
  rootEl: Pick<HTMLElement, 'setAttribute'>,
  prefs: AccessibilityPrefs,
  systemPrefersReducedMotion = false,
  systemPrefersDark = false,
): void {
  const effectiveReduceMotion = shouldReduceMotion(prefs, systemPrefersReducedMotion);
  const isDark = shouldApplyDarkTheme(prefs, systemPrefersDark);

  rootEl.setAttribute('data-font-scale', prefs.fontScale);
  rootEl.setAttribute('data-contrast', prefs.highContrast ? 'high' : 'normal');
  rootEl.setAttribute('data-reduce-motion', effectiveReduceMotion ? 'true' : 'false');
  rootEl.setAttribute('data-theme', isDark ? 'dark' : 'light');
}
