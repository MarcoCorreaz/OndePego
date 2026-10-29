---
name: ui-ux-produto-premium
description: Aplica direção de arte e UI/UX Design Sênior (nível Apple Health / Linear) ao criar ou editar páginas, componentes visuais, estados vazios, microinterações e layouts.
---

# UI/UX de Produto Premium e Alta Legibilidade — Onde Pego

## Goal

Garantir que toda página e componente do **Onde Pego** combine acabamento visual de primeira linha (inspirado em Apple Health, Linear e sinalização cívica moderna) com legibilidade extrema sob sol forte para idosos e pessoas com baixa visão em Cuiabá/MT.

## Instructions

1. **Hierarquia Escaneável em 3 Segundos:**
   - Um cidadão ansioso com uma receita na mão deve identificar em até 3 segundos:
     1. **Qual é o medicamento:** Princípio ativo em destaque (`Barlow Semi Condensed`), dosagem selecionada e selo claro de **Resultado exato** ou **Resultado aproximado**.
     2. **Onde retirar (Via 1 vs. Via 2):** Comparativo imediato entre **Posto de Saúde (SUS Cuiabá / REMUME)** e **Farmácia Popular (drogarias credenciadas)**.
     3. **O que levar e para onde ir:** Checklist numerado de documentos/receita e lista/mapa de locais próximos.

2. **Os 5 Estados Obrigatórios de Todo Componente Interativo:**
   - **Padrão (Default):** Superfície limpa (`--c-surface: #FFFFFF` sobre `--c-bg: #F7F4EE`), borda sutil de `1px` (`--c-border`) e sombra multicamada suave (`--shadow-card` / `--shadow-elevated`).
   - **Hover / Focus:** Anel de foco `:focus-visible` nítido (`3px solid var(--c-brand)`) e expansão magnética de sombra no campo de busca (`.ui-search-shell:focus-within`).
   - **Active / Pressed:** Resposta tátil imediata (`active:translate-y-px`) e indicador deslizante suave (`layoutId` via `LazyMotion` + `m`) em abas e seletores de dosagem.
   - **Loading / Checando:** Feedback textual claro e acessível (`role="status"`, `aria-live="polite"`) sem travar a tela.
   - **Vazio / Erro Orientativo:** Mensagem acolhedora que explica o que houve e oferece ação imediata (ex.: limpar filtros, escolher bairro sem GPS ou conferir o princípio ativo na caixa).

3. **Superfícies, Contraste e Iconografia:**
   - No **tema padrão**, usar superfícies iluminadas (`#F7F4EE` no fundo geral e `#FFFFFF` nos cartões elevados), bordas de `1px` refinadas e contraste **AAA** no texto principal (`#1F2933`).
   - No **modo Alto Contraste (`html[data-contrast="high"]`)**, converter automaticamente todas as bordas para `2px solid #000000` sobre branco puro e remover sombras e `backdrop-filter`.
   - Utilizar exclusivamente **ícones vetoriais SVG inline** (`src/components/ui/Icons.tsx`) com `aria-hidden="true"` e `strokeWidth={2}`, evitando emojis ou símbolos de texto soltos na interface visual.

## Examples

### Exemplo 1: Seletor de dosagem com pílula deslizante (`layoutId`) e alvo $\ge 48\text{px}$

```tsx
<button
  type="button"
  aria-pressed={selected}
  onClick={() => onSelect(ap.id_apresentacao)}
  className="relative z-10 inline-flex min-h-[48px] items-center gap-2 rounded-[var(--r-chip)] border px-4 py-2 text-base font-bold"
>
  {selected && (
    <m.span
      layoutId={`dosage-pill-${slug}`}
      aria-hidden="true"
      className="absolute inset-0 -z-10 rounded-[var(--r-chip)] bg-[var(--c-brand)]"
    />
  )}
  <RadioDotIcon checked={selected} className="h-4 w-4" />
  <span>{ap.descricao_dosagem}</span>
</button>
```

### Exemplo 2: Cartão com hierarquia clara entre cabeçalho, corpo e rodapé da fonte

```tsx
<section className="ui-card-elevated flex flex-col justify-between overflow-hidden">
  <div className="bg-[var(--c-brand)] px-5 py-3.5 text-white">...</div>
  <div className="space-y-4 p-5 sm:p-6">...</div>
  <footer className="border-t border-[var(--c-border-subtle)] bg-[var(--c-bg-soft)]/70 px-5 py-3 text-base text-[var(--c-text-2)]">
    Fonte: REMUME Cuiabá • Atualização verificada em {dataFormatada}
  </footer>
</section>
```

## Constraints

- **Proibido** alterar qualquer texto normativo literal de `src/lib/healthCopy.ts` por motivos estéticos.
- **Proibido** transmitir qualquer informação de status apenas por cor (sempre combinar cor + ícone SVG + texto explícito).
- **Proibido** criar botões, links, abas ou chips com área de toque inferior a `48x48px` ou fonte base inferior a `18px` (apoio mínimo `16px`).
- **Proibido** executar animações quando `prefers-reduced-motion: reduce` ou `html[data-reduce-motion="true"]` estiver ativo.
