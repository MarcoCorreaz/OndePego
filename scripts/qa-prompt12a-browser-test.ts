/**
 * QA Interativo no Navegador Real (Edge Headless Mobile 390x844 e 360x740)
 * Prompt 12A — Validação de Autocomplete Instantâneo na Home e Resultados no Topo em /buscar/
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

const PORT = 3006;
const OUT_DIR = path.resolve(__dirname, '../out');
const SCRATCH_DIR = path.resolve(
  process.env.USERPROFILE || '',
  '.gemini/antigravity/brain/82b81b0c-606f-4aab-a98f-3254075334b4/scratch',
);
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
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
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
  console.log('--- Iniciando Teste Interativo de QA (Prompt 12A) ---');

  // 1. Iniciar servidor estático
  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`[1] Servidor estático ativo em http://localhost:${PORT}/`);

  // 2. Iniciar Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9229;
  const userDataDir = path.join(SCRATCH_DIR, 'edge-qa-prompt12a-profile-clean');

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=390,844',
    '--no-sandbox',
    '--hide-scrollbars',
    `http://localhost:${PORT}/`,
  ]);

  let wsUrl = '';
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      const list = await res.json();
      const page = list.find((p: any) => p.type === 'page' && p.url.includes(`:${PORT}`));
      if (page?.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    throw new Error('Não foi possível conectar ao Edge via CDP.');
  }

  console.log('[2] Conectado ao Edge via CDP:', wsUrl);
  const client = new CdpClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  // ==========================================
  // TESTE 1: Home (390x844) - FreshnessBanner, Hero, Autocomplete Dropdown
  // ==========================================
  console.log('\n--- TESTE 1: Home (390x844) ---');
  await client.send('Page.navigate', { url: `http://localhost:${PORT}/` });
  await sleep(1000);

  // Silencia o banner de instalação PWA para inspecionar a interface normal do usuário
  await client.eval(`
    try {
      sessionStorage.setItem('onde_pego_install_dismissed_v1', '1');
      location.reload();
    } catch {}
  `);
  await sleep(1500);

  // 1.1 FreshnessBanner
  const freshnessBanner = await client.eval(`
    (() => {
      const b = document.querySelector('[aria-label="Datas das fontes oficiais"]');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { text: b.textContent?.trim(), height: Math.round(r.height), top: Math.round(r.top) };
    })()
  `);
  console.log('1.1 FreshnessBanner:', freshnessBanner);

  // 1.2 Vitrine dos Mais Procurados
  const showcaseCount = await client.eval(`
    document.querySelectorAll('section[aria-labelledby="mais-procurados-heading"] a').length
  `);
  console.log(`1.2 Vitrine dos Mais Procurados: ${showcaseCount} itens encontrados`);

  // 1.3 Digitar "los" no SearchBar
  console.log('1.3 Digitando "los" no campo de busca da Home...');
  await client.eval(`
    (() => {
      const input = document.querySelector('input[type="search"]');
      if (input) {
        input.focus();
        // Usar prototype setter para disparar reatividade do React
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        setter?.call(input, 'los');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()
  `);
  await sleep(600);

  // 1.4 Inspecionar dropdown de sugestões
  const dropdownInfo = await client.eval(`
    (() => {
      const listbox = document.querySelector('[role="listbox"]');
      if (!listbox) return null;
      const r = listbox.getBoundingClientRect();
      const hero = document.querySelector('section[aria-label="Consulta de medicamentos"]');
      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const options = Array.from(listbox.querySelectorAll('[role="option"]')).map(el => el.textContent?.trim());
      const seeAllBtn = listbox.querySelector('button');
      return {
        visible: r.height > 50,
        rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) },
        heroBottom: heroRect ? Math.round(heroRect.bottom) : null,
        optionsCount: options.length,
        options,
        hasSeeAllButton: Boolean(seeAllBtn),
        seeAllText: seeAllBtn?.textContent?.trim()
      };
    })()
  `);
  console.log('1.4 Dropdown de Sugestões:', dropdownInfo);

  // Screenshot do Autocomplete aberto
  const shotHomePath = path.join(SCRATCH_DIR, 'qa-prompt12a-home-autocomplete-390.png');
  await client.screenshot(shotHomePath);
  console.log(`Screenshot salvo: ${shotHomePath}`);

  // ==========================================
  // TESTE 2: Home em Viewport Pequeno (360x740)
  // ==========================================
  console.log('\n--- TESTE 2: Home (360x740) ---');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 740,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await sleep(600);

  const banner360 = await client.eval(`
    (() => {
      const b = document.querySelector('[aria-label="Datas das fontes oficiais"]');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { height: Math.round(r.height), top: Math.round(r.top) };
    })()
  `);
  console.log('2.1 FreshnessBanner em 360px:', banner360);

  const shotHome360Path = path.join(SCRATCH_DIR, 'qa-prompt12a-home-360.png');
  await client.screenshot(shotHome360Path);
  console.log(`Screenshot salvo: ${shotHome360Path}`);

  // ==========================================
  // TESTE 3: Página /buscar/ (390x844) com Busca Ativa
  // ==========================================
  console.log('\n--- TESTE 3: /buscar/ com busca ativa (390x844) ---');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await client.send('Page.navigate', { url: `http://localhost:${PORT}/buscar/` });
  await sleep(1500);

  // Digitar "losartana"
  console.log('3.1 Digitando "losartana" na página de busca...');
  await client.eval(`
    (() => {
      const input = document.querySelector('input[type="search"]');
      if (input) {
        input.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        setter?.call(input, 'losartana');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        window.scrollTo(0, 0);
      }
    })()
  `);
  await sleep(800);

  // Inspecionar barra de busca compacta e primeiro cartão de resultado
  const buscarMetrics = await client.eval(`
    (() => {
      window.scrollTo(0, 0);
      const searchInput = document.querySelector('input[type="search"]');
      const searchContainer =
        searchInput?.closest('div[class*="h-[56px]"]') ||
        searchInput?.closest('div[class*="h-14"]') ||
        searchInput?.closest('div.relative.flex');
      const searchRect = searchContainer ? searchContainer.getBoundingClientRect() : null;

      const firstCard = document.querySelector('section[aria-label="Resultados da busca"] article');
      const cardRect = firstCard ? firstCard.getBoundingClientRect() : null;

      const resultHeading = document.querySelector('[role="status"]');
      const headingRect = resultHeading ? resultHeading.getBoundingClientRect() : null;

      return {
        compactBar: {
          exists: Boolean(searchContainer),
          height: searchRect ? Math.round(searchRect.height) : null,
          top: searchRect ? Math.round(searchRect.top) : null
        },
        resultHeading: {
          text: resultHeading?.textContent?.trim(),
          top: headingRect ? Math.round(headingRect.top) : null
        },
        firstCard: {
          exists: Boolean(firstCard),
          top: cardRect ? Math.round(cardRect.top) : null,
          height: cardRect ? Math.round(cardRect.height) : null
        }
      };
    })()
  `);
  console.log('3.2 Métricas de /buscar/ ativa:', buscarMetrics);

  const shotBuscarPath = path.join(SCRATCH_DIR, 'qa-prompt12a-buscar-compact-390.png');
  await client.screenshot(shotBuscarPath);
  console.log(`Screenshot salvo: ${shotBuscarPath}`);

  // Auditoria de Console
  console.log('\n--- Auditoria de Console ---');
  console.log(`Total de logs: ${client.consoleLogs.length}`);
  console.log(`Total de erros: ${client.consoleErrors.length}`);
  if (client.consoleErrors.length > 0) {
    console.error('Erros no console:', client.consoleErrors);
  }

  // Encerrar processos
  client.close();
  try {
    if (edgeProc.pid) {
      execSync(`taskkill /pid ${edgeProc.pid} /T /F`, { stdio: 'ignore' });
    }
  } catch {}
  server.close();

  // Validações
  console.log('\n================ RESULTADOS FINAIS PROMPT 12A ================');
  const bannerOk = banner360 && banner360.height <= 48;
  console.log(`• FreshnessBanner em 1 linha (360px): ${bannerOk ? 'APROVADO' : 'FALHA'} (Altura: ${banner360?.height}px)`);

  const showcaseOk = showcaseCount === 6;
  console.log(`• Vitrine com 6 medicamentos reais: ${showcaseOk ? 'APROVADO' : 'FALHA'} (${showcaseCount}/6)`);

  const dropdownOk = dropdownInfo && dropdownInfo.visible && dropdownInfo.optionsCount >= 1;
  console.log(`• Autocomplete instantâneo flutuante aberto: ${dropdownOk ? 'APROVADO' : 'FALHA'}`);

  const compactOk = buscarMetrics?.compactBar?.exists && buscarMetrics.compactBar.height <= 58;
  console.log(`• Barra compacta de 56px ativa em /buscar/: ${compactOk ? 'APROVADO' : 'FALHA'} (Altura: ${buscarMetrics?.compactBar?.height}px)`);

  const foldOk = buscarMetrics?.firstCard?.top !== null && buscarMetrics.firstCard.top < 320;
  console.log(`• Primeiro resultado acima da dobra (top < 320px): ${foldOk ? 'APROVADO' : 'FALHA'} (Top: ${buscarMetrics?.firstCard?.top}px)`);

  const consoleOk = client.consoleErrors.length === 0;
  console.log(`• Zero erros no console: ${consoleOk ? 'APROVADO' : 'FALHA'} (${client.consoleErrors.length} erros)`);
  console.log('==============================================================\n');

  if (!bannerOk || !showcaseOk || !dropdownOk || !compactOk || !foldOk || !consoleOk) {
    throw new Error('Falha em uma ou mais validações do Prompt 12A!');
  }
}

run().catch((err) => {
  console.error('Erro fatal no teste QA:', err);
  process.exit(1);
});
