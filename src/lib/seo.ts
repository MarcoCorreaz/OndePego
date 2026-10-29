import type { Metadata, MetadataRoute } from 'next';
import { buildMedicationDetailPath } from '@/lib/share';
import type { Medicamento } from '@/types/schema';

/**
 * URL pública de produção definida explicitamente via variável de ambiente.
 * Enquanto `NEXT_PUBLIC_SITE_URL` não estiver definida, nenhuma URL absoluta fictícia é gerada;
 * todos os metadados usam caminhos relativos seguros (`/...`).
 */
export function resolveConfiguredSiteUrl(envUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  const trimmed = envUrl?.trim().replace(/\/+$/, '') ?? '';
  return trimmed;
}

export const OG_IMAGE_PATH = '/og-image.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT =
  'Onde Pego — Consulta pública de medicamentos em Cuiabá: SUS e Farmácia Popular';

export function buildRootMetadata(siteUrl = resolveConfiguredSiteUrl()): Metadata {
  const title = 'Onde Pego — Consulta pública de medicamentos em Cuiabá (SUS e Farmácia Popular)';
  const description =
    'Consulte gratuitamente se um medicamento consta na relação municipal de Cuiabá (REMUME SUS) ou no elenco gratuito do Programa Farmácia Popular e veja onde buscar.';

  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title,
    description,
    manifest: '/manifest.webmanifest',
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: '/',
      siteName: 'Onde Pego Cuiabá',
      locale: 'pt_BR',
      type: 'website',
      images: [
        {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    },
    appleWebApp: {
      capable: true,
      title: 'Onde Pego',
      statusBarStyle: 'default',
    },
  };
}

/**
 * Gera os metadados de SEO e Open Graph (WhatsApp / redes sociais) para a página de um medicamento.
 * Regra inviolável #3: NUNCA promete estoque físico ("disponível", "em estoque", "tem o item").
 */
export function buildMedicationMetadata(medicamento: Medicamento | undefined): Metadata {
  if (!medicamento) {
    return {
      title: 'Medicamento não encontrado — Onde Pego Cuiabá',
      description:
        'Consulte gratuitamente medicamentos padronizados no SUS Cuiabá (REMUME) e no Programa Farmácia Popular.',
    };
  }

  const dosagens = medicamento.apresentacoes.map((a) => a.descricao_dosagem).join(', ');
  const temRemume = medicamento.apresentacoes.some(
    (a) => a.status_remume_cuiaba === 'PADRONIZADO_REMUME',
  );
  const temFarmaciaPopular = medicamento.apresentacoes.some((a) => a.farmacia_popular_gratuito);

  let resumoCanais =
    'Consulte as regras de retirada na rede pública municipal (SUS Cuiabá) e no Programa Farmácia Popular';
  if (temRemume && temFarmaciaPopular) {
    resumoCanais =
      'Padronizado na lista municipal (REMUME SUS Cuiabá) e gratuito nas drogarias credenciadas ao Farmácia Popular';
  } else if (temRemume) {
    resumoCanais =
      'Padronizado na lista municipal (REMUME SUS Cuiabá). Confira documentos e unidades de retirada';
  } else if (temFarmaciaPopular) {
    resumoCanais = 'Gratuito nas drogarias credenciadas ao Programa Farmácia Popular em Cuiabá';
  }

  const title = `${medicamento.principio_ativo} — Consulta gratuita no SUS Cuiabá e Farmácia Popular | Onde Pego`;
  const description = `${medicamento.principio_ativo} (${dosagens}): ${resumoCanais}. Consulta pública e gratuita em Cuiabá/MT (sujeito à confirmação na unidade ou farmácia credenciada).`;
  const canonicalPath = buildMedicationDetailPath(medicamento.slug);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: 'Onde Pego Cuiabá',
      locale: 'pt_BR',
      type: 'article',
      images: [
        {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: `${medicamento.principio_ativo} — Onde Pego Cuiabá (SUS e Farmácia Popular)`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export function buildStaticSitemapEntries(
  medicamentos: readonly Medicamento[],
  lastModifiedIso: string,
  siteUrl = resolveConfiguredSiteUrl(),
): MetadataRoute.Sitemap {
  const prefix = siteUrl ? siteUrl.replace(/\/+$/, '') : '';
  const staticRoutes: Array<{ path: string; priority: number }> = [
    { path: '/', priority: 1.0 },
    { path: '/buscar/', priority: 0.9 },
    { path: '/unidades/', priority: 0.9 },
    { path: '/plantao/', priority: 0.8 },
    { path: '/sobre/', priority: 0.6 },
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${prefix}${route.path}`,
    lastModified: lastModifiedIso,
    changeFrequency: 'weekly',
    priority: route.priority,
  }));

  for (const med of medicamentos) {
    entries.push({
      url: `${prefix}${buildMedicationDetailPath(med.slug)}`,
      lastModified: lastModifiedIso,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}

export function buildRobotsConfig(
  siteUrl = resolveConfiguredSiteUrl(),
): MetadataRoute.Robots {
  const prefix = siteUrl ? siteUrl.replace(/\/+$/, '') : '';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${prefix}/sitemap.xml`,
  };
}
