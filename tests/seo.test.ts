import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  buildMedicationMetadata,
  buildRobotsConfig,
  buildRootMetadata,
  buildStaticSitemapEntries,
  resolveConfiguredSiteUrl,
} from '@/lib/seo';
import type { Medicamento } from '@/types/schema';

const MEDICAMENTO_FIXTURE: Medicamento = {
  slug: 'losartana-potassica-fixture',
  principio_ativo: 'LOSARTANA POTÁSSICA (FIXTURE)',
  nomes_comerciais: ['ARADOIS_FIXTURE'],
  termos_populares: ['pressão alta'],
  apresentacoes: [
    {
      id_apresentacao: 'losartana-50mg-fixture',
      descricao_dosagem: '50mg comprimido',
      status_remume_cuiaba: 'PADRONIZADO_REMUME',
      local_dispensacao_sus: 'UBS',
      farmacia_popular_gratuito: true,
      requisito_farmacia_popular: 'PADRAO_RECEITA_DOCUMENTO',
    },
  ],
  __fixture: true,
};

describe('SEO Local e Metadados de Compartilhamento no WhatsApp / Open Graph (src/lib/seo.ts)', () => {
  it('1. Gera metadados dinâmicos para medicamento com princípio ativo, SUS Cuiabá e Farmácia Popular sem prometer estoque físico', () => {
    const meta = buildMedicationMetadata(MEDICAMENTO_FIXTURE);
    const title = String(meta.title);
    const description = String(meta.description);

    expect(title).toContain('LOSARTANA POTÁSSICA (FIXTURE)');
    expect(title).toContain('SUS Cuiabá e Farmácia Popular');
    expect(description).toContain('50mg comprimido');
    expect(description).toContain('REMUME SUS Cuiabá');
    expect(description).toContain('Farmácia Popular');

    // Regra inviolável #3: nunca prometer disponibilidade ou estoque físico no preview
    const forbidden = /(dispon[ií]vel|em estoque|tem o item|garantido)/i;
    expect(title).not.toMatch(forbidden);
    expect(description).not.toMatch(forbidden);

    // OpenGraph aponta para imagem estática local (/og-image.png) sem URL de terceiros
    const ogImages = meta.openGraph?.images;
    expect(ogImages).toEqual([
      {
        url: OG_IMAGE_PATH,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: 'LOSARTANA POTÁSSICA (FIXTURE) — Onde Pego Cuiabá (SUS e Farmácia Popular)',
      },
    ]);
  });

  it('2. Possui imagem estática local public/og-image.png válida em 1200x630px', () => {
    const ogPngPath = path.resolve(process.cwd(), 'public/og-image.png');
    expect(fs.existsSync(ogPngPath)).toBe(true);

    const buf = fs.readFileSync(ogPngPath);
    // Assinatura PNG: 89 50 4E 47 0D 0A 1A 0A
    expect(buf.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    // Dimensões no chunk IHDR (bytes 16..23)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(1200);
    expect(height).toBe(630);
  });

  it('3. Gera sitemap e robots sem domínios fictícios por padrão e com prefixo quando configurado', () => {
    // Sem NEXT_PUBLIC_SITE_URL configurada: usa caminhos relativos seguros
    const defaultUrl = resolveConfiguredSiteUrl(undefined);
    expect(defaultUrl).toBe('');

    const rootMetaDefault = buildRootMetadata('');
    expect(rootMetaDefault.metadataBase).toBeUndefined();

    const entriesDefault = buildStaticSitemapEntries([MEDICAMENTO_FIXTURE], '2026-04-20', '');
    const urlsDefault = entriesDefault.map((e) => e.url);
    expect(urlsDefault).toContain('/');
    expect(urlsDefault).toContain('/buscar/');
    expect(urlsDefault).toContain('/medicamento/losartana-potassica-fixture/');

    const robotsDefault = buildRobotsConfig('');
    expect(robotsDefault.sitemap).toBe('/sitemap.xml');

    // Com URL configurada explicitamente
    const customSiteUrl = 'https://ondepego.exemplo.gov.br';
    const rootMetaConfigured = buildRootMetadata(customSiteUrl);
    expect(new URL(String(rootMetaConfigured.metadataBase)).origin).toBe(customSiteUrl);

    const entriesConfigured = buildStaticSitemapEntries([MEDICAMENTO_FIXTURE], '2026-04-20', customSiteUrl);
    expect(entriesConfigured[0]?.url).toBe(`${customSiteUrl}/`);

    const robotsConfigured = buildRobotsConfig(customSiteUrl);
    expect(robotsConfigured.sitemap).toBe(`${customSiteUrl}/sitemap.xml`);
  });
});
