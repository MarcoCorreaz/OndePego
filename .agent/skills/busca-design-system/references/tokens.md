# Tokens v0 (proposta, validar no protótipo)

## Cores

| Nome | Variável | Hex | Papel |
|---|---|---|---|
| Branco sol | `--c-bg` | `#FFFFFF` | Fundo principal |
| Céu | `--c-bg-soft` | `#F3F6F9` | Áreas de apoio |
| Asfalto | `--c-text` | `#1F2933` | Texto principal |
| Cinza poste | `--c-text-2` | `#5B6770` | Texto secundário |
| Azul placa | `--c-brand` | `#0B3D91` | Marca, títulos, navegação |
| Verde grátis | `--c-free` | `#0E7C3A` | Gratuito (Farmácia Popular) |
| Amarelo ipê | `--c-attn` | `#FFC72C` | Atenção e destaque (texto escuro por cima) |
| Vermelho alerta | `--c-alert` | `#C62828` | Alerta e erro |
| Tinta azul | `--c-brand-tint` | `#E8EEF8` | Fundo de blocos azuis |
| Tinta verde | `--c-free-tint` | `#E6F4EA` | Fundo de blocos "gratuito" |

## Contrastes calculados (WCAG)

| Par (texto / fundo) | Razão |
|---|---|
| Asfalto / Branco | 14,76 |
| Asfalto / Céu | 13,60 |
| Azul placa / Branco (e inverso) | 10,04 |
| Verde grátis / Branco (e inverso) | 5,30 |
| Asfalto / Amarelo ipê | 9,46 |
| Vermelho alerta / Branco (e inverso) | 5,62 |
| Cinza poste / Branco | 5,80 |
| Verde grátis / Tinta verde | 4,67 |
| Azul placa / Tinta azul | 8,62 |

Texto branco sobre amarelo ipê **não** é permitido. Cor nova só entra depois de calcular o contraste e registrar aqui.

## Tema escuro

Não é prioridade do MVP. Se for feito, o tema claro continua sendo o padrão e o escuro precisa de nova tabela de contrastes.

## Tipografia

| Papel | Família | Pesos | Tamanho |
|---|---|---|---|
| Título de tela | Barlow Semi Condensed | 700 | 32 a 40px |
| Título de placa | Barlow Semi Condensed | 700 a 800 | 24 a 28px |
| Corpo | Atkinson Hyperlegible | 400, 700 | 18px |
| Apoio (datas, fonte) | Atkinson Hyperlegible | 400 | 16px (mínimo) |

## Espaço e forma

- Base de espaçamento: 4px; passos de 8, 12, 16, 24, 32.
- Alvo de toque mínimo: 48px de altura e largura.
- Raios: placa 8px; campo de busca 14px; chip totalmente arredondado; botão 10px.
- Bordas: 2px sólidas nas placas; sem sombra decorativa.

## Variáveis CSS (esqueleto)

```css
:root {
  --c-bg: #FFFFFF;
  --c-bg-soft: #F3F6F9;
  --c-text: #1F2933;
  --c-text-2: #5B6770;
  --c-brand: #0B3D91;
  --c-brand-tint: #E8EEF8;
  --c-free: #0E7C3A;
  --c-free-tint: #E6F4EA;
  --c-attn: #FFC72C;
  --c-alert: #C62828;
  --fs-base: 18px;
}
```

O controle de tamanho de fonte do painel de acessibilidade altera `--fs-base`; o alto contraste troca por um conjunto de variáveis com razões ≥ 7:1.
