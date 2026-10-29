'use client';

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  CopyLinkIcon,
  ShareExternalIcon,
} from '@/components/ui/Icons';
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
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-free)] px-4 py-2.5 font-display text-lg font-bold text-white shadow-xs transition-opacity hover:opacity-95 active:translate-y-px"
      >
        <ShareExternalIcon className="h-4 w-4" />
        <span>Compartilhar no WhatsApp</span>
      </a>

      <button
        type="button"
        onClick={handleNativeShareOrCopy}
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2.5 font-display text-lg font-bold text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg-soft)] active:translate-y-px"
      >
        <CopyLinkIcon className="h-4 w-4 text-[var(--c-brand)]" />
        <span>Copiar ou enviar link</span>
      </button>

      {copiedFeedback && (
        <span
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 text-base font-bold text-[var(--c-free)]"
        >
          <CheckCircleIcon className="h-4 w-4" />
          <span>{copiedFeedback}</span>
        </span>
      )}
    </div>
  );
}
