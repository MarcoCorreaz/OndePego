---
name: qa-usuario-real
description: Executa testes e auditorias simulando o comportamento real de usuários finais (idosos, baixa visão, erros de digitação, sem GPS, 4G instável e navegação por teclado/leitor de tela).
---

# QA de Jornada do Usuário Real — Onde Pego

## Goal

Garantir que o **Onde Pego** seja validado não apenas por testes unitários isolados, mas por jornadas ponta a ponta que simulam o comportamento real dos moradores de Cuiabá/MT em condições adversas (baixa visão, erros ortográficos ao copiar receitas médicas, GPS negado, medicamentos controlados da Portaria 344, navegação móvel com botão Voltar e links compartilhados via WhatsApp/offline).

## Instructions

Sempre que criar ou alterar funcionalidades de busca, detalhe de medicamento, filtros de estabelecimentos, geolocalização, sessão ou acessibilidade, execute e mantenha verde a suíte de **5 Personas Reais de Teste** (`tests/userJourneys.test.ts`):

1. **Persona 1 — Idoso com receita manuscrita e baixa visão:**
   - Ativa escala de fonte `xlarge` (`24px`) e `highContrast: true` nas preferências de acessibilidade (`src/lib/prefs.ts`), aplicando os atributos no elemento raiz (`data-font-scale="xlarge"`, `data-contrast="high"`).
   - Digita o nome do remédio com erro ortográfico, sem acento/cedilha ou com dosagem acoplada (ex.: `"metiformina 850"`, `"losartna"`, `"acucar"`).
   - O motor de busca retorna os candidatos sem nunca autosselecionar um resultado aproximado (`exato: false` exibe obrigatoriamente o aviso de resultado aproximado).
   - Ao selecionar a dosagem da receita, lê os textos normativos literais da Via 1 e da Via 2 e a lista `"O que levar"`.

2. **Persona 2 — Trabalhador sem GPS / Permissão negada:**
   - Nega ou não possui permissão de GPS (`userCoords = null`).
   - Filtra farmácias credenciadas e unidades manualmente pelo seletor de bairro (`ordenarEstabelecimentosPorBairro` / `ordenarListaComOuSemDistancia`).
   - Vê estabelecimentos sem coordenada válida (`sem_localizacao: true` ou coordenada placeholder) listados ao final com o endereço completo e o aviso `"Localização no mapa indisponível. Use o endereço."`, **sem botão `"Ver rota"` falso**, enquanto os estabelecimentos com coordenada válida exibem o link de rota.

3. **Persona 3 — Caso Clínico de Medicamento Controlado (Portaria 344):**
   - Busca um medicamento controlado padronizado na REMUME (`local_dispensacao_sus: "POLICLINICA_PORTARIA344"`).
   - Recebe na Via 1 o alerta obrigatório de receita de controle especial (`NORMATIVE_TEXTS.via1.CONTROLADO_ADICIONAL`) e vê na aba de unidades públicas do SUS (`getPublicUnitsForMedication`) exclusivamente as unidades com `dispensa_psicotropicos_sus: true` (nunca retornando `FARMACIA_POPULAR` nem `CDMIC`).

4. **Persona 4 — Navegação Mobile "Ir e Voltar" (Privacidade de URL ADR-09):**
   - Pesquisa na Home (`/`), visualiza a lista em `/buscar/` (a URL nunca recebe `?q=`), clica em um medicamento (`/medicamento/[slug]/`) salvando `query` e `scrollY` em `sessionStorage` (`src/lib/searchSession.ts`).
   - Ao tocar em `"Voltar para os resultados da busca"`, recupera exatamente o termo pesquisado, os resultados e a posição de rolagem (`scrollY`), mantendo o selo determinístico (`exato` ou `aproximado`).

5. **Persona 5 — Link Compartilhado no WhatsApp e Uso Offline:**
   - Abre `/medicamento/[slug]/` diretamente a partir de um link externo compartilhado no WhatsApp (`gerarDadosCompartilhamentoMedicamento`), com a sessão de busca vazia.
   - O estado de correspondência resolve para `'desconhecido'` (`resolveMatchState([], slug)`), garantindo que **nenhum selo falso de `"Resultado exato"`** seja exibido no topo da página.
   - Mesmo com dados antigos ou offline, a faixa de atualização (`getFreshness`) e o manifesto de pré-cache (`generatePrecacheManifestPayload`) garantem acesso à rota `/medicamento/[slug]/`.

## Examples

### Exemplo de teste integrado de Persona em `tests/userJourneys.test.ts`

```ts
const engine = createMedicationSearchEngine(catalogo);
const resultados = engine.search('losartna');
expect(resultados.length).toBeGreaterThan(0);
expect(resultados[0]!.exato).toBe(false);
expect(resolveMatchState(resultados, resultados[0]!.item.slug)).toBe('aproximado');
```

## Constraints

- **Proibido** testar apenas o "caminho feliz" com grafia perfeita e GPS ativo.
- **Proibido** usar dados médicos reais inventados em testes: todas as fixtures de jornada devem carregar `__fixture: true`.
- **Proibido** aceitar que estabelecimentos com `sem_localizacao: true` ou coordenada igual a `CUIABA_VG_CENTER` renderizem botão `"Ver rota"` ou entrem no cálculo Haversine.
