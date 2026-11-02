import { describe, expect, it } from 'vitest';
import {
  CLUSTER_ZOOM_THRESHOLD,
  clusterEstablishments,
  getClusterRadiusForZoom,
} from '@/lib/mapClusters';
import type { Estabelecimento } from '@/types/schema';

function mockEstabelecimento(
  id: string,
  lat: number,
  lng: number,
  bairro = 'Centro',
  tipo: 'FARMACIA_POPULAR' | 'UPA' | 'POLICLINICA' | 'UBS' = 'FARMACIA_POPULAR',
): Estabelecimento {
  return {
    __fixture: true,
    id,
    tipo,
    nome_fantasia: `Unidade ${id}`,
    bairro,
    endereco_completo: `Rua Principal, 100 - ${bairro}, Cuiabá - MT`,
    coordenadas: {
      lat,
      lng,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      status_funcionamento: 'NORMAL',
    },
  };
}

describe('Agrupamento Inteligente de Pinos (mapClusters.ts)', () => {
  it('retorna lista vazia para array vazio', () => {
    const res = clusterEstablishments([], 12);
    expect(res).toEqual([]);
  });

  it('um único estabelecimento nunca é agrupado mesmo em zoom afastado', () => {
    const item = mockEstabelecimento('est-1', -15.6, -56.1);
    const res = clusterEstablishments([item], 10);
    expect(res).toHaveLength(1);
    const first = res[0];
    expect(first).toBeDefined();
    if (first && first.type === 'single') {
      expect(first.item.id).toBe('est-1');
    }
  });

  it('agrupa estabelecimentos próximos quando zoom < 13.5', () => {
    // Dois pontos a ~200 metros um do outro no Centro de Cuiabá
    const item1 = mockEstabelecimento('est-1', -15.596, -56.097, 'Centro', 'FARMACIA_POPULAR');
    const item2 = mockEstabelecimento('est-2', -15.597, -56.096, 'Centro', 'UBS');

    const res = clusterEstablishments([item1, item2], 12);
    expect(res).toHaveLength(1);
    const first = res[0];
    expect(first).toBeDefined();
    expect(first?.type).toBe('cluster');

    if (first && first.type === 'cluster') {
      expect(first.count).toBe(2);
      expect(first.bairroPredominante).toBe('Centro');
      expect(first.countsByType.FARMACIA_POPULAR).toBe(1);
      expect(first.countsByType.UBS).toBe(1);
      expect(first.center.lat).toBeCloseTo(-15.5965, 3);
      expect(first.center.lng).toBeCloseTo(-56.0965, 3);
    }
  });

  it('não agrupa pontos quando zoom >= 13.5 (CLUSTER_ZOOM_THRESHOLD)', () => {
    const item1 = mockEstabelecimento('est-1', -15.596, -56.097);
    const item2 = mockEstabelecimento('est-2', -15.597, -56.096);

    const resAtThreshold = clusterEstablishments([item1, item2], CLUSTER_ZOOM_THRESHOLD);
    expect(resAtThreshold).toHaveLength(2);
    expect(resAtThreshold.every((r) => r.type === 'single')).toBe(true);

    const resAbove = clusterEstablishments([item1, item2], 15);
    expect(resAbove).toHaveLength(2);
    expect(resAbove.every((r) => r.type === 'single')).toBe(true);
  });

  it('pontos geograficamente distantes não se agrupam em zoom 12', () => {
    // Centro (-15.596, -56.097) vs Pedra 90 (-15.688, -55.998), ~15 km de distância
    const itemCentro = mockEstabelecimento('est-centro', -15.596, -56.097, 'Centro');
    const itemPedra90 = mockEstabelecimento('est-pedra', -15.688, -55.998, 'Pedra 90');

    const res = clusterEstablishments([itemCentro, itemPedra90], 12);
    expect(res).toHaveLength(2);
    expect(res.every((r) => r.type === 'single')).toBe(true);
  });

  it('determina corretamente o bairro predominante e a composição de tipos', () => {
    const item1 = mockEstabelecimento('est-1', -15.568, -56.042, 'Morada da Serra', 'FARMACIA_POPULAR');
    const item2 = mockEstabelecimento('est-2', -15.569, -56.041, 'Morada da Serra', 'UPA');
    const item3 = mockEstabelecimento('est-3', -15.570, -56.043, 'CPA II', 'UBS');

    const res = clusterEstablishments([item1, item2, item3], 12);
    expect(res).toHaveLength(1);
    const first = res[0];
    expect(first).toBeDefined();
    expect(first?.type).toBe('cluster');

    if (first && first.type === 'cluster') {
      expect(first.count).toBe(3);
      expect(first.bairroPredominante).toBe('Morada da Serra');
      expect(first.countsByType.FARMACIA_POPULAR).toBe(1);
      expect(first.countsByType.UPA).toBe(1);
      expect(first.countsByType.UBS).toBe(1);
    }
  });

  it('calcula raio de zoom dinâmico proporcional à escala', () => {
    const r10 = getClusterRadiusForZoom(10);
    const r12 = getClusterRadiusForZoom(12);
    const r13 = getClusterRadiusForZoom(13);
    const r14 = getClusterRadiusForZoom(14);

    expect(r10).toBeGreaterThan(r12);
    expect(r12).toBeGreaterThan(r13);
    expect(r14).toBe(0);
  });

  it('ignora itens sem coordenadas válidas', () => {
    const semCoord: Estabelecimento = {
      __fixture: true,
      id: 'sem-coord',
      tipo: 'FARMACIA_POPULAR',
      nome_fantasia: 'Sem Localização',
      bairro: 'Centro',
      endereco_completo: 'Cuiabá - MT',
      coordenadas: {
        lat: 0,
        lng: 0,
        auditado_manualmente: false,
        sem_localizacao: true,
      },
      atributos_operacionais: {
        status_funcionamento: 'NORMAL',
      },
    };

    const comCoord = mockEstabelecimento('com-coord', -15.596, -56.097);
    const res = clusterEstablishments([semCoord, comCoord], 12);
    expect(res).toHaveLength(1);
    const first = res[0];
    expect(first).toBeDefined();
    expect(first?.id).toBe('com-coord');
  });
});
