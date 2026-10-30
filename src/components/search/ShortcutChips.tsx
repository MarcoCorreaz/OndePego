'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchSession } from '@/components/search/SearchSessionProvider';
import { Icon, type IconName } from '@/components/ui/Icon';

export interface ShortcutItem {
  label: string;
  query: string;
  iconName: IconName;
  tintBg: string;
  tintFg: string;
}

const COMMON_SHORTCUTS: readonly ShortcutItem[] = [
  {
    label: 'Pressão',
    query: 'pressão',
    iconName: 'heart',
    tintBg: 'bg-[var(--c-alert-tint)]',
    tintFg: 'text-[var(--c-alert)]',
  },
  {
    label: 'Diabetes',
    query: 'diabetes',
    iconName: 'drop',
    tintBg: 'bg-[var(--c-brand-tint)]',
    tintFg: 'text-[var(--c-brand)]',
  },
  {
    label: 'Asma',
    query: 'asma',
    iconName: 'wind',
    tintBg: 'bg-[var(--c-free-tint)]',
    tintFg: 'text-[var(--c-free-ink)]',
  },
  {
    label: 'Colesterol',
    query: 'colesterol',
    iconName: 'pulse',
    tintBg: 'bg-[var(--c-attn-tint)]',
    tintFg: 'text-[var(--c-attn-ink)]',
  },
];

export interface ShortcutChipsProps {
  shortcuts?: readonly ShortcutItem[];
  navigateOnSelect?: boolean;
}

export function ShortcutChips({
  shortcuts = COMMON_SHORTCUTS,
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
    <section aria-label="Assuntos comuns" className="space-y-3">
      <h2 className="font-display text-xl font-bold text-[var(--c-text)]">
        Toque num assunto comum:
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {shortcuts.map((item) => {
          const active = query.trim().toLowerCase() === item.query.toLowerCase();
          return (
            <button
              key={item.query}
              type="button"
              aria-pressed={active}
              onClick={() => handleSelect(item.query)}
              className={`ui-pressable group flex h-[62px] min-h-[62px] w-full items-center gap-2.5 rounded-[var(--r-card)] border bg-[var(--c-surface)] px-3 text-left shadow-2xs transition-all active:scale-[0.98] ${
                active
                  ? 'border-[var(--c-brand)] ring-2 ring-[var(--c-brand)]/20'
                  : 'border-[var(--c-border)] hover:border-[var(--c-brand)] hover:shadow-xs'
              }`}
            >
              {/* Quadradinho tintado com ícone */}
              <span
                aria-hidden="true"
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.tintBg} ${item.tintFg}`}
              >
                <Icon name={item.iconName} className="h-5 w-5" />
              </span>

              {/* Rótulo sem quebra de linha em 360px */}
              <span className="truncate text-base font-extrabold text-[var(--c-text)] group-hover:text-[var(--c-brand)]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
