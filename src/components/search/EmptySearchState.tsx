import React from 'react';
import Link from 'next/link';

export interface EmptySearchStateProps {
  query: string;
  onClear?: () => void;
}

export function EmptySearchState({ query, onClear }: EmptySearchStateProps) {
  return (
    <section
      aria-labelledby="empty-search-heading"
      className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-5 text-[var(--c-text)]"
    >
      <h2 id="empty-search-heading" className="font-display text-2xl font-extrabold">
        Não encontramos &ldquo;{query}&rdquo; nas listas cadastradas
      </h2>

      <p className="mt-2 max-w-[65ch] text-base">
        Para evitar erro com a sua saúde, o Onde Pego nunca sugere trocar um remédio por outro. Veja
        como conferir:
      </p>

      <ol className="mt-3 list-decimal space-y-2 pl-5 text-base">
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

      <div className="mt-5 flex flex-wrap gap-3">
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-4 py-2 font-bold text-[var(--c-text)]"
          >
            Limpar e tentar outra busca
          </button>
        )}

        <Link
          href="/unidades/"
          className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand)] px-4 py-2 font-bold text-white"
        >
          Ver endereços das farmácias e unidades
        </Link>
      </div>
    </section>
  );
}
