# Pasta de Fontes Oficiais (`fontes/`) — Onde Pego

Coloque nesta pasta os arquivos CSV baixados ou extraídos das publicações públicas oficiais antes de executar os scripts de importação em `scripts/`.

## Arquivos esperados

| Arquivo | Origem Oficial | Destino no Build | Comando de Importação |
|---|---|---|---|
| `remume.csv` | Relação Municipal de Medicamentos Essenciais (REMUME — SMS Cuiabá) | `data/medicamentos.json` | `npm run import:medicamentos -- --write` |
| `elenco.csv` | Elenco Nacional do Programa Farmácia Popular do Brasil (Ministério da Saúde) | `data/medicamentos.json` | `npm run import:medicamentos -- --write` |
| `sinonimos.csv` | Curadoria farmacêutica de nomes comerciais e termos populares por princípio ativo | `data/medicamentos.json` | `npm run import:medicamentos -- --write` |
| `infoms.csv` | Painel de Endereços de Farmácias Credenciadas (InfoMS / SEIDIGI / MS) | `data/estabelecimentos.json` | `npm run import:infoms -- --input fontes/infoms.csv --write` |
| `unidades.csv` | Rede Física Municipal de Saúde (UBS, Policlínicas e UPAs — SMS Cuiabá) | `data/estabelecimentos.json` | `npm run import:unidades -- --input fontes/unidades.csv --write` |

## Regras de Segurança e Auditoria

1. **Modo seguro por padrão (`--dry-run`):** todos os importadores rodam em modo de simulação por padrão e só gravam em `data/*.json` quando a flag `--write` é passada explicitamente.
2. **Coordenadas nunca inventadas:** registros sem `lat`/`lng` na fonte oficial recebem `sem_localizacao: true` e `auditado_manualmente: false`.
3. **Auditoria humana de coordenadas:**
   - Liste pendentes com `npm run audit:coords`.
   - Após conferir no mapa, marque como auditados com `npm run mark:audited -- --ids <id1,id2>`.
4. **Contrato completo de colunas:** consulte `docs/data-import-report.md`.
