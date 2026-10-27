---
name: busca-mapa-pmtiles
description: Mapa do Onde Pego com MapLibre GL e arquivo PMTiles próprio (recorte de Cuiabá e Várzea Grande): extração, hospedagem, estilo, service worker offline, "perto de mim" por GPS, ordenação por distância e links de rota. Use SEMPRE que mexer em mapa, tiles, .pmtiles, marcadores de farmácia/unidade, geolocalização, distância, rotas, cache offline do mapa, ou quando alguém sugerir usar tiles do OpenStreetMap ou outro provedor de tiles.
---

# Onde Pego — Mapa (MapLibre + PMTiles)

## Decisão e por quê

O mapa usa um arquivo **PMTiles próprio**, hospedado como arquivo estático. **Nunca** use `tile.openstreetmap.org` (nem outro servidor de tiles de terceiros) no código: a política dele permite bloquear uso pesado sem aviso e **proíbe uso offline**, o que conflita com o PWA offline. Tiles de terceiros também mandariam dados de navegação a terceiros, o que viola `GEMINI.md`. Ver `docs/adr/ADR-06-mapa-pmtiles.md`.

## Significado do pino (regra de conteúdo)

O pino de farmácia significa **"farmácia credenciada ao Farmácia Popular"**. Nunca "tem o remédio". Textos em `busca-textos-saude`. O mapa sempre tem alternativa completa em lista (ver `busca-a11y-audit`).

## Fluxo técnico

1. **Extrair** o recorte com a CLI do Protomaps (`pmtiles extract`), caixa em ordem `oeste,sul,leste,norte` (lng mín, lat mín, lng máx, lat máx) e `--maxzoom` escolhido ao medir o tamanho. A origem é uma compilação diária do Protomaps; confirmar a data mais recente no momento da extração. Detalhes em `references/hospedagem-e-extracao.md`.
2. **Hospedar** como arquivo estático em host com suporte a HTTP range requests. Nome de arquivo versionado (ex.: `cuiaba-vg-AAAAMMDD.pmtiles`).
3. **Renderizar** com MapLibre GL registrando o protocolo `pmtiles://` (código em `src/lib/pmtilesProtocol.ts`). Confirmar nomes e versões dos pacotes (`maplibre-gl`, `pmtiles`, pacote de estilos base do Protomaps) antes de instalar.
4. **Autohospedar glifos e sprites** do estilo. Não usar servidor de fontes ou sprites de terceiros (privacidade e offline).
5. **Atribuição:** exibir o crédito de OpenStreetMap e do basemap, como a licença exige.

## Carregamento e performance

- O código do mapa e o `.pmtiles` carregam **apenas** quando o mapa é exibido (importação dinâmica). Nunca no caminho crítico da busca.
- Poucas dezenas de marcadores: sem clustering complexo.
- Testar em Android simples. Se o MapLibre (WebGL) pesar demais, o plano B é Leaflet com o plugin do Protomaps. Decidir com medição, não por palpite.

## Offline

- O service worker guarda os JSON de `data/`, o shell do app e o `.pmtiles`.
- **Ponto técnico a validar:** o Cache API não casa respostas parciais (206) de range requests de forma direta. Abordagem a testar: baixar o arquivo completo uma vez, guardar inteiro e responder às faixas pedidas pelo MapLibre a partir dele. Testar em modo avião antes de dar por pronto.
- Mostrar a data do pacote de mapa e o tamanho antes de baixar, se o arquivo passar de poucos MB.

## "Perto de mim" (geolocalização)

- Só pedir permissão **depois de um toque** da pessoa em "Ver farmácias perto de mim" ou "perto de mim" no detalhe.
- A posição **nunca** é enviada, salva ou registrada. Fica em memória, só para ordenar por distância (Haversine em `src/lib/geoEngine.ts`).
- Se negar ou falhar: mensagem clara e **seletor de bairro** como alternativa. Nunca bloquear o resto do app.
- Sem GPS: ordenar por bairro escolhido ou alfabética.

## Rotas

Link para o Google Maps por URL, sem API e sem chave:

```
https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=transit
```

Oferecer a opção de caminhada (`walking`). O botão diz "Ver rota". Link para o pontoos.com.br, se mantido, é opcional e secundário; o app não depende dele.

## Antes de dar a tarefa como pronta

- [ ] Nenhuma requisição a `tile.openstreetmap.org` ou outro servidor de tiles/glifos/sprites de terceiros (conferir a aba de rede).
- [ ] Mapa só carrega sob demanda; bundle da rota inicial medido e dentro da meta.
- [ ] Funciona em modo avião após a primeira visita.
- [ ] GPS só após toque; negar o GPS não quebra nada.
- [ ] Lista alternativa completa e acessível.
- [ ] Atribuição visível.
