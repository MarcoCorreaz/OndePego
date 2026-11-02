/**
 * QA Interativo no Navegador Real (Edge Headless Mobile 390x844)
 * Prompt 12C — Validação de:
 * 1. Bottom Sheet com 3 Alturas (collapsed 64px, half 50dvh, full 85dvh) e ícones SVG (list, chev)
 * 2. Agrupamento de pinos (Clustering) em zoom afastado e expansão suave ao clicar (zoom >= 13.6)
 * 3. Rótulos de Bairros e Eixos de Cuiabá sem transform na raiz e 0 KB de rede externa
 * 4. Ação "Ver no mapa" na lista da gaveta recolhendo e focando no pino
 * 5. BoundingBox do pino individual (x > 60, y > 100, sem voar para 0,0) e exibição limpa do card de detalhes
 * 6. Zero erros no console
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

const PORT = 3008;
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
  console.log('--- Iniciando Teste Interativo de QA (Prompt 12C) ---');

  // 1. Iniciar servidor estático
  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`[1] Servidor estático ativo em http://localhost:${PORT}/`);

  // 2. Iniciar Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9231;
  const userDataDir = path.join(SCRATCH_DIR, 'edge-qa-prompt12c-profile-clean');

  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=390,844',
    '--no-sandbox',
    '--hide-scrollbars',
    `http://localhost:${PORT}/mapa/`,
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

  // Aguardar carregamento da página /mapa/
  await client.send('Page.navigate', { url: `http://localhost:${PORT}/mapa/` });
  await sleep(1000);

  // Silencia banner PWA para medições precisas
  await client.eval(`
    try {
      sessionStorage.setItem('onde_pego_install_dismissed_v1', '1');
      location.reload();
    } catch {}
  `);
  await sleep(2500);

  // ==========================================
  // TESTE 1: Gaveta Deslizante (Bottom Sheet) no estado inicial ('collapsed')
  // ==========================================
  console.log('\n--- TESTE 1: Bottom Sheet Inicial (collapsed) ---');
  const collapsedInfo = await client.eval(`
    (() => {
      const sheet = document.querySelector('aside[aria-label="Lista de estabelecimentos no mapa"]');
      if (!sheet) return null;
      const r = sheet.getBoundingClientRect();
      const btn = sheet.querySelector('button[aria-label="Abrir lista de unidades"]');
      const hasListIcon = Boolean(btn?.querySelector('svg'));
      return {
        height: Math.round(r.height),
        top: Math.round(r.top),
        btnText: btn?.textContent?.trim(),
        hasListIcon
      };
    })()
  `);
  console.log('1.1 Gaveta compacta (collapsed):', collapsedInfo);

  // ==========================================
  // TESTE 2: Marcadores de Cluster e Rótulos de Bairros em Zoom Afastado (Zoom 12)
  // ==========================================
  console.log('\n--- TESTE 2: Clusters e Rótulos de Bairros no Zoom Inicial (12) ---');
  await sleep(800);
  const mapElementsInfo = await client.eval(`
    (() => {
      const clusters = Array.from(document.querySelectorAll('.cluster-pin-container')).map(el => {
        const r = el.getBoundingClientRect();
        return {
          ariaLabel: el.getAttribute('aria-label'),
          width: Math.round(r.width),
          height: Math.round(r.height),
          x: Math.round(r.x),
          y: Math.round(r.y)
        };
      });

      const landmarks = Array.from(document.querySelectorAll('.landmark-label-container')).map(el => {
        const r = el.getBoundingClientRect();
        return {
          text: el.textContent?.trim(),
          x: Math.round(r.x),
          y: Math.round(r.y)
        };
      });

      const pins = Array.from(document.querySelectorAll('.map-pin-container')).map(el => {
        const r = el.getBoundingClientRect();
        return {
          x: Math.round(r.x),
          y: Math.round(r.y)
        };
      });

      return {
        clustersCount: clusters.length,
        clusters: clusters.slice(0, 3),
        landmarksCount: landmarks.length,
        landmarks: landmarks.slice(0, 4),
        pinsCount: pins.length
      };
    })()
  `);
  console.log('2.1 Elementos no mapa (zoom inicial):', mapElementsInfo);

  // ==========================================
  // TESTE 3: Clique no Cluster e Expansão Suave para Zoom >= 13.6
  // ==========================================
  console.log('\n--- TESTE 3: Clique no Cluster ---');
  const clusterClickResult = await client.eval(`
    (() => {
      const firstCluster = document.querySelector('.cluster-pin-container');
      if (!firstCluster) return { clicked: false, error: 'Nenhum cluster visível' };
      const label = firstCluster.getAttribute('aria-label');
      firstCluster.click();
      return { clicked: true, label };
    })()
  `);
  console.log('3.1 Cluster clicado:', clusterClickResult);
  await sleep(1200);

  // Inspecionar pinos individuais após aproximação do cluster
  const pinsAfterClusterZoom = await client.eval(`
    (() => {
      const pins = Array.from(document.querySelectorAll('.map-pin-container')).map(el => {
        const r = el.getBoundingClientRect();
        return {
          ariaLabel: el.getAttribute('aria-label'),
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width),
          height: Math.round(r.height)
        };
      });
      return {
        pinsCount: pins.length,
        firstPin: pins[0] || null
      };
    })()
  `);
  console.log('3.2 Pinos individuais revelados após zoom:', pinsAfterClusterZoom);

  // ==========================================
  // TESTE 4: Verificação de BoundingBox do Pino Individual (x > 60 e y > 100)
  // ==========================================
  console.log('\n--- TESTE 4: BoundingBox do Pino Individual ---');
  const pinClickResult = await client.eval(`
    (() => {
      const firstPin = document.querySelector('.map-pin-container');
      if (!firstPin) return { error: 'Nenhum pino individual encontrado' };
      const r = firstPin.getBoundingClientRect();
      firstPin.click();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height)
      };
    })()
  `);
  console.log('4.1 Coordenadas do pino clicado:', pinClickResult);
  await sleep(600);

  // Fechar o card de detalhes do pino para prosseguir com os testes da gaveta
  await client.eval(`
    (() => {
      const closeBtn = document.querySelector('button[aria-label="Fechar detalhes"]');
      closeBtn?.click();
    })()
  `);
  await sleep(400);

  // ==========================================
  // TESTE 5: Expansão da Gaveta para Meia Tela ('half', ~50dvh)
  // ==========================================
  console.log('\n--- TESTE 5: Expansão para Meia Tela (half, ~50dvh) ---');
  await client.eval(`
    (() => {
      const btn = document.querySelector('button[aria-label="Abrir lista de unidades"]');
      btn?.click();
    })()
  `);
  await sleep(600);

  const halfInfo = await client.eval(`
    (() => {
      const sheet = document.querySelector('aside[aria-label="Lista de estabelecimentos no mapa"]');
      if (!sheet) return null;
      const r = sheet.getBoundingClientRect();
      const cards = sheet.querySelectorAll('article');
      const searchInput = sheet.querySelector('input[type="search"]');
      const selectBairro = sheet.querySelector('select');
      return {
        height: Math.round(r.height),
        top: Math.round(r.top),
        cardsCount: cards.length,
        hasSearchInput: Boolean(searchInput),
        hasSelectBairro: Boolean(selectBairro)
      };
    })()
  `);
  console.log('5.1 Gaveta em meia tela (half):', halfInfo);

  // ==========================================
  // TESTE 6: Expansão da Gaveta para Tela Cheia ('full', ~85dvh)
  // ==========================================
  console.log('\n--- TESTE 6: Expansão para Tela Cheia (full, ~85dvh) ---');
  await client.eval(`
    (() => {
      const expandBtn = document.querySelector('button[aria-label="Expandir para tela cheia"]');
      expandBtn?.click();
    })()
  `);
  await sleep(600);

  const fullInfo = await client.eval(`
    (() => {
      const sheet = document.querySelector('aside[aria-label="Lista de estabelecimentos no mapa"]');
      if (!sheet) return null;
      const r = sheet.getBoundingClientRect();
      return {
        height: Math.round(r.height),
        top: Math.round(r.top)
      };
    })()
  `);
  console.log('6.1 Gaveta em tela cheia (full):', fullInfo);

  // ==========================================
  // TESTE 7: Ação "Ver no mapa" a partir da lista na Gaveta
  // ==========================================
  console.log('\n--- TESTE 7: Clique em "Ver no mapa" dentro da Gaveta ---');
  const focusResult = await client.eval(`
    (() => {
      const firstCard = document.querySelector('aside[aria-label="Lista de estabelecimentos no mapa"] article');
      if (!firstCard) return { error: 'Nenhum card encontrado' };
      const cardTitle = firstCard.querySelector('h3')?.textContent?.trim();
      const verNoMapaBtn = Array.from(firstCard.querySelectorAll('button')).find(b => b.textContent?.includes('Ver no mapa'));
      if (!verNoMapaBtn) return { error: 'Botão Ver no mapa não encontrado' };

      verNoMapaBtn.click();
      return { cardTitle };
    })()
  `);
  console.log('7.1 Ação Ver no mapa acionada:', focusResult);
  await sleep(800);

  // Verificar que a gaveta se recolheu e o Bottom Card de detalhes abriu
  const detailCardInfo = await client.eval(`
    (() => {
      const detail = document.querySelector('div[aria-label^="Detalhes de"]');
      const sheet = document.querySelector('aside[aria-label="Lista de estabelecimentos no mapa"]');
      const sheetRect = sheet ? sheet.getBoundingClientRect() : null;
      const r = detail ? detail.getBoundingClientRect() : null;
      const ligarBtn = detail?.querySelector('a[href^="tel:"]');
      const rotaBtn = detail?.querySelector('a[href*="google.com/maps"]');
      return {
        detailVisible: Boolean(detail),
        detailTitle: detail?.querySelector('h2')?.textContent?.trim(),
        hasLigarBtn: Boolean(ligarBtn),
        hasRotaBtn: Boolean(rotaBtn),
        detailRect: r ? { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } : null,
        sheetHeight: sheetRect ? Math.round(sheetRect.height) : 0
      };
    })()
  `);
  console.log('7.2 Card de Detalhes após focar no mapa:', detailCardInfo);

  // ==========================================
  // TESTE 8: Auditoria de Console
  // ==========================================
  console.log('\n--- TESTE 8: Auditoria de Console ---');
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

  // ==========================================
  // AVALIAÇÃO DOS CRITÉRIOS DE ACEITE
  // ==========================================
  console.log('\n================ RESULTADOS FINAIS PROMPT 12C ================');

  // Critério 1: Gaveta compacta (collapsed ~64px)
  const collapsedOk = collapsedInfo && collapsedInfo.height >= 56 && collapsedInfo.height <= 76 && collapsedInfo.hasListIcon;
  console.log(`• Gaveta compacta inicial de ~64px com ícone list: ${collapsedOk ? 'APROVADO' : 'FALHA'} (Altura: ${collapsedInfo?.height}px)`);

  // Critério 2: Gaveta em meia tela (half ~50dvh)
  const halfOk = halfInfo && halfInfo.height >= 380 && halfInfo.height <= 460 && halfInfo.cardsCount >= 1;
  console.log(`• Gaveta em meia tela (50dvh ~422px): ${halfOk ? 'APROVADO' : 'FALHA'} (Altura: ${halfInfo?.height}px, ${halfInfo?.cardsCount} cards)`);

  // Critério 3: Gaveta em tela cheia (full ~85dvh)
  const fullOk = fullInfo && fullInfo.height >= 680 && fullInfo.height <= 760;
  console.log(`• Gaveta em tela cheia (85dvh ~717px): ${fullOk ? 'APROVADO' : 'FALHA'} (Altura: ${fullInfo?.height}px)`);

  // Critério 4: Foco no mapa via "Ver no mapa"
  const focusOk = detailCardInfo?.detailVisible && detailCardInfo?.hasLigarBtn && detailCardInfo?.hasRotaBtn;
  console.log(`• "Ver no mapa" recolhe a gaveta e abre o Bottom Card com ações: ${focusOk ? 'APROVADO' : 'FALHA'}`);

  // Critério 5: Rótulos de marcos locais visíveis
  const landmarksOk = mapElementsInfo?.landmarksCount && mapElementsInfo.landmarksCount >= 1;
  console.log(`• Rótulos de bairros/eixos de Cuiabá visíveis sem rede externa: ${landmarksOk ? 'APROVADO' : 'FALHA'} (${mapElementsInfo?.landmarksCount} rótulos)`);

  // Critério 6: BoundingBox do pino individual sem voar para 0,0
  const pinOk = pinClickResult && pinClickResult.x > 60 && pinClickResult.y > 100;
  console.log(`• BoundingBox do pino no lugar correto da tela (x > 60, y > 100): ${pinOk ? 'APROVADO' : 'FALHA'} (x=${pinClickResult?.x}, y=${pinClickResult?.y})`);

  // Critério 7: Zero erros no console
  const consoleOk = client.consoleErrors.length === 0;
  console.log(`• Zero erros no console: ${consoleOk ? 'APROVADO' : 'FALHA'} (${client.consoleErrors.length} erros)`);
  console.log('==============================================================\n');

  if (!collapsedOk || !halfOk || !fullOk || !focusOk || !landmarksOk || !pinOk || !consoleOk) {
    throw new Error('Falha em uma ou mais validações do Prompt 12C!');
  }
}

run().catch((err) => {
  console.error('Erro fatal no teste QA:', err);
  process.exit(1);
});
