# Passo a Passo — Importação do CSV Oficial de Farmácias Credenciadas (InfoMS)

Este guia explica como baixar a planilha oficial de drogarias credenciadas ao **Programa Farmácia Popular do Brasil (PFPB)** em Cuiabá/MT e atualizar o catálogo local do **Onde Pego** com segurança e auditoria de coordenadas.

---

## 1. Baixar o CSV no Painel Oficial do Ministério da Saúde

1. Acesse o **Painel de Endereços de Farmácias Credenciadas (InfoMS / SEIDIGI / Ministério da Saúde)** ou o portal **Dados Abertos do Governo Federal (`dados.gov.br`)** buscando por **"Farmácia Popular - Estabelecimentos Credenciados"**.
2. Caso utilize o painel interativo do InfoMS:
   - Filtre por **UF:** `MT`
   - Filtre por **Município:** `CUIABÁ` (ou baixe a base nacional/estadual completa — o importador filtra `CUIABA` automaticamente e aceita UTF-8 ou Latin-1/Windows-1252).
3. Exporte os dados em formato **CSV** (separado por `;` ou `,`) e salve o arquivo em:
   ```text
   fontes/infoms.csv
   ```

### Colunas reconhecidas automaticamente pelo importador
O script `scripts/import-infoms-csv.ts` detecta os cabeçalhos oficiais do Ministério da Saúde mesmo quando variam entre revisões do painel:
- **CNPJ:** `cnpj`, `nu_cnpj`
- **Nome / Razão Social:** `nome_fantasia`, `no_fantasia`, `farmacia`, `estabelecimento`, `razao_social`
- **Endereço e Bairro:** `endereco`, `logradouro`, `ds_endereco`, `bairro`, `no_bairro`
- **Município e UF:** `municipio`, `cidade`, `no_municipio`, `uf`, `sg_uf`
- **Telefone (opcional):** `telefone`, `nu_telefone`, `ddd`
- **Coordenadas (opcionais):** `lat`, `latitude`, `nu_latitude`, `lng`, `lon`, `longitude`, `nu_longitude`

---

## 2. Simular a Importação (`--dry-run`)

Antes de alterar qualquer arquivo de produção em `data/`, execute os importadores em modo de simulação (padrão):

```bash
# 1. Testar medicamentos (REMUME Cuiabá + Elenco Farmácia Popular + Sinônimos)
npm run import:medicamentos

# 2. Testar unidades públicas de saúde (UPAs, Policlínicas e UBS)
npm run import:unidades

# 3. Testar farmácias credenciadas do InfoMS (Cuiabá)
npm run import:infoms -- --input fontes/infoms.csv --municipios=cuiaba
```

> **Dica:** Para incluir também farmácias credenciadas da região conurbada de Várzea Grande, use `--municipios=cuiaba,varzea-grande`.

---

## 3. Gravar os Dados Oficiais em `data/*.json` (`--write`)

Após revisar o relatório do `--dry-run`, execute com `--write` e `--prune` (para remover os itens sintéticos de fixture `__fixture: true` e atualizar as datas das fontes em `data/meta.json`):

```bash
# 1. Gravar catálogo de medicamentos e atualizar datas da REMUME e do Elenco PFPB
npm run import:medicamentos -- --prune --data-remume=2026-04-20 --data-elenco=2026-04-20 --write

# 2. Gravar farmácias credenciadas do InfoMS e atualizar data_infoms em data/meta.json
npm run import:infoms -- --input fontes/infoms.csv --municipios=cuiaba --data-infoms=2026-04-20 --write

# 3. Gravar unidades públicas municipais de Cuiabá
npm run import:unidades -- --input fontes/unidades.csv --write
```

*(Nota: se ainda restar alguma unidade de fixture de teste em `data/estabelecimentos.json` quando for publicar para produção, remova os objetos com `"__fixture": true` antes de rodar `npm run validate:prod`).*

---

## 4. Auditar Coordenadas para o Mapa Offline

Por regra de segurança médica e geográfica do projeto:
- Drogarias do CSV do InfoMS que **não trazem latitude/longitude** recebem `sem_localizacao: true`: elas aparecem normalmente na lista por bairro com endereço completo e telefone, mas **não recebem pino inventado no mapa**.
- Unidades e drogarias com coordenadas vindas de CSV entram inicialmente com `auditado_manualmente: false` (exibindo o aviso *"Localização aproximada. Confira o endereço."*).

Para revisar e aprovar as coordenadas:

```bash
# 1. Listar todos os estabelecimentos pendentes de auditoria ou sem coordenada
npm run audit:coords

# 2. Marcar como auditados os IDs conferidos visualmente
npm run mark:audited -- --ids upa-leblon,upa-morada-do-ouro,upa-pascoal-ramos,upa-verdao,policlinica-pedra-90

# 3. Ou informar a coordenada exata conferida para uma farmácia sem coordenada no CSV
npm run mark:audited -- --ids infoms-00000000000191 --lat -15.5961 --lng -56.0967
```

---

## 5. Validar Contratos e Build de Produção

Finalize sempre rodando a esteira completa de validação:

```bash
npm run validate
npm test
npm run build
```
