# Pasta de Fontes Oficiais (`fontes/`) — Onde Pego

Esta pasta armazena as planilhas e arquivos CSV das fontes públicas oficiais de dados abertos que alimentam o catálogo de medicamentos e a rede física de atendimento em Cuiabá/MT.

---

## 1. Mapeamento de Fontes Oficiais e URLs Exatas

| Arquivo | Origem Oficial / Órgão | URL Oficial Verificada | Base Legal / Portaria |
|---|---|---|---|
| **`elenco.csv`** | Ministério da Saúde (MS / SECTICS) — Programa Farmácia Popular do Brasil | [gov.br/saude/pt-br/composicao/sectics/farmacia-popular](https://www.gov.br/saude/pt-br/composicao/sectics/farmacia-popular) | Portaria GM/MS nº 675/2024 e Anexo LXXVII da Portaria de Consolidação GM/MS nº 5/2017 |
| **`remume.csv`** | Secretaria Municipal de Saúde de Cuiabá (SMS Cuiabá) / CFTP | [gazetamunicipal.cuiaba.mt.gov.br](https://gazetamunicipal.cuiaba.mt.gov.br/) e [cuiaba.mt.gov.br/saude](https://www.cuiaba.mt.gov.br/saude/) | Portaria nº 41/SMS/Cuiabá e edições suplementares da Gazeta Municipal de Cuiabá |
| **`unidades.csv`** | Prefeitura Municipal de Cuiabá / CNES DataSUS | [cuiaba.mt.gov.br/saude](https://www.cuiaba.mt.gov.br/saude/) e [cnes.datasus.gov.br](https://cnes.datasus.gov.br/) | Cadastro Nacional de Estabelecimentos de Saúde (CNES/MS) e Rede Física Municipal |
| **`sinonimos.csv`** | Agência Nacional de Vigilância Sanitária (ANVISA) | [consultas.anvisa.gov.br/#/medicamentos](https://consultas.anvisa.gov.br/#/medicamentos/) | Registro Sanitário de Medicamentos e Denominações Comuns Brasileiras (DCB) |
| **`infoms.csv`** | Ministério da Saúde / SEIDIGI (Painel InfoMS) | [infoms.saude.gov.br](https://infoms.saude.gov.br/) | Painel Público de Estabelecimentos Credenciados ao Farmácia Popular |

---

## 2. Comandos de Importação

Os importadores operam com trava de segurança: por padrão rodam em modo de simulação (`--dry-run`). Para gravar em `data/*.json`, passe a flag `--write`.

```bash
# 1. Importar e mesclar catálogo de medicamentos (REMUME x Elenco PFPB x Sinônimos)
npm run import:medicamentos -- --dry-run
npm run import:medicamentos -- --write

# 2. Importar unidades públicas municipais (UPAs, Policlínicas e Centros de Saúde/UBS)
npm run import:unidades -- --dry-run
npm run import:unidades -- --write

# 3. Importar farmácias privadas credenciadas baixadas do InfoMS
npm run import:infoms -- --input fontes/infoms.csv --dry-run
npm run import:infoms -- --input fontes/infoms.csv --write
```

---

## 3. Diretrizes de Auditoria e Integridade

1. **Nenhum Dado Inventado:** Todo item inserido deve corresponder a princípio ativo padronizado ou estabelecimento real com endereço verificado.
2. **Coordenadas Geográficas:** Registros sem coordenadas oficiais recebem `sem_localizacao: true` e `auditado_manualmente: false`. Coordenadas auditadas manualmente nunca são sobrescritas automaticamente.
3. **Contrato de Schemas:** A documentação completa dos campos e regras de validação Zod está registrada em `docs/data-import-report.md`.
