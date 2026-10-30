import React from 'react';

export interface BrandMarkProps {
  className?: string;
  showSubtitle?: boolean;
}

export function BrandMark({ className = '', showSubtitle = true }: BrandMarkProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Poste com duas placas (marca visual do Onde Pego) */}
      <span
        aria-hidden="true"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[var(--c-brand)] text-white shadow-sm"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          {/* Poste vertical */}
          <line x1="16" y1="4" x2="16" y2="28" strokeWidth={2.6} />
          {/* Placa superior apontando para a direita (Via 1 - SUS) */}
          <path d="M16 8h10l3 3.5-3 3.5H16V8z" fill="currentColor" fillOpacity={0.15} />
          {/* Placa inferior apontando para a esquerda (Via 2 - Farmácia Popular) */}
          <path d="M16 17H6l-3 3.5 3 3.5h10v-7z" fill="currentColor" fillOpacity={0.15} />
          {/* Base do poste */}
          <line x1="12" y1="28" x2="20" y2="28" strokeWidth={2.6} />
        </svg>
      </span>

      <span className="flex flex-col">
        <span className="font-display text-2xl font-black leading-none tracking-tight text-[var(--c-text)]">
          Onde Pego
        </span>
        {showSubtitle && (
          <span className="font-sans text-[13px] font-bold tracking-tight text-[var(--c-brand)]">
            Cuiabá • MT
          </span>
        )}
      </span>
    </div>
  );
}
