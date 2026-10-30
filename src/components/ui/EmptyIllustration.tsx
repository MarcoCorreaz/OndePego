import React from 'react';

export type EmptyIllustrationType = 'empty-search' | 'offline' | 'no-location';

export interface EmptyIllustrationProps {
  type: EmptyIllustrationType;
  className?: string;
}

export function EmptyIllustration({
  type,
  className = 'h-24 w-24 text-[var(--c-text-2)]',
}: EmptyIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={`mx-auto flex items-center justify-center select-none ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full opacity-85"
      >
        {type === 'empty-search' && (
          <>
            {/* Lupa com linhas vazias */}
            <circle cx="44" cy="44" r="24" strokeWidth={2.6} />
            <line x1="62" y1="62" x2="84" y2="84" strokeWidth={4} />
            <circle cx="44" cy="44" r="14" strokeDasharray="3 3" opacity={0.6} />
            <line x1="36" y1="44" x2="52" y2="44" strokeWidth={2.4} />
          </>
        )}

        {type === 'offline' && (
          <>
            {/* Nuvem/sinal com linha cortada */}
            <path
              d="M32 68 H74 A16 16 0 0 0 74 36 A22 22 0 0 0 35 34 A14 14 0 0 0 20 54 A14 14 0 0 0 32 68 Z"
              strokeWidth={2.4}
            />
            <line x1="20" y1="20" x2="80" y2="80" strokeWidth={3} stroke="var(--c-alert)" />
          </>
        )}

        {type === 'no-location' && (
          <>
            {/* Pino de localização com corte */}
            <path
              d="M50 82 S24 58 24 38 A26 26 0 0 1 76 38 C76 58 50 82 50 82 Z"
              strokeWidth={2.4}
            />
            <circle cx="50" cy="38" r="8" strokeWidth={2.2} />
            <line x1="22" y1="22" x2="78" y2="78" strokeWidth={3} stroke="var(--c-attn-ink)" />
          </>
        )}
      </svg>
    </div>
  );
}
