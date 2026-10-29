---
name: engenharia-software-senior
description: Aplica práticas de Engenharia de Software Sênior, código limpo, higiene de repositório, prevenção de código morto e proteção de performance em qualquer criação ou refatoração de código.
---

# Engenharia de Software Sênior — Onde Pego

## Goal

Garantir que toda criação, manutenção ou refatoração no repositório **Onde Pego** siga padrões de engenharia de software sênior: arquitetura limpa com regras de negócio puras e determinísticas em `src/lib/`, tipagem estrita derivada do contrato Zod (`src/types/schema.ts`), higiene rigorosa da árvore de arquivos, tratamento resiliente de falhas operacionais e respeito estrito ao orçamento de performance e privacidade (ADR-09).

## Instructions

1. **Isolamento de Regras de Negócio (`src/lib/`):**
   - Toda lógica de domínio (normalização fonética PT-BR, motor de busca, cálculo de distância Haversine, validação de coordenadas, resolução de textos normativos, máquina de estados do mapa offline e importadores CSV) deve ser implementada como **função pura e determinística** em `src/lib/`, completamente desacoplada da árvore React.
   - Componentes em `src/components/` e rotas em `src/app/` devem atuar apenas como camada de apresentação, acessibilidade e orquestração de eventos de interface.

2. **Higiene de Código e Repositório (Zero Dead Code):**
   - Nunca deixar imports não utilizados, variáveis órfãs, CSS tokens inexistentes, comentários obsoletos ou `console.log` de depuração em código de aplicação.
   - Manter a raiz do repositório limpa: apenas arquivos de configuração essenciais (`GEMINI.md`, `README.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.mts`, `postcss.config.mjs`, `.gitignore`) e as pastas oficiais (`.github/`, `.agents/`, `docs/`, `data/`, `fontes/`, `public/`, `scripts/`, `src/`, `tests/`).

3. **Tratamento Gracioso de Erros Esperados (Zero Unhandled Runtime Error):**
   - Falhas do mundo real em Cuiabá — rede 4G instável ou offline, permissão de GPS negada, ausência de suporte a WebGL, arquivo `.pmtiles` ainda não baixado, `sessionStorage`/`localStorage` bloqueado ou linha sem coordenada no CSV — são **estados normais de produto**.
   - Trate cada uma dessas condições com fallback determinístico e mensagem orientativa clara na UI, nunca deixando exceções não tratadas quebrarem a renderização.

4. **Proteção de Performance e Privacidade (ADR-09):**
   - Preservar o orçamento de JS inicial da rota `/` ($\le 150\text{ KB}$ comprimido, sem mapa).
   - Carregar módulos pesados (MapLibre GL e protocolo PMTiles) exclusivamente sob demanda via `next/dynamic` (`ssr: false`).
   - Garantir zero chamadas de rede para domínios de terceiros em tempo de execução.

## Examples

### Exemplo 1: Separação entre função pura (`src/lib/`) e componente React (`src/components/`)

```ts
// BOM — src/lib/establishmentsFilter.ts (puro, determinístico e 100% testável no Vitest)
export function getPublicUnitsForMedication(
  apresentacao: Apresentacao,
  estabelecimentos: readonly Estabelecimento[],
): Estabelecimento[] {
  if (apresentacao.status_remume_cuiaba !== 'PADRONIZADO_REMUME') {
    return [];
  }
  // ...
}
```

### Exemplo 2: Tratamento resiliente de API do navegador

```ts
// BOM — degradação graciosa quando sessionStorage ou geolocation não está disponível
try {
  window.sessionStorage.setItem(KEY, value);
} catch {
  // Continua operando normalmente com estado em memória
}
```

## Constraints

- **Proibido** introduzir dependências externas fora da stack aprovada em `GEMINI.md` sem autorização explícita e medição de impacto em KB Gzip/Brotli.
- **Proibido** duplicar tipos manualmente fora de `src/types/schema.ts` (sempre usar `z.infer`).
- **Proibido** registrar Service Worker ativo em modo `development` (`npm run dev`) de forma que sirva bundles JS antigos e cause erro de hidratação.
- **Proibido** concluir qualquer tarefa sem validar `npm run typecheck`, `npm test`, `npm run validate` e `npm run build` com código de saída `0`.
