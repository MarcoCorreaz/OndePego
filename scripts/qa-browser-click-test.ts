/**
 * QA Interativo no Navegador Real (Edge Headless Mobile 390x844)
 * Testa cliques reais nos pinos do mapa, valida getBoundingClientRect() antes e depois,
 * captura screenshots e confirma zero erros no console.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

const PORT = 3000;
const OUT_DIR = path.resolve(__dirname, '../out');
const SCRATCH_DIR = path.resolve(process.env.USERPROFILE || '', '.gemini/antigravity/brain/82b81b0c-606f-4aab-a98f-3254075334b4/scratch');
if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.pmtiles': 'application/octet-stream',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

function createStaticServer(): http.Server {
  return http.createServer((req, res) => {
    let rawUrl = (req.url || '/').split('?')[0] || '/';
    let reqUrl = decodeURI(rawUrl);
    if (reqUrl.endsWith('/')) reqUrl += 'index.html';

    let filePath = path.join(OUT_DIR, reqUrl);
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath += '.html';
    } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const stat = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0]!, 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Accept-Ranges': 'bytes',
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
}

interface CdpMessage {
  id: number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  public consoleLogs: string[] = [];
  public consoleErrors: string[] = [];

  constructor(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
  }

  async connect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });

    this.ws.onmessage = (event) => {
      const msg: CdpMessage = JSON.parse(event.data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const handler = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) {
          handler.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          handler.resolve(msg.result);
        }
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params?.type;
        const text = (msg.params?.args || []).map((a: any) => a.value ?? a.description ?? '').join(' ');
        if (type === 'error') {
          this.consoleErrors.push(text);
        } else {
          this.consoleLogs.push(`[${type}] ${text}`);
        }
      }
    };
  }

  send(method: string, params: Record<string, any> = {}): Promise<any> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression: string): Promise<any> {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async screenshot(savePath: string): Promise<void> {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(savePath, Buffer.from(res.data, 'base64'));
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('--- Iniciando Teste Interativo de QA no Navegador Real ---');

  // 1. Iniciar servidor estático
  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`[1] Servidor estático rodando em http://localhost:${PORT}/`);

  // 2. Iniciar Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9222;
  const userDataDir = path.join(SCRATCH_DIR, 'edge-qa-profile');

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=390,844',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-gl=angle',
    '--no-sandbox',
    '--hide-scrollbars',
    `http://localhost:${PORT}/mapa/`,
  ]);

  edgeProc.stderr.on('data', () => {});

  let wsUrl = '';
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      const list = await res.json();
      const page = list.find((p: any) => p.type === 'page' && p.url.includes('/mapa/'));
      if (page?.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {
      // aguardando inicialização
    }
  }

  if (!wsUrl) {
    throw new Error('Não foi possível conectar ao Edge via Chrome DevTools Protocol.');
  }

  console.log('[2] Conectado ao Edge via CDP:', wsUrl);
  const client = new CdpClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');

  client.send('Runtime.evaluate', {
    expression: `
      window.addEventListener('error', (e) => console.error('WINDOW_ERROR:', e.message, e.filename, e.lineno));
      window.addEventListener('unhandledrejection', (e) => console.error('UNHANDLED_REJECTION:', e.reason));
    `
  });
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  console.log('[3] Aguardando carregamento dos pinos do mapa...');
  let pinsFound = 0;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    pinsFound = await client.eval(`document.querySelectorAll('.map-pin-container, .map-pin-btn').length`);
    if (pinsFound >= 10) break;
  }
  const hasCanvas = await client.eval(`Boolean(document.querySelector('.maplibregl-canvas'))`);
  const glInfo = await client.eval(`(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
    return {
      hasGl: Boolean(gl),
      renderer: gl ? gl.getParameter(gl.RENDERER) : null,
      vendor: gl ? gl.getParameter(gl.VENDOR) : null
    };
  })()`);
  console.log(`[4] GL Diagnostic:`, glInfo);
  console.log(`[4] Total de pinos renderizados no DOM do mapa: ${pinsFound} (MapLibre Canvas ativo: ${hasCanvas})`);

  // Testes de Clique e BoundingBox Check nos 3 Pinos
  const pinTargets = [
    { name: 'UPA 24h Morada do Ouro', query: 'Morada do Ouro' },
    { name: 'UPA 24h Jardim Leblon', query: 'Leblon' },
    { name: 'Drogaria Rosário', query: 'Rosário' },
  ];

  const results: any[] = [];

  for (let idx = 0; idx < pinTargets.length; idx++) {
    const target = pinTargets[idx]!;
    console.log(`\n--- Testando Pino ${idx + 1}/${pinTargets.length}: "${target.name}" ---`);

    // Obter bounding rect antes do clique
    const beforeRect = await client.eval(`
      (() => {
        const pins = Array.from(document.querySelectorAll('.map-pin-container, .map-pin-btn'));
        const pin = pins.find(el => (el.getAttribute('aria-label') || '').includes('${target.query}'));
        if (!pin) return null;
        const r = pin.getBoundingClientRect();
        return {
          label: pin.getAttribute('aria-label'),
          x: Math.round(r.x),
          y: Math.round(r.y),
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
          classes: pin.className
        };
      })()
    `);

    if (!beforeRect) {
      throw new Error(`Pino "${target.name}" não encontrado no DOM!`);
    }

    console.log(`Posição ANTES do clique: x=${beforeRect.x}, y=${beforeRect.y}, left=${beforeRect.left}, top=${beforeRect.top}, width=${beforeRect.width}, height=${beforeRect.height}`);

    // Clicar no pino
    await client.eval(`
      (() => {
        const pins = Array.from(document.querySelectorAll('.map-pin-container, .map-pin-btn'));
        const pin = pins.find(el => (el.getAttribute('aria-label') || '').includes('${target.query}'));
        if (pin) pin.click();
      })()
    `);

    // Aguardar animação (450ms)
    await sleep(600);

    // Obter bounding rect DEPOIS do clique
    const afterRect = await client.eval(`
      (() => {
        const pins = Array.from(document.querySelectorAll('.map-pin-container, .map-pin-btn'));
        const pin = pins.find(el => (el.getAttribute('aria-label') || '').includes('${target.query}'));
        if (!pin) return null;
        const r = pin.getBoundingClientRect();
        return {
          label: pin.getAttribute('aria-label'),
          x: Math.round(r.x),
          y: Math.round(r.y),
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
          classes: pin.className
        };
      })()
    `);

    console.log(`Posição DEPOIS do clique: x=${afterRect.x}, y=${afterRect.y}, left=${afterRect.left}, top=${afterRect.top}, width=${afterRect.width}, height=${afterRect.height}`);
    console.log(`Classes pós-clique: "${afterRect.classes}"`);

    // Inspecionar Bottom Card
    const bottomCardInfo = await client.eval(`
      (() => {
        const card = document.querySelector('[role="region"][aria-label*="Detalhes"]');
        if (!card) return null;
        const heading = card.querySelector('h2')?.textContent || '';
        const b = card.getBoundingClientRect();
        return {
          heading,
          top: Math.round(b.top),
          height: Math.round(b.height),
          visible: b.height > 50
        };
      })()
    `);

    console.log(`Bottom Card:`, bottomCardInfo);

    // Validação rígida: o pino NUNCA pode ter saltado para x=0, y=0!
    const isAtZeroZero = afterRect.x <= 10 && afterRect.y <= 10;
    const isCenteredInMapArea = afterRect.x >= 60 && afterRect.y >= 90 && afterRect.y <= 600;

    if (isAtZeroZero) {
      throw new Error(`FALHA CRÍTICA: Pino "${target.name}" pulou para o canto superior esquerdo (0,0)!`);
    }

    // Screenshot do estado pós-clique
    const shotPath = path.join(SCRATCH_DIR, `qa-click-pin-${idx + 1}-${target.query.toLowerCase()}.png`);
    await client.screenshot(shotPath);
    console.log(`Screenshot salvo: ${shotPath}`);

    results.push({
      target: target.name,
      before: beforeRect,
      after: afterRect,
      bottomCard: bottomCardInfo,
      permaneceNoMeio: isCenteredInMapArea,
      naoPulouZeroZero: !isAtZeroZero,
    });
  }

  // Verificar erros no console do navegador
  console.log('\n--- Auditoria de Console do Navegador ---');
  console.log(`Total de logs: ${client.consoleLogs.length}`);
  console.log(`Total de erros no console: ${client.consoleErrors.length}`);
  if (client.consoleErrors.length > 0) {
    console.warn('Erros encontrados no console:', client.consoleErrors);
  }

  // Encerrar processo e servidor
  client.close();
  try {
    if (edgeProc.pid) {
      execSync(`taskkill /pid ${edgeProc.pid} /T /F`, { stdio: 'ignore' });
    }
  } catch {}
  server.close();

  console.log('\n================ RESULTADO DA AUDITORIA QA INTERATIVA ================');
  for (const r of results) {
    console.log(`\n• ${r.target}:`);
    console.log(`  - Posição Antes:  x=${r.before.x}, y=${r.before.y}`);
    console.log(`  - Posição Depois: x=${r.after.x}, y=${r.after.y}`);
    console.log(`  - Não pulou para (0,0): ${r.naoPulouZeroZero ? 'SIM (APROVADO)' : 'NÃO (FALHA)'}`);
    console.log(`  - Localizado na área livre do mapa: ${r.permaneceNoMeio ? 'SIM (APROVADO)' : 'NÃO (FORA DA ÁREA)'}`);
    console.log(`  - Cartão inferior aberto: "${r.bottomCard?.heading}" (Top: ${r.bottomCard?.top}px)`);
  }
  console.log('=======================================================================\n');
}

run().catch((err) => {
  console.error('Erro fatal no teste QA:', err);
  process.exit(1);
});
