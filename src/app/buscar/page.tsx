import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import type { MetaDados } from '@/types/schema';
import metaJson from '../../../data/meta.json';
import { BuscarClient } from './BuscarClient';

const meta = metaJson as MetaDados;

export const metadata: Metadata = buildPageMetadata({
  title: 'Buscar remédio — SUS e Farmácia Popular em Cuiabá | Onde Pego',
  description:
    'Pesquise pelo princípio ativo ou nome comercial para conferir se o medicamento consta na lista municipal (REMUME SUS Cuiabá) ou no elenco gratuito do Programa Farmácia Popular.',
  path: '/buscar/',
  noIndex: true,
});

export default function BuscarPage() {
  return <BuscarClient meta={meta} />;
}
