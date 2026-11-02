'use client';

import React, { useState } from 'react';
import { usePrescription } from '@/components/prescription/PrescriptionProvider';
import { Icon } from '@/components/ui/Icon';
import { gerarDadosCompartilhamentoMedicamento } from '@/lib/share';
import type { Apresentacao, Medicamento } from '@/types/schema';

export interface MedicationStickyBarProps {
  medicamento: Medicamento;
  apresentacao: Apresentacao;
}

export function MedicationStickyBar({
  medicamento,
  apresentacao,
}: MedicationStickyBarProps) {
  const { isItemAdded, addItem, removeItem } = usePrescription();
  const isSaved = isItemAdded(medicamento.slug, apresentacao.id_apresentacao);
  const [justToggled, setJustToggled] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareData = gerarDadosCompartilhamentoMedicamento({ medicamento, origin });

  const handleTogglePrescription = () => {
    const entry = {
      slug: medicamento.slug,
      id_apresentacao: apresentacao.id_apresentacao,
    };
    if (isSaved) {
      removeItem(entry);
      setJustToggled('removido');
    } else {
      addItem(entry);
      setJustToggled('adicionado');
    }
  };

  const handleScrollToMap = () => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById('onde-buscar');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.focus?.();
    }
  };

  return (
    <aside
      aria-label="Ações rápidas do medicamento"
      className="fixed bottom-[74px] left-0 right-0 z-30 border-t border-[var(--c-border-subtle)] bg-[var(--c-surface)]/95 backdrop-blur-md shadow-md"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-1.5 sm:px-4 sm:py-2">
        {/* Botão 1 (Primário): Adicionar / Na Receita */}
        <button
          type="button"
          onClick={handleTogglePrescription}
          aria-pressed={isSaved}
          className={`ui-pressable inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[var(--r-button)] px-3 sm:px-5 font-display text-base font-bold shadow-xs transition-all active:scale-[0.98] ${
            isSaved
              ? 'border-2 border-[var(--c-free)] bg-[var(--c-free-tint)] text-[var(--c-free-ink)] hover:bg-[var(--c-free-tint)]/80'
              : 'border-2 border-[var(--c-brand)] bg-[var(--c-brand)] text-white hover:opacity-95'
          }`}
        >
          {isSaved ? (
            <>
              <Icon name="check" className="h-5 w-5 text-[var(--c-free-ink)]" />
              <span>✓ Na Receita</span>
            </>
          ) : (
            <>
              <span className="text-xl font-black leading-none" aria-hidden="true">
                ＋
              </span>
              <span>Minha Receita</span>
            </>
          )}
        </button>

        {/* Botão 2: Ver locais no mapa (rola suavemente até #onde-buscar) */}
        <button
          type="button"
          onClick={handleScrollToMap}
          aria-label="Ver locais de retirada no mapa"
          className="ui-pressable inline-flex h-12 min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3 text-sm font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)] active:scale-[0.98] sm:px-4 sm:text-base"
        >
          <Icon name="map" className="h-5 w-5 text-[var(--c-brand)]" />
          <span className="hidden xs:inline">Locais no mapa</span>
          <span className="xs:hidden">Mapa</span>
        </button>

        {/* Botão 3: Compartilhar no WhatsApp */}
        <a
          href={shareData.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartilhar informações deste remédio no WhatsApp"
          className="ui-pressable inline-flex h-12 min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--r-button)] border border-emerald-300 dark:border-emerald-800 bg-[var(--c-bg)] px-3 text-sm font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-[0.98] sm:px-4 sm:text-base"
        >
          <Icon name="share" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>WhatsApp</span>
        </a>
      </div>

      {/* Anúncio acessível de alteração de estado */}
      {justToggled && (
        <p role="status" aria-live="polite" className="sr-only">
          {medicamento.principio_ativo} {apresentacao.descricao_dosagem}{' '}
          {justToggled === 'adicionado' ? 'adicionado à Minha Receita' : 'removido da Minha Receita'}.
        </p>
      )}
    </aside>
  );
}
