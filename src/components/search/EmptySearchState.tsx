import React from 'react';
import Link from 'next/link';
import { EmptyIllustration } from '@/components/ui/EmptyIllustration';
import { Icon } from '@/components/ui/Icon';

export interface EmptySearchStateProps {
  query: string;
  onClear?: () => void;
}

export function EmptySearchState({ query, onClear }: EmptySearchStateProps) {
  return (
    <section
      aria-labelledby="empty-search-heading"
      className="ui-card space-y-4 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 text-[var(--c-text)] shadow-2xs sm:p-6"
    >
      <EmptyIllustration type="empty-search" className="h-20 w-20 text-[var(--c-attn-ink)]" />

      <div className="inline-flex items-center gap-2 rounded-[var(--r-chip)] bg-[var(--c-attn-tint)] px-3 py-1 text-sm font-bold text-[var(--c-attn-ink)]">
        <Icon name="info" className="h-4 w-4" />
        <span>Nenhum resultado encontrado</span>
      </div>

      <h2 id="empty-search-heading" className="font-display text-2xl font-black">
        Não encontramos &ldquo;{query}&rdquo; nas listas cadastradas
      </h2>

      <p className="max-w-[65ch] text-base text-[var(--c-text-2)]">
        Para evitar erro com a sua saúde, o Onde Pego nunca sugere trocar um remédio por outro. Veja
        como conferir:
      </p>

      <ol className="list-decimal space-y-2.5 rounded-[var(--r-button)] bg-[var(--c-bg)] p-4 pl-8 text-base">
        <li>
          <strong>Olhe o princípio ativo na caixa ou na receita:</strong> é o nome genérico da
          substância (costuma ficar escrito logo abaixo do nome comercial).
        </li>
        <li>
          <strong>Confira a escrita:</strong> tente digitar apenas a primeira palavra do nome, sem
          abreviações.
        </li>
        <li>
          <strong>Pergunte no posto de saúde ou na farmácia credenciada:</strong> leve sua receita
          médica para o farmacêutico orientar você com segurança.
        </li>
      </ol>

      <div className="flex flex-wrap gap-3 pt-2">
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2 font-display text-base font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)] active:scale-[0.98]"
          >
            <Icon name="close" className="h-4 w-4" />
            <span>Limpar e tentar outra busca</span>
          </button>
        )}

        <Link
          href="/unidades/"
          className="ui-pressable inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-4 py-2 font-display text-base font-bold text-white shadow-xs hover:opacity-95 active:scale-[0.98]"
        >
          <span>Ver endereços das farmácias e unidades</span>
          <Icon name="chev" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
