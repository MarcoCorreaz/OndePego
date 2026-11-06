import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const OUT_DIR = path.resolve(process.cwd(), 'out');

if (!fs.existsSync(OUT_DIR)) {
  console.error('❌ Diretório out/ não encontrado. Execute "npm run build:prod" antes do teste E2E.');
  process.exit(1);
}

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
      // Tenta mapear o formato de prefetch RSC do Next.js (com pontos) para a estrutura de pastas gerada no build
      const rscMapped = filePath
        .replace(/__next\.([^\\/.]+)\.\$d\$slug\.__PAGE__\.txt$/, '__next.$1' + path.sep + '$d$slug' + path.sep + '__PAGE__.txt')
        .replace(/__next\.([^\\/.]+)\.__PAGE__\.txt$/, '__next.$1' + path.sep + '__PAGE__.txt');

      if (fs.existsSync(rscMapped) && fs.statSync(rscMapped).isFile()) {
        filePath = rscMapped;
      } else {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
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
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block',
  });

  const page = await context.newPage();
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignora avisos benignos de 404 em prefetch de navegação
      if (!text.includes('Failed to load resource') && !text.includes('status of 404')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[PageError] ${err.message}`);
  });

  try {
    // 1. Home (/) — Carregamento e Hero
    console.log('📱 1. Testando Home (/)');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    const homeTitle = await page.title();
    console.log(`   ✓ Título: "${homeTitle}"`);

    const heroSearch = page.locator('input[type="search"]').first();
    await heroSearch.click();
    await heroSearch.fill('losartana');
    await page.waitForTimeout(300);

    // Dropdown flutuante de autocomplete visível
    const autocompleteDropdown = page.locator('div[role="listbox"]').first();
    const isDropdownVisible = await autocompleteDropdown.isVisible();
    console.log(`   ✓ Dropdown autocomplete visível: ${isDropdownVisible}`);
    if (!isDropdownVisible) {
      throw new Error('Autocomplete não abriu no Hero da Home');
    }

    // 2. Navegação para /buscar/
    console.log('📱 2. Testando /buscar/');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/buscar/**', { timeout: 5000 });
    const buscarTitle = await page.title();
    console.log(`   ✓ Título da busca: "${buscarTitle}"`);

    // 3. Detalhe do medicamento /medicamento/losartana-potassica/
    console.log('📱 3. Testando /medicamento/losartana-potassica/');
    await page.goto(`${baseUrl}/medicamento/losartana-potassica/`, { waitUntil: 'networkidle' });
    const medTitle = await page.locator('h1').first().textContent();
    console.log(`   ✓ H1 do medicamento: "${medTitle?.trim()}"`);

    const via1Tag = await page.locator('#via1-heading-losartana-potassica').evaluate((el) => el.tagName);
    const via2Tag = await page.locator('#via2-heading-losartana-potassica').evaluate((el) => el.tagName);
    console.log(`   ✓ Hierarquia semântica: Placa 1 = ${via1Tag}, Placa 2 = ${via2Tag}`);
    if (via1Tag !== 'H2' || via2Tag !== 'H2') {
      throw new Error(`Esperado H2 nas placas, obtido: ${via1Tag}, ${via2Tag}`);
    }

    // 4. Mapa (/mapa/) — Alvos de toque (48px), Bottom Sheet e BoundingBox Check (Seção 10 GEMINI.md)
    console.log('📱 4. Testando /mapa/ (Interações, Alvos de Toque e BoundingBox)');
    await page.goto(`${baseUrl}/mapa/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const filterPill = page.locator('button', { hasText: 'Todos' }).first();
    const filterPillBox = await filterPill.boundingBox();
    console.log(`   ✓ Altura da pílula de filtro: ${filterPillBox?.height}px (>= 48px)`);
    if (!filterPillBox || filterPillBox.height < 48) {
      throw new Error(`Alvo de toque menor que 48px: ${filterPillBox?.height}px`);
    }

    // Abre a Bottom Sheet
    const openDrawerBtn = page.locator('button[aria-label="Abrir lista de unidades"]');
    await openDrawerBtn.click();
    await page.waitForTimeout(350);

    const initialDrawerCards = await page.locator('aside[aria-label="Lista de estabelecimentos no mapa"] article').count();
    console.log(`   ✓ Cards iniciais na gaveta: ${initialDrawerCards} (usePagedList)`);

    // Clica em "Mostrar mais"
    const showMoreBtn = page.getByTestId('bottom-sheet-show-more');
    if (await showMoreBtn.isVisible()) {
      await showMoreBtn.click();
      await page.waitForTimeout(200);
      const expandedCards = await page.locator('aside[aria-label="Lista de estabelecimentos no mapa"] article').count();
      console.log(`   ✓ Cards após "Mostrar mais": ${expandedCards}`);
    }

    // Busca UPA Morada do Ouro e clica em "Ver no mapa"
    const searchDrawer = page.locator('input[aria-label="Buscar unidade por nome, bairro ou rua"]');
    await searchDrawer.fill('Morada do Ouro');
    await page.waitForTimeout(300);
    const focusBtn = page.locator('button[aria-label^="Ver no mapa: UPA"]').first();
    await focusBtn.click();
    await page.waitForTimeout(800);

    // Valida o BoundingBox do pino selecionado
    const selectedPin = page.locator('.map-pin-selected').first();
    const pinBox = await selectedPin.boundingBox();
    console.log(`   ✓ BoundingBox do pino selecionado:`, pinBox);
    if (!pinBox || (pinBox.x === 0 && pinBox.y === 0) || pinBox.y < 60) {
      throw new Error(`Pino fora de posição segura: ${JSON.stringify(pinBox)}`);
    }

    // 5. Verificação de erros no console
    if (consoleErrors.length > 0) {
      throw new Error(`Erros no console do navegador:\n${consoleErrors.join('\n')}`);
    }

    console.log('\n🎉 Todos os testes Playwright no navegador foram concluídos com sucesso (0 erros)!');
  } finally {
    await browser.close();
    server.close();
  }
}

runPlaywrightE2e().catch((err) => {
  console.error('\n❌ Falha no teste Playwright:', err);
  process.exit(1);
});
