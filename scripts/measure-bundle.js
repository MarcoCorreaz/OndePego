const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const htmlPath = path.join(__dirname, '..', 'out', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Match only script tags
const regex = /<script\s+([^>]*?)src=["'](\/_next\/static\/[^"']+\.js)["']([^>]*?)>/g;
const modernScripts = [];
const legacyScripts = [];
let match;

while ((match = regex.exec(html)) !== null) {
  const fullAttrs = `${match[1]} ${match[3]}`.toLowerCase();
  const isNoModule = fullAttrs.includes('nomodule');
  const entry = { src: match[2], isNoModule, tag: match[0] };
  if (isNoModule) {
    legacyScripts.push(entry);
  } else {
    modernScripts.push(entry);
  }
}

function measureGroup(title, scripts) {
  console.log(`\n=== ${title} ===`);
  let raw = 0, gz = 0, br = 0;
  for (const s of scripts) {
    const relPath = s.src.replace(/^\//, '').replace(/\//g, path.sep);
    const fullPath = path.join(__dirname, '..', 'out', relPath);
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath);
      const r = data.length;
      const g = zlib.gzipSync(data).length;
      const b = zlib.brotliCompressSync(data).length;
      raw += r;
      gz += g;
      br += b;
      console.log(` - ${path.basename(fullPath)}: ${(r/1024).toFixed(1)} KB (gz: ${(g/1024).toFixed(1)} KB, br: ${(b/1024).toFixed(1)} KB)`);
    }
  }
  console.log(`TOTAL: ${(raw/1024).toFixed(1)} KB raw | ${(gz/1024).toFixed(1)} KB Gzip | ${(br/1024).toFixed(1)} KB Brotli`);
  return { raw, gz, br };
}

const modernTotals = measureGroup('MODERN BROWSERS (Active Production Payload on /)', modernScripts);
const legacyTotals = measureGroup('LEGACY BROWSERS ONLY (nomodule polyfills)', legacyScripts);

console.log('\n============================================================');
const modernGzipKb = modernTotals.gz / 1024;
const modernBrotliKb = modernTotals.br / 1024;
console.log(`ACTIVE JS BUNDLE FOR MODERN BROWSERS: ${modernGzipKb.toFixed(1)} KB Gzip (${modernBrotliKb.toFixed(1)} KB Brotli)`);
console.log(`BUDGET THRESHOLD: <= 150.0 KB Gzip`);
if (modernGzipKb <= 150.0) {
  console.log(`VERDICT: ✅ PASS (Complies with GEMINI.md Section 7: ${modernGzipKb.toFixed(1)} KB <= 150 KB)`);
} else {
  console.log(`VERDICT: ❌ OVER BUDGET (${modernGzipKb.toFixed(1)} KB > 150 KB)`);
}
