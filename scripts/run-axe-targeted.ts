import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const OUT_DIR = path.resolve(process.cwd(), 'out');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function createServer() {
  return http.createServer((req, res) => {
    const rawUrl = (req.url || '/').split('?')[0] || '/';
    let filePath = path.join(OUT_DIR, decodeURIComponent(rawUrl));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function run() {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
  const page = await context.newPage();

  console.log('--- TESTE AXE (A): Home com Dropdown Vazio Aberto ---');
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const searchInput = page.locator('input[type="search"]').first();
  await searchInput.click();
  await searchInput.fill('xyzinexistente');
  await page.waitForTimeout(400);

  const axeHomeDropdown = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  console.log(`Violações Axe na Home com Dropdown Vazio Aberto: ${axeHomeDropdown.violations.length}`);
  if (axeHomeDropdown.violations.length > 0) {
    for (const v of axeHomeDropdown.violations) {
      console.log(`  - [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nós)`);
      for (const node of v.nodes.slice(0, 2)) {
        console.log(`    Nó: ${node.html}`);
      }
    }
  }

  console.log('\n--- TESTE AXE (B): Página 404 Real do Export Estático (/404.html) ---');
  const url404 = `${baseUrl}/404.html`;
  console.log(`URL acessada: ${url404}`);
  await page.goto(url404, { waitUntil: 'networkidle' });

  const axe404 = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  console.log(`Violações Axe em /404.html: ${axe404.violations.length}`);
  if (axe404.violations.length > 0) {
    for (const v of axe404.violations) {
      console.log(`  - [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nós)`);
      for (const node of v.nodes.slice(0, 2)) {
        console.log(`    Nó: ${node.html}`);
      }
    }
  }

  await browser.close();
  server.close();
}

run().catch(console.error);
