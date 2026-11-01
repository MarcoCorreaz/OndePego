# Ícone do Onde Pego — proposta de correção técnica

Gerado a partir do ícone original enviado (pino com cruz verde, 1254×1254). **O desenho não foi alterado**: o pino foi recortado e recolocado em um fundo azul de borda a borda, menor, dentro da zona segura. Veja `icone-comparacao.png`.

## Problemas do ícone atual que isto resolve

| Problema | Atual | Proposto |
|---|---|---|
| Android recorta ícones `maskable` em círculo | O topo do pino é cortado; na máscara "adaptive" (~66%) perde topo e ponta | O pino fica inteiro (topo a 307 px e ponta a 286 px do centro; limite 338 px) |
| `apple-touch-icon` com cantos transparentes | O iOS preenche com **preto**: moldura preta ao redor | Quadrado opaco; o iOS arredonda sozinho |
| `icon.svg` de **433 KB** (PNG em base64 dentro de um SVG) | Baixado em toda página como favicon | `icon.svg` de **392 bytes**, vetor simples |
| Tamanhos mínimos (16 a 32 px) | Brilho e anel âmbar viram mancha | Versão plana: pino branco, cruz `#0E7C3A`, fundo `#0B3D91` |
| Escala de cinza | Cruz `#02CF68` sobre pino branco: contraste 1,70:1 | Cruz `#0E7C3A` sobre branco: 5,30:1 |

## Arquivos

| Arquivo | Uso |
|---|---|
| `icon-master-1024.png` | Mestre de borda a borda, opaco (guardar como origem) |
| `icon-512-maskable.png`, `icon-192-maskable.png` | Ícones `purpose: "maskable"` do manifest |
| `apple-touch-icon.png` (180×180) | Substitui `public/apple-touch-icon.png` |
| `icon.svg` | Substitui `public/icon.svg` (favicon vetorial e `purpose: "any"`) |
| `favicon.ico`, `favicon-16/32/48.png` | Favicon para navegadores que não usam SVG |

Os ícones `icon-192.png` e `icon-512.png` atuais (cantos transparentes) podem continuar como `purpose: "any"`.

## Mudanças no código

**`public/manifest.webmanifest`**: separar os propósitos (um arquivo não deve ser `any maskable`) e alinhar a cor do tema à marca:

```json
"theme_color": "#0B3D91",
"icons": [
  { "src": "/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" },
  { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

O `theme_color` atual (`#0F4C5C`, verde-petróleo) não combina com o azul `#0B3D91` do ícone e do hero.

**`src/app/layout.tsx` e `src/lib/seo.ts`**: no `icons`, usar o SVG leve e o `favicon.ico`, e apontar `apple` para `/apple-touch-icon.png` (hoje o `seo.ts` aponta para `icon-192.png`, que tem cantos transparentes).

```ts
icons: {
  icon: [
    { url: '/icon.svg', type: 'image/svg+xml' },
    { url: '/favicon.ico', sizes: 'any' },
  ],
  apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
}
```

## Avisos

- Os PNGs do pino foram recortados por cor; confira em tela cheia se há alguma franja nas bordas antes de publicar.
- O fundo azul novo é um gradiente próprio, parecido com o original, mas não idêntico.
- Se você tiver o arquivo-fonte do ícone (com camadas), gerar a versão de borda a borda por lá é melhor do que este recorte.
