/**
 * Utilitários defensivos para acesso a Web Storage (localStorage e sessionStorage).
 *
 * Protege a aplicação contra:
 * 1. `SecurityError` lançado ao acessar `window.localStorage` ou `window.sessionStorage`
 *    em iframes com sandbox restrito ou modos anônimos de navegadores (ex.: Safari / Firefox).
 * 2. `QuotaExceededError` ao tentar gravar dados quando o armazenamento está cheio.
 * 3. Falhas durante renderização no servidor (SSR).
 */

export function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Modo anônimo restrito ou SecurityError por sandbox
  }
  return null;
}

export function getSafeSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // Modo anônimo restrito ou SecurityError por sandbox
  }
  return null;
}

export function safeStorageGetItem(
  storage: Storage | null | undefined,
  key: string,
): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSetItem(
  storage: Storage | null | undefined,
  key: string,
  value: string,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeStorageRemoveItem(
  storage: Storage | null | undefined,
  key: string,
): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
