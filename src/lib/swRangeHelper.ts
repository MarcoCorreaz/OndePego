import { createRequire } from 'node:module';

export interface ParsedByteRange {
  start: number;
  end: number;
}

export interface SlicedRangeResult {
  status: 206 | 416;
  body: ArrayBuffer | null;
  headers: Record<string, string>;
}

interface SwRangeHelperModule {
  canCacheResponse: (
    responseStatus: number,
    requestHasRangeHeader: boolean,
  ) => boolean;
  parseHttpByteRange: (
    rangeHeader: string | null | undefined,
    totalLength: number,
  ) => ParsedByteRange | null;
  sliceArrayBufferForRange: (
    buffer: ArrayBuffer,
    rangeHeader: string | null | undefined,
    contentType?: string,
  ) => SlicedRangeResult;
}

const requireHelper = createRequire(import.meta.url);
const helper = requireHelper('../../public/sw-range-helper.js') as SwRangeHelperModule;

/**
 * Determina se uma resposta HTTP pode ser armazenada com segurança na Cache API do navegador.
 * Fonte única em `public/sw-range-helper.js`.
 */
export const canCacheResponse = helper.canCacheResponse;

/**
 * Interpreta um cabeçalho HTTP `Range: bytes=start-end` onde `end` é INCLUSIVO.
 * Fonte única em `public/sw-range-helper.js`.
 */
export const parseHttpByteRange = helper.parseHttpByteRange;

/**
 * Fatia um `ArrayBuffer` completo de acordo com o cabeçalho HTTP `Range: bytes=start-end`.
 * Fonte única em `public/sw-range-helper.js`.
 */
export const sliceArrayBufferForRange = helper.sliceArrayBufferForRange;
