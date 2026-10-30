import React from 'react';

export interface SignpostIllustrationProps {
  className?: string;
}

export function SignpostIllustration({ className = 'h-24 w-24' }: SignpostIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none opacity-20 sm:opacity-25 ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full"
      >
        {/* Poste vertical */}
        <line x1="50" y1="10" x2="50" y2="90" strokeWidth="6" />

        {/* Placa superior apontando para a direita (SUS) */}
        <path
          d="M50 20 H82 L94 30 L82 40 H50 Z"
          fill="currentColor"
          fillOpacity="0.2"
          strokeWidth="4"
        />
        <circle cx="62" cy="30" r="3" fill="currentColor" />
        <line x1="68" y1="30" x2="80" y2="30" strokeWidth="3" />

        {/* Placa inferior apontando para a esquerda (Farmácia Popular) */}
        <path
          d="M50 48 H18 L6 58 L18 68 H50 Z"
          fill="currentColor"
          fillOpacity="0.2"
          strokeWidth="4"
        />
        <circle cx="38" cy="58" r="3" fill="currentColor" />
        <line x1="20" y1="58" x2="32" y2="58" strokeWidth="3" />

        {/* Base e topo do poste */}
        <path d="M42 90 H58" strokeWidth="6" />
        <path d="M46 10 H54" strokeWidth="5" />
      </svg>
    </div>
  );
}
