'use client';

import React from 'react';
import Link from 'next/link';
import { usePrescription } from '@/components/prescription/PrescriptionProvider';
import { CheckCircleIcon } from '@/components/ui/Icons';
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

  const handleToggle = () => {
    const entry = {
      slug: medicamento.slug,
      id_apresentacao: apresentacao.id_apresentacao,
    };
    if (isSaved) {
      removeItem(entry);
    } else {
      addItem(entry);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={isSaved}
        className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] px-4 py-2 font-display text-base font-bold shadow-2xs transition-all active:translate-y-px ${
          isSaved
            ? 'border border-[var(--c-free)] bg-[var(--c-free-tint)] text-[var(--c-free)] hover:bg-[var(--c-free-tint)]/80'
            : 'border border-[var(--c-brand)] bg-[var(--c-brand-tint)] text-[var(--c-brand)] hover:bg-[var(--c-brand)] hover:text-white'
        }`}
      >
        {isSaved ? (
          <>
            <CheckCircleIcon className="h-5 w-5 text-[var(--c-free)]" />
            <span>Na Minha Receita (toque para remover)</span>
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
          className="inline-flex min-h-[48px] items-center gap-1 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-2 text-sm font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]"
        >
          <span>Ver receita ({items.length}) →</span>
        </Link>
      )}
    </div>
  );
}
