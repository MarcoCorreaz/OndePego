# Extração e Hospedagem do Recorte PMTiles (Cuiabá e Várzea Grande)

Este guia documenta como extrair e servir o arquivo estático `.pmtiles` consumido por `src/lib/pmtilesProtocol.ts`, seguindo o **ADR-06** e a **Seção 9 do DAS v1.2**.

---

## 1. Regras Invioláveis de Mapa e Rede

1. **Proibido usar `tile.openstreetmap.org`** em qualquer ambiente: a política da OSM Foundation proíbe pré-carregamento offline e permite bloqueio sem aviso.
2. **Proibido hospedar o `.pmtiles` no GitHub Releases:** o download sofre redirecionamento HTTP para um host que não envia cabeçalhos CORS para `Range` requests, bloqueando a leitura no navegador.
3. **Zero CDNs de glifos ou sprites:** o estilo em `src/lib/pmtilesProtocol.ts` usa camadas vetoriais geométricas locais e pinos em HTML com as fontes autohospedadas do próprio app.

---

## 2. Comando de Extração (`pmtiles extract`)

A caixa geográfica (`GEO_BBOX` em `src/types/schema.ts`) cobre a área urbana de **Cuiabá e Várzea Grande**:
- `minLng` (Oeste): `-56.35`
- `minLat` (Sul): `-15.85`
- `maxLng` (Leste): `-55.80`
- `maxLat` (Norte): `-15.35`

### Passo a passo

1. Instale a CLI oficial `go-pmtiles` (`https://github.com/protomaps/go-pmtiles/releases`).
2. Verifique a URL da compilação diária mais recente em `https://build.protomaps.com/` (formato `https://build.protomaps.com/AAAAMMDD.pmtiles`).
3. Execute o comando abaixo para gerar o arquivo em `public/tiles/cuiaba-vg.pmtiles`:

```bash
mkdir -p public/tiles

# Ordem de --bbox: oeste,sul,leste,norte (minLng,minLat,maxLng,maxLat)
pmtiles extract https://build.protomaps.com/20261025.pmtiles public/tiles/cuiaba-vg.pmtiles \
  --bbox=-56.35,-15.85,-55.80,-15.35 \
  --maxzoom=14
```

4. Confira o cabeçalho e o tamanho do arquivo extraído:

```bash
pmtiles show public/tiles/cuiaba-vg.pmtiles
```

---

## 3. Hospedagem e Verificação de HTTP 206

- **Opção A (Preferida — Mesma Origem):** manter `public/tiles/cuiaba-vg.pmtiles` no deploy estático do Cloudflare Pages, desde que o arquivo final tenha **menos de 25 MiB** (limite por arquivo do Cloudflare Pages).
- **Opção B (Bucket dedicado):** se exceder 25 MiB, hospedar no Cloudflare R2 com regras de CORS explícitas para `GET` e `HEAD`, permitindo os cabeçalhos `Range` e `If-Match` e expondo `Content-Range`, `Content-Length` e `ETag`.
- **Verificação obrigatória antes de publicar:** abrir a aba Rede (Network) do navegador em janela anônima e confirmar respostas **HTTP 206 Partial Content** ao dar zoom no mapa.
