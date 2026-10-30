'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { gerarDadosCompartilhamentoMedicamento } from '@/lib/share';
import type { Medicamento } from '@/types/schema';

export interface ShareMedicationButtonProps {
  medicamento: Medicamento;
  compact?: boolean;
}

export function ShareMedicationButton({ medicamento, compact = false }: ShareMedicationButtonProps) {
  const [copiedFeedback, setCopiedFeedback] = useState<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
        setCopiedFeedback('Link copiado!');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopiedFeedback(''), 3000);
        return;
      } catch {
        // Fallback para WhatsApp direto
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <a
        href={payload.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-free)] px-5 py-2.5 font-display text-base font-bold text-white shadow-xs transition-opacity hover:opacity-95 active:scale-[0.98]"
      >
        <Icon name="share" className="h-5 w-5" />
        <span>Compartilhar no WhatsApp</span>
      </a>

      <button
        type="button"
        onClick={handleNativeShareOrCopy}
        aria-label="Copiar link do medicamento"
        className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2.5 font-display text-base font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:bg-[var(--c-bg-soft)] active:scale-[0.98]"
      >
        <Icon name="doc" className="h-4 w-4 text-[var(--c-brand)]" />
        <span>{compact ? 'Copiar link' : 'Copiar ou enviar link'}</span>
      </button>

      {copiedFeedback && (
        <span
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 text-base font-bold text-[var(--c-free-ink)]"
        >
          <Icon name="check" className="h-4 w-4" />
          <span>{copiedFeedback}</span>
        </span>
      )}
    </div>
  );
}
