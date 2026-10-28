# Medição Auditada de Baseline JS — Rota Inicial (`/`)

**Data da auditoria:** 27/10/2026  
**Ambiente:** Node.js `v22.21.0`, `next@16.4.3` (Turbopack, `output: 'export'`, `trailingSlash: true`), `react@19.3.1`, `react-dom@19.3.1`, `typescript@7.0.2`.

---

## 1. Objetivo e Metodologia

Separar o custo fixo do runtime do **Next.js 16 (App Router) + React 19** do peso líquido real do código do **Onde Pego** na rota inicial (`/`).

### Método de medição
1. Foi criado, em diretório temporário externo ao repositório, um projeto Next.js mínimo (`next-baseline-temp`) com as **mesmas versões** de `next` (`~16.4.3`), `react` (`~19.3.1`) e `react-dom` (`~19.3.1`), configurado com `output: 'export'` e `trailingSlash: true`, contendo apenas:
   - `src/app/layout.tsx`: `<html><body>{children}</body></html>`
   - `src/app/page.tsx`: `<main>Baseline</main>`
2. Executou-se `next build` em ambos os projetos e extraiu-se a lista de tags `<script src="...">` presentes em `out/index.html`.
3. Para cada arquivo `.js` referenciado em `out/index.html`, mediu-se:
   - **Raw**: tamanho em bytes descomprimido;
   - **Gzip**: `zlib.gzipSync(buffer, { level: 9 }).length`;
   - **Brotli**: `zlib.brotliCompressSync(buffer).length` (qualidade padrão máxima do Node.js, equivalente à entrega estática no Cloudflare Pages / Vercel).
4. Separou-se a contagem em:
   - **JS Ativo (Navegadores Modernos)**: todos os chunks executados de fato pelo navegador (exclui o chunk `<script noModule>` de polyfills legados, que navegadores compatíveis com ES Modules ignoram completamente).
   - **JS Total em `<script src>`**: soma bruta incluindo o chunk `noModule`.

*(Nota: na tabela abaixo, `1 KiB = 1.024 bytes`).*

---

## 2. Resumo Comparativo (Baseline vs. Onde Pego na Rota `/`)

### 2.1. JS Ativo (executado pelo navegador — sem `noModule`)

| Métrica | Baseline Next.js 16 + React 19 Vazio | Onde Pego Atual (`/`) | Diferença Líquida (Código Onde Pego) | Participação do Runtime Base |
|---|---:|---:|---:|---:|
| **Bytes (Raw)** | 456.526 B (445,8 KiB) | 484.433 B (473,1 KiB) | **+27.907 B (+27,3 KiB)** | 94,2% |
| **Gzip (nível 9)** | 135.049 B (**131,9 KiB**) | 144.348 B (**141,0 KiB**) | **+9.299 B (+9,1 KiB)** | 93,6% |
| **Brotli** | 115.367 B (**112,7 KiB**) | 123.983 B (**121,1 KiB**) | **+8.616 B (+8,4 KiB)** | **93,1%** |

### 2.2. JS Total listado no HTML (incluindo o polyfill `<script noModule>`)

| Métrica | Baseline Next.js 16 + React 19 Vazio | Onde Pego Atual (`/`) | Diferença Líquida |
|---|---:|---:|---:|
| **Bytes (Raw)** | 569.120 B (555,8 KiB) | 597.027 B (583,0 KiB) | +27.907 B (+27,3 KiB) |
| **Gzip (nível 9)** | 174.569 B (170,5 KiB) | 183.868 B (179,6 KiB) | +9.299 B (+9,1 KiB) |
| **Brotli** | 150.525 B (147,0 KiB) | 159.141 B (155,4 KiB) | +8.616 B (+8,4 KiB) |

---

## 3. Composição Detalhada por Chunk

### 3.1. Projeto Baseline Vazio (`next@16.4.3` + `react@19.3.1`)

| Chunk (`out/index.html`) | Tipo | Raw (KiB) | Gzip (KiB) | Brotli (KiB) | Papel identificado |
|---|---|---:|---:|---:|---|
| `/_next/static/chunks/3wbm-994r45kr.js` | Ativo | 224,4 KiB | 70,1 KiB | 60,0 KiB | Runtime React 19 DOM Client (`react-dom/client` + Scheduler) |
| `/_next/static/chunks/08xcn3jnivpa8.js` | Ativo | 181,6 KiB | 48,7 KiB | 41,0 KiB | Runtime Next.js App Router (hidratação RSC, roteador cliente) |
| `/_next/static/chunks/3cfn99dbrcvvp.js` | Ativo | 16,5 KiB | 5,8 KiB | 5,1 KiB | Bootstrapper do cliente Next.js |
| `/_next/static/chunks/0umf92h1sb77c.js` | Ativo | 13,5 KiB | 3,4 KiB | 3,1 KiB | Auxiliares de layout/erro padrão do App Router |
| `/_next/static/chunks/turbopack-3-ry682tkyiqk.js` | Ativo | 9,8 KiB | 3,8 KiB | 3,4 KiB | Carregador de módulos do Turbopack |
| **Subtotal Ativo (Baseline)** | **Ativo** | **445,8 KiB** | **131,9 KiB** | **112,7 KiB** | **Piso incomprimível do framework** |
| `/_next/static/chunks/0cz1d0mv5g_q7.js` | `noModule` | 110,0 KiB | 38,6 KiB | 34,3 KiB | Polyfills para navegadores pré-ES6 (ignorado por celulares modernos) |

