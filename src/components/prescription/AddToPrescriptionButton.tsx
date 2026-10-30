'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePrescription } from '@/components/prescription/PrescriptionProvider';
import { CheckCircleIcon, SparklesIcon } from '@/components/ui/Icons';
import type { Apresentacao, Medicamento } from '@/types/schema';

export interface AddToPrescriptionButtonProps {
  medicamento: Medicamento;
  apresentacao: Apresentacao;
}

export function AddToPrescriptionButton({
  medicamento,
  apresentacao,
}: AddToPrescriptionButtonProps) {
  const { isItemAdded, addItem, removeItem, items } = usePrescription();
  const isSaved = isItemAdded(medicamento.slug, apresentacao.id_apresentacao);
  const [justAdded, setJustAdded] = useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleToggle = () => {
    const entry = {
      slug: medicamento.slug,
      id_apresentacao: apresentacao.id_apresentacao,
    };
    if (isSaved) {
      removeItem(entry);
      setJustAdded(false);
    } else {
      addItem(entry);
      setJustAdded(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setJustAdded(false), 700);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isSaved}
        className={`ui-pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] px-4 py-2 font-display text-base font-bold shadow-2xs transition-all ${
          isSaved
            ? 'border border-[var(--c-free)] bg-[var(--c-free-tint)] text-[var(--c-free)] hover:bg-[var(--c-free-tint)]/80'
            : 'border border-[var(--c-brand)] bg-[var(--c-brand-tint)] text-[var(--c-brand)] hover:bg-[var(--c-brand)] hover:text-white'
        } ${justAdded ? 'scale-105 ring-4 ring-[var(--c-free)]/20' : ''}`}
      >
        {isSaved ? (
          <>
            {justAdded ? (
              <SparklesIcon className="h-5 w-5 text-[var(--c-free)]" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-[var(--c-free)]" />
            )}
            <span>{justAdded ? 'Salvo na receita!' : 'Na Minha Receita (toque para remover)'}</span>
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Adicionar esta dosagem à Minha Receita</span>
          </>
        )}
      </button>

      {isSaved && (
        <Link
          href="/minha-receita/"
          className="ui-pressable inline-flex min-h-[48px] items-center gap-1 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-sm font-bold text-[var(--c-text)] shadow-2xs hover:bg-[var(--c-bg-soft)]"
        >
          <span>Ver receita ({items.length}) →</span>
        </Link>
      )}

      {justAdded && (
        <p role="status" aria-live="polite" className="sr-only">
          {medicamento.principio_ativo} {apresentacao.descricao_dosagem} adicionado à Minha Receita.
        </p>
      )}
    </div>
  );
}
