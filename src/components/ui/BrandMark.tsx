import React from 'react';

export interface BrandMarkProps {
  className?: string;
  showSubtitle?: boolean;
}

export function BrandMark({ className = '', showSubtitle = true }: BrandMarkProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Símbolo Oficial do Onde Pego (Vetor Plano) */}
      <span
        aria-hidden="true"
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] shadow-xs transition-transform active:scale-95"
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="22" fill="#0B3D91" />
          <path
            d="M 50 84 C 46 76 25 58 25 42 A 25 25 0 1 1 75 42 C 75 58 54 76 50 84 Z"
            fill="#FFFFFF"
          />
          <circle cx="50" cy="42" r="18.5" fill="none" stroke="#FFC72C" strokeWidth="2.5" />
          <path
            d="M 46 32 h 8 v 7 h 7 v 8 h -7 v 7 h -8 v -7 h -7 v -8 h 7 Z"
            fill="#0E7C3A"
            stroke="#0E7C3A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
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
