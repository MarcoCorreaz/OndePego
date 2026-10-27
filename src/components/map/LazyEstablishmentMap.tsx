'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { EstablishmentMapProps } from '@/components/map/EstablishmentMap';

const DynamicEstablishmentMap = dynamic(
  () => import('@/components/map/EstablishmentMap'),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[220px] items-center justify-center rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-6 text-center font-display text-xl font-bold text-[var(--c-text)]"
      >
        Carregando mapa de Cuiabá e Várzea Grande...
      </div>
    ),
  },
);

export interface LazyEstablishmentMapProps extends EstablishmentMapProps {
  /** Se true, inicia o mapa aberto; se false (padrão), carrega apenas quando a pessoa toca em "Abrir mapa" */
  defaultOpen?: boolean;
  toggleButtonLabelOpen?: string;
  toggleButtonLabelClose?: string;
}

export function LazyEstablishmentMap({
  defaultOpen = false,
  toggleButtonLabelOpen = 'Abrir mapa das unidades',
  toggleButtonLabelClose = 'Ocultar mapa (manter apenas a lista)',
  ...mapProps
}: LazyEstablishmentMapProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] px-4 py-2 font-display text-lg font-bold text-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] active:translate-y-px"
        >
          <span aria-hidden="true">{isOpen ? '▲' : '🗺'}</span>
          <span>{isOpen ? toggleButtonLabelClose : toggleButtonLabelOpen}</span>
        </button>

        <span className="text-sm text-[var(--c-text-2)]">
          A lista abaixo traz todas as mesmas informações do mapa.
        </span>
      </div>

      {isOpen && <DynamicEstablishmentMap {...mapProps} />}
    </div>
  );
}
