import { describe, expect, it } from 'vitest';
import {
  extractNumericTokens,
  normalizePTBR,
  parseMedicationQuery,
  uniqueNormalizedKeys,
} from '@/lib/normalize';

describe('normalizePTBR e chaves de normalização (DAS Seção 8)', () => {
  it('converte ç para s ANTES do NFD, inclusive quando a entrada vem decomposta (NFD)', () => {
    const nfc = 'cabeça';
    const nfd = 'cabe\u0063\u0327a'; // c + combining cedilla

    expect(normalizePTBR(nfc)).toBe('cabesa');
    expect(normalizePTBR(nfd)).toBe('cabesa');
  });

  it('gera duas chaves (ç→s e ç→c) para suportar quem omite a cedilha no celular', () => {
    const keys = uniqueNormalizedKeys('açúcar');
    expect(keys).toEqual(['asucar', 'acucar']);

    // Quem digita "acucar" sem cedilha gera ["acucar"], que bate com a segunda chave de "açúcar"
    const typedWithoutCedilla = uniqueNormalizedKeys('acucar');
    expect(typedWithoutCedilla).toEqual(['acucar']);
    expect(keys.some((k) => typedWithoutCedilla.includes(k))).toBe(true);
  });

  it('aplica todas as regras fonéticas na ordem especificada (ph→f, y→i, ch→x, ss→s, z→s, c[ei]→s)', () => {
    expect(normalizePTBR('Pharmácia')).toBe('farmasia');
    expect(normalizePTBR('Dypirona')).toBe('dipirona');
    expect(normalizePTBR('Chá de Xarope')).toBe('xa de xarope');
    expect(normalizePTBR('Pressão')).toBe('presao');
    expect(normalizePTBR('Azitromicina')).toBe('asitromisina');
    expect(normalizePTBR('Ciprofloxacino')).toBe('siprofloxasino');
  });

  it('remove caracteres não alfanuméricos e colapsa espaços múltiplos', () => {
    expect(normalizePTBR('  Losartana   Potássica  (50mg) - 1º item! ')).toBe(
      'losartana potasica 50mg 1 item',
    );
  });

  it('extrai tokens numéricos exatos sem colisão de substring e separa nome base da dosagem', () => {
    expect(extractNumericTokens('500 mg / 250 mcg')).toEqual(['500', '250']);
    expect(extractNumericTokens('500 mg').includes('50')).toBe(false);

    const parsed = parseMedicationQuery('Metformina 850mg');
    expect(parsed.baseNameNormalized).toBe('metformina');
    expect(parsed.dosageNumbers).toEqual(['850']);
  });
});
