# ADR-07 — Busca primeiro; mapa integrado ao resultado

**Status:** Aprovado, a validar em teste A/B na Fase 4  **Data:** 26/10/2026

## Contexto
Havia a dúvida entre abrir o app em um mapa ou em uma busca. A pessoa chega com uma pergunta sobre um remédio. Um mapa sem remédio escolhido mostraria pinos que sugerem "tem aqui" sem haver dado de estoque. Pedir GPS na abertura prejudica a confiança. Mapa pesa no 4G fraco.

## Decisão
Tela inicial com busca; resultado em tela dividida (card duplo + mapa com farmácias credenciadas por distância); atalho "Ver farmácias perto de mim" na tela inicial para quem pensa primeiro em lugar.

## Consequências
- Busca instantânea e offline; mapa só carrega sob demanda.
- Pino significa "credenciada", não "tem o item".
- Testar na Fase 4 com 15 a 20 moradores: grupo A busca primeiro, grupo B mapa primeiro; medir tempo até o resultado e confiança relatada.
