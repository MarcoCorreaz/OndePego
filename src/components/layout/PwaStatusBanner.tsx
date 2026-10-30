'use client';

import { useEffect, useState } from 'react';
import { AlertTriangleIcon, DownloadIcon } from '@/components/ui/Icons';
import {
  getSafeSessionStorage,
  safeStorageGetItem,
  safeStorageSetItem,
} from '@/lib/safeStorage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_INSTALL_SESSION_KEY = 'onde_pego_install_dismissed_v1';

export function PwaStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!window.navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const session = getSafeSessionStorage();
    if (safeStorageGetItem(session, DISMISS_INSTALL_SESSION_KEY) === '1') {
      setInstallDismissed(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in window.navigator) {
      if (process.env.NODE_ENV !== 'production') {
        window.navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => {
            for (const reg of registrations) {
              void reg.unregister();
            }
          })
          .catch(() => {
            // Ignora falhas de limpeza em dev
          });
      } else {
        const registerSw = () => {
          window.navigator.serviceWorker.register('/sw.js').catch(() => {
            // Falha silenciosa em ambientes sem HTTPS/SW
          });
        };

        if (document.readyState === 'complete') {
          registerSw();
        } else {
          window.addEventListener('load', registerSw, { once: true });
        }
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // Ignora cancelamento
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    setInstallDismissed(true);
    setDeferredPrompt(null);
    const session = getSafeSessionStorage();
    safeStorageSetItem(session, DISMISS_INSTALL_SESSION_KEY, '1');
  };

  const showInstallBanner = Boolean(deferredPrompt) && !installDismissed;

  if (!isOffline && !showInstallBanner) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-3">
      {isOffline ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="offline-status-banner"
          className="mb-2 flex items-start gap-3 rounded-[var(--r-plate)] border border-[var(--c-attn-border)] bg-[var(--c-attn)] px-4 py-3 text-base font-bold text-[var(--c-text)] shadow-xs"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-[var(--r-chip)] bg-[var(--c-surface)] px-2.5 py-0.5 text-sm font-extrabold text-[var(--c-text)]"
          >
            <AlertTriangleIcon className="h-4 w-4" />
            <span>OFFLINE</span>
          </span>
          <p>
            Você está sem internet no momento. A busca de remédios e os dados já salvos no
            aparelho continuam funcionando.
          </p>
        </div>
      ) : null}

      {showInstallBanner ? (
        <aside
          aria-label="Convite para instalar o aplicativo no celular"
          data-testid="pwa-install-banner"
          className="ui-card mb-2 flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-display text-lg font-bold text-[var(--c-text)]">
              Instalar o Onde Pego no celular
            </p>
            <p className="text-base text-[var(--c-text-2)]">
              Acesse a consulta de remédios e unidades mesmo quando estiver sem internet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 text-base font-bold text-white shadow-xs active:translate-y-px"
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Instalar aplicativo</span>
            </button>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2 text-base font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]"
            >
              Agora não
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
