# Relatório de Diagnóstico e Contrato de Importação de Dados Oficiais (`docs/data-import-report.md`)

**Data do diagnóstico:** 28/10/2026  
**Escopo:** Etapa 1 e Etapa 2 do Pipeline de Ingestão Determinística (Prompt 07)

---

## 1. Diagnóstico do Diretório `fontes/`

Foi realizada a inspeção na raiz do repositório (`fontes/`):

- **Status atual:** O diretório `fontes/` ainda **não existe** na árvore de trabalho local.
- **Decisão operacional segura:**
  1. Os arquivos atuais em `data/meta.json`, `data/medicamentos.json` e `data/estabelecimentos.json` (com `__fixture: true`) foram **mantidos intactos** para preservar o ambiente de desenvolvimento (`npm run dev`, `npm test`, `npm run validate` e `npm run build`).
  2. A trava de produção (`npm run validate:prod` / `npm run build:prod`) permanece ativa e **bloqueia qualquer deploy** enquanto existirem registros `__fixture: true`, versão terminada em `-fixture` ou farmácias não auditadas / sem coordenada válida.
  3. Todos os importadores oficiais (`import:medicamentos`, `import:unidades`, `import:infoms`) e utilitários de auditoria (`audit:coords`, `mark:audited`) foram implementados seguindo o contrato determinístico abaixo e validados com fixtures sintéticas em `tests/fixtures-import/`.

---

## 2. Regras Gerais de Leitura de CSV

Todos os importadores compartilham as mesmas garantias de parsing:
- **Encoding:** UTF-8 (com remoção automática de UTF-8 BOM `\uFEFF` via `stripUtf8Bom`).
- **Fim de linha:** compatível com CRLF (`\r\n`) e LF (`\n`).
- **Delimitador:** detecção automática entre ponto-e-vírgula (`;`, padrão Excel/Qlik Sense no Brasil) e vírgula (`,`), respeitando campos entre aspas duplas e escape `""`.
- **Normalização de cabeçalhos:** remoção de acentos NFD, conversão para minúsculas e substituição de separadores por `_`.
- **Segurança CLI:** todos os scripts operam em modo `--dry-run` por padrão (apenas exibem o relatório no terminal sem tocar no disco) e exigem a flag explícita `--write` para gravar alterações.

---

## 3. Contratos de Colunas por Fonte Oficial e Mapeamento para `src/types/schema.ts`

### 3.1. `fontes/remume.csv` — Relação Municipal de Medicamentos Essenciais (SMS Cuiabá)

Consumido por `scripts/import-medicamentos.ts --remume <caminho>`.

| Coluna esperada (ou alias aceito) | Obrigatória | Destino em `MedicamentoCatalogo` / `ApresentacaoMedicamento` | Regra de Transformação |
|---|---|---|---|
| `principio_ativo` (`denominacao_comum_brasileira`, `dcb`, `medicamento`) | Sim | `principio_ativo` e `slug` | Texto limpo (`trim`). O `slug` é gerado de forma determinística a partir de `principio_ativo` normalizado. |
| `descricao_dosagem` (`apresentacao`, `concentracao`, `dosagem`, `forma_farmaceutica`) | Sim | `apresentacoes[].descricao_dosagem` | Texto limpo (`trim`). Usado junto com `principio_ativo` (via `normalizePTBR`) como chave de união com o Elenco PFPB. |
| `local_dispensacao_sus` (`local_dispensacao`, `rede_dispensacao`, `local`) | Sim | `apresentacoes[].local_dispensacao_sus` | Mapeado estritamente para `'UBS'`, `'POLICLINICA_PORTARIA344'`, `'CEM_ESPECIALIDADES'` ou `'NAO_APLICAVEL'`. **Qualquer valor desconhecido aborta a importação com `exit code 1`** listando a linha. |
| `nota_especifica_cuiaba` (`observacao`, `nota`, `restricao`) | Não | `apresentacoes[].nota_especifica_cuiaba` | Incluído se não vazio. |
| `id_dcb` (`codigo_dcb`) | Não | `id_dcb` | Incluído se não vazio. |
| `codigo_atc` (`atc`) | Não | `codigo_atc` | Incluído se não vazio. |

