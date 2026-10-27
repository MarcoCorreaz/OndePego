'use client';

import { useEffect, useState } from 'react';

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

    // Estado inicial de conexão
    setIsOffline(!window.navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verifica se o convite de instalação já foi dispensado nesta sessão
    try {
      if (window.sessionStorage.getItem(DISMISS_INSTALL_SESSION_KEY) === '1') {
        setInstallDismissed(true);
      }
    } catch {
      // Ignora restrições de sessionStorage
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Registro seguro do Service Worker Offline-First
    if ('serviceWorker' in window.navigator) {
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
    try {
      window.sessionStorage.setItem(DISMISS_INSTALL_SESSION_KEY, '1');
    } catch {
      // Ignora restrições de sessionStorage
    }
  };

  const showInstallBanner = Boolean(deferredPrompt) && !installDismissed;

  if (!isOffline && !showInstallBanner) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-2">
      {isOffline ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="offline-status-banner"
          className="mb-2 flex items-start gap-3 rounded-[var(--r-card)] border-2 border-[var(--c-attn-border)] bg-[var(--c-attn)] px-4 py-3 text-base font-medium text-[var(--c-text)]"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex shrink-0 rounded border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-0.5 text-sm font-bold"
          >
            OFFLINE
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
          className="mb-2 flex flex-col justify-between gap-3 rounded-[var(--r-card)] border-2 border-[var(--c-border)] bg-[var(--c-surface)] p-4 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--c-text)]">
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
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-primary)] bg-[var(--c-primary)] px-4 py-2 text-base font-bold text-[var(--c-primary-fg)]"
            >
              Instalar aplicativo
            </button>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2 text-base font-semibold text-[var(--c-text)]"
            >
              Agora não
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
