import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import type { Medicamento, MetaDados } from '@/types/schema';
import medicamentosJson from '../../../data/medicamentos.json';
import metaJson from '../../../data/meta.json';
import { MinhaReceitaClient } from './MinhaReceitaClient';

const catalogo = medicamentosJson as Medicamento[];
const meta = metaJson as MetaDados;

export const metadata: Metadata = buildPageMetadata({
  title: 'Minha Receita — Lista de Remédios e Documentos | Onde Pego Cuiabá',
  description:
    'Monte a lista de medicamentos da sua receita para conferir onde retirar cada item em Cuiabá (SUS ou Farmácia Popular), separar os documentos necessários e compartilhar no WhatsApp.',
  path: '/minha-receita/',
  noIndex: true,
});

export default function MinhaReceitaPage() {
  return <MinhaReceitaClient catalogo={catalogo} meta={meta} />;
}
