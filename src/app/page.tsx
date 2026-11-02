import React from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
import { ShortcutChips } from '@/components/search/ShortcutChips';
import { ShowcaseGrid } from '@/components/search/ShowcaseGrid';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import { Icon } from '@/components/ui/Icon';
import { SignpostIllustration } from '@/components/ui/SignpostIllustration';
import type { MetaDados } from '@/types/schema';
import metaJson from '../../data/meta.json';

const meta = metaJson as MetaDados;

const SHOWCASE_MEDS = [
  {
    slug: 'losartana-potassica',
    nome: 'Losartana',
    detalhe: '50mg • Pressão alta',
    gratisPopular: true,
    postoSus: true,
  },
  {
    slug: 'cloridrato-de-metformina',
    nome: 'Metformina',
    detalhe: '850mg • Diabetes',
    gratisPopular: true,
    postoSus: true,
  },
  {
    slug: 'sulfato-de-salbutamol',
    nome: 'Salbutamol',
    detalhe: '100mcg • Asma e bronquite',
    gratisPopular: true,
    postoSus: true,
  },
  {
    slug: 'sinvastatina',
    nome: 'Sinvastatina',
    detalhe: '20mg • Colesterol',
    gratisPopular: true,
    postoSus: true,
  },
  {
    slug: 'omeprazol',
    nome: 'Omeprazol',
    detalhe: '20mg • Estômago e azia',
    gratisPopular: false,
    postoSus: true,
  },
  {
    slug: 'fralda-geriatrica',
    nome: 'Fralda Geriátrica',
    detalhe: 'P, M, G e GG • Idosos',
    gratisPopular: true,
    postoSus: false,
  },
] as const;

export default function HomePage() {
  return (
    <>
      <FreshnessBanner meta={meta} />

      <main id="conteudo-principal" className="space-y-6">
        {/* Hero Oficial v2 com isolamento de overflow para o dropdown flutuante */}
        <section
          aria-label="Consulta de medicamentos"
          className="relative rounded-b-[28px] px-4 pb-8 pt-6 text-white shadow-md sm:px-8 sm:pb-10 sm:pt-8"
        >
          {/* Fundo com gradiente e ilustração isolados em overflow-hidden */}
          <div
            aria-hidden="true"
            style={{ background: 'var(--c-hero-gradient, var(--c-brand))' }}
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[28px]"
          >
            {/* Ilustração decorativa do poste colorido no canto superior direito */}
            <div className="absolute right-2 top-2 opacity-95 sm:right-6 sm:top-4">
              <SignpostIllustration className="h-28 w-28 sm:h-36 sm:w-36 text-white" />
            </div>
          </div>

          <div className="relative z-30 mx-auto max-w-3xl space-y-4">
            {/* Pílulas de Confiança / Destaques */}
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-xs sm:text-sm">
              <span className="inline-flex items-center gap-1">
                <span className="font-black text-[var(--c-free)]">✓</span> 41 itens 100% grátis
              </span>
              <span className="text-white/60" aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="font-black text-[var(--c-attn)]">✓</span> 48 locais em Cuiabá
              </span>
              <span className="text-white/60" aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="font-black text-white">✓</span> Funciona offline
              </span>
            </div>

            <header className="space-y-2">
              <h1 className="font-display text-3xl font-black leading-tight tracking-tight sm:text-[38px]">
                Onde pego meu remédio?
              </h1>
              <p className="max-w-[54ch] text-lg leading-snug text-white/95">
                Veja se consta na lista da Prefeitura e se é gratuito no Farmácia Popular.
              </p>
            </header>

            {/* Campo de busca e botão dentro do Hero com dropdown flutuante */}
            <div className="pt-2">
              <SearchBar variant="hero" navigateOnSubmit />
            </div>
          </div>
        </section>

        {/* Conteúdo logo abaixo do Hero */}
        <div className="mx-auto max-w-3xl space-y-6 px-4">
          {/* Vitrine: Mais procurados em Cuiabá (toque para abrir) */}
          <section aria-labelledby="mais-procurados-heading" className="space-y-3">
            <div>
              <h2
                id="mais-procurados-heading"
                className="font-display text-xl font-black text-[var(--c-text)] sm:text-2xl"
              >
                Mais procurados em Cuiabá
              </h2>
              <p className="text-sm text-[var(--c-text-2)] sm:text-base">
                Toque para abrir direto as opções de retirada
              </p>
            </div>

            <ShowcaseGrid items={SHOWCASE_MEDS} />
          </section>

          {/* Toque num assunto comum: grade 2 colunas */}
          <ShortcutChips navigateOnSelect />

          {/* Como funciona em 3 passos */}
          <section aria-labelledby="como-funciona-heading" className="space-y-3">
            <div>
              <h2
                id="como-funciona-heading"
                className="font-display text-xl font-black text-[var(--c-text)] sm:text-2xl"
              >
                Como funciona em 3 passos
              </h2>
              <p className="text-sm text-[var(--c-text-2)] sm:text-base">
                Tudo o que você precisa para retirar seu medicamento gratuito
              </p>
            </div>

            <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <li className="flex items-start gap-3 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--c-brand-tint)] font-display text-lg font-black text-[var(--c-brand)]"
                >
                  1
                </span>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-[var(--c-text)]">
                    Busque o remédio
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--c-text-2)]">
                    Digite o nome ou princípio ativo que consta na sua receita médica.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--c-brand-tint)] font-display text-lg font-black text-[var(--c-brand)]"
                >
                  2
                </span>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-[var(--c-text)]">
                    Veja onde retirar
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--c-text-2)]">
                    Confira se retira no Posto de Saúde (SUS) ou na Drogaria Popular perto de você.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-4 shadow-2xs">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--c-brand-tint)] font-display text-lg font-black text-[var(--c-brand)]"
                >
                  3
                </span>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-[var(--c-text)]">
                    Leve a receita
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--c-text-2)]">
                    Compareça com documento oficial com foto, CPF e a receita médica válida.
                  </p>
                </div>
              </li>
            </ol>
          </section>

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
