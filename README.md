# Onde Pego

PWA estática e gratuita para moradores de Cuiabá/MT: digite o remédio e veja se é padronizado na rede municipal (SUS) e se é gratuito no Farmácia Popular, com as farmácias credenciadas no mapa. Projeto independente, sem vínculo com órgãos públicos.

Nome em avaliação: verificar Registro.br e INPI antes de divulgar (ver `docs/DAS.md`, seção 16).

## Documentos

| Arquivo | O que é |
|---|---|
| `docs/DAS.md` | Especificação de produto e arquitetura (v1.1) |
| `docs/adr/` | Decisões arquiteturais 06 a 09 (01 a 05 estão resumidas no DAS) |
| `docs/lai-pedido.md` | Rascunho do pedido via Lei de Acesso à Informação |
| `docs/prompts/` | Prompts de handoff para o Antigravity |
| `docs/design/` | Direção visual e protótipos |
| `GEMINI.md` | Regras sempre carregadas pelo agente |
| `.agent/skills/` | 6 skills do projeto (confirmar se a sua versão usa `.agent` ou `.agents`) |

## Estrutura planejada do código

```
onde-pego/
├── GEMINI.md
├── .agent/skills/            busca-design-system, busca-motion, busca-textos-saude,
│                             busca-a11y-audit, busca-dados-contratos, busca-mapa-pmtiles
├── docs/
├── data/                     medicamentos.json, estabelecimentos.json, meta.json
├── scripts/                  validate-schemas.ts, import-infoms-csv.ts, extract-tiles.md
├── public/                   manifest, ícones, sw.js
├── src/
│   ├── app/                  /, /buscar, /medicamento/[slug], /unidades, /plantao, /sobre
│   ├── components/           layout/, search/, medication/, map/, ui/
│   ├── lib/                  normalize, searchEngine, geoEngine, freshness,
│   │                         pmtilesProtocol, share, prefs
│   ├── styles/
│   └── types/schema.ts       Zod como fonte única
├── tests/
└── .github/workflows/sync-and-validate.yml
```

## Ordem de trabalho

Fase 0 (design e agente) → Fase 1 (dados e mapa) → Fase 2 (validação farmacêutica) → Fase 3 (construção) → Fase 4 (testes reais e publicação). Detalhes no DAS, seção 17.
