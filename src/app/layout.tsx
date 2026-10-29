import type { Metadata, Viewport } from 'next';
import { AccessibilityPanel } from '@/components/layout/AccessibilityPanel';
import { AccessibilityProvider } from '@/components/layout/AccessibilityProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { PwaStatusBanner } from '@/components/layout/PwaStatusBanner';
import { PrescriptionProvider } from '@/components/prescription/PrescriptionProvider';
import { SearchSessionProvider } from '@/components/search/SearchSessionProvider';
import { ShieldCheckIcon } from '@/components/ui/Icons';
import { NORMATIVE_TEXTS } from '@/lib/healthCopy';
import { buildRootMetadata } from '@/lib/seo';
import type { Medicamento } from '@/types/schema';
import medicamentosJson from '../../data/medicamentos.json';
import './globals.css';

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  themeColor: '#F7F4EE',
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
      <body className="min-h-screen pb-28 antialiased">
        <AccessibilityProvider>
          <PrescriptionProvider>
            <SearchSessionProvider catalogo={catalogoInicial}>
              <a
                href="#conteudo-principal"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-[48px] focus:items-center focus:rounded-[var(--r-button)] focus:border-2 focus:border-[var(--c-text)] focus:bg-[var(--c-attn)] focus:px-4 focus:py-2 focus:font-bold focus:text-[var(--c-text)]"
              >
                Pular para o conteúdo principal
              </a>
              <AppHeader />
              <AccessibilityPanel />
              <PwaStatusBanner />
              {children}
              <footer className="mx-auto mt-14 max-w-4xl border-t border-[var(--c-border)] px-4 py-8 text-base text-[var(--c-text-2)]">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--c-brand-tint)] text-[var(--c-brand)]">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </span>
                  <p className="max-w-[65ch] leading-relaxed">{NORMATIVE_TEXTS.avisoIndependencia}</p>
                </div>
              </footer>
              <BottomNav />
            </SearchSessionProvider>
          </PrescriptionProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
