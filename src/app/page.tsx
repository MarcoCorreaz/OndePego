import React from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
import { ShortcutChips } from '@/components/search/ShortcutChips';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import { Icon } from '@/components/ui/Icon';
import { SignpostIllustration } from '@/components/ui/SignpostIllustration';
import type { MetaDados } from '@/types/schema';
import metaJson from '../../data/meta.json';

const meta = metaJson as MetaDados;

export default function HomePage() {
  return (
    <>
      <FreshnessBanner meta={meta} />

      <main id="conteudo-principal" className="space-y-6">
        {/* Hero Oficial v2 (Fase 10B) */}
        <section
          aria-label="Consulta de medicamentos"
          className="relative overflow-hidden rounded-b-[28px] bg-[var(--c-brand)] px-4 pb-8 pt-6 text-white shadow-md sm:px-8 sm:pb-10 sm:pt-8"
        >
          {/* Ilustração decorativa do poste no canto superior direito */}
          <div className="absolute right-2 top-2 sm:right-6 sm:top-4">
            <SignpostIllustration className="h-28 w-28 sm:h-36 sm:w-36 text-white" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl space-y-4">
            <header className="space-y-2">
              <h1 className="font-display text-3xl font-black leading-tight tracking-tight sm:text-[38px]">
                Onde pego meu remédio?
              </h1>
              <p className="max-w-[54ch] text-lg leading-snug text-white/95">
                Veja se consta na lista da Prefeitura e se é gratuito no Farmácia Popular.
              </p>
            </header>

            {/* Campo de busca e botão dentro do Hero */}
            <div className="pt-2">
              <SearchBar variant="hero" navigateOnSubmit />
            </div>
          </div>
        </section>

        {/* Conteúdo logo abaixo do Hero */}
        <div className="mx-auto max-w-3xl space-y-6 px-4">
          {/* Toque num assunto comum: grade 2 colunas */}
          <ShortcutChips navigateOnSelect />

          {/* Cartão "Perto de você?" com mini-mapa SVG */}
          <section
            aria-labelledby="perto-de-voce-heading"
            className="flex flex-col justify-between gap-4 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-2xs sm:flex-row sm:items-center sm:p-6"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-[var(--c-brand)]">
                <Icon name="pin" className="h-5 w-5" />
                <h2
                  id="perto-de-voce-heading"
                  className="font-display text-2xl font-black text-[var(--c-text)]"
                >
                  Perto de você?
                </h2>
              </div>
              <p className="max-w-[45ch] text-base leading-relaxed text-[var(--c-text-2)]">
                Encontre farmácias credenciadas e unidades públicas de saúde em Cuiabá no mapa ou por bairro.
              </p>
              <div>
                <Link
                  href="/unidades/"
                  className="ui-pressable inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand-tint)] px-4 py-2 font-display text-base font-bold text-[var(--c-brand)] transition-colors hover:bg-[var(--c-brand)] hover:text-white"
                >
                  <span>Ver farmácias perto de mim</span>
                  <Icon name="chev" className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Mini-mapa SVG decorativo à direita */}
            <div
              aria-hidden="true"
              className="hidden h-28 w-28 shrink-0 items-center justify-center rounded-[var(--r-card)] border border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)] text-[var(--c-brand)] sm:flex"
            >
              <svg
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="h-20 w-20 opacity-80"
              >
                {/* Linhas de rua estilizadas */}
                <path d="M10 30 Q 50 20 90 40" stroke="currentColor" strokeWidth={3} />
                <path d="M20 80 Q 45 40 85 70" stroke="currentColor" strokeWidth={2} />
                <path d="M50 10 L 50 90" stroke="currentColor" strokeWidth={2.5} />
                {/* Marcadores de pino */}
                <circle cx="50" cy="40" r="5" fill="var(--c-brand)" />
                <circle cx="30" cy="30" r="4" fill="var(--c-free)" />
                <circle cx="75" cy="55" r="4" fill="var(--c-attn)" />
              </svg>
            </div>
          </section>

          {/* Cartão de Plantão 24h e Emergências */}
          <section
            aria-labelledby="plantao-heading"
            className="flex items-center justify-between rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--c-alert-tint)] text-[var(--c-alert)]">
                <Icon name="cross" className="h-5 w-5" />
              </span>
              <div>
                <h2 id="plantao-heading" className="font-display text-lg font-black text-[var(--c-text)]">
                  Plantão 24h e UPAs
                </h2>
                <p className="text-sm text-[var(--c-text-2)]">
                  Unidades com atendimento de urgência e emergência sem interrupção.
                </p>
              </div>
            </div>
            <Link
              href="/plantao/"
              className="ui-pressable inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3 text-sm font-bold text-[var(--c-text)] hover:bg-[var(--c-bg-soft)]"
              aria-label="Ver unidades de plantão 24 horas"
            >
              <Icon name="chev" className="h-5 w-5 text-[var(--c-brand)]" />
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
