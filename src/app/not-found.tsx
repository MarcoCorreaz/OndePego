import Link from 'next/link';
import { EmptyIllustration } from '@/components/ui/EmptyIllustration';
import { Icon } from '@/components/ui/Icon';

const SUGESTOES_NEUTRAS = [
  { label: 'Losartana', href: '/medicamento/losartana-potassica/' },
  { label: 'Dipirona', href: '/medicamento/dipirona-sodica/' },
  { label: 'Atenolol', href: '/medicamento/atenolol/' },
];

export default function NotFoundPage() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto max-w-3xl px-4 py-10 sm:py-16"
    >
      <section
        aria-labelledby="titulo-pagina-nao-encontrada"
        className="ui-card flex flex-col items-center rounded-[var(--r-card)] border border-[var(--c-border)] bg-[var(--c-surface)] p-6 text-center shadow-2xs sm:p-10"
      >
        <EmptyIllustration
          type="empty-search"
          className="mb-4 h-24 w-24 text-[var(--c-text-2)]"
        />

        <h1
          id="titulo-pagina-nao-encontrada"
          className="font-display text-2xl font-black text-[var(--c-text)] sm:text-3xl"
        >
          Página não encontrada
        </h1>

        <p className="mt-3 max-w-[52ch] font-sans text-base leading-relaxed text-[var(--c-text-2)] sm:text-lg">
          O endereço que você tentou acessar não existe ou mudou de lugar.
        </p>

        {/* Atalhos de busca com exemplos neutros verificados no catálogo */}
        <div className="mt-6 flex w-full flex-col items-center gap-2.5 border-t border-[var(--c-border-subtle)] pt-6">
          <p className="font-display text-base font-bold text-[var(--c-text)]">
            Tente buscar por:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGESTOES_NEUTRAS.map((sugestao) => (
              <Link
                key={sugestao.href}
                href={sugestao.href}
                className="ui-pressable inline-flex min-h-[48px] items-center justify-center rounded-[var(--r-chip)] border border-[var(--c-brand)]/20 bg-[var(--c-brand-tint)] px-4 py-2 font-display text-base font-bold text-[var(--c-brand)] shadow-2xs hover:bg-[var(--c-brand)] hover:text-white active:scale-95"
              >
                {sugestao.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Ações principais */}
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            className="ui-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--r-button)] bg-[var(--c-brand)] px-6 py-3 font-display text-base font-bold text-white shadow-xs transition-opacity hover:opacity-95 active:scale-[0.98]"
          >
            <Icon name="search" className="h-4 w-4" />
            <span>Voltar ao início</span>
          </Link>

          <Link
            href="/buscar/"
            className="ui-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--r-button)] border border-[var(--c-border)] bg-[var(--c-bg)] px-6 py-3 font-display text-base font-bold text-[var(--c-text)] transition-colors hover:bg-[var(--c-bg-soft)] active:scale-[0.98]"
          >
            <span>Fazer uma busca</span>
            <Icon name="chev" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
