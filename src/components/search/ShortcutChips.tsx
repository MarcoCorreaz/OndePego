'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { CheckCircleIcon, PlusCircleIcon } from '@/components/ui/Icons';

export interface ShortcutChipItem {
  label: string;
  query: string;
}

const DEFAULT_SHORTCUTS: ShortcutChipItem[] = [
  { label: 'Buscar: Losartana', query: 'losartana' },
  { label: 'Buscar: Metformina 850', query: 'metformina 850' },
  { label: 'Buscar: Salbutamol', query: 'salbutamol' },
  { label: 'Assunto: Pressão / Diabetes', query: 'pressão' },
];

export interface ShortcutChipsProps {
  shortcuts?: readonly ShortcutChipItem[];
  navigateOnSelect?: boolean;
}

export function ShortcutChips({
  shortcuts = DEFAULT_SHORTCUTS,
  navigateOnSelect = true,
}: ShortcutChipsProps) {
  const { query, setQuery } = useSearchSession();
  const router = useRouter();

  const handleSelect = (term: string) => {
    setQuery(term);
    if (navigateOnSelect) {
      // ADR-09: navega sem colocar o termo na URL
      router.push('/buscar/');
    }
  };

  return (
    <section aria-label="Exemplos rápidos de busca" className="space-y-2.5">
      <h2 className="font-display text-lg font-bold text-[var(--c-text-2)]">
        Exemplos rápidos para testar a consulta:
      </h2>
      <div className="flex flex-wrap gap-2.5">
        {shortcuts.map((item) => {
          const active = query.trim().toLowerCase() === item.query.toLowerCase();
          return (
            <button
              key={item.query}
              type="button"
              aria-pressed={active}
              onClick={() => handleSelect(item.query)}
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border px-4 py-2 text-base font-bold transition-all active:translate-y-px ${
                active
                  ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white shadow-xs'
                  : 'border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] shadow-2xs hover:border-[var(--c-brand)] hover:bg-[var(--c-brand-tint)] hover:text-[var(--c-brand)]'
              }`}
            >
              {active ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : (
                <PlusCircleIcon className="h-4 w-4 text-[var(--c-brand)]" />
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
