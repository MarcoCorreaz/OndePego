# Tokens v1 (Estética Limpa e Iluminada — Alto Contraste AAA)

## Cores e Superfícies (Tema Padrão Claro)

| Nome | Variável | Valor | Papel |
|---|---|---|---|
| Papel quente | `--c-bg` | `#F7F4EE` | Fundo geral da página (reduz ofuscamento sob sol forte) |
| Papel suave | `--c-bg-soft` | `#EFEAE0` | Superfície secundária, agrupadores, barras de controle e rodapés de card |
| Superfície pura | `--c-surface` | `#FFFFFF` | Cartões elevados, placas Via 1/Via 2, campo de busca e barra de navegação |
| Superfície hover | `--c-surface-2` | `#F5F2EB` | Estado de hover/apoio sutil em botões e itens secundários |
| Asfalto (AAA) | `--c-text` | `#1F2933` | Texto principal (contraste 14,76:1 sobre `#FFFFFF` e 13,4:1 sobre `#F7F4EE`) |
| Cinza poste | `--c-text-2` | `#4B5563` | Texto secundário (contraste 7,5:1 sobre `#FFFFFF` e 6,8:1 sobre `#F7F4EE`) |
| Azul institucional | `--c-brand` | `#0B3D91` | Marca, Via 1 (SUS Cuiabá), links e ações primárias |
| Tinta azul | `--c-brand-tint` | `#E8EEF8` | Fundo de badges e destaques azuis |
| Verde gratuito | `--c-free` | `#0E7C3A` | Via 2 (Farmácia Popular), selos de gratuidade e confirmação |
| Tinta verde | `--c-free-tint` | `#E6F4EA` | Fundo de badges e destaques de gratuidade |
| Verde tinta texto | `--c-free-ink` | `#0A5C2B` | Texto de badge sobre `--c-free-tint` (7.17:1 AAA) |
| Amarelo ipê | `--c-attn` | `#FFC72C` | Atenção, resultado aproximado e contingência (sempre com texto `#1F2933`) |
| Tinta âmbar | `--c-attn-tint` | `#FFF4D1` | Fundo suave de avisos e FreshnessBanner |
| Âmbar tinta texto | `--c-attn-ink` | `#7A5A00` | Ícone/texto sobre `--c-attn-tint` (5.81:1 AA) |
| Vermelho alerta | `--c-alert` | `#C62828` | Alerta crítico e interdição |
| Tinta alerta | `--c-alert-tint` | `#FDE7E7` | Fundo de badges de interdição e chip de pressão |
| Borda de cartão | `--c-border` | `rgba(31, 41, 51, 0.13)` | Borda refinada de 1px em cartões e containers no tema padrão |
| Borda sutil | `--c-border-subtle` | `rgba(31, 41, 51, 0.08)` | Divisórias internas de 1px |
| Borda forte | `--c-border-strong` | `rgba(31, 41, 51, 0.24)` | Contorno de inputs e controles interativos |

## Contrastes calculados (WCAG 2.2 AA / AAA)

| Par (texto / fundo) | Razão | Nível |
|---|---|---|
| Asfalto (`#1F2933`) / Superfície (`#FFFFFF`) | 14,76:1 | AAA |
| Asfalto (`#1F2933`) / Papel quente (`#F7F4EE`) | 13,40:1 | AAA |
| Asfalto (`#1F2933`) / Tinta âmbar (`#FFF4D1`) | 13,43:1 | AAA |
| Azul institucional (`#0B3D91`) / Tinta âmbar (`#FFF4D1`) | 9,14:1 | AAA |
| Cinza poste (`#4B5563`) / Superfície (`#FFFFFF`) | 7,56:1 | AAA |
| Cinza poste (`#4B5563`) / Papel quente (`#F7F4EE`) | 6,86:1 | AA+ |
| Azul institucional (`#0B3D91`) / Superfície (`#FFFFFF`) | 10,04:1 | AAA |
| Azul institucional (`#0B3D91`) / Tinta azul (`#E8EEF8`) | 8,62:1 | AAA |
| Verde gratuito (`#0E7C3A`) / Superfície (`#FFFFFF`) | 5,30:1 | AA |
| Verde gratuito (`#0E7C3A`) / Tinta verde (`#E6F4EA`) | 4,67:1 | AA |
| Verde tinta texto (`#0A5C2B`) / Tinta verde (`#E6F4EA`) | 7,17:1 | AAA |
| Asfalto (`#1F2933`) / Amarelo ipê (`#FFC72C`) | 9,46:1 | AAA |
| Âmbar tinta texto (`#7A5A00`) / Tinta âmbar (`#FFF4D1`) | 5,81:1 | AA |
| Vermelho alerta (`#C62828`) / Superfície (`#FFFFFF`) | 5,62:1 | AA |
| Vermelho alerta (`#C62828`) / Tinta alerta (`#FDE7E7`) | 4,75:1 | AA |

Texto branco sobre amarelo ipê **não** é permitido.

## Sombras e Elevação (Zeradas em `html[data-contrast="high"]`)

- `--shadow-card`: `0 1px 2px rgba(31, 41, 51, 0.04), 0 6px 16px -4px rgba(31, 41, 51, 0.06)`
- `--shadow-elevated`: `0 2px 4px -1px rgba(11, 61, 145, 0.05), 0 12px 28px -6px rgba(31, 41, 51, 0.09)`
- `--shadow-search-focus`: `0 0 0 4px rgba(11, 61, 145, 0.15), 0 14px 32px -6px rgba(11, 61, 145, 0.12)`
- `--shadow-dock`: `0 -4px 20px rgba(31, 41, 51, 0.06)`

## Modo Alto Contraste (`html[data-contrast="high"]`)

- Fundo `--c-bg` e `--c-surface` em `#FFFFFF` puro, texto `#000000`, bordas sólidas `#000000` de `2px` e todas as sombras/transparências desativadas (`none`).
