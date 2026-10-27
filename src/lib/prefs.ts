export type FontScale = 'normal' | 'large' | 'xlarge';

export interface AccessibilityPrefs {
  fontScale: FontScale;
  highContrast: boolean;
  reduceMotion: boolean;
}

export const A11Y_PREFS_STORAGE_KEY = 'onde_pego_a11y_prefs_v1';

export const DEFAULT_PREFS: AccessibilityPrefs = {
  fontScale: 'normal',
  highContrast: false,
  reduceMotion: false,
};

const VALID_FONT_SCALES = new Set<FontScale>(['normal', 'large', 'xlarge']);

export function isValidFontScale(value: unknown): value is FontScale {
  return typeof value === 'string' && VALID_FONT_SCALES.has(value as FontScale);
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
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function loadPrefs(
  storage?: Pick<Storage, 'getItem'> | null,
): AccessibilityPrefs {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;

  if (!targetStorage) {
    return { ...DEFAULT_PREFS };
  }

  try {
    const raw = targetStorage.getItem(A11Y_PREFS_STORAGE_KEY);
    return parsePrefs(raw);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(
  prefs: AccessibilityPrefs,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const targetStorage =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;

  if (!targetStorage) {
    return;
  }

  try {
    targetStorage.setItem(A11Y_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignora falha de quota ou modo privado restrito
  }
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
 * Aplica os atributos de acessibilidade no elemento raiz (`<html>`).
 */
export function applyPrefsToRootElement(
  rootEl: Pick<HTMLElement, 'setAttribute'>,
  prefs: AccessibilityPrefs,
  systemPrefersReducedMotion = false,
): void {
  const effectiveReduceMotion = shouldReduceMotion(prefs, systemPrefersReducedMotion);
  rootEl.setAttribute('data-font-scale', prefs.fontScale);
  rootEl.setAttribute('data-contrast', prefs.highContrast ? 'high' : 'normal');
  rootEl.setAttribute('data-reduce-motion', effectiveReduceMotion ? 'true' : 'false');
}
