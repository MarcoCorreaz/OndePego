'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangleIcon, DownloadIcon } from '@/components/ui/Icons';
import {
  DEFAULT_INSTALL_PROMPT_STATE,
  type InstallPromptState,
  dismissInstallPrompt,
  recordInstallPromptInteraction,
  recordInstallPromptVisit,
  shouldShowInstallBanner,
} from '@/lib/installPrompt';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaStatusBanner() {
  const pathname = usePathname();
  const initialPathnameRef = useRef<string | null>(null);

  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [promptState, setPromptState] = useState<InstallPromptState>(
    DEFAULT_INSTALL_PROMPT_STATE,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!window.navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Contabiliza a visita atual no localStorage (exceção aprovada Bloco B2)
    const updatedAfterVisit = recordInstallPromptVisit();
    setPromptState(updatedAfterVisit);

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

  // Registra interação quando o usuário navega para uma segunda rota dentro do app
  useEffect(() => {
    if (!pathname) return;
    if (initialPathnameRef.current === null) {
      initialPathnameRef.current = pathname;
      return;
    }
    if (pathname !== initialPathnameRef.current && !promptState.hasInteracted) {
      const next = recordInstallPromptInteraction();
      setPromptState(next);
    }
  }, [pathname, promptState.hasInteracted]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'dismissed') {
        const next = dismissInstallPrompt();
        setPromptState(next);
      }
    } catch {
      // Ignora cancelamento
    } finally {
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    const next = dismissInstallPrompt();
    setPromptState(next);
    setDeferredPrompt(null);
  };

  const showInstallBanner = shouldShowInstallBanner(
    promptState,
    Boolean(deferredPrompt),
  );

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
          className="mb-2 flex items-center justify-between gap-2 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 shadow-2xs"
        >
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--c-text)] sm:text-base">
            Instale o Onde Pego para consultar mesmo sem internet
          </p>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleInstallClick}
              className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-[var(--r-button)] bg-[var(--c-brand)] px-3.5 py-2 text-sm font-bold text-white shadow-2xs hover:opacity-95"
            >
              <DownloadIcon className="h-4 w-4 shrink-0" />
              <span>Instalar</span>
            </button>

            <button
              type="button"
              onClick={handleDismissInstall}
              aria-label="Fechar convite de instalação"
              className="ui-pressable inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] text-xl font-bold leading-none text-[var(--c-text-2)] hover:bg-[var(--c-bg-soft)] hover:text-[var(--c-text)]"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
