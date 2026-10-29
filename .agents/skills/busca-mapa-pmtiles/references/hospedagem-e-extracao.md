# Extração e hospedagem do PMTiles

## Extração (exemplo de formato)

```bash
# Ordem da caixa: oeste,sul,leste,norte  (lng mín, lat mín, lng máx, lat máx)
pmtiles extract <URL-da-compilacao-diaria-do-protomaps> cuiaba-vg.pmtiles \
  --bbox=<lngMin>,<latMin>,<lngMax>,<latMax> --maxzoom=14
```

- A URL de origem é uma compilação diária do Protomaps; ela muda com a data. Conferir a mais recente em `build.protomaps.com` na hora de extrair.
- Valores da caixa: partir de `GEO_BBOX` em `references/schema.md` da skill `busca-dados-contratos` e ajustar para cobrir Cuiabá e Várzea Grande com folga pequena.
- Medir o tamanho do arquivo gerado e registrar aqui. Se for grande demais para o celular simples, reduzir `--maxzoom` ou a caixa.

Registro de medições (preencher):

| Data | Caixa | maxzoom | Tamanho |
|---|---|---|---|
| (pendente) | | | |

## Hospedagem

Requisito: servir arquivo estático com **HTTP range requests** e CORS adequado.

| Opção | Observação |
|---|---|
| GitHub Releases | Hospedagem gratuita via CDN para arquivos pequenos e médios; verificar suporte a range e CORS no uso real |
| Cloudflare R2 | Armazenamento S3-compatível com saída gratuita; pode exigir um Worker na frente para servir as faixas; conferir limites do plano gratuito |
| Host da própria aplicação | Só se aceitar o tamanho do arquivo e as faixas; conferir limite de tamanho por arquivo da plataforma |

Antes de escolher, teste: abrir o mapa em aba anônima, conferir na aba de rede que as respostas são 206 (parciais) e que o cache do navegador funciona.

## Alternativa para desenvolvimento

A API pública do Protomaps pode ser usada **só em desenvolvimento**: o uso gratuito é para fins não comerciais e não deve ser dependência de produção.

## Pacotes a confirmar antes de instalar

`maplibre-gl`, `pmtiles`, e o pacote de camadas/estilo base do Protomaps (verificar nome e versão atuais na documentação deles). Fixar versões no `package.json`.
