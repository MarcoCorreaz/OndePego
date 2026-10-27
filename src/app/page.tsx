import Link from 'next/link';
import { SearchBar } from '@/components/search/SearchBar';
import { ShortcutChips } from '@/components/search/ShortcutChips';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import type { MetaDados } from '@/types/schema';
import metaJson from '../../data/meta.json';

const meta = metaJson as MetaDados;

export default function HomePage() {
  return (
    <>
      <FreshnessBanner meta={meta} />
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <header className="space-y-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--c-text)] sm:text-4xl">
            Onde pego meu remédio em Cuiabá?
          </h1>
          <p className="max-w-[65ch] text-lg text-[var(--c-text)]">
            Digite o nome do remédio da sua receita para ver, lado a lado, se ele consta na lista da
            Prefeitura (postos do SUS) e se é gratuito nas farmácias credenciadas ao Farmácia
            Popular.
          </p>
        </header>

        {/* Bloco Herói de Busca (ADR-07) */}
        <section
          aria-label="Consulta de medicamentos"
          className="space-y-6 rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] p-4 sm:p-6"
        >
          <SearchBar navigateOnSubmit />
          <ShortcutChips navigateOnSelect />
        </section>

        {/* Atalho rápido para quem pensa primeiro em lugar (ADR-07) */}
        <section
          aria-labelledby="atalho-unidades-heading"
          className="rounded-[var(--r-plate)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] p-4 sm:p-5"
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <h2
                id="atalho-unidades-heading"
                className="font-display text-2xl font-extrabold text-[var(--c-text)]"
              >
                Procura um endereço perto de você?
              </h2>
              <p className="max-w-[55ch] text-base text-[var(--c-text-2)]">
                Veja a lista e o mapa das farmácias credenciadas ao Farmácia Popular e unidades de
                saúde por bairro.
              </p>
            </div>

            <Link
              href="/unidades/"
              className="inline-flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-brand-tint)] px-5 py-2.5 font-display text-xl font-extrabold text-[var(--c-brand)] hover:bg-[var(--c-brand)] hover:text-white sm:w-auto"
            >
              <span aria-hidden="true">📍</span>
              <span>Ver farmácias perto de mim</span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
