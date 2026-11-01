import React from 'react';

export interface BrandMarkProps {
  className?: string;
  showSubtitle?: boolean;
}

export function BrandMark({ className = '', showSubtitle = true }: BrandMarkProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Novo Ícone Oficial do Onde Pego 3D */}
      <span
        aria-hidden="true"
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] shadow-sm transition-transform active:scale-95"
      >
        <img
          src="/icon-192.png"
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
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
