import React from 'react';
import Link from 'next/link';
import { Icon, IconName } from '@/components/ui/Icon';

export type StatusBannerVariant = 'info' | 'warning' | 'success';

export interface StatusBannerAction {
  label: string;
  onClick?: () => void;
  href?: string;
  'aria-label'?: string;
}

export interface StatusBannerProps {
  variant?: StatusBannerVariant;
  title?: string;
  children: React.ReactNode;
  action?: StatusBannerAction;
  onDismiss?: () => void;
  icon?: IconName;
  className?: string;
}

const VARIANT_CONFIG: Record<
  StatusBannerVariant,
  {
    container: string;
    iconName: IconName;
    iconColor: string;
    role: 'status' | 'alert';
    ariaLive: 'polite' | 'assertive';
  }
> = {
  info: {
    container: 'bg-[var(--c-brand-tint)] text-[var(--c-text)] border-[var(--c-brand)]/25',
    iconName: 'info',
    iconColor: 'text-[var(--c-brand)]',
    role: 'status',
    ariaLive: 'polite',
  },
  warning: {
    container: 'bg-[var(--c-attn-tint)] text-[var(--c-text)] border-[var(--c-attn-border)]',
    iconName: 'info',
    iconColor: 'text-[var(--c-attn-ink)]',
    role: 'alert',
    ariaLive: 'assertive',
  },
  success: {
    container: 'bg-[var(--c-free-tint)] text-[var(--c-text)] border-[var(--c-free)]/25',
    iconName: 'check',
    iconColor: 'text-[var(--c-free-ink)]',
    role: 'status',
    ariaLive: 'polite',
  },
};

/**
 * Banner de status unificado para avisos de sistema, GPS e fallbacks.
 * Segue o padrão shadcn/ui Alert com tokens nativos do Onde Pego,
 * alvos de toque mínimos de 48px e acessibilidade WCAG 2.2 AA.
 */
export function StatusBanner({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  icon,
  className = '',
}: StatusBannerProps) {
  const config = VARIANT_CONFIG[variant];
  const chosenIcon = icon || config.iconName;

  return (
    <div
      role={config.role}
      aria-live={config.ariaLive}
      className={`relative flex w-full flex-col gap-3 rounded-[var(--r-card)] border p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between ${config.container} ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`mt-0.5 flex shrink-0 items-center justify-center ${config.iconColor}`}>
          <Icon name={chosenIcon} className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="flex flex-1 flex-col gap-0.5 text-left">
          {title && (
            <h3 className="font-display text-base font-bold text-[var(--c-text)] sm:text-lg">
              {title}
            </h3>
          )}
          <div className="font-sans text-base leading-relaxed text-[var(--c-text)]">
            {children}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
        {action &&
          (action.href ? (
            <Link
              href={action.href}
              aria-label={action['aria-label']}
              className="ui-pressable inline-flex min-h-12 items-center justify-center rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-sm font-bold text-white shadow-2xs hover:opacity-95 active:scale-[0.98] sm:text-base"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              aria-label={action['aria-label']}
              className="ui-pressable inline-flex min-h-12 items-center justify-center rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-sm font-bold text-white shadow-2xs hover:opacity-95 active:scale-[0.98] sm:text-base"
            >
              {action.label}
            </button>
          ))}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar aviso"
            className="ui-pressable inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--c-text-2)] hover:bg-black/5 hover:text-[var(--c-text)] active:scale-95"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
