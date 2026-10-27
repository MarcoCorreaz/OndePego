# Prompt 01 — Scaffold e contratos (para o Antigravity)

> Antes de colar: garantir que `GEMINI.md` e as skills estão no repositório. O agente deve seguir as regras de `GEMINI.md` (mostrar plano, não commitar).

```
Leia GEMINI.md e use as skills busca-dados-contratos e busca-a11y-audit.

TAREFA 1 — Scaffold e contratos
1. Criar projeto Next.js (App Router) + TypeScript strict + Tailwind, com
   output: 'export' e trailingSlash configurado para hospedagem estática.
2. Instalar apenas: fuse.js, zod, vitest, tsx. Mostrar antes a lista exata e as versões.
3. src/types/schema.ts: Zod como fonte única e tipos via z.infer, conforme
   .agent/skills/busca-dados-contratos/references/schema.md.
4. data/meta.json, data/medicamentos.json, data/estabelecimentos.json: apenas
   fixtures marcadas com "__fixture": true e nomes claramente falsos.
5. src/lib/freshness.ts: "dado desatualizado" derivado de meta.json (limite em dias configurável).
6. scripts/validate-schemas.ts + script npm "validate" (regras do validador na skill).
7. Testes (vitest) para schemas, unicidade, limites geográficos e freshness.

CRITÉRIOS DE ACEITE
- npm run validate passa com as fixtures e FALHA se eu quebrar um campo.
- npm run validate FALHA com NODE_ENV=production se houver fixture.
- npm run build gera export estático sem erro; npm test verde.
- Nenhuma requisição a terceiros; nenhuma fonte de CDN.

Mostre o plano e os arquivos antes de alterar. Não faça commit.
```

## Próximos prompts (a escrever)
- 02 — Motor de busca (`normalize.ts`, `searchEngine.ts`, testes com pares parecidos)
- 03 — Tokens e componentes-base (após protótipo aprovado)
- 04 — Tela de detalhe: card duplo
- 05 — Mapa: PMTiles, MapLibre, "perto de mim", lista alternativa
- 06 — PWA offline e service worker
- 07 — Pipeline do GitHub Actions
