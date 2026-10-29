import type { MetadataRoute } from 'next';
import { buildStaticSitemapEntries } from '@/lib/seo';
import type { Medicamento, MetaDados } from '@/types/schema';
import medicamentosJson from '../../data/medicamentos.json';
import metaJson from '../../data/meta.json';

export const dynamic = 'force-static';

const medicamentos = medicamentosJson as Medicamento[];
const meta = metaJson as MetaDados;

export default function sitemap(): MetadataRoute.Sitemap {
  return buildStaticSitemapEntries(medicamentos, meta.ultima_verificacao_ci);
}
