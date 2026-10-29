import Link from 'next/link';
import { ArrowRightIcon, MapPinIcon, SearchIcon } from '@/components/ui/Icons';

export default function NotFoundPage() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto max-w-3xl px-4 py-10 sm:py-16"
    >
      <section
        aria-labelledby="titulo-pagina-nao-encontrada"
        className="ui-card-elevated p-6 sm:p-8"
      >
        <p className="inline-block rounded-[var(--r-chip)] bg-[var(--c-bg-soft)] px-3 py-1 text-sm font-bold text-[var(--c-text-2)]">
          Página não encontrada (erro 404)
        </p>
        <h1
          id="titulo-pagina-nao-encontrada"
          className="mt-3 font-display text-2xl font-extrabold text-[var(--c-text)] sm:text-3xl"
        >
          Não encontramos este endereço no Onde Pego
        </h1>
        <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-[var(--c-text-2)]">
          O link que você abriu pode ter mudado ou estar incompleto. Você pode procurar o
          seu remédio pelo nome na tela inicial ou consultar a lista de farmácias e
          unidades de saúde de Cuiabá.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-5 py-3 text-base font-bold text-white shadow-xs transition-opacity hover:opacity-95"
          >
            <SearchIcon className="h-4 w-4" />
            <span>Buscar um medicamento</span>
          </Link>
          <Link
            href="/unidades/"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-5 py-3 text-base font-bold text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg-soft)]"
          >
            <MapPinIcon className="h-4 w-4 text-[var(--c-brand)]" />
            <span>Ver farmácias e unidades</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
