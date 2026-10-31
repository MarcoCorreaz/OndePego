---
name: sincronizacao-multi-agente
description: Sincronização e coordenação de estado entre múltiplas abas e sessões do Antigravity operando no mesmo repositório. Use SEMPRE no início e no final de qualquer tarefa para ler e atualizar .agents/session-state.json, verificar git status e fs.existsSync, prevenindo conflitos e sobrescrita de arquivos já gerados por outra sessão.
---

# Sincronização Multi-Agente (Sessões Concorrentes)

## 1. Princípio Fundamental

Quando o usuário opera múltiplas abas ou janelas do Antigravity no mesmo workspace, agentes simultâneos podem atuar em paralelo. Para evitar sobrescrever artefatos já gerados (como recortes de mapa `.pmtiles`, planilhas em `fontes/` ou dados validados em `data/`):

1. **Leitura Obrigatória na Inicialização:** Sempre confira o arquivo `.agents/session-state.json` e o `git status --short` antes de iniciar uma tarefa demorada ou de gerar artefatos.
2. **Verificação de Existência Real (`fs.existsSync`):** Nunca assuma que um arquivo não existe apenas com base na memória de contexto da conversa. Se o arquivo já estiver íntegro no disco, reutilize-o e preserve seu conteúdo.
3. **Atualização ao Finalizar:** Registre os artefatos gerados, status da compilação e flags de estado em `.agents/session-state.json`.

---

## 2. Estrutura de `.agents/session-state.json`

O arquivo `.agents/session-state.json` atua como o quadro-negro compartilhado entre abas:

```json
{
  "versao_protocolo": 1,
  "ultima_atualizacao": "AAAA-MM-DDTHH:mm:ssZ",
  "artefatos_prontos": {
    "tiles_pmtiles": true,
    "fontes_elenco": true,
    "fontes_remume": true,
    "fontes_unidades": true,
    "fontes_sinonimos": true,
    "fontes_infoms": true
  },
  "caminhos_verificados": {
    "public/tiles/cuiaba-vg.pmtiles": { "status": "PRONTO", "tamanho_bytes": 5205429 },
    "fontes/elenco.csv": { "status": "PRONTO" },
    "fontes/remume.csv": { "status": "PRONTO" },
    "fontes/unidades.csv": { "status": "PRONTO" },
    "fontes/sinonimos.csv": { "status": "PRONTO" }
  },
  "lock_em_progresso": null
}
```

---

## 3. Protocolo de Ação para o Agente

1. **Antes de gerar qualquer arquivo pesado ou de lote:**
   - Execute `Test-Path <caminho>` ou `node -e "console.log(fs.existsSync('<caminho>'))"`.
   - Se o arquivo já existir com tamanho válido, não execute novamente o download ou geração pesada.
2. **Preservação de Dados Manuais e Fontes:**
   - Nunca apague arquivos em `fontes/` que já estejam prontos (`elenco.csv`, `remume.csv`, `unidades.csv`, `sinonimos.csv`).
3. **Ao Concluir a Tarefa:**
   - Atualize `.agents/session-state.json` com timestamp ISO atual e o status de cada artefato gerado.