- **Regra fixa de status:** todo item presente em `remume.csv` recebe `status_remume_cuiaba: 'PADRONIZADO_REMUME'`. O status `'ALERTA_ABASTECIMENTO'` **jamais** é gerado pelo importador.

---

### 3.2. `fontes/elenco.csv` — Elenco Oficial do Programa Farmácia Popular (Ministério da Saúde)

Consumido por `scripts/import-medicamentos.ts --elenco <caminho>`.

| Coluna esperada (ou alias aceito) | Obrigatória | Destino em `MedicamentoCatalogo` / `ApresentacaoMedicamento` | Regra de Transformação |
|---|---|---|---|
| `principio_ativo` (`denominacao_comum_brasileira`, `dcb`, `medicamento`, `insumo`) | Sim | `principio_ativo` e `slug` | Faz join com a REMUME por `normalizePTBR(principio_ativo) + "::" + normalizePTBR(descricao_dosagem)`. Se não existir na REMUME, cria apresentação com `status_remume_cuiaba: 'NAO_CONSTA_REMUME'` e `local_dispensacao_sus: 'NAO_APLICAVEL'`. |
| `descricao_dosagem` (`apresentacao`, `concentracao`, `dosagem`) | Sim | `apresentacoes[].descricao_dosagem` | Chave secundária de casamento da apresentação. |
| `farmacia_popular_gratuito` (`gratuito`, `elenco_gratuito`) | Não | `apresentacoes[].farmacia_popular_gratuito` | Padrão `true` para itens do elenco gratuito (`sim`, `true`, `1`, `gratuito` ou coluna ausente). Se `false`/`nao`, define `requisito_farmacia_popular: 'NAO_DISPONIVEL'`. |
| `requisito_farmacia_popular` (`requisito`, `regra`, `publico_alvo`) | Não | `apresentacoes[].requisito_farmacia_popular` | Mapeia para `'PADRAO_RECEITA_DOCUMENTO'` (padrão quando gratuito), `'FRALDA_GERIATRICA'` ou `'DIGNIDADE_MENSTRUAL'`. |

---

### 3.3. `fontes/sinonimos.csv` — Curadoria de Nomes Comerciais e Termos Populares

Consumido opcionalmente por `scripts/import-medicamentos.ts --sinonimos <caminho>`.

| Coluna esperada (ou alias aceito) | Obrigatória | Destino em `MedicamentoCatalogo` | Regra de Transformação |
|---|---|---|---|
| `principio_ativo` ou `slug` | Sim | Chave de busca do medicamento | Casa por `slug` ou `normalizePTBR(principio_ativo)`. |
| `nomes_comerciais` (`referencia`, `marca`) | Não | `nomes_comerciais` | Lista separada por `|` ou `,`, mesclada sem duplicatas com os sinônimos manuais já existentes em `data/medicamentos.json`. |
| `termos_populares` (`indicacao_popular`, `sinonimos_populares`) | Não | `termos_populares` | Lista separada por `|` ou `,`, mesclada sem duplicatas com os termos já existentes em `data/medicamentos.json`. |

- **Relatório de pendências:** ao rodar a importação, medicamentos cujo resultado final tiver `nomes_comerciais.length === 0` e `termos_populares.length === 0` são listados em `docs/sinonimos-pendentes.md` para revisão humana.

---

### 3.4. `fontes/infoms.csv` — Estabelecimentos Credenciados ao Farmácia Popular (Painel InfoMS)

Consumido por `scripts/import-infoms-csv.ts --input <caminho> [--municipios cuiaba,varzea-grande]`.

