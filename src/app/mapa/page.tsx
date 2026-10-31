import type { Metadata } from 'next';
import estabelecimentosRaw from '@/../data/estabelecimentos.json';
import metaRaw from '@/../data/meta.json';
import { DedicatedMapView } from '@/components/map/DedicatedMapView';
import type { Estabelecimento, MetaDados } from '@/types/schema';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Mapa Interativo de Farmácias e Unidades de Saúde — Onde Pego Cuiabá',
  description:
    'Navegue pelo mapa de Cuiabá e Várzea Grande para encontrar farmácias credenciadas ao Farmácia Popular, UPAs 24h, Policlínicas e postos de saúde (UBS).',
};

export default function MapaPage() {
  const estabelecimentos = estabelecimentosRaw as unknown as Estabelecimento[];
  const meta = metaRaw as unknown as MetaDados;

  return (
    <main className="w-full">
      <h1 className="sr-only">Mapa de Farmácias e Unidades de Saúde em Cuiabá e Várzea Grande</h1>
      <DedicatedMapView estabelecimentos={estabelecimentos} meta={meta} />
    </main>
  );
}
