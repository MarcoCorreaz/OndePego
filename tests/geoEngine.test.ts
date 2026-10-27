import { describe, expect, it } from 'vitest';
import {
  calcularDistanciaKm,
  formatarDistancia,
  gerarUrlRotaGoogleMaps,
  gerarUrlTransportePublicoOpcional,
  listarBairrosUnicos,
  ordenarEstabelecimentosPorBairro,
  ordenarEstabelecimentosPorDistancia,
} from '@/lib/geoEngine';
import type { Estabelecimento } from '@/types/schema';

const FIXTURE_ESTABS: Estabelecimento[] = [
  {
    id: 'estab-centro-fixture',
    nome_fantasia: 'FARMACIA_TESTE_CENTRO',
    tipo: 'FARMACIA_POPULAR',
    bairro: 'Centro Norte',
    endereco_completo: 'ENDERECO_TESTE_CENTRO, 100',
    coordenadas: {
      lat: -15.5989,
      lng: -56.0949,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      credenciamento_pfpb_ativo: true,
      status_funcionamento: 'NORMAL',
    },
    __fixture: true,
  },
  {
    id: 'estab-coxipo-fixture',
    nome_fantasia: 'FARMACIA_TESTE_COXIPO',
    tipo: 'FARMACIA_POPULAR',
    bairro: 'Coxipó',
    endereco_completo: 'ENDERECO_TESTE_COXIPO, 200',
    coordenadas: {
      lat: -15.632,
      lng: -56.045,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      credenciamento_pfpb_ativo: true,
      status_funcionamento: 'NORMAL',
    },
    __fixture: true,
  },
  {
    id: 'estab-vg-fixture',
    nome_fantasia: 'FARMACIA_TESTE_VG',
    tipo: 'FARMACIA_POPULAR',
    bairro: 'Centro Sul (VG)',
    endereco_completo: 'ENDERECO_TESTE_VG, 300',
    coordenadas: {
      lat: -15.6467,
      lng: -56.1325,
      auditado_manualmente: true,
    },
    atributos_operacionais: {
      credenciamento_pfpb_ativo: true,
      status_funcionamento: 'NORMAL',
    },
    __fixture: true,
  },
];

describe('Motor geográfico local (src/lib/geoEngine.ts)', () => {
  it('calcula distância zero para a mesma coordenada e distância Haversine coerente em Cuiabá/VG', () => {
    const centroCuiaba = { lat: -15.5989, lng: -56.0949 };
    expect(calcularDistanciaKm(centroCuiaba, centroCuiaba)).toBe(0);

    // Centro de Cuiabá até Coxipó (~6,5 km em linha reta)
    const distCoxipo = calcularDistanciaKm(centroCuiaba, { lat: -15.632, lng: -56.045 });
    expect(distCoxipo).toBeGreaterThan(5);
    expect(distCoxipo).toBeLessThan(8);
  });

  it('formata distâncias abaixo de 1 km em metros e >= 1 km em km com vírgula decimal', () => {
    expect(formatarDistancia(0.45)).toBe('450 m');
    expect(formatarDistancia(2.38)).toBe('2,4 km');
  });

  it('ordena estabelecimentos por proximidade da coordenada do usuário', () => {
    const usuarioPertoDoCoxipo = { lat: -15.63, lng: -56.046 };
    const ordenados = ordenarEstabelecimentosPorDistancia(FIXTURE_ESTABS, usuarioPertoDoCoxipo);

    expect(ordenados[0]?.estabelecimento.id).toBe('estab-coxipo-fixture');
    expect(ordenados[1]?.estabelecimento.id).toBe('estab-centro-fixture');
    expect(ordenados[2]?.estabelecimento.id).toBe('estab-vg-fixture');
  });

  it('filtra por bairro ignorando acentos/caixa e lista bairros únicos ordenados', () => {
    const filtrados = ordenarEstabelecimentosPorBairro(FIXTURE_ESTABS, 'coxipo');
    expect(filtrados).toHaveLength(1);
    expect(filtrados[0]?.id).toBe('estab-coxipo-fixture');

    const bairros = listarBairrosUnicos(FIXTURE_ESTABS);
    expect(bairros).toEqual(['Centro Norte', 'Centro Sul (VG)', 'Coxipó']);
  });

  it('gera URL universal de rota do Google Maps sem chave de API e link complementar pontoos.com.br', () => {
    const url = gerarUrlRotaGoogleMaps({ lat: -15.5989, lng: -56.0949 });
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-15.5989%2C-56.0949');
    expect(url.includes('key=')).toBe(false);
    expect(gerarUrlTransportePublicoOpcional()).toBe('https://pontoos.com.br');
  });
});
