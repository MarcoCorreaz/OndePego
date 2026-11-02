/**
 * QA Interativo no Navegador Real (Edge Headless Mobile 390x844 e 360x740)
 * Prompt 12B — Validação de:
 * 1. BottomNav com 4 Abas consolidadas (Buscar, Mapa, Receita, Plantão)
 * 2. Sticky Action Bar em /medicamento/[slug]/ (Minha Receita, Locais no mapa, WhatsApp)
 * 3. Badge dinâmico de Minha Receita na BottomNav após clique
 * 4. Scroll suave até #onde-buscar pelo botão "Locais no mapa"
 * 5. Layout com pb-40 para desobstrução total do rodapé
 * 6. Suporte a data-font-scale="xlarge" em tela estreita (360px)
 * 7. Zero erros no console
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

const PORT = 3007;
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
  console.log('--- Iniciando Teste Interativo de QA (Prompt 12B) ---');

  // 1. Iniciar servidor estático
  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`[1] Servidor estático ativo em http://localhost:${PORT}/`);

  // 2. Iniciar Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9230;
  const userDataDir = path.join(SCRATCH_DIR, 'edge-qa-prompt12b-profile-clean');

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
  // TESTE 1: BottomNav Consolidada para 4 Abas (390x844)
  // ==========================================
  console.log('\n--- TESTE 1: BottomNav (390x844) ---');
  await client.send('Page.navigate', { url: `http://localhost:${PORT}/` });
  await sleep(1000);

  // Silencia banner PWA para medições precisas
  await client.eval(`
    try {
      sessionStorage.setItem('onde_pego_install_dismissed_v1', '1');
      location.reload();
    } catch {}
  `);
  await sleep(1500);

  const bottomNavInfo = await client.eval(`
    (() => {
      const nav = document.querySelector('nav[aria-label="Navegação principal"]');
      if (!nav) return null;
      const navRect = nav.getBoundingClientRect();
      const links = Array.from(nav.querySelectorAll('a'));
      const items = links.map(link => {
        const r = link.getBoundingClientRect();
        const label = link.querySelector('span:not([aria-hidden="true"])')?.textContent?.trim() || link.textContent?.trim();
        const ariaLabel = link.getAttribute('aria-label');
        return {
          href: link.getAttribute('href'),
          label,
          ariaLabel,
          width: Math.round(r.width),
          height: Math.round(r.height),
          left: Math.round(r.left),
          top: Math.round(r.top)
        };
      });
      return {
        navHeight: Math.round(navRect.height),
        navTop: Math.round(navRect.top),
        itemsCount: items.length,
        items
      };
    })()
  `);
  console.log('1.1 Métricas da BottomNav (4 abas):', bottomNavInfo);

  const shotNavPath = path.join(SCRATCH_DIR, 'qa-prompt12b-bottomnav-390.png');
  await client.screenshot(shotNavPath);
  console.log(`Screenshot salvo: ${shotNavPath}`);

  // ==========================================
  // TESTE 2: BottomNav com Fonte Máxima (xlarge) em Viewport Pequeno (360x740)
  // ==========================================
  console.log('\n--- TESTE 2: BottomNav com data-font-scale="xlarge" (360x740) ---');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 740,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await client.eval(`
    document.documentElement.setAttribute('data-font-scale', 'xlarge');
  `);
  await sleep(500);

  const nav360Info = await client.eval(`
    (() => {
      const nav = document.querySelector('nav[aria-label="Navegação principal"]');
      if (!nav) return null;
      const navRect = nav.getBoundingClientRect();
      const links = Array.from(nav.querySelectorAll('a'));
      const items = links.map(link => {
        const r = link.getBoundingClientRect();
        const textSpan = link.querySelector('span.text-xs, span.leading-tight');
        const isWrapping = textSpan ? textSpan.getClientRects().length > 1 : false;
        return {
          width: Math.round(r.width),
          height: Math.round(r.height),
          isWrapping
        };
      });
      return {
        navHeight: Math.round(navRect.height),
        items
      };
    })()
  `);
  console.log('2.1 BottomNav em 360px com fonte xlarge:', nav360Info);

  const shotNav360Path = path.join(SCRATCH_DIR, 'qa-prompt12b-bottomnav-xlarge-360.png');
  await client.screenshot(shotNav360Path);
  console.log(`Screenshot salvo: ${shotNav360Path}`);

  // Restaurar escala padrão e viewport 390x844
  await client.eval(`document.documentElement.removeAttribute('data-font-scale');`);
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await sleep(300);

  // ==========================================
  // TESTE 3: Detalhe do Medicamento /medicamento/losartana-potassica/ e Sticky Action Bar
  // ==========================================
  console.log('\n--- TESTE 3: Medicamento Losartana Potássica e Sticky Action Bar (390x844) ---');
  await client.send('Page.navigate', { url: `http://localhost:${PORT}/medicamento/losartana-potassica/` });
  await sleep(1500);

  // 3.1 Posição e dimensões da MedicationStickyBar
  const stickyBarInfo = await client.eval(`
    (() => {
      const bar = document.querySelector('[aria-label="Ações rápidas do medicamento"]');
      if (!bar) return null;
      const r = bar.getBoundingClientRect();
      const buttons = Array.from(bar.querySelectorAll('button, a')).map(el => {
        const btnRect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim(),
          width: Math.round(btnRect.width),
          height: Math.round(btnRect.height),
          top: Math.round(btnRect.top)
        };
      });

      const nav = document.querySelector('nav[aria-label="Navegação principal"]');
      const navRect = nav ? nav.getBoundingClientRect() : null;

      return {
        exists: true,
        rect: {
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width),
          height: Math.round(r.height),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom)
        },
        bottomNavTop: navRect ? Math.round(navRect.top) : null,
        buttonsCount: buttons.length,
        buttons
      };
    })()
  `);
  console.log('3.1 Dimensões e Botões da Sticky Bar:', stickyBarInfo);

  const shotDetailPath = path.join(SCRATCH_DIR, 'qa-prompt12b-detail-sticky-390.png');
  await client.screenshot(shotDetailPath);
  console.log(`Screenshot salvo: ${shotDetailPath}`);

  // ==========================================
  // TESTE 4: Interação de Adicionar à Receita e Atualização Dinâmica do Badge
  // ==========================================
  console.log('\\n--- TESTE 4: Clique em "＋ Minha Receita" ---');
  const toggleRecipeResult = await client.eval(`
    (() => {
      const bar = document.querySelector('[aria-label="Ações rápidas do medicamento"]');
      if (!bar) return { error: 'Sticky bar não encontrada' };
      const addBtn = bar.querySelector('button');
      if (!addBtn) return { error: 'Botão de receita não encontrado' };

      const textBefore = addBtn.textContent?.trim();
      addBtn.click();
      return { textBefore };
    })()
  `);
  console.log('4.1 Ação de clique executada:', toggleRecipeResult);
  await sleep(500);

  const recipeStateAfter = await client.eval(`
    (() => {
      const bar = document.querySelector('[aria-label="Ações rápidas do medicamento"]');
      const addBtn = bar?.querySelector('button');
      const textAfter = addBtn?.textContent?.trim();
      const isSaved = addBtn?.getAttribute('data-saved') === 'true';

      // Verificar badge na BottomNav
      const nav = document.querySelector('nav[aria-label="Navegação principal"]');
      const receitaLink = nav?.querySelector('a[href="/minha-receita/"]');
      const badge = receitaLink?.querySelector('span.rounded-full');
      const badgeText = badge?.textContent?.trim();

      return {
        textAfter,
        isSaved,
        badgeFound: Boolean(badge),
        badgeText
      };
    })()
  `);
  console.log('4.2 Estado após adicionar à receita:', recipeStateAfter);

  const shotAddedPath = path.join(SCRATCH_DIR, 'qa-prompt12b-detail-recipe-added-390.png');
  await client.screenshot(shotAddedPath);
  console.log(`Screenshot salvo: ${shotAddedPath}`);

  // ==========================================
  // TESTE 5: Clique no Botão "Locais no mapa" e Scroll até #onde-buscar
  // ==========================================
  console.log('\\n--- TESTE 5: Clique em "Locais no mapa" e Scroll suave ---');
  const scrollBefore = await client.eval(`window.scrollY`);
  console.log(`5.1 Scroll Y inicial: ${scrollBefore}px`);

  await client.eval(`
    (() => {
      const bar = document.querySelector('[aria-label="Ações rápidas do medicamento"]');
      const buttons = bar?.querySelectorAll('button');
      // O segundo botão é "Locais no mapa"
      if (buttons && buttons.length >= 2) {
        buttons[1].click();
      }
    })()
  `);
  await sleep(800);

  const scrollAfter = await client.eval(`
    (() => {
      const ondeBuscar = document.getElementById('onde-buscar');
      const targetRect = ondeBuscar ? ondeBuscar.getBoundingClientRect() : null;
      return {
        scrollY: window.scrollY,
        targetFound: Boolean(ondeBuscar),
        targetTop: targetRect ? Math.round(targetRect.top) : null
      };
    })()
  `);
  console.log('5.2 Scroll Y e posição de #onde-buscar após clique:', scrollAfter);

  // ==========================================
  // TESTE 6: Desobstrução do Rodapé com pb-40
  // ==========================================
  console.log('\\n--- TESTE 6: Desobstrução do Rodapé com pb-40 ---');
  await client.eval(`window.scrollTo(0, document.body.scrollHeight);`);
  await sleep(500);

  const footerClearance = await client.eval(`
    (() => {
      const bar = document.querySelector('[aria-label="Ações rápidas do medicamento"]');
      const barRect = bar?.getBoundingClientRect();
      const footer = document.querySelector('footer');
      const footerRect = footer?.getBoundingClientRect();
      const mainContainer = document.querySelector('main > div.pb-40') || document.querySelector('div.pb-40');

      return {
        hasPb40Class: Boolean(mainContainer),
        stickyBarTop: barRect ? Math.round(barRect.top) : null,
        footerBottom: footerRect ? Math.round(footerRect.bottom) : null,
        footerVisibleAboveSticky: footerRect && barRect ? Math.round(barRect.top - footerRect.bottom) : null
      };
    })()
  `);
  console.log('6.1 Desobstrução do Rodapé:', footerClearance);

  // ==========================================
  // TESTE 7: Auditoria de Console
  // ==========================================
  console.log('\n--- TESTE 7: Auditoria de Console ---');
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
  console.log('\n================ RESULTADOS FINAIS PROMPT 12B ================');

  // Critério 1: BottomNav com 4 abas
  const count4Ok = bottomNavInfo?.itemsCount === 4;
  console.log(`• BottomNav com exatamente 4 abas: ${count4Ok ? 'APROVADO' : 'FALHA'} (${bottomNavInfo?.itemsCount}/4)`);

  const widthOk = bottomNavInfo?.items.every((it: any) => it.width >= 85);
  console.log(`• Largura por aba >= 85px em 390px: ${widthOk ? 'APROVADO' : 'FALHA'} (Larguras: ${bottomNavInfo?.items.map((i: any) => i.width + 'px').join(', ')})`);

  // Critério 2: Sem quebra de linha em 360px com xlarge
  const xlargeOk = nav360Info?.items.every((it: any) => !it.isWrapping);
  console.log(`• Rótulos de 1 palavra sem quebra em 360px xlarge: ${xlargeOk ? 'APROVADO' : 'FALHA'}`);

  // Critério 3: Sticky Bar presente e posicionada acima da BottomNav (bottom: 74px)
  const stickyExists = Boolean(stickyBarInfo?.exists && stickyBarInfo.buttonsCount >= 3);
  console.log(`• MedicationStickyBar presente com 3 botões: ${stickyExists ? 'APROVADO' : 'FALHA'}`);

  const stickyPositionOk = stickyBarInfo?.rect && stickyBarInfo.rect.height >= 56 && stickyBarInfo.rect.height <= 78;
  console.log(`• Altura da Sticky Bar entre 56px e 78px: ${stickyPositionOk ? 'APROVADO' : 'FALHA'} (${stickyBarInfo?.rect?.height}px)`);

  // Critério 4: Toggle Minha Receita e Badge
  const recipeToggleOk = recipeStateAfter?.textAfter?.includes('Na Receita') && recipeStateAfter?.badgeText === '1';
  console.log(`• Adição à Receita reflete texto ("✓ Na Receita") e badge na BottomNav ("1"): ${recipeToggleOk ? 'APROVADO' : 'FALHA'}`);

  // Critério 5: Scroll suave para #onde-buscar
  const scrollOk = scrollAfter?.targetFound && scrollAfter.scrollY > scrollBefore;
  console.log(`• Botão "Locais no mapa" rola suavemente para #onde-buscar: ${scrollOk ? 'APROVADO' : 'FALHA'} (Scroll: ${scrollBefore} -> ${scrollAfter?.scrollY}px)`);

  // Critério 6: Desobstrução pb-40
  const pb40Ok = footerClearance?.hasPb40Class;
  console.log(`• Container com pb-40 para desobstrução: ${pb40Ok ? 'APROVADO' : 'FALHA'}`);

  // Critério 7: Console limpo
  const consoleOk = client.consoleErrors.length === 0;
  console.log(`• Zero erros no console: ${consoleOk ? 'APROVADO' : 'FALHA'} (${client.consoleErrors.length} erros)`);
  console.log('==============================================================\n');

  if (!count4Ok || !widthOk || !xlargeOk || !stickyExists || !stickyPositionOk || !recipeToggleOk || !scrollOk || !pb40Ok || !consoleOk) {
    throw new Error('Falha em uma ou mais validações do Prompt 12B!');
  }
}

run().catch((err) => {
  console.error('Erro fatal no teste QA:', err);
  process.exit(1);
});
