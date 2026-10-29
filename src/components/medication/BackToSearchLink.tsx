'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { ArrowLeftIcon } from '@/components/ui/Icons';

const BACK_CLASS =
  'inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-left font-display text-lg font-bold text-[var(--c-text)] shadow-2xs transition-colors hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)]';

/**
 * Navegação de retorno em /medicamento/[slug]/:
 * - Nunca usa `<Link href="/buscar/">` que empilha histórico e cria loop no botão Voltar do Android.
 * - Se houver busca ativa na sessão (`query.trim().length > 0`), aciona `router.back()` com rótulo `"← Voltar para a busca"`.
 * - Se a pessoa entrou direto por um link do WhatsApp (`query === ''`), exibe link `"← Fazer uma busca no início"` apontando para `/`.
 */
export function BackToSearchLink() {
  const router = useRouter();
  const { query, isHydrated } = useSearchSession();
  const hasActiveSearch = isHydrated && query.trim().length > 0;

  if (hasActiveSearch) {
    return (
      <button
        type="button"
        className={BACK_CLASS}
        onClick={() => {
          router.back();
        }}
      >
        <ArrowLeftIcon className="h-4 w-4 shrink-0" />
        <span>← Voltar para a busca</span>
      </button>
    );
  }

  return (
    <Link href="/" className={BACK_CLASS}>
      <ArrowLeftIcon className="h-4 w-4 shrink-0" />
      <span>← Fazer uma busca no início</span>
    </Link>
  );
}
