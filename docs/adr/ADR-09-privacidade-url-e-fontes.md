# ADR-09 — Privacidade de URL e fontes autohospedadas

**Status:** Aprovado  **Data:** 26/10/2026

## Contexto
A promessa de privacidade (ADR-05) diz que nada digitado sai do aparelho. Query strings chegam ao servidor de hospedagem e a CDNs de fontes recebem o IP de quem visita.

## Decisão
- O texto da busca não entra na URL; a busca vive em estado do cliente.
- O slug do medicamento (vem do catálogo) pode aparecer na URL do detalhe; a página "Sobre" informa que links compartilhados contêm o nome do medicamento.
- Fontes autohospedadas (`@fontsource/*`); sem Google Fonts nem CDN de ícones/scripts; glifos e sprites do mapa próprios.
- Sem analytics de terceiros no MVP.

## Consequências
- Nenhuma requisição a terceiros em tempo de execução além do host do próprio app e do host do `.pmtiles`.
- Verificação obrigatória na aba de rede antes de cada publicação.
