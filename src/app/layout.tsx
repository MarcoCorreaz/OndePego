import type { Metadata, Viewport } from 'next';
import { AccessibilityPanel } from '@/components/layout/AccessibilityPanel';
import { AccessibilityProvider } from '@/components/layout/AccessibilityProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { PwaStatusBanner } from '@/components/layout/PwaStatusBanner';
import { SearchSessionProvider } from '@/components/search/SearchSessionProvider';
import { NORMATIVE_TEXTS } from '@/lib/healthCopy';
import type { Medicamento } from '@/types/schema';
import medicamentosJson from '../../data/medicamentos.json';
import './globals.css';

export const metadata: Metadata = {
  title: 'Onde Pego — Consulta pública de medicamentos em Cuiabá',
  description:
    'Consulte se um medicamento é padronizado na rede municipal de Cuiabá (REMUME) ou gratuito no Programa Farmácia Popular.',
  manifest: '/manifest.webmanifest',
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

export const viewport: Viewport = {
  themeColor: '#0F4C5C',
  width: 'device-width',
  initialScale: 1,
};

const catalogoInicial = medicamentosJson as Medicamento[];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-font-scale="normal"
      data-contrast="normal"
      data-reduce-motion="false"
      suppressHydrationWarning
    >
      <body className="min-h-screen pb-24 antialiased">
        <AccessibilityProvider>
          <SearchSessionProvider catalogo={catalogoInicial}>
            <a
              href="#conteudo-principal"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-[48px] focus:items-center focus:rounded-[var(--r-button)] focus:border-2 focus:border-[var(--c-border)] focus:bg-[var(--c-attn)] focus:px-4 focus:py-2 focus:font-bold focus:text-[var(--c-text)]"
            >
              Pular para o conteúdo principal
            </a>
            <AppHeader />
            <AccessibilityPanel />
            <PwaStatusBanner />
            {children}
            <footer className="mx-auto mt-12 max-w-4xl border-t-2 border-[var(--c-border-subtle)] px-4 py-6 text-base text-[var(--c-text-2)]">
              <p className="max-w-[65ch]">{NORMATIVE_TEXTS.avisoIndependencia}</p>
            </footer>
            <BottomNav />
          </SearchSessionProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
