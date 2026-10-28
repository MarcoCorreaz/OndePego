# Onde Pego

PWA estática e gratuita para moradores de Cuiabá/MT: digite o nome de um remédio e veja, lado a lado, se ele é padronizado na rede municipal (REMUME / SUS Cuiabá) e se é gratuito no Programa Farmácia Popular, com as farmácias credenciadas no mapa. Projeto independente, sem vínculo com órgãos públicos.

Nome em avaliação: verificar Registro.br e INPI antes de divulgar (ver `docs/DAS.md`, seção 16).

## Comandos Principais

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js |
| `npm run typecheck` | Executa checagem estrita de tipos (`tsc --noEmit`) |
| `npm test` | Roda a suíte de testes unitários (Vitest) |
| `npm run validate` | Valida contratos Zod, unicidade e bbox (aceita fixtures em desenvolvimento) |
| `npm run validate:prod` | Valida em **modo produção** (`--prod`): falha se houver qualquer `__fixture: true` ou versão `*-fixture` |
| `npm run build` | Gera o export estático em `out/` (desenvolvimento/CI) |
| `npm run build:prod` | Executa `npm run validate:prod && next build` (comando de build para produção) |
| `npm run import:infoms -- --input <arquivo.csv>` | Importa o CSV do painel InfoMS preservando coordenadas com `auditado_manualmente: true` |

## Deploy e Trava de Produção (`build:prod`)

Na plataforma de hospedagem estática (**Cloudflare Pages** ou **Vercel**), configure o comando de build como:

```bash
npm run build:prod
```

- O script `build:prod` executa `npm run validate:prod && next build`.
- **Trava intencional contra dados de teste:** enquanto existirem registros marcados com `"__fixture": true` em `data/*.json` ou enquanto `meta.versao` terminar com `"-fixture"`, o comando `npm run build:prod` **falhará intencionalmente com código de saída 1**, impedindo que medicamentos ou unidades fictícias sejam publicados em produção.
- Diretório de saída estática: `out/`.

## Documentos

| Arquivo | O que é |
|---|---|
| `docs/DAS.md` | Especificação de produto e arquitetura |
| `docs/adr/` | Decisões arquiteturais 06 a 09 (01 a 05 estão resumidas no DAS) |
| `docs/lai-pedido.md` | Rascunho do pedido via Lei de Acesso à Informação |
| `docs/prompts/` | Prompts de handoff para o Antigravity |
| `docs/design/` | Direção visual e protótipos |
| `GEMINI.md` | Regras sempre carregadas pelo agente |
| `.agent/skills/` | 6 skills do projeto (`busca-design-system`, `busca-motion`, `busca-textos-saude`, `busca-a11y-audit`, `busca-dados-contratos`, `busca-mapa-pmtiles`) |

## Estrutura do código

```
onde-pego/
├── GEMINI.md
├── .agent/skills/            busca-design-system, busca-motion, busca-textos-saude,
│                             busca-a11y-audit, busca-dados-contratos, busca-mapa-pmtiles
├── docs/
├── data/                     medicamentos.json, estabelecimentos.json, meta.json
├── scripts/                  validate-schemas.ts, import-infoms-csv.ts, extract-tiles.md
├── public/                   manifest.webmanifest, ícones, sw.js
├── src/
│   ├── app/                  /, /buscar, /medicamento/[slug], /unidades, /plantao, /sobre
│   ├── components/           layout/, search/, medication/, map/, unidades/, ui/
│   ├── lib/                  normalize, searchEngine, searchSession, geoEngine, freshness,
│   │                         pmtilesProtocol, establishmentsFilter, infomsCsv, swRangeHelper,
│   │                         healthCopy, share, prefs, dataRules
│   ├── styles/
│   └── types/schema.ts       Zod como fonte única
├── tests/
└── .github/workflows/sync-and-validate.yml
```

## Ordem de trabalho

Fase 0 (design e agente) → Fase 1 (dados e mapa) → Fase 2 (validação farmacêutica) → Fase 3 (construção) → Fase 4 (testes reais e publicação). Detalhes no DAS, seção 17.
