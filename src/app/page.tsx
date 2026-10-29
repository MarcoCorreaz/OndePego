import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
import { ShortcutChips } from '@/components/search/ShortcutChips';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import {
  ArrowRightIcon,
  BuildingSusIcon,
  MapPinIcon,
  PharmacyCrossIcon,
} from '@/components/ui/Icons';
import type { MetaDados } from '@/types/schema';
import metaJson from '../../data/meta.json';

const meta = metaJson as MetaDados;

export default function HomePage() {
  return (
    <>
      <FreshnessBanner meta={meta} />
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:py-10">
        {/* Bloco Herói de Busca (ADR-07) com iluminação de superfície suave */}
        <section
          aria-label="Consulta de medicamentos"
          className="ui-card-elevated relative overflow-hidden p-5 sm:p-8"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--c-brand)] via-[var(--c-brand)] to-[var(--c-free)]"
          />

          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-[var(--r-chip)] border border-[var(--c-border)] bg-[var(--c-bg)] px-3.5 py-1 text-sm font-bold text-[var(--c-brand)]">
              <span className="h-2 w-2 rounded-full bg-[var(--c-free)]" aria-hidden="true" />
              <span>Consulta pública gratuita • SUS Cuiabá &amp; Farmácia Popular</span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--c-text)] sm:text-4xl">
              Onde pego meu remédio em Cuiabá?
            </h1>
            <p className="max-w-[65ch] text-lg leading-relaxed text-[var(--c-text-2)]">
              Digite o nome do remédio da sua receita para ver, lado a lado, se ele consta na lista
              da Prefeitura (postos do SUS) e se é gratuito nas farmácias credenciadas ao Farmácia
              Popular.
            </p>
          </header>

          <div className="mt-6 space-y-6 border-t border-[var(--c-border-subtle)] pt-6">
            {/* Guia visual curto em 3 passos */}
            <ol
              aria-label="Como funciona em 3 passos"
              className="grid grid-cols-1 gap-2.5 rounded-[var(--r-plate)] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-3.5 text-base font-bold text-[var(--c-text)] sm:grid-cols-3"
            >
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--c-brand)] font-display text-sm font-extrabold text-white">
                  1
                </span>
                <span>Digite o nome da receita</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--c-brand)] font-display text-sm font-extrabold text-white">
                  2
                </span>
                <span>Escolha a dosagem</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--c-free)] font-display text-sm font-extrabold text-white">
                  3
                </span>
                <span>Veja onde retirar e o que levar</span>
              </li>
            </ol>

            <SearchBar navigateOnSubmit />
            <ShortcutChips navigateOnSelect />
          </div>
        </section>

        {/* Bento Grid de Acesso Rápido (ADR-07) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Card Principal Bento: Unidades e Farmácias Perto de Mim */}
          <section
            aria-labelledby="atalho-unidades-heading"
            className="ui-card flex flex-col justify-between gap-5 p-5 sm:p-6 md:col-span-7"
          >
            <div className="space-y-2.5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--c-brand-tint)] text-[var(--c-brand)]">
                <MapPinIcon className="h-5 w-5" />
              </span>
              <h2
                id="atalho-unidades-heading"
                className="font-display text-2xl font-extrabold text-[var(--c-text)]"
              >
                Procura um endereço perto de você?
              </h2>
              <p className="max-w-[55ch] text-base leading-relaxed text-[var(--c-text-2)]">
                Veja a lista e o mapa das farmácias credenciadas ao Farmácia Popular e unidades de
                saúde por bairro.
              </p>
            </div>

            <div>
              <Link
                href="/unidades/"
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-[var(--r-button)] border border-[var(--c-brand)] bg-[var(--c-brand-tint)] px-5 py-2.5 font-display text-xl font-extrabold text-[var(--c-brand)] transition-colors hover:bg-[var(--c-brand)] hover:text-white sm:w-auto"
              >
                <MapPinIcon className="h-5 w-5" />
                <span>Ver farmácias perto de mim</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Coluna Lateral Bento: Resumo das 2 Vias + Plantão 24h */}
          <div className=" flex flex-col justify-between gap-4 md:col-span-5">
            <div className="ui-card flex items-start gap-3.5 p-4 sm:p-5">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--c-brand-tint)] text-[var(--c-brand)]">
                <BuildingSusIcon className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-extrabold text-[var(--c-text)]">
                  Via 1 — Postos, Policlínicas e UPAs
                </h3>
                <p className="text-sm leading-relaxed text-[var(--c-text-2)]">
                  Confira a lista municipal (REMUME), locais de controlados e o{' '}
                  <Link href="/plantao/" className="font-bold text-[var(--c-brand)] underline">
                    painel de plantão 24h
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="ui-card flex items-start gap-3.5 p-4 sm:p-5">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--c-free-tint)] text-[var(--c-free)]">
                <PharmacyCrossIcon className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-extrabold text-[var(--c-text)]">
                  Via 2 — Farmácia Popular
                </h3>
                <p className="text-sm leading-relaxed text-[var(--c-text-2)]">
                  Veja se o item é 100% gratuito no programa federal e quais drogarias credenciadas
                  atendem seu bairro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
