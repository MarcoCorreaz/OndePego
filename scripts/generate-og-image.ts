import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const WIDTH = 1200;
const HEIGHT = 630;

// Paleta Oficial Onde Pego (src/styles/tokens.css)
const COLOR_BG: [number, number, number] = [247, 244, 238]; // #F7F4EE
const COLOR_SURFACE: [number, number, number] = [255, 255, 255]; // #FFFFFF
const COLOR_BRAND: [number, number, number] = [11, 61, 145]; // #0B3D91 (Azul SUS)
const COLOR_BRAND_TINT: [number, number, number] = [232, 238, 248]; // #E8EEF8
const COLOR_FREE: [number, number, number] = [14, 124, 58]; // #0E7C3A (Verde Farmácia Popular)
const COLOR_FREE_TINT: [number, number, number] = [230, 244, 234]; // #E6F4EA
const COLOR_TEXT: [number, number, number] = [31, 41, 51]; // #1F2933
const COLOR_BORDER: [number, number, number] = [218, 214, 205];

// Fonte bitmap 5x7 embutida para rasterizar tipografia legível no PNG sem dependências externas
const GLYPHS_5X7: Record<string, readonly string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '%': ['11001', '11010', '00100', '00100', '01011', '10011', '00000'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00100', '00100', '01000', '10000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function fillRect(
  raw: Buffer,
  x0: number,
  y0: number,
  w: number,
  h: number,
  color: [number, number, number],
): void {
  const stride = WIDTH * 3 + 1;
  const xEnd = Math.min(WIDTH, Math.max(0, x0 + w));
  const yEnd = Math.min(HEIGHT, Math.max(0, y0 + h));
  const xStart = Math.max(0, x0);
  const yStart = Math.max(0, y0);

  for (let y = yStart; y < yEnd; y++) {
    const rowOffset = y * stride + 1;
    for (let x = xStart; x < xEnd; x++) {
      const idx = rowOffset + x * 3;
      raw[idx] = color[0];
      raw[idx + 1] = color[1];
      raw[idx + 2] = color[2];
    }
  }
}

function drawBitmapText(
  raw: Buffer,
  text: string,
  xStart: number,
  yStart: number,
  scale: number,
  color: [number, number, number],
): void {
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  let cursorX = xStart;
  for (const ch of normalized) {
    const glyph = GLYPHS_5X7[ch] ?? GLYPHS_5X7[' ']!;
    for (let row = 0; row < glyph.length; row++) {
      const line = glyph[row]!;
      for (let col = 0; col < line.length; col++) {
        if (line[col] === '1') {
          fillRect(
            raw,
            cursorX + col * scale,
            yStart + row * scale,
            scale,
            scale,
            color,
          );
        }
      }
    }
    cursorX += 6 * scale;
  }
}

export function generateOgPngBuffer(): Buffer {
  const stride = WIDTH * 3 + 1;
  const raw = Buffer.alloc(stride * HEIGHT);

  for (let y = 0; y < HEIGHT; y++) {
    raw[y * stride] = 0;
  }

  // 1. Fundo papel quente (#F7F4EE)
  fillRect(raw, 0, 0, WIDTH, HEIGHT, COLOR_BG);

  // 2. Faixa superior institucional dupla (Azul SUS #0B3D91 + Verde Farmácia Popular #0E7C3A)
  fillRect(raw, 0, 0, WIDTH / 2, 16, COLOR_BRAND);
  fillRect(raw, WIDTH / 2, 0, WIDTH / 2, 16, COLOR_FREE);

  // 3. Moldura e Cartão Central Elevado (#FFFFFF)
  fillRect(raw, 48, 44, WIDTH - 96, HEIGHT - 88, COLOR_BORDER);
  fillRect(raw, 50, 46, WIDTH - 100, HEIGHT - 92, COLOR_SURFACE);

  // 4. Emblema da Cruz de Saúde (88x88)
  fillRect(raw, 96, 92, 88, 88, COLOR_BRAND);
  fillRect(raw, 130, 108, 20, 56, COLOR_SURFACE);
  fillRect(raw, 112, 126, 56, 20, COLOR_SURFACE);

  // 5. Tipografia rasterizada legível no cabeçalho do cartão
  drawBitmapText(raw, 'ONDE PEGO - CUIABA/MT', 212, 100, 6, COLOR_TEXT);
  drawBitmapText(
    raw,
    'CONSULTA PUBLICA DE MEDICAMENTOS: SUS E FARMACIA POPULAR',
    212,
    154,
    3,
    COLOR_BRAND,
  );

  // 6. Duas Placas Lado a Lado: SUS Cuiabá e Farmácia Popular
  // Placa Esquerda — SUS Cuiabá (REMUME)
  fillRect(raw, 96, 224, 486, 300, COLOR_BRAND_TINT);
  fillRect(raw, 96, 224, 486, 58, COLOR_BRAND);
  drawBitmapText(raw, 'SUS CUIABA (REMUME)', 124, 242, 3, COLOR_SURFACE);
  drawBitmapText(raw, 'POSTOS, POLICLINICAS E UPAS', 124, 316, 3, COLOR_TEXT);
  drawBitmapText(raw, 'DOCUMENTOS E ENDERECOS', 124, 360, 3, COLOR_BRAND);
  fillRect(raw, 124, 424, 320, 52, COLOR_BRAND);
  drawBitmapText(raw, 'CONFERIR NA LISTA', 148, 440, 3, COLOR_SURFACE);

  // Placa Direita — Programa Farmácia Popular
  fillRect(raw, 618, 224, 486, 300, COLOR_FREE_TINT);
  fillRect(raw, 618, 224, 486, 58, COLOR_FREE);
  drawBitmapText(raw, 'FARMACIA POPULAR', 646, 242, 3, COLOR_SURFACE);
  drawBitmapText(raw, '100% GRATUITO NAS CREDENCIADAS', 646, 316, 3, COLOR_TEXT);
  drawBitmapText(raw, 'POR BAIRRO EM CUIABA', 646, 360, 3, COLOR_FREE);
  fillRect(raw, 646, 424, 320, 52, COLOR_FREE);
  drawBitmapText(raw, 'VER DROGARIAS', 670, 440, 3, COLOR_SURFACE);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function generateOgSvgString(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="Onde Pego — Consulta pública de medicamentos em Cuiabá: SUS e Farmácia Popular">
  <rect width="1200" height="630" fill="#F7F4EE" />
  <rect x="0" y="0" width="600" height="16" fill="#0B3D91" />
  <rect x="600" y="0" width="600" height="16" fill="#0E7C3A" />
  <rect x="50" y="46" width="1100" height="538" rx="24" fill="#FFFFFF" stroke="#DAD6CD" stroke-width="2" />
  <rect x="96" y="92" width="88" height="88" rx="18" fill="#0B3D91" />
  <rect x="130" y="108" width="20" height="56" rx="4" fill="#FFFFFF" />
  <rect x="112" y="126" width="56" height="20" rx="4" fill="#FFFFFF" />
  <text x="212" y="138" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#1F2933">Onde Pego — Cuiabá/MT</text>
  <text x="212" y="176" font-family="system-ui, -apple-system, sans-serif" font-size="25" font-weight="700" fill="#0B3D91">Consulta pública de medicamentos em Cuiabá: SUS e Farmácia Popular</text>
  <rect x="96" y="224" width="486" height="300" rx="16" fill="#E8EEF8" />
  <rect x="96" y="224" width="486" height="58" rx="16" fill="#0B3D91" />
  <text x="124" y="262" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF">Nos Postos, Policlínicas e UPAs (SUS Cuiabá)</text>
  <text x="124" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" fill="#1F2933">Lista Municipal (REMUME)</text>
  <text x="124" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#4B5563">Documentos e unidades de retirada</text>
  <rect x="618" y="224" width="486" height="300" rx="16" fill="#E6F4EA" />
  <rect x="618" y="224" width="486" height="58" rx="16" fill="#0E7C3A" />
  <text x="646" y="262" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF">Nas Drogarias Credenciadas (Farmácia Popular)</text>
  <text x="646" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" fill="#1F2933">100% Gratuito nas Credenciadas</text>
  <text x="646" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#4B5563">Endereços por bairro em Cuiabá</text>
</svg>
`;
}

if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
) {
  const publicDir = path.resolve(process.cwd(), 'public');
  const pngPath = path.join(publicDir, 'og-image.png');
  const svgPath = path.join(publicDir, 'og-image.svg');
  fs.writeFileSync(pngPath, generateOgPngBuffer());
  fs.writeFileSync(svgPath, generateOgSvgString(), 'utf-8');
  console.log(`[og-image] Gerados ${pngPath} (1200x630 PNG com tipografia rasterizada) e ${svgPath}`);
}
