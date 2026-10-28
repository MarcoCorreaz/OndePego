/**
 * Fonte única de verdade para proteção de cache e fatiamento HTTP Range (.pmtiles).
 * Carregado pelo Service Worker (`public/sw.js`) via `importScripts('/sw-range-helper.js')`
 * e reexportado com tipagem estrita por `src/lib/swRangeHelper.ts`.
 */
(function (root) {
  function canCacheResponse(responseStatus, requestHasRangeHeader) {
    if (requestHasRangeHeader) {
      return false;
    }
    return responseStatus === 200;
  }

  function parseHttpByteRange(rangeHeader, totalLength) {
    if (!rangeHeader || totalLength <= 0) {
      return null;
    }

    const trimmed = String(rangeHeader).trim();
    const match = /^bytes=(\d*)-(\d*)$/i.exec(trimmed);
    if (!match) {
      return null;
    }

    const rawStart = match[1] || '';
    const rawEnd = match[2] || '';

    if (rawStart === '' && rawEnd === '') {
      return null;
    }

    let start;
    let end;

    if (rawStart === '') {
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

  function sliceArrayBufferForRange(buffer, rangeHeader, contentType) {
    const resolvedType = contentType || 'application/vnd.pmtiles';
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

    const start = parsed.start;
    const end = parsed.end;
    const sliced = buffer.slice(start, end + 1);
    const byteCount = end - start + 1;

    return {
      status: 206,
      body: sliced,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Type': resolvedType,
        'Content-Length': String(byteCount),
        'Content-Range': `bytes ${start}-${end}/${total}`,
      },
    };
  }

  const api = {
    canCacheResponse,
    parseHttpByteRange,
    sliceArrayBufferForRange,
  };

  root.__ondePegoSwRangeHelper = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : self);
