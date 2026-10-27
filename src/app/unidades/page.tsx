import type { Metadata } from 'next';
import { FreshnessBanner } from '@/components/ui/FreshnessBanner';
import { UnidadesExplorer } from '@/components/unidades/UnidadesExplorer';
import type { Estabelecimento, MetaDados } from '@/types/schema';
import estabelecimentosJson from '../../../data/estabelecimentos.json';
import metaJson from '../../../data/meta.json';

const estabelecimentos = estabelecimentosJson as Estabelecimento[];
const meta = metaJson as MetaDados;

export const metadata: Metadata = {
  title: 'Farmácias Credenciadas e Unidades de Saúde — Onde Pego Cuiabá',
  description:
    'Consulte a lista e o mapa de farmácias credenciadas ao Farmácia Popular, postos de saúde (UBS), policlínicas e UPAs em Cuiabá/MT.',
};

export default function UnidadesPage() {
  return (
    <>
      <FreshnessBanner meta={meta} />
      <main id="conteudo-principal" className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold text-[var(--c-text)] sm:text-4xl">
            Farmácias credenciadas e unidades de saúde
          </h1>
          <p className="max-w-[65ch] text-lg text-[var(--c-text-2)]">
            Encontre a farmácia credenciada ao Farmácia Popular ou o posto de saúde mais próximo por
            bairro ou usando sua localização atual.
          </p>
        </header>

        <UnidadesExplorer estabelecimentos={estabelecimentos} meta={meta} />
      </main>
    </>
  );
}
