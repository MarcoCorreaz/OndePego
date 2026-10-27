'use client';

import React, { useState } from 'react';
import { gerarDadosCompartilhamentoMedicamento } from '@/lib/share';
import type { Medicamento } from '@/types/schema';

export interface ShareMedicationButtonProps {
  medicamento: Medicamento;
}

export function ShareMedicationButton({ medicamento }: ShareMedicationButtonProps) {
  const [copiedFeedback, setCopiedFeedback] = useState<string>('');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const payload = gerarDadosCompartilhamentoMedicamento({ medicamento, origin });

  const handleNativeShareOrCopy = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
        });
        return;
      } catch {
        // Usuário cancelou ou navegador recusou
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
        setCopiedFeedback('Link copiado para a área de transferência.');
        return;
      } catch {
        // Fallback para WhatsApp direto
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={payload.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-free)] px-4 py-2.5 font-display text-lg font-bold text-white active:translate-y-px"
      >
        <span aria-hidden="true">↗</span>
        <span>Compartilhar no WhatsApp</span>
      </a>

      <button
        type="button"
        onClick={handleNativeShareOrCopy}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] px-4 py-2.5 font-display text-lg font-bold text-[var(--c-text)] active:translate-y-px"
      >
        <span>Copiar ou enviar link</span>
      </button>

      {copiedFeedback && (
        <span role="status" aria-live="polite" className="text-base font-bold text-[var(--c-free)]">
          ✓ {copiedFeedback}
        </span>
      )}
    </div>
  );
}
