---
name: busca-dados-contratos
description: Contratos de dados (schemas Zod), arquivos JSON em data/, validação, fixtures e scripts de importação do Onde Pego. Use SEMPRE que criar ou alterar schemas, tipos de medicamento ou estabelecimento, data/medicamentos.json, data/estabelecimentos.json, data/meta.json, scripts de validação ou importação do CSV do InfoMS, ou ao inserir qualquer dado de medicamento, farmácia ou unidade de saúde.
---

# Onde Pego — Contratos de dados

O produto é estático: os JSON em `data/` **são** o banco de dados. Um erro nesses arquivos vira informação errada sobre saúde. Por isso a validação é rígida e o agente não inventa dado.

## Regras

1. **Zod é a fonte única.** Defina os schemas em `src/types/schema.ts` e derive os tipos com `z.infer`. Não escreva interfaces TypeScript paralelas. O esqueleto está em `references/schema.md`.
2. **Nunca invente dado real.** Medicamentos, dosagens, farmácias, endereços, telefones e coordenadas vêm de fonte oficial fornecida pelo responsável. Em testes, use fixtures com `__fixture: true` e nomes claramente falsos (ex.: `MEDICAMENTO_TESTE_A`).
3. **Fixtures não vão para produção.** O script de validação falha se houver `__fixture` quando a variável de ambiente de produção estiver ativa.
4. `id_dcb` e `codigo_atc` são **opcionais** no MVP. Não bloquear a validação por ausência desses códigos.
5. `ALERTA_ABASTECIMENTO` é **reservado**: o validador rejeita esse valor enquanto a flag de estoque estiver desligada.
6. **Coordenadas:** `lat` e `lng` ficam dentro da caixa geográfica de Cuiabá/Várzea Grande definida em `references/schema.md` (ajustar ao extrair o mapa) e carregam `auditado_manualmente`. Coordenada já auditada nunca é sobrescrita por importação automática.
7. **Datas** em formato ISO (`AAAA-MM-DD`). Cada fonte oficial tem sua data em `meta.json`.
8. **"Dado desatualizado"** é calculado em tempo de execução a partir de `meta.json` (função em `src/lib/freshness.ts`), não é campo de medicamento.
9. **Slugs e ids únicos.** O validador falha em duplicata.
10. Texto exibido ao usuário não mora nos JSON de medicamentos; vem da skill `busca-textos-saude`. Os JSON guardam estados e códigos.

## Arquivos em `data/`

| Arquivo | Conteúdo |
|---|---|
| `medicamentos.json` | REMUME vigente + 41 itens do Farmácia Popular + sinônimos (nomes comerciais e termos populares) |
| `estabelecimentos.json` | Farmácias credenciadas (InfoMS), UBS, policlínicas e UPAs, com coordenadas auditadas e flags operacionais |
| `meta.json` | Versão do conjunto, data de cada fonte, `ultima_verificacao_ci`, limite de dias para "desatualizado", flags de recurso |

## Scripts

- `scripts/validate-schemas.ts`: valida os três arquivos, confere unicidade e limites geográficos, rejeita fixtures em produção, sai com código 1 e mensagem legível. Exposto como `npm run validate`.
- `scripts/import-infoms-csv.ts`: lê o CSV baixado do painel InfoMS, mapeia colunas, preserva coordenadas já auditadas e marca novas como `auditado_manualmente: false` para revisão. Não geocodifica automaticamente sem revisão humana.

## Antes de dar a tarefa como pronta

- [ ] `npm run validate` passa com os dados reais e **falha** se um campo for quebrado de propósito.
- [ ] Testes cobrem schemas, unicidade, limites geográficos e frescor.
- [ ] Nenhum dado inventado; toda fixture marcada.
- [ ] A mudança de schema não quebrou a busca nem os componentes que o consomem (rodar `npm test` e `npm run build`).
- [ ] Você resumiu o que mudou em `data/` e de qual fonte cada dado veio.
