import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MedicationDetailView } from '@/components/medication/MedicationDetailView';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import type { Estabelecimento, Medicamento, MetaDados } from '@/types/schema';
import estabelecimentosJson from '../../../../data/estabelecimentos.json';
import medicamentosJson from '../../../../data/medicamentos.json';
import metaJson from '../../../../data/meta.json';

const medicamentos = medicamentosJson as Medicamento[];
const estabelecimentos = estabelecimentosJson as Estabelecimento[];
const meta = metaJson as MetaDados;

export function generateStaticParams(): Array<{ slug: string }> {
  return medicamentos.map((m) => ({
    slug: m.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const med = medicamentos.find((m) => m.slug === slug);
  if (!med) {
    return {
      title: 'Medicamento não encontrado — Onde Pego',
    };
  }
  return {
    title: `${med.principio_ativo} — Onde Pego em Cuiabá`,
    description: `Veja se ${med.principio_ativo} consta na lista municipal (REMUME SUS Cuiabá) e se é gratuito no Programa Farmácia Popular.`,
  };
}

export default async function MedicamentoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const medicamento = medicamentos.find((m) => m.slug === slug);

  if (!medicamento) {
    notFound();
  }

  const unidadesControlados = estabelecimentos.filter(
    (e) => e.atributos_operacionais.dispensa_psicotropicos_sus === true,
  );

  return (
    <>
      <FreshnessBanner meta={meta} />
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <nav aria-label="Retorno para a busca">
          <Link
            href="/buscar/"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-button)] border-2 border-[var(--c-border)] bg-[var(--c-bg-soft)] px-4 py-2 font-display text-lg font-bold text-[var(--c-text)] hover:bg-[var(--c-brand-tint)]"
          >
            <span aria-hidden="true">←</span>
            <span>Voltar para os resultados da busca</span>
          </Link>
        </nav>

        <MedicationDetailView
          medicamento={medicamento}
          estabelecimentos={estabelecimentos}
          meta={meta}
          controlledUnits={unidadesControlados}
        />
      </main>
    </>
  );
}
