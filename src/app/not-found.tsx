import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto max-w-3xl px-4 py-10 sm:py-16"
    >
      <section
        aria-labelledby="titulo-pagina-nao-encontrada"
        className="rounded-[var(--r-card)] border-2 border-[var(--c-border)] bg-[var(--c-surface)] p-6 shadow-sm sm:p-8"
      >
        <p className="text-base font-bold uppercase tracking-wide text-[var(--c-text-2)]">
          Página não encontrada (erro 404)
        </p>
        <h1
          id="titulo-pagina-nao-encontrada"
          className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--c-text)] sm:text-3xl"
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
            className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-primary)] bg-[var(--c-primary)] px-5 py-3 text-base font-bold text-[var(--c-primary-fg)] transition-opacity hover:opacity-95"
          >
            Buscar um medicamento
          </Link>
          <Link
            href="/unidades"
            className="inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg)] px-5 py-3 text-base font-bold text-[var(--c-text)] transition-colors hover:bg-[var(--c-surface-2)]"
          >
            Ver farmácias e unidades
          </Link>
        </div>
      </section>
    </main>
  );
}