### 3.2. Onde Pego — Rota Inicial (`/`)

| Chunk (`out/index.html`) | Tipo | Raw (KiB) | Gzip (KiB) | Brotli (KiB) | Papel identificado |
|---|---|---:|---:|---:|---|
| `/_next/static/chunks/3wbm-994r45kr.js` | Ativo | 224,4 KiB | 70,1 KiB | 60,0 KiB | Runtime React 19 DOM Client (idêntico ao baseline) |
| `/_next/static/chunks/2h24jchpao8b0.js` | Ativo | 160,6 KiB | 44,4 KiB | 37,6 KiB | Runtime Next.js App Router |
| `/_next/static/chunks/308t-eo6v2ihy.js` | Ativo | 37,1 KiB | 10,6 KiB | 9,5 KiB | Layout Raiz (`AccessibilityProvider`, `AccessibilityPanel`, `AppHeader`, `BottomNav`, `PwaStatusBanner`, `SearchSessionProvider`) |
| `/_next/static/chunks/2n86e7h60o0qo.js` | Ativo | 32,4 KiB | 8,6 KiB | 7,6 KiB | `next/link` + navegação compartilhada do App Router |
| `/_next/static/chunks/turbopack-3-ry682tkyiqk.js` | Ativo | 9,8 KiB | 3,8 KiB | 3,4 KiB | Carregador de módulos do Turbopack (idêntico ao baseline) |
| `/_next/static/chunks/1x6obpmlu1_c2.js` | Ativo | 5,2 KiB | 1,9 KiB | 1,6 KiB | Bootstrapper da página inicial |
| `/_next/static/chunks/0ns7kl7plw_75.js` | Ativo | 3,6 KiB | 1,5 KiB | 1,3 KiB | Componentes da tela `/` (`SearchBar`, `ShortcutChips`, `FreshnessBanner`) |
| **Subtotal Ativo (Onde Pego `/`)** | **Ativo** | **473,1 KiB** | **141,0 KiB** | **121,1 KiB** | **`hasMaplibre=false`, `hasFuse=false` no caminho síncrono** |
| `/_next/static/chunks/0cz1d0mv5g_q7.js` | `noModule` | 110,0 KiB | 38,6 KiB | 34,3 KiB | Polyfills `noModule` (idêntico ao baseline) |

---

## 4. Conclusões e Recomendação de Meta de Orçamento

1. **O código próprio do Onde Pego na rota `/` pesa apenas `8,4 KiB` em Brotli (`9,1 KiB` em Gzip)**:
   - Isso foi alcançado mantendo:
     - `maplibre-gl` e `pmtiles` 100% isolados em `LazyEstablishmentMap` via `next/dynamic(..., { ssr: false })`;
     - `fuse.js` carregado de forma assíncrona após a hidratação dentro do `SearchSessionProvider`;
     - `motion` (`LazyMotion` + `domAnimation`) restrito ao `MedicationDualCard` (fora da rota `/`).
2. **O piso fixo do Next.js 16 + React 19 é de `112,7 KiB` Brotli (`131,9 KiB` Gzip)**:
   - Qualquer aplicação Next.js App Router com React 19 começa nesse patamar antes da primeira linha de código de produto.
3. **Recomendação de Meta Auditada para o Projeto (Seção 11 do DAS)**:
   - **Métrica de referência oficial**: medir sempre o **JS Ativo comprimido (excluindo `<script noModule>`)**, pois o arquivo `noModule` nunca é baixado nem executado por navegadores que suportam `type="module"` (Android Chrome 61+, iOS Safari 11+).
   - **Teto global da rota `/` (Runtime + App + Catálogo JSON inicial)**:
     - **Brotli**: `<= 150 KiB` (atualmente em **`121,1 KiB`**, deixando **`28,9 KiB` de folga** para quando os 159 medicamentos reais da REMUME + 41 itens do Farmácia Popular entrarem em `data/medicamentos.json` na Fase 1/Prompt 07).
     - **Orçamento líquido do código + dados da aplicação (acima do baseline Next/React)**: `<= 35 KiB` Brotli (atualmente em **`8,4 KiB`** com fixtures).
