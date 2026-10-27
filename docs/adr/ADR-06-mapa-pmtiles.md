# ADR-06 — Mapa com MapLibre + PMTiles próprio

**Status:** Aprovado  **Data:** 26/10/2026

## Contexto
O DAS v1.0 previa Leaflet com tiles do OpenStreetMap. A política de tiles do OSM diz que o acesso pode ser bloqueado sem aviso quando o uso degrada o serviço e proíbe uso offline (pré-carregar área) em `tile.openstreetmap.org`. O Onde Pego é um site público em produção e um PWA offline.

## Decisão
Usar MapLibre GL com um arquivo PMTiles próprio (recorte de Cuiabá e Várzea Grande, extraído do mapa do Protomaps), hospedado como arquivo estático. Glifos e sprites também autohospedados.

## Consequências
- Sem custo de servidor de tiles e sem dependência de terceiros em tempo de execução.
- Offline permitido (arquivo é nosso).
- Exige extração e hospedagem do arquivo, e teste de range requests e de cache offline.
- WebGL pode pesar em aparelhos antigos: testar; plano B Leaflet com plugin do Protomaps.
- A API pública do Protomaps só para desenvolvimento (uso gratuito não comercial).
