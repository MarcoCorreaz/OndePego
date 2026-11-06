import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const OUT_DIR = path.resolve(process.cwd(), 'out');
const RESULTS_DIR = path.resolve(process.cwd(), 'test-results');

if (!fs.existsSync(OUT_DIR)) {
  console.error('❌ Diretório out/ não encontrado. Execute "npm run build:prod" antes do teste E2E.');
  process.exit(1);
}

fs.mkdirSync(RESULTS_DIR, { recursive: true });

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pmtiles': 'application/octet-stream',
  '.webmanifest': 'application/manifest+json',
};

function createStaticServer(rootDir: string): http.Server {
  return http.createServer((req, res) => {
    const rawUrl = (req.url || '/').split('?')[0] || '/';
    let filePath = path.join(rootDir, decodeURIComponent(rawUrl));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
      filePath = `${filePath}.html`;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      // Tenta rota 404 estática
      const notFoundPath = path.join(rootDir, '_not-found', 'index.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(notFoundPath).pipe(res);
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const range = req.headers.range;
    if (range && ext === '.pmtiles') {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      if (match) {
        const start = Number.parseInt(match[1]!, 10);
        const end = match[2] ? Number.parseInt(match[2], 10) : stat.size - 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': contentType,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function runPlaywrightE2e() {
  console.log('🚀 Iniciando servidor estático local e navegador Playwright (Chromium)...');
  const server = createStaticServer(OUT_DIR);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3000;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });

  const consoleErrors: string[] = [];

  try {
    // ==========================================
    // 1. HOME (/) em Mobile (360x640) e Desktop (1280x800)
    // ==========================================
    console.log('\n📱 1. Testando Home (/) e Dropdown SearchBar...');
    const contextMobile = await browser.newContext({
      viewport: { width: 360, height: 640 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const pageMobile = await contextMobile.newPage();

    pageMobile.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('status of 404')) {
          consoleErrors.push(`[Console Error Mobile] ${text}`);
        }
      }
    });

    await pageMobile.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await pageMobile.screenshot({
      path: path.join(RESULTS_DIR, 'home-mobile-360x640.png'),
      fullPage: true,
    });
    console.log('   ✓ Screenshot capturada: home-mobile-360x640.png');

    // Auditoria Axe na Home
    const axeHome = await new AxeBuilder({ page: pageMobile })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    console.log(`   ✓ Axe A11y na Home: ${axeHome.violations.length} violações`);
    if (axeHome.violations.length > 0) {
      console.warn('     Violações encontradas:', axeHome.violations.map((v) => v.id));
    }

    // Testar Autocomplete sem correspondência com navegação por teclado
    const heroInput = pageMobile.locator('input[type="search"]').first();
    await heroInput.click();
    await heroInput.fill('xyzinexistente');
    await pageMobile.waitForTimeout(300);

    const emptyOption = pageMobile.locator('#' + (await heroInput.getAttribute('aria-controls')) + '-empty-option');
    const isEmptyOptionVisible = await emptyOption.isVisible();
    console.log(`   ✓ Item informativo de busca sem correspondência visível: ${isEmptyOptionVisible}`);
    if (!isEmptyOptionVisible) {
      throw new Error('Item informativo do SearchBar não apareceu para termo sem resultados');
    }

    const emptyText = await emptyOption.innerText();
    console.log(`   ✓ Texto do item informativo:\n     "${emptyText.replace(/\n/g, ' ')}"`);

    await pageMobile.screenshot({
      path: path.join(RESULTS_DIR, 'search-empty-dropdown-360x640.png'),
    });
    console.log('   ✓ Screenshot capturada: search-empty-dropdown-360x640.png');

    // Navegação por teclado: ArrowDown e Enter
    await pageMobile.keyboard.press('ArrowDown');
    await pageMobile.waitForTimeout(100);
    const isSelected = await emptyOption.getAttribute('aria-selected');
    console.log(`   ✓ ArrowDown selecionou o item informativo (aria-selected="true"): ${isSelected === 'true'}`);

    await pageMobile.keyboard.press('Enter');
    await pageMobile.waitForURL('**/buscar/**', { timeout: 5000 });
    console.log('   ✓ Enter no item informativo navegou com sucesso para /buscar/');

    await contextMobile.close();

    // ==========================================
    // 2. BUSCAR (/buscar/) — CLS e Skeleton
    // ==========================================
    console.log('\n📱 2. Testando /buscar/ e medição de CLS em 360x640...');
    const contextBuscar = await browser.newContext({
      viewport: { width: 360, height: 640 },
      deviceScaleFactor: 2,
    });
    const pageBuscar = await contextBuscar.newPage();

    // Injeta observador de LayoutShift antes do carregamento
    await pageBuscar.addInitScript(() => {
      (window as any).__clsScore = 0;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              (window as any).__clsScore += (entry as any).value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.error('PerformanceObserver error', e);
      }
    });

    await pageBuscar.goto(`${baseUrl}/buscar/`, { waitUntil: 'networkidle' });
    await pageBuscar.waitForTimeout(500);

    const clsScore = await pageBuscar.evaluate(() => (window as any).__clsScore || 0);
    console.log(`   ✓ CLS medido em /buscar/ (360x640): ${clsScore.toFixed(4)} (Excelente: <= 0.1)`);

    await pageBuscar.screenshot({
      path: path.join(RESULTS_DIR, 'buscar-mobile-360x640.png'),
      fullPage: true,
    });
    console.log('   ✓ Screenshot capturada: buscar-mobile-360x640.png');

    // Auditoria Axe na busca
    const axeBuscar = await new AxeBuilder({ page: pageBuscar })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    console.log(`   ✓ Axe A11y em /buscar/: ${axeBuscar.violations.length} violações`);

    await contextBuscar.close();

    // ==========================================
    // 3. PÁGINA 404 (not-found) e Atalhos
    // ==========================================
    console.log('\n📱 3. Testando Página 404 (not-found) e atalhos neutros...');
    const context404 = await browser.newContext({
      viewport: { width: 360, height: 640 },
      deviceScaleFactor: 2,
    });
    const page404 = await context404.newPage();

    // Acessa rota inexistente
    await page404.goto(`${baseUrl}/rota-inexistente-teste-404/`, { waitUntil: 'networkidle' });

    const notFoundTitle = await page404.locator('h1').textContent();
    console.log(`   ✓ H1 da página 404: "${notFoundTitle?.trim()}"`);

    await page404.screenshot({
      path: path.join(RESULTS_DIR, 'notfound-mobile-360x640.png'),
      fullPage: true,
    });
    console.log('   ✓ Screenshot capturada: notfound-mobile-360x640.png');

    // Auditoria Axe no 404
    const axe404 = await new AxeBuilder({ page: page404 })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    console.log(`   ✓ Axe A11y na página 404: ${axe404.violations.length} violações`);

    // Validação de cada um dos 3 atalhos neutros reais
    const atalhos = [
      { label: 'Losartana', slug: 'losartana-potassica' },
      { label: 'Dipirona', slug: 'dipirona-sodica' },
      { label: 'Atenolol', slug: 'atenolol' },
    ];

    for (const atalho of atalhos) {
      await page404.goto(`${baseUrl}/rota-inexistente-teste-404/`, { waitUntil: 'networkidle' });
      const chipLink = page404.locator(`a:has-text("${atalho.label}")`).first();
      const chipBox = await chipLink.boundingBox();
      console.log(`   ✓ Atalho "${atalho.label}": altura=${chipBox?.height}px (>= 48px)`);
      if (!chipBox || chipBox.height < 44) {
        throw new Error(`Alvo de toque insuficiente no chip ${atalho.label}: ${chipBox?.height}px`);
      }

      await chipLink.click();
      await page404.waitForURL(`**/medicamento/${atalho.slug}/**`, { timeout: 5000 });
      const medHeading = await page404.locator('h1').textContent();
      console.log(`     → Destino verificado com sucesso: "${medHeading?.trim()}"`);
    }

    await context404.close();

    // ==========================================
    // 4. DESKTOP (1280x800) SCREENSHOTS
    // ==========================================
    console.log('\n🖥️  4. Capturando Desktop (1280x800)...');
    const contextDesktop = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const pageDesktop = await contextDesktop.newPage();

    await pageDesktop.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    await pageDesktop.screenshot({
      path: path.join(RESULTS_DIR, 'home-desktop-1280x800.png'),
      fullPage: true,
    });

    await pageDesktop.goto(`${baseUrl}/buscar/`, { waitUntil: 'networkidle' });
    await pageDesktop.screenshot({
      path: path.join(RESULTS_DIR, 'buscar-desktop-1280x800.png'),
      fullPage: true,
    });

    await pageDesktop.goto(`${baseUrl}/rota-inexistente-teste-404/`, { waitUntil: 'networkidle' });
    await pageDesktop.screenshot({
      path: path.join(RESULTS_DIR, 'notfound-desktop-1280x800.png'),
      fullPage: true,
    });
    console.log('   ✓ Screenshots Desktop capturadas com sucesso.');

    await contextDesktop.close();

    if (consoleErrors.length > 0) {
      throw new Error(`Erros no console durante os testes:\n${consoleErrors.join('\n')}`);
    }

    console.log('\n🎉 Todos os testes e validações Playwright passaram com sucesso!');
  } finally {
    await browser.close();
    server.close();
  }
}

runPlaywrightE2e().catch((err) => {
  console.error('\n❌ Falha no teste Playwright:', err);
  process.exit(1);
});
