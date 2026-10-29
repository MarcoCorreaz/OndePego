import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BackToSearchLink } from '@/components/medication/BackToSearchLink';
import { MedicationDetailView } from '@/components/medication/MedicationDetailView';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import { buildMedicationMetadata } from '@/lib/seo';
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
  return buildMedicationMetadata(med);
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
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:py-8">
        <nav aria-label="Retorno para a busca">
          <BackToSearchLink />
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
