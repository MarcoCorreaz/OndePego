import React from 'react';

export interface SignpostIllustrationProps {
  className?: string;
}

export function SignpostIllustration({ className = 'h-28 w-28' }: SignpostIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none transition-transform duration-300 ${className}`}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-md"
      >
        {/* Sombra suave no chão */}
        <ellipse cx="60" cy="112" rx="20" ry="4" fill="rgba(0,0,0,0.18)" />

        {/* Base do poste */}
        <path d="M48 110 H72" stroke="#D97706" strokeWidth="6" strokeLinecap="round" />
        <path d="M52 108 H68" stroke="#FFC72C" strokeWidth="4" strokeLinecap="round" />

        {/* Haste vertical do poste em amarelo/dourado da marca */}
        <line x1="60" y1="12" x2="60" y2="108" stroke="#D97706" strokeWidth="8" strokeLinecap="round" />
        <line x1="60" y1="12" x2="60" y2="108" stroke="#FFC72C" strokeWidth="5" strokeLinecap="round" />

        {/* Remate no topo do poste */}
        <circle cx="60" cy="12" r="5" fill="#FFC72C" stroke="#D97706" strokeWidth="2" />

        {/* 1. Placa Superior (Farmácia Popular) - aponta para a direita em verde vívido #0E7C3A */}
        <g>
          {/* Sombra da placa */}
          <path
            d="M 58 24 L 102 24 L 115 36 L 102 48 L 58 48 Z"
            fill="rgba(0,0,0,0.25)"
            transform="translate(1, 2)"
          />
          {/* Corpo da placa */}
          <path
            d="M 58 24 L 102 24 L 115 36 L 102 48 L 58 48 Z"
            fill="#0E7C3A"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Parafusos de fixação */}
          <circle cx="63" cy="36" r="2" fill="#FFC72C" stroke="#D97706" strokeWidth="0.8" />
          {/* Cruz branca da farmácia */}
          <path
            d="M 70 33 H 74 V 29 H 77 V 33 H 81 V 36 H 77 V 40 H 74 V 36 H 70 Z"
            fill="#FFFFFF"
          />
          {/* Texto Farmácia Popular */}
          <text
            x="84"
            y="35"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="7.5"
            font-weight="900"
            fill="#FFFFFF"
            letterSpacing="-0.02em"
          >
            FARMÁCIA
          </text>
          <text
            x="84"
            y="43"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="6.5"
            font-weight="800"
            fill="#A7F3D0"
            letterSpacing="-0.02em"
          >
            POPULAR
          </text>
        </g>

        {/* 2. Placa Inferior (Posto SUS) - aponta para a esquerda em branco com azul #0B3D91 */}
        <g>
          {/* Sombra da placa */}
          <path
            d="M 62 56 L 18 56 L 5 68 L 18 80 L 62 80 Z"
            fill="rgba(0,0,0,0.2)"
            transform="translate(1, 2)"
          />
          {/* Corpo da placa */}
          <path
            d="M 62 56 L 18 56 L 5 68 L 18 80 L 62 80 Z"
            fill="#FFFFFF"
            stroke="#0B3D91"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Parafusos de fixação */}
          <circle cx="57" cy="68" r="2" fill="#FFC72C" stroke="#D97706" strokeWidth="0.8" />
          {/* Cruz azul SUS */}
          <path
            d="M 47 65 H 51 V 61 H 54 V 65 H 58 V 68 H 54 V 72 H 51 V 68 H 47 Z"
            fill="#0B3D91"
          />
          {/* Texto Posto SUS */}
          <text
            x="19"
            y="67"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="8.5"
            font-weight="900"
            fill="#0B3D91"
            letterSpacing="-0.02em"
          >
            POSTO
          </text>
          <text
            x="19"
            y="75"
            font-family="system-ui, -apple-system, sans-serif"
            font-size="8.5"
            font-weight="900"
            fill="#0284C7"
            letterSpacing="-0.02em"
          >
            SUS
          </text>
        </g>
      </svg>
    </div>
  );
}
