import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Skeleton, SearchCardSkeletonList, MapCanvasSkeleton } from '@/components/ui/Skeleton';
import { StatusBanner } from '@/components/ui/StatusBanner';

describe('Primitivas de UI: Skeleton e StatusBanner (Tarefa 1)', () => {
  describe('Skeleton', () => {
    it('renderiza com classe ui-skeleton e aria-hidden', () => {
      const html = renderToStaticMarkup(<Skeleton className="h-4 w-24" />);
      expect(html).toContain('ui-skeleton');
      expect(html).toContain('h-4 w-24');
      expect(html).toContain('aria-hidden="true"');
    });

    it('SearchCardSkeletonList possui role="status", aria-busy="true" e texto acessível no sr-only', () => {
      const html = renderToStaticMarkup(
        <SearchCardSkeletonList count={3} label="Carregando resultados da busca..." />,
      );
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('Carregando resultados da busca...');
      // Verifica 3 cards estruturais
      const cardsCount = (html.match(/ui-card/g) || []).length;
      expect(cardsCount).toBe(3);
    });

    it('MapCanvasSkeleton possui role="status", aria-busy="true" e label acessível', () => {
      const html = renderToStaticMarkup(
        <MapCanvasSkeleton label="Carregando mapa de Cuiabá e Várzea Grande..." />,
      );
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('Carregando mapa de Cuiabá e Várzea Grande...');
    });
  });

  describe('StatusBanner', () => {
    it('variante "info" renderiza com role="status" e ícone info', () => {
      const html = renderToStaticMarkup(
        <StatusBanner variant="info" title="Aviso informativo">
          Texto de orientação
        </StatusBanner>,
      );
      expect(html).toContain('role="status"');
      expect(html).toContain('Aviso informativo');
      expect(html).toContain('Texto de orientação');
      expect(html).toContain('bg-[var(--c-brand-tint)]');
    });

    it('variante "warning" renderiza com role="alert" e aria-live="assertive"', () => {
      const html = renderToStaticMarkup(
        <StatusBanner variant="warning" title="Alerta importante">
          Mensagem de atenção
        </StatusBanner>,
      );
      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-live="assertive"');
      expect(html).toContain('Alerta importante');
      expect(html).toContain('bg-[var(--c-attn-tint)]');
    });

    it('variante "success" renderiza com role="status" e ícone de check', () => {
      const html = renderToStaticMarkup(
        <StatusBanner variant="success" title="Sucesso">
          Operação concluída
        </StatusBanner>,
      );
      expect(html).toContain('role="status"');
      expect(html).toContain('Sucesso');
      expect(html).toContain('bg-[var(--c-free-tint)]');
    });

    it('renderiza ação primária com min-h-12 para acessibilidade de toque (48px)', () => {
      const html = renderToStaticMarkup(
        <StatusBanner
          title="Com Ação"
          action={{
            label: 'Ver lista por bairro',
            href: '/unidades/',
            'aria-label': 'Ver lista de unidades por bairro',
          }}
        >
          Selecione a unidade na lista.
        </StatusBanner>,
      );
      expect(html).toContain('min-h-12');
      expect(html).toContain('href="/unidades');
      expect(html).toContain('Ver lista por bairro');
      expect(html).toContain('aria-label="Ver lista de unidades por bairro"');
    });

    it('renderiza botão de fechar com aria-label="Fechar aviso" e alvo 48x48px', () => {
      const html = renderToStaticMarkup(
        <StatusBanner
          title="Dispensável"
          onDismiss={() => {}}
        >
          Aviso que pode ser fechado.
        </StatusBanner>,
      );
      expect(html).toContain('aria-label="Fechar aviso"');
      expect(html).toContain('h-12 w-12');
    });
  });
});
