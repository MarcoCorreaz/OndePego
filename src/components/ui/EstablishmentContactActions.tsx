'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CopyLinkIcon, PhoneIcon } from '@/components/ui/Icons';
import { Icon } from '@/components/ui/Icon';

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopyAddress = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(endereco);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 3000);
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
              className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border border-[var(--c-brand)]/20 bg-[var(--c-brand-tint)] px-3.5 py-2 font-display text-base font-bold text-[var(--c-brand)] transition-colors hover:bg-[var(--c-brand)] hover:text-white active:translate-y-px"
              aria-label={`Ligar para ${nomeFantasia} no telefone ${telefone}`}
            >
              <PhoneIcon className="h-4 w-4" />
              <span>Ligar: {telefone}</span>
            </a>

            <button
              type="button"
              onClick={handleCopyAddress}
              aria-label={`Copiar endereço de ${nomeFantasia}`}
              className={`ui-pressable inline-flex min-h-[48px] items-center gap-1.5 rounded-[var(--r-button)] border px-3.5 py-2 text-sm font-bold shadow-2xs transition-all ${
                copied
                  ? 'border-[var(--c-free)] bg-[var(--c-free-tint)] text-[var(--c-free)]'
                  : 'border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
              }`}
            >
              <CopyLinkIcon className={`h-4 w-4 ${copied ? 'text-[var(--c-free)]' : 'text-[var(--c-brand)]'}`} />
              {copied ? (
                <span className="inline-flex items-center gap-1 text-[var(--c-free)]">
                  <Icon name="check" className="h-4 w-4" />
                  <span>Endereço copiado</span>
                </span>
              ) : (
                <span>Copiar endereço</span>
              )}
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
            className={`ui-pressable inline-flex min-h-[48px] items-center gap-1.5 rounded-[var(--r-button)] border px-3.5 py-2 text-sm font-bold shadow-2xs transition-all ${
              copied
                ? 'border-[var(--c-free)] bg-[var(--c-free-tint)] text-[var(--c-free)]'
                : 'border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]'
            }`}
          >
            <CopyLinkIcon className={`h-4 w-4 ${copied ? 'text-[var(--c-free)]' : 'text-[var(--c-brand)]'}`} />
            {copied ? (
              <span className="inline-flex items-center gap-1 text-[var(--c-free)]">
                <Icon name="check" className="h-4 w-4" />
                <span>Endereço copiado</span>
              </span>
            ) : (
              <span>Copiar endereço</span>
            )}
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
