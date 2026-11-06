import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
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

async function measureClsForScenario(name: string, setupPageScript?: string) {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  // Throttling: CPU 4x e Rede Slow 4G (latência 400ms, 500kbps down/up)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 400,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (500 * 1024) / 8,
  });

  await page.addInitScript(() => {
    (window as any).__clsEntries = [];
    (window as any).__totalCls = 0;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            (window as any).__totalCls += (entry as any).value;
            (window as any).__clsEntries.push({
              value: (entry as any).value,
              sources: ((entry as any).sources || []).map((s: any) => ({
                node: s.node ? s.node.nodeName : 'unknown',
                currentRect: s.currentRect,
                previousRect: s.previousRect,
              })),
            });
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.error(e);
    }
  });

  if (setupPageScript) {
    await page.addInitScript(setupPageScript);
  }

  await page.goto(`${baseUrl}/buscar/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => ({
    totalCls: (window as any).__totalCls || 0,
    entries: (window as any).__clsEntries || [],
  }));

  await browser.close();
  server.close();

  return result;
}

async function run() {
  console.log('=== MEDIÇÃO EMPÍRICA DE CLS COM THROTTLING (CPU 4x + SLOW 4G) EM 360x640 ===\n');

  // 1. Cenário DEPOIS (Código Atual com SearchCardSkeletonList)
  console.log('--- 1. Cenário DEPOIS (Código Atual: SearchCardSkeletonList estrutural) ---');
  const depois = await measureClsForScenario('Depois');
  console.log(`CLS Total (Depois): ${depois.totalCls.toFixed(4)}`);
  console.log(`Shifts detectados: ${depois.entries.length}`);

  // 2. Cenário ANTES (Simulando o fallback antigo <p>Carregando busca...</p> substituído)
  console.log('\n--- 2. Cenário ANTES (Fallback antigo: <p>Carregando busca...</p> sem esqueleto) ---');
  const antesScript = `
    document.addEventListener('DOMContentLoaded', () => {
      // Injeta temporariamente o fallback antigo na raiz antes da montagem dos cards
      const main = document.getElementById('conteudo-principal');
      if (main) {
        const oldP = document.createElement('p');
        oldP.className = 'font-display text-xl font-bold';
        oldP.textContent = 'Carregando busca...';
        oldP.style.height = '28px';
        main.prepend(oldP);
        setTimeout(() => {
          oldP.remove();
        }, 350);
      }
    });
  `;
  const antes = await measureClsForScenario('Antes', antesScript);
  console.log(`CLS Total (Antes simulado): ${antes.totalCls.toFixed(4)}`);
  console.log(`Shifts detectados: ${antes.entries.length}`);

  console.log('\n=== RESUMO BRUTO ===');
  console.log(`Antes  (fallback texto simples): CLS = ${antes.totalCls.toFixed(4)}`);
  console.log(`Depois (SearchCardSkeletonList): CLS = ${depois.totalCls.toFixed(4)}`);
}

run().catch(console.error);
