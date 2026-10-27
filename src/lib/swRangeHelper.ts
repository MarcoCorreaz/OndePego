export interface ParsedByteRange {
  start: number;
  end: number;
}

export interface SlicedRangeResult {
  status: 206 | 416;
  body: ArrayBuffer | null;
  headers: Record<string, string>;
}

/**
 * Determina se uma resposta HTTP pode ser armazenada com segurança na Cache API do navegador.
 * A Cache API nativa rejeita respostas `206 Partial Content` (`cache.put()` lança TypeError)
 * e também não deve armazenar respostas geradas para requisições com cabeçalho `Range`.
 */
export function canCacheResponse(
  responseStatus: number,
  requestHasRangeHeader: boolean,
): boolean {
  if (requestHasRangeHeader) {
    return false;
  }
  return responseStatus === 200;
}

/**
 * Interpreta um cabeçalho HTTP `Range: bytes=start-end` onde `end` é INCLUSIVO.
 * Limita `end` a `totalLength - 1`. Retorna `null` se o intervalo for inválido ou insatisfatório.
 */
export function parseHttpByteRange(
  rangeHeader: string | null | undefined,
  totalLength: number,
): ParsedByteRange | null {
  if (!rangeHeader || totalLength <= 0) {
    return null;
  }

  const trimmed = rangeHeader.trim();
  const match = /^bytes=(\d*)-(\d*)$/i.exec(trimmed);
  if (!match) {
    return null;
  }

  const rawStart = match[1] ?? '';
  const rawEnd = match[2] ?? '';

  if (rawStart === '' && rawEnd === '') {
    return null;
  }

  let start: number;
  let end: number;

  if (rawStart === '') {
    // Sufixo: bytes=-N (últimos N bytes)
    const suffixLength = Number.parseInt(rawEnd, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null;
    }
    start = Math.max(0, totalLength - suffixLength);
    end = totalLength - 1;
  } else {
    start = Number.parseInt(rawStart, 10);
    if (!Number.isFinite(start) || start < 0 || start >= totalLength) {
      return null;
    }
    if (rawEnd === '') {
      end = totalLength - 1;
    } else {
      const parsedEnd = Number.parseInt(rawEnd, 10);
      if (!Number.isFinite(parsedEnd) || parsedEnd < start) {
        return null;
      }
      end = Math.min(parsedEnd, totalLength - 1);
    }
  }

  return { start, end };
}

/**
 * Fatia um `ArrayBuffer` completo de acordo com o cabeçalho HTTP `Range: bytes=start-end`.
 * Nota crítica: no HTTP Range o índice `end` é INCLUSIVO, enquanto em `ArrayBuffer.prototype.slice(begin, end)`
 * o índice final é EXCLUSIVO. Portanto usamos `buffer.slice(start, end + 1)` e `byteCount = end - start + 1`.
 */
export function sliceArrayBufferForRange(
  buffer: ArrayBuffer,
  rangeHeader: string | null | undefined,
  contentType = 'application/vnd.pmtiles',
): SlicedRangeResult {
  const total = buffer.byteLength;
  const parsed = parseHttpByteRange(rangeHeader, total);

  if (!parsed) {
    return {
      status: 416,
      body: null,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes */${total}`,
      },
    };
  }

  const { start, end } = parsed;
  const sliced = buffer.slice(start, end + 1);
  const byteCount = end - start + 1;

  return {
    status: 206,
    body: sliced,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Type': contentType,
      'Content-Length': String(byteCount),
      'Content-Range': `bytes ${start}-${end}/${total}`,
    },
  };
}
