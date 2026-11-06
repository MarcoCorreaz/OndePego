import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Primitiva de Skeleton reutilizável baseada nas classes e tokens nativos do Onde Pego.
 * Reutiliza a animação de pulso suave da GPU em .ui-skeleton (globals.css),
 * desativada automaticamente no modo de movimento reduzido.
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`ui-skeleton ${className}`}
      {...props}
    />
  );
}

export interface SearchCardSkeletonListProps {
  count?: number;
  label?: string;
  className?: string;
}

/**
 * Placeholder estrutural que espelha a geometria exata dos cards de medicamento.
 * Previne Cumulative Layout Shift (CLS) e anuncia o carregamento ao leitor de tela sem ruído.
 */
export function SearchCardSkeletonList({
  count = 3,
  label = 'Carregando resultados da busca...',
  className = '',
}: SearchCardSkeletonListProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`flex flex-col gap-4 ${className}`}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="ui-card relative overflow-hidden rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:p-6"
        >
          {/* Barra lateral simulada */}
          <div className="absolute inset-y-0 left-0 w-2 bg-[var(--c-bg-soft)]" />

          <div className="space-y-3 pl-2">
            {/* Selo superior */}
            <Skeleton className="h-[34px] w-44 rounded-[var(--r-chip)]" />

            {/* Nome do medicamento */}
            <Skeleton className="h-8 w-3/5 rounded-lg" />

            {/* Dosagens */}
            <Skeleton className="h-5 w-4/5 rounded-md" />

            {/* Vias de acesso e botão de detalhe */}
            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--c-border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-32 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
              <Skeleton className="h-12 w-36 rounded-[var(--r-button)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface MapCanvasSkeletonProps {
  label?: string;
  className?: string;
}

/**
 * Placeholder visual para carregamento do mapa dinâmico enquanto o WebGL/PMTiles inicializa.
 */
export function MapCanvasSkeleton({
  label = 'Carregando mapa de Cuiabá e Várzea Grande...',
  className = '',
}: MapCanvasSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={`relative flex h-full min-h-[360px] w-full flex-col justify-between overflow-hidden rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-bg-soft)] p-4 ${className}`}
    >
      <span className="sr-only">{label}</span>

      <div className="flex items-center justify-between gap-2" aria-hidden="true">
        <Skeleton className="h-10 w-32 rounded-[var(--r-chip)]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 text-center" aria-hidden="true">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>

      <div className="flex justify-end gap-2" aria-hidden="true">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
