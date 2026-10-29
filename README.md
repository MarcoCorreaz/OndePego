# Onde Pego

PWA estática e gratuita para moradores de Cuiabá/MT: digite o nome de um remédio e veja, lado a lado, se ele é padronizado na rede municipal (REMUME / SUS Cuiabá) e se é gratuito no Programa Farmácia Popular, com as farmácias credenciadas e unidades públicas no mapa e em lista. Projeto independente, sem vínculo com órgãos públicos.

Nome em avaliação: verificar Registro.br e INPI antes de divulgar (ver `docs/DAS.md`, seção 16).

## Comandos Principais

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js |
| `npm run typecheck` | Executa checagem estrita de tipos (`tsc --noEmit`) |
| `npm test` | Roda a suíte de testes unitários e jornadas de usuário (Vitest) |
| `npm run validate` | Valida contratos Zod, unicidade e bbox (aceita fixtures em desenvolvimento) |
| `npm run validate:prod` | Valida em **modo produção** (`--prod`): falha se houver qualquer `__fixture: true`, versão `*-fixture` ou farmácia não auditada |
| `npm run build` | Gera o manifesto de pré-cache e o export estático em `out/` (desenvolvimento/CI) |
| `npm run build:prod` | Executa `npm run validate:prod && next build` (comando de build para produção) |
| `npm run import:medicamentos` | Importa REMUME × Elenco PFPB × Sinônimos (`--dry-run` por padrão; `--write` para gravar) |
| `npm run import:infoms` | Importa o CSV do painel InfoMS preservando coordenadas com `auditado_manualmente: true` |
| `npm run import:unidades` | Importa unidades públicas da SMS Cuiabá (`UBS`, `POLICLINICA`, `UPA`) |
| `npm run audit:coords` | Lista estabelecimentos sem localização ou com `auditado_manualmente: false` e links de verificação |
| `npm run mark:audited` | Marca estabelecimentos conferidos como `auditado_manualmente: true` |

## Deploy e Trava de Produção (`build:prod`)

Na plataforma de hospedagem estática (**Cloudflare Pages** ou **Vercel**), configure o comando de build como:

```bash
npm run build:prod
```

- O script `build:prod` executa `npm run validate:prod && next build`.
- **Trava intencional contra dados de teste e coordenadas não auditadas:** enquanto existirem registros marcados com `"__fixture": true` em `data/*.json`, enquanto `meta.versao` terminar com `"-fixture"` ou enquanto houver farmácia credenciada sem coordenada auditada (`auditado_manualmente: false`), o comando `npm run build:prod` **falhará intencionalmente com código de saída 1**.
- Diretório de saída estática: `out/`.

## Skills do Agente (`.agents/skills/`)

| Skill | Papel |
|---|---|
| `busca-design-system` | Identidade visual, tokens, tipografia, layout e tom de voz |
| `busca-motion` | Orçamento e padrões de animação enxuta com Motion (`motion/react`) |
| `busca-textos-saude` | Textos normativos literais e regras invioláveis de conteúdo de saúde |
| `busca-a11y-audit` | Auditoria WCAG 2.2 AA com foco em idosos, baixa visão e leitor de tela |
| `busca-dados-contratos` | Schemas Zod, arquivos `data/*.json`, validação, fixtures e importadores |
| `busca-mapa-pmtiles` | Mapa MapLibre GL + PMTiles próprio, cache offline sob demanda, GPS e rotas |
| `engenharia-software-senior` | Código limpo, funções puras em `src/lib/`, higiene de repositório e proteção de performance |
| `ui-ux-produto-premium` | Direção de arte Sênior (nível Apple Health / Linear), hierarquia em 3s e 5 estados de UI |
| `qa-usuario-real` | Testes de jornada real ponta a ponta cobrindo as 5 Personas do cidadão de Cuiabá |

## Documentos

| Arquivo | O que é |
|---|---|
| `docs/DAS.md` | Especificação de produto e arquitetura (DAS v1.2) |
| `docs/adr/` | Decisões arquiteturais 06 a 09 (01 a 05 estão resumidas no DAS) |
| `docs/data-import-report.md` | Contrato determinístico de colunas e diagnóstico das fontes oficiais CSV |
| `docs/lai-pedido.md` | Rascunho do pedido via Lei de Acesso à Informação |
| `docs/prompts/` | Prompts de handoff para o Antigravity |
| `docs/design/` | Direção visual, medição de baseline JS e protótipos |
| `fontes/LEIA-ME.md` | Guia dos arquivos CSV oficiais para importação (`remume.csv`, `elenco.csv`, `infoms.csv`, `unidades.csv`, `sinonimos.csv`) |
| `GEMINI.md` | Regras sempre carregadas pelo agente |

## Estrutura do código

```
onde-pego/
├── GEMINI.md
├── README.md
├── .agents/skills/           9 skills oficiais do projeto
├── .github/workflows/        sync-and-validate.yml
├── docs/                     DAS.md, adr/, design/, prompts/, data-import-report.md
├── data/                     medicamentos.json, estabelecimentos.json, meta.json
├── fontes/                   LEIA-ME.md (local para CSVs oficiais)
├── public/                   manifest.webmanifest, ícones, sw.js, sw-range-helper.js
├── scripts/                  validate-schemas.ts, generate-precache.ts, import-*, audit-coords.ts, mark-audited.ts
├── src/
│   ├── app/                  /, /buscar, /medicamento/[slug], /unidades, /plantao, /sobre
│   ├── components/           layout/, search/, medication/, map/, unidades/, ui/
│   ├── lib/                  funções puras de domínio, busca, geo, importação e textos normativos
│   ├── styles/tokens.css
│   └── types/schema.ts       Zod como fonte única
└── tests/                    suítes unitárias, pipeline de importação e jornadas de usuário (Vitest)
```

## Ordem de trabalho

Fase 0 (design e agente) → Fase 1 (dados e mapa) → Fase 2 (validação farmacêutica) → Fase 3 (construção) → Fase 4 (testes reais e publicação). Detalhes no DAS, seção 17.
