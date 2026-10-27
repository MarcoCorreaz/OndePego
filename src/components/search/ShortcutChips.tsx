'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';

export interface ShortcutChipItem {
  label: string;
  query: string;
}

const DEFAULT_SHORTCUTS: ShortcutChipItem[] = [
  { label: 'Pressão alta', query: 'pressão' },
  { label: 'Diabetes', query: 'diabetes' },
  { label: 'Asma', query: 'asma' },
  { label: 'Colesterol', query: 'colesterol' },
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
    <section aria-label="Atalhos de busca mais procurados" className="space-y-2">
      <h2 className="font-display text-lg font-bold text-[var(--c-text)]">
        Ou toque em um assunto comum:
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
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border-2 px-4 py-2 text-base font-bold transition-colors active:translate-y-px ${
                active
                  ? 'border-[var(--c-brand)] bg-[var(--c-brand)] text-white'
                  : 'border-[var(--c-border)] bg-[var(--c-bg-soft)] text-[var(--c-text)] hover:bg-[var(--c-brand-tint)]'
              }`}
            >
              <span aria-hidden="true">{active ? '●' : '+'}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
