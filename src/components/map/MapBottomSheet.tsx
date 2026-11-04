'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import {
  type SheetSnapState,
  resolveNextSnapState,
} from '@/lib/bottomSheetSnap';
import { getEstablishmentTypeBadge } from '@/lib/establishmentsFilter';
import {
  type EstabelecimentoListavel,
  formatarDistancia,
  gerarUrlRotaGoogleMaps,
} from '@/lib/geoEngine';
import { usePagedList } from '@/lib/usePagedList';
import type { Estabelecimento } from '@/types/schema';

export type { SheetSnapState };

export interface MapBottomSheetProps {
  sheetState: SheetSnapState;
  onChangeState: (next: SheetSnapState) => void;
  items: readonly EstabelecimentoListavel[];
  totalFilteredCount: number;
  selectedId: string | null;
  buscaTexto: string;
  onChangeBuscaTexto: (value: string) => void;
  bairroFiltro: string;
  onChangeBairroFiltro: (value: string) => void;
  bairrosDisponiveis: readonly string[];
  onFocusOnMap: (est: Estabelecimento) => void;
  resetKey: string;
}

export function MapBottomSheet({
  sheetState,
  onChangeState,
  items,
  totalFilteredCount,
  selectedId,
  buscaTexto,
  onChangeBuscaTexto,
  bairroFiltro,
  onChangeBairroFiltro,
  bairrosDisponiveis,
  onFocusOnMap,
  resetKey,
}: MapBottomSheetProps) {
  const openTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const prevStateRef = useRef<SheetSnapState>(sheetState);

  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartYRef = useRef<number | null>(null);

  const {
    visibleItems,
    visibleCount,
    totalCount,
    hasMore,
    nextStepCount,
    showMore,
  } = usePagedList({
    items,
    initialLimit: 10,
    step: 10,
    storageKey: 'mapa_gaveta',
    resetKey,
  });

  // Gerenciamento de foco e tecla Escape para fechar a gaveta
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = sheetState;

    if (prev !== 'collapsed' && sheetState === 'collapsed') {
      // Devolve o foco ao botão de abrir quando recolhe
      requestAnimationFrame(() => {
        openTriggerRef.current?.focus();
      });
    }
  }, [sheetState]);

  useEffect(() => {
    if (sheetState === 'collapsed') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onChangeState('collapsed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sheetState, onChangeState]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    dragStartYRef.current = event.clientY;
    setIsDragging(true);
    setDragOffsetY(0);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Ignora em ambientes sintéticos de teste sem suporte a setPointerCapture
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartYRef.current === null) {
      return;
    }
    const deltaY = event.clientY - dragStartYRef.current;
    // Limita o deslocamento visual elástico para não descolar da base da tela
    const clamped = Math.max(-280, Math.min(320, deltaY));
    setDragOffsetY(clamped);
  };

  const finishDrag = (clientY: number, pointerId?: number, target?: HTMLDivElement) => {
    if (dragStartYRef.current === null) {
      return;
    }
    const deltaY = clientY - dragStartYRef.current;
    dragStartYRef.current = null;
    setIsDragging(false);
    setDragOffsetY(0);

    if (target && pointerId !== undefined) {
      try {
        if (target.hasPointerCapture?.(pointerId)) {
          target.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignora
      }
    }

    const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
    const nextState = resolveNextSnapState({
      currentState: sheetState,
      deltaY,
      viewportHeight: vh,
    });
    onChangeState(nextState);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(event.clientY, event.pointerId, event.currentTarget);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(event.clientY, event.pointerId, event.currentTarget);
  };

  return (
    <>
      {/* Backdrop semitransparente quando a gaveta está aberta (half ou full) */}
      {sheetState !== 'collapsed' && (
        <div
          aria-hidden="true"
          data-testid="bottom-sheet-backdrop"
          onClick={() => onChangeState('collapsed')}
          className="absolute inset-0 z-20 bg-black/25 backdrop-blur-[1px] transition-opacity duration-200"
        />
      )}

      <aside
        aria-label="Lista de estabelecimentos no mapa"
        style={
          isDragging && dragOffsetY !== 0
            ? {
                transform: `translateY(${Math.max(0, dragOffsetY)}px)`,
                transition: 'none',
              }
            : undefined
        }
        className={`absolute bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl border-t border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xl backdrop-blur-md transition-all duration-300 ease-out ${
          sheetState === 'collapsed'
            ? 'min-h-[68px] border-x'
            : sheetState === 'half'
              ? 'h-[50dvh]'
              : 'h-[85dvh]'
        }`}
      >
        {/* Alça visual de toque e arraste (Drag handle com Pointer Events nativos) */}
        <div
          role="presentation"
          data-testid="bottom-sheet-drag-handle"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ touchAction: 'none' }}
          className="cursor-grab select-none py-2 active:cursor-grabbing"
        >
          <div className="mx-auto h-1.5 w-11 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Cabeçalho da Gaveta */}
        {sheetState === 'collapsed' ? (
          <div className="flex flex-1 items-center justify-between px-4 pb-1.5">
            <button
              ref={openTriggerRef}
              type="button"
              onClick={() => onChangeState('half')}
              aria-label="Abrir lista de unidades"
              className="ui-pressable flex min-h-[48px] flex-1 items-center justify-between gap-2 text-left"
            >
              <div className="flex items-center gap-2">
                <Icon name="list" className="h-5 w-5 text-[var(--c-brand)]" />
                <span className="font-display text-sm font-bold text-[var(--c-text)]">
                  Ver lista de locais ({totalFilteredCount} encontrados)
                </span>
              </div>
              <Icon
                name="chev"
                className="h-4 w-4 -rotate-90 text-[var(--c-text-2)] transition-transform"
              />
            </button>
          </div>
        ) : (
          <div className="flex flex-col border-b border-[var(--c-border-subtle)] px-4 pb-3">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Icon name="list" className="h-5 w-5 text-[var(--c-brand)]" />
                <h2 className="font-display text-base font-bold text-[var(--c-text)]">
                  Locais encontrados ({totalFilteredCount})
                </h2>
              </div>

              <div className="flex items-center gap-1">
                {sheetState === 'half' ? (
                  <button
                    type="button"
                    onClick={() => onChangeState('full')}
                    aria-label="Expandir para tela cheia"
                    className="ui-pressable inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full text-[var(--c-text-2)] hover:bg-[var(--c-bg-soft)]"
                  >
                    <Icon name="chev" className="h-4 w-4 -rotate-90" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onChangeState('half')}
                    aria-label="Reduzir para meia tela"
                    className="ui-pressable inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full text-[var(--c-text-2)] hover:bg-[var(--c-bg-soft)]"
                  >
                    <Icon name="chev" className="h-4 w-4 rotate-90" />
                  </button>
                )}

                <button
                  ref={closeTriggerRef}
                  type="button"
                  onClick={() => onChangeState('collapsed')}
                  aria-label="Recolher lista"
                  className="ui-pressable inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full text-[var(--c-text-2)] hover:bg-[var(--c-bg-soft)]"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filtros rápidos dentro da gaveta */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="search"
                value={buscaTexto}
                onChange={(e) => onChangeBuscaTexto(e.target.value)}
                placeholder="Buscar por nome, bairro ou rua..."
                aria-label="Buscar unidade por nome, bairro ou rua"
                className="min-h-[48px] w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] px-3 text-xs font-medium text-[var(--c-text)] placeholder-[var(--c-text-2)] focus:border-[var(--c-brand)] focus:outline-hidden"
              />

              <select
                value={bairroFiltro}
                onChange={(e) => onChangeBairroFiltro(e.target.value)}
                aria-label="Filtrar unidades por bairro"
                className="min-h-[48px] w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] px-3 text-xs font-bold text-[var(--c-text)] focus:border-[var(--c-brand)] focus:outline-hidden"
              >
                <option value="">Todos os bairros ({bairrosDisponiveis.length})</option>
                {bairrosDisponiveis.map((bairro) => (
                  <option key={bairro} value={bairro}>
                    {bairro}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Conteúdo com rolagem e paginação progressiva quando expandida */}
        {sheetState !== 'collapsed' && (
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {totalCount === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--c-text-2)]">
                Nenhum estabelecimento encontrado com os filtros atuais.
              </div>
            ) : (
              <>
                {visibleItems.map(({ estabelecimento: est, distanciaKm }) => {
                  const badge = getEstablishmentTypeBadge(est.tipo);
                  const isSelected = est.id === selectedId;

                  return (
                    <article
                      key={est.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        isSelected
                          ? 'border-[var(--c-brand)] bg-[var(--c-brand)]/5'
                          : 'border-[var(--c-border)] bg-[var(--c-surface)]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black text-white ${
                            badge.isPharmacy ? 'bg-[var(--c-free)]' : 'bg-[var(--c-brand)]'
                          }`}
                        >
                          [{badge.code}] {badge.shortLabel}
                        </span>

                        {distanciaKm !== null && (
                          <span className="text-xs font-bold text-[var(--c-brand)]">
                            Aprox. {formatarDistancia(distanciaKm)}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 font-display text-sm font-bold text-[var(--c-text)]">
                        {est.nome_fantasia}
                      </h3>

                      <p className="mt-0.5 text-xs text-[var(--c-text-2)]">
                        <strong>Bairro:</strong> {est.bairro} • {est.endereco_completo}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[var(--c-border-subtle)] pt-2">
                        <button
                          type="button"
                          onClick={() => onFocusOnMap(est)}
                          aria-label={`Ver no mapa: ${est.nome_fantasia}`}
                          className="ui-pressable inline-flex min-h-[48px] flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--c-brand)] px-2.5 text-xs font-bold text-white shadow-2xs hover:opacity-95"
                        >
                          <Icon name="pin" className="h-3.5 w-3.5" />
                          <span>Ver no mapa</span>
                        </button>

                        {est.telefone && (
                          <a
                            href={`tel:${est.telefone.replace(/\D/g, '')}`}
                            aria-label={`Ligar para ${est.nome_fantasia}`}
                            className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-1 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 text-xs font-bold text-[var(--c-text)] shadow-2xs hover:bg-[var(--c-bg-soft)]"
                          >
                            <Icon name="phone" className="h-3.5 w-3.5 text-[var(--c-brand)]" />
                            <span>Ligar</span>
                          </a>
                        )}

                        <a
                          href={gerarUrlRotaGoogleMaps(est.coordenadas, {
                            nomeFantasia: est.nome_fantasia,
                            enderecoCompleto: est.endereco_completo,
                            bairro: est.bairro,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Rota para ${est.nome_fantasia}`}
                          className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-1 rounded-lg border border-[var(--c-border)] bg-[var(--c-bg)] px-2.5 text-xs font-bold text-[var(--c-text)] shadow-2xs hover:bg-[var(--c-bg-soft)]"
                        >
                          <Icon name="pin" className="h-3.5 w-3.5" />
                          <span>Rota</span>
                        </a>
                      </div>
                    </article>
                  );
                })}

                {hasMore && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={showMore}
                      data-testid="bottom-sheet-show-more"
                      className="ui-pressable inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2.5 font-display text-sm font-bold text-[var(--c-brand)] shadow-2xs hover:bg-[var(--c-bg-soft)]"
                    >
                      <span>
                        Mostrar mais {nextStepCount}{' '}
                        {nextStepCount === 1 ? 'local' : 'locais'} (exibindo {visibleCount} de{' '}
                        {totalCount})
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
