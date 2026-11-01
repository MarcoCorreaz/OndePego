import React from 'react';

export interface MapPinProps {
  code: string;
  tipo: string;
  isSelected?: boolean;
  className?: string;
}

export function getMapPinColors(tipo: string, isSelected: boolean) {
  if (isSelected) {
    return {
      pinFill: '#FFC72C',
      pinStroke: '#111827',
      innerFill: '#FFFFFF',
      innerStroke: 'rgba(17, 24, 39, 0.25)',
      textFill: '#111827',
    };
  }

  switch (tipo) {
    case 'FARMACIA_POPULAR':
      return {
        pinFill: '#16A34A',
        pinStroke: '#FFFFFF',
        innerFill: '#FFFFFF',
        innerStroke: 'rgba(22, 163, 74, 0.25)',
        textFill: '#15803D',
      };
    case 'UPA':
      return {
        pinFill: '#DC2626',
        pinStroke: '#FFFFFF',
        innerFill: '#FFFFFF',
        innerStroke: 'rgba(220, 38, 38, 0.25)',
        textFill: '#DC2626',
      };
    case 'POLICLINICA':
      return {
        pinFill: '#2563EB',
        pinStroke: '#FFFFFF',
        innerFill: '#FFFFFF',
        innerStroke: 'rgba(37, 99, 235, 0.25)',
        textFill: '#2563EB',
      };
    case 'UBS':
    default:
      return {
        pinFill: '#0B3D91',
        pinStroke: '#FFFFFF',
        innerFill: '#FFFFFF',
        innerStroke: 'rgba(11, 61, 145, 0.25)',
        textFill: '#0B3D91',
      };
  }
}

export function renderMapPinSvgHtml({
  code,
  tipo,
  isSelected,
}: {
  code: string;
  tipo: string;
  isSelected: boolean;
}): string {
  const colors = getMapPinColors(tipo, isSelected);
  const fontSize = code.length >= 3 ? '10' : '11';

  const pulseRingHtml = isSelected
    ? '<span class="map-pin-pulse-ring" aria-hidden="true"></span>'
    : '';

  const svgHtml = `
    <svg viewBox="0 0 48 56" width="48" height="56" fill="none" xmlns="http://www.w3.org/2000/svg" class="overflow-visible" aria-hidden="true">
      <ellipse cx="24" cy="53" rx="9" ry="2.5" fill="rgba(0,0,0,0.3)" />
      <path
        d="M 24 51 C 20.5 43.5 7 30.5 7 20.5 A 17 17 0 1 1 41 20.5 C 41 30.5 27.5 43.5 24 51 Z"
        fill="${colors.pinFill}"
        stroke="${colors.pinStroke}"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <circle
        cx="24"
        cy="20.5"
        r="11.5"
        fill="${colors.innerFill}"
        stroke="${colors.innerStroke}"
        stroke-width="1.5"
      />
      <text
        x="24"
        y="21"
        text-anchor="middle"
        dominant-baseline="central"
        fill="${colors.textFill}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${fontSize}"
        font-weight="900"
        letter-spacing="-0.02em"
      >${code}</text>
    </svg>
  `;

  return `${pulseRingHtml}${svgHtml}`;
}

export function MapPinSvg({
  code,
  tipo,
  isSelected = false,
}: MapPinProps) {
  const colors = getMapPinColors(tipo, isSelected);
  const fontSize = code.length >= 3 ? '10' : '11';

  return (
    <>
      {isSelected && <span className="map-pin-pulse-ring" aria-hidden="true" />}
      <svg
        viewBox="0 0 48 56"
        width="48"
        height="56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-hidden="true"
      >
        <ellipse cx="24" cy="53" rx="9" ry="2.5" fill="rgba(0,0,0,0.3)" />
        <path
          d="M 24 51 C 20.5 43.5 7 30.5 7 20.5 A 17 17 0 1 1 41 20.5 C 41 30.5 27.5 43.5 24 51 Z"
          fill={colors.pinFill}
          stroke={colors.pinStroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle
          cx="24"
          cy="20.5"
          r="11.5"
          fill={colors.innerFill}
          stroke={colors.innerStroke}
          strokeWidth="1.5"
        />
        <text
          x="24"
          y="21"
          textAnchor="middle"
          dominantBaseline="central"
          fill={colors.textFill}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize={fontSize}
          fontWeight="900"
          letterSpacing="-0.02em"
        >
          {code}
        </text>
      </svg>
    </>
  );
}
