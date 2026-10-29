'use client';

import React, { useState } from 'react';
import { CheckCircleIcon, CopyLinkIcon, PhoneIcon } from '@/components/ui/Icons';

export interface EstablishmentContactActionsProps {
  telefone?: string;
  endereco: string;
  nomeFantasia: string;
}

export function sanitizePhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) return phone;
  if (digitsOnly.startsWith('0800')) {
    return digitsOnly;
  }
  // Se tem 10 dígitos (fixo com DDD) ou 11 dígitos (celular com DDD)
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `+55${digitsOnly}`;
  }
  return digitsOnly;
}

export function EstablishmentContactActions({
  telefone,
  endereco,
  nomeFantasia,
}: EstablishmentContactActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(endereco);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {
        // Fallback silencioso
      }
    }
  };

  return (
    <div className="space-y-2">
      {telefone && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${sanitizePhoneNumber(telefone)}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--r-button)] border border-[var(--c-brand)]/20 bg-[var(--c-brand-tint)] px-3 py-1.5 font-display text-base font-bold text-[var(--c-brand)] transition-colors hover:bg-[var(--c-brand)] hover:text-white active:translate-y-px"
              aria-label={`Ligar para ${nomeFantasia} no telefone ${telefone}`}
            >
              <PhoneIcon className="h-4 w-4" />
              <span>Ligar: {telefone}</span>
            </a>

            <button
              type="button"
              onClick={handleCopyAddress}
              aria-label={`Copiar endereço de ${nomeFantasia}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-sm font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:bg-[var(--c-bg-soft)] active:translate-y-px"
            >
              <CopyLinkIcon className="h-4 w-4 text-[var(--c-brand)]" />
              <span>{copied ? '✓ Endereço copiado' : 'Copiar endereço'}</span>
            </button>
          </div>
          <p className="text-xs text-[var(--c-text-2)]">
            Ligue antes de sair para confirmar o atendimento e a disponibilidade.
          </p>
        </div>
      )}

      {!telefone && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAddress}
            aria-label={`Copiar endereço de ${nomeFantasia}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-3 py-1.5 text-sm font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:bg-[var(--c-bg-soft)] active:translate-y-px"
          >
            <CopyLinkIcon className="h-4 w-4 text-[var(--c-brand)]" />
            <span>{copied ? '✓ Endereço copiado' : 'Copiar endereço'}</span>
          </button>
        </div>
      )}

      {copied && (
        <p role="status" aria-live="polite" className="sr-only">
          Endereço de {nomeFantasia} copiado para a área de transferência.
        </p>
      )}
    </div>
  );
}
