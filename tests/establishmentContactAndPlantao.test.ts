import { describe, expect, it } from 'vitest';
import { sanitizePhoneNumber } from '@/components/ui/EstablishmentContactActions';
import { hasValidMapCoordinates } from '@/lib/geoEngine';
import type { Estabelecimento } from '@/types/schema';

describe('Sanitização de Telefone e Proteção de Coordenadas de Estabelecimento', () => {
  it('sanitizePhoneNumber formata corretamente números de Cuiabá/MT', () => {
    expect(sanitizePhoneNumber('(65) 3617-7300')).toBe('+556536177300');
    expect(sanitizePhoneNumber('65999998888')).toBe('+5565999998888');
    expect(sanitizePhoneNumber('0800 647 2424')).toBe('08006472424');
  });

  it('hasValidMapCoordinates rejeita estabelecimento marcado sem_localizacao ou com 0,0', () => {
    const unComSemLocalizacao: Estabelecimento = {
      id: 'upa-teste',
      nome_fantasia: 'UPA Teste',
      tipo: 'UPA',
      bairro: 'Centro',
      endereco_completo: 'Rua das Flores, 100, Centro, Cuiabá - MT',
      coordenadas: {
        lat: -15.6,
        lng: -56.1,
        auditado_manualmente: false,
        sem_localizacao: true,
      },
      atributos_operacionais: {
        status_funcionamento: 'NORMAL',
      },
    };

    expect(hasValidMapCoordinates(unComSemLocalizacao)).toBe(false);
  });
});
