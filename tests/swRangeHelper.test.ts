import { describe, expect, it } from 'vitest';
import {
  canCacheResponse,
  parseHttpByteRange,
  sliceArrayBufferForRange,
} from '@/lib/swRangeHelper';

describe('swRangeHelper — proteção Cache API contra 206 e corte exato de Range (.pmtiles)', () => {
  it('permite cache.put() apenas para status 200 sem cabeçalho Range e bloqueia 206 Partial Content', () => {
    expect(canCacheResponse(200, false)).toBe(true);
    expect(canCacheResponse(206, false)).toBe(false);
    expect(canCacheResponse(206, true)).toBe(false);
    expect(canCacheResponse(200, true)).toBe(false);
    expect(canCacheResponse(404, false)).toBe(false);
    expect(canCacheResponse(500, false)).toBe(false);
  });

  it('interpreta cabeçalhos HTTP Range com limite final INCLUSIVO e clamp em totalLength - 1', () => {
    expect(parseHttpByteRange('bytes=0-16383', 100000)).toEqual({
      start: 0,
      end: 16383,
    });

    // Quando end ultrapassa totalLength - 1, faz clamp para totalLength - 1
    expect(parseHttpByteRange('bytes=90-200', 100)).toEqual({
      start: 90,
      end: 99,
    });

    // Quando end é omitido (bytes=50-), vai até totalLength - 1
    expect(parseHttpByteRange('bytes=50-', 100)).toEqual({
      start: 50,
      end: 99,
    });

    // Sufixo bytes=-20 (últimos 20 bytes de 100 -> índices 80 a 99)
    expect(parseHttpByteRange('bytes=-20', 100)).toEqual({
      start: 80,
      end: 99,
    });

    // Intervalos inválidos retornam null
    expect(parseHttpByteRange('bytes=100-120', 100)).toBeNull();
    expect(parseHttpByteRange('bytes=50-20', 100)).toBeNull();
    expect(parseHttpByteRange('items=0-10', 100)).toBeNull();
  });

  it('fatia ArrayBuffer com buffer.slice(start, end + 1) e retorna contagem exata de bytes e cabeçalhos 206', () => {
    const totalLength = 256;
    const sourceBytes = new Uint8Array(totalLength);
    for (let i = 0; i < totalLength; i++) {
      sourceBytes[i] = i;
    }

    // Intervalo inclusivo: bytes=10-19 deve conter exatamente 10 bytes (índices 10..19)
    const result = sliceArrayBufferForRange(sourceBytes.buffer, 'bytes=10-19');

    expect(result.status).toBe(206);
    expect(result.body).not.toBeNull();
    expect(result.body!.byteLength).toBe(10);
    expect(result.headers['Accept-Ranges']).toBe('bytes');
    expect(result.headers['Content-Length']).toBe('10');
    expect(result.headers['Content-Range']).toBe('bytes 10-19/256');

    const slicedView = new Uint8Array(result.body!);
    expect(slicedView[0]).toBe(10);
    expect(slicedView[9]).toBe(19);
  });

  it('retorna 416 Range Not Satisfiable quando o intervalo está fora do tamanho do arquivo', () => {
    const buffer = new ArrayBuffer(64);
    const result = sliceArrayBufferForRange(buffer, 'bytes=64-127');

    expect(result.status).toBe(416);
    expect(result.body).toBeNull();
    expect(result.headers['Content-Range']).toBe('bytes */64');
  });
});