| Coluna esperada (ou alias aceito) | Obrigatória | Destino em `EstabelecimentoSaude` | Regra de Transformação |
|---|---|---|---|
| `cnpj` (`id`, `id_estabelecimento`, `nu_cnpj`, `cnpj_farmacia`) | Sim | `id` | Prefixo `pfpb-<digitos_cnpj>`. |
| `uf` (`sg_uf`, `estado`) | Não | Filtro | Mantém `MT`. |
| `municipio` (`no_municipio`, `cidade`) | Sim | Filtro `--municipios` | Comparado via `normalizePTBR`. Padrão: `cuiaba`. Aceita `cuiaba,varzea-grande`. |
| `nome_fantasia` (`no_fantasia`, `farmacia`, `estabelecimento`, `razao_social`) | Sim | `nome_fantasia` | Texto limpo (`trim`). |
| `bairro` (`no_bairro`) | Sim | `bairro` | Texto limpo (`trim`). |
| `endereco_completo` (`endereco`, `ds_endereco`, `logradouro`) | Sim | `endereco_completo` | Texto limpo (`trim`). |
| `telefone` (`nu_telefone`, `ddd_telefone`, `fone`) | Não | `telefone` | Opcional. |
| `situacao` (`st_credenciamento`, `status`, `credenciamento_pfpb_ativo`) | Não | `atributos_operacionais.credenciamento_pfpb_ativo` | Booleano (`ATIVA`, `SIM`, `TRUE` -> `true`). |
| `lat` / `lng` (`latitude` / `longitude`, `nu_latitude` / `nu_longitude`) | Não | `coordenadas` | Se ausente, fora da `GEO_BBOX` ou igual ao centro placeholder `CUIABA_VG_CENTER`, grava `sem_localizacao: true` e `auditado_manualmente: false` (nunca exibe pino falso no mapa). Se o estabelecimento já existir com `auditado_manualmente: true`, preserva as coordenadas auditadas. |

---

### 3.5. `fontes/unidades.csv` — Unidades Públicas Municipais (SMS Cuiabá: UBS, Policlínicas e UPAs)

Consumido por `scripts/import-unidades.ts --input <caminho>`.

| Coluna esperada (ou alias aceito) | Obrigatória | Destino em `EstabelecimentoSaude` | Regra de Transformação |
|---|---|---|---|
| `id` (`cnes`, `codigo_cnes`, `id_unidade`) | Sim | `id` | Identificador estável (ex.: `cnes-1234567` ou slug normalizado). |
| `nome_fantasia` (`nome`, `unidade`, `no_fantasia`) | Sim | `nome_fantasia` | Nome oficial da unidade pública. |
| `tipo` (`tipo_unidade`) | Sim | `tipo` | `'UBS'`, `'POLICLINICA'` ou `'UPA'`. |
| `bairro` (`no_bairro`) | Sim | `bairro` | Texto limpo (`trim`). |
| `endereco_completo` (`endereco`, `logradouro`) | Sim | `endereco_completo` | Texto limpo (`trim`). |
| `telefone` (`fone`, `nu_telefone`) | Não | `telefone` | Opcional. |
| `dispensa_psicotropicos_sus` (`psicotropicos`, `portaria_344`, `controlados`) | Não | `atributos_operacionais.dispensa_psicotropicos_sus` | Booleano (`sim`, `true`, `1` -> `true`). |
| `polo_vacinacao_municipal` (`vacinacao`, `polo_vacina`) | Não | `atributos_operacionais.polo_vacinacao_municipal` | Booleano. |
| `status_funcionamento` (`status`) | Não | `atributos_operacionais.status_funcionamento` | `'NORMAL'` (padrão), `'CONTINGENCIA_PARCIAL'` ou `'INTERDITADO'`. |
| `mensagem_contingencia` (`contingencia`, `observacao`) | Não | `atributos_operacionais.mensagem_contingencia` | Opcional. |
| `lat` / `lng` (`latitude` / `longitude`) | Não | `coordenadas` | Preserva coordenadas já auditadas (`auditado_manualmente: true`). Sem coordenada válida na fonte, marca `sem_localizacao: true`. |
