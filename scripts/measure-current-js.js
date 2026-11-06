const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const html = fs.readFileSync('out/index.html', 'utf-8');
const scriptMatches = [...html.matchAll(/<script\b([^>]*)>/gi)];

let activeRaw = 0;
let activeGzip = 0;
let activeBrotli = 0;

let totalRaw = 0;
let totalGzip = 0;
let totalBrotli = 0;

console.log('--- Scripts em out/index.html ---');
for (const match of scriptMatches) {
  const attrs = match[1];
  const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
  if (!srcMatch) continue;
  const src = srcMatch[1];
  const isNoModule = /nomodule/i.test(attrs);

  const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
  const filePath = path.join('out', cleanSrc);
  if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    const raw = buf.length;
    const gzip = zlib.gzipSync(buf, { level: 9 }).length;
    const brotli = zlib.brotliCompressSync(buf).length;

    totalRaw += raw;
    totalGzip += gzip;
    totalBrotli += brotli;

    if (!isNoModule) {
      activeRaw += raw;
      activeGzip += gzip;
      activeBrotli += brotli;
    }

    console.log(`${isNoModule ? '[noModule] ' : '[Ativo]   '} ${src} => Raw: ${(raw/1024).toFixed(1)} KiB | Gzip: ${(gzip/1024).toFixed(1)} KiB | Brotli: ${(brotli/1024).toFixed(1)} KiB`);
  }
}

console.log('\n--- RESULTADO CONSOLIDADO ---');
console.log(`JS ATIVO: Raw = ${(activeRaw/1024).toFixed(1)} KiB (${activeRaw} B) | Gzip = ${(activeGzip/1024).toFixed(1)} KiB (${activeGzip} B) | Brotli = ${(activeBrotli/1024).toFixed(1)} KiB (${activeBrotli} B)`);
console.log(`JS TOTAL: Raw = ${(totalRaw/1024).toFixed(1)} KiB (${totalRaw} B) | Gzip = ${(totalGzip/1024).toFixed(1)} KiB (${totalGzip} B) | Brotli = ${(totalBrotli/1024).toFixed(1)} KiB (${totalBrotli} B)`);
