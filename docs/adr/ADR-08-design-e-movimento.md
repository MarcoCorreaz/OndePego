# ADR-08 — Sistema de design próprio e orçamento de movimento

**Status:** Aprovado (tokens v0 a validar no protótipo)  **Data:** 26/10/2026

## Contexto
Objetivo de produto: parecer próprio, não genérico, sem prejudicar legibilidade nem performance para idosos e celulares simples.

## Decisão
Direção visual de sinalização de rua/ponto de ônibus (blocos de cor funcionais, tipografia de placa, texto grande), com o card duplo como único elemento memorável. Movimento só quando mostra mudança ou responde a uma ação, com um único momento orquestrado. Componentes de bibliotecas (ex.: 21st.dev) entram como referência e só depois de adaptação e auditoria de acessibilidade e licença.

## Consequências
- Skills `busca-design-system`, `busca-motion` e `busca-a11y-audit` carregam as regras.
- Bundle e movimento têm orçamento mensurável (ver `GEMINI.md`).
- Tokens v0 são proposta; mudar exige atualizar `references/tokens.md` e recalcular contrastes.
