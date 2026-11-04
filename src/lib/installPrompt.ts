import {
  getSafeLocalStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '@/lib/safeStorage';

/**
 * Gerenciamento do estado do convite de instalação da PWA (Add to Home Screen).
 *
 * EXCEÇÃO ARQUITETURAL APROVADA (Bloco B2):
 * Autorizado o uso de `localStorage` estritamente para metadados técnicos não pessoais
 * (`visitCount`, `hasInteracted`, `dismissedAt`) com a finalidade exclusiva de reduzir
 * atrito visual na primeira visita e respeitar a dispensa definitiva do banner pelo usuário.
 * Nenhum dado de saúde, busca ou localização é armazenado aqui.
 */
export const INSTALL_PROMPT_STORAGE_KEY = 'onde_pego_install_prompt_v1';

export interface InstallPromptState {
  visitCount: number;
  hasInteracted: boolean;
  dismissedAt: number | null;
}

export const DEFAULT_INSTALL_PROMPT_STATE: InstallPromptState = {
  visitCount: 0,
  hasInteracted: false,
  dismissedAt: null,
};

export function parseInstallPromptState(raw: string | null | undefined): InstallPromptState {
  if (!raw) {
    return { ...DEFAULT_INSTALL_PROMPT_STATE };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_INSTALL_PROMPT_STATE };
    }

    const visitCount =
      typeof parsed.visitCount === 'number' &&
      Number.isFinite(parsed.visitCount) &&
      parsed.visitCount >= 0
        ? Math.floor(parsed.visitCount)
        : 0;

    const hasInteracted = Boolean(parsed.hasInteracted);

    const dismissedAt =
      typeof parsed.dismissedAt === 'number' &&
      Number.isFinite(parsed.dismissedAt) &&
      parsed.dismissedAt > 0
        ? Math.floor(parsed.dismissedAt)
        : null;

    return {
      visitCount,
      hasInteracted,
      dismissedAt,
    };
  } catch {
    return { ...DEFAULT_INSTALL_PROMPT_STATE };
  }
}

export function loadInstallPromptState(
  storage?: Pick<Storage, 'getItem'> | null,
): InstallPromptState {
  const target = storage !== undefined ? storage : getSafeLocalStorage();
  if (!target) {
    return { ...DEFAULT_INSTALL_PROMPT_STATE };
  }
  const raw = safeStorageGetItem(target as Storage, INSTALL_PROMPT_STORAGE_KEY);
  return parseInstallPromptState(raw);
}

export function saveInstallPromptState(
  state: InstallPromptState,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const target = storage !== undefined ? storage : getSafeLocalStorage();
  if (!target) {
    return;
  }
  const sanitized: InstallPromptState = {
    visitCount: Math.max(0, Math.floor(state.visitCount)),
    hasInteracted: Boolean(state.hasInteracted),
    dismissedAt:
      typeof state.dismissedAt === 'number' && state.dismissedAt > 0
        ? Math.floor(state.dismissedAt)
        : null,
  };
  safeStorageSetItem(target as Storage, INSTALL_PROMPT_STORAGE_KEY, JSON.stringify(sanitized));
}

export function recordInstallPromptVisit(
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null,
): InstallPromptState {
  const current = loadInstallPromptState(storage);
  const next: InstallPromptState = {
    ...current,
    visitCount: current.visitCount + 1,
  };
  saveInstallPromptState(next, storage);
  return next;
}

export function recordInstallPromptInteraction(
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null,
): InstallPromptState {
  const current = loadInstallPromptState(storage);
  if (current.hasInteracted) {
    return current;
  }
  const next: InstallPromptState = {
    ...current,
    hasInteracted: true,
  };
  saveInstallPromptState(next, storage);
  return next;
}

export function dismissInstallPrompt(
  nowMs: number = Date.now(),
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null,
): InstallPromptState {
  const current = loadInstallPromptState(storage);
  const next: InstallPromptState = {
    ...current,
    dismissedAt: Math.max(1, Math.floor(nowMs)),
  };
  saveInstallPromptState(next, storage);
  return next;
}

export function resetInstallPromptState(
  storage?: Pick<Storage, 'removeItem'> | null,
): void {
  const target = storage !== undefined ? storage : getSafeLocalStorage();
  if (!target) {
    return;
  }
  safeStorageRemoveItem(target as Storage, INSTALL_PROMPT_STORAGE_KEY);
}

/**
 * Regra de exibição do banner PWA:
 * Só exibe quando:
 * 1. O navegador disparou `beforeinstallprompt` (`hasDeferredPrompt === true`);
 * 2. O usuário nunca dispensou o convite (`dismissedAt === null`);
 * 3. É pelo menos a 2ª visita (`visitCount >= 2`) OU o usuário já interagiu (`hasInteracted === true`).
 */
export function shouldShowInstallBanner(
  state: InstallPromptState,
  hasDeferredPrompt: boolean,
): boolean {
  if (!hasDeferredPrompt) {
    return false;
  }
  if (state.dismissedAt !== null) {
    return false;
  }
  return state.visitCount >= 2 || state.hasInteracted;
}
